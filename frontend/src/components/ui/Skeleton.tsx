import React from 'react';
import { cn } from '@/lib/cn';

export function Skeleton({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            aria-hidden
            className={cn(
                'animate-shimmer rounded-md bg-[linear-gradient(90deg,var(--color-surface-raised)_25%,var(--color-surface-hover)_50%,var(--color-surface-raised)_75%)] bg-[length:200%_100%]',
                className,
            )}
            {...rest}
        />
    );
}

export function SkeletonRows({ rows = 4, className }: { rows?: number; className?: string }) {
    return (
        <div role="status" aria-label="Loading" className={cn('space-y-3', className)}>
            {Array.from({ length: rows }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
            ))}
            <span className="sr-only">Loading...</span>
        </div>
    );
}
