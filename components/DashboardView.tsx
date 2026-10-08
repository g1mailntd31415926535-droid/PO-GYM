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
import { resolveExerciseImage, inferPrimaryMuscle } from '@/lib/lyfta';

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

// Thư viện dự phòng khi Supabase chưa có dữ liệu: ảnh demo kiểu Lyfta đã kiểm chứng.
const FALLBACK_LIBRARY = [
  { id: 'ex_1', name: 'Barbell Bench Press', default_sets: 3, default_min_rep: 8, default_max_rep: 12, default_rest_seconds: 90, primary_muscle: 'chest', secondary_muscles: 'shoulders,triceps', muscle_group: 'Ngực', equipment: 'Barbell', image_url: 'https://lyfta.app/images/exercises/00251101.png' },
  { id: 'ex_2', name: 'Incline Dumbbell Press', default_sets: 3, default_min_rep: 8, default_max_rep: 12, default_rest_seconds: 90, primary_muscle: 'chest', secondary_muscles: 'shoulders,triceps', muscle_group: 'Ngực trên', equipment: 'Dumbbell', image_url: 'https://lyfta.app/images/exercises/03141101.png' },
  { id: 'ex_3', name: 'Overhead Press (OHP)', default_sets: 3, default_min_rep: 8, default_max_rep: 12, default_rest_seconds: 90, primary_muscle: 'shoulders', secondary_muscles: 'triceps,traps', muscle_group: 'Vai', equipment: 'Barbell', image_url: 'https://lyfta.app/images/exercises/00911101.png' },
  { id: 'ex_4', name: 'Barbell Squat', default_sets: 4, default_min_rep: 6, default_max_rep: 10, default_rest_seconds: 120, primary_muscle: 'quads', secondary_muscles: 'glutes,hamstrings', muscle_group: 'Đùi trước', equipment: 'Barbell', image_url: 'https://lyfta.app/images/exercises/00431101.png' },
  { id: 'ex_5', name: 'Romanian Deadlift (RDL)', default_sets: 3, default_min_rep: 8, default_max_rep: 12, default_rest_seconds: 90, primary_muscle: 'hamstrings', secondary_muscles: 'glutes,lower_back', muscle_group: 'Đùi sau', equipment: 'Barbell', image_url: 'https://lyfta.app/images/exercises/00321101.png' },
  { id: 'ex_6', name: 'Lat Pulldown', default_sets: 3, default_min_rep: 10, default_max_rep: 12, default_rest_seconds: 75, primary_muscle: 'lats', secondary_muscles: 'biceps,rear_delts', muscle_group: 'Lưng xô', equipment: 'Cable', image_url: 'https://lyfta.app/images/exercises/01501101.png' },
  { id: 'ex_7', name: 'Barbell Bent-Over Row', default_sets: 3, default_min_rep: 8, default_max_rep: 12, default_rest_seconds: 90, primary_muscle: 'lats', secondary_muscles: 'biceps,rear_delts', muscle_group: 'Lưng giữa', equipment: 'Barbell', image_url: 'https://lyfta.app/images/exercises/00271101.png' },
  { id: 'ex_8', name: 'Dumbbell Lateral Raise', default_sets: 3, default_min_rep: 12, default_max_rep: 15, default_rest_seconds: 60, primary_muscle: 'shoulders', secondary_muscles: 'traps', muscle_group: 'Vai giữa', equipment: 'Dumbbell', image_url: 'https://lyfta.app/images/exercises/03341101.png' },
  { id: 'ex_9', name: 'Triceps Cable Pushdown', default_sets: 3, default_min_rep: 10, default_max_rep: 15, default_rest_seconds: 60, primary_muscle: 'triceps', secondary_muscles: 'forearms', muscle_group: 'Tay sau', equipment: 'Cable', image_url: 'https://lyfta.app/images/exercises/02411101.png' },
  { id: 'ex_10', name: 'Dumbbell Bicep Curl', default_sets: 3, default_min_rep: 10, default_max_rep: 12, default_rest_seconds: 60, primary_muscle: 'biceps', secondary_muscles: 'forearms', muscle_group: 'Tay trước', equipment: 'Dumbbell', image_url: 'https://lyfta.app/images/exercises/00311101.png' },
  { id: 'ex_11', name: 'Leg Press', default_sets: 3, default_min_rep: 10, default_max_rep: 12, default_rest_seconds: 90, primary_muscle: 'quads', secondary_muscles: 'glutes,hamstrings', muscle_group: 'Đùi trước', equipment: 'Machine', image_url: 'https://lyfta.app/images/exercises/07391101.png' },
  { id: 'ex_12', name: 'Calf Raises', default_sets: 4, default_min_rep: 12, default_max_rep: 15, default_rest_seconds: 60, primary_muscle: 'calves', secondary_muscles: '', muscle_group: 'Bắp chân', equipment: 'Body weight', image_url: 'https://lyfta.app/images/exercises/04171101.png' },
];

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
    if (!confirm(`Bạn có chắc chắn muốn xóa lịch "${routineName}" không?`)) return;

    await supabase.from('routine_exercises').delete().eq('routine_id', routineId);
    const { error } = await supabase.from('workout_routines').delete().eq('id', routineId);

    if (error) alert(`Lỗi: ${error.message}`);
    else loadRoutinesAndLogs();
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
      alert('Vui lòng nhập tên lịch và thêm ít nhất 1 bài tập!');
      return;
    }

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return alert('Chưa đăng nhập!');
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
        return alert(`Lỗi: ${rError?.message}`);
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

  const filteredLibrary = libraryExercises.filter((ex) =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (ex.primary_muscle && ex.primary_muscle.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (ex.equipment && ex.equipment.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
          exercise={{
            ...detailExercise,
            image_url: resolveExerciseImage(detailExercise) || detailExercise.image_url,
            primary_muscle: detailExercise.primary_muscle || inferPrimaryMuscle(detailExercise.name),
          }}
          isAdded={!!selectedExercises.find((item) => item.exerciseId === detailExercise.id)}
          onClose={() => setDetailExercise(null)}
          onAdd={handleAddExercise}
        />
      )}

      {/* MODAL TẠO & SỬA LỊCH */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-sm flex items-end sm:items-center justify-center"
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
                Tìm kiếm bài tập
              </label>
              <div className="relative mb-6">
                <div className="group relative">
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

                {/* DANH SÁCH TÌM KIẾM CÓ BẢN ĐỒ GIẢI PHẪU CƠ BẮP TO RÕ (84x84px) */}
                {searchQuery && (
                  <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-zinc-200 rounded-3xl max-h-[380px] overflow-y-auto z-20 shadow-2xl shadow-zinc-950/15 p-2 space-y-2">
                    {filteredLibrary.map((ex) => {
                      const added = !!selectedExercises.find((item) => item.exerciseId === ex.id);
                      return (
                        <div
                          key={ex.id}
                          className="flex items-center gap-3.5 p-3 rounded-2xl border border-zinc-100 hover:border-zinc-200 hover:bg-zinc-50/80 transition-all"
                        >
                          {/* KHUNG ẢNH MINH HỌA KIỂU LYFTA - NHẤN ĐỂ XEM GIẢI PHẪU */}
                          <button type="button" onClick={() => setDetailExercise(ex)} className="w-[84px] h-[84px] shrink-0 rounded-2xl bg-white border border-zinc-200 overflow-hidden flex items-center justify-center shadow-sm hover:border-blue-500/60 transition-colors" aria-label={`Xem chi tiết ${ex.name}`}>
                            <MuscleAnatomyVisual
                              imageUrl={resolveExerciseImage(ex) || ex.muscle_diagram_url}
                              muscleGroup={ex.primary_muscle || ex.name}
                            />
                          </button>

                          {/* THÔNG TIN BÀI TẬP - NHẤN ĐỂ XEM GIẢI PHẪU */}
                          <button type="button" onClick={() => setDetailExercise(ex)} className="flex-1 min-w-0 text-left">
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

                          {/* NÚT THÊM BÀI */}
                          <button
                            type="button"
                            onClick={() => handleAddExercise(ex)}
                            disabled={added}
                            className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-all ${
                              added
                                ? 'bg-zinc-100 text-blue-600 cursor-default'
                                : 'bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-600/20 active:scale-95'
                            }`}
                            aria-label={added ? 'Đã thêm bài này' : 'Thêm vào lịch'}
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

                    {filteredLibrary.length === 0 && (
                      <div className="p-6 text-center text-xs text-zinc-500">
                        Không tìm thấy bài tập nào khớp với từ khóa "{searchQuery}".
                      </div>
                    )}
                  </div>
                )}
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
                      {/* Thumbnail giải phẫu chuyên nghiệp kích thước 56x56px */}
                      <div className="w-14 h-14 shrink-0 rounded-2xl bg-white border border-zinc-200 overflow-hidden flex items-center justify-center shadow-sm">
                        <MuscleAnatomyVisual
                          imageUrl={item.image_url || resolveExerciseImage(item) || item.muscle_diagram_url}
                          muscleGroup={item.primary_muscle || item.name}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-sm text-zinc-950 leading-snug line-clamp-2">
                          {item.name}
                        </span>
                        {item.primary_muscle && (
                          <span className="inline-block text-[10px] font-bold text-blue-600 mt-0.5">
                            {item.primary_muscle}
                          </span>
                        )}
                      </div>

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
                      {/* Weight */}
                      <div className="bg-white border border-zinc-200 rounded-2xl px-3 py-2.5 focus-within:border-blue-600/60 transition-colors">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-0.5">
                          Mức tạ
                        </span>
                        <div className="flex items-baseline gap-1">
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
                            className="w-full min-w-0 bg-transparent text-xl font-black text-blue-600 tabular-nums focus:outline-none"
                          />
                          <span className="text-xs font-bold text-zinc-500">kg</span>
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
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
                        Rep mục tiêu từng set
                      </span>
                      <div className="grid grid-cols-5 gap-1.5">
                        {item.target_reps.map((rep, setIdx) => (
                          <label
                            key={setIdx}
                            className="flex flex-col items-center bg-white border border-zinc-200 rounded-xl py-1.5 focus-within:border-blue-600/60 transition-colors"
                          >
                            <span className="text-[9px] font-bold text-zinc-500 uppercase">S{setIdx + 1}</span>
                            <input
                              type="number"
                              inputMode="numeric"
                              value={rep}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 1;
                                handleUpdateRepOfSet(idx, setIdx, val);
                              }}
                              className="w-full bg-transparent text-center text-base font-black text-zinc-950 tabular-nums focus:outline-none"
                            />
                          </label>
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

/**
 * BẢN ĐỒ GIẢI PHẪU CƠ BẮP CHUYÊN SÂU PHONG CÁCH LYFTA
 * Nền tối sang trọng, hiển thị chi tiết các khối cơ nổi bật màu đỏ rực (#ef4444)
 * Tự động chuyển mặt trước (Anterior) hoặc mặt sau (Posterior) tương ứng với từng bài tập
 */
function MuscleAnatomyVisual({ imageUrl, muscleGroup }: { imageUrl?: string; muscleGroup: string }) {
  const [imgError, setImgError] = useState(false);

  // Nếu link ảnh ngoài load được thì ưu tiên hiển thị
  if (imageUrl && !imgError) {
    return (
      <img
        src={imageUrl}
        alt={muscleGroup}
        loading="lazy"
        onError={() => setImgError(true)}
        className="w-full h-full object-contain bg-white rounded-2xl"
      />
    );
  }

  const name = muscleGroup.toLowerCase();

  // Nhận diện vùng cơ
  const isChest = name.includes('ngực') || name.includes('chest') || name.includes('bench') || name.includes('pushup') || name.includes('fly');
  const isBack = name.includes('xô') || name.includes('lưng') || name.includes('lat') || name.includes('row') || name.includes('deadlift') || name.includes('pull');
  const isShoulders = name.includes('vai') || name.includes('shoulder') || name.includes('press') || name.includes('deltoid') || name.includes('raise');
  const isBiceps = name.includes('tay trước') || name.includes('bicep') || name.includes('curl');
  const isTriceps = name.includes('tay sau') || name.includes('tricep') || name.includes('skull') || name.includes('pushdown') || name.includes('kickback');
  const isLegs = name.includes('chân') || name.includes('đùi') || name.includes('squat') || name.includes('press') || name.includes('lunge');
  const isHamstringsGlutes = name.includes('đùi sau') || name.includes('mông') || name.includes('rdl') || name.includes('thrust') || name.includes('curl');
  const isAbs = name.includes('bụng') || name.includes('lõi') || name.includes('crunch') || name.includes('plank') || name.includes('wood') || name.includes('twist');
  const isCalves = name.includes('bắp chân') || name.includes('calf');

  // Nếu bài tác động mặt sau (Lưng, Xô, Tay sau, Mông, Đùi sau) -> Vẽ mặt lưng (Posterior)
  const isPosterior = (isBack || isTriceps || isHamstringsGlutes) && !isChest && !isAbs;

  const red = '#ef4444';
  const redGlow = '#f87171';
  const bodyBase = '#334155';
  const strokeColor = '#1e293b';

  return (
    <div className="w-full h-full flex flex-col items-center justify-center select-none">
      <svg viewBox="0 0 100 135" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* ĐẦU */}
        <circle cx="50" cy="13" r="8" fill={bodyBase} stroke={strokeColor} strokeWidth="1" />

        {isPosterior ? (
          /* ===== MẶT SAU (POSTERIOR VIEW) ===== */
          <g>
            {/* Cổ & Cầu vai sau */}
            <path d="M42 20 L58 20 L68 28 L32 28 Z" fill={isBack || isShoulders ? red : bodyBase} stroke={strokeColor} strokeWidth="1" />

            {/* Vai sau */}
            <circle cx="28" cy="30" r="6" fill={isShoulders ? red : bodyBase} stroke={strokeColor} strokeWidth="1" />
            <circle cx="72" cy="30" r="6" fill={isShoulders ? red : bodyBase} stroke={strokeColor} strokeWidth="1" />

            {/* Cánh tay & Tay sau (Triceps) */}
            <rect x="20" y="34" width="7.5" height="18" rx="3.5" fill={isTriceps ? red : bodyBase} stroke={strokeColor} strokeWidth="1" />
            <rect x="72.5" y="34" width="7.5" height="18" rx="3.5" fill={isTriceps ? red : bodyBase} stroke={strokeColor} strokeWidth="1" />
            <rect x="18.5" y="54" width="6.5" height="17" rx="3" fill={bodyBase} stroke={strokeColor} strokeWidth="1" />
            <rect x="75" y="54" width="6.5" height="17" rx="3" fill={bodyBase} stroke={strokeColor} strokeWidth="1" />

            {/* Lưng trên & Khối cơ Xô (Lats) */}
            <path d="M34 28 H66 L60 52 L50 56 L40 52 Z" fill={isBack ? red : bodyBase} stroke={strokeColor} strokeWidth="1" />
            {isBack && <path d="M38 34 Q50 44 62 34" stroke={redGlow} strokeWidth="1.5" strokeLinecap="round" />}

            {/* Lưng dưới */}
            <path d="M40 52 H60 L57 65 H43 Z" fill={isBack ? red : bodyBase} stroke={strokeColor} strokeWidth="1" />

            {/* Cơ Mông (Glutes) */}
            <ellipse cx="43" cy="71" rx="7" ry="6.5" fill={isHamstringsGlutes ? red : bodyBase} stroke={strokeColor} strokeWidth="1" />
            <ellipse cx="57" cy="71" rx="7" ry="6.5" fill={isHamstringsGlutes ? red : bodyBase} stroke={strokeColor} strokeWidth="1" />

            {/* Đùi sau (Hamstrings) */}
            <rect x="36" y="77" width="10" height="25" rx="5" fill={isHamstringsGlutes ? red : bodyBase} stroke={strokeColor} strokeWidth="1" />
            <rect x="54" y="77" width="10" height="25" rx="5" fill={isHamstringsGlutes ? red : bodyBase} stroke={strokeColor} strokeWidth="1" />

            {/* Bắp chân sau (Calves) */}
            <rect x="37" y="104" width="8" height="23" rx="4" fill={isCalves ? red : bodyBase} stroke={strokeColor} strokeWidth="1" />
            <rect x="55" y="104" width="8" height="23" rx="4" fill={isCalves ? red : bodyBase} stroke={strokeColor} strokeWidth="1" />
          </g>
        ) : (
          /* ===== MẶT TRƯỚC (ANTERIOR VIEW) ===== */
          <g>
            {/* Cổ & Cầu vai trước */}
            <path d="M44 20 L56 20 L63 27 L37 27 Z" fill={isShoulders ? red : bodyBase} stroke={strokeColor} strokeWidth="1" />

            {/* Khối vai trước & vai giữa */}
            <circle cx="28" cy="29" r="6" fill={isShoulders ? red : bodyBase} stroke={strokeColor} strokeWidth="1" />
            <circle cx="72" cy="29" r="6" fill={isShoulders ? red : bodyBase} stroke={strokeColor} strokeWidth="1" />

            {/* Cơ Ngực (Pectoralis Major) */}
            <path d="M35 27 H49 V42 H37 Z" rx="2" fill={isChest ? red : bodyBase} stroke={strokeColor} strokeWidth="1" />
            <path d="M51 27 H65 V42 H53 Z" rx="2" fill={isChest ? red : bodyBase} stroke={strokeColor} strokeWidth="1" />

            {/* Tay trước (Biceps) */}
            <rect x="20" y="34" width="7.5" height="18" rx="3.5" fill={isBiceps ? red : bodyBase} stroke={strokeColor} strokeWidth="1" />
            <rect x="72.5" y="34" width="7.5" height="18" rx="3.5" fill={isBiceps ? red : bodyBase} stroke={strokeColor} strokeWidth="1" />

            {/* Cẳng tay */}
            <rect x="18.5" y="54" width="6.5" height="17" rx="3" fill={name.includes('cẳng tay') ? red : bodyBase} stroke={strokeColor} strokeWidth="1" />
            <rect x="75" y="54" width="6.5" height="17" rx="3" fill={name.includes('cẳng tay') ? red : bodyBase} stroke={strokeColor} strokeWidth="1" />

            {/* Cơ Bụng (6 Múi) */}
            <g fill={isAbs ? red : bodyBase} stroke={strokeColor} strokeWidth="0.8">
              <rect x="42" y="44" width="7" height="6.5" rx="1.5" />
              <rect x="51" y="44" width="7" height="6.5" rx="1.5" />
              <rect x="42" y="52" width="7" height="6.5" rx="1.5" />
              <rect x="51" y="52" width="7" height="6.5" rx="1.5" />
              <rect x="43" y="60" width="6.5" height="6" rx="1.5" />
              <rect x="50.5" y="60" width="6.5" height="6" rx="1.5" />
            </g>

            {/* Đùi trước (Quadriceps) */}
            <rect x="36" y="69" width="10.5" height="30" rx="5" fill={isLegs ? red : bodyBase} stroke={strokeColor} strokeWidth="1" />
            <rect x="53.5" y="69" width="10.5" height="30" rx="5" fill={isLegs ? red : bodyBase} stroke={strokeColor} strokeWidth="1" />

            {/* Bắp chân trước */}
            <rect x="37" y="103" width="8" height="24" rx="4" fill={isCalves ? red : bodyBase} stroke={strokeColor} strokeWidth="1" />
            <rect x="55" y="103" width="8" height="24" rx="4" fill={isCalves ? red : bodyBase} stroke={strokeColor} strokeWidth="1" />
          </g>
        )}
      </svg>
    </div>
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
