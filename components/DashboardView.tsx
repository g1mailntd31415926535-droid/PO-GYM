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
  Pencil,
  Trash2,
  LogOut,
  Flame,
  CalendarDays,
  Layers,
  Minus,
  Check,
  Loader2,
  Zap,
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
        setLibraryExercises(data);
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

      const mapped: SelectedExerciseItem[] = routineExList.map((item: any) => {
        const ex = exData?.find((e: any) => e.id === item.exercise_id);
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
    <main className="relative min-h-screen bg-white text-zinc-950 overflow-x-hidden">
      <div className="relative max-w-md mx-auto px-5 pt-6 pb-36">
        {/* HEADER */}
        <header className="flex items-start justify-between mb-7">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600 mb-1.5 capitalize">
              {todayLabel}
            </p>
            <h1 className="text-[28px] leading-[1.05] font-black tracking-tight text-balance">
              Hôm nay bạn
              <br />
              tập gì<span className="text-blue-600">?</span>
            </h1>
          </div>
          <button
            onClick={() => supabase.auth.signOut().then(() => window.location.reload())}
            className="w-11 h-11 rounded-2xl bg-white border border-zinc-200 text-zinc-500 hover:text-zinc-950 hover:border-zinc-300 flex items-center justify-center active:scale-95 transition-all"
            aria-label="Đăng xuất"
            title="Đăng xuất"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
          </button>
        </header>

        {/* STATS */}
        <section aria-label="Thống kê" className="grid grid-cols-3 gap-2.5 mb-5">
          <StatTile icon={<Flame className="w-4 h-4" />} value={sessionsThisMonth} label="Buổi tháng này" highlight />
          <StatTile icon={<CalendarDays className="w-4 h-4" />} value={totalSessions} label="Tổng buổi" />
          <StatTile icon={<Layers className="w-4 h-4" />} value={routines.length} label="Lịch tập" />
        </section>

        {/* HEATMAP */}
        <section aria-labelledby="heatmap-title" className="bg-zinc-50 border border-zinc-200 rounded-3xl p-4 mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 id="heatmap-title" className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-500">
              Độ chăm chỉ
            </h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600">
              <Zap className="w-3 h-3" aria-hidden="true" /> Consistency
            </span>
          </div>
          <WorkoutHeatmap activityData={activityLogs} />
        </section>

        {/* DANH SÁCH LỊCH TẬP */}
        <section aria-labelledby="routines-title">
          <div className="flex items-end justify-between mb-3">
            <h2 id="routines-title" className="text-lg font-black tracking-tight">
              Giáo án của bạn
            </h2>
            <span className="text-xs font-semibold text-zinc-500 tabular-nums">
              {routines.length} lịch
            </span>
          </div>

          <ul className="flex flex-col gap-3">
            {routines.map((routine, i) => (
              <li
                key={routine.id}
                className="group relative bg-white border border-zinc-200 hover:border-zinc-300 rounded-3xl p-4 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 shrink-0 rounded-2xl bg-white border border-zinc-200 flex flex-col items-center justify-center">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 leading-none">Day</span>
                    <span className="text-lg font-black tabular-nums leading-none mt-0.5">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[15px] text-zinc-950 truncate">{routine.name}</h3>
                    <span className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600" aria-hidden="true" />
                      Sẵn sàng giáo án
                    </span>
                  </div>

                  <button
                    onClick={() => onStartWorkout(routine.id, routine.name)}
                    className="w-12 h-12 shrink-0 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
                    aria-label={`Bắt đầu tập ${routine.name}`}
                  >
                    <Play className="w-5 h-5 ml-0.5" fill="currentColor" aria-hidden="true" />
                  </button>
                </div>

                <div className="flex items-center gap-2 mt-3.5 pt-3.5 border-t border-zinc-100">
                  <button
                    onClick={() => handleOpenEditModal(routine)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white border border-zinc-200 text-xs font-semibold text-zinc-700 hover:text-zinc-950 hover:border-zinc-300 active:scale-[0.98] transition-all"
                  >
                    <Pencil className="w-3.5 h-3.5" aria-hidden="true" /> Sửa lịch & Reps
                  </button>
                  <button
                    onClick={() => handleDeleteRoutine(routine.id, routine.name)}
                    className="w-10 h-[34px] inline-flex items-center justify-center rounded-xl bg-white border border-zinc-200 text-zinc-500 hover:text-rose-600 hover:border-rose-500/40 active:scale-95 transition-all"
                    aria-label={`Xóa lịch ${routine.name}`}
                    title="Xóa lịch"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {routines.length === 0 && (
            <div className="flex flex-col items-center text-center py-12 px-6 bg-zinc-50 border border-dashed border-zinc-200 rounded-3xl">
              <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-600/20 text-blue-600 flex items-center justify-center mb-4">
                <Dumbbell className="w-6 h-6" aria-hidden="true" />
              </div>
              <p className="font-bold text-zinc-950 mb-1">Chưa có lịch tập nào</p>
              <p className="text-sm text-zinc-500 text-pretty">
                Bấm nút bên dưới để tạo giáo án đầu tiên của bạn.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* NÚT TẠO LỊCH MỚI */}
      <div className="fixed bottom-0 inset-x-0 z-30 pointer-events-none">
        <div className="max-w-md mx-auto px-5 pb-6 pt-10 bg-gradient-to-t from-white via-white/95 to-transparent">
          <button
            onClick={handleOpenCreateModal}
            className="pointer-events-auto w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all"
          >
            <Plus className="w-5 h-5" strokeWidth={3} aria-hidden="true" /> TẠO LỊCH TẬP MỚI
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
          className="fixed inset-0 z-40 bg-zinc-950/40 backdrop-blur-sm flex items-end sm:items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="routine-modal-title"
        >
          <div className="w-full max-w-md bg-white border border-zinc-200 rounded-t-[2rem] sm:rounded-[2rem] max-h-[92vh] flex flex-col shadow-2xl">
            {/* Modal header */}
            <div className="px-5 pt-3 pb-4 border-b border-zinc-100">
              <div className="w-10 h-1 rounded-full bg-zinc-100 mx-auto mb-4 sm:hidden" aria-hidden="true" />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600 mb-1">
                    {editingRoutineId ? 'Chỉnh sửa' : 'Giáo án mới'}
                  </p>
                  <h3 id="routine-modal-title" className="text-xl font-black tracking-tight">
                    {editingRoutineId ? 'Lịch tập & Mục tiêu' : 'Tạo lịch tập'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-10 h-10 rounded-xl bg-white border border-zinc-200 text-zinc-500 hover:text-zinc-950 flex items-center justify-center active:scale-95 transition-all"
                  aria-label="Đóng"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <label htmlFor="routine-name" className="block text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500 mb-2">
                Tên lịch
              </label>
              <input
                id="routine-name"
                type="text"
                placeholder="vd: Ngực - Vai - Tay sau, Chân..."
                value={routineName}
                onChange={(e) => setRoutineName(e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-2xl px-4 py-3.5 mb-5 text-zinc-950 font-semibold placeholder:text-zinc-400 placeholder:font-normal focus:outline-none focus:border-blue-600/60 focus:ring-4 focus:ring-blue-600/10 transition-all"
              />

              <label htmlFor="exercise-search" className="block text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500 mb-2">
                {searchQuery.trim() ? 'Kết quả tìm kiếm' : 'Gợi ý bài tập cho bạn'}
              </label>
              <div className="mb-6">
                <div className="group relative mb-3">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-blue-600 transition-colors"
                    aria-hidden="true"
                  />
                  <input
                    id="exercise-search"
                    type="text"
                    placeholder="Gõ tên bài hoặc nhóm cơ (Bench, Squat, Ngực, Vai...)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:border-blue-600/60 focus:ring-4 focus:ring-blue-600/10 transition-all"
                  />
                </div>

                {/* GỢI Ý LUÔN, KHÔNG CẦN GÕ TÌM KIẾM */}
                <div className="bg-white border border-zinc-200 rounded-3xl max-h-[380px] overflow-y-auto shadow-sm p-2 space-y-2">
                  {suggestionList.map((ex) => {
                      const added = !!selectedExercises.find((item) => item.exerciseId === ex.id);
                      return (
                        <div
                          key={ex.id}
                          className="flex items-center gap-3.5 p-3 rounded-2xl border border-zinc-100 hover:border-zinc-200 hover:bg-zinc-50/80 transition-all"
                        >
                          {/* KHUNG ẢNH MINH HỌA KIỂU LYFTA - NHẤN ĐỂ XEM GIẢI PHẪU */}
                          <button type="button" onClick={() => openExerciseDetail(ex)} className="w-[84px] h-[84px] shrink-0 rounded-2xl bg-white border border-zinc-200 overflow-hidden flex items-center justify-center shadow-sm hover:border-blue-500/60 transition-colors" aria-label={`Xem chi tiết ${ex.name}`}>
                            {(() => {
                              const img = ex.image_url || resolveExerciseImage(ex);
                              return img ? (
                                <img src={img} alt={ex.name} loading="lazy" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[10px] font-bold text-zinc-400 px-2 text-center">No image</span>
                              );
                            })()}
                          </button>

                          {/* THÔNG TIN BÀI TẬP - NHẤN ĐỂ XEM GIẢI PHẪU */}
                          <button type="button" onClick={() => openExerciseDetail(ex)} className="flex-1 min-w-0 text-left">
                            <h5 className="font-bold text-[14px] leading-snug text-zinc-950 line-clamp-2">
                              {ex.name}
                            </h5>
                            
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              {ex.primary_muscle && (
                                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-200/50">
                                  {ex.primary_muscle}
                                </span>
                              )}
                              {ex.equipment && (
                                <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600">
                                  {ex.equipment}
                                </span>
                              )}
                            </div>

                            <span className="block text-[11px] text-zinc-400 mt-1 tabular-nums">
                              {ex.default_sets} sets × {ex.default_min_rep}–{ex.default_max_rep} reps
                            </span>
                          </button>

                          {/* NÚT + GIỜ MỞ CHI TIẾT TRƯỚC, THÊM TỪ TRONG MODAL */}
                          <button
                            type="button"
                            onClick={() => openExerciseDetail(ex)}
                            className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-all active:scale-95 ${
                              added
                                ? 'bg-zinc-100 text-blue-600'
                                : 'bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-600/20'
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
                      <div className="p-6 text-center text-xs text-zinc-500">
                        Không tìm thấy bài tập nào khớp với từ khóa "{searchQuery}".
                      </div>
                    )}
                </div>
              </div>

              {/* CÁC BÀI ĐÃ CHỌN TRONG LỊCH */}
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500">
                  Các bài trong lịch
                </h4>
                <span className="text-[11px] font-bold text-white bg-blue-600 rounded-full px-2 py-0.5 tabular-nums">
                  {selectedExercises.length}
                </span>
              </div>

              <ol className="flex flex-col gap-3">
                {selectedExercises.map((item, idx) => (
                  <li key={idx} className="bg-white border border-zinc-200 rounded-3xl p-4">
                    <div className="flex items-start gap-3 mb-4">
                      {/* BẤM ẢNH / TÊN TRONG LỊCH CŨNG MỞ CHI TIẾT NỔI LÊN TRÊN */}
                      <button
                        type="button"
                        onClick={() => openExerciseDetail(item)}
                        className="w-14 h-14 shrink-0 rounded-2xl bg-white border border-zinc-200 overflow-hidden flex items-center justify-center shadow-sm hover:border-blue-500/60 transition-colors"
                        aria-label={`Xem chi tiết ${item.name}`}
                      >
                        {(() => {
                          const img = item.image_url || resolveExerciseImage(item);
                          return img ? (
                            <img src={img} alt={item.name} loading="lazy" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[9px] font-bold text-zinc-400 px-1 text-center">No image</span>
                          );
                        })()}
                      </button>

                      <button type="button" onClick={() => openExerciseDetail(item)} className="flex-1 min-w-0 text-left">
                        <span className="font-bold text-sm text-zinc-950 leading-snug line-clamp-2">
                          {item.name}
                        </span>
                        {item.primary_muscle && (
                          <span className="inline-block text-[10px] font-bold text-blue-600 mt-0.5">
                            {item.primary_muscle}
                          </span>
                        )}
                      </button>

                      <button
                        onClick={() => handleRemoveExercise(idx)}
                        className="w-8 h-8 shrink-0 rounded-lg text-zinc-500 hover:text-rose-600 hover:bg-rose-500/10 flex items-center justify-center transition-colors"
                        aria-label={`Xóa bài ${item.name}`}
                        title="Xóa bài này"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 mb-3">
                      {/* Weight stepper - cùng kiểu nút Số set cho dễ bấm */}
                      <div className="bg-white border border-zinc-200 rounded-2xl px-3 py-2.5">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-0.5">
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
                            className="w-7 h-7 rounded-lg bg-white border border-zinc-200 text-zinc-700 hover:text-zinc-950 flex items-center justify-center active:scale-90 transition-all"
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
                              className="w-12 bg-transparent text-center text-xl font-black text-blue-600 tabular-nums focus:outline-none"
                            />
                            <span className="text-xs font-bold text-zinc-500">kg</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const copy = [...selectedExercises];
                              copy[idx].weight = (copy[idx].weight || 0) + 2.5;
                              setSelectedExercises(copy);
                            }}
                            className="w-7 h-7 rounded-lg bg-white border border-zinc-200 text-zinc-700 hover:text-zinc-950 flex items-center justify-center active:scale-90 transition-all"
                            aria-label={`Tăng mức tạ ${item.name}`}
                          >
                            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      {/* Sets stepper */}
                      <div className="bg-white border border-zinc-200 rounded-2xl px-3 py-2.5">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-0.5">
                          Số set
                        </span>
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => handleUpdateSetsCount(idx, item.default_sets - 1)}
                            disabled={item.default_sets <= 1}
                            className="w-7 h-7 rounded-lg bg-white border border-zinc-200 text-zinc-700 hover:text-zinc-950 disabled:opacity-30 flex items-center justify-center active:scale-90 transition-all"
                            aria-label="Giảm số set"
                          >
                            <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                          <span className="text-xl font-black tabular-nums">{item.default_sets}</span>
                          <button
                            onClick={() => handleUpdateSetsCount(idx, item.default_sets + 1)}
                            disabled={item.default_sets >= 10}
                            className="w-7 h-7 rounded-lg bg-white border border-zinc-200 text-zinc-700 hover:text-zinc-950 disabled:opacity-30 flex items-center justify-center active:scale-90 transition-all"
                            aria-label="Tăng số set"
                          >
                            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Target reps per set */}
                    <div className="-mx-4 px-4">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
                        Rep mục tiêu từng set
                      </span>
                      <div
                        className="grid gap-1.5"
                        style={{ gridTemplateColumns: `repeat(${item.target_reps.length}, minmax(0, 1fr))` }}
                      >
                        {item.target_reps.map((rep, setIdx) => (
                          <div
                            key={setIdx}
                            className="flex flex-col items-center bg-white border border-zinc-200 rounded-xl py-1.5 focus-within:border-blue-600/60 transition-colors"
                          >
                            <span className="text-[9px] font-bold text-zinc-500 uppercase">S{setIdx + 1}</span>
                            <div className="flex items-center justify-between w-full px-1">
                              <button
                                type="button"
                                onClick={() => handleUpdateRepOfSet(idx, setIdx, rep - 1)}
                                disabled={rep <= 1}
                                className="w-6 h-6 rounded-lg bg-white border border-zinc-200 text-zinc-700 hover:text-zinc-950 disabled:opacity-30 flex items-center justify-center active:scale-90 transition-all"
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
                                className="w-8 bg-transparent text-center text-base font-black text-zinc-950 tabular-nums focus:outline-none"
                                aria-label={`Rep set ${setIdx + 1} ${item.name}`}
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateRepOfSet(idx, setIdx, rep + 1)}
                                className="w-6 h-6 rounded-lg bg-white border border-zinc-200 text-zinc-700 hover:text-zinc-950 flex items-center justify-center active:scale-90 transition-all"
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
                <div className="flex flex-col items-center text-center py-8 border border-dashed border-zinc-200 rounded-3xl">
                  <Search className="w-5 h-5 text-zinc-400 mb-2" aria-hidden="true" />
                  <p className="text-xs text-zinc-500 px-6">
                    Chưa có bài tập nào. Hãy tìm bài ở trên để thêm vào!
                  </p>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="px-5 pt-3 pb-5 border-t border-zinc-100">
              <button
                onClick={handleSaveRoutine}
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-black tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all"
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
  icon,
  value,
  label,
  highlight = false,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-3 border ${
        highlight ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-zinc-200 text-zinc-950'
      }`}
    >
      <span className={highlight ? 'text-white/70' : 'text-blue-600'} aria-hidden="true">
        {icon}
      </span>
      <p className="text-2xl font-black tabular-nums leading-none mt-2">{value}</p>
      <p className={`text-[10px] font-bold uppercase tracking-wide mt-1 ${highlight ? 'text-white/70' : 'text-zinc-500'}`}>
        {label}
      </p>
    </div>
  );
}
