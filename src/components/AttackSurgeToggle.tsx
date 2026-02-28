import type { SurgeConversion } from '../types';
import './SurgeToggle.css';

interface AttackSurgeToggleProps {
  value: SurgeConversion;
  onChange: (value: SurgeConversion) => void;
}

const OPTIONS: { value: SurgeConversion; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'hit', label: '\u2192 Hit' },
  { value: 'crit', label: '\u2192 Crit' },
];

export function AttackSurgeToggle({ value, onChange }: AttackSurgeToggleProps) {
  return (
    <fieldset className="surge-toggle">
      <legend className="surge-toggle__legend">Attack Surge Conversion</legend>
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
