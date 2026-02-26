# Outmaneuver Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an Outmaneuver toggle for defense; when on, Dodge tokens can cancel crits as well as hits (defense dice = max(0, hits + crits − dodge)).

**Architecture:** Add `outmaneuver: boolean` to the wounds pipeline. In `simulate.ts`, both `simulateWounds` and `simulateWoundsFromAttackResults` compute defense dice with a branch: outmaneuver off → crits + max(0, hits − dodge); outmaneuver on → max(0, hits + crits − dodge). `probability.ts` `calculateWounds` gains an optional fifth parameter and passes it through. UI: one boolean state and a checkbox in the Defense section; Reset and useMemo wiring.

**Tech Stack:** React, TypeScript, Vite, Vitest.

**Design reference:** `docs/plans/2026-02-26-outmaneuver-design.md`

---

## Task 1: Engine – simulate.ts defense dice with outmaneuver

**Files:**
- Modify: `src/engine/simulate.ts` (simulateWounds, simulateWoundsFromAttackResults)

**Step 1: Add outmaneuver parameter and defense-dice branch in simulateWounds**

In `src/engine/simulate.ts`:

- Update `simulateWounds` signature: add `outmaneuver: boolean` after `dodgeTokens: number` (before `runs`).
- Replace the line that sets `defenseDice` (currently `const defenseDice = final.crits + Math.max(0, final.hits - normalizedDodge);`) with:

```ts
const defenseDice = outmaneuver
  ? Math.max(0, final.hits + final.crits - normalizedDodge)
  : final.crits + Math.max(0, final.hits - normalizedDodge);
```

**Step 2: Add outmaneuver parameter and same branch in simulateWoundsFromAttackResults**

- Update `simulateWoundsFromAttackResults` signature: add `outmaneuver: boolean` after `dodgeTokens: number` (before `runs`).
- Replace the line that sets `defenseDice` in the loop (currently `const defenseDice = crits + Math.max(0, hits - normalizedDodge);`) with:

```ts
const defenseDice = outmaneuver
  ? Math.max(0, hits + crits - normalizedDodge)
  : crits + Math.max(0, hits - normalizedDodge);
```

**Step 3: Fix simulate.test.ts call to simulateWounds**

In `src/engine/__tests__/simulate.test.ts`, the `simulateWounds` call passes 14 arguments. Insert `false` for `outmaneuver` after `0` (dodgeTokens), so the call becomes:

```ts
const result = simulateWounds(
  pool,
  'none',
  undefined,
  0,
  0,
  0,
  0,
  0,
  'red',
  'none',
  0,
  false,  // outmaneuver
  20_000,
  rng
);
```

**Step 4: Run tests**

Run: `npm run test -- --run`  
Expected: All tests pass (probability tests call calculateWounds with 4 args; no outmaneuver yet there).

**Step 5: Commit**

```bash
git add src/engine/simulate.ts src/engine/__tests__/simulate.test.ts
git commit -m "feat(engine): add outmaneuver to simulateWounds and simulateWoundsFromAttackResults"
```

---

## Task 2: Engine – probability.ts calculateWounds accepts outmaneuver

**Files:**
- Modify: `src/engine/probability.ts` (calculateWounds)

**Step 1: Add optional outmaneuver parameter and pass to sim**

In `src/engine/probability.ts`, change `calculateWounds` to:

```ts
export function calculateWounds(
  attackResults: AttackResults,
  defenseDieColor: DefenseDieColor,
  defenseSurge: DefenseSurgeConversion,
  dodgeTokens?: number,
  outmaneuver?: boolean
): WoundsResults {
  const rng = createSeededRng(SEED);
  return simulateWoundsFromAttackResults(
    attackResults,
    defenseDieColor,
    defenseSurge,
    dodgeTokens ?? 0,
    outmaneuver ?? false,
    DEFAULT_RUNS,
    rng
  );
}
```

**Step 2: Run tests**

Run: `npm run test -- --run`  
Expected: All tests pass (existing call sites use 4 args; outmaneuver defaults to false).

**Step 3: Commit**

```bash
git add src/engine/probability.ts
git commit -m "feat(engine): calculateWounds accepts optional outmaneuver"
```

---

## Task 3: Tests – Outmaneuver on vs off

**Files:**
- Modify: `src/engine/__tests__/probability.test.ts`

**Step 1: Add test: outmaneuver on, 1 hit 1 crit 1 dodge → 1 defense die**

In the same describe block as the other dodge tests, add:

```ts
it('outmaneuver on: 1 hit 1 crit 1 dodge → 1 defense die, expected wounds 0.5', () => {
  const emptyPool = calculateAttackPool({ red: 0, black: 0, white: 0 }, 'none');
  const attackWithHitsCrits = {
    ...emptyPool,
    distribution: [{ total: 2, probability: 1 }],
    distributionByHitsCrits: [{ hits: 1, crits: 1, probability: 1 }],
  };
  const wounds = calculateWounds(attackWithHitsCrits, 'red', 'none', 1, true);
  expect(wounds.expectedWounds).toBeCloseTo(0.5); // 1 die, expected blocks 0.5
});
```

**Step 2: Add test: outmaneuver off, same outcome → 2 defense dice**

```ts
it('outmaneuver off: 1 hit 1 crit 1 dodge → 2 defense dice (crit + hit)', () => {
  const emptyPool = calculateAttackPool({ red: 0, black: 0, white: 0 }, 'none');
  const attackWithHitsCrits = {
    ...emptyPool,
    distribution: [{ total: 2, probability: 1 }],
    distributionByHitsCrits: [{ hits: 1, crits: 1, probability: 1 }],
  };
  const wounds = calculateWounds(attackWithHitsCrits, 'red', 'none', 1, false);
  expect(wounds.expectedWounds).toBeCloseTo(1.5); // 2 dice, expected blocks 1
});
```

**Step 3: Add test: toggling outmaneuver changes expected wounds when crits and dodge present**

```ts
it('outmaneuver on reduces expected wounds vs off when crits and dodge present', () => {
  const emptyPool = calculateAttackPool({ red: 0, black: 0, white: 0 }, 'none');
  const attackWithHitsCrits = {
    ...emptyPool,
    distribution: [{ total: 2, probability: 1 }],
    distributionByHitsCrits: [{ hits: 1, crits: 1, probability: 1 }],
  };
  const woundsOff = calculateWounds(attackWithHitsCrits, 'red', 'none', 1, false);
  const woundsOn = calculateWounds(attackWithHitsCrits, 'red', 'none', 1, true);
  expect(woundsOn.expectedWounds).toBeLessThan(woundsOff.expectedWounds);
});
```

**Step 4: Run tests**

Run: `npm run test -- --run`  
Expected: All tests pass, including the three new ones.

**Step 5: Commit**

```bash
git add src/engine/__tests__/probability.test.ts
git commit -m "test: outmaneuver on/off and wounds difference"
```

---

## Task 4: UI – Outmaneuver state, checkbox, Reset, wiring

**Files:**
- Modify: `src/App.tsx`

**Step 1: Add state and wire calculateWounds**

- After `const [dodgeTokens, setDodgeTokens] = useState<string>('');` add: `const [outmaneuver, setOutmaneuver] = useState<boolean>(false);`
- Change the `calculateWounds` call to: `calculateWounds(results, defenseDieColor, defenseSurge, dodgeTokensNum, outmaneuver)`
- Add `outmaneuver` to the `useMemo` dependency array for `woundsResults`.

**Step 2: Add Outmaneuver checkbox in Defense section**

In the Defense section, after the Dodge `NumberInputWithControls` (before the closing `</section>` of the Defense section), add:

```tsx
<label className="app__checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
  <input
    type="checkbox"
    id="outmaneuver"
    checked={outmaneuver}
    onChange={(e) => setOutmaneuver(e.target.checked)}
            />
  <span title="Dodge tokens can cancel crits as well as hits.">Outmaneuver</span>
</label>
```

(If the project has a shared checkbox class, use it instead of inline style.)

**Step 3: Reset outmaneuver in handleReset**

In `handleReset`, add `setOutmaneuver(false);` (e.g. after `setDodgeTokens('');`).

**Step 4: Run build and lint**

Run: `npm run build` and `npm run lint`  
Expected: Build succeeds, no lint errors.

**Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat(ui): Outmaneuver toggle in Defense section"
```

---

## Task 5: Optional – dedicated Outmaneuver component and tooltip

If you prefer a small reusable checkbox component and a proper tooltip (e.g. matching SurgeToggle pattern), add a component and use it in App; otherwise the inline checkbox in Task 4 is sufficient. Skip or add per team preference.

---

Plan complete. Two execution options:

**1. Subagent-Driven (this session)** – I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Parallel Session (separate)** – Open a new session with executing-plans and run through the plan with checkpoints.

Which approach?
