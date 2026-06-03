# Hybrid Cumulative Distribution Visualization

**Date:** 2026-06-03  
**Status:** Approved  
**Approach:** Curve with Collapsible Table

## Overview

Replace the current table-only cumulative probability display with a hybrid visualization combining a stepped line chart and an expandable table. This provides quick visual pattern recognition while maintaining access to exact values on demand.

## Motivation

Current state: Cumulative probabilities shown as tables only (`CumulativeTable` component).

**Problems:**
- Hard to see overall probability trends at a glance
- Comparing two pools (A vs B) requires scanning between columns
- No visual feedback on reliability or distribution shape

**Goals:**
- Provide immediate visual comparison via line chart
- Maintain access to exact threshold values
- Keep vertical space manageable (collapsible table)
- Preserve existing functionality and accessibility

## Component Architecture

### New Component: `CumulativeCurve`

Replaces `CumulativeTable` usage with a hybrid visualization.

**Structure:**
```
CumulativeCurve
├── Header (title + toggle button)
├── CumulativeCurveChart (Recharts LineChart)
└── Collapsible section
    └── CumulativeTable (existing component, reused)
```

**Props:**
```typescript
interface CumulativeCurveProps {
  cumulative: Row[];              // Primary dataset (required)
  title?: string;                 // Chart title (default: "Cumulative Probabilities")
  secondary?: Row[];              // Optional secondary dataset for comparison
  primaryLabel?: string;          // Label for primary (default: "A")
  secondaryLabel?: string;        // Label for secondary (default: "B")
  defaultExpanded?: boolean;      // Initial table visibility (default: false)
}

type Row = { total: number; probability: number };
```

**State:**
- `isTableExpanded: boolean` - Controls table visibility
- No persistence across remounts (keeps implementation simple)

**Why this structure:**
- Keeps `CumulativeTable` unchanged (no breaking changes)
- Chart is primary visual, table is secondary detail
- Reuses existing data types and patterns

## Chart Implementation

### Recharts LineChart Configuration

**Chart type:** Stepped line (`type="stepAfter"`)
- Rationale: Cumulative distributions are step functions, not smooth curves
- "At least N" probability stays constant until reaching "at least N+1"
- Stepped lines accurately represent the mathematical reality

**Chart specifications:**
- **Height:** 200px (responsive width via `ResponsiveContainer`)
- **Y-axis:** 0-100%, formatted as percentages
- **X-axis:** "At Least N" threshold values
- **Colors:** 
  - Primary: `#2563eb` (blue, matches existing COLOR_A)
  - Secondary: `#f59e0b` (amber, matches existing COLOR_B)
- **Tooltip:** Recharts built-in tooltip showing both values on hover
- **Legend:** Displayed when secondary data present

**Data transformation:**
1. Merge primary and secondary datasets to get all unique totals (sorted ascending)
2. For each total, find the cumulative probability by:
   - Looking up the exact value if it exists in the dataset
   - Carrying forward the last known value if the total is missing (cumulative probabilities never decrease)
3. Map to chart format: `{ total, primary: number, secondary: number }`

**Example:**
- Pool A: `[(0, 1.0), (1, 0.85), (3, 0.50)]`
- Pool B: `[(0, 1.0), (2, 0.60)]`
- Merged totals: `[0, 1, 2, 3]`
- Chart data:
  - `{ total: 0, primary: 1.0, secondary: 1.0 }`
  - `{ total: 1, primary: 0.85, secondary: 1.0 }` ← B carries forward from 0
  - `{ total: 2, primary: 0.85, secondary: 0.60 }` ← A carries forward from 1
  - `{ total: 3, primary: 0.50, secondary: 0.60 }` ← B carries forward from 2

**Responsive behavior:**
- Desktop: Full chart width with readable labels
- Mobile: Same vertical layout (stacking works well)
- Chart maintains 200px height on all screen sizes

## Collapsible Interaction

### Toggle Button

**Placement:** Header row, right-aligned next to title

**Button states:**
- Collapsed: "Show exact values ▼"
- Expanded: "Hide exact values ▲"
- Style: Secondary button (subtle styling, doesn't compete with chart)

**Interaction:**
- Click/tap toggles `isTableExpanded` state
- Keyboard: Space/Enter keys toggle state
- Focus management: Focus remains on button after toggle

### Animation

**Transition:** CSS-based smooth expand/collapse (200ms duration)
- Element always in DOM (conditional CSS class for visibility)
- Use `max-height` transition: `0` (collapsed) → `1000px` (expanded)
- `overflow: hidden` prevents content visibility during transition
- Not distracting during interaction

### States

**Collapsed (default):**
- Chart visible with title
- Table hidden via CSS (`max-height: 0`, `overflow: hidden`)
- Button shows "Show exact values ▼"

**Expanded:**
- Chart remains visible above
- Table slides in below chart
- Button updates to "Hide exact values ▲"

## Accessibility

**Semantic structure:**
- Chart wrapped in `<div role="img" aria-label="Cumulative probability chart">`
- Table region has `role="region"` and `aria-labelledby` pointing to title

**Toggle button:**
- `aria-expanded` attribute reflects current state
- `aria-controls` points to table region ID
- Button label clearly indicates action

**Keyboard navigation:**
- Tab order: Title → Toggle button → Chart tooltip (on focus) → Table (when expanded)
- Space/Enter: Toggle table visibility
- Chart: Recharts provides keyboard navigation for tooltip

**Screen readers:**
- Chart announced as "Line chart" with title
- Table fully accessible when expanded (existing `CumulativeTable` accessibility preserved)
- Tooltip content announced on focus

## Integration Points

### Files to modify:

1. **Create new component:**
   - `src/components/CumulativeCurve.tsx`
   - `src/components/CumulativeCurve.css`
   - `src/components/CumulativeCurve.test.tsx`

2. **Update imports:**
   - `src/components/ComparisonResults.tsx` - replace two `CumulativeTable` usages
   - `src/App.tsx` - replace two `CumulativeTable` usages

### Migration strategy:

**Phase 1:** Create `CumulativeCurve` component
- Build and test new component
- Keep `CumulativeTable` unchanged

**Phase 2:** Update consumers
- Replace imports in `ComparisonResults` and `App`
- Props mapping is 1:1 (no breaking changes)

**Backward compatibility:**
- Keep `CumulativeTable` exported for potential external usage
- No breaking changes to existing API

### Data flow:

No changes required - uses same `Row[]` type as current table:
```typescript
// Before
<CumulativeTable
  cumulative={results.cumulative}
  secondary={resultsB.cumulative}
  primaryLabel="Pool A"
  secondaryLabel="Pool B"
/>

// After
<CumulativeCurve
  cumulative={results.cumulative}
  secondary={resultsB.cumulative}
  primaryLabel="Pool A"
  secondaryLabel="Pool B"
/>
```

## Testing Strategy

### Unit Tests (`CumulativeCurve.test.tsx`)

**Rendering tests:**
- Renders chart with primary data only
- Renders chart with primary + secondary data
- Renders title and labels correctly
- Chart uses correct colors for primary/secondary

**Interaction tests:**
- Toggle button expands table on click
- Toggle button collapses table on second click
- Button label updates based on state
- `defaultExpanded` prop sets initial state

**Accessibility tests:**
- Toggle button has `aria-expanded` attribute
- Toggle button has `aria-controls` attribute
- Table region has appropriate ARIA attributes
- Keyboard navigation works (Space/Enter toggles)

**Edge cases:**
- Empty data shows "No data" message
- Single data point renders correctly
- Large ranges (0-20+ successes) scale properly

### Integration Tests

**Visual regression:**
- Screenshot chart in collapsed state
- Screenshot chart in expanded state
- Screenshot comparison mode (two datasets)

**Manual testing checklist:**
- [ ] Chart renders with stepped lines
- [ ] Both datasets visible with correct colors
- [ ] Tooltip shows accurate percentages on hover
- [ ] Toggle button expands/collapses smoothly
- [ ] Table values match chart when expanded
- [ ] Mobile layout stacks correctly
- [ ] Keyboard navigation works end-to-end
- [ ] Screen reader announces all content

## Edge Cases

**Empty data:**
- Show "No data available" message instead of chart
- Hide toggle button (no table to show)
- Match existing `CumulativeTable` behavior

**Single data point:**
- Chart shows single step from 100% to 0%
- Table shows single row
- Tooltip works on single point

**Large ranges (0-20+ successes):**
- Chart: Recharts auto-scales X-axis labels (may skip values)
- Table: Already scrollable via existing CSS
- Both handle large datasets gracefully

**Missing secondary data:**
- Chart shows single line only
- Legend hidden
- Table shows single column
- Toggle button still available

**Accessibility edge cases:**
- Chart without tooltip interaction (keyboard users can expand table)
- Screen readers can navigate expanded table normally
- High contrast mode: Chart lines remain visible

## Visual Design

**Color palette:**
- Primary line: `#2563eb` (blue)
- Secondary line: `#f59e0b` (amber)
- Grid lines: `#e2e8f0` (light gray)
- Button: Secondary style (subtle border, no fill)

**Typography:**
- Title: `h3` (existing style)
- Axis labels: 11px (readable but compact)
- Button: 13px (matches existing buttons)

**Spacing:**
- Chart margin: 16px top/bottom
- Button: 8px padding
- Table (when expanded): 12px top margin

**CSS classes:**
- `.cumulative-curve` - Container
- `.cumulative-curve__header` - Title + button row
- `.cumulative-curve__chart` - Chart wrapper
- `.cumulative-curve__table-wrapper` - Collapsible section
- `.cumulative-curve__toggle` - Toggle button

## Implementation Notes

**Dependencies:**
- Recharts (already installed, version ^3.7.0)
- React 19 (existing)
- No new dependencies required

**Browser support:**
- Modern browsers (Recharts requirement)
- CSS transitions supported in all target browsers
- No IE11 support needed (existing constraint)

**Performance:**
- Chart renders ~50ms for typical datasets (0-10 successes)
- Toggle animation: 200ms CSS transition (non-blocking)
- No memoization needed for typical dataset sizes

**Future enhancements (out of scope):**
- Persist expanded state to localStorage
- Allow users to set default expanded preference
- Add "Export data" button in table section
- Interactive chart markers for specific thresholds

## Success Criteria

**Visual comparison:**
- Users can immediately see which pool has higher probabilities
- Trend differences (steep vs gradual) are obvious
- Divergence points between pools are clear

**Precision access:**
- Exact percentages available within 1 click
- Table data matches chart tooltip values
- All thresholds visible when expanded

**Usability:**
- No new learning curve (chart is self-explanatory)
- Toggle interaction is discoverable and intuitive
- Vertical space savings vs always-visible table

**Accessibility:**
- All content accessible via keyboard
- Screen readers can navigate all information
- No visual-only features (table provides text alternative)

## Alternatives Considered

**Approach 1: Curve Above, Table Below (always visible)**
- Pros: No interaction required, all info visible
- Cons: Takes more vertical space, requires scrolling
- Rejected: Vertical space cost outweighed by collapsible benefit

**Approach 2: Curve with Hover Tooltip Only**
- Pros: Most compact, modern look
- Cons: Requires mouse, can't scan multiple thresholds
- Rejected: Tooltip-only hurts gameplay decision-making

**Approach 3: Side-by-Side Curve & Table**
- Pros: Both visible, no interaction
- Cons: Tight on mobile, curve may be too small
- Rejected: Mobile experience degraded too much

**Selected: Curve with Collapsible Table**
- Best balance of compactness and information access
- Chart-first aligns with visual comparison goal
- Table on-demand serves precision lookup needs
