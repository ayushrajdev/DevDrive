const UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

export function formatBytes(bytes: number | undefined | null, decimals = 2): string {
    if (!bytes || bytes <= 0 || !Number.isFinite(bytes)) return '0 B';
    const i = Math.min(UNITS.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(decimals))} ${UNITS[i]}`;
}

export function formatDate(value: string | number | Date | undefined | null): string {
    if (!value) return '-';
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function getInitials(nameOrEmail: string | undefined | null): string {
    if (!nameOrEmail) return '?';
    const base = nameOrEmail.includes('@') ? nameOrEmail.split('@')[0] : nameOrEmail;
    const parts = base.trim().split(/[\s._-]+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
}
