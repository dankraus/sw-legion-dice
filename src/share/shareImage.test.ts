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
      constructor(items: Record<string, Blob>) {
        void items;
      }
    };
    Object.assign(navigator, { clipboard: { write } });
    await copyImageToClipboard(document.createElement('div'));
    expect(write).toHaveBeenCalled();
  });
});
