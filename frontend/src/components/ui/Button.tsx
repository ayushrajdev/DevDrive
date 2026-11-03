import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-soft';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const variants: Record<ButtonVariant, string> = {
    primary:
        'bg-brand-600 text-white hover:bg-brand-500 active:bg-brand-700 shadow-glow border border-brand-500/60',
    secondary:
        'bg-surface-raised text-fg border border-line-strong hover:bg-surface-hover hover:border-fg-subtle',
    ghost: 'bg-transparent text-fg-muted border border-transparent hover:bg-surface-hover hover:text-fg',
    danger: 'bg-danger-600 text-white hover:bg-danger-500 border border-danger-500/60',
    'danger-soft':
        'bg-danger-950/70 text-danger-300 border border-danger-700/50 hover:bg-danger-950 hover:text-danger-300',
};

const sizes: Record<ButtonSize, string> = {
    sm: 'h-8 gap-1.5 px-3 text-xs',
    md: 'h-10 gap-2 px-4 text-sm',
    lg: 'h-12 gap-2.5 px-6 text-base',
    icon: 'h-9 w-9 p-0',
};

export function buttonClasses(
    variant: ButtonVariant = 'secondary',
    size: ButtonSize = 'md',
    className?: string,
): string {
    return cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-lg font-medium whitespace-nowrap transition-colors',
        'disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
    );
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export function Button({
    variant = 'secondary',
    size = 'md',
    loading = false,
    leftIcon,
    rightIcon,
    className,
    disabled,
    type = 'button',
    children,
    ...rest
}: ButtonProps) {
    return (
        <button
            type={type}
            disabled={disabled || loading}
            aria-busy={loading || undefined}
            className={buttonClasses(variant, size, className)}
            {...rest}
        >
            {loading ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : leftIcon}
            {children}
            {!loading && rightIcon}
        </button>
    );
}
