'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Activity,
  ArrowRight,
  Check,
  Dumbbell,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  TrendingUp,
  Weight,
} from 'lucide-react';
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
        notify(error.message, { desc: 'Đăng ký chưa thành công, kiểm tra lại giúp mình.', kind: 'error' });
      } else if (data.user) {
        setTempUserId(data.user.id);
        setShowOnboarding(true);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) notify(error.message, { desc: 'Đăng nhập chưa thành công, kiểm tra lại giúp mình.', kind: 'error' });
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
      <main className="relative min-h-screen bg-white text-zinc-950 overflow-hidden">
        <div className="relative max-w-md mx-auto min-h-screen px-6 py-10 flex flex-col">
          <div className="flex items-center gap-2 mb-10">
            <span className="h-1 flex-1 rounded-full bg-blue-600" />
            <span className="h-1 flex-1 rounded-full bg-blue-600" />
            <span className="text-[11px] font-bold tracking-widest text-zinc-500 ml-2">2/2</span>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <div className="w-14 h-14 bg-blue-600/10 border border-blue-600/20 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
              <Weight className="w-7 h-7" aria-hidden="true" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600 mb-2">
              Thiết lập phòng tập
            </p>
            <h1 className="text-3xl font-black tracking-tight text-balance leading-tight mb-3">
              Phòng tập của bạn có tạ lẻ không?
            </h1>
            <p className="text-zinc-500 text-sm leading-relaxed mb-8 text-pretty">
              Bánh tạ <span className="text-zinc-950 font-semibold">0.5kg, 1kg, 1.25kg</span> hoặc tạ đơn cách nhau 1-2kg.
              Thông tin này giúp thuật toán tính mức tăng tạ chính xác cho bạn.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleSelectMicroplates(true)}
                className="group w-full text-left bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-blue-600/50 rounded-2xl p-5 flex items-center gap-4 transition-all active:scale-[0.98]"
              >
                <span className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5" strokeWidth={3} aria-hidden="true" />
                </span>
                <span className="flex-1">
                  <span className="block font-black text-base">Có tạ lẻ nhỏ</span>
                  <span className="block text-xs text-zinc-500 mt-0.5">Tăng tiến mượt, bước nhảy nhỏ</span>
                </span>
                <ArrowRight className="w-5 h-5 text-zinc-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" aria-hidden="true" />
              </button>

              <button
                onClick={() => handleSelectMicroplates(false)}
                className="group w-full text-left bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-zinc-400 rounded-2xl p-5 flex items-center gap-4 transition-all active:scale-[0.98]"
              >
                <span className="w-11 h-11 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center shrink-0">
                  <Dumbbell className="w-5 h-5" aria-hidden="true" />
                </span>
                <span className="flex-1">
                  <span className="block font-black text-base">Không, toàn tạ to</span>
                  <span className="block text-xs text-zinc-500 mt-0.5">Ưu tiên tăng số rep trước khi tăng tạ</span>
                </span>
                <ArrowRight className="w-5 h-5 text-zinc-400 group-hover:text-zinc-950 group-hover:translate-x-0.5 transition-all" aria-hidden="true" />
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-zinc-400 mt-8">Bạn có thể thay đổi lựa chọn này sau.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-white text-zinc-950 overflow-hidden">
      <div className="relative max-w-md mx-auto min-h-screen px-6 py-10 flex flex-col justify-center">
        <header className="mb-10">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-6 shadow-lg shadow-blue-600/20">
            <Activity className="w-6 h-6" strokeWidth={2.5} aria-hidden="true" />
          </div>
          <h1 className="text-4xl font-black tracking-tight leading-none">
            GYM<br />
            <span className="text-blue-600">PROGRESSION</span>
          </h1>
          <p className="text-zinc-500 text-sm mt-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" aria-hidden="true" />
            Đẩy tạ khoa học - Tự động tăng tiến
          </p>
        </header>

        <div className="bg-white border border-zinc-200 rounded-3xl p-1 grid grid-cols-2 mb-6" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={!isSignUp}
            onClick={() => setIsSignUp(false)}
            className={`py-2.5 rounded-[1.25rem] text-sm font-bold transition-all ${
              !isSignUp ? 'bg-zinc-100 text-zinc-950 shadow' : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isSignUp}
            onClick={() => setIsSignUp(true)}
            className={`py-2.5 rounded-[1.25rem] text-sm font-bold transition-all ${
              isSignUp ? 'bg-zinc-100 text-zinc-950 shadow' : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            Đăng ký
          </button>
        </div>

        <form onSubmit={handleAuth} className="flex flex-col gap-3">
          <label className="group relative block">
            <span className="sr-only">Email</span>
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-blue-600 transition-colors" aria-hidden="true" />
            <input
              type="email"
              placeholder="Email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full bg-white border border-zinc-200 rounded-2xl pl-11 pr-4 py-4 text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:border-blue-600/60 focus:ring-4 focus:ring-blue-600/10 transition-all"
            />
          </label>

          <label className="group relative block">
            <span className="sr-only">Mật khẩu</span>
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-blue-600 transition-colors" aria-hidden="true" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              className="w-full bg-white border border-zinc-200 rounded-2xl pl-11 pr-12 py-4 text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:border-blue-600/60 focus:ring-4 focus:ring-blue-600/10 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl flex items-center justify-center text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="group mt-2 w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] transition-all text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                Đang xử lý...
              </>
            ) : (
              <>
                {isSignUp ? 'ĐĂNG KÝ' : 'ĐĂNG NHẬP'}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <span className="h-px flex-1 bg-zinc-100" />
          <span className="text-zinc-400 text-[11px] font-bold uppercase tracking-widest">Hoặc</span>
          <span className="h-px flex-1 bg-zinc-100" />
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full bg-white text-zinc-950 border border-zinc-200 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-zinc-200 active:scale-[0.98] transition-all"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.94l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
          </svg>
          Tiếp tục với Google
        </button>

        <p className="text-center text-sm text-zinc-500 mt-8">
          {isSignUp ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}{' '}
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-blue-600 font-bold hover:text-blue-500 transition-colors"
          >
            {isSignUp ? 'Đăng nhập ngay' : 'Đăng ký miễn phí'}
          </button>
        </p>
      </div>
    </main>
  );
}
