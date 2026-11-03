'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/lib/cn';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
    id: number;
    message: string;
    variant: ToastVariant;
}

interface ToastApi {
    show: (message: string, variant?: ToastVariant) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
}

const ToastContext = createContext<ToastApi | undefined>(undefined);

const DURATION_MS = 4000;

const toneClass: Record<ToastVariant, string> = {
    success: 'border-success-600/50 text-success-300',
    error: 'border-danger-700/60 text-danger-300',
    info: 'border-brand-700/60 text-brand-200',
};

const ToneIcon: Record<ToastVariant, React.ElementType> = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
};

function ToastView({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
    useEffect(() => {
        const t = setTimeout(() => onDismiss(toast.id), DURATION_MS);
        return () => clearTimeout(t);
    }, [toast.id, onDismiss]);

    const Icon = ToneIcon[toast.variant];
    return (
        <div
            className={cn(
                'pointer-events-auto flex w-full items-start gap-2.5 rounded-lg border bg-surface-raised px-4 py-3 text-sm font-medium shadow-overlay animate-slide-up',
                toneClass[toast.variant],
            )}
        >
            <Icon aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="min-w-0 flex-1 break-words">{toast.message}</span>
            <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                aria-label="Dismiss notification"
                className="-m-1 rounded p-1 opacity-70 transition-opacity hover:opacity-100"
            >
                <X className="h-4 w-4" aria-hidden />
            </button>
        </div>
    );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const counter = useRef(0);

    const dismiss = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const show = useCallback((message: string, variant: ToastVariant = 'info') => {
        counter.current += 1;
        const id = counter.current;
        setToasts((prev) => [...prev.slice(-3), { id, message, variant }]);
    }, []);

    const [api] = useState<ToastApi>(() => ({
        show: (m, v) => show(m, v),
        success: (m) => show(m, 'success'),
        error: (m) => show(m, 'error'),
        info: (m) => show(m, 'info'),
    }));

    return (
        <ToastContext.Provider value={api}>
            {children}
            <div
                aria-live="polite"
                aria-atomic="false"
                className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] mx-auto flex w-full max-w-sm flex-col gap-2 p-4 sm:right-0 sm:left-auto sm:mx-0"
            >
                {toasts.map((t) => (
                    <ToastView key={t.id} toast={t} onDismiss={dismiss} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast(): ToastApi {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within a ToastProvider');
    return ctx;
}
