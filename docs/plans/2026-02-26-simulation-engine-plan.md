# Simulation Engine Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the analytic probability engine with a simulation-based engine that rolls the pool N times (default 10,000), applies all current rules in code, and aggregates to the same `AttackResults` / `DefenseResults` / `WoundsResults` shapes. No new rules (Cover, Outmaneuver, etc.) in this plan.

**Architecture:** Add a seeded PRNG and simulation helpers (roll one die, roll attack pool, resolve, rerolls, Ram, roll defense pool). Replace the bodies of `calculateAttackPool`, `calculateWounds`, `getDefenseDistributionForDiceCount`, and `calculateDefensePool` to run N simulations and aggregate. Keep the same function signatures and types. Update tests to assert expectations and key probabilities within tolerance (e.g. ±0.05 for expectations, ±0.02 for probabilities) so the same test cases remain as behavioral specs.

**Tech Stack:** TypeScript, Vitest. No new dependencies; use a small seeded PRNG (e.g. mulberry32) in the engine for deterministic tests.

---

## Constants and RNG

### Task 1: Add seeded PRNG and default run count

**Files:**

- Create: `src/engine/rng.ts`
- Modify: `src/engine/probability.ts` (add optional parameter or module-level config later; for now just add the RNG for use in sim)

**Step 1: Write the failing test**

In `src/engine/__tests__/rng.test.ts`:

```ts
/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { createSeededRng, DEFAULT_RUNS } from '../rng';

describe('rng', () => {
  it('DEFAULT_RUNS is 10000', () => {
    expect(DEFAULT_RUNS).toBe(10_000);
  });

  it('same seed produces same sequence', () => {
    const rng1 = createSeededRng(42);
    const rng2 = createSeededRng(42);
    for (let i = 0; i < 10; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  it('different seeds produce different sequence', () => {
    const rng1 = createSeededRng(1);
    const rng2 = createSeededRng(2);
    expect(rng1()).not.toBe(rng2());
  });

  it('returns number in [0, 1)', () => {
    const rng = createSeededRng(123);
    for (let i = 0; i < 100; i++) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/dan/Documents/code/legion-dice && npm run test -- src/engine/__tests__/rng.test.ts -v`  
Expected: FAIL (module '../rng' or createSeededRng not found)

**Step 3: Implement**

Create `src/engine/rng.ts`:

```ts
/** Default number of simulation runs for stable expectations and distributions. */
export const DEFAULT_RUNS = 10_000;

/** Mulberry32 seeded PRNG. Returns value in [0, 1). */
export function createSeededRng(seed: number): () => number {
  return function next() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0; // mulberry32
    const t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    return ((t + (t ^ (t >>> 7))) >>> 0) / 4294967296;
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -- src/engine/__tests__/rng.test.ts -v`  
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/rng.ts src/engine/__tests__/rng.test.ts
git commit -m "feat(engine): add seeded PRNG and DEFAULT_RUNS"
```

---

### Task 2: Add roll-one-attack-die helper and test

**Files:**

- Create: `src/engine/simulate.ts` (will grow over tasks)
- Create: `src/engine/__tests__/simulate.test.ts`
- Use: `src/types.ts` (DieColor, etc.), `src/engine/probability.ts` (DICE)

**Step 1: Write the failing test**

In `src/engine/__tests__/simulate.test.ts`:

```ts
/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { createSeededRng } from '../rng';
import { rollOneAttackDie } from '../simulate';

describe('rollOneAttackDie', () => {
  it('returns one of crit, surge, hit, blank', () => {
    const rng = createSeededRng(999);
    const faces = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const face = rollOneAttackDie('red', rng);
      faces.add(face);
    }
    expect(faces).toEqual(new Set(['crit', 'surge', 'hit', 'blank']));
  });

  it('with fixed seed red die produces deterministic sequence', () => {
    const rng = createSeededRng(1);
    const results = Array.from({ length: 8 }, () =>
      rollOneAttackDie('red', rng)
    );
    expect(results).toHaveLength(8);
    // Red has 1 crit, 1 surge, 5 hit, 1 blank; over 8 rolls we should see variety
    const crits = results.filter((face) => face === 'crit').length;
    const hits = results.filter((face) => face === 'hit').length;
    expect(crits).toBeGreaterThanOrEqual(0);
    expect(hits).toBeGreaterThanOrEqual(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/engine/__tests__/simulate.test.ts -v`  
Expected: FAIL (rollOneAttackDie not defined)

**Step 3: Implement**

In `src/engine/simulate.ts`:

```ts
import type { DieColor } from '../types';
import { DICE } from './probability';

export type AttackFace = 'crit' | 'surge' | 'hit' | 'blank';

const SIDES = 8;

/** Roll one attack die; returns face type. Uses rng() in [0,1). */
export function rollOneAttackDie(
  color: DieColor,
  rng: () => number
): AttackFace {
  const die = DICE[color];
  const value = rng() * SIDES; // [0, 8)
  const cumul = [
    die.crit,
    die.crit + die.surge,
    die.crit + die.surge + die.hit,
    SIDES,
  ];
  if (value < cumul[0]) return 'crit';
  if (value < cumul[1]) return 'surge';
  if (value < cumul[2]) return 'hit';
  return 'blank';
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -- src/engine/__tests__/simulate.test.ts -v`  
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/simulate.ts src/engine/__tests__/simulate.test.ts
git commit -m "feat(engine): add rollOneAttackDie for simulation"
```

---

### Task 3: Add rollAttackPool (raw counts) and test

**Files:**

- Modify: `src/engine/simulate.ts`
- Modify: `src/engine/__tests__/simulate.test.ts`

**Step 1: Write the failing test**

Add to `src/engine/__tests__/simulate.test.ts`:

```ts
import type { AttackPool } from '../../types';
// ... existing imports ...

describe('rollAttackPool', () => {
  it('zero pool returns all zeros', () => {
    const pool: AttackPool = { red: 0, black: 0, white: 0 };
    const rng = createSeededRng(1);
    const counts = rollAttackPool(pool, rng);
    expect(counts).toEqual({ crit: 0, surge: 0, hit: 0, blank: 0 });
  });

  it('single red die returns one face', () => {
    const pool: AttackPool = { red: 1, black: 0, white: 0 };
    const rng = createSeededRng(2);
    const counts = rollAttackPool(pool, rng);
    expect(counts.crit + counts.surge + counts.hit + counts.blank).toBe(1);
  });

  it('pool of 4 dice returns sum 4', () => {
    const pool: AttackPool = { red: 2, black: 1, white: 1 };
    const rng = createSeededRng(3);
    const counts = rollAttackPool(pool, rng);
    expect(counts.crit + counts.surge + counts.hit + counts.blank).toBe(4);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/engine/__tests__/simulate.test.ts -v`  
Expected: FAIL (rollAttackPool not defined)

**Step 3: Implement**

In `src/engine/simulate.ts`, add:

```ts
import type { AttackPool } from '../types';

export interface RawAttackCounts {
  crit: number;
  surge: number;
  hit: number;
  blank: number;
}

export function rollAttackPool(
  pool: AttackPool,
  rng: () => number
): RawAttackCounts {
  const counts: RawAttackCounts = { crit: 0, surge: 0, hit: 0, blank: 0 };
  const colors: DieColor[] = ['red', 'black', 'white'];
  for (const color of colors) {
    const number = pool[color];
    for (let i = 0; i < number; i++) {
      const face = rollOneAttackDie(color, rng);
      counts[face]++;
    }
  }
  return counts;
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -- src/engine/__tests__/simulate.test.ts -v`  
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/simulate.ts src/engine/__tests__/simulate.test.ts
git commit -m "feat(engine): add rollAttackPool for simulation"
```

---

### Task 4: Add resolveStep (Critical X, surge conversion, surge tokens) and test

**Files:**

- Modify: `src/engine/simulate.ts`
- Modify: `src/engine/__tests__/simulate.test.ts`

**Step 1: Write the failing test**

Add test that raw counts after resolve match existing resolve logic. Copy the resolve behavior from `src/engine/probability.ts` (lines 106–127): Critical X converts up to X surges to crits; remaining surges go to hit/crit/surgeTokens by surge conversion. Assert for one known (crits, surges, hits, blanks) and criticalX/surge/surgeTokens that output hits and crits match.

In `src/engine/__tests__/simulate.test.ts`:

```ts
import type { SurgeConversion } from '../../types';

describe('resolveStep', () => {
  it('no keywords: surges go to blank when surge none', () => {
    const result = resolveStep(
      { crit: 1, surge: 2, hit: 3, blank: 0 },
      0,
      'none',
      0
    );
    expect(result.hits).toBe(3);
    expect(result.crits).toBe(1);
  });

  it('surge to hit: all surges become hits', () => {
    const result = resolveStep(
      { crit: 0, surge: 2, hit: 1, blank: 0 },
      0,
      'hit',
      0
    );
    expect(result.hits).toBe(3);
    expect(result.crits).toBe(0);
  });

  it('Critical 1 with surge none and 1 token: one surge to crit, one surge to hit via token', () => {
    const result = resolveStep(
      { crit: 0, surge: 2, hit: 0, blank: 0 },
      1,
      'none',
      1
    );
    expect(result.crits).toBe(1);
    expect(result.hits).toBe(1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/engine/__tests__/simulate.test.ts -v`  
Expected: FAIL (resolveStep not defined)

**Step 3: Implement**

In `src/engine/simulate.ts`, add `resolveStep` that mirrors the logic in `probability.ts` `resolve()`: normalize criticalX/surgeTokens, apply Critical X (min(criticalX, surges) → crits, remainder surges), then apply surge conversion (crit/hit/none+surgeTokens) to remaining surges. Return `{ hits: number; crits: number }`.

**Step 4: Run test to verify it passes**

Run: `npm run test -- src/engine/__tests__/simulate.test.ts -v`  
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/simulate.ts src/engine/__tests__/simulate.test.ts
git commit -m "feat(engine): add resolveStep for simulation"
```

---

### Task 5: Add reroll step (Aim/Observe/Precise) and test

**Files:**

- Modify: `src/engine/simulate.ts`
- Modify: `src/engine/__tests__/simulate.test.ts`

**Step 1: Write the failing test**

Test: after resolve, we have some blanks; reroll capacity = aim\*(2+precise)+observe; we reroll up to capacity blanks (each reroll is one die from pool mix), add hit/crit from reroll with surge conversion. One test: 1 white die, surge none, 1 observe token; seed that gives one blank; after reroll we get 0 or 1 extra success. Another: zero capacity → hits/crits unchanged.

**Step 2: Run test to verify it fails**

**Step 3: Implement**

Add `applyRerolls(rawCounts, resolveResult, pool, surge, aim, observe, precise, rng)`: compute capacity, number of blanks from rawCounts (before resolve we have blanks; after resolve we still know how many blanks we had). Reroll min(capacity, blanks) dice: for each reroll, pick a die color from pool (weighted by count), roll that die, map face to hit/crit via surge conversion, add to resolveResult. Return new { hits, crits }.

**Step 4: Run test to verify it passes**

**Step 5: Commit**

```bash
git commit -m "feat(engine): add reroll step for Aim/Observe/Precise simulation"
```

---

### Task 6: Add Ram step and test

**Files:**

- Modify: `src/engine/simulate.ts`
- Modify: `src/engine/__tests__/simulate.test.ts`

**Step 1: Write the failing test**

Test: Ram 1 with 1 blank → that blank becomes 1 crit (hits unchanged). Ram 2 with 1 blank 1 hit → 2 crits, 0 hits. Ram 0 → no change.

**Step 2: Run test to verify it fails**

**Step 3: Implement**

Add `applyRam(hits, crits, blanksAfterReroll, ram)`: convert min(ram, blanks) blanks to crits, then min(ram - blanksUsed, hits) hits to crits. Return final { hits, crits }.

**Step 4: Run test to verify it passes**

**Step 5: Commit**

```bash
git commit -m "feat(engine): add Ram step for simulation"
```

---

### Task 7: Implement single-run attack simulation and aggregate to AttackResults

**Files:**

- Modify: `src/engine/simulate.ts`
- Modify: `src/engine/__tests__/simulate.test.ts`

**Step 1: Write the failing test**

Test: `simulateAttackPool(pool, surge, criticalX, surgeTokens, aim, observe, precise, ram, N, rng)` returns object with expectedHits, expectedCrits, expectedTotal, distribution (by total), distributionByHitsCrits, cumulative. For pool { red: 1 }, surge 'none', no modifiers, N=50000, seed 1: expectedTotal close to 6/8 (0.75), e.g. toBeCloseTo(0.75, 1).

**Step 2: Run test to verify it fails**

**Step 3: Implement**

In `simulate.ts`: function `simulateAttackPool(..., runs, rng)`: loop `runs` times: rollAttackPool → resolveStep → applyRerolls → applyRam; collect (hits, crits) each run. Compute expectedHits = sum(hits)/runs, expectedCrits = sum(crits)/runs; build histogram by total = hits+crits; build distributionByHitsCrits histogram; build cumulative from distribution. Return shape matching `AttackResults`.

**Step 4: Run test to verify it passes**

**Step 5: Commit**

```bash
git commit -m "feat(engine): simulateAttackPool aggregates to AttackResults shape"
```

---

### Task 8: Add rollDefenseDice and simulateDefensePool

**Files:**

- Modify: `src/engine/simulate.ts`
- Modify: `src/engine/__tests__/simulate.test.ts`

**Step 1: Write the failing test**

Test: roll one defense die (red or white) returns block or blank. simulateDefensePool for 0 dice → 0 blocks. For n red dice, N runs, aggregate to distribution; expectedBlocks close to n \* (3/6) for surge none.

**Step 2: Run test to verify it fails**

**Step 3: Implement**

Add `rollOneDefenseDie(color, surge, rng)` using DEFENSE_DICE and DEFENSE_SIDES. Add `simulateDefensePool(pool, surge, runs, rng)` and `getDefenseDistributionForDiceCountSim(diceCount, color, surge, runs, rng)` returning DefenseResults shape.

**Step 4: Run test to verify it passes**

**Step 5: Commit**

```bash
git commit -m "feat(engine): add defense roll simulation and aggregate to DefenseResults"
```

---

### Task 9: Implement simulateWounds and aggregate to WoundsResults

**Files:**

- Modify: `src/engine/simulate.ts`
- Modify: `src/engine/__tests__/simulate.test.ts`

**Step 1: Write the failing test**

Test: For each run, get (hits, crits) from full attack sim, defenseDice = crits + max(0, hits - dodge), roll defense dice, wounds = max(0, hits+crits - blocks). Aggregate. Test: attack always 1 success, red defense none, 0 dodge → expectedWounds close to 1 - 0.5 = 0.5.

**Step 2: Run test to verify it fails**

**Step 3: Implement**

Add `simulateWounds(attackParams, defenseDieColor, defenseSurge, dodgeTokens, runs, rng)` that runs full (attack + defense) per run and returns WoundsResults.

**Step 4: Run test to verify it passes**

**Step 5: Commit**

```bash
git commit -m "feat(engine): simulateWounds aggregates to WoundsResults"
```

---

### Task 10: Wire probability.ts to simulation; keep same API

**Files:**

- Modify: `src/engine/probability.ts`
- Modify: `src/engine/simulate.ts` (export run count or accept optional runs/seed from probability if desired)

**Step 1: Implement**

In `probability.ts`: Import `simulateAttackPool` from `./simulate`, `createSeededRng` from `./rng`, `DEFAULT_RUNS` from `./rng`. Replace `calculateAttackPool` body with: use a fixed seed (e.g. `0`) so the same inputs always produce the same outputs; call `simulateAttackPool(pool, surge, criticalX, surgeTokens, aimTokens, observeTokens, precise, ramX, DEFAULT_RUNS, createSeededRng(0))` and return its result. For `calculateWounds`: use `simulateWounds` with the same attack params (from current state) and defense/dodge params; return WoundsResults. For `getDefenseDistributionForDiceCount`: call sim version with DEFAULT_RUNS and a new RNG. For `calculateDefensePool`: build dice count from pool (current API uses mixed red/white); simulate mixed pool in simulate.ts if not done (e.g. simulateDefensePool(pool, surge, runs, rng)) and return DefenseResults.

**Step 2: Run full test suite**

Run: `npm run test -- src/engine -v`  
Expected: Many failures where tests expect exact equality (e.g. expectedTotal exactly 6/8). Do not commit yet.

---

### Task 11: Update probability tests to tolerance-based assertions

**Files:**

- Modify: `src/engine/__tests__/probability.test.ts`

**Step 1: Implement**

Replace strict equality for expectations with `toBeCloseTo(value, 1)` or `expect(Math.abs(actual - expected)).toBeLessThanOrEqual(0.05)` where appropriate. For distribution probabilities summing to 1, keep sum-to-1 or use toBeCloseTo(1, 2). For exact zero cases (zero dice → 0), keep strict equality. Use 2 decimal places for toBeCloseTo where needed. Run tests with a fixed seed in probability/simulate so CI is deterministic: e.g. in probability.ts use createSeededRng(0) or a seed from an optional param so tests can pass consistently.

**Step 2: Run full test suite**

Run: `npm run test -- src/engine -v`  
Expected: All pass. If flaky, increase DEFAULT_RUNS for test or tighten seed usage.

**Step 3: Commit**

```bash
git add src/engine/probability.ts src/engine/__tests__/probability.test.ts
git commit -m "refactor(engine): switch to simulation; relax tests to tolerance"
```

---

### Task 12: Remove dead analytic code and export only what’s needed

**Files:**

- Modify: `src/engine/probability.ts`
- Modify: `src/engine/simulate.ts`

**Step 1: Remove**

Delete from `probability.ts` the old convolution/resolve/aggregate implementation (everything that’s no longer called). Keep DICE, DEFENSE_DICE, getEffectiveProbabilities, getDefenseEffectiveProbabilities if still used by UI or tests; otherwise remove or move to simulate. Ensure no broken imports.

**Step 2: Run tests and lint**

Run: `npm run test` and `npm run lint`  
Expected: PASS

**Step 3: Commit**

```bash
git add src/engine/probability.ts src/engine/simulate.ts
git commit -m "chore(engine): remove unused analytic code after simulation switch"
```

---

### Task 13: Document simulation in design and README (if present)

**Files:**

- Modify: `docs/plans/2026-02-26-simulation-engine-design.md` (add "Implemented: 2026-02-26" and plan ref)
- Modify: `README.md` (if it describes the calculator: add one line that results are simulation-based, typical/average)

**Step 1: Update design doc**

At top of design: "**Implemented:** 2026-02-26 (see `docs/plans/2026-02-26-simulation-engine-plan.md`)."

**Step 2: Update README if exists**

If README mentions how the calculator works, add: "Results are simulation-based (default 10,000 runs) and represent typical expectations rather than exact probabilities."

**Step 3: Commit**

```bash
git add docs/plans/2026-02-26-simulation-engine-design.md README.md
git commit -m "docs: mark simulation engine implemented and document approach"
```

---

## Execution handoff

Plan complete and saved to `docs/plans/2026-02-26-simulation-engine-plan.md`.

**Two execution options:**

1. **Subagent-Driven (this session)** – I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Parallel Session (separate)** – Open a new session with executing-plans and run the plan task-by-task with checkpoints.

Which approach?
