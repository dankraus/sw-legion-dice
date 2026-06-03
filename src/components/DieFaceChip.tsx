import type { AttackFace, DefenseFace } from '../engine/simulate';
import { LegionFaceSymbol } from '../legionFont/LegionFaceSymbol';
import {
  getAttackFaceGlyph,
  getDefenseFaceGlyph,
  ATTACK_FACE_LABELS,
  DEFENSE_FACE_LABELS,
} from '../legionFont/legionFaceGlyphs';
import './DieFaceChip.css';

interface DieFaceChipProps {
  color: 'red' | 'black' | 'white';
  face: AttackFace | DefenseFace;
  poolKind: 'attack' | 'defense';
}

export function DieFaceChip({ color, face, poolKind }: DieFaceChipProps) {
  const colorCapitalized = color.charAt(0).toUpperCase() + color.slice(1);
  const faceLabel =
    poolKind === 'attack'
      ? ATTACK_FACE_LABELS[face as AttackFace]
      : DEFENSE_FACE_LABELS[face as DefenseFace];
  const glyph =
    poolKind === 'attack'
      ? getAttackFaceGlyph(face as AttackFace)
      : getDefenseFaceGlyph(face as DefenseFace);
  const ariaLabel = `${colorCapitalized} ${faceLabel.toLowerCase()}`;

  return (
    <span
      className={`die-face-chip die-face-chip--${color}`}
      aria-label={ariaLabel}
    >
      <LegionFaceSymbol glyph={glyph} size="chip" />
    </span>
  );
}
