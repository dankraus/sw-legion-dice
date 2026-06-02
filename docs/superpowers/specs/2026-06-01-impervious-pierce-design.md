# Impervious Pierce Interaction — Design

**Date:** 2026-06-01

## Goal

Update Impervious so Pierce cancels one fewer block when the defender rolls at least one block (after surge conversion).

## Rules

| Effect | When Impervious is on |
|--------|------------------------|
| Extra dice | Roll Pierce X additional defense dice (unchanged) |
| Pierce | If `blocks > 0` after surge conversion, cancel `max(0, Pierce X − 1)` blocks; otherwise cancel Pierce X (no practical effect when `blocks === 0`) |

**Example:** Pierce 3, Impervious, 5 blocks → 2 cancelled → 3 effective blocks.

**Order:** Unchanged through block resolution; Pierce uses resolved `blocks` from `resolveDefenseRoll`.

## Implementation

- **`pierceBlocksCancelled(blocks, pierceX, impervious)`** — exported from `simulate.ts`; unit-tested.
- **`effectiveBlocksAfterPierce(...)`** — `max(0, blocks − pierceBlocksCancelled(...))`; used in `simulateWounds` and `simulateWoundsFromAttackResults`.
- **UI:** Impervious checkbox tooltip updated in `App.tsx`.
- **No API or URL state changes.**

## Tests

- Unit tests on `pierceBlocksCancelled` / `effectiveBlocksAfterPierce` (edge cases: no blocks, pierce 1, pierce 3).
- Simulation: Pierce 3, Impervious on vs off → strictly lower expected wounds with Impervious.
