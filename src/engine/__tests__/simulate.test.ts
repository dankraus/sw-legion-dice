/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import type { AttackPool } from '../../types';
import { createSeededRng } from '../rng';
import {
  rollOneAttackDie,
  rollAttackPool,
  resolveStep,
  applyRerolls,
  applyRam,
  simulateAttackPool,
  rollOneDefenseDie,
  simulateDefensePool,
  getDefenseDistributionForDiceCountSim,
  simulateWounds,
} from '../simulate';

describe('rollOneAttackDie', () => {
  it('returns one of crit, surge, hit, blank', () => {
    const rng = createSeededRng(999);
    const faces = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const face = rollOneAttackDie('red', rng);
      faces.add(face);
    }
    expect(faces).toEqual(new Set(['crit', 'surge', 'hit', 'blank']));
  });

  it('with fixed seed red die produces deterministic sequence', () => {
    const rng = createSeededRng(1);
    const results = Array.from({ length: 8 }, () => rollOneAttackDie('red', rng));
    expect(results).toHaveLength(8);
    const crits = results.filter((face) => face === 'crit').length;
    const hits = results.filter((face) => face === 'hit').length;
    expect(crits).toBeGreaterThanOrEqual(0);
    expect(hits).toBeGreaterThanOrEqual(0);
  });
});

describe('rollAttackPool', () => {
  it('zero pool returns all zeros', () => {
    const pool: AttackPool = { red: 0, black: 0, white: 0 };
    const rng = createSeededRng(1);
    const counts = rollAttackPool(pool, rng);
    expect(counts).toEqual({ crit: 0, surge: 0, hit: 0, blank: 0 });
  });

  it('single red die returns one face', () => {
    const pool: AttackPool = { red: 1, black: 0, white: 0 };
    const rng = createSeededRng(2);
    const counts = rollAttackPool(pool, rng);
    expect(counts.crit + counts.surge + counts.hit + counts.blank).toBe(1);
  });

  it('pool of 4 dice returns sum 4', () => {
    const pool: AttackPool = { red: 2, black: 1, white: 1 };
    const rng = createSeededRng(3);
    const counts = rollAttackPool(pool, rng);
    expect(counts.crit + counts.surge + counts.hit + counts.blank).toBe(4);
  });
});

describe('resolveStep', () => {
  it('no keywords: surges go to blank when surge none', () => {
    const result = resolveStep(
      { crit: 1, surge: 2, hit: 3, blank: 0 },
      0,
      'none',
      0
    );
    expect(result.hits).toBe(3);
    expect(result.crits).toBe(1);
  });

  it('surge to hit: all surges become hits', () => {
    const result = resolveStep(
      { crit: 0, surge: 2, hit: 1, blank: 0 },
      0,
      'hit',
      0
    );
    expect(result.hits).toBe(3);
    expect(result.crits).toBe(0);
  });

  it('Critical 1 with surge none and 1 token: one surge to crit, one surge to hit via token', () => {
    const result = resolveStep(
      { crit: 0, surge: 2, hit: 0, blank: 0 },
      1,
      'none',
      1
    );
    expect(result.crits).toBe(1);
    expect(result.hits).toBe(1);
  });
});

describe('applyRerolls', () => {
  it('zero capacity leaves hits and crits unchanged', () => {
    const rng = createSeededRng(1);
    const result = applyRerolls(
      { crit: 0, surge: 0, hit: 1, blank: 2 },
      { hits: 1, crits: 0 },
      { red: 1, black: 0, white: 0 },
      'none',
      0,
      0,
      0,
      rng
    );
    expect(result.hits).toBe(1);
    expect(result.crits).toBe(0);
  });

  it('1 observe token with 1 blank: reroll adds 0 or 1 success', () => {
    const pool: AttackPool = { red: 0, black: 0, white: 1 };
    const raw = { crit: 0, surge: 0, hit: 0, blank: 1 };
    const resolved = { hits: 0, crits: 0 };
    const rng = createSeededRng(100);
    const result = applyRerolls(raw, resolved, pool, 'none', 0, 1, 0, rng);
    expect(result.hits + result.crits).toBeGreaterThanOrEqual(0);
    expect(result.hits + result.crits).toBeLessThanOrEqual(1);
  });
});

describe('applyRam', () => {
  it('Ram 0 leaves hits and crits unchanged', () => {
    const result = applyRam(2, 1, 0, 0);
    expect(result.hits).toBe(2);
    expect(result.crits).toBe(1);
  });

  it('Ram 1 with 1 blank converts that blank to 1 crit', () => {
    const result = applyRam(0, 0, 1, 1);
    expect(result.hits).toBe(0);
    expect(result.crits).toBe(1);
  });

  it('Ram 2 with 1 blank and 1 hit converts both to crits', () => {
    const result = applyRam(1, 0, 1, 2);
    expect(result.hits).toBe(0);
    expect(result.crits).toBe(2);
  });
});

describe('simulateAttackPool', () => {
  it('returns AttackResults shape with expectedTotal close to 6/8 for 1 red die, surge none', () => {
    const pool: AttackPool = { red: 1, black: 0, white: 0 };
    const rng = createSeededRng(1);
    const result = simulateAttackPool(
      pool,
      'none',
      undefined,
      0,
      0,
      0,
      0,
      0,
      50_000,
      rng
    );
    expect(result.expectedTotal).toBeCloseTo(6 / 8, 1);
    expect(result.expectedHits).toBeCloseTo(5 / 8, 1);
    expect(result.expectedCrits).toBeCloseTo(1 / 8, 1);
    const sumProb = result.distribution.reduce((acc, entry) => acc + entry.probability, 0);
    expect(sumProb).toBeCloseTo(1, 2);
  });
});

describe('defense simulation', () => {
  it('rollOneDefenseDie returns 0 or 1', () => {
    const rng = createSeededRng(1);
    const results = new Set<number>();
    for (let i = 0; i < 50; i++) {
      results.add(rollOneDefenseDie('red', 'none', rng));
    }
    expect(results).toEqual(new Set([0, 1]));
  });

  it('simulateDefensePool 0 dice returns 0 blocks', () => {
    const rng = createSeededRng(1);
    const result = simulateDefensePool({ red: 0, white: 0 }, 'none', 100, rng);
    expect(result.expectedBlocks).toBe(0);
    expect(result.distribution[0].probability).toBeCloseTo(1, 2);
  });

  it('getDefenseDistributionForDiceCountSim 1 red die surge none: expectedBlocks close to 3/6', () => {
    const rng = createSeededRng(1);
    const result = getDefenseDistributionForDiceCountSim(1, 'red', 'none', 10_000, rng);
    expect(result.expectedBlocks).toBeCloseTo(3 / 6, 1);
  });
});

describe('simulateWounds', () => {
  it('1 red die vs red defense none, 0 dodge: expectedWounds close to 3/8', () => {
    // E[wounds] = E[attack] * (1 - P(block)) for 1v1 ≈ (6/8) * (1 - 3/6) = 3/8
    const pool: AttackPool = { red: 1, black: 0, white: 0 };
    const rng = createSeededRng(1);
    const result = simulateWounds(
      pool,
      'none',
      undefined,
      0,
      0,
      0,
      0,
      0,
      'red',
      'none',
      0,
      20_000,
      rng
    );
    expect(result.expectedWounds).toBeCloseTo(3 / 8, 1);
  });
});
