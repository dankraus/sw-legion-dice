# Share Card (Image + Text) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A header **Share** button opens a modal with a live preview of a "Style B" results card plus Copy link, Copy text, Copy image (PNG), and Download PNG actions. The card is compare-aware.

**Architecture:** Reuse the `PoolConfig` + `computePoolResults` seam (from the comparison plan). A `describeActiveModifiers` helper and a `buildShareText` pure function generate the non-default modifier list and the Reddit text block. A presentational `ShareCard` renders the light card; `ShareModal` shows a scaled preview + an off-screen full-res card captured to PNG with `html-to-image`.

**Tech Stack:** React 19, TypeScript 5.9, Vite 6, Vitest 4, `html-to-image`.

---

Spec: `docs/superpowers/specs/2026-06-03-share-card-design.md`

**Dependency note:** This plan assumes the comparison plan's Tasks 1–2 are merged (it uses `PoolConfig`, `DEFAULT_POOL_CONFIG`, `computePoolResults`, `PoolResults`). If building this feature first, implement those two tasks first.

## File Structure

- Modify `package.json` — add `html-to-image`.
- Create `src/share/describeActiveModifiers.ts` (+ test) — non-default modifier labels.
- Create `src/share/shareText.ts` (+ test) — `buildShareText`.
- Create `src/share/shareImage.ts` — `copyImageToClipboard`, `downloadPng`.
- Create `src/components/ShareCard.tsx` (+ `.css`) — light card, compare-aware.
- Create `src/components/ShareModal.tsx` (+ `.css`, + test) — preview + actions.
- Modify `src/App.tsx` — Share button opens `ShareModal`.

---

### Task 1: Add `html-to-image` dependency

**Files:**
- Modify: `package.json` (via npm)

- [ ] **Step 1: Install**

Run: `npm install html-to-image`
Expected: `html-to-image` added to `dependencies`.

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "build: add html-to-image dependency"
```

---

### Task 2: `describeActiveModifiers` (TDD)

**Files:**
- Create: `src/share/describeActiveModifiers.ts`
- Test: `src/share/describeActiveModifiers.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/share/describeActiveModifiers.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { describeActiveModifiers } from './describeActiveModifiers';
import { DEFAULT_POOL_CONFIG } from '../poolResults';

describe('describeActiveModifiers', () => {
  it('returns an empty array for a default config', () => {
    expect(describeActiveModifiers(DEFAULT_POOL_CONFIG)).toEqual([]);
  });

  it('lists non-default keyword, token, surge and cover values', () => {
    const labels = describeActiveModifiers({
      ...DEFAULT_POOL_CONFIG,
      surge: 'hit',
      aimTokens: '2',
      criticalX: '1',
      pierceX: '1',
      cover: 'light',
      outmaneuver: true,
    });
    expect(labels).toContain('Surge→Hit');
    expect(labels).toContain('Aim 2');
    expect(labels).toContain('Critical 1');
    expect(labels).toContain('Pierce 1');
    expect(labels).toContain('Cover Light');
    expect(labels).toContain('Outmaneuver');
  });

  it('ignores zero/empty numeric fields', () => {
    expect(
      describeActiveModifiers({ ...DEFAULT_POOL_CONFIG, aimTokens: '0' })
    ).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/share/describeActiveModifiers.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/share/describeActiveModifiers.ts`:

```ts
import type { PoolConfig } from '../types';

function countLabel(name: string, value: string): string | null {
  if (value === '') return null;
  const parsed = Math.max(0, Math.floor(Number(value)) || 0);
  return parsed > 0 ? `${name} ${parsed}` : null;
}

export function describeActiveModifiers(config: PoolConfig): string[] {
  const labels: (string | null)[] = [];

  if (config.surge === 'hit') labels.push('Surge→Hit');
  if (config.surge === 'crit') labels.push('Surge→Crit');

  labels.push(countLabel('Aim', config.aimTokens));
  labels.push(countLabel('Observe', config.observeTokens));
  labels.push(countLabel('Surge tokens', config.surgeTokens));
  labels.push(countLabel('Critical', config.criticalX));
  labels.push(countLabel('Precise', config.preciseX));
  labels.push(countLabel('Ram', config.ramX));
  labels.push(countLabel('Sharpshooter', config.sharpshooterX));
  labels.push(countLabel('Impact', config.impactX));
  labels.push(countLabel('Pierce', config.pierceX));

  if (config.defenseDieColor === 'white') labels.push('White defense');
  if (config.defenseSurge === 'block') labels.push('Def surge→Block');
  if (config.cover === 'light') labels.push('Cover Light');
  if (config.cover === 'heavy') labels.push('Cover Heavy');
  if (config.dugIn) labels.push('Dug In');
  if (config.lowProfile) labels.push('Low Profile');
  if (config.suppressed) labels.push('Suppressed');
  if (config.impervious) labels.push('Impervious');
  if (config.outmaneuver) labels.push('Outmaneuver');
  if (config.backup) labels.push('Backup');

  labels.push(countLabel('Cover+', config.coverX));
  labels.push(countLabel('Armor', config.armorX));
  labels.push(countLabel('Danger Sense', config.dangerSenseX));
  labels.push(countLabel('Uncanny Luck', config.uncannyLuckX));
  labels.push(countLabel('Dodge', config.dodgeTokens));
  labels.push(countLabel('Shield', config.shieldTokens));
  labels.push(countLabel('Def surge tokens', config.defenseSurgeTokens));
  labels.push(countLabel('Suppression', config.suppressionTokens));

  return labels.filter((label): label is string => label !== null);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/share/describeActiveModifiers.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/share/describeActiveModifiers.ts src/share/describeActiveModifiers.test.ts
git commit -m "feat: add describeActiveModifiers"
```

---

### Task 3: `buildShareText` (TDD)

**Files:**
- Create: `src/share/shareText.ts`
- Test: `src/share/shareText.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/share/shareText.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildShareText } from './shareText';
import { computePoolResults, DEFAULT_POOL_CONFIG } from '../poolResults';

const url = 'https://legionroller.com/#r=3';

describe('buildShareText', () => {
  it('renders a single-pool block with pool, mods, stats and url', () => {
    const config = {
      ...DEFAULT_POOL_CONFIG,
      pool: { red: 3, black: 1, white: 0 },
      aimTokens: '2',
      pointCost: '47',
    };
    const text = buildShareText({
      url,
      live: { config, results: computePoolResults(config), label: 'B' },
    });
    expect(text).toContain('Legion Roller');
    expect(text).toContain('3 red');
    expect(text).toContain('1 black');
    expect(text).toContain('Aim 2');
    expect(text).toContain('Avg total');
    expect(text).toContain('Pts/wound');
    expect(text).toContain(url);
  });

  it('omits efficiency when no point cost is set', () => {
    const config = { ...DEFAULT_POOL_CONFIG, pool: { red: 2, black: 0, white: 0 } };
    const text = buildShareText({
      url,
      live: { config, results: computePoolResults(config), label: 'B' },
    });
    expect(text).not.toContain('Pts/wound');
  });

  it('renders an A vs B comparison block when pinned is provided', () => {
    const configA = { ...DEFAULT_POOL_CONFIG, pool: { red: 3, black: 0, white: 0 } };
    const configB = { ...DEFAULT_POOL_CONFIG, pool: { red: 1, black: 0, white: 0 } };
    const text = buildShareText({
      url,
      live: { config: configB, results: computePoolResults(configB), label: 'Stock' },
      pinned: { config: configA, results: computePoolResults(configA), label: 'DLT' },
    });
    expect(text).toContain('DLT');
    expect(text).toContain('Stock');
    expect(text).toContain('vs');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/share/shareText.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/share/shareText.ts`:

```ts
import type { PoolConfig } from '../types';
import type { PoolResults } from '../poolResults';
import { describeActiveModifiers } from './describeActiveModifiers';

export interface SharePool {
  config: PoolConfig;
  results: PoolResults;
  label: string;
}

export interface ShareTextInput {
  url: string;
  live: SharePool;
  pinned?: SharePool;
}

function poolComposition(config: PoolConfig): string {
  const parts: string[] = [];
  if (config.pool.red > 0) parts.push(`${config.pool.red} red`);
  if (config.pool.black > 0) parts.push(`${config.pool.black} black`);
  if (config.pool.white > 0) parts.push(`${config.pool.white} white`);
  return parts.length > 0 ? parts.join(' ') : 'no attack dice';
}

function costValue(config: PoolConfig): number {
  const parsed = Number(config.pointCost);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function statsLine(pool: SharePool): string {
  const { results, woundsResults } = pool.results;
  const segments = [
    `Avg total ${results.expectedTotal.toFixed(2)}`,
    `Avg wounds ${woundsResults.expectedWounds.toFixed(2)}`,
  ];
  const cost = costValue(pool.config);
  if (cost > 0 && woundsResults.expectedWounds > 0) {
    segments.push(
      `Pts/wound ${(cost / woundsResults.expectedWounds).toFixed(1)}`
    );
  }
  return segments.join(', ');
}

function poolBlock(pool: SharePool): string {
  const mods = describeActiveModifiers(pool.config);
  const modText = mods.length > 0 ? ` | ${mods.join(', ')}` : '';
  return `${poolComposition(pool.config)}${modText} | ${statsLine(pool)}`;
}

export function buildShareText(input: ShareTextInput): string {
  const header = 'Legion Roller';
  if (input.pinned) {
    return [
      `${header} — ${input.pinned.label} vs ${input.live.label}`,
      `${input.pinned.label}: ${poolBlock(input.pinned)}`,
      `${input.live.label}: ${poolBlock(input.live)}`,
      input.url,
    ].join('\n');
  }
  return [`${header}`, poolBlock(input.live), input.url].join('\n');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/share/shareText.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/share/shareText.ts src/share/shareText.test.ts
git commit -m "feat: add buildShareText (single + compare)"
```

---

### Task 4: `shareImage` helpers

**Files:**
- Create: `src/share/shareImage.ts`
- Test: `src/share/shareImage.test.ts`

- [ ] **Step 1: Write the failing test (mock html-to-image)**

Create `src/share/shareImage.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('html-to-image', () => ({
  toBlob: vi.fn(async () => new Blob(['x'], { type: 'image/png' })),
  toPng: vi.fn(async () => 'data:image/png;base64,AAAA'),
}));

import { canCopyImage, copyImageToClipboard, downloadPng } from './shareImage';

describe('shareImage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('canCopyImage is false when ClipboardItem is missing', () => {
    const original = (globalThis as Record<string, unknown>).ClipboardItem;
    delete (globalThis as Record<string, unknown>).ClipboardItem;
    expect(canCopyImage()).toBe(false);
    (globalThis as Record<string, unknown>).ClipboardItem = original;
  });

  it('downloadPng triggers an anchor click', async () => {
    const node = document.createElement('div');
    const click = vi.fn();
    const realCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const element = realCreate(tag);
      if (tag === 'a') element.click = click;
      return element;
    });
    await downloadPng(node, 'card.png');
    expect(click).toHaveBeenCalled();
  });

  it('copyImageToClipboard writes a ClipboardItem', async () => {
    const write = vi.fn(async () => undefined);
    (globalThis as Record<string, unknown>).ClipboardItem = class {
      constructor(public items: Record<string, Blob>) {}
    };
    Object.assign(navigator, { clipboard: { write } });
    await copyImageToClipboard(document.createElement('div'));
    expect(write).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/share/shareImage.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/share/shareImage.ts`:

```ts
import { toBlob, toPng } from 'html-to-image';

const PIXEL_RATIO = 2;

export function canCopyImage(): boolean {
  return (
    typeof ClipboardItem !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    !!navigator.clipboard?.write
  );
}

export async function copyImageToClipboard(node: HTMLElement): Promise<void> {
  const blob = await toBlob(node, { pixelRatio: PIXEL_RATIO });
  if (!blob) throw new Error('Failed to render card image');
  await navigator.clipboard.write([
    new ClipboardItem({ 'image/png': blob }),
  ]);
}

export async function downloadPng(
  node: HTMLElement,
  filename: string
): Promise<void> {
  const dataUrl = await toPng(node, { pixelRatio: PIXEL_RATIO });
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/share/shareImage.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/share/shareImage.ts src/share/shareImage.test.ts
git commit -m "feat: add shareImage clipboard/download helpers"
```

---

### Task 5: `ShareCard` component

**Files:**
- Create: `src/components/ShareCard.tsx`
- Create: `src/components/ShareCard.css`
- Test: `src/components/ShareCard.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/ShareCard.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ShareCard } from './ShareCard';
import { computePoolResults, DEFAULT_POOL_CONFIG } from '../poolResults';

describe('ShareCard', () => {
  it('shows pool composition, an active modifier, and headline stats', () => {
    const config = {
      ...DEFAULT_POOL_CONFIG,
      pool: { red: 3, black: 1, white: 0 },
      aimTokens: '2',
    };
    const { getByText } = render(
      <ShareCard
        url="https://legionroller.com/#r=3"
        live={{ config, results: computePoolResults(config), label: 'B' }}
      />
    );
    expect(getByText(/3 red/)).toBeTruthy();
    expect(getByText('Aim 2')).toBeTruthy();
    expect(getByText('Avg total')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ShareCard.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/components/ShareCard.css`:

```css
.share-card {
  width: 360px;
  background: #ffffff;
  color: #111827;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 16px;
  font-family: system-ui, -apple-system, sans-serif;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  box-sizing: border-box;
}

.share-card__brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  color: #1f2937;
  padding-bottom: 8px;
}

.share-card__brand img {
  width: 22px;
  height: 22px;
}

.share-card__pool-label {
  font-size: 12px;
  color: #6b7280;
  margin-top: 8px;
}

.share-card__dice {
  display: flex;
  gap: 5px;
  align-items: center;
  margin-top: 3px;
  font-size: 12px;
  color: #6b7280;
}

.share-card__die {
  width: 15px;
  height: 15px;
  border-radius: 3px;
  border: 1px solid #cbd5e1;
}

.share-card__pills {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 10px;
}

.share-card__pill {
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 10px;
}

.share-card__stats {
  display: flex;
  gap: 14px;
  margin-top: 14px;
  flex-wrap: wrap;
}

.share-card__stat-value {
  font-size: 20px;
  font-weight: 700;
}

.share-card__stat-value.is-wounds {
  color: #dc2626;
}

.share-card__stat-label {
  font-size: 11px;
  color: #6b7280;
}

.share-card__footer {
  border-top: 1px solid #eee;
  margin-top: 12px;
  padding-top: 8px;
  font-size: 11px;
  color: #9ca3af;
  word-break: break-all;
}

.share-card--compare {
  width: 480px;
}

.share-card__columns {
  display: flex;
  gap: 16px;
}

.share-card__columns > div {
  flex: 1;
}
```

Create `src/components/ShareCard.tsx`:

```tsx
import type { PoolConfig } from '../types';
import type { PoolResults } from '../poolResults';
import { describeActiveModifiers } from '../share/describeActiveModifiers';
import './ShareCard.css';

export interface ShareCardPool {
  config: PoolConfig;
  results: PoolResults;
  label: string;
}

interface ShareCardProps {
  url: string;
  live: ShareCardPool;
  pinned?: ShareCardPool;
}

const DIE_COLORS: Record<string, string> = {
  red: '#dc2626',
  black: '#111111',
  white: '#ffffff',
};

function costValue(config: PoolConfig): number {
  const parsed = Number(config.pointCost);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function DiceRow({ config }: { config: PoolConfig }) {
  const attack: { color: string; count: number; name: string }[] = [
    { color: DIE_COLORS.red, count: config.pool.red, name: 'red' },
    { color: DIE_COLORS.black, count: config.pool.black, name: 'black' },
    { color: DIE_COLORS.white, count: config.pool.white, name: 'white' },
  ].filter((entry) => entry.count > 0);

  const text = attack.map((entry) => `${entry.count} ${entry.name}`).join(' · ');

  return (
    <>
      <div className="share-card__pool-label">Attack</div>
      <div className="share-card__dice">
        {attack.flatMap((entry) =>
          Array.from({ length: entry.count }).map((_, index) => (
            <span
              key={`${entry.name}-${index}`}
              className="share-card__die"
              style={{ background: entry.color }}
            />
          ))
        )}
        <span>{text || 'none'}</span>
      </div>
    </>
  );
}

function StatBlock({ pool }: { pool: ShareCardPool }) {
  const { results, woundsResults } = pool.results;
  const cost = costValue(pool.config);
  const ptsPerWound =
    cost > 0 && woundsResults.expectedWounds > 0
      ? (cost / woundsResults.expectedWounds).toFixed(1)
      : null;
  return (
    <div className="share-card__stats">
      <div>
        <div className="share-card__stat-value">
          {results.expectedTotal.toFixed(2)}
        </div>
        <div className="share-card__stat-label">Avg total</div>
      </div>
      <div>
        <div className="share-card__stat-value is-wounds">
          {woundsResults.expectedWounds.toFixed(2)}
        </div>
        <div className="share-card__stat-label">Avg wounds</div>
      </div>
      {ptsPerWound !== null && (
        <div>
          <div className="share-card__stat-value">{ptsPerWound}</div>
          <div className="share-card__stat-label">Pts/wound</div>
        </div>
      )}
    </div>
  );
}

function PoolDetails({ pool }: { pool: ShareCardPool }) {
  const mods = describeActiveModifiers(pool.config);
  return (
    <div>
      <DiceRow config={pool.config} />
      {mods.length > 0 && (
        <div className="share-card__pills">
          {mods.map((mod) => (
            <span key={mod} className="share-card__pill">
              {mod}
            </span>
          ))}
        </div>
      )}
      <StatBlock pool={pool} />
    </div>
  );
}

export function ShareCard({ url, live, pinned }: ShareCardProps) {
  return (
    <div className={'share-card' + (pinned ? ' share-card--compare' : '')}>
      <div className="share-card__brand">
        <img src="/logo.svg" alt="" />
        Legion Roller
      </div>
      {pinned ? (
        <div className="share-card__columns">
          <div>
            <strong>{pinned.label}</strong>
            <PoolDetails pool={pinned} />
          </div>
          <div>
            <strong>{live.label}</strong>
            <PoolDetails pool={live} />
          </div>
        </div>
      ) : (
        <PoolDetails pool={live} />
      )}
      <div className="share-card__footer">{url}</div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/ShareCard.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ShareCard.tsx src/components/ShareCard.css src/components/ShareCard.test.tsx
git commit -m "feat: add ShareCard presentational component"
```

---

### Task 6: `ShareModal` component

**Files:**
- Create: `src/components/ShareModal.tsx`
- Create: `src/components/ShareModal.css`
- Test: `src/components/ShareModal.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/ShareModal.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ShareModal } from './ShareModal';
import { computePoolResults, DEFAULT_POOL_CONFIG } from '../poolResults';

vi.mock('html-to-image', () => ({
  toBlob: vi.fn(async () => new Blob(['x'], { type: 'image/png' })),
  toPng: vi.fn(async () => 'data:image/png;base64,AAAA'),
}));

const config = { ...DEFAULT_POOL_CONFIG, pool: { red: 2, black: 0, white: 0 } };
const live = { config, results: computePoolResults(config), label: 'B' };

describe('ShareModal', () => {
  it('renders the action buttons and closes on backdrop click', () => {
    const onClose = vi.fn();
    const { getByText, getByRole } = render(
      <ShareModal url="https://legionroller.com/#r=2" live={live} onClose={onClose} />
    );
    expect(getByText('Copy link')).toBeTruthy();
    expect(getByText('Copy text')).toBeTruthy();
    expect(getByText('Download PNG')).toBeTruthy();
    fireEvent.click(getByRole('dialog').parentElement as HTMLElement);
    expect(onClose).toHaveBeenCalled();
  });

  it('disables image/text actions when the pool is empty', () => {
    const emptyConfig = { ...DEFAULT_POOL_CONFIG };
    const { getByText } = render(
      <ShareModal
        url="https://legionroller.com/"
        live={{ config: emptyConfig, results: computePoolResults(emptyConfig), label: 'B' }}
        onClose={() => {}}
      />
    );
    expect((getByText('Copy text') as HTMLButtonElement).disabled).toBe(true);
    expect((getByText('Copy link') as HTMLButtonElement).disabled).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ShareModal.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/components/ShareModal.css`:

```css
.share-modal__backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1rem;
}

.share-modal__panel {
  background: #fff;
  border-radius: 12px;
  padding: 1.25rem;
  max-width: 640px;
  width: 100%;
  max-height: 90vh;
  overflow: auto;
}

.share-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.share-modal__close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
}

.share-modal__preview {
  display: flex;
  justify-content: center;
  background: #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  overflow: auto;
}

.share-modal__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.share-modal__actions button {
  padding: 0.5rem 0.9rem;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: #f9fafb;
  cursor: pointer;
}

.share-modal__actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.share-modal__hint {
  font-size: 0.8rem;
  color: #6b7280;
  margin-top: 0.5rem;
}

.share-modal__offscreen {
  position: absolute;
  left: -10000px;
  top: 0;
}
```

Create `src/components/ShareModal.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react';
import { ShareCard, type ShareCardPool } from './ShareCard';
import { buildShareText } from '../share/shareText';
import {
  canCopyImage,
  copyImageToClipboard,
  downloadPng,
} from '../share/shareImage';
import './ShareModal.css';

interface ShareModalProps {
  url: string;
  live: ShareCardPool;
  pinned?: ShareCardPool;
  onClose: () => void;
}

export function ShareModal({ url, live, pinned, onClose }: ShareModalProps) {
  const captureRef = useRef<HTMLDivElement>(null);
  const [feedback, setFeedback] = useState<string>('');

  const hasDice =
    live.config.pool.red + live.config.pool.black + live.config.pool.white > 0;
  const imageCopyable = canCopyImage();

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const flash = (message: string) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(''), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(url).then(
      () => flash('Link copied'),
      () => {}
    );
  };

  const handleCopyText = () => {
    const text = buildShareText({ url, live, pinned });
    navigator.clipboard?.writeText(text).then(
      () => flash('Text copied'),
      () => {}
    );
  };

  const handleCopyImage = async () => {
    if (!captureRef.current) return;
    try {
      await copyImageToClipboard(captureRef.current);
      flash('Image copied');
    } catch {
      flash('Could not copy image — try Download PNG');
    }
  };

  const handleDownload = async () => {
    if (!captureRef.current) return;
    await downloadPng(captureRef.current, 'legion-roller-card.png');
    flash('Downloaded');
  };

  return (
    <div className="share-modal__backdrop" onClick={onClose}>
      <div
        className="share-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-label="Share"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="share-modal__header">
          <h2>Share</h2>
          <button
            type="button"
            className="share-modal__close"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="share-modal__preview">
          <ShareCard url={url} live={live} pinned={pinned} />
        </div>

        <div className="share-modal__actions">
          <button type="button" onClick={handleCopyLink}>
            Copy link
          </button>
          <button type="button" onClick={handleCopyText} disabled={!hasDice}>
            Copy text
          </button>
          {imageCopyable && (
            <button type="button" onClick={handleCopyImage} disabled={!hasDice}>
              Copy image
            </button>
          )}
          <button type="button" onClick={handleDownload} disabled={!hasDice}>
            Download PNG
          </button>
        </div>

        {feedback && <p className="share-modal__hint">{feedback}</p>}
        {!hasDice && (
          <p className="share-modal__hint">Add dice to share an image or text.</p>
        )}

        <div className="share-modal__offscreen" aria-hidden="true">
          <div ref={captureRef}>
            <ShareCard url={url} live={live} pinned={pinned} />
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/ShareModal.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/ShareModal.tsx src/components/ShareModal.css src/components/ShareModal.test.tsx
git commit -m "feat: add ShareModal with preview and copy/download actions"
```

---

### Task 7: Wire `ShareModal` into `App.tsx`

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Replace the Share button behavior**

Add import:

```ts
import { ShareModal } from './components/ShareModal';
```

Add state near `diceRollerOpen`:

```ts
const [shareOpen, setShareOpen] = useState(false);
```

Change the header **Share** button to open the modal instead of copying the link directly:

```tsx
<button
  type="button"
  className="app__reset"
  onClick={() => setShareOpen(true)}
  title="Share this setup as a link, text, or image"
>
  Share
</button>
```

Remove the now-unused `handleCopyLink`/`copyFeedback` only if nothing else uses them; otherwise leave them. (The modal owns link copying.)

- [ ] **Step 2: Render the modal**

Near the `DiceRollerModal` render, add:

```tsx
{shareOpen ? (
  <ShareModal
    url={window.location.href}
    live={{ config: liveConfig, results: liveResults, label: labelB || 'B' }}
    pinned={
      pinnedConfig && pinnedResults
        ? { config: pinnedConfig, results: pinnedResults, label: labelA || 'A' }
        : undefined
    }
    onClose={() => setShareOpen(false)}
  />
) : null}
```

This reuses `liveConfig`, `liveResults`, `pinnedConfig`, `pinnedResults`, `labelA`, `labelB` from the comparison plan. If the comparison feature is not present, pass only `live` and omit `pinned`.

- [ ] **Step 3: Verify**

Run: `npm run test && npx tsc -b && npm run lint && npm run build`
Expected: all pass.

Manual check (`npm run dev`):
1. Click **Share** → modal opens with a live card preview.
2. **Copy link** copies the URL; **Copy text** copies the text block; **Download PNG** downloads a PNG; **Copy image** copies a PNG (Chrome/Edge/Safari).
3. With 0 dice, image/text/PNG disabled with the hint; link still works.
4. In compare mode, the card shows A and B columns.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: open ShareModal from header Share button"
```

---

## Self-Review

- **Spec coverage:** both formats (Tasks 3/4/6), Style B card content (Task 5), compare-aware (Tasks 3/5/6/7), preview modal placement (Tasks 6/7), `describeActiveModifiers` shared by card + text (Tasks 2/3/5), empty-pool disabling + clipboard-unsupported fallback (Task 6), `html-to-image` dependency (Task 1). All covered.
- **Type consistency:** `ShareCardPool` (Task 5) and `SharePool` (Task 3) share the `{ config, results, label }` shape; `ShareModal` imports `ShareCardPool` from `ShareCard`. `PoolResults` (comparison plan Task 2) is used throughout. `canCopyImage`/`copyImageToClipboard`/`downloadPng` names match between Tasks 4 and 6.
- **No placeholders:** all steps contain runnable code/commands.
- **Cross-plan dependency:** explicitly noted that comparison Tasks 1–2 (`PoolConfig`, `computePoolResults`, `PoolResults`) must exist first.
