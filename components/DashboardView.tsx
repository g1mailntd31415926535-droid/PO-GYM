// components/DashboardView.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Plus,
  Dumbbell,
  Play,
  Search,
  X,
  Trash2,
  Minus,
  Check,
  Loader2,
} from 'lucide-react';
import WorkoutHeatmap, { DayActivity } from '@/components/WorkoutHeatmap';
import ExerciseDetailModal from '@/components/ExerciseDetailModal';
import { useFeedback } from '@/components/FeedbackProvider';
import { resolveExerciseImage, inferPrimaryMuscle } from '@/lib/lyfta';
import { EXERCISES_FULL } from '@/lib/exercises-full';

interface SelectedExerciseItem {
  exerciseId: string;
  name: string;
  default_sets: number;
  default_min_rep: number;
  default_max_rep: number;
  weight: number;
  target_reps: number[];
  muscle_diagram_url?: string;
  image_url?: string;
  muscle_group?: string;
  secondary_muscles?: string;
  primary_muscle?: string;
  equipment?: string;
}

// Thư viện dự phòng khi Supabase chưa có dữ liệu: full 70 bài verified từ Lyfta.
const FALLBACK_LIBRARY = EXERCISES_FULL;

// "Ngực trên" / "Vai giữa" / "Lưng xô" -> gộp về nhóm lớn cho dòng mô tả lịch.
const BASE_GROUPS = ['Ngực', 'Vai', 'Lưng'];
function muscleGroupLabel(group: string): string {
  return BASE_GROUPS.find((g) => group.startsWith(g)) ?? group;
}

export default function DashboardView({ onStartWorkout }: { onStartWorkout: (routineId: string, routineName: string) => void }) {
  const [routines, setRoutines] = useState<any[]>([]);
  const [libraryExercises, setLibraryExercises] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<DayActivity[]>([]);

  // State Modal (Tạo & Sửa)
  const [showModal, setShowModal] = useState(false);
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [routineName, setRoutineName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<SelectedExerciseItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [detailExercise, setDetailExercise] = useState<any | null>(null);
  const { notify, confirmDialog } = useFeedback();

  // Dòng mô tả dưới tên lịch ("4 bài · Ngực, Vai, Tay sau"). Chỉ đọc, không đụng luồng lưu cũ.
  const [routineMeta, setRoutineMeta] = useState<Record<string, string>>({});
  useEffect(() => {
    if (routines.length === 0) return;
    let active = true;
    (async () => {
      const { data: linkRows } = await supabase
        .from('routine_exercises')
        .select('routine_id, exercise_id')
        .in('routine_id', routines.map((r) => r.id));
      if (!linkRows || !active) return;
      const links = linkRows as { routine_id: string; exercise_id: string }[];
      const exIds = [...new Set(links.map((l) => l.exercise_id))];
      const { data: exRows } = exIds.length
        ? await supabase.from('exercises_library').select('*').in('id', exIds)
        : { data: [] };
      if (!active) return;
      const exList = (exRows || []) as { id: string; muscle_group?: string; category?: string }[];

      const meta: Record<string, string> = {};
      for (const r of routines) {
        const ids = links.filter((l) => l.routine_id === r.id).map((l) => l.exercise_id);
        const groups = [
          ...new Set(
            ids
              .map((id) => {
                const ex = exList.find((e) => e.id === id);
                return muscleGroupLabel(ex?.muscle_group || ex?.category || '');
              })
              .filter(Boolean),
          ),
        ];
        meta[r.id] = [`${ids.length} bài`, groups.slice(0, 3).join(', ')].filter(Boolean).join(' · ');
      }
      setRoutineMeta(meta);
    })();
    return () => {
      active = false;
    };
  }, [routines]);

  useEffect(() => {
    loadRoutinesAndLogs();
    loadLibrary();
  }, []);

  const loadRoutinesAndLogs = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('workout_routines')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setRoutines(data);

    const { data: logs } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', user.id);

    if (logs && logs.length > 0) {
      setActivityLogs(
        logs.map((l: any) => ({
          date: l.workout_date,
          level: l.level as 0 | 1 | 2,
          summary: l.summary,
          routineName: l.routine_name,
        }))
      );
    }
  };

  const loadLibrary = async () => {
    try {
      const { data } = await supabase.from('exercises_library').select('*');
      if (data && data.length > 0) {
        // Map cột cloud → tên app dùng (cloud: exercise_image_url/category, app: image_url/muscle_group)
        const mapped = data.map((row: any) => ({
          ...row,
          image_url: row.image_url || row.exercise_image_url || '',
          muscle_group: row.muscle_group || row.category || '',
          secondary_muscles: Array.isArray(row.secondary_muscles)
            ? row.secondary_muscles.join(',')
            : (row.secondary_muscles || ''),
        }));
        setLibraryExercises(mapped);
      } else {
        setLibraryExercises(FALLBACK_LIBRARY);
      }
    } catch {
      setLibraryExercises(FALLBACK_LIBRARY);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingRoutineId(null);
    setRoutineName('');
    setSelectedExercises([]);
    setSearchQuery('');
    setShowModal(true);
  };

  const handleOpenEditModal = async (routine: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setEditingRoutineId(routine.id);
    setRoutineName(routine.name);
    setSearchQuery('');

    const { data: routineExList } = await supabase
      .from('routine_exercises')
      .select('exercise_id, order_index')
      .eq('routine_id', routine.id)
      .order('order_index', { ascending: true });

    if (routineExList && routineExList.length > 0) {
      const exerciseIds = routineExList.map((item: any) => item.exercise_id);

      const { data: exData } = await supabase.from('exercises_library').select('*').in('id', exerciseIds);
      const { data: stateData } = await supabase.from('user_exercise_state').select('*').eq('user_id', user.id).in('exercise_id', exerciseIds);

      // Map cột cloud → tên app dùng
      const mappedExData = exData?.map((row: any) => ({
        ...row,
        image_url: row.image_url || row.exercise_image_url || '',
        muscle_group: row.muscle_group || row.category || '',
        secondary_muscles: Array.isArray(row.secondary_muscles)
          ? row.secondary_muscles.join(',')
          : (row.secondary_muscles || ''),
      }));

      const mapped: SelectedExerciseItem[] = routineExList.map((item: any) => {
        const ex = mappedExData?.find((e: any) => e.id === item.exercise_id);
        const state = stateData?.find((s: any) => s.exercise_id === item.exercise_id);

        const setsCount = state?.target_reps?.length || ex?.default_sets || 3;
        const minRep = ex?.default_min_rep || 8;
        const currentTargetReps =
          state?.target_reps && state.target_reps.length > 0
            ? state.target_reps
            : Array(setsCount).fill(minRep);

        return {
          exerciseId: item.exercise_id,
          name: ex?.name || 'Bài tập',
          default_sets: setsCount,
          default_min_rep: minRep,
          default_max_rep: ex?.default_max_rep || 12,
          weight: state?.current_weight || 20,
          target_reps: currentTargetReps,
          muscle_diagram_url: ex?.muscle_diagram_url,
          image_url: ex?.image_url,
          muscle_group: ex?.muscle_group,
          secondary_muscles: ex?.secondary_muscles,
          primary_muscle: ex?.primary_muscle || inferPrimaryMuscle(ex?.name),
          equipment: ex?.equipment,
        };
      });

      setSelectedExercises(mapped);
    } else {
      setSelectedExercises([]);
    }

    setShowModal(true);
  };

  const handleDeleteRoutine = async (routineId: string, routineName: string) => {
    const ok = await confirmDialog({
      title: `Xóa lịch "${routineName}"?`,
      desc: 'Toàn bộ bài tập trong lịch này sẽ bị gỡ. Bạn có thể tạo lại bất cứ lúc nào.',
      confirmLabel: 'Xóa lịch',
      danger: true,
    });
    if (!ok) return;

    await supabase.from('routine_exercises').delete().eq('routine_id', routineId);
    const { error } = await supabase.from('workout_routines').delete().eq('id', routineId);

    if (error) notify(error.message, { desc: 'Không xóa được lịch, thử lại giúp mình.', kind: 'error' });
    else {
      notify('Đã xóa lịch tập', { desc: routineName, kind: 'success' });
      loadRoutinesAndLogs();
    }
  };

  const handleAddExercise = (ex: any) => {
    if (selectedExercises.find((item) => item.exerciseId === ex.id)) return;

    const sets = ex.default_sets || 3;
    const minRep = ex.default_min_rep || 8;

    setSelectedExercises([
      ...selectedExercises,
      {
        exerciseId: ex.id,
        name: ex.name,
        default_sets: sets,
        default_min_rep: minRep,
        default_max_rep: ex.default_max_rep || 12,
        weight: 20,
        target_reps: Array(sets).fill(minRep),
        muscle_diagram_url: ex.muscle_diagram_url,
        image_url: ex.image_url || resolveExerciseImage(ex),
        muscle_group: ex.muscle_group,
        secondary_muscles: ex.secondary_muscles,
        primary_muscle: ex.primary_muscle || inferPrimaryMuscle(ex.name),
        equipment: ex.equipment,
      },
    ]);
    setSearchQuery('');
  };

  // Mọi chỗ bấm vào bài đều mở chi tiết nổi lên TRƯỚC khung lịch tập.
  // Nút + không thêm nhanh nữa, mở chi tiết để thêm từ trong modal.
  const openExerciseDetail = (source: any) => {
    if (!source) return;
    const id = source.id ?? source.exerciseId;
    const full = libraryExercises.find((e: any) => e.id === id);
    if (full) {
      setDetailExercise(full);
      return;
    }
    if (source.id) {
      setDetailExercise(source);
      return;
    }
    setDetailExercise({
      id,
      name: source.name,
      default_sets: source.default_sets || 3,
      default_min_rep: source.default_min_rep || 8,
      default_max_rep: source.default_max_rep || 12,
      muscle_diagram_url: source.muscle_diagram_url,
      image_url: source.image_url,
      muscle_group: source.muscle_group,
      secondary_muscles: source.secondary_muscles,
      primary_muscle: source.primary_muscle,
      equipment: source.equipment,
    });
  };

  const handleRemoveExercise = (idx: number) => {
    const copy = [...selectedExercises];
    copy.splice(idx, 1);
    setSelectedExercises(copy);
  };

  const handleUpdateSetsCount = (exerciseIdx: number, newCount: number) => {
    if (newCount < 1 || newCount > 10) return;
    const copy = [...selectedExercises];
    const item = copy[exerciseIdx];
    const currentReps = [...item.target_reps];

    if (newCount > currentReps.length) {
      const lastVal = currentReps[currentReps.length - 1] || item.default_min_rep;
      item.target_reps = [...currentReps, lastVal];
    } else {
      item.target_reps = currentReps.slice(0, newCount);
    }
    item.default_sets = newCount;
    setSelectedExercises(copy);
  };

  const handleUpdateRepOfSet = (exerciseIdx: number, setIdx: number, newRep: number) => {
    const copy = [...selectedExercises];
    copy[exerciseIdx].target_reps[setIdx] = Math.max(1, newRep);
    setSelectedExercises(copy);
  };

  const handleSaveRoutine = async () => {
    if (!routineName.trim() || selectedExercises.length === 0) {
      notify('Chưa đủ thông tin', {
        desc: 'Vui lòng nhập tên lịch và thêm ít nhất 1 bài tập!',
        kind: 'error',
      });
      return;
    }

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      notify('Chưa đăng nhập!', { kind: 'error' });
      return;
    }

    let routineId = editingRoutineId;

    if (editingRoutineId) {
      await supabase.from('workout_routines').update({ name: routineName }).eq('id', editingRoutineId);
      await supabase.from('routine_exercises').delete().eq('routine_id', editingRoutineId);
    } else {
      const { data: newR, error: rError } = await supabase
        .from('workout_routines')
        .insert({ user_id: user.id, name: routineName })
        .select()
        .single();

      if (rError || !newR) {
        setSaving(false);
        notify(rError?.message || 'Không lưu được lịch', { desc: 'Thử lại giúp mình.', kind: 'error' });
        return;
      }
      routineId = newR.id;
    }

    for (let i = 0; i < selectedExercises.length; i++) {
      const item = selectedExercises[i];
      await supabase.from('routine_exercises').insert({
        routine_id: routineId,
        exercise_id: item.exerciseId,
        order_index: i + 1,
      });

      await supabase.from('user_exercise_state').upsert(
        {
          user_id: user.id,
          exercise_id: item.exerciseId,
          current_weight: item.weight,
          target_reps: item.target_reps,
          plateau_count: 0,
          is_calibrating: false,
        },
        { onConflict: 'user_id, exercise_id' }
      );
    }

    setSaving(false);
    setShowModal(false);
    notify(editingRoutineId ? 'Đã cập nhật lịch tập' : 'Đã lưu lịch tập mới', {
      desc: `${routineName} • ${selectedExercises.length} bài`,
      kind: 'success',
    });
    loadRoutinesAndLogs();
  };

  const todayLabel = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
  });
  const now = new Date();
  const sessionsThisMonth = activityLogs.filter((l) => {
    const d = new Date(l.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && l.level > 0;
  }).length;
  const totalSessions = activityLogs.filter((l) => l.level > 0).length;

  const filteredLibrary = libraryExercises.filter((ex) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      ex.name.toLowerCase().includes(q) ||
      (ex.primary_muscle && ex.primary_muscle.toLowerCase().includes(q)) ||
      (ex.secondary_muscles && ex.secondary_muscles.toLowerCase().includes(q)) ||
      (ex.muscle_group && ex.muscle_group.toLowerCase().includes(q)) ||
      (ex.equipment && ex.equipment.toLowerCase().includes(q))
    );
  });

  const SUGGESTION_COUNT = 6;
  // Chưa gõ gì thì gợi ý sẵn 6 bài đầu, có gõ thì hiện tối đa 30 kết quả khớp.
  const suggestionList = filteredLibrary.slice(0, searchQuery.trim() ? 30 : SUGGESTION_COUNT);

  return (
    <main className="relative min-h-screen text-ink overflow-x-hidden">
      <div className="relative max-w-md mx-auto min-h-screen bg-paper px-4 pt-[calc(1.25rem+env(safe-area-inset-top))] pb-36">
        {/* HEADER */}
        <header className="flex items-start justify-between mb-2.5">
          <div>
            <p className="text-[13px] font-semibold text-accent mb-2 capitalize">
              {todayLabel}
            </p>
            <h1 className="text-[28px] leading-[1.25] font-bold tracking-tight">
              Hôm nay
              <br />
              tập gì<span className="text-accent">?</span>
            </h1>
          </div>
          <button
            onClick={() => supabase.auth.signOut().then(() => window.location.reload())}
            className="w-[38px] h-[38px] rounded-[12px] bg-white border border-line text-[11px] font-semibold text-muted hover:text-ink hover:border-muted flex items-center justify-center active:scale-95 transition-all"
            aria-label="Đăng xuất"
            title="Đăng xuất"
          >
            Thoát
          </button>
        </header>

        {/* STATS */}
        <section aria-label="Thống kê" className="grid grid-cols-[1.2fr_1fr_1fr] gap-2 mb-3">
          <StatTile value={sessionsThisMonth} label="Buổi tháng này" highlight />
          <StatTile value={totalSessions} label="Tổng buổi" />
          <StatTile value={routines.length} label="Lịch tập" />
        </section>

        {/* HEATMAP */}
        <section aria-labelledby="heatmap-title" className="bg-white border border-line rounded-[1.375rem] p-4 mb-7">
          <WorkoutHeatmap activityData={activityLogs} />
        </section>

        {/* DANH SÁCH LỊCH TẬP */}
        <section aria-labelledby="routines-title">
          <div className="flex items-end justify-between mb-3">
            <h2 id="routines-title" className="text-[22px] font-bold tracking-tight">
              Giáo án của bạn
            </h2>
            <span className="text-[12px] font-bold text-muted tabular-nums">
              {routines.length} lịch
            </span>
          </div>

          <ul className="flex flex-col gap-3">
            {routines.map((routine, i) => (
              <li
                key={routine.id}
                className="group relative bg-white border border-line rounded-[1.375rem] p-4 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <span className="w-[46px] shrink-0 text-[32px] font-bold tabular-nums leading-none text-[#dcdad5]">
                    {String(i + 1).padStart(2, '0')}
                  </span>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[15px] text-ink truncate">{routine.name}</h3>
                    <span className="mt-1 block text-[12px] font-medium text-muted truncate">
                      {routineMeta[routine.id] ?? 'Sẵn sàng giáo án'}
                    </span>
                  </div>

                  <button
                    onClick={() => onStartWorkout(routine.id, routine.name)}
                    className="w-12 h-12 shrink-0 rounded-[14px] bg-accent hover:bg-accent-hover text-white flex items-center justify-center shadow-md shadow-accent/25 active:scale-95 transition-all"
                    aria-label={`Bắt đầu tập ${routine.name}`}
                  >
                    <Play className="w-5 h-5 ml-0.5" fill="currentColor" aria-hidden="true" />
                  </button>
                </div>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-line">
                  <button
                    onClick={() => handleOpenEditModal(routine)}
                    className="flex-1 h-[34px] inline-flex items-center justify-center rounded-xl bg-[#f0eee9] text-[12px] font-semibold text-ink hover:bg-line active:scale-[0.98] transition-all"
                  >
                    Sửa lịch & Reps
                  </button>
                  <button
                    onClick={() => handleDeleteRoutine(routine.id, routine.name)}
                    className="h-[34px] px-3 inline-flex items-center justify-center rounded-xl bg-[#f0eee9] text-[12px] font-bold text-rose-600 hover:bg-rose-50 active:scale-95 transition-all"
                    aria-label={`Xóa lịch ${routine.name}`}
                    title="Xóa lịch"
                  >
                    Xóa
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {routines.length === 0 && (
            <div className="flex flex-col items-center text-center py-12 px-6 bg-white/60 border border-dashed border-line rounded-[1.375rem]">
              <div className="w-14 h-14 rounded-2xl bg-accent-soft text-accent flex items-center justify-center mb-4">
                <Dumbbell className="w-6 h-6" aria-hidden="true" />
              </div>
              <p className="font-bold text-ink mb-1">Chưa có lịch tập nào</p>
              <p className="text-sm text-muted text-pretty">
                Bấm nút bên dưới để tạo giáo án đầu tiên của bạn.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* NÚT TẠO LỊCH MỚI */}
      <div className="fixed bottom-0 inset-x-0 z-30 pointer-events-none">
        <div className="max-w-md mx-auto px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-10 bg-gradient-to-t from-paper via-paper/95 to-transparent">
          <button
            onClick={handleOpenCreateModal}
            className="pointer-events-auto w-full h-12 bg-accent hover:bg-accent-hover text-white rounded-2xl text-[15px] font-bold flex items-center justify-center shadow-md shadow-accent/25 active:scale-[0.98] transition-all"
          >
            + Tạo lịch tập mới
          </button>
        </div>
      </div>

      {detailExercise && (
        <ExerciseDetailModal
          exercise={detailExercise}
          isAdded={!!selectedExercises.find((item) => item.exerciseId === detailExercise.id)}
          onClose={() => setDetailExercise(null)}
          onAdd={handleAddExercise}
        />
      )}

      {/* MODAL TẠO & SỬA LỊCH */}
      {showModal && (
        <div
          className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm flex items-end sm:items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="routine-modal-title"
        >
          <div className="w-full max-w-md bg-white border border-line rounded-t-[1.75rem] sm:rounded-[1.75rem] max-h-[92vh] pb-[env(safe-area-inset-bottom)] flex flex-col shadow-2xl">
            {/* Modal header */}
            <div className="px-5 pt-3 pb-4 border-b border-line">
              <div className="w-10 h-1 rounded-full bg-zinc-100 mx-auto mb-4 sm:hidden" aria-hidden="true" />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent mb-1">
                    {editingRoutineId ? 'Chỉnh sửa' : 'Giáo án mới'}
                  </p>
                  <h3 id="routine-modal-title" className="text-[22px] font-bold tracking-tight">
                    {editingRoutineId ? 'Lịch tập & Mục tiêu' : 'Tạo lịch tập'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-11 h-11 rounded-[14px] bg-white border border-line text-muted hover:text-ink flex items-center justify-center active:scale-95 transition-all"
                  aria-label="Đóng"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <label htmlFor="routine-name" className="block text-[11px] font-bold uppercase tracking-[0.15em] text-muted mb-2">
                Tên lịch
              </label>
              <input
                id="routine-name"
                type="text"
                placeholder="vd: Ngực - Vai - Tay sau, Chân..."
                value={routineName}
                onChange={(e) => setRoutineName(e.target.value)}
                className="w-full bg-white border border-line rounded-2xl px-4 py-3.5 mb-5 text-ink font-semibold placeholder:text-muted placeholder:font-normal min-h-[52px] focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all"
              />

              <label htmlFor="exercise-search" className="block text-[11px] font-bold uppercase tracking-[0.15em] text-muted mb-2">
                {searchQuery.trim() ? 'Kết quả tìm kiếm' : 'Gợi ý bài tập cho bạn'}
              </label>
              <div className="mb-6">
                <div className="group relative mb-3">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-accent transition-colors"
                    aria-hidden="true"
                  />
                  <input
                    id="exercise-search"
                    type="text"
                    placeholder="Gõ tên bài hoặc nhóm cơ (Bench, Squat, Ngực, Vai...)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-line rounded-2xl pl-11 pr-4 py-3.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all"
                  />
                </div>

                {/* GỢI Ý LUÔN, KHÔNG CẦN GÕ TÌM KIẾM */}
                <div className="bg-white border border-line rounded-[1.375rem] max-h-[380px] overflow-y-auto p-2 space-y-1.5">
                  {suggestionList.map((ex) => {
                      const added = !!selectedExercises.find((item) => item.exerciseId === ex.id);
                      return (
                        <div
                          key={ex.id}
                          className={`flex items-center gap-3 p-2.5 rounded-2xl transition-colors ${added ? 'bg-accent-soft' : 'hover:bg-paper'}`}
                        >
                          {/* KHUNG ẢNH MINH HỌA KIỂU LYFTA - NHẤN ĐỂ XEM GIẢI PHẪU */}
                          <button type="button" onClick={() => openExerciseDetail(ex)} className="w-16 h-16 shrink-0 rounded-[14px] bg-paper border border-line overflow-hidden flex items-center justify-center hover:border-accent/60 transition-colors" aria-label={`Xem chi tiết ${ex.name}`}>
                            {(() => {
                              const img = ex.image_url || resolveExerciseImage(ex);
                              return img ? (
                                <img src={img} alt={ex.name} loading="lazy" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[10px] font-bold text-muted px-2 text-center">No image</span>
                              );
                            })()}
                          </button>

                          {/* THÔNG TIN BÀI TẬP - NHẤN ĐỂ XEM GIẢI PHẪU */}
                          <button type="button" onClick={() => openExerciseDetail(ex)} className="flex-1 min-w-0 text-left">
                            <h5 className="font-bold text-[14px] leading-snug text-ink line-clamp-2">
                              {ex.name}
                            </h5>
                            
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              {ex.primary_muscle && (
                                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-soft text-accent">
                                  {ex.primary_muscle}
                                </span>
                              )}
                              {ex.equipment && (
                                <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f0eee9] text-ink/70">
                                  {ex.equipment}
                                </span>
                              )}
                            </div>

                            <span className="block text-[11px] text-muted mt-1 tabular-nums">
                              {ex.default_sets} sets × {ex.default_min_rep}–{ex.default_max_rep} reps
                            </span>
                          </button>

                          {/* NÚT + GIỜ MỞ CHI TIẾT TRƯỚC, THÊM TỪ TRONG MODAL */}
                          <button
                            type="button"
                            onClick={() => openExerciseDetail(ex)}
                            className={`w-[38px] h-[38px] shrink-0 rounded-xl flex items-center justify-center transition-all active:scale-95 ${
                              added
                                ? 'bg-white text-accent border border-accent/30'
                                : 'bg-accent text-white hover:bg-accent-hover'
                            }`}
                            aria-label={`Xem chi tiết ${ex.name}`}
                          >
                            {added ? (
                              <Check className="w-5 h-5" strokeWidth={2.5} />
                            ) : (
                              <Plus className="w-5 h-5" strokeWidth={2.5} />
                            )}
                          </button>
                        </div>
                      );
                    })}

                  {suggestionList.length === 0 && (
                      <div className="p-6 text-center text-xs text-muted">
                        Không tìm thấy bài tập nào khớp với từ khóa "{searchQuery}".
                      </div>
                    )}
                </div>
              </div>

              {/* CÁC BÀI ĐÃ CHỌN TRONG LỊCH */}
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted">
                  Các bài trong lịch
                </h4>
                <span className="text-[11px] font-bold text-white bg-accent rounded-full px-2 py-0.5 tabular-nums">
                  {selectedExercises.length}
                </span>
              </div>

              <ol className="flex flex-col gap-3">
                {selectedExercises.map((item, idx) => (
                  <li key={idx} className="bg-white border border-line rounded-[1.375rem] p-4">
                    <div className="flex items-start gap-3 mb-4">
                      {/* BẤM ẢNH / TÊN TRONG LỊCH CŨNG MỞ CHI TIẾT NỔI LÊN TRÊN */}
                      <button
                        type="button"
                        onClick={() => openExerciseDetail(item)}
                        className="w-14 h-14 shrink-0 rounded-[14px] bg-paper border border-line overflow-hidden flex items-center justify-center hover:border-accent/60 transition-colors"
                        aria-label={`Xem chi tiết ${item.name}`}
                      >
                        {(() => {
                          const img = item.image_url || resolveExerciseImage(item);
                          return img ? (
                            <img src={img} alt={item.name} loading="lazy" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[9px] font-bold text-muted px-1 text-center">No image</span>
                          );
                        })()}
                      </button>

                      <button type="button" onClick={() => openExerciseDetail(item)} className="flex-1 min-w-0 text-left">
                        <span className="font-bold text-sm text-ink leading-snug line-clamp-2">
                          {item.name}
                        </span>
                        {item.primary_muscle && (
                          <span className="inline-block text-[10px] font-bold text-accent mt-0.5">
                            {item.primary_muscle}
                          </span>
                        )}
                      </button>

                      <button
                        onClick={() => handleRemoveExercise(idx)}
                        className="w-11 h-11 shrink-0 rounded-xl text-muted hover:text-rose-600 hover:bg-rose-500/10 flex items-center justify-center transition-colors"
                        aria-label={`Xóa bài ${item.name}`}
                        title="Xóa bài này"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 mb-3">
                      {/* Weight stepper - cùng kiểu nút Số set cho dễ bấm */}
                      <div className="bg-paper rounded-2xl px-3 py-2.5">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-0.5">
                          Mức tạ
                        </span>
                        <div className="flex items-center justify-between gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              const copy = [...selectedExercises];
                              copy[idx].weight = Math.max(0, (copy[idx].weight || 0) - 2.5);
                              setSelectedExercises(copy);
                            }}
                            className="w-9 h-9 rounded-xl bg-white border border-line text-ink flex items-center justify-center active:scale-90 transition-all"
                            aria-label={`Giảm mức tạ ${item.name}`}
                          >
                            <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                          <div className="flex items-baseline gap-1 min-w-0">
                            <input
                              type="number"
                              inputMode="decimal"
                              aria-label={`Mức tạ ${item.name}`}
                              value={item.weight}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                const copy = [...selectedExercises];
                                copy[idx].weight = val;
                                setSelectedExercises(copy);
                              }}
                              className="w-12 bg-transparent text-center text-xl font-bold text-accent tabular-nums focus:outline-none"
                            />
                            <span className="text-xs font-bold text-muted">kg</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const copy = [...selectedExercises];
                              copy[idx].weight = (copy[idx].weight || 0) + 2.5;
                              setSelectedExercises(copy);
                            }}
                            className="w-9 h-9 rounded-xl bg-white border border-line text-ink flex items-center justify-center active:scale-90 transition-all"
                            aria-label={`Tăng mức tạ ${item.name}`}
                          >
                            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      {/* Sets stepper */}
                      <div className="bg-paper rounded-2xl px-3 py-2.5">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-0.5">
                          Số set
                        </span>
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => handleUpdateSetsCount(idx, item.default_sets - 1)}
                            disabled={item.default_sets <= 1}
                            className="w-9 h-9 rounded-xl bg-white border border-line text-ink disabled:opacity-30 flex items-center justify-center active:scale-90 transition-all"
                            aria-label="Giảm số set"
                          >
                            <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                          <span className="text-xl font-bold tabular-nums">{item.default_sets}</span>
                          <button
                            onClick={() => handleUpdateSetsCount(idx, item.default_sets + 1)}
                            disabled={item.default_sets >= 10}
                            className="w-9 h-9 rounded-xl bg-white border border-line text-ink disabled:opacity-30 flex items-center justify-center active:scale-90 transition-all"
                            aria-label="Tăng số set"
                          >
                            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Target reps per set */}
                    <div className="-mx-4 px-4">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-2">
                        Rep mục tiêu từng set
                      </span>
                      <div
                        className="grid gap-1.5"
                        style={{ gridTemplateColumns: `repeat(${item.target_reps.length}, minmax(0, 1fr))` }}
                      >
                        {item.target_reps.map((rep, setIdx) => (
                          <div
                            key={setIdx}
                            className="flex flex-col items-center bg-paper rounded-xl py-1.5 focus-within:ring-2 focus-within:ring-accent/30 transition-colors"
                          >
                            <span className="text-[9px] font-bold text-muted uppercase">S{setIdx + 1}</span>
                            <div className="flex items-center justify-between w-full px-1">
                              <button
                                type="button"
                                onClick={() => handleUpdateRepOfSet(idx, setIdx, rep - 1)}
                                disabled={rep <= 1}
                                className="w-7 h-7 rounded-lg bg-white border border-line text-ink disabled:opacity-30 flex items-center justify-center active:scale-90 transition-all"
                                aria-label={`Giảm rep set ${setIdx + 1} ${item.name}`}
                              >
                                <Minus className="w-3 h-3" aria-hidden="true" />
                              </button>
                              <input
                                type="number"
                                inputMode="numeric"
                                value={rep}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 1;
                                  handleUpdateRepOfSet(idx, setIdx, val);
                                }}
                                className="w-8 bg-transparent text-center text-base font-bold text-ink tabular-nums focus:outline-none"
                                aria-label={`Rep set ${setIdx + 1} ${item.name}`}
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateRepOfSet(idx, setIdx, rep + 1)}
                                className="w-7 h-7 rounded-lg bg-white border border-line text-ink flex items-center justify-center active:scale-90 transition-all"
                                aria-label={`Tăng rep set ${setIdx + 1} ${item.name}`}
                              >
                                <Plus className="w-3 h-3" aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>

              {selectedExercises.length === 0 && (
                <div className="flex flex-col items-center text-center py-8 border border-dashed border-line rounded-[1.375rem]">
                  <Search className="w-5 h-5 text-muted mb-2" aria-hidden="true" />
                  <p className="text-xs text-muted px-6">
                    Chưa có bài tập nào. Hãy tìm bài ở trên để thêm vào!
                  </p>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="px-5 pt-3 pb-5 border-t border-line">
              <button
                onClick={handleSaveRoutine}
                disabled={saving}
                className="w-full bg-accent hover:bg-accent-hover disabled:opacity-60 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold tracking-wide flex items-center justify-center gap-2 shadow-md shadow-accent/25 active:scale-[0.98] transition-all"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> Đang lưu...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" strokeWidth={3} aria-hidden="true" />
                    {editingRoutineId ? 'CẬP NHẬT LỊCH TẬP' : 'LƯU LỊCH TẬP NÀY'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function StatTile({
  value,
  label,
  highlight = false,
}: {
  value: number;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.25rem] px-3.5 py-3 min-h-[70px] border ${
        highlight ? 'bg-accent border-accent text-white shadow-md shadow-accent/25' : 'bg-white border-line text-ink'
      }`}
    >
      <p className="text-[24px] font-bold tabular-nums leading-none">{value}</p>
      <p className={`text-[11px] font-semibold mt-1.5 ${highlight ? 'text-white' : 'text-muted'}`}>
        {label}
      </p>
    </div>
  );
}
