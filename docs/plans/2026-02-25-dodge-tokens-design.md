# Dodge Tokens – Design

## Goal

Add **Dodge tokens** for defense. Each token cancels one **hit** before defense dice are rolled; crits cannot be dodged. Defense dice = **crits + max(0, hits − dodgeTokens)**. Input is unbounded, non-negative; effective use is capped by hits (extra tokens do nothing).

## Rules

- One dodge token cancels one hit for that roll.
- Crits are never cancelled by dodge.
- Dodge is applied before rolling defense (reduces how many defense dice are rolled).
- If dodge tokens ≥ hits for an outcome, only that many hits are cancelled; remaining tokens are unused.

## Architecture

**Types**

- **AttackResults:** Add `distributionByHitsCrits: { hits: number; crits: number; probability: number }[]`. Existing fields unchanged.
- **calculateWounds:** Add optional `dodgeTokens?: number` (default 0). Normalized as non-negative integer.

**Engine**

- **calculateAttackPool:** In the same loop that aggregates by total, also aggregate by (hitsFinal, critsFinal) into a structure (e.g. Map keyed by `"hits,crits"`), then expose as `distributionByHitsCrits` on the result.
- **calculateWounds:** Accept `dodgeTokens` (default 0). Iterate over `distributionByHitsCrits`. For each (hits, crits, probability), set `defenseDice = crits + Math.max(0, hits - dodgeTokens)`. Dodged hits are cancelled, so the effective attack total that can cause wounds equals the number of undodged successes, i.e. `defenseDice`. Get defense distribution for that count; wounds for that outcome = max(0, defenseDice - defenseTotal). Merge into wounds distribution. When dodgeTokens === 0, defenseDice = hits + crits (current behavior).

## UI

- **Placement:** In the Defense section, after the Defense dice (Red/White) radio group and Defense Surge toggle. Add a "Tokens" subheading, then a Dodge control (same pattern as Attack Tokens).
- **Control:** `NumberInputWithControls`, id `dodge-tokens`, label "Dodge", min 0, no max. State: string (e.g. `dodgeTokens`), parsed to non-negative integer for the engine.
- **Tooltip:** e.g. "Cancel one hit per token before rolling defense; crits cannot be dodged."
- **Reset:** Include dodge in the Reset handler.

## Data Flow

1. User sets attack pool, attack options; in Defense: dice color, Defense Surge, Dodge count.
2. App calls `calculateAttackPool(...)`; result includes `distributionByHitsCrits`.
3. App calls `calculateWounds(results, defenseDieColor, defenseSurge, dodgeTokensNum)`.
4. Engine uses `distributionByHitsCrits` to compute defense dice per outcome, then wounds. Wounds summary and charts update when dodge or other inputs change.

## Edge Cases

- **dodgeTokens = 0:** Unchanged behavior; no regression.
- **dodgeTokens > hits for an outcome:** Defense dice = crits only for that outcome; extra tokens have no effect.
- **All outcomes 0 hits:** Dodge has no effect; defense dice = crits only.

## Testing

- Wounds with dodge 0 match current `calculateWounds` (no dodge).
- One outcome: e.g. 3 hits, 1 crit, 1 dodge → 3 defense dice; verify wounds distribution.
- Outcome with more dodge than hits: e.g. 1 hit, 2 crits, 5 dodge → 2 defense dice.
- `distributionByHitsCrits` sums to 1 and is consistent with the 1D total distribution (marginals).
