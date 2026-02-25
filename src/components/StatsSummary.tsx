import './StatsSummary.css';

interface StatsSummaryProps {
  expectedHits: number;
  expectedCrits: number;
  expectedTotal: number;
  pointCost?: number;
}

export function StatsSummary({ expectedHits, expectedCrits, expectedTotal, pointCost }: StatsSummaryProps) {
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
      {pointCost != null && expectedTotal > 0 && (
        <>
          <div className="stats-summary__stat stats-summary__stat--efficiency">
            <span className="stats-summary__value">{(pointCost / expectedTotal).toFixed(1)}</span>
            <span className="stats-summary__label">Pts / Success</span>
          </div>
          <div className="stats-summary__stat stats-summary__stat--efficiency">
            <span className="stats-summary__value">{(expectedTotal / pointCost).toFixed(3)}</span>
            <span className="stats-summary__label">Success / Pt</span>
          </div>
        </>
      )}
    </div>
  );
}
