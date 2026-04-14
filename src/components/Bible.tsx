import { useEffect, useMemo, useState } from 'react';
import { Star, ChevronLeft, ChevronRight, Moon, Bookmark, Lock } from 'lucide-react';
import {
  fetchBibleChapter,
  getAdjacentChapter,
  getBookById,
  getBooksByTestament,
  getVersionMetadata,
  type BibleBookMetadata,
  type BibleChapterPayload,
  type BibleTestament,
  type BibleVersion,
} from '../services/bibleApi';
import { useBibleVersion } from '../state/BibleVersionContext';

type BibleTab = 'old' | 'new' | 'apocrypha';

const TAB_LABELS: Record<BibleTab, string> = {
  old: 'Antigo Testamento',
  new: 'Novo Testamento',
  apocrypha: 'Apócrifos',
};

const BIBLE_TABS: BibleTab[] = ['old', 'new', 'apocrypha'];
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

const DEFAULT_BOOK_ID = 'exodo';
const DEFAULT_CHAPTER = 20;

export default function Bible() {
  const { version, setVersion } = useBibleVersion();
  const versionMetadata = useMemo(() => getVersionMetadata(version), [version]);

  const [selectedTab, setSelectedTab] = useState<BibleTab>('old');
  const [selectedBookId, setSelectedBookId] = useState<string>(DEFAULT_BOOK_ID);
  const [selectedChapter, setSelectedChapter] = useState<number>(DEFAULT_CHAPTER);
  const [chapterData, setChapterData] = useState<BibleChapterPayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isContentVisible, setIsContentVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCounter, setRetryCounter] = useState(0);

  const selectedBook = useMemo(
    () => getBookById(version, selectedBookId),
    [version, selectedBookId],
  );

  const getTabByTestament = (testament: BibleTestament): BibleTab => {
    if (testament === 'deuterocanonical') {
      return 'apocrypha';
    }
    return testament;
  };

  const getBooksByTab = (activeVersion: BibleVersion, tab: BibleTab) => {
    if (tab === 'apocrypha') {
      if (activeVersion === 'traditional') {
        return [];
      }
      return getBooksByTestament(activeVersion, 'deuterocanonical');
    }

    return getBooksByTestament(activeVersion, tab);
  };

  const testamentBooks = useMemo(
    () => getBooksByTab(version, selectedTab),
    [version, selectedTab],
  );

  useEffect(() => {
    if (selectedTab !== 'apocrypha' || version === 'traditional') {
      return;
    }

    const isSelectedFromApocrypha = selectedBook?.testament === 'deuterocanonical';
    if (isSelectedFromApocrypha || testamentBooks.length === 0) {
      return;
    }

    const firstApocryphaBook = testamentBooks[0];
    setSelectedBookId(firstApocryphaBook.id);
    setSelectedChapter((currentChapter) => Math.min(currentChapter, firstApocryphaBook.chapters));
  }, [selectedTab, version, selectedBook, testamentBooks]);

  useEffect(() => {
    if (selectedBook) {
      return;
    }

    const preferredBook = getBookById(version, DEFAULT_BOOK_ID) ?? versionMetadata.books[0];
    if (!preferredBook) {
      return;
    }

    setSelectedBookId(preferredBook.id);
    setSelectedTab(getTabByTestament(preferredBook.testament));
    setSelectedChapter((currentChapter) => Math.min(currentChapter, preferredBook.chapters));
  }, [selectedBook, version, versionMetadata.books]);

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

  const currentBook: BibleBookMetadata | undefined = selectedBook;

  const previousChapter = currentBook
    ? getAdjacentChapter(version, currentBook.id, selectedChapter, 'previous')
    : null;
  const nextChapter = currentBook
    ? getAdjacentChapter(version, currentBook.id, selectedChapter, 'next')
    : null;

  const chapterVerses = chapterData?.verses ?? [];

  const handleVersionChange = (nextVersion: BibleVersion) => {
    if (nextVersion === version) {
      return;
    }
    setVersion(nextVersion);
  };

  const handleBookSelect = (book: BibleBookMetadata) => {
    setSelectedBookId(book.id);
    setSelectedTab(getTabByTestament(book.testament));
    setSelectedChapter(1);
  };

  const handleNavigateChapter = (direction: 'previous' | 'next') => {
    if (!currentBook) {
      return;
    }

    const target = getAdjacentChapter(version, currentBook.id, selectedChapter, direction);
    if (!target) {
      return;
    }

    const targetBook = getBookById(version, target.bookId);
    if (!targetBook) {
      return;
    }

    setSelectedBookId(targetBook.id);
    setSelectedTab(getTabByTestament(targetBook.testament));
    setSelectedChapter(target.chapter);
  };

  const handleRetry = () => {
    setRetryCounter((count) => count + 1);
  };

  return (
    <div className="pt-6 pb-32 px-4 max-w-4xl mx-auto min-h-screen relative">
      <section className="mb-8">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
          <button
            onClick={() => handleVersionChange('traditional')}
            className={`px-5 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-transform active:scale-95 whitespace-nowrap ${
              version === 'traditional'
                ? 'bg-primary-container text-on-primary-container'
                : 'bg-surface-container-high text-on-surface-variant border border-outline-variant/15 hover:bg-surface-bright'
            }`}
          >
            Tradicional
          </button>
          <button
            onClick={() => handleVersionChange('catholic')}
            className={`px-5 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-transform active:scale-95 whitespace-nowrap ${
              version === 'catholic'
                ? 'bg-primary-container text-on-primary-container'
                : 'bg-surface-container-high text-on-surface-variant border border-outline-variant/15 hover:bg-surface-bright'
            }`}
          >
            Católica
          </button>
          <button
            onClick={() => handleVersionChange('ethiopian')}
            className={`px-5 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-transform active:scale-95 whitespace-nowrap ${
              version === 'ethiopian'
                ? 'bg-primary-container text-on-primary-container'
                : 'bg-surface-container-high text-on-surface-variant border border-outline-variant/15 hover:bg-surface-bright'
            }`}
          >
            Etíope
          </button>
        </div>
      </section>

      <section className="mb-10">
        <div className="flex gap-6 mb-4 border-b border-outline-variant/10 overflow-x-auto hide-scrollbar">
          {BIBLE_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`pb-2 font-headline text-[10px] uppercase tracking-widest font-bold whitespace-nowrap transition-colors ${
                selectedTab === tab
                  ? 'text-primary border-b-2 border-primary'
                  : tab === 'apocrypha' && version === 'traditional'
                    ? 'text-on-surface-variant/50'
                    : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        {selectedTab === 'apocrypha' && version === 'traditional' && (
          <div className="mb-4 rounded-xl border border-outline-variant/15 bg-surface-container-low px-4 py-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant/20">
              <Lock size={14} className="text-on-surface-variant" />
            </div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">
              Apócrifos bloqueados na versão tradicional.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {testamentBooks.map((book) => {
            const selected = book.id === selectedBookId;
            return (
              <button
                key={book.id}
                onClick={() => handleBookSelect(book)}
                className={`text-left p-3 rounded-xl transition-all active:scale-95 relative overflow-hidden border ${
                  selected
                    ? 'bg-surface-container-high border-primary/30'
                    : 'bg-surface-container-low border-outline-variant/15 hover:bg-surface-container-high'
                }`}
              >
                {selected && (
                  <div className="absolute top-0 right-0 p-1">
                    <Star className="text-primary" size={10} fill="currentColor" />
                  </div>
                )}
                <span className="text-[8px] text-primary/60 font-black block mb-1">
                  {book.chapters} cap.
                </span>
                <h3 className={`font-headline font-bold text-xs ${selected ? 'text-primary' : 'text-on-surface'}`}>
                  {book.name}
                </h3>
              </button>
            );
          })}
        </div>
        {testamentBooks.length === 0 && !(selectedTab === 'apocrypha' && version === 'traditional') && (
          <p className="mt-4 text-center text-[10px] uppercase tracking-widest font-bold opacity-60">
            Nenhum livro disponível nesta aba.
          </p>
        )}
      </section>

      <section className="bg-surface-container-lowest p-6 md:p-10 rounded-2xl shadow-xl border border-outline-variant/5">
        <header className="mb-8 text-center">
          <div className="flex justify-center items-center gap-2 text-primary mb-2">
            <span className="h-[1px] w-6 bg-primary/30"></span>
            <Star size={12} />
            <span className="h-[1px] w-6 bg-primary/30"></span>
          </div>
          <h2 className="text-2xl font-headline font-extrabold tracking-tighter text-on-surface mb-1">
            {currentBook ? `${currentBook.name} ${selectedChapter}` : 'Selecione um livro'}
          </h2>
          <p className="text-on-surface-variant font-bold uppercase tracking-[0.2em] text-[9px]">
            Versão {versionMetadata.label}
          </p>
        </header>

        <div className="mb-6 flex justify-center">
          <select
            value={selectedChapter}
            onChange={(event) => setSelectedChapter(Number(event.target.value))}
            className="bg-surface-container-high border border-outline-variant/20 rounded-xl px-3 py-2 text-xs font-bold text-on-surface"
            disabled={!currentBook}
          >
            {Array.from({ length: currentBook?.chapters ?? 0 }, (_, index) => index + 1).map((chapterNumber) => (
              <option key={chapterNumber} value={chapterNumber}>
                Capítulo {chapterNumber}
              </option>
            ))}
          </select>
        </div>

        <article className="text-base leading-[1.7] text-on-surface-variant font-light space-y-5 max-w-2xl mx-auto">
          {isLoading && (
            <div className="space-y-4 animate-pulse">
              <p className="text-center text-[10px] uppercase tracking-widest font-bold opacity-60">Acessando registros...</p>
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
              {chapterVerses.map((verse) => (
                <p key={verse.number} className="flex items-start gap-2">
                  <span className="inline-block mt-1 min-w-5 text-right text-primary font-black text-[10px] leading-none">
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

        <nav className="mt-12 flex justify-between items-center border-t border-outline-variant/10 pt-6">
          <button
            onClick={() => handleNavigateChapter('previous')}
            disabled={!previousChapter}
            className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-headline font-bold uppercase text-[10px] tracking-widest group active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
          >
            <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Anterior
          </button>
          <div className="h-1.5 w-1.5 bg-primary/20 rounded-full"></div>
          <button
            onClick={() => handleNavigateChapter('next')}
            disabled={!nextChapter}
            className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-headline font-bold uppercase text-[10px] tracking-widest group active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
          >
            Próximo
            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </nav>
      </section>

      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-50">
        <div className="bg-surface-container-high/95 backdrop-blur-2xl p-3 rounded-2xl border border-outline-variant/20 shadow-2xl flex items-center gap-4">
          <div className="flex-1 flex items-center gap-3">
            <span className="text-[9px] font-black text-on-surface-variant">A</span>
            <input
              className="flex-1 h-1 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
              max="24"
              min="14"
              type="range"
              defaultValue="18"
            />
            <span className="text-sm font-black text-on-surface-variant">A</span>
          </div>
          <div className="flex items-center gap-3 border-l border-outline-variant/20 pl-3">
            <button
              onClick={() => alert('Modo Noturno')}
              className="text-on-surface-variant hover:text-primary transition-colors p-1 active:scale-90"
            >
              <Moon size={18} />
            </button>
            <button onClick={() => alert('Favoritado')} className="text-primary active:scale-90 transition-transform p-1">
              <Bookmark size={18} fill="currentColor" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
