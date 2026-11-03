'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { HardDrive, CreditCard, ShieldAlert, User as UserIcon, LogOut, LogIn, UserPlus, Menu, X } from 'lucide-react';
import { Button, RoleBadge, buttonClasses } from '@/components/ui';
import { cn } from '@/lib/cn';
import { getInitials } from '@/lib/format';

export function Navbar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const [open, setOpen] = useState(false);

    useEffect(() => setOpen(false), [pathname]);

    const isStaff = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'owner';

    const navItems = [
        { href: '/', label: 'My Drive', icon: HardDrive, authOnly: true },
        { href: '/pricing', label: 'Plans', icon: CreditCard, authOnly: false },
        { href: '/profile', label: 'Profile', icon: UserIcon, authOnly: true },
        ...(isStaff ? [{ href: '/admin/users', label: 'Admin', icon: ShieldAlert, authOnly: true }] : []),
    ].filter((item) => !item.authOnly || !!user);

    const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

    const linkClass = (href: string) =>
        cn(
            'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            isActive(href) ? 'bg-brand-600/20 text-brand-200' : 'text-fg-muted hover:bg-surface-hover hover:text-fg',
        );

    return (
        <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-md">
            <a href="#main" className="sr-only-focusable absolute left-2 top-2 rounded bg-brand-600 px-3 py-1.5 text-sm text-white">
                Skip to content
            </a>
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                <Link href="/" className="flex items-center gap-2.5" aria-label="DevDrive home">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-glow">
                        <HardDrive className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="text-lg font-bold tracking-tight">
                        Dev<span className="text-brand-400">Drive</span>
                    </span>
                </Link>

                <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
                    {navItems.map(({ href, label, icon: Icon }) => (
                        <Link key={href} href={href} className={linkClass(href)} aria-current={isActive(href) ? 'page' : undefined}>
                            <Icon className="h-4 w-4" aria-hidden /> {label}
                        </Link>
                    ))}
                </nav>

                <div className="hidden items-center gap-3 md:flex">
                    {user ? (
                        <>
                            <div className="flex items-center gap-2.5">
                                <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-brand-600/30 text-xs font-semibold text-brand-200">
                                    {user.picture ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={user.picture} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                                    ) : (
                                        getInitials(user.name || user.email)
                                    )}
                                </span>
                                <div className="leading-tight">
                                    <p className="max-w-[10rem] truncate text-sm font-medium">{user.name || user.email}</p>
                                    <RoleBadge role={user.role} />
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={logout} aria-label="Sign out">
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className={buttonClasses('ghost', 'md')}>
                                <LogIn className="h-4 w-4" aria-hidden /> Sign in
                            </Link>
                            <Link href="/register" className={buttonClasses('primary', 'md')}>
                                <UserPlus className="h-4 w-4" aria-hidden /> Get started
                            </Link>
                        </>
                    )}
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setOpen((o) => !o)}
                    aria-label={open ? 'Close menu' : 'Open menu'}
                    aria-expanded={open}
                >
                    {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
            </div>

            {open && (
                <div className="border-t border-line bg-surface px-4 py-3 md:hidden">
                    <nav className="flex flex-col gap-1" aria-label="Mobile">
                        {navItems.map(({ href, label, icon: Icon }) => (
                            <Link key={href} href={href} className={linkClass(href)}>
                                <Icon className="h-4 w-4" aria-hidden /> {label}
                            </Link>
                        ))}
                    </nav>
                    <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3">
                        {user ? (
                            <>
                                <p className="truncate px-1 text-sm text-fg-muted">
                                    {user.email} <RoleBadge role={user.role} />
                                </p>
                                <Button variant="secondary" onClick={logout}>
                                    <LogOut className="h-4 w-4" aria-hidden /> Sign out
                                </Button>
                            </>
                        ) : (
                            <>
                                <Link href="/login" className={buttonClasses('secondary', 'md')}>
                                    Sign in
                                </Link>
                                <Link href="/register" className={buttonClasses('primary', 'md')}>
                                    Get started
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
