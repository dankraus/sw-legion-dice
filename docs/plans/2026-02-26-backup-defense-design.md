# Backup (Defense) — Design

## Overview

**Backup** is a Defense-section toggle. When enabled, after the cover roll and before rolling defense dice, the defender subtracts up to two hits from the remaining hits (crits unchanged). Fewer hits mean fewer defense dice, so expected wounds decrease when Backup is on.

- **Place in flow:** Attack → (optional Low Profile) → cover roll → **Backup** → dodge/outmaneuver → defense dice count → defense roll → wounds.
- **Effect:** `hitsAfterBackup = backup ? max(0, afterCover.hits - 2) : afterCover.hits`; crits unchanged. Defense dice (and thus wounds) are computed from `(hitsAfterBackup, afterCover.crits)`.
- **Availability:** Backup is always available in the UI (not gated by cover). The tooltip notes: *"Backup is possible for Ranged 3+ shots and removes up to two hits when rolling defense dice."*

## Data and API

- **Input:** `backup?: boolean` (default `false`) on the wounds pipeline.
- **Engine:** `simulateWounds` and `simulateWoundsFromAttackResults` in `simulate.ts` each take a `backup` parameter (default `false`). After `applyCover()`, hits are reduced by up to 2 when `backup` is true; the result is used for defense dice count. `calculateWounds` in `probability.ts` accepts optional `backup` and forwards it.
- **UI:** One checkbox in the Defense section: id `backup`, label "Backup", tooltip as above. State is included in reset.

## Testing

- Existing tests updated to pass `backup: false` at the new argument position.
- New test: with a fixed outcome of 3 hits and 0 crits, Backup on yields lower expected wounds than Backup off (fewer defense dice).

## Files Touched

- `src/engine/simulate.ts` — backup param and `hitsAfterBackup` in both wounds functions.
- `src/engine/probability.ts` — `backup` on `calculateWounds`.
- `src/App.tsx` — state, CheckboxToggle, `calculateWounds` and reset.
- `src/engine/__tests__/simulate.test.ts` — argument updates and backup describe block.
