# Precise Keyword Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a Precise keyword number input; when spending Aim tokens, each Aim token gives 2 + precise rerolls (instead of 2). Precise applies only when Aim > 0; when Aim is 0 or empty, the Precise input is disabled and has no effect.

**Architecture:** Add optional `precise?: number` to `calculateAttackPool`; normalize to non-negative integer and use only when `aim > 0`. Formula: `rerollCapacity = aim * (2 + precise) + observe`. UI: new number input, disabled when `aimTokensNum === 0`, pass `preciseNum` into engine.

**Tech Stack:** React (useState), TypeScript, Vitest. No new dependencies.

---

### Task 1: Engine – Precise adds rerolls per Aim token (TDD)

**Files:**
- Modify: `src/engine/probability.ts` (calculateAttackPool signature and rerollCapacity)
- Test: `src/engine/__tests__/probability.test.ts`

**Step 1: Write the failing test**

Add a new describe block in `src/engine/__tests__/probability.test.ts` after the "Aim and Observe tokens" block:

```ts
describe('Precise keyword', () => {
  it('1 Aim + Precise 1: reroll capacity 3 (higher expected total than 1 Aim + Precise 0)', () => {
    const pool: AttackPool = { red: 0, black: 0, white: 2 };
    const oneAimNoPrecise = calculateAttackPool(pool, 'none', undefined, 0, 1, 0);
    const oneAimPrecise1 = calculateAttackPool(pool, 'none', undefined, 0, 1, 0, 1);
    expect(oneAimPrecise1.expectedTotal).toBeGreaterThan(oneAimNoPrecise.expectedTotal);
    expect(oneAimPrecise1.expectedHits).toBeGreaterThan(oneAimNoPrecise.expectedHits);
  });

  it('2 Aim + Precise 1: reroll capacity 6', () => {
    const pool: AttackPool = { red: 0, black: 0, white: 3 };
    const twoAimPrecise0 = calculateAttackPool(pool, 'none', undefined, 0, 2, 0);
    const twoAimPrecise1 = calculateAttackPool(pool, 'none', undefined, 0, 2, 0, 1);
    expect(twoAimPrecise1.expectedTotal).toBeGreaterThan(twoAimPrecise0.expectedTotal);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/engine/__tests__/probability.test.ts -t "Precise keyword"`
Expected: FAIL (e.g. calculateAttackPool does not accept 7 arguments, or expected values not greater)

**Step 3: Implement minimal support**

In `src/engine/probability.ts`:
- Add optional parameter `precise?: number` to `calculateAttackPool` (after `observeTokens`).
- After `const observe = normalizeTokenCount(observeTokens);`, add:
  - `const preciseVal = aim > 0 ? Math.max(0, Math.floor(precise ?? 0) || 0) : 0;`
- Replace `const rerollCapacity = aim * 2 + observe;` with:
  - `const rerollCapacity = aim * (2 + preciseVal) + observe;`

**Step 4: Run test to verify it passes**

Run: `npm test -- src/engine/__tests__/probability.test.ts -t "Precise keyword"`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/probability.ts src/engine/__tests__/probability.test.ts
git commit -m "feat(engine): Precise keyword adds extra rerolls per Aim token"
```

---

### Task 2: Engine – Precise has no effect when Aim is 0

**Files:**
- Test: `src/engine/__tests__/probability.test.ts`

**Step 1: Write the failing test**

Add inside the same `describe('Precise keyword')` block:

```ts
  it('0 Aim + Precise 1: same as 0 Aim (precise ignored)', () => {
    const pool: AttackPool = { red: 0, black: 0, white: 2 };
    const zeroAim = calculateAttackPool(pool, 'none', undefined, 0, 0, 0);
    const zeroAimPrecise1 = calculateAttackPool(pool, 'none', undefined, 0, 0, 0, 1);
    expect(zeroAimPrecise1.expectedHits).toBeCloseTo(zeroAim.expectedHits);
    expect(zeroAimPrecise1.expectedCrits).toBeCloseTo(zeroAim.expectedCrits);
  });
```

**Step 2: Run test to verify it fails (or already passes)**

Run: `npm test -- src/engine/__tests__/probability.test.ts -t "Precise keyword"`
If the implementation in Task 1 already used `aim > 0 ? ... : 0` for preciseVal, this may already PASS.

**Step 3: Run tests**

Run: `npm test -- src/engine/__tests__/probability.test.ts`
Expected: All tests PASS.

**Step 4: Commit (if any change was needed)**

```bash
git add src/engine/__tests__/probability.test.ts
git commit -m "test(engine): Precise ignored when Aim is 0"
```

---

### Task 3: UI – Precise input and wiring

**Files:**
- Modify: `src/App.tsx` (state, derived value, input, useMemo, placement after Aim Tokens)

**Step 1: Add state and derived value**

In `src/App.tsx`:
- Add state: `const [precise, setPrecise] = useState<string>('');`
- Add derived value after `observeTokensNum`: `const preciseNum = precise === '' ? 0 : Math.max(0, Math.floor(Number(precise)) || 0);`

**Step 2: Pass precise into calculateAttackPool**

- In the `useMemo` call to `calculateAttackPool`, add the 7th argument `preciseNum`.
- Add `preciseNum` to the dependency array.

**Step 3: Add Precise input**

- After the Aim Tokens `app__token-input` div (and before Observe Tokens), add a new div with class `app__token-input` or reuse the same pattern as Critical X (`app__critical-x`). Suggested class `app__precise` for consistency with other keywords.
- Label: "Keyword: Precise"
- Input: `id="precise"`, `type="number"`, `min={0}`, `placeholder="0"`, `value={precise}`, `onChange={(e) => setPrecise(e.target.value)}`, `disabled={aimTokensNum === 0}`, `title={aimTokensNum === 0 ? 'Precise only applies when using Aim tokens.' : 'Extra rerolls per Aim token when using Aim.'}`

**Step 4: Verify**

- Run: `npm test`
- Run: `npm run dev` and confirm: with 0 Aim, Precise input is disabled; with 1+ Aim, entering Precise 1 increases expected totals.

**Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat(ui): add Precise keyword input, disabled when Aim is 0"
```

---

Plan complete. Execution options:

**1. Subagent-Driven (this session)** – I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Parallel Session (separate)** – Open a new session with executing-plans and run through the plan with checkpoints.

Which approach do you want?
