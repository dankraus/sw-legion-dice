# Comparison Editable Pools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users edit both pools A and B during compare mode via label tabs in a compare bar at the top of the config column, with clear active-pool affordances and correct dual-pool URL/share behavior.

**Architecture:** Keep one editor hook set in `App.tsx`; add `cachedPoolB` and `activePool` so pool B survives tab switches. Pure helpers in `poolConfigEditor.ts` read/apply configs and build URL pool state. A new `ComparePoolBar` replaces header Pin/Clear. Snapshot cards show active editing state; URL bare keys serialize from `cachedPoolB` when editing A.

**Tech Stack:** React 19, TypeScript 5.9, Vite 6, Vitest 4, @testing-library/react.

---

Spec: `docs/superpowers/specs/2026-06-03-comparison-editable-pools-design.md`

## File Structure

| File | Responsibility |
| ---- | -------------- |
| `src/poolConfigEditor.ts` (new) | `readConfigFromEditor`, `applyConfigToEditor`, `configToUrlPoolState` (extracted from `App.tsx`) |
| `src/poolConfigEditor.test.ts` (new) | Round-trip read/apply; URL state mapping |
| `src/comparePoolState.ts` (new) | `resolveCompareConfigs` — derives `configA`, `configB`, URL bare source |
| `src/comparePoolState.test.ts` (new) | Config resolution + URL gating cases |
| `src/components/ComparePoolBar.tsx` (new) | Single-pool entry + compare tabs UI |
| `src/components/ComparePoolBar.css` (new) | Segmented tabs, editing subline |
| `src/components/ComparePoolBar.test.tsx` (new) | Render + click handlers |
| `src/components/PoolSnapshotCard.tsx` | `isActive`, `onSelect`, Editing pill |
| `src/components/PoolSnapshotCard.css` | Active/inactive card styles |
| `src/components/PoolSnapshotCard.test.tsx` | Active pill + click handler |
| `src/components/ComparisonResults.tsx` | Pass `activePool`, card select handlers |
| `src/components/ComparisonResults.test.tsx` | Active snapshot props |
| `src/App.tsx` | State, handlers, compare bar, URL gating, remove header pin |
| `src/App.css` | Optional accent border on config column in compare mode |

---

### Task 1: `poolConfigEditor` helpers (TDD)

**Files:**
- Create: `src/poolConfigEditor.ts`
- Create: `src/poolConfigEditor.test.ts`
- Modify: `src/App.tsx` (later task imports from here; no App changes yet)

- [ ] **Step 1: Write failing tests**

Create `src/poolConfigEditor.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import {
  readConfigFromEditor,
  applyConfigToEditor,
  configToUrlPoolState,
} from './poolConfigEditor';
import { DEFAULT_POOL_CONFIG } from './poolResults';
import type { PoolConfig } from './types';

describe('readConfigFromEditor', () => {
  it('returns a PoolConfig copy of editor inputs', () => {
    const inputs: PoolConfig = {
      ...DEFAULT_POOL_CONFIG,
      pool: { red: 3, black: 1, white: 0 },
      aimTokens: '2',
    };
    expect(readConfigFromEditor(inputs)).toEqual(inputs);
  });
});

describe('applyConfigToEditor', () => {
  it('calls all setters with config values', () => {
    const config: PoolConfig = {
      ...DEFAULT_POOL_CONFIG,
      pool: { red: 2, black: 0, white: 1 },
      surge: 'crit',
      aimTokens: '1',
      cover: 'light',
      backup: true,
    };
    const setters = {
      setPool: vi.fn(),
      setSurge: vi.fn(),
      setCriticalX: vi.fn(),
      setSurgeTokens: vi.fn(),
      setAimTokens: vi.fn(),
      setObserveTokens: vi.fn(),
      setPreciseX: vi.fn(),
      setRamX: vi.fn(),
      setSharpshooterX: vi.fn(),
      setPierceX: vi.fn(),
      setImpactX: vi.fn(),
      setPointCost: vi.fn(),
      setDefenseDieColor: vi.fn(),
      setDefenseSurge: vi.fn(),
      setDefenseSurgeTokens: vi.fn(),
      setDodgeTokens: vi.fn(),
      setShieldTokens: vi.fn(),
      setOutmaneuver: vi.fn(),
      setCover: vi.fn(),
      setDugIn: vi.fn(),
      setLowProfile: vi.fn(),
      setSuppressed: vi.fn(),
      setCoverX: vi.fn(),
      setArmorX: vi.fn(),
      setImpervious: vi.fn(),
      setSuppressionTokens: vi.fn(),
      setDangerSenseX: vi.fn(),
      setUncannyLuckX: vi.fn(),
      setBackup: vi.fn(),
    };
    applyConfigToEditor(config, setters);
    expect(setters.setPool).toHaveBeenCalledWith({ red: 2, black: 0, white: 1 });
    expect(setters.setSurge).toHaveBeenCalledWith('crit');
    expect(setters.setAimTokens).toHaveBeenCalledWith('1');
    expect(setters.setCover).toHaveBeenCalledWith('light');
    expect(setters.setBackup).toHaveBeenCalledWith(true);
  });
});

describe('configToUrlPoolState', () => {
  it('maps PoolConfig to UrlPoolState numeric fields', () => {
    const state = configToUrlPoolState({
      ...DEFAULT_POOL_CONFIG,
      pool: { red: 3, black: 0, white: 0 },
      aimTokens: '2',
      coverX: '3', // clamped to 2
    });
    expect(state.r).toBe(3);
    expect(state.aim).toBe(2);
    expect(state.coverX).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/poolConfigEditor.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement `poolConfigEditor.ts`**

Create `src/poolConfigEditor.ts`:

```ts
import type {
  PoolConfig,
  AttackPool,
  SurgeConversion,
  DefenseDieColor,
  DefenseSurgeConversion,
  CoverLevel,
} from './types';
import type { UrlPoolState } from './urlState';

export type PoolEditorInputs = PoolConfig;

export type PoolEditorSetters = {
  setPool: (value: AttackPool) => void;
  setSurge: (value: SurgeConversion) => void;
  setCriticalX: (value: string) => void;
  setSurgeTokens: (value: string) => void;
  setAimTokens: (value: string) => void;
  setObserveTokens: (value: string) => void;
  setPreciseX: (value: string) => void;
  setRamX: (value: string) => void;
  setSharpshooterX: (value: string) => void;
  setPierceX: (value: string) => void;
  setImpactX: (value: string) => void;
  setPointCost: (value: string) => void;
  setDefenseDieColor: (value: DefenseDieColor) => void;
  setDefenseSurge: (value: DefenseSurgeConversion) => void;
  setDefenseSurgeTokens: (value: string) => void;
  setDodgeTokens: (value: string) => void;
  setShieldTokens: (value: string) => void;
  setOutmaneuver: (value: boolean) => void;
  setCover: (value: CoverLevel) => void;
  setDugIn: (value: boolean) => void;
  setLowProfile: (value: boolean) => void;
  setSuppressed: (value: boolean) => void;
  setCoverX: (value: string) => void;
  setArmorX: (value: string) => void;
  setImpervious: (value: boolean) => void;
  setSuppressionTokens: (value: string) => void;
  setDangerSenseX: (value: string) => void;
  setUncannyLuckX: (value: string) => void;
  setBackup: (value: boolean) => void;
};

export function readConfigFromEditor(inputs: PoolEditorInputs): PoolConfig {
  return { ...inputs };
}

export function applyConfigToEditor(
  config: PoolConfig,
  setters: PoolEditorSetters
): void {
  setters.setPool(config.pool);
  setters.setSurge(config.surge);
  setters.setCriticalX(config.criticalX);
  setters.setSurgeTokens(config.surgeTokens);
  setters.setAimTokens(config.aimTokens);
  setters.setObserveTokens(config.observeTokens);
  setters.setPreciseX(config.preciseX);
  setters.setRamX(config.ramX);
  setters.setSharpshooterX(config.sharpshooterX);
  setters.setPierceX(config.pierceX);
  setters.setImpactX(config.impactX);
  setters.setPointCost(config.pointCost);
  setters.setDefenseDieColor(config.defenseDieColor);
  setters.setDefenseSurge(config.defenseSurge);
  setters.setDefenseSurgeTokens(config.defenseSurgeTokens);
  setters.setDodgeTokens(config.dodgeTokens);
  setters.setShieldTokens(config.shieldTokens);
  setters.setOutmaneuver(config.outmaneuver);
  setters.setCover(config.cover);
  setters.setDugIn(config.dugIn);
  setters.setLowProfile(config.lowProfile);
  setters.setSuppressed(config.suppressed);
  setters.setCoverX(config.coverX);
  setters.setArmorX(config.armorX);
  setters.setImpervious(config.impervious);
  setters.setSuppressionTokens(config.suppressionTokens);
  setters.setDangerSenseX(config.dangerSenseX);
  setters.setUncannyLuckX(config.uncannyLuckX);
  setters.setBackup(config.backup);
}

function toCount(value: string): number {
  if (value === '') return 0;
  return Math.max(0, Math.floor(Number(value)) || 0);
}

export function configToUrlPoolState(config: PoolConfig): UrlPoolState {
  return {
    r: config.pool.red,
    b: config.pool.black,
    w: config.pool.white,
    surge: config.surge,
    crit: toCount(config.criticalX),
    sTok: toCount(config.surgeTokens),
    aim: toCount(config.aimTokens),
    obs: toCount(config.observeTokens),
    precise: toCount(config.preciseX),
    ram: toCount(config.ramX),
    sharp: toCount(config.sharpshooterX),
    pierce: toCount(config.pierceX),
    impact: toCount(config.impactX),
    cost: config.pointCost,
    dColor: config.defenseDieColor,
    dSurge: config.defenseSurge,
    dSurgeTok: toCount(config.defenseSurgeTokens),
    dodge: toCount(config.dodgeTokens),
    shield: toCount(config.shieldTokens),
    out: config.outmaneuver,
    cover: config.cover,
    dugIn: config.dugIn,
    lowProf: config.lowProfile,
    sup: config.suppressed,
    coverX: Math.min(2, toCount(config.coverX)),
    armor: toCount(config.armorX),
    imp: config.impervious,
    suppTok: toCount(config.suppressionTokens),
    danger: toCount(config.dangerSenseX),
    uLuck: toCount(config.uncannyLuckX),
    backup: config.backup,
  };
}
```

- [ ] **Step 4: Run tests**

Run: `npm run test -- src/poolConfigEditor.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/poolConfigEditor.ts src/poolConfigEditor.test.ts
git commit -m "feat: add pool config editor helpers"
```

---

### Task 2: `resolveCompareConfigs` (TDD)

**Files:**
- Create: `src/comparePoolState.ts`
- Create: `src/comparePoolState.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/comparePoolState.test.ts`:

```ts
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
    expect(result!.barePoolStateSource).toBe(configB);
  });

  it('uses cachedPoolB for configB and bare URL when activePool is A', () => {
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
    expect(result!.barePoolStateSource).toBe(configB);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/comparePoolState.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement**

Create `src/comparePoolState.ts`:

```ts
import type { PoolConfig } from './types';

export type ActivePool = 'A' | 'B';

export type CompareConfigResolution = {
  configA: PoolConfig;
  configB: PoolConfig;
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
  const { pinnedConfig, cachedPoolB, activePool, editorConfig, debouncedEditorConfig } =
    args;
  if (pinnedConfig === null) return null;

  const configA = pinnedConfig;
  const configB =
    activePool === 'B' ? editorConfig : (cachedPoolB ?? editorConfig);
  const debouncedConfigB =
    activePool === 'B'
      ? debouncedEditorConfig
      : (cachedPoolB ?? debouncedEditorConfig);
  const barePoolStateSource = configB;

  return { configA, configB, debouncedConfigB, barePoolStateSource };
}
```

- [ ] **Step 4: Run tests**

Run: `npm run test -- src/comparePoolState.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/comparePoolState.ts src/comparePoolState.test.ts
git commit -m "feat: add compare pool config resolution helper"
```

---

### Task 3: `ComparePoolBar` component (TDD)

**Files:**
- Create: `src/components/ComparePoolBar.tsx`
- Create: `src/components/ComparePoolBar.css`
- Create: `src/components/ComparePoolBar.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/ComparePoolBar.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ComparePoolBar } from './ComparePoolBar';

describe('ComparePoolBar', () => {
  it('renders start compare button in single mode', () => {
    const onStart = vi.fn();
    const { getByRole } = render(
      <ComparePoolBar mode="single" onStartCompare={onStart} startDisabled={false} />
    );
    fireEvent.click(getByRole('button', { name: /compare against this setup/i }));
    expect(onStart).toHaveBeenCalled();
  });

  it('renders label tabs and end compare in compare mode', () => {
    const onChange = vi.fn();
    const onEnd = vi.fn();
    const { getByRole, getByText } = render(
      <ComparePoolBar
        mode="compare"
        labelA="Heavy"
        labelB="Upgrade"
        activePool="B"
        onActivePoolChange={onChange}
        onEndCompare={onEnd}
      />
    );
    fireEvent.click(getByRole('tab', { name: 'Heavy' }));
    expect(onChange).toHaveBeenCalledWith('A');
    fireEvent.click(getByRole('button', { name: /exit compare/i }));
    expect(onEnd).toHaveBeenCalled();
    expect(getByText(/Editing: Upgrade/)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/components/ComparePoolBar.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement component and styles**

Create `src/components/ComparePoolBar.tsx`:

```tsx
import './ComparePoolBar.css';

const COLOR_A = '#2563eb';
const COLOR_B = '#f59e0b';

export type ComparePoolBarProps =
  | {
      mode: 'single';
      onStartCompare: () => void;
      startDisabled: boolean;
    }
  | {
      mode: 'compare';
      labelA: string;
      labelB: string;
      activePool: 'A' | 'B';
      onActivePoolChange: (pool: 'A' | 'B') => void;
      onEndCompare: () => void;
    };

function tabLabel(label: string, fallback: string): string {
  const trimmed = label.trim();
  return trimmed === '' ? fallback : trimmed;
}

export function ComparePoolBar(props: ComparePoolBarProps) {
  if (props.mode === 'single') {
    return (
      <div className="compare-bar compare-bar--single">
        <h2 className="compare-bar__heading">Compare pools</h2>
        <button
          type="button"
          className="compare-bar__start"
          onClick={props.onStartCompare}
          disabled={props.startDisabled}
        >
          Compare against this setup
        </button>
      </div>
    );
  }

  const displayA = tabLabel(props.labelA, 'A');
  const displayB = tabLabel(props.labelB, 'B');
  const activeLabel = props.activePool === 'A' ? displayA : displayB;
  const activeColor = props.activePool === 'A' ? COLOR_A : COLOR_B;

  return (
    <div className="compare-bar compare-bar--active">
      <div className="compare-bar__row">
        <div className="compare-bar__tabs" role="tablist" aria-label="Compare pools">
          <button
            type="button"
            role="tab"
            aria-selected={props.activePool === 'A'}
            className={
              'compare-bar__tab' +
              (props.activePool === 'A' ? ' compare-bar__tab--active' : '')
            }
            style={
              props.activePool === 'A'
                ? { backgroundColor: COLOR_A, borderColor: COLOR_A }
                : { color: COLOR_A, borderColor: COLOR_A }
            }
            title={displayA}
            onClick={() => props.onActivePoolChange('A')}
          >
            {displayA}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={props.activePool === 'B'}
            className={
              'compare-bar__tab' +
              (props.activePool === 'B' ? ' compare-bar__tab--active' : '')
            }
            style={
              props.activePool === 'B'
                ? { backgroundColor: COLOR_B, borderColor: COLOR_B }
                : { color: COLOR_B, borderColor: COLOR_B }
            }
            title={displayB}
            onClick={() => props.onActivePoolChange('B')}
          >
            {displayB}
          </button>
        </div>
        <button
          type="button"
          className="compare-bar__end"
          onClick={props.onEndCompare}
          aria-label="Exit compare mode"
        >
          End compare
        </button>
      </div>
      <p className="compare-bar__editing" style={{ color: activeColor }}>
        <span className="compare-bar__editing-marker" style={{ color: activeColor }}>
          ■
        </span>{' '}
        Editing: {activeLabel}
      </p>
    </div>
  );
}
```

Create `src/components/ComparePoolBar.css` with truncated tabs (`max-width`, `text-overflow: ellipsis`, `overflow: hidden`, `white-space: nowrap`), flex row layout, and ghost/filled tab styles.

- [ ] **Step 4: Run tests**

Run: `npm run test -- src/components/ComparePoolBar.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ComparePoolBar.tsx src/components/ComparePoolBar.css src/components/ComparePoolBar.test.tsx
git commit -m "feat: add ComparePoolBar component"
```

---

### Task 4: `PoolSnapshotCard` active state (TDD)

**Files:**
- Modify: `src/components/PoolSnapshotCard.tsx`
- Modify: `src/components/PoolSnapshotCard.css`
- Modify: `src/components/PoolSnapshotCard.test.tsx`

- [ ] **Step 1: Write failing tests**

Add to `PoolSnapshotCard.test.tsx`:

```tsx
it('shows Editing pill when active', () => {
  const { getByText } = render(
    <PoolSnapshotCard
      config={DEFAULT_POOL_CONFIG}
      poolId="B"
      label="Stock"
      onLabelChange={() => {}}
      accentColor="#f59e0b"
      isActive
    />
  );
  expect(getByText('Editing')).toBeTruthy();
});

it('calls onSelect when card clicked outside label input', () => {
  const onSelect = vi.fn();
  const { container } = render(
    <PoolSnapshotCard
      config={DEFAULT_POOL_CONFIG}
      poolId="A"
      label="Heavy"
      onLabelChange={() => {}}
      accentColor="#2563eb"
      onSelect={onSelect}
    />
  );
  fireEvent.click(container.querySelector('.pool-snapshot')!);
  expect(onSelect).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/components/PoolSnapshotCard.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement**

Add optional props `isActive?: boolean`, `onSelect?: () => void`.

- Add class `pool-snapshot--active` / `pool-snapshot--inactive` on `<article>`.
- Render `<span className="pool-snapshot__editing-pill">Editing</span>` in header when `isActive`.
- `onClick` on article: if target is not inside label input, call `onSelect`.
- CSS: active = tinted background + thicker border; inactive = reduced opacity; pill = small uppercase badge.

- [ ] **Step 4: Run tests**

Run: `npm run test -- src/components/PoolSnapshotCard.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/PoolSnapshotCard.tsx src/components/PoolSnapshotCard.css src/components/PoolSnapshotCard.test.tsx
git commit -m "feat: add active editing state to PoolSnapshotCard"
```

---

### Task 5: Wire `ComparisonResults` active pool

**Files:**
- Modify: `src/components/ComparisonResults.tsx`
- Modify: `src/components/ComparisonResults.test.tsx`

- [ ] **Step 1: Extend props**

Add:

```ts
activePool: 'A' | 'B';
onSelectPoolA: () => void;
onSelectPoolB: () => void;
```

Pass to cards:

```tsx
<PoolSnapshotCard ... isActive={activePool === 'A'} onSelect={onSelectPoolA} />
<PoolSnapshotCard ... isActive={activePool === 'B'} onSelect={onSelectPoolB} />
```

- [ ] **Step 2: Update test**

Pass `activePool="B"`, stub select handlers; assert `Editing` appears once on B card.

- [ ] **Step 3: Run tests**

Run: `npm run test -- src/components/ComparisonResults.test.tsx`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/ComparisonResults.tsx src/components/ComparisonResults.test.tsx
git commit -m "feat: pass active pool state to comparison snapshots"
```

---

### Task 6: `App.tsx` compare state and handlers

**Files:**
- Modify: `src/App.tsx`

This is the largest task. Work in sub-steps within one commit or split into two commits (state/handlers, then URL).

- [ ] **Step 1: Add imports**

```ts
import { ComparePoolBar } from './components/ComparePoolBar';
import {
  readConfigFromEditor,
  applyConfigToEditor,
  configToUrlPoolState,
  type PoolEditorSetters,
} from './poolConfigEditor';
import { resolveCompareConfigs } from './comparePoolState';
import type { ActivePool } from './comparePoolState';
```

- [ ] **Step 2: Add state**

After `pinnedConfig` init:

```ts
const [cachedPoolB, setCachedPoolB] = useState<PoolConfig | null>(() =>
  initialFromUrl?.cmp ? poolStateToConfig(initialFromUrl) : null
);
const [activePool, setActivePool] = useState<ActivePool>('B');
```

Note: `poolStateToConfig(initialFromUrl)` uses bare URL keys as B when loading compare links.

- [ ] **Step 3: Build `editorConfig` (immediate, not debounced)**

```ts
const editorConfig = useMemo(
  () => readConfigFromEditor(simulationInputs),
  [simulationInputs]
);
```

Keep existing `liveConfig` as debounced version of `editorConfig` (rename mentally: `debouncedEditorConfig`).

- [ ] **Step 4: Resolve compare configs**

```ts
const compareResolution = useMemo(
  () =>
    resolveCompareConfigs({
      pinnedConfig,
      cachedPoolB,
      activePool,
      editorConfig,
      debouncedEditorConfig: liveConfig,
    }),
  [pinnedConfig, cachedPoolB, activePool, editorConfig, liveConfig]
);

const configA = compareResolution?.configA ?? null;
const configB = compareResolution?.configB ?? liveConfig;
const debouncedConfigB = compareResolution?.debouncedConfigB ?? liveConfig;
```

- [ ] **Step 5: Results from resolved configs**

Replace `pinnedResults` / compare results wiring:

```ts
const compareResultsA = useMemo(
  () => (configA ? computePoolResults(configA) : null),
  [configA]
);
const compareResultsB = useMemo(
  () => (pinnedConfig ? computePoolResults(debouncedConfigB) : null),
  [pinnedConfig, debouncedConfigB]
);
```

Pass `configA!`, `configB`, `compareResultsA`, `compareResultsB` to `ComparisonResults`.

- [ ] **Step 6: Pool editor setters object**

Build once:

```ts
const poolEditorSetters: PoolEditorSetters = useMemo(
  () => ({
    setPool,
    setSurge,
    setCriticalX,
    // ... all setters
  }),
  [] // stable setState refs
);
```

- [ ] **Step 7: Handlers**

```ts
const handleStartCompare = () => {
  const snapshot = readConfigFromEditor(simulationInputs);
  setPinnedConfig(snapshot);
  setCachedPoolB(snapshot);
  setActivePool('B');
};

const handleEndCompare = () => {
  if (activePool === 'A' && cachedPoolB) {
    applyConfigToEditor(cachedPoolB, poolEditorSetters);
  }
  setPinnedConfig(null);
  setCachedPoolB(null);
};

const handleActivePoolChange = (pool: ActivePool) => {
  if (pool === activePool || pinnedConfig === null) return;
  const outgoing = readConfigFromEditor(simulationInputs);
  if (activePool === 'B') {
    setCachedPoolB(outgoing);
  } else {
    setPinnedConfig(outgoing);
  }
  const incoming =
    pool === 'B' ? (cachedPoolB ?? outgoing) : (pinnedConfig ?? outgoing);
  applyConfigToEditor(incoming, poolEditorSetters);
  setActivePool(pool);
};
```

Fix stale closure: use functional updates or read latest `cachedPoolB`/`pinnedConfig` when switching — e.g. compute incoming after persisting outgoing in one batch:

```ts
const handleActivePoolChange = (pool: ActivePool) => {
  if (pool === activePool || !pinnedConfig) return;
  const outgoing = readConfigFromEditor(simulationInputs);
  let nextPinned = pinnedConfig;
  let nextCached = cachedPoolB;
  if (activePool === 'B') nextCached = outgoing;
  else nextPinned = outgoing;
  const incoming = pool === 'B' ? (nextCached ?? outgoing) : nextPinned;
  applyConfigToEditor(incoming, poolEditorSetters);
  setPinnedConfig(nextPinned);
  setCachedPoolB(nextCached);
  setActivePool(pool);
};
```

- [ ] **Step 8: Sync `pinnedConfig` while editing A**

```ts
useEffect(() => {
  if (pinnedConfig === null || activePool !== 'A') return;
  setPinnedConfig(readConfigFromEditor(simulationInputs));
}, [simulationInputs, pinnedConfig, activePool]);
```

Careful: this can loop if not guarded — only depend on `simulationInputs` and compare `activePool === 'A'`. Do **not** include `pinnedConfig` in deps; use functional update or compare JSON.

Preferred pattern:

```ts
useEffect(() => {
  if (pinnedConfig === null || activePool !== 'A') return;
  setPinnedConfig(readConfigFromEditor(simulationInputs));
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: sync A from editor
}, [simulationInputs, activePool, pinnedConfig !== null]);
```

- [ ] **Step 9: Sync `cachedPoolB` while editing B**

```ts
useEffect(() => {
  if (pinnedConfig === null || activePool !== 'B') return;
  setCachedPoolB(readConfigFromEditor(simulationInputs));
}, [simulationInputs, activePool, pinnedConfig]);
```

- [ ] **Step 10: Update `handleReset`**

Add `setCachedPoolB(null)` and `setActivePool('B')`.

- [ ] **Step 11: Remove header Pin/Clear button**

Delete the second button in `app__header-actions` (lines ~571–583).

- [ ] **Step 12: Render `ComparePoolBar` at top of `app__pool`**

```tsx
<section className="app__pool">
  {pinnedConfig ? (
    <ComparePoolBar
      mode="compare"
      labelA={labelA}
      labelB={labelB}
      activePool={activePool}
      onActivePoolChange={handleActivePoolChange}
      onEndCompare={handleEndCompare}
    />
  ) : (
    <ComparePoolBar
      mode="single"
      onStartCompare={handleStartCompare}
      startDisabled={totalDice === 0}
    />
  )}
  ...
</section>
```

- [ ] **Step 13: Update `ComparisonResults` props**

Pass `activePool`, `onSelectPoolA={() => handleActivePoolChange('A')}`, `onSelectPoolB={() => handleActivePoolChange('B')}`.

- [ ] **Step 14: Update `ShareModal`**

Use resolved `configB` / `debouncedConfigB` for `live.config`, not raw `liveConfig` when comparing.

- [ ] **Step 15: Run full test suite**

Run: `npm run test`
Expected: PASS (fix any broken tests)

- [ ] **Step 16: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire editable compare pools with tab switching"
```

---

### Task 7: URL bare-key gating (TDD)

**Files:**
- Modify: `src/App.tsx` (`urlState` useMemo)
- Modify: `src/urlState.test.ts`

- [ ] **Step 1: Write failing test**

Add to `src/urlState.test.ts` — test the pure helper if extracted, or document manual check. Prefer extracting:

Create `src/buildAppUrlState.ts`:

```ts
import type { UrlState } from './urlState';
import { DEFAULT_URL_STATE_POOL } from './urlState';
import { configToUrlPoolState } from './poolConfigEditor';
import type { PoolConfig } from './types';
import type { PoolEditorInputs } from './poolConfigEditor';

export function buildAppUrlState(args: {
  debouncedInputs: PoolEditorInputs;
  pinnedConfig: PoolConfig | null;
  cachedPoolB: PoolConfig | null;
  activePool: 'A' | 'B';
  labelA: string;
  labelB: string;
}): UrlState {
  const bareSource =
    args.pinnedConfig !== null && args.activePool === 'A' && args.cachedPoolB
      ? args.cachedPoolB
      : args.debouncedInputs;
  const bare = configToUrlPoolState(bareSource);
  return {
    ...bare,
    cmp: args.pinnedConfig !== null,
    la: args.labelA,
    lb: args.labelB,
    a: args.pinnedConfig
      ? configToUrlPoolState(args.pinnedConfig)
      : { ...DEFAULT_URL_STATE_POOL },
  };
}
```

Test in `src/buildAppUrlState.test.ts`:

```ts
it('keeps bare keys from cached B when editing A', () => {
  const configB = { ...DEFAULT_POOL_CONFIG, pool: { red: 1, black: 0, white: 0 } };
  const configA = { ...DEFAULT_POOL_CONFIG, pool: { red: 5, black: 0, white: 0 } };
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
```

- [ ] **Step 2: Run test — FAIL**

- [ ] **Step 3: Implement and replace inline `urlState` useMemo in App**

Replace the large inline mapping with `buildAppUrlState({ debouncedInputs, pinnedConfig, cachedPoolB, activePool, labelA, labelB })`.

- [ ] **Step 4: Run tests**

Run: `npm run test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/buildAppUrlState.ts src/buildAppUrlState.test.ts src/App.tsx
git commit -m "fix: gate URL bare keys to cached pool B when editing A"
```

---

### Task 8: Optional config column accent + lint

**Files:**
- Modify: `src/App.css`
- Modify: `src/App.tsx`

- [ ] **Step 1: Add class on `app__pool` when comparing**

```tsx
<section
  className={
    'app__pool' +
    (pinnedConfig ? ' app__pool--compare' : '') +
    (pinnedConfig ? ` app__pool--editing-${activePool.toLowerCase()}` : '')
  }
  style={
    pinnedConfig
      ? { borderLeftColor: activePool === 'A' ? '#2563eb' : '#f59e0b' }
      : undefined
  }
>
```

- [ ] **Step 2: CSS**

```css
.app__pool--compare {
  border-left: 3px solid transparent;
  padding-left: 0.5rem;
}
```

- [ ] **Step 3: Run lint and tests**

Run: `npm run lint && npm run test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/App.css src/App.tsx
git commit -m "style: accent border on config column for active compare pool"
```

---

### Task 9: Final verification

- [ ] **Step 1: Run full suite**

Run: `npm run test && npm run lint && npm run build`
Expected: all pass (chunk size warning OK)

- [ ] **Step 2: Manual smoke test**

1. Add dice → **Compare against this setup** appears in pool column (not header).
2. Tabs show labels; B active; edit B → B snapshot updates.
3. Switch to A tab → edit A → A snapshot updates; B snapshot unchanged.
4. Copy URL while on A tab → reload → both pools correct.
5. **End compare** on A tab → editor shows B values.
6. Click inactive snapshot card → switches tab.

- [ ] **Step 3: Final commit if any fixups**

```bash
git commit -m "chore: fixups from compare editable pools verification"
```

---

## Execution notes

- Remove duplicate `configToPoolState` from `App.tsx` once `configToUrlPoolState` is wired (keep `poolStateToConfig` for URL parse init).
- Guard `useEffect` A-sync against infinite loops — if tests flap, switch to updating `pinnedConfig` only inside `handleActivePoolChange` and input `onChange` wrappers while on A (avoid effect).
- `handleActivePoolChange` must use latest pinned/cached values in one synchronous block (see Step 7) to avoid stale state on rapid tab clicks.
