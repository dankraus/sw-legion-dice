# URL Fragment Share Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Encode app inputs and selections in the URL fragment so users can share links; keep the URL in sync on every change and add a "Copy link" button.

**Architecture:** Add `src/urlState.ts` with a flat `UrlState` type (short keys), defaults, `parseFragment(hash)` (returns full state with defaults), and `buildFragment(state)` (returns query string with only non-default keys). App reads hash on mount and applies to state; one `useEffect` syncs state to hash via `history.replaceState`; header gets a "Copy link" button that copies `window.location.href`.

**Tech Stack:** TypeScript, React, Vite. No new dependencies. See `AGENTS.md` for commands.

**Design:** `docs/plans/2026-02-28-url-fragment-share-design.md`

---

### Task 1: urlState module — types, defaults, parseFragment, buildFragment

**Files:**
- Create: `src/urlState.ts`
- Create: `src/urlState.test.ts`

**Step 1: Add tests for parseFragment and buildFragment**

In `src/urlState.test.ts`, add tests that:
- `parseFragment('')` or `parseFragment('#')` returns default state (all defaults).
- `parseFragment('#r=2&b=1')` returns state with `r: 2`, `b: 1`, and the rest default.
- `buildFragment(defaultState)` returns `''` (or empty fragment).
- Roundtrip: for a non-default state object, `parseFragment('#' + buildFragment(state))` equals that state (or at least the same serialized fields).
- Enum validation: `parseFragment('#surge=invalid')` yields `surge: 'none'`. Same idea for `cover`, `dSurge`, `dColor`.
- Boolean: `parseFragment('#out=1')` yields `out: true`; `#out=0` yields `out: false`.
- Unknown keys in hash are ignored.

Use Vitest. Import `parseFragment`, `buildFragment`, and default state from `./urlState`.

**Step 2: Run tests to verify they fail**

Run: `npm run test -- src/urlState.test.ts`
Expected: FAIL (module or functions do not exist).

**Step 3: Implement urlState.ts**

- Define `UrlState` type with fields: `r`, `b`, `w`, `surge`, `crit`, `sTok`, `aim`, `obs`, `precise`, `ram`, `sharp`, `pierce`, `impact`, `cost`, `dColor`, `dSurge`, `dSurgeTok`, `dodge`, `out`, `cover`, `lowProf`, `sup`, `coverX`, `armor`, `imp`, `suppTok`, `danger`, `backup`. Use types that match the design (numbers for counts, string literals for enums, booleans for flags). Export a `DEFAULT_URL_STATE` constant.
- Implement `parseFragment(hash: string): UrlState`: strip leading `#`, use `URLSearchParams`, for each known key coerce and assign; unknown keys ignore; invalid enum/number fall back to default. Return full `UrlState`.
- Implement `buildFragment(state: UrlState): string`: build list of `key=encodeURIComponent(value)` only where `state[key] !== DEFAULT_URL_STATE[key]` (and handle empty string vs 0 where they are equivalent). Join with `&`. Return string without leading `#`.

**Step 4: Run tests to verify they pass**

Run: `npm run test -- src/urlState.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/urlState.ts src/urlState.test.ts
git commit -m "feat: add urlState parseFragment and buildFragment"
```

---

### Task 2: App — initialize state from hash on mount

**Files:**
- Modify: `src/App.tsx`

**Step 1: Read hash on mount and apply to state**

- On first mount, read `window.location.hash`. If it is empty or only `#`, do nothing.
- Otherwise call `parseFragment(window.location.hash)` to get a `UrlState`.
- Map parsed result to existing state: `setPool({ red: parsed.r, black: parsed.b, white: parsed.w })`, `setSurge(parsed.surge)`, `setCriticalX(parsed.crit === 0 ? '' : String(parsed.crit))` (or however crit is stored — string for display), and so on for every field. Use a single `useEffect` with empty dependency array so it runs once on mount. Ensure string fields that are "0" or 0 get mapped to `''` when the UI uses empty string for "no value" (e.g. criticalX, pointCost, token counts).
- Map booleans: `out` → `setOutmaneuver`, `lowProf` → `setLowProfile`, `sup` → `setSuppressed`, `imp` → `setImpervious`, `backup` → `setBackup`.
- Map numeric-like strings: for inputs that are stored as strings (e.g. `criticalX`, `surgeTokens`), set `parsed.crit === 0 ? '' : String(parsed.crit)` and similarly for others so the UI shows empty when 0.

**Step 2: Manual verification**

Start dev server, open `http://localhost:5173/#r=2&b=1&surge=hit`. Confirm attack pool shows 2 red, 1 black, surge conversion Hit. Open `http://localhost:5173/` with no hash; confirm default state. Open a link with invalid enum `#surge=foo`; confirm surge is None (default).

**Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: initialize state from URL fragment on load"
```

---

### Task 3: App — sync state to URL fragment on change

**Files:**
- Modify: `src/App.tsx`

**Step 1: Build UrlState from React state**

Create a useMemo that builds the object expected by `buildFragment`: `{ r: pool.red, b: pool.black, w: pool.white, surge, crit: criticalX === '' ? 0 : Number(criticalX) ?? 0, ... }` (match UrlState type and defaults). Map every serialized field; for string inputs use 0 when empty or invalid.

**Step 2: Sync to hash with useEffect**

Add a `useEffect` that depends on the serialized state object (or its primitive parts). Inside: call `buildFragment(serializedState)`, then set the hash with `window.history.replaceState(undefined, '', window.location.pathname + window.location.search + (fragment ? '#' + fragment : ''))`. Do not use `pushState`. Ensure no extra history entry is created.

**Step 3: Manual verification**

Change dice, surge, a keyword; confirm URL updates (e.g. `#r=1&surge=crit`). Reset; confirm hash is removed or empty. Use browser back/forward after making changes; confirm back does not step through every slider change (only one history entry for the page).

**Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: sync state to URL fragment on change"
```

---

### Task 4: Copy link button in header

**Files:**
- Modify: `src/App.tsx`

**Step 1: Add Copy link button**

In the header (e.g. next to the Reset button), add a button "Copy link". On click: call `navigator.clipboard.writeText(window.location.href)`. Optionally add brief feedback (e.g. "Copied!" or checkmark for 1–2 seconds) using local state. If `navigator.clipboard` is undefined or `writeText` rejects, do nothing (or optionally show a fallback prompt with URL; design says optional).

**Step 2: Style**

Reuse existing header button style (e.g. same class as Reset or a shared `.app__header-btn`) so it looks consistent.

**Step 3: Manual verification**

Click "Copy link", paste in another tab; confirm the pasted URL opens with the same configuration.

**Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add Copy link button in header"
```

---

### Task 5: Lint and final verification

**Files:**
- Run: `npm run lint`
- Run: `npm run test`
- Run: `npm run build`

Fix any lint or type errors. Ensure all tests pass and build succeeds.

**Commit (if any fixes):**

```bash
git add [files]
git commit -m "chore: lint and fix URL fragment share"
```
