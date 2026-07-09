import { useEffect, useRef, useState } from 'react';
import { X, Loader2, AlertCircle, Mail } from 'lucide-react';
import { type RequestCodeResult, useAuth } from '../state/AuthContext';

interface LoginModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type Step =
  | 'email'
  | 'sending_code'
  | 'code'
  | 'verifying_code'
  | 'rate_limited'
  | 'error';

const RESEND_COOLDOWN_SECONDS = 30;

export default function LoginModal({ onClose, onSuccess }: LoginModalProps) {
  const { requestCode, verifyCode } = useAuth();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [challengeToken, setChallengeToken] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [codeHint, setCodeHint] = useState('');
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [expiresIn, setExpiresIn] = useState(0);
  const [step, setStep] = useState<Step>('email');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timeout = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((previous) => Math.max(0, previous - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (expiresIn <= 0) return;
    const timer = window.setInterval(() => {
      setExpiresIn((previous) => Math.max(0, previous - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [expiresIn]);

  function applyCodeSent(result: Extract<RequestCodeResult, { status: 'code_sent' }>) {
    setChallengeToken(result.challengeToken);
    setCode('');
    setCodeHint('');
    setDevCode(result.devCode ?? null);
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    setExpiresIn(result.expiresIn);
    setStep('code');
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    setStep('sending_code');
    setCodeHint('');
    const result = await requestCode(trimmed);

    if (result.status === 'code_sent') {
      applyCodeSent(result);
      return;
    }
    if (result.status === 'not_found') {
      setStep('error');
      return;
    }
    if (result.status === 'rate_limited') {
      setStep('rate_limited');
      return;
    }
    setStep('error');
  }

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    const normalizedCode = code.trim();
    if (!challengeToken || normalizedCode.length !== 6) return;

    setStep('verifying_code');
    setCodeHint('');
    const result = await verifyCode(challengeToken, normalizedCode);
    if (result.status === 'authenticated') {
      onSuccess();
      return;
    }
    if (result.status === 'not_found') {
      setStep('error');
      return;
    }
    if (result.status === 'expired') {
      setCode('');
      setCodeHint('Código expirado. Solicite um novo código.');
      setStep('code');
      return;
    }
    if (result.status === 'invalid_code') {
      setCode('');
      setCodeHint('Código inválido. Confira e tente novamente.');
      setStep('code');
      return;
    }
    if (result.status === 'rate_limited') {
      setStep('rate_limited');
      return;
    }
    setStep('error');
  }

  async function handleResendCode() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || resendCooldown > 0 || resending) return;

    setResending(true);
    setCodeHint('');
    const result = await requestCode(trimmed);

    if (result.status === 'code_sent') {
      applyCodeSent(result);
      setCodeHint('Novo código enviado para seu e-mail.');
      setResending(false);
      return;
    }

    if (result.status === 'rate_limited') {
      setStep('rate_limited');
      setResending(false);
      return;
    }

    if (result.status === 'not_found') {
      setStep('error');
      setResending(false);
      return;
    }

    setStep('error');
    setResending(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
    >
      <div
        className="relative w-full max-w-md bg-surface-container-low border border-outline-variant/20 rounded-2xl px-8 py-10 shadow-2xl"
        style={{ boxShadow: '0 0 60px rgba(242,192,141,0.08)' }}
      >
        {/* Fechar */}
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-4 right-4 text-on-surface-variant/50 hover:text-primary transition-colors"
        >
          <X size={18} />
        </button>

        {/* Ícone */}
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Mail size={20} className="text-primary" />
          </div>
        </div>

        <h2 id="login-modal-title" className="font-headline text-xl font-black tracking-tight text-on-surface text-center uppercase mb-1">
          Salve sua jornada
        </h2>
        <p className="text-on-surface-variant text-xs text-center mb-8">
          Entre gratuitamente para sincronizar leituras, notas e destaques
        </p>

        {(step === 'email' || step === 'sending_code') && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <input
                ref={inputRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                disabled={step === 'sending_code'}
                className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={step === 'sending_code' || !email.trim()}
              className="w-full bg-primary text-on-primary-container font-black text-sm uppercase tracking-widest py-3 rounded-xl hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {step === 'sending_code' ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Enviando código...
                </>
              ) : (
                'Enviar Código'
              )}
            </button>
          </form>
        )}

        {(step === 'code' || step === 'verifying_code') && (
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <div className="bg-surface-container border border-outline-variant/20 rounded-xl p-4">
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Enviamos um código de 6 dígitos para{' '}
                <span className="text-primary font-semibold">{email}</span>.
              </p>
              <p className="mt-1 text-[10px] text-on-surface-variant/70">
                {expiresIn > 0 ? `Expira em ${Math.ceil(expiresIn / 60)} min` : 'Código expirado'}
              </p>
            </div>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              autoFocus
              disabled={step === 'verifying_code'}
              className="w-full text-center tracking-[0.5em] bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50"
            />
            {devCode && (
              <p className="text-[10px] text-primary/80 text-center">
                Dev code: {devCode}
              </p>
            )}
            {codeHint && (
              <p className="text-[11px] text-on-surface-variant text-center">
                {codeHint}
              </p>
            )}
            <button
              type="submit"
              disabled={step === 'verifying_code' || code.trim().length !== 6}
              className="w-full bg-primary text-on-primary-container font-black text-sm uppercase tracking-widest py-3 rounded-xl hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {step === 'verifying_code' ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Confirmando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={resendCooldown > 0 || resending}
              className="w-full bg-surface-container-high border border-outline-variant/30 text-on-surface font-bold text-xs uppercase tracking-widest py-2.5 rounded-xl hover:border-primary/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {resending ? (
                <><Loader2 size={12} className="animate-spin" /> Reenviando...</>
              ) : resendCooldown > 0 ? (
                `Reenviar em ${resendCooldown}s`
              ) : (
                'Não recebi o código'
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setCode('');
                setCodeHint('');
                setStep('email');
              }}
              className="w-full text-on-surface-variant/60 text-xs hover:text-on-surface-variant transition-colors py-2"
            >
              Trocar e-mail
            </button>
          </form>
        )}

        {step === 'rate_limited' && (
          <div className="space-y-4">
            <div className="bg-surface-container border border-outline-variant/20 rounded-xl p-4 flex gap-3">
              <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Muitas tentativas em sequência. Aguarde alguns segundos e tente novamente.
              </p>
            </div>
            <button
              onClick={() => setStep('email')}
              className="w-full bg-surface-container-high border border-outline-variant/30 text-on-surface font-bold text-sm uppercase tracking-widest py-3 rounded-xl hover:border-primary/40 transition-all"
            >
              Voltar
            </button>
          </div>
        )}

        {/* Erro */}
        {step === 'error' && (
          <div className="space-y-4">
            <div className="bg-surface-container border border-outline-variant/20 rounded-xl p-4 flex gap-3">
              <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Não foi possível entrar agora. Verifique sua conexão e tente novamente.
              </p>
            </div>
            <button
              onClick={() => setStep('email')}
              className="w-full bg-surface-container-high border border-outline-variant/30 text-on-surface font-bold text-sm uppercase tracking-widest py-3 rounded-xl hover:border-primary/40 transition-all"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        <p className="text-center text-[10px] text-on-surface-variant/30 mt-8 uppercase tracking-widest">
          Êxodo · Conta gratuita · Sincronização segura
        </p>
      </div>
    </div>
  );
}
