# Impact X Keyword (Attack) — Design

**Date:** 2026-02-27

## Goal

Add **Impact X** as an attack keyword. Up to X hits bypass armor when determining how many hits armor cancels. Impact is only relevant at the armor step; crits, cover, and backup are unchanged.

## Rules (product)

- **Impact X**: User enters a single non-negative integer X (same UI pattern as Pierce / Sharpshooter). Empty or invalid → 0.
- **Formula:** When applying armor, effective armor = `max(0, armorX - impactX)`. Then hits after armor = `max(0, afterCover.hits - effectiveArmor)`. Crits are unchanged; cover and backup behave as today.
- **Order in pipeline:** After cover (and Low Profile), apply armor using that effective armor value, then Backup, then defense dice (hits + crits, Pierce/Dodge as now).
- **When defender has no armor:** Impact has no effect (effective armor remains 0).

**Examples:**

- Impact 4, Armor 3, 5 hits, no cover: effective armor = 0 → all 5 hits go to defense.
- Impact 2, Armor 3, 3 hits: effective armor = 1 → 1 hit cancelled by armor, 2 hits (plus any crits) go to defense.

## Architecture and data flow

- **No new types.** Impact X is an optional numeric parameter like Pierce X and Sharpshooter X.
- **Engine:** Add `impactX: number = 0` to `simulateWounds` and `simulateWoundsFromAttackResults` (alongside `armorX`). After `afterCover`, compute `effectiveArmor = Math.max(0, armorX - impactX)` and `hitsAfterArmor = Math.max(0, afterCover.hits - effectiveArmor)`; use `hitsAfterArmor` for the Backup step. Crits and rest of pipeline unchanged.
- **probability.ts:** Add optional `impactX?: number` to `calculateWounds`, normalize with `Math.max(0, Math.floor(impactX ?? 0))`, pass through to `simulateWoundsFromAttackResults`.
- **App:** Add state for Impact (e.g. `impactX` string and `impactXNum`), pass `impactXNum` into `calculateWounds`, include in wounds `useMemo` deps, reset in `handleReset`.

## UI

- **Control:** One `NumberInputWithControls` in the Attack section: `id="impact-x"`, `label="Impact"`, `min={0}`, `title` e.g. “Up to X hits bypass armor when determining how many hits armor cancels.”
- **Placement:** Attack Keywords block, after Sharpshooter and before Pierce (or immediately after Pierce).
- **Legion Quick Guide** (per `.cursor/rules/legion-quick-guide-links.mdc`): Look up [Legion Quick Guide](https://legionquickguide.com/) for Impact X (anchor format `impact-x`). If the term exists, add `guideAnchor="impact-x"` to the Impact control. If not, omit `guideAnchor`; do not link to the homepage.
- **Reset:** Include Impact in `handleReset` (e.g. `setImpactX('')`).

## Edge cases and testing

- **Edge cases:** `impactX` undefined/null/NaN → 0. Defender armor 0 → Impact has no effect. Impact only reduces effective armor; it never adds armor.
- **Tests — sim:** In `simulate.test.ts`, add a describe for Impact X: fixed outcome (e.g. 4 hits, 1 crit), defender Armor 3, no cover. Assert expected wounds with `impactX: 2` ≥ expected wounds with `impactX: 0`. Optionally: 5 hits, Armor 3, Impact 4 → effective armor 0 → more wounds than Impact 0.
- **Tests — probability:** In `probability.test.ts`, `calculateWounds` same setup with `armorX: 3` twice: `impactX: 0` vs `impactX: 2`; assert expected wounds with Impact 2 ≥ Impact 0.
- **Regression:** Full test suite passes; existing Armor X and wound tests unchanged.
