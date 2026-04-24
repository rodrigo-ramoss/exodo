import { useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  HeartPulse,
  Sparkles,
  Sword,
  Tent,
} from 'lucide-react';
import { pm } from '../lib/progressManager';
import { useFetch } from '../hooks/useFetch';
import { MarkdownViewer } from './MarkdownViewer';
import { AppImage } from './AppImage';

type TendaId = 'vida-espiritual' | 'vida-interior' | 'vida-exterior';

interface ManaTema {
  id: string;
  slug: string;
  badge: string;
  title: string;
  description?: string;
  status?: 'published' | 'planned';
  image?: string;
  file?: string;
}

interface ManaTenda {
  id: TendaId;
  label: string;
  numero: string;
  titulo: string;
  subtitulo: string;
  descricao: string;
  temas: ManaTema[];
}

interface ManaStudyItem {
  title: string;
  slug: string;
  description?: string;
  tenda?: TendaId;
  time?: string;
  image?: string;
  file?: string;
}

const MANA_TENDAS_META: Omit<ManaTenda, 'temas'>[] = [
  {
    id: 'vida-espiritual',
    label: 'TENDA 1 - VIDA ESPIRITUAL',
    numero: '01',
    titulo: 'Vida Espiritual',
    subtitulo: 'O núcleo da guerra',
    descricao:
      'Oração, guerra espiritual, discernimento, jejum, intimidade com Deus e armas espirituais para sustentar sua caminhada.',
  },
  {
    id: 'vida-interior',
    label: 'TENDA 2 - VIDA INTERIOR',
    numero: '02',
    titulo: 'Vida Interior',
    subtitulo: 'Emoções, mente e relacionamentos',
    descricao:
      'Estudos sobre ansiedade, depressão, cura interior, batalha da mente, casamento, sexualidade, perdão e vínculos espirituais.',
  },
  {
    id: 'vida-exterior',
    label: 'TENDA 3 - VIDA EXTERIOR',
    numero: '03',
    titulo: 'Vida Exterior',
    subtitulo: 'Trabalho, missão e sociedade',
    descricao:
      'Conteúdos sobre vocação, finanças, missão, evangelismo, cultura, influência, igreja e vida pública diante do Reino.',
  },
];

const FALLBACK_TEMAS: ManaTema[] = [
  {
    id: 'o-quarto-secreto',
    slug: 'vida-espiritual/o-quarto-secreto',
    badge: 'E-BOOK 01',
    title: 'O Quarto Secreto - Desenvolvendo uma Vida Devocional Poderosa',
    description:
      'A disciplina do encontro diário com Deus, a oração secreta e a vida devocional como fundamento da força espiritual.',
    status: 'published',
    image: '/image/mana/o quarto secreto.webp',
    file: 'tenda 1 vida espiritual/O Quarto Secreto — Desenvolvendo uma Vida Devocional Poderosa.md',
  },
  {
    id: 'fortalezas-mentais',
    slug: 'vida-espiritual/fortalezas-mentais',
    badge: 'E-BOOK 02',
    title: 'Fortalezas Mentais - Vencendo Pensamentos de Derrota',
    description:
      'Um estudo sobre pensamentos obsessivos, acusações, dúvidas e a renovação da mente pelas armas do Espírito.',
    status: 'published',
    image: '/image/mana/fortalezas mentais.webp',
    file: 'tenda 1 vida espiritual/Fortalezas Mentais — Vencendo Pensamentos de Derrota.md',
  },
  {
    id: 'jejum-arma-esquecida',
    slug: 'vida-espiritual/jejum-arma-esquecida',
    badge: 'E-BOOK 03',
    title: 'Jejum - A Arma Esquecida que Quebra Cadeias',
    description: 'Práticas bíblicas de jejum para quebrar cadeias espirituais e fortalecer a vida de santidade.',
    status: 'published',
    image: '/image/mana/jejum a arma esquecida que quebra cadeias.webp',
    file: 'tenda 1 vida espiritual/Jejum — A Arma Esquecida que Quebra Cadeias.md',
  },
  {
    id: 'o-vale-da-sombra',
    slug: 'vida-interior/o-vale-da-sombra',
    badge: 'E-BOOK 01',
    title: 'O Vale da Sombra - A Bíblia e a Depressão',
    status: 'published',
    image: '/image/mana/o vale da sombra biblia e depressao.webp',
    file: 'tenda 2 vida interior/O Vale da Sombra — A Bíblia e a Depressão.md',
  },
  {
    id: 'rejeicao-identidade-em-cristo',
    slug: 'vida-interior/rejeicao-identidade-em-cristo',
    badge: 'E-BOOK 02',
    title: 'Rejeição - Encontrando Identidade em Cristo',
    status: 'published',
    image: '/image/mana/rejeicao encontrando identidade em cristo.webp',
    file: 'tenda 2 vida interior/Rejeição — Encontrando Identidade em Cristo.md',
  },
  {
    id: 'namoro-e-solteirice',
    slug: 'vida-interior/namoro-e-solteirice',
    badge: 'E-BOOK 03',
    title: 'Namoro e Solteirice - Princípios do Reino para Relacionamentos Santos',
    status: 'published',
    image: '/image/mana/namoro e solterice.webp',
    file: 'tenda 2 vida interior/Namoro e Solteirice — Princípios do Reino para Relacionamentos Santos.md',
  },
  {
    id: 'trabalho-como-adoracao',
    slug: 'vida-exterior/trabalho-como-adoracao',
    badge: 'E-BOOK 01',
    title: 'Trabalho como Adoração - Descobrindo o Chamado de Deus para Sua Profissão',
    status: 'published',
    image: '/image/mana/trabalho como adoracao.webp',
    file: 'tenda 3 vida exterior/Trabalho como Adoração — Descobrindo o Chamado de Deus para Sua Profissão.md',
  },
  {
    id: 'embaixadores-do-reino',
    slug: 'vida-exterior/embaixadores-do-reino',
    badge: 'E-BOOK 02',
    title: 'Embaixadores do Reino - Como Compartilhar Sua Fé no Dia a Dia',
    status: 'published',
    image: '/image/mana/embaixadores do reino.webp',
    file: 'tenda 3 vida exterior/Embaixadores do Reino — Como Compartilhar Sua Fé no Dia a Dia.md',
  },
  {
    id: 'financas-do-reino',
    slug: 'vida-exterior/financas-do-reino',
    badge: 'E-BOOK 03',
    title: 'Finanças do Reino - Mordomia, Dívidas e Generosidade',
    status: 'published',
    image: '/image/mana/financas do reino.webp',
    file: 'tenda 3 vida exterior/Finanças do Reino — Mordomia, Dívidas e Generosidade.md',
  },
];

const manaMarkdownModules = import.meta.glob('/public/content/mana/**/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

const TENDA_ICON: Record<TendaId, typeof Sparkles> = {
  'vida-espiritual': Sword,
  'vida-interior': HeartPulse,
  'vida-exterior': BriefcaseBusiness,
};

const TENDA_BG: Record<TendaId, string> = {
  'vida-espiritual': 'from-[#251a12] via-[#171310] to-[#0f0f0f]',
  'vida-interior': 'from-[#241915] via-[#171312] to-[#101010]',
  'vida-exterior': 'from-[#201a13] via-[#151312] to-[#0f0f0f]',
};

function normalizeText(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function toRelativeManaPath(pathKey: string): string {
  const normalized = pathKey.replace(/\\/g, '/');
  const marker = '/public/content/mana/';
  const idx = normalized.indexOf(marker);
  if (idx < 0) return normalized;
  return normalized.slice(idx + marker.length);
}

function resolveTendaFromSlugOrFolder(slug: string, file?: string): TendaId {
  const combined = `${slug} ${file ?? ''}`.toLowerCase();
  if (combined.includes('interior')) return 'vida-interior';
  if (combined.includes('exterior')) return 'vida-exterior';
  return 'vida-espiritual';
}

function toTemaId(slug: string): string {
  return slug.split('/').pop() ?? slug;
}

function formatBadge(order: number): string {
  return `E-BOOK ${String(order).padStart(2, '0')}`;
}

function TemaProgress({ slug }: { slug: string }) {
  const progress = pm.getProgress('mana', slug);
  const isCompleted = pm.isRead('mana', slug);
  const readCount = pm.getReadCount('mana', slug);

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
      <p className="mt-1 text-[10px] font-semibold text-on-surface-variant/80">{status}</p>
    </div>
  );
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
        if (e.pointerType !== 'mouse') return;
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

function TemaPreviewCard({ tendaId, tema, onSelect }: { tendaId: TendaId; tema: ManaTema; onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect} className="relative shrink-0 w-[156px] sm:w-[168px] snap-start text-left">
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-primary/20">
        <div className={`absolute inset-0 bg-gradient-to-br ${TENDA_BG[tendaId]}`} />
        {tema.image && (
          <AppImage
            src={tema.image}
            alt={tema.title}
            className="absolute inset-0 h-full w-full object-cover"
            fallbackClassName="opacity-80"
          />
        )}
        <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_22%_18%,rgba(242,192,141,0.25),transparent_45%)]" />
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(242,192,141,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(242,192,141,0.08)_1px,transparent_1px)] [background-size:17px_17px]" />
      </div>
      {tema.description && <p className="mt-2 text-[10px] text-on-surface-variant leading-relaxed line-clamp-3">{tema.description}</p>}
      <TemaProgress slug={tema.slug} />
    </button>
  );
}

function TendaCard({ tenda, onEnter, onSelectTema }: { tenda: ManaTenda; onEnter: () => void; onSelectTema: (tema: ManaTema) => void }) {
  const Icon = TENDA_ICON[tenda.id];
  const rowRef = useRef<HTMLDivElement | null>(null);

  const scrollByAmount = (delta: number) => {
    rowRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-[#1f1a15] via-[#151312] to-[#101010] p-5 shadow-[0_18px_42px_rgba(0,0,0,0.38)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/55 hover:shadow-[0_22px_50px_rgba(0,0,0,0.5)]">
      <div className="pointer-events-none absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_90%_10%,rgba(242,192,141,0.2),transparent_45%)]" />
      <div className="pointer-events-none absolute right-2 top-0 text-[84px] font-black tracking-tighter text-primary/10 select-none">
        {tenda.numero}
      </div>

      <div className="relative z-10">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="inline-flex rounded-full border border-primary/35 bg-primary/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.17em] text-primary">
            {tenda.label}
          </span>
          <Icon size={16} className="text-primary/85" />
        </div>

        <h3 className="font-headline text-3xl leading-none font-black text-on-surface mb-2">{tenda.titulo}</h3>
        <p className="text-sm font-semibold text-primary/90 mb-2">{tenda.subtitulo}</p>
        <p className="text-xs text-on-surface-variant leading-relaxed mb-4">{tenda.descricao}</p>

        <div className="border-t border-primary/15 pt-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-primary/80">Temas desta tenda</p>
            <div className="hidden sm:flex items-center gap-1">
              <button
                type="button"
                onClick={() => scrollByAmount(-180)}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-outline-variant/40 bg-black/40 text-on-surface-variant hover:border-primary/50 hover:text-primary transition-colors"
                aria-label="Voltar temas"
              >
                <ChevronLeft size={12} />
              </button>
              <button
                type="button"
                onClick={() => scrollByAmount(180)}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-outline-variant/40 bg-black/40 text-on-surface-variant hover:border-primary/50 hover:text-primary transition-colors"
                aria-label="Avançar temas"
              >
                <ChevronRight size={12} />
              </button>
            </div>
          </div>

          <div ref={rowRef} className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tenda.temas.map((tema) => (
              <TemaPreviewCard key={tema.id} tendaId={tenda.id} tema={tema} onSelect={() => onSelectTema(tema)} />
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onEnter}
          className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary"
        >
          Entrar na tenda
          <ArrowRight size={12} className="transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      </div>
    </article>
  );
}

function TendaShelfCard({ tendaId, tema, onSelect }: { tendaId: TendaId; tema: ManaTema; onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect} className="group shrink-0 w-[172px] sm:w-[198px] flex flex-col snap-start text-left">
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden border border-primary/25">
        <div className={`absolute inset-0 bg-gradient-to-br ${TENDA_BG[tendaId]}`} />
        {tema.image && (
          <AppImage
            src={tema.image}
            alt={tema.title}
            className="absolute inset-0 h-full w-full object-cover"
            fallbackClassName="opacity-80"
          />
        )}
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_15%_16%,rgba(242,192,141,0.22),transparent_46%)]" />
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(242,192,141,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(242,192,141,0.08)_1px,transparent_1px)] [background-size:18px_18px]" />
      </div>

      <p className="mt-2 text-[10px] text-on-surface-variant leading-relaxed line-clamp-3">
        {tema.description || 'Tema preparado para receber conteúdo completo nesta tenda.'}
      </p>
      <TemaProgress slug={tema.slug} />
    </button>
  );
}

export default function Studies() {
  const [activeTendaId, setActiveTendaId] = useState<TendaId | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [markdownContent, setMarkdownContent] = useState<string | null>(null);

  const { data: fetchedStudies } = useFetch<ManaStudyItem[]>('/content/mana/index.json');

  const markdownByKey = useMemo(() => {
    const map = new Map<string, string>();

    Object.entries(manaMarkdownModules).forEach(([pathKey, content]) => {
      const relativePath = toRelativeManaPath(pathKey);
      const normalizedRelative = normalizeText(relativePath);
      const fileName = relativePath.split('/').pop() ?? relativePath;
      const fileStem = fileName.replace(/\.md$/i, '');

      map.set(normalizedRelative, content);
      map.set(normalizeText(fileName), content);
      map.set(normalizeText(fileStem), content);
    });

    return map;
  }, []);

  const temasFromContent = useMemo(() => {
    const items = fetchedStudies?.length ? fetchedStudies : FALLBACK_TEMAS;

    const grouped = new Map<TendaId, ManaTema[]>([
      ['vida-espiritual', []],
      ['vida-interior', []],
      ['vida-exterior', []],
    ]);

    const sortOrder: Record<TendaId, number> = {
      'vida-espiritual': 1,
      'vida-interior': 2,
      'vida-exterior': 3,
    };

    const sorted = [...items].sort((a, b) => {
      const tendaA = resolveTendaFromSlugOrFolder(a.slug, a.file);
      const tendaB = resolveTendaFromSlugOrFolder(b.slug, b.file);
      if (sortOrder[tendaA] !== sortOrder[tendaB]) return sortOrder[tendaA] - sortOrder[tendaB];
      return a.slug.localeCompare(b.slug);
    });

    const tendaCounters: Record<TendaId, number> = {
      'vida-espiritual': 0,
      'vida-interior': 0,
      'vida-exterior': 0,
    };

    sorted.forEach((item) => {
      const tendaId = item.tenda ?? resolveTendaFromSlugOrFolder(item.slug, item.file);
      tendaCounters[tendaId] += 1;
      grouped.get(tendaId)?.push({
        id: toTemaId(item.slug),
        slug: item.slug,
        badge: item.time || formatBadge(tendaCounters[tendaId]),
        title: item.title,
        description: item.description,
        status: 'published',
        image: item.image,
        file: item.file,
      });
    });

    return grouped;
  }, [fetchedStudies]);

  const tendas = useMemo<ManaTenda[]>(() => {
    return MANA_TENDAS_META.map((meta) => ({
      ...meta,
      temas: temasFromContent.get(meta.id) ?? [],
    }));
  }, [temasFromContent]);

  const activeTenda = useMemo(
    () => tendas.find((tenda) => tenda.id === activeTendaId) || null,
    [activeTendaId, tendas],
  );

  const handleCloseReader = () => {
    setSelectedSlug(null);
    setMarkdownContent(null);
  };

  const handleOpenTema = async (tema: ManaTema) => {
    setSelectedSlug(tema.slug);

    const candidates = [
      tema.file,
      tema.file?.split('/').pop(),
      tema.title,
      tema.slug.split('/').pop()?.replace(/-/g, ' '),
    ]
      .filter(Boolean)
      .map((value) => normalizeText(value ?? ''));

    const localContent = candidates
      .map((key) => markdownByKey.get(key))
      .find((content): content is string => Boolean(content && content.trim()));

    if (localContent) {
      setMarkdownContent(localContent);
      return;
    }

    if (tema.file) {
      const encodedPath = tema.file
        .split('/')
        .map((segment) => encodeURIComponent(segment))
        .join('/');
      const fallbackUrl = `/content/mana/${encodedPath}`;

      try {
        const res = await fetch(fallbackUrl, { cache: 'no-store' });
        if (res.ok) {
          const text = await res.text();
          if (text.trim()) {
            setMarkdownContent(text);
            return;
          }
        }
      } catch {
        // noop: fallback below
      }
    }

    setMarkdownContent('# Conteúdo ainda não encontrado\n\nVerifique se o arquivo markdown deste tema está na pasta de Maná.');
  };

  if (selectedSlug && markdownContent) {
    return <MarkdownViewer content={markdownContent} slug={selectedSlug} category="mana" onClose={handleCloseReader} />;
  }

  if (activeTenda) {
    return (
      <div className="pt-6 pb-28 px-4 sm:px-6 max-w-7xl mx-auto min-h-screen bg-surface-container-lowest">
        <section className="rounded-3xl border border-outline-variant/25 bg-gradient-to-b from-surface-container-low to-surface-container p-5 sm:p-6">
          <button
            type="button"
            onClick={() => setActiveTendaId(null)}
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/70 hover:text-primary transition-colors"
          >
            <ArrowLeft size={12} />
            Maná
          </button>

          <div className="mt-4 mb-5">
            <span className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-primary mb-2">
              {activeTenda.label}
            </span>
            <h2 className="font-headline text-3xl sm:text-4xl font-black tracking-tight text-on-surface uppercase">
              {activeTenda.titulo}
            </h2>
            <p className="text-sm text-primary/85 font-semibold mt-1">{activeTenda.subtitulo}</p>
            <p className="text-xs text-on-surface-variant leading-relaxed mt-2 max-w-3xl">{activeTenda.descricao}</p>
          </div>

          <div className="relative -mx-5 px-5 sm:-mx-6 sm:px-6 mt-6">
            <div className="pointer-events-none absolute -bottom-1 left-5 right-5 sm:left-6 sm:right-6 h-1 bg-gradient-to-r from-primary/30 via-outline-variant/10 to-transparent opacity-20" />
            <DragScrollRow>
              {activeTenda.temas.map((tema) => (
                <TendaShelfCard key={tema.id} tendaId={activeTenda.id} tema={tema} onSelect={() => void handleOpenTema(tema)} />
              ))}
            </DragScrollRow>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="pb-24 min-h-screen bg-surface-container-lowest">
      <div className="pt-8 px-4 sm:px-6 mb-8">
        <header className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-[#1f1a15] via-[#131110] to-[#0d0d0d] px-6 py-8 sm:px-8 sm:py-10 shadow-[0_24px_65px_rgba(0,0,0,0.58)]">
          <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_18%_20%,rgba(242,192,141,0.26),transparent_42%),radial-gradient(circle_at_78%_88%,rgba(212,165,116,0.16),transparent_36%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-10 [background-image:linear-gradient(rgba(242,192,141,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(242,192,141,0.05)_1px,transparent_1px)] [background-size:20px_20px]" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-3 py-1 mb-3">
              <Tent size={12} className="text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Seção Maná</span>
            </div>
            <h1 className="font-headline text-4xl sm:text-5xl font-black text-primary mb-2 tracking-tighter text-shadow-glow">
              MANA
            </h1>
            <p className="text-sm sm:text-base text-on-surface font-semibold mb-2">
              O alimento sólido para a batalha de hoje.
            </p>
            <p className="text-xs sm:text-sm text-on-surface-variant/90 leading-relaxed max-w-3xl">
              E-books e estudos profundos para fortalecer sua vida espiritual, curar sua vida interior e preparar você
              para cumprir sua missão no mundo.
            </p>
          </div>
        </header>
      </div>

      <section className="px-4 sm:px-6 pb-10">
        <div className="mb-4">
          <h2 className="font-headline text-2xl sm:text-3xl font-black tracking-tight text-on-surface">Escolha sua tenda</h2>
          <p className="text-xs text-on-surface-variant mt-1">
            Cada tenda conduz uma área da sua jornada. Escolha por onde deseja ser alimentado hoje.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {tendas.map((tenda) => (
            <TendaCard key={tenda.id} tenda={tenda} onEnter={() => setActiveTendaId(tenda.id)} onSelectTema={handleOpenTema} />
          ))}
        </div>
      </section>
    </div>
  );
}
