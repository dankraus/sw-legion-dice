import type { AttackPool } from '../types';

function normalizeAssaultX(assaultX: number): number {
  if (
    typeof assaultX !== 'number' ||
    !Number.isFinite(assaultX) ||
    assaultX < 0 ||
    !Number.isInteger(assaultX)
  ) {
    return 0;
  }
  return assaultX;
}

export function applyAssaultToPool(
  basePool: AttackPool,
  assaultX: number
): AttackPool {
  const capacity = normalizeAssaultX(assaultX);
  const blackToRed = Math.min(capacity, basePool.black);
  const remaining = capacity - blackToRed;
  const whiteToBlack = Math.min(remaining, basePool.white);
  return {
    red: basePool.red + blackToRed,
    black: basePool.black - blackToRed + whiteToBlack,
    white: basePool.white - whiteToBlack,
  };
}
