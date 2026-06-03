import './legion-font.css';

interface LegionFaceSymbolProps {
  glyph: string;
  size?: 'chip' | 'tally';
}

export function LegionFaceSymbol({
  glyph,
  size = 'chip',
}: LegionFaceSymbolProps) {
  const sizeClass =
    size === 'tally' ? 'legion-face-symbol--tally' : 'legion-face-symbol--chip';

  return (
    <span className={`legion-face-symbol ${sizeClass}`} aria-hidden="true">
      {glyph}
    </span>
  );
}
