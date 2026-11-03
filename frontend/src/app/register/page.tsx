"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User as UserIcon, Mail, Lock, KeyRound, CheckCircle2, ArrowRight } from 'lucide-react';
import { apiService } from '@/services/api.service';
import { useAuth } from '@/context/AuthContext';
import { AuthShell } from '@/components/AuthShell';
import { Alert, Button, Input } from '@/components/ui';

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading: authLoading, setUser, refreshUser } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) router.replace('/');
  }, [authLoading, user, router]);

  const handleSendOtp = async () => {
    if (!email.trim()) {
      setError('Please enter your email address first');
      return;
    }
    setSendingOtp(true);
    setError(null);
    setInfo(null);
    try {
      const res = await apiService.sendOtp(email.trim());
      setOtpSent(true);
      setInfo(res.message || 'OTP sent to your email address');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setError('Please enter the OTP sent to your email');
      return;
    }
    setVerifyingOtp(true);
    setError(null);
    try {
      const res = await apiService.verifyOtp(email.trim(), otp.trim());
      setOtpVerified(true);
      setInfo(res.message || 'Email verified successfully');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid OTP');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) return;
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.register({ name: name.trim(), email: email.trim(), password });
      if (res.data) setUser(res.data);
      else await refreshUser();
      router.push('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start storing and sharing files securely"
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-brand-300 hover:text-brand-200">
            Sign in
          </Link>
        </>
      }
    >
      {error && (
        <Alert variant="danger" className="mb-5" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}
      {info && !error && (
        <Alert variant="success" className="mb-5" onDismiss={() => setInfo(null)}>
          {info}
        </Alert>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <Input label="Full name" required autoComplete="name" icon={<UserIcon />} value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
        <div className="space-y-2">
          <Input
            label="Email address"
            type="email"
            required
            autoComplete="email"
            icon={<Mail />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={otpVerified}
            placeholder="you@example.com"
          />
          {otpVerified ? (
            <p className="flex items-center gap-1.5 text-xs text-success-400">
              <CheckCircle2 className="h-4 w-4" aria-hidden /> Email verified
            </p>
          ) : (
            <Button type="button" variant="ghost" size="sm" onClick={handleSendOtp} loading={sendingOtp} disabled={!email.trim()}>
              {otpSent ? 'Resend verification code' : 'Verify email (optional)'}
            </Button>
          )}
        </div>

        {otpSent && !otpVerified && (
          <div className="flex items-end gap-2">
            <Input
              label="Verification code"
              icon={<KeyRound />}
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="6-digit code"
              className="flex-1"
            />
            <Button type="button" variant="secondary" onClick={handleVerifyOtp} loading={verifyingOtp} disabled={!otp.trim()}>
              Verify
            </Button>
          </div>
        )}

        <Input
          label="Password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          icon={<Lock />}
          hint="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
          Create account <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </form>
    </AuthShell>
  );
}
