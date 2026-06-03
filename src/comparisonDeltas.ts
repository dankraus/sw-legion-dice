import type { PoolResults } from './poolResults';

export interface DeltaRow {
  label: string;
  a: number | null;
  b: number | null;
  delta: number | null;
  betterIsHigher: boolean;
  bIsBetter: boolean | null;
}

function cost(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function ratio(costValue: number, denominator: number): number | null {
  if (costValue <= 0 || denominator <= 0) return null;
  return costValue / denominator;
}

export function buildDeltaRows(
  a: PoolResults,
  b: PoolResults,
  costA: string,
  costB: string
): DeltaRow[] {
  const rows: DeltaRow[] = [];

  const push = (
    label: string,
    aValue: number | null,
    bValue: number | null,
    betterIsHigher: boolean
  ) => {
    const delta = aValue !== null && bValue !== null ? bValue - aValue : null;
    let bIsBetter: boolean | null = null;
    if (delta !== null && delta !== 0) {
      bIsBetter = betterIsHigher ? delta > 0 : delta < 0;
    }
    rows.push({
      label,
      a: aValue,
      b: bValue,
      delta,
      betterIsHigher,
      bIsBetter,
    });
  };

  push('Avg hits', a.results.expectedHits, b.results.expectedHits, true);
  push('Avg crits', a.results.expectedCrits, b.results.expectedCrits, true);
  push('Avg total', a.results.expectedTotal, b.results.expectedTotal, true);

  const costAValue = cost(costA);
  const costBValue = cost(costB);

  if (costAValue > 0 || costBValue > 0) {
    push(
      'Pts/success',
      ratio(costAValue, a.results.expectedTotal),
      ratio(costBValue, b.results.expectedTotal),
      false
    );
  }

  push(
    'Avg wounds',
    a.woundsResults.expectedWounds,
    b.woundsResults.expectedWounds,
    true
  );

  if (costAValue > 0 || costBValue > 0) {
    push(
      'Pts/wound',
      ratio(costAValue, a.woundsResults.expectedWounds),
      ratio(costBValue, b.woundsResults.expectedWounds),
      false
    );
  }

  return rows;
}
