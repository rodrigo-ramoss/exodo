import { useState } from 'react';
import { BookOpen, Library, Wheat, BookMarked, Scroll, Check, Star, Lock, UserRound } from 'lucide-react';
import LoginModal from './LoginModal';

interface LandingPageProps {
  onEnter: () => void;
}

const FEATURES = [
  { icon: Wheat,        label: 'Maná',         desc: 'Estudos diários e séries bíblicas profundas' },
  { icon: UserRound,   label: 'Discípulos',    desc: 'Jornadas guiadas de discipulado e formação' },
  { icon: Library,      label: 'Rolos',        desc: 'Livraria completa de e-books e séries' },
  { icon: BookMarked,   label: 'Babel',        desc: 'Refutações e análise crítica de doutrinas' },
  { icon: Scroll,       label: 'Apócrifos',    desc: 'Textos deuterocanônicos e protocolo de leitura' },
  { icon: BookOpen,     label: 'Bíblia',       desc: 'Leitura bíblica com eixos temáticos' },
];

const PLAN_ITEMS = [
  'Acesso completo a todos os e-books',
  'Séries bíblicas exclusivas (Maná)',
  'Rolos com novos conteúdos mensais',
  'Refutações e exegese aprofundada',
  'Textos apócrifos com protocolo de leitura',
  'Progresso de leitura salvo por e-mail',
  'Suporte via canal da comunidade',
];

export default function LandingPage({ onEnter }: LandingPageProps) {
  const [showLogin, setShowLogin] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  async function handleSubscribe() {
    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: '' }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      // silently fail
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans">

      {/* ── HERO ── */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-6 text-center overflow-hidden">
        {/* Fundo com glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(242,192,141,0.07) 0%, transparent 70%)',
          }}
        />

        <div className="relative z-10 max-w-2xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-8">
            <Star size={11} className="text-primary fill-primary" />
            <span className="text-primary text-[10px] font-black uppercase tracking-widest">
              Plataforma de Estudos Bíblicos
            </span>
          </div>

          <h1 className="font-headline text-5xl sm:text-6xl font-black tracking-tighter text-on-surface uppercase leading-none mb-4">
            Ê<span className="text-primary">X</span>ODO
          </h1>

          <p className="text-on-surface-variant text-base sm:text-lg leading-relaxed mb-3 max-w-xl mx-auto">
            Uma jornada de investigação bíblica profunda — séries, e-books e estudos
            que a tradição religiosa não ousou mostrar.
          </p>

          <p className="text-on-surface-variant/60 text-sm mb-10">
            Exegese. Escatologia. Apócrifos. Doutrinas originais.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleSubscribe}
              disabled={checkoutLoading}
              className="bg-primary text-on-primary-container font-black text-sm uppercase tracking-widest px-8 py-4 rounded-xl hover:brightness-110 transition-all disabled:opacity-60 shadow-lg"
              style={{ boxShadow: '0 4px 24px rgba(242,192,141,0.25)' }}
            >
              {checkoutLoading ? 'Aguarde...' : 'Assinar Agora'}
            </button>
            <button
              onClick={() => setShowLogin(true)}
              className="bg-surface-container border border-outline-variant/30 text-on-surface font-bold text-sm uppercase tracking-widest px-8 py-4 rounded-xl hover:border-primary/40 transition-all"
            >
              Já sou assinante
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-30">
          <div className="w-px h-8 bg-on-surface-variant" />
          <span className="text-[9px] uppercase tracking-widest text-on-surface-variant">ver mais</span>
        </div>
      </section>

      {/* ── SEÇÕES DO APP ── */}
      <section className="px-6 py-20 max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-[10px] uppercase tracking-[0.25em] text-primary font-black">
            O que você acessa
          </span>
          <h2 className="font-headline text-2xl font-black uppercase tracking-tight mt-2 text-on-surface">
            Tudo em um só lugar
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="bg-surface-container-low border border-outline-variant/15 rounded-2xl p-4 flex flex-col gap-2 relative overflow-hidden group"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon size={16} className="text-primary" />
              </div>
              <p className="font-headline text-sm font-black uppercase tracking-tight text-on-surface">
                {label}
              </p>
              <p className="text-[11px] text-on-surface-variant leading-snug">
                {desc}
              </p>
              <Lock size={10} className="absolute top-3 right-3 text-on-surface-variant/25" />
            </div>
          ))}
        </div>
      </section>

      {/* ── PLANO ── */}
      <section className="px-6 py-20 max-w-sm mx-auto">
        <div
          className="bg-surface-container-low border border-primary/20 rounded-2xl p-8 relative overflow-hidden"
          style={{ boxShadow: '0 0 40px rgba(242,192,141,0.08)' }}
        >
          {/* Glow decorativo */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(242,192,141,0.06) 0%, transparent 70%)',
            }}
          />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <Star size={12} className="text-primary fill-primary" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-black">
                Plano Mensal
              </span>
            </div>

            <div className="mb-6">
              <span className="font-headline text-4xl font-black text-on-surface">R$ 19</span>
              <span className="text-on-surface-variant text-sm">/mês</span>
            </div>

            <ul className="space-y-3 mb-8">
              {PLAN_ITEMS.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Check size={13} className="text-primary shrink-0 mt-0.5" />
                  <span className="text-xs text-on-surface-variant leading-snug">{item}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={handleSubscribe}
              disabled={checkoutLoading}
              className="w-full bg-primary text-on-primary-container font-black text-sm uppercase tracking-widest py-4 rounded-xl hover:brightness-110 transition-all disabled:opacity-60"
            >
              {checkoutLoading ? 'Aguarde...' : 'Começar Agora'}
            </button>

            <p className="text-center text-[10px] text-on-surface-variant/40 mt-4">
              Cancele a qualquer momento
            </p>
          </div>
        </div>

        {/* Link de login */}
        <div className="text-center mt-6">
          <button
            onClick={() => setShowLogin(true)}
            className="text-on-surface-variant/50 text-xs hover:text-primary transition-colors"
          >
            Já sou assinante → Entrar
          </button>
        </div>
      </section>

      {/* ── RODAPÉ ── */}
      <footer className="border-t border-outline-variant/10 px-6 py-8 text-center">
        <p className="text-[10px] uppercase tracking-widest text-on-surface-variant/25 font-bold">
          Êxodo · Investigação Especial · {new Date().getFullYear()}
        </p>
      </footer>

      {/* Modal de login */}
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={() => {
            setShowLogin(false);
            onEnter();
          }}
        />
      )}
    </div>
  );
}
