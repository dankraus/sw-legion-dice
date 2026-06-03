# A vs B Pool Comparison (Pin & Compare) — Design

**Date:** 2026-06-03

## Goal

Let users compare two attack/defense configurations side by side so they can answer list-building questions like "is the heavy weapon upgrade worth it?". The user pins the current pool as **A**, keeps editing the live pool as **B**, and the results area shows both with deltas. Comparisons are shareable via URL.

## Product decisions

| Topic | Decision |
| ----- | -------- |
| Layout | "Pin & Compare" — one config editor; live pool = B, pinned snapshot = A |
| Compare scope | Full: overlaid Attack + Wounds distribution charts, A/B/Δ summary stats, side-by-side cumulative tables |
| Controls | **Pin as A**, **Clear / Exit compare**, editable A/B labels. No Swap. |
| Δ coloring | Green when B is the better/cheaper pick, red when worse; per-metric direction |
| Sharing | Encode both A and B in the URL fragment; existing single-pool links keep working |
| Engine | No probability/simulation math changes; reuse `calculateAttackPool` / `calculateWounds` |

## Architecture

### Data model
- Introduce a `PoolConfig` type capturing all current pool inputs (the existing `simulationInputs` object in `App.tsx` is effectively this shape: `pool`, `surge`, all keyword/token string fields, `pointCost`, defense fields).
- Add a pure helper in a new `src/poolResults.ts`: `computePoolResults(config: PoolConfig): { results: AttackResults; woundsResults: WoundsResults }` that does the numeric parsing (the `*Num` derivations currently inline in `App.tsx`) and calls `calculateAttackPool` + `calculateWounds`. This is the seam that lets two pools be computed identically.

### State & controls (`App.tsx`)
- Existing per-input `useState` continues to drive the **live** pool (B).
- New state: `pinnedConfig: PoolConfig | null`, `labelA: string` (default `"A"`), `labelB: string` (default `"B"`).
- **Pin as A** → snapshot the current live `PoolConfig` into `pinnedConfig`; enter compare mode.
- **Clear / Exit compare** → `pinnedConfig = null`; return to the existing single-pool results view.
- `handleReset` also clears `pinnedConfig` and resets labels.
- Compare mode is active iff `pinnedConfig !== null`.

### Results UI
- New `ComparisonResults` component, rendered only in compare mode (otherwise the current single-pool results render unchanged):
  - **Delta summary table** — columns: A, B, Δ(B−A). Rows mirror the full set of summary stats already shown today: Avg hits, Avg crits, Avg total, Pts/success, Avg wounds, Pts/wound. Δ cell colored green/red by metric direction (higher damage/successes = better; lower pts-per-success and pts-per-wound = better). Pts/success and Pts/wound rows only appear when at least one pool has a point cost > 0, and a pool's cell is blank when that pool has no cost.
  - **Overlaid Attack distribution** and **overlaid Wounds distribution**.
  - **Side-by-side cumulative tables** — "At least N successes" and "At least N wounds", each with A and B columns.
- Extend `DistributionChart`: optional second series props (`secondaryDistribution`, `secondaryColor`, series labels). When absent, behavior is identical to today (single `<Bar>`). When present, render two `<Bar>`s aligned on the shared `total` domain (union of both distributions' x-values, missing buckets = 0) plus a legend using the A/B labels. Colors: A = `#2563eb` (blue), B = `#f59e0b` (amber).
- Extend `CumulativeTable`: optional secondary column (`secondary`, header label). Single-column behavior unchanged when omitted.

### URL sharing (`urlState.ts`)
- Keep the **live pool (B)** serialized with today's bare keys via the existing `buildFragment`/`parseFragment` — this preserves backward compatibility for all existing shared links.
- Serialize the **pinned pool A** under `a.`-prefixed keys by composing the existing per-pool logic with a key-prefixing wrapper (e.g. `a.r`, `a.crit`, `a.dColor`…). Defaults are omitted exactly like the live pool.
- Add top-level keys: `cmp` (`1` when compare mode active), `la` (label A), `lb` (label B). `la`/`lb` are omitted when equal to defaults `"A"`/`"B"`.
- On load: if `cmp=1`, parse the `a.`-prefixed set into `pinnedConfig`; otherwise compare mode is off and only the bare keys are read (today's behavior).

## Components & files

| File | Change |
| ---- | ------ |
| `src/types.ts` | Add `PoolConfig` type |
| `src/poolResults.ts` (new) | Add `computePoolResults(config)` helper |
| `src/App.tsx` | `pinnedConfig`/label state, Pin & Clear controls, render `ComparisonResults` in compare mode, reset wiring, URL wiring |
| `src/components/ComparisonResults.tsx` (new) | Delta table + overlaid charts + side-by-side cumulative |
| `src/components/DistributionChart.tsx` | Optional second series + legend |
| `src/components/CumulativeTable.tsx` | Optional secondary column |
| `src/urlState.ts` | `a.`-prefixed pool A, `cmp`, `la`, `lb`; prefix wrapper reusing existing parse/build |

## Testing

- `urlState` round-trip: bare B only (existing behavior unchanged); compare mode with A + B + labels; defaults omitted; legacy link without `cmp` loads single-pool.
- `computePoolResults`: matches direct `calculateAttackPool`/`calculateWounds` output for a sample config.
- Delta computation: correct Δ values and color direction for damage stats vs pts/wound; pts/wound hidden when cost is 0.
- Chart/table data shaping: union of x-values across A and B, missing buckets = 0.
- Existing probability/simulation tests unchanged.

## Out of scope

- Swap A⇄B control.
- Comparing more than two pools.
- Extracting a standalone `PoolEditor` component (editor JSX stays in `App.tsx`).
- The share card / image export feature (separate spec).
