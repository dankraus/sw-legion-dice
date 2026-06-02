# Uncanny Luck X Keyword (Defense) — Design

**Implemented:** 2026-06-02 (see `docs/plans/2026-06-02-uncanny-luck-x-plan.md`).

**Date:** 2026-06-02

## Goal

Add **Uncanny Luck X** to the Legion Dice Calculator: while defending, after rolling the defense pool, reroll up to **X** defense dice that would not become blocks, then resolve blocks (defense surge + defense surge tokens) and pierce as today. Include a Legion Quick Guide link and URL fragment key `uLuck`.

## Rules (product)

Per [Legion Quick Guide — Uncanny Luck X](https://legionquickguide.com/#uncanny-luck-x):

- During the Reroll Defense Dice step, the defender may reroll **up to X** defense dice **at the same time**; each die at most once.
- **Calculator model:** Rerolls target dice that contribute **0 blocks** after accounting for defense surge mode and defense surge tokens (optimal / legal use):
  - **Blank** faces — always rerollable.
  - **Surge** when defense surge is **Block** — not rerollable (already counts as block).
  - **Surge** when defense surge is **None** — `min(tokens, surgeCount)` surges are treated as converted to blocks; only **excess** surges are rerollable.
- **X** is a fixed keyword value (non-negative integer). **X = 0** → no rerolls.
- **Cap:** `rerollCount = min(X, rerollableCount)`. If more than X dice are rerollable, any X may be chosen; for same-color pools all rerollable faces are equivalent for expected value.
- **Order:** Roll all defense dice → Uncanny Luck rerolls → `resolveDefenseRoll` → pierce / impervious → wounds. Same `totalDefenseDice` as today (attack successes, dodge, Danger Sense, Impervious extras, etc.); Uncanny Luck does not add dice.

## Architecture (Approach 1)

Face-level reroll helper in `simulate.ts`, mirroring attack `applyRerollsByRounds`:

1. Roll `totalDefenseDice` into per-die `DefenseFace[]` (existing `rollOneDefenseDieOutcome`).
2. `applyUncannyLuckRerolls(outcomes, uncannyLuckX, defenseSurge, defenseSurgeTokens, color, rng)` — compute rerollable indices, reroll `min(X, count)`, mutate outcomes in place.
3. Aggregate block/surge counts → `resolveDefenseRoll` → `effectiveBlocksAfterPierce` → wounds.

Thread `uncannyLuckX` through wounds simulation and standalone defense APIs for consistency with defense surge tokens.

## Engine changes

**simulate.ts**

- Add `getRerollableDefenseIndices(faces, surge, defenseSurgeTokens): number[]` (or inline in helper).
- Add `applyUncannyLuckRerolls(faces, uncannyLuckX, surge, defenseSurgeTokens, color, rng): void`.
- **simulateWounds** / **simulateWoundsFromAttackResults:** After defense roll loop builds face array, call `applyUncannyLuckRerolls` when `uncannyLuckX > 0`, then count faces and resolve.
- **simulateDefensePool** / **getDefenseDistributionForDiceCountSim:** Same reroll step before `resolveDefenseRoll` (API parity).
- **Parameter:** `uncannyLuckX: number = 0` in defense keyword block (after `dangerSenseX`, before `pierceX`). Normalize: `Math.max(0, Math.floor(uncannyLuckX))`.

**probability.ts**

- **calculateWounds:** Optional `uncannyLuckX?: number`, default 0, pass through.
- **getDefenseDistributionForDiceCount** / **calculateDefensePool:** Optional `uncannyLuckX?: number` on public wrappers and sim functions.

No changes to attack rerolls, cover, or Danger Sense logic.

## UI

- **State:** `uncannyLuckX` as `useState<string>('')`. Reset to `''`.
- **Parse:** Empty → 0; else `Math.max(0, Math.floor(Number(...)) || 0)`.
- **Control:** `NumberInputWithControls` in Defense → Keywords, after Danger Sense X, before Tokens (or immediately after Danger Sense if that reads better).
- **Label:** `Uncanny Luck`
- **Tooltip:** e.g. "While defending, reroll up to X defense dice that would not become blocks (after surge conversion and defense surge tokens)."
- **Guide:** `guideAnchor="uncanny-luck-x"` → `https://legionquickguide.com/#uncanny-luck-x`
- **Wiring:** Debounced inputs, wounds `useMemo`, `calculateWounds`.

## URL state

| State         | Key     | Default | Omit when |
| ------------- | ------- | ------- | --------- |
| uncannyLuckX  | `uLuck` | `0`     | `0`       |

Follow `url-state-new-inputs` rule: `UrlState`, `DEFAULT_URL_STATE`, `parseFragment`, `buildFragment`, `App.tsx` init/sync/reset, `urlState.test.ts` round-trip.

## Edge cases and testing

- **X = 0:** Identical to current behavior.
- **No rerollable dice:** No rerolls (e.g. all blocks, or all surges converted when surge none + enough tokens).
- **Surge Block:** Only blanks rerollable.
- **Invalid input:** Treated as 0.
- **Tests — unit:** Rerollable index sets for blank/surge/token combinations; cap at X; zero rerollable unchanged.
- **Tests — sim:** Same seed, fixed defense dice count — `uncannyLuckX` 2 vs 0 → expected blocks higher or equal; wounds lower or equal. Optional: surge none + tokens reduces reroll pool vs no tokens.
- **Tests — URL:** `uLuck=2` parse/build and init from fragment.

## Out of scope

- Mixed red/white defense pools in one roll (not supported elsewhere).
- Forced reroll of dice that would become blocks (not modeled).
