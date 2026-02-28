# Defense Dice Toggle Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the Defense dice (Red/White) radio control with a toggle-button component styled like Surge/Cover, using attack-pool red/white colors.

**Architecture:** Add a new `DefenseDiceToggle` component that follows the same structure as `SurgeToggle` and `CoverToggle` (fieldset, legend, option labels, hidden radios). Reuse `SurgeToggle.css` for layout; add `DefenseDiceToggle.css` to override colors per option (red/white) and active state. Swap the component into `App.tsx` in place of the inline Defense dice fieldset.

**Tech Stack:** React 19, TypeScript, Vite; existing types from `src/types.ts` (`DefenseDieColor`).

---

## Task 1: Create DefenseDiceToggle component

**Files:**

- Create: `src/components/DefenseDiceToggle.tsx`
- Create: `src/components/DefenseDiceToggle.css`

**Step 1: Create the component file**

Create `src/components/DefenseDiceToggle.tsx` with the same structure as `SurgeToggle.tsx` and `CoverToggle.tsx`: options Red and White, `value`/`onChange` props typed as `DefenseDieColor`, fieldset with a wrapper class `defense-dice-toggle` for styling overrides, legend "Defense dice", hidden radios with `name="defense-dice"`, and import `./SurgeToggle.css` and `./DefenseDiceToggle.css`.

Reference implementation pattern from `src/components/CoverToggle.tsx` (OPTIONS array, map over options, `surge-toggle__option`, `surge-toggle__option--active`, `surge-toggle__radio`).

**Step 2: Create minimal CSS file**

Create `src/components/DefenseDiceToggle.css` with:

- `.defense-dice-toggle .surge-toggle__option:first-child` — default: background `#fee2e2`, border `2px solid #ef4444`; active (when `.surge-toggle__option--active`): border `#b91c1c` (or `#dc2626`), ensure text color readable (e.g. `#991b1b`).
- `.defense-dice-toggle .surge-toggle__option:last-child` — default: background `#f9fafb`, border `2px solid #d1d5db`; active: border `#9ca3af`, text e.g. `#374151`.

**Step 3: Commit**

```bash
git add src/components/DefenseDiceToggle.tsx src/components/DefenseDiceToggle.css
git commit -m "feat: add DefenseDiceToggle component with red/white styling"
```

---

## Task 2: Integrate DefenseDiceToggle in App

**Files:**

- Modify: `src/App.tsx` (import and replace inline Defense dice fieldset)

**Step 1: Add import**

In `src/App.tsx`, add:
`import { DefenseDiceToggle } from './components/DefenseDiceToggle';`

**Step 2: Replace inline Defense dice fieldset**

Remove the entire `<fieldset className="surge-toggle">` block for "Defense dice" (the one with the two radio labels "Red" and "White", currently around lines 199–217). Replace it with:

```tsx
<DefenseDiceToggle value={defenseDieColor} onChange={setDefenseDieColor} />
```

**Step 3: Run dev server and verify**

Run: `npm run dev`  
Verify: Defense section shows two toggle buttons "Red" and "White" with red/white styling; switching updates results; layout matches other toggles.

**Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: use DefenseDiceToggle in App for defense dice selection"
```

---

## Task 3: Lint and build check

**Step 1: Lint**

Run: `npm run lint`  
Expected: No errors.

**Step 2: Build**

Run: `npm run build`  
Expected: Build succeeds.

**Step 3: Commit (if any fixes were needed)**

If lint or build failed, fix and re-run, then commit the fixes.

---

## Execution handoff

Plan complete and saved to `docs/plans/2026-02-26-defense-dice-toggle.md`.

Two execution options:

1. **Subagent-Driven (this session)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Parallel Session (separate)** — Open a new session with executing-plans in this repo/worktree for batch execution with checkpoints.

Which approach?
