import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { BookMarked, Check, ChevronLeft, ChevronRight, Cpu, Sparkles } from 'lucide-react';
import { MarkdownViewer } from './MarkdownViewer';
import { AppImage } from './AppImage';
import { pm } from '../lib/progressManager';

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
    id: 'quem-controla-a-matrix',
    label: 'Quem Controla a Matrix?',
    subtitle:
      'Mapeamento documental das estruturas visíveis e invisíveis de poder: fundamentos, arquitetura global, ordens e ideologias que moldam o sistema.',
    accent: 'from-[#0b2a1b]/92 via-[#071910]/86 to-[#030807]/90',
    signal: 'MATRIX::SCAN',
  },
];

const THEME_BY_ID = Object.fromEntries(REFUTATION_THEMES.map((theme) => [theme.id, theme])) as Record<string, RefutationTheme>;

const MATRIX_BARCODE_COLUMNS = [
  { left: '4%', delay: '0.2s', duration: '10s' },
  { left: '12%', delay: '1.1s', duration: '12s' },
  { left: '21%', delay: '0.6s', duration: '11s' },
  { left: '32%', delay: '1.8s', duration: '9s' },
  { left: '44%', delay: '0.4s', duration: '13s' },
  { left: '57%', delay: '2.1s', duration: '10s' },
  { left: '68%', delay: '1.3s', duration: '12s' },
  { left: '79%', delay: '0.9s', duration: '11s' },
  { left: '90%', delay: '1.7s', duration: '10s' },
];

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
  'a-arquitetura-invisivel-belial-os-principes-e-as-hostes-da-mentira': 'a arquiterura invisivel.webp',
  'a-arquitetura-invisivel-belial-os-principes-e-as-hostias-da-mentira': 'a arquiterura invisivel.webp',
  'capa-tres-armadilhas': 'as tres armadilhas.webp',
  'as-tres-armadilhas-paranoia-militancia-e-escapismo': 'as tres armadilhas.webp',
};

const MATRIX_SERIES_DESCRIPTIONS: Record<string, string> = {
  'Fundamentos do Discernimento':
    'Base de discernimento cristão para ler sinais públicos com sobriedade: método, cosmovisão bíblica, guerra espiritual e maturidade para não cair em paranoia, militância ou escapismo.',
  'A Arquitetura Visível':
    'Mapeamento documental da camada humana do sistema: nós de poder, dinastias, ordens iniciáticas e ideologias que estruturam a governança global no plano visível.',
};

const refutationModules = {
  ...import.meta.glob('/public/content/babel/**/*.md', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/babel/**/*.mdx', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/babel/**/*.yaml', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/babel/**/*.yml', { eager: true, query: '?raw', import: 'default' }),
} as Record<string, string>;
const CONTENT_FILE_EXTENSION_REGEX = /\.(?:md|mdx|markdown|ya?ml)$/i;

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

function stripFrontmatter(markdown: string): string {
  const normalized = markdown.replace(/^\uFEFF/, '').trimStart();
  const match = normalized.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---\s*/);
  if (!match) return normalized;
  return normalized.slice(match[0].length).trim();
}

function slugify(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function normalizeDescription(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim();
}

function looksLikeVolumePreface(raw: string): boolean {
  const normalized = normalizeDescription(raw).toLowerCase();
  if (!normalized) return true;
  return /^(?:este|esse|esta|primeiro|segundo|terceiro|quarto|quinto)\b[\s\S]{0,80}\bvolume\b/.test(normalized);
}

function toPlainParagraph(raw: string): string {
  return normalizeDescription(
    raw
      .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
      .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
      .replace(/[`*_>#]/g, ' ')
      .replace(/^[-\d.)\s]+/g, ' ')
      .replace(/\|/g, ' ')
      .replace(/\s+/g, ' '),
  );
}

function truncate(raw: string, max = 230): string {
  if (raw.length <= max) return raw;
  return `${raw.slice(0, max - 1).trimEnd()}…`;
}

function pickInterestingExcerpt(content: string, fallback?: string): string {
  const body = stripFrontmatter(content);
  const paragraphs = body
    .split(/\r?\n\r?\n+/)
    .map((block) => toPlainParagraph(block))
    .filter((block) => block.length >= 70)
    .filter((block) => !/^(?:rodrigo ramos|serie:|indice|prefacio|capitulo|fim do livro)/i.test(block))
    .filter((block) => !looksLikeVolumePreface(block));

  if (paragraphs.length > 0) return truncate(paragraphs[0]);

  const cleanFallback = normalizeDescription(fallback || '');
  if (cleanFallback && !looksLikeVolumePreface(cleanFallback)) return truncate(cleanFallback);
  return 'Clique para abrir o ebook e continuar a leitura.';
}

function extractVolume(raw: string): number | null {
  const match = raw.match(/(?:ebook|livro|parte|volume|vol\.)\s*(\d{1,3})/i);
  if (!match) return null;
  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeSeriesName(folder: string, fallbackCategory?: string): string {
  const normalized = folder
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  if (normalized.includes('fundamentos do discernimento')) return 'Fundamentos do Discernimento';
  if (normalized.includes('arquiterura visivel') || normalized.includes('arquitetura visivel')) return 'A Arquitetura Visível';
  if (fallbackCategory && !fallbackCategory.toLowerCase().includes('matrix')) return fallbackCategory;

  const compact = folder.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!compact) return 'Coleção Matrix';
  return compact
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function resolveMatrixCover(frontmatter: Record<string, string>, title: string, fileStem: string): string {
  const fromMeta = (frontmatter.image || '').trim();
  if (fromMeta) {
    if (/^https?:\/\//i.test(fromMeta) || fromMeta.startsWith('/')) return fromMeta;
    const stem = slugify(fromMeta.replace(/\.[^.]+$/g, ''));
    const mapped = MATRIX_IMAGE_ALIASES[stem];
    if (mapped) return `/image/babel/${mapped}`;
  }

  const titleStem = slugify(title);
  const mappedByTitle = MATRIX_IMAGE_ALIASES[titleStem];
  if (mappedByTitle) return `/image/babel/${mappedByTitle}`;

  const fileStemSlug = slugify(fileStem.replace(/^ebook\s*\d+\s*-\s*/i, ''));
  const mappedByFile = MATRIX_IMAGE_ALIASES[fileStemSlug];
  if (mappedByFile) return `/image/babel/${mappedByFile}`;

  return '/image/babel/a paisagem da crise.webp';
}

function sortByNewest(a: RefutationStudy, b: RefutationStudy): number {
  const dateA = new Date(a.date ?? 0).getTime();
  const dateB = new Date(b.date ?? 0).getTime();
  if (dateA !== dateB) return dateB - dateA;
  return a.title.localeCompare(b.title, 'pt-BR');
}

function sortByVolume(a: RefutationStudy, b: RefutationStudy): number {
  if (a.volume !== null && b.volume !== null && a.volume !== b.volume) return a.volume - b.volume;
  if (a.volume !== null && b.volume === null) return -1;
  if (a.volume === null && b.volume !== null) return 1;
  return sortByNewest(a, b);
}

function loadRefutations(): RefutationStudy[] {
  return Object.entries(refutationModules)
    .map(([pathKey, content]) => {
      const normalizedPath = pathKey.replace(/\\/g, '/');
      const parts = normalizedPath.split('/');
      const contentIndex = parts.findIndex((part) => part === 'babel');
      const themeId = parts[contentIndex + 1] ?? 'quem-controla-a-matrix';
      const seriesFolder = parts[contentIndex + 2] ?? 'colecao';
      const fileName = parts[parts.length - 1] ?? '';
      const frontmatter = parseFrontmatter(content);
      const fileStem = fileName.replace(CONTENT_FILE_EXTENSION_REGEX, '');
      const title = frontmatter.title || fileStem;

      return {
        title,
        description: pickInterestingExcerpt(content, frontmatter.description),
        date: frontmatter.date,
        image: resolveMatrixCover(frontmatter, title, fileStem),
        slug: `${seriesFolder}/${fileStem}`,
        pathKey,
        content,
        themeId,
        series: normalizeSeriesName(seriesFolder, frontmatter.category),
        volume: extractVolume(fileStem) ?? extractVolume(title) ?? extractVolume(frontmatter.volume ?? ''),
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
      data-scroll-row="true"
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

function MatrixBarcodeRain() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {MATRIX_BARCODE_COLUMNS.map((column, index) => (
        <span
          key={`${column.left}-${index}`}
          className="absolute top-[-120px] w-[18px] h-40 rounded-sm border border-[#8bffc4]/20 bg-[repeating-linear-gradient(90deg,rgba(139,255,196,0.45)_0px,rgba(139,255,196,0.45)_1px,transparent_1px,transparent_3px)] opacity-0"
          style={{
            left: column.left,
            animation: `matrix-barcode-fall ${column.duration} linear ${column.delay} infinite`,
          }}
        />
      ))}
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
  const progress = pm.getProgress('refutacao', study.slug);
  const isCompleted = pm.isRead('refutacao', study.slug);
  const readsCount = pm.getReadCount('refutacao', study.slug);
  const progressPct = isCompleted ? 100 : Math.max(0, Math.min(100, Math.round(progress)));
  const isReading = progressPct > 0 && !isCompleted;

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
        {isCompleted && (
          <div className="absolute top-1.5 right-1.5 flex items-center gap-1 rounded-full bg-black/70 border border-[#8cffba]/70 px-1.5 py-0.5">
            <Check size={8} className="text-[#8cffba]" />
            <span className="text-[7px] font-black uppercase tracking-widest text-[#8cffba]">Lido</span>
          </div>
        )}
      </div>
      <div className="mt-2.5 px-0.5 select-none flex flex-col gap-1.5">
        <span className="text-[8px] font-black uppercase tracking-[0.15em] text-[#7dffb2]/80 leading-none">
          VOL. {String(volume).padStart(2, '0')}
        </span>
        <p className="text-[9px] text-[#c8f9dc]/70 leading-snug line-clamp-2 font-medium">
          {study.description || 'Clique para abrir o ebook e continuar a leitura.'}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <div className="h-1 flex-1 bg-[#0f1a13] rounded-full overflow-hidden border border-[#1ee07a]/20">
            <div
              className={
                isCompleted
                  ? 'h-full bg-gradient-to-r from-[#2df3a1] to-[#95ffd0] shadow-[0_0_6px_rgba(45,243,161,0.45)]'
                  : 'h-full bg-gradient-to-r from-[#1ee07a] to-[#80ffc1] shadow-[0_0_5px_rgba(34,197,94,0.4)]'
              }
              style={{ width: `${isReading || isCompleted ? progressPct : 0}%` }}
            />
          </div>
          {(isReading || isCompleted) && (
            <span className={`text-[8px] font-black leading-none shrink-0 ${isCompleted ? 'text-[#95ffd0]' : 'text-[#71ffb3]'}`}>
              {progressPct}%
            </span>
          )}
        </div>
        {readsCount > 0 && (
          <span className="text-[8px] font-black uppercase tracking-widest text-[#95ffd0]/80">
            Lido {readsCount}×
          </span>
        )}
      </div>
    </article>
  );
}

interface RefutationProps {
  openSlug?: string;
}

function clearOpenSlugFromUrl() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has('open')) return;
  url.searchParams.delete('open');
  const nextUrl = `${url.pathname}${url.search ? url.search : ''}`;
  window.history.replaceState(null, '', nextUrl);
}

export default function Refutation({ openSlug }: RefutationProps) {
  const [selectedStudy, setSelectedStudy] = useState<RefutationStudy | null>(null);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const themeSeriesRowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const studies = useMemo(() => loadRefutations(), []);

  const studiesByTheme = useMemo(() => {
    const map = new Map<string, RefutationStudy[]>();
    for (const study of studies) {
      const group = map.get(study.themeId) ?? [];
      group.push(study);
      map.set(study.themeId, group);
    }
    for (const [key, value] of map.entries()) map.set(key, [...value].sort(sortByNewest));
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

  const scrollThemeSeries = (seriesKey: string, delta: number) => {
    const wrapper = themeSeriesRowRefs.current[seriesKey];
    const row = wrapper?.querySelector<HTMLElement>('[data-scroll-row="true"]');
    row?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  useEffect(() => {
    if (!openSlug || selectedStudy) return;
    const matched = studies.find((study) => study.slug === openSlug);
    if (!matched) return;
    setSelectedStudy(matched);
    clearOpenSlugFromUrl();
  }, [openSlug, selectedStudy, studies]);

  if (selectedStudy) {
    return <MarkdownViewer content={selectedStudy.content} slug={selectedStudy.slug} category="refutacao" onClose={() => setSelectedStudy(null)} />;
  }

  if (selectedTheme && selectedThemeId) {
    const themeStudies = studiesByTheme.get(selectedThemeId) ?? [];
    const cover = themeStudies[0]?.image || '/image/babel/a paisagem da crise.webp';

    return (
      <div className="relative pt-6 pb-32 px-5 max-w-7xl mx-auto">
        <MatrixBarcodeRain />
        <button
          onClick={() => setSelectedThemeId(null)}
          className="relative flex items-center gap-1.5 text-[#8ceab5]/80 hover:text-[#79ffad] transition-colors mb-5 active:scale-95 text-[10px] font-black uppercase tracking-widest"
        >
          <ChevronLeft size={15} />
          BABEL
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
            <p className="mt-1 text-[10px] text-[#b9f4d2]/78 max-w-lg leading-relaxed">{selectedTheme.subtitle}</p>
          </div>
        </article>

        {seriesInTheme.map(([series, items], index) => {
          const isSeries = items.length > 3;
          const seriesDescription = MATRIX_SERIES_DESCRIPTIONS[series] || selectedTheme.subtitle;
          const seriesKey = `${selectedThemeId}-${slugify(series)}`;
          return (
            <section key={series} className="relative mb-6">
              <div className="mb-2.5">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center rounded-full border border-[#1ee07a]/45 bg-[#07130d] px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-[#93ffbf]">
                    {isSeries ? 'SÉRIE' : 'COLEÇÃO'}
                  </span>
                  <div className="hidden sm:flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => scrollThemeSeries(seriesKey, -240)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#1ee07a]/45 bg-[#07130d] text-[#baf4d2]/80 transition-colors hover:border-[#8cffba] hover:text-[#8cffba]"
                      aria-label={`Voltar ${series}`}
                    >
                      <ChevronLeft size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollThemeSeries(seriesKey, 240)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#1ee07a]/45 bg-[#07130d] text-[#baf4d2]/80 transition-colors hover:border-[#8cffba] hover:text-[#8cffba]"
                      aria-label={`Avançar ${series}`}
                    >
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
                <h4 className="font-headline font-extrabold text-xl text-[#deffed] tracking-tighter uppercase leading-none">{series}</h4>
                {seriesDescription && (
                  <p className="mt-1.5 text-[10px] text-[#baf4d2]/72 leading-snug font-medium max-w-sm">{seriesDescription}</p>
                )}
              </div>

              <div
                ref={(element) => {
                  themeSeriesRowRefs.current[seriesKey] = element;
                }}
                className="relative -mx-5 px-5"
              >
                <DragScrollRow>
                  {items.map((study, volIndex) => (
                    <MatrixBookCard key={study.pathKey} study={study} volIndex={volIndex} onSelect={() => setSelectedStudy(study)} />
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
    <div className="relative pt-6 pb-32 px-5 max-w-7xl mx-auto">
      <MatrixBarcodeRain />
      <header className="mb-7 relative">
        <div className="absolute -top-20 -left-12 h-48 w-48 rounded-full bg-[#1ee07a]/10 blur-[90px]" />
        <div className="inline-flex items-center gap-2 rounded-full border border-[#1ee07a]/40 bg-[#07130d]/80 px-3 py-1 mb-3">
          <BookMarked size={12} className="text-[#8cffba]" />
          <span className="text-[9px] font-black uppercase tracking-[0.16em] text-[#8cffba]">BABEL</span>
        </div>
        <h2 className="font-headline font-extrabold text-3xl text-[#d6ffe9] tracking-tighter mb-2 uppercase">BABEL</h2>
        <p className="text-[#b4f2cd]/75 text-[11px] max-w-2xl font-medium leading-relaxed">
          Arquiteturas de poder, narrativas de controle e discernimento estratégico para ler os sinais do sistema com método, sobriedade e base documental.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REFUTATION_THEMES.map((theme) => {
          const themeStudies = studiesByTheme.get(theme.id) ?? [];
          const cover = themeStudies[0]?.image || '/image/babel/a paisagem da crise.webp';
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
                  <BookMarked size={12} className="text-[#9bffc3]" />
                  <span className="text-[9px] font-black uppercase tracking-[0.16em] text-[#9bffc3] font-mono">{theme.signal}</span>
                </div>
                <div>
                  <h3 className="font-headline font-black text-[22px] text-[#e0ffef] tracking-tight uppercase leading-none mb-1">{theme.label}</h3>
                  <p className="text-[10px] text-[#baf5d2]/72 leading-snug font-medium line-clamp-2">{theme.subtitle}</p>
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
          <h3 className="font-headline text-[10px] uppercase tracking-[0.2em] font-bold text-[#c3f6d9]/85">Últimas Publicações</h3>
        </div>
        <div className="space-y-2">
          {studies.slice(0, 8).map((study) => (
            <article
              key={study.pathKey}
              onClick={() => setSelectedStudy(study)}
              className="rounded-xl border border-[#1ee07a]/25 bg-[#04100a]/85 backdrop-blur-sm px-3 py-2.5 flex items-center gap-2.5 cursor-pointer hover:scale-[1.01] transition-transform duration-300 shadow-[0_0_18px_rgba(34,197,94,0.10)]"
            >
              <div className="w-16 h-11 rounded-lg overflow-hidden border border-[#1ee07a]/20 shrink-0">
                <AppImage src={study.image} alt={study.title} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-headline text-[11px] font-extrabold tracking-tight text-[#e2fff0] line-clamp-1">{study.title}</h4>
                <p className="text-[9px] text-[#b8f2cf]/70 line-clamp-1">{study.description || 'Clique para abrir a análise.'}</p>
              </div>
              <Cpu size={14} className="text-[#85ffb8]/70 shrink-0" />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
