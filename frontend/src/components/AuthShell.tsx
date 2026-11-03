import React from 'react';
import { Cloud } from 'lucide-react';

/** Shared layout for login / register pages. */
export function AuthShell({
    title,
    subtitle,
    children,
    footer,
}: {
    title: string;
    subtitle: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}) {
    return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
            <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8">
                <div className="mb-7 flex flex-col items-center text-center">
                    <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600/20 text-brand-300">
                        <Cloud className="h-6 w-6" aria-hidden />
                    </span>
                    <h1 className="text-2xl font-bold tracking-tight text-fg">{title}</h1>
                    <p className="mt-1 text-sm text-fg-muted">{subtitle}</p>
                </div>
                {children}
                {footer && <p className="mt-6 text-center text-sm text-fg-muted">{footer}</p>}
            </div>
        </div>
    );
}

export function Divider({ children }: { children: React.ReactNode }) {
    return (
        <div className="my-6 flex items-center gap-3 text-xs tracking-wide text-fg-subtle uppercase">
            <span className="h-px flex-1 bg-line" />
            {children}
            <span className="h-px flex-1 bg-line" />
        </div>
    );
}
