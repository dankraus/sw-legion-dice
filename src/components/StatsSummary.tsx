import type { AttackPool } from '../types';
import './StatsSummary.css';

interface StatsSummaryProps {
  expectedHits: number;
  expectedCrits: number;
  expectedTotal: number;
  pointCost?: number;
  /** Shown above avg stats when pre-roll modifiers change the attack pool. */
  effectiveDicePool?: AttackPool;
}

function EffectiveDicePoolChips({ pool }: { pool: AttackPool }) {
  const chips: { color: 'red' | 'black' | 'white'; count: number }[] = [
    { color: 'red', count: pool.red },
    { color: 'black', count: pool.black },
    { color: 'white', count: pool.white },
  ];

  return (
    <div className="stats-summary__effective-dice-pool-chips">
      {chips
        .filter((chip) => chip.count > 0)
        .map((chip) => (
          <span
            key={chip.color}
            className={`stats-summary__die-chip stats-summary__die-chip--${chip.color}`}
          >
            <span className="stats-summary__die-chip-count">{chip.count}</span>
            <span className="stats-summary__die-chip-label">{chip.color}</span>
          </span>
        ))}
    </div>
  );
}

export function StatsSummary({
  expectedHits,
  expectedCrits,
  expectedTotal,
  pointCost,
  effectiveDicePool,
}: StatsSummaryProps) {
  return (
    <>
      {effectiveDicePool != null && (
        <div className="stats-summary__effective-dice-pool">
          <span className="stats-summary__effective-dice-pool-label">
            Effective Dice Pool
          </span>
          <EffectiveDicePoolChips pool={effectiveDicePool} />
        </div>
      )}
      <div className="stats-summary">
        <div className="stats-summary__stat">
          <span className="stats-summary__value">{expectedHits.toFixed(2)}</span>
          <span className="stats-summary__label">Avg Hits</span>
        </div>
        <div className="stats-summary__stat">
          <span className="stats-summary__value">
            {expectedCrits.toFixed(2)}
          </span>
          <span className="stats-summary__label">Avg Crits</span>
        </div>
        <div className="stats-summary__stat stats-summary__stat--total">
          <span className="stats-summary__value">
            {expectedTotal.toFixed(2)}
          </span>
          <span className="stats-summary__label">Avg Total</span>
        </div>
        {pointCost != null && expectedTotal > 0 && (
          <div className="stats-summary__stat stats-summary__stat--efficiency">
            <span className="stats-summary__value">
              {(pointCost / expectedTotal).toFixed(1)}
            </span>
            <span className="stats-summary__label">Pts / Success</span>
          </div>
        )}
      </div>
    </>
  );
}
