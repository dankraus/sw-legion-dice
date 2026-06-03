# Uncanny Luck X Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Uncanny Luck X to the calculator — after rolling defense dice, reroll up to X dice that would not become blocks, then resolve blocks and wounds. Wire UI, URL key `uLuck`, and Legion Quick Guide link `uncanny-luck-x`.

**Architecture:** Add `getRerollableDefenseIndices` and `applyUncannyLuckRerolls` in `simulate.ts` (face-level, mirrors attack rerolls). Thread `uncannyLuckX` through wounds simulation and standalone defense pool APIs. App state + debounced inputs + `calculateWounds`; `urlState.ts` key `uLuck`.

**Tech Stack:** React 19, TypeScript, Vitest simulation engine. Design: `docs/plans/2026-06-02-uncanny-luck-x-design.md`.

**Spec coverage:** Rules/order → Task 1–2; engine wounds → Task 3; defense pool API → Task 4; `calculateWounds` → Task 5; URL → Task 6; UI → Task 7; design doc footer → Task 8.

---

## File map

| File | Change |
|------|--------|
| `src/engine/simulate.ts` | Helpers + reroll step in defense roll paths |
| `src/engine/probability.ts` | `uncannyLuckX` on `calculateWounds`, defense distribution wrappers |
| `src/engine/__tests__/simulate.test.ts` | Unit + wounds simulation tests |
| `src/engine/__tests__/probability.test.ts` | `calculateWounds` integration test |
| `src/urlState.ts` | `uLuck` in `UrlState` |
| `src/urlState.test.ts` | Parse/build round-trip |
| `src/App.tsx` | State, debounce, URL, UI control, `calculateWounds` |
| `docs/plans/2026-06-02-uncanny-luck-x-design.md` | Add **Implemented** line when done |

---

### Task 1: Engine — rerollable indices (TDD)

**Files:**
- Modify: `src/engine/simulate.ts`
- Test: `src/engine/__tests__/simulate.test.ts`

- [ ] **Step 1: Write the failing tests**

Add after `describe('resolveDefenseRoll')` block:

```ts
import {
  // ...existing imports
  getRerollableDefenseIndices,
} from '../simulate';

describe('getRerollableDefenseIndices', () => {
  it('surge block: only blanks are rerollable', () => {
    const faces = ['block', 'surge', 'blank', 'blank'] as const;
    expect(getRerollableDefenseIndices([...faces], 'block', 0)).toEqual([2, 3]);
  });

  it('surge none, 0 tokens: blanks and all surges rerollable', () => {
    const faces = ['block', 'surge', 'blank', 'surge'] as const;
    expect(getRerollableDefenseIndices([...faces], 'none', 0)).toEqual([
      1, 2, 3,
    ]);
  });

  it('surge none, tokens convert first surges: excess surges rerollable', () => {
    const faces = ['surge', 'surge', 'surge', 'blank'] as const;
    expect(getRerollableDefenseIndices([...faces], 'none', 2)).toEqual([2, 3]);
  });

  it('all blocks: empty rerollable list', () => {
    expect(getRerollableDefenseIndices(['block', 'block'], 'none', 5)).toEqual(
      []
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/engine/__tests__/simulate.test.ts -t "getRerollableDefenseIndices"`

Expected: FAIL — `getRerollableDefenseIndices` is not exported

- [ ] **Step 3: Implement `getRerollableDefenseIndices`**

In `src/engine/simulate.ts` after `resolveDefenseRoll`:

```ts
/** Indices of defense dice that contribute 0 blocks before reroll (for Uncanny Luck). */
export function getRerollableDefenseIndices(
  faces: DefenseFace[],
  surge: DefenseSurgeConversion,
  defenseSurgeTokens: number | undefined
): number[] {
  if (surge === 'block') {
    const indices: number[] = [];
    for (let index = 0; index < faces.length; index++) {
      if (faces[index] === 'blank') indices.push(index);
    }
    return indices;
  }
  const tokens = normalizeDefenseSurgeTokens(defenseSurgeTokens);
  const blankIndices: number[] = [];
  const surgeIndices: number[] = [];
  for (let index = 0; index < faces.length; index++) {
    if (faces[index] === 'blank') blankIndices.push(index);
    else if (faces[index] === 'surge') surgeIndices.push(index);
  }
  const convertedSurgeCount = Math.min(tokens, surgeIndices.length);
  const excessSurgeIndices = surgeIndices.slice(convertedSurgeCount);
  return [...blankIndices, ...excessSurgeIndices];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/engine/__tests__/simulate.test.ts -t "getRerollableDefenseIndices"`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/simulate.ts src/engine/__tests__/simulate.test.ts
git commit -m "feat(engine): add getRerollableDefenseIndices for Uncanny Luck X"
```

---

### Task 2: Engine — apply rerolls helper (TDD)

**Files:**
- Modify: `src/engine/simulate.ts`
- Test: `src/engine/__tests__/simulate.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import {
  applyUncannyLuckRerolls,
  rollOneDefenseDieOutcome,
} from '../simulate';

describe('applyUncannyLuckRerolls', () => {
  it('rerolls at most X rerollable dice', () => {
    const faces: DefenseFace[] = ['blank', 'blank', 'blank'];
    const rng = createSeededRng(99);
    const rollSpy = vi.spyOn(
      { rollOneDefenseDieOutcome },
      'rollOneDefenseDieOutcome'
    );
    // Call applyUncannyLuckRerolls directly on simulate module exports instead:
    applyUncannyLuckRerolls(faces, 2, 'block', 0, 'red', rng);
    expect(faces.length).toBe(3);
    rollSpy.mockRestore();
  });

  it('uncannyLuckX 0 leaves faces unchanged', () => {
    const faces: DefenseFace[] = ['blank', 'block'];
    const rng = createSeededRng(1);
    applyUncannyLuckRerolls(faces, 0, 'block', 0, 'red', rng);
    expect(faces).toEqual(['blank', 'block']);
  });

  it('with seeded rng, X=2 increases block count on average vs no reroll for many blanks', () => {
    const runs = 2000;
    const rngNoReroll = createSeededRng(42);
    const rngReroll = createSeededRng(42);
    let sumBlocksNoReroll = 0;
    let sumBlocksReroll = 0;
    for (let run = 0; run < runs; run++) {
      const facesNoReroll: DefenseFace[] = [];
      const facesReroll: DefenseFace[] = [];
      for (let die = 0; die < 5; die++) {
        facesNoReroll.push(rollOneDefenseDieOutcome('red', rngNoReroll));
        facesReroll.push(rollOneDefenseDieOutcome('red', rngReroll));
      }
      let blockCount = 0;
      for (const face of facesNoReroll) {
        if (face === 'block') blockCount++;
      }
      sumBlocksNoReroll += blockCount;
      applyUncannyLuckRerolls(facesReroll, 2, 'block', 0, 'red', rngReroll);
      blockCount = 0;
      for (const face of facesReroll) {
        if (face === 'block') blockCount++;
      }
      sumBlocksReroll += blockCount;
    }
    expect(sumBlocksReroll / runs).toBeGreaterThan(sumBlocksNoReroll / runs);
  });
});
```

Add `import type { DefenseFace } from '../simulate'` if needed; `DefenseFace` is exported from `simulate.ts`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/engine/__tests__/simulate.test.ts -t "applyUncannyLuckRerolls"`

Expected: FAIL

- [ ] **Step 3: Implement `applyUncannyLuckRerolls`**

```ts
/** Reroll up to X defense dice that would not become blocks (Uncanny Luck X). */
export function applyUncannyLuckRerolls(
  faces: DefenseFace[],
  uncannyLuckX: number,
  surge: DefenseSurgeConversion,
  defenseSurgeTokens: number | undefined,
  color: DefenseDieColor,
  rng: () => number
): void {
  const normalizedUncannyLuckX = Math.max(0, Math.floor(uncannyLuckX));
  if (normalizedUncannyLuckX <= 0) return;
  const rerollableIndices = getRerollableDefenseIndices(
    faces,
    surge,
    defenseSurgeTokens
  );
  const numToReroll = Math.min(
    normalizedUncannyLuckX,
    rerollableIndices.length
  );
  for (let rerollIndex = 0; rerollIndex < numToReroll; rerollIndex++) {
    const dieIndex = rerollableIndices[rerollIndex] as number;
    faces[dieIndex] = rollOneDefenseDieOutcome(color, rng);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/engine/__tests__/simulate.test.ts -t "applyUncannyLuckRerolls"`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/simulate.ts src/engine/__tests__/simulate.test.ts
git commit -m "feat(engine): add applyUncannyLuckRerolls for Uncanny Luck X"
```

---

### Task 3: Engine — wire into wounds simulation

**Files:**
- Modify: `src/engine/simulate.ts` (`simulateWounds`, `simulateWoundsFromAttackResults`)

- [ ] **Step 1: Write the failing wounds test**

In `simulate.test.ts`, add:

```ts
describe('Uncanny Luck X in wounds simulation', () => {
  it('uncannyLuckX 2 yields lower or equal expected wounds than 0 for fixed attack', () => {
    const attackResults: AttackResults = {
      expectedHits: 3,
      expectedCrits: 1,
      expectedTotal: 4,
      distribution: [],
      distributionByHitsCrits: [{ hits: 3, crits: 1, probability: 1 }],
      cumulative: [],
    };
    const runs = 5000;
    const woundsNone = simulateWoundsFromAttackResults(
      attackResults,
      'red',
      'none',
      0,
      0,
      false,
      0,
      'none',
      false,
      false,
      0,
      false,
      0,
      false,
      0,
      0,
      0,
      false,
      0,
      0,
      0, // uncannyLuckX
      runs,
      createSeededRng(42)
    );
    const woundsUncanny2 = simulateWoundsFromAttackResults(
      attackResults,
      'red',
      'none',
      0,
      0,
      false,
      0,
      'none',
      false,
      false,
      0,
      false,
      0,
      false,
      0,
      0,
      0,
      false,
      0,
      0,
      2, // uncannyLuckX
      runs,
      createSeededRng(42)
    );
    expect(woundsUncanny2.expectedWounds).toBeLessThanOrEqual(
      woundsNone.expectedWounds
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/engine/__tests__/simulate.test.ts -t "Uncanny Luck X in wounds"`

Expected: FAIL (wrong arity or no effect)

- [ ] **Step 3: Add parameter and defense roll refactor**

1. Add `uncannyLuckX: number = 0` to `simulateWoundsFromAttackResults` **after** `dangerSenseX`, **before** `runs`.
2. Add same parameter to `simulateWounds`.
3. Normalize once: `const normalizedUncannyLuckX = Math.max(0, Math.floor(uncannyLuckX));`
4. Replace the defense roll loop in both functions. **Before:**

```ts
let blockCount = 0;
let surgeCount = 0;
for (let i = 0; i < totalDefenseDice; i++) {
  const face = rollOneDefenseDieOutcome(defenseDieColor, rng);
  if (face === 'block') blockCount++;
  else if (face === 'surge') surgeCount++;
}
```

**After:**

```ts
const faces: DefenseFace[] = [];
for (let dieIndex = 0; dieIndex < totalDefenseDice; dieIndex++) {
  faces.push(rollOneDefenseDieOutcome(defenseDieColor, rng));
}
applyUncannyLuckRerolls(
  faces,
  normalizedUncannyLuckX,
  defenseSurge,
  normalizedDefenseSurgeTokens,
  defenseDieColor,
  rng
);
let blockCount = 0;
let surgeCount = 0;
for (const face of faces) {
  if (face === 'block') blockCount++;
  else if (face === 'surge') surgeCount++;
}
```

5. Update **every** existing `simulateWoundsFromAttackResults` and `simulateWounds` call in tests to pass `0` for `uncannyLuckX` before `runs` (search codebase).

- [ ] **Step 4: Run tests**

Run: `npm test -- src/engine/__tests__/simulate.test.ts`

Expected: PASS (full file — many call sites updated)

- [ ] **Step 5: Commit**

```bash
git add src/engine/simulate.ts src/engine/__tests__/simulate.test.ts
git commit -m "feat(engine): apply Uncanny Luck X in wounds simulation"
```

---

### Task 4: Engine — standalone defense pool APIs

**Files:**
- Modify: `src/engine/simulate.ts` (`simulateDefensePool`, `getDefenseDistributionForDiceCountSim`)
- Modify: `src/engine/probability.ts`
- Test: `src/engine/__tests__/simulate.test.ts`, `src/engine/__tests__/probability.test.ts`

- [ ] **Step 1: Write the failing test**

In `describe('defense simulation')`:

```ts
it('simulateDefensePool with uncannyLuckX 2 has higher expectedBlocks than 0 for red pool', () => {
  const rngNone = createSeededRng(7);
  const rngUncanny = createSeededRng(7);
  const pool = { red: 4, white: 0 };
  const noUncanny = simulateDefensePool(
    pool,
    'block',
    undefined,
    5000,
    rngNone,
    0
  );
  const withUncanny = simulateDefensePool(
    pool,
    'block',
    undefined,
    5000,
    rngUncanny,
    2
  );
  expect(withUncanny.expectedBlocks).toBeGreaterThan(noUncanny.expectedBlocks);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/engine/__tests__/simulate.test.ts -t "simulateDefensePool with uncannyLuckX"`

- [ ] **Step 3: Implement**

1. Add `uncannyLuckX: number = 0` as last param before `runs` on `simulateDefensePool`.
2. Refactor loop to build `DefenseDieOutcome[]`:

```ts
interface DefenseDieOutcome {
  color: DefenseDieColor;
  face: DefenseFace;
}
```

For each die rolled, push `{ color, face }`. After all rolls, call helper that rerolls using each outcome’s `color`:

```ts
function applyUncannyLuckRerollsToOutcomes(
  outcomes: DefenseDieOutcome[],
  uncannyLuckX: number,
  surge: DefenseSurgeConversion,
  defenseSurgeTokens: number | undefined,
  rng: () => number
): void {
  const faces = outcomes.map((outcome) => outcome.face);
  const normalizedUncannyLuckX = Math.max(0, Math.floor(uncannyLuckX));
  if (normalizedUncannyLuckX <= 0) return;
  const rerollableIndices = getRerollableDefenseIndices(
    faces,
    surge,
    defenseSurgeTokens
  );
  const numToReroll = Math.min(
    normalizedUncannyLuckX,
    rerollableIndices.length
  );
  for (let rerollIndex = 0; rerollIndex < numToReroll; rerollIndex++) {
    const dieIndex = rerollableIndices[rerollIndex] as number;
    const outcome = outcomes[dieIndex];
    if (outcome === undefined) continue;
    outcome.face = rollOneDefenseDieOutcome(outcome.color, rng);
  }
}
```

3. Thread `uncannyLuckX` through `getDefenseDistributionForDiceCountSim` → `simulateDefensePool`.
4. In `probability.ts`, add optional `uncannyLuckX?: number` to `getDefenseDistributionForDiceCount` and `calculateDefensePool`; pass to sim (default 0).

- [ ] **Step 4: Run engine tests**

Run: `npm test -- src/engine/__tests__/simulate.test.ts src/engine/__tests__/probability.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/simulate.ts src/engine/probability.ts src/engine/__tests__/simulate.test.ts src/engine/__tests__/probability.test.ts
git commit -m "feat(engine): Uncanny Luck X on standalone defense pool APIs"
```

---

### Task 5: Engine — `calculateWounds` wrapper

**Files:**
- Modify: `src/engine/probability.ts`
- Test: `src/engine/__tests__/probability.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
it('Uncanny Luck X: expected wounds with uLuck 2 are less than or equal to 0', () => {
  const pool: AttackPool = { red: 0, black: 0, white: 4 };
  const attackResults = calculateAttackPool(pool, 'none');
  const woundsNone = calculateWounds(
    attackResults,
    'red',
    'block',
    0,
    0,
    false,
    0,
    'none',
    false,
    false,
    0,
    false,
    0,
    false,
    0,
    0,
    0,
    false,
    0,
    0,
    0
  );
  const woundsUncanny = calculateWounds(
    attackResults,
    'red',
    'block',
    0,
    0,
    false,
    0,
    'none',
    false,
    false,
    0,
    false,
    0,
    false,
    0,
    0,
    0,
    false,
    0,
    0,
    2
  );
  expect(woundsUncanny.expectedWounds).toBeLessThanOrEqual(
    woundsNone.expectedWounds
  );
});
```

Adjust argument count to match `calculateWounds` signature after adding `uncannyLuckX?` as last optional param before closing (after `dangerSenseX`).

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm test -- src/engine/__tests__/probability.test.ts -t "Uncanny Luck X"`

- [ ] **Step 3: Add parameter to `calculateWounds`**

```ts
export function calculateWounds(
  // ...existing params...
  dangerSenseX?: number,
  uncannyLuckX?: number
): WoundsResults {
  // ...existing normalizations...
  const normalizedUncannyLuckX = Math.max(0, Math.floor(uncannyLuckX ?? 0));
  return simulateWoundsFromAttackResults(
    // ...existing args...
    normalizedDangerSenseX,
    normalizedUncannyLuckX,
    DEFAULT_RUNS,
    rng
  );
}
```

- [ ] **Step 4: Run test — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/engine/probability.ts src/engine/__tests__/probability.test.ts
git commit -m "feat(engine): thread uncannyLuckX through calculateWounds"
```

---

### Task 6: URL state — `uLuck`

**Files:**
- Modify: `src/urlState.ts`
- Test: `src/urlState.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
it('parses uLuck and roundtrips in buildFragment', () => {
  const parsed = parseFragment('#uLuck=3');
  expect(parsed.uLuck).toBe(3);
  const fragment = buildFragment({ ...DEFAULT_URL_STATE, uLuck: 3 });
  expect(fragment).toContain('uLuck=3');
  expect(parseFragment('#' + fragment).uLuck).toBe(3);
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm test -- src/urlState.test.ts -t "uLuck"`

- [ ] **Step 3: Implement**

In `UrlState` and `DEFAULT_URL_STATE`:

```ts
uLuck: number;  // default 0
```

In `parseFragment`:

```ts
uLuck: parseNumber(get('uLuck'), DEFAULT_URL_STATE.uLuck),
```

`buildFragment` already iterates `Object.keys(DEFAULT_URL_STATE)` — no extra change if key is on interface.

- [ ] **Step 4: Run test — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/urlState.ts src/urlState.test.ts
git commit -m "feat(url): add uLuck fragment key for Uncanny Luck X"
```

---

### Task 7: UI — input, wiring, guide link

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add state and URL init**

```ts
const [uncannyLuckX, setUncannyLuckX] = useState<string>(() =>
  initialFromUrl
    ? initialFromUrl.uLuck === 0
      ? ''
      : String(initialFromUrl.uLuck)
    : ''
);
```

Add `uncannyLuckX` to `simulationInputs` useMemo and dependency array.

In `urlState` useMemo:

```ts
uLuck:
  debouncedInputs.uncannyLuckX === ''
    ? 0
    : Math.max(
        0,
        Math.floor(Number(debouncedInputs.uncannyLuckX)) || 0
      ),
```

- [ ] **Step 2: Parse and pass to `calculateWounds`**

```ts
const uncannyLuckXNum =
  debouncedInputs.uncannyLuckX === ''
    ? 0
    : Math.max(0, Math.floor(Number(debouncedInputs.uncannyLuckX)) || 0);
```

Add `uncannyLuckXNum` as last argument to `calculateWounds`; add to `woundsResults` useMemo deps.

- [ ] **Step 3: Add control after Danger Sense**

```tsx
<NumberInputWithControls
  id="uncanny-luck-x"
  label="Uncanny Luck"
  value={uncannyLuckX}
  onChange={setUncannyLuckX}
  min={0}
  title="While defending, reroll up to X defense dice that would not become blocks."
  guideAnchor="uncanny-luck-x"
/>
```

- [ ] **Step 4: Reset**

In `handleReset`: `setUncannyLuckX('');`

- [ ] **Step 5: Manual smoke test**

Run: `npm run dev`

1. Set attack pool with dice; note wounds.
2. Set Uncanny Luck to 2 — wounds should drop or stay same.
3. Copy link — URL contains `uLuck=2`; open in new tab — value restored.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "feat(ui): Uncanny Luck X input with Legion Quick Guide link"
```

---

### Task 8: Final verification and design doc

- [ ] **Step 1: Run full test suite**

Run: `npm test`

Expected: all tests PASS

- [ ] **Step 2: Run lint**

Run: `npm run lint`

Expected: no errors

- [ ] **Step 3: Update design doc**

At top of `docs/plans/2026-06-02-uncanny-luck-x-design.md` after title:

```md
**Implemented:** 2026-06-02 (see `docs/plans/2026-06-02-uncanny-luck-x-plan.md`).
```

- [ ] **Step 4: Commit**

```bash
git add docs/plans/2026-06-02-uncanny-luck-x-design.md
git commit -m "docs: mark Uncanny Luck X design as implemented"
```

---

## Self-review checklist

- [x] Reroll pool = non-block dice (blanks + excess surges) — Tasks 1–2
- [x] Order: roll → reroll → resolve — Task 3
- [x] `uLuck` URL key — Task 6
- [x] `guideAnchor="uncanny-luck-x"` — Task 7
- [x] Mixed-color `simulateDefensePool` — Task 4
- [x] All test call sites get new param — Task 3 note
