import { describe, it, expect } from 'vitest';
import { buildDeltaRows } from './comparisonDeltas';
import type { PoolResults } from './poolResults';

function fakeResults(total: number, wounds: number): PoolResults {
  return {
    results: {
      expectedHits: total / 2,
      expectedCrits: total / 2,
      expectedTotal: total,
      distribution: [],
      distributionByHitsCrits: [],
      cumulative: [],
    },
    woundsResults: {
      expectedWounds: wounds,
      distribution: [],
      cumulative: [],
    },
  };
}

describe('buildDeltaRows', () => {
  it('marks higher avg total for B as better (positive direction)', () => {
    const rows = buildDeltaRows(fakeResults(2, 1), fakeResults(3, 1.5), '', '');
    const total = rows.find((row) => row.label === 'Avg total')!;
    expect(total.valueA).toBeCloseTo(2);
    expect(total.valueB).toBeCloseTo(3);
    expect(total.delta).toBeCloseTo(1);
    expect(total.betterIsHigher).toBe(true);
    expect(total.bIsBetter).toBe(true);
  });

  it('omits efficiency rows when neither pool has a cost', () => {
    const rows = buildDeltaRows(fakeResults(2, 1), fakeResults(3, 1.5), '', '');
    expect(rows.some((row) => row.label === 'Pts/wound')).toBe(false);
  });

  it('includes efficiency rows and treats lower pts/wound as better', () => {
    const rows = buildDeltaRows(
      fakeResults(2, 1),
      fakeResults(3, 2),
      '40',
      '40'
    );
    const ptsWound = rows.find((row) => row.label === 'Pts/wound')!;
    expect(ptsWound.valueA).toBeCloseTo(40);
    expect(ptsWound.valueB).toBeCloseTo(20);
    expect(ptsWound.betterIsHigher).toBe(false);
    expect(ptsWound.bIsBetter).toBe(true);
  });
});
