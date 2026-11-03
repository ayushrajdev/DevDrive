import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

interface SpinnerProps {
    className?: string;
    label?: string;
}

export function Spinner({ className, label = 'Loading' }: SpinnerProps) {
    return (
        <span role="status" className="inline-flex items-center">
            <Loader2 aria-hidden className={cn('h-5 w-5 animate-spin text-brand-400', className)} />
            <span className="sr-only">{label}</span>
        </span>
    );
}

export function PageSpinner({ label = 'Loading...' }: { label?: string }) {
    return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-sm text-fg-muted">
            <Spinner className="h-7 w-7" label={label} />
            <span aria-hidden>{label}</span>
        </div>
    );
}
