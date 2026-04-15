import { useMemo } from 'react';
import { BookOpen, Shield, Gavel, TrendingUp } from 'lucide-react';
import { getBooksByTestament } from '../services/bibleApi';
import { useFetch } from '../hooks/useFetch';
import { cn } from '../lib/utils';

// ── Doctrine data (same import pattern as Doctrines.tsx) ──────────────────────
const doctrineIndexModules = import.meta.glob(
  '../content/doutrinas/{expostas,biblicas}/index.json',
  { eager: true, import: 'default' },
) as Record<string, Array<{ title: string; layers: Array<{ slug: string }> }>>;

interface DoctrineRaw {
  title: string;
  layers: Array<{ title: string; slug: string }>;
}

function loadAllDoctrines(): DoctrineRaw[] {
  const tracks = ['expostas', 'biblicas'] as const;
  return tracks.flatMap((track) => {
    const path = `../content/doutrinas/${track}/index.json`;
    return (doctrineIndexModules[path] ?? []) as DoctrineRaw[];
  });
}

// ── Apocrypha types (mirrors Protocol.tsx) ───────────────────────────────────
interface ApoMission {
  title: string;
  slug: string;
  duration: string;
  status: 'liberado' | 'bloqueado';
}
interface ApoTrilha {
  id: string;
  title: string;
  missions: ApoMission[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function readProgress(slug: string): number {
  return parseInt(localStorage.getItem(`progress_${slug}`) ?? '0', 10) || 0;
}
function readCount(slug: string): number {
  return parseInt(localStorage.getItem(`reads_${slug}`) ?? '0', 10) || 0;
}
function isLayerRead(slug: string): boolean {
  return readCount(slug) > 0 || readProgress(slug) >= 100;
}

// ── Sub-components ────────────────────────────────────────────────────────────
function MiniBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn('h-1.5 w-full rounded-full bg-surface-container-high overflow-hidden', className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-orange-500 to-yellow-400 transition-all duration-500"
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: 'lido' | 'lendo' | 'bloqueado' | 'nao-iniciado' }) {
  const cfg = {
    lido: { label: 'Lido', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
    lendo: { label: 'Lendo', cls: 'bg-primary/15 text-primary border-primary/20' },
    bloqueado: { label: 'Bloqueado', cls: 'bg-surface-container-high text-on-surface-variant/40 border-outline-variant/10' },
    'nao-iniciado': { label: 'Não iniciado', cls: 'bg-surface-container text-on-surface-variant/50 border-outline-variant/10' },
  }[status];
  return (
    <span className={cn('text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border', cfg.cls)}>
      {cfg.label}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ProgressSection() {
  // ── Bible data ──
  const bibleBooks = useMemo(() => {
    const old = getBooksByTestament('traditional', 'old');
    const newT = getBooksByTestament('traditional', 'new');
    return [...old, ...newT];
  }, []);

  const bibleStats = useMemo(() => {
    let totalChapters = 0;
    let readChapters = 0;
    const byTestament: Record<string, { total: number; read: number }> = {
      'Antigo Testamento': { total: 0, read: 0 },
      'Novo Testamento': { total: 0, read: 0 },
    };

    for (const book of bibleBooks) {
      const group = book.testament === 'new' ? 'Novo Testamento' : 'Antigo Testamento';
      totalChapters += book.chapters;
      byTestament[group].total += book.chapters;

      for (let ch = 1; ch <= book.chapters; ch++) {
        if (localStorage.getItem(`exodo:bible-read:${book.id}:${ch}`) === '1') {
          readChapters++;
          byTestament[group].read++;
        }
      }
    }

    return {
      total: totalChapters,
      read: readChapters,
      pct: totalChapters > 0 ? Math.round((readChapters / totalChapters) * 100) : 0,
      byTestament,
    };
  }, [bibleBooks]);

  // ── Apocrypha data ──
  const { data: trilhas } = useFetch<ApoTrilha[]>('/content/apocrifos/apocrifos-index.json');

  const apoMissions = useMemo((): Array<{ title: string; slug: string; status: 'liberado' | 'bloqueado'; readStatus: 'lido' | 'lendo' | 'bloqueado' | 'nao-iniciado'; pct: number }> => {
    if (!trilhas) return [];
    return trilhas.flatMap((t) =>
      t.missions.map((m) => {
        if (m.status === 'bloqueado') return { ...m, readStatus: 'bloqueado' as const, pct: 0 };
        const pct = readProgress(m.slug);
        const reads = readCount(m.slug);
        const readStatus: 'lido' | 'lendo' | 'nao-iniciado' =
          reads > 0 || pct >= 100 ? 'lido' : pct > 0 ? 'lendo' : 'nao-iniciado';
        return { ...m, readStatus, pct };
      }),
    );
  }, [trilhas]);

  const apoStats = useMemo(() => {
    const unlocked = apoMissions.filter((m) => m.readStatus !== 'bloqueado');
    const read = unlocked.filter((m) => m.readStatus === 'lido').length;
    return {
      total: apoMissions.length,
      unlocked: unlocked.length,
      read,
      pct: unlocked.length > 0 ? Math.round((read / unlocked.length) * 100) : 0,
    };
  }, [apoMissions]);

  // ── Doctrines data ──
  const allDoctrines = useMemo(() => loadAllDoctrines(), []);

  const docStats = useMemo(() => {
    let totalLayers = 0;
    let readLayers = 0;
    const byDoctrine = allDoctrines.map((d) => {
      const layerRead = d.layers.filter((l) => isLayerRead(l.slug)).length;
      totalLayers += d.layers.length;
      readLayers += layerRead;
      return { title: d.title, total: d.layers.length, read: layerRead };
    });
    return {
      total: totalLayers,
      read: readLayers,
      pct: totalLayers > 0 ? Math.round((readLayers / totalLayers) * 100) : 0,
      byDoctrine,
    };
  }, [allDoctrines]);

  // ── Overall progress ──
  const overallPct = useMemo(() => {
    const scores = [bibleStats.pct, apoStats.pct, docStats.pct];
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [bibleStats.pct, apoStats.pct, docStats.pct]);

  return (
    <section className="px-6 mb-8">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={14} className="text-primary" />
        <span className="font-headline text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant">
          Meu Progresso
        </span>
      </div>

      {/* ── Overall bar ─────────────────────────────────────────────────────── */}
      <div className="bg-surface-container-low rounded-2xl border border-outline-variant/10 p-5 mb-4">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-xs font-bold text-on-surface">Progresso Geral</p>
            <p className="text-[10px] text-on-surface-variant/60 mt-0.5">
              Bíblia · Apócrifos · Doutrinas
            </p>
          </div>
          <span className="font-headline text-2xl font-black text-primary tracking-tighter">
            {overallPct}%
          </span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-surface-container-high overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-yellow-400 shadow-[0_0_8px_rgba(249,115,22,0.4)] transition-all duration-700"
            style={{ width: `${overallPct}%` }}
          />
        </div>

        {/* Three pillars */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-outline-variant/10">
          {[
            { label: 'Bíblia', pct: bibleStats.pct },
            { label: 'Apócrifos', pct: apoStats.pct },
            { label: 'Doutrinas', pct: docStats.pct },
          ].map(({ label, pct }) => (
            <div key={label} className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant/60">{label}</span>
                <span className="text-[9px] font-black text-primary">{pct}%</span>
              </div>
              <MiniBar value={pct} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Bíblia ──────────────────────────────────────────────────────────── */}
      <div className="bg-surface-container-low rounded-2xl border border-outline-variant/10 overflow-hidden mb-4">
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={13} className="text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Bíblia</span>
            <span className="ml-auto text-[9px] font-bold text-on-surface-variant/50">
              {bibleStats.read} / {bibleStats.total} capítulos
            </span>
          </div>
          <MiniBar value={bibleStats.pct} />
        </div>

        {/* Testament breakdown */}
        <div className="border-t border-outline-variant/10">
          {Object.entries(bibleStats.byTestament).map(([name, s]) => {
            const pct = s.total > 0 ? Math.round((s.read / s.total) * 100) : 0;
            return (
              <div key={name} className="flex items-center gap-3 px-5 py-3 border-b border-outline-variant/5 last:border-b-0">
                <span className="text-xs text-on-surface flex-1">{name}</span>
                <div className="flex items-center gap-2 w-28">
                  <MiniBar value={pct} className="flex-1" />
                  <span className="text-[9px] font-black text-on-surface-variant/50 w-7 text-right">{pct}%</span>
                </div>
                <span className="text-[9px] text-on-surface-variant/40 w-16 text-right">
                  {s.read}/{s.total} cap.
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

      {/* ── Apócrifos ───────────────────────────────────────────────────────── */}
      <div className="bg-surface-container-low rounded-2xl border border-outline-variant/10 overflow-hidden mb-4">
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={13} className="text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Apócrifos</span>
            <span className="ml-auto text-[9px] font-bold text-on-surface-variant/50">
              {apoStats.read} / {apoStats.unlocked} missões
            </span>
          </div>
          <MiniBar value={apoStats.pct} />
        </div>

        <div className="border-t border-outline-variant/10">
          {apoMissions.length === 0 && (
            <p className="px-5 py-4 text-[10px] text-on-surface-variant/40 italic">Carregando missões...</p>
          )}
          {apoMissions.map((m, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-5 py-3 border-b border-outline-variant/5 last:border-b-0"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs text-on-surface leading-tight line-clamp-1">{m.title}</p>
                {m.readStatus === 'lendo' && (
                  <MiniBar value={m.pct} className="mt-1.5 w-24" />
                )}
              </div>
              <StatusBadge status={m.readStatus} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Doutrinas ───────────────────────────────────────────────────────── */}
      <div className="bg-surface-container-low rounded-2xl border border-outline-variant/10 overflow-hidden">
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <Gavel size={13} className="text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Doutrinas</span>
            <span className="ml-auto text-[9px] font-bold text-on-surface-variant/50">
              {docStats.read} / {docStats.total} camadas lidas
            </span>
          </div>
          <MiniBar value={docStats.pct} />
        </div>

        <div className="border-t border-outline-variant/10">
          {docStats.byDoctrine.map((d, i) => {
            const pct = d.total > 0 ? Math.round((d.read / d.total) * 100) : 0;
            const status: 'lido' | 'lendo' | 'nao-iniciado' =
              pct >= 100 ? 'lido' : pct > 0 ? 'lendo' : 'nao-iniciado';
            return (
              <div
                key={i}
                className="flex items-center gap-3 px-5 py-3 border-b border-outline-variant/5 last:border-b-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-on-surface leading-tight">{d.title}</p>
                  {pct > 0 && pct < 100 && (
                    <MiniBar value={pct} className="mt-1.5 w-24" />
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[9px] text-on-surface-variant/40">{d.read}/{d.total}</span>
                  <StatusBadge status={status} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
