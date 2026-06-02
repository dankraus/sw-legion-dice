# Assault X Keyword (Attack) — Design

**Date:** 2026-06-01

## Goal

Add **Assault X** as an attack keyword that upgrades attack dice in the pool before rolling. Users see both their configured (pre-Assault) pool and the effective pool used for simulation.

## Decisions

| Topic | Choice |
|-------|--------|
| Upgrade chain | Black → red first; then white → black; red never upgraded |
| Range 1 | Documented in tooltip only; no toggle (user sets Assault when it applies) |
| Pool in UI | Dice selectors keep **base** (pre-Assault) counts |
| Effective pool | Read-only summary under Attack Pool dice selectors |
| Assault input | Attack **Keywords** section (with Critical, Ram, etc.) |
| Engine approach | Exported `applyAssaultToPool`; App derives effective pool before `calculateAttackPool` |
| Legion Quick Guide | `guideAnchor="assault-x"` → https://legionquickguide.com/#assault-x |
| URL key | `assault` (number, default 0) |

## Behavior

- **Assault X:** Non-negative integer; empty, invalid, or negative → 0 (same normalization as Ram X).
- **When:** Before any attack dice are rolled (pool modification only). Does not affect defense or wounds logic except via changed attack results.
- **Upgrade order (up to X total upgrades):**
  1. Convert black dice to red: `blackToRed = min(X, pool.black)`.
  2. Convert white dice to black with remaining capacity: `whiteToBlack = min(X - blackToRed, pool.white)`.
- **Never upgraded:** Red dice.
- **Cap:** At most `pool.black + pool.white` upgrades.
- **Optimal play:** Always apply full legal upgrades (deterministic; no “decline upgrade” modeling).
- **Pool scope:** Upgrades apply to the displayed attack pool; user enters dice that Assault can affect (same responsibility model as other keywords).

### Examples

| Base pool (R/B/W) | Assault | Effective (R/B/W) |
|-------------------|---------|-------------------|
| 0/2/0 | 1 | 1/1/0 |
| 0/0/2 | 1 | 0/1/1 |
| 0/1/2 | 2 | 1/1/1 |
| 1/2/1 | 3 | 2/1/0 |
| 2/0/0 | 5 | 2/0/0 (no upgradeable dice) |

## Architecture

### Engine

- **`src/engine/assault.ts`** — `applyAssaultToPool(basePool: AttackPool, assaultX: number): AttackPool`.
- **No changes** to `simulateAttackPool`, `calculateAttackPool` signatures, Ram, Critical, or wounds simulation beyond App passing the transformed pool.
- Import `applyAssaultToPool` from `assault.ts` in App and tests (no barrel re-export required).

```ts
export function applyAssaultToPool(
  basePool: AttackPool,
  assaultX: number
): AttackPool {
  const capacity = Math.max(0, Math.floor(assaultX ?? 0) || 0);
  const blackToRed = Math.min(capacity, basePool.black);
  const remaining = capacity - blackToRed;
  const whiteToBlack = Math.min(remaining, basePool.white);
  return {
    red: basePool.red + blackToRed,
    black: basePool.black - blackToRed + whiteToBlack,
    white: basePool.white - whiteToBlack,
  };
}
```

### App

- State: `assaultX` (string), derived `assaultXNum` (same pattern as `ramX`).
- `effectivePool = useMemo(() => applyAssaultToPool(pool, assaultXNum), [pool, assaultXNum])`.
- `calculateAttackPool(effectivePool, …)` — include `effectivePool` in `useMemo` deps (not raw `pool` alone for attack results).
- `totalDice` for display/empty checks: may stay on **base** `pool` (Assault only recolors dice; total count unchanged).
- Reset: clear `assaultX` to `''`.

### Effective pool summary (UI)

- Render below the three `DiceSelector` rows, above Attack Surge toggle.
- Visible when `assaultXNum > 0` and any of `effective.red !== pool.red`, `effective.black !== pool.black`, or `effective.white !== pool.white`.
- Copy example: **Rolling:** 2 red, 1 black, 1 white (muted helper text; class e.g. `.app__effective-pool`).
- Omit line when Assault is 0 or upgrades change nothing.

## UI

- **`NumberInputWithControls`** in Keywords section:
  - `id="assault-x"`, `label="Assault"`, `min={0}`
  - `guideAnchor="assault-x"`
  - `title` (tooltip): *Upgrade up to X attack dice when the defender is within range 1: black dice to red first, then white dice to black. Red dice cannot be upgraded.*
- **Placement:** After **Ram**, before Sharpshooter.
- Always enabled (like Ram).

## URL state

Per `url-state-new-inputs` rule:

- `UrlState.assault: number`, default `0`
- Parse/build key `assault`
- Init `assaultX` from `initialFromUrl?.assault`
- Include in `urlState` useMemo and `handleReset`

**Important:** Fragment encodes **base** pool (`r`, `b`, `w`) and `assault` separately; shared links reconstruct the same effective pool.

## Testing

- **`src/engine/__tests__/assault.test.ts`**:
  - Identity when assault 0
  - Black → red only
  - White → black only (no black in pool)
  - Mixed order (black first, then white)
  - Cap when X > black + white
  - Negative / non-integer assault → 0
- **Integration:** `calculateAttackPool` on `{1,1,0}` direct vs `applyAssaultToPool({0,2,0}, 1)` then calculate — same `expectedTotal` (fixed sim seed; exact match).

## Files to touch

| File | Change |
|------|--------|
| `src/engine/assault.ts` | New: `applyAssaultToPool` |
| `src/engine/__tests__/assault.test.ts` | Unit tests |
| `src/App.tsx` | State, effective pool, summary UI, keyword input, wire attack calc |
| `src/App.css` | `.app__effective-pool` helper styles |
| `src/urlState.ts` | `assault` key |
| `src/urlState.test.ts` | Round-trip / parse for `assault` |

## Out of scope

- Range-1 toggle or map/position modeling
- Per-weapon pool split (multiple weapons in one attack)
- Auto-mutating dice selector counts when Assault changes
- Defense / wounds keyword changes

## Verification

- Manual: set 2 black, Assault 1 → summary shows 1 red 1 black; avg totals increase vs no Assault.
- Assault 2 on 1 black 2 white → 1 red, 1 black, 1 white in summary.
- Copy link includes `assault=` and base pool; reload restores same results.
- `npm run test`, `npm run lint`, `npm run build` pass.
