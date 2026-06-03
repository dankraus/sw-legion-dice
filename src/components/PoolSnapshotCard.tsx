import type { CSSProperties, MouseEvent } from 'react';
import type { PoolConfig } from '../types';
import { formatPoolSnapshot } from '../poolSnapshot';
import { PoolDiceRow } from './PoolDiceRow';
import './PoolSnapshotCard.css';

const DIE_COLORS: Record<string, string> = {
  red: '#dc2626',
  white: '#ffffff',
};

interface PoolSnapshotCardProps {
  config: PoolConfig;
  poolId: 'A' | 'B';
  label: string;
  onLabelChange: (value: string) => void;
  accentColor: string;
  isActive?: boolean;
  onSelect?: () => void;
}

export function PoolSnapshotCard({
  config,
  poolId,
  label,
  onLabelChange,
  accentColor,
  isActive = false,
  onSelect,
}: PoolSnapshotCardProps) {
  const sections = formatPoolSnapshot(config);

  const handleCardClick = (event: MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest('.pool-snapshot__label-input')) {
      return;
    }
    onSelect?.();
  };

  const snapshotClassName = [
    'pool-snapshot',
    isActive ? 'pool-snapshot--active' : 'pool-snapshot--inactive',
  ].join(' ');

  return (
    <article
      className={snapshotClassName}
      style={
        {
          borderColor: accentColor,
          '--pool-accent': accentColor,
        } as CSSProperties
      }
      onClick={onSelect ? handleCardClick : undefined}
    >
      <header className="pool-snapshot__header">
        <span className="pool-snapshot__marker" style={{ color: accentColor }}>
          ■
        </span>
        <label className="pool-snapshot__label-control">
          <span className="pool-snapshot__pool-letter">{poolId}</span>
          <input
            className="pool-snapshot__label-input"
            value={label}
            onChange={(event) => onLabelChange(event.target.value)}
            maxLength={24}
            placeholder={poolId}
            aria-label={`Label for pool ${poolId}`}
          />
        </label>
        {isActive ? (
          <span className="pool-snapshot__editing-pill">Editing</span>
        ) : null}
      </header>
      <PoolDiceRow config={config} classPrefix="pool-snapshot" />
      {sections.map((section) => (
        <div key={section.title} className="pool-snapshot__section">
          <div className="pool-snapshot__section-title">{section.title}</div>
          <dl className="pool-snapshot__lines">
            {section.lines.map((line) => {
              const isDefenseDie =
                section.title === 'Defense' && line.label === 'Defense die';
              return (
                <div
                  key={`${section.title}-${line.label}`}
                  className="pool-snapshot__line"
                >
                  <dt>{line.label}</dt>
                  <dd>
                    {isDefenseDie ? (
                      <>
                        <span
                          className="pool-snapshot__die"
                          style={{
                            background: DIE_COLORS[config.defenseDieColor],
                          }}
                        />
                        {line.value}
                      </>
                    ) : (
                      line.value
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      ))}
    </article>
  );
}
