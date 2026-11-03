"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, HardDrive, Lock, LogOut, Smartphone } from 'lucide-react';
import { apiService } from '@/services/api.service';
import { useAuth } from '@/context/AuthContext';
import type { IStorageUsage } from '@/types';
import { Alert, Button, Card, CardBody, CardHeader, Container, Input, PageHeader, PageSpinner, ProgressBar, RoleBadge, Badge, ConfirmDialog } from '@/components/ui';
import { formatBytes, getInitials } from '@/lib/format';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, refreshUser, logout } = useAuth();

  const [storage, setStorage] = useState<IStorageUsage | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const [confirmAll, setConfirmAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      apiService
        .getStorageUsage()
        .then((res) => res.data && setStorage(res.data))
        .catch(() => {});
    }
  }, [user]);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    if (newPassword.length < 6) return setError('Password must be at least 6 characters long');
    if (newPassword !== confirmPassword) return setError('Passwords do not match');

    setSavingPassword(true);
    try {
      const res = await apiService.setPassword(newPassword);
      setSuccessMsg(res.message || 'Password updated. You can now also sign in with email and password.');
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to log out from all devices');
      setLoggingOutAll(false);
      setConfirmAll(false);
    }
  };

  if (authLoading || !user) return <PageSpinner />;

  const usedBytes = storage?.usedBytes ?? 0;
  const maxBytes = storage?.maxBytes ?? user.maxStorageInBytes ?? 1024 ** 3;
  const usagePercent = Math.min(100, Math.round((usedBytes / maxBytes) * 100));

  return (
    <Container size="sm">
      <PageHeader title="Account & security" description="Manage your profile, storage and sign-in methods." />

      <div className="space-y-6">
        {error && <Alert variant="danger" onDismiss={() => setError(null)}>{error}</Alert>}
        {successMsg && <Alert variant="success" onDismiss={() => setSuccessMsg(null)}>{successMsg}</Alert>}

        <Card>
          <CardBody className="flex items-center gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-600/25 text-lg font-semibold text-brand-200">
              {user.picture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.picture} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                getInitials(user.name || user.email)
              )}
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold">{user.name || 'DevDrive user'}</h2>
              <p className="flex items-center gap-1.5 truncate text-sm text-fg-muted">
                <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden /> {user.email}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <RoleBadge role={user.role} />
                {user.authProvider && <Badge variant="neutral" className="capitalize">{user.authProvider}</Badge>}
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Storage" icon={<HardDrive />} />
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between text-sm text-fg-muted">
              <span>{formatBytes(usedBytes)} of {formatBytes(maxBytes)} used</span>
              <span>{usagePercent}%</span>
            </div>
            <ProgressBar value={usagePercent} label="Storage used" tone="auto" />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Set or update password"
            description="Signed up with Google or GitHub? Set a password to also sign in with email."
            icon={<Lock />}
          />
          <CardBody>
            <form onSubmit={handleSetPassword} className="max-w-md space-y-4">
              <Input label="New password" type="password" required minLength={6} autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} hint="At least 6 characters" />
              <Input label="Confirm new password" type="password" required minLength={6} autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              <Button type="submit" variant="primary" loading={savingPassword}>Save password</Button>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Active sessions" description="Sign out here, or revoke every session on every device." icon={<Smartphone />} />
          <CardBody className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => logout()}>
              <LogOut className="h-4 w-4" aria-hidden /> Sign out
            </Button>
            <Button variant="danger-soft" onClick={() => setConfirmAll(true)}>Log out all devices</Button>
          </CardBody>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmAll}
        destructive
        title="Log out of all devices?"
        message="Every active session, including this one, will be revoked and you will need to sign in again."
        confirmLabel="Log out everywhere"
        loading={loggingOutAll}
        onConfirm={handleLogoutAllDevices}
        onCancel={() => setConfirmAll(false)}
      />
    </Container>
  );
}
