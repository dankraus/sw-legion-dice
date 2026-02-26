import './CumulativeTable.css';

interface CumulativeTableProps {
  cumulative: { total: number; probability: number }[];
  title?: string;
}

export function CumulativeTable({ cumulative, title = 'Cumulative Probabilities' }: CumulativeTableProps) {
  return (
    <div>
      <h3>{title}</h3>
      <table className="cumulative-table">
        <thead>
          <tr>
            <th>At Least</th>
            <th>Probability</th>
          </tr>
        </thead>
        <tbody>
          {cumulative.map((row) => (
            <tr key={row.total}>
              <td>{row.total}</td>
              <td>{(row.probability * 100).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
