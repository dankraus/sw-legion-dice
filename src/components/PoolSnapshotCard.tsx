import type { PoolConfig } from '../types';
import { formatPoolSnapshot } from '../poolSnapshot';
import { PoolDiceRow } from './PoolDiceRow';
import './PoolSnapshotCard.css';

interface PoolSnapshotCardProps {
  config: PoolConfig;
  label: string;
  accentColor: string;
}

export function PoolSnapshotCard({
  config,
  label,
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
        {label}
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
