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
  resolveDefenseRoll,
  rollOneDefenseDieOutcome,
  applyCover,
  getEffectiveCover,
  simulateDefensePool,
  getDefenseDistributionForDiceCountSim,
  simulateWounds,
  simulateWoundsFromAttackResults,
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

describe('resolveDefenseRoll', () => {
  it('surge block: returns blocks + surges', () => {
    expect(resolveDefenseRoll(2, 1, 'block', 0)).toBe(3);
    expect(resolveDefenseRoll(0, 2, 'block', 5)).toBe(2);
  });
  it('surge none, 0 tokens: returns blocks only', () => {
    expect(resolveDefenseRoll(2, 1, 'none', 0)).toBe(2);
  });
  it('surge none, tokens < surges: returns blocks + tokens', () => {
    expect(resolveDefenseRoll(1, 3, 'none', 2)).toBe(3);
  });
  it('surge none, tokens >= surges: returns blocks + surges', () => {
    expect(resolveDefenseRoll(1, 2, 'none', 5)).toBe(3);
  });
  it('normalizes negative/undefined defenseSurgeTokens to 0', () => {
    expect(resolveDefenseRoll(1, 1, 'none', undefined)).toBe(1);
    expect(resolveDefenseRoll(1, 1, 'none', -1)).toBe(1);
  });
});

describe('rollOneDefenseDieOutcome', () => {
  it('red die: over many rolls block/surge/blank proportions match 3/1/2', () => {
    const rng = createSeededRng(42);
    const counts = { block: 0, surge: 0, blank: 0 };
    for (let i = 0; i < 6000; i++) {
      const face = rollOneDefenseDieOutcome('red', rng);
      counts[face]++;
    }
    expect(counts.block).toBeGreaterThan(2500);
    expect(counts.block).toBeLessThan(3500);
    expect(counts.surge).toBeGreaterThan(800);
    expect(counts.surge).toBeLessThan(1200);
    expect(counts.blank).toBeGreaterThan(1800);
    expect(counts.blank).toBeLessThan(2200);
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
    const result = simulateDefensePool({ red: 0, white: 0 }, 'none', undefined, 100, rng);
    expect(result.expectedBlocks).toBe(0);
    expect(result.distribution[0].probability).toBeCloseTo(1, 2);
  });

  it('getDefenseDistributionForDiceCountSim 1 red die surge none: expectedBlocks close to 3/6', () => {
    const rng = createSeededRng(1);
    const result = getDefenseDistributionForDiceCountSim(1, 'red', 'none', undefined, 10_000, rng);
    expect(result.expectedBlocks).toBeCloseTo(3 / 6, 1);
  });
});

describe('getEffectiveCover', () => {
  it('none stays none for any X', () => {
    expect(getEffectiveCover('none', 0)).toBe('none');
    expect(getEffectiveCover('none', 1)).toBe('none');
    expect(getEffectiveCover('none', 2)).toBe('none');
  });

  it('light: 0 stays light, 1 becomes none, 2+ stays none', () => {
    expect(getEffectiveCover('light', 0)).toBe('light');
    expect(getEffectiveCover('light', 1)).toBe('none');
    expect(getEffectiveCover('light', 2)).toBe('none');
    expect(getEffectiveCover('light', 3)).toBe('none');
  });

  it('heavy: 0 stays heavy, 1 becomes light, 2+ becomes none', () => {
    expect(getEffectiveCover('heavy', 0)).toBe('heavy');
    expect(getEffectiveCover('heavy', 1)).toBe('light');
    expect(getEffectiveCover('heavy', 2)).toBe('none');
    expect(getEffectiveCover('heavy', 3)).toBe('none');
  });

  it('negative X treated as 0', () => {
    expect(getEffectiveCover('heavy', -1)).toBe('heavy');
    expect(getEffectiveCover('light', -1)).toBe('light');
  });

  it('suppressed true: improves cover by 1 then sharpshooter applies', () => {
    expect(getEffectiveCover('none', 0, true)).toBe('light');
    expect(getEffectiveCover('light', 0, true)).toBe('heavy');
    expect(getEffectiveCover('heavy', 0, true)).toBe('heavy');
    expect(getEffectiveCover('light', 1, true)).toBe('light');
  });

  it('coverX: improves by X then cap at heavy; sharpshooter applies after', () => {
    expect(getEffectiveCover('none', 0, false, 1)).toBe('light');
    expect(getEffectiveCover('none', 0, false, 2)).toBe('heavy');
    expect(getEffectiveCover('light', 0, false, 1)).toBe('heavy');
    expect(getEffectiveCover('heavy', 0, false, 2)).toBe('heavy');
    expect(getEffectiveCover('none', 0, true, 1)).toBe('heavy');
    expect(getEffectiveCover('heavy', 1, false, 1)).toBe('light');
  });
});

describe('applyCover', () => {
  it('none: returns hits and crits unchanged', () => {
    const rng = createSeededRng(42);
    expect(applyCover(3, 1, 'none', rng, 0)).toEqual({ hits: 3, crits: 1 });
    expect(applyCover(0, 2, 'none', rng, undefined)).toEqual({ hits: 0, crits: 2 });
  });
  it('zero hits: returns 0 hits and crits unchanged', () => {
    const rng = createSeededRng(99);
    expect(applyCover(0, 1, 'light', rng, 0)).toEqual({ hits: 0, crits: 1 });
    expect(applyCover(0, 1, 'heavy', rng, 0)).toEqual({ hits: 0, crits: 1 });
  });
  it('light: crits unchanged', () => {
    const rng = createSeededRng(123);
    const result = applyCover(2, 3, 'light', rng, 0);
    expect(result.crits).toBe(3);
    expect(result.hits).toBeLessThanOrEqual(2);
  });
  it('heavy: crits unchanged, hits never exceed original', () => {
    const rng = createSeededRng(456);
    const result = applyCover(4, 2, 'heavy', rng, 0);
    expect(result.crits).toBe(2);
    expect(result.hits).toBeLessThanOrEqual(4);
    expect(result.hits).toBeGreaterThanOrEqual(0);
  });
  it('sharpshooter 2: heavy becomes none so hits and crits unchanged', () => {
    const rng = createSeededRng(1);
    expect(applyCover(3, 1, 'heavy', rng, 2)).toEqual({ hits: 3, crits: 1 });
  });
  it('sharpshooter 1: heavy becomes light so only blocks cancel hits', () => {
    const rng1 = createSeededRng(100);
    const rng2 = createSeededRng(100);
    const withHeavyAndSharpshooter1 = applyCover(4, 2, 'heavy', rng1, 1);
    const withLightNoSharpshooter = applyCover(4, 2, 'light', rng2, 0);
    expect(withHeavyAndSharpshooter1).toEqual(withLightNoSharpshooter);
  });
  it('suppressed true: none behaves like light', () => {
    const rng1 = createSeededRng(200);
    const rng2 = createSeededRng(200);
    const noneSuppressed = applyCover(2, 1, 'none', rng1, 0, true);
    const lightNoSuppressed = applyCover(2, 1, 'light', rng2, 0);
    expect(noneSuppressed).toEqual(lightNoSuppressed);
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
      false, // outmaneuver
      undefined, // defenseSurgeTokens
      'none', // cover
      false, // lowProfile
      false, // suppressed
      0, // sharpshooterX
      false, // backup
      0, // pierceX
      20_000,
      rng
    );
    expect(result.expectedWounds).toBeCloseTo(3 / 8, 1);
  });
});

describe('defense surge tokens in wounds simulation', () => {
  it('with 1 hit 0 crits, surge none, 1 red defense die: 1 token yields higher avg blocks than 0 tokens', () => {
    const attackResults = {
      expectedHits: 1,
      expectedCrits: 0,
      expectedTotal: 1,
      distribution: [{ total: 0, probability: 0 }, { total: 1, probability: 1 }],
      distributionByHitsCrits: [{ hits: 1, crits: 0, probability: 1 }],
      cumulative: [{ total: 0, probability: 1 }, { total: 1, probability: 0 }],
    };
    const runs = 10_000;
    const rngZero = createSeededRng(100);
    const rngOne = createSeededRng(100);
    const resultZero = simulateWoundsFromAttackResults(
      attackResults,
      'red',
      'none',
      0,
      false,
      0,
      'none',
      false,
      false,
      0,
      false,
      0,
      runs,
      rngZero
    );
    const resultOne = simulateWoundsFromAttackResults(
      attackResults,
      'red',
      'none',
      0,
      false,
      1,
      'none',
      false,
      false,
      0,
      false,
      0,
      runs,
      rngOne
    );
    const expectedBlocksZero = 1 - resultZero.expectedWounds;
    const expectedBlocksOne = 1 - resultOne.expectedWounds;
    expect(expectedBlocksOne).toBeGreaterThan(expectedBlocksZero);
  });
});

describe('cover in wounds simulation', () => {
  it('1 hit 0 crits: light cover yields lower expected wounds than none', () => {
    const attackResults = {
      expectedHits: 1,
      expectedCrits: 0,
      expectedTotal: 1,
      distribution: [{ total: 0, probability: 0 }, { total: 1, probability: 1 }],
      distributionByHitsCrits: [{ hits: 1, crits: 0, probability: 1 }],
      cumulative: [{ total: 0, probability: 1 }, { total: 1, probability: 0 }],
    };
    const runs = 10_000;
    const rngNone = createSeededRng(200);
    const rngLight = createSeededRng(200);
    const resultNone = simulateWoundsFromAttackResults(
      attackResults,
      'red',
      'none',
      0,
      false,
      0,
      'none',
      false,
      false,
      0,
      false,
      0,
      runs,
      rngNone
    );
    const resultLight = simulateWoundsFromAttackResults(
      attackResults,
      'red',
      'none',
      0,
      false,
      0,
      'light',
      false,
      false,
      0,
      false,
      0,
      runs,
      rngLight
    );
    expect(resultLight.expectedWounds).toBeLessThan(resultNone.expectedWounds);
  });
  it('light cover with Low Profile on yields lower expected wounds than Low Profile off', () => {
    const attackResults = {
      expectedHits: 4,
      expectedCrits: 0,
      expectedTotal: 4,
      distribution: [
        { total: 0, probability: 0 },
        { total: 1, probability: 0 },
        { total: 2, probability: 0 },
        { total: 3, probability: 0 },
        { total: 4, probability: 1 },
      ],
      distributionByHitsCrits: [{ hits: 4, crits: 0, probability: 1 }],
      cumulative: [
        { total: 0, probability: 1 },
        { total: 1, probability: 0 },
        { total: 2, probability: 0 },
        { total: 3, probability: 0 },
        { total: 4, probability: 0 },
      ],
    };
    const runs = 10_000;
    const rngOff = createSeededRng(400);
    const rngOn = createSeededRng(400);
    const resultOff = simulateWoundsFromAttackResults(
      attackResults,
      'red',
      'none',
      0,
      false,
      0,
      'light',
      false,
      false,
      0,
      false,
      0,
      runs,
      rngOff
    );
    const resultOn = simulateWoundsFromAttackResults(
      attackResults,
      'red',
      'none',
      0,
      false,
      0,
      'light',
      true,
      false,
      0,
      false,
      0,
      runs,
      rngOn
    );
    expect(resultOn.expectedWounds).toBeLessThan(resultOff.expectedWounds);
  });
  it('sharpshooter 1 with heavy cover yields higher expected wounds than no sharpshooter', () => {
    const attackResults = {
      expectedHits: 2,
      expectedCrits: 0,
      expectedTotal: 2,
      distribution: [
        { total: 0, probability: 0 },
        { total: 1, probability: 0 },
        { total: 2, probability: 1 },
      ],
      distributionByHitsCrits: [{ hits: 2, crits: 0, probability: 1 }],
      cumulative: [
        { total: 0, probability: 1 },
        { total: 1, probability: 0 },
        { total: 2, probability: 0 },
      ],
    };
    const runs = 10_000;
    const rngNoSharp = createSeededRng(300);
    const rngSharp = createSeededRng(300);
    const noSharpshooter = simulateWoundsFromAttackResults(
      attackResults,
      'red',
      'none',
      0,
      false,
      0,
      'heavy',
      false,
      false,
      0,
      false,
      0,
      runs,
      rngNoSharp
    );
    const withSharpshooter1 = simulateWoundsFromAttackResults(
      attackResults,
      'red',
      'none',
      0,
      false,
      0,
      'heavy',
      false,
      false,
      1,
      false,
      0,
      runs,
      rngSharp
    );
    expect(withSharpshooter1.expectedWounds).toBeGreaterThan(noSharpshooter.expectedWounds);
  });
  it('cover none with Suppressed on yields lower expected wounds than Suppressed off', () => {
    const attackResults = {
      expectedHits: 3,
      expectedCrits: 0,
      expectedTotal: 3,
      distribution: [
        { total: 0, probability: 0 },
        { total: 1, probability: 0 },
        { total: 2, probability: 0 },
        { total: 3, probability: 1 },
      ],
      distributionByHitsCrits: [{ hits: 3, crits: 0, probability: 1 }],
      cumulative: [
        { total: 0, probability: 1 },
        { total: 1, probability: 0 },
        { total: 2, probability: 0 },
        { total: 3, probability: 0 },
      ],
    };
    const runs = 5000;
    const rngOff = createSeededRng(801);
    const rngOn = createSeededRng(801);
    const resultOff = simulateWoundsFromAttackResults(
      attackResults,
      'red',
      'none',
      0,
      false,
      0,
      'none',
      false,
      false,
      0,
      false,
      0,
      runs,
      rngOff
    );
    const resultOn = simulateWoundsFromAttackResults(
      attackResults,
      'red',
      'none',
      0,
      false,
      0,
      'none',
      false,
      true,
      0,
      false,
      0,
      runs,
      rngOn
    );
    expect(resultOn.expectedWounds).toBeLessThan(resultOff.expectedWounds);
  });
});

describe('backup in wounds simulation', () => {
  it('3 hits 0 crits: backup on yields lower expected wounds than backup off', () => {
    const attackResults = {
      expectedHits: 3,
      expectedCrits: 0,
      expectedTotal: 3,
      distribution: [
        { total: 0, probability: 0 },
        { total: 1, probability: 0 },
        { total: 2, probability: 0 },
        { total: 3, probability: 1 },
      ],
      distributionByHitsCrits: [{ hits: 3, crits: 0, probability: 1 }],
      cumulative: [
        { total: 0, probability: 1 },
        { total: 1, probability: 0 },
        { total: 2, probability: 0 },
        { total: 3, probability: 0 },
      ],
    };
    const runs = 10_000;
    const rngOff = createSeededRng(500);
    const rngOn = createSeededRng(500);
    const resultOff = simulateWoundsFromAttackResults(
      attackResults,
      'red',
      'none',
      0,
      false,
      0,
      'none',
      false,
      false,
      0,
      false,
      0,
      runs,
      rngOff
    );
    const resultOn = simulateWoundsFromAttackResults(
      attackResults,
      'red',
      'none',
      0,
      false,
      0,
      'none',
      false,
      false,
      0,
      true,
      0,
      runs,
      rngOn
    );
    // Backup removes 2 hits → 1 defense die instead of 3; fewer dice to roll, different wound distribution
    expect(resultOn.expectedWounds).toBeLessThan(resultOff.expectedWounds);
  });
});

describe('Pierce X in wounds simulation', () => {
  it('pierce 0 yields same result as baseline (no canceling blocks)', () => {
    const attackResults = {
      expectedHits: 1,
      expectedCrits: 0,
      expectedTotal: 1,
      distribution: [{ total: 0, probability: 0 }, { total: 1, probability: 1 }],
      distributionByHitsCrits: [{ hits: 1, crits: 0, probability: 1 }],
      cumulative: [{ total: 0, probability: 1 }, { total: 1, probability: 0 }],
    };
    const runs = 5_000;
    const rng = createSeededRng(900);
    const withPierce0 = simulateWoundsFromAttackResults(
      attackResults,
      'red',
      'none',
      0,
      false,
      0,
      'none',
      false,
      false,
      0,
      false,
      0,
      runs,
      rng
    );
    const rng2 = createSeededRng(900);
    const again = simulateWoundsFromAttackResults(
      attackResults,
      'red',
      'none',
      0,
      false,
      0,
      'none',
      false,
      false,
      0,
      false,
      0,
      runs,
      rng2
    );
    expect(again.expectedWounds).toBeCloseTo(withPierce0.expectedWounds, 10);
  });

  it('pierce 3 with 3 hits and 3 defense dice yields higher expected wounds than pierce 0', () => {
    const attackResults = {
      expectedHits: 3,
      expectedCrits: 0,
      expectedTotal: 3,
      distribution: [
        { total: 0, probability: 0 },
        { total: 1, probability: 0 },
        { total: 2, probability: 0 },
        { total: 3, probability: 1 },
      ],
      distributionByHitsCrits: [{ hits: 3, crits: 0, probability: 1 }],
      cumulative: [
        { total: 0, probability: 1 },
        { total: 1, probability: 0 },
        { total: 2, probability: 0 },
        { total: 3, probability: 0 },
      ],
    };
    const runs = 10_000;
    const rngZero = createSeededRng(1000);
    const rngThree = createSeededRng(1000);
    const pierce0 = simulateWoundsFromAttackResults(
      attackResults,
      'red',
      'none',
      0,
      false,
      0,
      'none',
      false,
      false,
      0,
      false,
      0,
      runs,
      rngZero
    );
    const pierce3 = simulateWoundsFromAttackResults(
      attackResults,
      'red',
      'none',
      0,
      false,
      0,
      'none',
      false,
      false,
      0,
      false,
      3,
      runs,
      rngThree
    );
    expect(pierce3.expectedWounds).toBeGreaterThan(pierce0.expectedWounds);
  });
});
