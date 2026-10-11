'use client';

import { useEffect, useState } from 'react';
import AuthView from '@/components/AuthView';
import DashboardView from '@/components/DashboardView';
import ActiveWorkoutScreen from '@/components/ActiveWorkoutScreen';
import FeedbackProvider from '@/components/FeedbackProvider';
import { supabase } from '@/lib/supabaseClient';

type View = 'auth' | 'dashboard' | 'workout';

export default function Page() {
  const [view, setView] = useState<View>('auth');
  const [routine, setRoutine] = useState({ id: 'r1', name: 'Push Day — Ngực & Vai' });

  // Tự động vào dashboard nếu đã có session, không dùng thanh chuyển tab thủ công.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }: any) => {
      if (data?.session?.user) setView('dashboard');
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      if (event === 'SIGNED_IN' && session?.user) setView('dashboard');
      if (event === 'SIGNED_OUT') setView('auth');
    });
    return () => {
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  return (
    <FeedbackProvider>
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
    </FeedbackProvider>
  );
}
