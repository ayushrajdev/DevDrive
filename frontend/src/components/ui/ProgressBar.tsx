import React from 'react';
import { cn } from '@/lib/cn';

export function ProgressBar({
    value,
    label,
    className,
    barClassName,
    tone = 'brand',
}: {
    value: number;
    label: string;
    className?: string;
    barClassName?: string;
    tone?: 'brand' | 'auto';
}) {
    const pct = Math.max(0, Math.min(100, value));
    const color =
        tone === 'auto'
            ? pct >= 90
                ? 'bg-danger-500'
                : pct >= 75
                  ? 'bg-warning-500'
                  : 'bg-brand-500'
            : 'bg-brand-500';
    return (
        <div
            role="progressbar"
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pct)}
            className={cn('h-2 w-full overflow-hidden rounded-full bg-surface-hover', className)}
        >
            <div
                className={cn('h-full rounded-full transition-[width] duration-300', color, barClassName)}
                style={{ width: `${pct}%` }}
            />
        </div>
    );
}
