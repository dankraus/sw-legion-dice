import './CumulativeCurve.css';

type Row = { total: number; probability: number };

interface CumulativeCurveProps {
  cumulative: Row[];
  title?: string;
  secondary?: Row[];
  primaryLabel?: string;
  secondaryLabel?: string;
  defaultExpanded?: boolean;
}

interface ChartDataPoint {
  total: number;
  primary: number;
  secondary: number;
}

// eslint-disable-next-line react-refresh/only-export-components
export function transformCumulativeData(
  primary: Row[],
  secondary?: Row[]
): ChartDataPoint[] {
  // Ensure data is sorted for step function logic
  const sortedPrimary = [...primary].sort((a, b) => a.total - b.total);
  const sortedSecondary = secondary ? [...secondary].sort((a, b) => a.total - b.total) : undefined;

  // Get all unique totals from both datasets
  const allTotals = Array.from(
    new Set([
      ...sortedPrimary.map((row) => row.total),
      ...(sortedSecondary ?? []).map((row) => row.total),
    ])
  ).sort((a, b) => a - b);

  // Helper to find cumulative probability at a given total
  const probabilityAt = (rows: Row[], total: number): number => {
    // Find exact match or carry forward from previous value
    let lastProbability = 0;
    for (const row of rows) {
      if (row.total === total) {
        return row.probability * 100;
      }
      if (row.total < total) {
        lastProbability = row.probability * 100;
      }
      if (row.total > total) {
        break;
      }
    }
    return lastProbability;
  };

  return allTotals.map((total) => ({
    total,
    primary: probabilityAt(sortedPrimary, total),
    secondary: sortedSecondary ? probabilityAt(sortedSecondary, total) : 0,
  }));
}

export function CumulativeCurve({
  cumulative,
  title = 'Cumulative Probabilities',
  secondary,
  primaryLabel = 'A',
  secondaryLabel = 'B',
  defaultExpanded = false,
}: CumulativeCurveProps) {
  return (
    <div className="cumulative-curve">
      <h3>{title}</h3>
    </div>
  );
}
