// components/ExerciseDetailModal.tsx
'use client';

import React from 'react';
import { X, Dumbbell, Plus, Check, Zap, Target } from 'lucide-react';
import ExerciseAnatomyView, { getMuscleLabel } from '@/components/ExerciseAnatomyView';

interface ExerciseDetailModalProps {
  exercise: any;
  isAdded: boolean;
  onClose: () => void;
  onAdd: (exercise: any) => void;
}

export default function ExerciseDetailModal({
  exercise,
  isAdded,
  onClose,
  onAdd,
}: ExerciseDetailModalProps) {
  if (!exercise) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md bg-white border border-zinc-200 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Thanh kéo trên điện thoại */}
        <div className="w-10 h-1 rounded-full bg-zinc-200 mx-auto mb-4 sm:hidden" />

        {/* Header Modal */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold uppercase tracking-wider mb-1.5">
              <Zap className="w-3 h-3" /> {exercise.equipment || 'Gym Standard'}
            </div>
            <h3 className="text-xl font-black text-zinc-950 tracking-tight leading-snug">
              {exercise.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 flex items-center justify-center transition-all"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Khung minh họa giải phẫu cơ thể Lyfta Style */}
        <div className="relative rounded-3xl bg-gradient-to-b from-white to-zinc-50 border border-zinc-200 p-4 mb-5 flex flex-col items-center shadow-sm">
          <div className="w-full flex items-center justify-between mb-3">
            <span className="text-[11px] font-black uppercase tracking-[0.15em] text-zinc-500">
              Mô hình giải phẫu cơ
            </span>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-100">
              Lyfta Visual Engine
            </span>
          </div>

          {/* Ảnh minh họa động tác to rõ kiểu Lyfta */}
          {exercise.image_url && (
            <div className="w-full rounded-2xl overflow-hidden border border-zinc-200 bg-white shadow-sm mb-3">
              <img
                src={exercise.image_url}
                alt={exercise.name}
                className="w-full h-48 object-contain bg-white"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          )}

          <div className="w-full py-1">
            <ExerciseAnatomyView
              primaryMuscle={exercise.primary_muscle}
              secondaryMuscles={exercise.secondary_muscles}
              size="lg"
              showLabels={true}
              view="both"
            />
          </div>
        </div>

        {/* Thông tin nhóm cơ chi tiết */}
        <div className="space-y-3 mb-6">
          <div className="rounded-2xl border border-zinc-200 p-3.5 bg-white">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Cơ đích chính (Primary)</span>
            </div>
            <p className="text-sm font-black text-zinc-950 pl-4.5">
              {exercise.muscle_group || getMuscleLabel(exercise.primary_muscle)}
            </p>
          </div>

          {exercise.secondary_muscles && (
            <div className="rounded-2xl border border-zinc-200 p-3.5 bg-white">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Cơ bổ trợ (Secondary)</span>
              </div>
              <p className="text-sm font-semibold text-zinc-700 pl-4.5">
                {exercise.secondary_muscles
                  .split(',')
                  .map((m: string) => getMuscleLabel(m.trim()))
                  .join(', ')}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-2.5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase">Sets chuẩn</span>
              <p className="text-base font-black text-zinc-900">{exercise.default_sets || 3} sets</p>
            </div>
            <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-2.5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase">Khoảng Reps</span>
              <p className="text-base font-black text-zinc-900">
                {exercise.default_min_rep || 8} – {exercise.default_max_rep || 12} reps
              </p>
            </div>
          </div>
        </div>

        {/* Nút hành động */}
        <button
          type="button"
          disabled={isAdded}
          onClick={() => {
            onAdd(exercise);
            onClose();
          }}
          className={`w-full py-4 rounded-2xl font-black text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg transition-all ${
            isAdded
              ? 'bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20 active:scale-[0.98]'
          }`}
        >
          {isAdded ? (
            <>
              <Check className="w-5 h-5 text-emerald-600" /> ĐÃ CÓ TRONG LỊCH TẬP
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" strokeWidth={3} /> THÊM BÀI NÀY VÀO LỊCH
            </>
          )}
        </button>
      </div>
    </div>
  );
}
