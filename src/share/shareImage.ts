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
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
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
