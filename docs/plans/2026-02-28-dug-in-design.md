# Dug In – Design

**Date:** 2026-02-28

## Overview

Dug In is a defense toggle. When selected, the **cover roll** uses **red** defense dice instead of white. Everything else (main defense pool, defense surge, cover level, etc.) is unchanged. Dug In is independent of the “Defense dice” (red/white) setting: that setting still only affects the main defense roll.

## Rules (locked)

- **Dug In on:** Cover roll (in `applyCover`) rolls **red** defense dice per hit. Light = blocks cancel hits; heavy = blocks + surges cancel hits. Crits unchanged.
- **Dug In off:** Cover roll uses **white** defense dice (current behavior).
- Main defense pool and its red/white choice are unaffected.

## Types

- No new public types. Optionally document in `types.ts`: “Cover roll uses white defense dice unless Dug In is on (then red).”

## Engine

- **`applyCover`** in `src/engine/simulate.ts`: Add optional parameter `coverDieColor?: DefenseDieColor`, default `'white'`. Use `rollOneDefenseDieOutcome(coverDieColor ?? 'white', rng)` instead of always `'white'`.
- **Call sites:** In `simulateWounds` and `simulateWoundsFromAttackResults`, derive cover die color: red when dug in, else white. Pass into `applyCover`.

## UI

- In the Defense Pool section (with Defense dice, Defense Surge, Cover): add **Dug In** control (checkbox/toggle, same pattern as other defense toggles).
- Label: “Dug In”.
- Tooltip: “When in cover, roll red defense dice for the cover roll instead of white.”
- Leave Dug In always enabled (even when Cover is none) so the choice is preserved when switching cover.

## URL state

- Add `dugIn: boolean` to `UrlState`, default `false`. Short key: `dug`. Parse with `parseBoolean(get('dug'))`. Serialize as `'1'`/`'0'`. Init from URL in `App.tsx`, include in `urlState`, reset in `handleReset`.

## Tests

- **`applyCover`:** Add test(s) that with `coverDieColor: 'red'` the cover roll uses red (e.g. same seed yields different result than white, or distribution check).
- **Wounds simulation:** At least one test that Dug In on + light/heavy cover changes expected wounds vs Dug In off (red blocks more, so fewer wounds when Dug In on).
- Existing `applyCover` call sites that omit the new parameter keep current behavior (white).

## Docs and rules

- In `types.ts`, update the comment that says “Cover rolls white defense dice” to mention Dug In (red when on).
- If Legion Quick Guide has a “dug-in” anchor, add `guideAnchor` for the Dug In control; otherwise omit.

## Error handling

- Invalid or missing URL value for `dug`: treat as `false`.
