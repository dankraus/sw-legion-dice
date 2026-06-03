import type { PoolResults } from '../poolResults';
import { buildDeltaRows } from '../comparisonDeltas';
import { DistributionChart } from './DistributionChart';
import { CumulativeTable } from './CumulativeTable';
import './ComparisonResults.css';

const COLOR_A = '#2563eb';
const COLOR_B = '#f59e0b';

interface ComparisonResultsProps {
  resultsA: PoolResults;
  resultsB: PoolResults;
  costA: string;
  costB: string;
  labelA: string;
  labelB: string;
}

function formatValue(value: number | null): string {
  return value === null ? '—' : value.toFixed(2);
}

function formatDelta(value: number | null): string {
  if (value === null) return '—';
  const fixed = value.toFixed(2);
  return value > 0 ? `+${fixed}` : fixed;
}

export function ComparisonResults({
  resultsA,
  resultsB,
  costA,
  costB,
  labelA,
  labelB,
}: ComparisonResultsProps) {
  const rows = buildDeltaRows(resultsA, resultsB, costA, costB);

  return (
    <div className="comparison">
      <table className="comparison__delta">
        <thead>
          <tr>
            <th></th>
            <th>
              <span style={{ color: COLOR_A }}>■ </span>
              {labelA}
            </th>
            <th>
              <span style={{ color: COLOR_B }}>■ </span>
              {labelB}
            </th>
            <th>Δ (B−A)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td>{row.label}</td>
              <td className="is-number">{formatValue(row.a)}</td>
              <td className="is-number">{formatValue(row.b)}</td>
              <td
                className={
                  'is-number' +
                  (row.bIsBetter === true
                    ? ' delta-better'
                    : row.bIsBetter === false
                      ? ' delta-worse'
                      : '')
                }
              >
                {formatDelta(row.delta)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <DistributionChart
        distribution={resultsA.results.distribution}
        secondaryDistribution={resultsB.results.distribution}
        title="Attack Distribution (A vs B)"
        xAxisLabel="Total Successes"
        barColor={COLOR_A}
        secondaryColor={COLOR_B}
        seriesLabel={labelA}
        secondaryLabel={labelB}
      />

      <DistributionChart
        distribution={resultsA.woundsResults.distribution}
        secondaryDistribution={resultsB.woundsResults.distribution}
        title="Wounds Distribution (A vs B)"
        xAxisLabel="Wounds"
        barColor={COLOR_A}
        secondaryColor={COLOR_B}
        seriesLabel={labelA}
        secondaryLabel={labelB}
      />

      <div className="comparison__cumulatives">
        <CumulativeTable
          cumulative={resultsA.results.cumulative}
          secondary={resultsB.results.cumulative}
          title="At Least N Successes"
          primaryLabel={labelA}
          secondaryLabel={labelB}
        />
        <CumulativeTable
          cumulative={resultsA.woundsResults.cumulative}
          secondary={resultsB.woundsResults.cumulative}
          title="At Least N Wounds"
          primaryLabel={labelA}
          secondaryLabel={labelB}
        />
      </div>
    </div>
  );
}
