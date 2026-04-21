import { useMemo, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, ChevronLeft, Cpu, Shield, Sparkles } from 'lucide-react';
import { MarkdownViewer } from './MarkdownViewer';
import { AppImage } from './AppImage';

interface RefutationStudy {
  title: string;
  description?: string;
  date?: string;
  image: string;
  slug: string;
  pathKey: string;
  content: string;
  themeId: string;
  series: string;
  volume: number | null;
}

interface RefutationTheme {
  id: string;
  label: string;
  subtitle: string;
  accent: string;
  signal: string;
}

const REFUTATION_THEMES: RefutationTheme[] = [
  {
    id: 'revelacao-adversaria',
    label: 'Revelação Adversária',
    subtitle:
      'A ordem mundial opera sob uma economia de revelação ritual. O sistema anuncia seus movimentos por símbolos públicos, ficção preditiva e cerimônias.',
    accent: 'from-[#0b2a1b]/92 via-[#071910]/86 to-[#030807]/90',
    signal: 'MATRIX::DISCERN',
  },
];

const THEME_BY_ID = Object.fromEntries(REFUTATION_THEMES.map((theme) => [theme.id, theme])) as Record<string, RefutationTheme>;

const refutationModules = import.meta.glob('/public/content/livraria da matrix/**/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

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

function extractVolume(raw: string): number | null {
  const match = raw.match(/(?:ebook|livro|parte)\s*(\d{1,3})/i);
  if (!match) return null;
  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function sortByNewest(a: RefutationStudy, b: RefutationStudy): number {
  const dateA = new Date(a.date ?? 0).getTime();
  const dateB = new Date(b.date ?? 0).getTime();
  if (dateA !== dateB) return dateB - dateA;
  return a.title.localeCompare(b.title, 'pt-BR');
}

function sortByVolume(a: RefutationStudy, b: RefutationStudy): number {
  if (a.volume !== null && b.volume !== null && a.volume !== b.volume) {
    return a.volume - b.volume;
  }
  if (a.volume !== null && b.volume === null) return -1;
  if (a.volume === null && b.volume !== null) return 1;
  return sortByNewest(a, b);
}

function loadRefutations(): RefutationStudy[] {
  return Object.entries(refutationModules)
    .map(([pathKey, content]) => {
      const normalizedPath = pathKey.replace(/\\/g, '/');
      const parts = normalizedPath.split('/');
      const contentIndex = parts.findIndex((part) => part === 'livraria da matrix');
      const themeId = parts[contentIndex + 1] ?? 'revelacao-adversaria';
      const fileName = parts[parts.length - 1] ?? '';
      const frontmatter = parseFrontmatter(content);
      const fileStem = fileName.replace(/\.md$/i, '');
      const title = frontmatter.title || fileStem;

      return {
        title,
        description: frontmatter.description,
        date: frontmatter.date,
        image: frontmatter.image || '/image/livraria da matrix/a paisagem da crise.webp',
        slug: fileStem,
        pathKey,
        content,
        themeId,
        series: frontmatter.category || 'Revelação Adversária',
        volume: extractVolume(fileStem) ?? extractVolume(title),
      };
    })
    .sort(sortByNewest);
}

function DragScrollRow({ children }: { children: ReactNode }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ isDown: false, startX: 0, scrollLeft: 0, didDrag: false });

  return (
    <div
      ref={rowRef}
      className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory cursor-grab active:cursor-grabbing [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      onClickCapture={(e) => {
        if (drag.current.didDrag) {
          e.preventDefault();
          e.stopPropagation();
          drag.current.didDrag = false;
        }
      }}
      onPointerDown={(e) => {
        if (e.pointerType !== 'mouse' || e.button !== 0) return;
        const el = rowRef.current;
        if (!el) return;
        drag.current = { isDown: true, startX: e.clientX, scrollLeft: el.scrollLeft, didDrag: false };
      }}
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse' || !drag.current.isDown) return;
        const el = rowRef.current;
        if (!el) return;
        const walk = e.clientX - drag.current.startX;
        if (Math.abs(walk) > 10) drag.current.didDrag = true;
        el.scrollLeft = drag.current.scrollLeft - walk;
      }}
      onPointerUp={() => {
        drag.current.isDown = false;
        setTimeout(() => {
          drag.current.didDrag = false;
        }, 0);
      }}
      onPointerLeave={() => {
        drag.current.isDown = false;
        drag.current.didDrag = false;
      }}
    >
      {children}
    </div>
  );
}

function MatrixBookCard({
  study,
  volIndex,
  onSelect,
}: {
  study: RefutationStudy;
  volIndex: number;
  onSelect: () => void;
}) {
  const volume = study.volume ?? volIndex + 1;
  return (
    <article
      onClick={onSelect}
      className="group shrink-0 w-[148px] sm:w-[168px] flex flex-col cursor-pointer active:scale-95 transition-transform snap-start"
    >
      <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden border border-[#1ee07a]/25 bg-[#040806] shadow-[0_0_24px_rgba(34,197,94,0.14)]">
        <AppImage
          src={study.image}
          alt={study.title}
          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-[1.03] transition-all duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#021006]/80 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[repeating-linear-gradient(180deg,rgba(34,197,94,0.08)_0px,rgba(34,197,94,0.08)_1px,transparent_1px,transparent_6px)] opacity-20 pointer-events-none" />
      </div>
      <div className="mt-2.5 px-0.5 select-none flex flex-col gap-1.5">
        <span className="text-[8px] font-black uppercase tracking-[0.15em] text-[#7dffb2]/80 leading-none">
          VOL. {String(volume).padStart(2, '0')}
        </span>
        <p className="text-[9px] text-[#c8f9dc]/70 leading-snug line-clamp-2 font-medium">
          {study.description || 'Clique para abrir o ebook e continuar a leitura.'}
        </p>
      </div>
    </article>
  );
}

export default function Refutation() {
  const [selectedStudy, setSelectedStudy] = useState<RefutationStudy | null>(null);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const studies = useMemo(() => loadRefutations(), []);

  const studiesByTheme = useMemo(() => {
    const map = new Map<string, RefutationStudy[]>();
    for (const study of studies) {
      const group = map.get(study.themeId) ?? [];
      group.push(study);
      map.set(study.themeId, group);
    }
    for (const [key, value] of map.entries()) {
      map.set(key, [...value].sort(sortByNewest));
    }
    return map;
  }, [studies]);

  const selectedTheme = selectedThemeId ? THEME_BY_ID[selectedThemeId] : null;

  const seriesInTheme = useMemo<[string, RefutationStudy[]][]>(() => {
    if (!selectedThemeId) return [];
    const themeStudies = studiesByTheme.get(selectedThemeId) ?? [];
    const grouped = themeStudies.reduce<Record<string, RefutationStudy[]>>((acc, study) => {
      (acc[study.series] ??= []).push(study);
      return acc;
    }, {});
    return Object.entries(grouped).map(([series, items]) => [series, [...items].sort(sortByVolume)]);
  }, [selectedThemeId, studiesByTheme]);

  if (selectedStudy) {
    return (
      <MarkdownViewer
        content={selectedStudy.content}
        slug={selectedStudy.slug}
        category="refutacao"
        onClose={() => setSelectedStudy(null)}
      />
    );
  }

  if (selectedTheme && selectedThemeId) {
    const themeStudies = studiesByTheme.get(selectedThemeId) ?? [];
    const cover = themeStudies[0]?.image || '/image/livraria da matrix/a paisagem da crise.webp';

    return (
      <div className="pt-6 pb-32 px-5 max-w-7xl mx-auto">
        <button
          onClick={() => setSelectedThemeId(null)}
          className="flex items-center gap-1.5 text-[#8ceab5]/80 hover:text-[#79ffad] transition-colors mb-5 active:scale-95 text-[10px] font-black uppercase tracking-widest"
        >
          <ChevronLeft size={15} />
          Livraria da Matrix
        </button>

        <article className="relative w-full h-44 rounded-2xl overflow-hidden border border-[#1ee07a]/30 mb-6 shadow-[0_0_45px_rgba(34,197,94,0.15)]">
          <AppImage src={cover} alt={selectedTheme.label} className="absolute inset-0 w-full h-full object-cover opacity-45" priority />
          <div className={`absolute inset-0 bg-gradient-to-r ${selectedTheme.accent}`} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
          <div className="relative h-full p-5 flex flex-col justify-end">
            <p className="mb-1 w-fit rounded-full border border-[#1ee07a]/45 bg-[#06110b]/85 px-2.5 py-1 text-[8px] font-mono font-bold uppercase tracking-[0.22em] text-[#93ffbf]">
              {selectedTheme.signal}
            </p>
            <h2 className="font-headline font-black text-2xl text-[#d8ffe9] tracking-tight uppercase leading-none">
              {selectedTheme.label}
            </h2>
            <p className="mt-1 text-[10px] text-[#b9f4d2]/78 max-w-lg leading-relaxed">
              {selectedTheme.subtitle}
            </p>
          </div>
        </article>

        {seriesInTheme.map(([series, items], index) => {
          const isSeries = items.length > 3;
          const seriesDescription = items.find((item) => item.description)?.description || selectedTheme.subtitle;
          return (
            <section key={series} className="mb-6">
              <div className="mb-2.5">
                <div className="mb-1">
                  <span className="inline-flex items-center rounded-full border border-[#1ee07a]/45 bg-[#07130d] px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-[#93ffbf]">
                    {isSeries ? 'SÉRIE' : 'COLEÇÃO'}
                  </span>
                </div>
                <h4 className="font-headline font-extrabold text-xl text-[#deffed] tracking-tighter uppercase leading-none">
                  {series}
                </h4>
                {seriesDescription && (
                  <p className="mt-1.5 text-[10px] text-[#baf4d2]/72 leading-snug font-medium max-w-sm">
                    {seriesDescription}
                  </p>
                )}
              </div>

              <div className="relative -mx-5 px-5">
                <DragScrollRow>
                  {items.map((study, volIndex) => (
                    <MatrixBookCard
                      key={study.pathKey}
                      study={study}
                      volIndex={volIndex}
                      onSelect={() => setSelectedStudy(study)}
                    />
                  ))}
                </DragScrollRow>
              </div>

              {index < seriesInTheme.length - 1 && (
                <div className="mt-3 px-1">
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-[#1ee07a]/70 to-transparent animate-[pulse_4.5s_ease-in-out_infinite]" />
                </div>
              )}
            </section>
          );
        })}
      </div>
    );
  }

  return (
    <div className="pt-6 pb-32 px-5 max-w-7xl mx-auto">
      <header className="mb-7 relative">
        <div className="absolute -top-20 -left-12 h-48 w-48 rounded-full bg-[#1ee07a]/10 blur-[90px]" />
        <div className="inline-flex items-center gap-2 rounded-full border border-[#1ee07a]/40 bg-[#07130d]/80 px-3 py-1 mb-3">
          <Shield size={12} className="text-[#8cffba]" />
          <span className="text-[9px] font-black uppercase tracking-[0.16em] text-[#8cffba]">
            Livraria da Matrix
          </span>
        </div>
        <h2 className="font-headline font-extrabold text-3xl text-[#d6ffe9] tracking-tighter mb-2 uppercase">
          LIVRARIA DA MATRIX
        </h2>
        <p className="text-[#b4f2cd]/75 text-[11px] max-w-2xl font-medium leading-relaxed">
          A ordem mundial opera sobre uma economia de revelação ritual. O sistema precisa anunciar seus movimentos por símbolos públicos, ficção preditiva e cerimônias. Esta sessão organiza essas leituras para discernimento estratégico.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REFUTATION_THEMES.map((theme) => {
          const themeStudies = studiesByTheme.get(theme.id) ?? [];
          const cover = themeStudies[0]?.image || '/image/livraria da matrix/a paisagem da crise.webp';
          return (
            <button
              key={theme.id}
              onClick={() => setSelectedThemeId(theme.id)}
              className="group relative w-full h-48 rounded-2xl overflow-hidden cursor-pointer active:scale-[0.99] transition-all duration-300 border border-[#1ee07a]/30 text-left shadow-[0_0_28px_rgba(34,197,94,0.12)]"
            >
              <AppImage
                src={cover}
                alt={theme.label}
                className="absolute inset-0 w-full h-full object-cover opacity-45 group-hover:opacity-60 group-hover:scale-105 transition-all duration-700"
              />
              <div className={`absolute inset-0 bg-gradient-to-r ${theme.accent}`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
              <div className="absolute inset-0 bg-[repeating-linear-gradient(180deg,rgba(34,197,94,0.07)_0px,rgba(34,197,94,0.07)_1px,transparent_1px,transparent_7px)] opacity-30 pointer-events-none" />
              <div className="relative h-full p-5 flex flex-col justify-between">
                <div className="inline-flex items-center gap-2 w-fit px-2 py-1 rounded-full border border-[#1ee07a]/40 bg-[#05100a]/75 backdrop-blur-sm">
                  <AlertTriangle size={12} className="text-[#9bffc3]" />
                  <span className="text-[9px] font-black uppercase tracking-[0.16em] text-[#9bffc3] font-mono">
                    {theme.signal}
                  </span>
                </div>
                <div>
                  <h3 className="font-headline font-black text-[22px] text-[#e0ffef] tracking-tight uppercase leading-none mb-1">
                    {theme.label}
                  </h3>
                  <p className="text-[10px] text-[#baf5d2]/72 leading-snug font-medium line-clamp-2">
                    {theme.subtitle}
                  </p>
                  <p className="mt-2 text-[9px] uppercase tracking-[0.14em] font-black text-[#9bffc3]/85">
                    {themeStudies.length} conteúdo{themeStudies.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </section>

      <section className="mt-7">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={13} className="text-[#86ffb8]" />
          <h3 className="font-headline text-[10px] uppercase tracking-[0.2em] font-bold text-[#c3f6d9]/85">
            Últimas Publicações
          </h3>
        </div>
        <div className="space-y-2">
          {studies.slice(0, 6).map((study) => (
            <article
              key={study.pathKey}
              onClick={() => setSelectedStudy(study)}
              className="rounded-xl border border-[#1ee07a]/25 bg-[#04100a]/85 backdrop-blur-sm px-3 py-2.5 flex items-center gap-2.5 cursor-pointer hover:scale-[1.01] transition-transform duration-300 shadow-[0_0_18px_rgba(34,197,94,0.10)]"
            >
              <div className="w-16 h-11 rounded-lg overflow-hidden border border-[#1ee07a]/20 shrink-0">
                <AppImage src={study.image} alt={study.title} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-headline text-[11px] font-extrabold tracking-tight text-[#e2fff0] line-clamp-1">
                  {study.title}
                </h4>
                <p className="text-[9px] text-[#b8f2cf]/70 line-clamp-1">
                  {study.description || 'Clique para abrir a análise.'}
                </p>
              </div>
              <Cpu size={14} className="text-[#85ffb8]/70 shrink-0" />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
