import type { AttackFace, DefenseFace } from '../engine/simulate';
import { ATTACK_FACE_LABELS, DEFENSE_FACE_LABELS } from './legionFaceGlyphs';

export function faceCountAriaLabel(
  count: number,
  face: AttackFace | DefenseFace,
  poolKind: 'attack' | 'defense'
): string {
  const label =
    poolKind === 'attack'
      ? ATTACK_FACE_LABELS[face as AttackFace]
      : DEFENSE_FACE_LABELS[face as DefenseFace];
  return `${count} ${label.toLowerCase()}${count === 1 ? '' : 's'}`;
}
