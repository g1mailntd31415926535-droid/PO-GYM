// components/PlanBSwapSheet.tsx — Danh sách bài thay thế khi máy đang bận (Plan B).
'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Dumbbell, Loader2, Sparkles, Shuffle, Target } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { PLANB_LIBRARY, classifyLibrary, findPlanBExercise } from '@/lib/planb/classification';
import { rankAlternatives } from '@/lib/planb/recommendation';
import { differencesFor, reasonFor, targetLabel, typeLabel } from '@/lib/planb/explain';
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
      className="fixed inset-0 bg-zinc-950/40 backdrop-blur-md flex items-end sm:items-center justify-center z-50"
    >
      <div className="bg-white border border-zinc-200 w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] max-h-[92vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div aria-hidden="true" className="w-10 h-1 rounded-full bg-zinc-200 mx-auto mb-6 sm:hidden" />

        <div>
          <p className="text-[11px] font-bold tracking-[0.2em] text-blue-600 uppercase">Plan B · Đổi bài</p>
          <h3 id="planb-title" className="text-xl font-black leading-tight mt-1 line-clamp-2">
            {baseName} đang bận
          </h3>
          {base && (
            <div className="mt-3 rounded-2xl bg-zinc-50 border border-zinc-200 px-4 py-3">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                <Target size={12} /> Bạn cần tập
              </p>
              <p className="mt-1 text-sm font-bold">{targetLabel(base)}</p>
              <p className="mt-1 text-[11px] text-zinc-500 leading-relaxed">
                Chỉ hiện bài cùng nhóm cơ và cùng vùng cơ. Xếp theo độ giống động tác (80%) và loại bài (20%).
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2 overflow-y-auto flex-1 mt-4 -mx-1 px-1">
          {!library ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-zinc-500">
              <Loader2 size={16} className="animate-spin text-blue-600" />
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
              <p className="text-[11px] font-bold tracking-[0.2em] text-zinc-500 uppercase">
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
              className="w-full rounded-2xl border border-zinc-200 py-3 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Xem thêm {hiddenCount} bài
            </button>
          )}

          <p className="pt-2 text-[11px] leading-relaxed text-zinc-500">
            Thứ hạng là quy tắc kinh nghiệm để chọn động tác gần nhất, không khẳng định hiệu quả tập tương đương.
            Tạ của bài gốc không tự quy đổi. Bài thay thế dùng lộ trình tăng tạ riêng của nó.
          </p>
        </div>

        <button
          onClick={onBack}
          className="w-full bg-transparent hover:bg-zinc-100 border border-zinc-200 py-3.5 rounded-2xl font-semibold text-zinc-500 hover:text-zinc-800 text-sm mt-4 flex items-center justify-center gap-2 transition-colors"
        >
          <ArrowLeft size={15} />
          Quay lại
        </button>
      </div>
    </div>
  );
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
  const differences = differencesFor(base, exercise);
  const img = resolveExerciseImage(exercise);

  return (
    <button
      onClick={onChoose}
      className={`w-full text-left bg-white p-3 rounded-2xl active:scale-[0.98] transition-all border ${
        recommended ? 'border-2 border-blue-600' : 'border-zinc-200 hover:border-blue-600/40'
      }`}
    >
      <div className="flex gap-3">
        <div className="w-16 h-16 rounded-xl bg-zinc-100 overflow-hidden shrink-0 flex items-center justify-center">
          {img ? (
            <img src={img} alt={exercise.name} loading="lazy" className="w-full h-full object-cover" />
          ) : (
            <Dumbbell size={20} className="text-zinc-400" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {recommended && (
              <span className="flex items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white">
                <Sparkles size={10} /> Gợi ý
              </span>
            )}
            {isDifferentStyle && (
              <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-700">
                <Shuffle size={10} /> Khác kiểu động tác
              </span>
            )}
          </div>
          <h4 className="mt-1 text-sm font-bold text-zinc-950 leading-snug line-clamp-2">{exercise.name}</h4>
          <p className="mt-0.5 text-[11px] font-semibold text-zinc-500">
            {exercise.equipment || 'Không rõ dụng cụ'} · {typeLabel(exercise.exerciseType)}
          </p>
        </div>
        <ArrowRight size={16} className="text-zinc-400 shrink-0 self-center" />
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">{reasonFor(base, exercise)}</p>

      {differences.length > 0 && (
        <ul className="mt-1 space-y-0.5">
          {differences.slice(0, 3).map((line) => (
            <li key={line} className="text-[10px] leading-relaxed text-zinc-400">
              · {line}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-bold text-zinc-600 tabular-nums">
        <span className="rounded-full bg-zinc-100 px-2 py-0.5">{exercise.default_sets} set</span>
        <span className="rounded-full bg-zinc-100 px-2 py-0.5">
          {exercise.default_min_rep}–{exercise.default_max_rep} rep
        </span>
        <span className="rounded-full bg-zinc-100 px-2 py-0.5">nghỉ {exercise.default_rest_seconds}s</span>
      </div>
    </button>
  );
}

function EmptyState({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="text-center py-8 px-4 rounded-2xl border border-dashed border-zinc-300">
      <Dumbbell size={22} className="mx-auto text-zinc-400 mb-2" />
      <p className="text-sm font-black">{title}</p>
      <p className="mt-1 text-xs text-zinc-500 leading-relaxed">{desc}</p>
    </div>
  );
}
