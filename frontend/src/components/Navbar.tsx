'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
    HardDrive,
    CreditCard,
    ShieldAlert,
    User as UserIcon,
    LogOut,
    LogIn,
    UserPlus,
} from 'lucide-react';

export function Navbar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    const isAdminOrManager =
        user?.role === 'admin' || user?.role === 'manager' || user?.role === 'owner';

    const navItems = [
        { href: '/', label: 'My Drive', icon: HardDrive, authOnly: true },
        { href: '/pricing', label: 'Plans & Pricing', icon: CreditCard, authOnly: false },
        { href: '/profile', label: 'Profile & Security', icon: UserIcon, authOnly: true },
    ];

    if (isAdminOrManager) {
        navItems.push({
            href: '/admin/users',
            label: 'Admin Console',
            icon: ShieldAlert,
            authOnly: true,
        });
    }

    return (
        <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
                {/* Brand */}
                <Link href="/" className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
                        <HardDrive className="h-5 w-5" />
                    </div>
                    <div>
                        <span className="text-lg font-bold tracking-tight text-white">
                            Dev<span className="text-blue-400">Drive</span>
                        </span>
                        <span className="ml-2 hidden rounded-md border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:inline-block">
                            CLOUD
                        </span>
                    </div>
                </Link>

                {/* Navigation Links */}
                <nav className="hidden items-center gap-1 md:flex">
                    {navItems
                        .filter((item) => !item.authOnly || !!user)
                        .map((item) => {
                            const Icon = item.icon;
                            const isActive =
                                item.href === '/'
                                    ? pathname === '/'
                                    : pathname.startsWith(item.href);

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                                        isActive
                                            ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                                            : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                                    }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    {item.label}
                                </Link>
                            );
                        })}
                </nav>

                {/* User Actions */}
                <div className="flex items-center gap-3">
                    {user ? (
                        <>
                            <Link
                                href="/profile"
                                className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1.5 hover:border-slate-700 transition-colors"
                            >
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 text-xs font-bold uppercase text-white">
                                    {(user.name || user.email)[0]}
                                </div>
                                <div className="hidden text-left sm:block">
                                    <p className="text-xs font-semibold text-white leading-none">
                                        {user.name || user.email.split('@')[0]}
                                    </p>
                                    <p className="mt-0.5 text-[10px] uppercase tracking-wider text-blue-400 font-semibold">
                                        {user.role}
                                    </p>
                                </div>
                            </Link>

                            <button
                                onClick={logout}
                                title="Logout"
                                className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
                            >
                                <LogOut className="h-4 w-4" />
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link
                                href="/login"
                                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors"
                            >
                                <LogIn className="h-4 w-4" />
                                Sign In
                            </Link>
                            <Link
                                href="/register"
                                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:from-blue-500 hover:to-indigo-500 transition-all shadow-md shadow-blue-500/20"
                            >
                                <UserPlus className="h-4 w-4" />
                                Get Started
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
