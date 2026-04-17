import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';

// ── Doctrine data (same import.meta.glob as Doctrines.tsx) ───────────────────
const doctrineIndexModules = import.meta.glob(
  '../content/doutrinas/{expostas,biblicas}/index.json',
  { eager: true, import: 'default' },
) as Record<string, Array<{ title: string; layers: Array<{ slug: string }> }>>;

function loadAllDoctrines() {
  return (['expostas', 'biblicas'] as const).flatMap((track) => {
    const path = `../content/doutrinas/${track}/index.json`;
    return (doctrineIndexModules[path] ?? []) as Array<{ title: string; layers: Array<{ slug: string }> }>;
  });
}

// ── Types ────────────────────────────────────────────────────────────────────
interface ApoBook { slug: string; }
interface StudyItem { slug: string; }
interface LibraryItem { slug: string; }

// ── Helpers ──────────────────────────────────────────────────────────────────
function pctOf(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}
function readProgress(slug: string) {
  return Math.min(100, parseInt(localStorage.getItem(`progress_${slug}`) ?? '0', 10) || 0);
}
function isRead(slug: string) {
  const reads = parseInt(localStorage.getItem(`reads_${slug}`) ?? '0', 10);
  return reads > 0 || readProgress(slug) >= 100;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ProgressSection() {
  // ── 1. Apocrypha ──────────────────────────────────────────────────────────
  const { data: apoBooks } = useFetch<ApoBook[]>('/content/apocrifos/apocrifos-index.json');
  const apoStats = useMemo(() => {
    if (!apoBooks) return { pct: 0, read: 0, total: 0 };
    const read = apoBooks.filter((b) => isRead(b.slug)).length;
    return { total: apoBooks.length, read, pct: pctOf(read, apoBooks.length) };
  }, [apoBooks]);

  // ── 2. Doctrines ──────────────────────────────────────────────────────────
  const docStats = useMemo(() => {
    const docs = loadAllDoctrines();
    let total = 0, read = 0;
    for (const d of docs) {
      total += d.layers.length;
      read += d.layers.filter((l) => isRead(l.slug)).length;
    }
    return { total, read, pct: pctOf(read, total) };
  }, []);

  // ── 3. Livraria ───────────────────────────────────────────────────────────
  const { data: libBooks } = useFetch<LibraryItem[]>('/content/livraria/index.json');
  const libStats = useMemo(() => {
    if (!libBooks) return { pct: 0, read: 0, total: 0 };
    const read = libBooks.filter((b) => isRead(b.slug)).length;
    return { total: libBooks.length, read, pct: pctOf(read, libBooks.length) };
  }, [libBooks]);

  // ── 4. MANÁ ───────────────────────────────────────────────────────────────
  const { data: studies } = useFetch<StudyItem[]>('/content/mana/index.json');
  const studyStats = useMemo(() => {
    if (!studies) return { pct: 0, read: 0, total: 0 };
    const read = studies.filter((s) => isRead(s.slug)).length;
    return { total: studies.length, read, pct: pctOf(read, studies.length) };
  }, [studies]);

  // ── Overall ───────────────────────────────────────────────────────────────
  const overallPct = useMemo(() => {
    const scores = [apoStats.pct, docStats.pct, libStats.pct, studyStats.pct];
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [apoStats.pct, docStats.pct, libStats.pct, studyStats.pct]);

  const pillars = [
    { label: 'Apócrifos', pct: apoStats.pct },
    { label: 'Doutrinas', pct: docStats.pct },
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
              Apócrifos · Doutrinas · Livraria · MANÁ
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
