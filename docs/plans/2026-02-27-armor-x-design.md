# Armor X Keyword (Defense) — Design

**Date:** 2026-02-27

## Goal

Add **Armor X** as a defense keyword. The defender cancels up to X **hits** after the cover roll and before Backup. Crits are not reduced and must still be rolled for with defense dice.

## Rules (product)

- **Armor X**: User enters a non-negative integer X (no maximum). Empty or invalid → 0.
- **Order:** Attack results → Cover (only hits can be cancelled) → **Armor X** (subtract up to X hits; crits unchanged) → Backup (up to 2 hits) → Dodge/Outmaneuver → defense dice → Pierce → wounds.
- **Scope:** Only hits are reduced by Armor; crits always count toward how many defense dice are rolled.

**Examples:**

- 5 hits, 1 crit vs Armor 3, Light Cover: cover blocks 1 → 4 hits, 1 crit; Armor removes 3 hits → 1 hit, 1 crit; defense is rolled for 2 dice.
- 1 hit, 1 crit vs Armor 3, no cover: Armor removes the 1 hit → 0 hits, 1 crit; defense is rolled for 1 die (the crit).

## Architecture and data flow

- **No new types.** Armor is an optional numeric parameter like Pierce X.
- **Engine:** After `applyCover`, compute `hitsAfterArmor = Math.max(0, afterCover.hits - normalizedArmorX)`. Crits stay `afterCover.crits`. Use `hitsAfterArmor` (not `afterCover.hits`) as the input to the existing Backup step: `hitsAfterBackup = backup ? Math.max(0, hitsAfterArmor - 2) : hitsAfterArmor`. Rest of pipeline (dodge/outmaneuver → defense dice count → roll → Pierce → wounds) unchanged.
- **API:** Add optional `armorX?: number` to `calculateWounds` in `probability.ts` (e.g. after `backup`). Normalize with `Math.max(0, Math.floor(armorX ?? 0))` and pass through to `simulateWoundsFromAttackResults` and `simulateWounds`. Both sim functions take `armorX` (default 0) and apply the step above between cover and Backup.

## UI

- **State:** Add `armorX` string (same pattern as `pierceX` / `coverX`). Normalize for wounds: empty or invalid → 0, else `Math.max(0, Math.floor(Number(armorX)) || 0)`. Include in wounds `useMemo` deps; reset to `''` in `handleReset`.
- **Control:** One Armor number input in the Defense section with `NumberInputWithControls`, `min={0}`, no `max`. Place after Cover X and before Backup. Title: e.g. “Cancel up to X hits after cover, before defense dice; crits are not reduced.”
- **Legion Quick Guide:** Add `guideAnchor="armor-x"` only if that anchor exists on the guide; otherwise omit.

## Edge cases and testing

- **Edge cases:** `armorX` undefined/null/NaN → 0; use `Math.max(0, Math.floor(armorX ?? 0))`. Armor 0 or omitted → no behavior change. Armor only reduces hits; crits never reduced.
- **Tests — sim:** In `simulateWoundsFromAttackResults`, fixed outcome (e.g. 4 hits, 1 crit), no cover, no backup: assert `armorX: 3` yields lower or equal expected wounds than `armorX: 0`, and defense dice count = remaining hits + crits. Add deterministic/seeded case: e.g. 5h 0c, Armor 3 → 2 hits before Backup; or 1h 1c, Armor 3 → 0 hits 1 crit → 1 defense die.
- **Tests — probability:** `calculateWounds` with `armorX: 3` vs `armorX: 0` for same setup; expect lower or equal expected wounds when `armorX: 3`.
