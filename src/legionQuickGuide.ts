/**
 * Legion Quick Guide base URL. Keywords/tokens link to anchors like #critical-x, #backup.
 * @see https://legionquickguide.com/
 */
export const LEGION_QUICK_GUIDE_BASE = 'https://legionquickguide.com';

export function legionQuickGuideHref(anchor: string): string {
  return `${LEGION_QUICK_GUIDE_BASE}/#${anchor}`;
}
