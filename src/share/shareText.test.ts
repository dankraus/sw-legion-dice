import { describe, it, expect } from 'vitest';
import { buildShareText } from './shareText';
import { computePoolResults, DEFAULT_POOL_CONFIG } from '../poolResults';

const url = 'https://legionroller.com/#r=3';

describe('buildShareText', () => {
  it('renders a single-pool block with pool, mods, stats and url', () => {
    const config = {
      ...DEFAULT_POOL_CONFIG,
      pool: { red: 3, black: 1, white: 0 },
      aimTokens: '2',
      pointCost: '47',
    };
    const text = buildShareText({
      url,
      live: { config, results: computePoolResults(config), label: 'B' },
    });
    expect(text).toContain('Legion Roller');
    expect(text).toContain('3 red');
    expect(text).toContain('1 black');
    expect(text).toContain('Aim 2');
    expect(text).toContain('Avg total');
    expect(text).toContain('Pts/wound');
    expect(text).toContain(url);
  });

  it('omits efficiency when no point cost is set', () => {
    const config = {
      ...DEFAULT_POOL_CONFIG,
      pool: { red: 2, black: 0, white: 0 },
    };
    const text = buildShareText({
      url,
      live: { config, results: computePoolResults(config), label: 'B' },
    });
    expect(text).not.toContain('Pts/wound');
  });

  it('renders an A vs B comparison block when pinned is provided', () => {
    const configA = {
      ...DEFAULT_POOL_CONFIG,
      pool: { red: 3, black: 0, white: 0 },
    };
    const configB = {
      ...DEFAULT_POOL_CONFIG,
      pool: { red: 1, black: 0, white: 0 },
    };
    const text = buildShareText({
      url,
      live: {
        config: configB,
        results: computePoolResults(configB),
        label: 'Stock',
      },
      pinned: {
        config: configA,
        results: computePoolResults(configA),
        label: 'DLT',
      },
    });
    expect(text).toContain('DLT');
    expect(text).toContain('Stock');
    expect(text).toContain('vs');
  });
});
