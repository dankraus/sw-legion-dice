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

function countFaces<T extends string>(
  outcomes: { face: T }[],
  faceOrder: T[]
): Map<T, number> {
  const faceCounts = new Map<T, number>();
  for (const face of faceOrder) {
    faceCounts.set(face, 0);
  }
  for (const outcome of outcomes) {
    faceCounts.set(outcome.face, (faceCounts.get(outcome.face) ?? 0) + 1);
  }
  return faceCounts;
}

function formatFaceParts<T extends string>(
  faceCounts: Map<T, number>,
  faceOrder: T[],
  includeZeroCounts: boolean
): string[] {
  const parts: string[] = [];
  for (const face of faceOrder) {
    const count = faceCounts.get(face) ?? 0;
    if (includeZeroCounts || count > 0) {
      parts.push(`${count} ${face}`);
    }
  }
  return parts;
}

function formatColorTally<T extends string>(
  color: string,
  faceCounts: Map<T, number>,
  faceOrder: T[]
): string {
  const parts = formatFaceParts(faceCounts, faceOrder, false);
  return `${capitalizeColor(color)}: ${parts.join(', ')}`;
}

function formatPoolTotal<T extends string>(
  faceCounts: Map<T, number>,
  faceOrder: T[]
): string {
  const parts = formatFaceParts(faceCounts, faceOrder, true);
  return `Total: ${parts.join(', ')}`;
}

export function formatAttackPoolTotal(outcomes: DieOutcome[]): string {
  return formatPoolTotal(
    countFaces(outcomes, ATTACK_FACE_ORDER),
    ATTACK_FACE_ORDER
  );
}

export function formatDefensePoolTotal(outcomes: DefenseDieOutcome[]): string {
  return formatPoolTotal(
    countFaces(outcomes, DEFENSE_FACE_ORDER),
    DEFENSE_FACE_ORDER
  );
}

function groupOutcomesByColor<T extends string, Color extends string>(
  outcomes: { color: Color; face: T }[]
): Map<Color, Map<T, number>> {
  const byColor = new Map<Color, Map<T, number>>();

  for (const outcome of outcomes) {
    if (!byColor.has(outcome.color)) {
      byColor.set(outcome.color, new Map());
    }
    const faceCounts = byColor.get(outcome.color)!;
    faceCounts.set(outcome.face, (faceCounts.get(outcome.face) ?? 0) + 1);
  }

  return byColor;
}

export function formatAttackTallies(outcomes: DieOutcome[]): string[] {
  const byColor = groupOutcomesByColor(outcomes);

  const result: string[] = [];
  for (const color of ATTACK_COLOR_ORDER) {
    const faceCounts = byColor.get(color);
    if (!faceCounts) continue;
    result.push(formatColorTally(color, faceCounts, ATTACK_FACE_ORDER));
  }
  return result;
}

export function formatDefenseTallies(outcomes: DefenseDieOutcome[]): string[] {
  const byColor = groupOutcomesByColor(outcomes);

  const result: string[] = [];
  for (const color of DEFENSE_COLOR_ORDER) {
    const faceCounts = byColor.get(color);
    if (!faceCounts) continue;
    result.push(formatColorTally(color, faceCounts, DEFENSE_FACE_ORDER));
  }
  return result;
}
