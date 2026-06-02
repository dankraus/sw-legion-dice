import { describe, it, expect } from 'vitest';
import {
  formatAttackTallies,
  formatAttackPoolTotal,
  formatDefenseTallies,
  formatDefensePoolTotal,
} from './diceRollerTallies';
import type { DieOutcome, DefenseDieOutcome } from './engine/simulate';

describe('diceRollerTallies', () => {
  it('formatAttackTallies groups by color and face', () => {
    const outcomes: DieOutcome[] = [
      { color: 'red', face: 'hit' },
      { color: 'red', face: 'blank' },
      { color: 'white', face: 'crit' },
    ];
    expect(formatAttackTallies(outcomes)).toEqual([
      'Red: 1 hit, 1 blank',
      'White: 1 crit',
    ]);
  });

  it('formatAttackPoolTotal sums all faces including zeros', () => {
    const outcomes: DieOutcome[] = [
      { color: 'red', face: 'hit' },
      { color: 'red', face: 'blank' },
      { color: 'white', face: 'crit' },
    ];
    expect(formatAttackPoolTotal(outcomes)).toBe(
      'Total: 1 crit, 0 surge, 1 hit, 1 blank'
    );
  });

  it('formatDefensePoolTotal sums all faces including zeros', () => {
    const outcomes: DefenseDieOutcome[] = [
      { color: 'white', face: 'block' },
      { color: 'white', face: 'block' },
    ];
    expect(formatDefensePoolTotal(outcomes)).toBe(
      'Total: 2 block, 0 surge, 0 blank'
    );
  });

  it('formatDefenseTallies groups by color', () => {
    const outcomes: DefenseDieOutcome[] = [
      { color: 'white', face: 'block' },
      { color: 'white', face: 'block' },
    ];
    expect(formatDefenseTallies(outcomes)).toEqual(['White: 2 block']);
  });
});
