import { useState, useEffect } from 'react';
import type { AttackPool, DefensePool } from '../types';
import {
  rollAttackPoolDetailed,
  rollDefensePoolDetailed,
  type DieOutcome,
  type DefenseDieOutcome,
  type AttackFace,
  type DefenseFace,
} from '../engine/simulate';
import { formatAttackTallies, formatDefenseTallies } from '../diceRollerTallies';
import { DiceSelector } from './DiceSelector';
import { DieFaceChip } from './DieFaceChip';
import './DiceRollerModal.css';

const ATTACK_FACE_LABELS: Record<AttackFace, string> = {
  crit: 'Crit',
  surge: 'Surge',
  hit: 'Hit',
  blank: 'Blank',
};

const DEFENSE_FACE_LABELS: Record<DefenseFace, string> = {
  block: 'Block',
  surge: 'Surge',
  blank: 'Blank',
};

interface DiceRollerModalProps {
  onClose: () => void;
}

export function DiceRollerModal({ onClose }: DiceRollerModalProps) {
  const [attackPool, setAttackPool] = useState<AttackPool>({
    red: 0,
    black: 0,
    white: 0,
  });
  const [defensePool, setDefensePool] = useState<DefensePool>({
    red: 0,
    white: 0,
  });
  const [lastAttackOutcomes, setLastAttackOutcomes] = useState<
    DieOutcome[] | null
  >(null);
  const [lastDefenseOutcomes, setLastDefenseOutcomes] = useState<
    DefenseDieOutcome[] | null
  >(null);

  const attackTotal = attackPool.red + attackPool.black + attackPool.white;
  const defenseTotal = defensePool.red + defensePool.white;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleBackdropClick = () => {
    onClose();
  };

  const handlePanelClick = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  const handleRollAttack = () => {
    setLastAttackOutcomes(rollAttackPoolDetailed(attackPool, Math.random));
  };

  const handleRollDefense = () => {
    setLastDefenseOutcomes(rollDefensePoolDetailed(defensePool, Math.random));
  };

  return (
    <div
      className="dice-roller-modal__backdrop"
      onClick={handleBackdropClick}
    >
      <div
        className="dice-roller-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dice-roller-modal-title"
        onClick={handlePanelClick}
      >
        <header className="dice-roller-modal__header">
          <h2 id="dice-roller-modal-title" className="dice-roller-modal__title">
            Quick roll
          </h2>
          <button
            type="button"
            className="dice-roller-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <section className="dice-roller-modal__section">
          <h3 className="dice-roller-modal__section-heading">Attack</h3>
          <div className="dice-roller-modal__selectors">
            <DiceSelector
              color="red"
              count={attackPool.red}
              onChange={(count) =>
                setAttackPool((pool) => ({ ...pool, red: count }))
              }
            />
            <DiceSelector
              color="black"
              count={attackPool.black}
              onChange={(count) =>
                setAttackPool((pool) => ({ ...pool, black: count }))
              }
            />
            <DiceSelector
              color="white"
              count={attackPool.white}
              onChange={(count) =>
                setAttackPool((pool) => ({ ...pool, white: count }))
              }
            />
          </div>
          <button
            type="button"
            className="dice-roller-modal__roll-button"
            onClick={handleRollAttack}
            disabled={attackTotal === 0}
          >
            Roll attack
          </button>
          <div className="dice-roller-modal__results">
            {lastAttackOutcomes === null ? (
              <p className="dice-roller-modal__placeholder">
                Set dice and roll.
              </p>
            ) : (
              <>
                <div className="dice-roller-modal__chips">
                  {lastAttackOutcomes.map((outcome, index) => (
                    <DieFaceChip
                      key={`attack-${index}`}
                      color={outcome.color}
                      faceLabel={ATTACK_FACE_LABELS[outcome.face]}
                    />
                  ))}
                </div>
                <ul className="dice-roller-modal__tallies">
                  {formatAttackTallies(lastAttackOutcomes).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </section>

        <section className="dice-roller-modal__section">
          <h3 className="dice-roller-modal__section-heading">Defense</h3>
          <div className="dice-roller-modal__selectors">
            <DiceSelector
              color="red"
              count={defensePool.red}
              onChange={(count) =>
                setDefensePool((pool) => ({ ...pool, red: count }))
              }
            />
            <DiceSelector
              color="white"
              count={defensePool.white}
              onChange={(count) =>
                setDefensePool((pool) => ({ ...pool, white: count }))
              }
            />
          </div>
          <button
            type="button"
            className="dice-roller-modal__roll-button"
            onClick={handleRollDefense}
            disabled={defenseTotal === 0}
          >
            Roll defense
          </button>
          <div className="dice-roller-modal__results">
            {lastDefenseOutcomes === null ? (
              <p className="dice-roller-modal__placeholder">
                Set dice and roll.
              </p>
            ) : (
              <>
                <div className="dice-roller-modal__chips">
                  {lastDefenseOutcomes.map((outcome, index) => (
                    <DieFaceChip
                      key={`defense-${index}`}
                      color={outcome.color}
                      faceLabel={DEFENSE_FACE_LABELS[outcome.face]}
                    />
                  ))}
                </div>
                <ul className="dice-roller-modal__tallies">
                  {formatDefenseTallies(lastDefenseOutcomes).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
