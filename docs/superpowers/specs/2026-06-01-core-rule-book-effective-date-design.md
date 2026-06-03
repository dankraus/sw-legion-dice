# Core Rule Book Effective Date — Design

**Date:** 2026-06-01

## Goal

Show users which Core Rule Book effective date the calculator’s rules reflect, so they can tell how current the implementation is relative to official rules.

## Decisions

| Topic         | Choice                                                                                                |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| Placement     | Header, under tagline “Never tell me the odds!”                                                       |
| Copy          | `Core Rule Book effective {date}`                                                                     |
| Initial date  | `5.29.2026`                                                                                           |
| Link          | Full line links to [AMG Legion rules & organized play](https://www.atomicmassgames.com/swlegiondocs/) |
| Link behavior | `target="_blank"`, `rel="noopener noreferrer"`                                                        |

## Architecture

- **`src/rulebook.ts`** — `CORE_RULE_BOOK_EFFECTIVE_DATE` and `CORE_RULE_BOOK_DOCS_URL` constants (single source of truth).
- **`src/components/RulebookVersion.tsx`** — Presentational component rendering the linked line.
- **`src/App.tsx`** — Render `RulebookVersion` inside `app__header-title` below the subtitle.
- **`src/App.css`** — `.app__rulebook-version` muted, smaller than subtitle; underline on hover consistent with footer links.

## Visual

- Font size ~0.8rem; color `#9ca3af` (lighter than subtitle `#6b7280`).
- No pill, border, or badge chrome.
- Accessible label on the anchor (e.g. opens AMG Core Rules documentation in a new tab).

## Out of scope

- URL fragment / share state for the date
- Per-keyword effective dates or changelog UI
- Impervious engine changes (separate spec: `2026-06-01-impervious-pierce-design.md`); bump `CORE_RULE_BOOK_EFFECTIVE_DATE` when rule updates ship

## Maintenance

When aligning the app with a new Core Rule Book effective date, update `CORE_RULE_BOOK_EFFECTIVE_DATE` in `src/rulebook.ts` only.

## Verification

- Manual: header shows linked line with correct date; link opens AMG docs in new tab.
- `npm run lint` and `npm run build` pass.
