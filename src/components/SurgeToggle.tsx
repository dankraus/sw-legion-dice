import type { SurgeConversion } from '../types';
import './SurgeToggle.css';

interface SurgeToggleProps {
  value: SurgeConversion;
  onChange: (value: SurgeConversion) => void;
}

const OPTIONS: { value: SurgeConversion; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'hit', label: 'Surge \u2192 Hit' },
  { value: 'crit', label: 'Surge \u2192 Crit' },
];

export function SurgeToggle({ value, onChange }: SurgeToggleProps) {
  return (
    <fieldset className="surge-toggle">
      <legend className="surge-toggle__legend">Surge Conversion</legend>
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
              name="surge"
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
