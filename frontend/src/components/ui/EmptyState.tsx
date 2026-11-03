import React from 'react';
import { cn } from '@/lib/cn';

export function EmptyState({
    icon,
    title,
    description,
    action,
    className,
}: {
    icon?: React.ReactNode;
    title: string;
    description?: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center rounded-xl border border-dashed border-line-strong px-6 py-10 text-center',
                className,
            )}
        >
            {icon && (
                <span
                    aria-hidden
                    className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-surface-raised text-fg-subtle [&>svg]:h-5 [&>svg]:w-5"
                >
                    {icon}
                </span>
            )}
            <h3 className="text-sm font-semibold text-fg">{title}</h3>
            {description && <p className="mt-1 max-w-sm text-sm text-fg-muted">{description}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
