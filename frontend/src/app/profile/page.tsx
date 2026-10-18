"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User as UserIcon,
  Mail,
  Shield,
  HardDrive,
  Lock,
  LogOut,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { apiService } from '@/services/api.service';
import { useAuth } from '@/context/AuthContext';
import { IStorageUsage } from '@/types';

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, refreshUser, logout } = useAuth();

  const [storage, setStorage] = useState<IStorageUsage | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      apiService
        .getStorageUsage()
        .then((res) => {
          if (res.data) setStorage(res.data);
        })
        .catch(() => {});
    }
  }, [user]);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await apiService.setPassword(newPassword);
      setSuccessMsg(
        res.message || 'Password updated! You can now sign in with Email & Password as well.'
      );
      setNewPassword('');
      setConfirmPassword('');
      await refreshUser();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to set password');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    setLoggingOutAll(true);
    try {
      await apiService.logoutAllDevices();
      await logout();
      router.push('/login');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to logout from all devices');
      setLoggingOutAll(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  const usedBytes = storage?.usedBytes ?? 0;
  const maxBytes = storage?.maxBytes ?? user.maxStorageInBytes ?? 524288000;
  const usagePercent = Math.min(100, Math.round((usedBytes / maxBytes) * 100));

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <h1 className="text-2xl font-bold text-white">Account Settings & Security</h1>

      {error && (
        <div className="flex items-center gap-2.5 bg-red-950/60 border border-red-800 text-red-200 px-4 py-3 rounded-xl text-sm">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2.5 bg-emerald-950/60 border border-emerald-800 text-emerald-200 px-4 py-3 rounded-xl text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* User Overview Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {user.picture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.picture}
              alt={user.name || user.email}
              className="w-16 h-16 rounded-full border-2 border-indigo-500/40 object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <UserIcon className="w-8 h-8" />
            </div>
          )}
          <div>
            <h2 className="text-lg font-bold text-white">{user.name || 'DevDrive User'}</h2>
            <div className="flex items-center gap-2 text-sm text-slate-400 mt-0.5">
              <Mail className="w-3.5 h-3.5" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-indigo-950 text-indigo-300 border border-indigo-800">
                <Shield className="w-3 h-3" />
                Role: {user.role}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-slate-800 text-slate-300">
                Auth: {user.authProvider || 'email'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Storage Quota Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <HardDrive className="w-4 h-4 text-indigo-400" />
            <span>Storage Quota Usage</span>
          </div>
          <span className="text-xs text-slate-400">
            {formatBytes(usedBytes)} / {formatBytes(maxBytes)} ({usagePercent}%)
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${usagePercent}%` }}
          />
        </div>
      </div>

      {/* Set / Update Password for OAuth & Email Users */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 text-white font-semibold text-base mb-1">
          <Lock className="w-4 h-4 text-indigo-400" />
          <h3>Set or Update Account Password</h3>
        </div>
        <p className="text-xs text-slate-400 mb-5">
          Signed up with Google or GitHub? Set a password here so you can also log in directly with
          your email and password.
        </p>

        <form onSubmit={handleSetPassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              New Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={savingPassword}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors cursor-pointer"
          >
            {savingPassword ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Password'
            )}
          </button>
        </form>
      </div>

      {/* Session Security */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-amber-400" />
            Active Device Sessions
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Revoke all active sessions across all browsers and devices immediately.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={async () => {
              await logout();
              router.push('/login');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>

          <button
            type="button"
            disabled={loggingOutAll}
            onClick={handleLogoutAllDevices}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-red-950/80 hover:bg-red-900/80 text-red-200 border border-red-800/70 cursor-pointer disabled:opacity-50"
          >
            {loggingOutAll ? 'Revoking...' : 'Logout All Devices'}
          </button>
        </div>
      </div>
    </div>
  );
}
