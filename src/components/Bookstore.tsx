import { useState, useRef, useMemo, type ReactNode } from 'react';
import { ChevronLeft, Shield, BookOpen, Zap, Cpu, Eye, Layers, Check, Flame } from 'lucide-react';
import { pm } from '../lib/progressManager';
import { useFetch } from '../hooks/useFetch';
import { MarkdownViewer } from './MarkdownViewer';
import { AppImage } from './AppImage';

// ── Types ─────────────────────────────────────────────────────────────────────
interface BookItem {
  title: string;
  slug: string;
  description: string;
  date: string;
  category: string;
  time: string;
  image?: string;
}

const livrariaMarkdownModules = import.meta.glob('/public/content/livraria/**/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

const COVER_EXTENSIONS = ['webp', 'png', 'jpg', 'jpeg'] as const;

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

function slugify(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function normalizeTitlePreservingPunctuation(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function pickCategoryByFolder(folder: string): string {
  const key = folder.toLowerCase();
  const dynamicMap: Array<[string, string]> = [
    ['serie - o codigo dos arquetipos', 'TIPOLOGIA BÍBLICA'],
    ['serie - o codigo do jardim', 'Série — O Código do Jardim'],
    ['serie - o guerreiro divino', 'Série — O Guerreiro Divino'],
    ['serie - a queda do mundo espiritual', 'Série — A Queda do Mundo Espiritual'],
    ['serie - a queda do querubim ungido', 'Série — A Queda do Querubim Ungido'],
    ['serie - a onisciencia como atributo exclusivo', 'Série — A Onisciência como Atributo Exclusivo'],
    ['serie - sombras do reino de deus', 'SOMBRAS DO REINO DE DEUS'],
    ['serie - a verdadeira historia da igreja', 'Série — A Verdadeira História da Igreja'],
    ['serie - o codigo das eras', 'Série — O Código das Eras'],
    ['serie - jubileus', 'SÉRIE — JUBILEUS'],
    ['serie - 1 enoque', 'A REVELAÇÃO DE ENOQUE'],
    ['trilogia - o mapa da tempestade', 'Trilogia — O Mapa da Tempestade'],
    ['trilogia - o estrangeiro prospero', 'Trilogia — O Estrangeiro Próspero'],
    ['trilogia - a ciencia dos tempos', 'Trilogia — A Ciência dos Tempos'],
    ['trilogia - a marca', 'Trilogia — A Marca'],
    ['trilogia - o canon oculto', 'Trilogia — O Cânon Oculto'],
    ['trilogia - o veu rasgado', 'Trilogia — O Véu Rasgado'],
    ['trilogia - a coroa roubada', 'Trilogia — A Coroa Roubada'],
  ];

  for (const [matchFolder, category] of dynamicMap) {
    if (key.includes(matchFolder)) return category;
  }

  return folder;
}

function toLivrariaRelativePath(pathKey: string): string {
  const normalized = pathKey.replace(/\\/g, '/');
  const marker = '/public/content/livraria/';
  return normalized.includes(marker) ? normalized.slice(normalized.indexOf(marker) + marker.length) : normalized;
}

function stripMarkdownExtension(path: string): string {
  return path.replace(/\.md$/i, '');
}

function normalizeSlugLookupKey(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\\/g, '/')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function buildMarkdownBySlugIndex(): Record<string, string> {
  const bySlug: Record<string, string> = {};

  for (const [pathKey, content] of Object.entries(livrariaMarkdownModules)) {
    const relativePath = toLivrariaRelativePath(pathKey);
    const normalizedRelative = stripMarkdownExtension(relativePath);
    const parts = normalizedRelative.split('/').filter(Boolean);
    const seriesFolder = parts.length > 1 ? parts[parts.length - 2] : (parts[0] ?? '');
    const fileStem = parts[parts.length - 1] ?? '';
    const slug = seriesFolder && fileStem ? `${seriesFolder}/${fileStem}` : normalizedRelative;
    bySlug[slug] = content;
    bySlug[normalizeSlugLookupKey(slug)] = content;
    bySlug[normalizedRelative] = content;
    bySlug[normalizeSlugLookupKey(normalizedRelative)] = content;
  }

  return bySlug;
}

function resolveContentUrlForDesktopAndWeb(slug: string): string {
  const encodedSlug = slug
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  const relativeAssetPath = `content/livraria/${encodedSlug}.md`;
  const configuredBase = import.meta.env.BASE_URL || '/';
  const normalizedBase = configuredBase.endsWith('/') ? configuredBase : `${configuredBase}/`;
  const runtimeBase = window.location.protocol === 'file:' && normalizedBase === '/' ? './' : normalizedBase;
  return new URL(`${runtimeBase}${relativeAssetPath}`, window.location.href).toString();
}

function buildFallbackContentUrls(slug: string): string[] {
  const encodedSlug = slug
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  const configuredBase = import.meta.env.BASE_URL || '/';
  const normalizedBase = configuredBase.endsWith('/') ? configuredBase : `${configuredBase}/`;
  const runtimeBase = window.location.protocol === 'file:' && normalizedBase === '/' ? './' : normalizedBase;
  const sectionFolders = [
    'apocrifos',
    'historia-da-igreja',
    'tipologia-biblica',
    'mundo-espiritual',
    'antissistema',
    'ia-e-apocalipse',
    'batalha-espiritual',
    'ferramentas-espirituais',
  ];

  const candidates = [
    resolveContentUrlForDesktopAndWeb(slug),
    `${runtimeBase}content/livraria/${encodedSlug}.md`,
    `${runtimeBase}content/livraria/${slug}.md`,
    `./content/livraria/${encodedSlug}.md`,
    `/content/livraria/${encodedSlug}.md`,
    ...sectionFolders.map((section) => `${runtimeBase}content/livraria/${section}/${encodedSlug}.md`),
    ...sectionFolders.map((section) => `/content/livraria/${section}/${encodedSlug}.md`),
  ];

  return Array.from(new Set(candidates));
}

function inferBookCoverCandidates(frontmatter: Record<string, string>, title: string, slug: string): string[] {
  const candidates = new Set<string>();
  const fromMeta = (frontmatter.image || frontmatter.thumbnail || '').trim();

  if (fromMeta) {
    if (/^https?:\/\//i.test(fromMeta) || fromMeta.startsWith('/')) {
      candidates.add(fromMeta);
    } else {
      candidates.add(`/image/livraria/${fromMeta.replace(/^.*[\\/]/, '')}`);
    }
  }

  const normalizedTitle = slugify(title).replace(/-/g, ' ');
  const normalizedTitleNoArticle = normalizedTitle.replace(/^(o|a|os|as)\s+/, '');
  const slugFileName = slug.split('/').pop() ?? slug;
  const normalizedSlug = slugify(slugFileName.replace(/^ebook\s*\d+\s*-\s*/i, '').replace(/^livro\s*\d+\s*-\s*/i, '')).replace(/-/g, ' ');
  const rawStemFromTitle = normalizeTitlePreservingPunctuation(title).replace(/^(o|a|os|as)\s+/, '');
  const rawStemFromFile = normalizeTitlePreservingPunctuation(
    slugFileName.replace(/\.md$/i, '').replace(/^ebook\s*\d+\s*-\s*/i, '').replace(/^livro\s*\d+\s*-\s*/i, ''),
  ).replace(/^(o|a|os|as)\s+/, '');

  const variantStems = new Set<string>([
    normalizedTitle,
    normalizedTitleNoArticle,
    normalizedSlug,
    rawStemFromTitle,
    rawStemFromFile,
  ]);
  for (const stem of variantStems) {
    for (const extension of COVER_EXTENSIONS) {
      candidates.add(`/image/livraria/${stem}.${extension}`);
    }
  }

  return Array.from(candidates);
}

function discoverBooksFromMarkdown(): BookItem[] {
  return Object.entries(livrariaMarkdownModules).map(([pathKey, content]) => {
    const relative = toLivrariaRelativePath(pathKey);

    const parts = relative.split('/').filter(Boolean);
    const fileName = parts[parts.length - 1] ?? '';
    const seriesFolder = parts.length > 1 ? parts[parts.length - 2] : (parts[0] ?? 'livraria');
    const fileStem = fileName.replace(/\.md$/i, '');
    const slug = `${seriesFolder}/${fileStem}`;
    const frontmatter = parseFrontmatter(content);
    const firstHeading = content.match(/^#\s+(.+)$/m)?.[1]?.trim();
    const title = frontmatter.title || firstHeading || fileName.replace(/\.md$/i, '');
    const cover = inferBookCoverCandidates(frontmatter, title, slug)[0];

    return {
      title,
      slug,
      description: frontmatter.description || '',
      date: frontmatter.date || '2026-04-18',
      category: frontmatter.category || pickCategoryByFolder(seriesFolder),
      time: frontmatter.time || 'LIVRO',
      image: cover,
    };
  });
}

type SectionKey =
  | 'APÓCRIFOS'
  | 'HISTÓRIA DA IGREJA'
  | 'TIPOLOGIA BÍBLICA'
  | 'MUNDO ESPIRITUAL'
  | 'ANTISISTEMA'
  | 'IA & APOCALIPSE'
  | 'BATALHA ESPIRITUAL'
  | 'FERRAMENTAS ESPIRITUAIS';

// ── Section metadata ──────────────────────────────────────────────────────────
const SECTIONS: Record<SectionKey, {
  label: string;
  description: string;
  Icon: React.ElementType;
  accent: string;
}> = {
  'APÓCRIFOS': {
    label: 'Apócrifos',
    description: 'Enoque, Jubileus e os textos banidos. A tradição que o cânon oficial não quis preservar.',
    Icon: Shield,
    accent: 'from-amber-900/70 to-amber-800/10',
  },
  'HISTÓRIA DA IGREJA': {
    label: 'História da Igreja',
    description: 'A anatomia do dogma e os bastidores do poder. Uma análise sobre a verdadeira história da igreja, a formação de suas doutrinas e como a estrutura religiosa foi utilizada como ferramenta de manipulação e controle sistêmico.',
    Icon: BookOpen,
    accent: 'from-sky-900/70 to-sky-800/10',
  },
  'TIPOLOGIA BÍBLICA': {
    label: 'Tipologia Bíblica',
    description: 'Conexões entre tipos, sombras e cumprimentos proféticos para mapear a unidade da Escritura em profundidade.',
    Icon: Layers,
    accent: 'from-indigo-900/70 to-indigo-800/10',
  },
  'MUNDO ESPIRITUAL': {
    label: 'Mundo Espiritual',
    description: 'Uma jornada bíblica pelo Reino de Deus, conselho celeste e realidades invisíveis. Em Hebreus 8, o texto diz que servem como “exemplar e sombra das coisas celestiais”. Como é o mundo espiritual? A Bíblia responde.',
    Icon: Eye,
    accent: 'from-violet-900/70 to-violet-800/10',
  },
  'ANTISISTEMA': {
    label: 'Antissistema',
    description: 'Os protocolos de sobrevivência espiritual dentro de sistemas hostis. Daniel, José e os que atravessaram.',
    Icon: Zap,
    accent: 'from-emerald-900/70 to-emerald-800/10',
  },
  'IA & APOCALIPSE': {
    label: 'IA & Apocalipse',
    description: 'Controle tecnológico, a Marca e os mecanismos proféticos que moldam o fim dos tempos.',
    Icon: Cpu,
    accent: 'from-rose-900/70 to-rose-800/10',
  },
  'BATALHA ESPIRITUAL': {
    label: 'Batalha Espiritual',
    description: 'Discernimento, resistência e estratégias bíblicas para enfrentar as guerras invisíveis do nosso tempo.',
    Icon: Flame,
    accent: 'from-red-900/70 to-red-800/10',
  },
  'FERRAMENTAS ESPIRITUAIS': {
    label: 'Ferramentas Espirituais',
    description: 'Guias práticos de oração, jejum, intercessão e guerra espiritual. Conteúdo aplicado para fortalecer a vida interior e a caminhada com Deus.',
    Icon: Flame,
    accent: 'from-orange-900/70 to-orange-800/10',
  },
};

const SECTION_ORDER: SectionKey[] = [
  'APÓCRIFOS',
  'HISTÓRIA DA IGREJA',
  'TIPOLOGIA BÍBLICA',
  'MUNDO ESPIRITUAL',
  'ANTISISTEMA',
  'IA & APOCALIPSE',
  'BATALHA ESPIRITUAL',
  'FERRAMENTAS ESPIRITUAIS',
];

// Maps existing category strings → top-level section
const CATEGORY_TO_SECTION: Record<string, SectionKey> = {
  'A REVELAÇÃO DE ENOQUE':                   'APÓCRIFOS',
  'SÉRIE — JUBILEUS':                        'APÓCRIFOS',
  'Trilogia — O Cânon Oculto':                'HISTÓRIA DA IGREJA',
  'Série — A Verdadeira História da Igreja':  'HISTÓRIA DA IGREJA',
  'TIPOLOGIA BÍBLICA':                        'TIPOLOGIA BÍBLICA',
  'SOMBRAS DO REINO DE DEUS':                 'MUNDO ESPIRITUAL',
  'Série — O Código do Jardim':               'IA & APOCALIPSE',
  'Série — A Queda do Mundo Espiritual':      'MUNDO ESPIRITUAL',
  'Série — A Queda do Querubim Ungido':       'MUNDO ESPIRITUAL',
  'Trilogia — O Mapa da Tempestade':          'ANTISISTEMA',
  'Trilogia — O Estrangeiro Próspero':        'ANTISISTEMA',
  'Trilogia — A Ciência dos Tempos':          'ANTISISTEMA',
  'Trilogia — A Marca':                       'IA & APOCALIPSE',
  'Trilogia — O Véu Rasgado':                 'IA & APOCALIPSE',
  'Trilogia — A Coroa Roubada':               'MUNDO ESPIRITUAL',
  'Série — O Código das Eras':                'IA & APOCALIPSE',
  'Série — A Onisciência como Atributo Exclusivo': 'IA & APOCALIPSE',
  'Série — O Guerreiro Divino':               'BATALHA ESPIRITUAL',
  'FERRAMENTAS ESPIRITUAIS':                  'FERRAMENTAS ESPIRITUAIS',
};

// Short display labels per series
const SERIES_LABEL: Record<string, string> = {
  'Trilogia — O Mapa da Tempestade':          'O Mapa da Tempestade',
  'Trilogia — A Marca':                       'A Marca',
  'Trilogia — O Estrangeiro Próspero':        'O Estrangeiro Próspero',
  'Trilogia — A Ciência dos Tempos':          'A Ciência dos Tempos',
  'Trilogia — O Cânon Oculto':                'O Cânon Oculto',
  'Trilogia — O Véu Rasgado':                 'O Véu Rasgado',
  'Trilogia — A Coroa Roubada':               'A Coroa Roubada',
  'A REVELAÇÃO DE ENOQUE':                    'A Revelação de Enoque',
  'SÉRIE — JUBILEUS':                         'Série dos Jubileus',
  'SOMBRAS DO REINO DE DEUS':                 'Sombras do Reino de Deus',
  'Série — O Código do Jardim':               'O Código do Jardim',
  'Série — A Queda do Mundo Espiritual':      'A Queda do Mundo Espiritual',
  'Série — A Queda do Querubim Ungido':       'A Queda do Querubim Ungido',
  'Série — A Verdadeira História da Igreja':  'A Verdadeira História da Igreja',
  'Série — O Código das Eras':                'O Código das Eras',
  'Série — A Onisciência como Atributo Exclusivo': 'A Onisciência como Atributo Exclusivo',
  'Série — O Guerreiro Divino':               'O Guerreiro Divino',
  'TIPOLOGIA BÍBLICA':                        'O Código dos Arquétipos',
};

// Description shown below each series header
const SERIES_DESCRIPTION: Record<string, string> = {
  'A REVELAÇÃO DE ENOQUE': 'Uma jornada profunda pelas visões e revelações do profeta Enoque sobre o mundo espiritual, os vigilantes e o destino da humanidade.',
  'SÉRIE — JUBILEUS': 'O livro que Moisés recebeu dos anjos e que a tradição oficial silenciou. Uma jornada pelos segredos do calendário sagrado, dos patriarcas e da guerra invisível que moldou a história bíblica.',
  'SOMBRAS DO REINO DE DEUS': 'Uma leitura bíblica do mundo espiritual: Reino de Deus, conselho celeste e as realidades invisíveis que Hebreus 8:5 chama de sombra das coisas celestiais.',
  'Série — O Código do Jardim': 'Uma série sobre os arquétipos de Gênesis: conhecimento, nomeação, Babel e sabedoria para discernir o conflito espiritual no presente.',
  'Série — A Queda do Mundo Espiritual': 'Uma série sobre a rebelião no céu e a origem da guerra espiritual: Nachash, querubins caídos e as raízes invisíveis do conflito humano.',
  'Série — A Queda do Querubim Ungido': 'Uma investigação bíblica da trajetória de Satanás: da glória no conselho divino à consumação do juízo final, com aplicações práticas para discernimento espiritual.',
  'Série — A Verdadeira História da Igreja': 'Uma arqueologia da fé cristã primitiva, revelando o caminho entre a ekklesia viva e a institucionalização religiosa ao longo dos séculos.',
  'Trilogia — O Cânon Oculto': 'Uma imersão nos bastidores da formação bíblica, nos textos suprimidos e nas leituras que ficaram fora da narrativa oficial.',
  'Trilogia — O Mapa da Tempestade': 'Um diagnóstico de ruptura civilizacional e um mapa prático para atravessar colapsos sistêmicos com lucidez, preparo e fé.',
  'Trilogia — O Estrangeiro Próspero': 'Princípios de José e Daniel para prosperar dentro do sistema sem perder identidade, integridade e aliança.',
  'Trilogia — A Ciência dos Tempos': 'Discernimento profético e estratégico para ler ciclos históricos, interpretar sinais e agir com precisão em tempos críticos.',
  'Trilogia — A Marca': 'Uma análise bíblica e contemporânea sobre controle, tecnologia e os mecanismos de conformação espiritual dos últimos tempos.',
  'Trilogia — O Véu Rasgado': 'Uma investigação sobre Babel, CERN e conhecimento proibido na fronteira entre tecnologia, mundo invisível e profecia bíblica.',
  'Trilogia — A Coroa Roubada': 'Uma trilogia sobre conselho divino, queda dos príncipes e restauração da autoridade dos filhos em Cristo.',
  'Série — O Código das Eras': 'Uma leitura profética das eras bíblicas: sinais celestes, ciclos históricos e convergência escatológica até a consumação do Reino.',
  'Série — A Onisciência como Atributo Exclusivo': 'Uma série sobre a diferença entre a onisciência absoluta de Deus e o conhecimento inferido do inimigo, conectando teologia bíblica, tecnologia e discernimento contemporâneo.',
  'Série — O Guerreiro Divino': 'Uma série sobre Yahweh como Homem de Guerra: batalhas visíveis e invisíveis, exércitos celestiais e o chamado para discernimento e firmeza espiritual.',
  'TIPOLOGIA BÍBLICA': 'Adão, o Sangue, a Arca, o Templo — cada narrativa do Antigo Testamento é uma sombra que aponta para Cristo. Uma série que decodifica a linguagem tipológica da Escritura e revela a unidade profunda de toda a Bíblia.',
};

function buildAutoSeriesDescription(category: string, items: BookItem[]): string {
  const curated = SERIES_DESCRIPTION[category];
  if (curated) return curated;

  // Fallback automático: reaproveita as descrições dos próprios volumes
  // para que novas séries/trilogias nunca apareçam sem texto de apoio.
  const fromBooks = items
    .map((item) => item.description?.trim())
    .filter((value): value is string => Boolean(value))
    .slice(0, 2);

  if (fromBooks.length > 0) return fromBooks.join(' ');

  const seriesLabel = SERIES_LABEL[category] ?? category;
  return `${seriesLabel}: coleção de estudos e livros com análise bíblica, histórica e aplicação prática.`;
}

// ── DragScrollRow ─────────────────────────────────────────────────────────────
// IMPORTANTE: NÃO usar setPointerCapture aqui.
// Com pointer capture, o pointerup é redirecionado para o container, então o
// browser cria o evento click no LCA(pointerdown, pointerup) = container,
// e o click jamais atravessa os filhos (BookCard) → onClick nunca dispara.
// Sem pointer capture, pointerup cai no elemento real (BookCard) e o click
// propaga corretamente para cima, acionando BookCard.onClick.
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
        // Não chamar setPointerCapture — ver comentário acima
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
        setTimeout(() => { drag.current.didDrag = false; }, 0);
      }}
      onPointerLeave={() => {
        // Mouse saiu do container durante o arrasto — reseta estado
        drag.current.isDown = false;
        drag.current.didDrag = false;
      }}
    >
      {children}
    </div>
  );
}

// ── Book Card ─────────────────────────────────────────────────────────────────
function BookCard({ item, volIndex, onSelect }: { item: BookItem; volIndex: number; onSelect: () => void }) {
  const clamped = pm.getProgress('livraria', item.slug);
  const readsCount = pm.getReadCount('livraria', item.slug);
  const isCompleted = pm.isRead('livraria', item.slug);
  const isReading = clamped > 0 && !isCompleted;

  return (
    <div
      onClick={onSelect}
      className="interactive-card group shrink-0 w-[148px] sm:w-[168px] flex flex-col cursor-pointer active:scale-95 transition-transform snap-start"
    >
      <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden shadow-2xl border border-outline-variant/10 bg-surface-container-high group-hover:border-primary/50 transition-colors">
        <AppImage
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
          src={item.image}
          alt={item.title}
        />
        {isCompleted && (
          <div className="absolute top-1.5 right-1.5 flex items-center gap-1 rounded-full bg-black/70 border border-[#D4AF37]/60 px-1.5 py-0.5">
            <Check size={8} className="text-[#D4AF37]" />
            <span className="text-[7px] font-black uppercase tracking-widest text-[#D4AF37]">Lido</span>
          </div>
        )}
      </div>
      <div className="mt-2.5 px-0.5 select-none flex flex-col gap-1.5">

        {/* Volume label */}
        <span className="text-[8px] font-black uppercase tracking-[0.15em] text-on-surface-variant/40 leading-none">
          Vol. {String(volIndex + 1).padStart(2, '0')}
        </span>

        {/* Description (only if available) */}
        {item.description && (
          <p className="text-[9px] text-on-surface-variant/60 leading-snug line-clamp-2 font-medium">
            {item.description}
          </p>
        )}

        {/* Progress bar + % */}
        <div className="flex items-center gap-1.5 mt-0.5">
          <div className="h-1 flex-1 bg-outline-variant/20 rounded-full overflow-hidden">
            <div
              className={
                isCompleted
                  ? 'h-full bg-gradient-to-r from-[#D4AF37] to-[#F5D76E] shadow-[0_0_6px_rgba(212,175,55,0.4)]'
                  : 'h-full bg-gradient-to-r from-orange-500 to-yellow-400 shadow-[0_0_5px_rgba(249,115,22,0.3)]'
              }
              style={{ width: `${isReading ? clamped : isCompleted ? 100 : 0}%` }}
            />
          </div>
          {(isReading || isCompleted) && (
            <span className={`text-[8px] font-black leading-none shrink-0 ${isCompleted ? 'text-[#D4AF37]' : 'text-orange-400'}`}>
              {isCompleted ? '100' : clamped}%
            </span>
          )}
        </div>

        {/* Lido badge */}
        {readsCount > 0 && (
          <span className="text-[8px] font-black uppercase tracking-widest text-[#D4AF37]/80">
            Lido {readsCount}×
          </span>
        )}
      </div>
    </div>
  );
}

// ── Section Grid Card ─────────────────────────────────────────────────────────
function SectionCard({ sectionKey, books, onSelect }: {
  sectionKey: SectionKey;
  books: BookItem[];
  onSelect: () => void;
}) {
  const { label, description, Icon, accent } = SECTIONS[sectionKey];
  const cover = books[0]?.image;
  const totalRead = pm.countRead('livraria', books.map((b) => b.slug));

  return (
    <div
      onClick={onSelect}
      className="interactive-card gold-glow-hover group relative w-full h-44 rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-all duration-300 border border-white/5 hover:border-primary/30 hover:shadow-[0_0_40px_rgba(242,192,141,0.10)]"
    >
      {/* Cover image — blurred, zooms out on hover */}
      {cover && (
        <AppImage
          src={cover}
          alt=""
          className="absolute inset-0 w-full h-full object-cover scale-110 group-hover:scale-105 transition-transform duration-700 opacity-40 group-hover:opacity-55"
        />
      )}

      {/* Coloured gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-r ${accent} to-transparent`} />
      {/* Bottom dark vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

      {/* Subtle inner glow on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 shadow-[inset_0_0_40px_rgba(242,192,141,0.06)]" />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-between p-5">
        {/* Top row */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-black/40 border border-white/10 rounded-lg p-1.5 group-hover:border-primary/30 group-hover:bg-primary/10 transition-all">
              <Icon size={14} className="text-primary/80 group-hover:text-primary transition-colors" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 group-hover:text-primary/70 transition-colors">
              {books.length} volume{books.length !== 1 ? 's' : ''}
            </span>
          </div>
          {totalRead > 0 && (
            <span className="text-[8px] font-black uppercase tracking-widest text-white/40 bg-black/50 px-2 py-0.5 rounded-full border border-white/5">
              {totalRead}/{books.length} lidos
            </span>
          )}
        </div>

        {/* Bottom text */}
        <div>
          <h3 className="font-headline font-black text-[22px] text-white tracking-tight leading-none mb-1.5 group-hover:text-primary transition-colors duration-300">
            {label.toUpperCase()}
          </h3>
          <p className="text-[10px] text-white/45 leading-snug font-medium line-clamp-2 group-hover:text-white/65 transition-colors duration-300 max-w-[260px]">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Root component ────────────────────────────────────────────────────────────
export default function Bookstore() {
  const [selectedSection, setSelectedSection] = useState<SectionKey | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [markdownContent, setMarkdownContent] = useState<string | null>(null);
  const { data: books, loading, error } = useFetch<BookItem[]>('/content/livraria/index.json');
  const discoveredBooks = useMemo(() => discoverBooksFromMarkdown(), []);
  const markdownBySlug = useMemo(() => buildMarkdownBySlugIndex(), []);
  const mergedBooks = useMemo(() => {
    const map = new Map<string, BookItem>();
    for (const discovered of discoveredBooks) map.set(discovered.slug, discovered);
    for (const indexed of books ?? []) map.set(indexed.slug, indexed);
    return Array.from(map.values());
  }, [books, discoveredBooks]);

  // Group books by top-level section
  const booksBySection = SECTION_ORDER.reduce((acc, sec) => {
    acc[sec] = mergedBooks.filter((b) => CATEGORY_TO_SECTION[b.category] === sec);
    return acc;
  }, {} as Record<SectionKey, BookItem[]>);

  // Within a section, group by original category (series / trilogias)
  const seriesInSection: [string, BookItem[]][] = selectedSection
    ? Object.entries(
        booksBySection[selectedSection].reduce((acc, book) => {
          (acc[book.category] ??= []).push(book);
          return acc;
        }, {} as Record<string, BookItem[]>)
      )
    : [];

  const handleSelectBook = async (slug: string) => {
    setSelectedSlug(slug);
    const localContent = markdownBySlug[slug] || markdownBySlug[normalizeSlugLookupKey(slug)];
    if (localContent) {
      setMarkdownContent(localContent);
      return;
    }

    for (const url of buildFallbackContentUrls(slug)) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) continue;
        const text = await res.text();
        if (!text.trim()) continue;
        setMarkdownContent(text);
        return;
      } catch {
        // Try next candidate URL.
      }
    }
  };

  const handleCloseReader = () => { setSelectedSlug(null); setMarkdownContent(null); };

  // ── Reader ─────────────────────────────────────────────────────────────────
  if (selectedSlug && markdownContent) {
    return <MarkdownViewer content={markdownContent} slug={selectedSlug} category="livraria" onClose={handleCloseReader} />;
  }

  // ── Section detail ─────────────────────────────────────────────────────────
  if (selectedSection) {
    const { label, description, Icon } = SECTIONS[selectedSection];
    return (
      <div className="pt-6 pb-32 px-5 max-w-7xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => setSelectedSection(null)}
            className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors mb-6 active:scale-95 text-[10px] font-black uppercase tracking-widest"
          >
            <ChevronLeft size={15} />
            Livraria Espiritual
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary/15 border border-primary/25 rounded-xl p-2">
              <Icon size={18} className="text-primary" />
            </div>
            <h2 className="font-headline font-black text-3xl text-primary tracking-tighter uppercase">
              {label}
            </h2>
          </div>
          <p className="text-on-surface-variant/70 text-[11px] max-w-sm font-medium leading-relaxed">
            {description}
          </p>
        </div>

        {seriesInSection.map(([cat, items], index) => {
          const reads = items.map((b) => pm.getReadCount('livraria', b.slug));
          const minReads = reads.length ? Math.min(...reads) : 0;
          const label = SERIES_LABEL[cat] ?? cat;
          const seriesDescription = buildAutoSeriesDescription(cat, items);
          const isSeries = items.length > 3;

          return (
            <div key={cat} className="mb-6">
              <div className="mb-2.5">
                <div className="mb-1">
                  <span className="inline-flex items-center rounded-full border border-primary/35 bg-primary/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-primary">
                    {isSeries ? 'SÉRIE' : 'TRILOGIA'}
                  </span>
                </div>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <h4 className="font-headline font-extrabold text-xl text-on-surface tracking-tighter uppercase leading-none">
                    {label}
                  </h4>
                  {minReads > 0 && (
                    <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
                      (Lido {minReads} vez{minReads > 1 ? 'es' : ''})
                    </span>
                  )}
                </div>
                {seriesDescription && (
                  <p className="mt-1.5 text-[10px] text-on-surface-variant/60 leading-snug font-medium max-w-sm">
                    {seriesDescription}
                  </p>
                )}
              </div>
              <div className="relative -mx-5 px-5">
                <DragScrollRow>
                  {items.map((item, j) => (
                    <BookCard
                      key={item.slug}
                      item={item}
                      volIndex={j}
                      onSelect={() => handleSelectBook(item.slug)}
                    />
                  ))}
                </DragScrollRow>
              </div>

              {index < seriesInSection.length - 1 && (
                <div className="mt-3 px-1">
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/55 to-transparent animate-[pulse_4.5s_ease-in-out_infinite]" />
                </div>
              )}
            </div>
          );
        })}

        {seriesInSection.length === 0 && !loading && (
          <p className="text-center text-[10px] uppercase tracking-widest text-on-surface-variant/40 py-16 font-bold">
            Conteúdo em breve.
          </p>
        )}
      </div>
    );
  }

  // ── Main grid ──────────────────────────────────────────────────────────────
  return (
    <div className="pt-6 pb-32 px-5 max-w-7xl mx-auto">
      <header className="mb-10 relative">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-[100px]" />
        <div className="relative z-10">
          <h2 className="font-headline font-extrabold text-3xl text-primary tracking-tighter mb-2">
            Livraria Espiritual
          </h2>
          <p className="text-on-surface-variant/70 text-[11px] max-w-[300px] font-medium leading-relaxed">
            Biblioteca de estudos para discernimento bíblico, história da fé e guerra espiritual. Escolha sua frente de estudo e avance por séries, trilogias e investigações aprofundadas.
          </p>
        </div>
      </header>

      {loading ? (
        <div className="py-10 text-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-50">
          Carregando Livraria...
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {SECTION_ORDER.map((sec) => (
            <SectionCard
              key={sec}
              sectionKey={sec}
              books={booksBySection[sec]}
              onSelect={() => setSelectedSection(sec)}
            />
          ))}
        </div>
      )}

      {error && (
        <p className="text-red-500 text-[10px] uppercase font-bold text-center py-4">{error}</p>
      )}
    </div>
  );
}
