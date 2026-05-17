import { BookMarked, BookOpen, CheckCircle2, ChevronLeft, ChevronRight, Flag, Highlighter, Library, NotebookPen, Search, TrendingUp, UserRound, Wheat } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { Screen } from '../types';
import { useProfile } from '../state/ProfileContext';
import { AppImage } from './AppImage';
import { useUserProgress } from '../hooks/useUserProgress';
import { useFetch } from '../hooks/useFetch';

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
  ROLOS: Screen.BOOKSTORE,
  BABEL: Screen.REFUTACAO,
};

const SECTION_ICON = {
  MANÁ: Wheat,
  'DISCÍPULOS': UserRound,
  ROLOS: Library,
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

type UpdatesSectionId = 'mana' | 'discipulos' | 'selah' | 'babel';

type ContentIndexItem = {
  title?: string;
  slug?: string;
  date?: string;
  category?: string;
  image?: string;
};

type SeriesUpdateItem = {
  key: string;
  label: string;
  updatedAt: number;
  updatedLabel: string;
  slug?: string;
  image?: string;
  isPlaceholder?: boolean;
};

type SectionUpdatesCard = {
  id: UpdatesSectionId;
  label: 'MANÁ' | 'DISCÍPULOS' | 'ROLOS' | 'BABEL';
  subtitle: string;
  target: Screen;
  items: SeriesUpdateItem[];
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

const HOME_UPDATES_SECTIONS_META: Array<Omit<SectionUpdatesCard, 'items'>> = [
  { id: 'mana', label: 'MANÁ', subtitle: 'Vida devocional e prática diária', target: Screen.MANA },
  { id: 'discipulos', label: 'DISCÍPULOS', subtitle: 'Jornadas de formação', target: Screen.DISCIPULOS },
  { id: 'selah', label: 'ROLOS', subtitle: 'Biblioteca de séries e trilogias', target: Screen.BOOKSTORE },
  { id: 'babel', label: 'BABEL', subtitle: 'Discernimento da matrix', target: Screen.REFUTACAO },
];

const homeDiscipulosModules = {
  ...import.meta.glob('/public/content/discipulos/**/*.md', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/discipulos/**/*.mdx', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/discipulos/**/*.yaml', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/discipulos/**/*.yml', { eager: true, query: '?raw', import: 'default' }),
} as Record<string, string>;

const homeBabelModules = {
  ...import.meta.glob('/public/content/babel/**/*.md', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/babel/**/*.mdx', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/babel/**/*.yaml', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/babel/**/*.yml', { eager: true, query: '?raw', import: 'default' }),
} as Record<string, string>;

const homeSelahModules = {
  ...import.meta.glob('/public/content/selah/**/*.md', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/selah/**/*.mdx', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/selah/**/*.yaml', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/selah/**/*.yml', { eager: true, query: '?raw', import: 'default' }),
} as Record<string, string>;

const homeManaModules = {
  ...import.meta.glob('/public/content/mana/**/*.md', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/mana/**/*.mdx', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/mana/**/*.yaml', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/mana/**/*.yml', { eager: true, query: '?raw', import: 'default' }),
} as Record<string, string>;

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

function parseFrontmatter(markdown: string): Record<string, string> {
  const normalized = markdown.replace(/^\uFEFF/, '').trimStart();
  const match = normalized.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---/);
  if (!match) return {};

  const result: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const entry = line.match(/^\s*([A-Za-z_][\w-]*)\s*:\s*(.*?)\s*$/);
    if (!entry) continue;
    result[entry[1].toLowerCase()] = entry[2].replace(/^["']|["']$/g, '');
  }
  return result;
}

function humanizeToken(raw: string): string {
  return raw
    .replace(/^serie\s*-\s*/i, '')
    .replace(/^trilogia\s*-\s*/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function parseDateMs(raw?: string): number {
  if (!raw) return 0;
  const ms = new Date(raw).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function parseDateMsOrToday(raw?: string): number {
  const parsed = parseDateMs(raw);
  if (parsed > 0) return parsed;
  return Date.now();
}

function formatUpdateDate(ms: number): string {
  if (!ms) return 'Sem data';
  return new Date(ms).toLocaleDateString('pt-BR');
}

function extractSeriesLine(content: string): string | null {
  const line = content.match(/^\s*\*?\s*S[ée]rie:\s*([^\n*]+)\*?\s*$/im);
  if (!line?.[1]) return null;
  return line[1]
    .replace(/\s+[—-]\s+(Livro|Volume|Passo).*/i, '')
    .replace(/,\s*Passo\s*\d+.*/i, '')
    .trim();
}

function deriveSeriesLabelFromMarkdown(
  section: UpdatesSectionId,
  relativePath: string,
  frontmatter: Record<string, string>,
  content: string,
): string {
  const normalizedPath = relativePath.replace(/\\/g, '/');
  const parts = normalizedPath.split('/').filter(Boolean);
  const fromSeriesLine = extractSeriesLine(content);
  if (fromSeriesLine) return fromSeriesLine;

  if (section === 'discipulos') {
    const tema = (frontmatter.tema || '').trim();
    if (tema) return humanizeToken(tema);
    const jornada = parts.find((part) => /^jornada\s+\d+/i.test(part));
    if (jornada) return humanizeToken(jornada);
    return 'Trilhas do Deserto';
  }

  if (section === 'mana') {
    const category = (frontmatter.category || '').trim();
    if (category) return humanizeToken(category);
    const parentFolder = parts.length > 1 ? parts[parts.length - 2] : '';
    if (parentFolder) return humanizeToken(parentFolder);
    return 'Coleção Maná';
  }

  if (section === 'selah') {
    const category = (frontmatter.category || '').trim();
    const normalizedCategory = normalizeLookupText(category);
    const genericSelahCategories = new Set([
      'selah',
      'livraria',
      'mundo espiritual',
      'satanas e demonios',
      'jesus cristo',
      'deus pai',
      'espirito santo',
      'antropologia do reino',
      'cosmologia biblica',
      'apocrifos',
      'batalha espiritual',
      'ia e apocalipse',
      'historia da igreja',
      'antissistema',
      'reino de deus',
      'fim dos tempos',
      'tipologia biblica',
    ]);
    const seriesFolder = [...parts].reverse().find((part) => /^(serie|trilogia)\s*-/i.test(part));
    if (seriesFolder) return humanizeToken(seriesFolder);
    if (category && !genericSelahCategories.has(normalizedCategory)) return humanizeToken(category);
    const parentFolder = parts.length > 1 ? parts[parts.length - 2] : '';
    if (parentFolder) return humanizeToken(parentFolder);
    return 'Coleção Rolos';
  }

  if (section === 'babel') {
    const parentFolder = parts.length > 1 ? parts[parts.length - 2] : '';
    if (parentFolder) return humanizeToken(parentFolder);
    const category = (frontmatter.category || '').split(',')[0]?.trim();
    if (category) return humanizeToken(category);
    return 'Discernimento da Matrix';
  }

  return 'Série';
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
  const updatesCarouselRef = useRef<HTMLDivElement | null>(null);
  const { name } = useProfile();
  const { data: manaIndexData } = useFetch<ContentIndexItem[]>('/content/mana/index.json');
  const { data: selahIndexData } = useFetch<ContentIndexItem[]>('/content/selah/index.json');
  const {
    lastReadings,
    totals,
    overallPct,
    goals,
    weeklyGoal,
    hasAnyReadingStarted,
  } = useUserProgress();

  const updatesCards = useMemo<SectionUpdatesCard[]>(() => {
    const fallbackCards = HOME_UPDATES_SECTIONS_META.map((meta) => ({
      ...meta,
      items: [
        { key: `${meta.id}-fallback-1`, label: 'Atualização em preparação', updatedAt: 0, updatedLabel: 'Em breve', isPlaceholder: true },
        { key: `${meta.id}-fallback-2`, label: 'Atualização em preparação', updatedAt: 0, updatedLabel: 'Em breve', isPlaceholder: true },
        { key: `${meta.id}-fallback-3`, label: 'Atualização em preparação', updatedAt: 0, updatedLabel: 'Em breve', isPlaceholder: true },
      ],
    }));

    try {
    const sectionMaps: Record<UpdatesSectionId, Map<string, SeriesUpdateItem>> = {
      mana: new Map(),
      discipulos: new Map(),
      selah: new Map(),
      babel: new Map(),
    };

    const upsertSeries = (
      section: UpdatesSectionId,
      seriesLabel: string,
      updatedAt: number,
      slug?: string,
      image?: string,
    ) => {
      const normalizedLabel = seriesLabel.trim() || 'Série';
      const key = normalizeLookupText(normalizedLabel).replace(/\s+/g, '-');
      const map = sectionMaps[section];
      const previous = map.get(key);

      if (!previous) {
        map.set(key, {
          key,
          label: normalizedLabel,
          updatedAt,
          updatedLabel: formatUpdateDate(updatedAt),
          slug,
          image,
        });
        return;
      }

      if (updatedAt > previous.updatedAt) {
        map.set(key, {
          ...previous,
          updatedAt,
          updatedLabel: formatUpdateDate(updatedAt),
          slug: slug || previous.slug,
          image: image || previous.image,
        });
      }
    };

    const manaItems = Array.isArray(manaIndexData) ? manaIndexData : [];
    const selahItems = Array.isArray(selahIndexData) ? selahIndexData : [];

    for (const item of manaItems) {
      const title = String(item?.title || '').trim();
      const prefix = title.split(' - ')[0]?.trim() || '';
      const seriesLabel = normalizeLookupText(prefix) === 'vida com deus'
        ? 'Trilogia — O Caminho do Véu Rasgado'
        : (String(item?.category || '').trim() ? `Coleção — ${String(item?.category || '').trim()}` : (prefix || 'Coleção Maná'));
      upsertSeries('mana', seriesLabel, parseDateMsOrToday(String(item?.date || '')), String(item?.slug || ''), String(item?.image || ''));
    }

    for (const item of selahItems) {
      const seriesLabel = String(item?.category || '').trim() || 'Coleção Rolos';
      upsertSeries('selah', seriesLabel, parseDateMsOrToday(String(item?.date || '')), String(item?.slug || ''), String(item?.image || ''));
    }

    const moduleSources: Array<{ section: UpdatesSectionId; modules: Record<string, string>; marker: string }> = [
      { section: 'mana', modules: homeManaModules, marker: '/public/content/mana/' },
      { section: 'discipulos', modules: homeDiscipulosModules, marker: '/public/content/discipulos/' },
      { section: 'selah', modules: homeSelahModules, marker: '/public/content/selah/' },
      { section: 'babel', modules: homeBabelModules, marker: '/public/content/babel/' },
    ];

    for (const source of moduleSources) {
      for (const [pathKey, content] of Object.entries(source.modules)) {
        if (!content || typeof content !== 'string') continue;
        const normalizedPath = pathKey.replace(/\\/g, '/');
        const markerIndex = normalizedPath.indexOf(source.marker);
        const relativePath = markerIndex >= 0
          ? normalizedPath.slice(markerIndex + source.marker.length)
          : normalizedPath;

        const frontmatter = parseFrontmatter(content);
        const seriesLabel = deriveSeriesLabelFromMarkdown(source.section, relativePath, frontmatter, content);
        const updatedAt = parseDateMsOrToday(
          frontmatter.date
          || frontmatter.updated_at
          || frontmatter.updatedat
          || frontmatter.atualizado_em
          || frontmatter.atualizado
          || frontmatter.data,
        );
        const image = (frontmatter.image || '').startsWith('/') ? frontmatter.image : undefined;
        upsertSeries(source.section, seriesLabel, updatedAt, undefined, image);
      }
    }

      return HOME_UPDATES_SECTIONS_META.map((meta) => {
      const sorted = Array.from(sectionMaps[meta.id].values())
        .sort((a, b) => {
          if (b.updatedAt !== a.updatedAt) return b.updatedAt - a.updatedAt;
          return a.label.localeCompare(b.label, 'pt-BR');
        })
        .slice(0, 3);

      while (sorted.length < 3) {
        sorted.push({
          key: `${meta.id}-placeholder-${sorted.length + 1}`,
          label: 'Nova série em preparação',
          updatedAt: 0,
          updatedLabel: 'Em breve',
          isPlaceholder: true,
        });
      }

      return {
        ...meta,
        items: sorted,
      };
    });
    } catch {
      return fallbackCards;
    }
  }, [manaIndexData, selahIndexData]);

  const continueCards = [
    lastReadings.mana,
    lastReadings.discipulos,
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

  const scrollUpdatesCarousel = (delta: number) => {
    const carousel = updatesCarouselRef.current;
    if (!carousel) return;
    carousel.scrollBy({ left: delta, behavior: 'smooth' });
  };

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

      <section className="px-4 sm:px-6 pb-4">
        <div className="rounded-2xl border border-[#D4AF37]/24 bg-gradient-to-br from-[#1b1714] via-surface-container-low to-[#111111] p-3 sm:p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black tracking-[0.18em] uppercase text-primary">Painel de atualizações</p>
              <h3 className="mt-1 font-headline text-base sm:text-lg font-black tracking-tight text-on-surface">
                Últimas séries atualizadas por seção
              </h3>
              <p className="mt-1 text-[11px] text-on-surface-variant leading-relaxed">
                O app é atualizado com novos conteúdos toda semana.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => scrollUpdatesCarousel(-360)}
                className="h-8 w-8 rounded-full border border-outline-variant/40 bg-surface-container-high text-on-surface hover:border-primary/45 hover:text-primary transition-colors grid place-items-center"
                aria-label="Voltar carrossel de atualizações"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                onClick={() => scrollUpdatesCarousel(360)}
                className="h-8 w-8 rounded-full border border-outline-variant/40 bg-surface-container-high text-on-surface hover:border-primary/45 hover:text-primary transition-colors grid place-items-center"
                aria-label="Avançar carrossel de atualizações"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div
            ref={updatesCarouselRef}
            className="mt-3 flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {updatesCards.map((card) => {
              const Icon = SECTION_ICON[card.label];
              return (
                <article
                  key={`updates-${card.id}`}
                  className="snap-start shrink-0 w-[92%] sm:w-[420px] rounded-xl border border-outline-variant/22 bg-surface-container-low/95 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-primary/90 inline-flex items-center gap-1">
                        <Icon size={11} />
                        {card.label}
                      </p>
                      <p className="mt-1 text-[10px] text-on-surface-variant/80 leading-snug">{card.subtitle}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate(card.target, 'push')}
                      className="shrink-0 rounded-full border border-primary/35 bg-primary/12 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-primary hover:bg-primary/18 transition-colors"
                    >
                      Abrir
                    </button>
                  </div>

                  <div className="mt-2.5 space-y-1.5">
                    {card.items.map((item, index) => (
                      <div
                        key={`${card.id}-${item.key}`}
                        className={`rounded-lg border px-2 py-1.5 ${item.isPlaceholder ? 'border-outline-variant/20 bg-surface-container text-on-surface-variant/70' : 'border-outline-variant/25 bg-surface-container-high/60'}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[10px] font-semibold text-on-surface line-clamp-1">
                            {index + 1}. {item.label}
                          </p>
                          <span className={`text-[8px] font-black uppercase tracking-[0.12em] ${item.isPlaceholder ? 'text-on-surface-variant/60' : 'text-primary/90'}`}>
                            {item.updatedLabel}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-1 sm:hidden flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => scrollUpdatesCarousel(-280)}
              className="h-7 w-7 rounded-full border border-outline-variant/35 bg-surface-container-high text-on-surface/90 grid place-items-center"
              aria-label="Voltar carrossel de atualizações"
            >
              <ChevronLeft size={13} />
            </button>
            <button
              type="button"
              onClick={() => scrollUpdatesCarousel(280)}
              className="h-7 w-7 rounded-full border border-outline-variant/35 bg-surface-container-high text-on-surface/90 grid place-items-center"
              aria-label="Avançar carrossel de atualizações"
            >
              <ChevronRight size={13} />
            </button>
          </div>
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
