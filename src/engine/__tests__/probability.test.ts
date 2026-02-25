/**
 * @vitest-environment node
 * Engine tests are pure TS; no DOM needed.
 */
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

describe('Critical X', () => {
  it('criticalX 0 or undefined matches no keyword', () => {
    const pool: AttackPool = { red: 1, black: 0, white: 0 };
    const withNone = calculateAttackPool(pool, 'hit');
    const withZero = calculateAttackPool(pool, 'hit', 0);
    const withUndefined = calculateAttackPool(pool, 'hit', undefined);
    expect(withZero.expectedHits).toBeCloseTo(withNone.expectedHits);
    expect(withZero.expectedCrits).toBeCloseTo(withNone.expectedCrits);
    expect(withUndefined.expectedHits).toBeCloseTo(withNone.expectedHits);
    expect(withUndefined.expectedCrits).toBeCloseTo(withNone.expectedCrits);
  });

  it('Critical 1 with surge to hit: one surge becomes crit instead of hit', () => {
    const pool: AttackPool = { red: 1, black: 0, white: 0 };
    const noKeyword = calculateAttackPool(pool, 'hit');
    const withCritical1 = calculateAttackPool(pool, 'hit', 1);
    expect(withCritical1.expectedCrits).toBeCloseTo(noKeyword.expectedCrits + 1 / 8);
    expect(withCritical1.expectedHits).toBeCloseTo(noKeyword.expectedHits - 1 / 8);
  });

  it('Critical 2 then Surge to Hit: 3 surges → 2 crits, 1 hit', () => {
    const pool: AttackPool = { red: 0, black: 0, white: 3 };
    const result = calculateAttackPool(pool, 'hit', 2);
    const sum = result.distribution.reduce((s, d) => s + d.probability, 0);
    expect(sum).toBeCloseTo(1);
    expect(result.expectedTotal).toBeGreaterThan(0);
  });

  it('distribution sums to 1 with Critical X', () => {
    const pool: AttackPool = { red: 2, black: 1, white: 1 };
    const result = calculateAttackPool(pool, 'hit', 2);
    const sum = result.distribution.reduce((s, d) => s + d.probability, 0);
    expect(sum).toBeCloseTo(1);
  });

  it('negative criticalX treated as 0', () => {
    const pool: AttackPool = { red: 1, black: 0, white: 0 };
    const result = calculateAttackPool(pool, 'hit', -1);
    const noKeyword = calculateAttackPool(pool, 'hit');
    expect(result.expectedCrits).toBeCloseTo(noKeyword.expectedCrits);
  });
});

describe('Surge Tokens', () => {
  it('with surge none, 1 token converts one surge to hit (single white die)', () => {
    const pool: AttackPool = { red: 0, black: 0, white: 1 };
    const noTokens = calculateAttackPool(pool, 'none', undefined, 0);
    const oneToken = calculateAttackPool(pool, 'none', undefined, 1);
    expect(noTokens.expectedHits).toBeCloseTo(1 / 8);
    expect(oneToken.expectedHits).toBeCloseTo(2 / 8);
    expect(oneToken.expectedCrits).toBeCloseTo(1 / 8);
  });

  it('surge to hit: surgeTokens do not affect result', () => {
    const pool: AttackPool = { red: 1, black: 0, white: 0 };
    const zero = calculateAttackPool(pool, 'hit', undefined, 0);
    const five = calculateAttackPool(pool, 'hit', undefined, 5);
    expect(five.expectedHits).toBeCloseTo(zero.expectedHits);
    expect(five.expectedCrits).toBeCloseTo(zero.expectedCrits);
  });

  it('surge to crit: surgeTokens do not affect result', () => {
    const pool: AttackPool = { red: 1, black: 0, white: 0 };
    const zero = calculateAttackPool(pool, 'crit', undefined, 0);
    const five = calculateAttackPool(pool, 'crit', undefined, 5);
    expect(five.expectedHits).toBeCloseTo(zero.expectedHits);
    expect(five.expectedCrits).toBeCloseTo(zero.expectedCrits);
  });

  it('Critical 1 + 1 token, surge none: token applies only to surges left after Critical X', () => {
    const pool: AttackPool = { red: 0, black: 0, white: 2 };
    const noKeywordNoToken = calculateAttackPool(pool, 'none');
    const critical1OneToken = calculateAttackPool(pool, 'none', 1, 1);
    expect(critical1OneToken.expectedCrits).toBeGreaterThan(noKeywordNoToken.expectedCrits);
    expect(critical1OneToken.expectedHits).toBeGreaterThan(noKeywordNoToken.expectedHits);
  });
});
