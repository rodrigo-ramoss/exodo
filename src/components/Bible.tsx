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
  image?: string;
  fallbackImage: string;
  content: string;
}

interface BookGroup {
  book: string;
  testament: Testament;
  studies: InterpretationStudy[];
}

const studyMarkdownModules = import.meta.glob(
  '../content/interpretacao-biblica/{antigo-testamento,novo-testamento}/**/*.md',
  { eager: true, query: '?raw', import: 'default' },
) as Record<string, string>;

function sortByNewest(a: InterpretationStudy, b: InterpretationStudy): number {
  const dateA = new Date(a.date ?? 0).getTime();
  const dateB = new Date(b.date ?? 0).getTime();
  if (dateA !== dateB) return dateB - dateA;
  return a.title.localeCompare(b.title, 'pt-BR');
}

function parseFrontmatter(markdown: string): Record<string, string> {
  const normalized = markdown.replace(/^\uFEFF/, '');
  const match = normalized.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---/);
  if (!match) return {};
  const result: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][\w-]*)\s*:\s*(.*)\s*$/);
    if (!m) continue;
    result[m[1].toLowerCase()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return result;
}

function toBookLabel(raw: string): string {
  if (!raw) return 'DESCONHECIDO';
  return raw.normalize('NFC').toUpperCase();
}

function getBookFallbackImage(book: string): string {
  const fallbackByBook: Record<string, string> = {
    'GÊNESIS': '/assets/imagens/interpretacao-biblica/verdadeiro-oficio-nachash-parte1.webp',
    'MALAQUIAS': '/assets/imagens/interpretacao-biblica/portal-melquisedeque-dizimo-parte1.webp',
  };
  return fallbackByBook[book] ?? '/assets/imagens/interpretacao-biblica/o verdadeiro oficio do nachash.webp';
}

function resolveImageUrl(frontmatterImage?: string, book?: string): string {
  const fallback = getBookFallbackImage(toBookLabel(book || ''));
  if (!frontmatterImage) return fallback;

  const baseName = frontmatterImage
    .replace(/^.*[\\/]/, '')
    .replace(/\.[a-zA-Z0-9]+$/, '');

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
      const title = frontmatter.title || fileName.replace(/\.md$/i, '');
      const book = toBookLabel(frontmatter.book || bookFolder);

      return {
        title,
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

export default function Bible() {
  const [selectedStudy, setSelectedStudy] = useState<InterpretationStudy | null>(null);
  const [selectedBook, setSelectedBook] = useState<BookGroup | null>(null);
  const studies = useMemo(() => loadInterpretationStudies(), []);

  const recentStudies = useMemo(() => studies.slice(0, 6), [studies]);

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
          testament: study.testament,
          studies: [study],
        });
      }
    }
    for (const item of map.values()) {
      item.studies.sort(sortByNewest);
    }
    return Array.from(map.values()).sort((a, b) => a.book.localeCompare(b.book, 'pt-BR'));
  }, [studies]);

  const oldTestamentBooks = groupedBooks.filter((item) => item.testament === 'old');
  const newTestamentBooks = groupedBooks.filter((item) => item.testament === 'new');

  const openStudy = (study: InterpretationStudy) => {
    setSelectedStudy(study);
  };

  const openBookHub = (group: BookGroup) => {
    setSelectedBook(group);
  };

  if (selectedStudy) {
    return (
      <MarkdownViewer
        content={selectedStudy.content}
        slug={selectedStudy.pathKey}
        onClose={() => {
          setSelectedStudy(null);
        }}
      />
    );
  }

  if (selectedBook) {
    return (
      <div className="pt-6 pb-32 px-5 max-w-5xl mx-auto">
        <div className="mb-7">
          <button
            onClick={() => setSelectedBook(null)}
            className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors mb-5 active:scale-95 text-[10px] font-black uppercase tracking-widest"
          >
            <ChevronLeft size={15} />
            BÍBLIA
          </button>

          <p className="font-headline text-[10px] uppercase tracking-[0.2em] font-black text-primary/80 mb-2">
            Hub do Livro
          </p>
          <h2 className="font-headline font-extrabold text-3xl text-primary tracking-tighter mb-2 uppercase">
            {selectedBook.book}
          </h2>
          <p className="text-on-surface-variant/75 text-[11px] max-w-xl font-medium leading-relaxed">
            Estudos disponíveis neste livro. Selecione uma parte para continuar.
          </p>
        </div>

        <div className="space-y-3">
          {selectedBook.studies.map((study, index) => {
            const progressValue = parseInt(localStorage.getItem(`progress_${study.pathKey}`) || '0', 10);
            const progress = Math.max(0, Math.min(100, Number.isFinite(progressValue) ? progressValue : 0));
            const readsCount = parseInt(localStorage.getItem(`reads_${study.pathKey}`) || '0', 10);

            return (
              <article
                key={study.pathKey}
                onClick={() => openStudy(study)}
                className="interactive-card gold-glow-hover cursor-pointer rounded-xl border border-outline-variant/15 bg-surface-container-low p-4 hover:border-primary/35 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-[8px] uppercase tracking-[0.16em] font-black text-primary/80">
                    Estudo {index + 1}
                  </p>
                  <p className="text-[9px] uppercase tracking-wider font-black text-on-surface-variant/55">
                    {study.testament === 'old' ? 'Velho Testamento' : 'Novo Testamento'}
                  </p>
                </div>

                <h4 className="font-headline text-base font-extrabold tracking-tight text-on-surface line-clamp-2 mb-1">
                  {study.title}
                </h4>

                <p className="text-[10px] text-on-surface-variant/70 leading-relaxed line-clamp-2 mb-3">
                  {study.description || 'Estudo de interpretação bíblica com análise contextual e leitura aprofundada.'}
                </p>

                <div className="flex items-center gap-3">
                  <div className="h-1.5 flex-1 bg-outline-variant/20 rounded-full overflow-hidden border border-outline-variant/10">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-yellow-400 shadow-[0_0_8px_rgba(249,115,22,0.35)]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/65">
                    {readsCount > 0 && progress === 0 ? `Lido ${readsCount} vez(es)` : `${progress}%`}
                  </span>
                </div>
              </article>
            );
          })}

          {selectedBook.studies.length === 0 && (
            <article className="rounded-xl border border-outline-variant/15 bg-surface-container-low p-4">
              <p className="text-[10px] text-on-surface-variant/70 leading-relaxed">
                Ainda não há estudos publicados para este livro.
              </p>
            </article>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="pt-6 pb-32 px-5 max-w-7xl mx-auto">
      <header className="mb-7">
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
          A Escritura é um mapa detalhado da realidade visível e invisível. Este painel organiza os
          estudos por testamento e livro, com foco em leitura profunda e contexto textual.
        </p>
      </header>

      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Clock3 size={14} className="text-primary" />
          <h3 className="font-headline text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant">
            ESTUDOS RECENTES
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recentStudies.map((study) => (
            <article
              key={`${study.pathKey}-${study.title}`}
              onClick={() => openStudy(study)}
              className="interactive-card gold-glow-hover cursor-pointer rounded-xl border border-outline-variant/15 bg-surface-container-low p-4 hover:border-primary/35 transition-colors"
            >
              <p className="text-[8px] uppercase tracking-[0.16em] font-black text-primary/80 mb-1">
                {study.book}
              </p>
              <div className="w-full h-24 rounded-lg overflow-hidden border border-outline-variant/10 mb-2">
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
              <h4 className="font-headline text-sm font-extrabold tracking-tight text-on-surface line-clamp-2">
                {study.title}
              </h4>
              {study.description && (
                <p className="text-[10px] text-on-surface-variant/70 mt-1 line-clamp-2 leading-relaxed">
                  {study.description}
                </p>
              )}
            </article>
          ))}

          {recentStudies.length === 0 && (
            <article className="rounded-xl border border-outline-variant/15 bg-surface-container-low p-4">
              <p className="text-[10px] text-on-surface-variant/70 leading-relaxed">
                Assim que novos estudos forem adicionados à pasta de interpretação, eles aparecem aqui automaticamente.
              </p>
            </article>
          )}
        </div>
      </section>

      <section className="mb-8">
        <div className="mb-3">
          <h3 className="font-headline text-lg font-black tracking-tight text-on-surface uppercase">
            VELHO TESTAMENTO
          </h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {oldTestamentBooks.map((group) => {
            return (
              <button
                key={`old-${group.book}`}
                onClick={() => openBookHub(group)}
                className="interactive-card gold-glow-hover text-left rounded-xl border border-outline-variant/15 bg-[#17130f] p-3 hover:border-primary/35 transition-colors"
              >
                <p className="text-[8px] uppercase tracking-[0.16em] font-black text-primary/75 mb-1">Livro</p>
                <p className="font-headline text-base font-extrabold tracking-tight text-on-surface mb-2 line-clamp-1">
                  {group.book}
                </p>
                <p className="text-[9px] text-on-surface-variant/60 uppercase tracking-wider font-bold">
                  {group.studies.length} estudo{group.studies.length > 1 ? 's' : ''}
                </p>
              </button>
            );
          })}
        </div>

        {oldTestamentBooks.length === 0 && (
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant/45 font-bold py-4">
            Nenhum livro com estudo publicado no Velho Testamento.
          </p>
        )}
      </section>

      <section>
        <div className="mb-3">
          <h3 className="font-headline text-lg font-black tracking-tight text-on-surface uppercase">
            NOVO TESTAMENTO
          </h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {newTestamentBooks.map((group) => {
            return (
              <button
                key={`new-${group.book}`}
                onClick={() => openBookHub(group)}
                className="interactive-card gold-glow-hover text-left rounded-xl border border-outline-variant/15 bg-[#17130f] p-3 hover:border-primary/35 transition-colors"
              >
                <p className="text-[8px] uppercase tracking-[0.16em] font-black text-primary/75 mb-1">Livro</p>
                <p className="font-headline text-base font-extrabold tracking-tight text-on-surface mb-2 line-clamp-1">
                  {group.book}
                </p>
                <p className="text-[9px] text-on-surface-variant/60 uppercase tracking-wider font-bold">
                  {group.studies.length} estudo{group.studies.length > 1 ? 's' : ''}
                </p>
              </button>
            );
          })}
        </div>

        {newTestamentBooks.length === 0 && (
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant/45 font-bold py-4">
            Nenhum livro com estudo publicado no Novo Testamento.
          </p>
        )}
      </section>
    </div>
  );
}
