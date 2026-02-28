export type SurgeOption = 'none' | 'hit' | 'crit';
export type DefenseSurgeOption = 'none' | 'block';
export type CoverOption = 'none' | 'light' | 'heavy';
export type DefenseColorOption = 'red' | 'white';

export interface UrlState {
  r: number;
  b: number;
  w: number;
  surge: SurgeOption;
  crit: number;
  sTok: number;
  aim: number;
  obs: number;
  precise: number;
  ram: number;
  sharp: number;
  pierce: number;
  impact: number;
  cost: string;
  dColor: DefenseColorOption;
  dSurge: DefenseSurgeOption;
  dSurgeTok: number;
  dodge: number;
  out: boolean;
  cover: CoverOption;
  lowProf: boolean;
  sup: boolean;
  coverX: number;
  armor: number;
  imp: boolean;
  suppTok: number;
  danger: number;
  backup: boolean;
}

export const DEFAULT_URL_STATE: UrlState = {
  r: 0,
  b: 0,
  w: 0,
  surge: 'none',
  crit: 0,
  sTok: 0,
  aim: 0,
  obs: 0,
  precise: 0,
  ram: 0,
  sharp: 0,
  pierce: 0,
  impact: 0,
  cost: '',
  dColor: 'red',
  dSurge: 'none',
  dSurgeTok: 0,
  dodge: 0,
  out: false,
  cover: 'none',
  lowProf: false,
  sup: false,
  coverX: 0,
  armor: 0,
  imp: false,
  suppTok: 0,
  danger: 0,
  backup: false,
};

const SURGE_VALUES: SurgeOption[] = ['none', 'hit', 'crit'];
const COVER_VALUES: CoverOption[] = ['none', 'light', 'heavy'];
const D_SURGE_VALUES: DefenseSurgeOption[] = ['none', 'block'];
const D_COLOR_VALUES: DefenseColorOption[] = ['red', 'white'];

function parseNumber(value: string | null, defaultVal: number): number {
  if (value === null || value === '') return defaultVal;
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0) return defaultVal;
  return Math.floor(parsed);
}

function parseEnum<T extends string>(value: string | null, options: readonly T[], defaultVal: T): T {
  if (value === null || value === '') return defaultVal;
  return options.includes(value as T) ? (value as T) : defaultVal;
}

function parseBoolean(value: string | null): boolean {
  if (value === null || value === '') return false;
  const lower = value.toLowerCase();
  return lower === '1' || lower === 'true';
}

export function parseFragment(hash: string): UrlState {
  const stripped = hash.startsWith('#') ? hash.slice(1) : hash;
  const params = new URLSearchParams(stripped);

  const get = (key: string) => params.get(key);

  return {
    r: parseNumber(get('r'), DEFAULT_URL_STATE.r),
    b: parseNumber(get('b'), DEFAULT_URL_STATE.b),
    w: parseNumber(get('w'), DEFAULT_URL_STATE.w),
    surge: parseEnum(get('surge'), SURGE_VALUES, DEFAULT_URL_STATE.surge),
    crit: parseNumber(get('crit'), DEFAULT_URL_STATE.crit),
    sTok: parseNumber(get('sTok'), DEFAULT_URL_STATE.sTok),
    aim: parseNumber(get('aim'), DEFAULT_URL_STATE.aim),
    obs: parseNumber(get('obs'), DEFAULT_URL_STATE.obs),
    precise: parseNumber(get('precise'), DEFAULT_URL_STATE.precise),
    ram: parseNumber(get('ram'), DEFAULT_URL_STATE.ram),
    sharp: parseNumber(get('sharp'), DEFAULT_URL_STATE.sharp),
    pierce: parseNumber(get('pierce'), DEFAULT_URL_STATE.pierce),
    impact: parseNumber(get('impact'), DEFAULT_URL_STATE.impact),
    cost: get('cost') ?? DEFAULT_URL_STATE.cost,
    dColor: parseEnum(get('dColor'), D_COLOR_VALUES, DEFAULT_URL_STATE.dColor),
    dSurge: parseEnum(get('dSurge'), D_SURGE_VALUES, DEFAULT_URL_STATE.dSurge),
    dSurgeTok: parseNumber(get('dSurgeTok'), DEFAULT_URL_STATE.dSurgeTok),
    dodge: parseNumber(get('dodge'), DEFAULT_URL_STATE.dodge),
    out: parseBoolean(get('out')),
    cover: parseEnum(get('cover'), COVER_VALUES, DEFAULT_URL_STATE.cover),
    lowProf: parseBoolean(get('lowProf')),
    sup: parseBoolean(get('sup')),
    coverX: Math.min(2, Math.max(0, parseNumber(get('coverX'), DEFAULT_URL_STATE.coverX))),
    armor: parseNumber(get('armor'), DEFAULT_URL_STATE.armor),
    imp: parseBoolean(get('imp')),
    suppTok: parseNumber(get('suppTok'), DEFAULT_URL_STATE.suppTok),
    danger: parseNumber(get('danger'), DEFAULT_URL_STATE.danger),
    backup: parseBoolean(get('backup')),
  };
}

function isDefault(key: keyof UrlState, value: UrlState[keyof UrlState]): boolean {
  const defaultVal = DEFAULT_URL_STATE[key];
  if (typeof value === 'number' && typeof defaultVal === 'number') return value === defaultVal;
  if (typeof value === 'boolean' && typeof defaultVal === 'boolean') return value === defaultVal;
  if (typeof value === 'string' && typeof defaultVal === 'string') return value === defaultVal;
  return value === defaultVal;
}

export function buildFragment(state: UrlState): string {
  const entries: string[] = [];
  const keys = Object.keys(DEFAULT_URL_STATE) as (keyof UrlState)[];
  for (const key of keys) {
    const value = state[key];
    if (!isDefault(key, value)) {
      const serialized = typeof value === 'boolean' ? (value ? '1' : '0') : String(value);
      entries.push(`${key}=${encodeURIComponent(serialized)}`);
    }
  }
  return entries.join('&');
}
