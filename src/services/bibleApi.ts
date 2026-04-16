import bibleMetadata from '../data/bibleMetadata.json';
import catholicFallbackBooks from '../data/catholicFallbackBooks.json';
import escritosCurados from '../data/escritosCurados.json';

export type BibleVersion = 'traditional' | 'catholic' | 'ethiopian';
export type BibleTestament = 'old' | 'new' | 'deuterocanonical';

export interface BibleBookMetadata {
  id: string;
  name: string;
  testament: BibleTestament;
  chapters: number;
  order: number;
}

export interface BibleVersionMetadata {
  id: BibleVersion;
  label: string;
  books: BibleBookMetadata[];
}

interface BibleMetadataMap {
  versions: Record<BibleVersion, BibleVersionMetadata>;
}

type PersistedBibleVersion = 'traditional' | 'catholic';

interface PersistedBibleMetadataMap {
  versions: Record<PersistedBibleVersion, BibleVersionMetadata>;
}

export interface BibleVerse {
  number: number;
  text: string;
}

export interface BibleChapterPayload {
  version: BibleVersion;
  reference: string;
  bookName: string;
  chapter: number;
  verses: BibleVerse[];
}

export interface FetchBibleChapterParams {
  version: BibleVersion;
  bookName: string;
  chapter: number;
  bookId?: string;
  signal?: AbortSignal;
}

interface BibleProviderConfig {
  baseUrl: string;
  translation?: string;
}

interface LocalFallbackBook {
  name: string;
  chapterCount: number;
  chapters: Record<string, unknown>;
}

type LocalFallbackBooksMap = Record<string, LocalFallbackBook>;
interface CuratedWritingsPayload {
  books: Array<{
    id: string;
    name: string;
    group: string;
    chapterCount: number;
    chapters: Record<string, unknown>;
  }>;
}

const persistedMetadata = bibleMetadata as PersistedBibleMetadataMap;
const localCatholicFallbackBooks = catholicFallbackBooks as LocalFallbackBooksMap;
const curatedWritingsPayload = escritosCurados as CuratedWritingsPayload;

const CATHOLIC_LOCAL_BOOK_IDS = new Set([
  'tobias',
  'judite',
  'sabedoria',
  'eclesiastico',
  'baruc',
  '1-macabeus',
  '2-macabeus',
]);

const ETHIOPIAN_EXTRA_BOOKS: BibleBookMetadata[] = [
  {
    id: 'enoque',
    name: 'Enoque',
    testament: 'deuterocanonical',
    chapters: 108,
    order: 74,
  },
  {
    id: 'jubileus',
    name: 'Jubileus',
    testament: 'deuterocanonical',
    chapters: 50,
    order: 75,
  },
];

const localEthiopianFallbackBooks: LocalFallbackBooksMap = {
  enoque: {
    name: 'Enoque',
    chapterCount: 108,
    chapters: {},
  },
  jubileus: {
    name: 'Jubileus',
    chapterCount: 50,
    chapters: {},
  },
};

const ETHIOPIAN_LOCAL_BOOK_IDS = new Set(Object.keys(localEthiopianFallbackBooks));
const curatedWritingsMap: LocalFallbackBooksMap = curatedWritingsPayload.books.reduce(
  (accumulator, book) => {
    accumulator[book.id] = {
      name: book.name,
      chapterCount: book.chapterCount,
      chapters: book.chapters ?? {},
    };
    return accumulator;
  },
  {} as LocalFallbackBooksMap,
);
const CURATED_WRITINGS_BOOK_IDS = new Set(Object.keys(curatedWritingsMap));
const curatedWritingsBooksMetadata: BibleBookMetadata[] = curatedWritingsPayload.books.map(
  (book, index) => ({
    id: book.id,
    name: book.name,
    testament: 'deuterocanonical',
    chapters: book.chapterCount,
    order: 1000 + index,
  }),
);

const ethiopianMetadata: BibleVersionMetadata = {
  id: 'ethiopian',
  label: 'Etíope',
  books: [...persistedMetadata.versions.catholic.books, ...ETHIOPIAN_EXTRA_BOOKS],
};

const metadata: BibleMetadataMap = {
  versions: {
    traditional: persistedMetadata.versions.traditional,
    catholic: persistedMetadata.versions.catholic,
    ethiopian: ethiopianMetadata,
  },
};

const providerConfig: Record<BibleVersion, BibleProviderConfig> = {
  traditional: {
    baseUrl: import.meta.env.VITE_BIBLE_TRADITIONAL_API_URL ?? 'https://bible-api.com',
    translation: (import.meta.env.VITE_BIBLE_TRADITIONAL_TRANSLATION ?? 'almeida').toLowerCase(),
  },
  catholic: {
    baseUrl:
      import.meta.env.VITE_BIBLE_CATHOLIC_API_URL ??
      import.meta.env.VITE_BIBLE_TRADITIONAL_API_URL ??
      'https://bible-api.com',
    translation:
      (import.meta.env.VITE_BIBLE_CATHOLIC_TRANSLATION ??
        import.meta.env.VITE_BIBLE_TRADITIONAL_TRANSLATION ??
        'almeida').toLowerCase(),
  },
  ethiopian: {
    baseUrl:
      import.meta.env.VITE_BIBLE_ETHIOPIAN_API_URL ??
      import.meta.env.VITE_BIBLE_TRADITIONAL_API_URL ??
      'https://bible-api.com',
    translation:
      (import.meta.env.VITE_BIBLE_ETHIOPIAN_TRANSLATION ??
        import.meta.env.VITE_BIBLE_TRADITIONAL_TRANSLATION ??
        'almeida').toLowerCase(),
  },
};

function extractBookName(reference: string, fallbackName: string): string {
  const result = reference.replace(/\d+[:\s].*$/, '').trim();
  return result.length > 0 ? result : fallbackName;
}

function parseNumeric(input: unknown, fallbackValue: number): number {
  if (typeof input === 'number') {
    return input;
  }
  if (typeof input === 'string') {
    const parsed = Number(input.trim());
    return Number.isNaN(parsed) ? fallbackValue : parsed;
  }
  return fallbackValue;
}

function getChapterVerseFromReference(input: unknown): { chapter: number; verse: number } | null {
  if (typeof input !== 'string') {
    return null;
  }

  const match = input.trim().match(/^(\d+)\s*[:.]\s*(\d+)$/);
  if (!match) {
    return null;
  }

  const chapter = Number(match[1]);
  const verse = Number(match[2]);
  if (Number.isNaN(chapter) || Number.isNaN(verse)) {
    return null;
  }

  return { chapter, verse };
}

function normalizeChapterResponse(
  responseData: unknown,
  version: BibleVersion,
  fallbackBook: string,
  fallbackChapter: number,
): BibleChapterPayload {
  const payload = responseData as Record<string, unknown>;

  if (Array.isArray(payload.verses)) {
    const verses = payload.verses
      .map((item, index) => {
        const verse = item as Record<string, unknown>;
        const chapterVerse = getChapterVerseFromReference(verse.verse ?? verse.number);
        const number = chapterVerse
          ? chapterVerse.verse
          : parseNumeric(verse.verse ?? verse.number, index + 1);
        const text = typeof verse.text === 'string' ? verse.text.trim() : '';
        return text ? { number, text } : null;
      })
      .filter((verse): verse is BibleVerse => verse !== null);

    if (verses.length > 0) {
      const reference =
        typeof payload.reference === 'string'
          ? payload.reference
          : `${fallbackBook} ${fallbackChapter}`;

      return {
        version,
        reference,
        bookName: extractBookName(reference, fallbackBook),
        chapter: fallbackChapter,
        verses,
      };
    }
  }

  if (
    typeof payload.book === 'object' &&
    payload.book !== null &&
    typeof payload.chapter === 'object' &&
    payload.chapter !== null
  ) {
    const chapterData = payload.chapter as Record<string, unknown>;
    const bookData = payload.book as Record<string, unknown>;
    const verses = Array.isArray(chapterData.verses)
      ? chapterData.verses
          .map((item) => {
            const verse = item as Record<string, unknown>;
            const number = parseNumeric(verse.number, 0);
            const text = typeof verse.text === 'string' ? verse.text.trim() : '';
            return number > 0 && text ? { number, text } : null;
          })
          .filter((verse): verse is BibleVerse => verse !== null)
      : [];

    if (verses.length > 0) {
      const bookName = typeof bookData.name === 'string' ? bookData.name : fallbackBook;
      const chapter = parseNumeric(chapterData.number, fallbackChapter);

      return {
        version,
        reference: `${bookName} ${chapter}`,
        bookName,
        chapter,
        verses,
      };
    }
  }

  throw new Error('Formato de resposta da API bíblica não suportado.');
}

function resolveBaseUrl(rawBaseUrl: string): string {
  const normalizedBaseUrl = rawBaseUrl.replace(/\/$/, '');
  if (/^https?:\/\//i.test(normalizedBaseUrl)) {
    return normalizedBaseUrl;
  }
  if (typeof window === 'undefined') {
    return normalizedBaseUrl;
  }
  return `${window.location.origin}${
    normalizedBaseUrl.startsWith('/') ? '' : '/'
  }${normalizedBaseUrl}`;
}

function buildReference(bookName: string, chapter: number): string {
  // Always include the chapter number. bible-api.com distinguishes "Judas 1" (chapter 1)
  // from "Judas 1:1" (verse 1), so bare book names cause 404 for single-chapter books.
  return `${bookName} ${chapter}`;
}

function buildChapterUrl({
  baseUrl,
  reference,
  translation,
  bookId,
}: {
  baseUrl: string;
  reference: string;
  translation?: string;
  bookId?: string;
}): string {
  const encodedReference = encodeURIComponent(reference);
  const url = new URL(`${resolveBaseUrl(baseUrl)}/${encodedReference}`);

  if (translation) {
    url.searchParams.set('translation', translation);
  }

  if (bookId) {
    url.searchParams.set('bookId', bookId);
  }

  return url.toString();
}

function getKnownBookId(version: BibleVersion, bookName: string): string | undefined {
  const normalizedBookName = bookName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  return getVersionMetadata(version).books.find((book) => {
    const normalizedCandidate = book.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
    return normalizedCandidate === normalizedBookName;
  })?.id;
}

function normalizeLocalVerses(chapterData: unknown): BibleVerse[] {
  if (Array.isArray(chapterData)) {
    return chapterData
      .map((entry, index) => {
        if (typeof entry === 'string') {
          const text = entry.trim();
          return text ? { number: index + 1, text } : null;
        }

        if (typeof entry === 'object' && entry !== null) {
          const verse = entry as Record<string, unknown>;
          const number = parseNumeric(verse.number, index + 1);
          const text = typeof verse.text === 'string' ? verse.text.trim() : '';
          return text ? { number, text } : null;
        }

        return null;
      })
      .filter((verse): verse is BibleVerse => verse !== null);
  }

  if (typeof chapterData === 'object' && chapterData !== null) {
    return Object.entries(chapterData as Record<string, unknown>)
      .map(([verseNumber, verseText]) => {
        const number = parseNumeric(verseNumber, 0);
        const text = typeof verseText === 'string' ? verseText.trim() : '';
        return number > 0 && text ? { number, text } : null;
      })
      .filter((verse): verse is BibleVerse => verse !== null)
      .sort((a, b) => a.number - b.number);
  }

  return [];
}

function getLocalFallbackBooks(version: BibleVersion): LocalFallbackBooksMap | null {
  if (version === 'catholic') {
    return localCatholicFallbackBooks;
  }
  if (version === 'ethiopian') {
    return localEthiopianFallbackBooks;
  }
  return null;
}

function getLocalChapterFallback(
  version: BibleVersion,
  bookId: string,
  chapter: number,
): { bookName: string; verses: BibleVerse[] } | null {
  const localBooks = getLocalFallbackBooks(version);
  if (!localBooks) {
    return null;
  }

  const localBook = localBooks[bookId];
  if (!localBook) {
    return null;
  }

  const boundedChapter = Math.min(Math.max(chapter, 1), localBook.chapterCount);
  const chapterData = localBook.chapters[String(boundedChapter)];
  const verses = normalizeLocalVerses(chapterData);

  return { bookName: localBook.name, verses };
}

async function fetchFromProvider({
  baseUrl,
  translation,
  version,
  bookName,
  chapter,
  bookId,
  signal,
}: {
  baseUrl: string;
  translation?: string;
  version: BibleVersion;
  bookName: string;
  chapter: number;
  bookId?: string;
  signal?: AbortSignal;
}): Promise<BibleChapterPayload> {
  const reference = buildReference(bookName, chapter);
  const url = buildChapterUrl({ baseUrl, reference, translation, bookId });
  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`Falha ao buscar capítulo bíblico (${response.status}).`);
  }

  const data = (await response.json()) as unknown;
  return normalizeChapterResponse(data, version, bookName, chapter);
}

export function getBibleMetadata(): BibleMetadataMap {
  return metadata;
}

export function getVersionMetadata(version: BibleVersion): BibleVersionMetadata {
  return metadata.versions[version];
}

export function getBooksByTestament(
  version: BibleVersion,
  testament: BibleTestament,
): BibleBookMetadata[] {
  return getVersionMetadata(version).books.filter((book) => book.testament === testament);
}

export function getCuratedWritingsBooks(): BibleBookMetadata[] {
  return curatedWritingsBooksMetadata;
}

export function getBookById(version: BibleVersion, bookId: string): BibleBookMetadata | undefined {
  return getVersionMetadata(version).books.find((book) => book.id === bookId);
}

export function getAdjacentChapter(
  version: BibleVersion,
  currentBookId: string,
  currentChapter: number,
  direction: 'previous' | 'next',
): { bookId: string; chapter: number } | null {
  const books = getVersionMetadata(version).books;
  const currentIndex = books.findIndex((book) => book.id === currentBookId);
  if (currentIndex < 0) {
    return null;
  }

  const currentBook = books[currentIndex];
  if (direction === 'previous') {
    if (currentChapter > 1) {
      return { bookId: currentBook.id, chapter: currentChapter - 1 };
    }
    const previousBook = books[currentIndex - 1];
    if (!previousBook) {
      return null;
    }
    return { bookId: previousBook.id, chapter: previousBook.chapters };
  }

  if (currentChapter < currentBook.chapters) {
    return { bookId: currentBook.id, chapter: currentChapter + 1 };
  }

  const nextBook = books[currentIndex + 1];
  if (!nextBook) {
    return null;
  }
  return { bookId: nextBook.id, chapter: 1 };
}

export async function fetchBibleChapter({
  version,
  bookName,
  chapter,
  bookId,
  signal,
}: FetchBibleChapterParams): Promise<BibleChapterPayload> {
  const config = providerConfig[version];
  const resolvedBookId = bookId ?? getKnownBookId(version, bookName);

  if (resolvedBookId && CURATED_WRITINGS_BOOK_IDS.has(resolvedBookId)) {
    const curatedBook = curatedWritingsMap[resolvedBookId];
    const boundedChapter = curatedBook
      ? Math.min(Math.max(chapter, 1), curatedBook.chapterCount)
      : chapter;

    const chapterData = curatedBook?.chapters[String(boundedChapter)];
    const verses = normalizeLocalVerses(chapterData);
    return {
      version,
      reference: `${curatedBook?.name ?? bookName} ${boundedChapter}`,
      bookName: curatedBook?.name ?? bookName,
      chapter: boundedChapter,
      verses,
    };
  }

  if (
    resolvedBookId &&
    ((version === 'catholic' && CATHOLIC_LOCAL_BOOK_IDS.has(resolvedBookId)) ||
      (version === 'ethiopian' && ETHIOPIAN_LOCAL_BOOK_IDS.has(resolvedBookId)))
  ) {
    const localFallback = getLocalChapterFallback(version, resolvedBookId, chapter);
    if (localFallback) {
      return {
        version,
        reference: `${localFallback.bookName} ${chapter}`,
        bookName: localFallback.bookName,
        chapter,
        verses: localFallback.verses,
      };
    }

    throw new Error(
      `Livro "${bookName}" está configurado para fallback local, mas o JSON ainda não possui a estrutura esperada.`,
    );
  }

  return fetchFromProvider({
    baseUrl: config.baseUrl,
    translation: config.translation,
    version,
    bookName,
    chapter,
    bookId: resolvedBookId,
    signal,
  });
}
