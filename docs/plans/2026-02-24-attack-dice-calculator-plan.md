# Attack Dice Calculator Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a React web app that calculates exact probabilities for Star Wars: Legion attack dice pools.

**Architecture:** React SPA with a pure TypeScript probability engine separated from UI components. Dice pool state lives in App and flows down as props. Results recompute on every state change.

**Tech Stack:** React 18, TypeScript, Vite, Recharts, Vitest

---

### Task 1: Scaffold the Vite + React + TypeScript project

**Files:**

- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/App.css`

**Step 1: Scaffold the project**

Run:

```bash
npm create vite@latest . -- --template react-ts
```

If prompted about existing files, proceed (the docs folder won't conflict).

**Step 2: Install dependencies**

Run:

```bash
npm install
npm install recharts
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

**Step 3: Configure Vitest**

Add to `vite.config.ts`:

```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
  },
});
```

Create `src/test-setup.ts`:

```typescript
import '@testing-library/jest-dom';
```

Add to `tsconfig.json` under `compilerOptions`:

```json
"types": ["vitest/globals"]
```

**Step 4: Add test script to package.json**

In `package.json`, add to `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

**Step 5: Verify dev server starts**

Run: `npm run dev`
Expected: Vite dev server starts, default React page loads.

**Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + TypeScript project with Vitest"
```

---

### Task 2: Define shared types

**Files:**

- Create: `src/types.ts`

**Step 1: Write the types file**

```typescript
export type DieColor = 'red' | 'black' | 'white';

export type SurgeConversion = 'none' | 'hit' | 'crit';

export interface DieFaces {
  crit: number;
  surge: number;
  hit: number;
  blank: number;
}

export interface AttackPool {
  red: number;
  black: number;
  white: number;
}

export interface AttackResults {
  expectedHits: number;
  expectedCrits: number;
  expectedTotal: number;
  distribution: { total: number; probability: number }[];
  cumulative: { total: number; probability: number }[];
}
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: add shared type definitions"
```

---

### Task 3: Build the probability engine -- dice definitions and effective probabilities

**Files:**

- Create: `src/engine/probability.ts`
- Create: `src/engine/__tests__/probability.test.ts`

**Step 1: Write the failing test for dice definitions and effective probabilities**

```typescript
import { describe, it, expect } from 'vitest';
import { DICE, getEffectiveProbabilities } from '../probability';

describe('DICE definitions', () => {
  it('red die faces sum to 8', () => {
    const r = DICE.red;
    expect(r.crit + r.surge + r.hit + r.blank).toBe(8);
  });

  it('black die faces sum to 8', () => {
    const b = DICE.black;
    expect(b.crit + b.surge + b.hit + b.blank).toBe(8);
  });

  it('white die faces sum to 8', () => {
    const w = DICE.white;
    expect(w.crit + w.surge + w.hit + w.blank).toBe(8);
  });
});

describe('getEffectiveProbabilities', () => {
  it('with no surge conversion, surge counts as blank', () => {
    const result = getEffectiveProbabilities('red', 'none');
    expect(result.crit).toBeCloseTo(1 / 8);
    expect(result.hit).toBeCloseTo(5 / 8);
    expect(result.blank).toBeCloseTo(2 / 8);
  });

  it('with surge to hit, surge adds to hit', () => {
    const result = getEffectiveProbabilities('red', 'hit');
    expect(result.crit).toBeCloseTo(1 / 8);
    expect(result.hit).toBeCloseTo(6 / 8);
    expect(result.blank).toBeCloseTo(1 / 8);
  });

  it('with surge to crit, surge adds to crit', () => {
    const result = getEffectiveProbabilities('red', 'crit');
    expect(result.crit).toBeCloseTo(2 / 8);
    expect(result.hit).toBeCloseTo(5 / 8);
    expect(result.blank).toBeCloseTo(1 / 8);
  });

  it('white die with no surge conversion', () => {
    const result = getEffectiveProbabilities('white', 'none');
    expect(result.crit).toBeCloseTo(1 / 8);
    expect(result.hit).toBeCloseTo(1 / 8);
    expect(result.blank).toBeCloseTo(6 / 8);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/probability.test.ts`
Expected: FAIL -- module not found.

**Step 3: Write the implementation**

```typescript
import { DieColor, DieFaces, SurgeConversion } from '../types';

export const DICE: Record<DieColor, DieFaces> = {
  red: { crit: 1, surge: 1, hit: 5, blank: 1 },
  black: { crit: 1, surge: 1, hit: 3, blank: 3 },
  white: { crit: 1, surge: 1, hit: 1, blank: 5 },
};

const SIDES = 8;

export interface EffectiveProbabilities {
  crit: number;
  hit: number;
  blank: number;
}

export function getEffectiveProbabilities(
  color: DieColor,
  surge: SurgeConversion
): EffectiveProbabilities {
  const die = DICE[color];
  let crit = die.crit;
  let hit = die.hit;
  let blank = die.blank;

  if (surge === 'crit') {
    crit += die.surge;
  } else if (surge === 'hit') {
    hit += die.surge;
  } else {
    blank += die.surge;
  }

  return {
    crit: crit / SIDES,
    hit: hit / SIDES,
    blank: blank / SIDES,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/probability.test.ts`
Expected: All PASS.

**Step 5: Commit**

```bash
git add src/engine/ src/engine/__tests__/
git commit -m "feat: add dice definitions and effective probability calculation"
```

---

### Task 4: Build the probability engine -- convolution and pool calculation

**Files:**

- Modify: `src/engine/probability.ts`
- Modify: `src/engine/__tests__/probability.test.ts`

**Step 1: Write the failing tests for pool calculation**

Append to the test file:

```typescript
import { calculateAttackPool } from '../probability';
import { AttackPool } from '../../types';

describe('calculateAttackPool', () => {
  it('zero dice returns zero everything', () => {
    const pool: AttackPool = { red: 0, black: 0, white: 0 };
    const result = calculateAttackPool(pool, 'none');
    expect(result.expectedHits).toBe(0);
    expect(result.expectedCrits).toBe(0);
    expect(result.expectedTotal).toBe(0);
    expect(result.distribution).toHaveLength(1);
    expect(result.distribution[0]).toEqual({ total: 0, probability: 1 });
  });

  it('single red die with no surge has correct expected values', () => {
    const pool: AttackPool = { red: 1, black: 0, white: 0 };
    const result = calculateAttackPool(pool, 'none');
    expect(result.expectedHits).toBeCloseTo(5 / 8);
    expect(result.expectedCrits).toBeCloseTo(1 / 8);
    expect(result.expectedTotal).toBeCloseTo(6 / 8);
  });

  it('single red die with surge to hit', () => {
    const pool: AttackPool = { red: 1, black: 0, white: 0 };
    const result = calculateAttackPool(pool, 'hit');
    expect(result.expectedHits).toBeCloseTo(6 / 8);
    expect(result.expectedCrits).toBeCloseTo(1 / 8);
    expect(result.expectedTotal).toBeCloseTo(7 / 8);
  });

  it('two red dice expected total is double one red die', () => {
    const pool: AttackPool = { red: 2, black: 0, white: 0 };
    const result = calculateAttackPool(pool, 'none');
    expect(result.expectedTotal).toBeCloseTo((2 * 6) / 8);
  });

  it('distribution probabilities sum to 1', () => {
    const pool: AttackPool = { red: 2, black: 1, white: 1 };
    const result = calculateAttackPool(pool, 'hit');
    const sum = result.distribution.reduce((s, d) => s + d.probability, 0);
    expect(sum).toBeCloseTo(1);
  });

  it('cumulative starts at 1 for at-least-0', () => {
    const pool: AttackPool = { red: 1, black: 1, white: 0 };
    const result = calculateAttackPool(pool, 'none');
    expect(result.cumulative[0]).toEqual({ total: 0, probability: 1 });
  });

  it('cumulative is non-increasing', () => {
    const pool: AttackPool = { red: 2, black: 2, white: 1 };
    const result = calculateAttackPool(pool, 'crit');
    for (let i = 1; i < result.cumulative.length; i++) {
      expect(result.cumulative[i].probability).toBeLessThanOrEqual(
        result.cumulative[i - 1].probability
      );
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/probability.test.ts`
Expected: FAIL -- `calculateAttackPool` not found.

**Step 3: Write the convolution and pool calculation**

Append to `src/engine/probability.ts`:

```typescript
import { AttackPool, AttackResults } from '../types';

function convolve(a: number[], b: number[]): number[] {
  const result = new Array(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      result[i + j] += a[i] * b[j];
    }
  }
  return result;
}

export function calculateAttackPool(
  pool: AttackPool,
  surge: SurgeConversion
): AttackResults {
  const dieColors: DieColor[] = ['red', 'black', 'white'];

  let hitDist = [1];
  let critDist = [1];

  for (const color of dieColors) {
    const count = pool[color];
    const probs = getEffectiveProbabilities(color, surge);

    for (let i = 0; i < count; i++) {
      hitDist = convolve(hitDist, [1 - probs.hit, probs.hit]);
      critDist = convolve(critDist, [1 - probs.crit, probs.crit]);
    }
  }

  const expectedHits = hitDist.reduce((sum, p, i) => sum + i * p, 0);
  const expectedCrits = critDist.reduce((sum, p, i) => sum + i * p, 0);

  let totalDist = [1];
  for (const color of dieColors) {
    const count = pool[color];
    const probs = getEffectiveProbabilities(color, surge);
    const successProb = probs.hit + probs.crit;

    for (let i = 0; i < count; i++) {
      totalDist = convolve(totalDist, [1 - successProb, successProb]);
    }
  }

  const distribution = totalDist.map((probability, total) => ({
    total,
    probability,
  }));

  const cumulative: { total: number; probability: number }[] = [];
  let cumSum = 1;
  for (let i = 0; i < totalDist.length; i++) {
    cumulative.push({ total: i, probability: cumSum });
    cumSum -= totalDist[i];
  }

  return {
    expectedHits,
    expectedCrits,
    expectedTotal: expectedHits + expectedCrits,
    distribution,
    cumulative,
  };
}
```

Note: The import line for `AttackPool` and `AttackResults` should be merged with the existing import from `'../types'` at the top of the file.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/probability.test.ts`
Expected: All PASS.

**Step 5: Commit**

```bash
git add src/engine/
git commit -m "feat: add convolution-based pool probability calculation"
```

---

### Task 5: Build the DiceSelector component

**Files:**

- Create: `src/components/DiceSelector.tsx`
- Create: `src/components/DiceSelector.css`

**Step 1: Write the component**

`src/components/DiceSelector.tsx`:

```tsx
import { DieColor } from '../types';
import './DiceSelector.css';

interface DiceSelectorProps {
  color: DieColor;
  count: number;
  onChange: (count: number) => void;
}

export function DiceSelector({ color, count, onChange }: DiceSelectorProps) {
  return (
    <div className={`dice-selector dice-selector--${color}`}>
      <span className="dice-selector__label">{color}</span>
      <div className="dice-selector__controls">
        <button
          className="dice-selector__btn"
          onClick={() => onChange(Math.max(0, count - 1))}
          disabled={count === 0}
          aria-label={`Remove ${color} die`}
        >
          −
        </button>
        <span className="dice-selector__count">{count}</span>
        <button
          className="dice-selector__btn"
          onClick={() => onChange(count + 1)}
          aria-label={`Add ${color} die`}
        >
          +
        </button>
      </div>
    </div>
  );
}
```

`src/components/DiceSelector.css`:

```css
.dice-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 0.5rem;
}

.dice-selector--red {
  background-color: #fee2e2;
  border: 2px solid #ef4444;
}

.dice-selector--black {
  background-color: #e5e7eb;
  border: 2px solid #374151;
}

.dice-selector--white {
  background-color: #f9fafb;
  border: 2px solid #d1d5db;
}

.dice-selector__label {
  font-weight: 600;
  text-transform: capitalize;
  font-size: 1.1rem;
  min-width: 60px;
}

.dice-selector__controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.dice-selector__btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid #ccc;
  background: white;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.15s;
}

.dice-selector__btn:hover:not(:disabled) {
  background-color: #f3f4f6;
}

.dice-selector__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.dice-selector__count {
  font-size: 1.5rem;
  font-weight: 700;
  min-width: 2ch;
  text-align: center;
}
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 3: Commit**

```bash
git add src/components/DiceSelector.*
git commit -m "feat: add DiceSelector component"
```

---

### Task 6: Build the SurgeToggle component

**Files:**

- Create: `src/components/SurgeToggle.tsx`
- Create: `src/components/SurgeToggle.css`

**Step 1: Write the component**

`src/components/SurgeToggle.tsx`:

```tsx
import { SurgeConversion } from '../types';
import './SurgeToggle.css';

interface SurgeToggleProps {
  value: SurgeConversion;
  onChange: (value: SurgeConversion) => void;
}

const OPTIONS: { value: SurgeConversion; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'hit', label: 'Surge → Hit' },
  { value: 'crit', label: 'Surge → Crit' },
];

export function SurgeToggle({ value, onChange }: SurgeToggleProps) {
  return (
    <fieldset className="surge-toggle">
      <legend className="surge-toggle__legend">Surge Conversion</legend>
      <div className="surge-toggle__options">
        {OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className={`surge-toggle__option ${
              value === opt.value ? 'surge-toggle__option--active' : ''
            }`}
          >
            <input
              type="radio"
              name="surge"
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="surge-toggle__radio"
            />
            {opt.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
```

`src/components/SurgeToggle.css`:

```css
.surge-toggle {
  border: none;
  padding: 0;
  margin: 1rem 0;
}

.surge-toggle__legend {
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.surge-toggle__options {
  display: flex;
  gap: 0.5rem;
}

.surge-toggle__option {
  flex: 1;
  padding: 0.5rem 1rem;
  border: 2px solid #d1d5db;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.15s;
}

.surge-toggle__option--active {
  border-color: #3b82f6;
  background-color: #eff6ff;
  color: #1d4ed8;
}

.surge-toggle__radio {
  display: none;
}
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 3: Commit**

```bash
git add src/components/SurgeToggle.*
git commit -m "feat: add SurgeToggle component"
```

---

### Task 7: Build the StatsSummary component

**Files:**

- Create: `src/components/StatsSummary.tsx`
- Create: `src/components/StatsSummary.css`

**Step 1: Write the component**

`src/components/StatsSummary.tsx`:

```tsx
import './StatsSummary.css';

interface StatsSummaryProps {
  expectedHits: number;
  expectedCrits: number;
  expectedTotal: number;
}

export function StatsSummary({
  expectedHits,
  expectedCrits,
  expectedTotal,
}: StatsSummaryProps) {
  return (
    <div className="stats-summary">
      <div className="stats-summary__stat">
        <span className="stats-summary__value">{expectedHits.toFixed(2)}</span>
        <span className="stats-summary__label">Avg Hits</span>
      </div>
      <div className="stats-summary__stat">
        <span className="stats-summary__value">{expectedCrits.toFixed(2)}</span>
        <span className="stats-summary__label">Avg Crits</span>
      </div>
      <div className="stats-summary__stat stats-summary__stat--total">
        <span className="stats-summary__value">{expectedTotal.toFixed(2)}</span>
        <span className="stats-summary__label">Avg Total</span>
      </div>
    </div>
  );
}
```

`src/components/StatsSummary.css`:

```css
.stats-summary {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stats-summary__stat {
  flex: 1;
  text-align: center;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.stats-summary__stat--total {
  background: #eff6ff;
  border-color: #3b82f6;
}

.stats-summary__value {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
}

.stats-summary__label {
  display: block;
  font-size: 0.85rem;
  color: #6b7280;
  margin-top: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 3: Commit**

```bash
git add src/components/StatsSummary.*
git commit -m "feat: add StatsSummary component"
```

---

### Task 8: Build the DistributionChart component

**Files:**

- Create: `src/components/DistributionChart.tsx`

**Step 1: Write the component**

```tsx
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface DistributionChartProps {
  distribution: { total: number; probability: number }[];
}

export function DistributionChart({ distribution }: DistributionChartProps) {
  const data = distribution.map((d) => ({
    ...d,
    percent: +(d.probability * 100).toFixed(1),
  }));

  return (
    <div>
      <h3>Probability Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 5, right: 20, bottom: 25, left: 0 }}
        >
          <XAxis
            dataKey="total"
            label={{
              value: 'Total Successes',
              position: 'insideBottom',
              offset: -15,
            }}
          />
          <YAxis
            tickFormatter={(v: number) => `${v}%`}
            label={{ value: 'Probability', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip formatter={(v: number) => [`${v}%`, 'Probability']} />
          <Bar dataKey="percent" radius={[4, 4, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={index} fill="#3b82f6" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 3: Commit**

```bash
git add src/components/DistributionChart.tsx
git commit -m "feat: add DistributionChart component"
```

---

### Task 9: Build the CumulativeTable component

**Files:**

- Create: `src/components/CumulativeTable.tsx`
- Create: `src/components/CumulativeTable.css`

**Step 1: Write the component**

`src/components/CumulativeTable.tsx`:

```tsx
import './CumulativeTable.css';

interface CumulativeTableProps {
  cumulative: { total: number; probability: number }[];
}

export function CumulativeTable({ cumulative }: CumulativeTableProps) {
  return (
    <div>
      <h3>Cumulative Probabilities</h3>
      <table className="cumulative-table">
        <thead>
          <tr>
            <th>At Least</th>
            <th>Probability</th>
          </tr>
        </thead>
        <tbody>
          {cumulative.map((row) => (
            <tr key={row.total}>
              <td>{row.total}</td>
              <td>{(row.probability * 100).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

`src/components/CumulativeTable.css`:

```css
.cumulative-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

.cumulative-table th,
.cumulative-table td {
  padding: 0.5rem 1rem;
  text-align: center;
  border-bottom: 1px solid #e5e7eb;
}

.cumulative-table th {
  background: #f9fafb;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.8rem;
  letter-spacing: 0.05em;
  color: #6b7280;
}

.cumulative-table tbody tr:nth-child(even) {
  background: #f9fafb;
}

.cumulative-table tbody tr:hover {
  background: #eff6ff;
}
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 3: Commit**

```bash
git add src/components/CumulativeTable.*
git commit -m "feat: add CumulativeTable component"
```

---

### Task 10: Wire everything together in App

**Files:**

- Modify: `src/App.tsx`
- Modify: `src/App.css`

**Step 1: Write App.tsx**

Replace the contents of `src/App.tsx`:

```tsx
import { useState, useMemo } from 'react';
import { AttackPool, SurgeConversion } from './types';
import { calculateAttackPool } from './engine/probability';
import { DiceSelector } from './components/DiceSelector';
import { SurgeToggle } from './components/SurgeToggle';
import { StatsSummary } from './components/StatsSummary';
import { DistributionChart } from './components/DistributionChart';
import { CumulativeTable } from './components/CumulativeTable';
import './App.css';

function App() {
  const [pool, setPool] = useState<AttackPool>({ red: 0, black: 0, white: 0 });
  const [surge, setSurge] = useState<SurgeConversion>('none');

  const results = useMemo(
    () => calculateAttackPool(pool, surge),
    [pool, surge]
  );

  const totalDice = pool.red + pool.black + pool.white;

  return (
    <div className="app">
      <header className="app__header">
        <h1>Legion Dice Calculator</h1>
      </header>

      <div className="app__layout">
        <section className="app__pool">
          <h2>Attack Pool</h2>
          <DiceSelector
            color="red"
            count={pool.red}
            onChange={(n) => setPool((p) => ({ ...p, red: n }))}
          />
          <DiceSelector
            color="black"
            count={pool.black}
            onChange={(n) => setPool((p) => ({ ...p, black: n }))}
          />
          <DiceSelector
            color="white"
            count={pool.white}
            onChange={(n) => setPool((p) => ({ ...p, white: n }))}
          />
          <SurgeToggle value={surge} onChange={setSurge} />
        </section>

        <section className="app__results">
          {totalDice === 0 ? (
            <p className="app__empty">Add dice to see results.</p>
          ) : (
            <>
              <StatsSummary
                expectedHits={results.expectedHits}
                expectedCrits={results.expectedCrits}
                expectedTotal={results.expectedTotal}
              />
              <DistributionChart distribution={results.distribution} />
              <CumulativeTable cumulative={results.cumulative} />
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default App;
```

**Step 2: Write App.css**

Replace the contents of `src/App.css`:

```css
.app {
  max-width: 960px;
  margin: 0 auto;
  padding: 1rem;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
}

.app__header {
  text-align: center;
  margin-bottom: 2rem;
}

.app__header h1 {
  font-size: 1.8rem;
  color: #111827;
}

.app__layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

@media (min-width: 768px) {
  .app__layout {
    grid-template-columns: 300px 1fr;
  }
}

.app__pool h2,
.app__results h2,
.app__results h3 {
  margin-top: 0;
  color: #111827;
}

.app__empty {
  text-align: center;
  color: #9ca3af;
  font-size: 1.1rem;
  padding: 3rem 0;
}
```

**Step 3: Clean up default Vite files**

Delete the default `src/assets/` folder and any unused default CSS/SVG files that Vite scaffolded (e.g., `src/index.css` if it exists -- move any global reset styles into `App.css`).

**Step 4: Verify it runs**

Run: `npm run dev`
Expected: App loads, dice selectors work, toggling surge updates results, chart and table render.

**Step 5: Run all tests**

Run: `npm run test`
Expected: All tests pass.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: wire up App with all components and probability engine"
```
