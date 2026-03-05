import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface DistributionChartProps {
  distribution: { total: number; probability: number }[];
  title?: string;
  xAxisLabel?: string;
  barColor?: string;
}

export function DistributionChart({
  distribution,
  title = 'Probability Distribution',
  xAxisLabel = 'Total Successes',
  barColor = '#3b82f6',
}: DistributionChartProps) {
  const data = distribution.map((entry) => ({
    ...entry,
    percent: +(entry.probability * 100).toFixed(1),
  }));

  return (
    <div>
      <h3>{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 5, right: 20, bottom: 25, left: 0 }}
        >
          <XAxis
            dataKey="total"
            label={{ value: xAxisLabel, position: 'insideBottom', offset: -15 }}
          />
          <YAxis
            tickFormatter={(value: number) => `${value}%`}
            label={{ value: 'Probability', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip formatter={(value) => [`${value}%`, 'Probability']} />
          <Bar dataKey="percent" radius={[4, 4, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={index} fill={barColor} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
