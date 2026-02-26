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

describe('Aim and Observe tokens', () => {
  it('zero aim and observe: same as no tokens', () => {
    const pool: AttackPool = { red: 1, black: 0, white: 1 };
    const noTokens = calculateAttackPool(pool, 'none');
    const zeroBoth = calculateAttackPool(pool, 'none', undefined, 0, 0, 0);
    expect(zeroBoth.expectedHits).toBeCloseTo(noTokens.expectedHits);
    expect(zeroBoth.expectedCrits).toBeCloseTo(noTokens.expectedCrits);
  });

  it('1 Observe token with 1 white die (surge none): reroll 1 blank adds expected hit/crit', () => {
    const pool: AttackPool = { red: 0, black: 0, white: 1 };
    const noToken = calculateAttackPool(pool, 'none');
    const oneObserve = calculateAttackPool(pool, 'none', undefined, 0, 0, 1);
    expect(oneObserve.expectedHits).toBeGreaterThan(noToken.expectedHits);
    expect(oneObserve.expectedCrits).toBeGreaterThan(noToken.expectedCrits);
    expect(noToken.expectedHits).toBeCloseTo(1 / 8);
    expect(noToken.expectedCrits).toBeCloseTo(1 / 8);
    expect(oneObserve.expectedHits).toBeCloseTo(1 / 8 + (5 / 8) * (1 / 8));
    expect(oneObserve.expectedCrits).toBeCloseTo(1 / 8 + (5 / 8) * (1 / 8));
  });

  it('1 Aim token with 1 white die: reroll capacity 2, only 1 blank so same as 1 Observe', () => {
    const pool: AttackPool = { red: 0, black: 0, white: 1 };
    const oneObserve = calculateAttackPool(pool, 'none', undefined, 0, 0, 1);
    const oneAim = calculateAttackPool(pool, 'none', undefined, 0, 1, 0);
    expect(oneAim.expectedHits).toBeCloseTo(oneObserve.expectedHits);
    expect(oneAim.expectedCrits).toBeCloseTo(oneObserve.expectedCrits);
  });

  it('1 Aim token with 2 white dice: can reroll 2 blanks when both blank', () => {
    const pool: AttackPool = { red: 0, black: 0, white: 2 };
    const noToken = calculateAttackPool(pool, 'none');
    const oneAim = calculateAttackPool(pool, 'none', undefined, 0, 1, 0);
    expect(oneAim.expectedHits).toBeGreaterThan(noToken.expectedHits);
    expect(oneAim.expectedCrits).toBeGreaterThan(noToken.expectedCrits);
    expect(oneAim.expectedTotal).toBeGreaterThan(noToken.expectedTotal);
  });

  it('Observe tokens work regardless of Surge Conversion', () => {
    const pool: AttackPool = { red: 0, black: 0, white: 1 };
    const noTokenHit = calculateAttackPool(pool, 'hit');
    const oneObserveHit = calculateAttackPool(pool, 'hit', undefined, 0, 0, 1);
    expect(oneObserveHit.expectedHits).toBeGreaterThan(noTokenHit.expectedHits);
    expect(oneObserveHit.expectedCrits).toBeGreaterThan(noTokenHit.expectedCrits);
  });

  it('Aim tokens work regardless of Surge Conversion', () => {
    const pool: AttackPool = { red: 0, black: 0, white: 2 };
    const noTokenCrit = calculateAttackPool(pool, 'crit');
    const oneAimCrit = calculateAttackPool(pool, 'crit', undefined, 0, 1, 0);
    expect(oneAimCrit.expectedTotal).toBeGreaterThan(noTokenCrit.expectedTotal);
  });
});

describe('Precise keyword', () => {
  it('1 Aim + Precise 1: reroll capacity 3 (higher expected total than 1 Aim + Precise 0)', () => {
    const pool: AttackPool = { red: 0, black: 0, white: 3 };
    const oneAimNoPrecise = calculateAttackPool(pool, 'none', undefined, 0, 1, 0);
    const oneAimPrecise1 = calculateAttackPool(pool, 'none', undefined, 0, 1, 0, 1);
    expect(oneAimPrecise1.expectedTotal).toBeGreaterThan(oneAimNoPrecise.expectedTotal);
    expect(oneAimPrecise1.expectedHits).toBeGreaterThan(oneAimNoPrecise.expectedHits);
  });

  it('2 Aim + Precise 1: reroll capacity 6', () => {
    const pool: AttackPool = { red: 0, black: 0, white: 5 };
    const twoAimPrecise0 = calculateAttackPool(pool, 'none', undefined, 0, 2, 0);
    const twoAimPrecise1 = calculateAttackPool(pool, 'none', undefined, 0, 2, 0, 1);
    expect(twoAimPrecise1.expectedTotal).toBeGreaterThan(twoAimPrecise0.expectedTotal);
  });

  it('0 Aim + Precise 1: same as 0 Aim (precise ignored)', () => {
    const pool: AttackPool = { red: 0, black: 0, white: 2 };
    const zeroAim = calculateAttackPool(pool, 'none', undefined, 0, 0, 0);
    const zeroAimPrecise1 = calculateAttackPool(pool, 'none', undefined, 0, 0, 0, 1);
    expect(zeroAimPrecise1.expectedHits).toBeCloseTo(zeroAim.expectedHits);
    expect(zeroAimPrecise1.expectedCrits).toBeCloseTo(zeroAim.expectedCrits);
  });
});

describe('Ram X keyword', () => {
  it('Ram 1 with 1 white die (surge none, no rerolls): converts blank or hit to crit', () => {
    const pool: AttackPool = { red: 0, black: 0, white: 1 };
    const noRam = calculateAttackPool(pool, 'none');
    // white die: 1 crit, 1 surge, 1 hit, 5 blank. Surge none → surge wasted.
    // Per outcome with Ram 1:
    //   crit(1/8): no blanks/hits to convert → crits=1
    //   surge(1/8): no blanks/hits → crits=0
    //   hit(1/8): 0 blanks, 1 hit → hit→crit → crits=1, hits=0
    //   blank(5/8): 1 blank→crit → crits=1
    // expectedCrits = (1+0+1+5)/8 = 7/8, expectedHits = 0
    const ram1 = calculateAttackPool(pool, 'none', undefined, 0, 0, 0, 0, 1);
    expect(ram1.expectedCrits).toBeGreaterThan(noRam.expectedCrits);
    expect(ram1.expectedTotal).toBeGreaterThan(noRam.expectedTotal);
    expect(ram1.expectedCrits).toBeCloseTo(7 / 8);
    expect(ram1.expectedHits).toBeCloseTo(0);
  });

  it('Ram 0 or undefined: same as no Ram', () => {
    const pool: AttackPool = { red: 1, black: 0, white: 1 };
    const noRam = calculateAttackPool(pool, 'hit');
    const ram0 = calculateAttackPool(pool, 'hit', undefined, 0, 0, 0, 0, 0);
    const ramUndef = calculateAttackPool(pool, 'hit', undefined, 0, 0, 0, 0, undefined);
    expect(ram0.expectedHits).toBeCloseTo(noRam.expectedHits);
    expect(ram0.expectedCrits).toBeCloseTo(noRam.expectedCrits);
    expect(ramUndef.expectedHits).toBeCloseTo(noRam.expectedHits);
    expect(ramUndef.expectedCrits).toBeCloseTo(noRam.expectedCrits);
  });

  it('negative ramX treated as 0', () => {
    const pool: AttackPool = { red: 1, black: 0, white: 0 };
    const noRam = calculateAttackPool(pool, 'hit');
    const negRam = calculateAttackPool(pool, 'hit', undefined, 0, 0, 0, 0, -1);
    expect(negRam.expectedCrits).toBeCloseTo(noRam.expectedCrits);
    expect(negRam.expectedHits).toBeCloseTo(noRam.expectedHits);
  });

  it('Ram 2 with 1 white die (surge none, no rerolls): converts blank then hit to crit', () => {
    const pool: AttackPool = { red: 0, black: 0, white: 1 };
    // Per outcome (single die):
    //   crit: 0 blanks, 0 hits → ram does nothing. crits=1
    //   surge: 0 blanks, 0 hits (surge=none → wasted) → ram does nothing. crits=0
    //   hit: 0 blanks, 1 hit → ram converts 1 hit to crit. crits=1, hits=0
    //   blank: 1 blank → ram converts 1 blank to crit, ram left=1, 0 hits left → crits=1, hits=0
    // expectedCrits = (1 + 0 + 1 + 5*1)/8 = 7/8
    // expectedHits = 0
    const ram2 = calculateAttackPool(pool, 'none', undefined, 0, 0, 0, 0, 2);
    expect(ram2.expectedCrits).toBeCloseTo(7 / 8);
    expect(ram2.expectedHits).toBeCloseTo(0);
    expect(ram2.expectedTotal).toBeCloseTo(7 / 8);
  });

  it('Ram 1 + 1 Aim with white dice: Ram applies after rerolls, converts a remaining blank', () => {
    const pool: AttackPool = { red: 0, black: 0, white: 3 };
    const aimOnly = calculateAttackPool(pool, 'none', undefined, 0, 1, 0, 0, 0);
    const aimPlusRam = calculateAttackPool(pool, 'none', undefined, 0, 1, 0, 0, 1);
    expect(aimPlusRam.expectedCrits).toBeGreaterThan(aimOnly.expectedCrits);
    expect(aimPlusRam.expectedTotal).toBeGreaterThan(aimOnly.expectedTotal);
  });

  it('Ram works with surge to hit', () => {
    const pool: AttackPool = { red: 0, black: 0, white: 2 };
    const hitNoRam = calculateAttackPool(pool, 'hit');
    const hitRam1 = calculateAttackPool(pool, 'hit', undefined, 0, 0, 0, 0, 1);
    expect(hitRam1.expectedCrits).toBeGreaterThan(hitNoRam.expectedCrits);
  });

  it('Ram works with surge to crit', () => {
    const pool: AttackPool = { red: 0, black: 0, white: 2 };
    const critNoRam = calculateAttackPool(pool, 'crit');
    const critRam1 = calculateAttackPool(pool, 'crit', undefined, 0, 0, 0, 0, 1);
    expect(critRam1.expectedCrits).toBeGreaterThan(critNoRam.expectedCrits);
  });
});
