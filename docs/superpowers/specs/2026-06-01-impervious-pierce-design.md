# Impervious Pierce Interaction — Design

**Date:** 2026-06-01  
**Updated:** 2026-06-02 — removed extra defense dice from Impervious.

## Goal

Impervious reduces Pierce: cancel one fewer block when the defender rolls at least one block (after surge conversion). Impervious does not grant extra defense dice.

## Rules

| Effect | When Impervious is on |
|--------|------------------------|
| Extra dice | None |
| Pierce | If `blocks > 0` after surge conversion, cancel `max(0, Pierce X − 1)` blocks; otherwise cancel Pierce X (no practical effect when `blocks === 0`) |

**Example:** Pierce 3, Impervious, 5 blocks → 2 cancelled → 3 effective blocks.

**Order:** Unchanged through block resolution; Pierce uses resolved `blocks` from `resolveDefenseRoll`.

## Implementation

- **`pierceBlocksCancelled(blocks, pierceX, impervious)`** — exported from `simulate.ts`; unit-tested.
- **`effectiveBlocksAfterPierce(...)`** — `max(0, blocks − pierceBlocksCancelled(...))`; used in `simulateWounds` and `simulateWoundsFromAttackResults`.
- **Defense dice count:** `totalDefenseDice = defenseDice + dangerSenseExtra` only (no Impervious term).
- **UI:** Impervious checkbox tooltip updated in `App.tsx`.
- **No API or URL state changes.**

## Tests

- Unit tests on `pierceBlocksCancelled` / `effectiveBlocksAfterPierce` (edge cases: no blocks, pierce 1, pierce 3).
- Simulation: Pierce > 0, Impervious on vs off → expected wounds with Impervious ≤ without.
