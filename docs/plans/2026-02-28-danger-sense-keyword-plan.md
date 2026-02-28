# Danger Sense X Keyword (Defense) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Danger Sense X defense keyword and Suppression tokens count: defender rolls one extra defense die per suppression token, up to X extra dice. Suppressed checkbox unchanged (cover only).

**Architecture:** Add `suppressionTokens` and `dangerSenseX` through the stack. In sim, after computing `defenseDice`, add `dangerSenseExtra = min(suppressionTokens, dangerSenseX)` and add to `totalDefenseDice` (with existing impervious extra). Roll `totalDefenseDice` dice; wounds = max(0, defenseDice - effectiveBlocks) (same as today—extra dice only increase blocks). UI: two number inputs in Defense section (Suppression tokens, Danger Sense X), same pattern as Dodge/Cover X.

**Tech Stack:** TypeScript, React, Vite, Vitest. See `AGENTS.md` for commands.

**Design:** `docs/plans/2026-02-28-danger-sense-design.md`

---

### Task 1: Failing sim test — Danger Sense X adds extra defense dice

**Files:**
- Modify: `src/engine/__tests__/simulate.test.ts`

**Step 1: Add test for Danger Sense X in wounds simulation**

In `simulate.test.ts`, add a new `describe('Danger Sense X in wounds simulation', () => { ... })`. Use `simulateWoundsFromAttackResults` with a single outcome, e.g. `distributionByHitsCrits: [{ hits: 3, crits: 1, probability: 1 }]`. Call once with `suppressionTokens: 0`, `dangerSenseX: 0` and once with `suppressionTokens: 2`, `dangerSenseX: 2` (pass these after `impervious`, before `runs`). Assert that expected wounds with Danger Sense 2 are less than or equal to those with 0 (more defense dice → more blocks → fewer wounds). The test will fail with a type/argument error until Task 2 adds the parameters.

Example (adapt to existing test style and imports; note `defenseSurgeTokens` is a number in current signature):

```ts
describe('Danger Sense X in wounds simulation', () => {
  it('dangerSenseX 2 with 2 suppression yields lower or equal expected wounds than 0/0', () => {
    const attackResults: AttackResults = {
      expectedHits: 3,
      expectedCrits: 1,
      expectedTotal: 4,
      distribution: [],
      distributionByHitsCrits: [{ hits: 3, crits: 1, probability: 1 }],
      cumulative: [],
    };
    const runs = 5000;
    const rng = createSeededRng(42);
    const woundsNone = simulateWoundsFromAttackResults(
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
      0,
      0,
      0,
      false,
      0,   // suppressionTokens
      0,   // dangerSenseX
      runs,
      rng
    );
    const woundsDangerSense2 = simulateWoundsFromAttackResults(
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
      0,
      0,
      0,
      false,
      2,   // suppressionTokens
      2,   // dangerSenseX
      runs,
      rng
    );
    expect(woundsDangerSense2.expectedWounds).toBeLessThanOrEqual(woundsNone.expectedWounds);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/engine/__tests__/simulate.test.ts -t "Danger Sense"`

Expected: FAIL (e.g. missing arguments or simulateWoundsFromAttackResults does not accept suppressionTokens/dangerSenseX).

**Step 3: (After Task 2) Run test to verify it passes**

Run: `npm run test -- src/engine/__tests__/simulate.test.ts -t "Danger Sense"`

Expected: PASS

**Step 4: Commit**

```bash
git add src/engine/__tests__/simulate.test.ts
git commit -m "test(sim): Danger Sense X in wounds simulation"
```

---

### Task 2: Implement Danger Sense X in simulate.ts

**Files:**
- Modify: `src/engine/simulate.ts` (signatures and wound pipeline for both `simulateWounds` and `simulateWoundsFromAttackResults`)

**Step 1: Add suppressionTokens and dangerSenseX to simulateWoundsFromAttackResults**

- Add parameters `suppressionTokens: number = 0` and `dangerSenseX: number = 0` after `impervious`, before `runs`.
- After the line that sets `defenseDice`, add:
  - `const normalizedSuppressionTokens = Math.max(0, Math.floor(suppressionTokens));`
  - `const normalizedDangerSenseX = Math.max(0, Math.floor(dangerSenseX));`
  - `const dangerSenseExtra = Math.min(normalizedSuppressionTokens, normalizedDangerSenseX);`
- Change the line that sets `totalDefenseDice` from `defenseDice + extraDiceFromImpervious` to `defenseDice + extraDiceFromImpervious + dangerSenseExtra`.
- No change to the wounds formula: keep `wounds = Math.max(0, defenseDice - effectiveBlocks)` (extra dice only increase blocks).

**Step 2: Add suppressionTokens and dangerSenseX to simulateWounds**

- Add the same two parameters after `impervious`, before `runs`.
- In the per-run loop, after computing `defenseDice`, add the same normalization and `dangerSenseExtra`, and add `dangerSenseExtra` to `totalDefenseDice` (so `totalDefenseDice = defenseDice + extraDiceFromImpervious + dangerSenseExtra`).

**Step 2b: Update call sites**

- Update every call to `simulateWoundsFromAttackResults` in `src/engine/__tests__/simulate.test.ts` to pass two additional arguments after `impervious`: `0, 0` (suppressionTokens, dangerSenseX) before `runs` and `rng`. The single call in `probability.ts` is updated in Task 4.

**Step 3: Run sim tests**

Run: `npm run test -- src/engine/__tests__/simulate.test.ts`

Expected: All tests pass (including the new Danger Sense X test once call sites are updated in Task 1 to pass the new args).

**Step 4: Commit**

```bash
git add src/engine/simulate.ts
git commit -m "feat(engine): Danger Sense X adds extra defense dice from suppression tokens"
```

---

### Task 3: Failing probability test — calculateWounds with suppressionTokens and dangerSenseX

**Files:**
- Modify: `src/engine/__tests__/probability.test.ts`

**Step 1: Add test for calculateWounds with Danger Sense**

Add an `it` that calls `calculateWounds` twice with the same attack results and defense setup: once with `suppressionTokens: 0`, `dangerSenseX: 0` and once with `suppressionTokens: 2`, `dangerSenseX: 2`. Assert that expected wounds with Danger Sense 2 are less than or equal to expected wounds with 0/0. Use a setup that yields at least some hits (e.g. attack pool with expected hits, no cover).

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/engine/__tests__/probability.test.ts -t "Danger Sense"` (or the test name you chose)

Expected: FAIL (e.g. calculateWounds does not accept suppressionTokens/dangerSenseX yet).

**Step 3: (After Task 4) Run test to verify it passes**

Run: `npm run test -- src/engine/__tests__/probability.test.ts`

Expected: PASS

**Step 4: Commit**

```bash
git add src/engine/__tests__/probability.test.ts
git commit -m "test(probability): calculateWounds with suppressionTokens and dangerSenseX"
```

---

### Task 4: Wire suppressionTokens and dangerSenseX in probability.ts

**Files:**
- Modify: `src/engine/probability.ts`

**Step 1: Add parameters to calculateWounds**

- Add optional parameters `suppressionTokens?: number` and `dangerSenseX?: number` after `impervious` (before the closing `): WoundsResults`).
- Compute normalized values: `const normalizedSuppressionTokens = Math.max(0, Math.floor(suppressionTokens ?? 0));` and `const normalizedDangerSenseX = Math.max(0, Math.floor(dangerSenseX ?? 0));`
- Pass both into the `simulateWoundsFromAttackResults` call in the same position as in simulate.ts (after `impervious ?? false`, before `DEFAULT_RUNS`).

**Step 2: Run all engine tests**

Run: `npm run test`

Expected: All tests pass.

**Step 3: Commit**

```bash
git add src/engine/probability.ts
git commit -m "feat(engine): calculateWounds accepts suppressionTokens and dangerSenseX"
```

---

### Task 5: UI state and wiring for Suppression tokens and Danger Sense X

**Files:**
- Modify: `src/App.tsx`

**Step 1: Add state and normalized values**

- Add `const [suppressionTokens, setSuppressionTokens] = useState<string>('');` and `const [dangerSenseX, setDangerSenseX] = useState<string>('');`
- Add `const suppressionTokensNum = suppressionTokens === '' ? 0 : Math.max(0, Math.floor(Number(suppressionTokens)) || 0);` and `const dangerSenseXNum = dangerSenseX === '' ? 0 : Math.max(0, Math.floor(Number(dangerSenseX)) || 0);`

**Step 2: Wire into calculateWounds and useMemo**

- In the `calculateWounds(...)` call, add `suppressionTokensNum` and `dangerSenseXNum` after `impervious` (before the closing `)`).
- Add `suppressionTokensNum` and `dangerSenseXNum` to the wounds `useMemo` dependency array.

**Step 3: Reset in handleReset**

- In `handleReset`, add `setSuppressionTokens('');` and `setDangerSenseX('');` (e.g. after `setArmorX('')` or with other defense state).

**Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat(ui): state and wiring for suppression tokens and Danger Sense X"
```

---

### Task 6: UI controls for Suppression tokens and Danger Sense X

**Files:**
- Modify: `src/App.tsx`

**Step 1: Add number inputs in Defense section**

- Add two `NumberInputWithControls` (or the same component used for Dodge tokens, Cover X, Armor X). Place after Armor X / Impact X and before Pierce X (or after Backup if that matches existing order). Order: Suppression tokens first, then Danger Sense X.
- Suppression tokens: label "Suppression tokens", `min={0}`, no max. Title/tooltip: "Number of suppression tokens on the defender; used by Danger Sense X for extra defense dice."
- Danger Sense X: label "Danger Sense X", `min={0}`. Title/tooltip: "While defending, roll one extra defense die per suppression token, up to X extra dice."
- Wire `value` and `onChange` to the corresponding state (`suppressionTokens`/`setSuppressionTokens`, `dangerSenseX`/`setDangerSenseX`).
- If Legion Quick Guide has anchors for "suppression-tokens" or "danger-sense", add `guideAnchor` per `.cursor/rules/legion-quick-guide-links.mdc`; otherwise omit.

**Step 2: Verify**

Run: `npm run build` and `npm run lint`. Open app, set Suppression tokens and Danger Sense X, confirm expected wounds change (e.g. 2 tokens + Danger Sense 2 should reduce expected wounds vs 0/0).

**Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat(ui): Suppression tokens and Danger Sense X inputs in Defense section"
```

---

### Task 7: Optional — cap test for Danger Sense X

**Files:**
- Modify: `src/engine/__tests__/simulate.test.ts`

**Step 1: Add test that extra dice are capped at X**

In the same `describe('Danger Sense X in wounds simulation', ...)`, add an `it` that compares 3 suppression tokens with Danger Sense 2 vs 2 suppression tokens with Danger Sense 2. Expected: same or very close expected wounds (both roll 2 extra dice). Use same attack outcome and same RNG seed; assert approximate equality (e.g. difference within a small tolerance) or that both are less than or equal to the 0/0 case.

**Step 2: Run test**

Run: `npm run test -- src/engine/__tests__/simulate.test.ts -t "Danger Sense"`

Expected: PASS

**Step 3: Commit**

```bash
git add src/engine/__tests__/simulate.test.ts
git commit -m "test(sim): Danger Sense X caps extra dice at X"
```
