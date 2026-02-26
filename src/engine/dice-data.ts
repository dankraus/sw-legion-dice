import type { DieColor, DieFaces, DefenseDieColor } from '../types';

export const DICE: Record<DieColor, DieFaces> = {
  red:   { crit: 1, surge: 1, hit: 5, blank: 1 },
  black: { crit: 1, surge: 1, hit: 3, blank: 3 },
  white: { crit: 1, surge: 1, hit: 1, blank: 5 },
};

export const SIDES = 8;

export interface DefenseDieFaces {
  block: number;
  surge: number;
  blank: number;
}

export const DEFENSE_DICE: Record<DefenseDieColor, DefenseDieFaces> = {
  red:   { block: 3, surge: 1, blank: 2 },
  white: { block: 1, surge: 1, blank: 4 },
};

export const DEFENSE_SIDES = 6;
