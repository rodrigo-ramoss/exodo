import { useMemo } from 'react';
import { useFetch } from './useFetch';
import { pm, type Category } from '../lib/progressManager';

interface StudyItem {
  slug: string;
  title?: string;
  image?: string;
}

interface LibraryItem {
  slug: string;
  category?: string;
  title?: string;
  image?: string;
}

interface ProgressStats {
  pct: number;
  read: number;
  total: number;
}

interface BibleStudyEntry {
  slug: string;
  subthemeKey: string;
  subthemeLabel: string;
}

interface MatrixStudyEntry {
  slug: string;
  title: string;
  image?: string;
  seriesKey: string;
  seriesLabel: string;
}

interface LivrariaEntry {
  slug: string;
  fallbackSeriesKey: string;
  fallbackSeriesLabel: string;
}

export interface GoalProgress {
  key: string;
  label: string;
  target: string;
  status: 'idle' | 'active' | 'done';
  progressPct: number;
  summary: string;
  hint: string;
}

interface GoalGroup {
  label: string;
  slugs: string[];
}

interface GroupActivity {
  label: string;
  total: number;
  completed: number;
  inProgress: number;
  latestActivityMs: number;
}

export interface LastReadingCard {
  section: 'mana' | 'tipos' | 'selah' | 'babel';
  label: 'MANÁ' | 'TIPOS' | 'SELAH' | 'BABEL';
  category: Category;
  title: string;
  slug: string;
  image?: string;
  status: 'Em andamento' | 'Concluído' | 'Aguardando';
  progressPct: number;
  whereStopped: string;
  isEmpty: boolean;
}

export interface UserProgressSnapshot {
  overallPct: number;
  pillars: Array<{ label: string; pct: number }>;
  goals: GoalProgress[];
  lastReadings: {
    mana: LastReadingCard;
    tipos: LastReadingCard;
    selah: LastReadingCard;
    babel: LastReadingCard;
  };
  totals: {
    completed: number;
    inProgress: number;
    startedSeries: number;
  };
  weeklyGoal: {
    status: 'idle' | 'active' | 'done';
    text: string;
  };
  hasAnyReadingStarted: boolean;
  isLoadingSources: boolean;
}

const refutationModules = import.meta.glob('/public/content/babel/**/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

const livrariaModules = import.meta.glob('/public/content/livraria/**/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;
const livrariaEspitirualModules = import.meta.glob('/public/content/selah/**/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;
const allLivrariaModules = {
  ...livrariaModules,
  ...livrariaEspitirualModules,
};

const bibleStudyModules = import.meta.glob('/public/content/eixos biblicos/eixo-*/**/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

const MATRIX_IMAGE_ALIASES: Record<string, string> = {
  'capa-nos-do-poder': 'os nos do poder.webp',
  'os-nos-do-poder': 'os nos do poder.webp',
  'capa-as-familias': 'as familias.webp',
  'as-familias': 'as familias.webp',
  'capa-ordens-iniciaticas': 'as ordens iniciaticas.webp',
  'as-ordens-iniciaticas': 'as ordens iniciaticas.webp',
  'capa-ideologia-declarada': 'a ideologia declarada.webp',
  'a-ideologia-declarada': 'a ideologia declarada.webp',
  'capa-tres-camadas': 'as tres camadas na pratica.webp',
  'as-tres-camadas-na-pratica': 'as tres camadas na pratica.webp',
  'o-sistema-avisa-introducao-a-revelacao-adversaria': 'a paisagem da crise.webp',
  'capa-arquitetura-invisivel': 'a arquiterura invisivel.webp',
  'a-arquitetura-invisivel': 'a arquiterura invisivel.webp',
};

function normalizeKey(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function titleCase(raw: string): string {
  return raw
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
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

function normalizeBibleSubtheme(raw: string): string {
  return raw
    .replace(/\s*[\-–]\s*parte\s*\d+.*$/i, '')
    .replace(/:\s*.+$/, '')
    .trim();
}

function normalizeMatrixSeriesName(folder: string, fallbackCategory?: string): string {
  const normalized = folder
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  if (normalized.includes('fundamentos do discernimento')) return 'Fundamentos do Discernimento';
  if (normalized.includes('arquiterura visivel') || normalized.includes('arquitetura visivel')) return 'A Arquitetura Visível';
  if (fallbackCategory && !fallbackCategory.toLowerCase().includes('matrix')) return fallbackCategory;

  return titleCase(folder);
}

function clampPct(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function resolveItemPct(category: Category, slug: string): number {
  if (pm.isRead(category, slug)) return 100;
  return clampPct(pm.getProgress(category, slug));
}

function buildStats(category: Category, slugs: string[]): ProgressStats {
  const uniqueSlugs = Array.from(new Set(slugs.filter(Boolean)));
  const total = uniqueSlugs.length;
  if (!total) return { pct: 0, read: 0, total: 0 };

  const read = uniqueSlugs.filter((slug) => pm.isRead(category, slug)).length;
  const accumulatedPct = uniqueSlugs.reduce((sum, slug) => sum + resolveItemPct(category, slug), 0);
  const pct = clampPct(accumulatedPct / total);

  return { total, read, pct };
}

function toMs(iso?: string): number {
  if (!iso) return 0;
  const ms = new Date(iso).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function getWeekStartMs(date = new Date()): number {
  const current = new Date(date);
  current.setHours(0, 0, 0, 0);
  const day = (current.getDay() + 6) % 7;
  current.setDate(current.getDate() - day);
  return current.getTime();
}

function getDayStartMs(date = new Date()): number {
  const current = new Date(date);
  current.setHours(0, 0, 0, 0);
  return current.getTime();
}

function evaluateGroupActivity(category: Category, group: GoalGroup, weekStartMs: number): GroupActivity {
  let completed = 0;
  let inProgress = 0;
  let latestActivityMs = 0;

  for (const slug of group.slugs) {
    const readAtMs = toMs(pm.getLastReadAt(category, slug));
    const activityMs = Math.max(toMs(pm.getLastActivity(category, slug)), readAtMs);
    const progress = resolveItemPct(category, slug);

    if (readAtMs >= weekStartMs) {
      completed += 1;
    } else if (activityMs >= weekStartMs && progress > 0) {
      inProgress += 1;
    }

    if (activityMs >= weekStartMs) {
      latestActivityMs = Math.max(latestActivityMs, activityMs);
    }
  }

  return {
    label: group.label,
    total: group.slugs.length,
    completed,
    inProgress,
    latestActivityMs,
  };
}

function computeWeeklyGoal(
  category: Category,
  groups: GoalGroup[],
  weekStartMs: number,
  options: {
    key: string;
    label: string;
    target: string;
    itemName: string;
    unitName: string;
  },
): GoalProgress {
  const candidates = groups
    .map((group) => evaluateGroupActivity(category, group, weekStartMs))
    .filter((group) => group.total > 0);

  const active = candidates
    .filter((group) => group.latestActivityMs > 0 || group.completed > 0 || group.inProgress > 0)
    .sort((a, b) => b.latestActivityMs - a.latestActivityMs)[0];

  if (!active) {
    return {
      key: options.key,
      label: options.label,
      target: options.target,
      status: 'idle',
      progressPct: 0,
      summary: `Nenhum ${options.itemName} iniciado nesta semana.`,
      hint: `Meta semanal: ${options.target}.`,
    };
  }

  const done = active.completed >= active.total && active.total > 0;
  const weighted = clampPct(((active.completed + active.inProgress * 0.35) / active.total) * 100);

  if (done) {
    return {
      key: options.key,
      label: options.label,
      target: options.target,
      status: 'done',
      progressPct: 100,
      summary: `Meta concluída com ${active.label}.`,
      hint: `${active.completed}/${active.total} ${options.unitName} concluídas nesta semana.`,
    };
  }

  return {
    key: options.key,
    label: options.label,
    target: options.target,
    status: 'active',
    progressPct: weighted,
    summary: `Você está lendo ${active.label}.`,
    hint: `${active.completed}/${active.total} ${options.unitName} concluídas. Termine para fechar a meta.`,
  };
}

function isTypesBook(item: LibraryItem): boolean {
  const category = normalizeKey(item.category || '').replace(/-/g, ' ');
  const slug = normalizeKey(item.slug || '').replace(/-/g, ' ');
  return (
    category.includes('tipologia') ||
    category.includes('tabernaculo') ||
    slug.includes('tipologia biblica')
  );
}

function resolveMatrixCover(frontmatter: Record<string, string>, title: string, fileStem: string): string {
  const fromMeta = (frontmatter.image || '').trim();
  if (fromMeta) {
    if (/^https?:\/\//i.test(fromMeta) || fromMeta.startsWith('/')) return fromMeta;
    const stem = normalizeKey(fromMeta.replace(/\.[^.]+$/g, ''));
    const mapped = MATRIX_IMAGE_ALIASES[stem];
    if (mapped) return `/image/babel/${mapped}`;
  }

  const titleStem = normalizeKey(title);
  const mappedByTitle = MATRIX_IMAGE_ALIASES[titleStem];
  if (mappedByTitle) return `/image/babel/${mappedByTitle}`;

  const fileStemSlug = normalizeKey(fileStem.replace(/^ebook\s*\d+\s*-\s*/i, ''));
  const mappedByFile = MATRIX_IMAGE_ALIASES[fileStemSlug];
  if (mappedByFile) return `/image/babel/${mappedByFile}`;

  return '/image/babel/a paisagem da crise.webp';
}

function getReadingStatus(
  category: Category,
  slug: string,
): { status: LastReadingCard['status']; progressPct: number; score: number; whereStopped: string } {
  const isDone = pm.isRead(category, slug);
  const progressPct = isDone ? 100 : clampPct(pm.getProgress(category, slug));
  const lastActivity = Math.max(toMs(pm.getLastActivity(category, slug)), toMs(pm.getLastReadAt(category, slug)));
  const statusWeight = isDone ? 2 : progressPct > 0 ? 3 : 1;
  const status: LastReadingCard['status'] = isDone ? 'Concluído' : progressPct > 0 ? 'Em andamento' : 'Aguardando';
  const whereStopped = isDone ? 'Leitura concluída' : progressPct > 0 ? `Parou em ${progressPct}%` : 'Pronto para começar';
  return {
    status,
    progressPct,
    score: statusWeight * 10_000_000 + lastActivity + progressPct,
    whereStopped,
  };
}

const bibleStudyEntries: BibleStudyEntry[] = Object.entries(bibleStudyModules).map(([path, markdown]) => {
  const normalizedPath = path.replace(/\\/g, '/');
  const slug = normalizedPath.replace('/eixo-4-pratica-simbolos-liturgias/', '/eixo-4-tecnologia-alianca/');
  const frontmatter = parseFrontmatter(markdown);
  const fileName = normalizedPath.split('/').pop()?.replace(/\.md$/i, '') || 'Estudo';
  const title = frontmatter.title || fileName;
  const subtheme = normalizeBibleSubtheme(frontmatter.subtema || title || fileName);
  return {
    slug,
    subthemeKey: normalizeKey(subtheme),
    subthemeLabel: subtheme,
  };
});

const bibleStudySlugs = bibleStudyEntries.map((entry) => entry.slug);

const matrixStudyEntries: MatrixStudyEntry[] = Object.entries(refutationModules).map(([path, markdown]) => {
  const normalizedPath = path.replace(/\\/g, '/');
  const parts = normalizedPath.split('/');
  const contentIndex = parts.findIndex((part) => part === 'babel');
  const seriesFolder = parts[contentIndex + 2] ?? 'colecao';
  const fileName = parts[parts.length - 1] ?? '';
  const fileStem = fileName.replace(/\.md$/i, '');
  const slug = `${seriesFolder}/${fileStem}`;
  const frontmatter = parseFrontmatter(markdown);
  const title = frontmatter.title || fileStem;
  const seriesLabel = normalizeMatrixSeriesName(seriesFolder, frontmatter.category);
  return {
    slug,
    title,
    image: resolveMatrixCover(frontmatter, title, fileStem),
    seriesKey: normalizeKey(seriesLabel),
    seriesLabel,
  };
});

const matrixModuleSlugs = matrixStudyEntries.map((entry) => entry.slug);

const livrariaModuleEntries: LivrariaEntry[] = Object.keys(allLivrariaModules)
  .map((path) => {
    const normalizedPath = path.replace(/\\/g, '/');
    const markerLivraria = '/public/content/livraria/';
    const markerLivrariaEspitirual = '/public/content/selah/';
    const relative = normalizedPath.includes(markerLivraria)
      ? normalizedPath.slice(normalizedPath.indexOf(markerLivraria) + markerLivraria.length)
      : normalizedPath.includes(markerLivrariaEspitirual)
      ? normalizedPath.slice(normalizedPath.indexOf(markerLivrariaEspitirual) + markerLivrariaEspitirual.length)
      : normalizedPath;
    const withoutExt = relative.replace(/\.md$/i, '');
    const parts = withoutExt.split('/').filter(Boolean);
    const fileStem = parts[parts.length - 1] ?? '';
    const seriesFolder = parts.length > 1 ? parts[parts.length - 2] : (parts[0] ?? '');
    if (!seriesFolder || !fileStem) return null;
    return {
      slug: `${seriesFolder}/${fileStem}`,
      fallbackSeriesKey: normalizeKey(seriesFolder),
      fallbackSeriesLabel: titleCase(seriesFolder),
    };
  })
  .filter(Boolean) as LivrariaEntry[];

const livrariaModuleSlugs = livrariaModuleEntries.map((entry) => entry.slug);

export function useUserProgress(): UserProgressSnapshot {
  const weekStartMs = useMemo(() => getWeekStartMs(), []);
  const dayStartMs = useMemo(() => getDayStartMs(), []);

  const { data: libBooks, loading: libLoading } = useFetch<LibraryItem[]>('/content/livraria/index.json');
  const { data: studies, loading: studiesLoading } = useFetch<StudyItem[]>('/content/mana/index.json');

  const bibleStats = useMemo(() => buildStats('biblica', bibleStudySlugs), []);
  const docStats = useMemo(() => buildStats('refutacao', matrixModuleSlugs), []);
  const libStats = useMemo(() => {
    const fromIndex = libBooks?.map((b) => b.slug) ?? [];
    const allSlugs = Array.from(new Set([...fromIndex, ...livrariaModuleSlugs]));
    if (allSlugs.length === 0) return { pct: 0, read: 0, total: 0 };
    return buildStats('livraria', allSlugs);
  }, [libBooks]);
  const studyStats = useMemo(() => {
    if (!studies) return { pct: 0, read: 0, total: 0 };
    return buildStats('mana', studies.map((s) => s.slug));
  }, [studies]);

  const overallPct = useMemo(() => {
    const scores = [bibleStats.pct, docStats.pct, libStats.pct, studyStats.pct];
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [bibleStats.pct, docStats.pct, libStats.pct, studyStats.pct]);

  const pillars = useMemo(
    () => [
      { label: 'Bíblia', pct: bibleStats.pct },
      { label: 'BABEL', pct: docStats.pct },
      { label: 'SELAH', pct: libStats.pct },
      { label: 'MANÁ', pct: studyStats.pct },
    ],
    [bibleStats.pct, docStats.pct, libStats.pct, studyStats.pct],
  );

  const bibleGoal = useMemo(() => {
    const grouped = bibleStudyEntries.reduce<Record<string, GoalGroup>>((acc, entry) => {
      if (!acc[entry.subthemeKey]) {
        acc[entry.subthemeKey] = { label: entry.subthemeLabel, slugs: [] };
      }
      acc[entry.subthemeKey].slugs.push(entry.slug);
      return acc;
    }, {});
    return computeWeeklyGoal('biblica', Object.values(grouped), weekStartMs, {
      key: 'biblia',
      label: 'Bíblia',
      target: '1 estudo por semana',
      itemName: 'estudo',
      unitName: 'sessões',
    });
  }, [weekStartMs]);

  const manaGoal = useMemo<GoalProgress>(() => {
    const slugs = studies?.map((item) => item.slug) ?? [];
    const titleBySlug = new Map((studies ?? []).map((item) => [item.slug, item.title || item.slug]));

    if (slugs.length === 0) {
      return {
        key: 'mana',
        label: 'MANÁ',
        target: '1 por dia',
        status: 'idle',
        progressPct: 0,
        summary: 'Nenhum estudo carregado.',
        hint: 'Assim que os estudos aparecerem, a meta diária será acompanhada aqui.',
      };
    }

    const readToday = slugs.find((slug) => toMs(pm.getLastReadAt('mana', slug)) >= dayStartMs);
    if (readToday) {
      const title = titleBySlug.get(readToday) || readToday;
      return {
        key: 'mana',
        label: 'MANÁ',
        target: '1 por dia',
        status: 'done',
        progressPct: 100,
        summary: `Meta diária concluída com "${title}".`,
        hint: 'Hoje já está fechado. Amanhã a meta reinicia automaticamente.',
      };
    }

    const active = slugs
      .map((slug) => ({
        slug,
        title: titleBySlug.get(slug) || slug,
        activityMs: toMs(pm.getLastActivity('mana', slug)),
        progress: resolveItemPct('mana', slug),
      }))
      .filter((item) => item.activityMs >= dayStartMs && item.progress > 0)
      .sort((a, b) => b.activityMs - a.activityMs)[0];

    if (active) {
      return {
        key: 'mana',
        label: 'MANÁ',
        target: '1 por dia',
        status: 'active',
        progressPct: Math.max(18, active.progress),
        summary: `Você está lendo "${active.title}".`,
        hint: 'Finalize a leitura de hoje para concluir a meta diária.',
      };
    }

    return {
      key: 'mana',
      label: 'MANÁ',
      target: '1 por dia',
      status: 'idle',
      progressPct: 0,
      summary: 'Nenhuma leitura registrada hoje.',
      hint: 'Meta diária: concluir 1 estudo de MANÁ.',
    };
  }, [dayStartMs, studies]);

  const matrixGoal = useMemo(() => {
    const grouped = matrixStudyEntries.reduce<Record<string, GoalGroup>>((acc, entry) => {
      if (!acc[entry.seriesKey]) {
        acc[entry.seriesKey] = { label: entry.seriesLabel, slugs: [] };
      }
      acc[entry.seriesKey].slugs.push(entry.slug);
      return acc;
    }, {});
    return computeWeeklyGoal('refutacao', Object.values(grouped), weekStartMs, {
      key: 'matrix',
      label: 'BABEL',
      target: '1 série por semana',
      itemName: 'série',
      unitName: 'volumes',
    });
  }, [weekStartMs]);

  const spiritualGoal = useMemo(() => {
    const grouped = new Map<string, GoalGroup>();

    for (const item of libBooks ?? []) {
      const fallback = livrariaModuleEntries.find((entry) => entry.slug === item.slug);
      const label = (item.category || fallback?.fallbackSeriesLabel || titleCase(item.slug.split('/')[0] || 'Série')).trim();
      const key = normalizeKey(label);
      const current = grouped.get(key) ?? { label, slugs: [] };
      current.slugs.push(item.slug);
      grouped.set(key, current);
    }

    for (const entry of livrariaModuleEntries) {
      if (Array.from(grouped.values()).some((group) => group.slugs.includes(entry.slug))) continue;
      const current = grouped.get(entry.fallbackSeriesKey) ?? {
        label: entry.fallbackSeriesLabel,
        slugs: [],
      };
      current.slugs.push(entry.slug);
      grouped.set(entry.fallbackSeriesKey, current);
    }

    return computeWeeklyGoal('livraria', Array.from(grouped.values()), weekStartMs, {
      key: 'livraria',
      label: 'SELAH',
      target: '1 série por semana',
      itemName: 'série',
      unitName: 'volumes',
    });
  }, [libBooks, weekStartMs]);

  const goals = useMemo(
    () => [bibleGoal, manaGoal, matrixGoal, spiritualGoal],
    [bibleGoal, manaGoal, matrixGoal, spiritualGoal],
  );

  const manaCards = useMemo(
    () => (studies ?? []).map((item) => ({ title: item.title || item.slug, slug: item.slug, image: item.image })),
    [studies],
  );
  const tiposCards = useMemo(
    () =>
      (libBooks ?? [])
        .filter(isTypesBook)
        .map((item) => ({ title: item.title || item.slug, slug: item.slug, image: item.image })),
    [libBooks],
  );
  const selahCards = useMemo(
    () =>
      (libBooks ?? [])
        .filter((item) => !isTypesBook(item))
        .map((item) => ({ title: item.title || item.slug, slug: item.slug, image: item.image })),
    [libBooks],
  );
  const babelCards = useMemo(
    () => matrixStudyEntries.map((item) => ({ title: item.title, slug: item.slug, image: item.image })),
    [],
  );

  const pickLastReading = (
    section: LastReadingCard['section'],
    label: LastReadingCard['label'],
    category: Category,
    entries: Array<{ title: string; slug: string; image?: string }>,
  ): LastReadingCard => {
    if (!entries.length) {
      return {
        section,
        label,
        category,
        title: `Sem leituras em ${label}`,
        slug: '',
        status: 'Aguardando',
        progressPct: 0,
        whereStopped: 'Aguardando sincronização de leitura',
        isEmpty: true,
      };
    }

    const best = entries
      .map((entry) => ({ entry, progress: getReadingStatus(category, entry.slug) }))
      .sort((a, b) => b.progress.score - a.progress.score)[0];

    if (!best) {
      return {
        section,
        label,
        category,
        title: `Sem leituras em ${label}`,
        slug: '',
        status: 'Aguardando',
        progressPct: 0,
        whereStopped: 'Aguardando sincronização de leitura',
        isEmpty: true,
      };
    }

    return {
      section,
      label,
      category,
      title: best.entry.title,
      slug: best.entry.slug,
      image: best.entry.image,
      status: best.progress.status,
      progressPct: best.progress.progressPct,
      whereStopped: best.progress.whereStopped,
      isEmpty: false,
    };
  };

  const lastReadings = useMemo(
    () => ({
      mana: pickLastReading('mana', 'MANÁ', 'mana', manaCards),
      tipos: pickLastReading('tipos', 'TIPOS', 'livraria', tiposCards),
      selah: pickLastReading('selah', 'SELAH', 'livraria', selahCards),
      babel: pickLastReading('babel', 'BABEL', 'refutacao', babelCards),
    }),
    [babelCards, manaCards, selahCards, tiposCards],
  );

  const countsByCategory = (category: Category, slugs: string[]) => {
    const unique = Array.from(new Set(slugs.filter(Boolean)));
    let completed = 0;
    let inProgress = 0;
    for (const slug of unique) {
      if (pm.isRead(category, slug)) {
        completed += 1;
        continue;
      }
      if (pm.getProgress(category, slug) > 0) inProgress += 1;
    }
    return { completed, inProgress };
  };

  const totals = useMemo(() => {
    const mana = countsByCategory('mana', manaCards.map((item) => item.slug));
    const livraria = countsByCategory('livraria', [...tiposCards, ...selahCards].map((item) => item.slug));
    const babel = countsByCategory('refutacao', babelCards.map((item) => item.slug));
    const completed = mana.completed + livraria.completed + babel.completed;
    const inProgress = mana.inProgress + livraria.inProgress + babel.inProgress;
    const startedSeries = Object.values(lastReadings).filter((item) => item.status !== 'Aguardando').length;
    return { completed, inProgress, startedSeries };
  }, [babelCards, lastReadings, manaCards, selahCards, tiposCards]);

  const hasAnyReadingStarted = totals.completed > 0 || totals.inProgress > 0;

  const weeklyGoal = useMemo(() => {
    const hasDone = goals.some((goal) => goal.status === 'done');
    const hasActive = goals.some((goal) => goal.status === 'active');
    if (hasDone) {
      return { status: 'done' as const, text: 'Meta semanal com avanço concluído em pelo menos uma frente.' };
    }
    if (hasActive) {
      return { status: 'active' as const, text: 'Meta semanal em andamento. Continue sua travessia.' };
    }
    return { status: 'idle' as const, text: 'Meta semanal aguardando início de leitura.' };
  }, [goals]);

  return {
    overallPct,
    pillars,
    goals,
    lastReadings,
    totals,
    weeklyGoal,
    hasAnyReadingStarted,
    isLoadingSources: libLoading || studiesLoading,
  };
}
