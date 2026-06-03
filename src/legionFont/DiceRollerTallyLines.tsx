import type {
  DieOutcome,
  DefenseDieOutcome,
  AttackFace,
  DefenseFace,
} from '../engine/simulate';
import type { DieColor, DefenseDieColor } from '../types';
import {
  getAttackTallyGroups,
  getDefenseTallyGroups,
  getAttackPoolTotalParts,
  getDefensePoolTotalParts,
} from '../diceRollerTallies';
import { FaceCountDisplay } from './FaceCountDisplay';
import { faceCountAriaLabel } from './faceCountAriaLabel';
import './DiceRollerTallyLines.css';

function capitalizeColor(color: string): string {
  return color.charAt(0).toUpperCase() + color.slice(1);
}

interface AttackTallyLinesProps {
  outcomes: DieOutcome[];
}

export function AttackTallyLines({ outcomes }: AttackTallyLinesProps) {
  const groups = getAttackTallyGroups(outcomes);

  return (
    <ul className="dice-roller-tally-lines">
      {groups.map((group) => (
        <li
          key={group.color}
          className="dice-roller-tally-lines__row"
          aria-label={buildTallyAriaLabel(group.color, group.parts, 'attack')}
        >
          <span className="dice-roller-tally-lines__color" aria-hidden="true">
            {capitalizeColor(group.color)}:
          </span>{' '}
          <span className="dice-roller-tally-lines__faces" aria-hidden="true">
            {group.parts.map((part) => (
              <FaceCountDisplay
                key={part.face}
                count={part.count}
                face={part.face}
                poolKind="attack"
                size="tally"
              />
            ))}
          </span>
        </li>
      ))}
    </ul>
  );
}

interface DefenseTallyLinesProps {
  outcomes: DefenseDieOutcome[];
}

export function DefenseTallyLines({ outcomes }: DefenseTallyLinesProps) {
  const groups = getDefenseTallyGroups(outcomes);

  return (
    <ul className="dice-roller-tally-lines">
      {groups.map((group) => (
        <li
          key={group.color}
          className="dice-roller-tally-lines__row"
          aria-label={buildTallyAriaLabel(group.color, group.parts, 'defense')}
        >
          <span className="dice-roller-tally-lines__color" aria-hidden="true">
            {capitalizeColor(group.color)}:
          </span>{' '}
          <span className="dice-roller-tally-lines__faces" aria-hidden="true">
            {group.parts.map((part) => (
              <FaceCountDisplay
                key={part.face}
                count={part.count}
                face={part.face}
                poolKind="defense"
                size="tally"
              />
            ))}
          </span>
        </li>
      ))}
    </ul>
  );
}

interface PoolTotalLineProps {
  outcomes: DieOutcome[] | DefenseDieOutcome[];
  poolKind: 'attack' | 'defense';
}

export function PoolTotalLine({ outcomes, poolKind }: PoolTotalLineProps) {
  const parts =
    poolKind === 'attack'
      ? getAttackPoolTotalParts(outcomes as DieOutcome[])
      : getDefensePoolTotalParts(outcomes as DefenseDieOutcome[]);

  const ariaParts = parts.map((part) =>
    faceCountAriaLabel(part.count, part.face, poolKind)
  );

  return (
    <p
      className="dice-roller-pool-total"
      aria-label={`Total: ${ariaParts.join(', ')}`}
    >
      <span className="dice-roller-pool-total__label" aria-hidden="true">
        Total:{' '}
      </span>
      <span className="dice-roller-pool-total__faces" aria-hidden="true">
        {parts.map((part) => (
          <FaceCountDisplay
            key={part.face}
            count={part.count}
            face={part.face}
            poolKind={poolKind}
            size="tally"
          />
        ))}
      </span>
    </p>
  );
}

function buildTallyAriaLabel(
  color: DieColor | DefenseDieColor,
  parts: { face: AttackFace | DefenseFace; count: number }[],
  poolKind: 'attack' | 'defense'
): string {
  const faceSummary = parts
    .map((part) => faceCountAriaLabel(part.count, part.face, poolKind))
    .join(', ');
  return `${capitalizeColor(color)}: ${faceSummary}`;
}
