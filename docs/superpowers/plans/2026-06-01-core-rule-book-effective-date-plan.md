# Core Rule Book Effective Date Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display a header line “Core Rule Book effective 5.29.2026” linking to AMG’s Legion rules docs.

**Architecture:** Constants in `src/rulebook.ts`; small `RulebookVersion` component; wired into existing header title block with new CSS class. No engine or URL state changes.

**Tech Stack:** React 19, TypeScript, Vite, existing `App.css` patterns.

**Spec:** `docs/superpowers/specs/2026-06-01-core-rule-book-effective-date-design.md`

---

### Task 1: Rulebook constants

**Files:**
- Create: `src/rulebook.ts`

- [ ] **Step 1: Add constants file**

```ts
/** Date string shown in the UI; update when rules alignment changes. */
export const CORE_RULE_BOOK_EFFECTIVE_DATE = '5.29.2026';

export const CORE_RULE_BOOK_DOCS_URL =
  'https://www.atomicmassgames.com/swlegiondocs/';
```

- [ ] **Step 2: Verify TypeScript**

Run: `npm run build`  
Expected: PASS (no consumers yet; build should still succeed)

---

### Task 2: RulebookVersion component

**Files:**
- Create: `src/components/RulebookVersion.tsx`

- [ ] **Step 1: Create component**

```tsx
import {
  CORE_RULE_BOOK_DOCS_URL,
  CORE_RULE_BOOK_EFFECTIVE_DATE,
} from '../rulebook';

export function RulebookVersion() {
  return (
    <p className="app__rulebook-version">
      <a
        href={CORE_RULE_BOOK_DOCS_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Star Wars Legion Core Rule Book on Atomic Mass Games (opens in new tab)"
      >
        Core Rule Book effective {CORE_RULE_BOOK_EFFECTIVE_DATE}
      </a>
    </p>
  );
}
```

---

### Task 3: Header integration and styles

**Files:**
- Modify: `src/App.tsx` (import + render below subtitle)
- Modify: `src/App.css` (`.app__rulebook-version`)

- [ ] **Step 1: Import and render in header**

In `src/App.tsx`, add:

```tsx
import { RulebookVersion } from './components/RulebookVersion';
```

Inside `app__header-title`, after the subtitle `<p>`:

```tsx
<RulebookVersion />
```

- [ ] **Step 2: Add CSS**

In `src/App.css`, after `.app__header-subtitle` block:

```css
.app__rulebook-version {
  font-size: 0.8rem;
  color: #9ca3af;
  margin: 0;
}

.app__rulebook-version a {
  color: inherit;
  text-decoration: none;
}

.app__rulebook-version a:hover {
  color: #6b7280;
  text-decoration: underline;
  text-underline-offset: 0.15em;
}

.app__rulebook-version a:focus-visible {
  outline: 2px solid #1d4ed8;
  outline-offset: 2px;
  color: #6b7280;
}
```

- [ ] **Step 3: Verify**

Run: `npm run lint`  
Expected: PASS

Run: `npm run build`  
Expected: PASS

- [ ] **Step 4: Manual check**

Run: `npm run dev`  
Confirm under “Never tell me the odds!”:
- Text reads `Core Rule Book effective 5.29.2026`
- Click opens https://www.atomicmassgames.com/swlegiondocs/ in a new tab
