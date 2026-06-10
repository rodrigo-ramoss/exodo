type LocalProgressEntry = {
  readCount: number;
  lastRead: string;
  updatedAt: string;
  progress: number;
  scrollPos: number;
};

type RemoteProgressRow = {
  category: string;
  slug: string;
  entry: LocalProgressEntry;
};

type ReaderHighlightLike = {
  id: string;
  text: string;
  start: number;
  end: number;
  createdAt: number;
  updatedAt: number;
};

type ReaderNoteLike = {
  id: string;
  text: string;
  note: string;
  highlightId?: string;
  createdAt: number;
  updatedAt: number;
};

type RemoteReaderState = {
  highlights: ReaderHighlightLike[];
  notes: ReaderNoteLike[];
};

type RemoteSyncState = {
  progress?: RemoteProgressRow[];
  highlights?: Array<{ slug: string; item: ReaderHighlightLike }>;
  notes?: Array<{ slug: string; item: ReaderNoteLike }>;
  settings?: {
    fontSize?: number | null;
    theme?: string | null;
  };
  profile?: {
    name?: string;
    photo?: string | null;
    notifications?: boolean;
  };
};

const PROGRESS_KEY = 'exodo_user_progress';
const PROFILE_NAME_KEY = 'exodo:profile-name';
const PROFILE_PHOTO_KEY = 'exodo:profile-photo';
const PROFILE_NOTIFICATIONS_KEY = 'exodo:notifications-enabled';

let syncInFlight: Promise<void> | null = null;

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

async function postJson(url: string, body: unknown, method = 'POST'): Promise<Response> {
  return fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function parseJsonArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
}

function collectProgress(): RemoteProgressRow[] {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Record<string, Record<string, LocalProgressEntry> | number>;
    const rows: RemoteProgressRow[] = [];
    for (const [category, value] of Object.entries(parsed)) {
      if (category === 'version' || !value || typeof value !== 'object') continue;
      for (const [slug, entry] of Object.entries(value as Record<string, LocalProgressEntry>)) {
        if (!slug || !entry || typeof entry !== 'object') continue;
        rows.push({ category, slug, entry });
      }
    }
    return rows;
  } catch {
    return [];
  }
}

function collectReaderRows() {
  const highlights: Array<{ slug: string; item: ReaderHighlightLike }> = [];
  const notes: Array<{ slug: string; item: ReaderNoteLike }> = [];

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (key.startsWith('exodo_hl_')) {
      const slug = key.slice('exodo_hl_'.length);
      for (const item of parseJsonArray<ReaderHighlightLike>(key)) {
        if (item?.id && item.text) highlights.push({ slug, item });
      }
    }
    if (key.startsWith('exodo_notes_')) {
      const slug = key.slice('exodo_notes_'.length);
      for (const item of parseJsonArray<ReaderNoteLike>(key)) {
        if (item?.id && item.text) notes.push({ slug, item });
      }
    }
  }

  return { highlights, notes };
}

function mergeProgress(remoteRows: RemoteProgressRow[]): void {
  if (!remoteRows.length) return;
  const current = (() => {
    try {
      return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}') as Record<string, Record<string, LocalProgressEntry> | number>;
    } catch {
      return {};
    }
  })();

  if (typeof current.version !== 'number') current.version = 2;

  for (const row of remoteRows) {
    if (!row.category || !row.slug || !row.entry) continue;
    const categoryStore = (current[row.category] && typeof current[row.category] === 'object')
      ? current[row.category] as Record<string, LocalProgressEntry>
      : {};
    const existing = categoryStore[row.slug];
    const existingMs = existing?.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
    const remoteMs = row.entry.updatedAt ? new Date(row.entry.updatedAt).getTime() : 0;
    if (!existing || remoteMs >= existingMs) {
      categoryStore[row.slug] = row.entry;
    } else if (row.entry.readCount > existing.readCount) {
      categoryStore[row.slug] = { ...existing, readCount: row.entry.readCount, lastRead: row.entry.lastRead || existing.lastRead };
    }
    current[row.category] = categoryStore;
  }

  localStorage.setItem(PROGRESS_KEY, JSON.stringify(current));
}

function mergeReaderList<T extends { id: string; updatedAt: number }>(key: string, incoming: T[]): void {
  if (!incoming.length) return;
  const current = parseJsonArray<T>(key);
  const map = new Map<string, T>();
  for (const item of current) {
    if (item?.id) map.set(item.id, item);
  }
  for (const item of incoming) {
    const existing = map.get(item.id);
    if (!existing || item.updatedAt >= existing.updatedAt) {
      map.set(item.id, item);
    }
  }
  localStorage.setItem(key, JSON.stringify(Array.from(map.values())));
}

function applyRemoteState(state: RemoteSyncState): void {
  if (state.progress) mergeProgress(state.progress);

  const highlightsBySlug = new Map<string, ReaderHighlightLike[]>();
  for (const row of state.highlights || []) {
    if (!row.slug || !row.item?.id) continue;
    highlightsBySlug.set(row.slug, [...(highlightsBySlug.get(row.slug) || []), row.item]);
  }
  for (const [slug, items] of highlightsBySlug.entries()) {
    mergeReaderList(`exodo_hl_${slug}`, items);
  }

  const notesBySlug = new Map<string, ReaderNoteLike[]>();
  for (const row of state.notes || []) {
    if (!row.slug || !row.item?.id) continue;
    notesBySlug.set(row.slug, [...(notesBySlug.get(row.slug) || []), row.item]);
  }
  for (const [slug, items] of notesBySlug.entries()) {
    mergeReaderList(`exodo_notes_${slug}`, items);
  }

  if (state.settings?.fontSize) {
    localStorage.setItem('reader_font_size', String(state.settings.fontSize));
  }
  if (state.settings?.theme) {
    localStorage.setItem('reader_theme', state.settings.theme);
  }

  if (state.profile?.name) localStorage.setItem(PROFILE_NAME_KEY, state.profile.name);
  if (state.profile?.photo) localStorage.setItem(PROFILE_PHOTO_KEY, state.profile.photo);
  if (typeof state.profile?.notifications === 'boolean') {
    localStorage.setItem(PROFILE_NOTIFICATIONS_KEY, String(state.profile.notifications));
  }

  window.dispatchEvent(new CustomEvent('exodo:sync-complete'));
}

export function syncLocalStateWithServer(): Promise<void> {
  if (!isBrowser()) return Promise.resolve();
  if (syncInFlight) return syncInFlight;

  syncInFlight = (async () => {
    const readerRows = collectReaderRows();
    const payload = {
      profile: {
        name: localStorage.getItem(PROFILE_NAME_KEY) || '',
        photo: localStorage.getItem(PROFILE_PHOTO_KEY) || null,
        notifications: localStorage.getItem(PROFILE_NOTIFICATIONS_KEY) === 'true',
      },
      settings: {
        fontSize: Number(localStorage.getItem('reader_font_size')) || null,
        theme: localStorage.getItem('reader_theme') || null,
      },
      progress: collectProgress(),
      highlights: readerRows.highlights,
      notes: readerRows.notes,
    };

    const response = await postJson('/api/sync', payload);
    if (response.status === 401) return;
    if (!response.ok) throw new Error(`Sync failed: HTTP ${response.status}`);
    const remote = await response.json() as RemoteSyncState;
    applyRemoteState(remote);
  })()
    .catch((error) => {
      console.warn('[sync] falha ao sincronizar:', error);
    })
    .finally(() => {
      syncInFlight = null;
    });

  return syncInFlight;
}

export function remoteSaveProgress(category: string, slug: string, entry: LocalProgressEntry): void {
  if (!isBrowser()) return;
  void postJson('/api/progress', { category, slug, entry }, 'PATCH').catch(() => {});
}

export async function loadRemoteReaderState(slug: string): Promise<RemoteReaderState | null> {
  if (!isBrowser()) return null;
  try {
    const response = await fetch(`/api/reader-state?slug=${encodeURIComponent(slug)}`, { cache: 'no-store' });
    if (response.status === 401 || response.status === 404) return null;
    if (!response.ok) throw new Error(`Reader state failed: HTTP ${response.status}`);
    return await response.json() as RemoteReaderState;
  } catch (error) {
    console.warn('[sync] falha ao carregar notas/destaques:', error);
    return null;
  }
}

export function remoteSaveReaderState(
  slug: string,
  highlights: ReaderHighlightLike[],
  notes: ReaderNoteLike[],
): void {
  if (!isBrowser()) return;
  void postJson('/api/reader-state', { slug, highlights, notes }, 'PUT').catch(() => {});
}
