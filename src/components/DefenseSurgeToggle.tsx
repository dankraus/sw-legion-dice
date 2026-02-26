import type { DefenseSurgeConversion } from '../types';
import './SurgeToggle.css';

interface DefenseSurgeToggleProps {
  value: DefenseSurgeConversion;
  onChange: (value: DefenseSurgeConversion) => void;
}

const OPTIONS: { value: DefenseSurgeConversion; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'block', label: '\u2192 Block' },
];

export function DefenseSurgeToggle({ value, onChange }: DefenseSurgeToggleProps) {
  return (
    <fieldset className="surge-toggle">
      <legend className="surge-toggle__legend">Defense Surge Conversion</legend>
      <div className="surge-toggle__options">
        {OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className={`surge-toggle__option ${
              value === opt.value ? 'surge-toggle__option--active' : ''
            }`}
          >
            <input
              type="radio"
              name="defense-surge"
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="surge-toggle__radio"
            />
            {opt.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
