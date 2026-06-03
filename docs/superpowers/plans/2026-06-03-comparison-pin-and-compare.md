# A vs B Pool Comparison (Pin & Compare) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users pin the current pool as A, keep editing the live pool as B, and see a full A-vs-B comparison (overlaid Attack + Wounds distributions, A/B/Δ summary stats, side-by-side cumulative tables) that is shareable via URL.

**Architecture:** Extract the existing inline pool inputs in `App.tsx` into a reusable `PoolConfig` type plus a pure `computePoolResults(config)` helper that wraps the unchanged `calculateAttackPool`/`calculateWounds`. Compare mode keeps one editor (live = B) and a snapshot (`pinnedConfig` = A); a new `ComparisonResults` component renders both. URL serialization reuses the existing single-pool fragment logic with an `a.`-prefixed key set for pool A plus a `cmp` flag and labels.

**Tech Stack:** React 19, TypeScript 5.9, Vite 6, Vitest 4, recharts 3.

---

Spec: `docs/superpowers/specs/2026-06-03-comparison-pin-and-compare-design.md`

## File Structure

- Create `src/poolResults.ts` — `PoolConfig` consumer: `computePoolResults(config) → { results, woundsResults }`.
- Modify `src/types.ts` — add `PoolConfig` interface.
- Modify `src/components/DistributionChart.tsx` — optional second bar series + legend.
- Modify `src/components/CumulativeTable.tsx` — optional secondary (B) column.
- Create `src/components/ComparisonResults.tsx` (+ `.css`) — delta table, overlaid charts, side-by-side cumulative.
- Modify `src/urlState.ts` — `a.`-prefixed pool A, `cmp`, `la`, `lb`.
- Modify `src/App.tsx` — `pinnedConfig`/label state, Pin/Clear controls, render `ComparisonResults`, URL wiring, reset wiring.

---

### Task 1: `PoolConfig` type

**Files:**

- Modify: `src/types.ts`

- [ ] **Step 1: Add the `PoolConfig` interface to `src/types.ts`**

Append to the end of `src/types.ts`:

```ts
/**
 * All inputs that define one attack+defense configuration.
 * Numeric keyword/token fields are kept as the raw string the inputs use
 * ('' means zero/unset); computePoolResults parses them.
 */
export interface PoolConfig {
  pool: AttackPool;
  surge: SurgeConversion;
  criticalX: string;
  surgeTokens: string;
  aimTokens: string;
  observeTokens: string;
  preciseX: string;
  ramX: string;
  sharpshooterX: string;
  pierceX: string;
  impactX: string;
  pointCost: string;
  defenseDieColor: DefenseDieColor;
  defenseSurge: DefenseSurgeConversion;
  defenseSurgeTokens: string;
  dodgeTokens: string;
  shieldTokens: string;
  outmaneuver: boolean;
  cover: CoverLevel;
  dugIn: boolean;
  lowProfile: boolean;
  suppressed: boolean;
  coverX: string;
  armorX: string;
  impervious: boolean;
  suppressionTokens: string;
  dangerSenseX: string;
  uncannyLuckX: string;
  backup: boolean;
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: add PoolConfig type"
```

---

### Task 2: `computePoolResults` helper (TDD)

**Files:**

- Create: `src/poolResults.ts`
- Test: `src/poolResults.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/poolResults.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { computePoolResults, DEFAULT_POOL_CONFIG } from './poolResults';
import { calculateAttackPool, calculateWounds } from './engine/probability';

describe('computePoolResults', () => {
  it('matches calling the engine functions directly', () => {
    const config = {
      ...DEFAULT_POOL_CONFIG,
      pool: { red: 3, black: 1, white: 0 },
      surge: 'hit' as const,
      aimTokens: '2',
      criticalX: '1',
      pierceX: '1',
      cover: 'light' as const,
      pointCost: '47',
    };

    const expectedAttack = calculateAttackPool(
      config.pool,
      'hit',
      1, // criticalX
      0, // surgeTokens
      2, // aimTokens
      0, // observeTokens
      0, // preciseX
      0 // ramX
    );
    const expectedWounds = calculateWounds(
      expectedAttack,
      'red',
      'none',
      0,
      0,
      false,
      0,
      'light',
      false,
      false,
      0,
      false,
      0,
      false,
      0,
      0,
      1, // pierceX
      false,
      0,
      0,
      0
    );

    const { results, woundsResults } = computePoolResults(config);
    expect(results.expectedTotal).toBeCloseTo(expectedAttack.expectedTotal, 10);
    expect(woundsResults.expectedWounds).toBeCloseTo(
      expectedWounds.expectedWounds,
      10
    );
  });

  it('treats empty-string numeric fields as zero / undefined criticalX', () => {
    const { results } = computePoolResults({
      ...DEFAULT_POOL_CONFIG,
      pool: { red: 1, black: 0, white: 0 },
    });
    expect(results.expectedTotal).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/poolResults.test.ts`
Expected: FAIL — cannot import `computePoolResults` / `DEFAULT_POOL_CONFIG` (module does not exist).

- [ ] **Step 3: Write the implementation**

Create `src/poolResults.ts`:

```ts
import type { PoolConfig, AttackResults, WoundsResults } from './types';
import { calculateAttackPool, calculateWounds } from './engine/probability';

export const DEFAULT_POOL_CONFIG: PoolConfig = {
  pool: { red: 0, black: 0, white: 0 },
  surge: 'none',
  criticalX: '',
  surgeTokens: '',
  aimTokens: '',
  observeTokens: '',
  preciseX: '',
  ramX: '',
  sharpshooterX: '',
  pierceX: '',
  impactX: '',
  pointCost: '',
  defenseDieColor: 'red',
  defenseSurge: 'none',
  defenseSurgeTokens: '',
  dodgeTokens: '',
  shieldTokens: '',
  outmaneuver: false,
  cover: 'none',
  dugIn: false,
  lowProfile: false,
  suppressed: false,
  coverX: '',
  armorX: '',
  impervious: false,
  suppressionTokens: '',
  dangerSenseX: '',
  uncannyLuckX: '',
  backup: false,
};

function toCount(value: string): number {
  if (value === '') return 0;
  return Math.max(0, Math.floor(Number(value)) || 0);
}

function toCoverX(value: string): number {
  return Math.min(2, toCount(value));
}

export interface PoolResults {
  results: AttackResults;
  woundsResults: WoundsResults;
}

export function computePoolResults(config: PoolConfig): PoolResults {
  const criticalX =
    config.criticalX === '' ? undefined : toCount(config.criticalX);

  const results = calculateAttackPool(
    config.pool,
    config.surge,
    criticalX,
    toCount(config.surgeTokens),
    toCount(config.aimTokens),
    toCount(config.observeTokens),
    toCount(config.preciseX),
    toCount(config.ramX)
  );

  const woundsResults = calculateWounds(
    results,
    config.defenseDieColor,
    config.defenseSurge,
    toCount(config.dodgeTokens),
    toCount(config.shieldTokens),
    config.outmaneuver,
    toCount(config.defenseSurgeTokens),
    config.cover,
    config.lowProfile,
    config.suppressed,
    toCoverX(config.coverX),
    config.dugIn,
    toCount(config.sharpshooterX),
    config.backup,
    toCount(config.armorX),
    toCount(config.impactX),
    toCount(config.pierceX),
    config.impervious,
    toCount(config.suppressionTokens),
    toCount(config.dangerSenseX),
    toCount(config.uncannyLuckX)
  );

  return { results, woundsResults };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/poolResults.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/poolResults.ts src/poolResults.test.ts
git commit -m "feat: add computePoolResults helper and DEFAULT_POOL_CONFIG"
```

---

### Task 3: Refactor `App.tsx` to use `PoolConfig` + `computePoolResults`

This replaces the inline `*Num` parsing and the two `useMemo` calculate calls with the shared helper, with **no behavior change**. It de-duplicates parsing now reused by both pools.

**Files:**

- Modify: `src/App.tsx`

- [ ] **Step 1: Build a `liveConfig` from the debounced inputs**

In `src/App.tsx`, after the `debouncedInputs` definition (currently around line 258) and before the `urlState` memo, add:

```ts
import type { PoolConfig } from './types';
import { computePoolResults } from './poolResults';

// ...inside App, after `const debouncedInputs = useDebouncedValue(simulationInputs);`
const liveConfig = useMemo<PoolConfig>(
  () => ({
    pool: debouncedInputs.pool,
    surge: debouncedInputs.surge,
    criticalX: debouncedInputs.criticalX,
    surgeTokens: debouncedInputs.surgeTokens,
    aimTokens: debouncedInputs.aimTokens,
    observeTokens: debouncedInputs.observeTokens,
    preciseX: debouncedInputs.preciseX,
    ramX: debouncedInputs.ramX,
    sharpshooterX: debouncedInputs.sharpshooterX,
    pierceX: debouncedInputs.pierceX,
    impactX: debouncedInputs.impactX,
    pointCost: debouncedInputs.pointCost,
    defenseDieColor: debouncedInputs.defenseDieColor,
    defenseSurge: debouncedInputs.defenseSurge,
    defenseSurgeTokens: debouncedInputs.defenseSurgeTokens,
    dodgeTokens: debouncedInputs.dodgeTokens,
    shieldTokens: debouncedInputs.shieldTokens,
    outmaneuver: debouncedInputs.outmaneuver,
    cover: debouncedInputs.cover,
    dugIn: debouncedInputs.dugIn,
    lowProfile: debouncedInputs.lowProfile,
    suppressed: debouncedInputs.suppressed,
    coverX: debouncedInputs.coverX,
    armorX: debouncedInputs.armorX,
    impervious: debouncedInputs.impervious,
    suppressionTokens: debouncedInputs.suppressionTokens,
    dangerSenseX: debouncedInputs.dangerSenseX,
    uncannyLuckX: debouncedInputs.uncannyLuckX,
    backup: debouncedInputs.backup,
  }),
  [debouncedInputs]
);
```

- [ ] **Step 2: Replace the `results`/`woundsResults` memos and delete the `*Num` locals**

Delete the block of `const criticalXNum = …` through `const impactXNum = …` (currently lines ~366–439) AND the existing `results`/`woundsResults` `useMemo` blocks (currently lines ~440–512). Replace all of it with:

```ts
const { results, woundsResults } = useMemo(
  () => computePoolResults(liveConfig),
  [liveConfig]
);
```

- [ ] **Step 3: Keep `urlState` working**

The `urlState` memo (lines ~260–355) still reads `debouncedInputs.*` directly and is unaffected by this refactor — leave it as-is for now (Task 7 extends it).

- [ ] **Step 4: Run the full test suite + type-check + lint**

Run: `npm run test && npx tsc -b && npm run lint`
Expected: all pass; the app's results render identically to before.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "refactor: compute live results via computePoolResults"
```

---

### Task 4: `DistributionChart` optional second series (TDD-lite via render test)

**Files:**

- Modify: `src/components/DistributionChart.tsx`
- Test: `src/components/DistributionChart.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/DistributionChart.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { DistributionChart } from './DistributionChart';

describe('DistributionChart', () => {
  it('renders a legend with both series labels when a secondary distribution is given', () => {
    const { container, getByText } = render(
      <DistributionChart
        distribution={[
          { total: 0, probability: 0.5 },
          { total: 1, probability: 0.5 },
        ]}
        secondaryDistribution={[
          { total: 1, probability: 0.4 },
          { total: 2, probability: 0.6 },
        ]}
        seriesLabel="A"
        secondaryLabel="B"
      />
    );
    expect(getByText('A')).toBeTruthy();
    expect(getByText('B')).toBeTruthy();
    expect(container).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/DistributionChart.test.tsx`
Expected: FAIL — `secondaryDistribution` prop not supported, no "B" text.

- [ ] **Step 3: Implement the second series**

Replace the contents of `src/components/DistributionChart.tsx` with:

```tsx
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

type Point = { total: number; probability: number };

interface DistributionChartProps {
  distribution: Point[];
  title?: string;
  xAxisLabel?: string;
  barColor?: string;
  secondaryDistribution?: Point[];
  secondaryColor?: string;
  seriesLabel?: string;
  secondaryLabel?: string;
}

export function DistributionChart({
  distribution,
  title = 'Probability Distribution',
  xAxisLabel = 'Total Successes',
  barColor = '#3b82f6',
  secondaryDistribution,
  secondaryColor = '#f59e0b',
  seriesLabel = 'A',
  secondaryLabel = 'B',
}: DistributionChartProps) {
  const hasSecondary = secondaryDistribution !== undefined;

  const percentOf = (points: Point[] | undefined, total: number) => {
    const found = points?.find((entry) => entry.total === total);
    return found ? +(found.probability * 100).toFixed(1) : 0;
  };

  const totals = Array.from(
    new Set([
      ...distribution.map((entry) => entry.total),
      ...(secondaryDistribution ?? []).map((entry) => entry.total),
    ])
  ).sort((a, b) => a - b);

  const data = totals.map((total) => ({
    total,
    primary: percentOf(distribution, total),
    secondary: percentOf(secondaryDistribution, total),
  }));

  return (
    <div>
      <h3>{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 5, right: 20, bottom: 25, left: 0 }}
        >
          <XAxis
            dataKey="total"
            label={{ value: xAxisLabel, position: 'insideBottom', offset: -15 }}
          />
          <YAxis
            tickFormatter={(value: number) => `${value}%`}
            label={{ value: 'Probability', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip formatter={(value) => [`${value}%`, 'Probability']} />
          {hasSecondary && <Legend verticalAlign="top" height={24} />}
          <Bar
            dataKey="primary"
            name={seriesLabel}
            radius={[4, 4, 0, 0]}
            fill={barColor}
          >
            {!hasSecondary &&
              data.map((_, index) => <Cell key={index} fill={barColor} />)}
          </Bar>
          {hasSecondary && (
            <Bar
              dataKey="secondary"
              name={secondaryLabel}
              radius={[4, 4, 0, 0]}
              fill={secondaryColor}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

Note: when there is no secondary series, behavior matches the original (single blue bar via `Cell`s; no legend).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/DistributionChart.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/DistributionChart.tsx src/components/DistributionChart.test.tsx
git commit -m "feat: support overlaid second series in DistributionChart"
```

---

### Task 5: `CumulativeTable` optional secondary column (TDD)

**Files:**

- Modify: `src/components/CumulativeTable.tsx`
- Test: `src/components/CumulativeTable.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/CumulativeTable.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { CumulativeTable } from './CumulativeTable';

describe('CumulativeTable', () => {
  it('renders an A and B column when secondary is provided', () => {
    const { getByText } = render(
      <CumulativeTable
        cumulative={[{ total: 1, probability: 0.8 }]}
        secondary={[{ total: 1, probability: 0.5 }]}
        primaryLabel="A"
        secondaryLabel="B"
      />
    );
    expect(getByText('A')).toBeTruthy();
    expect(getByText('B')).toBeTruthy();
    expect(getByText('80.0%')).toBeTruthy();
    expect(getByText('50.0%')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/CumulativeTable.test.tsx`
Expected: FAIL — `secondary` prop unsupported.

- [ ] **Step 3: Implement the secondary column**

Replace the contents of `src/components/CumulativeTable.tsx` with:

```tsx
import './CumulativeTable.css';

type Row = { total: number; probability: number };

interface CumulativeTableProps {
  cumulative: Row[];
  title?: string;
  secondary?: Row[];
  primaryLabel?: string;
  secondaryLabel?: string;
}

export function CumulativeTable({
  cumulative,
  title = 'Cumulative Probabilities',
  secondary,
  primaryLabel = 'A',
  secondaryLabel = 'B',
}: CumulativeTableProps) {
  const hasSecondary = secondary !== undefined;
  const secondaryFor = (total: number) =>
    secondary?.find((row) => row.total === total)?.probability ?? 0;

  return (
    <div>
      <h3>{title}</h3>
      <table className="cumulative-table">
        <thead>
          <tr>
            <th>At Least</th>
            <th>{hasSecondary ? primaryLabel : 'Probability'}</th>
            {hasSecondary && <th>{secondaryLabel}</th>}
          </tr>
        </thead>
        <tbody>
          {cumulative.map((row) => (
            <tr key={row.total}>
              <td>{row.total}</td>
              <td>{(row.probability * 100).toFixed(1)}%</td>
              {hasSecondary && (
                <td>{(secondaryFor(row.total) * 100).toFixed(1)}%</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/CumulativeTable.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/CumulativeTable.tsx src/components/CumulativeTable.test.tsx
git commit -m "feat: support secondary column in CumulativeTable"
```

---

### Task 6: Delta computation helper (TDD)

**Files:**

- Create: `src/comparisonDeltas.ts`
- Test: `src/comparisonDeltas.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/comparisonDeltas.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildDeltaRows } from './comparisonDeltas';
import type { PoolResults } from './poolResults';

function fakeResults(total: number, wounds: number): PoolResults {
  return {
    results: {
      expectedHits: total / 2,
      expectedCrits: total / 2,
      expectedTotal: total,
      distribution: [],
      distributionByHitsCrits: [],
      cumulative: [],
    },
    woundsResults: {
      expectedWounds: wounds,
      distribution: [],
      cumulative: [],
    },
  };
}

describe('buildDeltaRows', () => {
  it('marks higher avg total for B as better (positive direction)', () => {
    const rows = buildDeltaRows(fakeResults(2, 1), fakeResults(3, 1.5), '', '');
    const total = rows.find((row) => row.label === 'Avg total')!;
    expect(total.a).toBeCloseTo(2);
    expect(total.b).toBeCloseTo(3);
    expect(total.delta).toBeCloseTo(1);
    expect(total.betterIsHigher).toBe(true);
    expect(total.bIsBetter).toBe(true);
  });

  it('omits efficiency rows when neither pool has a cost', () => {
    const rows = buildDeltaRows(fakeResults(2, 1), fakeResults(3, 1.5), '', '');
    expect(rows.some((row) => row.label === 'Pts/wound')).toBe(false);
  });

  it('includes efficiency rows and treats lower pts/wound as better', () => {
    const rows = buildDeltaRows(
      fakeResults(2, 1),
      fakeResults(3, 2),
      '40',
      '40'
    );
    const ptsWound = rows.find((row) => row.label === 'Pts/wound')!;
    expect(ptsWound.a).toBeCloseTo(40);
    expect(ptsWound.b).toBeCloseTo(20);
    expect(ptsWound.betterIsHigher).toBe(false);
    expect(ptsWound.bIsBetter).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/comparisonDeltas.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/comparisonDeltas.ts`:

```ts
import type { PoolResults } from './poolResults';

export interface DeltaRow {
  label: string;
  a: number | null;
  b: number | null;
  delta: number | null;
  betterIsHigher: boolean;
  bIsBetter: boolean | null;
}

function cost(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function ratio(costValue: number, denominator: number): number | null {
  if (costValue <= 0 || denominator <= 0) return null;
  return costValue / denominator;
}

export function buildDeltaRows(
  a: PoolResults,
  b: PoolResults,
  costA: string,
  costB: string
): DeltaRow[] {
  const rows: DeltaRow[] = [];

  const push = (
    label: string,
    aValue: number | null,
    bValue: number | null,
    betterIsHigher: boolean
  ) => {
    const delta = aValue !== null && bValue !== null ? bValue - aValue : null;
    let bIsBetter: boolean | null = null;
    if (delta !== null && delta !== 0) {
      bIsBetter = betterIsHigher ? delta > 0 : delta < 0;
    }
    rows.push({
      label,
      a: aValue,
      b: bValue,
      delta,
      betterIsHigher,
      bIsBetter,
    });
  };

  push('Avg hits', a.results.expectedHits, b.results.expectedHits, true);
  push('Avg crits', a.results.expectedCrits, b.results.expectedCrits, true);
  push('Avg total', a.results.expectedTotal, b.results.expectedTotal, true);

  const costAValue = cost(costA);
  const costBValue = cost(costB);

  if (costAValue > 0 || costBValue > 0) {
    push(
      'Pts/success',
      ratio(costAValue, a.results.expectedTotal),
      ratio(costBValue, b.results.expectedTotal),
      false
    );
  }

  push(
    'Avg wounds',
    a.woundsResults.expectedWounds,
    b.woundsResults.expectedWounds,
    true
  );

  if (costAValue > 0 || costBValue > 0) {
    push(
      'Pts/wound',
      ratio(costAValue, a.woundsResults.expectedWounds),
      ratio(costBValue, b.woundsResults.expectedWounds),
      false
    );
  }

  return rows;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/comparisonDeltas.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/comparisonDeltas.ts src/comparisonDeltas.test.ts
git commit -m "feat: add comparison delta-row builder"
```

---

### Task 7: `ComparisonResults` component

**Files:**

- Create: `src/components/ComparisonResults.tsx`
- Create: `src/components/ComparisonResults.css`
- Test: `src/components/ComparisonResults.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/ComparisonResults.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ComparisonResults } from './ComparisonResults';
import { computePoolResults, DEFAULT_POOL_CONFIG } from '../poolResults';

describe('ComparisonResults', () => {
  it('renders the delta table with both labels and an Avg total row', () => {
    const a = computePoolResults({
      ...DEFAULT_POOL_CONFIG,
      pool: { red: 3, black: 0, white: 0 },
    });
    const b = computePoolResults({
      ...DEFAULT_POOL_CONFIG,
      pool: { red: 1, black: 0, white: 0 },
    });
    const { getAllByText, getByText } = render(
      <ComparisonResults
        resultsA={a}
        resultsB={b}
        costA=""
        costB=""
        labelA="DLT"
        labelB="Stock"
      />
    );
    expect(getAllByText('DLT').length).toBeGreaterThan(0);
    expect(getAllByText('Stock').length).toBeGreaterThan(0);
    expect(getByText('Avg total')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ComparisonResults.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the component**

Create `src/components/ComparisonResults.css`:

```css
.comparison__delta {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
  font-size: 0.95rem;
}

.comparison__delta th,
.comparison__delta td {
  text-align: left;
  padding: 0.35rem 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.comparison__delta td.is-number {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.comparison__delta .delta-better {
  color: #16a34a;
}

.comparison__delta .delta-worse {
  color: #dc2626;
}

.comparison__cumulatives {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.comparison__cumulatives > div {
  flex: 1 1 220px;
}
```

Create `src/components/ComparisonResults.tsx`:

```tsx
import type { PoolResults } from '../poolResults';
import { buildDeltaRows } from '../comparisonDeltas';
import { DistributionChart } from './DistributionChart';
import { CumulativeTable } from './CumulativeTable';
import './ComparisonResults.css';

const COLOR_A = '#2563eb';
const COLOR_B = '#f59e0b';

interface ComparisonResultsProps {
  resultsA: PoolResults;
  resultsB: PoolResults;
  costA: string;
  costB: string;
  labelA: string;
  labelB: string;
}

function formatValue(value: number | null): string {
  return value === null ? '—' : value.toFixed(2);
}

function formatDelta(value: number | null): string {
  if (value === null) return '—';
  const fixed = value.toFixed(2);
  return value > 0 ? `+${fixed}` : fixed;
}

export function ComparisonResults({
  resultsA,
  resultsB,
  costA,
  costB,
  labelA,
  labelB,
}: ComparisonResultsProps) {
  const rows = buildDeltaRows(resultsA, resultsB, costA, costB);

  return (
    <div className="comparison">
      <table className="comparison__delta">
        <thead>
          <tr>
            <th></th>
            <th>
              <span style={{ color: COLOR_A }}>■ </span>
              {labelA}
            </th>
            <th>
              <span style={{ color: COLOR_B }}>■ </span>
              {labelB}
            </th>
            <th>Δ (B−A)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td>{row.label}</td>
              <td className="is-number">{formatValue(row.a)}</td>
              <td className="is-number">{formatValue(row.b)}</td>
              <td
                className={
                  'is-number' +
                  (row.bIsBetter === true
                    ? ' delta-better'
                    : row.bIsBetter === false
                      ? ' delta-worse'
                      : '')
                }
              >
                {formatDelta(row.delta)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <DistributionChart
        distribution={resultsA.results.distribution}
        secondaryDistribution={resultsB.results.distribution}
        title="Attack Distribution (A vs B)"
        xAxisLabel="Total Successes"
        barColor={COLOR_A}
        secondaryColor={COLOR_B}
        seriesLabel={labelA}
        secondaryLabel={labelB}
      />

      <DistributionChart
        distribution={resultsA.woundsResults.distribution}
        secondaryDistribution={resultsB.woundsResults.distribution}
        title="Wounds Distribution (A vs B)"
        xAxisLabel="Wounds"
        barColor={COLOR_A}
        secondaryColor={COLOR_B}
        seriesLabel={labelA}
        secondaryLabel={labelB}
      />

      <div className="comparison__cumulatives">
        <CumulativeTable
          cumulative={resultsA.results.cumulative}
          secondary={resultsB.results.cumulative}
          title="At Least N Successes"
          primaryLabel={labelA}
          secondaryLabel={labelB}
        />
        <CumulativeTable
          cumulative={resultsA.woundsResults.cumulative}
          secondary={resultsB.woundsResults.cumulative}
          title="At Least N Wounds"
          primaryLabel={labelA}
          secondaryLabel={labelB}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/ComparisonResults.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ComparisonResults.tsx src/components/ComparisonResults.css src/components/ComparisonResults.test.tsx
git commit -m "feat: add ComparisonResults component"
```

---

### Task 8: URL state for pool A + compare flag + labels (TDD)

**Files:**

- Modify: `src/urlState.ts`
- Modify: `src/urlState.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `src/urlState.test.ts` inside the top-level `describe('urlState', …)`:

```ts
describe('comparison state', () => {
  it('roundtrips a pinned pool A under a. prefix with cmp flag and labels', () => {
    const state: UrlState = {
      ...DEFAULT_URL_STATE,
      r: 1,
      cmp: true,
      la: 'DLT',
      lb: 'Stock',
      a: { ...DEFAULT_URL_STATE_POOL, r: 3, crit: 1, cover: 'light' },
    };
    const fragment = buildFragment(state);
    expect(fragment).toContain('cmp=1');
    expect(fragment).toContain('la=DLT');
    expect(fragment).toContain('a.r=3');
    expect(fragment).toContain('a.crit=1');

    const parsed = parseFragment('#' + fragment);
    expect(parsed.cmp).toBe(true);
    expect(parsed.la).toBe('DLT');
    expect(parsed.lb).toBe('Stock');
    expect(parsed.r).toBe(1);
    expect(parsed.a.r).toBe(3);
    expect(parsed.a.crit).toBe(1);
    expect(parsed.a.cover).toBe('light');
  });

  it('legacy links without cmp parse with compare off and default pool A', () => {
    const parsed = parseFragment('#r=2&b=1');
    expect(parsed.cmp).toBe(false);
    expect(parsed.r).toBe(2);
    expect(parsed.a).toEqual(DEFAULT_URL_STATE_POOL);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/urlState.test.ts`
Expected: FAIL — `cmp`, `la`, `lb`, `a`, and `DEFAULT_URL_STATE_POOL` do not exist.

- [ ] **Step 3: Refactor `urlState.ts` to a per-pool shape plus top-level compare keys**

Replace `src/urlState.ts` with the following. It factors the per-pool keys into `UrlPoolState`, keeps the existing flat keys for the **live** pool by spreading the live pool at the top level (preserving backward-compatible key names), and adds an `a`-prefixed pool plus `cmp`/`la`/`lb`.

```ts
export type SurgeOption = 'none' | 'hit' | 'crit';
export type DefenseSurgeOption = 'none' | 'block';
export type CoverOption = 'none' | 'light' | 'heavy';
export type DefenseColorOption = 'red' | 'white';

export interface UrlPoolState {
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
  shield: number;
  out: boolean;
  cover: CoverOption;
  dugIn: boolean;
  lowProf: boolean;
  sup: boolean;
  coverX: number;
  armor: number;
  imp: boolean;
  suppTok: number;
  danger: number;
  uLuck: number;
  backup: boolean;
}

export interface UrlState extends UrlPoolState {
  cmp: boolean;
  la: string;
  lb: string;
  a: UrlPoolState;
}

export const DEFAULT_URL_STATE_POOL: UrlPoolState = {
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
  shield: 0,
  out: false,
  cover: 'none',
  dugIn: false,
  lowProf: false,
  sup: false,
  coverX: 0,
  armor: 0,
  imp: false,
  suppTok: 0,
  danger: 0,
  uLuck: 0,
  backup: false,
};

export const DEFAULT_URL_STATE: UrlState = {
  ...DEFAULT_URL_STATE_POOL,
  cmp: false,
  la: 'A',
  lb: 'B',
  a: { ...DEFAULT_URL_STATE_POOL },
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

function parseEnum<T extends string>(
  value: string | null,
  options: readonly T[],
  defaultVal: T
): T {
  if (value === null || value === '') return defaultVal;
  return options.includes(value as T) ? (value as T) : defaultVal;
}

function parseBoolean(value: string | null): boolean {
  if (value === null || value === '') return false;
  const lower = value.toLowerCase();
  return lower === '1' || lower === 'true';
}

// The fragment key for dugIn is 'dug'; everything else uses its own name.
function poolKey(key: keyof UrlPoolState): string {
  return key === 'dugIn' ? 'dug' : key;
}

function parsePool(params: URLSearchParams, prefix: string): UrlPoolState {
  const get = (key: keyof UrlPoolState) => params.get(prefix + poolKey(key));
  return {
    r: parseNumber(get('r'), DEFAULT_URL_STATE_POOL.r),
    b: parseNumber(get('b'), DEFAULT_URL_STATE_POOL.b),
    w: parseNumber(get('w'), DEFAULT_URL_STATE_POOL.w),
    surge: parseEnum(get('surge'), SURGE_VALUES, DEFAULT_URL_STATE_POOL.surge),
    crit: parseNumber(get('crit'), DEFAULT_URL_STATE_POOL.crit),
    sTok: parseNumber(get('sTok'), DEFAULT_URL_STATE_POOL.sTok),
    aim: parseNumber(get('aim'), DEFAULT_URL_STATE_POOL.aim),
    obs: parseNumber(get('obs'), DEFAULT_URL_STATE_POOL.obs),
    precise: parseNumber(get('precise'), DEFAULT_URL_STATE_POOL.precise),
    ram: parseNumber(get('ram'), DEFAULT_URL_STATE_POOL.ram),
    sharp: parseNumber(get('sharp'), DEFAULT_URL_STATE_POOL.sharp),
    pierce: parseNumber(get('pierce'), DEFAULT_URL_STATE_POOL.pierce),
    impact: parseNumber(get('impact'), DEFAULT_URL_STATE_POOL.impact),
    cost: get('cost') ?? DEFAULT_URL_STATE_POOL.cost,
    dColor: parseEnum(
      get('dColor'),
      D_COLOR_VALUES,
      DEFAULT_URL_STATE_POOL.dColor
    ),
    dSurge: parseEnum(
      get('dSurge'),
      D_SURGE_VALUES,
      DEFAULT_URL_STATE_POOL.dSurge
    ),
    dSurgeTok: parseNumber(get('dSurgeTok'), DEFAULT_URL_STATE_POOL.dSurgeTok),
    dodge: parseNumber(get('dodge'), DEFAULT_URL_STATE_POOL.dodge),
    shield: parseNumber(get('shield'), DEFAULT_URL_STATE_POOL.shield),
    out: parseBoolean(get('out')),
    cover: parseEnum(get('cover'), COVER_VALUES, DEFAULT_URL_STATE_POOL.cover),
    dugIn: parseBoolean(get('dugIn')),
    lowProf: parseBoolean(get('lowProf')),
    sup: parseBoolean(get('sup')),
    coverX: Math.min(
      2,
      Math.max(0, parseNumber(get('coverX'), DEFAULT_URL_STATE_POOL.coverX))
    ),
    armor: parseNumber(get('armor'), DEFAULT_URL_STATE_POOL.armor),
    imp: parseBoolean(get('imp')),
    suppTok: parseNumber(get('suppTok'), DEFAULT_URL_STATE_POOL.suppTok),
    danger: parseNumber(get('danger'), DEFAULT_URL_STATE_POOL.danger),
    uLuck: parseNumber(get('uLuck'), DEFAULT_URL_STATE_POOL.uLuck),
    backup: parseBoolean(get('backup')),
  };
}

export function parseFragment(hash: string): UrlState {
  const stripped = hash.startsWith('#') ? hash.slice(1) : hash;
  const params = new URLSearchParams(stripped);

  const live = parsePool(params, '');
  const cmp = parseBoolean(params.get('cmp'));
  const a = cmp ? parsePool(params, 'a.') : { ...DEFAULT_URL_STATE_POOL };

  return {
    ...live,
    cmp,
    la: params.get('la') ?? DEFAULT_URL_STATE.la,
    lb: params.get('lb') ?? DEFAULT_URL_STATE.lb,
    a,
  };
}

function isDefaultPoolValue(
  key: keyof UrlPoolState,
  value: UrlPoolState[keyof UrlPoolState]
): boolean {
  return value === DEFAULT_URL_STATE_POOL[key];
}

function poolEntries(pool: UrlPoolState, prefix: string): string[] {
  const entries: string[] = [];
  const keys = Object.keys(DEFAULT_URL_STATE_POOL) as (keyof UrlPoolState)[];
  for (const key of keys) {
    const value = pool[key];
    if (!isDefaultPoolValue(key, value)) {
      const serialized =
        typeof value === 'boolean' ? (value ? '1' : '0') : String(value);
      entries.push(
        `${prefix}${poolKey(key)}=${encodeURIComponent(serialized)}`
      );
    }
  }
  return entries;
}

export function buildFragment(state: UrlState): string {
  const entries: string[] = [...poolEntries(state, '')];

  if (state.cmp) {
    entries.push('cmp=1');
    if (state.la !== DEFAULT_URL_STATE.la)
      entries.push(`la=${encodeURIComponent(state.la)}`);
    if (state.lb !== DEFAULT_URL_STATE.lb)
      entries.push(`lb=${encodeURIComponent(state.lb)}`);
    entries.push(...poolEntries(state.a, 'a.'));
  }

  return entries.join('&');
}
```

Note: `dugIn` still serializes/parses as `dug` (live pool key `dug`, pool A key `a.dug`), preserving the existing behavior and tests.

- [ ] **Step 4: Run the URL tests to verify they pass**

Run: `npx vitest run src/urlState.test.ts`
Expected: PASS — including the pre-existing tests (live pool keys unchanged) and the new comparison tests.

- [ ] **Step 5: Commit**

```bash
git add src/urlState.ts src/urlState.test.ts
git commit -m "feat: encode pinned pool A, compare flag, and labels in URL"
```

---

### Task 9: Wire compare mode into `App.tsx`

**Files:**

- Modify: `src/App.tsx`

- [ ] **Step 1: Add pinned-config + label state and a config↔UrlPoolState mapping**

Add imports and a helper near the top of `src/App.tsx`:

```ts
import { ComparisonResults } from './components/ComparisonResults';
import { DEFAULT_POOL_CONFIG } from './poolResults';
import type { UrlPoolState } from './urlState';
```

Add a module-level helper (outside the component) that converts a `UrlPoolState` to a `PoolConfig` (string fields use `''` for zero/default), and the inverse:

```ts
const numToInput = (value: number): string =>
  value === 0 ? '' : String(value);

function poolStateToConfig(pool: UrlPoolState): PoolConfig {
  return {
    pool: { red: pool.r, black: pool.b, white: pool.w },
    surge: pool.surge,
    criticalX: numToInput(pool.crit),
    surgeTokens: numToInput(pool.sTok),
    aimTokens: numToInput(pool.aim),
    observeTokens: numToInput(pool.obs),
    preciseX: numToInput(pool.precise),
    ramX: numToInput(pool.ram),
    sharpshooterX: numToInput(pool.sharp),
    pierceX: numToInput(pool.pierce),
    impactX: numToInput(pool.impact),
    pointCost: pool.cost,
    defenseDieColor: pool.dColor,
    defenseSurge: pool.dSurge,
    defenseSurgeTokens: numToInput(pool.dSurgeTok),
    dodgeTokens: numToInput(pool.dodge),
    shieldTokens: numToInput(pool.shield),
    outmaneuver: pool.out,
    cover: pool.cover,
    dugIn: pool.dugIn,
    lowProfile: pool.lowProf,
    suppressed: pool.sup,
    coverX: numToInput(pool.coverX),
    armorX: numToInput(pool.armor),
    impervious: pool.imp,
    suppressionTokens: numToInput(pool.suppTok),
    dangerSenseX: numToInput(pool.danger),
    uncannyLuckX: numToInput(pool.uLuck),
    backup: pool.backup,
  };
}

function configToPoolState(config: PoolConfig): UrlPoolState {
  const num = (value: string) =>
    value === '' ? 0 : Math.max(0, Math.floor(Number(value)) || 0);
  return {
    r: config.pool.red,
    b: config.pool.black,
    w: config.pool.white,
    surge: config.surge,
    crit: num(config.criticalX),
    sTok: num(config.surgeTokens),
    aim: num(config.aimTokens),
    obs: num(config.observeTokens),
    precise: num(config.preciseX),
    ram: num(config.ramX),
    sharp: num(config.sharpshooterX),
    pierce: num(config.pierceX),
    impact: num(config.impactX),
    cost: config.pointCost,
    dColor: config.defenseDieColor,
    dSurge: config.defenseSurge,
    dSurgeTok: num(config.defenseSurgeTokens),
    dodge: num(config.dodgeTokens),
    shield: num(config.shieldTokens),
    out: config.outmaneuver,
    cover: config.cover,
    dugIn: config.dugIn,
    lowProf: config.lowProfile,
    sup: config.suppressed,
    coverX: Math.min(2, num(config.coverX)),
    armor: num(config.armorX),
    imp: config.impervious,
    suppTok: num(config.suppressionTokens),
    danger: num(config.dangerSenseX),
    uLuck: num(config.uncannyLuckX),
    backup: config.backup,
  };
}
```

- [ ] **Step 2: Add component state for compare mode**

Inside `App`, add (after the existing `useState` declarations, near `diceRollerOpen`):

```ts
const [pinnedConfig, setPinnedConfig] = useState<PoolConfig | null>(() =>
  initialFromUrl?.cmp ? poolStateToConfig(initialFromUrl.a) : null
);
const [labelA, setLabelA] = useState<string>(() => initialFromUrl?.la ?? 'A');
const [labelB, setLabelB] = useState<string>(() => initialFromUrl?.lb ?? 'B');
```

- [ ] **Step 3: Compute pinned results and add controls**

After the `const { results, woundsResults } = useMemo(...)` from Task 3, add:

```ts
const pinnedResults = useMemo(
  () => (pinnedConfig ? computePoolResults(pinnedConfig) : null),
  [pinnedConfig]
);
const liveResults = useMemo(
  () => ({ results, woundsResults }),
  [results, woundsResults]
);

const handlePin = () => setPinnedConfig(liveConfig);
const handleClearCompare = () => setPinnedConfig(null);
```

- [ ] **Step 4: Add the URL fields for compare mode**

In the `urlState` `useMemo` object (Task 3 left it intact), add these fields and extend the dependency array with `pinnedConfig`, `labelA`, `labelB`:

```ts
    // ...existing live-pool fields...
    cmp: pinnedConfig !== null,
    la: labelA,
    lb: labelB,
    a: pinnedConfig
      ? configToPoolState(pinnedConfig)
      : { ...DEFAULT_URL_STATE_POOL },
```

Add the import `import { DEFAULT_URL_STATE_POOL } from './urlState';` (extend the existing `urlState` import line).

- [ ] **Step 5: Render controls + ComparisonResults**

In the header actions, add a Pin/Clear button before the Share button:

```tsx
<button
  type="button"
  className="app__reset"
  onClick={pinnedConfig ? handleClearCompare : handlePin}
  disabled={!pinnedConfig && totalDice === 0}
  title={
    pinnedConfig
      ? 'Exit compare mode and clear pinned pool A'
      : 'Pin the current pool as A to compare against'
  }
>
  {pinnedConfig ? 'Clear compare' : 'Pin as A'}
</button>
```

When pinned, show editable labels above the results. Replace the results `<section className="app__results">` body's success branch so that when `pinnedConfig && pinnedResults` it renders the comparison; otherwise the existing single-pool output:

```tsx
{
  totalDice === 0 ? (
    <p className="app__empty">Add dice to see results.</p>
  ) : pinnedConfig && pinnedResults ? (
    <>
      <div className="app__compare-labels">
        <label>
          A
          <input
            value={labelA}
            onChange={(event) => setLabelA(event.target.value)}
            maxLength={24}
          />
        </label>
        <label>
          B
          <input
            value={labelB}
            onChange={(event) => setLabelB(event.target.value)}
            maxLength={24}
          />
        </label>
      </div>
      <ComparisonResults
        resultsA={pinnedResults}
        resultsB={liveResults}
        costA={pinnedConfig.pointCost}
        costB={liveConfig.pointCost}
        labelA={labelA || 'A'}
        labelB={labelB || 'B'}
      />
    </>
  ) : (
    <>{/* existing single-pool StatsSummary / charts / tables unchanged */}</>
  );
}
```

- [ ] **Step 6: Reset wiring**

In `handleReset`, add at the end:

```ts
setPinnedConfig(null);
setLabelA('A');
setLabelB('B');
```

- [ ] **Step 7: Add minimal label styles**

Append to `src/App.css`:

```css
.app__compare-labels {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.app__compare-labels label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: #6b7280;
}

.app__compare-labels input {
  padding: 0.2rem 0.4rem;
}
```

- [ ] **Step 8: Verify**

Run: `npm run test && npx tsc -b && npm run lint && npm run build`
Expected: all pass; build succeeds.

Manual check (run `npm run dev`):

1. Add dice → click **Pin as A** → button becomes **Clear compare**; results switch to the delta table + overlaid charts.
2. Edit the live pool → B column and Δ update; A stays fixed.
3. Edit labels → legend/columns update.
4. Click **Share** (or copy URL) → reload the URL → compare mode + both pools + labels restored.
5. A legacy link like `#r=2&b=1` loads in single-pool mode.
6. **Clear compare** → returns to single-pool view.

- [ ] **Step 9: Commit**

```bash
git add src/App.tsx src/App.css
git commit -m "feat: pin-and-compare mode with shareable A vs B"
```

---

## Self-Review

- **Spec coverage:** Pin/Clear + labels (Task 9), full overlay (Tasks 4/5/7), delta with direction colors (Task 6/7), URL for both pools (Task 8), `PoolConfig`/`computePoolResults` seam (Tasks 1–3). All spec sections covered.
- **Type consistency:** `PoolResults` (Task 2) is the type consumed by `buildDeltaRows` (Task 6) and `ComparisonResults` (Task 7). `UrlPoolState`/`DEFAULT_URL_STATE_POOL` (Task 8) are consumed by the App mapping (Task 9). `DistributionChart`/`CumulativeTable` prop names (`secondaryDistribution`, `secondaryLabel`, `secondary`, `primaryLabel`) match between Tasks 4/5 and 7.
- **No placeholders:** all steps contain runnable code/commands.
