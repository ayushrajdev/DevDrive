import React from 'react';
import { cn } from '@/lib/cn';
import type { UserRole } from '@/types';

export type BadgeVariant = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

const variants: Record<BadgeVariant, string> = {
    neutral: 'bg-surface-raised text-fg-muted border-line-strong',
    brand: 'bg-brand-950 text-brand-300 border-brand-800',
    success: 'bg-success-950 text-success-300 border-success-600/40',
    warning: 'bg-warning-950 text-warning-300 border-warning-600/40',
    danger: 'bg-danger-950 text-danger-300 border-danger-700/50',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
}

export function Badge({ variant = 'neutral', className, ...rest }: BadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
                variants[variant],
                className,
            )}
            {...rest}
        />
    );
}

const roleVariant: Record<UserRole, BadgeVariant> = {
    user: 'neutral',
    manager: 'warning',
    admin: 'brand',
    owner: 'success',
};

export function RoleBadge({ role, className }: { role: UserRole; className?: string }) {
    return (
        <Badge variant={roleVariant[role] ?? 'neutral'} className={cn('uppercase tracking-wide', className)}>
            {role}
        </Badge>
    );
}

const statusVariant: Record<string, BadgeVariant> = {
    active: 'success',
    pending: 'warning',
    created: 'warning',
    paused: 'warning',
    past_due: 'warning',
    cancelled: 'danger',
    expired: 'danger',
    failed: 'danger',
    disabled: 'danger',
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
    return (
        <Badge variant={statusVariant[status] ?? 'neutral'} className={cn('capitalize', className)}>
            {status.replace('_', ' ')}
        </Badge>
    );
}
