import { useEffect, useRef, useState } from 'react';
import { X, Loader2, AlertCircle, Mail } from 'lucide-react';
import { useAuth } from '../state/AuthContext';

interface LoginModalProps {
  onClose: () => void;
  onSuccess: () => void;
  /** Se true, abre direto no modo "assinar" (sem campo de login) */
  startOnSubscribe?: boolean;
}

type Step = 'email' | 'loading' | 'not_found' | 'error';

export default function LoginModal({ onClose, onSuccess, startOnSubscribe = false }: LoginModalProps) {
  const { login, checking } = useAuth();
  const [email, setEmail] = useState('');
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    setStep('loading');
    const result = await login(trimmed);

    if (result.status === 'subscriber') {
      onSuccess();
      return;
    }
    if (result.status === 'error') {
      setStep('error');
      return;
    }
    // not_found
    setStep('not_found');
  }

  async function handleSubscribe() {
    setStep('loading');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setStep('error');
      }
    } catch {
      setStep('error');
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
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

        <h2 className="font-headline text-xl font-black tracking-tight text-on-surface text-center uppercase mb-1">
          Acessar o Êxodo
        </h2>
        <p className="text-on-surface-variant text-xs text-center mb-8">
          Digite seu e-mail para verificar sua assinatura
        </p>

        {/* Formulário de e-mail */}
        {(step === 'email' || step === 'loading') && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                ref={inputRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                disabled={step === 'loading'}
                className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={step === 'loading' || !email.trim()}
              className="w-full bg-primary text-on-primary-container font-black text-sm uppercase tracking-widest py-3 rounded-xl hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {step === 'loading' ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Verificando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>
        )}

        {/* Sem assinatura encontrada */}
        {step === 'not_found' && (
          <div className="space-y-4">
            <div className="bg-surface-container border border-outline-variant/20 rounded-xl p-4 flex gap-3">
              <AlertCircle size={16} className="text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Nenhuma assinatura ativa encontrada para <span className="text-primary font-semibold">{email}</span>.
                Assine agora para ter acesso completo ao Êxodo.
              </p>
            </div>
            <button
              onClick={handleSubscribe}
              className="w-full bg-primary text-on-primary-container font-black text-sm uppercase tracking-widest py-3 rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2"
            >
              {checking ? (
                <><Loader2 size={14} className="animate-spin" /> Aguarde...</>
              ) : (
                'Assinar Agora'
              )}
            </button>
            <button
              onClick={() => { setStep('email'); }}
              className="w-full text-on-surface-variant/60 text-xs hover:text-on-surface-variant transition-colors py-2"
            >
              Tentar outro e-mail
            </button>
          </div>
        )}

        {/* Erro */}
        {step === 'error' && (
          <div className="space-y-4">
            <div className="bg-surface-container border border-outline-variant/20 rounded-xl p-4 flex gap-3">
              <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Ocorreu um erro ao verificar sua assinatura. Verifique sua conexão e tente novamente.
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
          Êxodo · Acesso por assinatura
        </p>
      </div>
    </div>
  );
}
