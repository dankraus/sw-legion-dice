# Comparison Pool Snapshots — Design

**Date:** 2026-06-03

## Goal

In Pin & Compare mode, users lose sight of what each pool (A and B) contains because only the live pool (B) appears in the config column. Show **side-by-side read-only snapshots** of both full configurations in the results area so it is always clear what is being compared.

## Product decisions

| Topic           | Decision                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------- |
| Content scope   | Full snapshot: structural fields always visible; optional fields when non-default (per `DEFAULT_POOL_CONFIG`) |
| Placement       | Results column only — two cards (A \| B) **above** editable labels and the delta table                        |
| Layout          | Side-by-side on wide viewports; stack vertically on narrow                                                    |
| Visual identity | A = blue (`#2563eb`), B = amber (`#f59e0b`) — same as comparison charts                                       |
| Edit model      | Unchanged — only B is editable in the left config column                                                      |
| URL / share     | No changes — configs already encoded in fragment                                                              |

## Snapshot content

`formatPoolSnapshot(config)` returns grouped sections mirroring the editor.

| Section         | Always show                                                | Show when non-default                                                                                                                                              |
| --------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Attack          | Red / Black / White counts (including 0), Surge conversion | —                                                                                                                                                                  |
| Tokens          | —                                                          | Any token count > 0 (Surge, Aim, Observe, etc.)                                                                                                                    |
| Attack keywords | —                                                          | Critical, Precise, Ram, Sharpshooter, Pierce, Impact when set                                                                                                      |
| Defense         | Defense die color, Defense surge, Cover level              | Dug In, Low Profile, Suppressed, Backup, Impervious, Outmaneuver, Armor, Cover+, Dodge, Shield, Def surge tokens, Suppression, Danger Sense, Uncanny Luck when set |
| Cost            | —                                                          | Point cost when > 0                                                                                                                                                |

**Dice display:** Colored die chips plus text (e.g. `3 red · 2 black`), same pattern as `ShareCard` `DiceRow`.

**Labels:** Match live UI wording where possible; align with `describeActiveModifiers` for overlapping modifier names.

## Architecture

### `src/poolSnapshot.ts` (new)

- Export `PoolSnapshotSection` type: `{ title: string; lines: { label: string; value: string }[] }`.
- Export `formatPoolSnapshot(config: PoolConfig): PoolSnapshotSection[]`.
- Compare each field to `DEFAULT_POOL_CONFIG` from `poolResults.ts` to decide visibility for optional rows.
- Pure function — no React dependencies.

### `src/components/PoolSnapshotCard.tsx` (new)

Props: `config`, `label`, `accentColor`.

- Header: colored marker + label.
- Attack dice row (chips + text).
- Sections from `formatPoolSnapshot`, rendered as compact definition list or labeled rows.
- Styles in `PoolSnapshotCard.css` (card border tinted by accent, section headings).

### `src/components/ComparisonResults.tsx`

- New props: `configA`, `configB` (in addition to existing results/cost/label props).
- Render `comparison__snapshots` row with two `PoolSnapshotCard` components above the delta table.
- Pass `labelA` / `labelB` and A/B accent colors.

### `src/App.tsx`

- Pass `pinnedConfig` as `configA`, `liveConfig` as `configB` into `ComparisonResults`.

### Optional refactor

- Extract `DiceRow` from `ShareCard.tsx` into `PoolDiceRow.tsx` (or similar) for reuse by `PoolSnapshotCard` and `ShareCard`. Acceptable to duplicate minimally if extraction is large — prefer reuse if trivial.

## UI order (compare mode, results column)

1. Side-by-side pool snapshot cards (A \| B)
2. Editable A/B label inputs (existing)
3. Delta summary table (existing)
4. Overlaid charts and cumulative tables (existing)

## Testing

- `poolSnapshot.test.ts`: sample configs — defaults omitted, structural fields always present, token/keyword rows appear when set; dice counts including zeros.
- `ComparisonResults` or `PoolSnapshotCard` test: both labels and key section text render for A and B.
- Existing compare/URL tests unchanged.

## Out of scope

- Editable snapshots or second config column.
- Collapse/expand for long snapshots.
- Showing every field at default value (e.g. explicit “Aim: 0”).
- Swap A⇄B, third pool, or share-card layout changes beyond optional `DiceRow` extraction.
