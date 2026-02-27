import { Tooltip } from './Tooltip';
import { legionQuickGuideHref } from '../legionQuickGuide';
import './NumberInputWithControls.css';

interface NumberInputWithControlsProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  placeholder?: string;
  disabled?: boolean;
  title?: string;
  /** Legion Quick Guide anchor (e.g. 'critical-x'); label becomes a link when set. */
  guideAnchor?: string;
}

export function NumberInputWithControls({
  id,
  label,
  value,
  onChange,
  min = 0,
  max,
  placeholder = '0',
  disabled = false,
  title,
  guideAnchor,
}: NumberInputWithControlsProps) {
  const numericValue = value === '' ? 0 : Math.floor(Number(value)) || 0;

  const decrement = () => {
    const next = Math.max(min, numericValue - 1);
    onChange(String(next));
  };

  const increment = () => {
    const next = numericValue + 1;
    onChange(String(max !== undefined ? Math.min(max, next) : next));
  };

  const canDecrement = !disabled && numericValue > min;
  const canIncrement = !disabled && (max === undefined || numericValue < max);

  const labelContent = guideAnchor ? (
    <a
      className="num-input__label-link"
      href={legionQuickGuideHref(guideAnchor)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => event.stopPropagation()}
    >
      {label}
    </a>
  ) : (
    label
  );

  const control = (
    <div className={`num-input${disabled ? ' num-input--disabled' : ''}`} title={title}>
      <label className="num-input__label" htmlFor={id}>
        {labelContent}
      </label>
      <div className="num-input__controls">
        <button
          className="num-input__btn"
          type="button"
          onClick={decrement}
          disabled={!canDecrement}
          aria-label={`Decrease ${label}`}
          tabIndex={-1}
        >
          −
        </button>
        <input
          className="num-input__field"
          id={id}
          type="number"
          min={min}
          max={max}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
        <button
          className="num-input__btn"
          type="button"
          onClick={increment}
          disabled={!canIncrement}
          aria-label={`Increase ${label}`}
          tabIndex={-1}
        >
          +
        </button>
      </div>
    </div>
  );

  if (title) {
    return (
      <Tooltip title={title} fullWidth>
        {control}
      </Tooltip>
    );
  }
  return control;
}
