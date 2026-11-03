import React from 'react';
import { cn } from '@/lib/cn';

/** Horizontally-scrollable table wrapper so wide tables never break the page on mobile. */
export function TableWrapper({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn('w-full overflow-x-auto rounded-xl border border-line bg-surface', className)}
            {...rest}
        />
    );
}

export function Table({ className, ...rest }: React.TableHTMLAttributes<HTMLTableElement>) {
    return <table className={cn('w-full border-collapse text-left text-sm', className)} {...rest} />;
}

export function THead({ className, ...rest }: React.HTMLAttributes<HTMLTableSectionElement>) {
    return (
        <thead
            className={cn(
                'border-b border-line bg-surface-raised/60 text-xs font-semibold tracking-wider text-fg-subtle uppercase',
                className,
            )}
            {...rest}
        />
    );
}

export function TBody({ className, ...rest }: React.HTMLAttributes<HTMLTableSectionElement>) {
    return <tbody className={cn('divide-y divide-line', className)} {...rest} />;
}

export function Tr({ className, ...rest }: React.HTMLAttributes<HTMLTableRowElement>) {
    return <tr className={cn('transition-colors hover:bg-surface-raised/60', className)} {...rest} />;
}

export function Th({ className, ...rest }: React.ThHTMLAttributes<HTMLTableCellElement>) {
    return <th scope="col" className={cn('px-4 py-3 font-semibold whitespace-nowrap', className)} {...rest} />;
}

export function Td({ className, ...rest }: React.TdHTMLAttributes<HTMLTableCellElement>) {
    return <td className={cn('px-4 py-3 align-middle', className)} {...rest} />;
}
