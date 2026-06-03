import type { AttackFace, DefenseFace } from '../engine/simulate';
import { ATTACK_FACE_GLYPHS, DEFENSE_FACE_GLYPHS, ATTACK_FACE_LABELS, DEFENSE_FACE_LABELS } from '../legionFont/legionFaceGlyphs';
import { LegionFaceSymbol } from '../legionFont/LegionFaceSymbol';
import './DieFaceChip.css';

interface DieFaceChipProps {
  color: 'red' | 'black' | 'white';
  face: AttackFace | DefenseFace;
  poolKind: 'attack' | 'defense';
}

export function DieFaceChip({ color, face, poolKind }: DieFaceChipProps) {
  const faceLabel =
    poolKind === 'attack'
      ? ATTACK_FACE_LABELS[face as AttackFace]
      : DEFENSE_FACE_LABELS[face as DefenseFace];
  const glyph =
    poolKind === 'attack'
      ? ATTACK_FACE_GLYPHS[face as AttackFace]
      : DEFENSE_FACE_GLYPHS[face as DefenseFace];

  return (
    <span
      className={`die-face-chip die-face-chip--${color}`}
      aria-label={`${color[0].toUpperCase()}${color.slice(1)} ${faceLabel.toLowerCase()}`}
    >
      <LegionFaceSymbol glyph={glyph} size="chip" />
    </span>
  );
}
