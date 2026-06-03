# Simulation Accuracy Note Design

**Date**: 2026-06-03  
**Status**: Approved

## Overview

Add a brief explanation in the footer to inform users that the calculator uses Monte Carlo simulation, helping power users trust the accuracy of the results.

## User Request

> "Confidence/accuracy note — since wounds are simulation-based, show a small confidence interval (or an 'exact vs simulated' badge) so power users trust the numbers; optionally let them bump the run count."

## Design Decisions

### Display Location
Add the explanation to the existing footer tagline paragraph (`app__footer-tagline`) rather than creating a separate info block. This keeps the implementation simple and integrates naturally with the existing app description.

### Content
Extend the current tagline:

**Current**:
> Legion Roller is a dice simulator and probability calculator for Star Wars Legion by Atomic Mass Games.

**New**:
> Legion Roller is a dice simulator and probability calculator for Star Wars Legion by Atomic Mass Games. Results are calculated using Monte Carlo simulation with 10,000 runs to accurately model dice roll distributions.

### User Controls
No user controls for adjusting run count. The explanation is sufficient to build trust without adding UI complexity.

### Technical Notes
- The `DEFAULT_RUNS` constant is defined in `src/engine/rng.ts` as `10_000`
- Both attack results (hits/crits) and wounds use simulation-based calculations
- The system uses seeded RNG (`seed = 0`) for deterministic results

## Implementation

### Files to Modify

**`src/App.tsx`** (line ~959-962):

Update the footer tagline paragraph:

```tsx
<p className="app__footer-tagline">
  Legion Roller is a dice simulator and probability calculator for Star
  Wars Legion by Atomic Mass Games. Results are calculated using Monte Carlo 
  simulation with 10,000 runs to accurately model dice roll distributions.
</p>
```

### Testing

Manual verification:
1. Run the dev server
2. Check that the footer displays the updated text
3. Verify text wraps appropriately on mobile viewports

## Benefits

- **Transparency**: Users understand how results are calculated
- **Trust**: Technical users can verify the methodology is sound
- **Educational**: Introduces users to Monte Carlo simulation
- **Simple**: No new UI components or complexity
- **Zero maintenance**: Hard-coded value matches the actual constant

## Future Considerations

If users request adjustable run counts in the future, we could:
- Add a settings panel or advanced options section
- Offer presets: Fast (1k), Standard (10k), Precise (100k)
- Store preference in localStorage
- Note: This would require passing run count through the calculation pipeline
