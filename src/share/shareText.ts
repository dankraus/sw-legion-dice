import type { PoolConfig } from '../types';
import type { PoolResults } from '../poolResults';
import { describeActiveModifiers } from './describeActiveModifiers';

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

function costValue(config: PoolConfig): number {
  const parsed = Number(config.pointCost);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function statsLine(pool: SharePool): string {
  const { results, woundsResults } = pool.results;
  const segments = [
    `Avg total ${results.expectedTotal.toFixed(2)}`,
    `Avg wounds ${woundsResults.expectedWounds.toFixed(2)}`,
  ];
  const cost = costValue(pool.config);
  if (cost > 0 && woundsResults.expectedWounds > 0) {
    segments.push(
      `Pts/wound ${(cost / woundsResults.expectedWounds).toFixed(1)}`
    );
  }
  return segments.join(', ');
}

function poolBlock(pool: SharePool): string {
  const mods = describeActiveModifiers(pool.config);
  const modText = mods.length > 0 ? ` | ${mods.join(', ')}` : '';
  return `${poolComposition(pool.config)}${modText} | ${statsLine(pool)}`;
}

export function buildShareText(input: ShareTextInput): string {
  const header = 'Legion Roller';
  if (input.pinned) {
    return [
      `${header} — ${input.pinned.label} vs ${input.live.label}`,
      `${input.pinned.label}: ${poolBlock(input.pinned)}`,
      `${input.live.label}: ${poolBlock(input.live)}`,
      input.url,
    ].join('\n');
  }
  return [`${header}`, poolBlock(input.live), input.url].join('\n');
}
