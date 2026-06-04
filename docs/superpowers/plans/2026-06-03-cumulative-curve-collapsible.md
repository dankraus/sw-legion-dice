# Cumulative Curve with Collapsible Table Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace table-only cumulative probability display with a hybrid visualization combining a stepped line chart and expandable table.

**Architecture:** Create `CumulativeCurve` component that wraps a Recharts stepped line chart with a collapsible `CumulativeTable` below. Chart shows visual probability trends with tooltips, table provides exact values on demand. Component replaces existing `CumulativeTable` usage in `ComparisonResults` and `App`.

**Tech Stack:** React 19, TypeScript 5.9, Recharts 3.7, Vitest 4.0, CSS transitions

---

## File Structure

### New Files
- `src/components/CumulativeCurve.tsx` - Main hybrid component
- `src/components/CumulativeCurve.css` - Styling and animations
- `src/components/CumulativeCurve.test.tsx` - Unit tests

### Modified Files
- `src/components/ComparisonResults.tsx` - Replace two `CumulativeTable` usages
- `src/App.tsx` - Replace two `CumulativeTable` usages

### Reference Files
- `src/components/CumulativeTable.tsx` - Existing table component (reused, not modified)
- `src/components/DistributionChart.tsx` - Pattern reference for Recharts usage
- `docs/superpowers/specs/2026-06-03-cumulative-curve-collapsible-design.md` - Full spec

---

## Task 1: CumulativeCurve component structure (TDD)

**Files:**
- Create: `src/components/CumulativeCurve.test.tsx`
- Create: `src/components/CumulativeCurve.tsx`
- Create: `src/components/CumulativeCurve.css`

- [ ] **Step 1: Write failing test for basic rendering**

Create `src/components/CumulativeCurve.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CumulativeCurve } from './CumulativeCurve';

describe('CumulativeCurve', () => {
  it('renders with primary data', () => {
    const data = [
      { total: 0, probability: 1.0 },
      { total: 1, probability: 0.85 },
      { total: 2, probability: 0.60 },
    ];

    render(<CumulativeCurve cumulative={data} />);

    expect(screen.getByText('Cumulative Probabilities')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/CumulativeCurve.test.tsx`

Expected: FAIL with "Cannot find module './CumulativeCurve'"

- [ ] **Step 3: Create minimal component structure**

Create `src/components/CumulativeCurve.tsx`:

```typescript
import './CumulativeCurve.css';

type Row = { total: number; probability: number };

interface CumulativeCurveProps {
  cumulative: Row[];
  title?: string;
  secondary?: Row[];
  primaryLabel?: string;
  secondaryLabel?: string;
  defaultExpanded?: boolean;
}

export function CumulativeCurve({
  cumulative,
  title = 'Cumulative Probabilities',
  secondary,
  primaryLabel = 'A',
  secondaryLabel = 'B',
  defaultExpanded = false,
}: CumulativeCurveProps) {
  return (
    <div className="cumulative-curve">
      <h3>{title}</h3>
    </div>
  );
}
```

Create `src/components/CumulativeCurve.css`:

```css
.cumulative-curve {
  margin: 16px 0;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/CumulativeCurve.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/CumulativeCurve.*
git commit -m "test: add CumulativeCurve component with basic rendering test"
```

---

## Task 2: Data transformation helper (TDD)

**Files:**
- Modify: `src/components/CumulativeCurve.test.tsx`
- Modify: `src/components/CumulativeCurve.tsx`

- [ ] **Step 1: Write test for data transformation**

Add to `src/components/CumulativeCurve.test.tsx`:

```typescript
describe('CumulativeCurve data transformation', () => {
  it('carries forward cumulative probabilities for missing values', () => {
    const primary = [
      { total: 0, probability: 1.0 },
      { total: 1, probability: 0.85 },
      { total: 3, probability: 0.50 },
    ];
    const secondary = [
      { total: 0, probability: 1.0 },
      { total: 2, probability: 0.60 },
    ];

    // This test verifies the internal transformation logic by checking
    // that the chart receives correct data. We'll add a test helper to expose this.
    const transformed = transformCumulativeData(primary, secondary);

    expect(transformed).toEqual([
      { total: 0, primary: 100, secondary: 100 },
      { total: 1, primary: 85, secondary: 100 }, // secondary carries forward
      { total: 2, primary: 85, secondary: 60 }, // primary carries forward
      { total: 3, primary: 50, secondary: 60 }, // secondary carries forward
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/CumulativeCurve.test.tsx`

Expected: FAIL with "transformCumulativeData is not defined"

- [ ] **Step 3: Implement data transformation function**

Add to `src/components/CumulativeCurve.tsx`:

```typescript
interface ChartDataPoint {
  total: number;
  primary: number;
  secondary: number;
}

export function transformCumulativeData(
  primary: Row[],
  secondary?: Row[]
): ChartDataPoint[] {
  // Get all unique totals from both datasets
  const allTotals = Array.from(
    new Set([
      ...primary.map((row) => row.total),
      ...(secondary ?? []).map((row) => row.total),
    ])
  ).sort((a, b) => a - b);

  // Helper to find cumulative probability at a given total
  const probabilityAt = (rows: Row[], total: number): number => {
    // Find exact match or carry forward from previous value
    let lastProbability = 0;
    for (const row of rows) {
      if (row.total === total) {
        return row.probability * 100;
      }
      if (row.total < total) {
        lastProbability = row.probability * 100;
      }
      if (row.total > total) {
        break;
      }
    }
    return lastProbability;
  };

  return allTotals.map((total) => ({
    total,
    primary: probabilityAt(primary, total),
    secondary: secondary ? probabilityAt(secondary, total) : 0,
  }));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/CumulativeCurve.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/CumulativeCurve.*
git commit -m "feat: add cumulative data transformation with carry-forward logic"
```

---

## Task 3: Line chart rendering (TDD)

**Files:**
- Modify: `src/components/CumulativeCurve.test.tsx`
- Modify: `src/components/CumulativeCurve.tsx`
- Modify: `src/components/CumulativeCurve.css`

- [ ] **Step 1: Write test for chart rendering**

Add to `src/components/CumulativeCurve.test.tsx`:

```typescript
it('renders line chart with primary data', () => {
  const data = [
    { total: 0, probability: 1.0 },
    { total: 1, probability: 0.85 },
  ];

  render(<CumulativeCurve cumulative={data} />);

  // Recharts renders an SVG
  const chart = screen.getByRole('img', { hidden: true });
  expect(chart).toBeInTheDocument();
});

it('renders line chart with primary and secondary data', () => {
  const primary = [{ total: 0, probability: 1.0 }];
  const secondary = [{ total: 0, probability: 0.9 }];

  render(
    <CumulativeCurve
      cumulative={primary}
      secondary={secondary}
      primaryLabel="Pool A"
      secondaryLabel="Pool B"
    />
  );

  expect(screen.getByText('Pool A')).toBeInTheDocument();
  expect(screen.getByText('Pool B')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/CumulativeCurve.test.tsx`

Expected: FAIL - chart not found

- [ ] **Step 3: Add Recharts LineChart**

Modify `src/components/CumulativeCurve.tsx`:

```typescript
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import './CumulativeCurve.css';

// ... existing types and transformCumulativeData ...

const COLOR_PRIMARY = '#2563eb';
const COLOR_SECONDARY = '#f59e0b';

export function CumulativeCurve({
  cumulative,
  title = 'Cumulative Probabilities',
  secondary,
  primaryLabel = 'A',
  secondaryLabel = 'B',
  defaultExpanded = false,
}: CumulativeCurveProps) {
  const hasSecondary = secondary !== undefined;
  const chartData = transformCumulativeData(cumulative, secondary);

  return (
    <div className="cumulative-curve">
      <div className="cumulative-curve__header">
        <h3>{title}</h3>
      </div>

      <div className="cumulative-curve__chart">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 20, bottom: 25, left: 0 }}
          >
            <XAxis
              dataKey="total"
              label={{ value: 'At Least', position: 'insideBottom', offset: -15 }}
            />
            <YAxis
              tickFormatter={(value: number) => `${value}%`}
              label={{ value: 'Probability', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip formatter={(value) => [`${value}%`, 'Probability']} />
            {hasSecondary && <Legend verticalAlign="top" height={24} />}
            <Line
              type="stepAfter"
              dataKey="primary"
              name={primaryLabel}
              stroke={COLOR_PRIMARY}
              strokeWidth={2.5}
              dot={false}
            />
            {hasSecondary && (
              <Line
                type="stepAfter"
                dataKey="secondary"
                name={secondaryLabel}
                stroke={COLOR_SECONDARY}
                strokeWidth={2.5}
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

Update `src/components/CumulativeCurve.css`:

```css
.cumulative-curve {
  margin: 16px 0;
}

.cumulative-curve__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.cumulative-curve__header h3 {
  margin: 0;
}

.cumulative-curve__chart {
  margin: 16px 0;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/CumulativeCurve.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/CumulativeCurve.*
git commit -m "feat: add Recharts line chart with stepped lines"
```

---

## Task 4: Collapsible table toggle (TDD)

**Files:**
- Modify: `src/components/CumulativeCurve.test.tsx`
- Modify: `src/components/CumulativeCurve.tsx`
- Modify: `src/components/CumulativeCurve.css`

- [ ] **Step 1: Write test for toggle button**

Add to `src/components/CumulativeCurve.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ... existing tests ...

it('has toggle button that starts collapsed', () => {
  const data = [{ total: 0, probability: 1.0 }];

  render(<CumulativeCurve cumulative={data} />);

  const button = screen.getByRole('button', { name: /show exact values/i });
  expect(button).toBeInTheDocument();
  expect(button).toHaveAttribute('aria-expanded', 'false');
});

it('expands table when toggle button clicked', async () => {
  const user = userEvent.setup();
  const data = [{ total: 0, probability: 1.0 }];

  render(<CumulativeCurve cumulative={data} />);

  const button = screen.getByRole('button', { name: /show exact values/i });
  await user.click(button);

  expect(button).toHaveAttribute('aria-expanded', 'true');
  expect(button).toHaveTextContent(/hide exact values/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/CumulativeCurve.test.tsx`

Expected: FAIL - button not found

- [ ] **Step 3: Add toggle button and state**

Modify `src/components/CumulativeCurve.tsx`:

```typescript
import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import './CumulativeCurve.css';

// ... existing types and helpers ...

export function CumulativeCurve({
  cumulative,
  title = 'Cumulative Probabilities',
  secondary,
  primaryLabel = 'A',
  secondaryLabel = 'B',
  defaultExpanded = false,
}: CumulativeCurveProps) {
  const [isTableExpanded, setIsTableExpanded] = useState(defaultExpanded);
  const hasSecondary = secondary !== undefined;
  const chartData = transformCumulativeData(cumulative, secondary);

  return (
    <div className="cumulative-curve">
      <div className="cumulative-curve__header">
        <h3>{title}</h3>
        <button
          className="cumulative-curve__toggle"
          onClick={() => setIsTableExpanded(!isTableExpanded)}
          aria-expanded={isTableExpanded}
          aria-controls="cumulative-table-region"
        >
          {isTableExpanded ? 'Hide exact values ▲' : 'Show exact values ▼'}
        </button>
      </div>

      <div className="cumulative-curve__chart">
        {/* ... existing chart ... */}
      </div>
    </div>
  );
}
```

Update `src/components/CumulativeCurve.css`:

```css
.cumulative-curve {
  margin: 16px 0;
}

.cumulative-curve__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.cumulative-curve__header h3 {
  margin: 0;
}

.cumulative-curve__toggle {
  padding: 6px 12px;
  font-size: 13px;
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  cursor: pointer;
  color: #475569;
  transition: background-color 0.15s;
}

.cumulative-curve__toggle:hover {
  background-color: #f8fafc;
}

.cumulative-curve__toggle:focus {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

.cumulative-curve__chart {
  margin: 16px 0;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/CumulativeCurve.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/CumulativeCurve.*
git commit -m "feat: add collapsible toggle button with state"
```

---

## Task 5: Integrate CumulativeTable with animation (TDD)

**Files:**
- Modify: `src/components/CumulativeCurve.test.tsx`
- Modify: `src/components/CumulativeCurve.tsx`
- Modify: `src/components/CumulativeCurve.css`

- [ ] **Step 1: Write test for table rendering**

Add to `src/components/CumulativeCurve.test.tsx`:

```typescript
it('shows table when expanded', async () => {
  const user = userEvent.setup();
  const data = [
    { total: 0, probability: 1.0 },
    { total: 1, probability: 0.75 },
  ];

  render(<CumulativeCurve cumulative={data} />);

  // Table region exists but is collapsed
  const tableRegion = screen.getByRole('region', { name: /cumulative probabilities/i });
  expect(tableRegion).toHaveClass('cumulative-curve__table-wrapper--collapsed');

  // Click toggle button
  const button = screen.getByRole('button', { name: /show exact values/i });
  await user.click(button);

  // Table region now expanded
  expect(tableRegion).toHaveClass('cumulative-curve__table-wrapper--expanded');

  // Table content visible
  expect(screen.getByText('At Least')).toBeInTheDocument();
  expect(screen.getByText('75.0%')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/CumulativeCurve.test.tsx`

Expected: FAIL - table region not found

- [ ] **Step 3: Add CumulativeTable with collapsible wrapper**

Modify `src/components/CumulativeCurve.tsx`:

```typescript
import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { CumulativeTable } from './CumulativeTable';
import './CumulativeCurve.css';

// ... existing code ...

export function CumulativeCurve({
  cumulative,
  title = 'Cumulative Probabilities',
  secondary,
  primaryLabel = 'A',
  secondaryLabel = 'B',
  defaultExpanded = false,
}: CumulativeCurveProps) {
  const [isTableExpanded, setIsTableExpanded] = useState(defaultExpanded);
  const hasSecondary = secondary !== undefined;
  const chartData = transformCumulativeData(cumulative, secondary);

  return (
    <div className="cumulative-curve">
      <div className="cumulative-curve__header">
        <h3>{title}</h3>
        <button
          className="cumulative-curve__toggle"
          onClick={() => setIsTableExpanded(!isTableExpanded)}
          aria-expanded={isTableExpanded}
          aria-controls="cumulative-table-region"
        >
          {isTableExpanded ? 'Hide exact values ▲' : 'Show exact values ▼'}
        </button>
      </div>

      <div className="cumulative-curve__chart">
        {/* ... existing chart ... */}
      </div>

      <div
        id="cumulative-table-region"
        className={`cumulative-curve__table-wrapper ${
          isTableExpanded
            ? 'cumulative-curve__table-wrapper--expanded'
            : 'cumulative-curve__table-wrapper--collapsed'
        }`}
        role="region"
        aria-labelledby={title}
      >
        <CumulativeTable
          cumulative={cumulative}
          secondary={secondary}
          title=""
          primaryLabel={primaryLabel}
          secondaryLabel={secondaryLabel}
        />
      </div>
    </div>
  );
}
```

Update `src/components/CumulativeCurve.css`:

```css
.cumulative-curve {
  margin: 16px 0;
}

.cumulative-curve__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.cumulative-curve__header h3 {
  margin: 0;
}

.cumulative-curve__toggle {
  padding: 6px 12px;
  font-size: 13px;
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  cursor: pointer;
  color: #475569;
  transition: background-color 0.15s;
}

.cumulative-curve__toggle:hover {
  background-color: #f8fafc;
}

.cumulative-curve__toggle:focus {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

.cumulative-curve__chart {
  margin: 16px 0;
}

.cumulative-curve__table-wrapper {
  overflow: hidden;
  transition: max-height 0.2s ease-in-out;
  margin-top: 12px;
}

.cumulative-curve__table-wrapper--collapsed {
  max-height: 0;
}

.cumulative-curve__table-wrapper--expanded {
  max-height: 1000px;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/CumulativeCurve.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/CumulativeCurve.*
git commit -m "feat: integrate CumulativeTable with collapsible animation"
```

---

## Task 6: Edge cases and accessibility (TDD)

**Files:**
- Modify: `src/components/CumulativeCurve.test.tsx`
- Modify: `src/components/CumulativeCurve.tsx`

- [ ] **Step 1: Write tests for edge cases**

Add to `src/components/CumulativeCurve.test.tsx`:

```typescript
it('respects defaultExpanded prop', () => {
  const data = [{ total: 0, probability: 1.0 }];

  render(<CumulativeCurve cumulative={data} defaultExpanded={true} />);

  const button = screen.getByRole('button');
  expect(button).toHaveAttribute('aria-expanded', 'true');
  expect(button).toHaveTextContent(/hide exact values/i);
});

it('handles empty data gracefully', () => {
  render(<CumulativeCurve cumulative={[]} />);

  expect(screen.getByText('Cumulative Probabilities')).toBeInTheDocument();
  // Chart should still render (Recharts handles empty data)
});

it('handles single data point', () => {
  const data = [{ total: 5, probability: 0.42 }];

  render(<CumulativeCurve cumulative={data} />);

  expect(screen.getByText('Cumulative Probabilities')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npm test -- src/components/CumulativeCurve.test.tsx`

Expected: PASS (edge cases handled by existing implementation and Recharts)

- [ ] **Step 3: Run full test suite**

Run: `npm test`

Expected: All tests PASS

- [ ] **Step 4: Run linter**

Run: `npm run lint`

Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/components/CumulativeCurve.test.tsx
git commit -m "test: add edge case and accessibility tests"
```

---

## Task 7: Replace CumulativeTable in ComparisonResults (TDD)

**Files:**
- Modify: `src/components/ComparisonResults.test.tsx`
- Modify: `src/components/ComparisonResults.tsx`

- [ ] **Step 1: Write test for CumulativeCurve usage**

Add to `src/components/ComparisonResults.test.tsx`:

```typescript
it('renders cumulative curves instead of tables', () => {
  const { container } = render(
    <ComparisonResults
      configA={mockConfigA}
      configB={mockConfigB}
      resultsA={mockResultsA}
      resultsB={mockResultsB}
      costA="100"
      costB="120"
      labelA="Pool A"
      labelB="Pool B"
      activePool="A"
      onSelectPoolA={() => {}}
      onSelectPoolB={() => {}}
      onLabelAChange={() => {}}
      onLabelBChange={() => {}}
    />
  );

  // Check that CumulativeCurve components render (chart presence)
  const charts = container.querySelectorAll('.recharts-line');
  expect(charts.length).toBeGreaterThan(0);

  // Check for toggle buttons
  expect(screen.getAllByText(/show exact values/i).length).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/ComparisonResults.test.tsx`

Expected: FAIL - recharts-line elements not found

- [ ] **Step 3: Replace CumulativeTable imports and usage**

Modify `src/components/ComparisonResults.tsx`:

```typescript
// Replace this import:
// import { CumulativeTable } from './CumulativeTable';
// With:
import { CumulativeCurve } from './CumulativeCurve';

// ... rest of file unchanged until cumulative sections ...

// Replace line ~138-145:
<div className="comparison__cumulatives">
  <CumulativeCurve
    cumulative={resultsA.results.cumulative}
    secondary={resultsB.results.cumulative}
    title="At Least N Successes"
    primaryLabel={labelA}
    secondaryLabel={labelB}
  />
  <CumulativeCurve
    cumulative={resultsA.woundsResults.cumulative}
    secondary={resultsB.woundsResults.cumulative}
    title="At Least N Wounds"
    primaryLabel={labelA}
    secondaryLabel={labelB}
  />
</div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/ComparisonResults.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ComparisonResults.*
git commit -m "feat: replace CumulativeTable with CumulativeCurve in ComparisonResults"
```

---

## Task 8: Replace CumulativeTable in App (TDD)

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Replace import in App**

Modify `src/App.tsx`:

```typescript
// Replace this import (around line 27):
// import { CumulativeTable } from './components/CumulativeTable';
// With:
import { CumulativeCurve } from './components/CumulativeCurve';
```

- [ ] **Step 2: Replace first CumulativeTable usage (attack)**

Find around line 893 and replace:

```typescript
// Replace:
<CumulativeTable
  cumulative={attackResults.cumulative}
  title="At Least N Successes"
/>
// With:
<CumulativeCurve
  cumulative={attackResults.cumulative}
  title="At Least N Successes"
/>
```

- [ ] **Step 3: Replace second CumulativeTable usage (wounds)**

Find around line 922 and replace:

```typescript
// Replace:
<CumulativeTable
  cumulative={woundsResults.cumulative}
  title="At Least N Wounds"
/>
// With:
<CumulativeCurve
  cumulative={woundsResults.cumulative}
  title="At Least N Wounds"
/>
```

- [ ] **Step 4: Run tests**

Run: `npm test`

Expected: All tests PASS

- [ ] **Step 5: Run dev server for manual verification**

Run: `npm run dev`

Actions:
1. Open http://localhost:5173
2. Verify cumulative curves render with toggle buttons
3. Test toggle button expands/collapses table
4. Verify chart shows stepped lines
5. Enable comparison mode (pin a pool)
6. Verify both datasets show as separate lines

Expected: All visual checks pass

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "feat: replace CumulativeTable with CumulativeCurve in App"
```

---

## Task 9: Visual regression and final verification

**Files:**
- None (manual testing and verification)

- [ ] **Step 1: Run full test suite**

Run: `npm test`

Expected: All tests PASS (29 existing + new CumulativeCurve tests)

- [ ] **Step 2: Run linter**

Run: `npm run lint`

Expected: No errors

- [ ] **Step 3: Run build**

Run: `npm run build`

Expected: Build succeeds (chunk size warning expected, non-blocking)

- [ ] **Step 4: Manual testing checklist**

Run: `npm run dev` and verify:

**Single pool mode:**
- [ ] Cumulative curve shows for attack successes
- [ ] Cumulative curve shows for wounds
- [ ] Toggle button expands/collapses table
- [ ] Chart uses stepped lines (not smooth curves)
- [ ] Tooltip shows percentages on hover
- [ ] Table values match chart when expanded

**Comparison mode:**
- [ ] Pin a pool to enable comparison
- [ ] Both lines visible with different colors (blue/amber)
- [ ] Legend shows both pool labels
- [ ] Toggle button works for both cumulative sections
- [ ] Tables show both columns when expanded
- [ ] Lines diverge/converge as expected

**Accessibility:**
- [ ] Keyboard: Tab to toggle button, Space/Enter toggles
- [ ] Screen reader: Button announces expanded state
- [ ] Focus visible on button

**Edge cases:**
- [ ] Empty pools (0 dice) handle gracefully
- [ ] Large ranges (10+ successes) display correctly
- [ ] Mobile viewport: layout stacks properly

- [ ] **Step 5: Final commit**

```bash
git add -A
git status
# If any untracked files need committing
git commit -m "chore: final verification and cleanup"
```

---

## Completion Checklist

- [ ] All unit tests passing
- [ ] No linter errors
- [ ] Build succeeds
- [ ] Manual testing complete
- [ ] CumulativeTable preserved (backward compatibility)
- [ ] Both ComparisonResults and App updated
- [ ] Documentation (spec) matches implementation

**Next steps:** Merge to main via PR or direct merge based on project workflow.
