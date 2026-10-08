'use client';

import { useState } from 'react';
import AuthView from '@/components/AuthView';
import DashboardView from '@/components/DashboardView';
import ActiveWorkoutScreen from '@/components/ActiveWorkoutScreen';

type View = 'auth' | 'dashboard' | 'workout';

export default function Page() {
  const [view, setView] = useState<View>('auth');
  const [routine, setRoutine] = useState({ id: 'r1', name: 'Push Day — Ngực & Vai' });

  const tabs: { key: View; label: string }[] = [
    { key: 'auth', label: 'Đăng nhập' },
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'workout', label: 'Đang tập' },
  ];

  return (
    <>
      <nav
        aria-label="Chọn màn hình xem trước"
        className="mx-auto mt-3 flex w-fit gap-1 rounded-full border border-zinc-200 bg-zinc-50 p-1"
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setView(t.key)}
            aria-pressed={view === t.key}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              view === t.key ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-zinc-950'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {view === 'auth' && <AuthView onAuthSuccess={() => setView('dashboard')} />}
      {view === 'dashboard' && (
        <DashboardView
          onStartWorkout={(id, name) => {
            setRoutine({ id, name });
            setView('workout');
          }}
        />
      )}
      {view === 'workout' && (
        <ActiveWorkoutScreen
          key={routine.id}
          routineId={routine.id}
          routineName={routine.name}
          onBack={() => setView('dashboard')}
        />
      )}
    </>
  );
}
