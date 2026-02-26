# Defense Surge Tokens – Design

## Goal

Add **Defense Surge Tokens**: the user enters a count; each token converts one rolled defense surge to a block when Defense Surge is **None**. Mirror the attack Surge Tokens pattern (same UX, no upper bound).

## Rules

- **Value:** 1 Defense Surge Token = 1 conversion of a defense-die surge (rolled) to a block.
- **When applied:** After rolling: count blocks and surges from the dice, then add `min(defenseSurgeTokens, surges)` to blocks.
- **Constraint:** When Defense Surge is **Block**, surges already count as blocks, so tokens have no effect. The input is visible but disabled with tooltip: "Defense Surge Tokens only apply when Defense Surge is None."
- **Scope:** No upper bound; same parsing as other token inputs (non-negative integer, default 0).

## Architecture

**Approach: Defense resolve step (mirror attack).**

- **Face-level roll:** Add a function that rolls one defense die and returns `'block' | 'surge' | 'blank'` using the die’s block/surge/blank face counts. Use this whenever we need per-face outcomes.
- **Resolve step:** Add `resolveDefenseRoll(blocks, surges, surge, defenseSurgeTokens)`: if `surge === 'block'` return `blocks + surges`; else return `blocks + Math.min(defenseSurgeTokens, surges)`. Normalize `defenseSurgeTokens` (non-negative integer, default 0).
- **Wounds:** In `simulateWoundsFromAttackResults` and `simulateWounds`, for each run roll each defense die with the face-level roll, count blocks and surges, then set total blocks = `resolveDefenseRoll(blocks, surges, defenseSurge, defenseSurgeTokens)`. Thread `defenseSurgeTokens` from `calculateWounds(..., defenseSurgeTokens?)`.
- **Standalone defense:** Add `defenseSurgeTokens` to `getDefenseDistributionForDiceCount` / `simulateDefensePool` and use the same roll + resolve so behavior is consistent (optional for UI; parameter added for API consistency).
- **Backward compatibility:** `defenseSurgeTokens` optional everywhere (default 0).

## Data Flow

1. User sets Defense Surge (None/Block) and optional Surge + Dodge token counts.
2. App passes `defenseDieColor`, `defenseSurge`, `dodgeTokensNum`, `defenseSurgeTokensNum` into `calculateWounds`.
3. Engine uses defense resolve (roll block/surge/blank, then `resolveDefenseRoll`) in the wounds simulation.
4. Wounds results and charts update.

## UI

- **State:** `defenseSurgeTokens` (e.g. `useState<string>('')`). Parse: `defenseSurgeTokensNum = defenseSurgeTokens === '' ? 0 : Math.max(0, Math.floor(Number(defenseSurgeTokens)) || 0)`.
- **Control:** Under Defense > Tokens: add Surge number input (label "Surge", `id="defense-surge-tokens"`, same component as Dodge). Order: Surge, Dodge. When `defenseSurge === 'block'`: `disabled` and `title="Defense Surge Tokens only apply when Defense Surge is None."` When `defenseSurge === 'none'`: enabled.
- **Reset:** Clear `defenseSurgeTokens` to `''` in Reset handler.

## Edge Cases

- `defenseSurgeTokens === 0`: no conversions; same as current (surge none, no tokens).
- `defenseSurgeTokens > surges` in a run: only `surges` convert; extra tokens do nothing.
- Defense Surge = Block: tokens ignored in engine; UI disables input and shows tooltip.
- Invalid input: treat as 0 (empty or non-numeric).

## Testing

- **Engine:** Unit test `resolveDefenseRoll(blocks, surges, surge, defenseSurgeTokens)` for: surge = 'block' (blocks + surges); surge = 'none', 0 tokens (blocks only); surge = 'none', tokens < surges (blocks + tokens); surge = 'none', tokens ≥ surges (blocks + surges). Test face-level roll (over many rolls, block/surge/blank proportions match die faces).
- **Simulation:** With defense surge 'none', 1 red die, 1 defense surge token: expected blocks/wounds increase vs 0 tokens. With defense surge 'block', changing defense surge tokens must not change results.
- **UI:** Defense Surge None + tokens → wounds change; switch to Block → Surge input disabled and tooltip visible; Reset clears defense surge tokens.
