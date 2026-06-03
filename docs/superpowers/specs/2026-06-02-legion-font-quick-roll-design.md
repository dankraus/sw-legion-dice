# Legion Font Symbols in Quick Roll — Design

**Date:** 2026-06-02

## Goal

Render Star Wars: Legion dice face symbols in Quick roll using the [Legion font](https://github.com/Owen-A/Legion-font) (MIT). Chips and tally lines use glyphs; the main calculator is unchanged. A reusable layer supports future UI.

## Product decisions

| Topic          | Decision                                           |
| -------------- | -------------------------------------------------- |
| Scope          | Reusable `legionFont` module; Quick roll first     |
| Surfaces       | Result chips, per-color tallies, pool total lines  |
| Missing glyphs | Do not ship until all seven faces are mapped       |
| Credit         | README Acknowledgments links to Owen-A/Legion-font |

## Glyph mapping (Legionfont0.1.4.ttf)

| Face          | Character | Notes                                                    |
| ------------- | --------- | -------------------------------------------------------- |
| Attack crit   | `c`       | Critical hit                                             |
| Attack hit    | `h`       | Hit                                                      |
| Attack surge  | `o`       | Attack surge                                             |
| Attack blank  | (none)    | Per-die chip empty; tallies/totals show the word `blank` |
| Defense block | `s`       | Block                                                    |
| Defense surge | `d`       | Defense surge                                            |
| Defense blank | (none)    | Per-die chip empty; tallies/totals show the word `blank` |

## Architecture

- `public/fonts/Legionfont0.1.4.ttf` + `LICENSE-Legion-font.txt`
- `src/legionFont/legionFaceGlyphs.ts` — face → character, completeness check
- `src/legionFont/legion-font.css` — `@font-face`
- `src/legionFont/LegionFaceSymbol.tsx` — glyph span + `aria-hidden`
- `src/legionFont/FaceCountDisplay.tsx` — count + symbol (tallies, totals)
- `DieFaceChip` — symbol + `aria-label` with text face name
- `DiceRollerModal` — tally/total rows use `FaceCountDisplay`

## Accessibility

- Chips: `aria-label` e.g. "Red crit" (text, not glyph).
- Tallies/totals: `aria-label` on row with full text summary; symbols `aria-hidden`.

## Out of scope

- Calculator stats/charts, DiceSelector icons, font subsetting, URL state.
