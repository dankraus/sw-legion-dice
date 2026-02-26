# Defense Rule-Accurate Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Model defense by Legion rules: defense dice count = attack successes per outcome. User only sets defense die color (Red | White) and Defense Surge (None | Block). Wounds computed rule-accurately by conditioning defense on each attack total.

**Architecture:** Add `getDefenseDistributionForDiceCount(diceCount, color, surge)` (implement via existing `calculateDefensePool` with pool { red: n, white: 0 } or { red: 0, white: n }). Change `calculateWounds(attackResults, defenseDieColor, defenseSurge)` to loop attack distribution, get defense for n dice per outcome, merge into wounds distribution. UI: remove red/white DiceSelectors; add single "Defense dice: Red | White" control; state is `defenseDieColor` + `defenseSurge` only.

**Tech Stack:** React, TypeScript, Vitest. No new dependencies.

---

### Task 1: Engine – getDefenseDistributionForDiceCount (TDD)

**Files:**
- Modify: `src/engine/probability.ts`
- Test: `src/engine/__tests__/probability.test.ts`

**Step 1: Write the failing test**

Add a new describe block in `src/engine/__tests__/probability.test.ts` (after the imports, add `getDefenseDistributionForDiceCount` to the import from `'../probability'`):

```ts
describe('getDefenseDistributionForDiceCount', () => {
  it('0 dice returns 0 blocks with probability 1', () => {
    const result = getDefenseDistributionForDiceCount(0, 'red', 'none');
    expect(result.expectedBlocks).toBe(0);
    expect(result.distribution).toHaveLength(1);
    expect(result.distribution[0]).toEqual({ total: 0, probability: 1 });
  });

  it('1 red die with none has expected blocks 3/6', () => {
    const result = getDefenseDistributionForDiceCount(1, 'red', 'none');
    expect(result.expectedBlocks).toBeCloseTo(3 / 6);
  });

  it('1 white die with block has expected blocks 1/6', () => {
    const result = getDefenseDistributionForDiceCount(1, 'white', 'block');
    expect(result.expectedBlocks).toBeCloseTo(1 / 6);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/engine/__tests__/probability.test.ts -t "getDefenseDistributionForDiceCount"`
Expected: FAIL (e.g. getDefenseDistributionForDiceCount is not a function)

**Step 3: Implement**

In `src/engine/probability.ts`, add and export:

```ts
export function getDefenseDistributionForDiceCount(
  diceCount: number,
  color: DefenseDieColor,
  surge: DefenseSurgeConversion
): DefenseResults {
  const pool: DefensePool =
    color === 'red' ? { red: diceCount, white: 0 } : { red: 0, white: diceCount };
  return calculateDefensePool(pool, surge);
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/engine/__tests__/probability.test.ts -t "getDefenseDistributionForDiceCount"`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/probability.ts src/engine/__tests__/probability.test.ts
git commit -m "feat(engine): getDefenseDistributionForDiceCount for rule-accurate defense"
```

---

### Task 2: Engine – calculateWounds new signature and rule-accurate implementation (TDD)

**Files:**
- Modify: `src/engine/probability.ts`
- Test: `src/engine/__tests__/probability.test.ts`

**Step 1: Add one failing test for new wounds API**

Add one test to the existing `describe('calculateWounds', ...)` that uses the new 3-argument signature so the test run fails (current signature is 2 args):

```ts
  it('zero attack dice yields 0 wounds', () => {
    const attackResults = calculateAttackPool({ red: 0, black: 0, white: 0 }, 'none');
    const wounds = calculateWounds(attackResults, 'red', 'none');
    expect(wounds.expectedWounds).toBe(0);
    expect(wounds.distribution).toHaveLength(1);
    expect(wounds.distribution[0]).toEqual({ total: 0, probability: 1 });
  });
```

**Step 2: Run tests – expect failures (old signature or wrong behavior)**

Run: `npm test -- src/engine/__tests__/probability.test.ts -t "calculateWounds"`
Expected: Failures (calculateWounds called with 3 args fails, or existing tests still use 2 args)

**Step 3: Change calculateWounds signature and implementation**

In `src/engine/probability.ts`:

- Change signature to:
  `calculateWounds(attackResults: AttackResults, defenseDieColor: DefenseDieColor, defenseSurge: DefenseSurgeConversion): WoundsResults`
- Replace body: iterate over `attackResults.distribution`. For each (attackTotal, attackProb), call `getDefenseDistributionForDiceCount(attackTotal, defenseDieColor, defenseSurge)`. For each (blocks, defProb) in that defense distribution, wounds = max(0, attackTotal - blocks), add attackProb * defProb to wounds distribution. Build expectedWounds, distribution array, and cumulative from that.

**Step 4: Update existing calculateWounds tests to new signature**

Replace the existing `describe('calculateWounds', () => { ... })` block with the following. It keeps one merged describe that uses the new signature and includes both the new rule-accurate tests and adapted versions of the old scenarios:

```ts
describe('calculateWounds', () => {
  it('zero attack dice yields 0 wounds', () => {
    const attackResults = calculateAttackPool({ red: 0, black: 0, white: 0 }, 'none');
    const wounds = calculateWounds(attackResults, 'red', 'none');
    expect(wounds.expectedWounds).toBe(0);
    expect(wounds.distribution).toHaveLength(1);
    expect(wounds.distribution[0]).toEqual({ total: 0, probability: 1 });
  });

  it('attack always 1 success, red defense none: expected wounds 1 - 3/6', () => {
    const attackResults = calculateAttackPool({ red: 0, black: 0, white: 0 }, 'none');
    const attackDist = [
      { total: 0, probability: 0 },
      { total: 1, probability: 1 },
      { total: 2, probability: 0 },
    ];
    const attackWithDist = { ...attackResults, distribution: attackDist };
    const wounds = calculateWounds(attackWithDist, 'red', 'none');
    const sum = wounds.distribution.reduce((acc, entry) => acc + entry.probability, 0);
    expect(sum).toBeCloseTo(1);
    expect(wounds.expectedWounds).toBeCloseTo(1 - 3 / 6);
  });

  it('attack 50% 0 / 50% 2, red defense none: wounds distribution sums to 1', () => {
    const attackResults = calculateAttackPool({ red: 0, black: 0, white: 0 }, 'none');
    const attackDist = [
      { total: 0, probability: 0.5 },
      { total: 1, probability: 0 },
      { total: 2, probability: 0.5 },
    ];
    const attackWithDist = { ...attackResults, distribution: attackDist };
    const wounds = calculateWounds(attackWithDist, 'red', 'none');
    const sum = wounds.distribution.reduce((acc, entry) => acc + entry.probability, 0);
    expect(sum).toBeCloseTo(1);
  });

  it('attack pool red 1 none: wounds distribution sums to 1', () => {
    const attackResults = calculateAttackPool({ red: 1, black: 0, white: 0 }, 'none');
    const wounds = calculateWounds(attackResults, 'red', 'none');
    const sum = wounds.distribution.reduce((acc, entry) => acc + entry.probability, 0);
    expect(sum).toBeCloseTo(1);
  });

  it('attack pool 2 red 1 black hit, red defense block: wounds distribution sums to 1', () => {
    const attackResults = calculateAttackPool({ red: 2, black: 1, white: 0 }, 'hit');
    const wounds = calculateWounds(attackResults, 'red', 'block');
    const sum = wounds.distribution.reduce((acc, entry) => acc + entry.probability, 0);
    expect(sum).toBeCloseTo(1);
  });
});
```

Delete the old four tests that used `defenseResults` and the mock `attackDist`/`defenseResults` objects. The above block is the full replacement for the describe.

**Step 5: Run all probability tests**

Run: `npm test -- src/engine/__tests__/probability.test.ts`
Expected: All PASS

**Step 6: Commit**

```bash
git add src/engine/probability.ts src/engine/__tests__/probability.test.ts
git commit -m "feat(engine): rule-accurate calculateWounds(defenseDieColor, defenseSurge)"
```

---

### Task 3: Types – remove DefensePool from main flow (optional export keep)

**Files:**
- Modify: `src/types.ts`

**Step 1:** Keep `DefensePool` and `DefenseResults` in types (engine still uses DefensePool internally for `calculateDefensePool` / `getDefenseDistributionForDiceCount`). No type file change required unless you want to document that DefensePool is internal. Skip or add a comment in types that DefensePool is for engine use only.

**Step 2: Commit (if any change)**

If you added a comment: `git add src/types.ts && git commit -m "docs(types): DefensePool internal to engine"`

---

### Task 4: UI – Defense die color control and remove pool selectors

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.css` (if needed for new control layout)

**Step 1: Update state and imports**

- Remove `DefensePool` from imports; add `DefenseDieColor` if not present.
- Remove `defensePool` state and `setDefensePool`. Add `defenseDieColor` state: `useState<DefenseDieColor>('red')`.
- Remove `calculateDefensePool` from imports and from useMemo; remove `defenseResults` useMemo.
- Update `woundsResults` useMemo to call `calculateWounds(results, defenseDieColor, defenseSurge)` (no defenseResults).
- Remove `totalDefenseDice` (or derive only for display if needed). Update `handleReset` to set `defenseDieColor('red')` instead of `setDefensePool({ red: 0, white: 0 })`.

**Step 2: Replace Defense Pool section in JSX**

Replace the Defense Pool heading and the two DiceSelectors + DefenseSurgeToggle with:

- Heading: "Defense"
- A single control for "Defense dice: Red | White" (e.g. a fieldset with two radio inputs, or a select). Use `defenseDieColor` and `setDefenseDieColor`. Labels: "Red", "White".
- Keep `<DefenseSurgeToggle value={defenseSurge} onChange={setDefenseSurge} />`.

**Step 3: Update results section**

- Where it says `totalDefenseDice > 0`: change to showing wounds whenever there is attack (totalDice > 0). Remove the standalone "Defense" block (Avg Blocks, Blocks Distribution, Defense: At Least N Blocks) since defense pool size is no longer user-set; or keep a short line like "Defense: N dice (red/white) per attack outcome" without a distribution. Per design: "No defense pool size or standalone Avg Blocks; defense is implicit in wounds." So remove the block that shows Defense stats and charts (the `{totalDefenseDice > 0 && (...)}` block).
- Show Wounds section when `totalDice > 0` (remove requirement for `totalDefenseDice > 0`). So: `{totalDice > 0 && (... wounds ...)}`.

**Step 4: Run app and quick smoke test**

Run: `npm run dev`. Set attack dice, choose Red then White, toggle Defense Surge; confirm wounds update. Reset and confirm.

**Step 5: Run tests**

Run: `npm test`
Expected: All PASS

**Step 6: Commit**

```bash
git add src/App.tsx src/App.css
git commit -m "feat(ui): defense die color (red/white) only, remove pool selectors; rule-accurate wounds"
```

---

### Task 5: Verification and docs

**Files:**
- Modify: `docs/plans/2026-02-25-defense-rule-accurate-design.md` (optional: add "Implemented" note)

**Step 1: Full test run**

Run: `npm test`
Expected: All tests pass.

**Step 2: Lint**

Run: `npm run lint`
Expected: No errors.

**Step 3: Manual check**

- Attack only: set dice, see attack results; no defense section with dice counts; wounds section shows (rule-accurate with chosen color/surge).
- Change Red ↔ White: wounds change. Change None ↔ Block: wounds change.
- Reset: defense resets to Red, None.

**Step 4: Optional doc update and commit**

If you add "Implemented" to the design doc:
```bash
git add docs/plans/2026-02-25-defense-rule-accurate-design.md
git commit -m "docs: mark defense rule-accurate design as implemented"
```
