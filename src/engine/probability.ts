import type {
  DieColor,
  SurgeConversion,
  AttackPool,
  AttackResults,
  CriticalX,
  DefenseDieColor,
  DefenseSurgeConversion,
  DefensePool,
  DefenseResults,
  WoundsResults,
  CoverLevel,
} from '../types';

export {
  DICE,
  DEFENSE_DICE,
  SIDES,
  DEFENSE_SIDES,
  type DefenseDieFaces,
} from './dice-data';

import { DICE, DEFENSE_DICE, SIDES, DEFENSE_SIDES } from './dice-data';
import { createSeededRng, DEFAULT_RUNS } from './rng';
import {
  simulateAttackPool,
  simulateWoundsFromAttackResults,
  getDefenseDistributionForDiceCountSim,
  simulateDefensePool,
} from './simulate';

export interface EffectiveProbabilities {
  crit: number;
  hit: number;
  blank: number;
}

/** Effective per-die probabilities with surge folded in (used for tests). */
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

const SEED = 0;

export function calculateAttackPool(
  pool: AttackPool,
  surge: SurgeConversion,
  criticalX?: CriticalX,
  surgeTokens?: number,
  aimTokens?: number,
  observeTokens?: number,
  preciseX?: number,
  ramX?: number
): AttackResults {
  const rng = createSeededRng(SEED);
  return simulateAttackPool(
    pool,
    surge,
    criticalX,
    surgeTokens ?? 0,
    aimTokens ?? 0,
    observeTokens ?? 0,
    preciseX ?? 0,
    ramX ?? 0,
    DEFAULT_RUNS,
    rng
  );
}

export function getDefenseDistributionForDiceCount(
  diceCount: number,
  color: DefenseDieColor,
  surge: DefenseSurgeConversion,
  defenseSurgeTokens?: number
): DefenseResults {
  const rng = createSeededRng(SEED);
  return getDefenseDistributionForDiceCountSim(
    diceCount,
    color,
    surge,
    defenseSurgeTokens,
    DEFAULT_RUNS,
    rng
  );
}

export function calculateDefensePool(
  pool: DefensePool,
  surge: DefenseSurgeConversion,
  defenseSurgeTokens?: number
): DefenseResults {
  const rng = createSeededRng(SEED);
  return simulateDefensePool(pool, surge, defenseSurgeTokens, DEFAULT_RUNS, rng);
}

export function calculateWounds(
  attackResults: AttackResults,
  defenseDieColor: DefenseDieColor,
  defenseSurge: DefenseSurgeConversion,
  dodgeTokens?: number,
  outmaneuver?: boolean,
  defenseSurgeTokens?: number,
  cover?: CoverLevel,
  lowProfile?: boolean,
  suppressed?: boolean,
  sharpshooterX?: number,
  backup?: boolean,
  pierceX?: number
): WoundsResults {
  const rng = createSeededRng(SEED);
  return simulateWoundsFromAttackResults(
    attackResults,
    defenseDieColor,
    defenseSurge,
    dodgeTokens ?? 0,
    outmaneuver ?? false,
    defenseSurgeTokens ?? 0,
    cover ?? 'none',
    lowProfile ?? false,
    suppressed ?? false,
    sharpshooterX ?? 0,
    backup ?? false,
    pierceX ?? 0,
    DEFAULT_RUNS,
    rng
  );
}
