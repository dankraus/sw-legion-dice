# Remove Redundant Heading from Compare Pool Bar

**Date:** 2026-06-03  
**Status:** Approved

## Problem

The `ComparePoolBar` component in single mode displays both a heading ("Compare pools") and a button with identical text ("Compare Pools"). This creates visual redundancy where the heading adds no additional value beyond what the button already communicates.

## Solution

Remove the `<h2 className="compare-bar__heading">Compare pools</h2>` element from the single mode render, keeping only the button.

## Design

### Component Changes

**File:** `src/components/ComparePoolBar.tsx`

**Current structure (lines 28-42):**
```tsx
if (props.mode === 'single') {
  return (
    <div className="compare-bar compare-bar--single">
      <h2 className="compare-bar__heading">Compare pools</h2>
      <button
        type="button"
        className="compare-bar__start"
        onClick={props.onStartCompare}
        disabled={props.startDisabled}
        aria-label="Compare pools"
      >
        Compare Pools
      </button>
    </div>
  );
}
```

**New structure:**
```tsx
if (props.mode === 'single') {
  return (
    <div className="compare-bar compare-bar--single">
      <button
        type="button"
        className="compare-bar__start"
        onClick={props.onStartCompare}
        disabled={props.startDisabled}
        aria-label="Compare pools"
      >
        Compare Pools
      </button>
    </div>
  );
}
```

### Rationale

1. **Eliminates redundancy:** The button text "Compare Pools" is self-explanatory and serves as the primary call-to-action
2. **Maintains accessibility:** The button retains its `aria-label="Compare pools"` attribute, ensuring screen reader users understand the button's purpose
3. **Cleaner UI:** Removing the heading creates a more focused, less cluttered interface
4. **No functional impact:** The heading provided no interactive functionality, only visual labeling that duplicated the button

### Impact Analysis

**Affected:**
- Visual layout of single mode compare bar (simplified)
- DOM structure (one fewer element)

**Unaffected:**
- Button functionality and accessibility
- Compare mode with tabs (lines 68-129) - does not use this heading
- CSS class `.compare-bar__heading` can remain in stylesheet (no breaking changes required)
- Any other components or features

### Testing Verification

1. Verify button remains functional in single mode
2. Verify button maintains proper accessibility (screen reader announcement)
3. Check visual layout renders correctly without heading
4. Ensure compare mode (with tabs) continues to work as expected
5. Test button disabled state styling

## Files Modified

1. `src/components/ComparePoolBar.tsx` - Remove heading element (line 31)

## Alternative Approaches Considered

### Option 2: Visually hide heading, keep for screen readers
- Add `sr-only` class to heading to hide visually but preserve in DOM
- **Rejected:** Button already has proper `aria-label`, making this redundant

### Option 3: Replace with descriptive label
- Change heading to non-redundant text like "Comparison mode"
- **Rejected:** Still adds visual clutter; button is sufficiently self-descriptive

## Success Criteria

- Single mode compare bar displays only the button without a heading
- Button remains fully functional and accessible
- No visual regressions in layout or spacing
- Compare mode (tabs) unaffected
