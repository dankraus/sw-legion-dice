# Defense Dice Toggle — Design

**Date:** 2026-02-26

## Goal

Replace the Defense dice (Red / White) radio control with a toggle-button control that matches the Surge / Cover / Defense Surge pattern and uses attack-pool–inspired colors for the two options.

## Scope

- **In scope:** New `DefenseDiceToggle` component; styling with red/white dice colors; swap into `App.tsx` in place of the current inline Defense dice fieldset.
- **Out of scope:** Changes to `DefenseDieColor` type or wound/defense logic; new unit tests unless desired later.

## Component

- **Name:** `DefenseDiceToggle`
- **Props:** `value: DefenseDieColor`, `onChange: (value: DefenseDieColor) => void`
- **Markup:** Same pattern as `SurgeToggle` / `CoverToggle`: `<fieldset class="surge-toggle">`, `<legend>Defense dice</legend>`, `<div class="surge-toggle__options">`, two `<label class="surge-toggle__option ...">` with hidden `<input type="radio">`, labels "Red" and "White".
- **Wrapper:** A wrapper class (e.g. `defense-dice-toggle`) on the fieldset so only this control gets the custom red/white styling.

## Styling

- Reuse **SurgeToggle.css** for layout and structure (options row, padding, cursor, hidden radio).
- **DefenseDiceToggle.css** (or a small block in the same file):
  - **Red option (default):** background `#fee2e2`, border `#ef4444` (match `DiceSelector` red).
  - **White option (default):** background `#f9fafb`, border `#d1d5db` (match `DiceSelector` white).
  - **Active state:** Same backgrounds; stronger border for selected option (e.g. red `#dc2626` or `#b91c1c`, white `#9ca3af`); text color for clear contrast (e.g. dark red / dark gray when active).

## Accessibility

- Keep `name="defense-dice"`, `checked`, and `onChange` on the radios; ensure `<legend>` and labels so the control remains screen-reader friendly.

## Integration

- In **App.tsx:** Remove the inline Defense dice fieldset; render `<DefenseDiceToggle value={defenseDieColor} onChange={setDefenseDieColor} />` in the same place in the Defense section.
- No changes to types or logic that consume `defenseDieColor`.

## Testing

- Manual: Confirm Red/White toggle looks like other toggles, uses the red/white colors, and updates results correctly. No new unit tests required unless we add a simple render test later.
