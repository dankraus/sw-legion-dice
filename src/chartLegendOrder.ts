import type { LegendPayload } from 'recharts';

/** Pool A (primary) before pool B (secondary); Recharts defaults to alphabetical by label. */
export function poolCompareLegendItemSorter(item: LegendPayload): number {
  return item.dataKey === 'primary' ? 0 : 1;
}
