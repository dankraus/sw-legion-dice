import type { DieColor, DieFaces, SurgeConversion, AttackPool, AttackResults, CriticalX } from '../types';

export const DICE: Record<DieColor, DieFaces> = {
  red:   { crit: 1, surge: 1, hit: 5, blank: 1 },
  black: { crit: 1, surge: 1, hit: 3, blank: 3 },
  white: { crit: 1, surge: 1, hit: 1, blank: 5 },
};

const SIDES = 8;

/** Raw per-face probabilities (no surge conversion). */
function getRawProbabilities(color: DieColor): { crit: number; surge: number; hit: number; blank: number } {
  const d = DICE[color];
  return {
    crit: d.crit / SIDES,
    surge: d.surge / SIDES,
    hit: d.hit / SIDES,
    blank: d.blank / SIDES,
  };
}

export interface EffectiveProbabilities {
  crit: number;
  hit: number;
  blank: number;
}

/** Effective per-die probabilities with surge folded in (used for tests / when no Critical X). */
export function getEffectiveProbabilities(
  color: DieColor,
  surge: SurgeConversion
): EffectiveProbabilities {
  const die = DICE[color];
  let crit = die.crit;
  let hit = die.hit;
  let blank = die.blank;

  if (surge === 'crit') {
    crit += die.surge;
  } else if (surge === 'hit') {
    hit += die.surge;
  } else {
    blank += die.surge;
  }

  return {
    crit: crit / SIDES,
    hit: hit / SIDES,
    blank: blank / SIDES,
  };
}

/** Convolve one die's (c,s,h,b) distribution into the pool distribution. */
function convolveOneDie(
  current: Map<string, number>,
  probs: { crit: number; surge: number; hit: number; blank: number }
): Map<string, number> {
  const next = new Map<string, number>();
  const key = (c: number, s: number, h: number, b: number) => `${c},${s},${h},${b}`;

  for (const [k, p] of current) {
    if (p === 0) continue;
    const [c, s, h, b] = k.split(',').map(Number);
    const k1 = key(c + 1, s, h, b);
    next.set(k1, (next.get(k1) ?? 0) + p * probs.crit);
    const k2 = key(c, s + 1, h, b);
    next.set(k2, (next.get(k2) ?? 0) + p * probs.surge);
    const k3 = key(c, s, h + 1, b);
    next.set(k3, (next.get(k3) ?? 0) + p * probs.hit);
    const k4 = key(c, s, h, b + 1);
    next.set(k4, (next.get(k4) ?? 0) + p * probs.blank);
  }
  return next;
}

/** Resolve (c,s,h,b) with Critical X then Surge Conversion (and Surge Tokens when surge is none) → (hitsFinal, critsFinal). */
function resolve(
  c: number,
  s: number,
  h: number,
  _b: number,
  criticalX: number,
  surge: SurgeConversion,
  surgeTokens: number
): { hits: number; crits: number } {
  const toCrit = Math.min(criticalX, s);
  const surgesRemaining = s - toCrit;
  let crits = c + toCrit;
  let hits = h;
  if (surge === 'crit') {
    crits += surgesRemaining;
  } else if (surge === 'hit') {
    hits += surgesRemaining;
  } else {
    hits += Math.min(surgeTokens, surgesRemaining);
  }
  return { hits, crits };
}

function normalizeCriticalX(x: CriticalX): number {
  if (x === undefined || x === null) return 0;
  const n = Number(x);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

function normalizeSurgeTokens(t?: number): number {
  if (t === undefined || t === null) return 0;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

function normalizeTokenCount(t?: number): number {
  if (t === undefined || t === null) return 0;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

/** Pool-average effective (crit, hit) per die after surge conversion; used for blank-reroll expectation. */
function getPoolAverageEffectiveHitCrit(
  pool: AttackPool,
  surge: SurgeConversion
): { crit: number; hit: number } {
  const total = pool.red + pool.black + pool.white;
  if (total === 0) return { crit: 0, hit: 0 };
  let crit = 0;
  let hit = 0;
  const colors: DieColor[] = ['red', 'black', 'white'];
  for (const color of colors) {
    const n = pool[color];
    if (n === 0) continue;
    const eff = getEffectiveProbabilities(color, surge);
    crit += n * eff.crit;
    hit += n * eff.hit;
  }
  return { crit: crit / total, hit: hit / total };
}

export function calculateAttackPool(
  pool: AttackPool,
  surge: SurgeConversion,
  criticalX?: CriticalX,
  surgeTokens?: number,
  aimTokens?: number,
  observeTokens?: number
): AttackResults {
  const x = normalizeCriticalX(criticalX);
  const tokens = normalizeSurgeTokens(surgeTokens);
  const aim = normalizeTokenCount(aimTokens);
  const observe = normalizeTokenCount(observeTokens);
  const rerollCapacity = aim * 2 + observe;
  const avgPerReroll = getPoolAverageEffectiveHitCrit(pool, surge);

  const dieColors: DieColor[] = ['red', 'black', 'white'];

  // Build full (c,s,h,b) distribution via convolution
  let cshb = new Map<string, number>();
  cshb.set('0,0,0,0', 1);

  for (const color of dieColors) {
    const count = pool[color];
    const probs = getRawProbabilities(color);
    for (let i = 0; i < count; i++) {
      cshb = convolveOneDie(cshb, probs);
    }
  }

  // Resolve each outcome and aggregate (including blank rerolls from Aim/Observe)
  let expectedHits = 0;
  let expectedCrits = 0;
  const totalProbByTotal: Record<number, number> = {};

  for (const [k, prob] of cshb) {
    if (prob === 0) continue;
    const [c, s, h, b] = k.split(',').map(Number);
    const { hits, crits } = resolve(c, s, h, b, x, surge, tokens);
    const nReroll = Math.min(rerollCapacity, b);
    const hitsFinal = hits + nReroll * avgPerReroll.hit;
    const critsFinal = crits + nReroll * avgPerReroll.crit;
    expectedHits += prob * hitsFinal;
    expectedCrits += prob * critsFinal;
    const totalRounded = Math.round(hitsFinal + critsFinal);
    totalProbByTotal[totalRounded] = (totalProbByTotal[totalRounded] ?? 0) + prob;
  }

  const maxTotal = Math.max(...Object.keys(totalProbByTotal).map(Number), 0);
  const distribution = Array.from({ length: maxTotal + 1 }, (_, total) => ({
    total,
    probability: totalProbByTotal[total] ?? 0,
  }));

  const cumulative: { total: number; probability: number }[] = [];
  let cumSum = 1;
  for (let i = 0; i <= maxTotal; i++) {
    cumulative.push({ total: i, probability: cumSum });
    cumSum -= totalProbByTotal[i] ?? 0;
  }

  return {
    expectedHits,
    expectedCrits,
    expectedTotal: expectedHits + expectedCrits,
    distribution,
    cumulative,
  };
}
