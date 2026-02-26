import './Tooltip.css';

interface TooltipProps {
  title: string;
  children: React.ReactNode;
  /** When true, wrapper takes full width (e.g. for form controls in a column). */
  fullWidth?: boolean;
}

export function Tooltip({ title, children, fullWidth }: TooltipProps) {
  return (
    <div className={`tooltip-wrapper${fullWidth ? ' tooltip-wrapper--full' : ''}`}>
      {children}
      <span className="tooltip" role="tooltip">
        {title}
      </span>
    </div>
  );
}
