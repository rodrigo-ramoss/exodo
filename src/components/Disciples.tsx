import { useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Compass, Lock, Sparkles, Target, UserRound, ChevronLeft, ChevronRight } from 'lucide-react';

type JourneyId = 'fundamentos-mundo-invisivel' | 'formacao-do-discipulo' | 'missao-e-multiplicacao';

interface DiscipleStep {
  id: string;
  badge: string;
  title: string;
  description: string;
}

interface DiscipleJourney {
  id: JourneyId;
  label: string;
  numero: string;
  titulo: string;
  subtitulo: string;
  descricao: string;
  steps: DiscipleStep[];
}

const DISCIPLE_JOURNEYS: DiscipleJourney[] = [
  {
    id: 'fundamentos-mundo-invisivel',
    label: 'JORNADA 1 - FUNDAMENTOS DO MUNDO INVISÍVEL',
    numero: '01',
    titulo: 'Fundamentos do Mundo Invisível',
    subtitulo: 'A base do discipulado espiritual',
    descricao:
      'Você vai entender, passo a passo, como a Bíblia apresenta a realidade invisível e o governo de Deus sobre o cosmos. Cada estudo prepara seu discernimento para caminhar com firmeza no Reino.',
    steps: [
      {
        id: 'passo-1',
        badge: 'PASSO 1',
        title: 'O Universo é um Templo',
        description: 'A criação como templo-cosmos: céus, terra e humanidade em aliança diante do Criador.',
      },
      {
        id: 'passo-2',
        badge: 'PASSO 2',
        title: 'O Conselho Celestial',
        description: 'Como a Escritura revela o governo divino e a ordem espiritual atuando na história.',
      },
      {
        id: 'passo-3',
        badge: 'PASSO 3',
        title: 'Guerra no Invisível',
        description: 'Discernindo conflitos espirituais, autoridade em Cristo e vigilância no dia a dia.',
      },
      {
        id: 'passo-4',
        badge: 'PASSO 4',
        title: 'Sacerdócio do Discípulo',
        description: 'Identidade, santidade e responsabilidade de representar o Reino com obediência.',
      },
      {
        id: 'passo-5',
        badge: 'PASSO 5',
        title: 'Visão e Perseverança',
        description: 'Como permanecer firme nas provações, guardar a fé e avançar com esperança.',
      },
    ],
  },
  {
    id: 'formacao-do-discipulo',
    label: 'JORNADA 2 - FORMAÇÃO DO DISCÍPULO',
    numero: '02',
    titulo: 'Formação do Discípulo',
    subtitulo: 'Caráter, disciplina e maturidade',
    descricao:
      'Uma trilha para consolidar hábitos espirituais, transformar o caráter e desenvolver constância no secreto. O foco é formar um discípulo estável por dentro e frutífero por fora.',
    steps: Array.from({ length: 5 }, (_, index) => ({
      id: `j2-passo-${index + 1}`,
      badge: `PASSO ${index + 1}`,
      title: `Em preparação ${index + 1}`,
      description: 'Conteúdo desta etapa em preparação para liberação.',
    })),
  },
  {
    id: 'missao-e-multiplicacao',
    label: 'JORNADA 3 - MISSÃO E MULTIPLICAÇÃO',
    numero: '03',
    titulo: 'Missão e Multiplicação',
    subtitulo: 'Discipulado que alcança outros',
    descricao:
      'Nesta jornada, o discipulado sai do interno para a missão: serviço, influência e multiplicação de vidas. Cada passo prepara você para conduzir pessoas no caminho do Reino.',
    steps: Array.from({ length: 5 }, (_, index) => ({
      id: `j3-passo-${index + 1}`,
      badge: `PASSO ${index + 1}`,
      title: `Em preparação ${index + 1}`,
      description: 'Conteúdo desta etapa em preparação para liberação.',
    })),
  },
];

const JOURNEY_ICON: Record<JourneyId, typeof Sparkles> = {
  'fundamentos-mundo-invisivel': Sparkles,
  'formacao-do-discipulo': Compass,
  'missao-e-multiplicacao': Target,
};

const JOURNEY_BG: Record<JourneyId, string> = {
  'fundamentos-mundo-invisivel': 'from-[#1f1a15] via-[#151312] to-[#0f0f0f]',
  'formacao-do-discipulo': 'from-[#221915] via-[#161211] to-[#0f0f0f]',
  'missao-e-multiplicacao': 'from-[#201912] via-[#151210] to-[#0f0f0f]',
};

function DragScrollRow({ children }: { children: ReactNode }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ isDown: false, startX: 0, scrollLeft: 0, didDrag: false });

  return (
    <div
      ref={rowRef}
      className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 sm:pb-4 snap-x snap-mandatory cursor-grab active:cursor-grabbing [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      onClickCapture={(event) => {
        if (drag.current.didDrag) {
          event.preventDefault();
          event.stopPropagation();
          drag.current.didDrag = false;
        }
      }}
      onPointerDown={(event) => {
        if (event.pointerType !== 'mouse') return;
        const el = rowRef.current;
        if (!el) return;
        drag.current = { isDown: true, startX: event.clientX, scrollLeft: el.scrollLeft, didDrag: false };
      }}
      onPointerMove={(event) => {
        if (event.pointerType !== 'mouse' || !drag.current.isDown) return;
        const el = rowRef.current;
        if (!el) return;
        const walk = event.clientX - drag.current.startX;
        if (Math.abs(walk) > 10) drag.current.didDrag = true;
        el.scrollLeft = drag.current.scrollLeft - walk;
      }}
      onPointerUp={() => {
        drag.current.isDown = false;
        setTimeout(() => {
          drag.current.didDrag = false;
        }, 0);
      }}
      onPointerLeave={() => {
        drag.current.isDown = false;
        drag.current.didDrag = false;
      }}
    >
      {children}
    </div>
  );
}

function StepCoverCard({ journeyId, step, compact = false }: { journeyId: JourneyId; step: DiscipleStep; compact?: boolean }) {
  return (
    <article className={`${compact ? 'w-[132px] sm:w-[148px]' : 'w-[156px] sm:w-[198px]'} shrink-0 snap-start`}>
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-primary/25">
        <div className={`absolute inset-0 bg-gradient-to-br ${JOURNEY_BG[journeyId]}`} />
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_16%_16%,rgba(242,192,141,0.22),transparent_46%)]" />
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(242,192,141,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(242,192,141,0.08)_1px,transparent_1px)] [background-size:18px_18px]" />

        <div className="absolute top-2 left-2 rounded-full border border-primary/30 bg-black/45 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.18em] text-primary">
          {step.badge}
        </div>
        <div className="absolute top-2 right-2 rounded-full border border-outline-variant/35 bg-black/45 p-1 text-on-surface-variant/80">
          <Lock size={10} />
        </div>

        <div className="absolute left-2.5 right-2.5 top-9 rounded-lg border border-primary/15 bg-black/55 p-2">
          <p className="text-[10px] font-black uppercase tracking-[0.08em] text-on-surface leading-snug line-clamp-3">
            {step.title}
          </p>
        </div>

        <p className="absolute left-2.5 right-2.5 bottom-2.5 text-center text-[8px] font-bold uppercase tracking-[0.14em] text-primary/90">
          Em preparação
        </p>
      </div>

      <p className="mt-1.5 sm:mt-2 text-[9px] sm:text-[10px] text-on-surface-variant leading-relaxed line-clamp-3">
        {step.description}
      </p>
    </article>
  );
}

function JourneyCard({ journey, onEnter }: { journey: DiscipleJourney; onEnter: () => void }) {
  const Icon = JOURNEY_ICON[journey.id];
  const rowRef = useRef<HTMLDivElement | null>(null);
  const previewSteps = useMemo(() => journey.steps.slice(0, 3), [journey.steps]);

  const scrollByAmount = (delta: number) => {
    rowRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-[#1f1a15] via-[#151312] to-[#101010] p-4 sm:p-5 shadow-[0_18px_42px_rgba(0,0,0,0.38)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/55 hover:shadow-[0_22px_50px_rgba(0,0,0,0.5)]">
      <div className="pointer-events-none absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_90%_10%,rgba(242,192,141,0.2),transparent_45%)]" />
      <div className="pointer-events-none absolute right-2 top-0 text-[62px] sm:text-[84px] font-black tracking-tighter text-primary/10 select-none">
        {journey.numero}
      </div>

      <div className="relative z-10">
        <div className="mb-2.5 sm:mb-3 flex items-center justify-between gap-2">
          <span className="inline-flex rounded-full border border-primary/35 bg-primary/10 px-2 py-0.5 sm:py-1 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.17em] text-primary">
            {journey.label}
          </span>
          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary/85" />
        </div>

        <h3 className="font-headline text-2xl sm:text-3xl leading-none font-black text-on-surface mb-1.5 sm:mb-2">{journey.titulo}</h3>
        <p className="text-xs sm:text-sm font-semibold text-primary/90 mb-1.5 sm:mb-2">{journey.subtitulo}</p>
        <p className="text-[11px] sm:text-xs text-on-surface-variant leading-relaxed mb-3 sm:mb-4">{journey.descricao}</p>

        <div className="border-t border-primary/15 pt-2.5 sm:pt-3">
          <div className="mb-1.5 sm:mb-2 flex items-center justify-between">
            <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.18em] text-primary/80">Caminhos desta jornada</p>
            <div className="hidden sm:flex items-center gap-1">
              <button type="button" onClick={() => scrollByAmount(-180)} className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-outline-variant/40 bg-black/40 text-on-surface-variant hover:border-primary/50 hover:text-primary transition-colors" aria-label="Voltar caminhos">
                <ChevronLeft size={12} />
              </button>
              <button type="button" onClick={() => scrollByAmount(180)} className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-outline-variant/40 bg-black/40 text-on-surface-variant hover:border-primary/50 hover:text-primary transition-colors" aria-label="Avançar caminhos">
                <ChevronRight size={12} />
              </button>
            </div>
          </div>

          <div ref={rowRef} className="flex gap-2.5 sm:gap-3 overflow-x-auto snap-x snap-mandatory pb-1.5 sm:pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {previewSteps.map((step) => (
              <StepCoverCard key={step.id} journeyId={journey.id} step={step} compact />
            ))}
          </div>
        </div>

        <button type="button" onClick={onEnter} className="mt-3 sm:mt-4 inline-flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-primary">
          Entrar na jornada
          <ArrowRight size={12} className="transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      </div>
    </article>
  );
}

export default function Disciples() {
  const [activeJourneyId, setActiveJourneyId] = useState<JourneyId | null>(null);

  const activeJourney = useMemo(
    () => DISCIPLE_JOURNEYS.find((journey) => journey.id === activeJourneyId) || null,
    [activeJourneyId],
  );

  if (activeJourney) {
    return (
      <div className="pt-4 sm:pt-6 pb-24 sm:pb-28 px-4 sm:px-6 max-w-7xl mx-auto min-h-screen bg-surface-container-lowest">
        <section className="rounded-3xl border border-outline-variant/25 bg-gradient-to-b from-surface-container-low to-surface-container p-4 sm:p-6">
          <button type="button" onClick={() => setActiveJourneyId(null)} className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/70 hover:text-primary transition-colors">
            <ArrowLeft size={12} />
            Discípulos
          </button>

          <div className="mt-3 sm:mt-4 mb-4 sm:mb-5">
            <span className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 sm:py-1 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.18em] text-primary mb-1.5 sm:mb-2">
              {activeJourney.label}
            </span>
            <h2 className="font-headline text-2xl sm:text-4xl font-black tracking-tight text-on-surface uppercase">{activeJourney.titulo}</h2>
            <p className="text-xs sm:text-sm text-primary/85 font-semibold mt-1">{activeJourney.subtitulo}</p>
            <p className="text-[11px] sm:text-xs text-on-surface-variant leading-relaxed mt-1.5 sm:mt-2 max-w-3xl">{activeJourney.descricao}</p>
          </div>

          <div className="relative -mx-4 px-4 sm:-mx-6 sm:px-6 mt-4 sm:mt-6">
            <div className="mb-2">
              <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.18em] text-primary/80">Caminhos desta jornada</p>
            </div>
            <div className="pointer-events-none absolute -bottom-1 left-5 right-5 sm:left-6 sm:right-6 h-1 bg-gradient-to-r from-primary/30 via-outline-variant/10 to-transparent opacity-20" />
            <DragScrollRow>
              {activeJourney.steps.map((step) => (
                <StepCoverCard key={step.id} journeyId={activeJourney.id} step={step} />
              ))}
            </DragScrollRow>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="pb-20 sm:pb-24 min-h-screen bg-surface-container-lowest">
      <div className="pt-6 sm:pt-8 px-4 sm:px-6 mb-6 sm:mb-8">
        <header className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-[#1f1a15] via-[#131110] to-[#0d0d0d] px-4 sm:px-8 py-6 sm:py-10 shadow-[0_24px_65px_rgba(0,0,0,0.58)]">
          <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_18%_20%,rgba(242,192,141,0.26),transparent_42%),radial-gradient(circle_at_78%_88%,rgba(212,165,116,0.16),transparent_36%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-10 [background-image:linear-gradient(rgba(242,192,141,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(242,192,141,0.05)_1px,transparent_1px)] [background-size:20px_20px]" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-2.5 sm:px-3 py-0.5 sm:py-1 mb-2.5 sm:mb-3">
              <UserRound size={12} className="text-primary" />
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.22em] text-primary">Seção Discípulos</span>
            </div>
            <h1 className="font-headline text-3xl sm:text-5xl font-black text-primary mb-1.5 sm:mb-2 tracking-tighter text-shadow-glow">
              DISCÍPULOS
            </h1>
            <p className="text-xs sm:text-base text-on-surface font-semibold mb-1.5 sm:mb-2">
              Formação para quem deseja caminhar e multiplicar no Reino.
            </p>
            <p className="text-[11px] sm:text-sm text-on-surface-variant/90 leading-relaxed max-w-3xl">
              Jornadas de discipulado com fundamentos, prática e missão. Os caminhos desta área estão sendo preparados
              para uma construção progressiva e sólida.
            </p>
          </div>
        </header>
      </div>

      <section className="px-4 sm:px-6 pb-8 sm:pb-10">
        <div className="mb-3 sm:mb-4">
          <h2 className="font-headline text-xl sm:text-3xl font-black tracking-tight text-on-surface">Escolha sua jornada</h2>
          <p className="text-xs text-on-surface-variant mt-1">
            Cada jornada cobre uma frente do discipulado. Comece pela base e avance com constância.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 sm:gap-4">
          {DISCIPLE_JOURNEYS.map((journey) => (
            <JourneyCard key={journey.id} journey={journey} onEnter={() => setActiveJourneyId(journey.id)} />
          ))}
        </div>
      </section>
    </div>
  );
}
