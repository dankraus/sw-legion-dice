export type DieColor = 'red' | 'black' | 'white';

export type SurgeConversion = 'none' | 'hit' | 'crit';

export interface DieFaces {
  crit: number;
  surge: number;
  hit: number;
  blank: number;
}

export interface AttackPool {
  red: number;
  black: number;
  white: number;
}

export interface AttackResults {
  expectedHits: number;
  expectedCrits: number;
  expectedTotal: number;
  distribution: { total: number; probability: number }[];
  cumulative: { total: number; probability: number }[];
}

/** Optional keyword: Critical X converts up to X surges to crits before Surge Conversion. */
export type CriticalX = number | undefined;

export type DefenseDieColor = 'red' | 'white';

export type DefenseSurgeConversion = 'none' | 'block';

export interface DefensePool {
  red: number;
  white: number;
}

export interface DefenseResults {
  expectedBlocks: number;
  distribution: { total: number; probability: number }[];
  cumulative: { total: number; probability: number }[];
}

export interface WoundsResults {
  expectedWounds: number;
  distribution: { total: number; probability: number }[];
  cumulative: { total: number; probability: number }[];
}
