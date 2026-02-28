# Danger Sense X Keyword (Defense) — Design

**Date:** 2026-02-28

## Goal

Add the **Danger Sense X** defense keyword and a **Suppression tokens** count. The existing Suppressed checkbox is unchanged (improves effective cover for cover rolls only). Danger Sense X uses only the suppression token count.

## Rules (product)

- **Danger Sense X:** While defending, the unit rolls one extra defense die per suppression token it has, capped at X extra dice. Extra defense dice = `min(suppressionTokens, dangerSenseX)`.
- **Suppression tokens:** New numeric input (0, 1, 2, …). Used only for Danger Sense X. No change to the existing Suppressed checkbox (cover improvement).
- **Order:** Extra dice from Danger Sense are added to the normal defense dice count (after cover, backup, dodge, outmaneuver). Same die type and surge conversion as the rest of the defense pool.

## Architecture and data flow

- **App** holds `suppressionTokens` and `dangerSenseX` (string inputs, parsed like dodge/coverX). Both passed into `calculateWounds(..., suppressionTokens?, dangerSenseX?)`.
- **calculateWounds** (probability.ts) accepts optional `suppressionTokens` and `dangerSenseX` (default 0), normalizes to non-negative integers, passes through to `simulateWoundsFromAttackResults`.
- **simulateWounds** and **simulateWoundsFromAttackResults** (simulate.ts) accept `suppressionTokens` and `dangerSenseX`. After computing current `defenseDice` (after cover, backup, dodge, outmaneuver), add `extraDice = min(suppressionTokens, dangerSenseX)` and use `defenseDice + extraDice` for the defense roll and wound math.
- **Parameter order:** Add both in the defense/keyword block (e.g. after armorX/impactX, before pierceX).

## Engine changes

**simulate.ts**

- **simulateWoundsFromAttackResults:** Add `suppressionTokens: number = 0` and `dangerSenseX: number = 0` (after impactX, before pierceX). Normalize with `Math.max(0, Math.floor(...))`. After the line that sets `defenseDice`, add `dangerSenseExtra = Math.min(normalizedSuppressionTokens, normalizedDangerSenseX)` and `totalDefenseDice = defenseDice + dangerSenseExtra`. Use `totalDefenseDice` for the defense roll loop and for `wounds = max(0, totalDefenseDice - effectiveBlocks)`.
- **simulateWounds:** Same two parameters and same logic in the per-run loop.

**probability.ts**

- **calculateWounds:** Add optional `suppressionTokens?: number` and `dangerSenseX?: number` (same block). Default 0, normalize, pass through to `simulateWoundsFromAttackResults`.

No changes to applyCover or other engine functions.

## UI

- **State:** `suppressionTokens` and `dangerSenseX` as `useState<string>('')`. Reset both to `''` in `handleReset`.
- **Parsed values:** Empty → 0; else `Math.max(0, Math.floor(Number(...)) || 0)`.
- **Controls:** Suppression tokens: number input with +/-. Label "Suppression tokens". Tooltip: "Number of suppression tokens on the defender; used by Danger Sense X for extra defense dice." Danger Sense X: number input with +/-. Label "Danger Sense X". Tooltip: "While defending, roll one extra defense die per suppression token, up to X extra dice."
- **Placement:** Defense section, after Armor X (and Impact X if present), before Pierce X. Order: Suppression tokens, then Danger Sense X.
- **Wiring:** Pass `suppressionTokensNum` and `dangerSenseXNum` into `calculateWounds`; include both in wounds `useMemo` deps.
- **Guide link:** Add `guideAnchor` only if Legion Quick Guide has entries for "danger-sense" and/or "suppression-tokens"; otherwise omit.

## Edge cases and testing

- **Edge cases:** Normalize to non-negative integers; negative or non-numeric → 0. Either 0 → no extra dice. No cap on suppression token count unless game rules specify one.
- **Tests — sim:** In simulate.test.ts, add `describe('Danger Sense X', ...)`. Same attack (e.g. one outcome 3 hits, 1 crit), 0 suppression / 0 Danger Sense vs 2 suppression / 2 Danger Sense; assert expected wounds with Danger Sense 2 are less than or equal to without. Optionally: 3 tokens and Danger Sense 2 → only 2 extra dice (cap at X).
- **Tests — probability:** In calculateWounds, add a call with suppressionTokens and dangerSenseX set so extra dice are added; assert expected wounds lower than same scenario with both 0.
