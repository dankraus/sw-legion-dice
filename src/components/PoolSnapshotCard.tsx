import type { PoolConfig } from '../types';
import { formatPoolSnapshot } from '../poolSnapshot';
import { PoolDiceRow } from './PoolDiceRow';
import './PoolSnapshotCard.css';

interface PoolSnapshotCardProps {
  config: PoolConfig;
  poolId: 'A' | 'B';
  label: string;
  onLabelChange: (value: string) => void;
  accentColor: string;
}

export function PoolSnapshotCard({
  config,
  poolId,
  label,
  onLabelChange,
  accentColor,
}: PoolSnapshotCardProps) {
  const sections = formatPoolSnapshot(config);

  return (
    <article
      className="pool-snapshot"
      style={{ borderColor: accentColor }}
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
      </header>
      <PoolDiceRow config={config} classPrefix="pool-snapshot" />
      {sections.map((section) => (
        <div key={section.title} className="pool-snapshot__section">
          <div className="pool-snapshot__section-title">{section.title}</div>
          <dl className="pool-snapshot__lines">
            {section.lines.map((line) => (
              <div
                key={`${section.title}-${line.label}`}
                className="pool-snapshot__line"
              >
                <dt>{line.label}</dt>
                <dd>{line.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </article>
  );
}
