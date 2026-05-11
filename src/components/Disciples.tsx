import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Compass,
  Lock,
  Sparkles,
  Target,
  UserRound,
} from 'lucide-react';
import { pm } from '../lib/progressManager';
import { MarkdownViewer } from './MarkdownViewer';
import { AppImage } from './AppImage';

type JourneyId = 'fundamentos-mundo-invisivel' | 'regras-do-engajamento' | 'missao-e-multiplicacao';

interface DiscipleStep {
  id: string;
  slug: string;
  badge: string;
  title: string;
  description: string;
  image?: string;
  content?: string;
  order: number;
  status: 'published' | 'planned';
}

interface JourneyMeta {
  id: JourneyId;
  label: string;
  numero: string;
  titulo: string;
  subtitulo: string;
  descricao: string;
}

interface TestimonyEntry {
  slug: string;
  title: string;
  description: string;
  image?: string;
  content: string;
}

interface DisciplesProps {
  openSlug?: string;
}

const JOURNEY_META: JourneyMeta[] = [
  {
    id: 'fundamentos-mundo-invisivel',
    label: 'JORNADA 1 - FUNDAMENTOS DO MUNDO INVISÍVEL',
    numero: '01',
    titulo: 'Fundamentos do Mundo Invisível',
    subtitulo: 'Cosmovisão, guerra e discernimento',
    descricao:
      'Nesta jornada, você aprende a ler a realidade com a lente bíblica do mundo invisível, recuperando fundamentos que foram apagados pela fé superficial. Cada passo revela como a história espiritual molda decisões, crises e alianças no mundo visível. O objetivo é formar discípulos que discernem os tempos, permanecem no Corpo e caminham com consciência de missão.',
  },
  {
    id: 'regras-do-engajamento',
    label: 'JORNADA 2 - REGRAS DO ENGAJAMENTO',
    numero: '02',
    titulo: 'Regras do Engajamento',
    subtitulo: 'Mente apostólica e leitura bíblica',
    descricao:
      'Esta jornada aprofunda o método de interpretação e as regras de combate intelectual e espiritual para quem deseja maturidade no ensino. Você aprende a pensar como discípulo e não como consumidor de conteúdo. A proposta é fortalecer estrutura, método e constância para uma fé inegociável.',
  },
  {
    id: 'missao-e-multiplicacao',
    label: 'JORNADA 3 - MISSÃO E MULTIPLICAÇÃO',
    numero: '03',
    titulo: 'Missão e Multiplicação',
    subtitulo: 'Discípulos que formam discípulos',
    descricao:
      'A última jornada prepara você para sair da formação para a missão, com visão de Reino, serviço e multiplicação. O foco é transformar conhecimento em prática, presença e legado no Corpo de Cristo. Cada passo será liberado para consolidar chamada, direção e responsabilidade ministerial.',
  },
];

const JOURNEY_ICON: Record<JourneyId, typeof Sparkles> = {
  'fundamentos-mundo-invisivel': Sparkles,
  'regras-do-engajamento': Compass,
  'missao-e-multiplicacao': Target,
};

const JOURNEY_BG: Record<JourneyId, string> = {
  'fundamentos-mundo-invisivel': 'from-[#1f1a15] via-[#151312] to-[#0f0f0f]',
  'regras-do-engajamento': 'from-[#221915] via-[#161211] to-[#0f0f0f]',
  'missao-e-multiplicacao': 'from-[#201912] via-[#151210] to-[#0f0f0f]',
};

const disciplesMarkdownModules = {
  ...import.meta.glob('/public/content/discipulos/**/*.md', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/discipulos/**/*.mdx', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/discipulos/**/*.yaml', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/discipulos/**/*.yml', { eager: true, query: '?raw', import: 'default' }),
} as Record<string, string>;

const disciplesImageModules = {
  ...import.meta.glob('/public/image/discipulos/**/*.webp'),
  ...import.meta.glob('/public/image/discipulos/**/*.png'),
  ...import.meta.glob('/public/image/discipulos/**/*.jpg'),
  ...import.meta.glob('/public/image/discipulos/**/*.jpeg'),
} as Record<string, unknown>;

const CONTENT_FILE_EXTENSION_REGEX = /\.(?:md|mdx|markdown|ya?ml)$/i;

function normalizeText(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toPathSlug(raw: string): string {
  const normalized = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9/]+/g, '-')
    .replace(/\/+/g, '/')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '');

  return normalized
    .split('/')
    .map((part) => part.replace(/(^-|-$)/g, ''))
    .filter(Boolean)
    .join('/');
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

function titleCase(raw: string): string {
  return raw
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function inferJourneyId(pathOrTema: string): JourneyId {
  const normalized = normalizeText(pathOrTema);
  if (normalized.includes('jornada 2') || normalized.includes('regras do engajamento')) return 'regras-do-engajamento';
  if (normalized.includes('jornada 3') || normalized.includes('missao')) return 'missao-e-multiplicacao';
  return 'fundamentos-mundo-invisivel';
}

function extractStepOrder(raw: string): number {
  const match = normalizeText(raw).match(/passo\s*(\d{1,2})/i);
  if (match) return Number.parseInt(match[1], 10);
  return 99;
}

function normalizeImageStem(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildImageLookup(): Map<string, string> {
  const lookup = new Map<string, string>();
  for (const pathKey of Object.keys(disciplesImageModules)) {
    const normalized = pathKey.replace(/\\/g, '/');
    if (!normalized.startsWith('/public/image/discipulos/')) continue;
    const fileName = normalized.split('/').pop();
    if (!fileName) continue;
    lookup.set(normalizeImageStem(fileName), normalized.slice('/public'.length));
  }
  return lookup;
}

const DISCIPLES_IMAGE_LOOKUP = buildImageLookup();
const DISCIPLES_IMAGE_PATHS = new Set(Array.from(DISCIPLES_IMAGE_LOOKUP.values()));

function resolveCover(frontmatter: Record<string, string>, title: string, fileStem: string): string | undefined {
  const fromMeta = (frontmatter.image || frontmatter.cover || frontmatter.capa || '').trim();
  if (fromMeta.startsWith('/')) {
    const normalizedMeta = fromMeta.startsWith('/public/') ? fromMeta.slice('/public'.length) : fromMeta;
    if (DISCIPLES_IMAGE_PATHS.has(normalizedMeta)) return normalizedMeta;
    const metaStem = normalizeImageStem(normalizedMeta.split('/').pop() || normalizedMeta);
    const mappedFromMeta = DISCIPLES_IMAGE_LOOKUP.get(metaStem);
    if (mappedFromMeta) return mappedFromMeta;
  }

  const titleStem = normalizeImageStem(title.split('—')[0] || title);
  const fileStemNorm = normalizeImageStem(fileStem.replace(/^passo\s*\d+\s*-\s*/i, '').trim());

  const directByTitle = DISCIPLES_IMAGE_LOOKUP.get(titleStem);
  if (directByTitle) return directByTitle;

  const directByStem = DISCIPLES_IMAGE_LOOKUP.get(fileStemNorm);
  if (directByStem) return directByStem;

  for (const [stem, imagePath] of DISCIPLES_IMAGE_LOOKUP.entries()) {
    if (titleStem.includes(stem) || stem.includes(titleStem) || fileStemNorm.includes(stem) || stem.includes(fileStemNorm)) {
      return imagePath;
    }
  }

  return undefined;
}

function formatBadge(order: number): string {
  return `PASSO ${String(order).padStart(2, '0')}`;
}

function defaultStepDescription(journeyId: JourneyId): string {
  if (journeyId === 'fundamentos-mundo-invisivel') return 'Conteúdo desta etapa em preparação para liberação.';
  if (journeyId === 'regras-do-engajamento') return 'Esta etapa será liberada com os próximos fundamentos de leitura e formação.';
  return 'Conteúdo desta etapa em preparação para liberação.';
}

function discoverDisciplesSteps() {
  const grouped = new Map<JourneyId, DiscipleStep[]>([
    ['fundamentos-mundo-invisivel', []],
    ['regras-do-engajamento', []],
    ['missao-e-multiplicacao', []],
  ]);

  for (const [pathKey, content] of Object.entries(disciplesMarkdownModules)) {
    const normalizedPath = pathKey.replace(/\\/g, '/');
    const marker = '/public/content/discipulos/';
    if (!normalizedPath.includes(marker)) continue;

    const relativePath = normalizedPath.slice(normalizedPath.indexOf(marker) + marker.length);
    const withoutExt = relativePath.replace(CONTENT_FILE_EXTENSION_REGEX, '');
    const parts = withoutExt.split('/').filter(Boolean);
    if (parts.length < 2) continue;

    const fileStem = parts[parts.length - 1] ?? '';
    if (!fileStem) continue;

    const frontmatter = parseFrontmatter(content);
    const title = (frontmatter.title || titleCase(fileStem)).trim();
    const description = (frontmatter.description || '').trim();
    const journeyFromPath = inferJourneyId(`${parts[0] || ''} ${frontmatter.tema || ''}`);
    const order = extractStepOrder(`${fileStem} ${title}`);
    const slug = toPathSlug(withoutExt);

    grouped.get(journeyFromPath)?.push({
      id: `${journeyFromPath}-${slug}`,
      slug,
      badge: formatBadge(order),
      title,
      description: description || defaultStepDescription(journeyFromPath),
      image: resolveCover(frontmatter, title, fileStem),
      content,
      order,
      status: 'published',
    });
  }

  const withPlaceholders = new Map<JourneyId, DiscipleStep[]>();
  const targetCount = 5;

  for (const meta of JOURNEY_META) {
    const base = [...(grouped.get(meta.id) ?? [])].sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.title.localeCompare(b.title);
    });

    const padded = [...base];
    for (let index = padded.length + 1; index <= targetCount; index += 1) {
      padded.push({
        id: `${meta.id}-planned-${index}`,
        slug: `${meta.id}/passo-${index}-em-preparacao`,
        badge: formatBadge(index),
        title: `Passo ${index} - Em preparação`,
        description: defaultStepDescription(meta.id),
        order: index,
        status: 'planned',
      });
    }

    withPlaceholders.set(meta.id, padded);
  }

  return withPlaceholders;
}

function discoverTestimonyEntry(): TestimonyEntry | null {
  for (const [pathKey, content] of Object.entries(disciplesMarkdownModules)) {
    const normalizedPath = pathKey.replace(/\\/g, '/');
    const marker = '/public/content/discipulos/';
    if (!normalizedPath.includes(marker)) continue;

    const relativePath = normalizedPath.slice(normalizedPath.indexOf(marker) + marker.length);
    const withoutExt = relativePath.replace(CONTENT_FILE_EXTENSION_REGEX, '');
    const parts = withoutExt.split('/').filter(Boolean);
    if (parts.length !== 1) continue;

    const frontmatter = parseFrontmatter(content);
    const title = (frontmatter.title || titleCase(withoutExt)).trim();
    const normalizedTitle = normalizeText(title);
    const normalizedPathLabel = normalizeText(withoutExt);
    if (!normalizedTitle.includes('a ferida e o ficar') && !normalizedPathLabel.includes('a ferida e o ficar')) {
      continue;
    }

    return {
      slug: toPathSlug(withoutExt),
      title,
      description: (frontmatter.description || '').trim(),
      image: resolveCover(frontmatter, title, withoutExt),
      content,
    };
  }

  return null;
}

function clearOpenSlugFromUrl() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has('open')) return;
  url.searchParams.delete('open');
  const nextUrl = `${url.pathname}${url.search ? url.search : ''}`;
  window.history.replaceState(null, '', nextUrl);
}

function StepProgress({ slug, published }: { slug: string; published: boolean }) {
  if (!published) {
    return <p className="mt-1 text-[9px] sm:text-[10px] font-semibold text-on-surface-variant/80">Em preparação</p>;
  }

  const progress = pm.getProgress('discipulos', slug);
  const isCompleted = pm.isRead('discipulos', slug);
  const readCount = pm.getReadCount('discipulos', slug);

  let status = 'Não iniciado';
  if (isCompleted) {
    status = `Lido ${readCount} ${readCount === 1 ? 'vez' : 'vezes'}`;
  } else if (progress > 0) {
    status = `Em leitura: ${progress}%`;
  }

  return (
    <div className="mt-2">
      <div className="h-1.5 w-full rounded-full bg-surface-container-high overflow-hidden border border-outline-variant/15">
        <div
          className={isCompleted ? 'h-full bg-gradient-to-r from-[#D4AF37] to-[#F5D76E]' : 'h-full bg-gradient-to-r from-orange-500 to-yellow-400'}
          style={{ width: `${isCompleted ? 100 : progress}%` }}
        />
      </div>
      <p className="mt-1 text-[9px] sm:text-[10px] font-semibold text-on-surface-variant/80">{status}</p>
    </div>
  );
}

function DragScrollRow({ children }: { children: ReactNode }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ isDown: false, startX: 0, scrollLeft: 0, didDrag: false });

  return (
    <div
      ref={rowRef}
      className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 sm:pb-4 snap-x snap-mandatory cursor-grab active:cursor-grabbing [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      onClickCapture={(event) => {
        if (drag.current.didDrag) {
          event.preventDefault();
          event.stopPropagation();
          drag.current.didDrag = false;
        }
      }}
      onPointerDown={(event) => {
        if (event.pointerType !== 'mouse') return;
        const el = rowRef.current;
        if (!el) return;
        drag.current = { isDown: true, startX: event.clientX, scrollLeft: el.scrollLeft, didDrag: false };
      }}
      onPointerMove={(event) => {
        if (event.pointerType !== 'mouse' || !drag.current.isDown) return;
        const el = rowRef.current;
        if (!el) return;
        const walk = event.clientX - drag.current.startX;
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

function StepCoverCard({
  journeyId,
  step,
  compact = false,
  onSelect,
}: {
  journeyId: JourneyId;
  step: DiscipleStep;
  compact?: boolean;
  onSelect?: () => void;
}) {
  const isPublished = step.status === 'published' && Boolean(step.content);

  return (
    <button
      type="button"
      onClick={() => {
        if (!isPublished || !onSelect) return;
        onSelect();
      }}
      className={`${compact ? 'w-[132px] sm:w-[148px]' : 'w-[156px] sm:w-[198px]'} shrink-0 snap-start text-left ${isPublished ? '' : 'cursor-default'}`}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="rounded-full border border-primary/30 bg-black/45 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.18em] text-primary">
          {step.badge}
        </span>
        {!isPublished && (
          <span className="rounded-full border border-outline-variant/35 bg-black/45 p-1 text-on-surface-variant/80">
            <Lock size={10} />
          </span>
        )}
      </div>

      <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-primary/25">
        <div className={`absolute inset-0 bg-gradient-to-br ${JOURNEY_BG[journeyId]}`} />
        {step.image && (
          <AppImage
            src={step.image}
            alt={step.title}
            className={`absolute inset-0 h-full w-full object-cover ${isPublished ? '' : 'opacity-70 grayscale-[0.3]'}`}
            fallbackClassName="opacity-75"
          />
        )}
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_16%_16%,rgba(242,192,141,0.22),transparent_46%)]" />
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(242,192,141,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(242,192,141,0.08)_1px,transparent_1px)] [background-size:18px_18px]" />
      </div>

      <p className="mt-1.5 sm:mt-2 text-[9px] sm:text-[10px] text-on-surface-variant leading-relaxed line-clamp-3">
        {step.description}
      </p>
      {!isPublished && (
        <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.14em] text-primary/90">
          Em preparação
        </p>
      )}
      <StepProgress slug={step.slug} published={isPublished} />
    </button>
  );
}

function JourneyCard({
  journey,
  steps,
  onEnter,
  onSelectStep,
}: {
  journey: JourneyMeta;
  steps: DiscipleStep[];
  onEnter: () => void;
  onSelectStep: (step: DiscipleStep) => void;
}) {
  const Icon = JOURNEY_ICON[journey.id];
  const rowRef = useRef<HTMLDivElement | null>(null);
  const previewSteps = steps;

  const scrollByAmount = (delta: number) => {
    rowRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-[#1f1a15] via-[#151312] to-[#101010] p-4 sm:p-5 shadow-[0_18px_42px_rgba(0,0,0,0.38)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/55 hover:shadow-[0_22px_50px_rgba(0,0,0,0.5)]">
      <div className="pointer-events-none absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_90%_10%,rgba(242,192,141,0.2),transparent_45%)]" />
      <div className="pointer-events-none absolute right-2 top-0 text-[62px] sm:text-[84px] font-black tracking-tighter text-primary/10 select-none">
        {journey.numero}
      </div>

      <div className="relative z-10">
        <div className="mb-2.5 sm:mb-3 flex items-center justify-between gap-2">
          <span className="inline-flex rounded-full border border-primary/35 bg-primary/10 px-2 py-0.5 sm:py-1 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.17em] text-primary">
            {journey.label}
          </span>
          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary/85" />
        </div>

        <h3 className="font-headline text-2xl sm:text-3xl leading-none font-black text-on-surface mb-1.5 sm:mb-2">{journey.titulo}</h3>
        <p className="text-xs sm:text-sm font-semibold text-primary/90 mb-1.5 sm:mb-2">{journey.subtitulo}</p>
        <p className="text-[11px] sm:text-xs text-on-surface-variant leading-relaxed mb-3 sm:mb-4">{journey.descricao}</p>

        <div className="border-t border-primary/15 pt-2.5 sm:pt-3">
          <div className="mb-1.5 sm:mb-2 flex items-center justify-between">
            <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.18em] text-primary/80">Caminhos desta jornada</p>
            <div className="hidden sm:flex items-center gap-1">
              <button
                type="button"
                onClick={() => scrollByAmount(-180)}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-outline-variant/40 bg-black/40 text-on-surface-variant hover:border-primary/50 hover:text-primary transition-colors"
                aria-label="Voltar caminhos"
              >
                <ChevronLeft size={12} />
              </button>
              <button
                type="button"
                onClick={() => scrollByAmount(180)}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-outline-variant/40 bg-black/40 text-on-surface-variant hover:border-primary/50 hover:text-primary transition-colors"
                aria-label="Avançar caminhos"
              >
                <ChevronRight size={12} />
              </button>
            </div>
          </div>

          <div ref={rowRef} className="flex gap-2.5 sm:gap-3 overflow-x-auto snap-x snap-mandatory pb-1.5 sm:pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {previewSteps.map((step) => (
              <StepCoverCard key={step.id} journeyId={journey.id} step={step} compact onSelect={() => onSelectStep(step)} />
            ))}
          </div>
        </div>

        <button type="button" onClick={onEnter} className="mt-3 sm:mt-4 inline-flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-primary">
          Entrar na jornada
          <ArrowRight size={12} className="transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      </div>
    </article>
  );
}

export default function Disciples({ openSlug }: DisciplesProps) {
  const [activeJourneyId, setActiveJourneyId] = useState<JourneyId | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [markdownContent, setMarkdownContent] = useState<string | null>(null);

  const stepsByJourney = useMemo(() => discoverDisciplesSteps(), []);
  const allSteps = useMemo(() => Array.from(stepsByJourney.values()).flat(), [stepsByJourney]);
  const testimony = useMemo(() => discoverTestimonyEntry(), []);

  const activeJourney = useMemo(
    () => JOURNEY_META.find((journey) => journey.id === activeJourneyId) || null,
    [activeJourneyId],
  );

  const handleOpenStep = (step: DiscipleStep) => {
    if (step.status !== 'published' || !step.content) return;
    setSelectedSlug(step.slug);
    setMarkdownContent(step.content);
  };

  const testimonyCover = testimony?.image;

  const handleOpenTestimony = () => {
    if (!testimony) return;
    setSelectedSlug(testimony.slug);
    setMarkdownContent(testimony.content);
  };

  useEffect(() => {
    if (!openSlug || selectedSlug) return;
    const target = allSteps.find((step) => step.slug === openSlug && step.status === 'published' && step.content);
    if (!target) return;
    handleOpenStep(target);
    clearOpenSlugFromUrl();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openSlug, selectedSlug, allSteps]);

  if (selectedSlug && markdownContent) {
    return (
      <MarkdownViewer
        content={markdownContent}
        slug={selectedSlug}
        category="discipulos"
        onClose={() => {
          setSelectedSlug(null);
          setMarkdownContent(null);
        }}
      />
    );
  }

  if (activeJourney) {
    const journeySteps = stepsByJourney.get(activeJourney.id) ?? [];

    return (
      <div className="pt-4 sm:pt-6 pb-24 sm:pb-28 px-4 sm:px-6 max-w-7xl mx-auto min-h-screen bg-surface-container-lowest">
        <section className="rounded-3xl border border-outline-variant/25 bg-gradient-to-b from-surface-container-low to-surface-container p-4 sm:p-6">
          <button
            type="button"
            onClick={() => setActiveJourneyId(null)}
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/70 hover:text-primary transition-colors"
          >
            <ArrowLeft size={12} />
            Discípulos
          </button>

          <div className="mt-3 sm:mt-4 mb-4 sm:mb-5">
            <span className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 sm:py-1 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.18em] text-primary mb-1.5 sm:mb-2">
              {activeJourney.label}
            </span>
            <h2 className="font-headline text-2xl sm:text-4xl font-black tracking-tight text-on-surface uppercase">{activeJourney.titulo}</h2>
            <p className="text-xs sm:text-sm text-primary/85 font-semibold mt-1">{activeJourney.subtitulo}</p>
            <p className="text-[11px] sm:text-xs text-on-surface-variant leading-relaxed mt-1.5 sm:mt-2 max-w-3xl">{activeJourney.descricao}</p>
          </div>

          <div className="relative -mx-4 px-4 sm:-mx-6 sm:px-6 mt-4 sm:mt-6">
            <div className="mb-2">
              <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.18em] text-primary/80">Caminhos desta jornada</p>
            </div>
            <div className="pointer-events-none absolute -bottom-1 left-5 right-5 sm:left-6 sm:right-6 h-1 bg-gradient-to-r from-primary/30 via-outline-variant/10 to-transparent opacity-20" />
            <DragScrollRow>
              {journeySteps.map((step) => (
                <StepCoverCard key={step.id} journeyId={activeJourney.id} step={step} onSelect={() => handleOpenStep(step)} />
              ))}
            </DragScrollRow>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="pb-20 sm:pb-24 min-h-screen bg-surface-container-lowest">
      <div className="pt-6 sm:pt-8 px-4 sm:px-6 mb-6 sm:mb-8">
        <header className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-[#1f1a15] via-[#131110] to-[#0d0d0d] px-4 sm:px-8 py-6 sm:py-10 shadow-[0_24px_65px_rgba(0,0,0,0.58)]">
          <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_18%_20%,rgba(242,192,141,0.26),transparent_42%),radial-gradient(circle_at_78%_88%,rgba(212,165,116,0.16),transparent_36%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-10 [background-image:linear-gradient(rgba(242,192,141,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(242,192,141,0.05)_1px,transparent_1px)] [background-size:20px_20px]" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-2.5 sm:px-3 py-0.5 sm:py-1 mb-2.5 sm:mb-3">
              <UserRound size={12} className="text-primary" />
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.22em] text-primary">Seção Discípulos</span>
            </div>
            <h1 className="font-headline text-3xl sm:text-5xl font-black text-primary mb-1.5 sm:mb-2 tracking-tighter text-shadow-glow">
              DISCÍPULOS
            </h1>
            <p className="text-[11px] sm:text-sm text-on-surface-variant/90 leading-relaxed max-w-3xl">
              Nesta área, você atravessa fundamentos espirituais que reorganizam sua leitura da Bíblia e da realidade.
              As jornadas conectam cosmovisão, método e prática para formar discernimento, firmeza doutrinária e permanência no Corpo.
              Cada passo foi desenhado para transformar informação em obediência, caráter e missão no Reino.
            </p>
          </div>
        </header>
      </div>

      <section className="px-4 sm:px-6 pb-8 sm:pb-10">
        <div className="mb-3 sm:mb-4">
          <h2 className="font-headline text-xl sm:text-3xl font-black tracking-tight text-on-surface">Escolha sua jornada</h2>
          <p className="text-xs text-on-surface-variant mt-1">
            Cada jornada cobre uma frente do discipulado. Comece pela base e avance com constância.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 sm:gap-4">
          {JOURNEY_META.map((journey) => (
            <JourneyCard
              key={journey.id}
              journey={journey}
              steps={stepsByJourney.get(journey.id) ?? []}
              onEnter={() => setActiveJourneyId(journey.id)}
              onSelectStep={handleOpenStep}
            />
          ))}
        </div>
      </section>

      <section className="px-4 sm:px-6 pb-24 sm:pb-28">
        <article className="rounded-3xl border border-primary/30 bg-gradient-to-br from-[#1f1a15] via-[#151312] to-[#0f0f0f] p-4 sm:p-5 shadow-[0_18px_42px_rgba(0,0,0,0.38)]">
          <span className="inline-flex rounded-full border border-primary/35 bg-primary/10 px-2 py-0.5 sm:py-1 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.17em] text-primary mb-3">
            Meu testemunho
          </span>

          <button
            type="button"
            onClick={handleOpenTestimony}
            className="w-full text-left grid grid-cols-1 md:grid-cols-[168px_1fr] gap-3 sm:gap-4 items-start"
          >
            <div className="w-full max-w-[168px]">
              <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-primary/25 bg-black/45">
                {testimonyCover ? (
                  <AppImage src={testimonyCover} alt="A Ferida e o Ficar" className="h-full w-full object-cover" fallbackClassName="opacity-70" />
                ) : (
                  <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(242,192,141,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(242,192,141,0.08)_1px,transparent_1px)] [background-size:18px_18px]" />
                )}
              </div>
            </div>

            <div>
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.16em] text-primary/90 font-black">Meu testemunho de vida, de discipulado e minha missão</p>
              <h3 className="mt-1 font-headline text-lg sm:text-2xl leading-tight font-black text-on-surface">
                {testimony?.title || 'A Ferida e o Ficar — Um Chamado à Resistência no Corpo de Cristo'}
              </h3>
              <p className="mt-2 text-[11px] sm:text-sm text-on-surface-variant/90 leading-relaxed">
                {testimony?.description || 'Um testemunho pessoal de Rodrigo Ramos sobre depressão, crise institucional, e a decisão radical de permanecer congregando sem se curvar ao sistema religioso. Um manifesto pelo Corpo, contra o isolamento, ancorado na teologia paulina.'}
              </p>
            </div>
          </button>
        </article>
      </section>
    </div>
  );
}
