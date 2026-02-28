# Surge Tokens Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a Surge Tokens input; when Surge Conversion is None, each token converts one remaining surge (after Critical X) to a hit. When Surge → Hit or Surge → Crit is selected, the input is visible but disabled with an explanatory tooltip.

**Architecture:** Extend `resolve()` and `calculateAttackPool()` with an optional `surgeTokens` parameter (normalized to non-negative integer, default 0). When `surge === 'none'`, after applying Critical X, add `Math.min(surgeTokens, surgesRemaining)` to hits. UI: new number input in the pool section, disabled when `surge !== 'none'` and given a `title` tooltip.

**Tech Stack:** React (useState), TypeScript, Vitest. No new dependencies.

---

### Task 1: Engine – Surge Tokens in resolve and calculateAttackPool (TDD)

**Files:**

- Modify: `src/engine/probability.ts` (resolve, normalizeCriticalX or new normalizer, calculateAttackPool)
- Test: `src/engine/__tests__/probability.test.ts`

**Step 1: Write the failing test**

Add a new describe block in `src/engine/__tests__/probability.test.ts`:

```ts
describe('Surge Tokens', () => {
  it('with surge none, 1 token converts one surge to hit (single white die)', () => {
    const pool: AttackPool = { red: 0, black: 0, white: 1 };
    const noTokens = calculateAttackPool(pool, 'none', undefined, 0);
    const oneToken = calculateAttackPool(pool, 'none', undefined, 1);
    expect(noTokens.expectedHits).toBeCloseTo(1 / 8);
    expect(oneToken.expectedHits).toBeCloseTo(2 / 8);
    expect(oneToken.expectedCrits).toBeCloseTo(1 / 8);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/engine/__tests__/probability.test.ts -t "Surge Tokens"`
Expected: FAIL (e.g. calculateAttackPool does not accept 4 arguments, or expected 2/8 got 1/8)

**Step 3: Implement minimal support**

In `src/engine/probability.ts`:

- Add a normalizer for surge tokens (e.g. `normalizeSurgeTokens(t?: number): number` returning 0 for undefined/null/non-finite/negative, else `Math.floor(t)`).
- Add parameter `surgeTokens?: number` to `resolve()`; when `surge === 'none'`, after computing `surgesRemaining`, set `hits += Math.min(normalizeSurgeTokens(surgeTokens), surgesRemaining)`.
- Add optional 4th parameter `surgeTokens?: number` to `calculateAttackPool`; pass normalized value into each `resolve()` call.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/engine/__tests__/probability.test.ts -t "Surge Tokens"`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/probability.ts src/engine/__tests__/probability.test.ts
git commit -m "feat(engine): surge tokens convert surges to hits when surge conversion is none"
```

---

### Task 2: Engine – Surge Tokens ignored when Surge → Hit or Surge → Crit

**Files:**

- Test: `src/engine/__tests__/probability.test.ts`

**Step 1: Write the failing test**

Add inside the same `describe('Surge Tokens')` block:

```ts
it('surge to hit: surgeTokens do not affect result', () => {
  const pool: AttackPool = { red: 1, black: 0, white: 0 };
  const zero = calculateAttackPool(pool, 'hit', undefined, 0);
  const five = calculateAttackPool(pool, 'hit', undefined, 5);
  expect(five.expectedHits).toBeCloseTo(zero.expectedHits);
  expect(five.expectedCrits).toBeCloseTo(zero.expectedCrits);
});

it('surge to crit: surgeTokens do not affect result', () => {
  const pool: AttackPool = { red: 1, black: 0, white: 0 };
  const zero = calculateAttackPool(pool, 'crit', undefined, 0);
  const five = calculateAttackPool(pool, 'crit', undefined, 5);
  expect(five.expectedHits).toBeCloseTo(zero.expectedHits);
  expect(five.expectedCrits).toBeCloseTo(zero.expectedCrits);
});
```

**Step 2: Run test to verify it fails or passes**

Run: `npm test -- src/engine/__tests__/probability.test.ts -t "Surge Tokens"`
If the current implementation only adds tokens when `surge === 'none'`, these may already pass. If they fail (e.g. we accidentally applied tokens for hit/crit), fix the engine so tokens are applied only when `surge === 'none'`.

**Step 3: Run full engine tests**

Run: `npm test -- src/engine/__tests__/probability.test.ts`
Expected: All PASS

**Step 4: Commit**

```bash
git add src/engine/__tests__/probability.test.ts
git commit -m "test(engine): surge tokens ignored when surge conversion is hit or crit"
```

---

### Task 3: Engine – Critical X + Surge Tokens (tokens apply to remaining surges only)

**Files:**

- Test: `src/engine/__tests__/probability.test.ts`

**Step 1: Write the failing test**

Add inside `describe('Surge Tokens')`:

```ts
it('Critical 1 + 1 token, surge none: token applies only to surges left after Critical X', () => {
  const pool: AttackPool = { red: 0, black: 0, white: 2 };
  const noKeywordNoToken = calculateAttackPool(pool, 'none');
  const critical1OneToken = calculateAttackPool(pool, 'none', 1, 1);
  expect(critical1OneToken.expectedCrits).toBeGreaterThan(
    noKeywordNoToken.expectedCrits
  );
  expect(critical1OneToken.expectedHits).toBeGreaterThan(
    noKeywordNoToken.expectedHits
  );
});
```

**Step 2: Run test**

Run: `npm test -- src/engine/__tests__/probability.test.ts -t "Surge Tokens"`
Expected: PASS (resolve already uses surgesRemaining after Critical X)

**Step 3: Commit**

```bash
git add src/engine/__tests__/probability.test.ts
git commit -m "test(engine): Critical X + surge tokens use remaining surges only"
```

---

### Task 4: UI – Surge Tokens input and wiring

**Files:**

- Modify: `src/App.tsx`
- Modify: `src/App.css` (if needed for layout/label)

**Step 1: Add state and input**

In `src/App.tsx`:

- Add state: `const [surgeTokens, setSurgeTokens] = useState<string>('');`
- Parse for calculation: `surgeTokensNum = surgeTokens === '' ? 0 : Math.max(0, Math.floor(Number(surgeTokens)) || 0);`
- In the `useMemo` for `results`, pass 4th argument: `calculateAttackPool(pool, surge, criticalXNum, surgeTokensNum)`
- In the pool section (e.g. after the Critical X block), add a labeled number input:
  - Label: "Surge Tokens"
  - `id="surge-tokens"`
  - `type="number"`, `min="0"`, `placeholder="0"`
  - `value={surgeTokens}`, `onChange={(e) => setSurgeTokens(e.target.value)}`
  - `disabled={surge !== 'none'}`
  - `title="Surge Tokens only apply when Surge Conversion is None."` (or when disabled, show this so it acts as tooltip)

**Step 2: Run app and verify**

Run: `npm run dev`. Set Surge Conversion to None, add dice, set Surge Tokens to 1 → expected hits should increase. Set Surge Conversion to Surge → Hit → Surge Tokens input should be disabled and show tooltip on hover.

**Step 3: Run all tests**

Run: `npm test`
Expected: All PASS

**Step 4: Commit**

```bash
git add src/App.tsx src/App.css
git commit -m "feat(ui): Surge Tokens input, disabled when surge conversion is not None"
```

---

### Task 5: Verification and docs

**Files:**

- Modify: `docs/plans/2026-02-25-surge-tokens-design.md` (optional: add “Implemented” note)
- No code changes unless verification fails

**Step 1: Full test run**

Run: `npm test`
Expected: All tests pass.

**Step 2: Manual check**

- Surge None + 0 tokens: same as current behavior.
- Surge None + 1+ tokens: expected hits increase when dice can roll surges.
- Surge → Hit or Surge → Crit: Surge Tokens input disabled, tooltip on hover, results unchanged when changing token count (with input enabled then switching surge).

**Step 3: Commit (if any doc update)**

```bash
git add docs/plans/2026-02-25-surge-tokens-design.md
git commit -m "docs: mark surge tokens design as implemented"
```
