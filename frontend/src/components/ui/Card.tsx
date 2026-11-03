import React from 'react';
import { cn } from '@/lib/cn';

export function Card({
    className,
    ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn('rounded-xl border border-line bg-surface shadow-card', className)}
            {...rest}
        />
    );
}

export function CardHeader({
    title,
    description,
    icon,
    action,
    className,
}: {
    title: React.ReactNode;
    description?: React.ReactNode;
    icon?: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn('flex items-start justify-between gap-4', className)}>
            <div className="flex min-w-0 items-start gap-3">
                {icon && (
                    <span
                        aria-hidden
                        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-950 text-brand-300 [&>svg]:h-4 [&>svg]:w-4"
                    >
                        {icon}
                    </span>
                )}
                <div className="min-w-0">
                    <h2 className="text-base font-semibold text-fg">{title}</h2>
                    {description && <p className="mt-0.5 text-sm text-fg-muted">{description}</p>}
                </div>
            </div>
            {action}
        </div>
    );
}

export function CardBody({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn('p-5 sm:p-6', className)} {...rest} />;
}
