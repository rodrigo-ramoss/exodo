import { useMemo, type ComponentType } from 'react';
import {
  BookMarked,
  BookOpenText,
  GraduationCap,
  Library,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { pm, type Category } from '../lib/progressManager';

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

// ── Types ────────────────────────────────────────────────────────────────────
interface StudyItem {
  slug: string;
  title?: string;
}

interface LibraryItem {
  slug: string;
  category?: string;
  title?: string;
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
  seriesKey: string;
  seriesLabel: string;
}

interface LivrariaEntry {
  slug: string;
  fallbackSeriesKey: string;
  fallbackSeriesLabel: string;
}

interface GoalProgress {
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

// ── Helpers ──────────────────────────────────────────────────────────────────
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
  const day = (current.getDay() + 6) % 7; // segunda = 0
  current.setDate(current.getDate() - day);
  return current.getTime();
}

function getDayStartMs(date = new Date()): number {
  const current = new Date(date);
  current.setHours(0, 0, 0, 0);
  return current.getTime();
}

function statusLabel(status: GoalProgress['status']): string {
  if (status === 'done') return 'Concluído';
  if (status === 'active') return 'Em Andamento';
  return 'Aguardando';
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

// ── Static indexed slugs ─────────────────────────────────────────────────────
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
  const seriesLabel = normalizeMatrixSeriesName(seriesFolder, frontmatter.category);
  return {
    slug,
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

// ── Main component ───────────────────────────────────────────────────────────
export default function ProgressSection() {
  const weekStartMs = useMemo(() => getWeekStartMs(), []);
  const dayStartMs = useMemo(() => getDayStartMs(), []);

  // ── 1. Bíblia ─────────────────────────────────────────────────────────────
  const bibleStats = useMemo(() => buildStats('biblica', bibleStudySlugs), []);

  // ── 2. BABEL ────────────────────────────────────────────────
  const docStats = useMemo(() => buildStats('refutacao', matrixModuleSlugs), []);

  // ── 3. SELAH ───────────────────────────────────────────────
  const { data: libBooks } = useFetch<LibraryItem[]>('/content/livraria/index.json');
  const libStats = useMemo(() => {
    const fromIndex = libBooks?.map((b) => b.slug) ?? [];
    const allSlugs = Array.from(new Set([...fromIndex, ...livrariaModuleSlugs]));
    if (allSlugs.length === 0) return { pct: 0, read: 0, total: 0 };
    return buildStats('livraria', allSlugs);
  }, [libBooks]);

  // ── 4. MANÁ ───────────────────────────────────────────────────────────────
  const { data: studies } = useFetch<StudyItem[]>('/content/mana/index.json');
  const studyStats = useMemo(() => {
    if (!studies) return { pct: 0, read: 0, total: 0 };
    return buildStats('mana', studies.map((s) => s.slug));
  }, [studies]);

  // ── Overall ───────────────────────────────────────────────────────────────
  const overallPct = useMemo(() => {
    const scores = [bibleStats.pct, docStats.pct, libStats.pct, studyStats.pct];
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [bibleStats.pct, docStats.pct, libStats.pct, studyStats.pct]);

  const pillars = [
    { label: 'Bíblia', pct: bibleStats.pct },
    { label: 'BABEL', pct: docStats.pct },
    { label: 'SELAH', pct: libStats.pct },
    { label: 'MANÁ', pct: studyStats.pct },
  ];

  // ── Weekly and Daily Goals ────────────────────────────────────────────────
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

  const goals: Array<GoalProgress & { Icon: ComponentType<{ size?: number; className?: string }> }> = [
    { ...bibleGoal, Icon: BookOpenText },
    { ...manaGoal, Icon: GraduationCap },
    { ...matrixGoal, Icon: BookMarked },
    { ...spiritualGoal, Icon: Library },
  ];

  return (
    <section className="px-6 mb-8">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={14} className="text-primary" />
        <span className="font-headline text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant">
          Meu Progresso
        </span>
      </div>

      {/* ── Overall card ───────────────────────────────────────────────────── */}
      <div className="bg-surface-container-low rounded-2xl border border-outline-variant/10 p-5 mb-4">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-xs font-bold text-on-surface">Progresso Geral</p>
            <p className="text-[10px] text-on-surface-variant/60 mt-0.5">
              Acompanhe o que você mais lê: Bíblia, BABEL, SELAH e MANÁ.
            </p>
          </div>
          <span className="font-headline text-2xl font-black text-primary tracking-tighter">
            {overallPct}%
          </span>
        </div>

        {/* Main bar */}
        <div className="h-2.5 w-full rounded-full bg-surface-container-high overflow-hidden mb-5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-yellow-400 shadow-[0_0_8px_rgba(249,115,22,0.4)] transition-all duration-700"
            style={{ width: `${overallPct}%` }}
          />
        </div>

        {/* 4 pillars */}
        <div className="grid grid-cols-4 gap-2">
          {pillars.map(({ label, pct }) => (
            <div key={label} className="flex flex-col gap-1.5 items-center">
              <div className="w-full h-16 bg-surface-container-high rounded-lg overflow-hidden flex items-end">
                <div
                  className="w-full rounded-lg bg-gradient-to-t from-orange-500 to-yellow-400 transition-all duration-700"
                  style={{ height: `${Math.max(4, pct)}%` }}
                />
              </div>
              <span className="text-[8px] font-black uppercase tracking-tight text-on-surface-variant/60 text-center leading-tight">
                {label}
              </span>
              <span className="text-[9px] font-black text-primary leading-none">{pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Weekly goals ───────────────────────────────────────────────────── */}
      <div className="bg-surface-container-low rounded-2xl border border-outline-variant/10 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Target size={14} className="text-primary" />
          <span className="font-headline text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant">
            Metas da Semana
          </span>
        </div>
        <p className="text-[10px] text-on-surface-variant/65 mb-4 leading-relaxed">
          Progresso com foco: 1 estudo bíblico por semana, 1 MANÁ por dia e 1 série por semana em SELAH e BABEL.
        </p>

        <div className="space-y-3">
          {goals.map((goal) => {
            const badgeClass = goal.status === 'done'
              ? 'text-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/35'
              : goal.status === 'active'
                ? 'text-primary bg-primary/10 border-primary/35'
                : 'text-on-surface-variant/60 bg-surface-container-high border-outline-variant/20';

            const barClass = goal.status === 'done'
              ? 'from-[#D4AF37] to-[#F5D76E]'
              : 'from-orange-500 to-yellow-400';

            return (
              <article
                key={goal.key}
                className="rounded-xl border border-outline-variant/15 bg-surface-container-high/40 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg border border-primary/20 bg-primary/10 flex items-center justify-center shrink-0">
                      <goal.Icon size={13} className="text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-on-surface">
                        {goal.label}
                      </p>
                      <p className="text-[10px] text-on-surface-variant/60">
                        Meta: {goal.target}
                      </p>
                    </div>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest ${badgeClass}`}>
                    {statusLabel(goal.status)}
                  </span>
                </div>

                <p className="mt-2 text-[10px] text-on-surface-variant/80">{goal.summary}</p>

                <div className="mt-2 h-1.5 w-full rounded-full bg-surface-container overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${barClass} transition-all duration-700`}
                    style={{ width: `${goal.progressPct}%` }}
                  />
                </div>

                <p className="mt-1.5 text-[9px] text-on-surface-variant/60 leading-snug">
                  {goal.hint}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
