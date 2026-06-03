import type { PoolConfig } from './types';
import type { UrlState } from './urlState';
import { DEFAULT_URL_STATE_POOL } from './urlState';
import { configToUrlPoolState } from './poolConfigEditor';
import type { PoolEditorInputs } from './poolConfigEditor';
import type { ActivePool } from './comparePoolState';

export function buildAppUrlState(args: {
  debouncedInputs: PoolEditorInputs;
  pinnedConfig: PoolConfig | null;
  cachedPoolB: PoolConfig | null;
  activePool: ActivePool;
  labelA: string;
  labelB: string;
}): UrlState {
  const bareSource =
    args.pinnedConfig !== null && args.activePool === 'A' && args.cachedPoolB
      ? args.cachedPoolB
      : args.debouncedInputs;
  const bare = configToUrlPoolState(bareSource);
  const poolAForUrl =
    args.pinnedConfig !== null && args.activePool === 'A'
      ? args.debouncedInputs
      : args.pinnedConfig;
  return {
    ...bare,
    cmp: args.pinnedConfig !== null,
    la: args.labelA,
    lb: args.labelB,
    a: poolAForUrl
      ? configToUrlPoolState(poolAForUrl)
      : { ...DEFAULT_URL_STATE_POOL },
  };
}
