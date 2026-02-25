import './StatsSummary.css';

interface StatsSummaryProps {
  expectedHits: number;
  expectedCrits: number;
  expectedTotal: number;
}

export function StatsSummary({ expectedHits, expectedCrits, expectedTotal }: StatsSummaryProps) {
  return (
    <div className="stats-summary">
      <div className="stats-summary__stat">
        <span className="stats-summary__value">{expectedHits.toFixed(2)}</span>
        <span className="stats-summary__label">Avg Hits</span>
      </div>
      <div className="stats-summary__stat">
        <span className="stats-summary__value">{expectedCrits.toFixed(2)}</span>
        <span className="stats-summary__label">Avg Crits</span>
      </div>
      <div className="stats-summary__stat stats-summary__stat--total">
        <span className="stats-summary__value">{expectedTotal.toFixed(2)}</span>
        <span className="stats-summary__label">Avg Total</span>
      </div>
    </div>
  );
}
