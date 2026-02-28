# Cover X – Design

**Date:** 2026-02-26

## Goal

Add **Cover X** as a defense keyword. The defender improves their effective cover by X for cover rolls. None = 0, Light = 1, Heavy = 2. Effective cover cannot exceed heavy (2). Cover X stacks with Suppressed; then attacker’s Sharpshooter applies.

## Rules (product)

- User enters X in the range 0–2.
- Effective cover value = base cover value + (Suppressed ? 1 : 0) + X, capped at 2, then converted back to level (none/light/heavy).
- Attacker’s Sharpshooter applies after this improvement (reduces effective cover by up to X steps).
- Only the effective cover level used for the cover roll (white dice, hits cancelled by blocks/surges) changes; dice mechanics are unchanged.

## Architecture and data flow

- App holds `coverX` (string from input); normalizes to 0–2 for `calculateWounds`.
- `calculateWounds` passes normalized `coverX` through to `simulateWoundsFromAttackResults`.
- Sim functions pass `coverX` into `applyCover`. `applyCover` calls `getEffectiveCover(cover, sharpshooterX, suppressed, coverX)` and uses that result for the cover-dice roll.

## Engine changes

- **getEffectiveCover(cover, sharpshooterX, suppressed?, coverX?)**  
  Add optional fourth parameter `coverX` (default undefined). Map `cover` to numeric value (none→0, light→1, heavy→2). Add `(suppressed ? 1 : 0) + (coverX ?? 0)`, clamp to 2. Map back to `CoverLevel` (0→none, 1→light, 2→heavy). Then apply existing Sharpshooter reduction. Return resulting `CoverLevel`. Normalize `coverX` as `Math.min(2, Math.max(0, Math.floor(coverX ?? 0)))`.

- **applyCover(hits, crits, cover, rng, sharpshooterX?, suppressed?, coverX?)**  
  Add optional `coverX`. Compute effective cover via `getEffectiveCover(cover, sharpshooterX ?? 0, suppressed, coverX)`. Rest unchanged.

- **simulateWounds / simulateWoundsFromAttackResults**  
  Add parameter `coverX` (e.g. after `suppressed`). Pass into `applyCover`.

- **calculateWounds (probability.ts)**  
  Add optional `coverX?: number` (default 0 or omitted). Normalize to 0–2; pass through to sim.

## UI

- **State:** `coverX` string (same pattern as pierceX/sharpshooterX), default `''`. Normalize for wounds: empty/invalid → 0, else `Math.min(2, Math.max(0, Math.floor(Number(coverX)) || 0))`. Reset to `''` in `handleReset`. Include in wounds `useMemo` dependency array.

- **Control:** `NumberInputWithControls` in Defense section. Placement: after Suppressed, before Backup. `id="cover-x"`, `label="Cover"`, `min={0}`, `max={2}`, `title="Improve cover by X for cover rolls (none=0, light=1, heavy=2); cannot exceed heavy."` Add `guideAnchor="cover-x"` only if Legion Quick Guide has that anchor; otherwise omit.

- **Wiring:** Pass normalized `coverX` (0–2) into `calculateWounds` with other defense args.

## Edge cases and error handling

- Normalize `coverX`: undefined/null/NaN → 0; use `Math.min(2, Math.max(0, Math.floor(coverX)))` in engine so only 0–2 affect result.
- When `coverX` is 0 or omitted, behavior unchanged from current (Suppressed and Sharpshooter only).
- Already heavy + Cover 2 + Suppressed: value 2+1+2 → clamped to 2 (heavy).

## Testing

- **getEffectiveCover:** Add cases with `coverX`: (none, 0, false, 1)→light, (none, 0, false, 2)→heavy, (light, 0, false, 1)→heavy; (none, 0, true, 1)→heavy (stack with Suppressed); cap at heavy (heavy, 0, false, 2)→heavy; Sharpshooter after improve e.g. (heavy, 0, false, 1)→heavy then (heavy, 1, false, 1)→light.
- **applyCover:** One test with `coverX` and fixed RNG: none + coverX 1 behaves like light.
- **Wounds simulation:** Cover none + Cover 1 yields lower (or equal) expected wounds than none + Cover 0; comparable to light when Cover 1 on. Optional: Cover 2 + none vs heavy baseline.
- **calculateWounds:** In probability tests, call with `coverX: 1` vs `coverX: 0` for a none/light scenario; assert expected wounds differ (or match expected effective cover).
