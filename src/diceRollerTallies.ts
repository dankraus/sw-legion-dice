import type {
  DieOutcome,
  DefenseDieOutcome,
  AttackFace,
  DefenseFace,
} from './engine/simulate';
import type { DieColor, DefenseDieColor } from './types';

const ATTACK_COLOR_ORDER: DieColor[] = ['red', 'black', 'white'];
const DEFENSE_COLOR_ORDER: DefenseDieColor[] = ['red', 'white'];

const ATTACK_FACE_ORDER: AttackFace[] = ['crit', 'surge', 'hit', 'blank'];
const DEFENSE_FACE_ORDER: DefenseFace[] = ['block', 'surge', 'blank'];

function capitalizeColor(color: string): string {
  return color.charAt(0).toUpperCase() + color.slice(1);
}

function formatColorTally<T extends string>(
  color: string,
  faceCounts: Map<T, number>,
  faceOrder: T[]
): string {
  const parts: string[] = [];
  for (const face of faceOrder) {
    const count = faceCounts.get(face) ?? 0;
    if (count > 0) {
      parts.push(`${count} ${face}`);
    }
  }
  return `${capitalizeColor(color)}: ${parts.join(', ')}`;
}

export function formatAttackTallies(outcomes: DieOutcome[]): string[] {
  const byColor = new Map<DieColor, Map<AttackFace, number>>();

  for (const outcome of outcomes) {
    if (!byColor.has(outcome.color)) {
      byColor.set(outcome.color, new Map());
    }
    const faceCounts = byColor.get(outcome.color)!;
    faceCounts.set(outcome.face, (faceCounts.get(outcome.face) ?? 0) + 1);
  }

  const result: string[] = [];
  for (const color of ATTACK_COLOR_ORDER) {
    const faceCounts = byColor.get(color);
    if (!faceCounts) continue;
    result.push(formatColorTally(color, faceCounts, ATTACK_FACE_ORDER));
  }
  return result;
}

export function formatDefenseTallies(outcomes: DefenseDieOutcome[]): string[] {
  const byColor = new Map<DefenseDieColor, Map<DefenseFace, number>>();

  for (const outcome of outcomes) {
    if (!byColor.has(outcome.color)) {
      byColor.set(outcome.color, new Map());
    }
    const faceCounts = byColor.get(outcome.color)!;
    faceCounts.set(outcome.face, (faceCounts.get(outcome.face) ?? 0) + 1);
  }

  const result: string[] = [];
  for (const color of DEFENSE_COLOR_ORDER) {
    const faceCounts = byColor.get(color);
    if (!faceCounts) continue;
    result.push(formatColorTally(color, faceCounts, DEFENSE_FACE_ORDER));
  }
  return result;
}
