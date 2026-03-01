# Dug In Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Dug In defense toggle: when on, the cover roll uses red defense dice instead of white; main defense pool unchanged.

**Architecture:** Add optional `coverDieColor` to `applyCover` (default `'white'`). Thread `dugIn: boolean` through `simulateWounds`, `simulateWoundsFromAttackResults`, and `calculateWounds`; when `dugIn` is true pass `'red'` as cover die color to `applyCover`. UI: one checkbox in Defense section (after Cover), URL state key `dug`.

**Tech Stack:** TypeScript, React, Vite, Vitest. See `AGENTS.md` for commands.

**Design:** `docs/plans/2026-02-28-dug-in-design.md`

---

### Task 1: applyCover accepts cover die color

**Files:**

- Modify: `src/engine/simulate.ts` (applyCover and its JSDoc)
- Test: `src/engine/__tests__/simulate.test.ts`

**Step 1: Write the failing test**

In `simulate.test.ts`, inside `describe('applyCover', ...)`, add a test that with the same seed, `applyCover` with `coverDieColor: 'red'` can produce a different result than with white (red has more blocks, so more hits cancelled). Use a fixed seed and e.g. 4 hits, heavy cover; call once with white (existing signature) and once with red (new param). Assert the two results are not equal (or that red yields fewer or equal hits). The test will fail until Step 3 adds the parameter.

Example:

```ts
it('coverDieColor red: with same seed can cancel more hits than white (red has more blocks)', () => {
  const rngWhite = createSeededRng(777);
  const rngRed = createSeededRng(777);
  const withWhite = applyCover(4, 2, 'heavy', rngWhite, 0);
  const withRed = applyCover(4, 2, 'heavy', rngRed, 0, false, undefined, 'red');
  // Red die has 3 block faces vs white 1; so red should cancel at least as many hits
  expect(withRed.hits).toBeLessThanOrEqual(withWhite.hits);
});
```

Note: Once we add the param, existing `applyCover` calls without the new param must still work (default white). So the new param should be last and optional.

**Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/engine/__tests__/simulate.test.ts -t "coverDieColor"`

Expected: FAIL (applyCover does not accept 8th param / coverDieColor).

**Step 3: Implement applyCover coverDieColor**

In `src/engine/simulate.ts`:

- Update JSDoc for `applyCover`: "Apply cover: roll hits with given defense die color (default white); light = blocks cancel hits, heavy = blocks+surges cancel hits; crits unchanged."
- Add optional parameter to `applyCover`: `coverDieColor?: DefenseDieColor` as the **last** parameter (after `coverX`).
- Replace the line `const face = rollOneDefenseDieOutcome('white', rng);` with `const face = rollOneDefenseDieOutcome(coverDieColor ?? 'white', rng);`.

**Step 4: Run test to verify it passes**

Run: `npm run test -- --run src/engine/__tests__/simulate.test.ts`

Expected: All tests pass (including the new one). Fix the new test if needed: e.g. with same seed, white and red use different face distributions so the assertion should hold.

**Step 5: Commit**

```bash
git add src/engine/simulate.ts src/engine/__tests__/simulate.test.ts
git commit -m "feat(engine): applyCover accepts optional coverDieColor (default white)"
```

---

### Task 2: simulateWounds and simulateWoundsFromAttackResults accept dugIn

**Files:**

- Modify: `src/engine/simulate.ts` (signatures and applyCover call sites)
- Test: `src/engine/__tests__/simulate.test.ts` (add Dug In wounds test; update any call sites if needed)

**Step 1: Add dugIn to simulateWounds**

In `simulate.ts`:

- Add parameter `dugIn: boolean = false` to `simulateWounds` (after `coverX`, before `sharpshooterX` or in the same neighborhood as other defense options; keep alphabetical or logical order).
- Where `applyCover` is called (around line 493), compute `const coverDieColor: DefenseDieColor = dugIn ? 'red' : 'white';` before the call, and add that as the last argument: `applyCover(..., normalizedCoverX, coverDieColor)`.

**Step 2: Add dugIn to simulateWoundsFromAttackResults**

- Add parameter `dugIn: boolean = false` to `simulateWoundsFromAttackResults` (same relative position as in simulateWounds: after coverX, before sharpshooterX).
- Where `applyCover` is called (around line 629), compute `coverDieColor` and pass it: `applyCover(..., normalizedCoverX, coverDieColor)`.

**Step 3: Add failing test for Dug In in wounds simulation**

In `simulate.test.ts`, add a describe block, e.g. `describe('Dug In in wounds simulation', () => { ... })`. Build `attackResults` with a single outcome (e.g. 2 hits, 0 crits, probability 1). Call `simulateWoundsFromAttackResults` with `cover: 'light'` (or `'heavy'`), once with `dugIn: false` and once with `dugIn: true`. Assert that expected wounds with `dugIn: true` are less than or equal to expected wounds with `dugIn: false` (red cover dice block more). Use a fixed seed and enough runs (e.g. 5000).

**Step 4: Run tests**

Run: `npm run test -- --run src/engine/__tests__/simulate.test.ts`

Expected: All tests pass. If any existing test calls `simulateWounds` or `simulateWoundsFromAttackResults` with the full argument list, add `false` for `dugIn` in the correct position (or rely on default).

**Step 5: Commit**

```bash
git add src/engine/simulate.ts src/engine/__tests__/simulate.test.ts
git commit -m "feat(engine): simulateWounds and simulateWoundsFromAttackResults accept dugIn for cover roll"
```

---

### Task 3: calculateWounds accepts dugIn and passes through

**Files:**

- Modify: `src/engine/probability.ts` (calculateWounds signature and simulateWoundsFromAttackResults call)

**Step 1: Add dugIn to calculateWounds**

In `probability.ts`, add optional parameter `dugIn?: boolean` to `calculateWounds` (e.g. after `cover` or with other defense options). Pass `dugIn ?? false` into the `simulateWoundsFromAttackResults` call in the correct argument position (matching the new parameter order in simulate.ts).

**Step 2: Run tests**

Run: `npm run test -- --run`

Expected: All tests pass.

**Step 3: Commit**

```bash
git add src/engine/probability.ts
git commit -m "feat(probability): calculateWounds accepts dugIn and passes to simulation"
```

---

### Task 4: URL state for dugIn

**Files:**

- Modify: `src/urlState.ts` (UrlState, DEFAULT_URL_STATE, parseFragment)
- No new test required if existing URL tests cover parse/build; otherwise run app and open `#dug=1` to confirm.

**Step 1: Add dugIn to UrlState and parse**

In `urlState.ts`:

- Add `dugIn: boolean` to the `UrlState` interface (e.g. after `cover` or `backup`).
- In `DEFAULT_URL_STATE`, set `dugIn: false`.
- In `parseFragment`, add `dugIn: parseBoolean(get('dug'))` (key in fragment is `dug`; omit from fragment when false per existing build logic).

**Step 2: Verify buildFragment**

`buildFragment` already serializes booleans and omits defaults; no change needed if it iterates over `DEFAULT_URL_STATE` keys. Ensure `dugIn` is included in the keys so when `dugIn === true` it appears as `dug=1`.

**Step 3: Run tests and quick manual check**

Run: `npm run test -- --run`. Open app with `#dug=1` and confirm Defense section shows Dug In checked.

**Step 4: Commit**

```bash
git add src/urlState.ts
git commit -m "feat(url): add dugIn (dug) to URL state"
```

---

### Task 5: App state, URL sync, reset, and calculateWounds wiring

**Files:**

- Modify: `src/App.tsx`

**Step 1: Add state and URL init**

- Add `const [dugIn, setDugIn] = useState<boolean>(() => initialFromUrl?.dugIn ?? false);`.
- In the `urlState` useMemo, add `dugIn` (and include `dugIn` in the dependency array).
- In `handleReset`, add `setDugIn(false);`.

**Step 2: Pass dugIn to calculateWounds**

- In the `calculateWounds(...)` call, add the `dugIn` argument in the correct position (see `calculateWounds` signature from Task 3).
- Add `dugIn` to the useMemo dependency array for `woundsResults`.

**Step 3: Run tests and lint**

Run: `npm run test -- --run` and `npm run lint`.

Expected: Pass.

**Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat(App): add dugIn state, URL sync, reset, and wounds calculation"
```

---

### Task 6: Dug In checkbox in Defense section

**Files:**

- Modify: `src/App.tsx`

**Step 1: Add CheckboxToggle for Dug In**

In the Defense Pool section, after `<CoverToggle value={cover} onChange={setCover} />`, add a CheckboxToggle:

- `id="dug-in"`
- `label="Dug In"`
- `title="When in cover, roll red defense dice for the cover roll instead of white."`
- `checked={dugIn}`
- `onChange={setDugIn}`
- Omit `guideAnchor` unless Legion Quick Guide has a dug-in anchor (per project rule).

**Step 2: Run and verify**

Run: `npm run dev`, open app, toggle Dug In with cover light/heavy and confirm expected wounds change (Dug In on → fewer wounds when cover applies).

**Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat(ui): add Dug In checkbox to Defense section"
```

---

### Task 7: types.ts comment and verification

**Files:**

- Modify: `src/types.ts` (comment for CoverLevel or cover)

**Step 1: Update comment**

In `types.ts`, find the comment that says "Cover rolls white defense dice" (near `CoverLevel` or cover). Update it to: "Cover rolls white defense dice unless Dug In is on (then red)."

**Step 2: Full verification**

Run: `npm run test -- --run`, `npm run lint`, `npm run build`. Confirm no errors.

**Step 3: Commit**

```bash
git add src/types.ts
git commit -m "docs(types): document Dug In for cover roll die color"
```

---

## Execution handoff

Plan complete and saved to `docs/plans/2026-02-28-dug-in-plan.md`. Two execution options:

1. **Subagent-Driven (this session)** – I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Parallel Session (separate)** – Open a new session with executing-plans, batch execution with checkpoints.

Which approach?
