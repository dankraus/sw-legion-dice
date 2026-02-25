import type { DieColor, DieFaces, SurgeConversion } from '../types';

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
