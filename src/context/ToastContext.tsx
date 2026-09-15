import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../lib/store';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (toast: { title: string; message: string; type?: ToastType; duration?: number }) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const store = useStore();

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback(({ 
    title, 
    message, 
    type = 'success', 
    duration = 4500 
  }: { 
    title: string; 
    message: string; 
    type?: ToastType; 
    duration?: number 
  }) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newToast: ToastItem = { id, title, message, type, duration };
    
    setToasts(prev => [...prev.slice(-4), newToast]); // Mantener máximo 5 visibles

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  // Suscribirse a eventos automáticos del DataStore
  useEffect(() => {
    const unsubscribe = store.onNotification?.((notification: { title: string; message: string; type?: ToastType }) => {
      showToast(notification);
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [store, showToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      {/* Toast Container */}
      <div 
        className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0"
        aria-live="polite"
      >
        {toasts.map(toast => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';
          const isInfo = toast.type === 'info';

          return (
            <div
              key={toast.id}
              className={cn(
                "pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl transition-all animate-in slide-in-from-bottom-5 fade-in duration-200 bg-white",
                isSuccess && "border-emerald-200 bg-emerald-50/90 text-emerald-950",
                isError && "border-red-200 bg-red-50/90 text-red-950",
                isWarning && "border-amber-200 bg-amber-50/90 text-amber-950",
                isInfo && "border-sky-200 bg-sky-50/90 text-sky-950"
              )}
            >
              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                {isError && <AlertCircle className="w-5 h-5 text-red-600" />}
                {isWarning && <AlertTriangle className="w-5 h-5 text-amber-600" />}
                {isInfo && <Info className="w-5 h-5 text-sky-600" />}
              </div>

              <div className="flex-1 min-w-0 pr-2">
                <h4 className={cn(
                  "text-sm font-bold leading-tight",
                  isSuccess && "text-emerald-900",
                  isError && "text-red-900",
                  isWarning && "text-amber-900",
                  isInfo && "text-sky-900"
                )}>
                  {toast.title}
                </h4>
                <p className={cn(
                  "text-xs mt-0.5 leading-relaxed",
                  isSuccess && "text-emerald-700",
                  isError && "text-red-700",
                  isWarning && "text-amber-700",
                  isInfo && "text-sky-700"
                )}>
                  {toast.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-black/5 transition-colors"
              >
                <X className="w-4 h-4" />
                <span className="sr-only">Cerrar</span>
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
