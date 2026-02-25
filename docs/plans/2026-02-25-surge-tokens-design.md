# Surge Tokens – Design

**Implemented:** 2026-02-25 (see `docs/plans/2026-02-25-surge-tokens-plan.md`).

## Goal

Allow the user to input a number of **Surge Tokens**. Each token converts one rolled surge (remaining after Critical X) to a hit. Tokens apply only when Surge Conversion is **None**; when Surge → Hit or Surge → Crit is selected, the control is visible but disabled.

## Rules

- **Value:** 1 Surge Token = 1 conversion of a surge (rolled) to a hit.
- **When applied:** After the Critical keyword: first up to X surges become crits (Critical X), then up to `surgeTokens` of the remaining surges become hits. Any surges left after that stay unconverted (no hit, no crit).
- **Constraint:** Surge Tokens have no effect when Surge Conversion is Surge → Hit or Surge → Crit. The input is always visible; when conversion is not "None", it is disabled with a tooltip: "Surge Tokens only apply when Surge Conversion is None."

## Architecture

- **Types:** No new public types; Surge Tokens are an optional numeric parameter (e.g. `surgeTokens?: number`) to the existing calculator.
- **Engine:** In `resolve()`, when `surge === 'none'`, after applying Critical X, add `hits += Math.min(surgeTokens, surgesRemaining)`. `surgeTokens` is normalized (non-negative integer, default 0) in the same way as Critical X.
- **UI:** New number input in the pool section (e.g. next to Critical X), label "Surge Tokens", `min="0"`. When `surge !== 'none'`, set `disabled` and `title` as above. Pass parsed value into `calculateAttackPool` only when surge is `'none'` (or always pass and let engine treat 0 when not applicable).

## Data Flow

1. User sets Surge Conversion (None / Hit / Crit) and optional Surge Tokens count.
2. App passes `pool`, `surge`, `criticalX`, and `surgeTokens` (parsed, default 0) to `calculateAttackPool`.
3. Engine builds (c,s,h,b) distribution, then for each outcome calls `resolve(c, s, h, b, criticalX, surge, surgeTokens)`. When `surge === 'none'`, `resolve` adds up to `surgeTokens` of `surgesRemaining` to hits.
4. Results (expected hits/crits, distribution, cumulative) reflect token conversions when surge is None.

## Edge Cases

- **surgeTokens = 0:** No conversions; behavior unchanged from current "None" behavior.
- **surgeTokens &gt; surgesRemaining:** Only `surgesRemaining` convert to hits; extra tokens do nothing (per outcome).
- **Surge → Hit / Surge → Crit:** `surgeTokens` is ignored in the engine; UI disables the input and explains why.

## Testing

- Unit tests: with `surge === 'none'`, 0 tokens vs 1 vs N; with Critical X + tokens (e.g. 2 surges, Critical 1, 1 token → 1 crit, 1 hit); tokens &gt; remaining surges (cap at remaining). When `surge === 'hit'` or `'crit'`, changing `surgeTokens` has no effect on results.
