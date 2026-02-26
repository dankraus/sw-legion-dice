import { Tooltip } from './Tooltip';
import './CheckboxToggle.css';

interface CheckboxToggleProps {
  id: string;
  label: string;
  title?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function CheckboxToggle({
  id,
  label,
  title,
  checked,
  onChange,
  disabled = false,
}: CheckboxToggleProps) {
  const labelContent = (
    <label className="checkbox-toggle" htmlFor={id}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="checkbox-toggle__input"
        disabled={disabled}
      />
      <span className="checkbox-toggle__label" title={title}>
        {label}
      </span>
    </label>
  );

  if (title) {
    return <Tooltip title={title}>{labelContent}</Tooltip>;
  }
  return labelContent;
}
