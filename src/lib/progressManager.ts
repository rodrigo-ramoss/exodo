/**
 * progressManager.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Fonte única de verdade para o progresso de leitura do usuário.
 *
 * Schema do localStorage:
 *   "exodo_user_progress" → ProgressDB (JSON)
 *
 * Retrocompatibilidade: mantém os keys antigos (`reads_*`, `progress_*`,
 * `scroll_*`) sincronizados para que componentes não refatorados ainda
 * funcionem corretamente durante a transição.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type Category = 'mana' | 'apocrifos' | 'refutacao' | 'livraria' | 'biblica' | 'ebd';

export interface ContentEntry {
  readCount: number;
  lastRead: string;   // ISO timestamp — usado pelo debounce de 1 minuto
  updatedAt: string;  // ISO timestamp da última atividade (scroll ou conclusão)
  progress: number;   // 0–100 (progresso de scroll)
  scrollPos: number;  // pixels do topo (para restaurar posição)
}

type CategoryStore = Record<string, ContentEntry>;

interface ProgressDB {
  version: number;
  mana: CategoryStore;
  apocrifos: CategoryStore;
  refutacao: CategoryStore;
  livraria: CategoryStore;
  biblica: CategoryStore;
  ebd: CategoryStore;
}

// ─── Constantes ───────────────────────────────────────────────────────────────
const STORAGE_KEY = 'exodo_user_progress';
const DB_VERSION = 2;
const MIN_REREAD_MS = 60_000; // 1 minuto — trava contra dupla contagem por reload

// ─── Helpers internos ─────────────────────────────────────────────────────────
function emptyDB(): ProgressDB {
  return {
    version: DB_VERSION,
    mana: {},
    apocrifos: {},
    refutacao: {},
    livraria: {},
    biblica: {},
    ebd: {},
  };
}

function load(): ProgressDB {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyDB();
    const parsed = JSON.parse(raw) as Partial<ProgressDB>;
    // Garante que todas as categorias existam mesmo em DBs antigos
    return {
      version: DB_VERSION,
      mana: parsed.mana ?? {},
      apocrifos: parsed.apocrifos ?? {},
      refutacao: parsed.refutacao ?? {},
      livraria: parsed.livraria ?? {},
      biblica: parsed.biblica ?? {},
      ebd: parsed.ebd ?? {},
    };
  } catch {
    return emptyDB();
  }
}

function save(db: ProgressDB): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // Storage cheio ou indisponível — falha silenciosamente
  }
}

function defaultEntry(): ContentEntry {
  return { readCount: 0, lastRead: '', updatedAt: '', progress: 0, scrollPos: 0 };
}

// ─── API pública (pm) ─────────────────────────────────────────────────────────
export const pm = {

  /**
   * Retorna o progresso de scroll (0–100) de um conteúdo.
   * Faz fallback para o key antigo `progress_${slug}` se necessário.
   */
  getProgress(category: Category, slug: string): number {
    const db = load();
    const entry = db[category][slug];
    if (entry !== undefined) return entry.progress;
    // Fallback: key antigo
    const old = parseInt(localStorage.getItem(`progress_${slug}`) ?? '0', 10);
    return isNaN(old) ? 0 : Math.min(100, old);
  },

  /**
   * Retorna a posição de scroll em pixels salva.
   * Faz fallback para o key antigo `scroll_${slug}`.
   */
  getScrollPos(category: Category, slug: string): number {
    const db = load();
    const entry = db[category][slug];
    if (entry !== undefined) return entry.scrollPos;
    const old = parseInt(localStorage.getItem(`scroll_${slug}`) ?? '0', 10);
    return isNaN(old) ? 0 : old;
  },

  /**
   * Salva o progresso de scroll e a posição em pixels.
   * Escreve também nos keys antigos para retrocompatibilidade.
   */
  setProgress(category: Category, slug: string, pct: number, scrollPos?: number): void {
    const db = load();
    const entry = db[category][slug] ?? defaultEntry();
    entry.progress = Math.min(100, Math.max(0, Math.round(pct)));
    entry.updatedAt = new Date().toISOString();
    if (scrollPos !== undefined) entry.scrollPos = scrollPos;
    db[category][slug] = entry;
    save(db);
    // Mantém keys antigos sincronizados
    localStorage.setItem(`progress_${slug}`, String(entry.progress));
    if (scrollPos !== undefined && scrollPos > 0) {
      localStorage.setItem(`scroll_${slug}`, String(scrollPos));
    }
  },

  /**
   * Marca um conteúdo como lido (+1 ao readCount).
   *
   * PROTEÇÃO ANTI-DUPLA-CONTAGEM:
   * Se o mesmo slug foi marcado como lido nos últimos MIN_REREAD_MS (1 min),
   * a chamada é ignorada. Isso evita que um reload da página conte duas vezes.
   *
   * @returns true se a leitura foi contabilizada, false se foi bloqueada pelo debounce.
   */
  markAsRead(category: Category, slug: string): boolean {
    const db = load();
    const entry = db[category][slug] ?? defaultEntry();

    // Debounce: verifica se foi lido nos últimos 60 segundos
    if (entry.lastRead) {
      const lastMs = new Date(entry.lastRead).getTime();
      if (!isNaN(lastMs) && Date.now() - lastMs < MIN_REREAD_MS) {
        return false; // Bloqueado — muito cedo para contar de novo
      }
    }

    entry.readCount += 1;
    entry.lastRead = new Date().toISOString();
    entry.updatedAt = entry.lastRead;
    entry.progress = 0;   // Zera o progresso para próxima leitura
    entry.scrollPos = 0;
    db[category][slug] = entry;
    save(db);

    // Mantém keys antigos sincronizados
    localStorage.setItem(`reads_${slug}`, String(entry.readCount));
    localStorage.setItem(`progress_${slug}`, '0');
    localStorage.removeItem(`scroll_${slug}`);

    return true;
  },

  /**
   * Verifica se um conteúdo já foi lido ao menos uma vez.
   * Faz fallback para os keys antigos.
   */
  isRead(category: Category, slug: string): boolean {
    const db = load();
    const entry = db[category][slug];
    if (entry && entry.readCount > 0) return true;
    // Fallback: keys antigos
    const oldReads = parseInt(localStorage.getItem(`reads_${slug}`) ?? '0', 10);
    const oldProgress = parseInt(localStorage.getItem(`progress_${slug}`) ?? '0', 10);
    return oldReads > 0 || oldProgress >= 100;
  },

  /**
   * Retorna o número de vezes que o conteúdo foi lido.
   * Faz fallback para o key antigo `reads_${slug}`.
   */
  getReadCount(category: Category, slug: string): number {
    const db = load();
    const entry = db[category][slug];
    if (entry && entry.readCount > 0) return entry.readCount;
    const old = parseInt(localStorage.getItem(`reads_${slug}`) ?? '0', 10);
    return isNaN(old) ? 0 : old;
  },

  /**
   * Retorna o timestamp ISO da última conclusão (markAsRead).
   */
  getLastReadAt(category: Category, slug: string): string {
    const db = load();
    const entry = db[category][slug];
    return entry?.lastRead ?? '';
  },

  /**
   * Retorna o timestamp ISO da última atividade (scroll ou conclusão).
   */
  getLastActivity(category: Category, slug: string): string {
    const db = load();
    const entry = db[category][slug];
    return entry?.updatedAt || entry?.lastRead || '';
  },

  /**
   * Conta quantos slugs de uma categoria foram lidos.
   * Usado pelo ProgressSection para exibir estatísticas.
   * Considera tanto o novo schema quanto os keys antigos.
   */
  countRead(category: Category, slugs: string[]): number {
    return slugs.filter((slug) => pm.isRead(category, slug)).length;
  },
};
