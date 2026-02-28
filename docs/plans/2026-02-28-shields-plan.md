# Shield Tokens Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Shield defense tokens: each cancels one hit or one crit after cover/armor/backup, applied before dodge; optimal use = crits first, then hits.

**Architecture:** Add `shieldTokens` parameter to both wound simulation functions; compute `critsAfterShields` and `hitsAfterShields` (optimal: cancel crits first), then apply dodge to remaining hits. Single UI number input and URL key `shield`. See `docs/plans/2026-02-28-shields-design.md`.

**Tech Stack:** React 19, TypeScript, Vite, Vitest. No new dependencies.

---

## Task 1: Engine – shields-first then dodge in simulate

**Files:**
- Modify: `src/engine/simulate.ts` (add param and logic in `simulateWounds` and `simulateWoundsFromAttackResults`)
- Modify: `src/engine/__tests__/simulate.test.ts` (add one failing test, then fix all call sites)

**Step 1: Write the failing test**

In `src/engine/__tests__/simulate.test.ts`, add a new `describe('shield tokens in wounds simulation', () => { ... })` (e.g. after the dodge/outmaneuver tests). Add one test that asserts: for a single outcome 1 hit + 1 crit, 1 shield and 1 dodge, defense dice = 0 so expected wounds = 0.

Example: add a `describe('shield tokens in wounds simulation', () => { ... })` and one test that uses a single-outcome attack (1 hit, 1 crit). Call `simulateWoundsFromAttackResults` with `dodgeTokens: 1`, `shieldTokens: 1` (insert as new arg after dodgeTokens), and the rest as in existing tests (see e.g. defense surge tokens test around line 383 for full arg list). Assert `result.expectedWounds === 0` (shields cancel 1 crit, dodge cancels 1 hit → 0 defense dice). Copy an existing call from the file and insert the extra argument `1` for shieldTokens after the dodgeTokens argument; the test will fail until the engine accepts the new parameter and implements shields-first then dodge.

**Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/engine/__tests__/simulate.test.ts -t "shield"`
Expected: FAIL (either missing param or wrong expectedWounds because shields not applied).

**Step 3: Implement shields in simulate**

In `src/engine/simulate.ts`:

- **simulateWounds** (around lines 402–430): Add parameter `shieldTokens: number` immediately after `dodgeTokens`. Normalize: `const normalizedShields = Math.max(0, Math.floor(shieldTokens));`
- After computing `hitsAfterBackup` and using `afterCover.crits`, compute:
  - `critsAfterShields = Math.max(0, afterCover.crits - normalizedShields)`
  - `hitsAfterShields = Math.max(0, hitsAfterBackup - Math.max(0, normalizedShields - afterCover.crits))`
- Then apply dodge to the *remaining* hits/crits (outmaneuver only affects dodge):
  - `defenseDice = outmaneuver ? Math.max(0, hitsAfterShields + critsAfterShields - normalizedDodge) : critsAfterShields + Math.max(0, hitsAfterShields - normalizedDodge)`
- Replace the current `defenseDice = outmaneuver ? ... : ...` block (lines 474–476) with the above two-step (shields then dodge).

- **simulateWoundsFromAttackResults** (around lines 516–537): Add parameter `shieldTokens: number` immediately after `dodgeTokens`. Normalize `normalizedShields` the same way. After `hitsAfterBackup` and `afterCover.crits`, compute `critsAfterShields` and `hitsAfterShields` as above, then `defenseDice` from those and `normalizedDodge` (same formula). Replace the current defenseDice assignment (lines 577–581).

**Step 4: Update all call sites to pass shieldTokens**

- In `src/engine/probability.ts`: `simulateWoundsFromAttackResults(..., dodgeTokens ?? 0, ???, outmaneuver, ...)`. Insert the new argument for shield tokens (default 0) after `dodgeTokens`. Do not add the param to `calculateWounds` in this task—only the simulate layer.
- In `src/engine/__tests__/simulate.test.ts`: For every call to `simulateWounds(` or `simulateWoundsFromAttackResults(`, insert `0` (shieldTokens) in the correct position: immediately after the `dodgeTokens` argument. Use search to find all call sites and add the extra argument.

**Step 5: Run tests**

Run: `npm run test -- --run`
Expected: All tests pass, including the new shield test (with shieldTokens set to 1 in that test).

**Step 6: Commit**

```bash
git add src/engine/simulate.ts src/engine/__tests__/simulate.test.ts src/engine/probability.ts
git commit -m "feat(engine): shield tokens applied before dodge in wounds sim"
```

---

## Task 2: calculateWounds API and probability tests

**Files:**
- Modify: `src/engine/probability.ts` (add `shieldTokens?: number` to `calculateWounds`, pass to simulate)
- Modify: `src/engine/__tests__/probability.test.ts` (regression test for 0 shields; optional shields test)

**Step 1: Add shieldTokens to calculateWounds**

In `src/engine/probability.ts`, add optional parameter `shieldTokens?: number` to `calculateWounds` (e.g. after `dodgeTokens`). Default to `0`. Pass `shieldTokens ?? 0` into `simulateWoundsFromAttackResults` in the correct position (after dodgeTokens).

**Step 2: Regression test**

In `src/engine/__tests__/probability.test.ts`, add (or extend) a test that calls `calculateWounds(..., dodgeTokens, ..., shieldTokens)` with `shieldTokens: 0` and asserts the result matches the same call without the param (or previous behavior). If there is an existing "dodge 0 matches no-dodge" style test, add "shield 0 matches no-shield" similarly.

**Step 3: Run tests**

Run: `npm run test -- --run`
Expected: All pass.

**Step 4: Commit**

```bash
git add src/engine/probability.ts src/engine/__tests__/probability.test.ts
git commit -m "feat(engine): expose shieldTokens in calculateWounds; tests"
```

---

## Task 3: URL state for shields

**Files:**
- Modify: `src/urlState.ts` (add `shield`, default 0; parse in parseFragment)
- Reference: `.cursor/rules/url-state-new-inputs.mdc`

**Step 1: Add shield to UrlState**

In `src/urlState.ts`: Add `shield: number` to the `UrlState` interface. Add `shield: 0` to `DEFAULT_URL_STATE`. In `parseFragment`, add `shield: parseNumber(get('shield'), DEFAULT_URL_STATE.shield)` to the returned object. `buildFragment` will include it automatically (it iterates `Object.keys(DEFAULT_URL_STATE)`).

**Step 2: Run tests**

Run: `npm run test -- --run`
Expected: Pass. Optionally open app with `#shield=2` and confirm defense section shows 2 for Shields after wiring UI in next task.

**Step 3: Commit**

```bash
git add src/urlState.ts
git commit -m "feat(url): add shield to URL state"
```

---

## Task 4: App state, URL sync, reset, and Shields control

**Files:**
- Modify: `src/App.tsx` (state, urlState, reset, woundsResults deps, Shields input, calculateWounds args)

**Step 1: State and URL init**

Add state: `const [shieldTokens, setShieldTokens] = useState<string>(() => initialFromUrl ? (initialFromUrl.shield === 0 ? '' : String(initialFromUrl.shield)) : '');` (place near `dodgeTokens`).

**Step 2: urlState and dependencies**

In the `urlState` useMemo object, add `shield: shieldTokens === '' ? 0 : Math.max(0, Math.floor(Number(shieldTokens)) || 0)`. Add `shieldTokens` to the dependency array.

**Step 3: Reset**

In `handleReset`, add `setShieldTokens('');`.

**Step 4: Parsed value and calculateWounds**

Define `shieldTokensNum` (e.g. next to `dodgeTokensNum`): `shieldTokens === '' ? 0 : Math.max(0, Math.floor(Number(shieldTokens)) || 0)`. Pass `shieldTokensNum` into `calculateWounds(..., dodgeTokensNum, shieldTokensNum, ...)` in the correct position (after dodgeTokens). Add `shieldTokensNum` to the `woundsResults` useMemo dependency array.

**Step 5: Shields control**

In the Defense section, under the "Tokens" subheading, add the Shields input **before** the Dodge input:

```tsx
<NumberInputWithControls
  id="shield-tokens"
  label="Shields"
  value={shieldTokens}
  onChange={setShieldTokens}
  min={0}
  title="Cancel one hit or one crit per token before rolling defense (applied after cover, before dodge)."
/>
```

Do not add `guideAnchor` unless Shields exists on Legion Quick Guide.

**Step 6: Run lint and tests**

Run: `npm run lint` and `npm run test -- --run`
Expected: No errors, all tests pass.

**Step 7: Commit**

```bash
git add src/App.tsx
git commit -m "feat(ui): add Shields token input and URL sync"
```

---

## Task 5: Optional probability test for shields + dodge

**Files:**
- Modify: `src/engine/__tests__/probability.test.ts`

**Step 1: Add test**

Add a test that with a single (hits, crits) outcome, more shield tokens (or shields + dodge) reduces expected wounds. E.g. `calculateWounds` with 2 hits 1 crit, 0 shields vs 1 shield: expected wounds with 1 shield should be less than with 0.

**Step 2: Run tests and commit**

Run: `npm run test -- --run`
Commit: `git add src/engine/__tests__/probability.test.ts && git commit -m "test: shields reduce expected wounds"`

---

## Execution handoff

Plan complete and saved to `docs/plans/2026-02-28-shields-plan.md`.

**Two execution options:**

1. **Subagent-driven (this session)** – I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Parallel session (separate)** – Open a new session with executing-plans and run through the plan with checkpoints.

Which approach do you want?
