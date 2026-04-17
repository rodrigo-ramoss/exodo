import { useMemo, useState } from 'react';
import { Sparkles, Clock3, ChevronLeft } from 'lucide-react';
import { MarkdownViewer } from './MarkdownViewer';

type Testament = 'old' | 'new';

interface InterpretationStudy {
  title: string;
  book: string;
  testament: Testament;
  description?: string;
  date?: string;
  pathKey: string;
  image: string;
  fallbackImage: string;
  content: string;
}

interface BookGroup {
  book: string;
  code: string;
  testament: Testament;
  cover: string;
  studies: InterpretationStudy[];
}

const studyMarkdownModules = import.meta.glob(
  '../content/interpretacao-biblica/{antigo-testamento,novo-testamento}/**/*.md',
  { eager: true, query: '?raw', import: 'default' },
) as Record<string, string>;

const BOOK_CODE_MAP: Record<string, string> = {
  GENESIS: 'GN',
  MALAQUIAS: 'ML',
};

const BOOK_FALLBACK_IMAGE_MAP: Record<string, string> = {
  GENESIS: '/assets/imagens/interpretacao-biblica/verdadeiro-oficio-nachash-parte1.webp',
  MALAQUIAS: '/assets/imagens/interpretacao-biblica/portal-melquisedeque-dizimo-parte1.webp',
};

function sortByNewest(a: InterpretationStudy, b: InterpretationStudy): number {
  const dateA = new Date(a.date ?? 0).getTime();
  const dateB = new Date(b.date ?? 0).getTime();
  if (dateA !== dateB) return dateB - dateA;
  return a.title.localeCompare(b.title, 'pt-BR');
}

function normalizeKey(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

function toBookLabel(raw: string): string {
  if (!raw) return 'DESCONHECIDO';
  return raw.normalize('NFC').toUpperCase();
}

function getBookCode(book: string): string {
  const normalized = normalizeKey(book);
  if (BOOK_CODE_MAP[normalized]) return BOOK_CODE_MAP[normalized];
  const compact = normalized.replace(/[^A-Z]/g, '');
  return compact.slice(0, 2) || '??';
}

function getBookFallbackImage(book: string): string {
  const normalized = normalizeKey(book);
  return BOOK_FALLBACK_IMAGE_MAP[normalized]
    ?? '/assets/imagens/interpretacao-biblica/o verdadeiro oficio do nachash.webp';
}

function parseFrontmatter(markdown: string): Record<string, string> {
  const normalized = markdown.replace(/^\uFEFF/, '').trimStart();
  const match = normalized.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---/);
  if (!match) return {};

  const result: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const item = line.match(/^\s*([A-Za-z_][\w-]*)\s*:\s*(.*?)\s*$/);
    if (!item) continue;
    result[item[1].toLowerCase()] = item[2].replace(/^["']|["']$/g, '');
  }
  return result;
}

function resolveImageUrl(frontmatterImage: string | undefined, book: string): string {
  const fallback = getBookFallbackImage(book);
  if (!frontmatterImage) return fallback;

  const imageValue = frontmatterImage.trim();
  if (!imageValue) return fallback;
  if (/^https?:\/\//i.test(imageValue)) return imageValue;
  if (imageValue.startsWith('/assets/imagens/interpretacao-biblica/')) return imageValue;

  const fileName = imageValue.replace(/^.*[\\/]/, '');
  const baseName = fileName.replace(/\.[a-z0-9]+$/i, '');
  if (!baseName) return fallback;

  return `/assets/imagens/interpretacao-biblica/${baseName}.webp`;
}

function loadInterpretationStudies(): InterpretationStudy[] {
  return Object.entries(studyMarkdownModules)
    .map(([pathKey, content]) => {
      const normalizedPath = pathKey.replace(/\\/g, '/');
      const parts = normalizedPath.split('/');
      const testamentFolder = parts[3] ?? '';
      const bookFolder = parts[4] ?? '';
      const fileName = parts[parts.length - 1] ?? '';
      const testament: Testament = testamentFolder === 'novo-testamento' ? 'new' : 'old';

      const frontmatter = parseFrontmatter(content);
      const book = toBookLabel(frontmatter.book || bookFolder);

      return {
        title: frontmatter.title || fileName.replace(/\.md$/i, ''),
        book,
        testament,
        description: frontmatter.description,
        date: frontmatter.date,
        pathKey,
        image: resolveImageUrl(frontmatter.image, book),
        fallbackImage: getBookFallbackImage(book),
        content,
      };
    })
    .sort(sortByNewest);
}

function getProgress(slug: string): number {
  const value = parseInt(localStorage.getItem(`progress_${slug}`) || '0', 10);
  return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
}

function getReads(slug: string): number {
  const value = parseInt(localStorage.getItem(`reads_${slug}`) || '0', 10);
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function AnimatedDivider() {
  return <div className="divider-sheen my-7" />;
}

export default function Bible() {
  const [selectedStudy, setSelectedStudy] = useState<InterpretationStudy | null>(null);
  const [selectedBook, setSelectedBook] = useState<BookGroup | null>(null);
  const studies = useMemo(() => loadInterpretationStudies(), []);

  const recentStudies = useMemo(() => studies.slice(0, 8), [studies]);

  const groupedBooks = useMemo(() => {
    const map = new Map<string, BookGroup>();

    for (const study of studies) {
      const key = `${study.testament}:${study.book}`;
      const existing = map.get(key);
      if (existing) {
        existing.studies.push(study);
      } else {
        map.set(key, {
          book: study.book,
          code: getBookCode(study.book),
          testament: study.testament,
          cover: study.image,
          studies: [study],
        });
      }
    }

    for (const group of map.values()) {
      group.studies.sort(sortByNewest);
      group.cover = group.studies[0]?.image || getBookFallbackImage(group.book);
    }

    return Array.from(map.values()).sort((a, b) => a.book.localeCompare(b.book, 'pt-BR'));
  }, [studies]);

  const oldTestamentBooks = groupedBooks.filter((item) => item.testament === 'old');
  const newTestamentBooks = groupedBooks.filter((item) => item.testament === 'new');

  const openStudy = (study: InterpretationStudy) => setSelectedStudy(study);
  const openBookHub = (book: BookGroup) => setSelectedBook(book);

  if (selectedStudy) {
    return (
      <MarkdownViewer
        content={selectedStudy.content}
        slug={selectedStudy.pathKey}
        onClose={() => setSelectedStudy(null)}
      />
    );
  }

  if (selectedBook) {
    return (
      <div className="pt-6 pb-32 px-5 max-w-5xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => setSelectedBook(null)}
            className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors mb-5 active:scale-95 text-[10px] font-black uppercase tracking-widest"
          >
            <ChevronLeft size={15} />
            BÍBLIA
          </button>

          <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-white/10">
            <img
              src={selectedBook.cover}
              alt={selectedBook.book}
              className="absolute inset-0 w-full h-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/10" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />

            <div className="relative h-full p-5 flex flex-col justify-end">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/85 mb-1">
                Lista de Estudos
              </span>
              <h2 className="font-headline font-extrabold text-2xl tracking-tight text-on-surface uppercase leading-none">
                {selectedBook.book}
              </h2>
              <p className="mt-1 text-[10px] text-on-surface-variant/80 uppercase tracking-wider font-bold">
                {selectedBook.studies.length} estudo{selectedBook.studies.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        <AnimatedDivider />

        <div className="space-y-3">
          {selectedBook.studies.map((study, index) => {
            const progress = getProgress(study.pathKey);
            const reads = getReads(study.pathKey);

            return (
              <article
                key={study.pathKey}
                onClick={() => openStudy(study)}
                className="gold-glow-hover group cursor-pointer rounded-2xl border border-outline-variant/20 bg-surface-container-low/80 backdrop-blur-sm p-4 hover:scale-105 transition-transform duration-300"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.16em] font-black text-primary/85 mb-1">
                      Volume {index + 1}
                    </p>
                    <h4 className="font-headline text-base font-extrabold tracking-tight text-on-surface line-clamp-2 group-hover:text-primary transition-colors">
                      {study.title}
                    </h4>
                  </div>
                  <span className="text-[8px] uppercase tracking-[0.16em] font-black text-on-surface-variant/55">
                    {study.testament === 'old' ? 'AT' : 'NT'}
                  </span>
                </div>

                <p className="text-[10px] text-on-surface-variant/75 leading-relaxed line-clamp-2 mb-3">
                  {study.description || 'Estudo de interpretação bíblica com análise contextual e leitura aprofundada.'}
                </p>

                <div className="h-5 bg-outline-variant/20 rounded-full overflow-hidden border border-outline-variant/20">
                  <div
                    className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F5D76E] shadow-[0_0_8px_rgba(212,175,55,0.35)] flex items-center justify-center"
                    style={{ width: `${progress}%` }}
                  >
                    {progress > 0 && (
                      <span className="text-[10px] font-black text-black leading-none">
                        {progress}%
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-wider font-black text-on-surface-variant/60">
                    {reads > 0 && progress === 0 ? `Lido ${reads} vez(es)` : 'Em andamento'}
                  </span>
                  <span className="text-[8px] uppercase tracking-widest font-bold text-on-surface-variant/45">
                    {study.date || 'sem data'}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    );
  }

  const oldBannerCover = oldTestamentBooks[0]?.cover || getBookFallbackImage('GÊNESIS');
  const newBannerCover = newTestamentBooks[0]?.cover || getBookFallbackImage('MALAQUIAS');

  return (
    <div className="pt-6 pb-32 px-5 max-w-7xl mx-auto">
      <header className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 mb-3">
          <Sparkles size={12} className="text-primary" />
          <span className="text-[9px] font-black uppercase tracking-[0.16em] text-primary">
            ✨ Novos estudos toda semana
          </span>
        </div>
        <p className="font-headline text-[10px] uppercase tracking-[0.2em] font-black text-primary/80 mb-2">
          A Interpretação
        </p>
        <h2 className="font-headline font-extrabold text-3xl text-primary tracking-tighter mb-2 uppercase">
          BÍBLIA
        </h2>
        <p className="text-on-surface-variant/75 text-[11px] max-w-xl font-medium leading-relaxed">
          Leitura profunda, estrutura limpa e foco no texto. Selecione um livro para abrir o hub com todos os estudos.
        </p>
      </header>

      <section className="mb-3">
        <div className="flex items-center gap-2 mb-3">
          <Clock3 size={14} className="text-primary" />
          <h3 className="font-headline text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant">
            ESTUDOS RECENTES
          </h3>
        </div>

        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 snap-x snap-mandatory">
          {recentStudies.map((study) => (
            <article
              key={study.pathKey}
              onClick={() => openStudy(study)}
              className="gold-glow-hover min-w-[220px] max-w-[220px] rounded-xl border border-outline-variant/20 bg-surface-container-low overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-300 snap-start"
            >
              <div className="h-24 w-full border-b border-outline-variant/10">
                <img
                  src={study.image}
                  alt={study.title}
                  className="w-full h-full object-cover"
                  onError={(event) => {
                    const target = event.currentTarget;
                    target.onerror = null;
                    target.src = study.fallbackImage;
                  }}
                />
              </div>
              <div className="p-3">
                <p className="text-[8px] uppercase tracking-[0.16em] font-black text-primary/80 mb-1">
                  {study.book}
                </p>
                <h4 className="font-headline text-xs font-extrabold tracking-tight text-on-surface line-clamp-2 mb-1">
                  {study.title}
                </h4>
                <p className="text-[9px] text-on-surface-variant/65 line-clamp-2 leading-snug">
                  {study.description || 'Clique para abrir o estudo.'}
                </p>
              </div>
            </article>
          ))}

          {recentStudies.length === 0 && (
            <article className="min-w-[220px] rounded-xl border border-outline-variant/15 bg-surface-container-low p-4">
              <p className="text-[10px] text-on-surface-variant/70 leading-relaxed">
                Assim que novos estudos forem adicionados, eles aparecem aqui automaticamente.
              </p>
            </article>
          )}
        </div>
      </section>

      <AnimatedDivider />

      <section className="mb-7">
        <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-white/10 mb-4">
          <img
            src={oldBannerCover}
            alt="Velho Testamento"
            className="absolute inset-0 w-full h-full object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#2c2112]/90 via-[#1a1510]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
          <div className="relative h-full p-5 flex flex-col justify-between">
            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-primary/80">TESTAMENTO</span>
            <div>
              <h3 className="font-headline font-black text-2xl text-on-surface tracking-tight uppercase leading-none">
                VELHO TESTAMENTO
              </h3>
              <p className="mt-1 text-[10px] text-on-surface-variant/80 font-medium">
                Torá, Profetas e Escritos em análise textual aprofundada.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {oldTestamentBooks.map((group) => (
            <button
              key={`old-${group.book}`}
              onClick={() => openBookHub(group)}
              className="gold-glow-hover rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-3 text-left cursor-pointer hover:scale-105 transition-transform duration-300"
            >
              <p className="text-lg font-black tracking-[0.18em] text-[#D4AF37] mb-1">{group.code}</p>
              <p className="font-headline text-xs font-extrabold tracking-wide text-on-surface uppercase line-clamp-1">
                {group.book}
              </p>
              <p className="text-[9px] text-on-surface-variant/55 uppercase tracking-wider font-black mt-1">
                {group.studies.length} estudo{group.studies.length > 1 ? 's' : ''}
              </p>
            </button>
          ))}
        </div>
      </section>

      <AnimatedDivider />

      <section>
        <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-white/10 mb-4">
          <img
            src={newBannerCover}
            alt="Novo Testamento"
            className="absolute inset-0 w-full h-full object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#11202c]/90 via-[#10171a]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
          <div className="relative h-full p-5 flex flex-col justify-between">
            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-primary/80">TESTAMENTO</span>
            <div>
              <h3 className="font-headline font-black text-2xl text-on-surface tracking-tight uppercase leading-none">
                NOVO TESTAMENTO
              </h3>
              <p className="mt-1 text-[10px] text-on-surface-variant/80 font-medium">
                Evangelhos, cartas e apocalipse com leitura contextual e progressiva.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {newTestamentBooks.map((group) => (
            <button
              key={`new-${group.book}`}
              onClick={() => openBookHub(group)}
              className="gold-glow-hover rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-3 text-left cursor-pointer hover:scale-105 transition-transform duration-300"
            >
              <p className="text-lg font-black tracking-[0.18em] text-[#D4AF37] mb-1">{group.code}</p>
              <p className="font-headline text-xs font-extrabold tracking-wide text-on-surface uppercase line-clamp-1">
                {group.book}
              </p>
              <p className="text-[9px] text-on-surface-variant/55 uppercase tracking-wider font-black mt-1">
                {group.studies.length} estudo{group.studies.length > 1 ? 's' : ''}
              </p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
