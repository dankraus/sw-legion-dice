import './CumulativeCurve.css';

type Row = { total: number; probability: number };

interface CumulativeCurveProps {
  cumulative: Row[];
  title?: string;
  secondary?: Row[];
  primaryLabel?: string;
  secondaryLabel?: string;
  defaultExpanded?: boolean;
}

export function CumulativeCurve({
  cumulative,
  title = 'Cumulative Probabilities',
  secondary,
  primaryLabel = 'A',
  secondaryLabel = 'B',
  defaultExpanded = false,
}: CumulativeCurveProps) {
  return (
    <div className="cumulative-curve">
      <h3>{title}</h3>
    </div>
  );
}
