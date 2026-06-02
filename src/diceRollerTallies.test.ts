import { describe, it, expect } from 'vitest';
import { formatAttackTallies, formatDefenseTallies } from './diceRollerTallies';
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

  it('formatDefenseTallies groups by color', () => {
    const outcomes: DefenseDieOutcome[] = [
      { color: 'white', face: 'block' },
      { color: 'white', face: 'block' },
    ];
    expect(formatDefenseTallies(outcomes)).toEqual(['White: 2 block']);
  });
});
