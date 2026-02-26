import './CheckboxToggle.css';

interface CheckboxToggleProps {
  id: string;
  label: string;
  title?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function CheckboxToggle({ id, label, title, checked, onChange }: CheckboxToggleProps) {
  return (
    <label className="checkbox-toggle" htmlFor={id}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="checkbox-toggle__input"
      />
      <span className="checkbox-toggle__label" title={title}>
        {label}
      </span>
    </label>
  );
}
