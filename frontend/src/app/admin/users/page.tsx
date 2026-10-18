'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Shield,
    Users,
    UserCheck,
    UserX,
    RotateCcw,
    Trash2,
    Ban,
    AlertTriangle,
    Loader2,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react';
import { apiService } from '@/services/api.service';
import { useAuth } from '@/context/AuthContext';
import { IUser, UserRole } from '@/types';

type FilterTab = 'all' | 'active' | 'disabled';

const ROLES: UserRole[] = ['user', 'manager', 'admin', 'owner'];

export default function AdminUsersPage() {
    const router = useRouter();
    const { user: currentUser, loading: authLoading } = useAuth();

    const [users, setUsers] = useState<IUser[]>([]);
    const [activeTab, setActiveTab] = useState<FilterTab>('all');
    const [loading, setLoading] = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Hard delete confirmation modal state
    const [userToHardDelete, setUserToHardDelete] = useState<IUser | null>(
        null,
    );

    const fetchUsers = useCallback(async (tab: FilterTab) => {
        setLoading(true);
        setError(null);
        try {
            const res =
                tab === 'active'
                    ? await apiService.getActiveUsers()
                    : tab === 'disabled'
                      ? await apiService.getDisabledUsers()
                      : await apiService.getAllUsers();
            setUsers(res.data || []);
        } catch (err: unknown) {
            setError(
                err instanceof Error ? err.message : 'Failed to fetch users',
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!authLoading) {
            if (!currentUser) {
                router.replace('/login');
                return;
            }
            if (!['admin', 'owner', 'manager'].includes(currentUser.role)) {
                router.replace('/');
                return;
            }
            fetchUsers(activeTab);
        }
    }, [authLoading, currentUser, activeTab, router, fetchUsers]);

    const handleRoleChange = async (
        targetUserId: string,
        newRole: UserRole,
    ) => {
        setActionLoadingId(targetUserId);
        setError(null);
        setSuccess(null);
        try {
            await apiService.updateUserRole(targetUserId, newRole);
            setSuccess(`Updated role to "${newRole}"`);
            await fetchUsers(activeTab);
        } catch (err: unknown) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to update user role',
            );
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleSoftDelete = async (targetUser: IUser) => {
        setActionLoadingId(targetUser._id);
        setError(null);
        setSuccess(null);
        try {
            await apiService.softDeleteUser(targetUser._id);
            setSuccess(
                `Soft-deleted user ${targetUser.email} (sessions revoked, data preserved)`,
            );
            await fetchUsers(activeTab);
        } catch (err: unknown) {
            setError(
                err instanceof Error ? err.message : 'Failed to disable user',
            );
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleRecoverUser = async (targetUser: IUser) => {
        setActionLoadingId(targetUser._id);
        setError(null);
        setSuccess(null);
        try {
            await apiService.recoverUser(targetUser._id);
            setSuccess(`Recovered user account ${targetUser.email}`);
            await fetchUsers(activeTab);
        } catch (err: unknown) {
            setError(
                err instanceof Error ? err.message : 'Failed to recover user',
            );
        } finally {
            setActionLoadingId(null);
        }
    };

    const confirmHardDelete = async () => {
        if (!userToHardDelete) return;
        const target = userToHardDelete;
        setActionLoadingId(target._id);
        setError(null);
        setSuccess(null);
        try {
            await apiService.hardDeleteUser(target._id);
            setUserToHardDelete(null);
            setSuccess(
                `Permanently deleted user ${target.email} and all associated cloud files`,
            );
            await fetchUsers(activeTab);
        } catch (err: unknown) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to permanently delete user',
            );
        } finally {
            setActionLoadingId(null);
        }
    };

    const canSoftDeleteOrRecover =
        currentUser?.role === 'admin' || currentUser?.role === 'owner';
    const canHardDelete = currentUser?.role === 'owner';
    const canChangeRole =
        currentUser?.role === 'owner' || currentUser?.role === 'admin';

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
                <div>
                    <div className="inline-flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
                        <Shield className="w-4 h-4" />
                        RBAC Administration Console
                    </div>
                    <h1 className="text-2xl font-bold text-white">
                        User & Role Management
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                        Signed in as{' '}
                        <span className="text-slate-200 font-medium">
                            {currentUser?.email}
                        </span>{' '}
                        (
                        <span className="uppercase text-indigo-400 font-semibold">
                            {currentUser?.role}
                        </span>
                        )
                    </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                    <button
                        type="button"
                        onClick={() => setActiveTab('all')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                            activeTab === 'all'
                                ? 'bg-indigo-600 text-white'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <Users className="w-3.5 h-3.5" />
                        All Users
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('active')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                            activeTab === 'active'
                                ? 'bg-emerald-600 text-white'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <UserCheck className="w-3.5 h-3.5" />
                        Active
                    </button>
                    {canSoftDeleteOrRecover && (
                        <button
                            type="button"
                            onClick={() => setActiveTab('disabled')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                                activeTab === 'disabled'
                                    ? 'bg-amber-600 text-white'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <UserX className="w-3.5 h-3.5" />
                            Disabled (Soft-Deleted)
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2.5 bg-red-950/60 border border-red-800 text-red-200 px-4 py-3 rounded-xl text-sm">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="flex items-center gap-2.5 bg-emerald-950/60 border border-emerald-800 text-emerald-200 px-4 py-3 rounded-xl text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{success}</span>
                </div>
            )}

            {/* Users Table */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                        <span>Loading users...</span>
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-16 text-slate-500 text-sm">
                        No users found for this filter.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-950/60">
                                    <th className="py-3.5 px-4">User</th>
                                    <th className="py-3.5 px-4">Auth</th>
                                    <th className="py-3.5 px-4">Status</th>
                                    <th className="py-3.5 px-4">Role</th>
                                    <th className="py-3.5 px-4 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/70 text-sm">
                                {users.map((u) => {
                                    const isSelf = u._id === currentUser?._id;
                                    const isProcessing =
                                        actionLoadingId === u._id;

                                    return (
                                        <tr
                                            key={u._id}
                                            className="hover:bg-slate-800/40 transition-colors"
                                        >
                                            <td className="py-3.5 px-4">
                                                <div className="font-medium text-white">
                                                    {u.name || 'Unnamed User'}{' '}
                                                    {isSelf && (
                                                        <span className="ml-1.5 text-[10px] bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-800">
                                                            You
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-slate-400">
                                                    {u.email}
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4 capitalize text-xs text-slate-300">
                                                {u.authProvider || 'email'}
                                            </td>

                                            <td className="py-3.5 px-4">
                                                {u.deleted ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-950/80 text-red-300 border border-red-800/60">
                                                        Disabled
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                                                        Active
                                                    </span>
                                                )}
                                            </td>

                                            <td className="py-3.5 px-4">
                                                {canChangeRole && !isSelf ? (
                                                    <select
                                                        value={u.role}
                                                        disabled={isProcessing}
                                                        onChange={(e) =>
                                                            handleRoleChange(
                                                                u._id,
                                                                e.target
                                                                    .value as UserRole,
                                                            )
                                                        }
                                                        className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                                                    >
                                                        {ROLES.map((r) => (
                                                            <option
                                                                key={r}
                                                                value={r}
                                                            >
                                                                {r.toUpperCase()}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <span className="text-xs font-semibold uppercase text-indigo-300">
                                                        {u.role}
                                                    </span>
                                                )}
                                            </td>

                                            <td className="py-3.5 px-4 text-right">
                                                <div className="inline-flex items-center justify-end gap-2">
                                                    {canSoftDeleteOrRecover &&
                                                        !isSelf && (
                                                            <>
                                                                {u.deleted ? (
                                                                    <button
                                                                        type="button"
                                                                        disabled={
                                                                            isProcessing
                                                                        }
                                                                        onClick={() =>
                                                                            handleRecoverUser(
                                                                                u,
                                                                            )
                                                                        }
                                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border border-emerald-800/70 cursor-pointer"
                                                                        title="Recover Soft-Deleted User"
                                                                    >
                                                                        <RotateCcw className="w-3.5 h-3.5" />
                                                                        Recover
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        disabled={
                                                                            isProcessing
                                                                        }
                                                                        onClick={() =>
                                                                            handleSoftDelete(
                                                                                u,
                                                                            )
                                                                        }
                                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-amber-950/80 hover:bg-amber-900 text-amber-200 border border-amber-800/70 cursor-pointer"
                                                                        title="Soft Delete (Disable Account)"
                                                                    >
                                                                        <Ban className="w-3.5 h-3.5" />
                                                                        Soft
                                                                        Delete
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}

                                                    {canHardDelete &&
                                                        !isSelf && (
                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    isProcessing
                                                                }
                                                                onClick={() =>
                                                                    setUserToHardDelete(
                                                                        u,
                                                                    )
                                                                }
                                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800/70 cursor-pointer"
                                                                title="Permanently Delete User & Files"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                Hard Delete
                                                            </button>
                                                        )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Hard Delete Confirmation Modal */}
            {userToHardDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
                    <div className="bg-slate-900 border border-red-800/80 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
                        <div className="flex items-center gap-3 text-red-400">
                            <div className="p-2.5 bg-red-950 rounded-xl border border-red-800">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-white">
                                Permanent Hard Deletion
                            </h3>
                        </div>

                        <p className="text-sm text-slate-300 leading-relaxed">
                            Are you sure you want to permanently delete{' '}
                            <span className="font-semibold text-white">
                                {userToHardDelete.email}
                            </span>
                            ? This action cannot be undone and will permanently
                            purge their user record, directories, and cloud
                            files.
                        </p>

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setUserToHardDelete(null)}
                                className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={
                                    actionLoadingId === userToHardDelete._id
                                }
                                onClick={confirmHardDelete}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 text-white cursor-pointer disabled:opacity-50"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Yes, Permanently Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
