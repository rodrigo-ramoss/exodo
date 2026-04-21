import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { pm, type Category } from '../lib/progressManager';

const refutationModules = import.meta.glob('../content/refutacao/*/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

const bibleStudyModules = import.meta.glob('/public/content/eixos biblicos/eixo-*/**/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

const bibleStudySlugs = Object.keys(bibleStudyModules).map((path) =>
  path
    .replace(/\\/g, '/')
    .replace('/eixo-4-pratica-simbolos-liturgias/', '/eixo-4-tecnologia-alianca/'),
);

// ── Types ────────────────────────────────────────────────────────────────────
interface StudyItem { slug: string; }
interface LibraryItem { slug: string; }
interface ProgressStats {
  pct: number;
  read: number;
  total: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function clampPct(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function resolveItemPct(category: Category, slug: string) {
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

// ── Main component ────────────────────────────────────────────────────────────
export default function ProgressSection() {
  // ── 1. Bíblia ─────────────────────────────────────────────────────────────
  const bibleStats = useMemo(() => buildStats('biblica', bibleStudySlugs), []);

  // ── 2. Refutação ─────────────────────────────────────────────────────────
  const docStats = useMemo(() => {
    const slugs = Object.keys(refutationModules).map((path) =>
      path
        .replace(/\\/g, '/')
        .split('/')
        .pop()
        ?.replace(/\.md$/i, '') ?? '',
    ).filter(Boolean);
    return buildStats('refutacao', slugs);
  }, []);

  // ── 3. Livraria ───────────────────────────────────────────────────────────
  const { data: libBooks } = useFetch<LibraryItem[]>('/content/livraria/index.json');
  const libStats = useMemo(() => {
    if (!libBooks) return { pct: 0, read: 0, total: 0 };
    return buildStats('livraria', libBooks.map((b) => b.slug));
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
    { label: 'Refutação', pct: docStats.pct },
    { label: 'Livraria', pct: libStats.pct },
    { label: 'MANÁ', pct: studyStats.pct },
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
              Bíblia · Refutação · Livraria · MANÁ
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
              {/* Vertical mini bar */}
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
    </section>
  );
}
