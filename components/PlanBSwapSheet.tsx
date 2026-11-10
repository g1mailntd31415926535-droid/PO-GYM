// components/PlanBSwapSheet.tsx — Danh sách bài thay thế khi máy đang bận (Plan B).
'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, CircleDot, Dumbbell, Loader2, Sparkles, Shuffle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { PLANB_LIBRARY, classifyLibrary, findPlanBExercise } from '@/lib/planb/classification';
import { rankAlternatives } from '@/lib/planb/recommendation';
import { targetLabel, typeLabel } from '@/lib/planb/explain';
import { resolveExerciseImage } from '@/lib/lyfta';
import type { PlanBExercise, RankedExercise } from '@/lib/planb/types';

const INITIAL_VISIBLE = 3;

// Lấy thư viện từ Supabase để bài gợi ý mang đúng id trên cloud (UUID).
// Lỗi / trống thì dùng thư viện trong code như DashboardView.
async function loadPlanBLibrary(): Promise<PlanBExercise[]> {
  try {
    const { data } = await supabase.from('exercises_library').select('*');
    if (!data || data.length === 0) return PLANB_LIBRARY;
    // Map cột cloud → tên app dùng (cloud: exercise_image_url, app: image_url)
    return classifyLibrary(
      data.map((row: Record<string, unknown>) => ({
        ...(row as unknown as PlanBExercise),
        image_url: (row.image_url || row.exercise_image_url || '') as string,
      })),
    );
  } catch {
    return PLANB_LIBRARY;
  }
}

export default function PlanBSwapSheet({
  baseId,
  baseName,
  excludeIds,
  onChoose,
  onBack,
}: {
  baseId: string;
  baseName: string;
  /** Bài đã có trong buổi tập hôm nay. */
  excludeIds: string[];
  onChoose: (exercise: PlanBExercise) => void;
  onBack: () => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const [library, setLibrary] = useState<PlanBExercise[] | null>(null);

  useEffect(() => {
    let active = true;
    loadPlanBLibrary().then((rows) => {
      if (active) setLibrary(rows);
    });
    return () => {
      active = false;
    };
  }, []);

  const base = library ? findPlanBExercise(baseId, library) : undefined;
  const ranked = base && library ? rankAlternatives(base, library, excludeIds) : [];

  const visible = showAll ? ranked : ranked.slice(0, INITIAL_VISIBLE);
  const hiddenCount = ranked.length - visible.length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="planb-title"
      className="fixed inset-0 bg-ink/25 flex items-end sm:items-center justify-center z-50"
    >
      <div className="bg-white w-full max-w-md rounded-t-[1.75rem] sm:rounded-[1.75rem] px-[18px] pt-2.5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] max-h-[94vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div aria-hidden="true" className="w-9 h-[3px] rounded-full bg-line mx-auto mb-5" />

        <div>
          <p className="text-[10px] font-bold tracking-[0.08em] text-accent uppercase">Plan B · Đổi bài</p>
          <h3 id="planb-title" className="text-[26px] font-bold leading-[1.2] mt-1 line-clamp-2">
            {baseName} đang bận
          </h3>
          {base && (
            <div className="mt-4 rounded-2xl bg-paper p-3">
              <p className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.06em] text-muted">
                <CircleDot size={10} /> Bạn cần tập
              </p>
              <p className="mt-0.5 text-[13px] font-bold">
                {targetLabel(base)} · {groupOf(base)}
              </p>
              <p className="mt-0.5 text-[10px] text-muted leading-relaxed">
                Chỉ hiện bài cùng nhóm cơ và cùng vùng cơ. Xếp theo độ giống động tác (80%) và loại bài (20%).
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2 overflow-y-auto flex-1 mt-4 -mx-1 px-1">
          {!library ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted">
              <Loader2 size={16} className="animate-spin text-accent" />
              Đang tìm bài thay thế...
            </div>
          ) : !base ? (
            <EmptyState
              title="Bài này chưa được phân loại"
              desc="Bài tự thêm chưa có dữ liệu vùng cơ nên chưa gợi ý được. Hãy chọn bài khác trong lịch hoặc chờ máy trống."
            />
          ) : ranked.length === 0 ? (
            <EmptyState
              title="Chưa có bài thay thế phù hợp"
              desc={`Không có bài nào cùng vùng ${targetLabel(base)}. App không lấp danh sách bằng bài khác vùng cơ, hãy chọn bài khác trong lịch hoặc chờ máy trống.`}
            />
          ) : (
            <>
              <p className="text-[10px] font-bold tracking-[0.06em] text-muted uppercase">
                {ranked.length} bài phù hợp
              </p>
              {visible.map((item) => (
                <OptionCard
                  key={item.exercise.id}
                  base={base}
                  ranked={item}
                  onChoose={() => onChoose(item.exercise)}
                />
              ))}
            </>
          )}

          {hiddenCount > 0 && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full h-[38px] rounded-xl bg-white border border-line text-[12px] font-bold text-ink hover:bg-paper transition-colors"
            >
              Xem thêm {hiddenCount} bài
            </button>
          )}
        </div>

        <button
          onClick={onBack}
          className="w-full h-[43px] bg-white hover:bg-paper border border-line rounded-2xl font-semibold text-ink text-[13px] mt-5 flex items-center justify-center gap-1.5 transition-colors"
        >
          <ArrowLeft size={14} />
          Quay lại
        </button>
      </div>
    </div>
  );
}

// "Barbell Bench Press (Đẩy ngực...)" -> "Barbell Bench Press" cho câu giải thích ngắn gọn.
function shortName(name: string): string {
  return name.replace(/\s*\(.*$/, '');
}

function groupOf(ex: PlanBExercise): string {
  return targetLabel(ex).split(' ')[0];
}

function reasonLine(base: PlanBExercise, ranked: RankedExercise): string {
  const name = shortName(base.name);
  if (ranked.isDifferentStyle) {
    return `Cùng vùng ${groupOf(base).toLowerCase()} nhưng khác kiểu động tác so với ${name}.`;
  }
  return ranked.exercise.movementPattern === base.movementPattern
    ? `Cùng vùng cơ và cùng kiểu động tác với ${name}.`
    : `Cùng vùng cơ, cùng nhóm động tác nhưng khác kiểu so với ${name}.`;
}

function OptionCard({
  base,
  ranked,
  onChoose,
}: {
  base: PlanBExercise;
  ranked: RankedExercise;
  onChoose: () => void;
}) {
  const { exercise, recommended, isDifferentStyle } = ranked;
  const img = resolveExerciseImage(exercise);
  const type = typeLabel(exercise.exerciseType);

  return (
    <button
      onClick={onChoose}
      className={`w-full text-left bg-[#f7f6f3] p-3 rounded-2xl active:scale-[0.98] transition-all border ${
        recommended ? 'border-accent' : 'border-line hover:border-accent/40'
      }`}
    >
      <div className="flex gap-3">
        <div className="w-[50px] h-[50px] rounded-[10px] bg-[#ebe9e4] overflow-hidden shrink-0 flex items-center justify-center">
          {img ? (
            <img src={img} alt={exercise.name} loading="lazy" className="w-full h-full object-cover" />
          ) : (
            <Dumbbell size={18} className="text-muted" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          {(recommended || isDifferentStyle) && (
            <div className="flex flex-wrap items-center gap-1 mb-1">
              {recommended && (
                <span className="flex items-center gap-0.5 rounded-full bg-accent px-1.5 py-[2px] text-[9px] font-bold uppercase text-white">
                  <Sparkles size={8} /> Gợi ý
                </span>
              )}
              {isDifferentStyle && (
                <span className="flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-[2px] text-[9px] font-bold uppercase text-amber-700">
                  <Shuffle size={8} /> Khác kiểu động tác
                </span>
              )}
            </div>
          )}
          <h4 className="text-[14px] font-bold text-ink leading-snug line-clamp-2">{exercise.name}</h4>
          <p className="text-[11px] font-semibold text-muted">
            {exercise.equipment || 'Không rõ dụng cụ'} · {type.charAt(0).toUpperCase() + type.slice(1)}
          </p>
        </div>
        <ArrowRight size={14} className="text-muted shrink-0 self-center" />
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-muted">{reasonLine(base, ranked)}</p>

      <div className="mt-1.5 flex flex-wrap gap-1 text-[9px] font-bold text-ink/70 tabular-nums">
        <span className="rounded-full bg-[#ebe9e4] px-2 py-[3px]">{exercise.default_sets} set</span>
        <span className="rounded-full bg-[#ebe9e4] px-2 py-[3px]">
          {exercise.default_min_rep}–{exercise.default_max_rep} rep
        </span>
        <span className="rounded-full bg-[#ebe9e4] px-2 py-[3px]">nghỉ {exercise.default_rest_seconds}s</span>
      </div>
    </button>
  );
}

function EmptyState({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="text-center py-8 px-4 rounded-2xl border border-dashed border-line">
      <Dumbbell size={22} className="mx-auto text-muted mb-2" />
      <p className="text-sm font-bold">{title}</p>
      <p className="mt-1 text-xs text-muted leading-relaxed">{desc}</p>
    </div>
  );
}
