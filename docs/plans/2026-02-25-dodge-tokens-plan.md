# Dodge Tokens Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Dodge tokens for defense: one token cancels one hit (crits cannot be dodged) before rolling defense dice. Defense section gets a Dodge token input; wounds engine uses a (hits, crits) attack distribution and optional dodge count.

**Architecture:** Add `distributionByHitsCrits` to AttackResults (built in `calculateAttackPool`). Extend `calculateWounds` with optional `dodgeTokens`; iterate (hits, crits) outcomes and set defense dice = crits + max(0, hits - dodgeTokens). UI: Defense "Tokens" subsection with `NumberInputWithControls` for Dodge, state and Reset wired in.

**Tech Stack:** React 19, TypeScript, Vite, Vitest. No new dependencies.

**Design reference:** `docs/plans/2026-02-25-dodge-tokens-design.md`

---

### Task 1: Add distributionByHitsCrits type and stub

**Files:**

- Modify: `src/types.ts`
- Test: `src/engine/__tests__/probability.test.ts`

**Step 1: Extend AttackResults type**

In `src/types.ts`, add to `AttackResults`:

```ts
distributionByHitsCrits: {
  hits: number;
  crits: number;
  probability: number;
}
[];
```

**Step 2: Write a failing test that expects distributionByHitsCrits on attack results**

In `src/engine/__tests__/probability.test.ts`, add a test (e.g. in or near the describe('calculateAttackPool') block):

```ts
it('returns distributionByHitsCrits that sums to 1 and matches total distribution', () => {
  const result = calculateAttackPool({ red: 1, black: 0, white: 0 }, 'none');
  expect(result.distributionByHitsCrits).toBeDefined();
  const sum = result.distributionByHitsCrits.reduce(
    (acc, entry) => acc + entry.probability,
    0
  );
  expect(sum).toBeCloseTo(1);
  // Marginal: total = hits + crits should match distribution by total
  const byTotal: Record<number, number> = {};
  for (const entry of result.distributionByHitsCrits) {
    const total = entry.hits + entry.crits;
    byTotal[total] = (byTotal[total] ?? 0) + entry.probability;
  }
  for (const { total, probability } of result.distribution) {
    expect(byTotal[total] ?? 0).toBeCloseTo(probability);
  }
});
```

**Step 3: Run test to verify it fails**

Run: `npm run test -- --run src/engine/__tests__/probability.test.ts`
Expected: FAIL (AttackResults has no distributionByHitsCrits / calculateAttackPool doesn't return it)

**Step 4: Implement minimal return in calculateAttackPool**

In `src/engine/probability.ts`:

- Add a structure in the loop over `distribution` (where hitsFinal/critsFinal are computed): e.g. `const hitsCritsKey = `${hitsFinal},${critsFinal}`; totalProbByHitsCrits.set(hitsCritsKey, (totalProbByHitsCrits.get(hitsCritsKey) ?? 0) + prob);`. Initialize `totalProbByHitsCrits` as `new Map<string, number>()` before the loop.
- After the loop, build `distributionByHitsCrits` array from the map: `Array.from(totalProbByHitsCrits.entries()).map(([key, probability]) => { const [hits, crits] = key.split(',').map(Number); return { hits, crits, probability }; })`.
- Add `distributionByHitsCrits` to the returned object of `calculateAttackPool`.

**Step 5: Run test to verify it passes**

Run: `npm run test -- --run src/engine/__tests__/probability.test.ts`
Expected: PASS (for the new test and existing tests; existing tests may need to be updated if they call calculateAttackPool and assert on the result shape—ensure no tests destructure AttackResults without distributionByHitsCrits in a way that breaks).

**Step 6: Commit**

```bash
git add src/types.ts src/engine/probability.ts src/engine/__tests__/probability.test.ts
git commit -m "feat: add distributionByHitsCrits to AttackResults and calculateAttackPool"
```

---

### Task 2: calculateWounds accepts dodgeTokens and uses distributionByHitsCrits

**Files:**

- Modify: `src/engine/probability.ts`
- Test: `src/engine/__tests__/probability.test.ts`

**Step 1: Write failing tests for dodge**

In `src/engine/__tests__/probability.test.ts`, inside describe('calculateWounds'), add:

```ts
it('dodge 0 matches no-dodge wounds', () => {
  const attackResults = calculateAttackPool(
    { red: 2, black: 0, white: 0 },
    'none'
  );
  const woundsNoDodge = calculateWounds(attackResults, 'red', 'none');
  const woundsDodge0 = calculateWounds(attackResults, 'red', 'none', 0);
  expect(woundsDodge0.expectedWounds).toBeCloseTo(woundsNoDodge.expectedWounds);
  expect(woundsDodge0.distribution.length).toBe(
    woundsNoDodge.distribution.length
  );
});

it('one outcome 3 hits 1 crit, 1 dodge: 3 defense dice (2 hits + 1 crit)', () => {
  const attackResults = calculateAttackPool(
    { red: 0, black: 0, white: 0 },
    'none'
  );
  const distributionByHitsCrits = [{ hits: 3, crits: 1, probability: 1 }];
  const attackWithHitsCrits = {
    ...attackResults,
    distribution: [{ total: 4, probability: 1 }],
    distributionByHitsCrits,
  };
  const wounds = calculateWounds(attackWithHitsCrits, 'red', 'none', 1);
  expect(wounds.expectedWounds).toBeDefined();
  const sum = wounds.distribution.reduce(
    (acc, entry) => acc + entry.probability,
    0
  );
  expect(sum).toBeCloseTo(1);
});

it('one outcome 1 hit 2 crits, 5 dodge: 2 defense dice (crits only)', () => {
  const attackResults = calculateAttackPool(
    { red: 0, black: 0, white: 0 },
    'none'
  );
  const distributionByHitsCrits = [{ hits: 1, crits: 2, probability: 1 }];
  const attackWithHitsCrits = {
    ...attackResults,
    distribution: [{ total: 3, probability: 1 }],
    distributionByHitsCrits,
  };
  const wounds = calculateWounds(attackWithHitsCrits, 'red', 'none', 5);
  const sum = wounds.distribution.reduce(
    (acc, entry) => acc + entry.probability,
    0
  );
  expect(sum).toBeCloseTo(1);
});
```

**Step 2: Run tests to verify they fail**

Run: `npm run test -- --run src/engine/__tests__/probability.test.ts`
Expected: FAIL (calculateWounds does not accept 4th argument / does not use dodge)

**Step 3: Implement calculateWounds with dodgeTokens**

In `src/engine/probability.ts`:

- Add optional parameter `dodgeTokens?: number` to `calculateWounds`. Normalize: `const normalizedDodge = Math.max(0, Math.floor(dodgeTokens ?? 0));` (or reuse a small helper).
- Replace the loop over `attackResults.distribution` with a loop over `attackResults.distributionByHitsCrits`. For each `{ hits, crits, probability }`: `const defenseDice = crits + Math.max(0, hits - normalizedDodge);` then `getDefenseDistributionForDiceCount(defenseDice, defenseDieColor, defenseSurge)`. Attack total for wounds is still `hits + crits`. So for each defense outcome: `wounds = max(0, (hits + crits) - defenseTotal)`; merge with weight `probability * defenseProb`.
- Keep the same wounds aggregation (woundsProbByTotal, expectedWounds, distribution, cumulative).

**Step 4: Fix existing calculateWounds tests that fabricate attack results**

Existing tests that pass a custom object like `{ ...attackResults, distribution: attackDist }` do not include `distributionByHitsCrits`. Either:

- Have those tests add a matching `distributionByHitsCrits` (e.g. for "attack always 1 success" use `distributionByHitsCrits: [{ hits: 1, crits: 0, probability: 1 }]` or `[{ hits: 0, crits: 1, probability: 1 }]` so the single outcome has total 1), or
- For "zero attack dice" the attack results from calculateAttackPool will already have distributionByHitsCrits (from Task 1); ensure zero-dice pool returns distributionByHitsCrits (e.g. `[{ hits: 0, crits: 0, probability: 1 }]`). Other fabricated tests: add distributionByHitsCrits that matches the 1D distribution they use.

**Step 5: Run tests to verify they pass**

Run: `npm run test -- --run`
Expected: All tests PASS.

**Step 6: Commit**

```bash
git add src/engine/probability.ts src/engine/__tests__/probability.test.ts
git commit -m "feat: wounds use distributionByHitsCrits and optional dodgeTokens"
```

---

### Task 3: Defense UI – Dodge state, control, Reset, wire to wounds

**Files:**

- Modify: `src/App.tsx`

**Step 1: Add state and parsing**

- Add `const [dodgeTokens, setDodgeTokens] = useState<string>('');`
- Add `const dodgeTokensNum = dodgeTokens === '' ? 0 : Math.max(0, Math.floor(Number(dodgeTokens)) || 0);`

**Step 2: Pass dodgeTokensNum into calculateWounds**

- Change the `calculateWounds(results, defenseDieColor, defenseSurge)` call to `calculateWounds(results, defenseDieColor, defenseSurge, dodgeTokensNum)`.
- Add `dodgeTokensNum` to the useMemo dependency array for woundsResults.

**Step 3: Add Defense Tokens subsection and Dodge input**

- After the Defense Surge toggle (before the closing `</section>` of the Defense section), add:
  - `<h3 className="app__section-heading">Tokens</h3>`
  - `<NumberInputWithControls id="dodge-tokens" label="Dodge" value={dodgeTokens} onChange={setDodgeTokens} title="Cancel one hit per token before rolling defense; crits cannot be dodged." />`

**Step 4: Reset**

- In `handleReset`, add `setDodgeTokens('');`

**Step 5: Verify**

- Run `npm run build` and `npm run test -- --run`. Manually run `npm run dev` and confirm Defense section shows Tokens / Dodge and wounds update when changing Dodge.

**Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add Dodge tokens control to Defense section"
```

---

## Execution Handoff

Plan complete and saved to `docs/plans/2026-02-25-dodge-tokens-plan.md`.

**Two execution options:**

1. **Subagent-Driven (this session)** – Dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Parallel Session (separate)** – Open a new session with executing-plans and run the plan task-by-task with checkpoints.

Which approach do you want?
