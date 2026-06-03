import { describe, it, expect } from 'vitest';
import {
  ATTACK_FACE_GLYPHS,
  DEFENSE_FACE_GLYPHS,
  LEGION_BLANK_GLYPH,
  hasCompleteLegionFaceGlyphs,
} from './legionFaceGlyphs';

describe('legionFaceGlyphs', () => {
  it('maps every attack and defense face to a glyph', () => {
    expect(hasCompleteLegionFaceGlyphs()).toBe(true);
    expect(ATTACK_FACE_GLYPHS).toEqual({
      crit: 'c',
      hit: 'h',
      surge: 'o',
      blank: LEGION_BLANK_GLYPH,
    });
    expect(DEFENSE_FACE_GLYPHS).toEqual({
      block: 's',
      surge: 'd',
      blank: LEGION_BLANK_GLYPH,
    });
  });

  it('uses distinct Legion glyphs for non-blank faces', () => {
    const attackGlyphs = new Set(
      Object.entries(ATTACK_FACE_GLYPHS)
        .filter(([face]) => face !== 'blank')
        .map(([, glyph]) => glyph)
    );
    expect(attackGlyphs.size).toBe(3);

    const defenseGlyphs = new Set(
      Object.entries(DEFENSE_FACE_GLYPHS)
        .filter(([face]) => face !== 'blank')
        .map(([, glyph]) => glyph)
    );
    expect(defenseGlyphs.size).toBe(2);
  });
});
