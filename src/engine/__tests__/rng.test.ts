/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { createSeededRng, DEFAULT_RUNS } from '../rng';

describe('rng', () => {
  it('DEFAULT_RUNS is 10000', () => {
    expect(DEFAULT_RUNS).toBe(10_000);
  });

  it('same seed produces same sequence', () => {
    const rng1 = createSeededRng(42);
    const rng2 = createSeededRng(42);
    for (let i = 0; i < 10; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  it('different seeds produce different sequence', () => {
    const rng1 = createSeededRng(1);
    const rng2 = createSeededRng(2);
    expect(rng1()).not.toBe(rng2());
  });

  it('returns number in [0, 1)', () => {
    const rng = createSeededRng(123);
    for (let i = 0; i < 100; i++) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});
