# Pierce X Keyword — Design

## Overview

Add an optional **Pierce X** attack keyword that modifies the **final defense roll** only: the attacker cancels up to X blocks when resolving wounds. Cover is unchanged (cover roll still cancels hits before the main defense roll).

## Behavior

- **Pierce X**: User enters a number X (≥ 0). When resolving wounds, after the defender rolls the main defense dice and obtains `blocks`:
  - `effectiveBlocks = max(0, blocks - X)`
  - `wounds = max(0, defenseDice - effectiveBlocks)`
- **Scope**: Applies only to the main defense roll (red/white defense dice). Does **not** affect the cover roll (white dice that cancel hits before the main roll).
- **Example**: Attack with Pierce 3 rolls 4 hits; 1 hit cancelled by cover → 3 incoming. Defender rolls 3 defense dice, all blocks. Pierce 3 → effective blocks = 0 → defender takes 3 wounds.

## Data Model

- **No new types.** Pierce is an optional numeric parameter.
- **Parameter**: `pierceX?: number`. Treated as 0 when undefined, negative, or non-integer (same as Sharpshooter X / Ram X).
- **Where it appears**:
  - `calculateWounds(..., pierceX?)` in `probability.ts` — add as last optional param (after `backup`).
  - `simulateWoundsFromAttackResults(..., pierceX?)` and `simulateWounds(..., pierceX?)` in `simulate.ts` — apply when computing wounds from blocks.
- **`calculateAttackPool`** unchanged (Pierce does not affect attack results).

## Engine Changes

- After computing `blocks` from the main defense roll: `effectiveBlocks = Math.max(0, blocks - Math.max(0, Math.floor(pierceX ?? 0)))`, then `wounds = Math.max(0, defenseDice - effectiveBlocks)`.
- Apply in both `simulateWounds` and `simulateWoundsFromAttackResults`.

## UI

- Add state `pierceX` (string), normalized to number (0 when empty/invalid).
- Add one "Pierce" number input in the Attack Keywords section (e.g. after Sharpshooter), using `NumberInputWithControls` with `min={0}`.
- **Legion Quick Guide**: Add `guideAnchor="pierce-x"` so the label links to [Legion Quick Guide – Pierce X](https://legionquickguide.com/#pierce-x). Anchor format is lowercase with hyphens; the term exists on the guide.
- Wire `pierceXNum` into `calculateWounds` and include in its `useMemo` deps. Reset clears Pierce.

## Testing

- **Pierce 0 / undefined**: Same expected wounds as when param omitted.
- **Pierce cancels blocks**: Deterministic setup (single outcome, seeded RNG); assert pierceX 3 with 3 blocks → 3 wounds; pierceX 2 → 2 wounds; pierceX 0 → normal blocks.
- **Pierce X > blocks**: effective blocks = 0, wounds = defenseDice.

## Edge Cases

- Pierce 0 or omitted: no effect.
- Pierce ≥ blocks: all those blocks cancelled.
- Negative or non-integer X: treat as 0.
