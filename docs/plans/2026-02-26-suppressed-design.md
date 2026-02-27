# Suppressed – Design

**Date:** 2026-02-26

## Goal

Add **Suppressed** as a defense toggle. When checked, effective cover for cover rolls is improved by one step: none→light, light→heavy. Heavy stays heavy. Cover dice mechanics are unchanged; only the effective cover level used for those rolls changes.

## Rules (product)

- Suppressed improves the defender’s cover by 1 for the purpose of cover rolls.
- Mapping: Cover None + Suppressed → effective light; Cover Light + Suppressed → effective heavy; Cover Heavy + Suppressed → effective heavy (no change).
- Modifier order: defender’s Suppressed is applied first (improve), then attacker’s Sharpshooter reduces effective cover. Cover rolls (white dice, blocks/surges cancel hits) are unchanged.
- UI: checkbox disabled when Cover is Heavy (no effect when already heavy).

## Architecture and data flow

- App holds `suppressed: boolean`; passes into `calculateWounds(..., cover, lowProfile, sharpshooterX, suppressed?)`.
- `calculateWounds` passes `suppressed` through to `simulateWoundsFromAttackResults`.
- Sim functions pass `suppressed` into `applyCover`. `applyCover` calls `getEffectiveCover(cover, sharpshooterX, suppressed)` and uses that result for the cover-dice roll.

## Engine changes

- **getEffectiveCover(cover, sharpshooterX, suppressed?)**  
  Add optional third parameter `suppressed` (default `false`). If `suppressed`, first improve cover by one step (none→light, light→heavy, heavy→heavy). Then apply existing Sharpshooter reduction. Return resulting `CoverLevel`.

- **applyCover(hits, crits, cover, rng, sharpshooterX?, suppressed?)**  
  Add optional `suppressed` (default `false`). Compute effective cover via `getEffectiveCover(cover, sharpshooterX ?? 0, suppressed)`. Rest unchanged.

- **simulateWounds / simulateWoundsFromAttackResults**  
  Add parameter `suppressed: boolean` (e.g. after `lowProfile`). Pass it into `applyCover`.

- **calculateWounds (probability.ts)**  
  Add optional `suppressed?: boolean` (default `false`) after existing cover-related args. Pass through to `simulateWoundsFromAttackResults`.

## UI

- **State:** `suppressed: boolean`, default `false`. Reset to `false` in `handleReset`.
- **Control:** Checkbox (same pattern as Low Profile) in Defense section. Label "Suppressed". Tooltip: "Improve cover by 1 for cover rolls (none→light, light→heavy)." **Disabled when `cover === 'heavy'`.**
- **Wiring:** Pass `suppressed` into `calculateWounds`; include in wounds `useMemo` dependency array.
- **Placement:** Under Cover toggle or immediately after Low Profile.

## Edge cases and error handling

- `suppressed` treated as boolean (truthy/falsy or explicit default `false`). No extra normalization.
- When cover is Heavy, checkbox disabled; if state were ever true, it would have no effect (improve heavy → heavy).

## Testing

- **getEffectiveCover:** Add tests with `suppressed` true: (none, 0, true)→light, (light, 0, true)→heavy, (heavy, 0, true)→heavy; and with Sharpshooter e.g. (light, 1, true)→light (heavy then reduced by 1).
- **applyCover:** Add test(s) with `suppressed: true`, fixed RNG: none + suppressed behaves like light; light + suppressed like heavy.
- **Wounds simulation:** Add test that cover none + suppressed yields lower (or same) expected wounds than cover none without suppressed, and comparable to light cover when suppressed on.
- **calculateWounds:** In probability.test.ts, add call with `suppressed: true` and assert expected wounds differ from `suppressed: false` for a none/light cover scenario.
