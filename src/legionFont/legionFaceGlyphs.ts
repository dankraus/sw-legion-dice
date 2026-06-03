import type { AttackFace, DefenseFace } from '../engine/simulate';

/** Characters in Legionfont0.1.4.ttf (Owen-A/Legion-font). Blanks have no glyph. */
export const ATTACK_FACE_GLYPHS: Record<AttackFace, string> = {
  crit: 'c',
  hit: 'h',
  surge: 'o',
  blank: '',
};

export const DEFENSE_FACE_GLYPHS: Record<DefenseFace, string> = {
  block: 's',
  surge: 'd',
  blank: '',
};

export const ATTACK_FACE_LABELS: Record<AttackFace, string> = {
  crit: 'Crit',
  hit: 'Hit',
  surge: 'Surge',
  blank: 'Blank',
};

export const DEFENSE_FACE_LABELS: Record<DefenseFace, string> = {
  block: 'Block',
  surge: 'Surge',
  blank: 'Blank',
};
