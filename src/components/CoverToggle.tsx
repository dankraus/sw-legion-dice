import type { CoverLevel } from '../types';
import './SurgeToggle.css';

interface CoverToggleProps {
  value: CoverLevel;
  onChange: (value: CoverLevel) => void;
}

const OPTIONS: { value: CoverLevel; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'light', label: 'Light' },
  { value: 'heavy', label: 'Heavy' },
];

export function CoverToggle({ value, onChange }: CoverToggleProps) {
  return (
    <fieldset className="surge-toggle">
      <legend className="surge-toggle__legend">Cover</legend>
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
              name="cover"
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
