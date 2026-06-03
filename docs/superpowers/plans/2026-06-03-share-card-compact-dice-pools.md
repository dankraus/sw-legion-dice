# Share Card — Compact Attack Dice Pools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show attack dice on the share card as compact groups (`■ red ×8`) instead of one chip per die, so large pools do not overflow compare columns.

**Architecture:** Refactor `DiceRow` in `ShareCard.tsx` to map each non-zero die color to a single `.share-card__die-group` (chip + name + `×count`). Remove the redundant summary span. Add `.share-card__die-group` and `flex-wrap` in CSS. Tests assert the new text format and a bounded chip count for large pools.

**Tech Stack:** React 19, TypeScript 5.9, Vitest 4, @testing-library/react.

---

Spec: `docs/superpowers/specs/2026-06-03-share-card-compact-dice-pools-design.md`

## File Structure

| File | Change |
| ---- | ------ |
| `src/components/ShareCard.test.tsx` | Update composition assertion; add large-pool compare test |
| `src/components/ShareCard.tsx` | Replace `flatMap` chips + summary with die groups |
| `src/components/ShareCard.css` | `.share-card__die-group`, `flex-wrap` on `.share-card__dice` |

Docs in the spec are already updated; no further doc tasks.

---

### Task 1: Update ShareCard tests (TDD)

**Files:**
- Modify: `src/components/ShareCard.test.tsx`

- [ ] **Step 1: Update the composition test expectations**

Replace the `shows pool composition...` test body assertions. Keep the same config (`3 red, 1 black`); change lines 19–21:

```ts
    expect(getByText('red')).toBeTruthy();
    expect(getByText('black')).toBeTruthy();
    expect(getByText('×3')).toBeTruthy();
    expect(getByText('×1')).toBeTruthy();
    expect(getByText('Aim 2')).toBeTruthy();
    expect(getByText('Avg total')).toBeTruthy();
```

Remove `expect(getByText(/3 red/)).toBeTruthy();`.

- [ ] **Step 2: Add large-pool compare test**

Append before the closing `});` of the `describe('ShareCard')` block:

```ts
  it('uses one attack chip per color in compare mode for large pools', () => {
    const largePool = { red: 8, black: 8, white: 0 };
    const configA = {
      ...DEFAULT_POOL_CONFIG,
      pool: largePool,
    };
    const configB = {
      ...DEFAULT_POOL_CONFIG,
      pool: largePool,
    };
    const { getAllByText, container } = render(
      <ShareCard
        url="https://legionroller.com/#r=8&b=8"
        live={{
          config: configB,
          results: computePoolResults(configB),
          label: 'B',
        }}
        pinned={{
          config: configA,
          results: computePoolResults(configA),
          label: 'A',
        }}
      />
    );
    expect(getAllByText('×8').length).toBe(4);
    expect(container.querySelectorAll('.share-card__die').length).toBe(6);
  });
```

Rationale: compare mode renders two columns; each has 2 attack groups (1 chip each) + 1 defense chip → **6** `.share-card__die` total, not 32. Four `×8` labels (red and black per column).

- [ ] **Step 3: Run tests to verify failure**

Run: `npm run test -- src/components/ShareCard.test.tsx`
Expected: FAIL — `×3` / `×8` not found; chip count still 16+ in compare test.

- [ ] **Step 4: Commit**

```bash
git add src/components/ShareCard.test.tsx
git commit -m "test: expect compact die groups on share card"
```

---

### Task 2: Implement compact DiceRow and CSS

**Files:**
- Modify: `src/components/ShareCard.tsx` (`DiceRow`, lines 26–65)
- Modify: `src/components/ShareCard.css` (`.share-card__dice`, after `.share-card__die`)

- [ ] **Step 1: Replace `DiceRow` attack rendering**

In `src/components/ShareCard.tsx`, replace the entire `DiceRow` function with:

```tsx
function DiceRow({ config }: { config: PoolConfig }) {
  const attack: { color: string; count: number; name: string }[] = [
    { color: DIE_COLORS.red, count: config.pool.red, name: 'red' },
    { color: DIE_COLORS.black, count: config.pool.black, name: 'black' },
    { color: DIE_COLORS.white, count: config.pool.white, name: 'white' },
  ].filter((entry) => entry.count > 0);

  const defenseColor = config.defenseDieColor;
  const defenseLabel =
    defenseColor === 'white' ? 'White defense die' : 'Red defense die';

  return (
    <>
      <div className="share-card__pool-label">Attack</div>
      <div className="share-card__dice">
        {attack.length === 0 ? (
          <span>none</span>
        ) : (
          attack.map((entry) => (
            <span key={entry.name} className="share-card__die-group">
              <span
                className="share-card__die"
                style={{ background: entry.color }}
              />
              <span>{entry.name}</span>
              <span>×{entry.count}</span>
            </span>
          ))
        )}
      </div>
      <div className="share-card__pool-label">Defense</div>
      <div className="share-card__dice">
        <span
          className="share-card__die"
          style={{ background: DIE_COLORS[defenseColor] }}
        />
        <span>{defenseLabel}</span>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Add CSS for die groups and wrapping**

In `src/components/ShareCard.css`, update `.share-card__dice` to add `flex-wrap: wrap`:

```css
.share-card__dice {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  align-items: center;
  margin-top: 3px;
  font-size: 12px;
  color: #6b7280;
}
```

Insert after `.share-card__die { ... }`:

```css
.share-card__die-group {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
```

- [ ] **Step 3: Run tests**

Run: `npm run test -- src/components/ShareCard.test.tsx`
Expected: all ShareCard tests PASS.

- [ ] **Step 4: Run full test suite and lint**

Run: `npm run test`
Expected: all tests pass.

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 5: Manual check (optional but recommended)**

Run: `npm run dev`
Open Share modal with compare mode and a pool like 8 red + 8 black per side. Confirm attack row shows `red ×8` and `black ×8` groups without horizontal overflow.

- [ ] **Step 6: Commit**

```bash
git add src/components/ShareCard.tsx src/components/ShareCard.css
git commit -m "fix: compact share card attack dice with per-color multipliers"
```

---

## Spec coverage (self-review)

| Spec requirement | Task |
| ---------------- | ---- |
| Chip + color + `×N` per attack color | Task 2 `DiceRow` |
| Order red → black → white | Task 2 array order unchanged |
| Remove `N red · N black` summary | Task 2 removes `text` span |
| Defense unchanged | Task 2 defense block identical |
| Empty attack → `none` | Task 2 conditional |
| `.share-card__die-group` + flex-wrap | Task 2 CSS |
| Composition test update | Task 1 |
| Large compare pool test | Task 1 |
| Parent spec doc | Already done in brainstorming |

## Out of scope (confirmed)

- `shareText.ts`, main app UI, card widths — no tasks.
