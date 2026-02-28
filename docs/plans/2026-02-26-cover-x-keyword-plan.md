# Cover X Keyword Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Cover X defense keyword: improve effective cover by X (none=0, light=1, heavy=2), capped at heavy (2). Stacks with Suppressed; Sharpshooter applies after. UI: number input in Defense section with min 0, max 2.

**Architecture:** Add optional `coverX` (0–2) to the cover path: `getEffectiveCover(cover, sharpshooterX, suppressed?, coverX?)` computes numeric value from cover, adds (suppressed ? 1 : 0) + normalized coverX, clamps to 2, maps back to CoverLevel, then applies Sharpshooter. `applyCover` and both sim functions take `coverX` and pass it through. `calculateWounds` takes optional `coverX?: number` and passes normalized 0–2 into sim.

**Tech Stack:** React 19, TypeScript, Vite, Vitest.

---

### Task 1: getEffectiveCover – add coverX and improve-by-value logic

**Files:**
- Modify: `src/engine/simulate.ts` (getEffectiveCover)

**Step 1: Write the failing test**

In `src/engine/__tests__/simulate.test.ts`, inside `describe('getEffectiveCover', ...)`, add:

```ts
it('coverX: improves by X then cap at heavy; sharpshooter applies after', () => {
  expect(getEffectiveCover('none', 0, false, 1)).toBe('light');
  expect(getEffectiveCover('none', 0, false, 2)).toBe('heavy');
  expect(getEffectiveCover('light', 0, false, 1)).toBe('heavy');
  expect(getEffectiveCover('heavy', 0, false, 2)).toBe('heavy');
  expect(getEffectiveCover('none', 0, true, 1)).toBe('heavy');
  expect(getEffectiveCover('heavy', 1, false, 1)).toBe('light');
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/engine/__tests__/simulate.test.ts -t "coverX"`
Expected: FAIL (getEffectiveCover does not accept 4th argument or wrong return values)

**Step 3: Implement getEffectiveCover with coverX**

In `src/engine/simulate.ts`, change `getEffectiveCover` to:

- Signature: `getEffectiveCover(cover: CoverLevel, sharpshooterX: number, suppressed?: boolean, coverX?: number): CoverLevel`.
- Add helpers (inline or local): map cover to number `coverToValue(cover): 0|1|2` (none→0, light→1, heavy→2) and `valueToCover(value: number): CoverLevel` (0→none, 1→light, 2→heavy).
- Normalize: `const normalizedCoverX = Math.min(2, Math.max(0, Math.floor(coverX ?? 0)));`
- Let `value = coverToValue(cover) + (suppressed ? 1 : 0) + normalizedCoverX`, then `improved = valueToCover(Math.min(2, value))`.
- Then apply Sharpshooter on `improved` (same loop as today: reduce by up to sharpshooterX steps). Return result.

**Step 4: Run test to verify it passes**

Run: `npm run test -- --run src/engine/__tests__/simulate.test.ts -t "getEffectiveCover"`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/simulate.ts src/engine/__tests__/simulate.test.ts
git commit -m "feat(engine): add coverX to getEffectiveCover, improve by X cap at heavy"
```

---

### Task 2: applyCover – pass coverX to getEffectiveCover

**Files:**
- Modify: `src/engine/simulate.ts` (applyCover)
- Test: `src/engine/__tests__/simulate.test.ts`

**Step 1: Write the failing test**

In `describe('applyCover', ...)`, add:

```ts
it('coverX 1: none behaves like light', () => {
  const rng1 = createSeededRng(300);
  const rng2 = createSeededRng(300);
  const noneCover1 = applyCover(2, 1, 'none', rng1, 0, false, 1);
  const lightNoCoverX = applyCover(2, 1, 'light', rng2, 0);
  expect(noneCover1).toEqual(lightNoCoverX);
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/engine/__tests__/simulate.test.ts -t "applyCover"`
Expected: FAIL (applyCover does not accept 7th argument)

**Step 3: Implement applyCover with coverX**

In `src/engine/simulate.ts`, `applyCover`:
- Add optional parameter `coverX?: number` after `suppressed?`.
- Call `getEffectiveCover(cover, sharpshooterX ?? 0, suppressed, coverX)` and use result for the rest. No other logic change.

**Step 4: Run test to verify it passes**

Run: `npm run test -- --run src/engine/__tests__/simulate.test.ts -t "applyCover"`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/simulate.ts src/engine/__tests__/simulate.test.ts
git commit -m "feat(engine): pass coverX through applyCover to getEffectiveCover"
```

---

### Task 3: simulateWounds and simulateWoundsFromAttackResults – add coverX and pass to applyCover

**Files:**
- Modify: `src/engine/simulate.ts` (simulateWounds, simulateWoundsFromAttackResults)
- Test: `src/engine/__tests__/simulate.test.ts`

**Step 1: Update sim signatures and call sites**

- In `simulateWounds`, add parameter `coverX: number = 0` after `suppressed`, before `sharpshooterX`. Normalize: `const normalizedCoverX = Math.min(2, Math.max(0, Math.floor(coverX)));` (with other normalizations at top). Replace the line that calls `applyCover(hitsForCover, final.crits, cover, rng, sharpshooterX, suppressed)` with `applyCover(hitsForCover, final.crits, cover, rng, sharpshooterX, suppressed, normalizedCoverX)`.
- In `simulateWoundsFromAttackResults`, add parameter `coverX: number = 0` after `suppressed`, before `sharpshooterX`. Same normalization. Replace `applyCover(hitsForCover, crits, cover, rng, sharpshooterX, suppressed)` with `applyCover(hitsForCover, crits, cover, rng, sharpshooterX, suppressed, normalizedCoverX)`.

**Step 2: Update all existing test calls**

In `src/engine/__tests__/simulate.test.ts`, find every call to `simulateWounds` and `simulateWoundsFromAttackResults`. Add the new `coverX` argument (value `0`) after `suppressed` and before `sharpshooterX` (so argument order matches: ..., suppressed, coverX, sharpshooterX, backup, pierceX, runs, rng). Use grep to find: `simulateWounds\(` and `simulateWoundsFromAttackResults\(`.

**Step 3: Run tests**

Run: `npm run test -- --run src/engine/__tests__/simulate.test.ts`
Expected: PASS (all existing tests still pass)

**Step 4: Add wounds test for Cover X**

In `src/engine/__tests__/simulate.test.ts`, inside `describe('cover in wounds simulation', ...)` (or add a new describe "Cover X in wounds simulation"), add:

```ts
it('cover none + coverX 1 yields lower expected wounds than cover none + coverX 0', () => {
  const attackResults = {
    distributionByHitsCrits: [{ hits: 2, crits: 0, probability: 1 }],
  } as AttackResults;
  const rng = createSeededRng(400);
  const woundsNoneCover0 = simulateWoundsFromAttackResults(
    attackResults,
    'red',
    'none',
    0,
    false,
    0,
    'none',
    false,
    false,
    0,  // coverX
    0,
    false,
    0,
    10_000,
    rng
  );
  const woundsNoneCover1 = simulateWoundsFromAttackResults(
    attackResults,
    'red',
    'none',
    0,
    false,
    0,
    'none',
    false,
    false,
    1,  // coverX
    0,
    false,
    0,
    10_000,
    rng
  );
  expect(woundsNoneCover1.expectedWounds).toBeLessThanOrEqual(woundsNoneCover0.expectedWounds);
});
```

Argument order: (attackResults, defenseDieColor, defenseSurge, dodgeTokens, outmaneuver, defenseSurgeTokens, cover, lowProfile, suppressed, **coverX**, sharpshooterX, backup, pierceX, runs, rng).

**Step 5: Run tests again**

Run: `npm run test -- --run src/engine/__tests__/simulate.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add src/engine/simulate.ts src/engine/__tests__/simulate.test.ts
git commit -m "feat(engine): add coverX to simulateWounds paths and cover-in-wounds test"
```

---

### Task 4: calculateWounds – add coverX and pass to sim

**Files:**
- Modify: `src/engine/probability.ts` (calculateWounds)
- Test: `src/engine/__tests__/probability.test.ts` (if any direct calculateWounds calls)

**Step 1: Add coverX to calculateWounds**

In `src/engine/probability.ts`, add optional parameter `coverX?: number` after `suppressed`, before `sharpshooterX`. Normalize: `const normalizedCoverX = Math.min(2, Math.max(0, Math.floor(coverX ?? 0)));` (or inline in the call). Pass `normalizedCoverX` into `simulateWoundsFromAttackResults` at the correct position (after suppressed, before sharpshooterX).

**Step 2: Update probability tests if needed**

Search for `calculateWounds(` in `src/engine/__tests__/probability.test.ts`. Add `coverX` (e.g. `0` or omit) so arity matches. If no calls include the full signature, add one test: e.g. call with same args but `coverX: 1` vs `coverX: 0` for a none-cover scenario and assert expectedWounds differs or matches expectation.

**Step 3: Run tests**

Run: `npm run test -- --run`
Expected: PASS

**Step 4: Commit**

```bash
git add src/engine/probability.ts src/engine/__tests__/probability.test.ts
git commit -m "feat(probability): add coverX to calculateWounds and pass to sim"
```

---

### Task 5: UI – state, Cover input, wiring, reset

**Files:**
- Modify: `src/App.tsx`

**Step 1: Add state and normalization**

- Add state: `const [coverX, setCoverX] = useState<string>('');`
- Add normalized value: `const coverXNum = coverX === '' ? 0 : Math.min(2, Math.max(0, Math.floor(Number(coverX)) || 0));`

**Step 2: Wire into calculateWounds and useMemo**

- In the `calculateWounds(...)` call, add `coverXNum` after `suppressed`, before `sharpshooterXNum` (to match probability.ts signature added in Task 4).
- Add `coverXNum` to the wounds `useMemo` dependency array.

**Step 3: Add Cover number input in Defense section**

- After the Suppressed `CheckboxToggle`, before the Backup `CheckboxToggle`, add:

```tsx
<NumberInputWithControls
  id="cover-x"
  label="Cover"
  value={coverX}
  onChange={setCoverX}
  min={0}
  max={2}
  title="Improve cover by X for cover rolls (none=0, light=1, heavy=2); cannot exceed heavy."
/>
```

Omit `guideAnchor` unless Legion Quick Guide has a `cover-x` anchor (per .cursor/rules/legion-quick-guide-links.mdc).

**Step 4: Reset in handleReset**

In `handleReset`, add `setCoverX('');`.

**Step 5: Run lint and tests**

Run: `npm run lint` and `npm run test -- --run`
Expected: PASS

**Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "feat(ui): add Cover X input in Defense section, wire to calculateWounds"
```

---

### Task 6: Final verification

**Step 1: Run full test suite and build**

Run: `npm run test -- --run` then `npm run build`
Expected: All tests pass, build succeeds.

**Step 2: Commit design doc (if not already committed)**

```bash
git add docs/plans/2026-02-26-cover-x-design.md docs/plans/2026-02-26-cover-x-keyword-plan.md
git commit -m "docs: add Cover X design and implementation plan"
```
