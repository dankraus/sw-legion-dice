import type { AttackPool } from '../types';

export function formatAttackPoolCounts(attackPool: AttackPool): string {
  const parts: string[] = [];
  if (attackPool.red > 0) parts.push(`${attackPool.red} red`);
  if (attackPool.black > 0) parts.push(`${attackPool.black} black`);
  if (attackPool.white > 0) parts.push(`${attackPool.white} white`);
  return parts.length > 0 ? parts.join(', ') : '0 dice';
}

export function attackPoolsDiffer(
  left: AttackPool,
  right: AttackPool
): boolean {
  return (
    left.red !== right.red ||
    left.black !== right.black ||
    left.white !== right.white
  );
}

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
