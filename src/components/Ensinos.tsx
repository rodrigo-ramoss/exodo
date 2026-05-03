import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, ChevronRight, Sparkles, Tent } from 'lucide-react';
import { AppImage } from './AppImage';
import { MarkdownViewer } from './MarkdownViewer';

type EnsinoTemaId =
  | 'parabolas-de-jesus'
  | 'ensinos-de-jesus'
  | 'ensinos-da-torah'
  | 'ensinos-de-salomao';

interface EnsinoTema {
  id: EnsinoTemaId;
  numero: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
}

interface ParabolaItem {
  title: string;
  references: string;
}

interface ParabolaGroup {
  id: string;
  title: string;
  description: string;
  items: string[];
}

interface EnsinoStudy {
  id: string;
  slug: string;
  title: string;
  description: string;
  tema: string;
  groupId: string;
  groupTitle: string;
  seriesTitle: string;
  volume: number;
  content: string;
  image?: string;
}

const ensinosMarkdownModules = {
  ...import.meta.glob('/public/content/Ensinos/**/*.md', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/Ensinos/**/*.mdx', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/Ensinos/**/*.yaml', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/Ensinos/**/*.yml', { eager: true, query: '?raw', import: 'default' }),
} as Record<string, string>;

const ensinosImageModules = {
  ...import.meta.glob('/public/image/ensinos/**/*.webp'),
  ...import.meta.glob('/public/image/ensinos/**/*.png'),
  ...import.meta.glob('/public/image/ensinos/**/*.jpg'),
  ...import.meta.glob('/public/image/ensinos/**/*.jpeg'),
} as Record<string, unknown>;

const ENSINOS_TEMAS: EnsinoTema[] = [
  {
    id: 'parabolas-de-jesus',
    numero: '01',
    badge: 'Tema 01',
    title: 'PARÁBOLAS DE JESUS',
    subtitle: 'Linguagem do Reino',
    description: 'Leituras organizadas para compreender as parábolas e seu chamado prático ao discipulado.',
  },
  {
    id: 'ensinos-de-jesus',
    numero: '02',
    badge: 'Tema 02',
    title: 'ENSINOS DE JESUS',
    subtitle: 'Doutrina do Messias',
    description: 'Direções de Cristo para mente, caráter e obediência no caminho do Reino.',
  },
  {
    id: 'ensinos-da-torah',
    numero: '03',
    badge: 'Tema 03',
    title: 'ENSINOS DA TORAH',
    subtitle: 'Fundamentos da Aliança',
    description: 'Princípios da Torah aplicados à formação espiritual e à justiça bíblica.',
  },
  {
    id: 'ensinos-de-salomao',
    numero: '04',
    badge: 'Tema 04',
    title: 'ENSINOS DE SALOMÃO',
    subtitle: 'Sabedoria para viver',
    description: 'Sabedoria, discernimento e governo do coração a partir dos escritos sapienciais.',
  },
];

const PARABOLAS_DE_CRISTO: ParabolaItem[] = [
  { title: 'O Semeador', references: 'Mt 13:1-9; Mc 4:1-9; Lc 8:4-8' },
  { title: 'O Joio e o Trigo', references: 'Mt 13:24-30' },
  { title: 'O Grão de Mostarda', references: 'Mt 13:31-32; Mc 4:30-32; Lc 13:18-19' },
  { title: 'O Fermento', references: 'Mt 13:33; Lc 13:20-21' },
  { title: 'O Tesouro Escondido', references: 'Mt 13:44' },
  { title: 'A Pérola de Grande Valor', references: 'Mt 13:45-46' },
  { title: 'A Rede de Pesca', references: 'Mt 13:47-50' },
  { title: 'A Ovelha Perdida', references: 'Mt 18:12-14; Lc 15:4-7' },
  { title: 'O Servo Implacável', references: 'Mt 18:21-35' },
  { title: 'Os Trabalhadores da Vinha', references: 'Mt 20:1-16' },
  { title: 'Os Dois Filhos', references: 'Mt 21:28-32' },
  { title: 'Os Lavradores Maus', references: 'Mt 21:33-46; Mc 12:1-12; Lc 20:9-19' },
  { title: 'O Banquete de Casamento', references: 'Mt 22:1-14' },
  { title: 'As Dez Virgens', references: 'Mt 25:1-13' },
  { title: 'Os Talentos', references: 'Mt 25:14-30' },
  { title: 'As Ovelhas e os Cabritos', references: 'Mt 25:31-46' },
  { title: 'O Semeador que Dorme', references: 'Mc 4:26-29' },
  { title: 'O Bom Samaritano', references: 'Lc 10:25-37' },
  { title: 'O Amigo Importuno', references: 'Lc 11:5-8' },
  { title: 'O Rico Insensato', references: 'Lc 12:13-21' },
  { title: 'A Figueira Estéril', references: 'Lc 13:6-9' },
  { title: 'A Dracma Perdida', references: 'Lc 15:8-10' },
  { title: 'O Filho Pródigo', references: 'Lc 15:11-32' },
  { title: 'O Administrador Infiel', references: 'Lc 16:1-13' },
  { title: 'O Rico e Lázaro', references: 'Lc 16:19-31' },
  { title: 'O Servo Inútil', references: 'Lc 17:7-10' },
  { title: 'O Juiz Iníquo', references: 'Lc 18:1-8' },
  { title: 'O Fariseu e o Publicano', references: 'Lc 18:9-14' },
  { title: 'As Minas', references: 'Lc 19:11-27' },
  { title: 'O Bom Pastor', references: 'Jo 10:1-18' },
  { title: 'A Videira Verdadeira', references: 'Jo 15:1-8' },
];

const PARABOLAS_GRUPOS: ParabolaGroup[] = [
  {
    id: '01',
    title: 'A Origem do Oculto',
    description: 'O Reino começa pequeno e opera silenciosamente, mas cresce até encher toda a criação.',
    items: ['O Semeador', 'O Semeador que Dorme', 'O Grão de Mostarda', 'O Fermento'],
  },
  {
    id: '02',
    title: 'A Questão do Reino',
    description: 'O valor supremo do Reino exige entrega e prioridade total.',
    items: ['O Tesouro Escondido', 'A Pérola de Grande Valor'],
  },
  {
    id: '03',
    title: 'A Ética Invertida do Reino',
    description: 'A graça subverte a lógica do mérito e da exclusão.',
    items: [
      'Os Trabalhadores da Vinha',
      'O Bom Samaritano',
      'O Servo Implacável',
      'O Fariseu e o Publicano',
      'O Filho Pródigo',
      'O Administrador Infiel',
    ],
  },
  {
    id: '04',
    title: 'A Consumação e o Juízo do Reino',
    description: 'A separação final entre o sistema iníquo e os filhos do Reino.',
    items: [
      'O Joio e o Trigo',
      'A Rede de Pesca',
      'O Banquete de Casamento',
      'As Dez Virgens',
      'Os Talentos / As Minas',
      'As Ovelhas e os Cabritos',
      'O Rico e Lázaro',
      'O Rico Insensato',
      'Os Lavradores Maus',
    ],
  },
  {
    id: '05',
    title: 'A Vigilância e a Espera do Reino',
    description: 'A atitude do remanescente entre a primeira e a segunda vinda do Rei.',
    items: ['A Figueira Estéril', 'O Amigo Importuno', 'O Juiz Iníquo', 'O Servo Inútil'],
  },
  {
    id: '06',
    title: 'A Identidade do Rei (Parábolas Joaninas)',
    description: 'O Reino é orgânico e pessoal: Ele é o Pastor e a Videira.',
    items: ['O Bom Pastor', 'A Videira Verdadeira'],
  },
  {
    id: '07',
    title: 'A Tipologia do Remanescente',
    description: 'A divisão entre os que apenas dizem e os que de fato respondem ao chamado.',
    items: ['Os Dois Filhos', 'A Ovelha Perdida', 'A Dracma Perdida'],
  },
];

const ENSINOS_CURATED_SERIES_SUMMARY: Record<string, string> = {
  'joio e o trigo':
    'Série em 7 volumes sobre a parábola do joio e do trigo: cenário do mundo, infiltração do inimigo, paciência divina, colheita angelical e juízo final com destino dos justos e dos ímpios.',
};

const ENSINOS_SUMMARY_STOPWORDS = new Set([
  'a', 'o', 'os', 'as', 'de', 'da', 'do', 'das', 'dos', 'e', 'em', 'na', 'no', 'nas', 'nos',
  'um', 'uma', 'uns', 'umas', 'para', 'por', 'com', 'sem', 'ao', 'aos', 'à', 'às', 'que', 'como',
  'mais', 'menos', 'sobre', 'entre', 'ser', 'sao', 'são', 'foi', 'era', 'seu', 'sua', 'seus', 'suas',
  'nosso', 'nossa', 'nossos', 'nossas', 'ele', 'ela', 'eles', 'elas', 'isso', 'isto', 'esta', 'este',
  'essas', 'esses', 'aquele', 'aquela', 'aqueles', 'aquelas', 'tambem', 'também', 'ja', 'já',
  'primeiro', 'primeira', 'segundo', 'segunda', 'volume', 'volumes', 'ebook', 'livro',
]);

function normalizeEnsinosToken(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeEnsinosTemaKey(raw: string): string {
  return normalizeEnsinosToken(raw).replace(/^(o|a|os|as)\s+/, '').trim();
}

function extractGroupId(raw: string): string {
  const match = normalizeEnsinosToken(raw).match(/grupo\s*(\d{1,2})/);
  return match ? match[1].padStart(2, '0') : '';
}

function toEnsinosReadableLabel(raw: string): string {
  const normalized = raw
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  if (!normalized) return 'o tema';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function summarizeEnsinosSeries(studies: EnsinoStudy[], fallbackLabel?: string): string {
  if (!studies.length) return '';

  const temaKey = normalizeEnsinosTemaKey(studies[0]?.tema || '');
  const curated = ENSINOS_CURATED_SERIES_SUMMARY[temaKey];
  if (curated) return curated;

  const descriptions = studies
    .map((study) => (study.description || '').trim())
    .filter(Boolean);

  const tokenCounts = new Map<string, number>();
  for (const description of descriptions) {
    const tokens = normalizeEnsinosToken(description).split(' ').filter(Boolean);
    for (const token of tokens) {
      if (token.length < 4) continue;
      if (ENSINOS_SUMMARY_STOPWORDS.has(token)) continue;
      tokenCounts.set(token, (tokenCounts.get(token) || 0) + 1);
    }
  }

  const highlights = [...tokenCounts.entries()]
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      if (b[0].length !== a[0].length) return b[0].length - a[0].length;
      return a[0].localeCompare(b[0], 'pt-BR');
    })
    .slice(0, 4)
    .map(([token]) => token);

  const subjectLabel = toEnsinosReadableLabel(
    fallbackLabel
    || studies[0]?.seriesTitle
    || studies[0]?.tema
    || 'tema bíblico',
  );

  const focus = highlights.length > 0
    ? highlights.join(', ')
    : 'fundamentos bíblicos, discernimento e aplicação prática';

  return `Série em ${studies.length} volumes sobre ${subjectLabel}: panorama de ${focus}, com progressão temática e aplicação espiritual.`;
}

function parseFrontmatter(markdown: string): Record<string, string> {
  const normalized = markdown.replace(/^\uFEFF/, '').trimStart();
  const match = normalized.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---/);
  if (!match) return {};

  const result: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const item = line.match(/^\s*([\p{L}_][\p{L}\p{N}_-]*)\s*:\s*(.*?)\s*$/u);
    if (!item) continue;
    const rawKey = item[1].toLowerCase();
    const normalizedKey = rawKey
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    const value = item[2].replace(/^["']|["']$/g, '');
    result[rawKey] = value;
    result[normalizedKey] = value;
  }
  return result;
}

function extractVolumeFromText(raw: string): number {
  const numbered = raw.match(/(?:ebook|livro|parte|volume|vol\.)\s*0*(\d{1,3})/i);
  if (numbered) {
    const parsed = Number.parseInt(numbered[1], 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  if (/\bebook\s*-\s*/i.test(raw)) return 1;
  return 999;
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

function tokenizeEnsinosStem(raw: string): string[] {
  return normalizeImageStem(raw)
    .split(' ')
    .filter(Boolean);
}

function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const prev = Array.from({ length: b.length + 1 }, (_, index) => index);
  const next = new Array(b.length + 1).fill(0);

  for (let i = 1; i <= a.length; i += 1) {
    next[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      next[j] = Math.min(
        next[j - 1] + 1,
        prev[j] + 1,
        prev[j - 1] + cost,
      );
    }
    for (let j = 0; j <= b.length; j += 1) prev[j] = next[j];
  }

  return prev[b.length];
}

function computeEnsinosSimilarity(stem: string, candidate: string): number {
  if (!stem || !candidate) return -1;
  if (stem === candidate) return 100;

  const lengthDelta = Math.abs(stem.length - candidate.length);
  if (stem.includes(candidate) || candidate.includes(stem)) {
    return 90 - Math.min(lengthDelta, 30);
  }

  const stemTokens = tokenizeEnsinosStem(stem);
  const candidateTokens = tokenizeEnsinosStem(candidate);
  const stemTokenSet = new Set(stemTokens);
  const candidateTokenSet = new Set(candidateTokens);
  const unionSize = new Set([...stemTokenSet, ...candidateTokenSet]).size || 1;
  let intersectionSize = 0;
  for (const token of stemTokenSet) {
    if (candidateTokenSet.has(token)) intersectionSize += 1;
  }

  const jaccard = intersectionSize / unionSize;
  const editDistance = levenshteinDistance(stem, candidate);
  const maxLength = Math.max(stem.length, candidate.length, 1);
  const editSimilarity = 1 - (editDistance / maxLength);
  const sharedPrefixBonus = stemTokens[0] && stemTokens[0] === candidateTokens[0] ? 8 : 0;

  return (jaccard * 65) + (editSimilarity * 35) + sharedPrefixBonus;
}

function buildEnsinosImageLookup(): Map<string, string> {
  const lookup = new Map<string, string>();
  for (const key of Object.keys(ensinosImageModules)) {
    const normalized = key.replace(/\\/g, '/');
    if (!normalized.startsWith('/public/image/ensinos/')) continue;
    const fileName = normalized.split('/').pop();
    if (!fileName) continue;
    lookup.set(normalizeImageStem(fileName), normalized.slice('/public'.length));
  }
  return lookup;
}

const ENSINOS_IMAGE_LOOKUP = buildEnsinosImageLookup();
const ENSINOS_IMAGE_PATHS = new Set(Array.from(ENSINOS_IMAGE_LOOKUP.values()));

function findBestEnsinosCover(candidates: string[]): string | undefined {
  const normalizedCandidates = candidates
    .map((candidate) => normalizeImageStem(candidate))
    .filter(Boolean);

  for (const candidate of normalizedCandidates) {
    const exact = ENSINOS_IMAGE_LOOKUP.get(candidate);
    if (exact) return exact;
  }

  let bestScore = -1;
  let bestPath: string | undefined;
  for (const [stem, imagePath] of ENSINOS_IMAGE_LOOKUP.entries()) {
    for (const candidate of normalizedCandidates) {
      const score = computeEnsinosSimilarity(stem, candidate);
      if (score > bestScore) {
        bestScore = score;
        bestPath = imagePath;
      }
    }
  }
  return bestScore >= 42 ? bestPath : undefined;
}

function resolveEnsinosCover(frontmatter: Record<string, string>, title: string, fileStem: string): string | undefined {
  const fromMeta = (frontmatter.image || frontmatter.cover || frontmatter.capa || '').trim();
  if (fromMeta.startsWith('/')) {
    const normalizedMeta = fromMeta.startsWith('/public/') ? fromMeta.slice('/public'.length) : fromMeta;
    if (ENSINOS_IMAGE_PATHS.has(normalizedMeta)) return normalizedMeta;
  }

  const shortTitle = title.split('—')[0]?.trim() || title;
  const candidates = [
    fromMeta,
    title,
    shortTitle,
    fileStem.replace(/^ebook\s*\d*\s*-\s*/i, '').trim(),
  ].filter(Boolean);

  return findBestEnsinosCover(candidates);
}

function discoverEnsinosStudies(): EnsinoStudy[] {
  const studies: EnsinoStudy[] = [];

  for (const [pathKey, content] of Object.entries(ensinosMarkdownModules)) {
    const normalizedPath = pathKey.replace(/\\/g, '/');
    const marker = '/public/content/Ensinos/';
    if (!normalizedPath.includes(marker)) continue;

    const relativePath = normalizedPath.slice(normalizedPath.indexOf(marker) + marker.length);
    const parts = relativePath.split('/').filter(Boolean);
    if (parts.length < 4) continue;

    const groupTitle = parts[1] ?? '';
    const groupId = extractGroupId(groupTitle);
    const seriesTitle = parts[2] ?? '';
    const fileName = parts[parts.length - 1] ?? '';
    const fileStem = fileName.replace(/\.(?:md|mdx|ya?ml)$/i, '');
    const slug = relativePath.replace(/\.(?:md|mdx|ya?ml)$/i, '');

    const frontmatter = parseFrontmatter(content);
    const title = (frontmatter.title || fileStem).trim();
    const description = (frontmatter.description || '').trim();
    const tema = normalizeEnsinosTemaKey(frontmatter.tema || title);
    const image = resolveEnsinosCover(frontmatter, title, fileStem);
    const volume = extractVolumeFromText(fileStem);

    studies.push({
      id: relativePath,
      slug,
      title,
      description,
      tema,
      groupId,
      groupTitle,
      seriesTitle,
      volume,
      content,
      image,
    });
  }

  return studies.sort((a, b) => {
    if (a.tema !== b.tema) return a.tema.localeCompare(b.tema);
    if (a.volume !== b.volume) return a.volume - b.volume;
    return a.title.localeCompare(b.title);
  });
}

function EnsinoThemeCard({ tema, onOpen }: { tema: EnsinoTema; onOpen: () => void }) {
  const isReady = tema.id === 'parabolas-de-jesus';

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative w-full overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-[#1f1a15] via-[#151312] to-[#101010] p-4 sm:p-5 text-left shadow-[0_18px_42px_rgba(0,0,0,0.38)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/55 hover:shadow-[0_22px_50px_rgba(0,0,0,0.5)]"
    >
      <div className="pointer-events-none absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_90%_10%,rgba(242,192,141,0.2),transparent_45%)]" />
      <div className="pointer-events-none absolute right-2 top-0 text-[62px] sm:text-[84px] font-black tracking-tighter text-primary/10 select-none">
        {tema.numero}
      </div>

      <div className="relative z-10">
        <div className="mb-2.5 sm:mb-3 flex items-center justify-between gap-2">
          <span className="inline-flex rounded-full border border-primary/35 bg-primary/10 px-2 py-0.5 sm:py-1 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.17em] text-primary">
            {tema.badge}
          </span>
          <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary/85" />
        </div>

        <h3 className="font-headline text-2xl sm:text-3xl leading-none font-black text-on-surface mb-1.5 sm:mb-2">
          {tema.title}
        </h3>
        <p className="text-xs sm:text-sm font-semibold text-primary/90 mb-1.5 sm:mb-2">{tema.subtitle}</p>
        <p className="text-[11px] sm:text-xs text-on-surface-variant leading-relaxed">{tema.description}</p>

        <div className="mt-3.5 sm:mt-4 rounded-xl border border-primary/20 bg-black/25 px-3.5 sm:px-4 py-2.5 sm:py-3">
          <p className="text-[10px] sm:text-[11px] font-semibold text-primary/95">{isReady ? 'Disponível' : 'Em preparação'}</p>
          <p className="mt-1 text-[9px] sm:text-[10px] leading-snug text-on-surface-variant/75">
            {isReady
              ? 'Inventário com 31 parábolas de Cristo e organização em 7 grupos temáticos.'
              : 'Esta área será preenchida quando os estudos deste tema forem adicionados.'}
          </p>
        </div>
      </div>
    </button>
  );
}

function ParabolasInventory() {
  const [activeParabola, setActiveParabola] = useState<string | null>(null);
  const [activeGroupItem, setActiveGroupItem] = useState<string | null>(null);
  const [selectedStudy, setSelectedStudy] = useState<EnsinoStudy | null>(null);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [activeStudyTema, setActiveStudyTema] = useState<string | null>(null);
  const updatesPanelRef = useRef<HTMLElement | null>(null);
  const ensinosStudies = useMemo(() => discoverEnsinosStudies(), []);

  const studiesByTema = useMemo(() => {
    const map = new Map<string, EnsinoStudy[]>();
    for (const study of ensinosStudies) {
      const key = normalizeEnsinosTemaKey(study.tema);
      const existing = map.get(key) ?? [];
      existing.push(study);
      map.set(key, existing);
    }
    return map;
  }, [ensinosStudies]);

  const studyTemaKeys = useMemo(() => Array.from(studiesByTema.keys()), [studiesByTema]);
  const activeStudyList = activeStudyTema ? studiesByTema.get(activeStudyTema) ?? [] : [];
  const activeGroupLabel = activeGroupId
    ? PARABOLAS_GRUPOS.find((group) => group.id === activeGroupId)?.title ?? null
    : null;
  const recentActiveStudies = useMemo(
    () => [...activeStudyList].sort((a, b) => b.volume - a.volume).slice(0, 5),
    [activeStudyList],
  );
  const studyTemasByGroupId = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const study of ensinosStudies) {
      const groupId = (study.groupId || '').trim();
      if (!groupId) continue;
      const temaKey = normalizeEnsinosTemaKey(study.tema);
      if (!temaKey) continue;
      const existing = map.get(groupId) ?? [];
      if (!existing.includes(temaKey)) existing.push(temaKey);
      map.set(groupId, existing);
    }
    return map;
  }, [ensinosStudies]);
  const activeSeriesSummary = useMemo(() => (
    activeStudyList.length
      ? summarizeEnsinosSeries(
          activeStudyList,
          activeGroupItem || activeGroupLabel || activeStudyList[0]?.seriesTitle || activeStudyList[0]?.tema,
        )
      : ''
  ), [activeGroupItem, activeStudyList, activeGroupLabel]);

  const toParabolaId = (raw: string) => raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const resolveStudyTemaFromGroupItem = (groupItem: string): string | null => {
    const normalizedCandidates = groupItem
      .split('/')
      .map((item) => normalizeEnsinosTemaKey(item))
      .filter(Boolean);

    return studyTemaKeys.find((temaKey) =>
      normalizedCandidates.some((candidate) => candidate === temaKey || candidate.includes(temaKey) || temaKey.includes(candidate)),
    ) ?? null;
  };

  const resolveStudyTemaFromGroupId = (groupId: string): string | null => {
    const temas = studyTemasByGroupId.get(groupId) ?? [];
    if (temas.length === 0) return null;
    return temas[0] ?? null;
  };

  const openSeriesFromGroup = (groupId: string) => {
    setActiveGroupId(groupId);
    const temaFromGroup = resolveStudyTemaFromGroupId(groupId);
    setActiveStudyTema(temaFromGroup);

    const group = PARABOLAS_GRUPOS.find((entry) => entry.id === groupId);
    if (!group) return;

    const preferredItem = group.items.find((item) => resolveStudyTemaFromGroupItem(item) === temaFromGroup)
      ?? group.items[0]
      ?? null;
    setActiveGroupItem(preferredItem);

    if (!preferredItem) return;
    const candidates = preferredItem.split('/').map((item) => item.trim()).filter(Boolean);
    const matched = PARABOLAS_DE_CRISTO.find((parabola) => candidates.some((candidate) => candidate === parabola.title));
    if (matched) setActiveParabola(matched.title);
  };

  const openParabolaFromGroupItem = (groupId: string, groupItem: string) => {
    setActiveGroupItem(groupItem);
    setActiveGroupId(groupId);

    const matchedStudyTema = resolveStudyTemaFromGroupItem(groupItem);
    if (matchedStudyTema) setActiveStudyTema(matchedStudyTema);
    else setActiveStudyTema(null);

    const candidates = groupItem
      .split('/')
      .map((item) => item.trim())
      .filter(Boolean);

    const matched = PARABOLAS_DE_CRISTO.find((parabola) => candidates.some((candidate) => candidate === parabola.title));
    if (!matched) return;
    setActiveParabola(matched.title);
  };

  useEffect(() => {
    if (!activeStudyList.length) return;
    updatesPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [activeStudyList]);

  if (selectedStudy) {
    return (
      <MarkdownViewer
        content={selectedStudy.content}
        slug={selectedStudy.slug}
        category="ensinos"
        onClose={() => setSelectedStudy(null)}
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <article className="rounded-2xl border border-outline-variant/25 bg-black/15 p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm sm:text-base font-black uppercase tracking-wide text-on-surface">Grupos Temáticos</h3>
          <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[9px] font-semibold text-primary">
            7 grupos
          </span>
        </div>
        <p className="mt-1 text-[10px] sm:text-[11px] leading-relaxed text-on-surface-variant/80">
          Estrutura principal de navegação dos estudos de parábolas.
        </p>
        <div className="mt-2.5 grid grid-cols-1 xl:grid-cols-2 gap-2.5">
          {PARABOLAS_GRUPOS.map((grupo) => (
            <section key={grupo.id} className="rounded-lg border border-primary/15 bg-black/20 px-3 py-2.5">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <span className="inline-flex rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.15em] text-primary">
                  Grupo {grupo.id}
                </span>
                <button
                  type="button"
                  onClick={() => openSeriesFromGroup(grupo.id)}
                  className={`rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.12em] transition-colors ${
                    resolveStudyTemaFromGroupId(grupo.id)
                      ? 'border-emerald-300/45 bg-emerald-400/12 text-emerald-200 hover:border-emerald-200/70'
                      : 'border-primary/20 bg-black/30 text-on-surface-variant/70'
                  }`}
                >
                  {resolveStudyTemaFromGroupId(grupo.id) ? 'Ler' : 'Em preparação'}
                </button>
              </div>
              <h4 className="mt-1 text-[11px] sm:text-xs font-black text-on-surface uppercase">{grupo.title}</h4>
              <p className="mt-0.5 text-[10px] leading-relaxed text-on-surface-variant/80">{grupo.description}</p>
              <div className="mt-2 grid grid-cols-1 gap-1.5">
                {grupo.items.map((item) => {
                  const hasSeries = Boolean(resolveStudyTemaFromGroupItem(item));
                  return (
                  <button
                    type="button"
                    key={`${grupo.id}-${item}`}
                    onClick={() => {
                      if (hasSeries) {
                        openParabolaFromGroupItem(grupo.id, item);
                        return;
                      }
                      setActiveGroupItem(item);
                      setActiveGroupId(grupo.id);
                      setActiveStudyTema(null);
                    }}
                    className={`group flex items-center justify-between rounded-md border px-2 py-1.5 text-left text-[9px] sm:text-[10px] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/55 hover:text-on-surface hover:shadow-[0_0_14px_rgba(242,192,141,0.18)] active:scale-[0.99] ${
                      activeGroupItem === item
                        ? 'border-primary/60 bg-gradient-to-r from-primary/20 via-black/35 to-primary/20 text-on-surface'
                        : 'border-primary/20 bg-gradient-to-r from-black/45 via-black/30 to-primary/10 text-on-surface-variant'
                    }`}
                  >
                    <span className="font-semibold">{item}</span>
                    <span className="flex items-center gap-1.5">
                      <span
                        className={`rounded-full border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.12em] ${
                          hasSeries
                            ? 'border-emerald-300/45 bg-emerald-400/12 text-emerald-200'
                            : 'border-primary/20 bg-black/30 text-on-surface-variant/70'
                        }`}
                      >
                        {hasSeries ? 'Ler' : 'Em preparação'}
                      </span>
                      <ChevronRight size={12} className="text-primary/75 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-primary" />
                    </span>
                  </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </article>

      {activeStudyList.length > 0 && (
        <article ref={updatesPanelRef} className="rounded-2xl border border-primary/25 bg-black/20 p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wide text-primary/95">Atualizações da Série</h3>
            <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[8px] font-semibold text-primary">
              {activeStudyList.length} atualizações
            </span>
            <span className="rounded-full border border-primary/20 bg-black/25 px-2 py-0.5 text-[8px] font-semibold text-on-surface-variant/80">
              mostrando {Math.min(5, activeStudyList.length)}
            </span>
          </div>
          <p className="mt-1 text-[10px] sm:text-[11px] leading-relaxed text-on-surface-variant/80">
            {activeGroupItem ? `Parábola ativa: ${activeGroupItem}.` : (activeGroupLabel ? `Grupo ativo: ${activeGroupLabel}.` : 'Últimas capas da série selecionada.')}
          </p>
          {activeSeriesSummary && (
            <p className="mt-1.5 text-[10px] sm:text-[11px] leading-relaxed text-on-surface-variant/80 line-clamp-4">
              {activeSeriesSummary}
            </p>
          )}
          <div className="mt-2.5 overflow-x-auto hide-scrollbar">
            <div className="flex w-max gap-2 pb-1">
              {recentActiveStudies.map((study) => (
                <button
                  type="button"
                  onClick={() => setSelectedStudy(study)}
                  key={study.id}
                  className="group w-[88px] shrink-0 rounded-md border border-primary/20 bg-gradient-to-b from-black/35 via-black/20 to-black/45 p-1 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/55 hover:shadow-[0_0_14px_rgba(242,192,141,0.18)]"
                  title={`Abrir ${study.title}`}
                >
                  <div className="relative aspect-[3/4] overflow-hidden rounded-sm border border-primary/20 bg-black/35">
                    <AppImage
                      src={study.image}
                      alt={study.title}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      fallbackClassName="opacity-85"
                    />
                  </div>
                  <p className="mt-1 text-[7px] font-black uppercase tracking-[0.12em] text-primary/95">
                    Vol. {String(study.volume).padStart(2, '0')}
                  </p>
                  <p className="mt-0.5 text-[8px] font-semibold text-on-surface leading-snug line-clamp-2">
                    {study.title}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </article>
      )}

      {activeGroupItem && activeStudyList.length === 0 && (
        <article className="rounded-2xl border border-primary/20 bg-black/20 p-3 sm:p-4">
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wide text-primary/95">Em preparação</h3>
          <p className="mt-1 text-[10px] sm:text-[11px] leading-relaxed text-on-surface-variant/80">
            Ainda não há série publicada para <strong>{activeGroupItem}</strong>. Assim que sair conteúdo novo, ele aparece aqui.
          </p>
        </article>
      )}

      <article className="rounded-2xl border border-primary/20 bg-black/20 p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wide text-primary/95">Inventário Completo (Apoio)</h3>
          <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[8px] font-semibold text-primary">
            31 parábolas
          </span>
        </div>
        <p className="mt-1 text-[10px] sm:text-[11px] leading-relaxed text-on-surface-variant/80">
          Referência rápida para consulta, organizada em blocos compactos.
        </p>
        <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-1.5">
          {PARABOLAS_DE_CRISTO.map((parabola, index) => (
            <div
              key={parabola.title}
              id={`parabola-${toParabolaId(parabola.title)}`}
              className={`rounded-md border px-2 py-1.5 transition-all duration-300 ${activeParabola === parabola.title
                ? 'border-primary/60 bg-primary/10 shadow-[0_0_18px_rgba(242,192,141,0.2)]'
                : 'border-primary/15 bg-black/25'}`}
              title={`${parabola.title} — ${parabola.references}`}
            >
              <p className="text-[10px] sm:text-[11px] font-semibold text-on-surface leading-snug">
                {index + 1}. {parabola.title}
              </p>
              <p className="mt-0.5 text-[9px] text-primary/85 leading-snug line-clamp-1">{parabola.references}</p>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}

interface EnsinosProps {
  openSlug?: string;
}

function clearOpenSlugFromUrl() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has('open')) return;
  url.searchParams.delete('open');
  const nextUrl = `${url.pathname}${url.search ? url.search : ''}`;
  window.history.replaceState(null, '', nextUrl);
}

export default function Ensinos({ openSlug }: EnsinosProps) {
  const [activeTemaId, setActiveTemaId] = useState<EnsinoTemaId | null>(null);

  const activeTema = useMemo(
    () => ENSINOS_TEMAS.find((tema) => tema.id === activeTemaId) ?? null,
    [activeTemaId],
  );

  useEffect(() => {
    if (!openSlug || activeTemaId) return;
    const matchedTema = ENSINOS_TEMAS.find(
      (tema) => openSlug === tema.id || openSlug.startsWith(`${tema.id}/`) || openSlug.includes(tema.id),
    );
    if (!matchedTema) return;
    setActiveTemaId(matchedTema.id);
    clearOpenSlugFromUrl();
  }, [activeTemaId, openSlug]);

  if (activeTema) {
    return (
      <div className="pt-4 sm:pt-6 pb-24 sm:pb-28 px-4 sm:px-6 max-w-7xl mx-auto min-h-screen bg-surface-container-lowest">
        <section className="rounded-3xl border border-outline-variant/25 bg-gradient-to-b from-surface-container-low to-surface-container p-4 sm:p-6">
          <button
            type="button"
            onClick={() => setActiveTemaId(null)}
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/70 hover:text-primary transition-colors"
          >
            <ArrowLeft size={12} />
            Ensinos
          </button>

          <div className="mt-3 sm:mt-4 mb-4 sm:mb-5">
            <span className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 sm:py-1 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.18em] text-primary mb-1.5 sm:mb-2">
              {activeTema.badge}
            </span>
            <h2 className="font-headline text-2xl sm:text-4xl font-black tracking-tight text-on-surface uppercase">
              {activeTema.title}
            </h2>
            <p className="text-xs sm:text-sm text-primary/85 font-semibold mt-1">{activeTema.subtitle}</p>
            <p className="text-[11px] sm:text-xs text-on-surface-variant leading-relaxed mt-1.5 sm:mt-2 max-w-3xl">
              {activeTema.description}
            </p>
          </div>

          {activeTema.id === 'parabolas-de-jesus' ? (
            <ParabolasInventory />
          ) : (
            <div className="mt-5 sm:mt-7 rounded-2xl border border-primary/20 bg-black/20 px-3.5 sm:px-5 py-3.5 sm:py-4">
              <p className="text-xs sm:text-sm font-semibold text-primary/95">Em preparação</p>
              <p className="mt-1 text-[11px] sm:text-xs leading-relaxed text-on-surface-variant/80 max-w-2xl">
                Esta área será preenchida quando os estudos deste tema forem adicionados.
              </p>
            </div>
          )}
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
              <Tent size={12} className="text-primary" />
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.22em] text-primary">
                Seção Ensinos
              </span>
            </div>
            <h1 className="font-headline text-3xl sm:text-5xl font-black text-primary mb-1.5 sm:mb-2 tracking-tighter text-shadow-glow">
              ENSINOS
            </h1>
            <p className="text-xs sm:text-base text-on-surface font-semibold mb-1.5 sm:mb-2">
              As palavras que formam a mente do Reino.
            </p>
            <p className="text-[11px] sm:text-sm text-on-surface-variant/90 leading-relaxed max-w-3xl">
              Uma área dedicada aos ensinamentos bíblicos organizados por mestres, temas e fundamentos espirituais.
            </p>
          </div>
        </header>
      </div>

      <section className="px-4 sm:px-6 pb-8 sm:pb-10">
        <div className="mb-3 sm:mb-4">
          <h2 className="font-headline text-xl sm:text-3xl font-black tracking-tight text-on-surface">Escolha seu tema</h2>
          <p className="text-xs text-on-surface-variant mt-1">
            Cada tema abre uma trilha de formação bíblica para leitura contínua.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
          {ENSINOS_TEMAS.map((tema) => (
            <EnsinoThemeCard key={tema.id} tema={tema} onOpen={() => setActiveTemaId(tema.id)} />
          ))}
        </div>

        <div className="mt-4 sm:mt-5 rounded-2xl border border-primary/20 bg-black/20 px-3.5 sm:px-5 py-3.5 sm:py-4">
          <p className="text-xs sm:text-sm font-semibold text-primary/95 inline-flex items-center gap-2">
            <Sparkles size={14} />
            Em preparação
          </p>
          <p className="mt-1 text-[11px] sm:text-xs leading-relaxed text-on-surface-variant/80 max-w-2xl">
            Esta área será preenchida quando os estudos deste tema forem adicionados.
          </p>
        </div>
      </section>
    </div>
  );
}
