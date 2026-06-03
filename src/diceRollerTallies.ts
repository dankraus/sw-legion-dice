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

function faceCountsToParts<T extends string>(
  faceCounts: Map<T, number>,
  faceOrder: T[],
  includeZeroCounts: boolean
): FaceCountPart<T>[] {
  const parts: FaceCountPart<T>[] = [];
  for (const face of faceOrder) {
    const count = faceCounts.get(face) ?? 0;
    if (includeZeroCounts || count > 0) {
      parts.push({ face, count });
    }
  }
  return parts;
}

function buildColorTallyGroups<T extends string, Color extends string>(
  outcomes: { color: Color; face: T }[],
  colorOrder: Color[],
  faceOrder: T[]
): ColorTallyGroup<T, Color>[] {
  const byColor = groupOutcomesByColor(outcomes);
  const result: ColorTallyGroup<T, Color>[] = [];

  for (const color of colorOrder) {
    const faceCounts = byColor.get(color);
    if (!faceCounts) continue;
    const parts = faceCountsToParts(faceCounts, faceOrder, false);
    if (parts.length === 0) continue;
    result.push({ color, parts });
  }

  return result;
}

export function getAttackTallyGroups(
  outcomes: DieOutcome[]
): ColorTallyGroup<AttackFace, DieColor>[] {
  return buildColorTallyGroups(outcomes, ATTACK_COLOR_ORDER, ATTACK_FACE_ORDER);
}

export function getDefenseTallyGroups(
  outcomes: DefenseDieOutcome[]
): ColorTallyGroup<DefenseFace, DefenseDieColor>[] {
  return buildColorTallyGroups(
    outcomes,
    DEFENSE_COLOR_ORDER,
    DEFENSE_FACE_ORDER
  );
}

export function getAttackPoolTotalParts(
  outcomes: DieOutcome[]
): FaceCountPart<AttackFace>[] {
  const faceCounts = countFaces(outcomes, ATTACK_FACE_ORDER);
  return faceCountsToParts(faceCounts, ATTACK_FACE_ORDER, true);
}

export function getDefensePoolTotalParts(
  outcomes: DefenseDieOutcome[]
): FaceCountPart<DefenseFace>[] {
  const faceCounts = countFaces(outcomes, DEFENSE_FACE_ORDER);
  return faceCountsToParts(faceCounts, DEFENSE_FACE_ORDER, true);
}

export function formatAttackTallies(outcomes: DieOutcome[]): string[] {
  return getAttackTallyGroups(outcomes).map((group) =>
    formatColorTally(group.color, countPartsToMap(group.parts), ATTACK_FACE_ORDER)
  );
}

function countPartsToMap<T extends string>(
  parts: FaceCountPart<T>[]
): Map<T, number> {
  const faceCounts = new Map<T, number>();
  for (const part of parts) {
    faceCounts.set(part.face, part.count);
  }
  return faceCounts;
}

export function formatDefenseTallies(outcomes: DefenseDieOutcome[]): string[] {
  return getDefenseTallyGroups(outcomes).map((group) =>
    formatColorTally(
      group.color,
      countPartsToMap(group.parts),
      DEFENSE_FACE_ORDER
    )
  );
}
