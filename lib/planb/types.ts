// lib/planb/types.ts — Kiểu dữ liệu cho tính năng Plan B (gợi ý bài thay thế khi máy bận).
// Port từ dự án hackathon "Gym Plan B", mở rộng thêm nhóm động tác cho đủ 109 bài Lyfta.

import type { FullExercise } from '@/lib/exercises-full';

export type MuscleGroup = 'Chest' | 'Shoulders' | 'Back' | 'Arms' | 'Legs' | 'Core' | 'Neck';

export type MovementFamily =
  | 'Press'
  | 'Pull'
  | 'Squat'
  | 'Hinge'
  | 'Raise'
  | 'Curl'
  | 'Extension'
  | 'Flexion'
  | 'Rotation'
  | 'Stability';

export type ExerciseType = 'compound' | 'isolation';

export type ClassifyStatus = 'classified' | 'needs-review';

/** Phân loại dùng cho thuật toán gợi ý. Không lưu DB, khai báo cứng theo id bài. */
export interface PlanBProfile {
  muscleGroup: MuscleGroup;
  targetRegion: string;
  movementFamily: MovementFamily;
  movementPattern: string;
  exerciseType: ExerciseType;
  classifyStatus: ClassifyStatus;
}

export type PlanBExercise = FullExercise & PlanBProfile;

export interface RankedExercise {
  exercise: PlanBExercise;
  score: number;
  movementScore: number;
  typeScore: number;
  /** Khác nhóm động tác: luôn gắn nhãn riêng, không bao giờ là "Gợi ý". */
  isDifferentStyle: boolean;
  /** Chỉ bài cùng động tác tốt nhất mới được gắn nhãn này. */
  recommended: boolean;
}
