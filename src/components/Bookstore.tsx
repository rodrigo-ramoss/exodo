import { useState, useRef, type ReactNode } from 'react';
import { Check, ChevronLeft, Shield, BookOpen, Zap, Cpu, Eye } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { MarkdownViewer } from './MarkdownViewer';

// ── Types ─────────────────────────────────────────────────────────────────────
interface BookItem {
  title: string;
  slug: string;
  description: string;
  date: string;
  category: string;
  time: string;
  image?: string;
}

type SectionKey = 'APÓCRIFOS' | 'IGREJA E BÍBLIA' | 'MUNDO ESPIRITUAL' | 'ANTISISTEMA' | 'IA & APOCALIPSE';

// ── Section metadata ──────────────────────────────────────────────────────────
const SECTIONS: Record<SectionKey, {
  label: string;
  description: string;
  Icon: React.ElementType;
  accent: string;
}> = {
  'APÓCRIFOS': {
    label: 'Apócrifos',
    description: 'Enoque, Jubileus e os textos banidos. A tradição que o cânon oficial não quis preservar.',
    Icon: Shield,
    accent: 'from-amber-900/70 to-amber-800/10',
  },
  'IGREJA E BÍBLIA': {
    label: 'Igreja & Bíblia',
    description: 'A anatomia do sistema religioso: como a instituição se construiu e o que ela apagou no processo.',
    Icon: BookOpen,
    accent: 'from-sky-900/70 to-sky-800/10',
  },
  'MUNDO ESPIRITUAL': {
    label: 'Mundo Espiritual',
    description: 'Uma jornada bíblica pelo Reino de Deus, conselho celeste e realidades invisíveis. Em Hebreus 8, o texto diz que servem como “exemplar e sombra das coisas celestiais”. Como é o mundo espiritual? A Bíblia responde.',
    Icon: Eye,
    accent: 'from-violet-900/70 to-violet-800/10',
  },
  'ANTISISTEMA': {
    label: 'Antissistema',
    description: 'Os protocolos de sobrevivência espiritual dentro de sistemas hostis. Daniel, José e os que atravessaram.',
    Icon: Zap,
    accent: 'from-emerald-900/70 to-emerald-800/10',
  },
  'IA & APOCALIPSE': {
    label: 'IA & Apocalipse',
    description: 'Controle tecnológico, a Marca e os mecanismos proféticos que moldam o fim dos tempos.',
    Icon: Cpu,
    accent: 'from-rose-900/70 to-rose-800/10',
  },
};

const SECTION_ORDER: SectionKey[] = ['APÓCRIFOS', 'IGREJA E BÍBLIA', 'MUNDO ESPIRITUAL', 'ANTISISTEMA', 'IA & APOCALIPSE'];

// Maps existing category strings → top-level section
const CATEGORY_TO_SECTION: Record<string, SectionKey> = {
  'A REVELAÇÃO DE ENOQUE':                   'APÓCRIFOS',
  'Série — A Invenção do Pecado':             'IGREJA E BÍBLIA',
  'Trilogia — O Cânon Oculto':                'IGREJA E BÍBLIA',
  'Série — A Verdadeira História da Igreja':  'IGREJA E BÍBLIA',
  'SOMBRAS DO REINO DE DEUS':                 'MUNDO ESPIRITUAL',
  'Trilogia — O Mapa da Tempestade':          'ANTISISTEMA',
  'Trilogia — O Estrangeiro Próspero':        'ANTISISTEMA',
  'Trilogia — A Ciência dos Tempos':          'ANTISISTEMA',
  'Trilogia — A Marca':                       'IA & APOCALIPSE',
};

// Short display labels per series
const SERIES_LABEL: Record<string, string> = {
  'Trilogia — O Mapa da Tempestade':          'O Mapa da Tempestade',
  'Trilogia — A Marca':                       'A Marca',
  'Trilogia — O Estrangeiro Próspero':        'O Estrangeiro Próspero',
  'Trilogia — A Ciência dos Tempos':          'A Ciência dos Tempos',
  'Série — A Invenção do Pecado':             'A Invenção do Pecado',
  'Trilogia — O Cânon Oculto':                'O Cânon Oculto',
  'A REVELAÇÃO DE ENOQUE':                    'A Revelação de Enoque',
  'SOMBRAS DO REINO DE DEUS':                 'Sombras do Reino de Deus',
  'Série — A Verdadeira História da Igreja':  'A Verdadeira História da Igreja',
};

// Description shown below each series header
const SERIES_DESCRIPTION: Record<string, string> = {
  'A REVELAÇÃO DE ENOQUE': 'Uma jornada profunda pelas visões e revelações do profeta Enoque sobre o mundo espiritual, os vigilantes e o destino da humanidade.',
  'SOMBRAS DO REINO DE DEUS': 'Uma leitura bíblica do mundo espiritual: Reino de Deus, conselho celeste e as realidades invisíveis que Hebreus 8:5 chama de sombra das coisas celestiais.',
  'Série — A Invenção do Pecado': 'Uma investigação histórica e teológica sobre como certas doutrinas foram construídas, institucionalizadas e usadas para moldar consciências.',
  'Série — A Verdadeira História da Igreja': 'Uma arqueologia da fé cristã primitiva, revelando o caminho entre a ekklesia viva e a institucionalização religiosa ao longo dos séculos.',
  'Trilogia — O Cânon Oculto': 'Uma imersão nos bastidores da formação bíblica, nos textos suprimidos e nas leituras que ficaram fora da narrativa oficial.',
  'Trilogia — O Mapa da Tempestade': 'Um diagnóstico de ruptura civilizacional e um mapa prático para atravessar colapsos sistêmicos com lucidez, preparo e fé.',
  'Trilogia — O Estrangeiro Próspero': 'Princípios de José e Daniel para prosperar dentro do sistema sem perder identidade, integridade e aliança.',
  'Trilogia — A Ciência dos Tempos': 'Discernimento profético e estratégico para ler ciclos históricos, interpretar sinais e agir com precisão em tempos críticos.',
  'Trilogia — A Marca': 'Uma análise bíblica e contemporânea sobre controle, tecnologia e os mecanismos de conformação espiritual dos últimos tempos.',
};

function buildAutoSeriesDescription(category: string, items: BookItem[]): string {
  const curated = SERIES_DESCRIPTION[category];
  if (curated) return curated;

  // Fallback automático: reaproveita as descrições dos próprios volumes
  // para que novas séries/trilogias nunca apareçam sem texto de apoio.
  const fromBooks = items
    .map((item) => item.description?.trim())
    .filter((value): value is string => Boolean(value))
    .slice(0, 2);

  if (fromBooks.length > 0) return fromBooks.join(' ');

  const seriesLabel = SERIES_LABEL[category] ?? category;
  return `${seriesLabel}: coleção de estudos e livros com análise bíblica, histórica e aplicação prática.`;
}

// ── DragScrollRow ─────────────────────────────────────────────────────────────
function DragScrollRow({ children }: { children: ReactNode }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ isDown: false, startX: 0, scrollLeft: 0, didDrag: false });
  return (
    <div
      ref={rowRef}
      className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory cursor-grab active:cursor-grabbing [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      onClickCapture={(e) => { if (drag.current.didDrag) { e.preventDefault(); e.stopPropagation(); } }}
      onPointerDown={(e) => {
        if (e.pointerType !== 'mouse') return;
        const el = rowRef.current; if (!el) return;
        drag.current = { isDown: true, startX: e.clientX, scrollLeft: el.scrollLeft, didDrag: false };
        el.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse' || !drag.current.isDown) return;
        const el = rowRef.current; if (!el) return;
        const walk = e.clientX - drag.current.startX;
        if (Math.abs(walk) > 4) drag.current.didDrag = true;
        el.scrollLeft = drag.current.scrollLeft - walk;
      }}
      onPointerUp={() => { drag.current.isDown = false; setTimeout(() => { drag.current.didDrag = false; }, 0); }}
      onPointerCancel={() => { drag.current.isDown = false; }}
      onPointerLeave={() => { drag.current.isDown = false; }}
    >
      {children}
    </div>
  );
}

// ── Book Card ─────────────────────────────────────────────────────────────────
function BookCard({ item, volIndex, onSelect }: { item: BookItem; volIndex: number; onSelect: () => void }) {
  const progressValue = parseInt(localStorage.getItem(`progress_${item.slug}`) || '0', 10);
  const clamped = Math.max(0, Math.min(100, Number.isFinite(progressValue) ? progressValue : 0));
  const readsCount = parseInt(localStorage.getItem(`reads_${item.slug}`) || '0', 10);
  // hasBeenRead: livro concluído ao menos uma vez (progress é resetado para 0 após conclusão)
  const hasBeenRead = readsCount > 0;
  const isReading = clamped > 0;

  return (
    <div
      onClick={onSelect}
      className="group shrink-0 w-[148px] sm:w-[168px] flex flex-col cursor-pointer active:scale-95 transition-transform snap-start"
    >
      <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden shadow-2xl border border-outline-variant/10 bg-surface-container-high group-hover:border-primary/50 transition-colors">
        <img
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
          src={item.image || `https://picsum.photos/seed/${item.slug}/400/600`}
          alt={item.title}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
        <div className="absolute bottom-2 left-2 right-2">
          <div className="h-0.5 w-6 bg-primary opacity-0 group-hover:opacity-100 transition-opacity mb-1" />
          <span className="inline-flex items-center rounded-md border border-white/20 bg-black/65 px-2 py-1 text-[9px] text-white/95 uppercase font-black tracking-widest shadow-sm">
            Vol. {String(volIndex + 1).padStart(2, '0')}
          </span>
        </div>
      </div>
      <div className="mt-3 px-1 select-none">
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 bg-outline-variant/20 rounded-full overflow-hidden border border-outline-variant/10">
            <div
              className={
                hasBeenRead && isReading
                  ? 'h-full bg-gradient-to-r from-[#D4AF37] to-[#F5D76E] shadow-[0_0_10px_rgba(212,175,55,0.35)]'
                  : 'h-full bg-gradient-to-r from-orange-500 to-yellow-400 shadow-[0_0_8px_rgba(249,115,22,0.35)]'
              }
              style={{ width: `${clamped}%` }}
            />
          </div>
          <div className="flex items-center gap-1.5">
            {hasBeenRead && !isReading ? (
              // Concluído e resetado: exibe selo de leituras
              <>
                <Check size={12} className="text-[#D4AF37]" />
                <span className="text-[9px] font-black uppercase tracking-widest text-[#D4AF37]">
                  {readsCount}×
                </span>
              </>
            ) : (
              // Em leitura ou não iniciado: exibe porcentagem
              <span className={
                hasBeenRead
                  ? 'text-[9px] font-black uppercase tracking-widest text-[#D4AF37]'
                  : isReading
                    ? 'text-[9px] font-black uppercase tracking-widest text-orange-400'
                    : 'text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40'
              }>
                {clamped}%
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Section Grid Card ─────────────────────────────────────────────────────────
function SectionCard({ sectionKey, books, onSelect }: {
  sectionKey: SectionKey;
  books: BookItem[];
  onSelect: () => void;
}) {
  const { label, description, Icon, accent } = SECTIONS[sectionKey];
  const cover = books[0]?.image;
  const totalRead = books.filter(
    (b) => parseInt(localStorage.getItem(`reads_${b.slug}`) || '0', 10) > 0
      || parseInt(localStorage.getItem(`progress_${b.slug}`) || '0', 10) >= 100
  ).length;

  return (
    <div
      onClick={onSelect}
      className="group relative w-full h-44 rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-all duration-300 border border-white/5 hover:border-primary/30 hover:shadow-[0_0_40px_rgba(242,192,141,0.10)]"
    >
      {/* Cover image — blurred, zooms out on hover */}
      {cover && (
        <img
          src={cover}
          alt=""
          className="absolute inset-0 w-full h-full object-cover scale-110 group-hover:scale-105 transition-transform duration-700 opacity-40 group-hover:opacity-55"
        />
      )}

      {/* Coloured gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-r ${accent} to-transparent`} />
      {/* Bottom dark vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

      {/* Subtle inner glow on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 shadow-[inset_0_0_40px_rgba(242,192,141,0.06)]" />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-between p-5">
        {/* Top row */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-black/40 border border-white/10 rounded-lg p-1.5 group-hover:border-primary/30 group-hover:bg-primary/10 transition-all">
              <Icon size={14} className="text-primary/80 group-hover:text-primary transition-colors" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 group-hover:text-primary/70 transition-colors">
              {books.length} volume{books.length !== 1 ? 's' : ''}
            </span>
          </div>
          {totalRead > 0 && (
            <span className="text-[8px] font-black uppercase tracking-widest text-white/40 bg-black/50 px-2 py-0.5 rounded-full border border-white/5">
              {totalRead}/{books.length} lidos
            </span>
          )}
        </div>

        {/* Bottom text */}
        <div>
          <h3 className="font-headline font-black text-[22px] text-white tracking-tight leading-none mb-1.5 group-hover:text-primary transition-colors duration-300">
            {label.toUpperCase()}
          </h3>
          <p className="text-[10px] text-white/45 leading-snug font-medium line-clamp-2 group-hover:text-white/65 transition-colors duration-300 max-w-[260px]">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Root component ────────────────────────────────────────────────────────────
export default function Bookstore() {
  const [selectedSection, setSelectedSection] = useState<SectionKey | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [markdownContent, setMarkdownContent] = useState<string | null>(null);
  const { data: books, loading, error } = useFetch<BookItem[]>('/content/livraria/index.json');

  // Group books by top-level section
  const booksBySection = SECTION_ORDER.reduce((acc, sec) => {
    acc[sec] = (books ?? []).filter((b) => CATEGORY_TO_SECTION[b.category] === sec);
    return acc;
  }, {} as Record<SectionKey, BookItem[]>);

  // Within a section, group by original category (series / trilogias)
  const seriesInSection: [string, BookItem[]][] = selectedSection
    ? Object.entries(
        booksBySection[selectedSection].reduce((acc, book) => {
          (acc[book.category] ??= []).push(book);
          return acc;
        }, {} as Record<string, BookItem[]>)
      )
    : [];

  const handleSelectBook = async (slug: string) => {
    setSelectedSlug(slug);
    try {
      const res = await fetch(`/content/livraria/${slug}.md`);
      if (res.ok) setMarkdownContent(await res.text());
    } catch { /* silent */ }
  };

  const handleCloseReader = () => { setSelectedSlug(null); setMarkdownContent(null); };

  // ── Reader ─────────────────────────────────────────────────────────────────
  if (selectedSlug && markdownContent) {
    return <MarkdownViewer content={markdownContent} slug={selectedSlug} onClose={handleCloseReader} />;
  }

  // ── Section detail ─────────────────────────────────────────────────────────
  if (selectedSection) {
    const { label, description, Icon } = SECTIONS[selectedSection];
    return (
      <div className="pt-6 pb-32 px-5 max-w-7xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => setSelectedSection(null)}
            className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors mb-6 active:scale-95 text-[10px] font-black uppercase tracking-widest"
          >
            <ChevronLeft size={15} />
            Arquivo Secreto
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary/15 border border-primary/25 rounded-xl p-2">
              <Icon size={18} className="text-primary" />
            </div>
            <h2 className="font-headline font-black text-3xl text-primary tracking-tighter uppercase">
              {label}
            </h2>
          </div>
          <p className="text-on-surface-variant/70 text-[11px] max-w-sm font-medium leading-relaxed">
            {description}
          </p>
        </div>

        {seriesInSection.map(([cat, items]) => {
          const reads = items.map((b) => parseInt(localStorage.getItem(`reads_${b.slug}`) || '0', 10));
          const minReads = reads.length ? Math.min(...reads) : 0;
          const label = SERIES_LABEL[cat] ?? cat;
          const seriesDescription = buildAutoSeriesDescription(cat, items);
          const isSeries = items.length > 3;

          return (
            <div key={cat} className="mb-14">
              <div className="mb-4">
                <div className="mb-1.5">
                  <span className="inline-flex items-center rounded-full border border-primary/35 bg-primary/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-primary">
                    {isSeries ? 'SÉRIE' : 'TRILOGIA'}
                  </span>
                </div>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <h4 className="font-headline font-extrabold text-xl text-on-surface tracking-tighter uppercase leading-none">
                    {label}
                  </h4>
                  {minReads > 0 && (
                    <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
                      (Lido {minReads} vez{minReads > 1 ? 'es' : ''})
                    </span>
                  )}
                </div>
                {seriesDescription && (
                  <p className="mt-1.5 text-[10px] text-on-surface-variant/60 leading-snug font-medium max-w-sm">
                    {seriesDescription}
                  </p>
                )}
              </div>
              <div className="relative -mx-5 px-5">
                <DragScrollRow>
                  {items.map((item, j) => (
                    <BookCard
                      key={item.slug}
                      item={item}
                      volIndex={j}
                      onSelect={() => handleSelectBook(item.slug)}
                    />
                  ))}
                </DragScrollRow>
              </div>
            </div>
          );
        })}

        {seriesInSection.length === 0 && !loading && (
          <p className="text-center text-[10px] uppercase tracking-widest text-on-surface-variant/40 py-16 font-bold">
            Conteúdo em breve.
          </p>
        )}
      </div>
    );
  }

  // ── Main grid ──────────────────────────────────────────────────────────────
  return (
    <div className="pt-6 pb-32 px-5 max-w-7xl mx-auto">
      <header className="mb-10 relative">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-[100px]" />
        <div className="relative z-10">
          <h2 className="font-headline font-extrabold text-3xl text-primary tracking-tighter mb-2">
            Arquivo Secreto
          </h2>
          <p className="text-on-surface-variant/70 text-[11px] max-w-[300px] font-medium leading-relaxed">
            O subsolo da história cristã. Manuscritos ocultos, textos banidos e a anatomia do sistema religioso que tentaram apagar. Escolha sua frente de estudo e acesse o conhecimento não filtrado.
          </p>
        </div>
      </header>

      {loading ? (
        <div className="py-10 text-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-50">
          Carregando Arquivo...
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {SECTION_ORDER.map((sec) => (
            <SectionCard
              key={sec}
              sectionKey={sec}
              books={booksBySection[sec]}
              onSelect={() => setSelectedSection(sec)}
            />
          ))}
        </div>
      )}

      {error && (
        <p className="text-red-500 text-[10px] uppercase font-bold text-center py-4">{error}</p>
      )}
    </div>
  );
}
