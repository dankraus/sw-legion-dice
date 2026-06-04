import { useState, useId } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { poolCompareLegendItemSorter } from '../chartLegendOrder';
import { CumulativeTable } from './CumulativeTable';
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

const toChartPercent = (probability: number): number =>
  +((probability * 100).toFixed(2));

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
        return toChartPercent(row.probability);
      }
      if (row.total < total) {
        lastProbability = row.probability;
      }
      if (row.total > total) {
        break;
      }
    }
    return toChartPercent(lastProbability);
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
  const titleId = useId();
  const tableRegionId = useId();
  const hasSecondary = secondary !== undefined;
  const chartData = transformCumulativeData(cumulative, secondary);
  const formatAxisPercent = (value: number) => `${Math.round(value)}%`;
  const formatTooltipPercent = (value: number) => `${value.toFixed(2)}%`;

  return (
    <div className="cumulative-curve">
      <div className="cumulative-curve__header">
        <h3 id={titleId}>{title}</h3>
        <button
          className="cumulative-curve__toggle"
          onClick={() => setIsTableExpanded(!isTableExpanded)}
          aria-expanded={isTableExpanded}
          aria-controls={tableRegionId}
        >
          {isTableExpanded ? 'Hide exact values ▲' : 'Show exact values ▼'}
        </button>
      </div>

      <div className="cumulative-curve__chart">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart
            data={chartData}
            margin={{
              top: hasSecondary ? 28 : 5,
              right: 20,
              bottom: 30,
              left: 36,
            }}
          >
            <XAxis
              dataKey="total"
              label={{ value: 'At Least', position: 'insideBottom', offset: -10 }}
            />
            <YAxis
              tickFormatter={(value: number) => formatAxisPercent(value)}
              width={44}
              label={{
                value: 'Probability',
                angle: -90,
                position: 'left',
                offset: 12,
              }}
            />
            <Tooltip
              formatter={(value) => [
                formatTooltipPercent(Number(value)),
                'Probability',
              ]}
            />
            {hasSecondary && (
              <Legend
                verticalAlign="top"
                height={24}
                itemSorter={poolCompareLegendItemSorter}
              />
            )}
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

      <div
        id={tableRegionId}
        className={`cumulative-curve__table-wrapper ${
          isTableExpanded
            ? 'cumulative-curve__table-wrapper--expanded'
            : 'cumulative-curve__table-wrapper--collapsed'
        }`}
        role="region"
        aria-labelledby={titleId}
        aria-hidden={!isTableExpanded}
      >
        <CumulativeTable
          cumulative={cumulative}
          secondary={secondary}
          title=""
          primaryLabel={primaryLabel}
          secondaryLabel={secondaryLabel}
        />
      </div>
    </div>
  );
}
