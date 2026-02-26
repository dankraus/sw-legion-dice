import type {
  DieColor,
  AttackPool,
  SurgeConversion,
  AttackResults,
  CriticalX,
  DefenseDieColor,
  DefenseSurgeConversion,
  DefensePool,
  DefenseResults,
  WoundsResults,
} from '../types';
import { DICE, DEFENSE_DICE, DEFENSE_SIDES } from './dice-data';

export type AttackFace = 'crit' | 'surge' | 'hit' | 'blank';

const SIDES = 8;

/** Roll one attack die; returns face type. Uses rng() in [0,1). */
export function rollOneAttackDie(color: DieColor, rng: () => number): AttackFace {
  const die = DICE[color];
  const value = rng() * SIDES; // [0, 8)
  const cumul = [die.crit, die.crit + die.surge, die.crit + die.surge + die.hit, SIDES];
  if (value < cumul[0]) return 'crit';
  if (value < cumul[1]) return 'surge';
  if (value < cumul[2]) return 'hit';
  return 'blank';
}

export interface RawAttackCounts {
  crit: number;
  surge: number;
  hit: number;
  blank: number;
}

export function rollAttackPool(pool: AttackPool, rng: () => number): RawAttackCounts {
  const counts: RawAttackCounts = { crit: 0, surge: 0, hit: 0, blank: 0 };
  const colors: DieColor[] = ['red', 'black', 'white'];
  for (const color of colors) {
    const number = pool[color];
    for (let i = 0; i < number; i++) {
      const face = rollOneAttackDie(color, rng);
      counts[face]++;
    }
  }
  return counts;
}

function normalizeCriticalX(value: number | undefined | null): number {
  if (value === undefined || value === null) return 0;
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.floor(num);
}

function normalizeSurgeTokens(value: number | undefined | null): number {
  if (value === undefined || value === null) return 0;
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.floor(num);
}

/** Resolve (crit, surge, hit, blank) with Critical X then Surge Conversion (and Surge Tokens when surge is none) → (hits, crits). */
export function resolveStep(
  raw: RawAttackCounts,
  criticalX: number | undefined,
  surge: SurgeConversion,
  surgeTokens: number | undefined
): { hits: number; crits: number } {
  const normalizedCriticalX = normalizeCriticalX(criticalX);
  const normalizedSurgeTokens = normalizeSurgeTokens(surgeTokens);
  const surgesToCrit = Math.min(normalizedCriticalX, raw.surge);
  const surgesRemaining = raw.surge - surgesToCrit;
  let resolvedCrits = raw.crit + surgesToCrit;
  let resolvedHits = raw.hit;
  if (surge === 'crit') {
    resolvedCrits += surgesRemaining;
  } else if (surge === 'hit') {
    resolvedHits += surgesRemaining;
  } else {
    resolvedHits += Math.min(normalizedSurgeTokens, surgesRemaining);
  }
  return { hits: resolvedHits, crits: resolvedCrits };
}

function normalizeTokenCount(value: number | undefined | null): number {
  if (value === undefined || value === null) return 0;
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.floor(num);
}

/** Apply rerolls: up to capacity blanks are rerolled (one die from pool per reroll), outcomes added via surge conversion. */
export function applyRerolls(
  rawCounts: RawAttackCounts,
  resolveResult: { hits: number; crits: number },
  pool: AttackPool,
  surge: SurgeConversion,
  aimTokens: number,
  observeTokens: number,
  preciseX: number,
  rng: () => number
): { hits: number; crits: number } {
  const aim = normalizeTokenCount(aimTokens);
  const observe = normalizeTokenCount(observeTokens);
  const preciseXVal = aim > 0 ? Math.max(0, Math.floor(preciseX) || 0) : 0;
  const capacity = aim * (2 + preciseXVal) + observe;
  const blanks = rawCounts.blank;
  const numRerolls = Math.min(capacity, blanks);
  let hits = resolveResult.hits;
  let crits = resolveResult.crits;
  const totalDice = pool.red + pool.black + pool.white;
  if (totalDice === 0 || numRerolls <= 0) return { hits, crits };
  const colors: DieColor[] = ['red', 'black', 'white'];
  for (let i = 0; i < numRerolls; i++) {
    const index = Math.floor(rng() * totalDice);
    let remaining = index;
    let chosenColor: DieColor = 'white';
    for (const color of colors) {
      const count = pool[color];
      if (remaining < count) {
        chosenColor = color;
        break;
      }
      remaining -= count;
    }
    const face = rollOneAttackDie(chosenColor, rng);
    if (face === 'crit') crits += 1;
    else if (face === 'hit') hits += 1;
    else if (face === 'surge') {
      if (surge === 'crit') crits += 1;
      else if (surge === 'hit') hits += 1;
    }
  }
  return { hits, crits };
}

/** Apply Ram X: convert up to X blanks to crits, then up to remaining X hits to crits. */
export function applyRam(
  hits: number,
  crits: number,
  blanksAfterReroll: number,
  ram: number
): { hits: number; crits: number } {
  const normalizedRam = normalizeTokenCount(ram);
  if (normalizedRam <= 0) return { hits, crits };
  const blanksConverted = Math.min(normalizedRam, blanksAfterReroll);
  let resolvedCrits = crits + blanksConverted;
  let resolvedHits = hits;
  const ramLeft = normalizedRam - blanksConverted;
  const hitsConverted = Math.min(ramLeft, resolvedHits);
  resolvedCrits += hitsConverted;
  resolvedHits -= hitsConverted;
  return { hits: resolvedHits, crits: resolvedCrits };
}

/** Run N attack simulations and aggregate to AttackResults. */
export function simulateAttackPool(
  pool: AttackPool,
  surge: SurgeConversion,
  criticalX: CriticalX,
  surgeTokens: number,
  aimTokens: number,
  observeTokens: number,
  preciseX: number,
  ram: number,
  runs: number,
  rng: () => number
): AttackResults {
  let sumHits = 0;
  let sumCrits = 0;
  const totalHistogram: Record<number, number> = {};
  const hitsCritsHistogram = new Map<string, number>();

  const aim = normalizeTokenCount(aimTokens);
  const observe = normalizeTokenCount(observeTokens);
  const preciseXVal = aim > 0 ? Math.max(0, Math.floor(preciseX) || 0) : 0;
  const capacity = aim * (2 + preciseXVal) + observe;

  for (let run = 0; run < runs; run++) {
    const raw = rollAttackPool(pool, rng);
    const resolved = resolveStep(raw, criticalX, surge, surgeTokens);
    const afterRerolls = applyRerolls(
      raw,
      resolved,
      pool,
      surge,
      aimTokens,
      observeTokens,
      preciseX,
      rng
    );
    const numRerolls = Math.min(capacity, raw.blank);
    const blanksAfterReroll = raw.blank - numRerolls;
    const final = applyRam(
      afterRerolls.hits,
      afterRerolls.crits,
      blanksAfterReroll,
      ram
    );

    sumHits += final.hits;
    sumCrits += final.crits;
    const total = final.hits + final.crits;
    totalHistogram[total] = (totalHistogram[total] ?? 0) + 1;
    const key = `${final.hits},${final.crits}`;
    hitsCritsHistogram.set(key, (hitsCritsHistogram.get(key) ?? 0) + 1);
  }

  const expectedHits = sumHits / runs;
  const expectedCrits = sumCrits / runs;
  const expectedTotal = expectedHits + expectedCrits;

  const maxTotal = Math.max(...Object.keys(totalHistogram).map(Number), 0);
  const distribution = Array.from({ length: maxTotal + 1 }, (_, total) => ({
    total,
    probability: (totalHistogram[total] ?? 0) / runs,
  }));

  const distributionByHitsCrits = Array.from(hitsCritsHistogram.entries()).map(
    ([hitsCritsKey, count]) => {
      const [hits, crits] = hitsCritsKey.split(',').map(Number);
      return { hits, crits, probability: count / runs };
    }
  );

  let cumSum = 1;
  const cumulative = Array.from({ length: maxTotal + 1 }, (_, total) => {
    const entry = { total, probability: cumSum };
    cumSum -= (totalHistogram[total] ?? 0) / runs;
    return entry;
  });

  return {
    expectedHits,
    expectedCrits,
    expectedTotal,
    distribution,
    distributionByHitsCrits,
    cumulative,
  };
}

/** Roll one defense die; returns 1 for block, 0 for blank. */
export function rollOneDefenseDie(
  color: DefenseDieColor,
  surge: DefenseSurgeConversion,
  rng: () => number
): number {
  const die = DEFENSE_DICE[color];
  const blockFaces = surge === 'block' ? die.block + die.surge : die.block;
  return rng() * DEFENSE_SIDES < blockFaces ? 1 : 0;
}

/** Simulate N defense rolls for a pool; return DefenseResults. */
export function simulateDefensePool(
  pool: DefensePool,
  surge: DefenseSurgeConversion,
  runs: number,
  rng: () => number
): DefenseResults {
  const histogram: Record<number, number> = {};
  let sumBlocks = 0;
  for (let run = 0; run < runs; run++) {
    let blocks = 0;
    const colors: DefenseDieColor[] = ['red', 'white'];
    for (const color of colors) {
      const count = pool[color];
      for (let i = 0; i < count; i++) {
        blocks += rollOneDefenseDie(color, surge, rng);
      }
    }
    sumBlocks += blocks;
    histogram[blocks] = (histogram[blocks] ?? 0) + 1;
  }
  const expectedBlocks = sumBlocks / runs;
  const maxTotal = Math.max(...Object.keys(histogram).map(Number), 0);
  const distribution = Array.from({ length: maxTotal + 1 }, (_, total) => ({
    total,
    probability: (histogram[total] ?? 0) / runs,
  }));
  let cumSum = 1;
  const cumulative = Array.from({ length: maxTotal + 1 }, (_, total) => {
    const entry = { total, probability: cumSum };
    cumSum -= (histogram[total] ?? 0) / runs;
    return entry;
  });
  return { expectedBlocks, distribution, cumulative };
}

/** Defense distribution for N dice of one color. */
export function getDefenseDistributionForDiceCountSim(
  diceCount: number,
  color: DefenseDieColor,
  surge: DefenseSurgeConversion,
  runs: number,
  rng: () => number
): DefenseResults {
  const pool: DefensePool =
    color === 'red' ? { red: diceCount, white: 0 } : { red: 0, white: diceCount };
  return simulateDefensePool(pool, surge, runs, rng);
}

/** Run N full (attack + defense) simulations and aggregate to WoundsResults. */
export function simulateWounds(
  pool: AttackPool,
  surge: SurgeConversion,
  criticalX: CriticalX,
  surgeTokens: number,
  aimTokens: number,
  observeTokens: number,
  preciseX: number,
  ram: number,
  defenseDieColor: DefenseDieColor,
  defenseSurge: DefenseSurgeConversion,
  dodgeTokens: number,
  runs: number,
  rng: () => number
): WoundsResults {
  const normalizedDodge = Math.max(0, Math.floor(dodgeTokens));
  const aim = normalizeTokenCount(aimTokens);
  const observe = normalizeTokenCount(observeTokens);
  const preciseXVal = aim > 0 ? Math.max(0, Math.floor(preciseX) || 0) : 0;
  const capacity = aim * (2 + preciseXVal) + observe;

  const woundsHistogram: Record<number, number> = {};
  let sumWounds = 0;

  for (let run = 0; run < runs; run++) {
    const raw = rollAttackPool(pool, rng);
    const resolved = resolveStep(raw, criticalX, surge, surgeTokens);
    const afterRerolls = applyRerolls(
      raw,
      resolved,
      pool,
      surge,
      aimTokens,
      observeTokens,
      preciseX,
      rng
    );
    const numRerolls = Math.min(capacity, raw.blank);
    const blanksAfterReroll = raw.blank - numRerolls;
    const final = applyRam(
      afterRerolls.hits,
      afterRerolls.crits,
      blanksAfterReroll,
      ram
    );

    const defenseDice = final.crits + Math.max(0, final.hits - normalizedDodge);
    let blocks = 0;
    for (let i = 0; i < defenseDice; i++) {
      blocks += rollOneDefenseDie(defenseDieColor, defenseSurge, rng);
    }
    const wounds = Math.max(0, defenseDice - blocks);
    sumWounds += wounds;
    woundsHistogram[wounds] = (woundsHistogram[wounds] ?? 0) + 1;
  }

  const expectedWounds = sumWounds / runs;
  const maxWounds = Math.max(...Object.keys(woundsHistogram).map(Number), 0);
  const distribution = Array.from({ length: maxWounds + 1 }, (_, total) => ({
    total,
    probability: (woundsHistogram[total] ?? 0) / runs,
  }));
  let cumSum = 1;
  const cumulative = Array.from({ length: maxWounds + 1 }, (_, total) => {
    const entry = { total, probability: cumSum };
    cumSum -= (woundsHistogram[total] ?? 0) / runs;
    return entry;
  });
  return { expectedWounds, distribution, cumulative };
}

/** Run N wounds simulations by sampling (hits, crits) from attack results then rolling defense. */
export function simulateWoundsFromAttackResults(
  attackResults: AttackResults,
  defenseDieColor: DefenseDieColor,
  defenseSurge: DefenseSurgeConversion,
  dodgeTokens: number,
  runs: number,
  rng: () => number
): WoundsResults {
  const normalizedDodge = Math.max(0, Math.floor(dodgeTokens));
  const outcomes = attackResults.distributionByHitsCrits.filter((entry) => entry.probability > 0);
  if (outcomes.length === 0) {
    return {
      expectedWounds: 0,
      distribution: [{ total: 0, probability: 1 }],
      cumulative: [{ total: 0, probability: 1 }],
    };
  }
  const woundsHistogram: Record<number, number> = {};
  let sumWounds = 0;
  for (let run = 0; run < runs; run++) {
    const roll = rng();
    let acc = 0;
    let hits = 0;
    let crits = 0;
    for (const entry of outcomes) {
      acc += entry.probability;
      if (roll < acc) {
        hits = entry.hits;
        crits = entry.crits;
        break;
      }
    }
    const defenseDice = crits + Math.max(0, hits - normalizedDodge);
    let blocks = 0;
    for (let i = 0; i < defenseDice; i++) {
      blocks += rollOneDefenseDie(defenseDieColor, defenseSurge, rng);
    }
    const wounds = Math.max(0, defenseDice - blocks);
    sumWounds += wounds;
    woundsHistogram[wounds] = (woundsHistogram[wounds] ?? 0) + 1;
  }
  const expectedWounds = sumWounds / runs;
  const maxWounds = Math.max(...Object.keys(woundsHistogram).map(Number), 0);
  const distribution = Array.from({ length: maxWounds + 1 }, (_, total) => ({
    total,
    probability: (woundsHistogram[total] ?? 0) / runs,
  }));
  let cumSum = 1;
  const cumulative = Array.from({ length: maxWounds + 1 }, (_, total) => {
    const entry = { total, probability: cumSum };
    cumSum -= (woundsHistogram[total] ?? 0) / runs;
    return entry;
  });
  return { expectedWounds, distribution, cumulative };
}
