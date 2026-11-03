'use client';

import React, { useEffect, useId, useRef } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from './Button';

const FOCUSABLE =
    'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: React.ReactNode;
    description?: React.ReactNode;
    children?: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg';
    /** Prevent closing via Escape / backdrop click (e.g. while a request is running). */
    dismissible?: boolean;
    className?: string;
}

const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' };

export function Modal({
    open,
    onClose,
    title,
    description,
    children,
    footer,
    size = 'md',
    dismissible = true,
    className,
}: ModalProps) {
    const titleId = useId();
    const descId = useId();
    const panelRef = useRef<HTMLDivElement | null>(null);
    const onCloseRef = useRef(onClose);
    const dismissibleRef = useRef(dismissible);

    useEffect(() => {
        onCloseRef.current = onClose;
        dismissibleRef.current = dismissible;
    });

    useEffect(() => {
        if (!open) return;
        const previouslyFocused = document.activeElement as HTMLElement | null;
        const panel = panelRef.current;

        // Focus first field/button unless something inside already grabbed focus (autoFocus).
        if (panel && !panel.contains(document.activeElement)) {
            const first = panel.querySelector<HTMLElement>(
                'input:not([disabled]),select:not([disabled]),textarea:not([disabled])',
            ) || panel.querySelector<HTMLElement>(FOCUSABLE);
            (first || panel).focus();
        }

        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && dismissibleRef.current) {
                e.stopPropagation();
                onCloseRef.current();
                return;
            }
            if (e.key === 'Tab' && panelRef.current) {
                const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
                if (nodes.length === 0) {
                    e.preventDefault();
                    return;
                }
                const first = nodes[0];
                const last = nodes[nodes.length - 1];
                const active = document.activeElement;
                if (e.shiftKey && (active === first || !panelRef.current.contains(active))) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && (active === last || !panelRef.current.contains(active))) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = prevOverflow;
            previouslyFocused?.focus?.();
        };
    }, [open]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget && dismissible) onClose();
            }}
        >
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={description ? descId : undefined}
                tabIndex={-1}
                className={cn(
                    'w-full rounded-t-2xl border border-line bg-surface p-5 shadow-overlay animate-pop-in sm:rounded-2xl sm:p-6',
                    'max-h-[90vh] overflow-y-auto focus:outline-none',
                    sizes[size],
                    className,
                )}
            >
                <div className="mb-4 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h2 id={titleId} className="text-lg font-semibold text-fg">
                            {title}
                        </h2>
                        {description && (
                            <p id={descId} className="mt-1 text-sm text-fg-muted">
                                {description}
                            </p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={!dismissible}
                        aria-label="Close dialog"
                        className="-mt-1 -mr-1 rounded-lg p-1.5 text-fg-subtle transition-colors hover:bg-surface-hover hover:text-fg disabled:opacity-50"
                    >
                        <X className="h-5 w-5" aria-hidden />
                    </button>
                </div>
                {children}
                {footer && <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{footer}</div>}
            </div>
        </div>
    );
}

export interface ConfirmDialogProps {
    open: boolean;
    title: React.ReactNode;
    message: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDialog({
    open,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    destructive = false,
    loading = false,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    return (
        <Modal
            open={open}
            onClose={onCancel}
            dismissible={!loading}
            title={
                <span className="flex items-center gap-2.5">
                    {destructive && <AlertTriangle className="h-5 w-5 shrink-0 text-danger-400" aria-hidden />}
                    {title}
                </span>
            }
            footer={
                <>
                    <Button variant="secondary" onClick={onCancel} disabled={loading}>
                        {cancelLabel}
                    </Button>
                    <Button variant={destructive ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
                        {confirmLabel}
                    </Button>
                </>
            }
        >
            <div className="text-sm leading-relaxed text-fg-muted">{message}</div>
        </Modal>
    );
}
