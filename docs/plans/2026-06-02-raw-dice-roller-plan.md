# Raw Dice Roller Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a header-triggered modal to roll standalone attack/defense dice pools and show raw per-die faces plus per-color tallies. State resets when the modal closes (no persistence).

**Architecture:** `rollDefensePoolDetailed` in `simulate.ts`; `DiceRollerModal` with ephemeral state; mount modal only while open so close = full reset. `App.tsx` toggles visibility. No URL, simulation, or storage changes.

**Tech Stack:** React 19, TypeScript, Vitest. Reuse `DiceSelector`, `Math.random()`.

**Design:** `docs/plans/2026-06-02-raw-dice-roller-design.md`

---

### Task 1: Engine — `rollDefensePoolDetailed` (TDD)

**Files:**

- Modify: `src/engine/simulate.ts`
- Test: `src/engine/__tests__/simulate.test.ts`

- [ ] **Step 1: Write the failing test**

Add after the `rollAttackPool` describe block:

```ts
describe('rollDefensePoolDetailed', () => {
  it('returns one outcome per die in red then white order', () => {
    const pool: DefensePool = { red: 2, white: 1 };
    const rng = createSeededRng(99);
    const outcomes = rollDefensePoolDetailed(pool, rng);
    expect(outcomes).toHaveLength(3);
    expect(outcomes[0]?.color).toBe('red');
    expect(outcomes[1]?.color).toBe('red');
    expect(outcomes[2]?.color).toBe('white');
    for (const outcome of outcomes) {
      expect(['block', 'surge', 'blank']).toContain(outcome.face);
    }
  });

  it('empty pool returns empty array', () => {
    const outcomes = rollDefensePoolDetailed(
      { red: 0, white: 0 },
      createSeededRng(1)
    );
    expect(outcomes).toEqual([]);
  });
});
```

Add imports: `DefensePool`, `rollDefensePoolDetailed`, `DefenseDieOutcome` as needed.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/engine/__tests__/simulate.test.ts -t "rollDefensePoolDetailed"`

Expected: FAIL — `rollDefensePoolDetailed` is not defined

- [ ] **Step 3: Implement**

In `simulate.ts`, after `rollAttackPoolDetailed`:

```ts
export interface DefenseDieOutcome {
  color: DefenseDieColor;
  face: DefenseFace;
}

export function rollDefensePoolDetailed(
  pool: DefensePool,
  rng: () => number
): DefenseDieOutcome[] {
  const outcomes: DefenseDieOutcome[] = [];
  const colors: DefenseDieColor[] = ['red', 'white'];
  for (const color of colors) {
    const number = pool[color];
    for (let dieIndex = 0; dieIndex < number; dieIndex++) {
      outcomes.push({
        color,
        face: rollOneDefenseDieOutcome(color, rng),
      });
    }
  }
  return outcomes;
}
```

Ensure `DefensePool` is imported from `../types`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/engine/__tests__/simulate.test.ts -t "rollDefensePoolDetailed"`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/simulate.ts src/engine/__tests__/simulate.test.ts
git commit -m "feat(engine): add rollDefensePoolDetailed for raw defense rolls"
```

---

### Task 2: Tally helpers for display strings

**Files:**

- Create: `src/diceRollerTallies.ts`
- Create: `src/diceRollerTallies.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { formatAttackTallies, formatDefenseTallies } from './diceRollerTallies';
import type { DieOutcome, DefenseDieOutcome } from './engine/simulate';

describe('diceRollerTallies', () => {
  it('formatAttackTallies groups by color and face', () => {
    const outcomes: DieOutcome[] = [
      { color: 'red', face: 'hit' },
      { color: 'red', face: 'blank' },
      { color: 'white', face: 'crit' },
    ];
    expect(formatAttackTallies(outcomes)).toEqual([
      'Red: 1 hit, 1 blank',
      'White: 1 crit',
    ]);
  });

  it('formatDefenseTallies groups by color', () => {
    const outcomes: DefenseDieOutcome[] = [
      { color: 'white', face: 'block' },
      { color: 'white', face: 'block' },
    ];
    expect(formatDefenseTallies(outcomes)).toEqual(['White: 2 block']);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm test -- src/diceRollerTallies.test.ts`

- [ ] **Step 3: Implement**

Build per-color face counts, sort colors (red, black, white / red, white), format faces with counts > 0. Capitalize color labels; face labels as lowercase words (`hit`, `crit`, `block`).

- [ ] **Step 4: Run test — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/diceRollerTallies.ts src/diceRollerTallies.test.ts
git commit -m "feat: tally formatters for raw dice roller results"
```

---

### Task 3: `DieFaceChip` component

**Files:**

- Create: `src/components/DieFaceChip.tsx`
- Create: `src/components/DieFaceChip.css`

- [ ] **Step 1: Implement chip**

Props: `color: 'red' | 'black' | 'white'`, `faceLabel: string` (e.g. `Crit`, `Block`).

- BEM class: `die-face-chip die-face-chip--${color}`
- `aria-label` e.g. `Red crit`

- [ ] **Step 2: Commit**

```bash
git add src/components/DieFaceChip.tsx src/components/DieFaceChip.css
git commit -m "feat(ui): add DieFaceChip for raw roll results"
```

---

### Task 4: `DiceRollerModal` component

**Files:**

- Create: `src/components/DiceRollerModal.tsx`
- Create: `src/components/DiceRollerModal.css`

- [ ] **Step 1: Modal shell**

Props: `onClose: () => void` only (component mounts only while open; no `open` prop needed if parent unmounts).

- Backdrop + panel; click backdrop closes; Escape closes (`useEffect` listener).
- `role="dialog"`, `aria-modal="true"`, title **Roll dice**.

- [ ] **Step 2: Ephemeral state**

```ts
const [attackPool, setAttackPool] = useState<AttackPool>({
  red: 0,
  black: 0,
  white: 0,
});
const [defensePool, setDefensePool] = useState<DefensePool>({
  red: 0,
  white: 0,
});
const [lastAttackOutcomes, setLastAttackOutcomes] = useState<
  DieOutcome[] | null
>(null);
const [lastDefenseOutcomes, setLastDefenseOutcomes] = useState<
  DefenseDieOutcome[] | null
>(null);
```

No `localStorage`. Unmount on close resets everything.

- [ ] **Step 3: Pool inputs**

Attack: three `DiceSelector`s.

Defense: two `DiceSelector`s (red, white) under heading **Defense**.

- [ ] **Step 4: Roll handlers**

```ts
const handleRollAttack = () => {
  setLastAttackOutcomes(rollAttackPoolDetailed(attackPool, Math.random));
};

const handleRollDefense = () => {
  setLastDefenseOutcomes(rollDefensePoolDetailed(defensePool, Math.random));
};
```

- [ ] **Step 5: Results UI**

- Attack: map outcomes to `DieFaceChip`; below chips, `<ul>` of `formatAttackTallies` lines.
- Defense: same with defense faces (`Block`, `Surge`, `Blank`).
- Placeholder when `lastAttackOutcomes === null`: “Set dice and roll.”

- [ ] **Step 6: Buttons**

- **Roll attack** / **Roll defense** — `disabled` when respective pool total is 0.

- [ ] **Step 7: Manual check**

`npm run dev` → Roll dice → set pools → roll → close modal → reopen → verify zero pools and no results.

- [ ] **Step 8: Commit**

```bash
git add src/components/DiceRollerModal.tsx src/components/DiceRollerModal.css
git commit -m "feat(ui): add DiceRollerModal for raw attack and defense rolls"
```

---

### Task 5: Wire header in `App.tsx`

**Files:**

- Modify: `src/App.tsx`

- [ ] **Step 1: Conditional mount**

```tsx
const [diceRollerOpen, setDiceRollerOpen] = useState(false);
```

In `app__header-actions`, before Copy link:

```tsx
<button
  type="button"
  className="app__reset"
  onClick={() => setDiceRollerOpen(true)}
>
  Roll dice
</button>;
{
  diceRollerOpen ? (
    <DiceRollerModal onClose={() => setDiceRollerOpen(false)} />
  ) : null;
}
```

Unmounting on close clears all roller state for the next open.

- [ ] **Step 2: Run full test suite**

Run: `npm test`

Expected: all pass

- [ ] **Step 3: Run lint**

Run: `npm run lint`

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: open raw dice roller from header"
```

---

## Self-review (spec coverage)

| Design requirement              | Task                                        |
| ------------------------------- | ------------------------------------------- |
| Raw faces only                  | Tasks 1, 4 — no keyword pipeline            |
| Attack + defense pools          | Task 4                                      |
| Standalone pools                | Task 4 state                                |
| Header + modal                  | Task 5, 4                                   |
| Separate roll buttons           | Task 4                                      |
| Chips + tallies                 | Tasks 2, 3, 4                               |
| Reset on close (no persistence) | Task 5 conditional mount; Task 4 no storage |
| No dice cap                     | No clamp in selectors                       |
| No URL state                    | No `urlState` changes                       |
| No calculator mirror            | Not implemented                             |
