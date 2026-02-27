# Pierce X Keyword Implementation Plan

**Goal:** Add Pierce X attack keyword: cancel up to X blocks on the final defense roll. Apply Legion Quick Guide link for the new control (`guideAnchor="pierce-x"`).

**Architecture:** Add optional `pierceX?: number` to the wounds path only: `calculateWounds`, `simulateWoundsFromAttackResults`, `simulateWounds`. After computing `blocks` from the main defense roll, set `effectiveBlocks = max(0, blocks - pierceX)` and `wounds = max(0, defenseDice - effectiveBlocks)`. UI: number input in Keywords section with `guideAnchor="pierce-x"`.

---

### Task 1: Engine – Pierce in wounds resolution

**Files:** `src/engine/simulate.ts`, `src/engine/probability.ts`

- **simulateWounds**: Add parameter `pierceX: number = 0` after `backup`, before `runs`. After `const blocks = resolveDefenseRoll(...)`, add `const effectiveBlocks = Math.max(0, blocks - Math.max(0, Math.floor(pierceX)));` and use `wounds = Math.max(0, defenseDice - effectiveBlocks)`.
- **simulateWoundsFromAttackResults**: Same: add `pierceX: number = 0` after `backup`, before `runs`; same effectiveBlocks and wounds line.
- **calculateWounds**: Add optional `pierceX?: number` as last parameter (after `backup`); pass `pierceX ?? 0` into `simulateWoundsFromAttackResults`.

---

### Task 2: UI – Pierce input and Quick Guide link

**Files:** `src/App.tsx`

- Add state: `const [pierceX, setPierceX] = useState<string>('');`.
- Normalize: `const pierceXNum = pierceX === '' ? 0 : Math.max(0, Math.floor(Number(pierceX)) || 0);`
- Pass `pierceXNum` into `calculateWounds(..., pierceXNum)` and add `pierceXNum` to that useMemo dependency array.
- Add `NumberInputWithControls` in Keywords section (after Sharpshooter): `id="pierce-x"`, `label="Pierce"`, `value={pierceX}`, `onChange={setPierceX}`, `min={0}`, `title="Cancel up to X blocks on the final defense roll"`, **`guideAnchor="pierce-x"`** (per legion-quick-guide-links rule).
- In `handleReset`, add `setPierceX('');`.

---

### Task 3: Tests

**Files:** `src/engine/__tests__/simulate.test.ts`

- Update every call to `simulateWounds` and `simulateWoundsFromAttackResults` to include the new `pierceX` argument (after `backup`, before `runs`). Use `0` for existing tests.
- Add describe block "Pierce X in wounds":
  - Pierce 0 or undefined: with fixed attack results and defense setup, assert `simulateWoundsFromAttackResults(..., 0)` matches behavior (e.g. same expected wounds as a baseline).
  - Pierce cancels blocks: use attack results with single outcome e.g. `[{ hits: 3, crits: 0, probability: 1 }]`, seeded RNG; with 3 defense dice we cannot force exact blocks without mocking, so either (a) run many runs and assert that with pierceX 3 expected wounds are higher than with pierceX 0, or (b) test the formula in a unit test. Prefer: test that for deterministic outcome (1 hit, 1 defense die), with a seed that yields 0 blocks in that run, pierceX 1 vs 0 doesn’t change (0 blocks); with a seed that yields 1 block, pierceX 1 gives 1 wound and pierceX 0 gives 0 wounds. That requires controlling the RNG per run or mocking. Simpler: assert `expectedWounds` with pierceX 3 is strictly greater than with pierceX 0 for a scenario with 3 hits and 3 defense dice (over many runs, pierce will often cancel blocks and increase wounds).
  - Pierce X > blocks: same idea; effective blocks never go below 0.

Use a simple test: "3 hits 0 crits, 3 red defense dice, pierce 0: expected wounds < pierce 3" over 10k runs with same seed range to get deterministic-enough comparison.
