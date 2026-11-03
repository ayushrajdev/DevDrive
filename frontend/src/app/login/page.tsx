"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GoogleLogin, useGoogleOneTapLogin, CredentialResponse } from '@react-oauth/google';
import { Mail, Lock, Code2, ArrowRight } from 'lucide-react';
import { apiService } from '@/services/api.service';
import { useAuth } from '@/context/AuthContext';
import { AuthShell, Divider } from '@/components/AuthShell';
import { Alert, Button, Input } from '@/components/ui';

const GOOGLE_ENABLED = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

function GoogleOneTap({ onSuccess }: { onSuccess: (r: CredentialResponse) => void }) {
  useGoogleOneTapLogin({ onSuccess, onError: () => {}, use_fedcm_for_prompt: false });
  return null;
}

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading, setUser, refreshUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) router.replace('/');
  }, [authLoading, user, router]);

  const completeLogin = useCallback(
    async (data?: Parameters<typeof setUser>[0]) => {
      if (data) setUser(data);
      else await refreshUser();
      router.push('/');
    },
    [router, setUser, refreshUser],
  );

  const handleGoogleSuccess = useCallback(
    async (credentialResponse: CredentialResponse) => {
      if (!credentialResponse.credential) {
        setError('Google authentication failed: no credential received');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await apiService.loginWithGoogle(credentialResponse.credential);
        await completeLogin(res.data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Google login failed');
      } finally {
        setLoading(false);
      }
    },
    [completeLogin],
  );

  // GitHub OAuth popup posts { success, sessionId, user } back to this window.
  useEffect(() => {
    const apiOrigin = new URL(apiService.baseUrl, window.location.href).origin;
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== apiOrigin) return;
      if (event.data?.success === false) {
        setError(event.data?.message || 'GitHub login failed');
        return;
      }
      if (event.data?.success && event.data?.sessionId) {
        setLoading(true);
        setError(null);
        try {
          await apiService.setSessionCookie(event.data.sessionId);
          await completeLogin();
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : 'GitHub login failed');
        } finally {
          setLoading(false);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [completeLogin]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.login({ email: email.trim(), password });
      await completeLogin(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGithubLogin = () => {
    window.open(apiService.getGithubOAuthUrl(), 'github-oauth', 'width=520,height=640,left=200,top=100');
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to access your DevDrive workspace"
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium text-brand-300 hover:text-brand-200">
            Create an account
          </Link>
        </>
      }
    >
      {GOOGLE_ENABLED && <GoogleOneTap onSuccess={handleGoogleSuccess} />}
      {error && (
        <Alert variant="danger" className="mb-5" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleEmailLogin} className="space-y-4">
        <Input
          label="Email address"
          type="email"
          required
          autoComplete="email"
          icon={<Mail />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <Input
          label="Password"
          type="password"
          required
          autoComplete="current-password"
          icon={<Lock />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Your password"
        />
        <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
          Sign in <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </form>

      <Divider>Or continue with</Divider>

      <div className="space-y-3">
        {GOOGLE_ENABLED && (
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google Sign-In failed')}
              theme="filled_black"
              shape="pill"
              width="320"
            />
          </div>
        )}
        <Button type="button" variant="secondary" size="lg" onClick={handleGithubLogin} disabled={loading} className="w-full">
          <Code2 className="h-4 w-4" aria-hidden /> Continue with GitHub
        </Button>
      </div>
    </AuthShell>
  );
}
