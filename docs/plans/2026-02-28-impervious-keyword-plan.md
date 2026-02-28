# Impervious Keyword (Defense) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Impervious defense keyword: while defending, roll extra defense dice equal to the attack pool’s total Pierce X.

**Architecture:** Add optional `impervious` boolean through the stack. In sim, after computing base `defenseDice`, add `impervious ? normalizedPierceX : 0` to the count, then roll and resolve as today. Pierce still applies (blocks − pierceX). UI: one checkbox in Defense section (e.g. after Armor, before DefenseSurgeToggle), same pattern as Backup/Outmaneuver.

**Tech Stack:** TypeScript, React, Vite, Vitest. See `AGENTS.md` for commands.

**Design:** `docs/plans/2026-02-28-impervious-keyword-design.md`

---

### Task 1: Failing sim test — Impervious adds extra defense dice

**Files:**

- Modify: `src/engine/__tests__/simulate.test.ts`

**Step 1: Add test for Impervious in wounds simulation**

In `simulate.test.ts`, add a new `describe('Impervious in wounds simulation', () => { ... })`. Use `simulateWoundsFromAttackResults` with a single (hits, crits) outcome: build `attackResults` with `distributionByHitsCrits: [{ hits: 2, crits: 0, probability: 1 }]`. Call with no cover, no backup, pierceX 2, once with `impervious: false` and once with `impervious: true`. Assert that expected wounds with `impervious: true` are less than or equal to expected wounds with `impervious: false` (extra defense dice help the defender). The test will fail with a type/argument error until Task 2 adds the parameter and applies Impervious.

Example shape (adapt to existing test style and imports). Pass `impervious` as the argument after `pierceX`; the test will fail until Task 2.

```ts
describe('Impervious in wounds simulation', () => {
  it('impervious true with pierce 2 yields lower or equal expected wounds than impervious false', () => {
    const attackResults: AttackResults = {
      expectedHits: 2,
      expectedCrits: 0,
      expectedTotal: 2,
      distribution: [],
      distributionByHitsCrits: [{ hits: 2, crits: 0, probability: 1 }],
      cumulative: [],
    };
    const runs = 5000;
    const rng = createSeededRng(42);
    const woundsNoImpervious = simulateWoundsFromAttackResults(
      attackResults,
      'red',
      'none',
      0,
      false,
      undefined,
      'none',
      false,
      false,
      0,
      0,
      false,
      0,
      0,
      2, // pierceX
      false, // impervious
      runs,
      rng
    );
    const woundsImpervious = simulateWoundsFromAttackResults(
      attackResults,
      'red',
      'none',
      0,
      false,
      undefined,
      'none',
      false,
      false,
      0,
      0,
      false,
      0,
      0,
      2, // pierceX
      true, // impervious
      runs,
      rng
    );
    expect(woundsImpervious.expectedWounds).toBeLessThanOrEqual(
      woundsNoImpervious.expectedWounds
    );
  });

  it('impervious with pierce 0 yields same expected wounds as no impervious', () => {
    const attackResults: AttackResults = {
      expectedHits: 2,
      expectedCrits: 0,
      expectedTotal: 2,
      distribution: [],
      distributionByHitsCrits: [{ hits: 2, crits: 0, probability: 1 }],
      cumulative: [],
    };
    const runs = 5000;
    const rng = createSeededRng(42);
    const woundsNoImpervious = simulateWoundsFromAttackResults(
      attackResults,
      'red',
      'none',
      0,
      false,
      undefined,
      'none',
      false,
      false,
      0,
      0,
      false,
      0,
      0,
      0, // pierceX
      false,
      runs,
      rng
    );
    const woundsImpervious = simulateWoundsFromAttackResults(
      attackResults,
      'red',
      'none',
      0,
      false,
      undefined,
      'none',
      false,
      false,
      0,
      0,
      false,
      0,
      0,
      0, // pierceX
      true,
      runs,
      rng
    );
    expect(woundsImpervious.expectedWounds).toBeCloseTo(
      woundsNoImpervious.expectedWounds,
      10
    );
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/engine/__tests__/simulate.test.ts -t "Impervious"`

Expected: FAIL (e.g. missing argument or extra argument until Impervious is added).

**Step 3: (After Task 2) Run test to verify it passes**

Run: `npm run test -- src/engine/__tests__/simulate.test.ts -t "Impervious"`

Expected: PASS

**Step 4: Commit**

```bash
git add src/engine/__tests__/simulate.test.ts
git commit -m "test(sim): Impervious in wounds simulation"
```

---

### Task 2: Implement Impervious in simulate.ts

**Files:**

- Modify: `src/engine/simulate.ts` (signatures and defense-dice step for both `simulateWounds` and `simulateWoundsFromAttackResults`)

**Step 1: Add impervious to simulateWoundsFromAttackResults**

- Add parameter `impervious: boolean = false` after `pierceX` and before `runs`.
- After the line that sets `const defenseDice = outmaneuver ? ... : ...`, add:
  - `const extraDiceFromImpervious = impervious ? normalizedPierceX : 0;`
  - `const totalDefenseDice = defenseDice + extraDiceFromImpervious;`
- Replace the loop that rolls `defenseDice` dice with a loop that rolls `totalDefenseDice` dice (and keep using `defenseDice` for the wounds calculation if the rule is wounds = totalDefenseDice - effectiveBlocks; effectiveBlocks = blocks - pierceX, so wounds = totalDefenseDice - (blocks - pierceX). So we roll `totalDefenseDice` dice and then `wounds = Math.max(0, totalDefenseDice - effectiveBlocks)`. So the variable used for both the loop count and the wounds formula should be the same total. Replace `defenseDice` in the loop and in `wounds = Math.max(0, defenseDice - effectiveBlocks)` with `totalDefenseDice`.)

**Step 2: Add impervious to simulateWounds**

- Add parameter `impervious: boolean = false` after `pierceX` (before `runs`).
- In the per-run loop, after computing `defenseDice`, add `extraDiceFromImpervious` and `totalDefenseDice`, and use `totalDefenseDice` for the roll loop and for `wounds = Math.max(0, totalDefenseDice - effectiveBlocks)`.

**Step 3: Update existing call sites and run sim tests**

- In `src/engine/__tests__/simulate.test.ts`, add the new `impervious` argument (value `false`) before `runs` in every call to `simulateWoundsFromAttackResults`. Search for `simulate.test.ts` and insert `false,` after the `pierceX` argument (or after `impactX`/`armorX`/`pierceX` as applicable) in each call.
- Run: `npm run test -- src/engine/__tests__/simulate.test.ts`

Expected: All tests pass.

**Step 4: Commit**

```bash
git add src/engine/simulate.ts
git commit -m "feat(engine): Impervious adds extra defense dice in wounds simulation"
```

---

### Task 3: Failing probability test — calculateWounds with impervious

**Files:**

- Modify: `src/engine/__tests__/probability.test.ts`

**Step 1: Add test for calculateWounds with impervious**

Add an `it` that calls `calculateWounds` with the same attack results and defense setup, pierce X 2, once with `impervious: false` and once with `impervious: true`. Assert that expected wounds with `impervious: true` are less than or equal to expected wounds with `impervious: false`. Use a small attack pool (e.g. 2 red dice, hit surge) and no cover.

Example:

```ts
it('impervious true with pierce 2 yields lower or equal expected wounds than impervious false', () => {
  const pool = { red: 2, black: 0, white: 0 };
  const attackResults = calculateAttackPool(pool, 'hit');
  const woundsNoImpervious = calculateWounds(
    attackResults,
    'red',
    'none',
    0,
    false,
    undefined,
    'none',
    false,
    false,
    0,
    0,
    false,
    0,
    0,
    2, // pierceX
    false // impervious
  );
  const woundsImpervious = calculateWounds(
    attackResults,
    'red',
    'none',
    0,
    false,
    undefined,
    'none',
    false,
    false,
    0,
    0,
    false,
    0,
    0,
    2, // pierceX
    true // impervious
  );
  expect(woundsImpervious.expectedWounds).toBeLessThanOrEqual(
    woundsNoImpervious.expectedWounds
  );
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/engine/__tests__/probability.test.ts -t "impervious"`

Expected: FAIL (e.g. `calculateWounds` does not accept `impervious` yet).

**Step 3: (After Task 4) Run test to verify it passes**

Run: `npm run test -- src/engine/__tests__/probability.test.ts`

Expected: PASS

**Step 4: Commit**

```bash
git add src/engine/__tests__/probability.test.ts
git commit -m "test(probability): calculateWounds with impervious"
```

---

### Task 4: Wire impervious in probability.ts

**Files:**

- Modify: `src/engine/probability.ts`

**Step 1: Add impervious to calculateWounds**

- Add optional parameter `impervious?: boolean` after `pierceX` (before the closing `): WoundsResults`).
- Pass `impervious ?? false` into the `simulateWoundsFromAttackResults` call (in the same position as in simulate.ts: after `pierceX ?? 0`, before `DEFAULT_RUNS`).

**Step 2: Run all engine tests**

Run: `npm run test`

Expected: All tests pass.

**Step 3: Commit**

```bash
git add src/engine/probability.ts
git commit -m "feat(engine): calculateWounds accepts impervious"
```

---

### Task 5: UI state and wiring for Impervious

**Files:**

- Modify: `src/App.tsx`

**Step 1: Add state**

- Add `const [impervious, setImpervious] = useState<boolean>(false);`

**Step 2: Wire into calculateWounds and useMemo**

- In the `calculateWounds(...)` call, add `impervious` as an argument (after `pierceXNum`).
- Add `impervious` to the dependency array of the `useMemo` that calls `calculateWounds`.

**Step 3: Reset in handleReset**

- In `handleReset`, add `setImpervious(false);`

**Step 4: Run app and lint**

Run: `npm run lint` and `npm run build`. Manually verify the app still runs (Impervious not visible yet; no control).

**Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat(ui): state and wiring for Impervious"
```

---

### Task 6: Impervious checkbox in Defense section

**Files:**

- Modify: `src/App.tsx`

**Step 1: Add Impervious checkbox**

- After the Armor X `NumberInputWithControls` (id `armor-x`) and before the `DefenseSurgeToggle`, add a `CheckboxToggle` for Impervious:
  - `id="impervious"`
  - `label="Impervious"`
  - `checked={impervious}` / `onChange={setImpervious}`
  - `title="While defending, roll extra defense dice equal to the attack pool's total Pierce X."`
  - Add `guideAnchor="impervious"` only if Legion Quick Guide has that anchor; otherwise omit.

**Step 2: Verify**

Run: `npm run lint` and `npm run build`. Open app, set attack pool, set Pierce (e.g. 2), set Impervious on and confirm expected wounds decrease (or stay same) vs off.

**Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat(ui): Impervious checkbox in Defense section"
```

---

## Execution

Plan complete and saved to `docs/plans/2026-02-28-impervious-keyword-plan.md`.

Two execution options:

1. **Subagent-driven (this session)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Parallel session (separate)** — Open a new session with executing-plans and run through the plan with checkpoints.

Which approach do you want?
