import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
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

const COLOR_PRIMARY = '#2563eb';
const COLOR_SECONDARY = '#f59e0b';

export function CumulativeCurve({
  cumulative,
  title = 'Cumulative Probabilities',
  secondary,
  primaryLabel = 'A',
  secondaryLabel = 'B',
  defaultExpanded = false,
}: CumulativeCurveProps) {
  const [isTableExpanded, setIsTableExpanded] = useState(defaultExpanded);
  const hasSecondary = secondary !== undefined;
  const chartData = transformCumulativeData(cumulative, secondary);

  return (
    <div className="cumulative-curve">
      <div className="cumulative-curve__header">
        <h3>{title}</h3>
        <button
          className="cumulative-curve__toggle"
          onClick={() => setIsTableExpanded(!isTableExpanded)}
          aria-expanded={isTableExpanded}
          aria-controls="cumulative-table-region"
        >
          {isTableExpanded ? 'Hide exact values ▲' : 'Show exact values ▼'}
        </button>
      </div>

      <div className="cumulative-curve__chart">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 20, bottom: 25, left: 0 }}
          >
            <XAxis
              dataKey="total"
              label={{ value: 'At Least', position: 'insideBottom', offset: -15 }}
            />
            <YAxis
              tickFormatter={(value: number) => `${value}%`}
              label={{ value: 'Probability', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip formatter={(value) => [`${value}%`, 'Probability']} />
            {hasSecondary && <Legend verticalAlign="top" height={24} />}
            <Line
              type="stepAfter"
              dataKey="primary"
              name={primaryLabel}
              stroke={COLOR_PRIMARY}
              strokeWidth={2.5}
              dot={false}
            />
            {hasSecondary && (
              <Line
                type="stepAfter"
                dataKey="secondary"
                name={secondaryLabel}
                stroke={COLOR_SECONDARY}
                strokeWidth={2.5}
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
