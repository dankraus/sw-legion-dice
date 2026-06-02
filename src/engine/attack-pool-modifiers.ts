import { applyAssaultToPool } from './assault';
import type { AttackPool } from '../types';

export interface AttackPoolModifierOptions {
  assaultX: number;
}

/** Apply pre-roll pool upgrades/downgrades (Assault, etc.) before simulation. */
export function resolveEffectiveAttackPool(
  basePool: AttackPool,
  modifiers: AttackPoolModifierOptions
): AttackPool {
  return applyAssaultToPool(basePool, modifiers.assaultX);
}
