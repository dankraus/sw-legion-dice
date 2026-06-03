import { describe, it, expect } from 'vitest';
import { resolveCompareConfigs } from './comparePoolState';
import { buildAppUrlState } from './buildAppUrlState';
import { DEFAULT_POOL_CONFIG } from './poolResults';

describe('compare pool flows', () => {
  it('tab switch preserves B when editing A', () => {
    const configB = {
      ...DEFAULT_POOL_CONFIG,
      pool: { red: 1, black: 0, white: 0 },
    };
    const configA = {
      ...DEFAULT_POOL_CONFIG,
      pool: { red: 5, black: 0, white: 0 },
    };
    const onA = resolveCompareConfigs({
      pinnedConfig: configA,
      cachedPoolB: configB,
      activePool: 'A',
      editorConfig: configA,
      debouncedEditorConfig: configA,
    });
    expect(onA!.configB.pool.red).toBe(1);
    expect(onA!.configA.pool.red).toBe(5);
  });

  it('URL a.* updates while bare keys stay B when editing A', () => {
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
  });
});
