"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GoogleLogin, useGoogleOneTapLogin, CredentialResponse } from '@react-oauth/google';
import { Cloud, Mail, Lock, Code2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { apiService } from '@/services/api.service';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading, setUser, refreshUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/');
    }
  }, [authLoading, user, router]);

  const handleGoogleSuccess = useCallback(
    async (credentialResponse: CredentialResponse) => {
      if (!credentialResponse.credential) {
        setError('Google authentication failed: No credential received');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await apiService.loginWithGoogle(credentialResponse.credential);
        if (res.data) {
          setUser(res.data);
        } else {
          await refreshUser();
        }
        router.push('/');
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Google login failed');
      } finally {
        setLoading(false);
      }
    },
    [router, setUser, refreshUser]
  );

  useGoogleOneTapLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => {
      // Quietly ignore OneTap dismissal
    },
    use_fedcm_for_prompt: false,
  });

  // Listen for GitHub OAuth popup callback
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.message === 'success' && event.data?.sessionId) {
        setLoading(true);
        setError(null);
        try {
          await apiService.setSessionCookie(event.data.sessionId);
          await refreshUser();
          router.push('/');
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : 'GitHub login failed');
        } finally {
          setLoading(false);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [router, refreshUser]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setLoading(true);
    setError(null);
    try {
      const res = await apiService.login({ email: email.trim(), password });
      if (res.data) {
        setUser(res.data);
      } else {
        await refreshUser();
      }
      router.push('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGithubLogin = () => {
    window.open(
      apiService.getGithubOAuthUrl(),
      'github-oauth',
      'width=520,height=640,left=200,top=100'
    );
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="bg-indigo-600/20 border border-indigo-500/30 p-3 rounded-2xl text-indigo-400 mb-3">
            <Cloud className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome back to DevDrive</h1>
          <p className="text-sm text-slate-400 mt-1">
            Sign in to access your cloud workspace & files
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2.5 bg-red-950/60 border border-red-800/80 text-red-200 px-4 py-3 rounded-xl text-sm">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-xl text-sm transition-colors cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-900 px-3 text-slate-500">Or continue with</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google Sign-In failed')}
              theme="filled_black"
              shape="pill"
              width="320"
            />
          </div>

          <button
            type="button"
            onClick={handleGithubLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-2.5 px-4 rounded-xl text-sm border border-slate-700 transition-colors cursor-pointer"
          >
            <Code2 className="w-4 h-4" />
            Continue with GitHub
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-slate-400">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
