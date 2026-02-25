import { describe, it, expect } from 'vitest';
import { DICE, getEffectiveProbabilities } from '../probability';

describe('DICE definitions', () => {
  it('red die faces sum to 8', () => {
    const r = DICE.red;
    expect(r.crit + r.surge + r.hit + r.blank).toBe(8);
  });

  it('black die faces sum to 8', () => {
    const b = DICE.black;
    expect(b.crit + b.surge + b.hit + b.blank).toBe(8);
  });

  it('white die faces sum to 8', () => {
    const w = DICE.white;
    expect(w.crit + w.surge + w.hit + w.blank).toBe(8);
  });
});

describe('getEffectiveProbabilities', () => {
  it('with no surge conversion, surge counts as blank', () => {
    const result = getEffectiveProbabilities('red', 'none');
    expect(result.crit).toBeCloseTo(1 / 8);
    expect(result.hit).toBeCloseTo(5 / 8);
    expect(result.blank).toBeCloseTo(2 / 8);
  });

  it('with surge to hit, surge adds to hit', () => {
    const result = getEffectiveProbabilities('red', 'hit');
    expect(result.crit).toBeCloseTo(1 / 8);
    expect(result.hit).toBeCloseTo(6 / 8);
    expect(result.blank).toBeCloseTo(1 / 8);
  });

  it('with surge to crit, surge adds to crit', () => {
    const result = getEffectiveProbabilities('red', 'crit');
    expect(result.crit).toBeCloseTo(2 / 8);
    expect(result.hit).toBeCloseTo(5 / 8);
    expect(result.blank).toBeCloseTo(1 / 8);
  });

  it('white die with no surge conversion', () => {
    const result = getEffectiveProbabilities('white', 'none');
    expect(result.crit).toBeCloseTo(1 / 8);
    expect(result.hit).toBeCloseTo(1 / 8);
    expect(result.blank).toBeCloseTo(6 / 8);
  });
});
