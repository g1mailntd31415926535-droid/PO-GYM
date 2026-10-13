// types/progression.ts
/**
 * THUẬT TOÁN TĂNG TIẾN TẠ KHOA HỌC
 *
 * - Dò tạ (Calibration): tăng khi avg > max, giảm khi avg < min, chốt khi avg ∈ [min, max]
 * - Double Progression: tăng 1 rep mỗi buổi cho đến max, rồi tăng 2.5/5kg
 * - Gap <= 2: set trước không được hơn set sau quá 2 rep, set sau không vượt set trước
 * - Sessions at Current Weight: bắt buộc tăng mỗi buổi thành công
 * - Rollback: sessionsAtCW <= 2 thất bại → lùi 1 nấc tạ
 * - True Deload: 3 buổi kẹt liên tiếp → hạ 15% tạ, xoá credit
 */

export type ExerciseCategory = 'upper_compound' | 'lower_compound' | 'isolation';

export interface ProgressionState {
  currentWeight: number;
  targetReps: number[];
  plateauCount: number;
  sessionsAtCurrentWeight: number;
  deloadStep: number; // 0: Bình thường, 1: Đang Deload
  isCalibrating: boolean;
  lastReps?: number[];
}

export interface ProgressionResult {
  nextWeight: number;
  nextTargetReps: number[];
  nextPlateauCount: number;
  nextSessionsAtCurrentWeight: number;
  nextDeloadStep: number;
  isCalibrating: boolean;
  actionMessage: string;
}

/**
 * Hàm phân bổ +1 rep vào mảng reps, tuân theo quy tắc:
 * - Rep không được vượt maxRep
 * - Set sau không được lớn hơn set trước (non-increasing)
 * - Set sau không được cách set trước quá 2 rep (gap <= 2)
 */
export function distributePlusOneRep(
  currentReps: number[],
  maxRep: number
): number[] {
  const newReps = [...currentReps];
  const n = newReps.length;

  for (let i = 0; i < n; i++) {
    // 1. Kiểm tra trần maxRep
    if (newReps[i] >= maxRep) continue;

    // 2. Không được vượt set đứng trước nó
    if (i > 0 && newReps[i] + 1 > newReps[i - 1]) continue;

    // 3. Không được cách set đứng sau nó quá 2 rep
    if (i < n - 1 && (newReps[i] + 1) - newReps[i + 1] > 2) continue;

    // Đạt đủ điều kiện: Cộng +1 rep vào set này
    newReps[i] += 1;
    return newReps;
  }

  return newReps;
}

/**
 * Thuật toán tăng tiến tạ khoa học:
 * - Dò tạ chuẩn hóa theo trung bình rep
 * - Double progression: +1 rep hoặc +tạ
 * - Phân bố rep tuân Gap <= 2, non-increasing
 * - Sessions at Current Weight tăng mỗi buổi thành công
 * - Rollback khi thất bại sớm, Deload khi kẹt lâu
 */
export function calculateNextSession(
  state: ProgressionState,
  actualReps: number[],
  exerciseType: ExerciseCategory,
  hasMicroplates: boolean,
  minRep: number = 8,
  maxRep: number = 12
): ProgressionResult {
  const weightStep = hasMicroplates ? 1.0 : 2.5;
  const setsCount = state.targetReps.length || actualReps.length || 3;
  const currentWeight = state.currentWeight;

  // ===============================================================
  // GIAI ĐOẠN 1: DÒ TẠ (CALIBRATION)
  // ===============================================================
  if (state.isCalibrating) {
    const totalReps = actualReps.reduce((sum, r) => sum + r, 0);
    const avgReps = totalReps / actualReps.length;

    // Tăng tạ khi avg > maxRep
    if (avgReps > maxRep) {
      const jump = avgReps >= maxRep + 3 ? weightStep * 2 : weightStep;
      const nextWeight = currentWeight + jump;
      return {
        nextWeight,
        nextTargetReps: Array(setsCount).fill(minRep),
        nextPlateauCount: 0,
        nextSessionsAtCurrentWeight: 1,
        nextDeloadStep: 0,
        isCalibrating: true,
        actionMessage: `Tạ còn nhẹ (TB ${avgReps.toFixed(1)} reps). Tăng lên ${nextWeight}kg để tiếp tục dò mức tạ chuẩn!`,
      };
    }

    // Giảm tạ khi avg < minRep
    if (avgReps < minRep) {
      const nextWeight = Math.max(0, currentWeight - weightStep);
      return {
        nextWeight,
        nextTargetReps: Array(setsCount).fill(minRep),
        nextPlateauCount: 0,
        nextSessionsAtCurrentWeight: 1,
        nextDeloadStep: 0,
        isCalibrating: true,
        actionMessage: `Mức tạ hơi quá sức (TB ${avgReps.toFixed(1)} reps). Giảm xuống ${nextWeight}kg để tìm điểm kiểm soát!`,
      };
    }

    // Chốt chuẩn khi avg ∈ [minRep, maxRep]
    return {
      nextWeight: currentWeight,
      nextTargetReps: [...actualReps],
      nextPlateauCount: 0,
      nextSessionsAtCurrentWeight: 1,
      nextDeloadStep: 0,
      isCalibrating: false,
      actionMessage: `Đã chốt mức tạ chuẩn (${currentWeight}kg)! Bắt đầu lộ trình tăng tiến chính thức.`,
    };
  }

  // ===============================================================
  // GIAI ĐOẠN 2: THOÁT DELOAD
  // ===============================================================
  if (state.deloadStep === 1) {
    // Vừa xong buổi xả mỏi -> thoát Deload, quay lại mức tạ baseline
    return {
      nextWeight: currentWeight,
      nextTargetReps: Array(setsCount).fill(minRep),
      nextPlateauCount: 0,
      nextSessionsAtCurrentWeight: 1,
      nextDeloadStep: 0,
      isCalibrating: false,
      actionMessage: `Đã hoàn thành buổi xả mỏi (Deload). Thể lực hồi phục, quay lại chinh phục mức tạ chính thức!`,
    };
  }

  // ===============================================================
  // GIAI ĐOẠN 3: CHẠM TRẦN - TĂNG TẠ
  // ===============================================================
  const isAllMax = actualReps.every((r) => r >= maxRep);
  if (isAllMax) {
    const nextWeight = currentWeight + weightStep;
    return {
      nextWeight,
      nextTargetReps: Array(setsCount).fill(minRep),
      nextPlateauCount: 0,
      nextSessionsAtCurrentWeight: 1,
      nextDeloadStep: 0,
      isCalibrating: false,
      actionMessage: `Xuất sắc! Đã làm chủ ngưỡng trần (${maxRep} reps). Tăng lên ${nextWeight}kg!`,
    };
  }

  // ===============================================================
  // GIAI ĐOẠN 4: TĂNG REPS TRONG KHOẢNG
  // ===============================================================
  // Đạt mục tiêu hiện tại (actual >= target cho mỗi set)
  const isTargetAchieved = actualReps.every((r, idx) => r >= (state.targetReps[idx] || minRep));
  if (isTargetAchieved) {
    const nextTargetReps = distributePlusOneRep(state.targetReps, maxRep);
    return {
      nextWeight: currentWeight,
      nextTargetReps,
      nextPlateauCount: 0,
      nextSessionsAtCurrentWeight: state.sessionsAtCurrentWeight + 1,
      nextDeloadStep: 0,
      isCalibrating: false,
      actionMessage: `Tập tốt! Giữ tạ ${currentWeight}kg và nâng mục tiêu reps cho buổi tiếp theo.`,
    };
  }

  // ===============================================================
  // GIAI ĐOẠN 5: THẤT BẠI - CHECK PLATEAU & DELOAD
  // ===============================================================
  const newPlateau = state.plateauCount + 1;

  // Thất bại sớm (sessionsAtCurrentWeight <= 2) -> Rollback
  if (state.sessionsAtCurrentWeight <= 2) {
    const nextWeight = Math.max(0, currentWeight - weightStep);
    return {
      nextWeight,
      nextTargetReps: Array(setsCount).fill(maxRep - 1),
      nextPlateauCount: 0,
      nextSessionsAtCurrentWeight: 1,
      nextDeloadStep: 0,
      isCalibrating: false,
      actionMessage: `Mức tạ mới còn hơi nặng. Lùi về ${nextWeight}kg để tích lũy thêm thể lực!`,
    };
  }

  // Kẹt buổi 1 hoặc 2 -> Giữ nguyên để thử lại
  if (newPlateau < 3) {
    return {
      nextWeight: currentWeight,
      nextTargetReps: [...state.targetReps],
      nextPlateauCount: newPlateau,
      nextSessionsAtCurrentWeight: state.sessionsAtCurrentWeight + 1,
      nextDeloadStep: 0,
      isCalibrating: false,
      actionMessage: `Chưa đạt mục tiêu (Kẹt lần ${newPlateau}/3). Giữ nguyên mức tạ để chinh phục lại buổi sau!`,
    };
  }

  // Kẹt 3 buổi liên tiếp -> TRUE DELOAD (hạ 15%)
  const deloadWeight = Math.round((currentWeight * 0.85) / 2.5) * 2.5;
  return {
    nextWeight: Math.max(0, deloadWeight),
    nextTargetReps: Array(setsCount).fill(minRep),
    nextPlateauCount: 0,
    nextSessionsAtCurrentWeight: 1,
    nextDeloadStep: 1,
    isCalibrating: false,
    actionMessage: `Chững tạ 3 buổi liên tiếp! Kích hoạt tuần xả mỏi (Deload) tại ${deloadWeight}kg để phục hồi thần kinh.`,
  };
}