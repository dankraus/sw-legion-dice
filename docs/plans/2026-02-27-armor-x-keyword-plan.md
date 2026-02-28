# Armor X Keyword (Defense) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Armor X defense keyword: cancel up to X hits after cover and before Backup; crits unchanged and still rolled for.

**Architecture:** Add optional `armorX` parameter through the stack. In sim, after `applyCover` compute `hitsAfterArmor = max(0, afterCover.hits - armorX)`, then feed `hitsAfterArmor` into Backup (instead of `afterCover.hits`). UI: one number input in Defense section (after Cover X, before Backup), same pattern as Pierce/Cover X.

**Tech Stack:** TypeScript, React, Vite, Vitest. See `AGENTS.md` for commands.

**Design:** `docs/plans/2026-02-27-armor-x-design.md`

---

### Task 1: Failing sim test — Armor X reduces hits after cover

**Files:**
- Modify: `src/engine/__tests__/simulate.test.ts`

**Step 1: Add test for Armor X in wounds simulation**

In `simulate.test.ts`, add a new `describe('Armor X in wounds simulation', () => { ... })`. Use `simulateWoundsFromAttackResults` with a single (hits, crits) outcome: build `attackResults` with `distributionByHitsCrits: [{ hits: 4, crits: 1, probability: 1 }]`. Call with no cover, no backup, `armorX: 0` vs `armorX: 3`. Assert that expected wounds with `armorX: 3` are less than or equal to those with `armorX: 0` (Armor 3 removes 3 of 4 hits, so fewer dice to roll).

Example shape (adapt to existing test style and imports). Pass `armorX` as the argument after `backup` and before `pierceX`; the test will fail with a type/argument error until Task 2 adds the parameter and applies Armor.

```ts
describe('Armor X in wounds simulation', () => {
  it('armorX 3 with 4 hits 1 crit yields lower or equal expected wounds than armorX 0', () => {
    const attackResults: AttackResults = {
      expectedHits: 4,
      expectedCrits: 1,
      expectedTotal: 5,
      distribution: [],
      distributionByHitsCrits: [{ hits: 4, crits: 1, probability: 1 }],
      cumulative: [],
    };
    const runs = 5000;
    const rng = createSeededRng(42);
    const woundsArmor0 = simulateWoundsFromAttackResults(
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
      0,   // armorX
      0,
      runs,
      rng
    );
    const woundsArmor3 = simulateWoundsFromAttackResults(
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
      3,   // armorX
      0,
      runs,
      rng
    );
    expect(woundsArmor3.expectedWounds).toBeLessThanOrEqual(woundsArmor0.expectedWounds);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/engine/__tests__/simulate.test.ts -t "Armor X"`

Expected: FAIL (e.g. missing argument or assertion failure until Armor is applied).

**Step 3: (After Task 2) Run test to verify it passes**

Run: `npm run test -- src/engine/__tests__/simulate.test.ts -t "Armor X"`

Expected: PASS

**Step 4: Commit**

```bash
git add src/engine/__tests__/simulate.test.ts
git commit -m "test(sim): Armor X in wounds simulation"
```

---

### Task 2: Implement Armor X in simulate.ts

**Files:**
- Modify: `src/engine/simulate.ts` (signatures and wound pipeline for both `simulateWounds` and `simulateWoundsFromAttackResults`)

**Step 1: Add armorX to simulateWoundsFromAttackResults**

- Add parameter `armorX: number = 0` after `backup` and before `pierceX`.
- After the line that computes `afterCover = applyCover(...)`, add:
  - `const normalizedArmorX = Math.max(0, Math.floor(armorX));`
  - `const hitsAfterArmor = Math.max(0, afterCover.hits - normalizedArmorX);`
- Replace use of `afterCover.hits` in the Backup step with `hitsAfterArmor`: i.e. `hitsAfterBackup = backup ? Math.max(0, hitsAfterArmor - 2) : hitsAfterArmor`.
- Leave `afterCover.crits` unchanged for the defense-dice count (crits are not reduced by Armor).

**Step 2: Add armorX to simulateWounds**

- Add parameter `armorX: number = 0` in the same position (after `backup`, before `pierceX`).
- In the per-run loop, after `afterCover = applyCover(...)`, add the same `normalizedArmorX` and `hitsAfterArmor`, and use `hitsAfterArmor` for the Backup step.

**Step 3: Run sim tests**

Run: `npm run test -- src/engine/__tests__/simulate.test.ts`

Expected: All tests pass, including the new Armor X test (after updating the test to pass `armorX: 0` and `armorX: 3` as the new parameter in the two calls).

**Step 4: Commit**

```bash
git add src/engine/simulate.ts
git commit -m "feat(engine): Armor X in wounds simulation (after cover, before backup)"
```

---

### Task 3: Failing probability test — calculateWounds with armorX

**Files:**
- Modify: `src/engine/__tests__/probability.test.ts`

**Step 1: Add test for calculateWounds with armorX**

Add an `it` that calls `calculateWounds` with the same attack results and defense setup twice: once with `armorX: 0` and once with `armorX: 3`. Assert that expected wounds with `armorX: 3` are less than or equal to expected wounds with `armorX: 0`. Use a setup that yields at least some hits (e.g. a small attack pool and no cover).

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/engine/__tests__/probability.test.ts -t "armor"`

Expected: FAIL (e.g. `calculateWounds` does not accept `armorX` yet).

**Step 3: (After Task 4) Run test to verify it passes**

Run: `npm run test -- src/engine/__tests__/probability.test.ts`

Expected: PASS

**Step 4: Commit**

```bash
git add src/engine/__tests__/probability.test.ts
git commit -m "test(probability): calculateWounds with armorX"
```

---

### Task 4: Wire armorX in probability.ts

**Files:**
- Modify: `src/engine/probability.ts`

**Step 1: Add armorX to calculateWounds**

- Add optional parameter `armorX?: number` after `backup` (before the closing `): WoundsResults`).
- Compute normalized value: `const normalizedArmorX = Math.max(0, Math.floor(armorX ?? 0));`
- Pass `normalizedArmorX` into the `simulateWoundsFromAttackResults` call (in the same position as in simulate.ts, after `backup ?? false`, before `pierceX ?? 0`).

**Step 2: Run all engine tests**

Run: `npm run test`

Expected: All tests pass.

**Step 3: Commit**

```bash
git add src/engine/probability.ts
git commit -m "feat(engine): calculateWounds accepts armorX"
```

---

### Task 5: UI state and wiring for Armor X

**Files:**
- Modify: `src/App.tsx`

**Step 1: Add state and normalized value**

- Add `const [armorX, setArmorX] = useState<string>('');`
- Add `const armorXNum = armorX === '' ? 0 : Math.max(0, Math.floor(Number(armorX)) || 0);`

**Step 2: Wire into calculateWounds and useMemo**

- In the `calculateWounds(...)` call, add `armorXNum` as an argument (after `backup`, before closing parenthesis). Add `armorX?: number` to the call site to match the new signature.
- Add `armorXNum` to the dependency array of the `useMemo` that calls `calculateWounds`.

**Step 3: Reset in handleReset**

- In `handleReset`, add `setArmorX('');`

**Step 4: Run app and lint**

Run: `npm run lint` and `npm run build`. Manually verify the app still runs (Armor not visible yet; no control).

**Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat(ui): state and wiring for Armor X"
```

---

### Task 6: Armor control in Defense section

**Files:**
- Modify: `src/App.tsx`

**Step 1: Add Armor number input**

- After the Cover X `NumberInputWithControls` (id `cover-x`) and before the Backup `CheckboxToggle`, add a `NumberInputWithControls` for Armor:
  - `id="armor-x"`
  - `label="Armor"`
  - `value={armorX}` / `onChange={setArmorX}`
  - `min={0}`
  - `title="Cancel up to X hits after cover, before defense dice; crits are not reduced."`
  - Add `guideAnchor="armor-x"` only if Legion Quick Guide has that anchor; otherwise omit.

**Step 2: Verify**

Run: `npm run lint` and `npm run build`. Open app, set attack pool and defense, set Armor to 3 and confirm expected wounds decrease (or stay same) vs 0.

**Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat(ui): Armor X input in Defense section"
```

---

### Task 7: Optional — deterministic Armor X test

**Files:**
- Modify: `src/engine/__tests__/simulate.test.ts`

**Step 1: Add deterministic case (optional)**

Add a test that uses a single (hits, crits) outcome and fixed RNG: e.g. 5 hits 0 crits, no cover, no backup, Armor 3 → 2 hits remaining before Backup, so defense dice = 2. Or 1 hit 1 crit, Armor 3 → 0 hits 1 crit → 1 defense die. Use high runs and assert approximate expected wounds or that armorX 3 result is strictly less than armorX 0 when there are enough hits. Skip if the existing Armor X test already gives sufficient coverage.

**Step 2: Run tests and commit**

Run: `npm run test`  
Then: `git add src/engine/__tests__/simulate.test.ts && git commit -m "test(sim): deterministic Armor X case"`

---

## Execution

Plan complete and saved to `docs/plans/2026-02-27-armor-x-keyword-plan.md`.

Two execution options:

1. **Subagent-driven (this session)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Parallel session (separate)** — Open a new session with executing-plans and run through the plan with checkpoints.

Which approach do you want?
