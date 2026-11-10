// lib/planb/classification.ts — Phân loại 109 bài trong EXERCISES_FULL cho thuật toán Plan B.
// Vùng cơ dựa theo giải phẫu, không theo cột muscle_group cũ. Ví dụ: ép cáp từ dưới lên
// (Low-to-High) nhắm ngực TRÊN, ép cáp từ trên xuống (High-to-Low) nhắm ngực DƯỚI.
// `needs-review`: bài còn mơ hồ về vùng cơ. Vẫn được gợi ý bài khác khi máy bận,
// nhưng không bao giờ được đề xuất làm bài thay thế.

import { EXERCISES_FULL, type FullExercise } from '@/lib/exercises-full';
import type {
  ClassifyStatus,
  ExerciseType,
  MovementFamily,
  MuscleGroup,
  PlanBExercise,
  PlanBProfile,
} from './types';

const c = (
  muscleGroup: MuscleGroup,
  targetRegion: string,
  movementFamily: MovementFamily,
  movementPattern: string,
  exerciseType: ExerciseType,
  classifyStatus: ClassifyStatus = 'classified',
): PlanBProfile => ({
  muscleGroup,
  targetRegion,
  movementFamily,
  movementPattern,
  exerciseType,
  classifyStatus,
});

const REVIEW = 'needs-review' as const;

export const PLANB_PROFILES: Record<string, PlanBProfile> = {
  // ───── Ngực ─────
  ex_1: c('Chest', 'Middle', 'Press', 'Horizontal Press', 'compound'),
  ex_15: c('Chest', 'Middle', 'Press', 'Horizontal Press', 'compound'),
  ex_95: c('Chest', 'Middle', 'Press', 'Horizontal Press', 'compound'),
  ex_21: c('Chest', 'Middle', 'Press', 'Horizontal Press', 'compound'),
  ex_17: c('Chest', 'Middle', 'Press', 'Horizontal Press', 'compound'),
  ex_94: c('Chest', 'Upper', 'Press', 'Incline Press', 'compound'),
  ex_2: c('Chest', 'Upper', 'Press', 'Incline Press', 'compound'),
  ex_22: c('Chest', 'Upper', 'Press', 'Incline Press', 'compound'),
  ex_14: c('Chest', 'Lower', 'Press', 'Decline Press', 'compound'),
  ex_16: c('Chest', 'Lower', 'Press', 'Dip', 'compound'),
  ex_20: c('Chest', 'Middle', 'Raise', 'Chest Fly', 'isolation'),
  ex_19: c('Chest', 'Middle', 'Raise', 'Chest Fly', 'isolation'),
  ex_99: c('Chest', 'Middle', 'Raise', 'Chest Fly', 'isolation'),
  // Không rõ độ cao cáp -> chưa chắc vùng ngực.
  ex_18: c('Chest', 'Middle', 'Raise', 'Chest Fly', 'isolation', REVIEW),
  ex_96: c('Chest', 'Upper', 'Raise', 'Chest Fly', 'isolation'),
  ex_98: c('Chest', 'Upper', 'Raise', 'Chest Fly', 'isolation'),
  ex_97: c('Chest', 'Lower', 'Raise', 'Chest Fly', 'isolation'),
  // Pullover ăn cả ngực lẫn xô.
  ex_100: c('Chest', 'Middle', 'Pull', 'Pullover', 'isolation', REVIEW),

  // ───── Vai ─────
  ex_3: c('Shoulders', 'Front', 'Press', 'Overhead Press', 'compound'),
  ex_65: c('Shoulders', 'Front', 'Press', 'Overhead Press', 'compound'),
  ex_23: c('Shoulders', 'Front', 'Press', 'Overhead Press', 'compound'),
  ex_66: c('Shoulders', 'Front', 'Press', 'Overhead Press', 'compound'),
  ex_101: c('Shoulders', 'Front', 'Press', 'Overhead Press', 'compound'),
  ex_45: c('Shoulders', 'Front', 'Press', 'Overhead Press', 'compound', REVIEW),
  ex_24: c('Shoulders', 'Front', 'Raise', 'Front Raise', 'isolation'),
  ex_8: c('Shoulders', 'Side', 'Raise', 'Lateral Raise', 'isolation'),
  ex_102: c('Shoulders', 'Side', 'Raise', 'Lateral Raise', 'isolation'),
  ex_103: c('Shoulders', 'Side', 'Raise', 'Lateral Raise', 'isolation'),
  ex_26: c('Shoulders', 'Side', 'Pull', 'Upright Row', 'compound'),
  ex_104: c('Shoulders', 'Rear', 'Raise', 'Rear Delt Fly', 'isolation'),
  ex_106: c('Shoulders', 'Rear', 'Raise', 'Rear Delt Fly', 'isolation'),
  ex_107: c('Shoulders', 'Rear', 'Raise', 'Rear Delt Fly', 'isolation'),
  ex_105: c('Shoulders', 'Rear', 'Pull', 'Face Pull', 'compound'),
  ex_25: c('Shoulders', 'Rear', 'Pull', 'Rear Delt Row', 'compound'),
  ex_133: c('Shoulders', 'Rear', 'Pull', 'Scapular', 'isolation', REVIEW),
  ex_130: c('Shoulders', 'Rotator Cuff', 'Rotation', 'External Rotation', 'isolation'),

  // ───── Lưng ─────
  ex_6: c('Back', 'Lats', 'Pull', 'Vertical Pull', 'compound'),
  ex_29: c('Back', 'Lats', 'Pull', 'Vertical Pull', 'compound'),
  ex_30: c('Back', 'Lats', 'Pull', 'Vertical Pull', 'compound'),
  ex_115: c('Back', 'Lats', 'Pull', 'Vertical Pull', 'compound'),
  ex_7: c('Back', 'Lats', 'Pull', 'Horizontal Pull', 'compound'),
  ex_67: c('Back', 'Lats', 'Pull', 'Horizontal Pull', 'compound'),
  ex_28: c('Back', 'Lats', 'Pull', 'Horizontal Pull', 'compound'),
  ex_31: c('Back', 'Lats', 'Pull', 'Horizontal Pull', 'compound'),
  ex_116: c('Back', 'Lats', 'Pull', 'Horizontal Pull', 'compound'),
  ex_35: c('Back', 'Lats', 'Pull', 'Horizontal Pull', 'compound'),
  ex_34: c('Back', 'Lats', 'Pull', 'Straight-Arm Pull', 'isolation', REVIEW),
  ex_117: c('Back', 'Lats', 'Pull', 'Straight-Arm Pull', 'isolation', REVIEW),
  ex_27: c('Back', 'Traps', 'Raise', 'Shrug', 'isolation'),
  ex_33: c('Back', 'Lower Back', 'Hinge', 'Back Extension', 'compound'),

  // ───── Tay sau ─────
  ex_57: c('Arms', 'Triceps', 'Press', 'Close-Grip Press', 'compound'),
  ex_55: c('Arms', 'Triceps', 'Press', 'Dip', 'compound'),
  ex_56: c('Arms', 'Triceps', 'Press', 'Dip', 'compound'),
  ex_54: c('Arms', 'Triceps', 'Extension', 'Lying Extension', 'isolation'),
  ex_53: c('Arms', 'Triceps', 'Extension', 'Overhead Extension', 'isolation'),
  ex_108: c('Arms', 'Triceps', 'Extension', 'Overhead Extension', 'isolation'),
  ex_9: c('Arms', 'Triceps', 'Extension', 'Pushdown', 'isolation'),
  ex_109: c('Arms', 'Triceps', 'Extension', 'Pushdown', 'isolation'),
  ex_110: c('Arms', 'Triceps', 'Extension', 'Kickback', 'isolation'),

  // ───── Tay trước ─────
  ex_111: c('Arms', 'Biceps', 'Curl', 'Standard Curl', 'isolation'),
  ex_112: c('Arms', 'Biceps', 'Curl', 'Standard Curl', 'isolation'),
  ex_10: c('Arms', 'Biceps', 'Curl', 'Standard Curl', 'isolation'),
  ex_51: c('Arms', 'Biceps', 'Curl', 'Standard Curl', 'isolation'),
  ex_129: c('Arms', 'Biceps', 'Curl', 'Standard Curl', 'isolation'),
  ex_114: c('Arms', 'Biceps', 'Curl', 'Incline Curl', 'isolation'),
  ex_49: c('Arms', 'Biceps', 'Curl', 'Preacher Curl', 'isolation'),
  ex_50: c('Arms', 'Biceps', 'Curl', 'Preacher Curl', 'isolation'),
  ex_46: c('Arms', 'Biceps', 'Curl', 'Hammer Curl', 'isolation'),
  ex_113: c('Arms', 'Biceps', 'Curl', 'Hammer Curl', 'isolation'),

  // ───── Cẳng tay ─────
  ex_52: c('Arms', 'Forearms', 'Curl', 'Reverse Curl', 'isolation'),
  ex_122: c('Arms', 'Forearms', 'Curl', 'Wrist Curl', 'isolation'),
  ex_123: c('Arms', 'Forearms', 'Extension', 'Wrist Extension', 'isolation'),

  // ───── Đùi trước ─────
  ex_4: c('Legs', 'Quads', 'Squat', 'Squat Pattern', 'compound'),
  ex_36: c('Legs', 'Quads', 'Squat', 'Squat Pattern', 'compound'),
  ex_11: c('Legs', 'Quads', 'Squat', 'Squat Pattern', 'compound'),
  ex_68: c('Legs', 'Quads', 'Squat', 'Squat Pattern', 'compound'),
  ex_44: c('Legs', 'Quads', 'Squat', 'Squat Pattern', 'compound'),
  // Bài một chân: đùi trước hay mông tuỳ cách tập.
  ex_38: c('Legs', 'Quads', 'Squat', 'Split Squat', 'compound', REVIEW),
  ex_37: c('Legs', 'Quads', 'Squat', 'Split Squat', 'compound', REVIEW),
  ex_135: c('Legs', 'Quads', 'Squat', 'Sissy Squat', 'isolation'),
  ex_39: c('Legs', 'Quads', 'Extension', 'Knee Extension', 'isolation'),

  // ───── Đùi sau ─────
  ex_5: c('Legs', 'Hamstrings', 'Hinge', 'Hip Hinge', 'compound'),
  ex_127: c('Legs', 'Hamstrings', 'Hinge', 'Hip Hinge', 'compound'),
  ex_40: c('Legs', 'Hamstrings', 'Curl', 'Leg Curl', 'isolation'),
  ex_69: c('Legs', 'Hamstrings', 'Curl', 'Leg Curl', 'isolation'),

  // ───── Mông ─────
  ex_32: c('Legs', 'Glutes', 'Hinge', 'Deadlift', 'compound'),
  ex_126: c('Legs', 'Glutes', 'Hinge', 'Deadlift', 'compound'),
  ex_41: c('Legs', 'Glutes', 'Hinge', 'Hip Thrust', 'compound'),
  ex_42: c('Legs', 'Glutes', 'Hinge', 'Hip Thrust', 'compound'),
  ex_124: c('Legs', 'Glutes', 'Extension', 'Hip Extension', 'isolation'),
  ex_125: c('Legs', 'Glutes', 'Raise', 'Hip Abduction', 'isolation'),

  // ───── Đùi trong / bắp chân ─────
  ex_128: c('Legs', 'Adductors', 'Raise', 'Hip Adduction', 'isolation'),
  ex_12: c('Legs', 'Calves', 'Raise', 'Calf Raise', 'isolation'),
  ex_43: c('Legs', 'Calves', 'Raise', 'Calf Raise', 'isolation'),
  ex_131: c('Legs', 'Tibialis', 'Raise', 'Tibialis Raise', 'isolation'),

  // ───── Bụng ─────
  ex_70: c('Core', 'Abs', 'Flexion', 'Crunch', 'isolation'),
  ex_118: c('Core', 'Abs', 'Flexion', 'Crunch', 'isolation'),
  ex_119: c('Core', 'Abs', 'Flexion', 'Crunch', 'isolation'),
  ex_58: c('Core', 'Abs', 'Flexion', 'Crunch', 'isolation'),
  ex_64: c('Core', 'Abs', 'Flexion', 'Crunch', 'isolation'),
  ex_59: c('Core', 'Abs', 'Flexion', 'Leg Raise', 'isolation'),
  ex_120: c('Core', 'Abs', 'Flexion', 'Leg Raise', 'isolation'),
  ex_63: c('Core', 'Abs', 'Flexion', 'Leg Raise', 'isolation'),
  ex_62: c('Core', 'Abs', 'Stability', 'Anti-Extension', 'isolation'),
  ex_60: c('Core', 'Abs', 'Stability', 'Anti-Extension', 'isolation'),
  ex_121: c('Core', 'Obliques', 'Rotation', 'Trunk Rotation', 'isolation'),
  ex_61: c('Core', 'Obliques', 'Rotation', 'Trunk Rotation', 'isolation'),
  ex_132: c('Core', 'Obliques', 'Flexion', 'Lateral Flexion', 'isolation'),

  // ───── Cổ ─────
  ex_134: c('Neck', 'Neck', 'Flexion', 'Neck Flexion', 'isolation'),
};

// Supabase thật dùng id UUID, khác id ex_N trong code, nhưng tên bài giống hệt
// -> tra thêm theo tên để bài trên cloud vẫn nhận đúng phân loại.
const PROFILE_BY_NAME = new Map(
  EXERCISES_FULL.flatMap((ex) => (PLANB_PROFILES[ex.id] ? [[ex.name, PLANB_PROFILES[ex.id]] as const] : [])),
);

/** Giữ nguyên id của dòng truyền vào (ex_N hoặc UUID) để lưu trạng thái tạ đúng bài. */
export function toPlanBExercise(ex: FullExercise): PlanBExercise | null {
  const profile = PLANB_PROFILES[ex.id] ?? PROFILE_BY_NAME.get(ex.name);
  return profile ? { ...ex, ...profile } : null;
}

/** Thư viện trong code đã phân loại. Bài tự thêm (không có phân loại) bị bỏ qua. */
export const PLANB_LIBRARY: PlanBExercise[] = classifyLibrary(EXERCISES_FULL);

export function classifyLibrary(rows: FullExercise[]): PlanBExercise[] {
  return rows.flatMap((ex) => {
    const planB = toPlanBExercise(ex);
    return planB ? [planB] : [];
  });
}

export function findPlanBExercise(
  id: string,
  library: PlanBExercise[] = PLANB_LIBRARY,
): PlanBExercise | undefined {
  return library.find((ex) => ex.id === id);
}
