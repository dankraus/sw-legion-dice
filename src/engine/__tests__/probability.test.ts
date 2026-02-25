import { describe, it, expect } from 'vitest';
import { DICE, getEffectiveProbabilities, calculateAttackPool } from '../probability';
import type { AttackPool } from '../../types';

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

describe('calculateAttackPool', () => {
  it('zero dice returns zero everything', () => {
    const pool: AttackPool = { red: 0, black: 0, white: 0 };
    const result = calculateAttackPool(pool, 'none');
    expect(result.expectedHits).toBe(0);
    expect(result.expectedCrits).toBe(0);
    expect(result.expectedTotal).toBe(0);
    expect(result.distribution).toHaveLength(1);
    expect(result.distribution[0]).toEqual({ total: 0, probability: 1 });
  });

  it('single red die with no surge has correct expected values', () => {
    const pool: AttackPool = { red: 1, black: 0, white: 0 };
    const result = calculateAttackPool(pool, 'none');
    expect(result.expectedHits).toBeCloseTo(5 / 8);
    expect(result.expectedCrits).toBeCloseTo(1 / 8);
    expect(result.expectedTotal).toBeCloseTo(6 / 8);
  });

  it('single red die with surge to hit', () => {
    const pool: AttackPool = { red: 1, black: 0, white: 0 };
    const result = calculateAttackPool(pool, 'hit');
    expect(result.expectedHits).toBeCloseTo(6 / 8);
    expect(result.expectedCrits).toBeCloseTo(1 / 8);
    expect(result.expectedTotal).toBeCloseTo(7 / 8);
  });

  it('two red dice expected total is double one red die', () => {
    const pool: AttackPool = { red: 2, black: 0, white: 0 };
    const result = calculateAttackPool(pool, 'none');
    expect(result.expectedTotal).toBeCloseTo(2 * 6 / 8);
  });

  it('distribution probabilities sum to 1', () => {
    const pool: AttackPool = { red: 2, black: 1, white: 1 };
    const result = calculateAttackPool(pool, 'hit');
    const sum = result.distribution.reduce((s, d) => s + d.probability, 0);
    expect(sum).toBeCloseTo(1);
  });

  it('cumulative starts at 1 for at-least-0', () => {
    const pool: AttackPool = { red: 1, black: 1, white: 0 };
    const result = calculateAttackPool(pool, 'none');
    expect(result.cumulative[0]).toEqual({ total: 0, probability: 1 });
  });

  it('cumulative is non-increasing', () => {
    const pool: AttackPool = { red: 2, black: 2, white: 1 };
    const result = calculateAttackPool(pool, 'crit');
    for (let i = 1; i < result.cumulative.length; i++) {
      expect(result.cumulative[i].probability).toBeLessThanOrEqual(
        result.cumulative[i - 1].probability
      );
    }
  });
});
