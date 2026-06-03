import type { PoolConfig } from '../types';
import { formatAttackSurgeLabel } from '../poolSnapshot';

const DIE_COLORS: Record<string, string> = {
  red: '#dc2626',
  black: '#111111',
  white: '#ffffff',
};

interface PoolDiceRowProps {
  config: PoolConfig;
  /** BEM prefix: `share-card` or `pool-snapshot` */
  classPrefix: 'share-card' | 'pool-snapshot';
}

export function PoolDiceRow({ config, classPrefix }: PoolDiceRowProps) {
  const attack: { color: string; count: number; name: string }[] = [
    { color: DIE_COLORS.red, count: config.pool.red, name: 'red' },
    { color: DIE_COLORS.black, count: config.pool.black, name: 'black' },
    { color: DIE_COLORS.white, count: config.pool.white, name: 'white' },
  ].filter((entry) => entry.count > 0);

  const defenseColor = config.defenseDieColor;
  const defenseLabel =
    defenseColor === 'white' ? 'White defense die' : 'Red defense die';

  const poolLabel = `${classPrefix}__pool-label`;
  const dice = `${classPrefix}__dice`;
  const die = `${classPrefix}__die`;
  const dieGroup = `${classPrefix}__die-group`;

  return (
    <>
      <div className={poolLabel}>Attack</div>
      <div className={dice}>
        {attack.length === 0 ? (
          <span>none</span>
        ) : (
          attack.map((entry) => (
            <span key={entry.name} className={dieGroup}>
              <span
                className={die}
                style={{ background: entry.color }}
              />
              <span>{entry.name}</span>
              <span>×{entry.count}</span>
            </span>
          ))
        )}
      </div>
      {classPrefix === 'pool-snapshot' ? (
        <p className="pool-snapshot__surge-line">
          <span className="pool-snapshot__surge-label">Surge</span>
          <span>{formatAttackSurgeLabel(config.surge)}</span>
        </p>
      ) : null}
      <div className={poolLabel}>Defense</div>
      <div className={dice}>
        <span
          className={die}
          style={{ background: DIE_COLORS[defenseColor] }}
        />
        <span>{defenseLabel}</span>
      </div>
    </>
  );
}
