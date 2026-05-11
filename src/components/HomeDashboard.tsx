import { BookMarked, BookOpen, CheckCircle2, Flag, Highlighter, Library, NotebookPen, Search, TrendingUp, UserRound, Wheat } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Screen } from '../types';
import { useProfile } from '../state/ProfileContext';
import { AppImage } from './AppImage';
import { useUserProgress } from '../hooks/useUserProgress';

interface HomeDashboardProps {
  onNavigate: (
    screen: Screen,
    transition?: 'push' | 'none',
    options?: { openSlug?: string }
  ) => void;
}

const SECTION_NAVIGATION = {
  MANÁ: Screen.MANA,
  'DISCÍPULOS': Screen.DISCIPULOS,
  ENSINOS: Screen.ENSINOS,
  SELAH: Screen.BOOKSTORE,
  BABEL: Screen.REFUTACAO,
};

const SECTION_ICON = {
  MANÁ: Wheat,
  'DISCÍPULOS': UserRound,
  ENSINOS: BookOpen,
  SELAH: Library,
  BABEL: BookMarked,
};

const STATUS_CLASS = {
  'Em andamento': 'text-primary bg-primary/10 border-primary/35',
  Concluído: 'text-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/35',
  Aguardando: 'text-on-surface-variant/70 bg-surface-container-high border-outline-variant/25',
};

type ReaderNoteEntry = {
  id: string;
  text: string;
  note: string;
  updatedAt: number;
  slug: string;
};

type ReaderHighlightEntry = {
  slug: string;
  text: string;
  updatedAt: number;
};

const CATEGORY_TO_SCREEN: Record<string, Screen> = {
  mana: Screen.MANA,
  discipulos: Screen.DISCIPULOS,
  livraria: Screen.BOOKSTORE,
  refutacao: Screen.REFUTACAO,
  ensinos: Screen.ENSINOS,
  biblica: Screen.BIBLE,
  apocrifos: Screen.APOCRYPHA,
  ebd: Screen.EBD,
};

function inferScreenBySlug(slug: string): Screen {
  const lower = slug.toLowerCase();
  if (lower.includes('discipulos/')) return Screen.DISCIPULOS;
  if (lower.includes('vida-espiritual') || lower.includes('vida-interior') || lower.includes('vida-exterior')) return Screen.MANA;
  if (lower.includes('eixo-')) return Screen.BIBLE;
  if (lower.includes('matrix') || lower.includes('quem-controla')) return Screen.REFUTACAO;
  return Screen.BOOKSTORE;
}

function mapSlugToCategoryScreen(): Map<string, Screen> {
  const map = new Map<string, Screen>();
  try {
    const raw = localStorage.getItem('exodo_user_progress');
    if (!raw) return map;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    for (const [category, value] of Object.entries(parsed)) {
      const targetScreen = CATEGORY_TO_SCREEN[category];
      if (!targetScreen || !value || typeof value !== 'object') continue;
      for (const slug of Object.keys(value as Record<string, unknown>)) {
        map.set(slug, targetScreen);
      }
    }
  } catch {
    // noop
  }
  return map;
}

function mapSlugToLastActivityMs(): Map<string, number> {
  const map = new Map<string, number>();
  try {
    const raw = localStorage.getItem('exodo_user_progress');
    if (!raw) return map;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    for (const value of Object.values(parsed)) {
      if (!value || typeof value !== 'object') continue;
      for (const [slug, entry] of Object.entries(value as Record<string, unknown>)) {
        if (!entry || typeof entry !== 'object') continue;
        const activityRaw = (entry as Record<string, unknown>).updatedAt || (entry as Record<string, unknown>).lastRead;
        if (typeof activityRaw !== 'string') continue;
        const ms = new Date(activityRaw).getTime();
        if (!Number.isFinite(ms)) continue;
        const current = map.get(slug) ?? 0;
        if (ms > current) map.set(slug, ms);
      }
    }
  } catch {
    // noop
  }
  return map;
}

function normalizeLookupText(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function loadReaderNotes(): ReaderNoteEntry[] {
  const entries: ReaderNoteEntry[] = [];
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith('exodo_notes_')) continue;
      const slug = key.slice('exodo_notes_'.length);
      if (!slug) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) continue;
      for (const item of parsed) {
        if (!item || typeof item !== 'object') continue;
        if (typeof item.id !== 'string' || typeof item.text !== 'string' || typeof item.note !== 'string') continue;
        entries.push({
          id: item.id,
          text: item.text,
          note: item.note,
          updatedAt: Number.isFinite(item.updatedAt) ? item.updatedAt : Date.now(),
          slug,
        });
      }
    }
  } catch {
    return [];
  }
  return entries.sort((a, b) => b.updatedAt - a.updatedAt);
}

function loadReaderHighlights(slugActivityMap: Map<string, number>): ReaderHighlightEntry[] {
  const entries: ReaderHighlightEntry[] = [];
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith('exodo_hl_')) continue;
      const slug = key.slice('exodo_hl_'.length);
      if (!slug) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) continue;
      for (const text of parsed) {
        if (typeof text !== 'string' || !text.trim()) continue;
        entries.push({
          slug,
          text: text.trim(),
          updatedAt: slugActivityMap.get(slug) ?? 0,
        });
      }
    }
  } catch {
    return [];
  }
  const deduped = new Map<string, ReaderHighlightEntry>();
  for (const entry of entries) {
    const key = `${entry.slug}::${entry.text}`;
    const existing = deduped.get(key);
    if (!existing || entry.updatedAt > existing.updatedAt) {
      deduped.set(key, entry);
    }
  }
  return Array.from(deduped.values()).sort((a, b) => b.updatedAt - a.updatedAt);
}

export default function HomeDashboard({ onNavigate }: HomeDashboardProps) {
  const [myStudiesQuery, setMyStudiesQuery] = useState('');
  const [showAllNotes, setShowAllNotes] = useState(false);
  const [showAllHighlights, setShowAllHighlights] = useState(false);
  const { name } = useProfile();
  const {
    lastReadings,
    totals,
    overallPct,
    goals,
    weeklyGoal,
    hasAnyReadingStarted,
  } = useUserProgress();

  const continueCards = [
    lastReadings.mana,
    lastReadings.discipulos,
    lastReadings.ensinos,
    lastReadings.selah,
    lastReadings.babel,
  ];

  const totalTrackedReadings = totals.completed + totals.inProgress;
  const showViewAllProgress = totalTrackedReadings > 4;
  const slugScreenMap = useMemo(() => mapSlugToCategoryScreen(), []);
  const slugActivityMap = useMemo(() => mapSlugToLastActivityMs(), []);
  const allNotes = useMemo(() => loadReaderNotes(), []);
  const allHighlights = useMemo(() => loadReaderHighlights(slugActivityMap), [slugActivityMap]);
  const normalizedMyStudiesQuery = normalizeLookupText(myStudiesQuery);
  const filteredNotes = useMemo(() => {
    if (!normalizedMyStudiesQuery) return allNotes;
    return allNotes.filter((item) => normalizeLookupText(`${item.slug} ${item.text} ${item.note}`).includes(normalizedMyStudiesQuery));
  }, [allNotes, normalizedMyStudiesQuery]);
  const filteredHighlights = useMemo(() => {
    if (!normalizedMyStudiesQuery) return allHighlights;
    return allHighlights.filter((item) => normalizeLookupText(`${item.slug} ${item.text}`).includes(normalizedMyStudiesQuery));
  }, [allHighlights, normalizedMyStudiesQuery]);
  const visibleNotes = useMemo(() => {
    if (normalizedMyStudiesQuery) return filteredNotes;
    return showAllNotes ? filteredNotes : filteredNotes.slice(0, 4);
  }, [filteredNotes, normalizedMyStudiesQuery, showAllNotes]);
  const visibleHighlights = useMemo(() => {
    if (normalizedMyStudiesQuery) return filteredHighlights;
    return showAllHighlights ? filteredHighlights : filteredHighlights.slice(0, 4);
  }, [filteredHighlights, normalizedMyStudiesQuery, showAllHighlights]);

  return (
    <div className="pb-24 sm:pb-28 min-h-[calc(100vh-3.5rem)] bg-surface-container-lowest">
      <section className="relative px-4 sm:px-6 pt-4 sm:pt-5 pb-2.5 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.12),transparent_58%),radial-gradient(ellipse_at_bottom,rgba(212,175,55,0.05),transparent_62%)]" />
        <div className="relative z-10">
          <p className="text-[10px] font-black tracking-[0.2em] uppercase text-primary">Início</p>
          <h2 className="mt-1 font-headline text-xl sm:text-2xl font-black tracking-tight text-on-surface leading-none">
            Continue sua travessia{name ? `, ${name}` : ''}.
          </h2>
        </div>
      </section>

      {!hasAnyReadingStarted ? (
        <section className="px-4 sm:px-6 pb-4">
          <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
            <h3 className="font-headline text-base font-black tracking-tight text-on-surface">
              Sua jornada ainda não começou
            </h3>
            <p className="mt-1.5 text-xs text-on-surface-variant leading-relaxed">
              Abra uma seção, inicie uma leitura e ela aparecerá aqui para você continuar depois.
            </p>
          </div>
        </section>
      ) : (
        <section className="px-4 sm:px-6 pb-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="font-headline text-[13px] sm:text-sm font-black uppercase tracking-[0.08em] text-on-surface">
              Continue de onde parou
            </h3>
            {showViewAllProgress && (
              <button
                onClick={() => onNavigate(Screen.SETTINGS, 'push')}
                className="text-[10px] font-black uppercase tracking-[0.08em] text-primary hover:text-primary/80"
              >
                Ver todo o progresso
              </button>
            )}
          </div>

          <div className="space-y-2">
            {continueCards.map((card) => {
              const Icon = SECTION_ICON[card.label];
              const target = SECTION_NAVIGATION[card.label];
              return (
                <article
                  key={card.section}
                  className="rounded-xl border border-outline-variant/18 bg-surface-container-low/95 p-2.5"
                >
                  <div className="flex gap-2.5">
                    <div className="w-12 h-16 rounded-lg overflow-hidden border border-outline-variant/20 bg-surface-container-high shrink-0">
                      {card.image ? (
                        <AppImage
                          src={card.image}
                          alt={card.title}
                          className="w-full h-full object-cover"
                          fallbackClassName="opacity-70"
                        />
                      ) : (
                        <div className="w-full h-full grid place-items-center text-on-surface-variant/60">
                          <BookOpen size={14} />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[8px] font-black uppercase tracking-[0.16em] text-primary/90 flex items-center gap-1">
                            <Icon size={10} />
                            {card.label}
                          </p>
                          <h4 className="text-[11px] sm:text-xs font-bold text-on-surface leading-snug line-clamp-2 mt-0.5">
                            {card.title}
                          </h4>
                        </div>
                        <span className={`shrink-0 px-1.5 py-0.5 rounded-full border text-[7px] font-black uppercase tracking-widest ${STATUS_CLASS[card.status]}`}>
                          {card.status}
                        </span>
                      </div>

                      <div className="mt-1.5 h-1.5 rounded-full bg-surface-container-high border border-outline-variant/20 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-orange-500 to-yellow-400 transition-all duration-700"
                          style={{ width: `${card.progressPct}%` }}
                        />
                      </div>

                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="text-[8px] text-on-surface-variant/75">{card.whereStopped}</span>
                        <button
                          onClick={() => (
                            card.slug
                              ? onNavigate(target, 'push', { openSlug: card.slug })
                              : onNavigate(target, 'push')
                          )}
                          className="text-[8px] font-black uppercase tracking-widest border rounded-full px-2 py-0.5 transition-colors bg-primary/15 hover:bg-primary/22 text-primary border-primary/30"
                        >
                          Continuar
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section className="px-4 sm:px-6 pb-4">
        <div className="rounded-xl border border-[#D4AF37]/24 bg-surface-container-low p-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-headline text-[13px] sm:text-sm font-black uppercase tracking-[0.08em] text-on-surface">
              Meta da semana
            </h3>
            <span className="text-sm font-black text-primary">{overallPct}%</span>
          </div>
          <p className="mt-1 text-[11px] text-on-surface-variant leading-snug">{weeklyGoal.text}</p>
          <div className="mt-3 space-y-2.5">
            {goals.map((goal) => {
              const statusLabel = goal.status === 'done' ? 'Concluído' : goal.status === 'active' ? 'Em andamento' : 'Aguardando';
              const statusClass =
                goal.status === 'done'
                  ? 'text-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/35'
                  : goal.status === 'active'
                  ? 'text-primary bg-primary/10 border-primary/35'
                  : 'text-on-surface-variant/70 bg-surface-container-high border-outline-variant/25';

              return (
                <div key={goal.key} className="rounded-lg border border-outline-variant/20 bg-surface-container-high/50 px-2.5 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.08em] text-on-surface">{goal.label}</p>
                    <span className={`shrink-0 px-1.5 py-0.5 rounded-full border text-[7px] font-black uppercase tracking-widest ${statusClass}`}>
                      {statusLabel}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[9px] text-on-surface-variant/80 leading-snug">{goal.summary}</p>
                  <div className="mt-1.5 h-1.5 rounded-full bg-surface-container overflow-hidden border border-outline-variant/20">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange-500 to-yellow-400 transition-all duration-700"
                      style={{ width: `${goal.progressPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 pb-4">
        <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-3">
          <h3 className="font-headline text-[13px] sm:text-sm font-black uppercase tracking-[0.08em] text-on-surface mb-2">
            Minha jornada
          </h3>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-outline-variant/20 bg-surface-container-high/60 p-2">
              <p className="text-[7px] uppercase tracking-[0.14em] text-on-surface-variant/70 font-black">Concluídos</p>
              <p className="text-base font-black text-[#D4AF37] mt-0.5">{totals.completed}</p>
            </div>
            <div className="rounded-lg border border-outline-variant/20 bg-surface-container-high/60 p-2">
              <p className="text-[7px] uppercase tracking-[0.14em] text-on-surface-variant/70 font-black">Andamento</p>
              <p className="text-base font-black text-primary mt-0.5">{totals.inProgress}</p>
            </div>
            <div className="rounded-lg border border-outline-variant/20 bg-surface-container-high/60 p-2">
              <p className="text-[7px] uppercase tracking-[0.14em] text-on-surface-variant/70 font-black">Séries</p>
              <p className="text-base font-black text-on-surface mt-0.5">{totals.startedSeries}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 pb-4">
        <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h3 className="font-headline text-[13px] sm:text-sm font-black uppercase tracking-[0.08em] text-on-surface">
              Meus estudos
            </h3>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-outline-variant/35 bg-surface-container-high/60 px-3">
            <Search size={14} className="text-primary/80 shrink-0" />
            <input
              value={myStudiesQuery}
              onChange={(event) => setMyStudiesQuery(event.target.value)}
              placeholder="Buscar em notas e destaques..."
              className="w-full bg-transparent py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none"
            />
            {myStudiesQuery && (
              <button
                type="button"
                onClick={() => setMyStudiesQuery('')}
                className="text-[11px] font-black uppercase tracking-wider text-on-surface-variant/70 hover:text-primary transition-colors"
              >
                Limpar
              </button>
            )}
          </div>
          <p className="mt-1 text-[10px] text-on-surface-variant/75">
            Busca local no seu histórico pessoal.
          </p>
        </div>
      </section>

      <section className="px-4 sm:px-6 pb-4">
        <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h3 className="font-headline text-[13px] sm:text-sm font-black uppercase tracking-[0.08em] text-on-surface">
              Notas recentes
            </h3>
            <span className="text-[9px] uppercase tracking-widest text-primary font-black">
              {filteredNotes.length}
            </span>
          </div>

          {visibleNotes.length === 0 ? (
            <p className="text-[10px] text-on-surface-variant/75">
              {normalizedMyStudiesQuery
                ? 'Nenhuma nota encontrada para essa busca.'
                : 'Nenhuma nota ainda. Marque um trecho e adicione observações no leitor.'}
            </p>
          ) : (
            <div className="space-y-2">
              {visibleNotes.map((item) => {
                const targetScreen = slugScreenMap.get(item.slug) ?? inferScreenBySlug(item.slug);
                return (
                  <button
                    key={`note-${item.id}`}
                    onClick={() => onNavigate(targetScreen, 'push', { openSlug: item.slug })}
                    className="w-full rounded-lg border border-outline-variant/20 bg-surface-container-high/60 px-2.5 py-2 text-left hover:border-primary/35 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.08em] text-primary inline-flex items-center gap-1">
                        <NotebookPen size={11} />
                        {item.slug}
                      </p>
                      <span className="text-[8px] text-on-surface-variant/70">
                        {new Date(item.updatedAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-on-surface-variant/85 line-clamp-2">“{item.text}”</p>
                    <p className="mt-1 text-[11px] text-on-surface line-clamp-2">{item.note}</p>
                  </button>
                );
              })}
            </div>
          )}

          {!normalizedMyStudiesQuery && filteredNotes.length > 4 && (
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAllNotes((prev) => !prev)}
                className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80"
              >
                {showAllNotes ? 'Mostrar menos' : `Ver todos (${filteredNotes.length})`}
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="px-4 sm:px-6 pb-4">
        <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h3 className="font-headline text-[13px] sm:text-sm font-black uppercase tracking-[0.08em] text-on-surface">
              Destaques recentes
            </h3>
            <span className="text-[9px] uppercase tracking-widest text-primary font-black">
              {filteredHighlights.length}
            </span>
          </div>

          {visibleHighlights.length === 0 ? (
            <p className="text-[10px] text-on-surface-variant/75">
              {normalizedMyStudiesQuery
                ? 'Nenhum destaque encontrado para essa busca.'
                : 'Nenhum destaque ainda. Use o lápis no leitor para salvar trechos importantes.'}
            </p>
          ) : (
            <div className="space-y-2">
              {visibleHighlights.map((item, idx) => {
                const targetScreen = slugScreenMap.get(item.slug) ?? inferScreenBySlug(item.slug);
                return (
                  <button
                    key={`highlight-${item.slug}-${idx}`}
                    onClick={() => onNavigate(targetScreen, 'push', { openSlug: item.slug })}
                    className="w-full rounded-lg border border-outline-variant/20 bg-surface-container-high/60 px-2.5 py-2 text-left hover:border-primary/35 transition-colors"
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.08em] text-primary inline-flex items-center gap-1">
                      <Highlighter size={11} />
                      {item.slug}
                    </p>
                    <p className="mt-1 text-[11px] text-on-surface line-clamp-3">“{item.text}”</p>
                  </button>
                );
              })}
            </div>
          )}

          {!normalizedMyStudiesQuery && filteredHighlights.length > 4 && (
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAllHighlights((prev) => !prev)}
                className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80"
              >
                {showAllHighlights ? 'Mostrar menos' : `Ver todos (${filteredHighlights.length})`}
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="px-4 sm:px-6 pt-1">
        <div className="rounded-lg border border-outline-variant/20 bg-surface-container-low px-2.5 py-2 flex items-center justify-between">
          <span className="text-[9px] text-on-surface-variant inline-flex items-center gap-1.5">
            <Flag size={11} className="text-primary" />
            Painel de continuidade
          </span>
          <span className="text-[9px] text-on-surface-variant/80 inline-flex items-center gap-2">
            <span className="inline-flex items-center gap-1"><CheckCircle2 size={10} /> {totals.completed}</span>
            <span className="inline-flex items-center gap-1"><TrendingUp size={10} /> {totals.inProgress}</span>
          </span>
        </div>
      </section>
    </div>
  );
}
