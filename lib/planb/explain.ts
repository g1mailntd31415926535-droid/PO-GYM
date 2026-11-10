// lib/planb/explain.ts — Câu giải thích hiện trên từng thẻ gợi ý. Chỉ dựng từ dữ liệu phân loại.

import type { ExerciseType, MuscleGroup, MovementFamily, PlanBExercise } from './types';

const GROUP_LABEL: Record<MuscleGroup, string> = {
  Chest: 'Ngực',
  Shoulders: 'Vai',
  Back: 'Lưng',
  Arms: 'Tay',
  Legs: 'Chân',
  Core: 'Bụng',
  Neck: 'Cổ',
};

const REGION_LABEL: Record<string, string> = {
  Upper: 'trên',
  Middle: 'giữa',
  Lower: 'dưới',
  Front: 'trước',
  Side: 'giữa',
  Rear: 'sau',
  'Rotator Cuff': 'chóp xoay',
  Lats: 'xô',
  Traps: 'cầu vai',
  'Lower Back': 'dưới',
  Biceps: 'trước',
  Triceps: 'sau',
  Forearms: 'cẳng tay',
  Quads: 'đùi trước',
  Hamstrings: 'đùi sau',
  Glutes: 'mông',
  Adductors: 'đùi trong',
  Calves: 'bắp chân',
  Tibialis: 'cẳng chân trước',
  Abs: 'bụng thẳng',
  Obliques: 'cơ liên sườn',
  Neck: 'cổ',
};

const FAMILY_LABEL: Record<MovementFamily, string> = {
  Press: 'Đẩy',
  Pull: 'Kéo',
  Squat: 'Squat',
  Hinge: 'Gập hông',
  Raise: 'Nâng / ép',
  Curl: 'Cuốn',
  Extension: 'Duỗi',
  Flexion: 'Gập',
  Rotation: 'Xoay',
  Stability: 'Giữ thăng bằng',
};

const TYPE_LABEL: Record<ExerciseType, string> = {
  compound: 'đa khớp',
  isolation: 'cô lập',
};

export function targetLabel(ex: PlanBExercise): string {
  return `${GROUP_LABEL[ex.muscleGroup]} ${REGION_LABEL[ex.targetRegion] ?? ex.targetRegion}`;
}

export function typeLabel(type: ExerciseType): string {
  return TYPE_LABEL[type];
}

/** Lý do ngắn gọn hiện trên thẻ gợi ý. */
export function reasonFor(base: PlanBExercise, candidate: PlanBExercise): string {
  const parts: string[] = [`Cùng vùng cơ: ${targetLabel(base)}`];

  if (candidate.movementFamily === base.movementFamily) {
    parts.push(
      candidate.movementPattern === base.movementPattern
        ? `Cùng kiểu động tác (${FAMILY_LABEL[base.movementFamily]} – ${base.movementPattern})`
        : `Cùng nhóm ${FAMILY_LABEL[base.movementFamily]}, khác kiểu (${candidate.movementPattern})`,
    );
  } else {
    parts.push(
      `Khác kiểu động tác (${FAMILY_LABEL[candidate.movementFamily]}) — không phải bài đổi tương đương`,
    );
  }

  if (candidate.exerciseType === base.exerciseType) {
    parts.push(`Cùng loại ${TYPE_LABEL[candidate.exerciseType]}`);
  }

  return parts.join(' · ');
}

/** Điểm khác cụ thể so với bài gốc — hiện thành danh sách ngắn trên thẻ. */
export function differencesFor(base: PlanBExercise, candidate: PlanBExercise): string[] {
  const out: string[] = [];

  if (candidate.equipment !== base.equipment) {
    out.push(`Dụng cụ: ${candidate.equipment || 'không rõ'} thay vì ${base.equipment || 'không rõ'}`);
  }
  if (candidate.movementPattern !== base.movementPattern) {
    out.push(`Kiểu động tác: ${candidate.movementPattern} thay vì ${base.movementPattern}`);
  }
  if (candidate.exerciseType !== base.exerciseType) {
    out.push(`Loại bài: ${TYPE_LABEL[candidate.exerciseType]} thay vì ${TYPE_LABEL[base.exerciseType]}`);
  }
  if (
    candidate.default_min_rep !== base.default_min_rep ||
    candidate.default_max_rep !== base.default_max_rep
  ) {
    out.push(
      `Khoảng rep: ${candidate.default_min_rep}–${candidate.default_max_rep} thay vì ${base.default_min_rep}–${base.default_max_rep}`,
    );
  }

  return out;
}
