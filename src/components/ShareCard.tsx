import type { PoolConfig } from '../types';
import type { PoolResults } from '../poolResults';
import { describeActiveModifiers } from '../share/describeActiveModifiers';
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

function costValue(config: PoolConfig): number {
  const parsed = Number(config.pointCost);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function DiceRow({ config }: { config: PoolConfig }) {
  const attack: { color: string; count: number; name: string }[] = [
    { color: DIE_COLORS.red, count: config.pool.red, name: 'red' },
    { color: DIE_COLORS.black, count: config.pool.black, name: 'black' },
    { color: DIE_COLORS.white, count: config.pool.white, name: 'white' },
  ].filter((entry) => entry.count > 0);

  const text = attack
    .map((entry) => `${entry.count} ${entry.name}`)
    .join(' · ');

  return (
    <>
      <div className="share-card__pool-label">Attack</div>
      <div className="share-card__dice">
        {attack.flatMap((entry) =>
          Array.from({ length: entry.count }).map((_, index) => (
            <span
              key={`${entry.name}-${index}`}
              className="share-card__die"
              style={{ background: entry.color }}
            />
          ))
        )}
        <span>{text || 'none'}</span>
      </div>
    </>
  );
}

function StatBlock({ pool }: { pool: ShareCardPool }) {
  const { results, woundsResults } = pool.results;
  const cost = costValue(pool.config);
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
  const mods = describeActiveModifiers(pool.config);
  return (
    <div>
      <DiceRow config={pool.config} />
      {mods.length > 0 && (
        <div className="share-card__pills">
          {mods.map((mod) => (
            <span key={mod} className="share-card__pill">
              {mod}
            </span>
          ))}
        </div>
      )}
      <StatBlock pool={pool} />
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
      ) : (
        <PoolDetails pool={live} />
      )}
      <div className="share-card__footer">{url}</div>
    </div>
  );
}
