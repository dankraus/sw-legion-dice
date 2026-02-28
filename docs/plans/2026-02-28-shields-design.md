# Shield Tokens – Design

## Goal

Add **Shield tokens** for defense. Each token cancels one **hit** or one **crit** after cover (and armor/backup), before the defense roll. Applied **before** dodge; optimal use is modeled as cancelling crits first, then hits. Input is unbounded, non-negative; effective use is capped by (hits + crits) per outcome.

## Rules

- One shield token cancels one hit or one crit for that roll.
- Shields are applied after cover (and armor/backup) but before the defense dice roll—same phase as dodge.
- **Order:** Shields first, then dodge. Dodge still cancels hits only (or hits+crits when Outmaneuver is on).
- Optimal use: cancel crits first, then hits. Extra tokens beyond (hits + crits) have no effect for that outcome.

## Architecture

**Types**

- No new public types. `calculateWounds` gains optional `shieldTokens?: number` (default 0). Normalized as non-negative integer.

**Engine**

- **simulateWounds** and **simulateWoundsFromAttackResults:** Add parameter `shieldTokens: number`. After computing `afterCover`, armor, and backup (giving `hitsAfterBackup`, `afterCover.crits`):
  - **Shields first (optimal: crits then hits):**
    - `critsAfterShields = max(0, afterCover.crits - shieldTokens)`
    - `hitsAfterShields = max(0, hitsAfterBackup - max(0, shieldTokens - afterCover.crits))`
  - **Then dodge** on remaining hits only (outmaneuver only affects dodge, not shield math):
    - `hitsAfterDodge = max(0, hitsAfterShields - dodgeTokens)` (or combined pool when outmaneuver)
    - `defenseDice = hitsAfterDodge + critsAfterShields`
- **calculateWounds** (probability.ts): Add optional `shieldTokens?: number` (default 0); pass through to simulate calls.

## UI

- **Placement:** Defense section, under "Tokens" subheading, add **Shields** control immediately **before** Dodge. Same pattern as Dodge.
- **Control:** `NumberInputWithControls`, id `shield-tokens`, label "Shields", min 0, no max. State: string (e.g. `shieldTokens`), parsed to non-negative integer for the engine.
- **Tooltip:** e.g. "Cancel one hit or one crit per token before rolling defense (applied after cover, before dodge)."
- **Reset:** Include shield tokens in the Reset handler.
- **Legion Quick Guide:** Omit `guideAnchor` unless Shields is added to the guide.

## URL State

- Add key to `UrlState` (e.g. `shield`), default `0`. Parse in `parseFragment` with `parseNumber(get('shield'), DEFAULT_URL_STATE.shield)`.
- In `App.tsx`: init from URL in Shields `useState` (same pattern as dodge: empty string for 0 when from URL), add field to `urlState` useMemo and dependency array, include in `handleReset`.

## Data Flow

1. User sets attack pool and defense options including Shields (and Dodge).
2. App calls `calculateWounds(..., shieldTokensNum, ...)`.
3. Engine applies shields first (crits then hits), then dodge, then defense roll. Wounds summary and charts update when shield tokens or other inputs change.

## Edge Cases

- **shieldTokens = 0:** Unchanged behavior; no regression.
- **shieldTokens ≥ (hits + crits) for an outcome:** All cancelled; defense dice = 0 for that outcome.
- **All outcomes 0 hits and 0 crits:** Shields have no effect.

## Testing

- Wounds with 0 shields match current behavior (no regression).
- One outcome: e.g. 2 hits, 1 crit, 1 shield → shields cancel 1 crit → 2 hits, 0 crits remaining; defense dice = 2 (minus dodge). Verify expected wounds.
- Shields-first then dodge: e.g. 1 hit, 1 crit, 1 shield, 1 dodge → after shields: 1 hit, 0 crits; after dodge: 0 hits → 0 defense dice.
- More shield tokens (or shields + dodge) reduces expected wounds.
