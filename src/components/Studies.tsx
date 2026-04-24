import { useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  HeartPulse,
  Sparkles,
  Sword,
  Tent,
} from 'lucide-react';
import { pm } from '../lib/progressManager';

type TendaId = 'vida-espiritual' | 'vida-interior' | 'vida-exterior';

interface ManaTema {
  id: string;
  slug: string;
  badge: string;
  title: string;
  description?: string;
  status?: 'published' | 'planned';
}

interface ManaTenda {
  id: TendaId;
  label: string;
  numero: string;
  titulo: string;
  subtitulo: string;
  descricao: string;
  temas: ManaTema[];
}

const MANA_TENDAS: ManaTenda[] = [
  {
    id: 'vida-espiritual',
    label: 'TENDA 1 - VIDA ESPIRITUAL',
    numero: '01',
    titulo: 'Vida Espiritual',
    subtitulo: 'O núcleo da guerra',
    descricao:
      'Oração, guerra espiritual, discernimento, jejum, intimidade com Deus e armas espirituais para sustentar sua caminhada.',
    temas: [
      {
        id: 'quarto-secreto',
        slug: 'vida-espiritual/o-quarto-secreto',
        badge: 'E-BOOK 01',
        title: 'O Quarto Secreto - Desenvolvendo uma Vida Devocional Poderosa',
        description:
          'A disciplina do encontro diário com Deus, a oração secreta e a vida devocional como fundamento da força espiritual.',
        status: 'published',
      },
      {
        id: 'fortalezas-mentais',
        slug: 'vida-espiritual/fortalezas-mentais',
        badge: 'E-BOOK 02',
        title: 'Fortalezas Mentais - Vencendo Pensamentos de Derrota',
        description:
          'Um estudo sobre pensamentos obsessivos, acusações, dúvidas e a renovação da mente pelas armas do Espírito.',
        status: 'published',
      },
    ],
  },
  {
    id: 'vida-interior',
    label: 'TENDA 2 - VIDA INTERIOR',
    numero: '02',
    titulo: 'Vida Interior',
    subtitulo: 'Emoções, mente e relacionamentos',
    descricao:
      'Estudos sobre ansiedade, depressão, cura interior, batalha da mente, casamento, sexualidade, perdão e vínculos espirituais.',
    temas: [
      {
        id: 'vale-da-sombra',
        slug: 'vida-interior/o-vale-da-sombra',
        badge: 'TEMA 01',
        title: 'O Vale da Sombra - A Bíblia e a Depressão',
        status: 'planned',
      },
      {
        id: 'rejeicao-identidade',
        slug: 'vida-interior/rejeicao-identidade-em-cristo',
        badge: 'TEMA 02',
        title: 'Rejeição - Encontrando Identidade em Cristo',
        status: 'planned',
      },
      {
        id: 'namoro-solteirice',
        slug: 'vida-interior/namoro-e-solteirice',
        badge: 'TEMA 03',
        title: 'Namoro e Solteirice - Princípios do Reino para Relacionamentos Santos',
        status: 'planned',
      },
    ],
  },
  {
    id: 'vida-exterior',
    label: 'TENDA 3 - VIDA EXTERIOR',
    numero: '03',
    titulo: 'Vida Exterior',
    subtitulo: 'Trabalho, missão e sociedade',
    descricao:
      'Conteúdos sobre vocação, finanças, missão, evangelismo, cultura, influência, igreja e vida pública diante do Reino.',
    temas: [
      {
        id: 'trabalho-adoracao',
        slug: 'vida-exterior/trabalho-como-adoracao',
        badge: 'TEMA 01',
        title: 'Trabalho como Adoração - Descobrindo o Chamado de Deus para Sua Profissão',
        status: 'planned',
      },
      {
        id: 'embaixadores-reino',
        slug: 'vida-exterior/embaixadores-do-reino',
        badge: 'TEMA 02',
        title: 'Embaixadores do Reino - Como Compartilhar Sua Fé no Dia a Dia',
        status: 'planned',
      },
      {
        id: 'financas-reino',
        slug: 'vida-exterior/financas-do-reino',
        badge: 'TEMA 03',
        title: 'Finanças do Reino - Mordomia, Dívidas e Generosidade',
        status: 'planned',
      },
    ],
  },
];

const TENDA_ICON: Record<TendaId, typeof Sparkles> = {
  'vida-espiritual': Sword,
  'vida-interior': HeartPulse,
  'vida-exterior': BriefcaseBusiness,
};

const TENDA_BG: Record<TendaId, string> = {
  'vida-espiritual': 'from-[#251a12] via-[#171310] to-[#0f0f0f]',
  'vida-interior': 'from-[#241915] via-[#171312] to-[#101010]',
  'vida-exterior': 'from-[#201a13] via-[#151312] to-[#0f0f0f]',
};

function DragScrollRow({ children }: { children: ReactNode }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ isDown: false, startX: 0, scrollLeft: 0, didDrag: false });

  return (
    <div
      ref={rowRef}
      className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory cursor-grab active:cursor-grabbing [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      onClickCapture={(e) => {
        if (drag.current.didDrag) {
          e.preventDefault();
          e.stopPropagation();
          drag.current.didDrag = false;
        }
      }}
      onPointerDown={(e) => {
        if (e.pointerType !== 'mouse') return;
        const el = rowRef.current;
        if (!el) return;
        drag.current = { isDown: true, startX: e.clientX, scrollLeft: el.scrollLeft, didDrag: false };
      }}
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse' || !drag.current.isDown) return;
        const el = rowRef.current;
        if (!el) return;
        const walk = e.clientX - drag.current.startX;
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

function TemaPreviewCard({ tendaId, tema }: { tendaId: TendaId; tema: ManaTema }) {
  return (
    <div className="relative shrink-0 w-[156px] sm:w-[168px] snap-start">
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-primary/20">
        <div className={`absolute inset-0 bg-gradient-to-br ${TENDA_BG[tendaId]}`} />
        <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_22%_18%,rgba(242,192,141,0.25),transparent_45%)]" />
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(242,192,141,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(242,192,141,0.08)_1px,transparent_1px)] [background-size:17px_17px]" />

        <div className="relative z-10 h-full p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-md border border-primary/35 bg-black/45 px-2 py-1 text-[8px] font-black tracking-[0.16em] text-primary">
              {tema.badge}
            </span>
            {tema.status === 'planned' && (
              <span className="rounded-md border border-outline-variant/50 bg-black/40 px-2 py-1 text-[7px] font-black uppercase tracking-wider text-on-surface-variant/75">
                Em preparo
              </span>
            )}
          </div>
          <h4 className="text-[13px] font-extrabold leading-tight text-on-surface line-clamp-4">{tema.title}</h4>
        </div>
      </div>
      {tema.description && <p className="mt-2 text-[10px] text-on-surface-variant leading-relaxed line-clamp-3">{tema.description}</p>}
    </div>
  );
}

function TendaCard({ tenda, onEnter }: { tenda: ManaTenda; onEnter: () => void }) {
  const Icon = TENDA_ICON[tenda.id];
  const rowRef = useRef<HTMLDivElement | null>(null);

  const scrollByAmount = (delta: number) => {
    rowRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-[#1f1a15] via-[#151312] to-[#101010] p-5 shadow-[0_18px_42px_rgba(0,0,0,0.38)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/55 hover:shadow-[0_22px_50px_rgba(0,0,0,0.5)]">
      <div className="pointer-events-none absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_90%_10%,rgba(242,192,141,0.2),transparent_45%)]" />
      <div className="pointer-events-none absolute right-2 top-0 text-[84px] font-black tracking-tighter text-primary/10 select-none">
        {tenda.numero}
      </div>

      <div className="relative z-10">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="inline-flex rounded-full border border-primary/35 bg-primary/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.17em] text-primary">
            {tenda.label}
          </span>
          <Icon size={16} className="text-primary/85" />
        </div>

        <h3 className="font-headline text-3xl leading-none font-black text-on-surface mb-2">{tenda.titulo}</h3>
        <p className="text-sm font-semibold text-primary/90 mb-2">{tenda.subtitulo}</p>
        <p className="text-xs text-on-surface-variant leading-relaxed mb-4">{tenda.descricao}</p>

        <div className="border-t border-primary/15 pt-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-primary/80">Temas desta tenda</p>
            <div className="hidden sm:flex items-center gap-1">
              <button
                type="button"
                onClick={() => scrollByAmount(-180)}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-outline-variant/40 bg-black/40 text-on-surface-variant hover:border-primary/50 hover:text-primary transition-colors"
                aria-label="Voltar temas"
              >
                <ChevronLeft size={12} />
              </button>
              <button
                type="button"
                onClick={() => scrollByAmount(180)}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-outline-variant/40 bg-black/40 text-on-surface-variant hover:border-primary/50 hover:text-primary transition-colors"
                aria-label="Avançar temas"
              >
                <ChevronRight size={12} />
              </button>
            </div>
          </div>

          <div ref={rowRef} className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tenda.temas.map((tema) => (
              <TemaPreviewCard key={tema.id} tendaId={tenda.id} tema={tema} />
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onEnter}
          className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary"
        >
          Entrar na tenda
          <ArrowRight size={12} className="transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      </div>
    </article>
  );
}

function TendaShelfCard({ tendaId, tema }: { tendaId: TendaId; tema: ManaTema }) {
  const progress = pm.getProgress('mana', tema.slug);
  const isCompleted = pm.isRead('mana', tema.slug);

  return (
    <div className="group shrink-0 w-[172px] sm:w-[198px] flex flex-col snap-start">
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden border border-primary/25">
        <div className={`absolute inset-0 bg-gradient-to-br ${TENDA_BG[tendaId]}`} />
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_15%_16%,rgba(242,192,141,0.22),transparent_46%)]" />
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(242,192,141,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(242,192,141,0.08)_1px,transparent_1px)] [background-size:18px_18px]" />

        <div className="relative z-10 h-full p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="rounded-md border border-primary/35 bg-black/45 px-2 py-1 text-[8px] font-black tracking-[0.16em] text-primary">
              {tema.badge}
            </span>
            {tema.status === 'planned' && (
              <span className="rounded-md border border-outline-variant/50 bg-black/40 px-2 py-1 text-[7px] font-black uppercase tracking-wider text-on-surface-variant/75">
                Em preparo
              </span>
            )}
          </div>
          <h4 className="text-[13px] font-extrabold leading-tight text-on-surface line-clamp-4">{tema.title}</h4>
        </div>
      </div>

      <p className="mt-2 text-[10px] text-on-surface-variant leading-relaxed line-clamp-3">
        {tema.description || 'Tema preparado para receber conteúdo completo nesta tenda.'}
      </p>

      <div className="mt-2 h-1.5 w-full rounded-full bg-surface-container-high overflow-hidden border border-outline-variant/15">
        <div
          className={isCompleted ? 'h-full bg-gradient-to-r from-[#D4AF37] to-[#F5D76E]' : 'h-full bg-gradient-to-r from-orange-500 to-yellow-400'}
          style={{ width: `${isCompleted ? 100 : progress}%` }}
        />
      </div>
    </div>
  );
}

export default function Studies() {
  const [activeTendaId, setActiveTendaId] = useState<TendaId | null>(null);

  const activeTenda = useMemo(
    () => MANA_TENDAS.find((tenda) => tenda.id === activeTendaId) || null,
    [activeTendaId],
  );

  if (activeTenda) {
    return (
      <div className="pt-6 pb-28 px-4 sm:px-6 max-w-7xl mx-auto min-h-screen bg-surface-container-lowest">
        <section className="rounded-3xl border border-outline-variant/25 bg-gradient-to-b from-surface-container-low to-surface-container p-5 sm:p-6">
          <button
            type="button"
            onClick={() => setActiveTendaId(null)}
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/70 hover:text-primary transition-colors"
          >
            <ArrowLeft size={12} />
            Maná
          </button>

          <div className="mt-4 mb-5">
            <span className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-primary mb-2">
              {activeTenda.label}
            </span>
            <h2 className="font-headline text-3xl sm:text-4xl font-black tracking-tight text-on-surface uppercase">
              {activeTenda.titulo}
            </h2>
            <p className="text-sm text-primary/85 font-semibold mt-1">{activeTenda.subtitulo}</p>
            <p className="text-xs text-on-surface-variant leading-relaxed mt-2 max-w-3xl">{activeTenda.descricao}</p>
          </div>

          <div className="relative -mx-5 px-5 sm:-mx-6 sm:px-6 mt-6">
            <div className="pointer-events-none absolute -bottom-1 left-5 right-5 sm:left-6 sm:right-6 h-1 bg-gradient-to-r from-primary/30 via-outline-variant/10 to-transparent opacity-20" />
            <DragScrollRow>
              {activeTenda.temas.map((tema) => (
                <TendaShelfCard key={tema.id} tendaId={activeTenda.id} tema={tema} />
              ))}
            </DragScrollRow>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="pb-24 min-h-screen bg-surface-container-lowest">
      <div className="pt-8 px-4 sm:px-6 mb-8">
        <header className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-[#1f1a15] via-[#131110] to-[#0d0d0d] px-6 py-8 sm:px-8 sm:py-10 shadow-[0_24px_65px_rgba(0,0,0,0.58)]">
          <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_18%_20%,rgba(242,192,141,0.26),transparent_42%),radial-gradient(circle_at_78%_88%,rgba(212,165,116,0.16),transparent_36%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-10 [background-image:linear-gradient(rgba(242,192,141,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(242,192,141,0.05)_1px,transparent_1px)] [background-size:20px_20px]" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-3 py-1 mb-3">
              <Tent size={12} className="text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Seção Maná</span>
            </div>
            <h1 className="font-headline text-4xl sm:text-5xl font-black text-primary mb-2 tracking-tighter text-shadow-glow">
              MANÁ
            </h1>
            <p className="text-sm sm:text-base text-on-surface font-semibold mb-2">
              O alimento sólido para a batalha de hoje.
            </p>
            <p className="text-xs sm:text-sm text-on-surface-variant/90 leading-relaxed max-w-3xl">
              E-books e estudos profundos para fortalecer sua vida espiritual, curar sua vida interior e preparar você
              para cumprir sua missão no mundo.
            </p>
          </div>
        </header>
      </div>

      <section className="px-4 sm:px-6 pb-10">
        <div className="mb-4">
          <h2 className="font-headline text-2xl sm:text-3xl font-black tracking-tight text-on-surface">Escolha sua tenda</h2>
          <p className="text-xs text-on-surface-variant mt-1">
            Cada tenda conduz uma área da sua jornada. Escolha por onde deseja ser alimentado hoje.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {MANA_TENDAS.map((tenda) => (
            <TendaCard key={tenda.id} tenda={tenda} onEnter={() => setActiveTendaId(tenda.id)} />
          ))}
        </div>
      </section>
    </div>
  );
}
