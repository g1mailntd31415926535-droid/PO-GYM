'use client';

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, Trash2, Trophy, X } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  title: string;
  desc?: string;
  kind: ToastKind;
}

interface ConfirmOptions {
  title: string;
  desc?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  celebration?: boolean;
}

interface FeedbackContextValue {
  notify: (title: string, opts?: { desc?: string; kind?: ToastKind; duration?: number }) => void;
  confirmDialog: (opts: ConfirmOptions) => Promise<boolean>;
  celebrate: (title: string, desc?: string) => void;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function useFeedback(): FeedbackContextValue {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useFeedback must be used inside <FeedbackProvider>');
  return ctx;
}

const KIND_STYLE: Record<ToastKind, { icon: React.ReactNode; bar: string; iconBox: string }> = {
  success: {
    icon: <CheckCircle2 className="w-5 h-5" aria-hidden="true" />,
    bar: 'bg-blue-600',
    iconBox: 'bg-blue-600/10 border-blue-600/20 text-blue-600',
  },
  error: {
    icon: <AlertTriangle className="w-5 h-5" aria-hidden="true" />,
    bar: 'bg-rose-500',
    iconBox: 'bg-rose-500/10 border-rose-500/20 text-rose-600',
  },
  info: {
    icon: <Info className="w-5 h-5" aria-hidden="true" />,
    bar: 'bg-zinc-400',
    iconBox: 'bg-zinc-100 border-zinc-200 text-zinc-600',
  },
};

export default function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirm, setConfirm] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);
  const [party, setParty] = useState<{ title: string; desc?: string } | null>(null);
  const idRef = useRef(1);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (title: string, opts?: { desc?: string; kind?: ToastKind; duration?: number }) => {
      const id = idRef.current++;
      const kind = opts?.kind || 'info';
      setToasts((prev) => [...prev.slice(-2), { id, title, desc: opts?.desc, kind }]);
      window.setTimeout(() => dismissToast(id), opts?.duration ?? 3800);
    },
    [dismissToast]
  );

  const confirmDialog = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirm({ ...opts, resolve });
    });
  }, []);

  const celebrate = useCallback((title: string, desc?: string) => {
    setParty({ title, desc });
  }, []);

  const closeConfirm = useCallback(
    (value: boolean) => {
      confirm?.resolve(value);
      setConfirm(null);
    },
    [confirm]
  );

  const value = useMemo(() => ({ notify, confirmDialog, celebrate }), [notify, confirmDialog, celebrate]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      {/* Toast stack — top center, cùng nhịp với app max-w-md */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2.5rem)] max-w-md flex flex-col gap-2 pointer-events-none" aria-live="polite">
        {toasts.map((t) => {
          const s = KIND_STYLE[t.kind];
          return (
            <div
              key={t.id}
              className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white/95 backdrop-blur px-4 py-3 shadow-2xl shadow-zinc-950/10 overflow-hidden"
            >
              <span aria-hidden="true" className={`w-1 self-stretch rounded-full ${s.bar}`} />
              <span className={`w-10 h-10 shrink-0 rounded-xl border flex items-center justify-center ${s.iconBox}`}>
                {s.icon}
              </span>
              <div className="flex-1 min-w-0 py-0.5">
                <p className="font-bold text-sm text-zinc-950 leading-snug">{t.title}</p>
                {t.desc && <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed whitespace-pre-line">{t.desc}</p>}
              </div>
              <button
                onClick={() => dismissToast(t.id)}
                aria-label="Đóng thông báo"
                className="w-7 h-7 shrink-0 rounded-lg text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Hộp xác nhận đẹp thay cho confirm() mặc định */}
      {confirm && (
        <div
          className="fixed inset-0 z-[110] bg-zinc-950/40 backdrop-blur-sm flex items-end sm:items-center justify-center"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="fb-confirm-title"
          onClick={() => closeConfirm(false)}
        >
          <div
            className="w-full max-w-md bg-white border border-zinc-200 rounded-t-[2rem] sm:rounded-[2rem] p-6 pb-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 shrink-0 rounded-2xl border flex items-center justify-center ${
                  confirm.danger
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-600'
                    : 'bg-blue-600/10 border-blue-600/20 text-blue-600'
                }`}
              >
                {confirm.danger ? <Trash2 className="w-5 h-5" aria-hidden="true" /> : <Info className="w-5 h-5" aria-hidden="true" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 id="fb-confirm-title" className="text-lg font-black tracking-tight leading-snug">
                  {confirm.title}
                </h3>
                {confirm.desc && <p className="text-sm text-zinc-500 mt-1 leading-relaxed">{confirm.desc}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                onClick={() => closeConfirm(false)}
                className="py-3.5 rounded-2xl font-bold text-sm bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-950 hover:border-zinc-300 active:scale-[0.98] transition-all"
              >
                {confirm.cancelLabel || 'Để lại'}
              </button>
              <button
                onClick={() => closeConfirm(true)}
                autoFocus
                className={`py-3.5 rounded-2xl font-black text-sm text-white active:scale-[0.98] transition-all ${
                  confirm.danger
                    ? 'bg-rose-500 hover:bg-rose-400 shadow-lg shadow-rose-500/20'
                    : 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20'
                }`}
              >
                {confirm.confirmLabel || 'Đồng ý'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Màn ăn mừng xong buổi tập thay cho alert() */}
      {party && (
        <div
          className="fixed inset-0 z-[110] bg-zinc-950/40 backdrop-blur-sm flex items-end sm:items-center justify-center"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="fb-party-title"
          onClick={() => setParty(null)}
        >
          <div
            className="w-full max-w-md bg-white border border-zinc-200 rounded-t-[2rem] sm:rounded-[2rem] p-6 pb-6 shadow-2xl text-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div aria-hidden="true" className="h-1.5 -mx-6 -mt-6 mb-6 bg-gradient-to-r from-blue-600 via-violet-500 to-blue-600" />
            <div className="w-16 h-16 rounded-3xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-600/25">
              <Trophy className="w-8 h-8" aria-hidden="true" />
            </div>
            <h3 id="fb-party-title" className="text-xl font-black tracking-tight mt-4">
              {party.title}
            </h3>
            {party.desc && (
              <p className="text-sm text-zinc-500 mt-2 leading-relaxed whitespace-pre-line">{party.desc}</p>
            )}
            <button
              onClick={() => setParty(null)}
              autoFocus
              className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black tracking-wide active:scale-[0.98] transition-all shadow-lg shadow-blue-600/20"
            >
              TUYỆT VỜI
            </button>
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  );
}
