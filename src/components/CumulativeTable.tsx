import './CumulativeTable.css';

type Row = { total: number; probability: number };

interface CumulativeTableProps {
  cumulative: Row[];
  title?: string;
  secondary?: Row[];
  primaryLabel?: string;
  secondaryLabel?: string;
}

export function CumulativeTable({
  cumulative,
  title = 'Cumulative Probabilities',
  secondary,
  primaryLabel = 'A',
  secondaryLabel = 'B',
}: CumulativeTableProps) {
  const hasSecondary = secondary !== undefined;
  const probabilityFor = (rows: Row[] | undefined, total: number) =>
    rows?.find((row) => row.total === total)?.probability ?? 0;

  const totals = Array.from(
    new Set([
      ...cumulative.map((row) => row.total),
      ...(secondary ?? []).map((row) => row.total),
    ])
  ).sort((first, second) => first - second);

  return (
    <div>
      {title !== '' && <h3>{title}</h3>}
      <table className="cumulative-table">
        <thead>
          <tr>
            <th>At Least</th>
            <th>{hasSecondary ? primaryLabel : 'Probability'}</th>
            {hasSecondary && <th>{secondaryLabel}</th>}
          </tr>
        </thead>
        <tbody>
          {totals.map((total) => (
            <tr key={total}>
              <td>{total}</td>
              <td>{(probabilityFor(cumulative, total) * 100).toFixed(1)}%</td>
              {hasSecondary && (
                <td>{(probabilityFor(secondary, total) * 100).toFixed(1)}%</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
