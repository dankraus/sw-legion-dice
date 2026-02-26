# Low Profile – Design

**Date:** 2026-02-26

## Goal

Add a **Low Profile** keyword as a toggle (like Outmaneuver). When the defender is in cover, Low Profile cancels one incoming hit before rolling cover dice: fewer hits are rolled for cover, so at most one fewer defense die and one fewer potential wound.

## Rules (product)

- Low Profile is only meaningful when cover is applied (light or heavy).
- When on: one hit is removed from the pool that would be rolled for cover. Example: 4 hits, light cover, Low Profile on → 3 cover dice; 1 hit is canceled. Max defense dice = 3, max wounds potential = 3.
- UI: toggle visible always; **disabled** when Cover is None; when disabled, treat as off for calculations.

## Architecture and engine

- **Approach:** Reduce hits before calling `applyCover` when `cover !== 'none'` and `lowProfile` is true. No change to `applyCover` signature or behavior.
- **simulate.ts**
  - **simulateWounds:** Add parameter `lowProfile: boolean` after `cover`, before `sharpshooterX`. Compute `hitsForCover = (cover !== 'none' && lowProfile) ? Math.max(0, final.hits - 1) : final.hits`. Call `applyCover(hitsForCover, final.crits, cover, rng, sharpshooterX)`.
  - **simulateWoundsFromAttackResults:** Add parameter `lowProfile: boolean` after `cover`, before `sharpshooterX`. Same logic: `hitsForCover` from sampled `(hits, crits)`, then `applyCover(hitsForCover, crits, cover, rng, sharpshooterX)`.
- **probability.ts:** `calculateWounds(..., cover?, lowProfile?, sharpshooterX?)` — add optional `lowProfile` (default `false`), pass through to `simulateWoundsFromAttackResults`.

## UI

- **State:** `lowProfile: boolean`, default `false`.
- **Control:** Checkbox (same pattern as Outmaneuver) after Cover toggle. Label "Low Profile". Tooltip: "When in cover, cancel one hit before rolling cover dice." **Disabled when `cover === 'none'`.**
- **Wiring:** Pass `lowProfile` into `calculateWounds`; include in wounds `useMemo` dependency array.
- **Reset:** Set `lowProfile` to `false` in `handleReset`.

## Edge cases

- 0 hits: `max(0, -1) === 0` → no change. Correct.
- 1 hit, Low Profile on: 0 hits go to cover; 0 cover dice; defense dice from crits only (plus dodge/outmaneuver). Correct.
- Cover None: engine ignores `lowProfile`; UI disables checkbox.

## Testing

- All existing `simulateWounds` and `simulateWoundsFromAttackResults` calls gain a `lowProfile` argument (e.g. `false`) in the correct position.
- Add test: e.g. 4 hits 0 crits, light cover; Low Profile on yields lower expected wounds than Low Profile off (same seed/runs).
