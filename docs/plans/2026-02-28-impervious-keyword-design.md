# Impervious Keyword (Defense) — Design

**Date:** 2026-02-28

## Goal

Add **Impervious** as a defense keyword. While a unit with Impervious is defending, it rolls a number of **extra** defense dice equal to the total Pierce X value of weapons in the attack pool.

## Rules (product)

- **Impervious:** Boolean (defender has the keyword or not). When on, add a number of extra defense dice equal to the attack pool’s total Pierce X. After surge conversion, if the defender rolled at least one block, Pierce X cancels one fewer block (e.g. Pierce 3 → 2 blocks cancelled).
- **Total Pierce X:** We use the app’s single Pierce X field as the total; no multi-weapon support.
- **Order:** … → defense dice count (hits + crits after cover/armor/backup/dodge/outmaneuver) **+ (Impervious ? Pierce X : 0)** → roll defense → resolve blocks → Pierce (blocks − Pierce X, or blocks − (Pierce X − 1) when Impervious and blocks > 0) → wounds.
- **Scope:** Client-side only; one new parameter: `impervious: boolean` (default false).

## Architecture and data flow

- **No new types.** Impervious is a boolean threaded through the stack.
- **Engine (`simulate.ts`):** Extra defense dice when Impervious (unchanged). Pierce via `pierceBlocksCancelled` / `effectiveBlocksAfterPierce`: when Impervious and `blocks > 0` after surge conversion, cancel `max(0, Pierce X − 1)` blocks instead of Pierce X.
- **Probability (`probability.ts`):** `calculateWounds` forwards to `simulateWoundsFromAttackResults`. Add optional `impervious?: boolean` (default false) and pass it through.
- **App (`App.tsx`):** Add `impervious` state (e.g. `useState<boolean>(false)`), pass into `calculateWounds` and include in the wounds `useMemo` dependency array; reset in `handleReset`. No changes to `types.ts`.

## UI

- **State:** One boolean for Impervious; include in wounds `useMemo` deps; reset to false in `handleReset`.
- **Control:** One checkbox in the Defense section for “Impervious” (same pattern as Backup, Outmaneuver). Tooltip/title mentions extra dice and reduced Pierce when blocks are rolled.
- **Legion Quick Guide:** Add `guideAnchor="impervious"` only if that anchor exists on the guide; otherwise omit.

## Edge cases and testing

- **Edge cases:** Pierce X = 0 → Impervious adds 0 dice; behavior matches “no Impervious.” Use existing normalized Pierce X (`Math.max(0, Math.floor(pierceX))`); Impervious uses that value.
- **Tests — sim:** In `simulate.test.ts`, add `describe('Impervious')`: (1) Same (hits, crits), pierce X > 0, `impervious: false` vs `impervious: true` → expected wounds with Impervious ≤ without (extra dice never hurt the defender). (2) Pierce X = 0, Impervious on vs off → same expected wounds.
- **Tests — probability:** In `probability.test.ts`, add an `it` that calls `calculateWounds` with pierce X > 0, once with `impervious: false` and once with `impervious: true`; assert expected wounds with Impervious ≤ without.
