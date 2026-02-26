# Ram X Keyword Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a Ram X keyword number input; after rerolls (Aim, Observe), convert up to X dice to crits — blanks first, then hits. Ram applies after all other resolution steps and works regardless of Surge Conversion or Aim state.

**Architecture:** Add optional `ramX?: number` to `calculateAttackPool` (after `precise`). Normalize to non-negative integer (default 0). Apply after rerolls in the per-outcome loop: convert `min(ramX, blanksRemaining)` blanks to crits, then `min(remaining, hitsFinal)` hits to crits. UI: new number input, always enabled.

**Tech Stack:** React (useState), TypeScript, Vitest. No new dependencies.

---

### Task 1: Engine – Ram X converts blanks then hits to crits (TDD)

**Files:**
- Modify: `src/engine/probability.ts` (calculateAttackPool, add ramX parameter and post-reroll logic)
- Test: `src/engine/__tests__/probability.test.ts`

**Step 1: Write the failing test**

Add a new describe block in `src/engine/__tests__/probability.test.ts` after the "Precise keyword" block:

```ts
describe('Ram X keyword', () => {
  it('Ram 1 with 1 white die (surge none, no rerolls): converts blank to crit', () => {
    const pool: AttackPool = { red: 0, black: 0, white: 1 };
    const noRam = calculateAttackPool(pool, 'none');
    // white die: 1 crit, 1 surge, 1 hit, 5 blank. Surge none → surge wasted.
    // Without Ram: expectedCrits = 1/8, expectedHits = 1/8
    // With Ram 1: each blank outcome converts to crit → expectedCrits = 1/8 + 5/8 = 6/8
    const ram1 = calculateAttackPool(pool, 'none', undefined, 0, 0, 0, 0, 1);
    expect(ram1.expectedCrits).toBeGreaterThan(noRam.expectedCrits);
    expect(ram1.expectedTotal).toBeGreaterThan(noRam.expectedTotal);
    // 5 blanks become crits: expectedCrits = 6/8, expectedHits = 1/8
    expect(ram1.expectedCrits).toBeCloseTo(6 / 8);
    expect(ram1.expectedHits).toBeCloseTo(1 / 8);
  });

  it('Ram 2 with 1 white die (surge none, no rerolls): converts blank then hit to crit', () => {
    const pool: AttackPool = { red: 0, black: 0, white: 1 };
    // With Ram 2: blank→crit (5 outcomes), hit→crit (1 outcome where no blank left but hit exists)
    // For the blank outcomes: 1 blank→crit, 1 ram left but no more blanks or hits → just 1 conversion
    // Actually per outcome: blank→ ram converts 1 blank to crit, ram left=1, hit=0 so 0 hits converted
    //   hit outcome: 0 blanks, ram converts 1 hit to crit, ram left=1
    //   crit outcome: 0 blanks, 0 hits, ram does nothing
    //   surge outcome: 0 blanks, 0 hits, ram does nothing
    // So: expectedCrits = (1 + 0 + 0 + 5*1)/8 + (0 + 1 + 0 + 0)/8 = 6/8 + 1/8 = 7/8
    // expectedHits = 0 (the 1 hit outcome got rammed to crit)
    const ram2 = calculateAttackPool(pool, 'none', undefined, 0, 0, 0, 0, 2);
    expect(ram2.expectedCrits).toBeCloseTo(7 / 8);
    expect(ram2.expectedHits).toBeCloseTo(0);
    expect(ram2.expectedTotal).toBeCloseTo(7 / 8);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/engine/__tests__/probability.test.ts -t "Ram X keyword"`
Expected: FAIL (calculateAttackPool does not accept 8 arguments)

**Step 3: Implement minimal support**

In `src/engine/probability.ts`:
- Add optional parameter `ramX?: number` to `calculateAttackPool` (after `precise`).
- Normalize: `const ram = normalizeTokenCount(ramX);`
- After computing `hitsFinal` and `critsFinal` (post-reroll), add:
  ```ts
  if (ram > 0) {
    const blanksRemaining = b - nReroll;
    const blanksConverted = Math.min(ram, blanksRemaining);
    critsFinal += blanksConverted;
    const ramLeft = ram - blanksConverted;
    const hitsConverted = Math.min(ramLeft, hitsFinal);
    critsFinal += hitsConverted;
    hitsFinal -= hitsConverted;
  }
  ```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/engine/__tests__/probability.test.ts -t "Ram X keyword"`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/probability.ts src/engine/__tests__/probability.test.ts
git commit -m "feat(engine): Ram X keyword converts blanks then hits to crits after rerolls"
```

---

### Task 2: Engine – Ram X = 0 or undefined has no effect

**Files:**
- Test: `src/engine/__tests__/probability.test.ts`

**Step 1: Write the test**

Add inside `describe('Ram X keyword')`:

```ts
  it('Ram 0 or undefined: same as no Ram', () => {
    const pool: AttackPool = { red: 1, black: 0, white: 1 };
    const noRam = calculateAttackPool(pool, 'hit');
    const ram0 = calculateAttackPool(pool, 'hit', undefined, 0, 0, 0, 0, 0);
    const ramUndef = calculateAttackPool(pool, 'hit', undefined, 0, 0, 0, 0, undefined);
    expect(ram0.expectedHits).toBeCloseTo(noRam.expectedHits);
    expect(ram0.expectedCrits).toBeCloseTo(noRam.expectedCrits);
    expect(ramUndef.expectedHits).toBeCloseTo(noRam.expectedHits);
    expect(ramUndef.expectedCrits).toBeCloseTo(noRam.expectedCrits);
  });

  it('negative ramX treated as 0', () => {
    const pool: AttackPool = { red: 1, black: 0, white: 0 };
    const noRam = calculateAttackPool(pool, 'hit');
    const negRam = calculateAttackPool(pool, 'hit', undefined, 0, 0, 0, 0, -1);
    expect(negRam.expectedCrits).toBeCloseTo(noRam.expectedCrits);
    expect(negRam.expectedHits).toBeCloseTo(noRam.expectedHits);
  });
```

**Step 2: Run test**

Run: `npm test -- src/engine/__tests__/probability.test.ts -t "Ram X keyword"`
Expected: PASS (normalizeTokenCount already handles 0, undefined, negative)

**Step 3: Commit**

```bash
git add src/engine/__tests__/probability.test.ts
git commit -m "test(engine): Ram X 0/undefined/negative has no effect"
```

---

### Task 3: Engine – Ram X with Aim rerolls (Ram applies after rerolls)

**Files:**
- Test: `src/engine/__tests__/probability.test.ts`

**Step 1: Write the test**

Add inside `describe('Ram X keyword')`:

```ts
  it('Ram 1 + 1 Aim with white dice: Ram applies after rerolls, converts a remaining blank', () => {
    const pool: AttackPool = { red: 0, black: 0, white: 3 };
    const aimOnly = calculateAttackPool(pool, 'none', undefined, 0, 1, 0, 0, 0);
    const aimPlusRam = calculateAttackPool(pool, 'none', undefined, 0, 1, 0, 0, 1);
    // Ram converts one remaining blank (after Aim rerolls) to a crit
    expect(aimPlusRam.expectedCrits).toBeGreaterThan(aimOnly.expectedCrits);
    expect(aimPlusRam.expectedTotal).toBeGreaterThan(aimOnly.expectedTotal);
  });

  it('Ram works with any Surge Conversion', () => {
    const pool: AttackPool = { red: 0, black: 0, white: 2 };
    const hitNoRam = calculateAttackPool(pool, 'hit');
    const hitRam1 = calculateAttackPool(pool, 'hit', undefined, 0, 0, 0, 0, 1);
    expect(hitRam1.expectedCrits).toBeGreaterThan(hitNoRam.expectedCrits);
    const critNoRam = calculateAttackPool(pool, 'crit');
    const critRam1 = calculateAttackPool(pool, 'crit', undefined, 0, 0, 0, 0, 1);
    expect(critRam1.expectedCrits).toBeGreaterThan(critNoRam.expectedCrits);
  });
```

**Step 2: Run test**

Run: `npm test -- src/engine/__tests__/probability.test.ts -t "Ram X keyword"`
Expected: PASS

**Step 3: Commit**

```bash
git add src/engine/__tests__/probability.test.ts
git commit -m "test(engine): Ram X applies after rerolls and works with all surge conversions"
```

---

### Task 4: Engine – Ram X with Critical X (compose naturally)

**Files:**
- Test: `src/engine/__tests__/probability.test.ts`

**Step 1: Write the test**

Add inside `describe('Ram X keyword')`:

```ts
  it('Critical X + Ram X: both apply (surges become crits via Critical, blanks via Ram)', () => {
    const pool: AttackPool = { red: 0, black: 0, white: 2 };
    const noKeywords = calculateAttackPool(pool, 'none');
    const critOnly = calculateAttackPool(pool, 'none', 1, 0, 0, 0, 0, 0);
    const critPlusRam = calculateAttackPool(pool, 'none', 1, 0, 0, 0, 0, 1);
    expect(critPlusRam.expectedCrits).toBeGreaterThan(critOnly.expectedCrits);
    expect(critPlusRam.expectedTotal).toBeGreaterThan(critOnly.expectedTotal);
    expect(critPlusRam.expectedTotal).toBeGreaterThan(noKeywords.expectedTotal);
  });
```

**Step 2: Run test**

Run: `npm test -- src/engine/__tests__/probability.test.ts -t "Ram X keyword"`
Expected: PASS

**Step 3: Run full test suite**

Run: `npm test -- src/engine/__tests__/probability.test.ts`
Expected: All PASS

**Step 4: Commit**

```bash
git add src/engine/__tests__/probability.test.ts
git commit -m "test(engine): Critical X + Ram X compose correctly"
```

---

### Task 5: UI – Ram X input and wiring

**Files:**
- Modify: `src/App.tsx` (state, derived value, input, useMemo)

**Step 1: Add state and derived value**

In `src/App.tsx`:
- Add state: `const [ramX, setRamX] = useState<string>('');`
- Add derived value after `preciseNum`: `const ramXNum = ramX === '' ? 0 : Math.max(0, Math.floor(Number(ramX)) || 0);`

**Step 2: Pass ramX into calculateAttackPool**

- In the `useMemo` call to `calculateAttackPool`, add the 8th argument `ramXNum`.
- Add `ramXNum` to the dependency array.

**Step 3: Add Ram X input**

- After the Observe Tokens `NumberInputWithControls` and before the Point Cost div, add:
  ```tsx
  <NumberInputWithControls
    id="ram-x"
    label="Keyword: Ram X"
    value={ramX}
    onChange={setRamX}
    title="Convert up to X dice to crits after rerolls (blanks first, then hits)"
  />
  ```

**Step 4: Verify**

- Run: `npm test`
- Run: `npm run dev` and confirm: entering Ram 1 with white dice increases expected crits and total. Ram 0 or empty has no effect.

**Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat(ui): add Ram X keyword input"
```

---

Plan complete. Five tasks: engine implementation (TDD), three edge-case/composition test tasks, and UI wiring.
