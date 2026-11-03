import React, { useId } from 'react';
import { cn } from '@/lib/cn';

const controlBase =
    'w-full rounded-lg border bg-canvas px-3.5 text-sm text-fg placeholder:text-fg-subtle transition-colors ' +
    'focus:outline-none focus-visible:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 ' +
    'disabled:cursor-not-allowed disabled:opacity-60';

function FieldShell({
    id,
    label,
    hint,
    error,
    className,
    children,
}: {
    id: string;
    label?: string;
    hint?: string;
    error?: string | null;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div className={cn('space-y-1.5', className)}>
            {label && (
                <label htmlFor={id} className="block text-xs font-medium text-fg-muted">
                    {label}
                </label>
            )}
            {children}
            {error ? (
                <p id={`${id}-error`} role="alert" className="text-xs text-danger-400">
                    {error}
                </p>
            ) : hint ? (
                <p id={`${id}-hint`} className="text-xs text-fg-subtle">
                    {hint}
                </p>
            ) : null}
        </div>
    );
}

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
    label?: string;
    hint?: string;
    error?: string | null;
    icon?: React.ReactNode;
    wrapperClassName?: string;
}

export function Input({
    label,
    hint,
    error,
    icon,
    className,
    wrapperClassName,
    id,
    ...rest
}: InputProps) {
    const autoId = useId();
    const inputId = id || autoId;
    return (
        <FieldShell id={inputId} label={label} hint={hint} error={error} className={wrapperClassName}>
            <div className="relative">
                {icon && (
                    <span
                        aria-hidden
                        className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-fg-subtle [&>svg]:h-4 [&>svg]:w-4"
                    >
                        {icon}
                    </span>
                )}
                <input
                    id={inputId}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
                    className={cn(
                        controlBase,
                        'h-10',
                        icon ? 'pl-10' : '',
                        error ? 'border-danger-500' : 'border-line',
                        className,
                    )}
                    {...rest}
                />
            </div>
        </FieldShell>
    );
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    hint?: string;
    error?: string | null;
    wrapperClassName?: string;
    inputSize?: 'sm' | 'md';
}

export function Select({
    label,
    hint,
    error,
    className,
    wrapperClassName,
    inputSize = 'md',
    id,
    children,
    ...rest
}: SelectProps) {
    const autoId = useId();
    const selectId = id || autoId;
    return (
        <FieldShell id={selectId} label={label} hint={hint} error={error} className={wrapperClassName}>
            <select
                id={selectId}
                aria-invalid={error ? true : undefined}
                className={cn(
                    controlBase,
                    inputSize === 'sm' ? 'h-8 px-2.5 text-xs' : 'h-10',
                    error ? 'border-danger-500' : 'border-line',
                    className,
                )}
                {...rest}
            >
                {children}
            </select>
        </FieldShell>
    );
}
