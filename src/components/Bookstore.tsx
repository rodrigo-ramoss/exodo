import { useState, useEffect, useRef, type ReactNode } from 'react';
import { Check, Diamond, Download, Shield } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { MarkdownViewer } from './MarkdownViewer';

interface BookItem {
  title: string;
  slug: string;
  description: string;
  date: string;
  category: string;
  time: string;
  image?: string;
}

interface Subsection {
  id: string;
  title: string;
  subtitle: string;
  description: string;
}

const categoryInfo: Record<string, { title: string; description: string }> = {
  'Trilogia — O Mapa da Tempestade': {
    title: 'O Mapa da Tempestade',
    description: 'Cartografia profética do colapso sistêmico e o manual para atravessar o interregno entre mundos.',
  },
  'Trilogia — A Marca': {
    title: 'A Marca',
    description: 'Uma investigação profunda sobre o sistema de controle tecnológico e espiritual que molda o fim dos tempos.',
  },
  'Trilogia — O Estrangeiro Próspero': {
    title: 'O Estrangeiro Próspero',
    description: 'O protocolo de Daniel e José para florescer e manter a integridade dentro de sistemas hostis.',
  },
  'Trilogia — A Ciência dos Tempos': {
    title: 'A Ciência dos Tempos',
    description: 'Estratégia e discernimento profético para navegar as crises globais com sabedoria calculada.',
  },
  'Série — A Invenção do Pecado': {
    title: 'A Invenção do Pecado',
    description: 'Desconstruindo as amarras teológicas e históricas que aprisionaram a fé em conceitos institucionais.',
  },
  'Trilogia — O Cânon Oculto': {
    title: 'O Cânon Oculto',
    description: 'A história proibida da formação bíblica e as verdades que foram deixadas fora do sistema dogmático.',
  },
  'Série — A Revelação de Enoque': {
    title: 'A Revelação de Enoque',
    description: 'Uma jornada pelas visões e revelações do profeta Enoque sobre o mundo espiritual e o destino da humanidade.',
  },
  'Série — A Verdadeira História da Igreja': {
    title: 'A Verdadeira História da Igreja',
    description: 'Sete volumes para reconstruir a trajetória da ekklesia antes, durante e depois da institucionalização religiosa.',
  },
  APÓCRIFOS: {
    title: 'Apócrifos',
    description: 'Ebooks migrados da coleção apócrifa para o acervo interno da Livraria.',
  },
};

const subsections: Subsection[] = [
  {
    id: 'APOCRIFOS',
    title: 'APÓCRIFOS',
    subtitle: 'Vozes do Silêncio.',
    description: 'Exploração de textos antigos e históricos que complementam o contexto bíblico.',
  },
  {
    id: 'IGREJA_BIBLIA',
    title: 'IGREJA E BÍBLIA',
    subtitle: 'A Anatomia do Dogma.',
    description: 'Análise técnica sobre a história e o uso das escrituras em sistemas de controle.',
  },
  {
    id: 'ANTISISTEMA',
    title: 'ANTISISTEMA',
    subtitle: 'Guia do Remanescente.',
    description: 'Estratégias de preparação e análise histórica para viver fora da matriz sistêmica.',
  },
  {
    id: 'IA_APOCALIPSE',
    title: 'IA & APOCALIPSE',
    subtitle: 'A Fronteira do Silício.',
    description: 'A convergência tecnológica e as profecias sobre o fim dos tempos.',
  },
];

const categoryToSubsection: Record<string, string> = {
  APÓCRIFOS: 'APOCRIFOS',
  'Série — A Revelação de Enoque': 'APOCRIFOS',
  'Série — A Invenção do Pecado': 'IGREJA_BIBLIA',
  'Trilogia — O Cânon Oculto': 'IGREJA_BIBLIA',
  'Série — A Verdadeira História da Igreja': 'IGREJA_BIBLIA',
  'Trilogia — O Mapa da Tempestade': 'ANTISISTEMA',
  'Trilogia — O Estrangeiro Próspero': 'ANTISISTEMA',
  'Trilogia — A Ciência dos Tempos': 'ANTISISTEMA',
  'Trilogia — A Marca': 'IA_APOCALIPSE',
};

function DragScrollRow({ children }: { children: ReactNode }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{ isDown: boolean; startX: number; scrollLeft: number; didDrag: boolean }>({
    isDown: false,
    startX: 0,
    scrollLeft: 0,
    didDrag: false,
  });

  return (
    <div
      ref={rowRef}
      className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory cursor-grab active:cursor-grabbing [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      onClickCapture={(e) => {
        if (dragStateRef.current.didDrag) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onPointerDown={(e) => {
        if (e.pointerType !== 'mouse') return;
        const el = rowRef.current;
        if (!el) return;
        dragStateRef.current = { isDown: true, startX: e.clientX, scrollLeft: el.scrollLeft, didDrag: false };
        el.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse') return;
        const el = rowRef.current;
        if (!el || !dragStateRef.current.isDown) return;
        const walk = e.clientX - dragStateRef.current.startX;
        if (Math.abs(walk) > 4) dragStateRef.current.didDrag = true;
        el.scrollLeft = dragStateRef.current.scrollLeft - walk;
      }}
      onPointerUp={(e) => {
        if (e.pointerType !== 'mouse') return;
        dragStateRef.current.isDown = false;
        if (dragStateRef.current.didDrag) {
          setTimeout(() => {
            dragStateRef.current.didDrag = false;
          }, 0);
        }
      }}
      onPointerCancel={() => {
        dragStateRef.current.isDown = false;
      }}
      onPointerLeave={() => {
        dragStateRef.current.isDown = false;
      }}
    >
      {children}
    </div>
  );
}

export default function Bookstore() {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [markdownContent, setMarkdownContent] = useState<string | null>(null);
  const { data: books, loading, error } = useFetch<BookItem[]>('/content/livraria/index.json');

  const categories = books ? Array.from(new Set(books.map((b) => b.category))) : [];
  const groupedBooks = categories.reduce((acc, cat) => {
    acc[cat] = books?.filter((b) => b.category === cat) || [];
    return acc;
  }, {} as Record<string, BookItem[]>);

  const collections = categories.map((cat) => {
    const items = groupedBooks[cat] || [];
    const sectionId = categoryToSubsection[cat];
    const type = items.length === 3 ? 'trilogia' : 'serie';
    return { category: cat, items, type, sectionId };
  });

  useEffect(() => {
    if (!selectedSlug) {
      setMarkdownContent(null);
      return;
    }

    const fetchMarkdown = async () => {
      try {
        const response = await fetch(`/content/livraria/${selectedSlug}.md`);
        if (response.ok) {
          setMarkdownContent(await response.text());
        }
      } catch (err) {
        console.error('Error fetching markdown:', err);
      }
    };

    fetchMarkdown();
  }, [selectedSlug]);

  if (selectedSlug && markdownContent) {
    return <MarkdownViewer content={markdownContent} slug={selectedSlug} onClose={() => setSelectedSlug(null)} />;
  }

  return (
    <div className="pt-6 pb-32 px-5 max-w-7xl mx-auto">
      <header className="mb-10 relative">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-[100px]" />
        <div className="relative z-10">
          <h2 className="font-headline font-extrabold text-3xl text-primary tracking-tighter mb-1 text-shadow-glow">Arquivo Secreto</h2>
          <p className="text-on-surface-variant/70 text-[11px] max-w-[340px] font-medium leading-relaxed">
            A estante agora está organizada por frentes estratégicas para leitura guiada: origem dos textos, sistema religioso, sobrevivência do remanescente e convergência tecnológica.
          </p>
        </div>
      </header>

      <section className="mb-12">
        {loading ? (
          <div className="py-10 text-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-50">Carregando Estante...</div>
        ) : (
          subsections.map((subsection) => {
            const subsectionCollections = collections.filter((collection) => collection.sectionId === subsection.id);
            if (subsectionCollections.length === 0) return null;

            return (
              <div key={subsection.id} className="mb-16">
                <div className="flex items-center gap-3 mb-3">
                  <Diamond className="text-primary" size={16} fill="currentColor" />
                  <h3 className="font-headline font-extrabold text-2xl text-primary tracking-tight">
                    {subsection.title}
                    <span className="text-on-surface">: {subsection.subtitle}</span>
                  </h3>
                </div>
                <p className="text-on-surface-variant/80 text-[11px] max-w-[620px] font-medium leading-relaxed mb-8">
                  {subsection.description}
                </p>

                {subsectionCollections.map((collection, i) => {
                  const cat = collection.category;
                  const collectionLabel = collection.items.length > 3 ? 'SÉRIE' : 'TRILOGIA';
                  const reads = typeof window !== 'undefined'
                    ? collection.items.map((b) => parseInt(localStorage.getItem(`reads_${b.slug}`) || '0', 10))
                    : [];
                  const minReads = reads.length ? Math.min(...reads) : 0;

                  return (
                    <div key={`${subsection.id}-${i}`} className="mb-14">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex flex-col">
                          <div className="mb-1">
                            <span className="inline-flex items-center rounded-full border border-primary/35 bg-primary/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-primary">
                              {collectionLabel}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <h4 className="font-headline font-extrabold text-xl text-on-surface tracking-tighter uppercase leading-none">
                              {categoryInfo[cat]?.title || cat}
                            </h4>
                            <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
                              (Lido {minReads} vez{minReads === 1 ? '' : 'es'})
                            </span>
                          </div>
                          <p className="text-on-surface-variant text-[11px] font-bold max-w-lg leading-relaxed opacity-70">
                            {categoryInfo[cat]?.description || 'Coleção de estudos profundos.'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-8 relative -mx-5 px-5">
                        <div className="pointer-events-none absolute -bottom-1 left-5 right-5 h-1 bg-gradient-to-r from-primary/30 via-outline-variant/10 to-transparent opacity-20" />
                        <DragScrollRow>
                          {collection.items.map((item, j) => {
                            const progressValue = typeof window !== 'undefined' ? parseInt(localStorage.getItem(`progress_${item.slug}`) || '0', 10) : 0;
                            const clampedProgress = Math.max(0, Math.min(100, Number.isFinite(progressValue) ? progressValue : 0));
                            const isCompleted = clampedProgress >= 100;

                            return (
                              <div
                                key={j}
                                onClick={() => setSelectedSlug(item.slug)}
                                className="group shrink-0 w-[148px] sm:w-[168px] flex flex-col cursor-pointer active:scale-95 transition-transform snap-start"
                              >
                                <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden shadow-2xl border border-outline-variant/10 bg-surface-container-high group-hover:border-primary/50 transition-colors">
                                  <img
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                                    src={item.image || `https://picsum.photos/seed/${item.slug}/400/600`}
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                                  <div className="absolute bottom-2 left-2 right-2">
                                    <div className="h-0.5 w-6 bg-primary opacity-0 group-hover:opacity-100 transition-opacity mb-1" />
                                    <span className="inline-flex items-center rounded-md border border-white/20 bg-black/65 px-2 py-1 text-[9px] text-white/95 uppercase font-black tracking-widest shadow-sm">
                                      Vol. {String(j + 1).padStart(2, '0')}
                                    </span>
                                  </div>
                                </div>

                                <div className="mt-3 px-1 select-none">
                                  <div className="flex items-center gap-2">
                                    <div className="h-1.5 flex-1 bg-outline-variant/20 rounded-full overflow-hidden border border-outline-variant/10">
                                      <div
                                        className={
                                          isCompleted
                                            ? 'h-full bg-gradient-to-r from-[#D4AF37] to-[#F5D76E] shadow-[0_0_10px_rgba(212,175,55,0.35)]'
                                            : 'h-full bg-gradient-to-r from-orange-500 to-yellow-400 shadow-[0_0_8px_rgba(249,115,22,0.35)]'
                                        }
                                        style={{ width: `${clampedProgress}%` }}
                                      />
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <span
                                        className={
                                          isCompleted
                                            ? 'text-[9px] font-black uppercase tracking-widest text-[#D4AF37]'
                                            : clampedProgress > 0
                                              ? 'text-[9px] font-black uppercase tracking-widest text-orange-400'
                                              : 'text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40'
                                        }
                                      >
                                        {clampedProgress}%
                                      </span>
                                      {isCompleted && <Check size={12} className="text-[#D4AF37]" />}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </DragScrollRow>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
        {error && <div className="text-red-500 text-[10px] uppercase font-bold text-center py-4">{error}</div>}
      </section>

      <footer className="bg-primary-container/10 border border-primary/20 rounded-3xl p-8 text-center relative overflow-hidden group">
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-primary/10 rounded-full blur-[60px] group-hover:scale-150 transition-transform duration-1000" />
        <div className="relative z-10">
          <Shield className="text-primary mx-auto mb-4" size={32} fill="currentColor" />
          <h3 className="font-headline font-extrabold text-xl text-on-surface mb-3 tracking-tighter">Acesso Restrito</h3>
          <p className="text-on-surface-variant text-[11px] max-w-xs mx-auto mb-6 font-bold leading-relaxed">
            O conhecimento que liberta não está na superfície. Baixe o app para acessar todo o conteúdo exclusivo.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => alert('Baixando app...')}
              className="bg-primary text-on-primary font-black py-3 px-6 rounded-xl text-[10px] tracking-widest uppercase flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Download size={16} /> Baixar Aplicativo
            </button>
            <button
              onClick={() => alert('Mais informações')}
              className="text-on-surface border border-outline-variant/40 hover:border-primary/40 font-black py-3 px-6 rounded-xl text-[10px] tracking-widest uppercase transition-all active:scale-95"
            >
              Saiba Mais
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
