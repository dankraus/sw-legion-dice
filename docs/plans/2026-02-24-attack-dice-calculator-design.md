# Legion Dice Calculator -- Attack Dice Design

## Overview

A web-based probability calculator for Star Wars: Legion attack dice. Users configure a dice pool (any combination of red, black, and white dice), set a surge conversion option, and instantly see expected hits, crits, total damage, the full probability distribution, and cumulative "at least N" probabilities.

## Dice Definitions

All dice are 8-sided.

| Die   | Crit | Surge | Hit | Blank |
|-------|------|-------|-----|-------|
| Red   | 1/8  | 1/8   | 5/8 | 1/8   |
| Black | 1/8  | 1/8   | 3/8 | 3/8   |
| White | 1/8  | 1/8   | 1/8 | 5/8   |

## Surge Conversion

Three modes, mutually exclusive:

- **None** -- surges count as blanks.
- **Surge to Hit** -- surges count as hits.
- **Surge to Crit** -- surges count as crits.

## Data Model

**Attack pool state:**
- `redCount: number` (0+)
- `blackCount: number` (0+)
- `whiteCount: number` (0+)
- `surgeConversion: 'none' | 'hit' | 'crit'`

**Computed results:**
- `expectedHits: number`
- `expectedCrits: number`
- `expectedTotal: number`
- `distribution: Map<number, number>` -- P(exactly N total successes)
- `cumulative: Map<number, number>` -- P(at least N total successes)

## Probability Engine

Pure TypeScript module with no React dependencies.

**Per-die effective probabilities:** Given a die type and surge conversion, compute:
- Crit probability = base crit + (surge if surge-to-crit, else 0)
- Hit probability = base hit + (surge if surge-to-hit, else 0)
- Blank probability = remainder

**Pool distribution via convolution:** Each die produces a small distribution over (hits, crits). The pool distribution is computed by convolving individual die distributions one at a time. The 2D distribution over (total hits, total crits) is maintained so hits and crits can be reported separately -- important for future defense mechanics where crits may bypass armor or cover.

The cumulative table is derived by summing the tail of the total successes distribution.

Complexity is O(n^2) in total dice count, which is instant for any realistic pool.

## Tech Stack

- React 18+ with TypeScript
- Vite for build/dev server
- Recharts for the distribution bar chart
- Plain CSS for styling

## Component Architecture

```
App
├── Header
├── DicePool
│   ├── DiceSelector (red)
│   ├── DiceSelector (black)
│   └── DiceSelector (white)
├── SurgeToggle
└── Results
    ├── StatsSummary
    ├── DistributionChart
    └── CumulativeTable
```

All state lives in `App` via `useState`. Results recompute on every state change (no submit button). Props flow downward; no state management library needed.

## UI Layout

- Single column on mobile, side-by-side (pool left, results right) on wider screens.
- Dice selectors color-coded to match die type.
- Distribution shown as a Recharts bar chart.
- Cumulative probabilities shown as a striped table.

## Project Structure

```
legion-dice/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── App.css
│   ├── engine/
│   │   └── probability.ts
│   ├── components/
│   │   ├── DiceSelector.tsx
│   │   ├── DiceSelector.css
│   │   ├── SurgeToggle.tsx
│   │   ├── SurgeToggle.css
│   │   ├── StatsSummary.tsx
│   │   ├── StatsSummary.css
│   │   ├── DistributionChart.tsx
│   │   ├── CumulativeTable.tsx
│   │   └── CumulativeTable.css
│   └── types.ts
```

## Future Considerations

- Defense dice (adds a second pool and subtraction from attack results)
- Additional attack modifiers (aim tokens, sharpshooter, etc.)
- These are explicitly out of scope for v1 but the architecture accommodates them.
