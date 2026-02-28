# URL Fragment Share — Design

**Date:** 2026-02-28

## Goal

Users can share links that open the app with the same inputs and selections. Settings are encoded in the URL fragment (hash). The URL stays in sync on every change, and a "Copy link" button copies the current URL to the clipboard.

## Decisions

- **When to update URL:** On every state change (sync) and via a "Copy link" button.
- **What to encode:** Only non-default values so links stay short; parser fills defaults for missing keys.
- **Encoding:** Query string in the hash (e.g. `#r=2&b=1&surge=hit`) with short keys. Use `history.replaceState` so the back button is not spammed.

## Architecture and data flow

- **State stays in React.** All existing `useState` in `App.tsx` remain the single source of truth.
- **Init:** On first mount, if `window.location.hash` is non-empty, parse it into a key/value map, apply defaults for missing keys, validate values, then set all React state once. If the hash is empty or missing, leave state as today’s defaults.
- **Sync:** On every state change, derive the current serializable settings from state, omit defaults, build a query string, and set the hash via `history.replaceState` so the URL reflects the current config without adding history entries.
- **Copy link:** A "Copy link" control (e.g. in the header) copies `window.location.href` to the clipboard.
- **Module:** Add `src/urlState.ts` with `parseFragment(hash: string)` and `buildFragment(state)` (or equivalent state shape). All hash read/write and key names live there; `App.tsx` stays about UI and state.

## Key names and encoding

| State | Key | Serialized | Default (omit when equal) |
|-------|-----|------------|----------------------------|
| pool.red | `r` | integer string | `0` |
| pool.black | `b` | integer string | `0` |
| pool.white | `w` | integer string | `0` |
| surge | `surge` | `none`, `hit`, `crit` | `none` |
| criticalX | `crit` | string | `""` |
| surgeTokens | `sTok` | integer string | `""` / 0 |
| aimTokens | `aim` | integer string | `""` / 0 |
| observeTokens | `obs` | integer string | `""` / 0 |
| preciseX | `precise` | integer string | `""` / 0 |
| ramX | `ram` | integer string | `""` / 0 |
| sharpshooterX | `sharp` | integer string | `""` / 0 |
| pierceX | `pierce` | integer string | `""` / 0 |
| impactX | `impact` | integer string | `""` / 0 |
| pointCost | `cost` | string | `""` |
| defenseDieColor | `dColor` | `red`, `white` | `red` |
| defenseSurge | `dSurge` | `none`, `block` | `none` |
| defenseSurgeTokens | `dSurgeTok` | integer string | `""` / 0 |
| dodgeTokens | `dodge` | integer string | `""` / 0 |
| outmaneuver | `out` | `1` / `0` | `0` |
| cover | `cover` | `none`, `light`, `heavy` | `none` |
| lowProfile | `lowProf` | `1` / `0` | `0` |
| suppressed | `sup` | `1` / `0` | `0` |
| coverX | `coverX` | integer string | `""` / 0 |
| armorX | `armor` | integer string | `""` / 0 |
| impervious | `imp` | `1` / `0` | `0` |
| suppressionTokens | `suppTok` | integer string | `""` / 0 |
| dangerSenseX | `danger` | integer string | `""` / 0 |
| backup | `backup` | `1` / `0` | `0` |

- **Build:** For each key, if value equals default, skip. Otherwise append `key=encodeURIComponent(value)`; join with `&`; use as `location.hash` (with leading `#`).
- **Parse:** Strip `#`, parse with `URLSearchParams`. Unknown keys ignored. Coerce to correct type; invalid or out-of-range values fall back to default for that key.

## Init from URL and error handling

- **When:** Only on initial load. If hash is empty or `#` only, skip.
- **Validation:** Enums → if value not allowed, use default. Numbers → parse as integer; NaN or negative → 0; clamp to bounds (e.g. coverX 0–2). Booleans → `1` or `true` (case-insensitive) = true, else false. Strings → use as-is or treat invalid `crit` as empty.
- **No error UI:** Invalid or outdated links silently fall back to defaults.
- **Single source of defaults:** Define default state in one place so reset and parse fragment both use the same defaults.

## Sync to URL and Copy link

- **When we write:** After any state change that affects serialized config. `useEffect` depending on all serialized state; build fragment and set hash via `history.replaceState`. No debouncing.
- **ReplaceState only:** Do not use `pushState` when syncing.
- **Copy link button:** In header (e.g. next to Reset). Label: "Copy link" or "Share". On click: `navigator.clipboard.writeText(window.location.href)`; optional brief "Copied!" feedback. If clipboard API fails, no toast; optional fallback: prompt with URL pre-selected.
- **Empty config:** When all defaults, fragment is empty; URL has no hash. Copy link still copies base URL.
