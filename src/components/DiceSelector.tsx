import type { DieColor } from '../types';
import './DiceSelector.css';

interface DiceSelectorProps {
  color: DieColor;
  count: number;
  onChange: (count: number) => void;
}

export function DiceSelector({ color, count, onChange }: DiceSelectorProps) {
  return (
    <div className={`dice-selector dice-selector--${color}`}>
      <span className="dice-selector__label">{color}</span>
      <div className="dice-selector__controls">
        <button
          className="dice-selector__btn"
          onClick={() => onChange(Math.max(0, count - 1))}
          disabled={count === 0}
          aria-label={`Remove ${color} die`}
        >
          −
        </button>
        <span className="dice-selector__count">{count}</span>
        <button
          className="dice-selector__btn"
          onClick={() => onChange(count + 1)}
          aria-label={`Add ${color} die`}
        >
          +
        </button>
      </div>
    </div>
  );
}
