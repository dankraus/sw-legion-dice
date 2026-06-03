import { describe, it, expect } from 'vitest';
import { ATTACK_FACE_GLYPHS, DEFENSE_FACE_GLYPHS } from './legionFaceGlyphs';

describe('legionFaceGlyphs', () => {
  it('attack faces map to correct glyphs', () => {
    expect(ATTACK_FACE_GLYPHS).toEqual({ crit: 'c', hit: 'h', surge: 'o', blank: '' });
  });

  it('defense faces map to correct glyphs', () => {
    expect(DEFENSE_FACE_GLYPHS).toEqual({ block: 's', surge: 'd', blank: '' });
  });
});
