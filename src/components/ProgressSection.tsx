import { useMemo } from 'react';
import { BookOpen, TrendingUp } from 'lucide-react';
import { getBooksByTestament } from '../services/bibleApi';
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

// ── Mini bar ─────────────────────────────────────────────────────────────────
function MiniBar({ value, glow }: { value: number; glow?: boolean }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-surface-container-high overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${glow
          ? 'bg-gradient-to-r from-[#D4AF37] to-[#F5D76E] shadow-[0_0_8px_rgba(212,175,55,0.4)]'
          : 'bg-gradient-to-r from-orange-500 to-yellow-400 shadow-[0_0_6px_rgba(249,115,22,0.35)]'
        }`}
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ProgressSection() {

  // ── 1. Bible ──────────────────────────────────────────────────────────────
  const bibleBooks = useMemo(() => [
    ...getBooksByTestament('traditional', 'old'),
    ...getBooksByTestament('traditional', 'new'),
  ], []);

  const bibleStats = useMemo(() => {
    let total = 0, read = 0;
    const byTestament: Record<string, { total: number; read: number }> = {
      'Antigo Testamento': { total: 0, read: 0 },
      'Novo Testamento': { total: 0, read: 0 },
    };
    for (const book of bibleBooks) {
      const group = book.testament === 'new' ? 'Novo Testamento' : 'Antigo Testamento';
      total += book.chapters;
      byTestament[group].total += book.chapters;
      for (let ch = 1; ch <= book.chapters; ch++) {
        if (localStorage.getItem(`exodo:bible-read:${book.id}:${ch}`) === '1') {
          read++;
          byTestament[group].read++;
        }
      }
    }
    return { total, read, pct: pctOf(read, total), byTestament };
  }, [bibleBooks]);

  // ── 2. Apocrypha ──────────────────────────────────────────────────────────
  const { data: apoBooks } = useFetch<ApoBook[]>('/content/apocrifos/apocrifos-index.json');
  const apoStats = useMemo(() => {
    if (!apoBooks) return { pct: 0, read: 0, total: 0 };
    const read = apoBooks.filter((b) => isRead(b.slug)).length;
    return { total: apoBooks.length, read, pct: pctOf(read, apoBooks.length) };
  }, [apoBooks]);

  // ── 3. Doctrines ──────────────────────────────────────────────────────────
  const docStats = useMemo(() => {
    const docs = loadAllDoctrines();
    let total = 0, read = 0;
    for (const d of docs) {
      total += d.layers.length;
      read += d.layers.filter((l) => isRead(l.slug)).length;
    }
    return { total, read, pct: pctOf(read, total) };
  }, []);

  // ── 4. Livraria ───────────────────────────────────────────────────────────
  const { data: libBooks } = useFetch<LibraryItem[]>('/content/livraria/index.json');
  const libStats = useMemo(() => {
    if (!libBooks) return { pct: 0, read: 0, total: 0 };
    const read = libBooks.filter((b) => isRead(b.slug)).length;
    return { total: libBooks.length, read, pct: pctOf(read, libBooks.length) };
  }, [libBooks]);

  // ── 5. Estudos ────────────────────────────────────────────────────────────
  const { data: studies } = useFetch<StudyItem[]>('/content/estudos/index.json');
  const studyStats = useMemo(() => {
    if (!studies) return { pct: 0, read: 0, total: 0 };
    const read = studies.filter((s) => isRead(s.slug)).length;
    return { total: studies.length, read, pct: pctOf(read, studies.length) };
  }, [studies]);

  // ── Overall ───────────────────────────────────────────────────────────────
  const overallPct = useMemo(() => {
    const scores = [bibleStats.pct, apoStats.pct, docStats.pct, libStats.pct, studyStats.pct];
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [bibleStats.pct, apoStats.pct, docStats.pct, libStats.pct, studyStats.pct]);

  const pillars = [
    { label: 'Bíblia', pct: bibleStats.pct },
    { label: 'Apócrifos', pct: apoStats.pct },
    { label: 'Doutrinas', pct: docStats.pct },
    { label: 'Livraria', pct: libStats.pct },
    { label: 'Estudos', pct: studyStats.pct },
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
              Bíblia · Apócrifos · Doutrinas · Livraria · Estudos
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

        {/* 5 pillars */}
        <div className="grid grid-cols-5 gap-2">
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

      {/* ── Bible detail card ──────────────────────────────────────────────── */}
      <div className="bg-surface-container-low rounded-2xl border border-outline-variant/10 overflow-hidden">
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={13} className="text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
              Bíblia — Capítulos Lidos
            </span>
            <span className="ml-auto text-[9px] font-bold text-on-surface-variant/50">
              {bibleStats.read} / {bibleStats.total}
            </span>
          </div>
          <MiniBar value={bibleStats.pct} glow={bibleStats.pct >= 100} />
        </div>

        <div className="border-t border-outline-variant/10">
          {Object.entries(bibleStats.byTestament).map(([name, s]) => {
            const pct = pctOf(s.read, s.total);
            return (
              <div
                key={name}
                className="flex items-center gap-3 px-5 py-3 border-b border-outline-variant/5 last:border-b-0"
              >
                <span className="text-xs text-on-surface flex-1 truncate">{name}</span>
                <div className="flex items-center gap-2 w-28 flex-shrink-0">
                  <div className="flex-1">
                    <MiniBar value={pct} />
                  </div>
                  <span className="text-[9px] font-black text-on-surface-variant/50 w-7 text-right">{pct}%</span>
                </div>
                <span className="text-[9px] text-on-surface-variant/40 w-16 text-right flex-shrink-0">
                  {s.read}/{s.total}
                </span>
              </div>
            );
          })}
        </div>

        {bibleStats.read === 0 && (
          <p className="px-5 pb-4 text-[10px] text-on-surface-variant/40 italic">
            Navegue pelos capítulos na Bíblia para registrar seu progresso.
          </p>
        )}
      </div>
    </section>
  );
}
