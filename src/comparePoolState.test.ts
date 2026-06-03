import { describe, it, expect } from 'vitest';
import { resolveCompareConfigs } from './comparePoolState';
import { DEFAULT_POOL_CONFIG } from './poolResults';

const configA = {
  ...DEFAULT_POOL_CONFIG,
  pool: { red: 3, black: 0, white: 0 },
};
const configB = {
  ...DEFAULT_POOL_CONFIG,
  pool: { red: 1, black: 0, white: 0 },
};

describe('resolveCompareConfigs', () => {
  it('returns null when not comparing', () => {
    expect(
      resolveCompareConfigs({
        pinnedConfig: null,
        cachedPoolB: null,
        activePool: 'B',
        editorConfig: configB,
        debouncedEditorConfig: configB,
      })
    ).toBeNull();
  });

  it('uses editor for configB when activePool is B', () => {
    const result = resolveCompareConfigs({
      pinnedConfig: configA,
      cachedPoolB: configB,
      activePool: 'B',
      editorConfig: configB,
      debouncedEditorConfig: configB,
    });
    expect(result!.configA).toEqual(configA);
    expect(result!.configB).toEqual(configB);
    expect(result!.debouncedConfigA).toEqual(configA);
    expect(result!.debouncedConfigB).toEqual(configB);
    expect(result!.barePoolStateSource).toBe(configB);
  });

  it('uses cachedPoolB for configB and debounced editor for configA when activePool is A', () => {
    const editedA = { ...configA, aimTokens: '2' };
    const result = resolveCompareConfigs({
      pinnedConfig: editedA,
      cachedPoolB: configB,
      activePool: 'A',
      editorConfig: editedA,
      debouncedEditorConfig: editedA,
    });
    expect(result!.configA).toEqual(editedA);
    expect(result!.configB).toEqual(configB);
    expect(result!.debouncedConfigA).toEqual(editedA);
    expect(result!.debouncedConfigB).toEqual(configB);
    expect(result!.barePoolStateSource).toBe(configB);
  });
});
