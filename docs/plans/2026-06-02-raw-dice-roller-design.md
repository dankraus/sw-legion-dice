# Raw Dice Roller — Design

**Date:** 2026-06-02

## Goal

Add a secondary **raw dice roller** to Legion Roller: roll standalone attack and defense pools once, see each die’s face and per-color tallies—without simulation, keywords, or URL sharing. The calculator remains the primary experience; the roller is available but not prominent.

## User need

Roll specific Legion dice when physical dice are not available. Attack and defense counts are controlled independently from the simulation inputs.

## Product decisions

| Topic           | Decision                                                                                       |
| --------------- | ---------------------------------------------------------------------------------------------- |
| Result type     | **Raw faces only** (no surge conversion, tokens, rerolls, keywords)                            |
| Dice            | **Attack** (red, black, white) and **defense** (red, white)                                    |
| Pool source     | **Standalone** counts in the roller (not tied to calculator pools)                             |
| Entry           | Header button **“Roll dice”** (same weight as Copy link / Reset)                               |
| Surface         | **Modal** (backdrop, Escape, X, focus trap)                                                    |
| Roll actions    | **Roll attack** and **Roll defense** separately                                                |
| Results display | **Per-die chips** + **per-color tally** under each pool section                                |
| Persistence     | **None** — pools and results reset when the modal closes; fresh empty state each time it opens |
| Dice cap        | **None** — no artificial limit on pool sizes                                                   |
| URL state       | **Out of scope** — not in fragment share                                                       |

## Architecture (recommended)

**Approach:** Dedicated `DiceRollerModal` component with ephemeral React state; thin engine helper for defense detailed rolls. **Unmount the modal when closed** so state resets automatically on the next open (no `localStorage`, no manual reset logic).

Reuse:

- `rollAttackPoolDetailed` / `rollOneAttackDie` (existing)
- `DiceSelector` for all pool inputs
- New `rollDefensePoolDetailed` mirroring attack

RNG: `Math.random()` per roll (not seeded).

## Engine

**simulate.ts**

- Export `DefenseDieOutcome` `{ color: DefenseDieColor; face: DefenseFace }`.
- Add `rollDefensePoolDetailed(pool: DefensePool, rng): DefenseDieOutcome[]` — order: reds, then whites (same color order pattern as attack).

Optional small pure helpers (`diceRollerTallies.ts`):

- `formatAttackTallies(outcomes)` → display strings per color.
- `formatDefenseTallies(outcomes)` → same for defense faces.

No changes to simulation, probability, or `urlState`.

## UI

### Header (`App.tsx`)

- State: `diceRollerOpen: boolean`.
- Button sets `diceRollerOpen` to `true`.
- Render `<DiceRollerModal />` only when `diceRollerOpen` is `true`; `onClose` sets it to `false` (unmount clears all roller state).

### Modal (`DiceRollerModal.tsx`)

**Attack section**

- `DiceSelector` × 3 (red, black, white).
- **Roll attack** — disabled when `pool.red + pool.black + pool.white === 0`.
- Results: chips in roll order; tally lines per color with faces present.

**Defense section**

- `DiceSelector` for red and white under heading **Defense**.
- **Roll defense** — disabled when `pool.red + pool.white === 0`.
- Results: chips + tallies (`block` / `surge` / `blank`).

**Behavior**

- Re-rolling attack updates only attack results; defense results unchanged until **Roll defense**.
- Empty results copy: “Set dice and roll” until first roll for that section.
- While open, state is kept in memory (close and reopen starts over).
- Modal accessibility: `role="dialog"`, `aria-labelledby`, focus on open, restore focus on close.

### Visual

- Chips: die color border/background (reuse `.dice-selector--red` etc. tokens where possible), face label (Crit, Surge, Hit, Blank / Block, Surge, Blank).
- No new image assets required.

## Files

| File                                 | Role                                                   |
| ------------------------------------ | ------------------------------------------------------ |
| `src/components/DiceRollerModal.tsx` | Modal UI, roll handlers, ephemeral state               |
| `src/components/DiceRollerModal.css` | Modal overlay, sections, chip grid                     |
| `src/components/DieFaceChip.tsx`     | Single die outcome chip (optional; can inline if tiny) |
| `src/diceRollerTallies.ts`           | Tally formatters for results display                   |
| `src/engine/simulate.ts`             | `rollDefensePoolDetailed`, types                       |
| `src/App.tsx`                        | Header button + conditional mount                      |

## Testing

- **Unit:** `rollDefensePoolDetailed` — correct length, valid faces, order (reds then whites).
- **Unit:** `diceRollerTallies` — formatted tally strings.
- **Manual:** Roll attack → close modal → reopen → pools at zero, no prior results; roll defense independently while modal stays open.

## Out of scope

- `localStorage` / session persistence
- Mirror / copy from calculator pools
- Keywords, surge, rerolls, wounds
- URL fragment keys
- Sound, animation, export/copy results
- Artificial max dice count
