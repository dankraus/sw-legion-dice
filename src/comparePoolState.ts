import type { PoolConfig } from './types';

export type ActivePool = 'A' | 'B';

export type CompareConfigResolution = {
  configA: PoolConfig;
  configB: PoolConfig;
  debouncedConfigA: PoolConfig;
  debouncedConfigB: PoolConfig;
  barePoolStateSource: PoolConfig;
};

export function resolveCompareConfigs(args: {
  pinnedConfig: PoolConfig | null;
  cachedPoolB: PoolConfig | null;
  activePool: ActivePool;
  editorConfig: PoolConfig;
  debouncedEditorConfig: PoolConfig;
}): CompareConfigResolution | null {
  const {
    pinnedConfig,
    cachedPoolB,
    activePool,
    editorConfig,
    debouncedEditorConfig,
  } = args;
  if (pinnedConfig === null) return null;

  const configA = activePool === 'A' ? editorConfig : pinnedConfig;
  const configB =
    activePool === 'B' ? editorConfig : (cachedPoolB ?? editorConfig);
  const debouncedConfigA =
    activePool === 'A' ? debouncedEditorConfig : pinnedConfig;
  const debouncedConfigB =
    activePool === 'B'
      ? debouncedEditorConfig
      : (cachedPoolB ?? debouncedEditorConfig);
  const barePoolStateSource = configB;

  return {
    configA,
    configB,
    debouncedConfigA,
    debouncedConfigB,
    barePoolStateSource,
  };
}
