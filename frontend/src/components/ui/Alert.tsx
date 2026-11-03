import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/cn';

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

const styles: Record<AlertVariant, { box: string; icon: string; Icon: React.ElementType }> = {
    info: { box: 'border-brand-800 bg-brand-950/60 text-brand-100', icon: 'text-brand-300', Icon: Info },
    success: { box: 'border-success-600/40 bg-success-950/70 text-success-300', icon: 'text-success-400', Icon: CheckCircle2 },
    warning: { box: 'border-warning-600/40 bg-warning-950/70 text-warning-300', icon: 'text-warning-400', Icon: AlertTriangle },
    danger: { box: 'border-danger-700/50 bg-danger-950/70 text-danger-300', icon: 'text-danger-400', Icon: AlertCircle },
};

export interface AlertProps {
    variant?: AlertVariant;
    children: React.ReactNode;
    action?: React.ReactNode;
    onDismiss?: () => void;
    className?: string;
}

export function Alert({ variant = 'info', children, action, onDismiss, className }: AlertProps) {
    const { box, icon, Icon } = styles[variant];
    return (
        <div
            role={variant === 'danger' ? 'alert' : 'status'}
            className={cn('flex items-start gap-3 rounded-lg border px-4 py-3 text-sm', box, className)}
        >
            <Icon aria-hidden className={cn('mt-0.5 h-4 w-4 shrink-0', icon)} />
            <div className="min-w-0 flex-1 break-words">{children}</div>
            {action}
            {onDismiss && (
                <button
                    type="button"
                    onClick={onDismiss}
                    aria-label="Dismiss"
                    className="-m-1 rounded p-1 opacity-70 transition-opacity hover:opacity-100"
                >
                    <X className="h-4 w-4" aria-hidden />
                </button>
            )}
        </div>
    );
}
