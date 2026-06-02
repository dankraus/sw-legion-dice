import { describe, it, expect } from 'vitest';
import { applyAssaultToPool } from '../assault';
import type { AttackPool } from '../../types';

describe('applyAssaultToPool', () => {
  it('returns same pool when assault is 0', () => {
    const base: AttackPool = { red: 1, black: 2, white: 1 };
    expect(applyAssaultToPool(base, 0)).toEqual(base);
  });

  it('upgrades one black die to red', () => {
    expect(applyAssaultToPool({ red: 0, black: 2, white: 0 }, 1)).toEqual({
      red: 1,
      black: 1,
      white: 0,
    });
  });

  it('upgrades white to black when no black remains in capacity', () => {
    expect(applyAssaultToPool({ red: 0, black: 0, white: 2 }, 1)).toEqual({
      red: 0,
      black: 1,
      white: 1,
    });
  });

  it('upgrades black to red before white to black', () => {
    expect(applyAssaultToPool({ red: 0, black: 1, white: 2 }, 2)).toEqual({
      red: 1,
      black: 1,
      white: 1,
    });
  });

  it('caps upgrades at black + white dice count', () => {
    expect(applyAssaultToPool({ red: 1, black: 2, white: 1 }, 10)).toEqual({
      red: 3,
      black: 1,
      white: 0,
    });
  });

  it('does not upgrade when pool has only red dice', () => {
    expect(applyAssaultToPool({ red: 2, black: 0, white: 0 }, 5)).toEqual({
      red: 2,
      black: 0,
      white: 0,
    });
  });

  it('treats negative or non-integer assault as 0', () => {
    const base: AttackPool = { red: 0, black: 1, white: 0 };
    expect(applyAssaultToPool(base, -1)).toEqual(base);
    expect(applyAssaultToPool(base, 1.9)).toEqual(base);
  });
});
