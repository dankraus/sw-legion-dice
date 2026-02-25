import type { DieColor, DieFaces, SurgeConversion, AttackPool, AttackResults } from '../types';

export const DICE: Record<DieColor, DieFaces> = {
  red:   { crit: 1, surge: 1, hit: 5, blank: 1 },
  black: { crit: 1, surge: 1, hit: 3, blank: 3 },
  white: { crit: 1, surge: 1, hit: 1, blank: 5 },
};

const SIDES = 8;

export interface EffectiveProbabilities {
  crit: number;
  hit: number;
  blank: number;
}

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

function convolve(a: number[], b: number[]): number[] {
  const result = new Array(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      result[i + j] += a[i] * b[j];
    }
  }
  return result;
}

export function calculateAttackPool(
  pool: AttackPool,
  surge: SurgeConversion
): AttackResults {
  const dieColors: DieColor[] = ['red', 'black', 'white'];

  let hitDist = [1];
  let critDist = [1];

  for (const color of dieColors) {
    const count = pool[color];
    const probs = getEffectiveProbabilities(color, surge);

    for (let i = 0; i < count; i++) {
      hitDist = convolve(hitDist, [1 - probs.hit, probs.hit]);
      critDist = convolve(critDist, [1 - probs.crit, probs.crit]);
    }
  }

  const expectedHits = hitDist.reduce((sum, p, i) => sum + i * p, 0);
  const expectedCrits = critDist.reduce((sum, p, i) => sum + i * p, 0);

  let totalDist = [1];
  for (const color of dieColors) {
    const count = pool[color];
    const probs = getEffectiveProbabilities(color, surge);
    const successProb = probs.hit + probs.crit;

    for (let i = 0; i < count; i++) {
      totalDist = convolve(totalDist, [1 - successProb, successProb]);
    }
  }

  const distribution = totalDist.map((probability, total) => ({
    total,
    probability,
  }));

  const cumulative: { total: number; probability: number }[] = [];
  let cumSum = 1;
  for (let i = 0; i < totalDist.length; i++) {
    cumulative.push({ total: i, probability: cumSum });
    cumSum -= totalDist[i];
  }

  return {
    expectedHits,
    expectedCrits,
    expectedTotal: expectedHits + expectedCrits,
    distribution,
    cumulative,
  };
}
