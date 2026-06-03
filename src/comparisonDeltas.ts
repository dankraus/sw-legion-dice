import type { PoolResults } from './poolResults';

export interface DeltaRow {
  label: string;
  valueA: number | null;
  valueB: number | null;
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
  resultsA: PoolResults,
  resultsB: PoolResults,
  costA: string,
  costB: string
): DeltaRow[] {
  const rows: DeltaRow[] = [];

  const push = (
    label: string,
    valueA: number | null,
    valueB: number | null,
    betterIsHigher: boolean
  ) => {
    const delta = valueA !== null && valueB !== null ? valueB - valueA : null;
    let bIsBetter: boolean | null = null;
    if (delta !== null && delta !== 0) {
      bIsBetter = betterIsHigher ? delta > 0 : delta < 0;
    }
    rows.push({
      label,
      valueA,
      valueB,
      delta,
      betterIsHigher,
      bIsBetter,
    });
  };

  push(
    'Avg hits',
    resultsA.results.expectedHits,
    resultsB.results.expectedHits,
    true
  );
  push(
    'Avg crits',
    resultsA.results.expectedCrits,
    resultsB.results.expectedCrits,
    true
  );
  push(
    'Avg total',
    resultsA.results.expectedTotal,
    resultsB.results.expectedTotal,
    true
  );

  const costAValue = cost(costA);
  const costBValue = cost(costB);

  if (costAValue > 0 || costBValue > 0) {
    push(
      'Pts/success',
      ratio(costAValue, resultsA.results.expectedTotal),
      ratio(costBValue, resultsB.results.expectedTotal),
      false
    );
  }

  push(
    'Avg wounds',
    resultsA.woundsResults.expectedWounds,
    resultsB.woundsResults.expectedWounds,
    true
  );

  if (costAValue > 0 || costBValue > 0) {
    push(
      'Pts/wound',
      ratio(costAValue, resultsA.woundsResults.expectedWounds),
      ratio(costBValue, resultsB.woundsResults.expectedWounds),
      false
    );
  }

  return rows;
}
