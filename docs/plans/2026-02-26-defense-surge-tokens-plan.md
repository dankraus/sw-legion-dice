# Defense Surge Tokens Implementation Plan

> **For Claude:** Implement this plan task-by-task. Follow TDD: write failing test first, then minimal code to pass, then run tests and commit.

**Goal:** Add Defense Surge Tokens: user enters a count; when Defense Surge is None, each token converts one rolled defense surge to a block. When Defense Surge is Block, the input is disabled and tokens have no effect.

**Architecture:** Add a defense face-level roll (`rollOneDefenseDieOutcome` → 'block' | 'surge' | 'blank') and `resolveDefenseRoll(blocks, surges, surge, defenseSurgeTokens)`. In wounds simulation, roll each defense die to outcome, count blocks/surges, then apply resolve. Thread `defenseSurgeTokens` through `calculateWounds`, `simulateWoundsFromAttackResults`, and `simulateWounds`. UI: new Surge token input under Defense > Tokens, disabled when defenseSurge === 'block'.

**Tech Stack:** React, TypeScript, Vite, Vitest. Engine in `src/engine/simulate.ts` and `probability.ts`.

---

### Task 1: Engine – resolveDefenseRoll and face-level roll (TDD)

**Files:**
- Modify: `src/engine/simulate.ts` (add `DefenseFace` type, `rollOneDefenseDieOutcome`, `resolveDefenseRoll`, `normalizeDefenseSurgeTokens`)
- Test: `src/engine/__tests__/simulate.test.ts`

**Step 1: Write failing tests for resolveDefenseRoll and rollOneDefenseDieOutcome**

In `src/engine/__tests__/simulate.test.ts`, add a new `describe('Defense surge tokens and resolve')` block:

```ts
describe('resolveDefenseRoll', () => {
  it('surge block: returns blocks + surges', () => {
    expect(resolveDefenseRoll(2, 1, 'block', 0)).toBe(3);
    expect(resolveDefenseRoll(0, 2, 'block', 5)).toBe(2);
  });
  it('surge none, 0 tokens: returns blocks only', () => {
    expect(resolveDefenseRoll(2, 1, 'none', 0)).toBe(2);
  });
  it('surge none, tokens < surges: returns blocks + tokens', () => {
    expect(resolveDefenseRoll(1, 3, 'none', 2)).toBe(3);
  });
  it('surge none, tokens >= surges: returns blocks + surges', () => {
    expect(resolveDefenseRoll(1, 2, 'none', 5)).toBe(3);
  });
  it('normalizes negative/undefined defenseSurgeTokens to 0', () => {
    expect(resolveDefenseRoll(1, 1, 'none', undefined)).toBe(1);
    expect(resolveDefenseRoll(1, 1, 'none', -1)).toBe(1);
  });
});

describe('rollOneDefenseDieOutcome', () => {
  it('red die: over many rolls block/surge/blank proportions match 3/1/2', () => {
    const counts = { block: 0, surge: 0, blank: 0 };
    for (let i = 0; i < 6000; i++) {
      const face = rollOneDefenseDieOutcome('red', rng);
      counts[face]++;
    }
    expect(counts.block).toBeGreaterThan(2500);
    expect(counts.block).toBeLessThan(3500);
    expect(counts.surge).toBeGreaterThan(800);
    expect(counts.surge).toBeLessThan(1200);
    expect(counts.blank).toBeGreaterThan(1800);
    expect(counts.blank).toBeLessThan(2200);
  });
});
```

Use a seeded `rng` (e.g. `createSeededRng(42)` from `./rng`) so the test is deterministic. Import `resolveDefenseRoll` and `rollOneDefenseDieOutcome` from `../simulate`.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/engine/__tests__/simulate.test.ts -t "resolveDefenseRoll|rollOneDefenseDieOutcome"`
Expected: FAIL (resolveDefenseRoll / rollOneDefenseDieOutcome not defined or not exported)

**Step 3: Implement in simulate.ts**

- Add type: `export type DefenseFace = 'block' | 'surge' | 'blank';`
- Add `function normalizeDefenseSurgeTokens(value: number | undefined | null): number` (same logic as `normalizeSurgeTokens`: 0 for undefined/null/non-finite/negative, else `Math.floor(value)`).
- Add `export function resolveDefenseRoll(blocks: number, surges: number, surge: DefenseSurgeConversion, defenseSurgeTokens: number | undefined): number`. If `surge === 'block'` return `blocks + surges`. Else return `blocks + Math.min(normalizeDefenseSurgeTokens(defenseSurgeTokens), surges)`.
- Add `export function rollOneDefenseDieOutcome(color: DefenseDieColor, rng: () => number): DefenseFace`. Use `DEFENSE_DICE[color]` and `DEFENSE_SIDES`. Let blockFaces = die.block, surgeFaces = die.surge, blankFaces = die.blank. Roll `rng() * DEFENSE_SIDES`; if value < blockFaces return 'block'; if value < blockFaces + surgeFaces return 'surge'; else return 'blank'.

**Step 4: Run tests**

Run: `npm test -- src/engine/__tests__/simulate.test.ts`
Expected: New tests pass; existing tests still pass.

**Step 5: Commit**

```bash
git add src/engine/simulate.ts src/engine/__tests__/simulate.test.ts
git commit -m "feat(engine): resolveDefenseRoll and rollOneDefenseDieOutcome for defense surge tokens"
```

---

### Task 2: Engine – Use resolve in wounds simulation and thread defenseSurgeTokens

**Files:**
- Modify: `src/engine/simulate.ts` (simulateWounds, simulateWoundsFromAttackResults: roll defense by outcome, count blocks/surges, resolveDefenseRoll)
- Modify: `src/engine/probability.ts` (calculateWounds: add defenseSurgeTokens?, pass to simulateWoundsFromAttackResults)

**Step 1: Update simulateWoundsFromAttackResults**

- Add parameter `defenseSurgeTokens?: number` (after `outmaneuver`, before `runs`). Normalize with `normalizeDefenseSurgeTokens(defenseSurgeTokens)` at top.
- Replace the defense loop: instead of `blocks += rollOneDefenseDie(...)`, loop over `defenseDice` and call `rollOneDefenseDieOutcome(defenseDieColor, rng)` for each die. Count how many 'block' and how many 'surge'. Then `blocks = resolveDefenseRoll(blockCount, surgeCount, defenseSurge, normalizedDefenseSurgeTokens)`.

**Step 2: Update simulateWounds**

- Add parameter `defenseSurgeTokens?: number` after `outmaneuver`, before `runs`. Normalize and use the same defense roll + resolve logic (roll each die with rollOneDefenseDieOutcome, count blocks and surges, then resolveDefenseRoll).

**Step 3: Update calculateWounds in probability.ts**

- Add optional parameter `defenseSurgeTokens?: number` (after `outmaneuver`). Pass `defenseSurgeTokens ?? 0` (or normalized) into `simulateWoundsFromAttackResults`.

**Step 4: Run tests**

Run: `npm test`
Expected: All tests pass. If any test calls `calculateWounds` or `simulateWoundsFromAttackResults` with fewer args, add the new param only where the plan requires (existing callers can rely on default 0).

**Step 5: Add simulation test for defense surge tokens**

In `simulate.test.ts`, add a test: with a fixed attack outcome (e.g. 1 hit, 0 crits), defense surge 'none', 1 red defense die, 0 defense surge tokens vs 1 defense surge token. With 1 token, expected blocks should be higher (or expected wounds lower). Use `simulateWoundsFromAttackResults` with a minimal attackResults that has one outcome (e.g. 1 hit, 0 crits, probability 1). Run many runs and expect average blocks with 1 token > average blocks with 0 tokens.

**Step 6: Run tests again and commit**

```bash
npm test
git add src/engine/simulate.ts src/engine/probability.ts src/engine/__tests__/simulate.test.ts
git commit -m "feat(engine): apply defense surge tokens in wounds simulation"
```

---

### Task 3: UI – Defense Surge Tokens input and wiring

**Files:**
- Modify: `src/App.tsx` (state, parse, Surge input under Defense Tokens, pass to calculateWounds, Reset)

**Step 1: Add state and parse**

- `const [defenseSurgeTokens, setDefenseSurgeTokens] = useState<string>('');`
- `const defenseSurgeTokensNum = defenseSurgeTokens === '' ? 0 : Math.max(0, Math.floor(Number(defenseSurgeTokens)) || 0);`

**Step 2: Pass into calculateWounds**

- Change `calculateWounds(results, defenseDieColor, defenseSurge, dodgeTokensNum, outmaneuver)` to `calculateWounds(results, defenseDieColor, defenseSurge, dodgeTokensNum, outmaneuver, defenseSurgeTokensNum)`.
- Add `defenseSurgeTokensNum` to the useMemo dependency array for woundsResults.

**Step 3: Add Surge input under Defense Tokens**

- Under the "Tokens" heading in the Defense section, add a Surge input **above** the Dodge input:
  - `<NumberInputWithControls id="defense-surge-tokens" label="Surge" value={defenseSurgeTokens} onChange={setDefenseSurgeTokens} disabled={defenseSurge === 'block'} title={defenseSurge === 'block' ? 'Defense Surge Tokens only apply when Defense Surge is None.' : undefined} />`
- Add `min={0}` if the component supports it.

**Step 4: Reset handler**

- In `handleReset`, add `setDefenseSurgeTokens('');`

**Step 5: Verify**

Run: `npm run dev`. Set Defense Surge to None, add attack dice, set Defense Surge Tokens to 1 → Avg Wounds should decrease vs 0. Set Defense Surge to Block → Surge input disabled, tooltip on hover. Reset → Surge field cleared.

**Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "feat(ui): Defense Surge Tokens input, disabled when Defense Surge is Block"
```

---

### Task 4: Optional – getDefenseDistributionForDiceCountSim / simulateDefensePool with defenseSurgeTokens

**Files:**
- Modify: `src/engine/simulate.ts` (simulateDefensePool, getDefenseDistributionForDiceCountSim: add defenseSurgeTokens?, use rollOneDefenseDieOutcome + resolveDefenseRoll)
- Modify: `src/engine/probability.ts` (getDefenseDistributionForDiceCount: add defenseSurgeTokens?, pass through)

**Step 1: simulateDefensePool**

- Add optional parameter `defenseSurgeTokens?: number` (after `surge`, before `runs`). Normalize.
- In the inner loop, instead of `blocks += rollOneDefenseDie(color, surge, rng)`, roll each die with `rollOneDefenseDieOutcome(color, rng)`, count blocks and surges across the pool for that run, then `blocks = resolveDefenseRoll(blockCount, surgeCount, surge, normalizedDefenseSurgeTokens)`.

**Step 2: getDefenseDistributionForDiceCountSim**

- Add optional parameter `defenseSurgeTokens?: number`. Pass through to `simulateDefensePool`.

**Step 3: getDefenseDistributionForDiceCount in probability.ts**

- Add optional parameter `defenseSurgeTokens?: number`. Pass through to `getDefenseDistributionForDiceCountSim`.

**Step 4: Run tests**

Run: `npm test`. Update any test that calls `getDefenseDistributionForDiceCount` or `simulateDefensePool`/`getDefenseDistributionForDiceCountSim` if they need the new parameter (default 0 is fine).

**Step 5: Commit**

```bash
git add src/engine/simulate.ts src/engine/probability.ts
git commit -m "feat(engine): defense surge tokens in getDefenseDistributionForDiceCount and simulateDefensePool"
```

---

**End of plan.** After completing all tasks, run `npm run lint` and `npm test` and fix any issues.
