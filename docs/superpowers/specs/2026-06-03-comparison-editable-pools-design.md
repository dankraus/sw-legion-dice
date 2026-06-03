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
3. Current editor state (immediate, not debounced) is copied to `pinnedConfig` (pool A) and `cachedPoolB` (pool B).
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
2. If `activePool === 'A'`, load **cached pool B** into the editor (hooks must not stay on A’s values).
3. `pinnedConfig` cleared; `cachedPoolB` cleared; compare UI hidden.
4. Editor shows pool B (bare URL keys). Pool A discarded.
5. Compare bar shows single-pool entry button again.

### Reset

Unchanged: **Reset** clears compare mode, labels, `activePool`, `cachedPoolB`, and all pool inputs.

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
| `cachedPoolB: PoolConfig \| null` | In-memory pool B while comparing; source of truth for B when editor is on A tab |
| `activePool: 'A' \| 'B'` | Which pool the editor targets (only meaningful when comparing) |
| `labelA`, `labelB` | Display names; drive tab text and snapshot headers |
| Existing per-field `useState` | Editor UI; always reflects the **active** pool when comparing; equals pool B when not comparing |

Compare mode is active iff `pinnedConfig !== null`.

**Lifecycle:**

- Enter compare: `activePool = 'B'`; `cachedPoolB = readConfigFromEditor()` (same as B at pin time).
- URL load with `cmp=1`: `activePool = 'B'`; `cachedPoolB = poolStateToConfig(parsed bare keys)`.
- Exit compare: restore B into editor from `cachedPoolB` if needed; clear `pinnedConfig`, `cachedPoolB`; `activePool` unused until next compare.
- Reset: clear compare state including `activePool` and `cachedPoolB`.

### Resolving config A and B

Editor hooks alone are **not** always pool B during compare. Derive display configs explicitly:

```ts
const editorConfig = readConfigFromEditor(simulationInputs); // immediate, not debounced

const configA = pinnedConfig!; // when comparing
const configB =
  activePool === 'B'
    ? editorConfig
    : cachedPoolB ?? editorConfig;
```

Use **debounced** variants only for expensive results (`computePoolResults`), keyed off the same `configA` / `configB` resolution so snapshots and charts stay stable.

### Tab switch persistence

The editor uses one set of input state hooks. Switching tabs must not lose edits.

Add pure helpers (new file `poolConfigEditor.ts`):

- `applyConfigToEditor(config, setters)` — load a `PoolConfig` into all editor fields.
- `readConfigFromEditor(inputs)` — build `PoolConfig` from current hook values (extract from today’s `liveConfig` derivation).

**On tab change** (`A` ↔ `B`):

1. Read current editor → `PoolConfig` (`outgoing`).
2. If leaving **B**: `setCachedPoolB(outgoing)`.
3. If leaving **A**: `setPinnedConfig(outgoing)`.
4. Load target pool into editor: from `cachedPoolB` when switching to B, from `pinnedConfig` when switching to A.

When editing **B** (`activePool === 'B'`): each change updates editor hooks; also `setCachedPoolB(editorConfig)` so B stays cached if user switches away.

When editing **A** (`activePool === 'A'`): each change updates editor hooks **and** `setPinnedConfig(editorConfig)` immediately so snapshots and `a.*` URL keys stay live. Debounce applies only to `computePoolResults`, not to `pinnedConfig` / URL.

### URL sync (`urlState` useMemo)

Bare keys (pool B) must **never** serialize the editor while `activePool === 'A'`.

| Compare state | Bare keys source | `a.*` keys source |
| ------------- | ---------------- | ----------------- |
| Off | Editor hooks (today) | — |
| On, editing B | Editor hooks | `pinnedConfig` |
| On, editing A | `cachedPoolB` | `pinnedConfig` (synced from editor) |

This preserves the contract: B = bare keys, A = `a.*`, with no schema changes.

### Downstream consumers

| Consumer | Pool B source | Pool A source |
| -------- | ------------- | ------------- |
| `ComparisonResults` | `configB` (resolved above) | `configA` = `pinnedConfig` |
| `ShareModal` `live` | Always `configB` | `pinned` when comparing |
| `urlState` | Bare keys per table above | `configToPoolState(pinnedConfig)` |

### Enter compare (pin)

Pin from **immediate** `readConfigFromEditor(simulationInputs)`, not debounced `liveConfig`, so a quick edit + Compare does not snapshot stale values.

Set `pinnedConfig = editorConfig`, `cachedPoolB = editorConfig`, `activePool = 'B'`.

### Results computation

```ts
const configA = pinnedConfig;
const configB = activePool === 'B' ? debouncedLiveConfig : cachedPoolB;
// debouncedLiveConfig = debounced editor when activePool === 'B'
```

`computePoolResults(configA)` and `computePoolResults(configB)`; render `ComparisonResults`.

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
- Add `cachedPoolB`, `activePool` state and lifecycle rules above.
- Render `ComparePoolBar` at top of `app__pool`.
- Wire compare start/end, tab switch with persistence helpers.
- Gate `urlState` bare keys on `activePool` / `cachedPoolB`.
- Pass resolved `configA` / `configB` and `activePool` to results and share.

### `src/poolConfigEditor.ts` (new)

Pure helpers: `readConfigFromEditor`, `applyConfigToEditor`.

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
- **Tab switch**: edit B → switch to A → edit A → B snapshot/deltas still show B; switch back—B retains prior value; A reflects edits.
- **URL while on A tab**: edit A; bare URL keys unchanged (still B); `a.*` keys update.
- **Share round-trip**: edit A, share URL, reload—A and B both correct.
- **Enter / exit**: pin uses immediate editor state; exit on A tab restores B in editor; exit on B tab keeps B.
- **Rapid tab switch**: edits persist before debounce completes.
- **PoolSnapshotCard**: active state shows Editing pill; inactive does not; optional click fires `onSelect`.
- **App / integration**: Pin button absent from header; compare bar present in pool section.
- Existing delta/chart tests updated where they assume editor always equals B.

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
