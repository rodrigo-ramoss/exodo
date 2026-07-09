import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { syncLocalStateWithServer } from '../lib/serverSync';

interface AuthContextValue {
  email: string;
  isSubscriber: boolean;
  isLoggedIn: boolean;
  checking: boolean;
  requestCode: (email: string) => Promise<RequestCodeResult>;
  verifyCode: (challengeToken: string, code: string) => Promise<VerifyCodeResult>;
  refreshSession: () => Promise<void>;
  logout: () => void;
}

export type RequestCodeResult =
  | { status: 'code_sent'; challengeToken: string; expiresIn: number; devCode?: string }
  | { status: 'not_found' }
  | { status: 'rate_limited' }
  | { status: 'error' };

export type VerifyCodeResult =
  | { status: 'authenticated' }
  | { status: 'invalid_code' }
  | { status: 'expired' }
  | { status: 'not_found' }
  | { status: 'rate_limited' }
  | { status: 'error' };

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const AUTH_GATE_ENABLED = import.meta.env.VITE_AUTH_GATE_ENABLED !== 'false';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState('');
  const [isSubscriber, setIsSubscriber] = useState(!AUTH_GATE_ENABLED);
  const [checking, setChecking] = useState(AUTH_GATE_ENABLED);

  const refreshSession = async () => {
    if (!AUTH_GATE_ENABLED) {
      setEmail('');
      setIsSubscriber(true);
      setChecking(false);
      return;
    }

    setChecking(true);
    try {
      const res = await fetch('/api/auth/session', { method: 'GET', cache: 'no-store' });
      if (!res.ok) {
        setEmail('');
        setIsSubscriber(false);
        return;
      }
      const data = (await res.json().catch(() => ({}))) as {
        email?: string;
        isSubscriber?: boolean;
        isLoggedIn?: boolean;
      };
      if (data.isLoggedIn && data.email) {
        setEmail(data.email);
        setIsSubscriber(Boolean(data.isSubscriber));
        void syncLocalStateWithServer();
      } else {
        setEmail('');
        setIsSubscriber(false);
      }
    } catch {
      setEmail('');
      setIsSubscriber(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const requestCode = async (rawEmail: string): Promise<RequestCodeResult> => {
    if (!AUTH_GATE_ENABLED) return { status: 'error' };

    const emailNormalized = rawEmail.trim().toLowerCase();
    if (!emailNormalized) return { status: 'error' };

    try {
      const res = await fetch('/api/auth/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailNormalized }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        status?: string;
        challengeToken?: string;
        expiresIn?: number;
        devCode?: string;
      };

      if (data.status === 'code_sent' && data.challengeToken && data.expiresIn) {
        return {
          status: 'code_sent',
          challengeToken: data.challengeToken,
          expiresIn: data.expiresIn,
          devCode: data.devCode,
        };
      }

      if (data.status === 'not_found') return { status: 'not_found' };
      if (data.status === 'rate_limited') return { status: 'rate_limited' };
      return { status: 'error' };
    } catch {
      return { status: 'error' };
    }
  };

  const verifyCode = async (challengeToken: string, code: string): Promise<VerifyCodeResult> => {
    if (!AUTH_GATE_ENABLED) return { status: 'error' };

    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeToken, code }),
      });

      const data = (await res.json().catch(() => ({}))) as { status?: string };

      if (res.ok && data.status === 'authenticated') {
        await refreshSession();
        return { status: 'authenticated' };
      }

      if (data.status === 'expired') return { status: 'expired' };
      if (data.status === 'invalid_code') return { status: 'invalid_code' };
      if (data.status === 'not_found') return { status: 'not_found' };
      if (data.status === 'rate_limited') return { status: 'rate_limited' };
      return { status: 'error' };
    } catch {
      return { status: 'error' };
    }
  };

  const logout = async () => {
    if (!AUTH_GATE_ENABLED) {
      setEmail('');
      setIsSubscriber(true);
      setChecking(false);
      return;
    }

    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    setEmail('');
    setIsSubscriber(false);
  };

  const value = useMemo(
    () => ({
      email,
      isSubscriber,
      isLoggedIn: Boolean(email),
      checking,
      requestCode,
      verifyCode,
      refreshSession,
      logout,
    }),
    [email, isSubscriber, checking]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa ser usado dentro de AuthProvider.');
  return ctx;
}
