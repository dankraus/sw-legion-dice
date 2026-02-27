import { Tooltip } from './Tooltip';
import { legionQuickGuideHref } from '../legionQuickGuide';
import './CheckboxToggle.css';

interface CheckboxToggleProps {
  id: string;
  label: string;
  title?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  /** Legion Quick Guide anchor (e.g. 'backup'); label becomes a link when set. */
  guideAnchor?: string;
}

export function CheckboxToggle({
  id,
  label,
  title,
  checked,
  onChange,
  disabled = false,
  guideAnchor,
}: CheckboxToggleProps) {
  const labelText = guideAnchor ? (
    <a
      className="checkbox-toggle__label-link"
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

  const labelContent = (
    <label
      className={`checkbox-toggle${disabled ? ' checkbox-toggle--disabled' : ''}`}
      htmlFor={id}
    >
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="checkbox-toggle__input"
        disabled={disabled}
      />
      <span className="checkbox-toggle__label" title={title}>
        {labelText}
      </span>
    </label>
  );

  if (title) {
    return <Tooltip title={title}>{labelContent}</Tooltip>;
  }
  return labelContent;
}
