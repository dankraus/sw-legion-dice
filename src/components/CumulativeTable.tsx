import './CumulativeTable.css';

interface CumulativeTableProps {
  cumulative: { total: number; probability: number }[];
}

export function CumulativeTable({ cumulative }: CumulativeTableProps) {
  return (
    <div>
      <h3>Cumulative Probabilities</h3>
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
