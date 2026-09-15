import React, { useEffect } from 'react';
import { cn } from '../../lib/utils';
import { Loader2, AlertCircle, FileSearch, X } from 'lucide-react';

export function Badge({ 
  children, 
  variant = 'info',
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { 
  children: React.ReactNode; 
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  className?: string;
}) {
  const variants = {
    success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-100 text-amber-800 border-amber-200',
    danger: 'bg-red-100 text-red-800 border-red-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    neutral: 'bg-slate-100 text-slate-800 border-slate-200',
  };

  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border uppercase tracking-wider", variants[variant], className)} {...props}>
      {children}
    </span>
  );
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}) {
  const base = "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary: "bg-brand-primary text-white hover:bg-brand-primary-hover focus:ring-brand-primary",
    secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-slate-500",
    ghost: "bg-transparent text-brand-primary hover:bg-blue-50 focus:ring-brand-primary",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-600",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
}

export function SidePanel({
  isOpen,
  onClose,
  title,
  children
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div 
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 rounded-full">
            <X className="w-5 h-5" />
            <span className="sr-only">Cerrar panel</span>
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

export function LoadingState({ text = 'Cargando...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-slate-500">
      <Loader2 className="w-8 h-8 animate-spin mb-4 text-brand-primary" />
      <p className="text-sm font-medium">{text}</p>
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string, description: string, action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-slate-200 rounded-xl border-dashed">
      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <FileSearch className="w-6 h-6 text-slate-400" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6">{description}</p>
      {action}
    </div>
  );
}

export function ErrorState({ title = 'Ocurrió un error', message, onRetry }: { title?: string, message: string, onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-red-100 rounded-xl">
      <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6 text-red-500" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>Reintentar</Button>
      )}
    </div>
  );
}
