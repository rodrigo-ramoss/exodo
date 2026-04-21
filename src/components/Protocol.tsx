import { useState, useRef, type ReactNode } from 'react';
import { Check, Shield } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { MarkdownViewer } from './MarkdownViewer';
import { AppImage } from './AppImage';
import { pm } from '../lib/progressManager';

interface ApoBook {
  title: string;
  slug: string;
  description: string;
  category: string;
  image: string;
  time: string;
}

const seriesInfo: Record<string, { title: string; description: string }> = {
  APÓCRIFOS: {
    title: 'Apócrifos',
    description:
      'Vozes do Silêncio: exploração de textos antigos e históricos que complementam o contexto bíblico.',
  },
};

// ── DragScrollRow (same as Bookstore) ────────────────────────────────────────
// Não usa setPointerCapture — ver explicação em Bookstore.tsx
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
        const el = rowRef.current; if (!el) return;
        drag.current = { isDown: true, startX: e.clientX, scrollLeft: el.scrollLeft, didDrag: false };
      }}
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse' || !drag.current.isDown) return;
        const el = rowRef.current; if (!el) return;
        const walk = e.clientX - drag.current.startX;
        if (Math.abs(walk) > 10) drag.current.didDrag = true;
        el.scrollLeft = drag.current.scrollLeft - walk;
      }}
      onPointerUp={() => { drag.current.isDown = false; setTimeout(() => { drag.current.didDrag = false; }, 0); }}
      onPointerLeave={() => { drag.current.isDown = false; drag.current.didDrag = false; }}
    >
      {children}
    </div>
  );
}

// ── Book card ─────────────────────────────────────────────────────────────────
function BookCard({ book, index, onSelect }: { book: ApoBook; index: number; onSelect: () => void }) {
  const clamped = pm.getProgress('apocrifos', book.slug);
  const isCompleted = pm.isRead('apocrifos', book.slug);
  const readsCount = pm.getReadCount('apocrifos', book.slug);

  return (
    <div
      onClick={onSelect}
      className="group shrink-0 w-[148px] sm:w-[168px] flex flex-col cursor-pointer active:scale-95 transition-transform snap-start"
    >
      <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden shadow-2xl border border-outline-variant/10 bg-surface-container-high group-hover:border-primary/50 transition-colors">
        <AppImage
          src={book.image}
          alt={book.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
        <div className="absolute bottom-2 left-2 right-2">
          <div className="h-0.5 w-6 bg-primary opacity-0 group-hover:opacity-100 transition-opacity mb-1" />
          <span className="inline-flex items-center rounded-md border border-white/20 bg-black/65 px-2 py-1 text-[9px] text-white/95 uppercase font-black tracking-widest shadow-sm">
            Parte {String(index + 1).padStart(2, '0')}
          </span>
        </div>
        {isCompleted && (
          <div className="absolute top-1.5 right-1.5 flex items-center gap-1 rounded-full bg-black/70 border border-[#D4AF37]/60 px-1.5 py-0.5">
            <Check size={8} className="text-[#D4AF37]" />
            <span className="text-[7px] font-black uppercase tracking-widest text-[#D4AF37]">Lido</span>
          </div>
        )}
      </div>

      {/* Title */}
      <p className="mt-2 px-0.5 text-[10px] font-bold text-on-surface leading-snug line-clamp-2 select-none">
        {book.title}
      </p>

      {/* Progress bar */}
      <div className="mt-2 px-0.5 select-none">
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 bg-outline-variant/20 rounded-full overflow-hidden border border-outline-variant/10">
            <div
              className={
                isCompleted
                  ? 'h-full bg-gradient-to-r from-[#D4AF37] to-[#F5D76E] shadow-[0_0_10px_rgba(212,175,55,0.35)]'
                  : 'h-full bg-gradient-to-r from-orange-500 to-yellow-400 shadow-[0_0_8px_rgba(249,115,22,0.35)]'
              }
              style={{ width: `${isCompleted ? 100 : clamped}%` }}
            />
          </div>
          <div className="flex items-center gap-1">
            <span
              className={
                isCompleted
                  ? 'text-[9px] font-black uppercase tracking-widest text-[#D4AF37]'
                  : clamped > 0
                    ? 'text-[9px] font-black uppercase tracking-widest text-orange-400'
                    : 'text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40'
              }
            >
              {isCompleted ? '100' : clamped}%
            </span>
            {isCompleted && <Check size={11} className="text-[#D4AF37]" />}
          </div>
        </div>
        {readsCount > 0 && (
          <p className="mt-1 text-[8px] font-black uppercase tracking-widest text-[#D4AF37]/70">
            Lido {readsCount}x
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Protocol() {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [markdownContent, setMarkdownContent] = useState<string | null>(null);
  const { data: books, loading, error } = useFetch<ApoBook[]>('/content/livraria/index.json');

  const apocryphaBooks = (books || []).filter((book) => book.category === 'APÓCRIFOS');

  const handleSelect = async (slug: string) => {
    setSelectedSlug(slug);
    const encodedSlug = slug
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');

    const candidates = [
      `/content/livraria/${encodedSlug}.md`,
      `/content/livraria/apocrifos/${encodedSlug}.md`,
    ];

    for (const url of candidates) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) continue;
        const text = await res.text();
        if (!text.trim()) continue;
        setMarkdownContent(text);
        return;
      } catch {
        // try next candidate
      }
    }
  };

  const handleClose = () => {
    setSelectedSlug(null);
    setMarkdownContent(null);
  };

  if (selectedSlug && markdownContent) {
    return <MarkdownViewer content={markdownContent} slug={selectedSlug} category="apocrifos" onClose={handleClose} />;
  }

  // Group by category (same pattern as Bookstore)
  const categories = apocryphaBooks.length ? Array.from(new Set(apocryphaBooks.map((b) => b.category))) : [];
  const grouped = categories.reduce((acc, cat) => {
    acc[cat] = apocryphaBooks.filter((b) => b.category === cat);
    return acc;
  }, {} as Record<string, ApoBook[]>);

  return (
    <div className="pt-6 pb-32 px-5 max-w-7xl mx-auto">
      {/* Hero Header */}
      <header className="mb-10 relative">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-[100px]" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={16} className="text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Análise Técnica</span>
          </div>
          <h2 className="font-headline font-extrabold text-3xl text-primary tracking-tighter mb-1 text-shadow-glow">
            Apócrifos
          </h2>
          <p className="text-on-surface-variant/70 text-[11px] max-w-[280px] font-medium leading-relaxed">
            Interpretação profunda de Enoque e outros escritos em diálogo direto com o cânon bíblico. Além da superfície.
          </p>
        </div>
      </header>

      {/* Content */}
      {loading && (
        <div className="py-10 text-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-50">
          Sincronizando acervo apócrifo...
        </div>
      )}

      {!loading && categories.map((cat) => {
        const items = grouped[cat];
        const info = seriesInfo[cat];
        const reads = items.map((b) => pm.getReadCount('apocrifos', b.slug));
        const minReads = reads.length ? Math.min(...reads) : 0;

        return (
          <div key={cat} className="mb-16">
            {/* Series header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-col">
                <div className="mb-1">
                  <span className="inline-flex items-center rounded-full border border-primary/35 bg-primary/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-primary">
                    SÉRIE
                  </span>
                </div>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <h4 className="font-headline font-extrabold text-xl text-on-surface tracking-tighter uppercase leading-none">
                    {info?.title ?? cat}
                  </h4>
                  {minReads > 0 && (
                    <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
                      (Lido {minReads} vez{minReads > 1 ? 'es' : ''})
                    </span>
                  )}
                </div>
                <p className="text-on-surface-variant text-[11px] font-bold max-w-lg leading-relaxed opacity-70 mt-0.5">
                  {info?.description ?? ''}
                </p>
              </div>
            </div>

            {/* Book cards row */}
            <div className="relative -mx-5 px-5 mt-6">
              <div className="pointer-events-none absolute -bottom-1 left-5 right-5 h-1 bg-gradient-to-r from-primary/30 via-outline-variant/10 to-transparent opacity-20" />
              <DragScrollRow>
                {items.map((book, i) => (
                  <BookCard
                    key={book.slug}
                    book={book}
                    index={i}
                    onSelect={() => handleSelect(book.slug)}
                  />
                ))}
              </DragScrollRow>
            </div>
          </div>
        );
      })}

      {error && (
        <div className="text-red-500 text-[10px] uppercase font-bold text-center py-4">
          Erro ao sincronizar: {error}
        </div>
      )}
    </div>
  );
}
