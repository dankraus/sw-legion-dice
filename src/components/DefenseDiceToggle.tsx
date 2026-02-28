import type { DefenseDieColor } from '../types';
import './SurgeToggle.css';
import './DefenseDiceToggle.css';

interface DefenseDiceToggleProps {
  value: DefenseDieColor;
  onChange: (value: DefenseDieColor) => void;
}

const OPTIONS: { value: DefenseDieColor; label: string }[] = [
  { value: 'red', label: 'Red' },
  { value: 'white', label: 'White' },
];

export function DefenseDiceToggle({ value, onChange }: DefenseDiceToggleProps) {
  return (
    <fieldset className="surge-toggle defense-dice-toggle">
      <legend className="surge-toggle__legend">Defense dice</legend>
      <div className="surge-toggle__options">
        {OPTIONS.map((option) => (
          <label
            key={option.value}
            className={`surge-toggle__option ${
              value === option.value ? 'surge-toggle__option--active' : ''
            }`}
          >
            <input
              type="radio"
              name="defense-dice"
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="surge-toggle__radio"
            />
            {value === option.value ? (
              <>
                <span className="defense-dice-toggle__check" aria-hidden>✓</span>{' '}
                {option.label}
              </>
            ) : (
              option.label
            )}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
