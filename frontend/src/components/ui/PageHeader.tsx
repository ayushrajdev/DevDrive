import React from 'react';
import { cn } from '@/lib/cn';

const widths = {
    sm: 'max-w-3xl',
    md: 'max-w-5xl',
    lg: 'max-w-7xl',
};

export function Container({
    size = 'lg',
    className,
    ...rest
}: React.HTMLAttributes<HTMLDivElement> & { size?: keyof typeof widths }) {
    return (
        <div
            className={cn('mx-auto w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8', widths[size], className)}
            {...rest}
        />
    );
}

export function PageHeader({
    title,
    description,
    eyebrow,
    actions,
    className,
}: {
    title: React.ReactNode;
    description?: React.ReactNode;
    eyebrow?: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between',
                className,
            )}
        >
            <div className="min-w-0">
                {eyebrow && (
                    <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold tracking-wider text-brand-300 uppercase [&>svg]:h-3.5 [&>svg]:w-3.5">
                        {eyebrow}
                    </div>
                )}
                <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">{title}</h1>
                {description && <p className="mt-1.5 text-sm text-fg-muted sm:text-base">{description}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
    );
}
