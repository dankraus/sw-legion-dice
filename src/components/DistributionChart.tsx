import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

type Point = { total: number; probability: number };

interface DistributionChartProps {
  distribution: Point[];
  title?: string;
  xAxisLabel?: string;
  barColor?: string;
  secondaryDistribution?: Point[];
  secondaryColor?: string;
  seriesLabel?: string;
  secondaryLabel?: string;
}

export function DistributionChart({
  distribution,
  title = 'Probability Distribution',
  xAxisLabel = 'Total Successes',
  barColor = '#3b82f6',
  secondaryDistribution,
  secondaryColor = '#f59e0b',
  seriesLabel = 'A',
  secondaryLabel = 'B',
}: DistributionChartProps) {
  const hasSecondary = secondaryDistribution !== undefined;

  const formatAxisPercent = (value: number) => `${Math.round(value)}%`;
  const formatTooltipPercent = (value: number) => `${value.toFixed(2)}%`;

  const percentOf = (points: Point[] | undefined, total: number) => {
    const found = points?.find((entry) => entry.total === total);
    return found ? +((found.probability * 100).toFixed(2)) : 0;
  };

  const totals = Array.from(
    new Set([
      ...distribution.map((entry) => entry.total),
      ...(secondaryDistribution ?? []).map((entry) => entry.total),
    ])
  ).sort((a, b) => a - b);

  const data = totals.map((total) => ({
    total,
    primary: percentOf(distribution, total),
    secondary: percentOf(secondaryDistribution, total),
  }));

  return (
    <div>
      <h3>{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{
            top: hasSecondary ? 28 : 5,
            right: 20,
            bottom: 30,
            left: 36,
          }}
        >
          <XAxis
            dataKey="total"
            label={{ value: xAxisLabel, position: 'insideBottom', offset: -10 }}
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
          {hasSecondary && <Legend verticalAlign="top" height={24} />}
          <Bar
            dataKey="primary"
            name={seriesLabel}
            radius={[4, 4, 0, 0]}
            fill={barColor}
          >
            {!hasSecondary &&
              data.map((_, index) => <Cell key={index} fill={barColor} />)}
          </Bar>
          {hasSecondary && (
            <Bar
              dataKey="secondary"
              name={secondaryLabel}
              radius={[4, 4, 0, 0]}
              fill={secondaryColor}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
