# Precise Keyword – Design

**Summary:** Precise is a number input that adds that many extra rerolls **per Aim token** when spending Aim tokens. When Aim tokens are 0 or empty, Precise has no effect and the input is disabled.

## Behavior

- **Formula:** `rerollCapacity = aim * (2 + precise) + observe`. When `aim === 0`, precise is ignored (effectively 0).
- Precise is a non-negative integer. Normalize like other token inputs (undefined/negative/non-integer → 0).

## Engine (`src/engine/probability.ts`)

- Add optional parameter `precise?: number` to `calculateAttackPool` (after `observeTokens`).
- Normalize: when `aim > 0`, use `Math.max(0, Math.floor(precise ?? 0) || 0)`; when `aim === 0`, use 0.
- Set `rerollCapacity = aim * (2 + precise) + observe`.

## UI (`src/App.tsx`)

- State: `precise` (string). Derived `preciseNum` as with other inputs.
- Number input: label "Keyword: Precise", min 0, placeholder "0", disabled when `aimTokensNum === 0`.
- When disabled, pass 0 so engine ignores precise. Pass `preciseNum` into `calculateAttackPool` and include in `useMemo` deps.
- Place after Aim Tokens. Optional tooltip: "Extra rerolls per Aim token when using Aim."

## Testing

- Engine: 1 Aim + Precise 1 → reroll capacity 3; 2 Aim + Precise 1 → 6; 0 Aim + Precise 1 → same as 0 Aim.
- No new types or shared constants.
