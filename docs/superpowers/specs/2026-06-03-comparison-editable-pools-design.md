# Comparison Editable Pools — Design

**Date:** 2026-06-03

## Goal

Let users edit **both** pools (A and B) while comparing, with UI that makes compare mode discoverable, shows which pool is active, and keeps compare controls next to the pool editor—not in the app header.

## Product decisions

| Topic | Decision |
| ----- | -------- |
| Edit model | One config column; **A/B tabs** switch which pool the editor reads/writes |
| Tab labels | Tab text = `labelA` / `labelB` (fallback `"A"` / `"B"` when empty); truncate with ellipsis + `title` tooltip when long |
| Enter compare | **Compare bar** at top of config column: heading + **Compare against this setup** button (replaces header **Pin as A**) |
| Exit compare | **End compare** control (text or ✕) in the compare bar; removes pinned A; editor keeps pool B values |
| Default active tab | **B** when entering compare (user typically tunes the variant) |
| Compare chrome placement | Top of config column (`app__pool`), above Attack Pool heading |
| Pin / Clear location | Removed from header; only in compare bar |
| Snapshot cards | Remain read-only summaries in results column; **active** card highlighted with accent border, tinted background, and **Editing** pill; inactive card slightly muted |
| Optional affordance | Click inactive snapshot card → switch to that pool’s tab |
| Visual identity | A = blue (`#2563eb`), B = amber (`#f59e0b`) — unchanged |
| URL / share | No schema changes — B = bare keys, A = `a.*`, `cmp`, `la`, `lb` as today |
| Header actions | Quick Roll, Share, Reset only |

## User flows

### Enter compare (single-pool mode)

1. User configures a pool in the config column.
2. User clicks **Compare against this setup** in the compare bar (disabled when `totalDice === 0`, same as today’s Pin button).
3. Current `liveConfig` is copied to `pinnedConfig` (pool A).
4. Compare mode activates; active tab = **B**; results show A vs B snapshots and deltas.
5. Editor continues showing B (same values as at pin time until user changes them).

### Switch pools

1. User clicks tab labeled with `labelA` or `labelB`.
2. Outgoing pool is persisted (see **Tab switch persistence** below).
3. Incoming pool’s values load into the editor controls.
4. Compare bar subline updates: `Editing: {label}` with pool accent color.
5. Matching snapshot card shows **Editing** state.

### Exit compare

1. User clicks **End compare** in the compare bar.
2. `pinnedConfig` cleared; compare UI hidden.
3. Editor remains on pool B values (bare URL keys). Pool A discarded.
4. Compare bar shows single-pool entry button again.

### Reset

Unchanged: **Reset** clears compare mode, labels, and all pool inputs.

## Compare bar UI

### Single-pool mode

```
Compare pools
[ Compare against this setup ]
```

- Short heading (`Compare pools`) + primary button.
- Button pins current setup as A and enters compare mode.

### Compare mode

```
[ {labelA} ] [ {labelB} ]     End compare
Editing: {activeLabel}
```

- Segmented tab control: active tab filled with pool accent; inactive tab outline/ghost.
- **End compare** aligned to the right of the tab row (secondary / subtle destructive).
- Subline under tabs: `Editing: {label}` with accent color on label or leading marker.
- Config column may use a matching accent left border while in compare mode (optional, same color as active pool).

## Snapshot card active state

Extend `PoolSnapshotCard`:

| State | Treatment |
| ----- | ----------- |
| Active | Stronger accent border, light tinted background, **Editing** pill in header |
| Inactive | Default border, slightly reduced contrast; no pill |
| Click (optional) | Whole card clickable except label input; calls `onSelect` to switch tab |

Labels remain editable in the card header; tab text updates as the user types.

## Architecture

### State (`App.tsx`)

| State | Purpose |
| ----- | -------- |
| `pinnedConfig: PoolConfig \| null` | Pool A; `null` = not comparing |
| `activePool: 'A' \| 'B'` | Which pool the editor targets (only meaningful when comparing) |
| `labelA`, `labelB` | Display names; drive tab text and snapshot headers |
| Existing per-field `useState` | Editor UI; represents **pool B** when not comparing; represents **active pool** when comparing |

Compare mode is active iff `pinnedConfig !== null`.

On enter compare: set `activePool = 'B'`.

On exit compare: clear `pinnedConfig`; do not change B’s editor values.

### Tab switch persistence

The editor uses one set of input state hooks. Switching tabs must not lose edits.

Add pure helpers (new file or `poolConfigEditor.ts`):

- `configToEditorState(config: PoolConfig)` → object of values matching all editor setters (mirror `poolStateToConfig` / `configToPoolState` field mapping).
- `applyConfigToEditor(config, setters)` — load a `PoolConfig` into all editor fields.
- `readConfigFromEditor(editorState)` — build `PoolConfig` from current hook values (today’s `liveConfig` derivation).

**On tab change** (`A` → `B` or `B` → `A`):

1. Read current editor → `PoolConfig`.
2. If leaving **A**, write to `setPinnedConfig`; if leaving **B**, values already live in editor hooks (B syncs to URL via existing debounced path).
3. Load target pool into editor via `applyConfigToEditor`.

When editing **A** while active, updates go to editor hooks **and** `pinnedConfig` should stay in sync. Simplest approach: on any editor change while `activePool === 'A'`, also update `pinnedConfig` from `readConfigFromEditor` (debounced like B). Alternative: only flush on tab switch—prefer **continuous sync while on A tab** so snapshots and results update live.

When editing **B**, existing URL sync unchanged.

### Results computation

Unchanged:

- `configA = pinnedConfig`
- `configB = liveConfig` (from debounced editor state)
- `computePoolResults` for each; render `ComparisonResults`.

### New component: `ComparePoolBar.tsx`

Props:

```ts
type ComparePoolBarProps =
  | {
      mode: 'single';
      onStartCompare: () => void;
      startDisabled: boolean;
    }
  | {
      mode: 'compare';
      labelA: string;
      labelB: string;
      activePool: 'A' | 'B';
      onActivePoolChange: (pool: 'A' | 'B') => void;
      onEndCompare: () => void;
    };
```

Styles in `ComparePoolBar.css`. Render as first child inside `app__pool`.

### `ComparisonResults.tsx`

Pass through:

- `activePool`
- `onSelectPoolA` / `onSelectPoolB` (optional card click → set active tab)

### `PoolSnapshotCard.tsx`

New optional props: `isActive`, `onSelect` (card click handler; ignore when clicking label input).

### `App.tsx`

- Remove Pin / Clear compare buttons from `app__header-actions`.
- Render `ComparePoolBar` at top of `app__pool`.
- Wire `handlePin` → compare bar start; `handleClearCompare` → end compare.
- Implement tab switch handler with persistence helpers.
- Pass `activePool` and select handlers to `ComparisonResults`.

## UI order

### Config column

1. Compare bar (entry or tabs + editing subline)
2. Attack Pool + Defense sections (unchanged controls)

### Results column (compare mode)

1. Side-by-side snapshot cards (A | B) with active highlighting
2. Delta summary table
3. Overlaid charts and cumulative tables

## Accessibility

- Tabs: `role="tablist"`, each tab `role="tab"`, `aria-selected`, keyboard arrow navigation between A/B.
- **End compare**: clear accessible name (`Exit compare mode`).
- Active snapshot: `aria-current="true"` or `data-active` for tests; optional `aria-label` including “editing”.
- Long tab labels: visible truncated text + `title` with full label.

## Testing

- **ComparePoolBar**: single mode renders start button; compare mode renders both tab labels and End compare; clicking tabs calls handler.
- **Tab switch**: edit a field on B, switch to A, edit A, switch back—B retains prior value; A reflects edits; snapshots update.
- **Enter / exit**: start compare pins A, lands on B tab; exit clears compare, B values preserved.
- **PoolSnapshotCard**: active state shows Editing pill; inactive does not; optional click fires `onSelect`.
- **App / integration**: Pin button absent from header; compare bar present in pool section.
- Existing URL round-trip and delta/chart tests unchanged.

## Out of scope

- Swap A⇄B.
- Inline editing on snapshot cards (values stay in config column).
- Second full config column.
- Persisting `activePool` in URL.
- Sticky compare bar (can add later).
- First-run tooltip (“Switch tabs to edit each pool”).

## Supersedes

Partially updates the edit model documented in:

- `2026-06-03-comparison-pool-snapshots-design.md` — snapshots remain read-only; **both pools editable via tabs** (was: only B).
- `2026-06-03-comparison-pin-and-compare-design.md` — compare controls move from header to **compare bar**; user can edit A as well as B.
