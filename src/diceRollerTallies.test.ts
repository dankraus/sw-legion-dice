import { describe, it, expect } from 'vitest';
import {
  getAttackTallyGroups,
  getAttackPoolTotalParts,
  getDefenseTallyGroups,
  getDefensePoolTotalParts,
} from './diceRollerTallies';
import type { DieOutcome, DefenseDieOutcome } from './engine/simulate';

describe('diceRollerTallies', () => {
  it('getAttackTallyGroups groups by color and omits zero-count faces', () => {
    const outcomes: DieOutcome[] = [
      { color: 'red', face: 'hit' },
      { color: 'red', face: 'blank' },
      { color: 'white', face: 'crit' },
    ];
    expect(getAttackTallyGroups(outcomes)).toEqual([
      { color: 'red', parts: [{ face: 'hit', count: 1 }, { face: 'blank', count: 1 }] },
      { color: 'white', parts: [{ face: 'crit', count: 1 }] },
    ]);
  });

  it('getAttackPoolTotalParts includes all faces even with zero counts', () => {
    const outcomes: DieOutcome[] = [
      { color: 'red', face: 'hit' },
      { color: 'white', face: 'crit' },
    ];
    expect(getAttackPoolTotalParts(outcomes)).toEqual([
      { face: 'crit', count: 1 },
      { face: 'surge', count: 0 },
      { face: 'hit', count: 1 },
      { face: 'blank', count: 0 },
    ]);
  });

  it('getDefenseTallyGroups groups by color', () => {
    const outcomes: DefenseDieOutcome[] = [
      { color: 'white', face: 'block' },
      { color: 'white', face: 'block' },
    ];
    expect(getDefenseTallyGroups(outcomes)).toEqual([
      { color: 'white', parts: [{ face: 'block', count: 2 }] },
    ]);
  });

  it('getDefensePoolTotalParts includes all faces', () => {
    const outcomes: DefenseDieOutcome[] = [
      { color: 'white', face: 'block' },
      { color: 'white', face: 'block' },
    ];
    expect(getDefensePoolTotalParts(outcomes)).toEqual([
      { face: 'block', count: 2 },
      { face: 'surge', count: 0 },
      { face: 'blank', count: 0 },
    ]);
  });
});
