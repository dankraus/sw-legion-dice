import type { AttackFace, DefenseFace } from '../engine/simulate';
import { ATTACK_FACE_GLYPHS, DEFENSE_FACE_GLYPHS } from './legionFaceGlyphs';
import { LegionFaceSymbol } from './LegionFaceSymbol';
import './FaceCountDisplay.css';

interface FaceCountDisplayProps {
  count: number;
  face: AttackFace | DefenseFace;
  poolKind: 'attack' | 'defense';
}

export function FaceCountDisplay({
  count,
  face,
  poolKind,
}: FaceCountDisplayProps) {
  if (face === 'blank') {
    return (
      <span className="face-count-display">
        <span className="face-count-display__count">{count}</span>
        <span className="face-count-display__blank-label">blank</span>
      </span>
    );
  }

  const glyph =
    poolKind === 'attack'
      ? ATTACK_FACE_GLYPHS[face as AttackFace]
      : DEFENSE_FACE_GLYPHS[face as DefenseFace];

  return (
    <span className="face-count-display">
      <span className="face-count-display__count">{count}</span>
      <LegionFaceSymbol glyph={glyph} size="tally" />
    </span>
  );
}
