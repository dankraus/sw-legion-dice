import type {
  DieOutcome,
  DefenseDieOutcome,
  AttackFace,
  DefenseFace,
} from '../engine/simulate';
import {
  getAttackTallyGroups,
  getDefenseTallyGroups,
  getAttackPoolTotalParts,
  getDefensePoolTotalParts,
} from '../diceRollerTallies';
import { ATTACK_FACE_LABELS, DEFENSE_FACE_LABELS } from './legionFaceGlyphs';
import { FaceCountDisplay } from './FaceCountDisplay';
import './DiceRollerTallyLines.css';

type PoolKind = 'attack' | 'defense';

function faceAriaText(
  face: AttackFace | DefenseFace,
  count: number,
  poolKind: PoolKind
): string {
  const label =
    poolKind === 'attack'
      ? ATTACK_FACE_LABELS[face as AttackFace].toLowerCase()
      : DEFENSE_FACE_LABELS[face as DefenseFace].toLowerCase();
  return `${count} ${label}${count === 1 ? '' : 's'}`;
}

interface TallyLinesProps {
  outcomes: DieOutcome[] | DefenseDieOutcome[];
  poolKind: PoolKind;
}

export function TallyLines({ outcomes, poolKind }: TallyLinesProps) {
  const groups =
    poolKind === 'attack'
      ? getAttackTallyGroups(outcomes as DieOutcome[])
      : getDefenseTallyGroups(outcomes as DefenseDieOutcome[]);

  return (
    <ul className="dice-roller-tally-lines">
      {groups.map(({ color, parts }) => {
        const colorLabel = color[0].toUpperCase() + color.slice(1);
        const ariaLabel = `${colorLabel}: ${parts.map(({ face, count }) => faceAriaText(face, count, poolKind)).join(', ')}`;
        return (
          <li
            key={color}
            className="dice-roller-tally-lines__row"
            aria-label={ariaLabel}
          >
            <span aria-hidden="true">
              {colorLabel}:{' '}
              {parts.map((part) => (
                <FaceCountDisplay
                  key={part.face}
                  count={part.count}
                  face={part.face}
                  poolKind={poolKind}
                />
              ))}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

interface PoolTotalLineProps {
  outcomes: DieOutcome[] | DefenseDieOutcome[];
  poolKind: PoolKind;
}

export function PoolTotalLine({ outcomes, poolKind }: PoolTotalLineProps) {
  const parts =
    poolKind === 'attack'
      ? getAttackPoolTotalParts(outcomes as DieOutcome[])
      : getDefensePoolTotalParts(outcomes as DefenseDieOutcome[]);

  const ariaLabel = `Total: ${parts.map(({ face, count }) => faceAriaText(face, count, poolKind)).join(', ')}`;

  return (
    <p className="dice-roller-pool-total" aria-label={ariaLabel}>
      <span aria-hidden="true">
        Total:{' '}
        {parts.map((part) => (
          <FaceCountDisplay
            key={part.face}
            count={part.count}
            face={part.face}
            poolKind={poolKind}
          />
        ))}
      </span>
    </p>
  );
}
