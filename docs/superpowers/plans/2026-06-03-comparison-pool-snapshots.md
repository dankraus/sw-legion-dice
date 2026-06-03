# Comparison Pool Snapshots Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** In Pin & Compare mode, show side-by-side read-only snapshot cards for pool A and pool B above the delta table so users always see what each configuration contains.

**Architecture:** Add a pure `formatPoolSnapshot(config)` formatter (structural fields always shown; optional fields when differing from `DEFAULT_POOL_CONFIG`). Render two `PoolSnapshotCard` components inside `ComparisonResults`, reorder compare UI so snapshots sit above editable A/B labels. Extract shared attack/defense dice display from `ShareCard` into `PoolDiceRow` for reuse.

**Tech Stack:** React 19, TypeScript 5.9, Vite 6, Vitest 4, @testing-library/react.

---

Spec: `docs/superpowers/specs/2026-06-03-comparison-pool-snapshots-design.md`

## File structure

| File                                        | Responsibility                                                                   |
| ------------------------------------------- | -------------------------------------------------------------------------------- |
| `src/poolSnapshot.ts` (new)                 | `formatPoolSnapshot` — sectioned labels/values from `PoolConfig`                 |
| `src/poolSnapshot.test.ts` (new)            | Formatter unit tests                                                             |
| `src/components/PoolDiceRow.tsx` (new)      | Attack chips + text, defense die row (shared)                                    |
| `src/components/PoolSnapshotCard.tsx` (new) | One pool’s snapshot card UI                                                      |
| `src/components/PoolSnapshotCard.css` (new) | Card layout, accent border, sections                                             |
| `src/components/ComparisonResults.tsx`      | Snapshots row, optional label inputs, existing charts                            |
| `src/components/ComparisonResults.css`      | `.comparison__snapshots` flex layout                                             |
| `src/components/ComparisonResults.test.tsx` | Assert snapshot content + labels                                                 |
| `src/components/ShareCard.tsx`              | Import `PoolDiceRow` instead of local `DiceRow`                                  |
| `src/App.tsx`                               | Pass configs + label handlers into `ComparisonResults`; remove outer label block |

---

### Task 1: `formatPoolSnapshot` (TDD)

**Files:**

- Create: `src/poolSnapshot.ts`
- Test: `src/poolSnapshot.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/poolSnapshot.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { formatPoolSnapshot } from './poolSnapshot';
import { DEFAULT_POOL_CONFIG } from './poolResults';

function linesForTitle(
  sections: ReturnType<typeof formatPoolSnapshot>,
  title: string
) {
  return sections.find((section) => section.title === title)?.lines ?? [];
}

function lineValue(
  sections: ReturnType<typeof formatPoolSnapshot>,
  title: string,
  label: string
) {
  return linesForTitle(sections, title).find((line) => line.label === label)
    ?.value;
}

describe('formatPoolSnapshot', () => {
  it('always includes attack dice and surge in Attack', () => {
    const sections = formatPoolSnapshot(DEFAULT_POOL_CONFIG);
    expect(lineValue(sections, 'Attack', 'Red')).toBe('0');
    expect(lineValue(sections, 'Attack', 'Black')).toBe('0');
    expect(lineValue(sections, 'Attack', 'White')).toBe('0');
    expect(lineValue(sections, 'Attack', 'Surge')).toBe('None');
  });

  it('omits Tokens section when all token counts are default', () => {
    const sections = formatPoolSnapshot(DEFAULT_POOL_CONFIG);
    expect(sections.some((section) => section.title === 'Tokens')).toBe(false);
  });

  it('includes Tokens when a token count is set', () => {
    const sections = formatPoolSnapshot({
      ...DEFAULT_POOL_CONFIG,
      aimTokens: '2',
    });
    expect(lineValue(sections, 'Tokens', 'Aim')).toBe('2');
  });

  it('includes Attack keywords when critical is set', () => {
    const sections = formatPoolSnapshot({
      ...DEFAULT_POOL_CONFIG,
      criticalX: '1',
    });
    expect(lineValue(sections, 'Attack keywords', 'Critical')).toBe('1');
  });

  it('always includes structural defense fields', () => {
    const sections = formatPoolSnapshot(DEFAULT_POOL_CONFIG);
    expect(lineValue(sections, 'Defense', 'Defense die')).toBe('Red');
    expect(lineValue(sections, 'Defense', 'Defense surge')).toBe('None');
    expect(lineValue(sections, 'Defense', 'Cover')).toBe('None');
  });

  it('includes optional defense modifier when non-default', () => {
    const sections = formatPoolSnapshot({
      ...DEFAULT_POOL_CONFIG,
      dugIn: true,
    });
    expect(lineValue(sections, 'Defense', 'Dug In')).toBe('On');
  });

  it('includes Cost section when point cost is set', () => {
    const sections = formatPoolSnapshot({
      ...DEFAULT_POOL_CONFIG,
      pointCost: '47',
    });
    expect(lineValue(sections, 'Cost', 'Point cost')).toBe('47');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/poolSnapshot.test.ts`
Expected: FAIL — cannot find module `./poolSnapshot`

- [ ] **Step 3: Implement `formatPoolSnapshot`**

Create `src/poolSnapshot.ts`:

```ts
import type { PoolConfig, SurgeConversion, CoverLevel } from './types';
import { DEFAULT_POOL_CONFIG } from './poolResults';
import { pointCostValue } from './share/pointCost';

export type PoolSnapshotLine = { label: string; value: string };
export type PoolSnapshotSection = {
  title: string;
  lines: PoolSnapshotLine[];
};

function countFromString(value: string): number {
  if (value === '') return 0;
  return Math.max(0, Math.floor(Number(value)) || 0);
}

function attackSurgeLabel(surge: SurgeConversion): string {
  if (surge === 'hit') return 'Hit';
  if (surge === 'crit') return 'Crit';
  return 'None';
}

function coverLabel(cover: CoverLevel): string {
  if (cover === 'light') return 'Light';
  if (cover === 'heavy') return 'Heavy';
  return 'None';
}

function addCountLine(lines: PoolSnapshotLine[], label: string, value: string) {
  const count = countFromString(value);
  if (count > 0) {
    lines.push({ label, value: String(count) });
  }
}

function addBooleanLine(
  lines: PoolSnapshotLine[],
  label: string,
  enabled: boolean
) {
  if (enabled) lines.push({ label, value: 'On' });
}

export function formatPoolSnapshot(config: PoolConfig): PoolSnapshotSection[] {
  const sections: PoolSnapshotSection[] = [];

  sections.push({
    title: 'Attack',
    lines: [
      { label: 'Red', value: String(config.pool.red) },
      { label: 'Black', value: String(config.pool.black) },
      { label: 'White', value: String(config.pool.white) },
      { label: 'Surge', value: attackSurgeLabel(config.surge) },
    ],
  });

  const tokenLines: PoolSnapshotLine[] = [];
  addCountLine(tokenLines, 'Surge tokens', config.surgeTokens);
  addCountLine(tokenLines, 'Aim', config.aimTokens);
  addCountLine(tokenLines, 'Observe', config.observeTokens);
  if (tokenLines.length > 0) {
    sections.push({ title: 'Tokens', lines: tokenLines });
  }

  const keywordLines: PoolSnapshotLine[] = [];
  addCountLine(keywordLines, 'Critical', config.criticalX);
  addCountLine(keywordLines, 'Precise', config.preciseX);
  addCountLine(keywordLines, 'Ram', config.ramX);
  addCountLine(keywordLines, 'Sharpshooter', config.sharpshooterX);
  addCountLine(keywordLines, 'Impact', config.impactX);
  addCountLine(keywordLines, 'Pierce', config.pierceX);
  if (keywordLines.length > 0) {
    sections.push({ title: 'Attack keywords', lines: keywordLines });
  }

  const defenseLines: PoolSnapshotLine[] = [
    {
      label: 'Defense die',
      value: config.defenseDieColor === 'white' ? 'White' : 'Red',
    },
    {
      label: 'Defense surge',
      value: config.defenseSurge === 'block' ? 'Block' : 'None',
    },
    { label: 'Cover', value: coverLabel(config.cover) },
  ];
  addBooleanLine(defenseLines, 'Dug In', config.dugIn);
  addBooleanLine(defenseLines, 'Low Profile', config.lowProfile);
  addBooleanLine(defenseLines, 'Suppressed', config.suppressed);
  addBooleanLine(defenseLines, 'Backup', config.backup);
  addBooleanLine(defenseLines, 'Impervious', config.impervious);
  addBooleanLine(defenseLines, 'Outmaneuver', config.outmaneuver);
  addCountLine(defenseLines, 'Cover+', config.coverX);
  addCountLine(defenseLines, 'Armor', config.armorX);
  addCountLine(defenseLines, 'Danger Sense', config.dangerSenseX);
  addCountLine(defenseLines, 'Uncanny Luck', config.uncannyLuckX);
  addCountLine(defenseLines, 'Def surge tokens', config.defenseSurgeTokens);
  addCountLine(defenseLines, 'Suppression', config.suppressionTokens);
  addCountLine(defenseLines, 'Dodge', config.dodgeTokens);
  addCountLine(defenseLines, 'Shield', config.shieldTokens);
  sections.push({ title: 'Defense', lines: defenseLines });

  if (pointCostValue(config) > 0) {
    sections.push({
      title: 'Cost',
      lines: [{ label: 'Point cost', value: config.pointCost }],
    });
  }

  return sections;
}

/** Text summary for attack dice including zero counts (snapshot dice row). */
export function attackDiceSummaryText(config: PoolConfig): string {
  return `${config.pool.red} red · ${config.pool.black} black · ${config.pool.white} white`;
}
```

- [ ] **Step 4: Run tests**

Run: `npm run test -- src/poolSnapshot.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add src/poolSnapshot.ts src/poolSnapshot.test.ts
git commit -m "feat: add formatPoolSnapshot for compare mode"
```

---

### Task 2: Extract `PoolDiceRow`

**Files:**

- Create: `src/components/PoolDiceRow.tsx`
- Modify: `src/components/ShareCard.tsx`

- [ ] **Step 1: Create `PoolDiceRow`**

Create `src/components/PoolDiceRow.tsx`:

```tsx
import type { PoolConfig } from '../types';
import { attackDiceSummaryText } from '../poolSnapshot';

const DIE_COLORS: Record<string, string> = {
  red: '#dc2626',
  black: '#111111',
  white: '#ffffff',
};

interface PoolDiceRowProps {
  config: PoolConfig;
  /** BEM prefix: `share-card` or `pool-snapshot` */
  classPrefix: 'share-card' | 'pool-snapshot';
}

export function PoolDiceRow({ config, classPrefix }: PoolDiceRowProps) {
  const attack: { color: string; count: number; name: string }[] = [
    { color: DIE_COLORS.red, count: config.pool.red, name: 'red' },
    { color: DIE_COLORS.black, count: config.pool.black, name: 'black' },
    { color: DIE_COLORS.white, count: config.pool.white, name: 'white' },
  ].filter((entry) => entry.count > 0);

  const defenseColor = config.defenseDieColor;
  const defenseLabel =
    defenseColor === 'white' ? 'White defense die' : 'Red defense die';

  const poolLabel = `${classPrefix}__pool-label`;
  const dice = `${classPrefix}__dice`;
  const die = `${classPrefix}__die`;

  return (
    <>
      <div className={poolLabel}>Attack</div>
      <div className={dice}>
        {attack.flatMap((entry) =>
          Array.from({ length: entry.count }).map((_, index) => (
            <span
              key={`${entry.name}-${index}`}
              className={die}
              style={{ background: entry.color }}
            />
          ))
        )}
        <span>
          {classPrefix === 'pool-snapshot'
            ? attackDiceSummaryText(config)
            : attack.length > 0
              ? attack
                  .map((entry) => `${entry.count} ${entry.name}`)
                  .join(' · ')
              : 'none'}
        </span>
      </div>
      <div className={poolLabel}>Defense</div>
      <div className={dice}>
        <span
          className={die}
          style={{ background: DIE_COLORS[defenseColor] }}
        />
        <span>{defenseLabel}</span>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Update `ShareCard.tsx`**

Remove local `DIE_COLORS`, `DiceRow`, and add:

```tsx
import { PoolDiceRow } from './PoolDiceRow';
```

In `PoolDetails`, replace `<DiceRow config={pool.config} />` with:

```tsx
<PoolDiceRow config={pool.config} classPrefix="share-card" />
```

- [ ] **Step 3: Run tests**

Run: `npm run test -- src/components/ShareCard.test.tsx`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/PoolDiceRow.tsx src/components/ShareCard.tsx
git commit -m "refactor: extract PoolDiceRow for share card and snapshots"
```

---

### Task 3: `PoolSnapshotCard` component

**Files:**

- Create: `src/components/PoolSnapshotCard.tsx`
- Create: `src/components/PoolSnapshotCard.css`
- Test: `src/components/PoolSnapshotCard.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/PoolSnapshotCard.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PoolSnapshotCard } from './PoolSnapshotCard';
import { DEFAULT_POOL_CONFIG } from '../poolResults';

describe('PoolSnapshotCard', () => {
  it('renders label, attack section, and dice summary with zeros', () => {
    const { getByText } = render(
      <PoolSnapshotCard
        config={{
          ...DEFAULT_POOL_CONFIG,
          pool: { red: 3, black: 0, white: 0 },
        }}
        label="Heavy"
        accentColor="#2563eb"
      />
    );
    expect(getByText('Heavy')).toBeTruthy();
    expect(getByText('Attack')).toBeTruthy();
    expect(getByText('3 red · 0 black · 0 white')).toBeTruthy();
    expect(getByText('Red')).toBeTruthy();
    expect(getByText('3')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/components/PoolSnapshotCard.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Implement component and CSS**

Create `src/components/PoolSnapshotCard.css`:

```css
.pool-snapshot {
  flex: 1 1 220px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.75rem;
  background: #fafafa;
}

.pool-snapshot__header {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.pool-snapshot__marker {
  font-size: 0.85rem;
}

.pool-snapshot__pool-label {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #6b7280;
  margin-top: 0.35rem;
}

.pool-snapshot__dice {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  font-size: 0.85rem;
  margin-bottom: 0.25rem;
}

.pool-snapshot__die {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 3px;
  border: 1px solid rgba(0, 0, 0, 0.15);
}

.pool-snapshot__section {
  margin-top: 0.5rem;
}

.pool-snapshot__section-title {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #6b7280;
  margin-bottom: 0.2rem;
}

.pool-snapshot__lines {
  margin: 0;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.1rem 0.75rem;
  font-size: 0.85rem;
}

.pool-snapshot__lines dt {
  color: #4b5563;
  margin: 0;
}

.pool-snapshot__lines dd {
  margin: 0;
  font-variant-numeric: tabular-nums;
}
```

Create `src/components/PoolSnapshotCard.tsx`:

```tsx
import type { PoolConfig } from '../types';
import { formatPoolSnapshot } from '../poolSnapshot';
import { PoolDiceRow } from './PoolDiceRow';
import './PoolSnapshotCard.css';

interface PoolSnapshotCardProps {
  config: PoolConfig;
  label: string;
  accentColor: string;
}

export function PoolSnapshotCard({
  config,
  label,
  accentColor,
}: PoolSnapshotCardProps) {
  const sections = formatPoolSnapshot(config);

  return (
    <article className="pool-snapshot" style={{ borderColor: accentColor }}>
      <header className="pool-snapshot__header">
        <span className="pool-snapshot__marker" style={{ color: accentColor }}>
          ■
        </span>
        {label}
      </header>
      <PoolDiceRow config={config} classPrefix="pool-snapshot" />
      {sections.map((section) => (
        <div key={section.title} className="pool-snapshot__section">
          <div className="pool-snapshot__section-title">{section.title}</div>
          <dl className="pool-snapshot__lines">
            {section.lines.map((line) => (
              <div key={`${section.title}-${line.label}`}>
                <dt>{line.label}</dt>
                <dd>{line.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </article>
  );
}
```

Note: `PoolDiceRow` shows Attack/Defense chips; section list repeats Attack/Defense lines for full detail per spec. Attack section lines duplicate counts — acceptable for clarity.

- [ ] **Step 4: Run test**

Run: `npm run test -- src/components/PoolSnapshotCard.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/PoolSnapshotCard.tsx src/components/PoolSnapshotCard.css src/components/PoolSnapshotCard.test.tsx
git commit -m "feat: add PoolSnapshotCard for compare snapshots"
```

---

### Task 4: Wire snapshots into `ComparisonResults`

**Files:**

- Modify: `src/components/ComparisonResults.tsx`
- Modify: `src/components/ComparisonResults.css`
- Modify: `src/components/ComparisonResults.test.tsx`
- Modify: `src/App.tsx`

Constants (already in `ComparisonResults.tsx`): `COLOR_A = '#2563eb'`, `COLOR_B = '#f59e0b'`.

- [ ] **Step 1: Update failing test**

Replace `src/components/ComparisonResults.test.tsx` with:

```tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ComparisonResults } from './ComparisonResults';
import { computePoolResults, DEFAULT_POOL_CONFIG } from '../poolResults';

describe('ComparisonResults', () => {
  it('renders snapshot cards, labels, and delta table', () => {
    const configA = {
      ...DEFAULT_POOL_CONFIG,
      pool: { red: 3, black: 0, white: 0 },
    };
    const configB = {
      ...DEFAULT_POOL_CONFIG,
      pool: { red: 1, black: 0, white: 0 },
    };
    const resultsA = computePoolResults(configA);
    const resultsB = computePoolResults(configB);
    const { getAllByText, getByText, getByLabelText } = render(
      <ComparisonResults
        configA={configA}
        configB={configB}
        resultsA={resultsA}
        resultsB={resultsB}
        costA=""
        costB=""
        labelA="DLT"
        labelB="Stock"
        onLabelAChange={() => {}}
        onLabelBChange={() => {}}
      />
    );
    expect(getByText('3 red · 0 black · 0 white')).toBeTruthy();
    expect(getByText('1 red · 0 black · 0 white')).toBeTruthy();
    expect(getAllByText('DLT').length).toBeGreaterThan(0);
    expect(getAllByText('Stock').length).toBeGreaterThan(0);
    expect(getByLabelText('Label for pool A')).toBeTruthy();
    expect(getByText('Avg total')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test — expect fail**

Run: `npm run test -- src/components/ComparisonResults.test.tsx`
Expected: FAIL — missing props

- [ ] **Step 3: Update `ComparisonResults.tsx`**

Add imports:

```tsx
import type { PoolConfig } from '../types';
import { PoolSnapshotCard } from './PoolSnapshotCard';
```

Extend props:

```tsx
interface ComparisonResultsProps {
  configA: PoolConfig;
  configB: PoolConfig;
  resultsA: PoolResults;
  resultsB: PoolResults;
  costA: string;
  costB: string;
  labelA: string;
  labelB: string;
  onLabelAChange: (value: string) => void;
  onLabelBChange: (value: string) => void;
}
```

At start of returned JSX (inside `<div className="comparison">`), insert **before** the delta table:

```tsx
<div className="comparison__snapshots">
  <PoolSnapshotCard
    config={configA}
    label={labelA}
    accentColor={COLOR_A}
  />
  <PoolSnapshotCard
    config={configB}
    label={labelB}
    accentColor={COLOR_B}
  />
</div>

<div className="app__compare-labels">
  <label>
    A
    <input
      value={labelA}
      onChange={(event) => onLabelAChange(event.target.value)}
      maxLength={24}
      aria-label="Label for pool A"
    />
  </label>
  <label>
    B
    <input
      value={labelB}
      onChange={(event) => onLabelBChange(event.target.value)}
      maxLength={24}
      aria-label="Label for pool B"
    />
  </label>
</div>
```

Add to `ComparisonResults.css`:

```css
.comparison__snapshots {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}
```

- [ ] **Step 4: Update `App.tsx`**

Remove the outer `<div className="app__compare-labels">…</div>` block (lines ~872–891).

Update `ComparisonResults` usage:

```tsx
<ComparisonResults
  configA={pinnedConfig}
  configB={liveConfig}
  resultsA={pinnedResults}
  resultsB={liveResults}
  costA={pinnedConfig.pointCost}
  costB={liveConfig.pointCost}
  labelA={labelA || 'A'}
  labelB={labelB || 'B'}
  onLabelAChange={setLabelA}
  onLabelBChange={setLabelB}
/>
```

- [ ] **Step 5: Run tests and lint**

Run: `npm run test`
Expected: all pass

Run: `npm run lint`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/components/ComparisonResults.tsx src/components/ComparisonResults.css src/components/ComparisonResults.test.tsx src/App.tsx
git commit -m "feat: show A/B pool snapshots in compare results"
```

---

## Spec coverage (self-review)

| Spec requirement                           | Task                  |
| ------------------------------------------ | --------------------- |
| `formatPoolSnapshot` with defaults logic   | Task 1                |
| Side-by-side cards A/B colors              | Task 3–4              |
| Placement above labels, above delta        | Task 4 (order in JSX) |
| `PoolDiceRow` / ShareCard reuse            | Task 2                |
| `App` passes `pinnedConfig` + `liveConfig` | Task 4                |
| Unit tests for formatter + UI              | Tasks 1, 3, 4         |
| URL/share unchanged                        | No task (N/A)         |
| Out of scope items                         | Not planned           |

## Verification (final)

Run: `npm run test && npm run lint && npx tsc -b`
Expected: clean.

Manual: Pin as A with a distinct pool, edit B, confirm two snapshot cards show correct dice/modifiers before scrolling to charts.
