# Impervious Keyword (Defense) — Design

**Date:** 2026-02-28  
**Updated:** 2026-06-02 — removed extra defense dice; Pierce reduction only.

## Goal

Add **Impervious** as a defense keyword. While a unit with Impervious is defending, Pierce X cancels one fewer block when the defender rolls at least one block (after surge conversion).

## Rules (product)

- **Impervious:** Boolean (defender has the keyword or not). After surge conversion, if the defender rolled at least one block, Pierce X cancels one fewer block (e.g. Pierce 3 → 2 blocks cancelled).
- **Total Pierce X:** We use the app’s single Pierce X field as the total; no multi-weapon support.
- **Order:** … → defense dice count (hits + crits after cover/armor/backup/dodge/outmaneuver) **+ Danger Sense extra (if any)** → roll defense → resolve blocks → Pierce (blocks − Pierce X, or blocks − (Pierce X − 1) when Impervious and blocks > 0) → wounds.
- **Scope:** Client-side only; one new parameter: `impervious: boolean` (default false).

## Architecture and data flow

- **No new types.** Impervious is a boolean threaded through the stack.
- **Engine (`simulate.ts`):** Pierce via `pierceBlocksCancelled` / `effectiveBlocksAfterPierce`: when Impervious and `blocks > 0` after surge conversion, cancel `max(0, Pierce X − 1)` blocks instead of Pierce X. Impervious does not add defense dice.
- **Probability (`probability.ts`):** `calculateWounds` forwards to `simulateWoundsFromAttackResults`. Add optional `impervious?: boolean` (default false) and pass it through.
- **App (`App.tsx`):** Add `impervious` state (e.g. `useState<boolean>(false)`), pass into `calculateWounds` and include in the wounds `useMemo` dependency array; reset in `handleReset`. No changes to `types.ts`.

## UI

- **State:** One boolean for Impervious; include in wounds `useMemo` deps; reset to false in `handleReset`.
- **Control:** One checkbox in the Defense section for “Impervious” (same pattern as Backup, Outmaneuver). Tooltip/title describes reduced Pierce when blocks are rolled.
- **Legion Quick Guide:** Add `guideAnchor="impervious"` only if that anchor exists on the guide; otherwise omit.

## Edge cases and testing

- **Edge cases:** Pierce X = 0 → Impervious has no effect (no Pierce to reduce). Use existing normalized Pierce X (`Math.max(0, Math.floor(pierceX))`); Impervious uses that value for the reduction.
- **Tests — sim:** In `simulate.test.ts`, add `describe('Impervious')`: (1) Same (hits, crits), pierce X > 0, `impervious: false` vs `impervious: true` → expected wounds with Impervious ≤ without. (2) Pierce X = 0, Impervious on vs off → same expected wounds.
- **Tests — probability:** In `probability.test.ts`, add an `it` that calls `calculateWounds` with pierce X > 0, once with `impervious: false` and once with `impervious: true`; assert expected wounds with Impervious ≤ without.
