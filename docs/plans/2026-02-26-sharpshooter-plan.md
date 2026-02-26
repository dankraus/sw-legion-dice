# Sharpshooter X Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add the attacking keyword Sharpshooter X: when applying cover, reduce effective cover by X steps (heavy→light→none) inside `applyCover`, so the rulebook flow is preserved.

**Architecture:** Extend `applyCover` with optional `sharpshooterX`; compute effective cover at the start of that function and use it for the cover-dice roll. Thread `sharpshooterX` from App → `calculateWounds` → `simulateWoundsFromAttackResults` / `simulateWounds` → `applyCover`.

**Tech Stack:** TypeScript, React, Vite, Vitest.

**Design:** `docs/plans/2026-02-26-sharpshooter-design.md`

---

## Task 1: Effective-cover helper and tests

**Files:**
- Create (logic in simulate.ts): add `getEffectiveCover(cover, sharpshooterX)` and test it in simulate.test.ts
- Modify: `src/engine/simulate.ts` (add helper)
- Test: `src/engine/__tests__/simulate.test.ts`

**Step 1: Write the failing test**

In `src/engine/__tests__/simulate.test.ts`, add a new describe block (e.g. after the imports / before or after `describe('applyCover')`). You will need to export `getEffectiveCover` from simulate.ts for testing, or test it indirectly via `applyCover` in Task 2. Recommended: export a small helper so coverage is clear.

Add:

```ts
import { applyCover, getEffectiveCover } from '../simulate';
// and ensure CoverLevel is available if needed
```

New describe:

```ts
describe('getEffectiveCover', () => {
  it('none stays none for any X', () => {
    expect(getEffectiveCover('none', 0)).toBe('none');
    expect(getEffectiveCover('none', 1)).toBe('none');
    expect(getEffectiveCover('none', 2)).toBe('none');
  });
  it('light: 0 stays light, 1 becomes none, 2+ stays none', () => {
    expect(getEffectiveCover('light', 0)).toBe('light');
    expect(getEffectiveCover('light', 1)).toBe('none');
    expect(getEffectiveCover('light', 2)).toBe('none');
    expect(getEffectiveCover('light', 3)).toBe('none');
  });
  it('heavy: 0 stays heavy, 1 becomes light, 2+ becomes none', () => {
    expect(getEffectiveCover('heavy', 0)).toBe('heavy');
    expect(getEffectiveCover('heavy', 1)).toBe('light');
    expect(getEffectiveCover('heavy', 2)).toBe('none');
    expect(getEffectiveCover('heavy', 3)).toBe('none');
  });
  it('negative X treated as 0', () => {
    expect(getEffectiveCover('heavy', -1)).toBe('heavy');
    expect(getEffectiveCover('light', -1)).toBe('light');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/engine/__tests__/simulate.test.ts`
Expected: FAIL (getEffectiveCover is not defined / not exported)

**Step 3: Implement getEffectiveCover in simulate.ts**

In `src/engine/simulate.ts`, add (near the top, after imports, before `applyCover`):

```ts
/** Sharpshooter X: reduce cover by up to X steps (heavy→light→none). Used inside applyCover. */
export function getEffectiveCover(
  cover: CoverLevel,
  sharpshooterX: number
): CoverLevel {
  const steps = Math.max(0, Math.floor(sharpshooterX));
  let effective: CoverLevel = cover;
  for (let i = 0; i < steps && effective !== 'none'; i++) {
    effective = effective === 'heavy' ? 'light' : 'none';
  }
  return effective;
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -- --run src/engine/__tests__/simulate.test.ts`
Expected: getEffectiveCover tests PASS (other tests may fail until we add optional param in Task 2).

**Step 5: Commit**

```bash
git add src/engine/simulate.ts src/engine/__tests__/simulate.test.ts
git commit -m "feat(simulate): add getEffectiveCover for Sharpshooter X"
```

---

## Task 2: Extend applyCover with sharpshooterX

**Files:**
- Modify: `src/engine/simulate.ts` (applyCover signature and body)
- Modify: `src/engine/__tests__/simulate.test.ts` (pass sharpshooterX in applyCover tests; add Sharpshooter-specific tests)

**Step 1: Update applyCover implementation**

In `src/engine/simulate.ts`, change `applyCover` to:

```ts
/** Apply cover: roll `hits` white dice; light = blocks cancel hits, heavy = blocks+surges cancel hits; crits unchanged. Sharpshooter X reduces effective cover before rolling. */
export function applyCover(
  hits: number,
  crits: number,
  cover: CoverLevel,
  rng: () => number,
  sharpshooterX?: number
): { hits: number; crits: number } {
  const effective = getEffectiveCover(cover, sharpshooterX ?? 0);
  if (effective === 'none' || hits <= 0) return { hits, crits };
  let blockCount = 0;
  let surgeCount = 0;
  for (let i = 0; i < hits; i++) {
    const face = rollOneDefenseDieOutcome('white', rng);
    if (face === 'block') blockCount++;
    else if (face === 'surge') surgeCount++;
  }
  const hitsCancelled =
    effective === 'light' ? blockCount : Math.min(hits, blockCount + surgeCount);
  return { hits: Math.max(0, hits - hitsCancelled), crits };
}
```

**Step 2: Update existing applyCover call sites in simulate.ts**

In `src/engine/simulate.ts`:
- Line ~422: `applyCover(final.hits, final.crits, cover, rng)` → `applyCover(final.hits, final.crits, cover, rng, sharpshooterX)` (add param once you add `sharpshooterX` to the function that contains this call).
- Line ~496: same → `applyCover(hits, crits, cover, rng, sharpshooterX)`.

Do not add the parameter to the parent function signatures yet; in this task only change applyCover and its direct call sites. So you need to add `sharpshooterX` to `simulateWounds` and `simulateWoundsFromAttackResults` and pass it to `applyCover`. So Task 2 and Task 3 can be merged: extend applyCover, then add param to simulateWounds and simulateWoundsFromAttackResults and pass it. Let's keep Task 2 as “applyCover + update call sites to pass sharpshooterX”. That means we must add the parameter to the two simulation functions in this same task so the code compiles. So:

**Step 2 (revised):** In `simulateWounds`, add parameter `sharpshooterX?: number` (after `cover`). In the body, change `applyCover(final.hits, final.crits, cover, rng)` to `applyCover(final.hits, final.crits, cover, rng, sharpshooterX)`. In `simulateWoundsFromAttackResults`, add parameter `sharpshooterX?: number` (after `cover`). Change `applyCover(hits, crits, cover, rng)` to `applyCover(hits, crits, cover, rng, sharpshooterX)`.

**Step 3: Update tests in simulate.test.ts**

- Every `applyCover(...)` call: add 5th argument `undefined` or `0` so existing tests keep the same behavior. Example: `applyCover(3, 1, 'none', rng)` → `applyCover(3, 1, 'none', rng, 0)`.
- Add two tests in the applyCover describe block:
  - With fixed RNG, Sharpshooter 1 and heavy cover: result should match behavior of light cover (crits unchanged; hits reduced by blocks only). Use a seeded RNG and compare `applyCover(n, c, 'heavy', rng, 1)` vs `applyCover(n, c, 'light', rng)` with same seed / same hit count.
  - Sharpshooter 2 and heavy cover: result should equal no cover (hits and crits unchanged). `expect(applyCover(5, 2, 'heavy', rng, 2)).toEqual({ hits: 5, crits: 2 })` — but result is random, so instead run with seeded RNG and expect no hits cancelled: e.g. stub or use a seed that yields no blocks. Simpler: test that with sharpshooterX 2, effective cover is none, so we can assert `applyCover(3, 1, 'heavy', rng, 2)` returns `{ hits: 3, crits: 1 }` (no dice rolled). So add:
  - `it('sharpshooter 2: heavy becomes none so hits and crits unchanged', () => { const rng = createSeededRng(1); expect(applyCover(3, 1, 'heavy', rng, 2)).toEqual({ hits: 3, crits: 1 }); });`
  - For Sharpshooter 1 heavy → light: same hit/crit counts with heavy+sharpshooter 1 vs light and no sharpshooter, with same seed. Add: `it('sharpshooter 1: heavy becomes light so only blocks cancel hits', () => { const rng1 = createSeededRng(100); const rng2 = createSeededRng(100); const withHeavyAndSharpshooter1 = applyCover(4, 2, 'heavy', rng1, 1); const withLightNoSharpshooter = applyCover(4, 2, 'light', rng2, 0); expect(withHeavyAndSharpshooter1).toEqual(withLightNoSharpshooter); });`

**Step 4: Update simulate.test.ts call sites for simulateWounds and simulateWoundsFromAttackResults**

All calls to `simulateWounds` and `simulateWoundsFromAttackResults` must pass the new argument. Use `0` or `undefined` for existing tests. Example: `simulateWoundsFromAttackResults(attackResults, 'red', 'none', 0, false, 0, 'none', runs, rng)` → add `0` before `runs` for sharpshooterX: so signature becomes `(..., cover, sharpshooterX?, runs, rng)`. Check simulate.ts for exact order: `simulateWoundsFromAttackResults(attackResults, defenseDieColor, defenseSurge, dodgeTokens, outmaneuver, defenseSurgeTokens, cover, runs, rng)`. So new param after cover: `(..., cover, sharpshooterX, runs, rng)`. Update every test call to pass `0` (or undefined).

**Step 5: Run tests**

Run: `npm run test -- --run`
Expected: All tests pass.

**Step 6: Commit**

```bash
git add src/engine/simulate.ts src/engine/__tests__/simulate.test.ts
git commit -m "feat(simulate): apply Sharpshooter X inside applyCover; thread param through wounds sim"
```

---

## Task 3: Public API and probability.ts

**Files:**
- Modify: `src/engine/probability.ts` (add sharpshooterX to calculateWounds, pass to simulateWoundsFromAttackResults)

**Step 1: Update calculateWounds**

In `src/engine/probability.ts`, change `calculateWounds` signature to add optional `sharpshooterX?: number` after `cover`. Pass it into `simulateWoundsFromAttackResults` as the new argument (after cover, before runs). Normalize: `const sharpshooterXVal = sharpshooterX ?? 0;` and pass `sharpshooterXVal`.

**Step 2: Run tests**

Run: `npm run test -- --run`
Expected: All pass (no callers of calculateWounds from tests yet; App will be updated in Task 4).

**Step 3: Commit**

```bash
git add src/engine/probability.ts
git commit -m "feat(probability): add sharpshooterX to calculateWounds"
```

---

## Task 4: App state and UI

**Files:**
- Modify: `src/App.tsx` (state, derive number, pass to calculateWounds, add input, reset)

**Step 1: Add state and derived value**

- Add `const [sharpshooterX, setSharpshooterX] = useState<string>('');`
- Add `const sharpshooterXNum = sharpshooterX === '' ? 0 : Math.max(0, Math.floor(Number(sharpshooterX)) || 0);`

**Step 2: Pass to calculateWounds**

In the `calculateWounds(...)` call, add `sharpshooterXNum` after `cover`. Add `sharpshooterXNum` to the dependency array of the useMemo.

**Step 3: Add Sharpshooter input in Keywords section**

After the Ram input (after the Ram NumberInputWithControls block), add:

```tsx
<NumberInputWithControls
  id="sharpshooter-x"
  label="Sharpshooter"
  value={sharpshooterX}
  onChange={setSharpshooterX}
  title="Reduce cover: 1 = heavy→light, light→none; 2 = heavy/light→none"
/>
```

**Step 4: Reset in handleReset**

In `handleReset`, add `setSharpshooterX('');`.

**Step 5: Run dev and tests**

Run: `npm run test -- --run` and `npm run lint`
Expected: Pass. Manually run `npm run dev` and confirm Sharpshooter input appears and changing it with cover set changes expected wounds.

**Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "feat(ui): add Sharpshooter X keyword input and wire to wounds"
```

---

## Task 5: Wounds simulation test for Sharpshooter

**Files:**
- Modify: `src/engine/__tests__/simulate.test.ts`

**Step 1: Add test**

In the describe `'cover in wounds simulation'`, add:

```ts
it('sharpshooter 1 with heavy cover yields higher expected wounds than no sharpshooter', () => {
  const attackResults = {
    expectedHits: 2,
    expectedCrits: 0,
    expectedTotal: 2,
    distribution: [{ total: 0, probability: 0 }, { total: 1, probability: 0 }, { total: 2, probability: 1 }],
    distributionByHitsCrits: [{ hits: 2, crits: 0, probability: 1 }],
    cumulative: [{ total: 0, probability: 1 }, { total: 1, probability: 0 }, { total: 2, probability: 0 }],
  };
  const runs = 10_000;
  const rngNoSharp = createSeededRng(300);
  const rngSharp = createSeededRng(300);
  const noSharpshooter = simulateWoundsFromAttackResults(
    attackResults, 'red', 'none', 0, false, 0, 'heavy', 0, runs, rngNoSharp
  );
  const withSharpshooter1 = simulateWoundsFromAttackResults(
    attackResults, 'red', 'none', 0, false, 0, 'heavy', 1, runs, rngSharp
  );
  expect(withSharpshooter1.expectedWounds).toBeGreaterThan(noSharpshooter.expectedWounds);
});
```

Fix the call signature: `simulateWoundsFromAttackResults(attackResults, defenseDieColor, defenseSurge, dodgeTokens, outmaneuver, defenseSurgeTokens, cover, sharpshooterX, runs, rng)`. So the existing tests in that describe pass 7 args before runs — they need to pass sharpshooterX as 8th. So the order is: ..., cover, sharpshooterX, runs, rng. The existing calls have `'none', runs, rngNone` and `'light', runs, rngLight`. So they become `'none', 0, runs, rngNone` and `'light', 0, runs, rngLight`. And the new test: `'heavy', 0, runs, rngNoSharp` and `'heavy', 1, runs, rngSharp`.

**Step 2: Run tests**

Run: `npm run test -- --run`
Expected: All pass.

**Step 3: Commit**

```bash
git add src/engine/__tests__/simulate.test.ts
git commit -m "test(simulate): Sharpshooter 1 under heavy cover increases expected wounds"
```

---

## Summary

- **Task 1:** getEffectiveCover + unit tests.
- **Task 2:** applyCover(sharpshooterX), simulateWounds/simulateWoundsFromAttackResults pass sharpshooterX, applyCover tests updated + Sharpshooter-specific tests.
- **Task 3:** calculateWounds(sharpshooterX).
- **Task 4:** App state, UI, reset.
- **Task 5:** Wounds test for Sharpshooter vs cover.

After completing the plan, run full verification: `npm run lint`, `npm run test -- --run`, `npm run build`.
