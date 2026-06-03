import type { PoolConfig } from '../types';
import type { PoolResults } from '../poolResults';
import { describeActiveModifiers } from '../share/describeActiveModifiers';
import { pointCostValue } from '../share/pointCost';
import { buildDeltaRows } from '../comparisonDeltas';
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

const DIE_COLORS: Record<string, string> = {
  red: '#dc2626',
  black: '#111111',
  white: '#ffffff',
};

function DiceRow({ config }: { config: PoolConfig }) {
  const attack: { color: string; count: number; name: string }[] = [
    { color: DIE_COLORS.red, count: config.pool.red, name: 'red' },
    { color: DIE_COLORS.black, count: config.pool.black, name: 'black' },
    { color: DIE_COLORS.white, count: config.pool.white, name: 'white' },
  ].filter((entry) => entry.count > 0);

  const defenseColor = config.defenseDieColor;
  const defenseLabel =
    defenseColor === 'white' ? 'White defense die' : 'Red defense die';

  return (
    <>
      <div className="share-card__pool-label">Attack</div>
      <div className="share-card__dice">
        {attack.length === 0 ? (
          <span>none</span>
        ) : (
          attack.map((entry) => (
            <span key={entry.name} className="share-card__die-group">
              <span
                className="share-card__die"
                style={{ background: entry.color }}
              />
              <span>{entry.name}</span>
              <span>×{entry.count}</span>
            </span>
          ))
        )}
      </div>
      <div className="share-card__pool-label">Defense</div>
      <div className="share-card__dice">
        <span
          className="share-card__die"
          style={{ background: DIE_COLORS[defenseColor] }}
        />
        <span>{defenseLabel}</span>
      </div>
    </>
  );
}

function MiniDistribution({ results }: { results: PoolResults }) {
  const distribution = results.results.distribution;
  const maxProbability = distribution.reduce(
    (max, entry) => Math.max(max, entry.probability),
    0
  );
  return (
    <div className="share-card__dist">
      {distribution.map((entry) => {
        const heightPercent =
          maxProbability > 0 ? (entry.probability / maxProbability) * 100 : 0;
        return (
          <div
            key={entry.total}
            className="share-card__dist-bar"
            style={{ height: `${Math.max(heightPercent, 4)}%` }}
          />
        );
      })}
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
      <DiceRow config={pool.config} />
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
  return (
    <div className={'share-card' + (pinned ? ' share-card--compare' : '')}>
      <div className="share-card__brand">
        <img src="/logo.svg" alt="" />
        Legion Roller
      </div>
      {pinned ? (
        <>
          <div className="share-card__columns">
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
