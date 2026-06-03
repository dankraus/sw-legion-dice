import type { PoolConfig } from '../types';

export function pointCostValue(config: PoolConfig): number {
  const parsed = Number(config.pointCost);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}
