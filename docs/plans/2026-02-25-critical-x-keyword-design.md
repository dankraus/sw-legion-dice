# Critical X Keyword — Design

## Overview

Add an optional **Critical X** keyword that modifies attack resolution: the attacking unit converts up to X surges to crits **before** applying the normal Surge Conversion toggle. This is implemented by moving the probability engine to a full (crit, surge, hit, blank) multinomial model and applying a two-step resolution: Critical X first, then Surge Conversion.

## Behavior

- **Critical X**: User enters a number X (≥ 0). When resolving the pool:
  1. **First**: Convert up to X surges to crits (pool-wide). So `crits += min(X, surges)`, `surges_remaining = surges - min(X, surges)`.
  2. **Then**: Apply the existing Surge Conversion to `surges_remaining` (Surge → Hit, Surge → Crit, or None).
- **Example**: Critical 2, Surge to Hit, 3 surges rolled → 2 crits (from Critical 2), 1 hit (remaining surge via Surge to Hit). Result: 2 crits, 1 hit.

## Data Model

- **Input**: Optional `criticalX: number | undefined`. Treated as 0 when undefined, or when negative/non-integer (clamp to 0).
- **Existing**: Pool, Surge Conversion unchanged. Results (expectedHits, expectedCrits, distribution, cumulative) unchanged in shape.

## Probability Engine

**Approach: Full multinomial then resolution.**

1. **Per die**: Each die has a distribution over four outcomes: crit, surge, hit, blank (e.g. red: 1, 1, 5, 1 faces). No surge conversion at this stage.
2. **Pool**: Convolve 4D distributions across the pool to obtain the distribution over (C, S, H, B) = total crits, surges, hits, blanks.
3. **Resolution** (per outcome):
   - `toCrit = min(criticalX, S)`, `surgesRemaining = S - toCrit`.
   - `critsFinal = C + toCrit + (surge === 'crit' ? surgesRemaining : 0)`.
   - `hitsFinal = H + (surge === 'hit' ? surgesRemaining : 0)`.
   - (Surge Conversion "none": surgesRemaining count as neither hits nor crits.)
4. **Outputs**: From the distribution of (hitsFinal, critsFinal) compute expected hits, expected crits, distribution of total = hitsFinal + critsFinal, and cumulative "at least N".

**Convolution**: We need to convolve (C, S, H, B). Represent as a map or array keyed by (c, s, h, b) with c+s+h+b = N. Adding one die multiplies each current probability by the die’s face probs and accumulates into new (c+1,s,h,b), (c,s+1,h,b), etc.

## API

- `calculateAttackPool(pool, surge, criticalX?)` — `criticalX` optional; 0/undefined means no Critical conversion.
- `getEffectiveProbabilities(color, surge)` can remain for tests or be removed if no longer needed after refactor.

## UI

- In the pool/options section (e.g. near Surge Conversion):
  - Label: "Critical X" or "Keyword: Critical"
  - Input: number, min 0, placeholder "0" or "Off". Only X > 0 applies the keyword.

## Edge Cases

- **Invalid criticalX**: Non-integer or negative → treat as 0.
- **X > total surges in an outcome**: Handled by `min(X, S)`; no cap on input required.
- **Empty pool**: Unchanged (zero results).

## Files to Touch

- `src/types.ts` — optional `criticalX` in options or as separate param.
- `src/engine/probability.ts` — multinomial convolution, resolution step, same `AttackResults` shape.
- `src/App.tsx` — state and input for Critical X.
- `src/engine/__tests__/probability.test.ts` — update for new signature; add Critical X cases (e.g. Critical 2 + Surge to Hit with 3 surges → 2 crits, 1 hit in expectation over the distribution).
