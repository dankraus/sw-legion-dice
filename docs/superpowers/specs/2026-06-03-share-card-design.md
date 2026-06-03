# Share Card (Image + Text for Discord/Reddit) — Design

**Date:** 2026-06-03

## Goal

Let users export their current setup and results as a shareable card for Discord (image) and Reddit (text). The header **Share** button opens a modal with a live preview and four actions: **Copy link**, **Copy image**, **Copy text**, **Download PNG**. The card is compare-aware: in A-vs-B compare mode it shows both pools with deltas.

## Product decisions

| Topic            | Decision                                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------- |
| Formats          | Both image (PNG) and text (markdown/plain)                                                                    |
| Style            | "Light/clean" matching the app (Style B). Dark mode deferred.                                                 |
| Card content     | Pool composition · active keywords/tokens · headline stats · efficiency · mini distribution · branding + link |
| Excluded content | "Key thresholds / At least N" highlights (not on the card)                                                    |
| Compare-aware    | In compare mode the card shows A and B + deltas; otherwise a single pool                                      |
| Placement        | Header **Share** opens a preview modal; "Copy link" moves into the modal                                      |
| Engine           | No probability/simulation math changes                                                                        |

## Architecture

### Shared data

- Reuses the `PoolConfig` type and `computePoolResults(config)` helper introduced by the comparison spec (`2026-06-03-comparison-pin-and-compare-design.md`). The card consumes the same config + results the results area already computes.
- New helper `describeActiveModifiers(config: PoolConfig): string[]` — returns human-readable labels for **non-default** keyword/token/toggle fields only, e.g. `["Aim 2", "Critical 1", "Surge→Hit", "Cover Light", "Pierce 1"]`. Shared by both the card and the text export so they never drift.

### Image rendering

- Add dependency **`html-to-image`**.
- `src/share/shareImage.ts` (new): thin wrappers
  - `copyImageToClipboard(node: HTMLElement): Promise<void>` — `toBlob` → `navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])`.
  - `downloadPng(node: HTMLElement, filename: string): Promise<void>` — `toPng` → anchor download.
- Capture from an **off-screen, fixed-width (~600px)** `ShareCard` instance (rendered in the modal but positioned off-canvas) so output is crisp and independent of viewport. Use a 2x `pixelRatio` for retina-quality PNG.
- **Fallback:** if `navigator.clipboard.write` / `ClipboardItem` is unavailable (e.g. Firefox), disable/hide **Copy image** and surface **Download PNG** as the path; show a brief inline note.
- **Fonts:** the card uses system UI fonts for stats/labels; if Legion glyphs are used for dice they must be inlined for `html-to-image` (embed the font) — otherwise render dice as colored chips (matching the mockup) to avoid font-embedding complexity. Decision: use colored chips on the card (no Legion font dependency for image capture).

### Text rendering

- `src/share/shareText.ts` (new): `buildShareText(input): string` — a pure function producing a compact block. Single-pool variant and compare variant (A vs B). Includes pool composition, active modifiers, headline stats, efficiency (when cost set), and the `legionroller.com/#...` share URL. Defaults are omitted (mirrors `describeActiveModifiers`).

### Components

| File                                         | Role                                                                                                                                                                                                                   |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/ShareCard.tsx` (new)         | Pure presentational card (Style B). Props: pool(s) config, results, labels, share URL, compare flag. Fixed width.                                                                                                      |
| `src/components/ShareModal.tsx` (new)        | Opened by header Share. Scaled live preview + actions (Copy link, Copy image, Copy text, Download PNG); holds the off-screen full-res `ShareCard` for capture. Esc/backdrop close (matches `DiceRollerModal` pattern). |
| `src/share/shareText.ts` (new)               | `buildShareText(...)`                                                                                                                                                                                                  |
| `src/share/shareImage.ts` (new)              | `copyImageToClipboard`, `downloadPng`                                                                                                                                                                                  |
| `src/share/describeActiveModifiers.ts` (new) | non-default modifier labels                                                                                                                                                                                            |
| `src/App.tsx`                                | Header **Share** button opens `ShareModal` (was: copy link directly). Pass current config(s)/results/URL/labels.                                                                                                       |

### Card content (Style B)

- Header: logo + "Legion Roller".
- Attack line: colored dice chips + "N red · N black · N white".
- Defense line: colored dice chips + "N red · N white".
- Active-modifier pills (from `describeActiveModifiers`).
- Headline stats: Avg hits, Avg crits, Avg total, Avg wounds.
- Efficiency: Pts/success, Pts/wound — only when a point cost > 0.
- Mini distribution: small bar row (attack distribution).
- Footer: `legionroller.com/#<fragment>` + logo.
- **Compare mode:** two stat columns (A / B by label) + Δ, with both pools' composition and pills.

## Edge cases

- Empty pool (0 attack dice): Share modal still opens and **Copy link** stays enabled; **Copy image / Copy text / Download PNG** are disabled with a small "Add dice to share" hint.
- No point cost: omit efficiency row from card and text.
- Long modifier lists: pills wrap to multiple lines; text export comma-joins.
- Clipboard image unsupported: hide Copy image, keep Download PNG.

## Testing

- `describeActiveModifiers`: defaults excluded; X-values formatted ("Aim 2", "Cover Light", "Surge→Hit"); empty when all default.
- `buildShareText`: single + compare variants; omits defaults and efficiency when no cost; includes the share URL.
- `ShareModal`: renders preview; action buttons present; clipboard-unsupported path hides Copy image (mock capability).
- Image helpers kept thin; mock `html-to-image` to assert wiring (toBlob/toPng called, download anchor created).
- Existing probability/simulation tests unchanged.

## Dependencies

- `html-to-image` (new runtime dependency).

## Out of scope

- Dark-mode card style (deferred).
- "Key thresholds / At least N" content on the card.
- Server-side / OpenGraph image generation.
- Legion-font glyphs in the captured image (use colored chips instead).
