# Impervious Keyword (Defense) — Design

**Date:** 2026-02-28

## Goal

Add **Impervious** as a defense keyword. While a unit with Impervious is defending, it rolls a number of **extra** defense dice equal to the total Pierce X value of weapons in the attack pool.

## Rules (product)

- **Impervious:** Boolean (defender has the keyword or not). When on, add a number of extra defense dice equal to the attack pool’s total Pierce X. The existing Pierce keyword still applies after the roll (cancel up to X blocks).
- **Total Pierce X:** We use the app’s single Pierce X field as the total; no multi-weapon support.
- **Order:** … → defense dice count (hits + crits after cover/armor/backup/dodge/outmaneuver) **+ (Impervious ? Pierce X : 0)** → roll defense → resolve blocks → Pierce (blocks − Pierce X) → wounds.
- **Scope:** Client-side only; one new parameter: `impervious: boolean` (default false).

## Architecture and data flow

- **No new types.** Impervious is a boolean threaded through the stack.
- **Engine (`simulate.ts`):** Add `impervious: boolean = false` to `simulateWounds` and `simulateWoundsFromAttackResults` (alongside other defense options). After computing `defenseDice` from hits/crits/backup/dodge/outmaneuver, set `defenseDice += impervious ? normalizedPierceX : 0`. Roll that many dice; block resolution and Pierce (blocks − pierceX) unchanged.
- **Probability (`probability.ts`):** `calculateWounds` forwards to `simulateWoundsFromAttackResults`. Add optional `impervious?: boolean` (default false) and pass it through.
- **App (`App.tsx`):** Add `impervious` state (e.g. `useState<boolean>(false)`), pass into `calculateWounds` and include in the wounds `useMemo` dependency array; reset in `handleReset`. No changes to `types.ts`.

## UI

- **State:** One boolean for Impervious; include in wounds `useMemo` deps; reset to false in `handleReset`.
- **Control:** One checkbox in the Defense section for “Impervious” (same pattern as Backup, Outmaneuver). Place near other defense keywords (e.g. after Pierce or near Armor/Backup). Tooltip/title: e.g. “While defending, roll extra defense dice equal to the attack pool’s total Pierce X.”
- **Legion Quick Guide:** Add `guideAnchor="impervious"` only if that anchor exists on the guide; otherwise omit.

## Edge cases and testing

- **Edge cases:** Pierce X = 0 → Impervious adds 0 dice; behavior matches “no Impervious.” Use existing normalized Pierce X (`Math.max(0, Math.floor(pierceX))`); Impervious uses that value.
- **Tests — sim:** In `simulate.test.ts`, add `describe('Impervious')`: (1) Same (hits, crits), pierce X > 0, `impervious: false` vs `impervious: true` → expected wounds with Impervious ≤ without (extra dice never hurt the defender). (2) Pierce X = 0, Impervious on vs off → same expected wounds.
- **Tests — probability:** In `probability.test.ts`, add an `it` that calls `calculateWounds` with pierce X > 0, once with `impervious: false` and once with `impervious: true`; assert expected wounds with Impervious ≤ without.
