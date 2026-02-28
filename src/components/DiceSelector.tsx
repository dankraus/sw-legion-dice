import { useState } from 'react';
import type { DieColor } from '../types';
import './DiceSelector.css';

interface DiceSelectorProps {
  color: DieColor;
  count: number;
  onChange: (count: number) => void;
}

export function DiceSelector({ color, count, onChange }: DiceSelectorProps) {
  const [editingValue, setEditingValue] = useState<string | null>(null);

  const displayValue =
    editingValue !== null ? editingValue : count === 0 ? '' : String(count);

  const commit = (value: number) => {
    const clamped = Math.max(0, value);
    onChange(clamped);
    setEditingValue(null);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    setEditingValue(raw);
    if (raw === '') {
      onChange(0);
      return;
    }
    const parsed = Math.floor(Number(raw));
    if (!Number.isNaN(parsed) && parsed >= 0) {
      onChange(parsed);
    }
  };

  const handleFocus = () => {
    setEditingValue(count === 0 ? '' : String(count));
  };

  const handleBlur = () => {
    setEditingValue(null);
  };

  const decrement = () => commit(count - 1);
  const increment = () => commit(count + 1);

  return (
    <div className={`dice-selector dice-selector--${color}`}>
      <span className="dice-selector__label">{color}</span>
      <div className="dice-selector__controls">
        <button
          className="dice-selector__btn"
          type="button"
          onClick={decrement}
          disabled={count === 0}
          aria-label={`Remove ${color} die`}
        >
          −
        </button>
        <input
          className="dice-selector__input"
          type="number"
          min={0}
          inputMode="numeric"
          placeholder="0"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-label={`${color} dice count`}
        />
        <button
          className="dice-selector__btn"
          type="button"
          onClick={increment}
          aria-label={`Add ${color} die`}
        >
          +
        </button>
      </div>
    </div>
  );
}
