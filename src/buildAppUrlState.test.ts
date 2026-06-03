import { describe, it, expect } from 'vitest';
import { buildAppUrlState } from './buildAppUrlState';
import { DEFAULT_POOL_CONFIG } from './poolResults';

describe('buildAppUrlState', () => {
  it('keeps bare keys from cached B when editing A', () => {
    const configB = {
      ...DEFAULT_POOL_CONFIG,
      pool: { red: 1, black: 0, white: 0 },
    };
    const configA = {
      ...DEFAULT_POOL_CONFIG,
      pool: { red: 5, black: 0, white: 0 },
    };
    const state = buildAppUrlState({
      debouncedInputs: configA,
      pinnedConfig: configA,
      cachedPoolB: configB,
      activePool: 'A',
      labelA: 'A',
      labelB: 'B',
    });
    expect(state.r).toBe(1);
    expect(state.a.r).toBe(5);
    expect(state.cmp).toBe(true);
  });

  it('uses editor inputs for bare keys when editing B', () => {
    const configB = {
      ...DEFAULT_POOL_CONFIG,
      pool: { red: 2, black: 0, white: 0 },
    };
    const configA = {
      ...DEFAULT_POOL_CONFIG,
      pool: { red: 3, black: 0, white: 0 },
    };
    const state = buildAppUrlState({
      debouncedInputs: configB,
      pinnedConfig: configA,
      cachedPoolB: configB,
      activePool: 'B',
      labelA: 'A',
      labelB: 'B',
    });
    expect(state.r).toBe(2);
    expect(state.a.r).toBe(3);
  });
});
