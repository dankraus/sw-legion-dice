# Impact X Keyword (Attack) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Impact X attack keyword: up to X hits bypass armor when determining how many hits armor cancels (effective armor = max(0, armorX - impactX)).

**Architecture:** Add optional `impactX` parameter after `armorX` through the stack. In sim, after `applyCover` compute `effectiveArmor = max(0, armorX - impactX)` and `hitsAfterArmor = max(0, afterCover.hits - effectiveArmor)`; use `hitsAfterArmor` for Backup (instead of the current `afterCover.hits - armorX`). UI: one number input in Attack section (Keywords, after Sharpshooter, before Pierce), same pattern as Pierce/Sharpshooter. Legion Quick Guide: add `guideAnchor="impact-x"` only if that anchor exists on the guide; otherwise omit.

**Tech Stack:** TypeScript, React, Vite, Vitest. See `AGENTS.md` for commands.

**Design:** `docs/plans/2026-02-27-impact-x-design.md`

---

### Task 1: Failing sim test — Impact X increases wounds when defender has armor

**Files:**

- Modify: `src/engine/__tests__/simulate.test.ts`

**Step 1: Add test for Impact X in wounds simulation**

In `simulate.test.ts`, add a new `describe('Impact X in wounds simulation', () => { ... })` after the existing `describe('Armor X in wounds simulation', ...)`. Use `simulateWoundsFromAttackResults` with a single (hits, crits) outcome and defender `armorX: 3`. Call once with `impactX: 0` and once with `impactX: 2`. Assert that expected wounds with `impactX: 2` are greater than or equal to expected wounds with `impactX: 0` (Impact lets more hits through armor). Pass `impactX` as the argument after `armorX` and before `pierceX`; the test will fail with a type/argument error until Task 2 adds the parameter.

Example shape (adapt to existing test style and imports; use same `attackResults` shape as Armor X test):

```ts
describe('Impact X in wounds simulation', () => {
  it('impactX 2 with armorX 3 yields higher or equal expected wounds than impactX 0', () => {
    const attackResults = {
      expectedHits: 4,
      expectedCrits: 1,
      expectedTotal: 5,
      distribution: [],
      distributionByHitsCrits: [{ hits: 4, crits: 1, probability: 1 }],
      cumulative: [],
    };
    const runs = 5000;
    const rng0 = createSeededRng(3000);
    const rng2 = createSeededRng(3000);
    const woundsImpact0 = simulateWoundsFromAttackResults(
      attackResults,
      'red',
      'none',
      0,
      false,
      0,
      'none',
      false,
      false,
      0,
      0,
      false,
      3, // armorX
      0, // impactX
      0, // pierceX
      runs,
      rng0
    );
    const woundsImpact2 = simulateWoundsFromAttackResults(
      attackResults,
      'red',
      'none',
      0,
      false,
      0,
      'none',
      false,
      false,
      0,
      0,
      false,
      3, // armorX
      2, // impactX
      0, // pierceX
      runs,
      rng2
    );
    expect(woundsImpact2.expectedWounds).toBeGreaterThanOrEqual(
      woundsImpact0.expectedWounds
    );
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/engine/__tests__/simulate.test.ts -t "Impact X"`

Expected: FAIL (e.g. missing argument or wrong argument count).

**Step 3: (After Task 2) Run test to verify it passes**

Run: `npm run test -- src/engine/__tests__/simulate.test.ts -t "Impact X"`

Expected: PASS

**Step 4: Commit**

```bash
git add src/engine/__tests__/simulate.test.ts
git commit -m "test(sim): Impact X in wounds simulation"
```

---

### Task 2: Implement Impact X in simulate.ts

**Files:**

- Modify: `src/engine/simulate.ts` (signatures and wound pipeline for both `simulateWounds` and `simulateWoundsFromAttackResults`)

**Step 1: Add impactX to simulateWoundsFromAttackResults**

- Add parameter `impactX: number = 0` after `armorX` and before `pierceX`.
- After the line that computes `normalizedArmorX`, add:
  - `const normalizedImpactX = Math.max(0, Math.floor(impactX));`
  - `const effectiveArmor = Math.max(0, normalizedArmorX - normalizedImpactX);`
  - `const hitsAfterArmor = Math.max(0, afterCover.hits - effectiveArmor);`
- Remove or replace the current `hitsAfterArmor` that uses only `normalizedArmorX` so that the Backup step uses the new `hitsAfterArmor` (unchanged variable name, new computation).

**Step 2: Add impactX to simulateWounds**

- Add parameter `impactX: number = 0` in the same position (after `armorX`, before `pierceX`).
- In the per-run loop, after `normalizedArmorX`, add the same `normalizedImpactX`, `effectiveArmor`, and `hitsAfterArmor` logic; use the new `hitsAfterArmor` for the Backup step.

**Step 3: Run sim tests**

Run: `npm run test -- src/engine/__tests__/simulate.test.ts`

Expected: All tests pass, including the new Impact X test. **Update all existing calls** in `simulate.test.ts` to `simulateWoundsFromAttackResults` and `simulateWounds` to pass the new `impactX` argument (use `0`) between `armorX` and `pierceX`.

**Step 4: Commit**

```bash
git add src/engine/simulate.ts
git commit -m "feat(engine): Impact X in wounds simulation (effective armor = armorX - impactX)"
```

---

### Task 3: Failing probability test — calculateWounds with impactX

**Files:**

- Modify: `src/engine/__tests__/probability.test.ts`

**Step 1: Add test for calculateWounds with impactX**

Add an `it` that calls `calculateWounds` with the same attack results and defense setup (e.g. `armorX: 3`) twice: once with `impactX: 0` and once with `impactX: 2`. Assert that expected wounds with `impactX: 2` are greater than or equal to expected wounds with `impactX: 0`. Use a setup that yields at least some hits (e.g. attack with hits+crits, no cover). Pass `impactX` after `armorX` and before `pierceX` in the `calculateWounds` call.

Example (adapt to existing test style):

```ts
it('impactX increases expected wounds when defender has armor (impactX 2 >= impactX 0)', () => {
  const emptyPool = calculateAttackPool({ red: 0, black: 0, white: 0 }, 'none');
  const attackWithHits = {
    ...emptyPool,
    distribution: [{ total: 4, probability: 1 }],
    distributionByHitsCrits: [{ hits: 3, crits: 1, probability: 1 }],
  };
  const woundsImpact0 = calculateWounds(
    attackWithHits,
    'red',
    'none',
    0,
    false,
    0,
    'none',
    false,
    false,
    0,
    0,
    false,
    3, // armorX
    0, // impactX
    0 // pierceX
  );
  const woundsImpact2 = calculateWounds(
    attackWithHits,
    'red',
    'none',
    0,
    false,
    0,
    'none',
    false,
    false,
    0,
    0,
    false,
    3, // armorX
    2, // impactX
    0 // pierceX
  );
  expect(woundsImpact2.expectedWounds).toBeGreaterThanOrEqual(
    woundsImpact0.expectedWounds
  );
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/engine/__tests__/probability.test.ts -t "impactX"`

Expected: FAIL (e.g. `calculateWounds` does not accept `impactX` yet or wrong argument count).

**Step 3: (After Task 4) Run test to verify it passes**

Run: `npm run test -- src/engine/__tests__/probability.test.ts`

Expected: PASS. **Update all existing calls** in `probability.test.ts` to `calculateWounds` that pass `armorX` and `pierceX` to include `impactX` (e.g. `0`) between them so argument count matches the new signature.

**Step 4: Commit**

```bash
git add src/engine/__tests__/probability.test.ts
git commit -m "test(probability): calculateWounds with impactX"
```

---

### Task 4: Wire impactX in probability.ts

**Files:**

- Modify: `src/engine/probability.ts`

**Step 1: Add impactX to calculateWounds**

- Add optional parameter `impactX?: number` after `armorX` (before `pierceX`).
- Compute normalized value: `const normalizedImpactX = Math.max(0, Math.floor(impactX ?? 0));`
- Pass `normalizedImpactX` into the `simulateWoundsFromAttackResults` call in the same position as in simulate.ts (after `normalizedArmorX`, before `pierceX ?? 0`).

**Step 2: Run all engine tests**

Run: `npm run test`

Expected: All tests pass.

**Step 3: Commit**

```bash
git add src/engine/probability.ts
git commit -m "feat(engine): calculateWounds accepts impactX"
```

---

### Task 5: UI state and wiring for Impact X

**Files:**

- Modify: `src/App.tsx`

**Step 1: Add state and normalized value**

- Add `const [impactX, setImpactX] = useState<string>('');`
- Add `const impactXNum = impactX === '' ? 0 : Math.max(0, Math.floor(Number(impactX)) || 0);`

**Step 2: Wire into calculateWounds and useMemo**

- In the `calculateWounds(...)` call, add `impactXNum` as an argument after `armorXNum` and before `pierceXNum`.
- Add `impactXNum` to the dependency array of the `useMemo` that calls `calculateWounds`.

**Step 3: Reset in handleReset**

- In `handleReset`, add `setImpactX('');`

**Step 4: Run app and lint**

Run: `npm run lint` and `npm run build`. Manually verify the app still runs (Impact not visible yet; no control).

**Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat(ui): state and wiring for Impact X"
```

---

### Task 6: Impact control in Attack section

**Files:**

- Modify: `src/App.tsx`

**Step 1: Add Impact number input**

- After the Sharpshooter `NumberInputWithControls` and before the Pierce `NumberInputWithControls`, add a `NumberInputWithControls` for Impact:
  - `id="impact-x"`
  - `label="Impact"`
  - `value={impactX}` / `onChange={setImpactX}`
  - `min={0}`
  - `title="Up to X hits bypass armor when determining how many hits armor cancels."`
  - **Legion Quick Guide:** Check [Legion Quick Guide](https://legionquickguide.com/) for an `impact-x` anchor. If it exists, add `guideAnchor="impact-x"`. If not, omit `guideAnchor`.

**Step 2: Verify**

Run: `npm run lint` and `npm run build`. Open app, set attack pool and defense with Armor 3, set Impact to 2 and confirm expected wounds increase (or stay same) vs Impact 0.

**Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat(ui): Impact X input in Attack section"
```

---

## Execution

Plan complete and saved to `docs/plans/2026-02-27-impact-x-keyword-plan.md`.

Two execution options:

1. **Subagent-driven (this session)** — Dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Parallel session (separate)** — Open a new session with executing-plans and run through the plan with checkpoints.

Which approach do you want?
