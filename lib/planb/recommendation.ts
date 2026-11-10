// lib/planb/recommendation.ts — Xếp hạng bài thay thế khi máy đang bận.

import type { PlanBExercise, RankedExercise } from './types';

const SAME_FAMILY_SAME_PATTERN = 1.0;
const SAME_FAMILY_OTHER_PATTERN = 0.6;
const DIFFERENT_FAMILY = 0.3;

/**
 * Độ giống động tác là quy tắc kinh nghiệm nội bộ, KHÔNG phải khẳng định khoa học
 * rằng hai bài cho hiệu quả tập tương đương.
 */
export function movementScore(base: PlanBExercise, candidate: PlanBExercise): number {
  if (base.movementFamily !== candidate.movementFamily) return DIFFERENT_FAMILY;
  return base.movementPattern === candidate.movementPattern
    ? SAME_FAMILY_SAME_PATTERN
    : SAME_FAMILY_OTHER_PATTERN;
}

/**
 * Bước 1: lọc cứng theo nhóm cơ + vùng cơ mục tiêu.
 * Bước 2: 80% độ giống động tác + 20% cùng loại bài (đa khớp / cô lập).
 * Bài `needs-review` không bao giờ lọt vào danh sách.
 * `excludeIds`: bài đã có trong buổi tập hôm nay, tránh gợi ý trùng.
 */
export function rankAlternatives(
  base: PlanBExercise,
  all: PlanBExercise[],
  excludeIds: string[] = [],
): RankedExercise[] {
  const eligible = all.filter(
    (candidate) =>
      candidate.id !== base.id &&
      !excludeIds.includes(candidate.id) &&
      candidate.classifyStatus === 'classified' &&
      candidate.muscleGroup === base.muscleGroup &&
      candidate.targetRegion === base.targetRegion,
  );

  const ranked: RankedExercise[] = eligible.map((candidate) => {
    const movement = movementScore(base, candidate);
    const type = candidate.exerciseType === base.exerciseType ? 1 : 0;
    return {
      exercise: candidate,
      movementScore: movement,
      typeScore: type,
      score: 0.8 * movement + 0.2 * type,
      isDifferentStyle: candidate.movementFamily !== base.movementFamily,
      recommended: false,
    };
  });

  ranked.sort(
    (a, b) => b.score - a.score || a.exercise.name.localeCompare(b.exercise.name),
  );

  // Chỉ bài cùng nhóm + cùng kiểu động tác tốt nhất được gắn "Gợi ý";
  // bài khác kiểu động tác không bao giờ được trình bày như bài đổi tương đương.
  if (ranked.length > 0 && ranked[0].movementScore === SAME_FAMILY_SAME_PATTERN) {
    ranked[0].recommended = true;
  }

  return ranked;
}
