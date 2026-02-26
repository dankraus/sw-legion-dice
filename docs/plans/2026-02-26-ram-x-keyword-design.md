# Ram X Keyword — Design

## Overview

Add an optional **Ram X** keyword that modifies attack resolution: after all rerolls (Aim, Observe) are spent, the attacking unit converts up to X dice to crits. The optimal conversion order is **Blanks → Crits first**, then **Hits → Crits** if Ram capacity remains. Converting a Crit to a Crit is redundant and never happens.

## Behavior

- **Ram X**: User enters a number X (≥ 0). After rerolls are resolved:
  1. **First**: Convert up to X remaining blanks to crits. `blanksConverted = min(X, blanksRemaining)`.
  2. **Then**: If `X > blanksConverted`, convert remaining capacity from hits to crits. `hitsConverted = min(X - blanksConverted, hits)`.
- **Resolution order**: Ram applies **after** all other steps:
  1. Roll dice → (c, s, h, b)
  2. Critical X (surges → crits)
  3. Surge Tokens / Surge Conversion (remaining surges → hits or crits)
  4. Aim / Observe rerolls (blanks → expected hits/crits)
  5. **Ram X (blanks → crits, then hits → crits)**
- **Example**: Pool rolls 1 crit, 0 surges, 2 hits, 2 blanks. 1 Aim token rerolls 2 blanks (expected values added to hits/crits). Ram 1 with 0 remaining blanks → converts 1 hit to 1 crit.
- **Example**: Pool rolls 0 crits, 1 surge, 1 hit, 3 blanks. Surge → Hit. 1 Aim rerolls 2 blanks (1 blank remains). Ram 2 → converts 1 remaining blank to crit, then 1 hit to crit.

## Data Model

- **Input**: Optional `ramX: number | undefined`. Treated as 0 when undefined, negative, or non-integer (clamp to 0).
- **Existing**: Pool, Surge Conversion, Critical X, tokens, Precise — all unchanged. Results (`expectedHits`, `expectedCrits`, `distribution`, `cumulative`) unchanged in shape.

## Probability Engine

**Approach: Apply Ram after rerolls in the per-outcome loop.**

Within `calculateAttackPool`, for each (c, s, h, b) outcome:

1. Resolve surges via existing `resolve()` → `{ hits, crits }`.
2. Compute rerolls: `nReroll = min(rerollCapacity, b)`.
3. Add reroll expected values: `hitsFinal = hits + nReroll * avgHit`, `critsFinal = crits + nReroll * avgCrit`.
4. **Ram X**:
   - `blanksRemaining = b - nReroll`
   - `blanksConverted = min(ramX, blanksRemaining)`
   - `critsFinal += blanksConverted`
   - `ramLeft = ramX - blanksConverted`
   - `hitsConverted = min(ramLeft, hitsFinal)`
   - `critsFinal += hitsConverted`
   - `hitsFinal -= hitsConverted`

Ram increases the total when converting blanks (blanks were not successes; crits are). Ram does **not** change the total when converting hits (a hit becomes a crit; total stays the same).

## API

- `calculateAttackPool(pool, surge, criticalX?, surgeTokens?, aimTokens?, observeTokens?, precise?, ramX?)` — `ramX` optional; 0/undefined means no Ram conversion.

## UI

- In the pool/options section, after Observe Tokens and before Unit Point Cost:
  - Label: "Keyword: Ram X"
  - Input: number, min 0, placeholder "0". Only X > 0 applies the keyword.
  - Always enabled (Ram applies regardless of Surge Conversion or Aim state).

## Edge Cases

- **Invalid ramX**: Non-integer or negative → treat as 0.
- **X > blanks + hits in an outcome**: Handled by `min()` caps; excess Ram capacity does nothing.
- **X = 0 or undefined**: No conversions; behavior unchanged.
- **Empty pool**: Unchanged (zero results).
- **No blanks remaining after rerolls**: Ram converts hits to crits directly.
- **No blanks and no hits**: Ram has nothing to convert; excess capacity wasted.
- **Ram + Critical X + Surge Conversion**: All compose naturally — surges are resolved first, rerolls second, Ram last.

## Files to Touch

- `src/engine/probability.ts` — add `ramX` parameter, normalize, apply after rerolls in the per-outcome loop.
- `src/App.tsx` — state and input for Ram X, pass to `calculateAttackPool`.
- `src/engine/__tests__/probability.test.ts` — add Ram X test cases.
