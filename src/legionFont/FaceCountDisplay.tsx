import { LegionFaceSymbol } from './LegionFaceSymbol';
import { getAttackFaceGlyph, getDefenseFaceGlyph } from './legionFaceGlyphs';
import type { AttackFace, DefenseFace } from '../engine/simulate';
import './FaceCountDisplay.css';

interface FaceCountDisplayProps {
  count: number;
  face: AttackFace | DefenseFace;
  poolKind: 'attack' | 'defense';
  size?: 'chip' | 'tally';
}

export function FaceCountDisplay({
  count,
  face,
  poolKind,
  size = 'tally',
}: FaceCountDisplayProps) {
  if (face === 'blank') {
    return (
      <span className="face-count-display">
        <span className="face-count-display__count">{count}</span>
        <span className="face-count-display__blank-label" aria-hidden="true">
          blank
        </span>
      </span>
    );
  }

  const glyph =
    poolKind === 'attack'
      ? getAttackFaceGlyph(face as AttackFace)
      : getDefenseFaceGlyph(face as DefenseFace);

  return (
    <span className="face-count-display">
      <span className="face-count-display__count">{count}</span>
      <LegionFaceSymbol glyph={glyph} size={size} />
    </span>
  );
}
