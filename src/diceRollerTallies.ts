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

export interface FaceCountPart<T extends string> {
  face: T;
  count: number;
}

export interface ColorTallyGroup<T extends string, Color extends string> {
  color: Color;
  parts: FaceCountPart<T>[];
}

function countByFace<T extends string>(
  outcomes: { face: T }[],
  faceOrder: T[]
): Map<T, number> {
  const counts = new Map<T, number>(faceOrder.map((face) => [face, 0]));
  for (const { face } of outcomes) {
    counts.set(face, (counts.get(face) ?? 0) + 1);
  }
  return counts;
}

function groupByColor<T extends string, Color extends string>(
  outcomes: { color: Color; face: T }[],
  colorOrder: Color[],
  faceOrder: T[]
): ColorTallyGroup<T, Color>[] {
  const byColor = new Map<Color, Map<T, number>>();
  for (const { color, face } of outcomes) {
    if (!byColor.has(color)) byColor.set(color, new Map());
    const counts = byColor.get(color)!;
    counts.set(face, (counts.get(face) ?? 0) + 1);
  }
  return colorOrder.flatMap((color) => {
    const counts = byColor.get(color);
    if (!counts) return [];
    const parts = faceOrder
      .map((face) => ({ face, count: counts.get(face) ?? 0 }))
      .filter(({ count }) => count > 0);
    return parts.length ? [{ color, parts }] : [];
  });
}

export function getAttackTallyGroups(
  outcomes: DieOutcome[]
): ColorTallyGroup<AttackFace, DieColor>[] {
  return groupByColor(outcomes, ATTACK_COLOR_ORDER, ATTACK_FACE_ORDER);
}

export function getDefenseTallyGroups(
  outcomes: DefenseDieOutcome[]
): ColorTallyGroup<DefenseFace, DefenseDieColor>[] {
  return groupByColor(outcomes, DEFENSE_COLOR_ORDER, DEFENSE_FACE_ORDER);
}

export function getAttackPoolTotalParts(
  outcomes: DieOutcome[]
): FaceCountPart<AttackFace>[] {
  const counts = countByFace(outcomes, ATTACK_FACE_ORDER);
  return ATTACK_FACE_ORDER.map((face) => ({
    face,
    count: counts.get(face) ?? 0,
  }));
}

export function getDefensePoolTotalParts(
  outcomes: DefenseDieOutcome[]
): FaceCountPart<DefenseFace>[] {
  const counts = countByFace(outcomes, DEFENSE_FACE_ORDER);
  return DEFENSE_FACE_ORDER.map((face) => ({
    face,
    count: counts.get(face) ?? 0,
  }));
}
