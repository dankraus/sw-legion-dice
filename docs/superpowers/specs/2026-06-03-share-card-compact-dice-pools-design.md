# Share Card — Compact Attack Dice Pools — Design

**Date:** 2026-06-03  
**Parent:** [Share Card design](./2026-06-03-share-card-design.md)

## Goal

Prevent the share/export card from overflowing horizontally when attack pools are large (especially in A-vs-B compare mode). Replace one colored chip per attack die with a compact **chip + color name + multiplier** group per die color.

## Product decisions

| Topic | Decision |
| ----- | -------- |
| Attack display | One group per color with count &gt; 0: colored chip + color name + `×N` (e.g. `■ red ×8`) |
| Attack order | red → black → white |
| Redundant text | Remove the trailing `N red · N black · N white` summary (replaced by groups) |
| Defense display | Unchanged: single chip + "Red/White defense die" (no multiplier) |
| Scope | `ShareCard` image/preview only; `shareText.ts` and main app UI unchanged |
| Card width | No change (360px single, 480px compare) |

## Problem

`ShareCard` `DiceRow` currently renders `Array.from({ length: count })` chips per color **and** a text summary. A pool like 8 red + 8 black produces 16 chips plus text, which overflows narrow compare columns (~220px per pool).

## Architecture

### `DiceRow` (`src/components/ShareCard.tsx`)

- Build the same filtered attack array as today: `{ color, count, name }[]` for red/black/white with `count > 0`.
- Map each entry to a **die group** instead of `flatMap` per die:
  - `<span class="share-card__die" style={{ background: color }} />`
  - `<span>{name}</span>` (e.g. `red`)
  - `<span>×{count}</span>` (e.g. `×8`)
- Wrap each group in `<span class="share-card__die-group">`.
- Empty attack pool: single `none` text (no groups).
- Defense block: leave as-is.

### CSS (`src/components/ShareCard.css`)

- `.share-card__die-group`: `display: inline-flex; align-items: center; gap: 4px` (keeps chip, label, and multiplier on one line).
- `.share-card__dice`: add `flex-wrap: wrap` so multiple groups wrap within the column instead of overflowing.
- Multiplier and color name use existing dice row typography (12px, `#6b7280`).
- White attack chip: retain `border: 1px solid #cbd5e1` on `.share-card__die` for contrast on white card background.

## Testing

Update `src/components/ShareCard.test.tsx`:

- Composition test: assert `red ×3` and `black ×1` (or `getByText` equivalents) instead of `/3 red/`.
- Large-pool compare test: render compare mode with `8 red, 8 black`; assert exactly **8** `.share-card__die` elements in attack sections (2 groups × 1 chip + 2 defense chips per column = document expected count carefully), and assert `red ×8` and `black ×8` text present.
- Existing defense-die and delta tests unchanged.

## Documentation

- Update parent spec attack line in `2026-06-03-share-card-design.md` to describe grouped chips + `×N` (remove "one chip per die + summary text").

## Out of scope

- Changing `buildShareText` pool composition format.
- Main calculator pool editor dice display.
- Compare card width or column layout changes.
- Legion font glyphs on the share card.
