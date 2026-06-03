import type { PoolConfig } from '../types';
import type { PoolResults } from '../poolResults';
import { describeActiveModifiers } from '../share/describeActiveModifiers';
import { pointCostValue } from '../share/pointCost';
import { buildDeltaRows } from '../comparisonDeltas';
import { PoolDiceRow } from './PoolDiceRow';
import './ShareCard.css';

export interface ShareCardPool {
  config: PoolConfig;
  results: PoolResults;
  label: string;
}

interface ShareCardProps {
  url: string;
  live: ShareCardPool;
  pinned?: ShareCardPool;
}

const COMPARE_STACK_BUCKET_THRESHOLD = 10;

function shouldStackComparePools(
  pinned: ShareCardPool,
  live: ShareCardPool
): boolean {
  const maxBuckets = Math.max(
    pinned.results.results.distribution.length,
    live.results.results.distribution.length
  );
  return maxBuckets > COMPARE_STACK_BUCKET_THRESHOLD;
}

function buildYAxisLabels(maxProbability: number): string[] {
  const maxPercent = maxProbability * 100;
  if (maxPercent <= 0) return ['0%'];
  const top =
    maxPercent >= 10
      ? Math.ceil(maxPercent / 5) * 5
      : Math.ceil(maxPercent * 10) / 10;
  const mid = Math.round((top / 2) * 10) / 10;
  const tickValues =
    top > 5 && mid > 0 && mid < top ? [0, mid, top] : top > 0 ? [0, top] : [0];
  return tickValues
    .map((value) => {
      if (value === 0) return '0%';
      return Number.isInteger(value) ? `${value}%` : `${value.toFixed(1)}%`;
    })
    .reverse();
}

function MiniDistribution({ results }: { results: PoolResults }) {
  const distribution = results.results.distribution;
  const maxProbability = distribution.reduce(
    (max, entry) => Math.max(max, entry.probability),
    0
  );
  const yAxisLabels = buildYAxisLabels(maxProbability);
  return (
    <div
      className="share-card__dist-wrap"
      aria-label="Attack probability distribution"
    >
      <div className="share-card__dist-yaxis" aria-hidden>
        {yAxisLabels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="share-card__dist-plot">
        <div className="share-card__dist">
          {distribution.map((entry) => {
            const heightPercent =
              maxProbability > 0
                ? (entry.probability / maxProbability) * 100
                : 0;
            return (
              <div key={entry.total} className="share-card__dist-column">
                <div className="share-card__dist-bars">
                  <div
                    className="share-card__dist-bar"
                    style={{ height: `${Math.max(heightPercent, 4)}%` }}
                  />
                </div>
                <span className="share-card__dist-total">{entry.total}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatBlock({ pool }: { pool: ShareCardPool }) {
  const { results, woundsResults } = pool.results;
  const cost = pointCostValue(pool.config);
  const ptsPerWound =
    cost > 0 && woundsResults.expectedWounds > 0
      ? (cost / woundsResults.expectedWounds).toFixed(1)
      : null;
  return (
    <div className="share-card__stats">
      <div>
        <div className="share-card__stat-value">
          {results.expectedTotal.toFixed(2)}
        </div>
        <div className="share-card__stat-label">Avg total</div>
      </div>
      <div>
        <div className="share-card__stat-value is-wounds">
          {woundsResults.expectedWounds.toFixed(2)}
        </div>
        <div className="share-card__stat-label">Avg wounds</div>
      </div>
      {ptsPerWound !== null && (
        <div>
          <div className="share-card__stat-value">{ptsPerWound}</div>
          <div className="share-card__stat-label">Pts/wound</div>
        </div>
      )}
    </div>
  );
}

function PoolDetails({ pool }: { pool: ShareCardPool }) {
  const modifiers = describeActiveModifiers(pool.config);
  return (
    <div>
      <PoolDiceRow config={pool.config} classPrefix="share-card" />
      {modifiers.length > 0 && (
        <div className="share-card__pills">
          {modifiers.map((modifier) => (
            <span key={modifier} className="share-card__pill">
              {modifier}
            </span>
          ))}
        </div>
      )}
      <StatBlock pool={pool} />
      <MiniDistribution results={pool.results} />
    </div>
  );
}

function CompareDeltas({
  pinned,
  live,
}: {
  pinned: ShareCardPool;
  live: ShareCardPool;
}) {
  const rows = buildDeltaRows(
    pinned.results,
    live.results,
    pinned.config.pointCost,
    live.config.pointCost
  );
  const wanted = ['Avg total', 'Avg wounds'];
  const summary = rows.filter(
    (row) => wanted.includes(row.label) && row.delta !== null
  );
  if (summary.length === 0) return null;
  return (
    <div className="share-card__deltas">
      {summary.map((row) => {
        const delta = row.delta as number;
        const sign = delta >= 0 ? '+' : '';
        return (
          <span key={row.label} className="share-card__delta">
            Δ {row.label} {sign}
            {delta.toFixed(2)}
          </span>
        );
      })}
    </div>
  );
}

export function ShareCard({ url, live, pinned }: ShareCardProps) {
  const stackCompare =
    pinned !== undefined && shouldStackComparePools(pinned, live);
  const className = [
    'share-card',
    pinned && 'share-card--compare',
    stackCompare && 'share-card--compare-stacked',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className}>
      <div className="share-card__brand">
        <img src="/logo.svg" alt="" />
        Legion Roller
      </div>
      {pinned ? (
        <>
          <div
            className={
              'share-card__columns' +
              (stackCompare ? ' share-card__columns--stacked' : '')
            }
          >
            <div>
              <strong>{pinned.label}</strong>
              <PoolDetails pool={pinned} />
            </div>
            <div>
              <strong>{live.label}</strong>
              <PoolDetails pool={live} />
            </div>
          </div>
          <CompareDeltas pinned={pinned} live={live} />
        </>
      ) : (
        <PoolDetails pool={live} />
      )}
      <div className="share-card__footer">{url}</div>
    </div>
  );
}
