import './DieFaceChip.css';

interface DieFaceChipProps {
  color: 'red' | 'black' | 'white';
  faceLabel: string;
}

export function DieFaceChip({ color, faceLabel }: DieFaceChipProps) {
  const colorCapitalized = color.charAt(0).toUpperCase() + color.slice(1);
  const ariaLabel = `${colorCapitalized} ${faceLabel.toLowerCase()}`;

  return (
    <span
      className={`die-face-chip die-face-chip--${color}`}
      aria-label={ariaLabel}
    >
      {faceLabel}
    </span>
  );
}
