import type { AttackFace, DefenseFace } from '../engine/simulate';

/** Non-breaking space — blanks have no Legion font glyph. */
export const LEGION_BLANK_GLYPH = '\u00A0';

/** Characters in Legionfont0.1.4.ttf (Owen-A/Legion-font). */
export const ATTACK_FACE_GLYPHS: Record<AttackFace, string> = {
  crit: 'c',
  hit: 'h',
  surge: 'o',
  blank: LEGION_BLANK_GLYPH,
};

export const DEFENSE_FACE_GLYPHS: Record<DefenseFace, string> = {
  block: 's',
  surge: 'd',
  blank: LEGION_BLANK_GLYPH,
};

export const ATTACK_FACE_LABELS: Record<AttackFace, string> = {
  crit: 'Crit',
  surge: 'Surge',
  hit: 'Hit',
  blank: 'Blank',
};

export const DEFENSE_FACE_LABELS: Record<DefenseFace, string> = {
  block: 'Block',
  surge: 'Surge',
  blank: 'Blank',
};

const ATTACK_FACES: AttackFace[] = ['crit', 'surge', 'hit', 'blank'];
const DEFENSE_FACES: DefenseFace[] = ['block', 'surge', 'blank'];

export function getAttackFaceGlyph(face: AttackFace): string {
  return ATTACK_FACE_GLYPHS[face];
}

export function getDefenseFaceGlyph(face: DefenseFace): string {
  return DEFENSE_FACE_GLYPHS[face];
}

export function hasCompleteLegionFaceGlyphs(): boolean {
  for (const face of ATTACK_FACES) {
    const glyph = ATTACK_FACE_GLYPHS[face];
    if (face === 'blank') {
      if (glyph !== LEGION_BLANK_GLYPH) return false;
      continue;
    }
    if (!glyph || glyph === LEGION_BLANK_GLYPH) return false;
  }
  for (const face of DEFENSE_FACES) {
    const glyph = DEFENSE_FACE_GLYPHS[face];
    if (face === 'blank') {
      if (glyph !== LEGION_BLANK_GLYPH) return false;
      continue;
    }
    if (!glyph || glyph === LEGION_BLANK_GLYPH) return false;
  }
  return true;
}
