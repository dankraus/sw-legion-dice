import type {
  DieColor,
  DieFaces,
  SurgeConversion,
  AttackPool,
  AttackResults,
  CriticalX,
  DefenseDieColor,
  DefenseSurgeConversion,
  DefensePool,
  DefenseResults,
  WoundsResults,
} from '../types';

export const DICE: Record<DieColor, DieFaces> = {
  red:   { crit: 1, surge: 1, hit: 5, blank: 1 },
  black: { crit: 1, surge: 1, hit: 3, blank: 3 },
  white: { crit: 1, surge: 1, hit: 1, blank: 5 },
};

const SIDES = 8;

export interface DefenseDieFaces {
  block: number;
  surge: number;
  blank: number;
}

export const DEFENSE_DICE: Record<DefenseDieColor, DefenseDieFaces> = {
  red:   { block: 3, surge: 1, blank: 2 },
  white: { block: 1, surge: 1, blank: 4 },
};

const DEFENSE_SIDES = 6;

/** Raw per-face probabilities (no surge conversion). */
function getRawProbabilities(color: DieColor): { crit: number; surge: number; hit: number; blank: number } {
  const die = DICE[color];
  return {
    crit: die.crit / SIDES,
    surge: die.surge / SIDES,
    hit: die.hit / SIDES,
    blank: die.blank / SIDES,
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

/** Convolve one die's (crit, surge, hit, blank) distribution into the pool distribution. */
function convolveOneDie(
  current: Map<string, number>,
  probs: { crit: number; surge: number; hit: number; blank: number }
): Map<string, number> {
  const next = new Map<string, number>();
  const toKey = (crit: number, surge: number, hit: number, blank: number) =>
    `${crit},${surge},${hit},${blank}`;

  for (const [key, prob] of current) {
    if (prob === 0) continue;
    const [crit, surge, hit, blank] = key.split(',').map(Number);

    const critKey = toKey(crit + 1, surge, hit, blank);
    next.set(critKey, (next.get(critKey) ?? 0) + prob * probs.crit);

    const surgeKey = toKey(crit, surge + 1, hit, blank);
    next.set(surgeKey, (next.get(surgeKey) ?? 0) + prob * probs.surge);

    const hitKey = toKey(crit, surge, hit + 1, blank);
    next.set(hitKey, (next.get(hitKey) ?? 0) + prob * probs.hit);

    const blankKey = toKey(crit, surge, hit, blank + 1);
    next.set(blankKey, (next.get(blankKey) ?? 0) + prob * probs.blank);
  }
  return next;
}

/** Resolve (crit, surge, hit, blank) with Critical X then Surge Conversion (and Surge Tokens when surge is none) → (hitsFinal, critsFinal). */
function resolve(
  crits: number,
  surges: number,
  hits: number,
  _blanks: number,
  criticalX: number,
  surge: SurgeConversion,
  surgeTokens: number
): { hits: number; crits: number } {
  const surgesToCrit = Math.min(criticalX, surges);
  const surgesRemaining = surges - surgesToCrit;
  let resolvedCrits = crits + surgesToCrit;
  let resolvedHits = hits;
  if (surge === 'crit') {
    resolvedCrits += surgesRemaining;
  } else if (surge === 'hit') {
    resolvedHits += surgesRemaining;
  } else {
    resolvedHits += Math.min(surgeTokens, surgesRemaining);
  }
  return { hits: resolvedHits, crits: resolvedCrits };
}

function normalizeCriticalX(value: CriticalX): number {
  if (value === undefined || value === null) return 0;
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.floor(num);
}

function normalizeSurgeTokens(value?: number): number {
  if (value === undefined || value === null) return 0;
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.floor(num);
}

function normalizeTokenCount(value?: number): number {
  if (value === undefined || value === null) return 0;
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.floor(num);
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
    const count = pool[color];
    if (count === 0) continue;
    const eff = getEffectiveProbabilities(color, surge);
    crit += count * eff.crit;
    hit += count * eff.hit;
  }
  return { crit: crit / total, hit: hit / total };
}

export function calculateAttackPool(
  pool: AttackPool,
  surge: SurgeConversion,
  criticalX?: CriticalX,
  surgeTokens?: number,
  aimTokens?: number,
  observeTokens?: number,
  precise?: number,
  ramX?: number
): AttackResults {
  const normalizedCriticalX = normalizeCriticalX(criticalX);
  const normalizedSurgeTokens = normalizeSurgeTokens(surgeTokens);
  const aim = normalizeTokenCount(aimTokens);
  const observe = normalizeTokenCount(observeTokens);
  const preciseVal = aim > 0 ? Math.max(0, Math.floor(precise ?? 0) || 0) : 0;
  const rerollCapacity = aim * (2 + preciseVal) + observe;
  const ram = normalizeTokenCount(ramX);
  const avgPerReroll = getPoolAverageEffectiveHitCrit(pool, surge);

  const dieColors: DieColor[] = ['red', 'black', 'white'];

  let distribution = new Map<string, number>();
  distribution.set('0,0,0,0', 1);

  for (const color of dieColors) {
    const count = pool[color];
    const probs = getRawProbabilities(color);
    for (let i = 0; i < count; i++) {
      distribution = convolveOneDie(distribution, probs);
    }
  }

  let expectedHits = 0;
  let expectedCrits = 0;
  const totalProbByTotal: Record<number, number> = {};
  const totalProbByHitsCrits = new Map<string, number>();

  for (const [key, prob] of distribution) {
    if (prob === 0) continue;
    const [crits, surges, hits, blanks] = key.split(',').map(Number);
    const resolved = resolve(crits, surges, hits, blanks, normalizedCriticalX, surge, normalizedSurgeTokens);
    const rerolls = Math.min(rerollCapacity, blanks);
    let hitsFinal = resolved.hits + rerolls * avgPerReroll.hit;
    let critsFinal = resolved.crits + rerolls * avgPerReroll.crit;

    if (ram > 0) {
      const blanksRemaining = blanks - rerolls;
      const blanksConverted = Math.min(ram, blanksRemaining);
      critsFinal += blanksConverted;
      const ramLeft = ram - blanksConverted;
      const hitsConverted = Math.min(ramLeft, hitsFinal);
      critsFinal += hitsConverted;
      hitsFinal -= hitsConverted;
    }

    expectedHits += prob * hitsFinal;
    expectedCrits += prob * critsFinal;
    const totalRounded = Math.round(hitsFinal + critsFinal);
    totalProbByTotal[totalRounded] = (totalProbByTotal[totalRounded] ?? 0) + prob;
    const hitsCritsKey = `${hitsFinal},${critsFinal}`;
    totalProbByHitsCrits.set(hitsCritsKey, (totalProbByHitsCrits.get(hitsCritsKey) ?? 0) + prob);
  }

  const distributionByHitsCrits = Array.from(totalProbByHitsCrits.entries()).map(([hitsCritsKey, probability]) => {
    const [hits, crits] = hitsCritsKey.split(',').map(Number);
    return { hits, crits, probability };
  });

  const maxTotal = Math.max(...Object.keys(totalProbByTotal).map(Number), 0);
  const dist = Array.from({ length: maxTotal + 1 }, (_, total) => ({
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
    distribution: dist,
    distributionByHitsCrits,
    cumulative,
  };
}

/** Effective per-die probabilities with defense surge folded in. */
export function getDefenseEffectiveProbabilities(
  color: DefenseDieColor,
  surge: DefenseSurgeConversion
): { block: number; blank: number } {
  const die = DEFENSE_DICE[color];
  let block = die.block;
  let blank = die.blank;
  if (surge === 'block') {
    block += die.surge;
  } else {
    blank += die.surge;
  }
  return {
    block: block / DEFENSE_SIDES,
    blank: blank / DEFENSE_SIDES,
  };
}

/** Convolve one defense die into the pool distribution over total blocks. */
function convolveOneDefenseDie(
  current: Map<number, number>,
  probs: { block: number; blank: number }
): Map<number, number> {
  const next = new Map<number, number>();
  for (const [blocks, prob] of current) {
    if (prob === 0) continue;
    const blockKey = blocks + 1;
    next.set(blockKey, (next.get(blockKey) ?? 0) + prob * probs.block);
    next.set(blocks, (next.get(blocks) ?? 0) + prob * probs.blank);
  }
  return next;
}

export function calculateDefensePool(
  pool: DefensePool,
  surge: DefenseSurgeConversion
): DefenseResults {
  let distribution = new Map<number, number>();
  distribution.set(0, 1);

  const colors: DefenseDieColor[] = ['red', 'white'];
  for (const color of colors) {
    const count = pool[color];
    const probs = getDefenseEffectiveProbabilities(color, surge);
    for (let i = 0; i < count; i++) {
      distribution = convolveOneDefenseDie(distribution, probs);
    }
  }

  let expectedBlocks = 0;
  const totalProbByTotal: Record<number, number> = {};
  for (const [blocks, prob] of distribution) {
    expectedBlocks += prob * blocks;
    totalProbByTotal[blocks] = (totalProbByTotal[blocks] ?? 0) + prob;
  }

  const maxTotal = Math.max(...Object.keys(totalProbByTotal).map(Number), 0);
  const dist = Array.from({ length: maxTotal + 1 }, (_, total) => ({
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
    expectedBlocks,
    distribution: dist,
    cumulative,
  };
}

export function getDefenseDistributionForDiceCount(
  diceCount: number,
  color: DefenseDieColor,
  surge: DefenseSurgeConversion
): DefenseResults {
  const pool: DefensePool =
    color === 'red' ? { red: diceCount, white: 0 } : { red: 0, white: diceCount };
  return calculateDefensePool(pool, surge);
}

export function calculateWounds(
  attackResults: AttackResults,
  defenseDieColor: DefenseDieColor,
  defenseSurge: DefenseSurgeConversion,
  dodgeTokens?: number
): WoundsResults {
  const normalizedDodge = dodgeTokens == null ? 0 : Math.max(0, Math.floor(dodgeTokens));
  const woundsProbByTotal: Record<number, number> = {};
  let expectedWounds = 0;

  for (const hitsCritsEntry of attackResults.distributionByHitsCrits) {
    const { hits, crits, probability: attackProb } = hitsCritsEntry;
    if (attackProb === 0) continue;
    const defenseDice = crits + Math.max(0, hits - normalizedDodge);
    const defenseResults = getDefenseDistributionForDiceCount(
      defenseDice,
      defenseDieColor,
      defenseSurge
    );
    const attackTotal = hits + crits;
    for (const defenseEntry of defenseResults.distribution) {
      const defenseTotal = defenseEntry.total;
      const defenseProb = defenseEntry.probability;
      if (defenseProb === 0) continue;
      const wounds = Math.max(0, attackTotal - defenseTotal);
      const jointProb = attackProb * defenseProb;
      woundsProbByTotal[wounds] = (woundsProbByTotal[wounds] ?? 0) + jointProb;
      expectedWounds += jointProb * wounds;
    }
  }

  const maxWounds = Math.max(...Object.keys(woundsProbByTotal).map(Number), 0);
  const distribution = Array.from({ length: maxWounds + 1 }, (_, total) => ({
    total,
    probability: woundsProbByTotal[total] ?? 0,
  }));

  const cumulative: { total: number; probability: number }[] = [];
  let cumSum = 1;
  for (let i = 0; i <= maxWounds; i++) {
    cumulative.push({ total: i, probability: cumSum });
    cumSum -= woundsProbByTotal[i] ?? 0;
  }

  return {
    expectedWounds,
    distribution,
    cumulative,
  };
}
