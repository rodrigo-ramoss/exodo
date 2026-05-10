/**
 * AuthContext.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Gerencia o estado de autenticação do usuário.
 *
 * Fluxo:
 *  1. Usuário digita o e-mail → chamamos /api/plano-mensal
 *  2. Se tem assinatura ativa → isSubscriber = true, acesso liberado
 *  3. Se não tem → mostramos opção de assinar (redireciona ao Stripe)
 *
 * Persistência: email e status ficam no localStorage por 30 dias.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const KEY_EMAIL      = 'exodo:auth-email';
const KEY_SUBSCRIBER = 'exodo:auth-subscriber';
const KEY_EXPIRES    = 'exodo:auth-expires';
const SESSION_DAYS   = 30;

interface AuthContextValue {
  /** E-mail do usuário autenticado, ou string vazia se não autenticado */
  email: string;
  /** true = tem assinatura ativa no Stripe */
  isSubscriber: boolean;
  /** true = passou pelo login (pode ser free ou pago) */
  isLoggedIn: boolean;
  /** Estado de carregamento durante a verificação */
  checking: boolean;
  /** Faz login verificando o e-mail no Stripe */
  login: (email: string) => Promise<LoginResult>;
  /** Desloga o usuário */
  logout: () => void;
}

export type LoginResult =
  | { status: 'subscriber' }
  | { status: 'not_found' }
  | { status: 'error' };

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function isSessionValid(): boolean {
  try {
    const exp = localStorage.getItem(KEY_EXPIRES);
    if (!exp) return false;
    return Date.now() < parseInt(exp, 10);
  } catch {
    return false;
  }
}

function saveSession(email: string, isSubscriber: boolean): void {
  try {
    const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(KEY_EMAIL, email);
    localStorage.setItem(KEY_SUBSCRIBER, isSubscriber ? '1' : '0');
    localStorage.setItem(KEY_EXPIRES, String(expires));
  } catch {}
}

function clearSession(): void {
  try {
    localStorage.removeItem(KEY_EMAIL);
    localStorage.removeItem(KEY_SUBSCRIBER);
    localStorage.removeItem(KEY_EXPIRES);
  } catch {}
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState<string>(() => {
    if (!isSessionValid()) return '';
    try { return localStorage.getItem(KEY_EMAIL) ?? ''; } catch { return ''; }
  });

  const [isSubscriber, setIsSubscriber] = useState<boolean>(() => {
    if (!isSessionValid()) return false;
    try { return localStorage.getItem(KEY_SUBSCRIBER) === '1'; } catch { return false; }
  });

  const [checking, setChecking] = useState(false);

  // Limpa sessão expirada ao montar
  useEffect(() => {
    if (!isSessionValid() && (email || isSubscriber)) {
      clearSession();
      setEmail('');
      setIsSubscriber(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (rawEmail: string): Promise<LoginResult> => {
    const trimmed = rawEmail.trim().toLowerCase();
    setChecking(true);
    try {
      const res = await fetch('/api/plano-mensal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });

      const data = await res.json().catch(() => ({})) as {
        isMonthly?: boolean;
        checked?: boolean;
      };

      if (data.isMonthly) {
        saveSession(trimmed, true);
        setEmail(trimmed);
        setIsSubscriber(true);
        return { status: 'subscriber' };
      }

      if (data.checked === false) {
        return { status: 'error' };
      }

      // E-mail existe mas sem assinatura ativa
      return { status: 'not_found' };
    } catch {
      return { status: 'error' };
    } finally {
      setChecking(false);
    }
  };

  const logout = () => {
    clearSession();
    setEmail('');
    setIsSubscriber(false);
  };

  const value = useMemo(
    () => ({ email, isSubscriber, isLoggedIn: !!email, checking, login, logout }),
    [email, isSubscriber, checking] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa ser usado dentro de AuthProvider.');
  return ctx;
}
