# Simulation Accuracy Note Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add explanatory text to the footer informing users that the calculator uses Monte Carlo simulation with 10,000 runs.

**Architecture:** Update existing footer tagline text in App.tsx to include simulation methodology explanation. No new components or CSS needed.

**Tech Stack:** React (TypeScript), existing App component

---

## File Structure

**Modified:**
- `src/App.tsx` - Update footer tagline paragraph (line ~959-962)

**No new files created.**

---

## Task 1: Update Footer Tagline

**Files:**
- Modify: `src/App.tsx:959-962`

- [ ] **Step 1: Update the footer tagline text**

In `src/App.tsx`, locate the `app__footer-tagline` paragraph (around line 959-962):

**Current:**
```tsx
<p className="app__footer-tagline">
  Legion Roller is a dice simulator and probability calculator for Star
  Wars Legion by Atomic Mass Games.
</p>
```

**Replace with:**
```tsx
<p className="app__footer-tagline">
  Legion Roller is a dice simulator and probability calculator for Star
  Wars Legion by Atomic Mass Games. Results are calculated using Monte Carlo 
  simulation with 10,000 runs to accurately model dice roll distributions.
</p>
```

- [ ] **Step 2: Verify dev server is running**

Check if dev server is already running:
```bash
# In terminals folder, check if server is running
head -n 10 /Users/dan/.cursor/projects/Users-dan-Documents-code-legion-dice/terminals/*.txt | grep "npm run dev"
```

If not running, start it:
```bash
npm run dev
```

Expected: Server starts on `http://localhost:5173`

- [ ] **Step 3: Verify the change in browser**

1. Open `http://localhost:5173` in browser
2. Scroll to footer at bottom of page
3. Verify the tagline now reads:
   - First sentence: "Legion Roller is a dice simulator and probability calculator for Star Wars Legion by Atomic Mass Games."
   - Second sentence: "Results are calculated using Monte Carlo simulation with 10,000 runs to accurately model dice roll distributions."
4. Check that text wraps appropriately at different viewport widths (desktop, tablet, mobile)

Expected: Footer displays updated text with proper wrapping

- [ ] **Step 4: Run linter**

```bash
npm run lint
```

Expected: No new linting errors

- [ ] **Step 5: Commit the change**

```bash
git add src/App.tsx
git commit -m "feat: add Monte Carlo simulation explanation to footer

Adds explanatory text to help users understand that results are
calculated using simulation with 10,000 runs. This builds trust
in the accuracy of the results, especially for power users."
```

Expected: Commit succeeds with 1 file changed, ~3 insertions

---

## Plan Self-Review

**Spec coverage:**
- ✓ Display location: Footer tagline paragraph
- ✓ Content: Explains Monte Carlo simulation with 10,000 runs
- ✓ No user controls needed
- ✓ Simple implementation (no new components)

**Placeholder scan:**
- No "TBD", "TODO", or vague instructions
- All steps have concrete actions and expected outcomes

**Type consistency:**
- N/A (no new functions or types introduced)

**Testing:**
- Manual verification in browser sufficient for text change
- Linting ensures no TypeScript errors
