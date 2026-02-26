# Cover – Design

**Date:** 2026-02-26

## Overview

Cover is a defense mechanic that rolls **before** the main defense dice. The defender rolls white defense dice for cover; each block (and for heavy cover, each surge) can cancel one **hit**. Crits always bypass cover. Dodge is applied only as part of the defense step (after cover).

## Rules (locked)

- **Cover level:** None | Light | Heavy. Toggle in UI like the surge conversion selector.
- **Cover dice:** Number of white dice rolled for cover = **number of hits** from the attack (not hits + crits).
- **Light cover:** Each **block** on a cover die cancels one hit. Surges and blanks do nothing. Crits unchanged.
- **Heavy cover:** Each **block** or **surge** on a cover die cancels one hit. Blanks do nothing. Crits unchanged.
- **Order:** Attack → (hits, crits) → **Cover** (if not None) → (hits′, crits) → **Dodge** (defense step) → defense dice → wounds.

## Types

- Add `CoverLevel = 'none' | 'light' | 'heavy'`.
- Thread through: `calculateWounds(..., cover: CoverLevel)` and underlying sim functions.

## UI

- In the Defense section: add **Cover** selector with three options (None / Light / Heavy).
- Same pattern and styling as Surge Conversion / Defense Surge (radio group, reuse `.surge-toggle`).
- No separate input for cover dice count (derived from hits).

## Engine

- After sampling (hits, crits) in the wounds simulation loop:
  - If `cover !== 'none'`: roll `hits` white dice. Light: count blocks. Heavy: count blocks + surges. `hits′ = max(0, hits − count)`.
  - Else: `hits′ = hits`.
- Then: (hits′, crits) → existing dodge logic → defense dice count → roll defense dice → wounds = defenseDice − blocks.
- Implement as a small helper `applyCover(hits, crits, cover, rng)` returning `{ hits, crits }` for clarity and unit tests.

## Edge cases

- **Zero hits:** Roll 0 cover dice; (hits′, crits) = (0, crits).
- **Reset:** Set Cover to None when user resets.

## Testing

- Unit tests for `applyCover`: none/light/heavy, 0 hits, a few (hits, crits) cases.
- Wounds integration: e.g. 1 hit 0 crits with light cover vs none to ensure cover reduces expected wounds.
