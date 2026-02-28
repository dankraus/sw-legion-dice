# Suppressed Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Suppressed as a defense toggle: when checked, effective cover for cover rolls improves by one step (none→light, light→heavy; heavy unchanged). Cover dice mechanics unchanged.

**Architecture:** Extend `getEffectiveCover(cover, sharpshooterX, suppressed?)` to apply Suppressed first (improve by 1), then Sharpshooter reduction. Thread `suppressed` from App → `calculateWounds` → `simulateWoundsFromAttackResults` / `simulateWounds` → `applyCover` → `getEffectiveCover`. UI: checkbox in Defense, disabled when cover is Heavy.

**Tech Stack:** TypeScript, React, Vite, Vitest.

**Design:** `docs/plans/2026-02-26-suppressed-design.md`

---

## Task 1: getEffectiveCover — add suppressed and tests

**Files:**

- Modify: `src/engine/simulate.ts` (getEffectiveCover signature and body)
- Test: `src/engine/__tests__/simulate.test.ts`

**Step 1: Write the failing tests**

In `src/engine/__tests__/simulate.test.ts`, inside `describe('getEffectiveCover', ...)`, add a new `it` block for Suppressed (after the "negative X treated as 0" test):

```ts
it('suppressed true: improves cover by 1 then sharpshooter applies', () => {
  expect(getEffectiveCover('none', 0, true)).toBe('light');
  expect(getEffectiveCover('light', 0, true)).toBe('heavy');
  expect(getEffectiveCover('heavy', 0, true)).toBe('heavy');
  expect(getEffectiveCover('light', 1, true)).toBe('light'); // heavy then sharpshooter 1 → light
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/engine/__tests__/simulate.test.ts`
Expected: FAIL (getEffectiveCover called with 3 args — type or implementation doesn't handle suppressed).

**Step 3: Implement getEffectiveCover with suppressed**

In `src/engine/simulate.ts`, change `getEffectiveCover` to:

```ts
/** Sharpshooter X: reduce cover by up to X steps (heavy→light→none). Suppressed: improve by 1 first (none→light, light→heavy). Used inside applyCover. */
export function getEffectiveCover(
  cover: CoverLevel,
  sharpshooterX: number,
  suppressed?: boolean
): CoverLevel {
  let effective: CoverLevel = cover;
  if (suppressed) {
    effective =
      effective === 'none'
        ? 'light'
        : effective === 'light'
          ? 'heavy'
          : 'heavy';
  }
  const steps = Math.max(0, Math.floor(sharpshooterX));
  for (let i = 0; i < steps && effective !== 'none'; i++) {
    effective = effective === 'heavy' ? 'light' : 'none';
  }
  return effective;
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -- --run src/engine/__tests__/simulate.test.ts`
Expected: getEffectiveCover tests PASS. Other tests may fail until applyCover and sim functions accept suppressed (Tasks 2–3).

**Step 5: Commit**

```bash
git add src/engine/simulate.ts src/engine/__tests__/simulate.test.ts
git commit -m "feat(simulate): add suppressed to getEffectiveCover"
```

---

## Task 2: applyCover — add suppressed and test

**Files:**

- Modify: `src/engine/simulate.ts` (applyCover signature and body)
- Test: `src/engine/__tests__/simulate.test.ts`

**Step 1: Write the failing test**

In `src/engine/__tests__/simulate.test.ts`, inside `describe('applyCover', ...)`, add:

```ts
it('suppressed true: none behaves like light', () => {
  const rng1 = createSeededRng(200);
  const rng2 = createSeededRng(200);
  const noneSuppressed = applyCover(2, 1, 'none', rng1, 0, true);
  const lightNoSuppressed = applyCover(2, 1, 'light', rng2, 0);
  expect(noneSuppressed).toEqual(lightNoSuppressed);
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/engine/__tests__/simulate.test.ts`
Expected: FAIL (applyCover called with 6 args or result mismatch).

**Step 3: Update applyCover**

In `src/engine/simulate.ts`, change `applyCover` to accept optional `suppressed?: boolean` and pass it to getEffectiveCover:

```ts
/** Apply cover: roll hits white dice; light = blocks cancel hits, heavy = blocks+surges cancel hits; crits unchanged. Sharpshooter X reduces effective cover; Suppressed improves by 1 first. */
export function applyCover(
  hits: number,
  crits: number,
  cover: CoverLevel,
  rng: () => number,
  sharpshooterX?: number,
  suppressed?: boolean
): { hits: number; crits: number } {
  const effective = getEffectiveCover(cover, sharpshooterX ?? 0, suppressed);
  if (effective === 'none' || hits <= 0) return { hits, crits };
  // ... rest unchanged (blockCount, surgeCount, hitsCancelled, return)
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -- --run src/engine/__tests__/simulate.test.ts`
Expected: applyCover tests PASS. simulateWounds / simulateWoundsFromAttackResults tests will still fail until Task 3 (they call applyCover indirectly with current signatures).

**Step 5: Commit**

```bash
git add src/engine/simulate.ts src/engine/__tests__/simulate.test.ts
git commit -m "feat(simulate): add suppressed to applyCover"
```

---

## Task 3: simulateWounds and simulateWoundsFromAttackResults — add suppressed

**Files:**

- Modify: `src/engine/simulate.ts` (both function signatures and bodies; pass suppressed into applyCover)
- Modify: `src/engine/__tests__/simulate.test.ts` (add `false` for suppressed in every call between lowProfile and sharpshooterX)

**Step 1: Update simulateWounds**

In `src/engine/simulate.ts`, add parameter `suppressed: boolean = false` after `lowProfile`, before `sharpshooterX`. In the body, change the applyCover call from:

`applyCover(hitsForCover, final.crits, cover, rng, sharpshooterX)`  
to:

`applyCover(hitsForCover, final.crits, cover, rng, sharpshooterX, suppressed)`.

**Step 2: Update simulateWoundsFromAttackResults**

Add parameter `suppressed: boolean = false` after `lowProfile`, before `sharpshooterX`. Change applyCover call to pass `suppressed` as the sixth argument.

**Step 3: Update all test call sites**

In `src/engine/__tests__/simulate.test.ts`, every call to `simulateWounds` or `simulateWoundsFromAttackResults` that currently has `lowProfile, sharpshooterX, backup, ...` must insert `false` (suppressed) between lowProfile and sharpshooterX, e.g. `false, 0, false` → `false, false, 0, false`. Search for `simulateWounds(` and `simulateWoundsFromAttackResults(` and add the extra argument in the correct position.

**Step 4: Run tests**

Run: `npm run test -- --run src/engine/__tests__/simulate.test.ts`
Expected: All PASS.

**Step 5: Commit**

```bash
git add src/engine/simulate.ts src/engine/__tests__/simulate.test.ts
git commit -m "feat(simulate): add suppressed to simulateWounds and simulateWoundsFromAttackResults"
```

---

## Task 4: calculateWounds and probability tests

**Files:**

- Modify: `src/engine/probability.ts` (add suppressed to calculateWounds, pass to simulateWoundsFromAttackResults)
- Modify: `src/engine/__tests__/probability.test.ts` (add suppressed to any calculateWounds calls if needed; add one test that suppressed changes wounds for cover none/light)

**Step 1: Update calculateWounds**

In `src/engine/probability.ts`, add optional parameter `suppressed?: boolean` after `lowProfile`, before `sharpshooterX` (order: ..., cover, lowProfile, suppressed?, sharpshooterX?, backup?). Default `suppressed ?? false`. Pass it as the 9th argument to `simulateWoundsFromAttackResults` (after lowProfile, before sharpshooterX): `lowProfile ?? false, suppressed ?? false, sharpshooterX ?? 0, backup ?? false, ...`.

**Step 2: Run existing tests**

Run: `npm run test -- --run`
Expected: All pass (existing callers omit suppressed so default false).

**Step 3: Add probability test for suppressed**

In `src/engine/__tests__/probability.test.ts`, inside describe('calculateWounds'), add a test that with fixed attack results and cover 'none', expected wounds with suppressed true are less than (or at least not greater than) with suppressed false; or that cover 'none' + suppressed yields similar expected wounds to cover 'light' without suppressed. Use a scenario with enough hits to see a difference (e.g. several hits, 0 crits, red defense).

**Step 4: Run tests**

Run: `npm run test -- --run`
Expected: All PASS.

**Step 5: Commit**

```bash
git add src/engine/probability.ts src/engine/__tests__/probability.test.ts
git commit -m "feat(probability): add suppressed to calculateWounds"
```

---

## Task 5: App state, UI, and wiring

**Files:**

- Modify: `src/App.tsx` (state, reset, calculateWounds args, useMemo deps, Suppressed checkbox)

**Step 1: Add state and reset**

Add `const [suppressed, setSuppressed] = useState<boolean>(false);` with other defense state. In `handleReset`, add `setSuppressed(false);`.

**Step 2: Pass to calculateWounds and useMemo**

In the `calculateWounds(...)` call, add `suppressed` after `lowProfile`, before `sharpshooterXNum`. Add `suppressed` to the useMemo dependency array for woundsResults.

**Step 3: Add Suppressed checkbox**

In the Defense section, after the Low Profile CheckboxToggle, add:

```tsx
<CheckboxToggle
  id="suppressed"
  label="Suppressed"
  title="Improve cover by 1 for cover rolls (none→light, light→heavy)."
  checked={suppressed}
  onChange={setSuppressed}
  disabled={cover === 'heavy'}
/>
```

**Step 4: Run app and tests**

Run: `npm run test -- --run` and `npm run build`
Expected: Tests pass, build succeeds. Manually verify checkbox appears and is disabled when Cover is Heavy.

**Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat(ui): add Suppressed defense toggle"
```

---

## Task 6: Wounds simulation test for suppressed

**Files:**

- Modify: `src/engine/__tests__/simulate.test.ts`

**Step 1: Add test in cover-in-wounds describe**

In `describe('cover in wounds simulation', ...)`, add:

```ts
  it('cover none with Suppressed on yields lower expected wounds than Suppressed off', () => {
    const attackResults = { ... }; // e.g. expectedHits 3, expectedCrits 0, expectedTotal 3, distributionByHitsCrits with that outcome
    const runs = 5000;
    const rngOff = createSeededRng(801);
    const rngOn = createSeededRng(801);
    const resultOff = simulateWoundsFromAttackResults(..., 'none', false, false, 0, false, runs, rngOff);
    const resultOn = simulateWoundsFromAttackResults(..., 'none', false, true, 0, false, runs, rngOn);
    expect(resultOn.expectedWounds).toBeLessThan(resultOff.expectedWounds);
  });
```

Use the same attackResults shape as other tests in that describe (distributionByHitsCrits). Pass suppressed `true` in the fourth-from-last position (after lowProfile, before sharpshooterX).

**Step 2: Run tests**

Run: `npm run test -- --run src/engine/__tests__/simulate.test.ts`
Expected: PASS.

**Step 3: Commit**

```bash
git add src/engine/__tests__/simulate.test.ts
git commit -m "test(simulate): cover none + Suppressed lowers expected wounds"
```

---
