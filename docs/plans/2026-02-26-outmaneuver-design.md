# Outmaneuver Keyword – Design

## Goal

Add an **Outmaneuver** toggle for defense. When on, Dodge tokens can cancel crits as well as hits; defense dice = **max(0, (hits + crits) − dodgeTokens)**. When off, behavior is unchanged: dodge cancels hits only; defense dice = **crits + max(0, hits − dodgeTokens)**.

## Rules

- **Outmaneuver off (default):** One dodge token cancels one hit. Crits cannot be dodged. Defense dice = crits + max(0, hits − dodge).
- **Outmaneuver on:** One dodge token cancels one success (hit or crit). Defense dice = max(0, (hits + crits) − dodge). Order of application is irrelevant for the dice count.

## Architecture

**Engine**

- **simulate.ts:** Add `outmaneuver: boolean` to `simulateWounds` and `simulateWoundsFromAttackResults`. When true, set `defenseDice = Math.max(0, final.hits + final.crits - normalizedDodge)` (and analogously for the attack-results path). When false, keep current formula: `defenseDice = final.crits + Math.max(0, final.hits - normalizedDodge)`.
- **probability.ts:** `calculateWounds(..., dodgeTokens?, outmaneuver?)` — add optional `outmaneuver` (default false), pass through to `simulateWoundsFromAttackResults`.

**UI**

- **State:** One boolean `outmaneuver`, default `false`.
- **Control:** Checkbox or toggle in the Defense section (e.g. near Dodge), label "Outmaneuver", tooltip: "Dodge tokens can cancel crits as well as hits."
- **Reset:** Set `outmaneuver` to `false` in the same handler that clears dodge/defense options.
- **Wiring:** Pass `outmaneuver` into `calculateWounds`; include in wounds `useMemo` dependency array.

## Data Flow

1. User sets Defense: dice color, Defense Surge, Dodge count, Outmaneuver on/off.
2. App calls `calculateWounds(results, defenseDieColor, defenseSurge, dodgeTokensNum, outmaneuver)`.
3. Engine uses the chosen formula per (hits, crits, dodge) to compute defense dice per outcome, then wounds. Wounds update when outmaneuver or other inputs change.

## Edge Cases

- **Outmaneuver off:** No behavior change; backward compatible.
- **Outmaneuver on, dodge ≥ hits + crits:** Defense dice = 0.
- **Outmaneuver on, 0 dodge:** defenseDice = hits + crits (same as off when dodge is 0).

## Testing

- Outmaneuver off: wounds match current behavior (existing dodge tests unchanged).
- Outmaneuver on, one outcome (e.g. 1 hit, 1 crit, 1 dodge): defense dice = 1; verify expected wounds.
- Outmaneuver off, same outcome: defense dice = 2; verify expected wounds higher than with Outmaneuver on.
- Toggling Outmaneuver changes expected wounds when there are crits and dodge tokens.
