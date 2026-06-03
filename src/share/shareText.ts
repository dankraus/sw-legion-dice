import type { PoolConfig } from '../types';
import type { PoolResults } from '../poolResults';
import { describeActiveModifiers } from './describeActiveModifiers';
import { pointCostValue } from './pointCost';
import { buildDeltaRows } from '../comparisonDeltas';

export interface SharePool {
  config: PoolConfig;
  results: PoolResults;
  label: string;
}

export interface ShareTextInput {
  url: string;
  live: SharePool;
  pinned?: SharePool;
}

function poolComposition(config: PoolConfig): string {
  const parts: string[] = [];
  if (config.pool.red > 0) parts.push(`${config.pool.red} red`);
  if (config.pool.black > 0) parts.push(`${config.pool.black} black`);
  if (config.pool.white > 0) parts.push(`${config.pool.white} white`);
  return parts.length > 0 ? parts.join(' ') : 'no attack dice';
}

function statsLine(pool: SharePool): string {
  const { results, woundsResults } = pool.results;
  const segments = [
    `Avg total ${results.expectedTotal.toFixed(2)}`,
    `Avg wounds ${woundsResults.expectedWounds.toFixed(2)}`,
  ];
  const cost = pointCostValue(pool.config);
  if (cost > 0 && woundsResults.expectedWounds > 0) {
    segments.push(
      `Pts/wound ${(cost / woundsResults.expectedWounds).toFixed(1)}`
    );
  }
  return segments.join(', ');
}

function poolBlock(pool: SharePool): string {
  const modifiers = describeActiveModifiers(pool.config);
  const modifierText = modifiers.length > 0 ? ` | ${modifiers.join(', ')}` : '';
  return `${poolComposition(pool.config)}${modifierText} | ${statsLine(pool)}`;
}

function deltaSegment(pinned: SharePool, live: SharePool): string {
  const rows = buildDeltaRows(
    pinned.results,
    live.results,
    pinned.config.pointCost,
    live.config.pointCost
  );
  const wanted = ['Avg total', 'Avg wounds'];
  const parts = rows
    .filter((row) => wanted.includes(row.label) && row.delta !== null)
    .map((row) => {
      const delta = row.delta as number;
      const sign = delta >= 0 ? '+' : '';
      return `Δ ${row.label} ${sign}${delta.toFixed(2)}`;
    });
  return parts.join(', ');
}

export function buildShareText(input: ShareTextInput): string {
  const header = 'Legion Roller';
  if (input.pinned) {
    return [
      `${header} — ${input.pinned.label} vs ${input.live.label}`,
      `${input.pinned.label}: ${poolBlock(input.pinned)}`,
      `${input.live.label}: ${poolBlock(input.live)}`,
      deltaSegment(input.pinned, input.live),
      input.url,
    ].join('\n');
  }
  return [`${header}`, poolBlock(input.live), input.url].join('\n');
}
