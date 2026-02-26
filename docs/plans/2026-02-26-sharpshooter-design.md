# Sharpshooter X – Design

**Date:** 2026-02-26

## Goal

Add the attacking keyword **Sharpshooter X**, which lessens cover during the cover step (rules-as-written). This keeps the rulebook flow: the same step where we “roll cover dice” is where Sharpshooter applies.

- **Sharpshooter 1:** Heavy → Light, Light → None.
- **Sharpshooter 2 (or more):** Heavy → None, Light → None.
- **Sharpshooter 0 or empty:** No effect; use defender’s cover as-is.

## Approach: Reduce cover inside `applyCover`

Implement the reduction **inside** `applyCover` where cover dice are rolled, so the sequence matches the rulebook and is easy to follow.

1. **Signature:** Add an optional parameter to the existing cover step:
   - `applyCover(hits, crits, cover, rng, sharpshooterX?)`
   - `sharpshooterX` is `number | undefined`; treat 0 and undefined as “no Sharpshooter”.

2. **Logic inside `applyCover`:**
   - At the start, compute **effective cover** by applying up to `sharpshooterX` downgrade steps (each step: heavy→light, light→none, none→none). Use a small helper (e.g. `getEffectiveCover(cover, sharpshooterX)`) for clarity and tests.
   - Then run the existing logic using **effective cover**: early return if effective is `'none'` or `hits <= 0`; roll white dice for `hits`; cancel hits by blocks (light) or blocks+surges (heavy) according to effective cover.

3. **Callers:** Every caller of `applyCover` must pass `sharpshooterX` when available:
   - `simulateWounds`: add parameter `sharpshooterX?: number`, pass through to `applyCover`.
   - `simulateWoundsFromAttackResults`: same.
   - Public API `calculateWounds` in `probability.ts`: add optional `sharpshooterX`, pass through to the simulator.
   - App: new state and input for Sharpshooter, pass value into `calculateWounds`.

## Types

- No new exported types. Use `sharpshooterX?: number` (optional) everywhere; normalize to 0 when omitted.

## UI

- One optional number input **Sharpshooter** in the attack keywords section (with Critical, Precise, Ram). Empty or 0 = no Sharpshooter. Same pattern as Ram X / Precise X.

## Testing

- **Effective cover:** Unit tests for the downgrade rule (e.g. `getEffectiveCover` or equivalent logic): `(none|light|heavy) × (0,1,2,3)`.
- **applyCover:** Existing `applyCover` tests keep passing with `sharpshooterX` 0/undefined. Add tests that with fixed RNG, Sharpshooter 1 under heavy cover behaves like light cover, and Sharpshooter 2 under heavy/light behaves like no cover.
- **Wounds:** One or two simulation tests that expected wounds increase when Sharpshooter 1 or 2 is used under cover (vs same setup without Sharpshooter).

## Out of scope

- Low Profile (defender keyword); separate feature.
- Sharpshooter 3+ is allowed but redundant (already no cover after 2 steps); no special handling.
