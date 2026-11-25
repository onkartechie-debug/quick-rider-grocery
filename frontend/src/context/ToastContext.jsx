import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const STYLES = {
  success: { icon: CheckCircle2, className: 'border-emerald-200 bg-white text-slate-800', iconClass: 'text-emerald-600' },
  error: { icon: AlertCircle, className: 'border-rose-200 bg-white text-slate-800', iconClass: 'text-rose-600' },
  info: { icon: Info, className: 'border-slate-200 bg-white text-slate-800', iconClass: 'text-sky-600' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (type, message) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((list) => [...list.slice(-2), { id, type, message }]);
      setTimeout(() => dismiss(id), 4200);
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      success: (message) => push('success', message),
      error: (message) => push('error', message),
      info: (message) => push('info', message),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-4" aria-live="polite">
        {toasts.map((toast) => {
          const style = STYLES[toast.type];
          const Icon = style.icon;
          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto flex w-full max-w-sm animate-slide-down items-start gap-3 rounded-2xl border px-4 py-3 shadow-lift ${style.className}`}
            >
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${style.iconClass}`} />
              <p className="flex-1 text-sm font-medium">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="rounded-lg p-0.5 text-slate-400 hover:text-slate-600"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
