import { useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, BookOpenText, BriefcaseBusiness, HeartPulse, Sparkles, Sword, Tent } from 'lucide-react';
import { pm } from '../lib/progressManager';

type TendaId = 'vida-espiritual' | 'vida-interior' | 'vida-exterior';

interface ManaEbook {
  id: string;
  slug: string;
  badge: string;
  title: string;
  description: string;
}

interface ManaTenda {
  id: TendaId;
  label: string;
  numero: string;
  titulo: string;
  subtitulo: string;
  descricao: string;
  temas: ManaEbook[];
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
      },
      {
        id: 'fortalezas-mentais',
        slug: 'vida-espiritual/fortalezas-mentais',
        badge: 'E-BOOK 02',
        title: 'Fortalezas Mentais - Vencendo Pensamentos de Derrota',
        description:
          'Um estudo sobre pensamentos obsessivos, acusações, dúvidas e a renovação da mente pelas armas do Espírito.',
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
        badge: 'E-BOOK 01',
        title: 'O Vale da Sombra - A Bíblia e a Depressão',
        description:
          'Uma abordagem bíblica, profunda e sem respostas simplistas sobre depressão, lamento, esperança e cuidado.',
      },
      {
        id: 'rejeicao-identidade',
        slug: 'vida-interior/rejeicao-identidade-em-cristo',
        badge: 'E-BOOK 02',
        title: 'Rejeição - Encontrando Identidade em Cristo',
        description:
          'Um estudo sobre as raízes da rejeição, suas marcas na alma e a cura da identidade pela adoção em Cristo.',
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
        badge: 'E-BOOK 01',
        title: 'Trabalho como Adoração - Descobrindo o Chamado de Deus para Sua Profissão',
        description:
          'A profissão como campo de missão, altar de serviço e expressão prática da vocação diante de Deus.',
      },
      {
        id: 'embaixadores-reino',
        slug: 'vida-exterior/embaixadores-do-reino',
        badge: 'E-BOOK 02',
        title: 'Embaixadores do Reino - Como Compartilhar Sua Fé no Dia a Dia',
        description:
          'Evangelismo natural, relacional e poderoso para o contexto urbano e digital do século XXI.',
      },
    ],
  },
];

const TENDA_ICON: Record<TendaId, typeof Sparkles> = {
  'vida-espiritual': Sword,
  'vida-interior': HeartPulse,
  'vida-exterior': BriefcaseBusiness,
};

const TENDA_TONE: Record<TendaId, string> = {
  'vida-espiritual': 'from-[#2A1E13] via-[#1A1612] to-[#111111]',
  'vida-interior': 'from-[#241A18] via-[#191414] to-[#101010]',
  'vida-exterior': 'from-[#1F1A14] via-[#171412] to-[#0F0F0F]',
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

function ManaShelfCard({
  tenda,
  ebook,
  isActive,
  onClick,
}: {
  tenda: ManaTenda;
  ebook: ManaEbook;
  isActive: boolean;
  onClick: () => void;
}) {
  const progress = pm.getProgress('mana', ebook.slug);
  const isCompleted = pm.isRead('mana', ebook.slug);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group shrink-0 w-[168px] sm:w-[196px] text-left snap-start rounded-2xl border p-2 transition-all duration-300 ${
        isActive
          ? 'border-primary/60 bg-primary/10 shadow-[0_0_0_1px_rgba(242,192,141,0.2),0_18px_34px_rgba(0,0,0,0.35)]'
          : 'border-outline-variant/20 bg-surface-container-low hover:-translate-y-0.5 hover:border-primary/45 hover:bg-surface-container'
      }`}
    >
      <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden border border-primary/20">
        <div className={`absolute inset-0 bg-gradient-to-br ${TENDA_TONE[tenda.id]}`} />
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_18%_18%,rgba(242,192,141,0.22),transparent_45%)]" />
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(242,192,141,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(242,192,141,0.1)_1px,transparent_1px)] [background-size:18px_18px]" />

        <div className="relative h-full p-3 flex flex-col justify-between">
          <span className="inline-flex self-start rounded-md border border-primary/35 bg-black/45 px-2 py-1 text-[8px] font-black tracking-[0.16em] text-primary">
            {ebook.badge}
          </span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-primary/80 mb-1">{tenda.titulo}</p>
            <h4 className="text-[13px] font-extrabold leading-tight text-on-surface line-clamp-3">{ebook.title}</h4>
          </div>
        </div>
      </div>

      <p className="mt-2 px-1 text-[10px] text-on-surface-variant leading-relaxed line-clamp-3">{ebook.description}</p>

      <div className="mt-2 px-1">
        <div className="h-1.5 w-full rounded-full bg-surface-container-high overflow-hidden border border-outline-variant/15">
          <div
            className={isCompleted ? 'h-full bg-gradient-to-r from-[#D4AF37] to-[#F5D76E]' : 'h-full bg-gradient-to-r from-orange-500 to-yellow-400'}
            style={{ width: `${isCompleted ? 100 : progress}%` }}
          />
        </div>
      </div>
    </button>
  );
}

export default function Studies() {
  const [selectedTendaId, setSelectedTendaId] = useState<TendaId>('vida-espiritual');
  const [activeEbookSlug, setActiveEbookSlug] = useState<string | null>(null);
  const tendaSectionRef = useRef<HTMLElement | null>(null);

  const selectedTenda = useMemo(
    () => MANA_TENDAS.find((item) => item.id === selectedTendaId) ?? MANA_TENDAS[0],
    [selectedTendaId],
  );

  const handleSelectTenda = (id: TendaId) => {
    setSelectedTendaId(id);
    setTimeout(() => {
      tendaSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

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

      <section className="px-4 sm:px-6 mb-8">
        <div className="mb-4">
          <h2 className="font-headline text-2xl sm:text-3xl font-black tracking-tight text-on-surface">Escolha sua tenda</h2>
          <p className="text-xs text-on-surface-variant mt-1">
            Cada tenda conduz uma área da sua jornada. Escolha por onde deseja ser alimentado hoje.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {MANA_TENDAS.map((tenda) => {
            const Icon = TENDA_ICON[tenda.id];
            const isActive = selectedTenda.id === tenda.id;

            return (
              <button
                key={tenda.id}
                type="button"
                onClick={() => handleSelectTenda(tenda.id)}
                className={`group relative overflow-hidden rounded-2xl border text-left px-5 py-5 cursor-pointer transition-all duration-300 ${
                  isActive
                    ? 'border-primary/60 bg-gradient-to-br from-[#22180f] via-[#171310] to-[#111111] shadow-[0_0_0_1px_rgba(242,192,141,0.2),0_18px_40px_rgba(0,0,0,0.42)]'
                    : 'border-outline-variant/20 bg-gradient-to-br from-[#1f1a17] via-[#151312] to-[#111111] hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-[0_16px_36px_rgba(0,0,0,0.38)]'
                }`}
              >
                <div className="absolute -right-3 -top-4 text-[72px] font-black tracking-tighter text-primary/12 select-none">
                  {tenda.numero}
                </div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(circle_at_90%_10%,rgba(242,192,141,0.14),transparent_45%)]" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.17em] text-primary">
                      {tenda.label}
                    </span>
                    <Icon size={16} className="text-primary/85" />
                  </div>

                  <h3 className="font-headline text-[28px] leading-none font-black text-on-surface mb-2">{tenda.titulo}</h3>
                  <p className="text-sm font-semibold text-primary/90 mb-2">{tenda.subtitulo}</p>
                  <p className="text-xs text-on-surface-variant leading-relaxed mb-4">{tenda.descricao}</p>

                  <div className="border-t border-primary/15 pt-3 mb-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-primary/80 mb-2">Temas desta tenda</p>
                    <div className="space-y-2">
                      {tenda.temas.map((tema, index) => (
                        <div key={tema.id} className="text-[10px] text-on-surface-variant leading-relaxed">
                          <span className="text-primary/90 font-black">{index + 1}. </span>
                          <span className="line-clamp-1">{tema.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                    Entrar na tenda
                    <ArrowRight size={12} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section ref={tendaSectionRef} className="px-4 sm:px-6 pb-8">
        <div className="rounded-3xl border border-outline-variant/25 bg-gradient-to-b from-surface-container-low to-surface-container p-5 sm:p-6">
          <button
            type="button"
            onClick={() => setSelectedTendaId('vida-espiritual')}
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/70 hover:text-primary transition-colors"
          >
            <span aria-hidden>‹</span>
            MANÁ
          </button>

          <div className="mt-4 mb-5">
            <span className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-primary mb-2">
              TENDA
            </span>
            <h3 className="font-headline text-3xl font-black tracking-tight text-on-surface uppercase">{selectedTenda.titulo}</h3>
            <p className="text-sm text-primary/85 font-semibold mt-1">{selectedTenda.subtitulo}</p>
            <p className="text-xs text-on-surface-variant leading-relaxed mt-2 max-w-3xl">{selectedTenda.descricao}</p>
          </div>

          <div className="relative -mx-5 px-5 sm:-mx-6 sm:px-6">
            <div className="pointer-events-none absolute -bottom-1 left-5 right-5 sm:left-6 sm:right-6 h-1 bg-gradient-to-r from-primary/30 via-outline-variant/10 to-transparent opacity-20" />
            <DragScrollRow>
              {selectedTenda.temas.map((ebook) => (
                <ManaShelfCard
                  key={ebook.id}
                  tenda={selectedTenda}
                  ebook={ebook}
                  isActive={activeEbookSlug === ebook.slug}
                  onClick={() => setActiveEbookSlug(ebook.slug)}
                />
              ))}
            </DragScrollRow>
          </div>

          <p className="mt-2 text-[10px] text-on-surface-variant/65">
            Estrutura preparada para abrir os detalhes completos de cada e-book assim que o conteúdo for publicado.
          </p>
        </div>
      </section>
    </div>
  );
}
