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
  const secondaryFor = (total: number) =>
    secondary?.find((row) => row.total === total)?.probability ?? 0;

  return (
    <div>
      <h3>{title}</h3>
      <table className="cumulative-table">
        <thead>
          <tr>
            <th>At Least</th>
            <th>{hasSecondary ? primaryLabel : 'Probability'}</th>
            {hasSecondary && <th>{secondaryLabel}</th>}
          </tr>
        </thead>
        <tbody>
          {cumulative.map((row) => (
            <tr key={row.total}>
              <td>{row.total}</td>
              <td>{(row.probability * 100).toFixed(1)}%</td>
              {hasSecondary && (
                <td>{(secondaryFor(row.total) * 100).toFixed(1)}%</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
