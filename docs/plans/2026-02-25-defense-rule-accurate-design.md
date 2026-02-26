# Defense Rule-Accurate – Design

**Implemented:** 2026-02-25 (see `docs/plans/2026-02-25-defense-rule-accurate-plan.md`).

## Goal

Model defense by Legion rules: the number of defense dice equals the number of attack successes (hits + crits) for that roll. The user does not set defense pool size; they only choose defense die color (Red | White) and Defense Surge Conversion (None | Block). Wounds are computed rule-accurately by conditioning defense on each attack outcome.

## Rules

- **Defense pool size:** For each attack outcome, defense dice = attack total (successes). No separate user input for "how many" defense dice.
- **Defense die color:** User chooses Red or White; all defense dice in a given roll are that color.
- **Defense Surge:** Unchanged (None | Block). Applied per die when building the defense distribution for N dice.

## Architecture

- **Engine:** Add `getDefenseDistributionForDiceCount(diceCount, color, surge)` returning the same shape as current defense results (distribution over total blocks, cumulative, expectedBlocks). Implement by convolving the single-die effective distribution `diceCount` times (reuse existing convolution logic).
- **Wounds:** Change `calculateWounds(attackResults, defenseDieColor, defenseSurge)`. For each (attack total n, probability p) in the attack distribution, get defense distribution for n dice; for each (defense total, def prob), wounds = max(0, n − defenseTotal); aggregate with weight p × def prob. No `DefenseResults` or pool argument.
- **Types:** Remove `DefensePool` from the main flow. Wounds API takes `defenseDieColor: DefenseDieColor` and `defenseSurge: DefenseSurgeConversion`. `DefensePool` and `calculateDefensePool` can be removed from public API (or kept only internally if useful for tests).

## UI

- **Defense section:** Remove both DiceSelectors (red count, white count). Keep Defense Surge toggle (None | Block).
- **New control:** Single choice "Defense dice: Red | White" (radio group or select). Default: Red (or choose per product).
- **State:** Replace `defensePool` with `defenseDieColor: DefenseDieColor`; keep `defenseSurge`. Pass both into wounds calculation. No defense "pool size" or standalone "Avg Blocks" for a fixed pool; defense is implicit in wounds.

## Data Flow

1. User sets attack pool, surge, optional Critical X, optional Surge Tokens; and defense die color + defense surge.
2. App computes attack results (existing). For wounds, calls `calculateWounds(results, defenseDieColor, defenseSurge)`.
3. Engine iterates attack distribution; for each n, gets defense distribution for n dice of chosen color/surge; computes wounds per (n, blocks) and merges into wounds distribution.

## Edge Cases

- **Zero attack dice:** Attack distribution empty or all zeros → wounds = 0 (no defense dice). Treat defense for 0 dice as 0 blocks with prob 1.
- **Tests:** Wounds with 0 attack dice → 0 wounds. Attack always 1 success, defense red + none → wounds match 1 red die (0 or 1). Attack always 2 successes, defense white + block → wounds from 2 white dice. Remove or rewrite tests that relied on `DefensePool` + `calculateDefensePool` for wounds.

## Testing

- Unit tests: `getDefenseDistributionForDiceCount(0, ...)` → 0 blocks prob 1. For N=1 red/none and N=1 white/block, match existing single-die expectations. `calculateWounds` with 0 attack dice → 0 wounds; with fixed attack total and color/surge, wounds distribution matches rule-accurate convolution. Existing attack/distribution tests unchanged.
