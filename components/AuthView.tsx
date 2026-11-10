'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ArrowRight, Check, Dumbbell, Loader2, Triangle } from 'lucide-react';
import { useFeedback } from '@/components/FeedbackProvider';

export default function AuthView({ onAuthSuccess }: { onAuthSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [tempUserId, setTempUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { notify } = useFeedback();

  // Đăng nhập / Đăng ký Email
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        notify(error.message, { desc: 'Sign up failed. Please check your details and try again.', kind: 'error' });
      } else if (data.user) {
        setTempUserId(data.user.id);
        setShowOnboarding(true);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) notify(error.message, { desc: 'Log in failed. Please check your email and password.', kind: 'error' });
      else onAuthSuccess();
    }
    setLoading(false);
  };

  // Đăng nhập Google
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  };

  // Lưu lựa chọn Onboarding tạ lẻ
  const handleSelectMicroplates = async (hasMicroplates: boolean) => {
    if (!tempUserId) return;
    await supabase.from('profiles').upsert({
      id: tempUserId,
      email: email,
      has_microplates: hasMicroplates
    });
    onAuthSuccess();
  };

  if (showOnboarding) {
    return (
      <main className="relative min-h-screen text-ink overflow-hidden">
        <div className="relative max-w-md mx-auto min-h-screen bg-paper px-6 pt-[calc(2.5rem+env(safe-area-inset-top))] pb-[calc(2.5rem+env(safe-area-inset-bottom))] flex flex-col">
          <div className="flex items-center gap-2 mb-10">
            <span className="h-1 flex-1 rounded-full bg-accent" />
            <span className="h-1 flex-1 rounded-full bg-accent" />
            <span className="text-[11px] font-bold tracking-widest text-muted ml-2">2/2</span>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-accent mb-3">
              Gym setup
            </p>
            <h1 className="text-[34px] font-bold tracking-tight text-balance leading-[1.1] mb-3">
              Does your gym have small plates?
            </h1>
            <p className="text-muted text-sm leading-relaxed mb-8 text-pretty">
              Plates of 0.5 kg, 1 kg, 1.25 kg or dumbbells 1–2 kg apart. Helps the app pick your next jump.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleSelectMicroplates(true)}
                className="group w-full text-left bg-accent hover:bg-accent-hover text-white rounded-2xl p-5 flex items-center gap-4 shadow-md shadow-accent/25 transition-all active:scale-[0.98]"
              >
                <span className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5" strokeWidth={3} aria-hidden="true" />
                </span>
                <span className="flex-1">
                  <span className="block font-bold text-base">Yes, small plates</span>
                  <span className="block text-xs text-white/90 mt-0.5">Smaller, smoother jumps</span>
                </span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
              </button>

              <button
                onClick={() => handleSelectMicroplates(false)}
                className="group w-full text-left bg-white border border-line hover:border-muted rounded-2xl p-5 flex items-center gap-4 transition-all active:scale-[0.98]"
              >
                <span className="w-11 h-11 rounded-xl bg-[#f0eee9] text-ink flex items-center justify-center shrink-0">
                  <Dumbbell className="w-5 h-5" aria-hidden="true" />
                </span>
                <span className="flex-1">
                  <span className="block font-bold text-base">No, big plates only</span>
                  <span className="block text-xs text-muted mt-0.5">Add reps before adding weight</span>
                </span>
                <ArrowRight className="w-5 h-5 text-muted group-hover:text-ink group-hover:translate-x-0.5 transition-all" aria-hidden="true" />
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-muted mt-8">You can change this later.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen text-ink overflow-hidden">
      <div className="relative max-w-md mx-auto min-h-screen bg-paper px-6 pt-[calc(2.5rem+env(safe-area-inset-top))] pb-[calc(2.5rem+env(safe-area-inset-bottom))] flex flex-col">
        <header className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-[10px] bg-accent text-white flex items-center justify-center">
            <Triangle className="w-4 h-4" fill="currentColor" strokeWidth={0} aria-hidden="true" />
          </span>
          <span className="text-[12px] font-semibold tracking-[0.05em] text-muted">PROGRESSIVE OVERLOAD</span>
        </header>

        <h1 className="mt-5 text-[52px] font-bold tracking-tight leading-[1.06]">
          Lift a little <span className="text-accent">more</span> each time.
        </h1>

        <div className="h-[72px] shrink-0" />

        <div className="bg-white border border-line rounded-[14px] p-1 grid grid-cols-2 mb-[14px]" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={!isSignUp}
            onClick={() => setIsSignUp(false)}
            className={`h-[36px] rounded-[10px] text-[13px] font-bold transition-colors ${
              !isSignUp ? 'text-ink' : 'text-muted font-semibold hover:text-ink'
            }`}
          >
            Log in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isSignUp}
            onClick={() => setIsSignUp(true)}
            className={`h-[36px] rounded-[10px] text-[13px] font-bold transition-colors ${
              isSignUp ? 'text-ink' : 'text-muted font-semibold hover:text-ink'
            }`}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleAuth} className="flex flex-col gap-3">
          <label className="block">
            <span className="sr-only">Email</span>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full h-[52px] bg-white border border-line rounded-2xl px-4 text-ink placeholder:text-muted focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all"
            />
          </label>

          <label className="relative block">
            <span className="sr-only">Password</span>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              className="w-full h-[52px] bg-white border border-line rounded-2xl pl-4 pr-20 text-ink placeholder:text-muted focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 min-h-10 px-3 rounded-xl bg-[#f0eee9] text-xs font-bold text-muted hover:text-ink transition-colors"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="group mt-0.5 w-full bg-accent hover:bg-accent-hover disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] transition-all text-white font-bold py-4 rounded-2xl shadow-md shadow-accent/25 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                Processing...
              </>
            ) : (
              <>{isSignUp ? 'Sign Up →' : 'Log In →'}</>
            )}
          </button>
        </form>

        <button
          onClick={handleGoogleLogin}
          className="mt-3 w-full min-h-[50px] bg-transparent text-ink border border-line rounded-2xl text-[14px] font-semibold flex items-center justify-center hover:bg-white active:scale-[0.98] transition-all"
        >
          Continue with Google
        </button>

        <p className="text-center text-[13px] text-muted mt-5">
          {isSignUp ? 'Already have an account?' : 'New here?'}{' '}
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-accent font-bold hover:text-accent-hover transition-colors"
          >
            {isSignUp ? 'Log in' : 'Create an account'}
          </button>
        </p>
      </div>
    </main>
  );
}
