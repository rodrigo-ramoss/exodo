import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Moon, Bookmark, PanelLeft } from 'lucide-react';
import {
  fetchBibleChapter,
  getBooksByTestament,
  type BibleBookMetadata,
  type BibleChapterPayload,
} from '../services/bibleApi';
import { useBibleVersion } from '../state/BibleVersionContext';

interface NavigableBook extends BibleBookMetadata {
  category: string;
}

const SKELETON_LINE_WIDTHS = [
  'w-[96%]',
  'w-[88%]',
  'w-[92%]',
  'w-[84%]',
  'w-[90%]',
  'w-[80%]',
  'w-[94%]',
  'w-[86%]',
];

const GROUP_ORDER = [
  'Pentateuco',
  'Históricos',
  'Poéticos e Sapienciais',
  'Proféticos',
  'Novo Testamento',
];

const DEFAULT_BOOK_ID = 'genesis';
const DEFAULT_CHAPTER = 1;
const MIN_FONT_SIZE = 14;
const MAX_FONT_SIZE = 24;
const DEFAULT_FONT_SIZE = 18;

function getScriptureCategory(book: BibleBookMetadata): string {
  if (book.testament === 'new') {
    return 'Novo Testamento';
  }

  if (book.order <= 5) {
    return 'Pentateuco';
  }
  if (book.order <= 17) {
    return 'Históricos';
  }
  if (book.order <= 22) {
    return 'Poéticos e Sapienciais';
  }
  return 'Proféticos';
}

export default function Bible() {
  const { version } = useBibleVersion();

  const [selectedBookId, setSelectedBookId] = useState<string>(DEFAULT_BOOK_ID);
  const [selectedChapter, setSelectedChapter] = useState<number>(DEFAULT_CHAPTER);
  const [chapterData, setChapterData] = useState<BibleChapterPayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isContentVisible, setIsContentVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCounter, setRetryCounter] = useState(0);
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    Pentateuco: true,
    Históricos: false,
    'Poéticos e Sapienciais': false,
    Proféticos: false,
    'Novo Testamento': true,
  });

  const scriptureBooks = useMemo(() => {
    const oldBooks = getBooksByTestament(version, 'old');
    const newBooks = getBooksByTestament(version, 'new');
    return [...oldBooks, ...newBooks].map((book) => ({
      ...book,
      category: getScriptureCategory(book),
    }));
  }, [version]);

  const allBooks = useMemo<NavigableBook[]>(() => scriptureBooks, [scriptureBooks]);

  const selectedBook = useMemo(
    () => allBooks.find((book) => book.id === selectedBookId),
    [allBooks, selectedBookId],
  );

  useEffect(() => {
    if (selectedBook) {
      return;
    }

    const preferredBook = allBooks.find((book) => book.id === DEFAULT_BOOK_ID) ?? allBooks[0];
    if (!preferredBook) {
      return;
    }

    setSelectedBookId(preferredBook.id);
    setSelectedChapter((currentChapter) => Math.min(currentChapter, preferredBook.chapters));
  }, [selectedBook, allBooks]);

  useEffect(() => {
    if (!selectedBook) {
      return;
    }

    if (selectedChapter < 1) {
      setSelectedChapter(1);
      return;
    }

    if (selectedChapter > selectedBook.chapters) {
      setSelectedChapter(selectedBook.chapters);
    }
  }, [selectedBook, selectedChapter]);

  useEffect(() => {
    if (!selectedBook) {
      return;
    }

    const abortController = new AbortController();
    let fadeTimer: ReturnType<typeof setTimeout> | null = null;

    const loadChapter = async () => {
      setIsLoading(true);
      setIsContentVisible(false);
      setError(null);

      try {
        const payload = await fetchBibleChapter({
          version,
          bookName: selectedBook.name,
          chapter: selectedChapter,
          bookId: selectedBook.id,
          signal: abortController.signal,
        });
        setChapterData(payload);
        fadeTimer = setTimeout(() => {
          if (!abortController.signal.aborted) {
            setIsContentVisible(true);
          }
        }, 10);
      } catch (loadError) {
        if ((loadError as Error).name !== 'AbortError') {
          setChapterData(null);
          setIsContentVisible(false);
          setError((loadError as Error).message);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    loadChapter();

    return () => {
      if (fadeTimer) {
        clearTimeout(fadeTimer);
      }
      abortController.abort();
    };
  }, [version, selectedBook, selectedChapter, retryCounter]);

  const getAdjacentChapter = (
    books: NavigableBook[],
    currentBookId: string,
    currentChapter: number,
    direction: 'previous' | 'next',
  ): { bookId: string; chapter: number } | null => {
    const currentIndex = books.findIndex((book) => book.id === currentBookId);
    if (currentIndex < 0) {
      return null;
    }

    const book = books[currentIndex];
    if (direction === 'previous') {
      if (currentChapter > 1) {
        return { bookId: book.id, chapter: currentChapter - 1 };
      }
      const previousBook = books[currentIndex - 1];
      if (!previousBook) {
        return null;
      }
      return { bookId: previousBook.id, chapter: previousBook.chapters };
    }

    if (currentChapter < book.chapters) {
      return { bookId: book.id, chapter: currentChapter + 1 };
    }

    const nextBook = books[currentIndex + 1];
    if (!nextBook) {
      return null;
    }
    return { bookId: nextBook.id, chapter: 1 };
  };

  const navigableBooks = scriptureBooks;
  const previousChapter = selectedBook
    ? getAdjacentChapter(navigableBooks, selectedBook.id, selectedChapter, 'previous')
    : null;
  const nextChapter = selectedBook
    ? getAdjacentChapter(navigableBooks, selectedBook.id, selectedChapter, 'next')
    : null;
  const chapterVerses = chapterData?.verses ?? [];

  const markChapterRead = (bookId: string, chapter: number) => {
    localStorage.setItem(`exodo:bible-read:${bookId}:${chapter}`, '1');
  };

  const handleNavigateChapter = (direction: 'previous' | 'next') => {
    if (!selectedBook) {
      return;
    }

    // Mark current chapter as read when navigating away
    markChapterRead(selectedBook.id, selectedChapter);

    const target = getAdjacentChapter(navigableBooks, selectedBook.id, selectedChapter, direction);
    if (!target) {
      return;
    }

    setSelectedBookId(target.bookId);
    setSelectedChapter(target.chapter);
  };

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((current) => ({
      ...current,
      [groupName]: !current[groupName],
    }));
  };

  const groupedBooks = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const visibleScriptureBooks = query
      ? scriptureBooks.filter((book) => book.name.toLowerCase().includes(query))
      : scriptureBooks;

    return GROUP_ORDER.map((groupName) => ({
      name: groupName,
      books: visibleScriptureBooks.filter((book) => book.category === groupName),
    })).filter((group) => group.books.length > 0);
  }, [scriptureBooks, searchTerm]);

  const currentReference = selectedBook ? `${selectedBook.name} ${selectedChapter}` : 'Leitura Bíblica';

  const handleRetry = () => {
    setRetryCounter((count) => count + 1);
  };

  return (
    <div className="px-4 pt-4 pb-4 max-w-5xl mx-auto h-[calc(100vh-6.5rem)] flex flex-col overflow-hidden relative">
      <header className="mb-3 border border-outline-variant/15 bg-surface-container-low rounded-2xl p-3">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="min-w-0 flex items-center gap-2 text-left hover:text-primary transition-colors"
          >
            <PanelLeft size={16} className="shrink-0" />
            <h1 className="truncate font-headline font-black text-sm uppercase tracking-[0.16em] text-on-surface">
              {currentReference}
            </h1>
          </button>

          <span className="bg-surface-container-high border border-outline-variant/20 rounded-xl px-3 py-2 text-[10px] font-black text-on-surface uppercase tracking-widest">
            Bíblia Tradicional
          </span>
        </div>
      </header>

      <section className="flex-1 min-h-0 bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/10 flex flex-col overflow-hidden">
        <div className="px-3 sm:px-4 py-3 border-b border-outline-variant/10 flex flex-col gap-3 relative z-10">
          <div className="grid grid-cols-2 items-center gap-3">
            <button
              onClick={() => handleNavigateChapter('previous')}
              disabled={!previousChapter}
              className="justify-self-start flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-headline font-bold uppercase text-[10px] tracking-widest disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronLeft size={14} />
              Anterior
            </button>

            <button
              onClick={() => handleNavigateChapter('next')}
              disabled={!nextChapter}
              className="justify-self-end flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-headline font-bold uppercase text-[10px] tracking-widest disabled:opacity-40 disabled:pointer-events-none"
            >
              Próximo
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="mx-auto w-full max-w-[220px] sm:max-w-[260px] bg-surface-container-high border border-outline-variant/20 rounded-xl px-3 py-2 flex items-center gap-3">
            <span className="text-[9px] font-black text-on-surface-variant">A</span>
            <input
              className="flex-1 h-1 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
              min={MIN_FONT_SIZE}
              max={MAX_FONT_SIZE}
              type="range"
              value={fontSize}
              onChange={(event) => setFontSize(Number(event.target.value))}
            />
            <span className="text-sm font-black text-on-surface-variant">A</span>
          </div>
        </div>

        <article
          className="flex-1 min-h-0 overflow-y-auto px-4 md:px-6 py-4 text-on-surface-variant font-light space-y-5"
          style={{ fontSize: `${fontSize}px`, lineHeight: 1.7 }}
        >
          {isLoading && (
            <div className="space-y-4 animate-pulse">
              <p className="text-center text-[10px] uppercase tracking-widest font-bold opacity-60">
                Acessando registros...
              </p>
              <div className="space-y-2">
                {SKELETON_LINE_WIDTHS.map((lineWidth, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="mt-1 h-2.5 w-5 rounded bg-zinc-700/70 shadow-[0_0_12px_rgba(120,120,120,0.15)]"></div>
                    <div
                      className={`h-3 rounded ${lineWidth} bg-zinc-700/55 shadow-[0_0_16px_rgba(120,120,120,0.12)]`}
                    ></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isLoading && error && (
            <div className="flex flex-col items-center gap-3">
              <p className="text-center text-[10px] uppercase tracking-widest font-bold text-primary">{error}</p>
              <button
                onClick={handleRetry}
                className="px-4 py-2 rounded-xl bg-primary-container text-on-primary-container text-[10px] uppercase tracking-widest font-bold active:scale-95 transition-transform"
              >
                Tentar Novamente
              </button>
            </div>
          )}

          {!isLoading && !error && (
            <div className={`transition-opacity duration-300 ease-out ${isContentVisible ? 'opacity-100' : 'opacity-0'}`}>
              {chapterVerses.map((verse, index) => (
                <p key={`${selectedBook?.id ?? 'book'}-${selectedChapter}-${verse.number}-${index}`} className="flex items-start gap-2">
                  <span className="inline-block mt-1 min-w-6 text-right text-primary font-black text-[10px] leading-none">
                    {verse.number}
                  </span>
                  <span className="flex-1">{verse.text}</span>
                </p>
              ))}
              {chapterVerses.length === 0 && (
                <p className="text-center text-[10px] uppercase tracking-widest font-bold opacity-60">
                  Nenhum versículo retornado para esta referência.
                </p>
              )}
            </div>
          )}
        </article>
      </section>

      {isDrawerOpen && (
        <div className="fixed inset-0 z-50">
          <button
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsDrawerOpen(false)}
            aria-label="Fechar menu"
          />
          <aside className="absolute left-0 top-0 h-full w-[88%] max-w-sm bg-surface-container-low border-r border-outline-variant/20 shadow-2xl flex flex-col">
            <div className="p-4 border-b border-outline-variant/10">
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar livro..."
                className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-3 py-2 text-xs text-on-surface"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {groupedBooks.map((group) => (
                <div key={group.name} className="border-b border-outline-variant/10 pb-2 last:border-b-0">
                  <button
                    onClick={() => toggleGroup(group.name)}
                    className="w-full px-1 py-2 flex items-center justify-between text-left"
                  >
                    <span className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">
                      {group.name}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`transition-transform ${expandedGroups[group.name] ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {expandedGroups[group.name] && (
                    <div className="pt-1 space-y-1">
                      {group.books.map((book) => (
                        <button
                          key={book.id}
                          onClick={() => {
                            if (selectedBook) markChapterRead(selectedBook.id, selectedChapter);
                            setSelectedBookId(book.id);
                            setSelectedChapter(1);
                            setIsDrawerOpen(false);
                          }}
                          className={`w-full px-3 py-2 rounded-md text-left text-sm transition-colors ${
                            book.id === selectedBookId
                              ? 'bg-primary-container text-on-primary-container font-bold'
                              : 'text-on-surface hover:bg-surface-container-high'
                          }`}
                        >
                          {book.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="px-4 py-3 border-t border-outline-variant/10 flex items-center justify-end gap-2 text-on-surface-variant">
              <button
                onClick={() => alert('Modo Noturno')}
                className="hover:text-primary transition-colors p-1 active:scale-90"
              >
                <Moon size={16} />
              </button>
              <button
                onClick={() => alert('Favoritado')}
                className="text-primary active:scale-90 transition-transform p-1"
              >
                <Bookmark size={16} fill="currentColor" />
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
