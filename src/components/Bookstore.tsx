import { useState, useRef, useMemo, useEffect, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Shield, BookOpen, Zap, Cpu, Eye, Layers, Check, Flame, Hourglass, Tent, Sparkles } from 'lucide-react';
import { pm } from '../lib/progressManager';
import { useFetch } from '../hooks/useFetch';
import { MarkdownViewer } from './MarkdownViewer';
import { AppImage } from './AppImage';
import {
  SELAH_SUBSECTIONS_BY_THEME_TITLE,
  SELAH_THEME_BY_TITLE,
  SELAH_THEME_SLUG_BY_TITLE,
  SELAH_THEME_TITLES_IN_ORDER,
  resolveSelahSubsectionSlug,
  resolveSelahSubsectionTitle,
  resolveSelahThemeTitleFromSlug,
  type SelahThemeTitle,
} from '../config/selahStructure';

// ── Types ─────────────────────────────────────────────────────────────────────
interface BookItem {
  title: string;
  slug: string;
  description: string;
  date: string;
  category: string;
  tema?: string;
  subsecao?: string;
  time: string;
  image?: string;
}

interface SubsecaoAuditEntry {
  slug: string;
  title: string;
  tema: SelahThemeTitle;
  category: string;
  subsecao?: string;
  reason: 'missing' | 'invalid';
  validSubsecoes: readonly string[];
}

type TypologyDivisionId =
  | 'tipologia-pessoal'
  | 'tipologia-eventual'
  | 'tipologia-institucional'
  | 'tipologia-objetal'
  | 'tipologia-locativa'
  | 'tipologia-ritual'
  | 'tipologia-historica'
  | 'tipologia-escatologica';

interface TypologyTypeMeta {
  id: TypologyDivisionId;
  label: string;
  numero: string;
  titulo: string;
  subtitulo: string;
  descricao: string;
  exemplos: string[];
}

interface TypologyObjectalTopicMeta {
  id: string;
  label: string;
  imageStem: string;
  imageAliases?: string[];
  seriesMatchers?: string[];
}

const livrariaMarkdownModules = {
  ...import.meta.glob('/public/content/livraria/**/*.md', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/livraria/**/*.mdx', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/livraria/**/*.yaml', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/livraria/**/*.yml', { eager: true, query: '?raw', import: 'default' }),
} as Record<string, string>;
const livrariaEspitirualMarkdownModules = {
  ...import.meta.glob('/public/content/selah/**/*.md', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/selah/**/*.mdx', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/selah/**/*.yaml', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/selah/**/*.yml', { eager: true, query: '?raw', import: 'default' }),
} as Record<string, string>;
const ferramentasMarkdownModules = {
  ...import.meta.glob('/public/content/ferramentas-espirituais/**/*.md', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/ferramentas-espirituais/**/*.mdx', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/ferramentas-espirituais/**/*.yaml', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/ferramentas-espirituais/**/*.yml', { eager: true, query: '?raw', import: 'default' }),
} as Record<string, string>;
const contentMarkdownModules = {
  ...livrariaMarkdownModules,
  ...livrariaEspitirualMarkdownModules,
  ...ferramentasMarkdownModules,
};
const typologyMarkdownModulesRoot = {
  ...import.meta.glob('/public/content/tipologia-biblica/**/*.md', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/tipologia-biblica/**/*.mdx', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/tipologia-biblica/**/*.yaml', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/tipologia-biblica/**/*.yml', { eager: true, query: '?raw', import: 'default' }),
} as Record<string, string>;
const typologyMarkdownModulesLegacy = {
  ...import.meta.glob('/public/content/selah/tipologia-biblica/**/*.md', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/selah/tipologia-biblica/**/*.mdx', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/selah/tipologia-biblica/**/*.yaml', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/selah/tipologia-biblica/**/*.yml', { eager: true, query: '?raw', import: 'default' }),
} as Record<string, string>;
const typologyMarkdownModules = {
  ...typologyMarkdownModulesRoot,
  ...typologyMarkdownModulesLegacy,
};
const imageModules = {
  ...import.meta.glob('/public/image/**/*.webp'),
  ...import.meta.glob('/public/image/**/*.png'),
  ...import.meta.glob('/public/image/**/*.jpg'),
  ...import.meta.glob('/public/image/**/*.jpeg'),
};

const COVER_EXTENSIONS = ['webp', 'png', 'jpg', 'jpeg'] as const;
const WEAK_REMOTE_IMAGE_HOSTS = ['placeholder-voz-do-deserto.com', 'images.unsplash.com'];
const CONTENT_FILE_EXTENSION_REGEX = /\.(?:md|mdx|markdown|ya?ml)$/i;
const TYPOLOGY_OBJECTAL_TOPIC_IMAGE_BASE_PATH = '/image/tipos/topicos';
const TYPOLOGY_DIVISION_FOLDER_TO_ID: Record<string, TypologyDivisionId> = {
  '1-tipologia-pessoal': 'tipologia-pessoal',
  '2-tipologia-eventual': 'tipologia-eventual',
  '3-tipologia-institucional': 'tipologia-institucional',
  '4-tipologia-objetal': 'tipologia-objetal',
  // Compatibilidade com estrutura editorial atual da pasta.
  '4-tipologia-tabernaculo': 'tipologia-objetal',
  '5-tipologia-locativa': 'tipologia-locativa',
  '6-tipologia-ritual': 'tipologia-ritual',
  '7-tipologia-historica': 'tipologia-historica',
  '8-tipologia-escatologica': 'tipologia-escatologica',
};
const TYPOLOGY_SERIES_PRIORITY = [
  'Série — Sombras do Reino',
  'Série — A Terra e o Tabernáculo',
  'Série — O Tetravéu',
  'Série — O Relógio do Santuário',
];
const TYPOLOGY_OBJECTAL_TOPICS: TypologyObjectalTopicMeta[] = [
  {
    id: 'tabernaculo',
    label: 'Tabernáculo',
    imageStem: 'tabernaculo',
    seriesMatchers: ['sombras do reino', 'terra e o tabernaculo', 'relogio do santuario'],
  },
  {
    id: 'arca-propiciatorio',
    label: 'Arca / Propiciatório',
    imageStem: 'arca-propiciatorio',
    imageAliases: ['propiciatorio', 'arca'],
  },
  {
    id: 'menora',
    label: 'Menorá',
    imageStem: 'menora',
  },
  {
    id: 'paes',
    label: 'Pães',
    imageStem: 'paes',
  },
  {
    id: 'altar-do-incenso',
    label: 'Altar do Incenso',
    imageStem: 'altar-incenso',
    imageAliases: ['altar de incenso', 'incenso'],
  },
  {
    id: 'veu-tetraveu',
    label: 'Véu / Tetravéu',
    imageStem: 'veu-tetraveu',
    imageAliases: ['veu', 'tetraveu', 'tetravel', 'o veu e a fronteira'],
    seriesMatchers: ['tetraveu', 'tetravel'],
  },
  {
    id: 'peles-do-tabernaculo',
    label: 'Peles do Tabernáculo',
    imageStem: 'peles-tabernaculo',
    imageAliases: ['peles'],
  },
];

const TYPOLOGY_ESCATOLOGICAL_TOPICS: TypologyObjectalTopicMeta[] = [
  {
    id: 'morte',
    label: 'Morte',
    imageStem: 'o que e a morte',
    imageAliases: ['morte', 'a intrusa', 'o dia do juizo', 'a descida silenciosa'],
  },
  {
    id: 'ressurreicao',
    label: 'Ressurreição',
    imageStem: 'o corpo que venceu',
    imageAliases: ['ressurreicao', 'eu reconhecido', 'ultimo inimigo derrotado'],
  },
];

const SERIES_VOLUME_COVER_STEMS: Record<string, Record<number, string>> = {
  'invasao legal': {
    1: 'invasao legal volume 1',
    2: 'invasao legal volume 2',
    3: 'invasao legal volume 3',
    4: 'invasao legal volume 4',
    5: 'invasao legal volume 5',
    6: 'invasao legal volume 6',
    7: 'invasao legal volume 7',
  },
  'a arquitetura da guerra invisivel': {
    1: 'arquitetura da guerra invisivl - o conselho das trevas',
    2: 'arquitetura da guerra invisivl - miguel',
    3: 'arquitetura da guerra invisivl - o mapado territorio',
    4: 'arquitetura da guerra invisivl - a estrategia qumranita',
    5: 'arquitetura da guerra invisivl - melquisedeque e o jubileu da guerra',
    6: 'arquitetura da guerra invisivl - julgaremos os anjos',
    7: 'arquitetura da guerra invisivl - restauracao da herenca',
  },
  'a armadura do remanescente': {
    1: 'o cinto da verdade',
    2: 'couraca da justica',
    3: 'o cinto da verdade',
    4: 'o capacete da salvacao',
    5: 'o capacete da salvacao',
    6: 'a espada do espirito',
    7: 'a oracao do espirito',
  },
  'a revelacao do seculo': {
    1: 'o dspertar dos vigilantes',
    2: 'o selo dos 490 anos',
    3: 'a queda de babilonia',
    4: 'a casa de muitas moradas',
    5: 'a guerra dos dois espiritos',
    6: 'a nova jerusalem',
  },
  'o relogio de deus': {
    1: 'o tempo como profecia',
    2: 'o calendario solar dos anjos',
    3: 'a corrupcao do tempo',
    4: 'quram e a guerra dos calendario',
    5: 'o tempo restaurado',
  },
  'o terceiro ceu de paulo': {
    1: 'o primeiro ceu',
    2: 'do segundo ao quinto ceu',
    3: 'o sexto e o setimo ceu',
    4: 'a escada de enoque',
    5: 'o terceiro ceu de paulo',
  },
  'o fio do trono': {
    1: 'o fundamento da oracao',
    2: 'a oracao no segundo templo',
    3: 'a oracao de jesus',
    4: 'a oracao do espirito',
  },
  'como nos dias de noe': {
    1: 'corrupacao original',
    2: 'a nova mistura',
    3: 'do diluvio ao fogo',
  },
  'tabernaculo': {
    1: 'a sombra e o modelo',
    2: 'o patio e a terra',
    3: 'o lugar santo e o firmamento',
    4: 'o veu e a fronteira',
    5: 'o santo dos santos',
    6: 'o cosmo e o templo',
  },
};

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
    ['tabernaculo', 'TABERNACULO'],
    ['serie - o codigo dos arquetipos', 'TIPOLOGIA BÍBLICA'],
    ['serie - o codigo do jardim', 'Série — O Código do Jardim'],
    ['serie - a revelacao do seculo', 'Série — A Revelação do Século'],
    ['serie - invasao legal', 'Série — Invasão Legal'],
    ['serie - a cruz no mundo espiritual', 'Série — A Cruz no Mundo Espiritual'],
    ['serie - a armadura do remanescente', 'Série — A Armadura do Remanescente'],
    ['serie - a queda do mundo espiritual', 'Série — A Queda do Mundo Espiritual'],
    ['serie - a queda do querubim ungido', 'Série — A Queda do Querubim Ungido'],
    ['serie - a onisciencia como atributo exclusivo', 'Série — A Onisciência como Atributo Exclusivo'],
    ['serie - o relogio de deus', 'Série — O Relógio de Deus'],
    ['serie - terra plana', 'Série — Terra Plana na Bíblia'],
    ['serie - a arquitetura da guerra invisivel', 'Série — A Arquitetura da Guerra Invisível'],
    ['serie - o terceiro ceu de paulo', 'Série — O Terceiro Céu de Paulo'],
    ['serie - o fio do trono', 'Série — O Fio do Trono'],
    ['serie - como nos dias de noe', 'Série — Como nos Dias de Noé'],
    ['serie - ferramentas de estudo', 'FERRAMENTAS'],
    ['serie - sombras do reino de deus', 'SOMBRAS DO REINO DE DEUS'],
    ['serie - a verdadeira historia da igreja', 'Série — A Verdadeira História da Igreja'],
    ['serie - o codigo das eras', 'Série — O Código das Eras'],
    ['serie - as origens do sabado', 'Série — As Origens do Sábado'],
    ['serie - o relogio escatologico', 'Série — O Relógio Escatológico'],
    ['serie - parabolas de jesus', 'Série — Parábolas de Jesus'],
    ['serie - ruah - a pessoa esquecida da divindade', 'Série — Ruah — A Pessoa Esquecida da Divindade'],
    ['serie - a blasfemia contra o ruah', 'Série — A Blasfêmia contra o Ruah'],
    ['serie - jubileus', 'SÉRIE — JUBILEUS'],
    ['serie - 1 enoque', 'A REVELAÇÃO DE ENOQUE'],
    ['trilogia - o mapa da tempestade', 'Trilogia — O Mapa da Tempestade'],
    ['trilogia - o estrangeiro prospero', 'Trilogia — O Estrangeiro Próspero'],
    ['trilogia - a ciencia dos tempos', 'Trilogia — A Ciência dos Tempos'],
    ['trilogia - a marca', 'Trilogia — A Marca'],
    ['trilogia - o canon oculto', 'Trilogia — O Cânon Oculto'],
    ['trilogia - o veu rasgado', 'Trilogia — O Véu Rasgado'],
    ['trilogia - a coroa roubada', 'Trilogia — A Coroa Roubada'],
    ['ferramentas-espirituais', 'FERRAMENTAS'],
    ['ferramentas', 'FERRAMENTAS'],
  ];

  for (const [matchFolder, category] of dynamicMap) {
    if (key.includes(matchFolder)) return category;
  }

  return folder;
}

const SECTION_CATEGORY_ALIASES = new Set<string>([
  'apocrifos',
  'historia da igreja',
  'tipologia biblica',
  'cosmologia biblica',
  'mundo espiritual',
  'satanas e demonios',
  'antissistema',
  'ia apocalipse',
  'ia e apocalipse',
  'fim dos tempos',
  'espirito santo',
  'deus pai',
  'reino de deus',
  'jesus cristo',
  'parabolas de jesus',
  'batalha espiritual',
  'ferramentas',
  'ferramentas espirituais',
  'livraria',
]);

function normalizeBookCategory(rawCategory: string | undefined, seriesFolder: string): string {
  const normalizedSeriesFolder = normalizeSlugLookupKey(seriesFolder).replace(/-/g, ' ');
  if (normalizedSeriesFolder === 'sombras do reino') return 'Série — Sombras do Reino';
  if (normalizedSeriesFolder === 'a terra e o tabernaculo') return 'Série — A Terra e o Tabernáculo';

  const categoryFromFolder = pickCategoryByFolder(seriesFolder);
  if (
    categoryFromFolder === 'Série — Sombras do Reino'
    || categoryFromFolder === 'Série — A Terra e o Tabernáculo'
  ) {
    return categoryFromFolder;
  }

  const category = (rawCategory || '').trim();
  if (!category) return categoryFromFolder;

  const normalizedCategory = slugify(category).replace(/-/g, ' ');
  if (normalizedCategory.includes('tabernaculo')) return 'TABERNACULO';
  if (SECTION_CATEGORY_ALIASES.has(normalizedCategory)) return categoryFromFolder;

  return category;
}

function toContentRelativePath(pathKey: string): string {
  const normalized = pathKey.replace(/\\/g, '/');
  const marker = '/public/content/';
  if (!normalized.includes(marker)) return normalized;
  const relativeFromContent = normalized.slice(normalized.indexOf(marker) + marker.length);
  if (relativeFromContent.startsWith('livraria/')) return relativeFromContent.slice('livraria/'.length);
  if (relativeFromContent.startsWith('selah/')) return relativeFromContent.slice('selah/'.length);
  if (relativeFromContent.startsWith('ferramentas-espirituais/')) return relativeFromContent.slice('ferramentas-espirituais/'.length);
  return relativeFromContent;
}

function stripMarkdownExtension(path: string): string {
  return path.replace(CONTENT_FILE_EXTENSION_REGEX, '');
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

function normalizeSearchToken(raw: string): string {
  return normalizeSlugLookupKey(raw)
    .replace(/[^a-z0-9/\s-]/g, ' ')
    .replace(/[-_/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

interface TypologyContentEntry {
  typeId: TypologyDivisionId;
  seriesCategory: string;
  topicHint?: string;
  item: BookItem;
}

const TYPOLOGY_COVER_HINTS: Array<[string, string]> = [
  ['sombra e o modelo', 'a sombra e o modelo'],
  ['patio e a terra', 'o patio e a terra'],
  ['lugar santo e o firmamento', 'o lugar santo e o firmamento'],
  ['veu e a fronteira', 'o veu e a fronteira'],
  ['santo dos santos', 'o santo dos santos'],
  ['cosmos como templo', 'o cosmo e o templo'],
  ['cosmo como templo', 'o cosmo e o templo'],
  ['cosmos que o tabernaculo desenha', 'o cosmo que o tabernaculo desenha'],
  ['cosmo que o tabernaculo desenha', 'o cosmo que o tabernaculo desenha'],
  ['patio e as quatro esquinas da terra', 'o patio e as quatro esquinas da terra'],
  ['firmamento como veu estendido', 'o fundamento com o veu escondido'],
  ['colunas da terra', 'as colunas da terra'],
  ['mar de bronze', 'o mar de broze e as aguas do caos'],
  ['trono no extremo norte', 'o trono no exremo norte'],
  ['linho bordado', 'o linho bordado'],
  ['pelo de cabra', 'o pelo de cabra'],
  ['peles de carneiro', 'as peles de carneiro'],
  ['peles de tachash', 'as peles de tachash'],
];

function normalizeCoverStemForLookup(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildTypologyCoverLookup(): Map<string, string> {
  const lookup = new Map<string, string>();

  // Prioridade 1: capas específicas de Tipos.
  for (const key of Object.keys(imageModules)) {
    const normalized = key.replace(/\\/g, '/');
    if (!normalized.startsWith('/public/image/tipos/')) continue;
    const fileName = normalized.split('/').pop();
    if (!fileName) continue;
    lookup.set(normalizeCoverStemForLookup(fileName), normalized.slice('/public'.length));
  }

  // Prioridade 2 (fallback): capas editoriais em selah quando não existir equivalente em Tipos.
  for (const key of Object.keys(imageModules)) {
    const normalized = key.replace(/\\/g, '/');
    if (!normalized.startsWith('/public/image/selah/')) continue;
    const fileName = normalized.split('/').pop();
    if (!fileName) continue;
    const stem = normalizeCoverStemForLookup(fileName);
    if (!lookup.has(stem)) lookup.set(stem, normalized.slice('/public'.length));
  }

  return lookup;
}

const TYPOLOGY_COVER_LOOKUP = buildTypologyCoverLookup();

function buildTypologyObjectalTopicImageLookup(): Map<string, string> {
  const lookup = new Map<string, string>();
  const normalizedBasePath = `/public${TYPOLOGY_OBJECTAL_TOPIC_IMAGE_BASE_PATH}`.replace(/\\/g, '/');

  for (const key of Object.keys(imageModules)) {
    const normalized = key.replace(/\\/g, '/');
    if (!normalized.startsWith(`${normalizedBasePath}/`)) continue;
    const fileName = normalized.split('/').pop();
    if (!fileName) continue;
    lookup.set(normalizeCoverStemForLookup(fileName), normalized.slice('/public'.length));
  }

  return lookup;
}

const TYPOLOGY_OBJECTAL_TOPIC_IMAGE_LOOKUP = buildTypologyObjectalTopicImageLookup();

function scoreStemMatch(candidate: string, key: string): number {
  if (!candidate || !key) return -1;
  if (candidate === key) return 100;
  if (key.includes(candidate) || candidate.includes(key)) {
    return 80 - Math.min(40, Math.abs(candidate.length - key.length));
  }

  const candidateTokens = new Set(candidate.split(' ').filter((token) => token.length > 2));
  const keyTokens = new Set(key.split(' ').filter((token) => token.length > 2));
  if (candidateTokens.size === 0 || keyTokens.size === 0) return -1;

  let overlap = 0;
  for (const token of candidateTokens) {
    if (keyTokens.has(token)) overlap += 1;
  }

  if (overlap === 0) return -1;
  return 40 + overlap * 8;
}

function findBestImageMatch(
  lookup: Map<string, string>,
  candidates: string[],
): string | undefined {
  let bestScore = -1;
  let bestImage: string | undefined;

  const normalizedCandidates = candidates
    .map((value) => normalizeCoverStemForLookup(value))
    .filter(Boolean);

  for (const [key, imagePath] of lookup.entries()) {
    for (const candidate of normalizedCandidates) {
      const score = scoreStemMatch(candidate, key);
      if (score > bestScore) {
        bestScore = score;
        bestImage = imagePath;
      }
    }
  }

  return bestScore >= 40 ? bestImage : undefined;
}

function resolveTypologyObjectalTopicImage(topic: TypologyObjectalTopicMeta): string | undefined {
  const candidateStems = [topic.imageStem, topic.id, topic.label, ...(topic.imageAliases ?? [])];

  const fromTopicFolder = findBestImageMatch(TYPOLOGY_OBJECTAL_TOPIC_IMAGE_LOOKUP, candidateStems);
  if (fromTopicFolder) return fromTopicFolder;

  const fromGeneralCovers = findBestImageMatch(TYPOLOGY_COVER_LOOKUP, candidateStems);
  if (fromGeneralCovers) return fromGeneralCovers;

  return undefined;
}

function resolveTypologyObjectalTopicSeries(
  topic: TypologyObjectalTopicMeta,
  relatedSeries: [string, BookItem[]][],
): [string, BookItem[]][] {
  if (!topic.seriesMatchers || topic.seriesMatchers.length === 0) return [];

  const normalizedMatchers = topic.seriesMatchers.map((item) => normalizeSearchToken(item));
  return relatedSeries.filter(([category]) => {
    const normalizedCategory = normalizeSearchToken(category);
    return normalizedMatchers.some((matcher) => normalizedCategory.includes(matcher));
  });
}

function extractTypologyDivisionRelativePath(pathKey: string): string | null {
  const normalized = pathKey.replace(/\\/g, '/');
  const markers = [
    '/public/content/tipologia-biblica/',
    '/public/content/selah/tipologia-biblica/',
  ];
  for (const marker of markers) {
    if (!normalized.includes(marker)) continue;
    return normalized.slice(normalized.indexOf(marker) + marker.length);
  }
  return null;
}

function toTitleCasePt(raw: string): string {
  return raw
    .split(' ')
    .filter(Boolean)
    .map((word) => {
      const lower = word.toLowerCase();
      if (['de', 'do', 'da', 'dos', 'das', 'e'].includes(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

function resolveTypologySeriesCategory(seriesFolder: string): string {
  const normalized = normalizeSlugLookupKey(seriesFolder).replace(/-/g, ' ');
  if (normalized.includes('sombras do reino')) return 'Série — Sombras do Reino';
  if (normalized.includes('terra e o tabernaculo')) return 'Série — A Terra e o Tabernáculo';
  if (normalized.includes('tetravel') || normalized.includes('tetraveu')) return 'Série — O Tetravéu';
  if (normalized.includes('relogio do santuario')) return 'Série — O Relógio do Santuário';

  const cleaned = normalized
    .replace(/^serie\s*-\s*/i, '')
    .replace(/^serie\s+/i, '')
    .trim();
  return `Série — ${toTitleCasePt(cleaned)}`;
}

function resolveTypologyCover(frontmatter: Record<string, string>, title: string, fileStem: string): string | undefined {
  const imageStemFromFrontmatter = frontmatter.image
    ? frontmatter.image.replace(/\\/g, '/').split('/').pop()?.replace(/\.[a-z0-9]+$/i, '') || ''
    : '';
  const cleanFileStem = fileStem
    .replace(/^ebook\s*\d+\s*-\s*/i, '')
    .replace(/^livro\s*\d+\s*-\s*/i, '')
    .trim();
  const shortTitle = title.split('—').pop()?.split(':').pop()?.trim() || title;
  const normalizedSearch = normalizeCoverStemForLookup(`${imageStemFromFrontmatter} ${cleanFileStem} ${shortTitle} ${title}`);

  for (const [hint, targetStem] of TYPOLOGY_COVER_HINTS) {
    if (!normalizedSearch.includes(hint)) continue;
    const exactFromHint = TYPOLOGY_COVER_LOOKUP.get(normalizeCoverStemForLookup(targetStem));
    if (exactFromHint) return exactFromHint;
  }

  const fallbackStems = [imageStemFromFrontmatter, cleanFileStem, shortTitle, title];
  for (const stem of fallbackStems) {
    const normalizedStem = normalizeCoverStemForLookup(stem);
    if (!normalizedStem) continue;

    const exact = TYPOLOGY_COVER_LOOKUP.get(normalizedStem);
    if (exact) return exact;

    const bronzeVariant = normalizedStem.replace('bronze', 'broze');
    const exactBronze = TYPOLOGY_COVER_LOOKUP.get(bronzeVariant);
    if (exactBronze) return exactBronze;

    const extremoVariant = normalizedStem.replace('extremo', 'exremo');
    const exactExtremo = TYPOLOGY_COVER_LOOKUP.get(extremoVariant);
    if (exactExtremo) return exactExtremo;
  }

  return undefined;
}

function buildMarkdownBySlugIndex(): Record<string, string> {
  const bySlug: Record<string, string> = {};

  for (const [pathKey, content] of Object.entries(contentMarkdownModules)) {
    const relativePath = toContentRelativePath(pathKey);
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

function buildTypologyMarkdownBySlugIndex(): Record<string, string> {
  const bySlug: Record<string, string> = {};

  for (const [pathKey, content] of Object.entries(typologyMarkdownModules)) {
    const relativePath = extractTypologyDivisionRelativePath(pathKey);
    if (!relativePath) continue;
    const normalizedRelative = stripMarkdownExtension(`tipologia-biblica/${relativePath}`);
    bySlug[normalizedRelative] = content;
    bySlug[normalizeSlugLookupKey(normalizedRelative)] = content;

    // Compatibilidade com slugs antigos que incluíam "divisoes".
    if (!relativePath.startsWith('divisoes/')) {
      const legacyRelative = stripMarkdownExtension(`tipologia-biblica/divisoes/${relativePath}`);
      bySlug[legacyRelative] = content;
      bySlug[normalizeSlugLookupKey(legacyRelative)] = content;
    }
  }

  return bySlug;
}

function discoverTypologyContentEntries(): TypologyContentEntry[] {
  const entries: TypologyContentEntry[] = [];

  for (const [pathKey, content] of Object.entries(typologyMarkdownModules)) {
    const relativePath = extractTypologyDivisionRelativePath(pathKey);
    if (!relativePath) continue;

    const normalizedRelative = stripMarkdownExtension(relativePath);
    const parts = normalizedRelative.split('/').filter(Boolean);
    const normalizedParts = parts[0] === 'divisoes' ? parts.slice(1) : parts;
    if (normalizedParts.length < 3) continue;

    const divisionFolder = normalizedParts[0];
    const seriesFolder = normalizedParts[1];
    const fileStem = normalizedParts[normalizedParts.length - 1] ?? '';
    const typeId = TYPOLOGY_DIVISION_FOLDER_TO_ID[normalizeSlugLookupKey(divisionFolder).replace(/ /g, '-')];
    if (!typeId) continue;

    const frontmatter = parseFrontmatter(content);
    const firstHeading = content.match(/^#\s+(.+)$/m)?.[1]?.trim();
    const title = frontmatter.title || firstHeading || fileStem;
    const slug = `tipologia-biblica/${normalizedRelative}`;
    const seriesCategory = resolveTypologySeriesCategory(seriesFolder);
    const cover = resolveTypologyCover(frontmatter, title, fileStem);

    entries.push({
      typeId,
      seriesCategory,
      topicHint: normalizeSearchToken(frontmatter.category || ''),
      item: {
        title,
        slug,
        description: frontmatter.description || '',
        date: frontmatter.date || '2026-04-24',
        category: seriesCategory,
        time: frontmatter.time || 'LIVRO',
        image: cover,
      },
    });
  }

  return entries;
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
    'satanas-e-demonios',
    'antissistema',
    'ia-e-apocalipse',
    'parabolas-de-jesus',
    'batalha-espiritual',
    'ferramentas-espirituais',
    'fim-dos-tempos',
  ];

  const candidates = [
    resolveContentUrlForDesktopAndWeb(slug),
    `${runtimeBase}content/livraria/${encodedSlug}.md`,
    `${runtimeBase}content/livraria/${slug}.md`,
    `./content/livraria/${encodedSlug}.md`,
    `/content/livraria/${encodedSlug}.md`,
    ...sectionFolders.map((section) => `${runtimeBase}content/livraria/${section}/${encodedSlug}.md`),
    ...sectionFolders.map((section) => `/content/livraria/${section}/${encodedSlug}.md`),
    `${runtimeBase}content/ferramentas-espirituais/${encodedSlug}.md`,
    `/content/ferramentas-espirituais/${encodedSlug}.md`,
  ];

  return Array.from(new Set(candidates));
}

function extractVolumeFromText(raw: string): number | null {
  const match = raw.match(/(?:ebook|livro|parte|volume|vol\.)\s*0*(\d{1,3})/i);
  if (!match) return null;
  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function isWeakRemoteImage(url: string): boolean {
  if (!/^https?:\/\//i.test(url)) return false;
  return WEAK_REMOTE_IMAGE_HOSTS.some((host) => url.toLowerCase().includes(host));
}

function normalizeLocalCoverPath(path: string): string {
  return decodeURI(path)
    .split('?')[0]
    .split('#')[0]
    .replace(/\\/g, '/')
    .trim()
    .toLowerCase();
}

function buildAvailableLocalCoverSet(): Set<string> {
  const available = new Set<string>();
  for (const key of Object.keys(imageModules)) {
    const normalized = key.replace(/\\/g, '/');
    if (!normalized.startsWith('/public/')) continue;
    available.add(normalizeLocalCoverPath(normalized.slice('/public'.length)));
  }
  return available;
}

const AVAILABLE_LOCAL_COVERS = buildAvailableLocalCoverSet();

function isAvailableCoverCandidate(candidate: string): boolean {
  if (candidate.startsWith('/')) {
    return AVAILABLE_LOCAL_COVERS.has(normalizeLocalCoverPath(candidate));
  }
  return /^https?:\/\//i.test(candidate) && !isWeakRemoteImage(candidate);
}

function inferSeriesVolumeCoverStem(title: string, slug: string, category?: string): string | null {
  const volume = extractVolumeFromText(title) ?? extractVolumeFromText(slug);
  if (!volume) return null;
  const haystack = normalizeTitlePreservingPunctuation(`${category || ''} ${title} ${slug}`);

  if (haystack.includes('invasao legal')) return SERIES_VOLUME_COVER_STEMS['invasao legal'][volume] ?? null;
  if (haystack.includes('arquitetura da guerra invisivel')) return SERIES_VOLUME_COVER_STEMS['a arquitetura da guerra invisivel'][volume] ?? null;
  if (haystack.includes('armadura do remanescente')) return SERIES_VOLUME_COVER_STEMS['a armadura do remanescente'][volume] ?? null;
  if (haystack.includes('revelacao do seculo')) return SERIES_VOLUME_COVER_STEMS['a revelacao do seculo'][volume] ?? null;
  if (haystack.includes('relogio de deus')) return SERIES_VOLUME_COVER_STEMS['o relogio de deus'][volume] ?? null;
  if (haystack.includes('terceiro ceu de paulo')) return SERIES_VOLUME_COVER_STEMS['o terceiro ceu de paulo'][volume] ?? null;
  if (haystack.includes('fio do trono')) return SERIES_VOLUME_COVER_STEMS['o fio do trono'][volume] ?? null;
  if (haystack.includes('ruah') || haystack.includes('ruach')) {
    if (volume === 5) return 'ruach o sopro nos ossos secos a nova criacao';
  }
  if (haystack.includes('como nos dias de noe')) return SERIES_VOLUME_COVER_STEMS['como nos dias de noe'][volume] ?? null;
  if (haystack.includes('tabernaculo')) return SERIES_VOLUME_COVER_STEMS['tabernaculo'][volume] ?? null;

  return null;
}

function inferSeriesFallbackCover(title: string, slug: string, category?: string): string | null {
  const haystack = normalizeTitlePreservingPunctuation(`${category || ''} ${title} ${slug}`);
  if (!haystack.includes('armadura do remanescente')) return null;

  const volume = extractVolumeFromText(title) ?? extractVolumeFromText(slug);
  if (volume) {
    const byVolume = SERIES_VOLUME_COVER_STEMS['a armadura do remanescente'][volume];
    if (byVolume) {
      for (const extension of COVER_EXTENSIONS) {
        const path = `/image/selah/${byVolume}.${extension}`;
        if (isAvailableCoverCandidate(path)) return path;
      }
    }
  }

  for (const stem of ['o cinto da verdade', 'couraca da justica', 'o capacete da salvacao', 'a espada do espirito', 'a oracao do espirito']) {
    for (const extension of COVER_EXTENSIONS) {
      const path = `/image/selah/${stem}.${extension}`;
      if (isAvailableCoverCandidate(path)) return path;
    }
  }

  return null;
}

const SELAH_SUBSECTION_FALLBACK_RULES: Partial<Record<SelahThemeTitle, Array<{ subsection: string; matchers: string[] }>>> = {
  'JESUS CRISTO': [
    { subsection: 'Cruz', matchers: ['a cruz no mundo espiritual', 'cruz no mundo espiritual'] },
    { subsection: 'Batalha', matchers: ['invasao legal'] },
  ],
  'BATALHA ESPIRITUAL': [
    { subsection: 'Armadura', matchers: ['armadura do remanescente'] },
    { subsection: 'Oração', matchers: ['o fio do trono'] },
  ],
  'IA & APOCALIPSE': [
    { subsection: 'Marca', matchers: ['trilogia - a marca', 'a marca'] },
  ],
  'APÓCRIFOS': [
    { subsection: 'Enoque', matchers: ['serie - 1 enoque', '1 enoque'] },
    { subsection: 'Jubileus', matchers: ['serie - jubileus', 'jubileus'] },
  ],
};

function extractFrontmatterSubsectionCandidate(frontmatter: Record<string, string>): string {
  const keys = ['subsecao', 'subsection', 'temainterno', 'tema_interno', 'sub_secao', 'sub-secao', 'subcategory', 'category'];
  for (const key of keys) {
    const value = (frontmatter[key] || '').trim();
    if (value) return value;
  }
  return '';
}

function inferSelahSubsectionFromContext(params: {
  themeTitle: SelahThemeTitle | null;
  frontmatterSubsection?: string;
  pathSubsectionCandidate?: string;
  seriesFolder?: string;
  category?: string;
  title?: string;
  description?: string;
}): string | undefined {
  const { themeTitle } = params;
  if (!themeTitle) return undefined;

  const directCandidates = [
    params.frontmatterSubsection || '',
    params.pathSubsectionCandidate || '',
    params.category || '',
  ];

  for (const candidate of directCandidates) {
    const resolved = resolveSelahSubsectionTitle(themeTitle, candidate);
    if (resolved) return resolved;
  }

  const seriesFolder = params.seriesFolder || '';
  const fromSeriesFolder = resolveSelahSubsectionTitle(themeTitle, seriesFolder);
  if (fromSeriesFolder) return fromSeriesFolder;

  const haystack = normalizeSearchToken([
    seriesFolder,
    params.category || '',
    params.title || '',
    params.description || '',
  ].join(' '));

  const rules = SELAH_SUBSECTION_FALLBACK_RULES[themeTitle] ?? [];
  for (const rule of rules) {
    const matches = rule.matchers.some((matcher) => haystack.includes(normalizeSearchToken(matcher)));
    if (!matches) continue;
    const resolved = resolveSelahSubsectionTitle(themeTitle, rule.subsection);
    if (resolved) return resolved;
  }

  return undefined;
}

function inferBookCoverCandidates(frontmatter: Record<string, string>, title: string, slug: string): string[] {
  const candidates = new Set<string>();
  const fromMeta = (frontmatter.image || frontmatter.cover || frontmatter.capa || frontmatter.thumbnail || '').trim();
  const seriesFolder = slug.split('/')[0] ?? '';

  if (fromMeta) {
    if (fromMeta.startsWith('/')) {
      const normalizedMetaPath = fromMeta.startsWith('/public/') ? fromMeta.slice('/public'.length) : fromMeta;
      candidates.add(normalizedMetaPath);
      const metaFileName = normalizedMetaPath.split('/').pop();
      if (metaFileName && seriesFolder) candidates.add(`/image/selah/${seriesFolder}/${metaFileName}`);
      if (metaFileName) candidates.add(`/image/selah/${metaFileName}`);
    } else if (/^https?:\/\//i.test(fromMeta)) {
      if (!isWeakRemoteImage(fromMeta)) candidates.add(fromMeta);
    } else {
      const fileName = fromMeta.replace(/^.*[\\/]/, '');
      candidates.add(`/image/selah/${fileName}`);
      if (seriesFolder) candidates.add(`/image/selah/${seriesFolder}/${fileName}`);
    }
  }

  const normalizedTitle = slugify(title).replace(/-/g, ' ');
  const normalizedTitleNoArticle = normalizedTitle.replace(/^(o|a|os|as)\s+/, '');
  const slugFileName = slug.split('/').pop() ?? slug;
  const normalizedSlug = slugify(slugFileName.replace(/^ebook\s*\d+\s*-\s*/i, '').replace(/^livro\s*\d+\s*-\s*/i, '')).replace(/-/g, ' ');
  const rawStemFromTitle = normalizeTitlePreservingPunctuation(title).replace(/^(o|a|os|as)\s+/, '');
  const rawStemFromFile = normalizeTitlePreservingPunctuation(
    slugFileName.replace(CONTENT_FILE_EXTENSION_REGEX, '').replace(/^ebook\s*\d+\s*-\s*/i, '').replace(/^livro\s*\d+\s*-\s*/i, ''),
  ).replace(/^(o|a|os|as)\s+/, '');
  const shortTitleStem = normalizeTitlePreservingPunctuation(title).split('—')[0]?.split(':')[0]?.trim() || '';
  const seriesVolumeStem = inferSeriesVolumeCoverStem(title, slug, frontmatter.category);
  const normalizedSeriesFolder = normalizeSlugLookupKey(seriesFolder).replace(/-/g, ' ');
  const normalizedHaystack = normalizeTitlePreservingPunctuation(`${frontmatter.category || ''} ${title} ${slug}`);
  const usesTabernacleCovers = normalizedHaystack.includes('tabernaculo')
    || normalizedSeriesFolder === 'a terra e o tabernaculo'
    || normalizedSeriesFolder === 'sombras do reino'
    || normalizedSeriesFolder === 'tabernaculo';

  const variantStems = new Set<string>([
    normalizedTitle,
    normalizedTitleNoArticle,
    normalizedSlug,
    rawStemFromTitle,
    rawStemFromFile,
    shortTitleStem,
    seriesVolumeStem || '',
  ]);
  for (const stem of variantStems) {
    if (!stem) continue;
    for (const extension of COVER_EXTENSIONS) {
      candidates.add(`/image/selah/${stem}.${extension}`);
      if (seriesFolder) candidates.add(`/image/selah/${seriesFolder}/${stem}.${extension}`);
      if (usesTabernacleCovers) candidates.add(`/image/tipos/${stem}.${extension}`);
    }
  }

  return Array.from(candidates);
}

function isRemovedAnthropologySeriesBook(book: BookItem): boolean {
  const haystack = normalizeTitlePreservingPunctuation(`${book.category || ''} ${book.slug || ''} ${book.title || ''}`);
  return haystack.includes('antropologia espiritual') || haystack.includes('como nos dias de noe');
}

function discoverBooksFromMarkdown(): BookItem[] {
  return Object.entries(contentMarkdownModules).map(([pathKey, content]) => {
    const relative = toContentRelativePath(pathKey);

    const parts = relative.split('/').filter(Boolean);
    const fileName = parts[parts.length - 1] ?? '';
    const themeFolder = parts[0] ?? '';
    const themeTitle = resolveSelahThemeTitleFromSlug(themeFolder);
    const possibleSubsectionFromPath = parts.length >= 3 ? (parts[1] ?? '') : '';
    const pathSubsectionCandidate = themeTitle && possibleSubsectionFromPath
      ? (resolveSelahSubsectionTitle(themeTitle, possibleSubsectionFromPath) ? possibleSubsectionFromPath : '')
      : '';
    const seriesFolder = pathSubsectionCandidate
      ? (parts[2] ?? parts[parts.length - 2] ?? parts[0] ?? 'livraria')
      : (parts.length > 1 ? parts[parts.length - 2] : (parts[0] ?? 'livraria'));
    const fileStem = fileName.replace(CONTENT_FILE_EXTENSION_REGEX, '');
    const slug = `${seriesFolder}/${fileStem}`;
    const frontmatter = parseFrontmatter(content);
    const firstHeading = content.match(/^#\s+(.+)$/m)?.[1]?.trim();
    const title = frontmatter.title || firstHeading || fileName.replace(CONTENT_FILE_EXTENSION_REGEX, '');
    const frontmatterSubsection = extractFrontmatterSubsectionCandidate(frontmatter);
    const inferredSubsection = inferSelahSubsectionFromContext({
      themeTitle,
      frontmatterSubsection,
      pathSubsectionCandidate,
      seriesFolder,
      category: frontmatter.category || '',
      title,
      description: frontmatter.description || '',
    });
    const cover =
      inferBookCoverCandidates(frontmatter, title, slug).find((candidate) => isAvailableCoverCandidate(candidate))
      || inferSeriesFallbackCover(title, slug, frontmatter.category);

    return {
      title,
      slug,
      description: frontmatter.description || '',
      date: frontmatter.date || '2026-04-18',
      category: normalizeBookCategory(frontmatter.category, seriesFolder),
      tema: themeTitle ?? undefined,
      subsecao: inferredSubsection,
      time: frontmatter.time || 'LIVRO',
      image: cover,
    };
  });
}

type SectionKey =
  | 'APÓCRIFOS'
  | 'HISTÓRIA DA IGREJA'
  | 'COSMOLOGIA BÍBLICA'
  | 'MUNDO ESPIRITUAL'
  | 'SATANÁS E DEMÔNIOS'
  | 'JESUS CRISTO'
  | 'DEUS PAI'
  | 'ESPÍRITO SANTO'
  | 'REINO DE DEUS'
  | 'ANTISISTEMA'
  | 'IA & APOCALIPSE'
  | 'FIM DOS TEMPOS'
  | 'BATALHA ESPIRITUAL'
  | 'TIPOLOGIA BÍBLICA';

// ── Section metadata ──────────────────────────────────────────────────────────
const SECTIONS: Record<SectionKey, {
  numero: string;
  label: string;
  description: string;
  Icon: React.ElementType;
  accent: string;
}> = {
  'APÓCRIFOS': {
    numero: '08',
    label: 'Apócrifos',
    description: 'Enoque, Jubileus e os textos banidos. A tradição que o cânon oficial não quis preservar.',
    Icon: Shield,
    accent: 'from-amber-900/70 to-amber-800/10',
  },
  'HISTÓRIA DA IGREJA': {
    numero: '09',
    label: 'História da Igreja',
    description: 'A anatomia do dogma e os bastidores do poder. Uma análise sobre a verdadeira história da igreja, a formação de suas doutrinas e como a estrutura religiosa foi utilizada como ferramenta de manipulação e controle sistêmico.',
    Icon: BookOpen,
    accent: 'from-sky-900/70 to-sky-800/10',
  },
  'COSMOLOGIA BÍBLICA': {
    numero: '06',
    label: 'Cosmologia Bíblica',
    description: 'Uma leitura bíblica da criação: firmamento, pilares, quatro cantos, montes e trono. Exegese e contexto do Segundo Templo para reconstruir o mapa cosmológico das Escrituras.',
    Icon: Eye,
    accent: 'from-blue-900/70 to-cyan-800/10',
  },
  'MUNDO ESPIRITUAL': {
    numero: '13',
    label: 'Mundo Espiritual',
    description: 'Cartografia bíblica do mundo invisível: céus, hierarquias, conselho celestial e dinâmica espiritual que atravessa as Escrituras.',
    Icon: Eye,
    accent: 'from-cyan-900/70 to-sky-800/10',
  },
  'SATANÁS E DEMÔNIOS': {
    numero: '10',
    label: 'Satanás e Demônios',
    description: 'A queda do querubim, a rebelião dos seres espirituais e a disputa pela autoridade das nações. Estudos bíblicos sobre origem, atuação e destino do império das trevas.',
    Icon: Flame,
    accent: 'from-rose-950/70 to-red-900/20',
  },
  'TIPOLOGIA BÍBLICA': {
    numero: '00',
    label: 'Tipologia',
    description: 'Como um Deus infinito usa uma tenda portátil para explicar o universo. As bases teológicas da tipologia bíblica — tavnit, hypodeigma e skia — e o que significa que o tabernáculo foi construído como réplica de uma realidade celestial.',
    Icon: Layers,
    accent: 'from-indigo-900/70 to-indigo-800/10',
  },
  'JESUS CRISTO': {
    numero: '01',
    label: 'Jesus Cristo',
    description: 'Estudos e séries centrados na pessoa, missão, autoridade e obra de Cristo.',
    Icon: Sparkles,
    accent: 'from-amber-900/70 to-yellow-800/10',
  },
  'DEUS PAI': {
    numero: '02',
    label: 'Deus Pai',
    description: 'Estudos sobre o Pai: paternidade divina, governo, aliança, justiça e revelação nas Escrituras.',
    Icon: Shield,
    accent: 'from-sky-900/70 to-cyan-800/10',
  },
  'ESPÍRITO SANTO': {
    numero: '03',
    label: 'Espírito Santo',
    description: 'Conteúdos sobre a pessoa e a obra do Espírito: santificação, direção, dons e discernimento espiritual.',
    Icon: BookOpen,
    accent: 'from-teal-900/70 to-cyan-800/10',
  },
  'REINO DE DEUS': {
    numero: '05',
    label: 'Reino de Deus',
    description: 'Uma jornada bíblica pelo Reino de Deus, conselho celeste e realidades invisíveis. Em Hebreus 8, o texto diz que servem como “exemplar e sombra das coisas celestiais”. Como é o mundo espiritual? A Bíblia responde.',
    Icon: Eye,
    accent: 'from-violet-900/70 to-violet-800/10',
  },
  'ANTISISTEMA': {
    numero: '12',
    label: 'Antissistema',
    description: 'Os protocolos de sobrevivência espiritual dentro de sistemas hostis. Daniel, José e os que atravessaram.',
    Icon: Zap,
    accent: 'from-emerald-900/70 to-emerald-800/10',
  },
  'IA & APOCALIPSE': {
    numero: '11',
    label: 'IA & Apocalipse',
    description: 'Controle tecnológico, a Marca e os mecanismos proféticos que moldam o fim dos tempos.',
    Icon: Cpu,
    accent: 'from-rose-900/70 to-rose-800/10',
  },
  'FIM DOS TEMPOS': {
    numero: '07',
    label: 'Fim dos Tempos',
    description: 'Escatologia bíblica, sinais proféticos e a reta final da história sob a perspectiva das Escrituras.',
    Icon: Hourglass,
    accent: 'from-orange-900/70 to-amber-800/10',
  },
  'BATALHA ESPIRITUAL': {
    numero: '04',
    label: 'Batalha Espiritual',
    description: 'Discernimento, resistência e estratégias bíblicas para enfrentar as guerras invisíveis do nosso tempo.',
    Icon: Flame,
    accent: 'from-red-900/70 to-red-800/10',
  },
};

const SECTION_ORDER: SectionKey[] = [
  ...SELAH_THEME_TITLES_IN_ORDER,
];

// Maps existing category strings → top-level section
const CATEGORY_TO_SECTION: Record<string, SectionKey> = {
  'A REVELAÇÃO DE ENOQUE':                   'APÓCRIFOS',
  'SÉRIE — JUBILEUS':                        'APÓCRIFOS',
  'Trilogia — O Cânon Oculto':                'HISTÓRIA DA IGREJA',
  'Série — A Verdadeira História da Igreja':  'HISTÓRIA DA IGREJA',
  'COSMOLOGIA BÍBLICA':                       'COSMOLOGIA BÍBLICA',
  'cosmologia biblica':                       'COSMOLOGIA BÍBLICA',
  'cosmologia-biblica':                       'COSMOLOGIA BÍBLICA',
  'Série — Terra Plana na Bíblia':            'COSMOLOGIA BÍBLICA',
  'TIPOLOGIA BÍBLICA':                        'TIPOLOGIA BÍBLICA',
  'Série — Sombras do Reino':                 'TIPOLOGIA BÍBLICA',
  'Série — A Terra e o Tabernáculo':          'TIPOLOGIA BÍBLICA',
  'TABERNACULO':                              'TIPOLOGIA BÍBLICA',
  'tabernaculo':                              'TIPOLOGIA BÍBLICA',
  'tipologia/tabernaculo':                    'TIPOLOGIA BÍBLICA',
  'tipologia tabernaculo':                    'TIPOLOGIA BÍBLICA',
  'sombras do reino':                         'TIPOLOGIA BÍBLICA',
  'a terra e o tabernaculo':                  'TIPOLOGIA BÍBLICA',
  'SOMBRAS DO REINO DE DEUS':                 'MUNDO ESPIRITUAL',
  'Série — As Origens do Sábado':             'BATALHA ESPIRITUAL',
  'Série — O Relógio Escatológico':           'FIM DOS TEMPOS',
  'Série — Parábolas de Jesus':               'JESUS CRISTO',
  'Série — O Código do Jardim':               'IA & APOCALIPSE',
  'Série — A Queda do Mundo Espiritual':      'SATANÁS E DEMÔNIOS',
  'Série — A Queda do Querubim Ungido':       'SATANÁS E DEMÔNIOS',
  'Série — O Terceiro Céu de Paulo':          'MUNDO ESPIRITUAL',
  'Série — O Fio do Trono':                   'BATALHA ESPIRITUAL',
  'Série — Como nos Dias de Noé':             'ESPÍRITO SANTO',
  'Série — Ruah — A Pessoa Esquecida da Divindade': 'ESPÍRITO SANTO',
  'Série — A Blasfêmia contra o Ruah':        'ESPÍRITO SANTO',
  'Trilogia — O Mapa da Tempestade':          'ANTISISTEMA',
  'Trilogia — O Estrangeiro Próspero':        'ANTISISTEMA',
  'Trilogia — A Ciência dos Tempos':          'ANTISISTEMA',
  'Trilogia — A Marca':                       'IA & APOCALIPSE',
  'Trilogia — O Véu Rasgado':                 'IA & APOCALIPSE',
  'Trilogia — A Coroa Roubada':               'SATANÁS E DEMÔNIOS',
  'Série — O Código das Eras':                'FIM DOS TEMPOS',
  'Série — A Revelação do Século':            'FIM DOS TEMPOS',
  'Série — A Onisciência como Atributo Exclusivo': 'IA & APOCALIPSE',
  'Série — O Relógio de Deus':              'APÓCRIFOS',
  'Série — Invasão Legal':                    'JESUS CRISTO',
  'série — invasão legal':                    'JESUS CRISTO',
  'Série — A Cruz no Mundo Espiritual':       'JESUS CRISTO',
  'Série — A Armadura do Remanescente':       'BATALHA ESPIRITUAL',
  'Série — A Arquitetura da Guerra Invisível': 'BATALHA ESPIRITUAL',
  'FIM DOS TEMPOS':                           'FIM DOS TEMPOS',
  'batalha-espiritual':                       'BATALHA ESPIRITUAL',
  'deus-pai':                                 'DEUS PAI',
  'espirito-santo':                           'ESPÍRITO SANTO',
  'reino-de-deus':                            'REINO DE DEUS',
  'reino de deus':                            'REINO DE DEUS',
  'MUNDO ESPIRITUAL':                         'MUNDO ESPIRITUAL',
  'mundo espiritual':                         'MUNDO ESPIRITUAL',
  'mundo-espiritual':                         'MUNDO ESPIRITUAL',
  'satanas e demonios':                       'SATANÁS E DEMÔNIOS',
  'satanas-e-demonios':                       'SATANÁS E DEMÔNIOS',
  'apocrifos':                                'APÓCRIFOS',
  'ia-e-apocalipse':                          'IA & APOCALIPSE',
  'fim dos tempos':                           'FIM DOS TEMPOS',
  'fim-dos-tempos':                           'FIM DOS TEMPOS',
  'parabolas de jesus':                       'JESUS CRISTO',
  'parabolas-de-jesus':                       'JESUS CRISTO',
};

const SELAH_THEME_BY_SECTION: Partial<Record<SectionKey, SelahThemeTitle>> = SELAH_THEME_TITLES_IN_ORDER.reduce((acc, themeTitle) => {
  acc[themeTitle] = themeTitle;
  return acc;
}, {} as Partial<Record<SectionKey, SelahThemeTitle>>);

function resolveSelahTheme(book: BookItem): SelahThemeTitle | null {
  const rawTheme = (book.tema || '').trim();
  if (rawTheme && SELAH_THEME_BY_TITLE[rawTheme]) {
    return rawTheme as SelahThemeTitle;
  }
  if (rawTheme) {
    const resolvedFromSlug = resolveSelahThemeTitleFromSlug(rawTheme);
    if (resolvedFromSlug) return resolvedFromSlug;
  }

  const category = (book.category || '').trim();
  const section = CATEGORY_TO_SECTION[category] ?? CATEGORY_TO_SECTION[category.toLowerCase()];
  if (section && SELAH_THEME_BY_SECTION[section]) {
    return SELAH_THEME_BY_SECTION[section] ?? null;
  }

  return null;
}

function resolveSectionFromThemeSlug(themeSlug: string): SectionKey | null {
  const themeTitle = resolveSelahThemeTitleFromSlug(themeSlug);
  if (!themeTitle) return null;
  return themeTitle as SectionKey;
}

function resolveSubsecaoFromSlug(theme: SelahThemeTitle, subsecaoSlug: string): string | null {
  return resolveSelahSubsectionTitle(theme, subsecaoSlug);
}

// Short display labels per series
const SERIES_LABEL: Record<string, string> = {
  'COSMOLOGIA BÍBLICA':                       'Cosmologia Bíblica',
  'cosmologia-biblica':                       'Terra Plana na Bíblia',
  'Série — Terra Plana na Bíblia':            'Terra Plana na Bíblia',
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
  'Série — Sombras do Reino':                 'Sombras do Reino',
  'Série — A Terra e o Tabernáculo':          'A Terra e o Tabernáculo',
  'Série — O Tetravéu':                       'O Tetravéu',
  'Série — O Relógio do Santuário':           'O Relógio do Santuário',
  'Série — O Código do Jardim':               'O Código do Jardim',
  'Série — A Queda do Mundo Espiritual':      'A Queda do Mundo Espiritual',
  'Série — A Queda do Querubim Ungido':       'A Queda do Querubim Ungido',
  'Série — O Terceiro Céu de Paulo':          'O Terceiro Céu de Paulo',
  'Série — O Fio do Trono':                   'O Fio do Trono',
  'Série — Como nos Dias de Noé':             'Como nos Dias de Noé',
  'Série — Ruah — A Pessoa Esquecida da Divindade': 'Ruah',
  'Série — A Blasfêmia contra o Ruah':        'A Blasfêmia contra o Ruah',
  'Série — A Verdadeira História da Igreja':  'A Verdadeira História da Igreja',
  'Série — O Código das Eras':                'O Código das Eras',
  'Série — Parábolas de Jesus':               'Parábolas de Jesus',
  'Série — A Revelação do Século':            'A Revelação do Século',
  'Série — A Onisciência como Atributo Exclusivo': 'A Onisciência como Atributo Exclusivo',
  'Série — O Relógio de Deus':               'O Relógio de Deus',
  'Série — Invasão Legal':                    'Invasão Legal',
  'Série — A Cruz no Mundo Espiritual':       'A Cruz no Mundo Espiritual',
  'Série — A Armadura do Remanescente':       'A Armadura do Remanescente',
  'Série — A Arquitetura da Guerra Invisível': 'A Arquitetura da Guerra Invisível',
  'TIPOLOGIA BÍBLICA':                        'Tipologia Bíblica',
  'TABERNACULO':                              'TABERNACULO',
};

// Description shown below each series header
const SERIES_DESCRIPTION: Record<string, string> = {
  'COSMOLOGIA BÍBLICA': 'Como a Bíblia usa tipologia para nos ensinar as verdades da terra, do universo e do Seu Reino.',
  'cosmologia-biblica': 'Uma série exegética sobre terra plana na Bíblia: tabernáculo, firmamento, montes sagrados, fronteiras das nações e geografia espiritual como linguagem do governo de Deus.',
  'Série — Terra Plana na Bíblia': 'Uma série exegética sobre terra plana na Bíblia: tabernáculo, firmamento, montes sagrados, fronteiras das nações e geografia espiritual como linguagem do governo de Deus.',
  'A REVELAÇÃO DE ENOQUE': 'Uma jornada profunda pelas visões e revelações do profeta Enoque sobre o mundo espiritual, os vigilantes e o destino da humanidade.',
  'SÉRIE — JUBILEUS': 'O livro que Moisés recebeu dos anjos e que a tradição oficial silenciou. Uma jornada pelos segredos do calendário sagrado, dos patriarcas e da guerra invisível que moldou a história bíblica.',
  'SOMBRAS DO REINO DE DEUS': 'Uma leitura bíblica do mundo espiritual: Reino de Deus, conselho celeste e as realidades invisíveis que Hebreus 8:5 chama de sombra das coisas celestiais.',
  'Série — Sombras do Reino': 'Uma série tipológica sobre o tabernáculo como sombra das realidades celestiais, com foco em Cristo, no Reino e na unidade da Escritura.',
  'Série — A Terra e o Tabernáculo': 'Uma série sobre cosmografia bíblica e tabernáculo: pátio, firmamento, véu, fundamentos, mar de bronze e o trono, em leitura tipológica estruturada.',
  'Série — O Tetravéu': 'Da camada visível ao limite do invisível: uma leitura progressiva do linho, do pelo de cabra e das peles que cobrem o tabernáculo para revelar separação, proteção, glória e acesso na cosmografia bíblica.',
  'Série — O Relógio do Santuário': 'Uma série sobre o relógio do santuário: menorá, mesa dos pães, incenso e sábado como linguagem temporal do Reino.',
  'Série — O Código do Jardim': 'Uma série sobre os arquétipos de Gênesis: conhecimento, nomeação, Babel e sabedoria para discernir o conflito espiritual no presente.',
  'Série — A Queda do Mundo Espiritual': 'Uma série sobre a rebelião no céu e a origem da guerra espiritual: Nachash, querubins caídos e as raízes invisíveis do conflito humano.',
  'Série — A Queda do Querubim Ungido': 'Uma investigação bíblica da trajetória de Satanás: da glória no conselho divino à consumação do juízo final, com aplicações práticas para discernimento espiritual.',
  'Série — O Terceiro Céu de Paulo': 'Uma jornada pelos céus descritos na literatura judaica e apostólica, conectando Levi, Baruque, Isaías, Enoque e Paulo na cartografia do mundo celestial.',
  'Série — O Fio do Trono': 'Uma série sobre oração bíblica como governo espiritual: aliança, intercessão, prática do Segundo Templo e a formação de uma vida de súplica no Espírito.',
  'Série — Como nos Dias de Noé': 'Uma série sobre antropologia espiritual e os limites da natureza humana: alma, espírito, corpo, corrupção, juízo, ressurreição e discernimento diante do transhumanismo.',
  'Série — Ruah — A Pessoa Esquecida da Divindade': 'Uma série sobre a pessoa e a obra do Espírito Santo: criação, selo, guia, santificação e nova criação em Cristo.',
  'Série — A Blasfêmia contra o Ruah': 'Estudos sobre o ensino de Jesus a respeito da blasfêmia contra o Espírito e o discernimento bíblico desse tema.',
  'Série — A Verdadeira História da Igreja': 'Uma arqueologia da fé cristã primitiva, revelando o caminho entre a ekklesia viva e a institucionalização religiosa ao longo dos séculos.',
  'Trilogia — O Cânon Oculto': 'Uma imersão nos bastidores da formação bíblica, nos textos suprimidos e nas leituras que ficaram fora da narrativa oficial.',
  'Trilogia — O Mapa da Tempestade': 'Um diagnóstico de ruptura civilizacional e um mapa prático para atravessar colapsos sistêmicos com lucidez, preparo e fé.',
  'Trilogia — O Estrangeiro Próspero': 'Princípios de José e Daniel para prosperar dentro do sistema sem perder identidade, integridade e aliança.',
  'Trilogia — A Ciência dos Tempos': 'Discernimento profético e estratégico para ler ciclos históricos, interpretar sinais e agir com precisão em tempos críticos.',
  'Trilogia — A Marca': 'Uma análise bíblica e contemporânea sobre controle, tecnologia e os mecanismos de conformação espiritual dos últimos tempos.',
  'Trilogia — O Véu Rasgado': 'Uma investigação sobre Babel, CERN e conhecimento proibido na fronteira entre tecnologia, mundo invisível e profecia bíblica.',
  'Trilogia — A Coroa Roubada': 'Uma trilogia sobre conselho divino, queda dos príncipes e restauração da autoridade dos filhos em Cristo.',
  'Série — O Código das Eras': 'Uma leitura profética das eras bíblicas: sinais celestes, ciclos históricos e convergência escatológica até a consumação do Reino.',
  'Série — Parábolas de Jesus': 'Uma série de estudos sobre as parábolas de Cristo, conectando contexto do Segundo Templo, linguagem simbólica e prática do Reino.',
  'Série — A Revelação do Século': 'Uma série escatológica com os marcos proféticos do juízo final: vigilantes, cronogramas, queda de Babilônia, além, guerra final e consumação do Reino.',
  'Série — A Onisciência como Atributo Exclusivo': 'Uma série sobre a diferença entre a onisciência absoluta de Deus e o conhecimento inferido do inimigo, conectando teologia bíblica, tecnologia e discernimento contemporâneo.',
  'Série — O Relógio de Deus': 'Uma série sobre o calendário divino, a guerra dos tempos e a restauração do relógio bíblico revelado em Jubileus, Enoque e Apocalipse.',
  'Série — Invasão Legal': 'Uma série sobre a ofensiva judicial do Reino contra os poderes das trevas: cruz, tribunal celestial, ocupação territorial e execução da sentença final.',
  'Série — A Cruz no Mundo Espiritual': 'Uma série cristocêntrica sobre as operações invisíveis da cruz: trevas no Calvário, véu rasgado, descida ao Hades, despojamento dos principados e derrota do acusador.',
  'Série — A Armadura do Remanescente': 'Uma série prática sobre preparo espiritual do remanescente: verdade, justiça e permanência no dia mau.',
  'Série — A Arquitetura da Guerra Invisível': 'Uma série sobre a estrutura da guerra espiritual: hierarquia do adversário, atuação de Miguel, cartografia dos principados e estratégias de combate bíblico para o remanescente.',
  'TIPOLOGIA BÍBLICA': 'Tipologia bíblica organizada por oito tipos de leitura para mapear pessoas, eventos, instituições, objetos, lugares, rituais, ciclos históricos e consumação escatológica.',
  'TABERNACULO': 'Como um Deus infinito usa uma tenda portátil para explicar o universo. As bases teológicas da tipologia bíblica — tavnit, hypodeigma e skia — e o que significa que o tabernáculo foi construído como réplica de uma realidade celestial.',
};

const FIREFLY_PARTICLES = [
  { left: '7%', top: '12%', size: 4, delay: '0s', duration: '11s' },
  { left: '18%', top: '34%', size: 3, delay: '1.2s', duration: '13s' },
  { left: '28%', top: '22%', size: 2, delay: '0.6s', duration: '10s' },
  { left: '41%', top: '14%', size: 3, delay: '1.8s', duration: '14s' },
  { left: '56%', top: '29%', size: 4, delay: '0.2s', duration: '12s' },
  { left: '67%', top: '18%', size: 2, delay: '2.2s', duration: '9s' },
  { left: '74%', top: '35%', size: 3, delay: '0.9s', duration: '15s' },
  { left: '88%', top: '16%', size: 4, delay: '1.4s', duration: '13s' },
];

const TYPOLOGY_TYPES: TypologyTypeMeta[] = [
  {
    id: 'tipologia-pessoal',
    label: 'TIPO 1',
    numero: '01',
    titulo: 'Tipologia Pessoal',
    subtitulo: 'Tipos Humanos',
    descricao: 'Pessoas do Antigo Testamento cujo ofício, vida ou caráter prefiguram Cristo, a igreja e realidades futuras.',
    exemplos: ['Adão', 'Melquisedeque', 'José', 'Moisés', 'Davi', 'Elias', 'Jonas'],
  },
  {
    id: 'tipologia-eventual',
    label: 'TIPO 2',
    numero: '02',
    titulo: 'Tipologia Eventual',
    subtitulo: 'Eventos',
    descricao: 'Acontecimentos históricos que funcionam como protótipos da redenção e do juízo.',
    exemplos: ['Dilúvio', 'Êxodo', 'Travessia do Mar Vermelho', 'Queda de Jericó'],
  },
  {
    id: 'tipologia-institucional',
    label: 'TIPO 3',
    numero: '03',
    titulo: 'Tipologia Institucional',
    subtitulo: 'Instituições',
    descricao: 'Estruturas permanentes de Israel que apontam para realidades da Nova Aliança.',
    exemplos: ['Sacerdócio levítico', 'Sacrifícios', 'Sábado', 'Jubileu'],
  },
  {
    id: 'tipologia-objetal',
    label: 'Tipologia 4',
    numero: '04',
    titulo: 'Tipologia Objetal',
    subtitulo: 'Tipos Objetos',
    descricao: 'Como os objetos na Bíblia representam realidades espirituais: tabernáculo, arca e utensílios como sombra do que existe no Reino de Deus.',
    exemplos: [
      'Tabernáculo',
      'Arca / Propiciatório',
      'Menorá',
      'Pães',
      'Altar do Incenso',
      'Véu / Tetravéu',
      'Peles do Tabernáculo',
    ],
  },
  {
    id: 'tipologia-locativa',
    label: 'TIPO 5',
    numero: '05',
    titulo: 'Tipologia Locativa',
    subtitulo: 'Lugares',
    descricao: 'Espaços geográficos que antecipam realidades espirituais e escatológicas.',
    exemplos: ['Éden', 'Moriá', 'Sinai', 'Deserto'],
  },
  {
    id: 'tipologia-ritual',
    label: 'TIPO 6',
    numero: '06',
    titulo: 'Tipologia Ritual',
    subtitulo: 'Ações Litúrgicas',
    descricao: 'Gestos litúrgicos de Israel que prefiguram a obra de Cristo e a vida no Espírito.',
    exemplos: ['Aspersão de sangue', 'Imposição de mãos', 'Circuncisão', 'Unção'],
  },
  {
    id: 'tipologia-historica',
    label: 'TIPO 7',
    numero: '07',
    titulo: 'Tipologia Histórica',
    subtitulo: 'Padrões Cíclicos',
    descricao: 'Padrões recorrentes na história da redenção que mostram a coerência do agir de Deus.',
    exemplos: ['Cativeiros sucessivos', 'Aliança', 'Quebra', 'Restauração', 'Progressão templária'],
  },
  {
    id: 'tipologia-escatologica',
    label: 'TIPO 8',
    numero: '08',
    titulo: 'Tipologia Escatológica',
    subtitulo: 'Consumação',
    descricao: 'Realidades já inauguradas que apontam para o cumprimento final em Cristo.',
    exemplos: ['Morte', 'Ressurreição'],
  },
];

const TYPOLOGY_BG_BY_TYPE: Record<TypologyDivisionId, string> = {
  'tipologia-pessoal': 'from-[#251a12] via-[#171310] to-[#0f0f0f]',
  'tipologia-eventual': 'from-[#241915] via-[#171312] to-[#101010]',
  'tipologia-institucional': 'from-[#201a13] via-[#151312] to-[#0f0f0f]',
  'tipologia-objetal': 'from-[#1f1a15] via-[#141210] to-[#0f0f0f]',
  'tipologia-locativa': 'from-[#231c14] via-[#161310] to-[#0f0f0f]',
  'tipologia-ritual': 'from-[#241a14] via-[#161210] to-[#0f0f0f]',
  'tipologia-historica': 'from-[#211a13] via-[#151211] to-[#0f0f0f]',
  'tipologia-escatologica': 'from-[#231a12] via-[#16120f] to-[#0f0f0f]',
};

function FireflyLayer() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {FIREFLY_PARTICLES.map((dot, index) => (
        <span
          key={`${dot.left}-${dot.top}-${index}`}
          className="absolute rounded-full bg-[#ffdcae]/70 shadow-[0_0_10px_rgba(242,192,141,0.65)]"
          style={{
            left: dot.left,
            top: dot.top,
            width: dot.size,
            height: dot.size,
            animation: `firefly-drift ${dot.duration} ease-in-out ${dot.delay} infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}

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

  const seriesLabel = toSeriesDisplayLabel(category);
  return `${seriesLabel}: coleção de estudos e livros com análise bíblica, histórica e aplicação prática.`;
}

function toSeriesDisplayLabel(category: string): string {
  const mapped = SERIES_LABEL[category] ?? category;
  return mapped.replace(/^s[ée]rie\s*[—-]\s*/i, '').trim();
}

function extractVolumeFromBook(item: BookItem): number | null {
  const byTitle = item.title.match(/(?:ebook|livro|volume|vol\.)\s*0*(\d{1,3})/i);
  if (byTitle) return Number.parseInt(byTitle[1], 10);

  const slugPart = item.slug.split('/').pop() ?? '';
  const bySlug = slugPart.match(/(?:ebook|livro|parte)\s*0*(\d{1,3})/i);
  if (bySlug) return Number.parseInt(bySlug[1], 10);

  return null;
}

function sortBooksInSeries(category: string, items: BookItem[]): BookItem[] {
  if (category === 'Série — A Queda do Querubim Ungido') {
    const manualPriority = (title: string): number => {
      const normalized = title
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
      if (normalized.includes('antes da queda')) return 1;
      if (normalized.includes('o pecado que quebrou o ceu')) return 2;
      return 99;
    };

    return [...items].sort((a, b) => {
      const pa = manualPriority(a.title);
      const pb = manualPriority(b.title);
      if (pa !== pb) return pa - pb;

      const va = extractVolumeFromBook(a);
      const vb = extractVolumeFromBook(b);
      if (va !== null && vb !== null && va !== vb) return va - vb;
      if (va !== null && vb === null) return -1;
      if (va === null && vb !== null) return 1;
      return a.title.localeCompare(b.title, 'pt-BR');
    });
  }

  return [...items].sort((a, b) => {
    const va = extractVolumeFromBook(a);
    const vb = extractVolumeFromBook(b);
    if (va !== null && vb !== null && va !== vb) return va - vb;
    if (va !== null && vb === null) return -1;
    if (va === null && vb !== null) return 1;
    return a.title.localeCompare(b.title, 'pt-BR');
  });
}

function getSeriesBadgeLabel(_section: SectionKey, category: string): 'SÉRIE' | 'TRILOGIA' {
  const normalized = slugify(category).replace(/-/g, ' ');
  if (normalized.startsWith('trilogia ')) return 'TRILOGIA';
  return 'SÉRIE';
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
  const drag = useRef({ isDown: false, startX: 0, scrollLeft: 0 });

  return (
    <div
      ref={rowRef}
      data-scroll-row="true"
      className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 sm:pb-4 snap-x snap-mandatory cursor-grab active:cursor-grabbing [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      onPointerDown={(e) => {
        if (e.pointerType !== 'mouse' || e.button !== 0) return;
        const el = rowRef.current;
        if (!el) return;
        // Não chamar setPointerCapture — ver comentário acima
        drag.current = { isDown: true, startX: e.clientX, scrollLeft: el.scrollLeft };
      }}
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse' || !drag.current.isDown) return;
        const el = rowRef.current;
        if (!el) return;
        const walk = e.clientX - drag.current.startX;
        el.scrollLeft = drag.current.scrollLeft - walk;
      }}
      onPointerUp={() => {
        drag.current.isDown = false;
      }}
      onPointerLeave={() => {
        // Mouse saiu do container durante o arrasto — reseta estado
        drag.current.isDown = false;
      }}
    >
      {children}
    </div>
  );
}

// ── Book Card ─────────────────────────────────────────────────────────────────
function BookCard({ item, displayVolume, onSelect }: { item: BookItem; displayVolume: number; onSelect: () => void }) {
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
          Vol. {String(displayVolume).padStart(2, '0')}
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

function TypePreviewBookCard({ item, onSelect }: { item: BookItem; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group shrink-0 w-[122px] sm:w-[148px] snap-start text-left"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-primary/25 bg-black/30">
        <div className="absolute inset-0 bg-gradient-to-br from-[#201913] via-[#141210] to-[#0f0f0f]" />
        {item.image && (
          <AppImage
            src={item.image}
            alt={item.title}
            className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
            fallbackClassName="opacity-80"
          />
        )}
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(242,192,141,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(242,192,141,0.08)_1px,transparent_1px)] [background-size:16px_16px]" />
      </div>
      <p className="mt-1.5 sm:mt-2 text-[8px] sm:text-[9px] text-on-surface-variant/85 leading-snug line-clamp-2 font-semibold">
        {item.title}
      </p>
    </button>
  );
}

function TypeExamplePlate({ label }: { label: string }) {
  return (
    <div className="shrink-0 w-[122px] sm:w-[148px] h-[94px] sm:h-[108px] snap-start rounded-xl border border-primary/25 bg-gradient-to-br from-[#1f1a15] via-[#141210] to-[#101010] p-2.5 sm:p-3 flex items-end">
      <p className="text-[9px] sm:text-[10px] font-semibold leading-snug text-on-surface-variant/90">{label}</p>
    </div>
  );
}

function TypologyObjectalTopicCard({
  id,
  label,
  imageSrc,
  onClick,
  isActive,
}: {
  id: string;
  label: string;
  imageSrc?: string;
  onClick: () => void;
  isActive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-full overflow-hidden rounded-xl border bg-gradient-to-br from-[#1e1915] via-[#131110] to-[#0c0c0c] text-left shadow-[0_12px_28px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/55 hover:shadow-[0_20px_36px_rgba(0,0,0,0.48)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${isActive ? 'border-primary/65 ring-1 ring-primary/45' : 'border-primary/30'}`}
      aria-pressed={isActive}
      aria-controls={`typology-objectal-topic-${id}`}
    >
      <div className="relative aspect-[16/9] w-full">
        {imageSrc ? (
          <AppImage
            src={imageSrc}
            alt={label}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            fallbackClassName="opacity-95"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_24%,rgba(242,192,141,0.28),transparent_42%),radial-gradient(circle_at_85%_20%,rgba(212,165,116,0.14),transparent_44%),linear-gradient(130deg,#181411_0%,#10100f_58%,#0b0b0b_100%)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/35 to-transparent" />
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(242,192,141,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(242,192,141,0.07)_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="relative flex h-full flex-col justify-end p-2.5 sm:p-3">
          <span className="inline-flex w-fit rounded-full border border-primary/35 bg-black/45 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.14em] text-primary">
            Abrir tópico
          </span>
          <p className="mt-1 text-[10px] sm:text-[11px] font-semibold leading-snug text-on-surface">{label}</p>
        </div>
      </div>
    </button>
  );
}

function TypologyObjectalStudyDeck({
  topics,
  onOpenTopic,
  activeTopicId,
  badgeTitle = 'Tópicos Objetais',
}: {
  topics: {
    id: string;
    label: string;
    imageSrc?: string;
  }[];
  onOpenTopic: (topicId: string) => void;
  activeTopicId: string | null;
  badgeTitle?: string;
}) {
  const [desktopPage, setDesktopPage] = useState(0);
  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(topics.length / pageSize));
  const canPaginate = totalPages > 1;
  const desktopTopics = topics.slice(desktopPage * pageSize, (desktopPage + 1) * pageSize);

  useEffect(() => {
    setDesktopPage(0);
  }, [topics.length]);

  return (
    <div>
      <div className="mb-2 hidden sm:flex items-center justify-between gap-3">
        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-primary/80">
          {badgeTitle}
        </p>
        {canPaginate && (
          <div className="inline-flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setDesktopPage((current) => Math.max(0, current - 1))}
              disabled={desktopPage === 0}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-outline-variant/45 bg-black/35 text-on-surface-variant transition-colors hover:border-primary/55 hover:text-primary disabled:cursor-not-allowed disabled:opacity-45"
              aria-label="Página anterior dos tópicos"
            >
              <ChevronLeft size={13} />
            </button>
            <span className="text-[9px] font-black uppercase tracking-[0.14em] text-on-surface-variant/70">
              {desktopPage + 1}/{totalPages}
            </span>
            <button
              type="button"
              onClick={() => setDesktopPage((current) => Math.min(totalPages - 1, current + 1))}
              disabled={desktopPage >= totalPages - 1}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-outline-variant/45 bg-black/35 text-on-surface-variant transition-colors hover:border-primary/55 hover:text-primary disabled:cursor-not-allowed disabled:opacity-45"
              aria-label="Próxima página dos tópicos"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        )}
      </div>

      <div className="hidden sm:grid sm:grid-cols-3 gap-3">
        {desktopTopics.map((topic) => (
          <TypologyObjectalTopicCard
            id={topic.id}
            key={topic.label}
            label={topic.label}
            imageSrc={topic.imageSrc}
            isActive={activeTopicId === topic.id}
            onClick={() => onOpenTopic(topic.id)}
          />
        ))}
      </div>

      <div className="sm:hidden flex gap-2.5 overflow-x-auto snap-x snap-mandatory pb-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {topics.map((topic) => (
          <div key={topic.label} className="w-[77vw] max-w-[300px] shrink-0 snap-start">
            <TypologyObjectalTopicCard
              id={topic.id}
              label={topic.label}
              imageSrc={topic.imageSrc}
              isActive={activeTopicId === topic.id}
              onClick={() => onOpenTopic(topic.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function TypologyTypeCard({
  type,
  previewBooks,
  onEnter,
  onSelectBook,
}: {
  type: TypologyTypeMeta;
  previewBooks: BookItem[];
  onEnter: () => void;
  onSelectBook: (slug: string) => void;
}) {
  const rowRef = useRef<HTMLDivElement | null>(null);

  const scrollByAmount = (delta: number) => {
    rowRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-[#1f1a15] via-[#151312] to-[#101010] p-4 sm:p-5 shadow-[0_18px_42px_rgba(0,0,0,0.38)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/55 hover:shadow-[0_22px_50px_rgba(0,0,0,0.5)]">
      <div className="pointer-events-none absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_90%_10%,rgba(242,192,141,0.2),transparent_45%)]" />
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${TYPOLOGY_BG_BY_TYPE[type.id]} opacity-40`} />
      <div className="pointer-events-none absolute right-2 top-0 text-[62px] sm:text-[84px] font-black tracking-tighter text-primary/10 select-none">
        {type.numero}
      </div>

      <div className="relative z-10">
        <div className="mb-2.5 sm:mb-3 flex items-center justify-between gap-2">
          <span className="inline-flex rounded-full border border-primary/35 bg-primary/10 px-2 py-0.5 sm:py-1 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.17em] text-primary">
            {type.label}
          </span>
          <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary/85" />
        </div>

        <h3 className="font-headline text-2xl sm:text-3xl leading-none font-black text-on-surface mb-1.5 sm:mb-2">{type.titulo}</h3>
        <p className="text-xs sm:text-sm font-semibold text-primary/90 mb-1.5 sm:mb-2">{type.subtitulo}</p>
        <p className="text-[11px] sm:text-xs text-on-surface-variant leading-relaxed mb-3 sm:mb-4">{type.descricao}</p>

        <div className="border-t border-primary/15 pt-2.5 sm:pt-3">
          <div className="mb-1.5 sm:mb-2 flex items-center justify-between">
            <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.18em] text-primary/80">Conteúdo deste tipo</p>
            <div className={`${previewBooks.length > 0 ? 'hidden sm:flex' : 'hidden'} items-center gap-1`}>
              <button
                type="button"
                onClick={() => scrollByAmount(-180)}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-outline-variant/40 bg-black/40 text-on-surface-variant hover:border-primary/50 hover:text-primary transition-colors"
                aria-label={`Voltar exemplos de ${type.titulo}`}
              >
                <ChevronLeft size={12} />
              </button>
              <button
                type="button"
                onClick={() => scrollByAmount(180)}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-outline-variant/40 bg-black/40 text-on-surface-variant hover:border-primary/50 hover:text-primary transition-colors"
                aria-label={`Avançar exemplos de ${type.titulo}`}
              >
                <ChevronRight size={12} />
              </button>
            </div>
          </div>

          {previewBooks.length > 0 ? (
            <div ref={rowRef} className="flex gap-2.5 sm:gap-3 overflow-x-auto snap-x snap-mandatory pb-1.5 sm:pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {previewBooks.map((item) => (
                <TypePreviewBookCard key={item.slug} item={item} onSelect={() => onSelectBook(item.slug)} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-primary/20 bg-black/25 px-3.5 sm:px-4 py-2.5 sm:py-3">
              <p className="text-[10px] sm:text-[11px] font-semibold text-primary/95">Conteúdos em preparação</p>
              <p className="mt-1 text-[9px] sm:text-[10px] leading-snug text-on-surface-variant/75">
                Esta área será preenchida quando os e-books deste tipo forem adicionados à biblioteca.
              </p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onEnter}
          className="mt-3 sm:mt-4 inline-flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-primary"
        >
          Entrar no tipo
          <ArrowRight size={12} className="transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      </div>
    </article>
  );
}

function TypologySeriesShelf({
  category,
  items,
  onSelectBook,
}: {
  category: string;
  items: BookItem[];
  onSelectBook: (slug: string) => void;
}) {
  const rowRef = useRef<HTMLDivElement | null>(null);

  const scrollByAmount = (delta: number) => {
    rowRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  const label = toSeriesDisplayLabel(category);
  const description = buildAutoSeriesDescription(category, items);

  return (
    <section className="mb-5 sm:mb-6">
      <div className="mb-2">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="inline-flex items-center rounded-full border border-primary/35 bg-primary/10 px-2 py-0.5 text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-primary">
            SÉRIE
          </span>
          <div className="hidden sm:flex items-center gap-1">
            <button
              type="button"
              onClick={() => scrollByAmount(-240)}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-outline-variant/40 bg-black/40 text-on-surface-variant hover:border-primary/50 hover:text-primary transition-colors"
              aria-label={`Voltar ${label}`}
            >
              <ChevronLeft size={12} />
            </button>
            <button
              type="button"
              onClick={() => scrollByAmount(240)}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-outline-variant/40 bg-black/40 text-on-surface-variant hover:border-primary/50 hover:text-primary transition-colors"
              aria-label={`Avançar ${label}`}
            >
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
        <h4 className="font-headline font-extrabold text-lg sm:text-xl text-on-surface tracking-tighter uppercase leading-none">
          {label}
        </h4>
        {description && (
          <p className="mt-1 text-[9px] sm:text-[10px] text-on-surface-variant/60 leading-snug font-medium max-w-2xl">
            {description}
          </p>
        )}
      </div>
      <div ref={rowRef} className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 sm:pb-4 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item, j) => (
          <BookCard
            key={item.slug}
            item={item}
            displayVolume={extractVolumeFromBook(item) ?? (j + 1)}
            onSelect={() => onSelectBook(item.slug)}
          />
        ))}
      </div>
    </section>
  );
}

// ── Section Grid Card ─────────────────────────────────────────────────────────
function SectionCard({ sectionKey, books, onSelect }: {
  sectionKey: SectionKey;
  books: BookItem[];
  onSelect: () => void;
}) {
  const { label, description, Icon, accent, numero } = SECTIONS[sectionKey];
  const cover = books.find((book) => Boolean(book.image))?.image;
  const totalRead = pm.countRead('livraria', books.map((b) => b.slug));

  return (
    <div
      onClick={onSelect}
      className="interactive-card group relative w-full h-40 sm:h-44 rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-all duration-300 border gold-glow-hover border-primary/25 hover:border-primary/40 hover:shadow-[0_0_40px_rgba(242,192,141,0.10)]"
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
      <div className="pointer-events-none absolute right-2 top-0 text-[58px] sm:text-[76px] font-black tracking-tighter text-primary/10 select-none">
        {numero}
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-between p-4 sm:p-5">
        {/* Top row */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg p-1.5 transition-all bg-black/40 border border-white/10 group-hover:border-primary/30 group-hover:bg-primary/10">
              <Icon size={14} className="text-primary/80 group-hover:text-primary transition-colors" />
            </div>
            <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] transition-colors text-white/40 group-hover:text-primary/70">
              {books.length} volume{books.length !== 1 ? 's' : ''}
            </span>
          </div>
          {totalRead > 0 && (
            <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-white/40 bg-black/50 px-1.5 sm:px-2 py-0.5 rounded-full border border-white/5">
              {totalRead}/{books.length} lidos
            </span>
          )}
          {books.length === 0 && (
            <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-primary/90 bg-black/55 px-1.5 sm:px-2 py-0.5 rounded-full border border-primary/35">
              Em preparação
            </span>
          )}
        </div>

        {/* Bottom text */}
        <div>
          <span className="inline-flex rounded-full border border-primary/35 bg-primary/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.18em] text-primary mb-1">
            Seção Selah
          </span>
          <h3 className="font-headline font-black text-[18px] sm:text-[22px] text-white tracking-tight leading-none mb-1 sm:mb-1.5 group-hover:text-primary transition-colors duration-300">
            {label.toUpperCase()}
          </h3>
          <p className="text-[9px] sm:text-[10px] text-white/45 leading-snug font-medium line-clamp-2 group-hover:text-white/65 transition-colors duration-300 max-w-[260px]">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Root component ────────────────────────────────────────────────────────────
interface BookstoreProps {
  mode?: 'default' | 'types';
  openSlug?: string;
  routeThemeSlug?: string;
  routeSubsecaoSlug?: string;
  routeEbookSlug?: string;
}

function clearOpenSlugFromUrl() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has('open')) return;
  url.searchParams.delete('open');
  const nextUrl = `${url.pathname}${url.search ? url.search : ''}`;
  window.history.replaceState(null, '', nextUrl);
}

export default function Bookstore({
  mode = 'default',
  openSlug,
  routeThemeSlug,
  routeSubsecaoSlug,
  routeEbookSlug,
}: BookstoreProps) {
  const isTypesMode = mode === 'types';
  const [selectedSection, setSelectedSection] = useState<SectionKey | null>(null);
  const [selectedSubsecao, setSelectedSubsecao] = useState<string | null>(null);
  const [activeTypeId, setActiveTypeId] = useState<TypologyDivisionId | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [markdownContent, setMarkdownContent] = useState<string | null>(null);
  const [activeObjectalTopicId, setActiveObjectalTopicId] = useState<string | null>(null);
  const [activeEscatologicalTopicId, setActiveEscatologicalTopicId] = useState<string | null>(null);
  const typologyTopicPanelRef = useRef<HTMLDivElement | null>(null);
  const sectionSeriesRowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const { data: books, loading, error } = useFetch<BookItem[]>('/content/livraria/index.json');
  const discoveredBooks = useMemo(() => discoverBooksFromMarkdown(), []);
  const typologyEntries = useMemo(() => discoverTypologyContentEntries(), []);
  const markdownBySlug = useMemo(() => buildMarkdownBySlugIndex(), []);
  const typologyMarkdownBySlug = useMemo(() => buildTypologyMarkdownBySlugIndex(), []);
  const normalizeMergedBookCategory = (book: BookItem): BookItem => {
    const seriesFolder = book.slug.split('/')[0] ?? '';
    const normalizedCategory = normalizeBookCategory(book.category, seriesFolder);
    const section = CATEGORY_TO_SECTION[normalizedCategory] ?? CATEGORY_TO_SECTION[normalizedCategory.toLowerCase()];
    const resolvedTheme = resolveSelahTheme({
      ...book,
      category: normalizedCategory,
      tema: book.tema || (section ? SELAH_THEME_BY_SECTION[section] : undefined),
    });
    const canonicalSubsecao = inferSelahSubsectionFromContext({
      themeTitle: resolvedTheme,
      frontmatterSubsection: (book.subsecao || '').trim(),
      seriesFolder,
      category: normalizedCategory,
      title: book.title,
      description: book.description,
    }) || (book.subsecao || '').trim();
    return {
      ...book,
      category: normalizedCategory,
      tema: resolvedTheme || undefined,
      subsecao: canonicalSubsecao || undefined,
    };
  };
  const mergedBooks = useMemo(() => {
    const map = new Map<string, BookItem>();
    for (const discovered of discoveredBooks) {
      const normalized = normalizeMergedBookCategory(discovered);
      if (isRemovedAnthropologySeriesBook(normalized)) continue;
      map.set(normalized.slug, normalized);
    }
    for (const indexed of books ?? []) {
      const normalized = normalizeMergedBookCategory(indexed);
      if (isRemovedAnthropologySeriesBook(normalized)) continue;
      const existing = map.get(normalized.slug);
      map.set(normalized.slug, existing ? {
        ...existing,
        ...normalized,
        tema: existing.tema || normalized.tema,
        subsecao: normalized.subsecao || existing.subsecao,
      } : normalized);
    }
    return Array.from(map.values());
  }, [books, discoveredBooks]);

  const booksWithoutValidSubsecao = useMemo<SubsecaoAuditEntry[]>(() => {
    return mergedBooks.flatMap((book): SubsecaoAuditEntry[] => {
      const tema = resolveSelahTheme(book);
      if (!tema) return [];

      const validSubsecoes = SELAH_SUBSECTIONS_BY_THEME_TITLE[tema].map((entry) => entry.title);
      const subsecao = (book.subsecao || '').trim();
      const canonicalSubsecao = resolveSelahSubsectionTitle(tema, subsecao);
      if (!subsecao) {
        return [{
          slug: book.slug,
          title: book.title,
          tema,
          category: book.category,
          reason: 'missing' as const,
          validSubsecoes,
        }];
      }

      const isValid = Boolean(canonicalSubsecao);
      if (isValid) return [];

      return [{
        slug: book.slug,
        title: book.title,
        tema,
        category: book.category,
        subsecao,
        reason: 'invalid' as const,
        validSubsecoes,
      }];
    });
  }, [mergedBooks]);

  useEffect(() => {
    if (booksWithoutValidSubsecao.length === 0) return;
    console.warn('[Selah] Ebooks sem subseção válida detectados:', booksWithoutValidSubsecao);
  }, [booksWithoutValidSubsecao]);

  const visibleSectionOrder: SectionKey[] = SECTION_ORDER;

  // Group books by top-level section
  const booksBySection = SECTION_ORDER.reduce((acc, sec) => {
    acc[sec] = mergedBooks.filter((b) => {
      const category = (b.category || '').trim();
      const mappedByCategory = CATEGORY_TO_SECTION[category] ?? CATEGORY_TO_SECTION[category.toLowerCase()];
      if (mappedByCategory === sec) return true;

      const resolvedTheme = resolveSelahTheme(b);
      if (!resolvedTheme) return false;
      const mappedByTheme = CATEGORY_TO_SECTION[resolvedTheme] ?? CATEGORY_TO_SECTION[resolvedTheme.toLowerCase()];
      return mappedByTheme === sec;
    });
    return acc;
  }, {} as Record<SectionKey, BookItem[]>);

  // Within a section, group by original category (series / trilogias)
  const seriesInSection: [string, BookItem[]][] = selectedSection
    ? Object.entries(
        booksBySection[selectedSection].reduce((acc, book) => {
          (acc[book.category] ??= []).push(book);
          return acc;
        }, {} as Record<string, BookItem[]>)
      ).map(([category, items]) => [category, sortBooksInSeries(category, items)] as [string, BookItem[]])
    : [];

  const subsecaoAvailabilityByName = useMemo(() => {
    if (!selectedSection) return null;

    const selectedTheme = SELAH_THEME_BY_SECTION[selectedSection];
    if (!selectedTheme) return null;

    const map = new Map<string, number>();
    for (const subsecao of SELAH_SUBSECTIONS_BY_THEME_TITLE[selectedTheme]) {
      map.set(subsecao.title, 0);
    }

    for (const book of booksBySection[selectedSection]) {
      const resolvedTheme = resolveSelahTheme(book);
      if (resolvedTheme !== selectedTheme) continue;
      const subsecao = resolveSelahSubsectionTitle(selectedTheme, (book.subsecao || '').trim());
      if (!subsecao || !map.has(subsecao)) continue;
      map.set(subsecao, (map.get(subsecao) || 0) + 1);
    }

    return map;
  }, [booksBySection, selectedSection]);

  const canonicalSelahPath = useMemo(() => {
    if (isTypesMode) return null;
    if (!selectedSection) return '/selah';

    const theme = SELAH_THEME_BY_SECTION[selectedSection];
    if (!theme) return '/selah';

    let path = `/selah/${SELAH_THEME_SLUG_BY_TITLE[theme]}`;
    if (selectedSubsecao) {
      path += `/${resolveSelahSubsectionSlug(theme, selectedSubsecao) ?? slugify(selectedSubsecao)}`;
    }
    if (selectedSlug) {
      path += `/${encodeURIComponent(selectedSlug)}`;
    }
    return path;
  }, [isTypesMode, selectedSection, selectedSlug, selectedSubsecao]);

  useEffect(() => {
    if (isTypesMode) return;
    if (!canonicalSelahPath) return;
    if (routeThemeSlug && !selectedSection) return;
    if (routeThemeSlug && routeSubsecaoSlug && !selectedSubsecao) return;
    if (routeThemeSlug && routeSubsecaoSlug && routeEbookSlug && !selectedSlug) return;

    const currentPath = window.location.pathname;
    if (currentPath === canonicalSelahPath) return;

    const currentPathWithoutTrailing = currentPath.length > 1 && currentPath.endsWith('/')
      ? currentPath.slice(0, -1)
      : currentPath;
    if (currentPathWithoutTrailing === canonicalSelahPath) return;

    window.history.pushState(null, '', canonicalSelahPath);
  }, [
    canonicalSelahPath,
    isTypesMode,
    routeEbookSlug,
    routeSubsecaoSlug,
    routeThemeSlug,
    selectedSection,
    selectedSlug,
    selectedSubsecao,
  ]);

  useEffect(() => {
    if (isTypesMode) return;

    if (!routeThemeSlug) {
      setSelectedSection((current) => (current ? null : current));
      setSelectedSubsecao((current) => (current ? null : current));
      return;
    }

    const section = resolveSectionFromThemeSlug(routeThemeSlug);
    if (!section) return;
    const theme = SELAH_THEME_BY_SECTION[section];

    setSelectedSection((current) => (current === section ? current : section));

    if (!routeSubsecaoSlug || !theme) {
      setSelectedSubsecao((current) => (current ? null : current));
      return;
    }

    const subsecao = resolveSubsecaoFromSlug(theme, routeSubsecaoSlug);
    if (!subsecao) {
      setSelectedSubsecao((current) => (current ? null : current));
      return;
    }

    setSelectedSubsecao((current) => (current === subsecao ? current : subsecao));
  }, [isTypesMode, routeThemeSlug, routeSubsecaoSlug]);

  const scrollSectionSeries = (seriesKey: string, delta: number) => {
    const wrapper = sectionSeriesRowRefs.current[seriesKey];
    const row = wrapper?.querySelector<HTMLElement>('[data-scroll-row="true"]');
    row?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  const typologySeriesByType = useMemo(() => {
    const byType = new Map<TypologyDivisionId, Map<string, BookItem[]>>();

    for (const entry of typologyEntries) {
      const bySeries = byType.get(entry.typeId) ?? new Map<string, BookItem[]>();
      const currentSeriesBooks = bySeries.get(entry.seriesCategory) ?? [];
      currentSeriesBooks.push(entry.item);
      bySeries.set(entry.seriesCategory, currentSeriesBooks);
      byType.set(entry.typeId, bySeries);
    }

    return TYPOLOGY_TYPES.reduce((acc, type) => {
      const bySeries = byType.get(type.id) ?? new Map<string, BookItem[]>();
      const sortedCategories = Array.from(bySeries.keys()).sort((a, b) => {
        const aPriority = TYPOLOGY_SERIES_PRIORITY.indexOf(a);
        const bPriority = TYPOLOGY_SERIES_PRIORITY.indexOf(b);
        if (aPriority !== -1 || bPriority !== -1) {
          const safeA = aPriority === -1 ? Number.MAX_SAFE_INTEGER : aPriority;
          const safeB = bPriority === -1 ? Number.MAX_SAFE_INTEGER : bPriority;
          if (safeA !== safeB) return safeA - safeB;
        }
        return a.localeCompare(b, 'pt-BR');
      });

      acc[type.id] = sortedCategories
        .map((category) => [category, sortBooksInSeries(category, bySeries.get(category) ?? [])] as [string, BookItem[]])
        .filter(([, items]) => items.length > 0);

      return acc;
    }, {} as Record<TypologyDivisionId, [string, BookItem[]][]>);
  }, [typologyEntries]);

  const typologyPreviewByType = useMemo(() => {
    return TYPOLOGY_TYPES.reduce((acc, type) => {
      const seen = new Set<string>();
      const collected: BookItem[] = [];
      const seriesList = typologySeriesByType[type.id] ?? [];
      for (const [, items] of seriesList) {
        for (const item of items) {
          if (seen.has(item.slug)) continue;
          seen.add(item.slug);
          collected.push(item);
          if (collected.length >= 6) break;
        }
        if (collected.length >= 6) break;
      }
      acc[type.id] = collected;
      return acc;
    }, {} as Record<TypologyDivisionId, BookItem[]>);
  }, [typologySeriesByType]);

  const activeType = useMemo(
    () => TYPOLOGY_TYPES.find((type) => type.id === activeTypeId) ?? null,
    [activeTypeId],
  );

  const typologyObjectalCards = useMemo(() => {
    if (!activeType || activeType.id !== 'tipologia-objetal') return [];
    return TYPOLOGY_OBJECTAL_TOPICS.map((topic) => ({
      id: topic.id,
      label: topic.label,
      imageSrc: resolveTypologyObjectalTopicImage(topic),
    }));
  }, [activeType]);

  const activeObjectalTopic = useMemo(
    () => TYPOLOGY_OBJECTAL_TOPICS.find((topic) => topic.id === activeObjectalTopicId) ?? null,
    [activeObjectalTopicId],
  );

  const activeObjectalTopicSeries = useMemo(() => {
    if (!activeType || activeType.id !== 'tipologia-objetal' || !activeObjectalTopic) return [];
    const relatedSeries = typologySeriesByType[activeType.id] ?? [];
    return resolveTypologyObjectalTopicSeries(activeObjectalTopic, relatedSeries);
  }, [activeObjectalTopic, activeType, typologySeriesByType]);

  const typologyEscatologicalCards = useMemo(() => {
    if (!activeType || activeType.id !== 'tipologia-escatologica') return [];
    return TYPOLOGY_ESCATOLOGICAL_TOPICS.map((topic) => ({
      id: topic.id,
      label: topic.label,
      imageSrc: resolveTypologyObjectalTopicImage(topic),
    }));
  }, [activeType]);

  const escatologicalSeriesThemeByCategory = useMemo(() => {
    const byCategory = new Map<string, Set<string>>();
    for (const entry of typologyEntries) {
      if (entry.typeId !== 'tipologia-escatologica') continue;
      const hints = byCategory.get(entry.seriesCategory) ?? new Set<string>();
      if (entry.topicHint) hints.add(entry.topicHint);
      byCategory.set(entry.seriesCategory, hints);
    }

    const resolved = new Map<string, string>();
    for (const [seriesCategory, hints] of byCategory.entries()) {
      const normalizedSeries = normalizeSearchToken(seriesCategory);
      if (normalizedSeries.includes('ressurreicao') || hints.has('ressurreicao')) {
        resolved.set(seriesCategory, 'ressurreicao');
        continue;
      }
      if (normalizedSeries.includes('morte') || hints.has('morte')) {
        resolved.set(seriesCategory, 'morte');
      }
    }

    return resolved;
  }, [typologyEntries]);

  const activeEscatologicalTopic = useMemo(
    () => TYPOLOGY_ESCATOLOGICAL_TOPICS.find((topic) => topic.id === activeEscatologicalTopicId) ?? null,
    [activeEscatologicalTopicId],
  );

  const activeEscatologicalTopicSeries = useMemo(() => {
    if (!activeType || activeType.id !== 'tipologia-escatologica' || !activeEscatologicalTopic) return [];
    const relatedSeries = typologySeriesByType[activeType.id] ?? [];
    return relatedSeries.filter(([category]) => escatologicalSeriesThemeByCategory.get(category) === activeEscatologicalTopic.id);
  }, [activeEscatologicalTopic, activeType, escatologicalSeriesThemeByCategory, typologySeriesByType]);

  useEffect(() => {
    if (!activeType || activeType.id !== 'tipologia-objetal') {
      setActiveObjectalTopicId(null);
      return;
    }
    setActiveObjectalTopicId((current) => current ?? TYPOLOGY_OBJECTAL_TOPICS[0]?.id ?? null);
  }, [activeType]);

  useEffect(() => {
    if (!activeType || activeType.id !== 'tipologia-escatologica') {
      setActiveEscatologicalTopicId(null);
      return;
    }
    setActiveEscatologicalTopicId((current) => current ?? TYPOLOGY_ESCATOLOGICAL_TOPICS[0]?.id ?? null);
  }, [activeType]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [selectedSection, selectedSubsecao, activeTypeId, selectedSlug]);

  const handleSelectBook = async (slug: string) => {
    setSelectedSlug(slug);
    const localContent = typologyMarkdownBySlug[slug]
      || typologyMarkdownBySlug[normalizeSlugLookupKey(slug)]
      || markdownBySlug[slug]
      || markdownBySlug[normalizeSlugLookupKey(slug)];
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

  useEffect(() => {
    if (!openSlug || selectedSlug) return;
    const hasMatch = mergedBooks.some((book) => book.slug === openSlug) || Boolean(typologyMarkdownBySlug[openSlug]);
    if (!hasMatch) return;
    void handleSelectBook(openSlug);
    clearOpenSlugFromUrl();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mergedBooks, openSlug, selectedSlug, typologyMarkdownBySlug]);

  useEffect(() => {
    if (isTypesMode || !routeEbookSlug || selectedSlug) return;
    const hasMatch = mergedBooks.some((book) => book.slug === routeEbookSlug) || Boolean(typologyMarkdownBySlug[routeEbookSlug]);
    if (!hasMatch) return;
    void handleSelectBook(routeEbookSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTypesMode, mergedBooks, routeEbookSlug, selectedSlug, typologyMarkdownBySlug]);

  const handleCloseReader = () => { setSelectedSlug(null); setMarkdownContent(null); };

  const handleOpenTypologyObjectalTopic = (topicId: string) => {
    setActiveObjectalTopicId(topicId);
    requestAnimationFrame(() => {
      typologyTopicPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleOpenTypologyEscatologicalTopic = (topicId: string) => {
    setActiveEscatologicalTopicId(topicId);
    requestAnimationFrame(() => {
      typologyTopicPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  // ── Reader ─────────────────────────────────────────────────────────────────
  if (selectedSlug && markdownContent) {
    return <MarkdownViewer content={markdownContent} slug={selectedSlug} category="livraria" onClose={handleCloseReader} />;
  }

  if (isTypesMode) {
    if (activeType) {
      const relatedSeries = typologySeriesByType[activeType.id] ?? [];

      return (
        <div className="pt-4 sm:pt-6 pb-24 sm:pb-28 px-4 sm:px-6 max-w-7xl mx-auto min-h-screen bg-surface-container-lowest">
          <section className="rounded-3xl border border-outline-variant/25 bg-gradient-to-b from-surface-container-low to-surface-container p-4 sm:p-6">
            <button
              type="button"
              onClick={() => setActiveTypeId(null)}
              className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/70 hover:text-primary transition-colors"
            >
              <ArrowLeft size={12} />
              TIPOS
            </button>

            <div className="mt-3 sm:mt-4 mb-4 sm:mb-5">
              <span className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 sm:py-1 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.18em] text-primary mb-1.5 sm:mb-2">
                {activeType.label}
              </span>
              <h2 className="font-headline text-2xl sm:text-4xl font-black tracking-tight text-on-surface uppercase">
                {activeType.titulo}
              </h2>
              <p className="text-xs sm:text-sm text-primary/85 font-semibold mt-1">{activeType.subtitulo}</p>
              <p className="text-[11px] sm:text-xs text-on-surface-variant leading-relaxed mt-1.5 sm:mt-2 max-w-3xl">{activeType.descricao}</p>
            </div>

            <div className="mt-3 sm:mt-4 rounded-2xl border border-primary/20 bg-black/20 p-3.5 sm:p-5">
              <h3 className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2.5 sm:mb-3">Clique e estude</h3>
              {activeType.id === 'tipologia-objetal' ? (
                <TypologyObjectalStudyDeck
                  topics={typologyObjectalCards}
                  onOpenTopic={handleOpenTypologyObjectalTopic}
                  activeTopicId={activeObjectalTopicId}
                  badgeTitle="Tópicos Objetais"
                />
              ) : activeType.id === 'tipologia-escatologica' ? (
                <TypologyObjectalStudyDeck
                  topics={typologyEscatologicalCards}
                  onOpenTopic={handleOpenTypologyEscatologicalTopic}
                  activeTopicId={activeEscatologicalTopicId}
                  badgeTitle="Temas Escatológicos"
                />
              ) : (
                <div className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-1.5 sm:pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {activeType.exemplos.map((example) => (
                    <TypeExamplePlate key={example} label={example} />
                  ))}
                </div>
              )}
            </div>

            {activeType.id === 'tipologia-objetal' ? (
              <div ref={typologyTopicPanelRef} className="mt-5 sm:mt-7 border-t border-primary/15 pt-4 sm:pt-5">
                {activeObjectalTopic ? (
                  <>
                    <h3
                      id={`typology-objectal-topic-${activeObjectalTopic.id}`}
                      className="font-headline text-xl sm:text-2xl font-black tracking-tight text-on-surface mb-1 uppercase"
                    >
                      {activeObjectalTopic.label}
                    </h3>
                    {activeObjectalTopicSeries.length > 0 ? (
                      activeObjectalTopicSeries.map(([category, items]) => (
                        <TypologySeriesShelf
                          key={`${activeObjectalTopic.id}-${category}`}
                          category={category}
                          items={items}
                          onSelectBook={handleSelectBook}
                        />
                      ))
                    ) : (
                      <div className="mt-3 rounded-2xl border border-primary/20 bg-black/20 px-3.5 sm:px-5 py-3.5 sm:py-4">
                        <p className="text-xs sm:text-sm font-semibold text-primary/95">Conteúdos em preparação</p>
                        <p className="mt-1 text-[11px] sm:text-xs leading-relaxed text-on-surface-variant/80 max-w-2xl">
                          Esta área será preenchida quando os estudos deste tópico forem adicionados.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-2xl border border-primary/20 bg-black/20 px-3.5 sm:px-5 py-3.5 sm:py-4">
                    <p className="text-xs sm:text-sm font-semibold text-primary/95">Selecione um tópico</p>
                    <p className="mt-1 text-[11px] sm:text-xs leading-relaxed text-on-surface-variant/80 max-w-2xl">
                      Clique em um card para abrir os estudos correspondentes.
                    </p>
                  </div>
                )}
              </div>
            ) : activeType.id === 'tipologia-escatologica' ? (
              <div ref={typologyTopicPanelRef} className="mt-5 sm:mt-7 border-t border-primary/15 pt-4 sm:pt-5">
                {activeEscatologicalTopic ? (
                  <>
                    <h3
                      id={`typology-objectal-topic-${activeEscatologicalTopic.id}`}
                      className="font-headline text-xl sm:text-2xl font-black tracking-tight text-on-surface mb-1 uppercase"
                    >
                      {activeEscatologicalTopic.label}
                    </h3>
                    {activeEscatologicalTopicSeries.length > 0 ? (
                      activeEscatologicalTopicSeries.map(([category, items]) => (
                        <TypologySeriesShelf
                          key={`${activeEscatologicalTopic.id}-${category}`}
                          category={category}
                          items={items}
                          onSelectBook={handleSelectBook}
                        />
                      ))
                    ) : (
                      <div className="mt-3 rounded-2xl border border-primary/20 bg-black/20 px-3.5 sm:px-5 py-3.5 sm:py-4">
                        <p className="text-xs sm:text-sm font-semibold text-primary/95">Conteúdos em preparação</p>
                        <p className="mt-1 text-[11px] sm:text-xs leading-relaxed text-on-surface-variant/80 max-w-2xl">
                          Esta área será preenchida quando os estudos deste tópico forem adicionados.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-2xl border border-primary/20 bg-black/20 px-3.5 sm:px-5 py-3.5 sm:py-4">
                    <p className="text-xs sm:text-sm font-semibold text-primary/95">Selecione um tópico</p>
                    <p className="mt-1 text-[11px] sm:text-xs leading-relaxed text-on-surface-variant/80 max-w-2xl">
                      Clique em um card para abrir os estudos correspondentes.
                    </p>
                  </div>
                )}
              </div>
            ) : relatedSeries.length > 0 ? (
              <div className="mt-5 sm:mt-7 border-t border-primary/15 pt-4 sm:pt-5">
                <h3 className="font-headline text-xl sm:text-2xl font-black tracking-tight text-on-surface mb-1 uppercase">
                  Coleções Relacionadas
                </h3>
                <p className="text-[11px] sm:text-xs text-on-surface-variant mb-3 sm:mb-4 max-w-3xl">
                  Séries tipológicas conectadas a este tipo para aprofundar sua leitura.
                </p>
                {relatedSeries.map(([category, items]) => (
                  <TypologySeriesShelf
                    key={`${activeType.id}-${category}`}
                    category={category}
                    items={items}
                    onSelectBook={handleSelectBook}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-5 sm:mt-7 rounded-2xl border border-primary/20 bg-black/20 px-3.5 sm:px-5 py-3.5 sm:py-4">
                <p className="text-xs sm:text-sm font-semibold text-primary/95">Conteúdos em preparação</p>
                <p className="mt-1 text-[11px] sm:text-xs leading-relaxed text-on-surface-variant/80 max-w-2xl">
                  Esta área será preenchida quando os e-books deste tipo forem adicionados à biblioteca.
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
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.22em] text-primary">SEÇÃO TIPOS</span>
              </div>
              <h1 className="font-headline text-3xl sm:text-5xl font-black text-primary mb-1.5 sm:mb-2 tracking-tighter text-shadow-glow">
                TIPOS
              </h1>
              <p className="text-xs sm:text-base text-on-surface font-semibold mb-1.5 sm:mb-2">
                A leitura tipológica organizada para explorar a Escritura com ordem e profundidade.
              </p>
              <p className="text-[11px] sm:text-sm text-on-surface-variant/90 leading-relaxed max-w-3xl">
                A tipologia da SELAH está organizada em 8 tipos de leitura, para ajudar o leitor a reconhecer
                como pessoas, eventos, instituições, objetos, lugares, rituais, padrões históricos e consumação apontam para Cristo
                e para o Reino.
              </p>
            </div>
          </header>
        </div>

        <section className="px-4 sm:px-6 pb-8 sm:pb-10">
          <div className="mb-3 sm:mb-4">
            <h2 className="font-headline text-xl sm:text-3xl font-black tracking-tight text-on-surface">Escolha seu tipo</h2>
            <p className="text-xs text-on-surface-variant mt-1">
              Cada tipo organiza uma via de leitura. Escolha por onde deseja explorar a tipologia bíblica hoje.
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
            {TYPOLOGY_TYPES.map((type) => (
              <TypologyTypeCard
                key={type.id}
                type={type}
                previewBooks={typologyPreviewByType[type.id] ?? []}
                onEnter={() => setActiveTypeId(type.id)}
                onSelectBook={handleSelectBook}
              />
            ))}
          </div>
        </section>
      </div>
    );
  }

  // ── Section detail ─────────────────────────────────────────────────────────
  if (selectedSection) {
    const selectedTheme = SELAH_THEME_BY_SECTION[selectedSection];
    if (selectedTheme) {
      const themeLabel = SECTIONS[selectedSection].label;
      const themeDescription = SECTIONS[selectedSection].description;
      const subsectionCounts = subsecaoAvailabilityByName ?? new Map<string, number>();
      const filteredSubsecaoBooks = selectedSubsecao
        ? booksBySection[selectedSection].filter((book) => {
            const resolvedTheme = resolveSelahTheme(book);
            if (resolvedTheme !== selectedTheme) return false;
            const normalizedSubsecao = resolveSelahSubsectionTitle(selectedTheme, (book.subsecao || '').trim());
            return normalizedSubsecao === selectedSubsecao;
          })
        : [];
      const seriesInSubsecao: [string, BookItem[]][] = selectedSubsecao
        ? Object.entries(
            filteredSubsecaoBooks.reduce((acc, book) => {
              (acc[book.category] ??= []).push(book);
              return acc;
            }, {} as Record<string, BookItem[]>)
          ).map(([category, items]) => [category, sortBooksInSeries(category, items)] as [string, BookItem[]])
        : [];
      const seriesWithoutSubsecao: [string, BookItem[]][] = Object.entries(
        booksBySection[selectedSection].reduce((acc, book) => {
          if (resolveSelahTheme(book) !== selectedTheme) return acc;
          const resolvedSubsecao = resolveSelahSubsectionTitle(selectedTheme, (book.subsecao || '').trim());
          if (resolvedSubsecao) return acc;
          (acc[book.category] ??= []).push(book);
          return acc;
        }, {} as Record<string, BookItem[]>),
      ).map(([category, items]) => [category, sortBooksInSeries(category, items)] as [string, BookItem[]]);

      if (selectedSubsecao) {
        return (
          <div className="pt-4 sm:pt-6 pb-24 sm:pb-28 px-4 sm:px-6 max-w-7xl mx-auto min-h-screen bg-surface-container-lowest">
            <section className="relative overflow-hidden rounded-3xl border border-outline-variant/25 bg-gradient-to-b from-surface-container-low to-surface-container p-4 sm:p-6">
              <FireflyLayer />

              <button
                onClick={() => setSelectedSubsecao(null)}
                className="relative z-10 inline-flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-on-surface-variant/70 hover:text-primary transition-colors"
              >
                <ArrowLeft size={12} />
                Subseções
              </button>

              <div className="relative z-10 mt-3 sm:mt-4 mb-4 sm:mb-5">
                <span className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 sm:py-1 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.18em] text-primary mb-1.5 sm:mb-2">
                  Seção Selah
                </span>
                <h2 className="font-headline text-2xl sm:text-4xl font-black tracking-tight text-on-surface uppercase">
                  {selectedSubsecao}
                </h2>
                <p className="text-[10px] sm:text-xs text-on-surface-variant/85 leading-relaxed mt-1.5 sm:mt-2 max-w-3xl">
                  {themeLabel} {'>'} {selectedSubsecao}
                </p>
              </div>

              <div className="relative z-10 border-t border-primary/15 pt-4 sm:pt-5">
                {seriesInSubsecao.map(([cat, items], index) => {
                  const reads = items.map((b) => pm.getReadCount('livraria', b.slug));
                  const minReads = reads.length ? Math.min(...reads) : 0;
                  const label = toSeriesDisplayLabel(cat);
                  const seriesDescription = buildAutoSeriesDescription(cat, items);
                  const badgeLabel = getSeriesBadgeLabel(selectedSection, cat);
                  const seriesKey = `${selectedSection}-${slugify(selectedSubsecao)}-${slugify(cat)}`;

                  return (
                    <div key={cat} className="mb-5 sm:mb-6">
                      <div className="mb-2">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className="inline-flex items-center rounded-full border border-primary/35 bg-primary/10 px-2 py-0.5 text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-primary">
                            {badgeLabel}
                          </span>
                          <div className="hidden sm:flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => scrollSectionSeries(seriesKey, -240)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-outline-variant/45 bg-black/35 text-on-surface-variant transition-colors hover:border-primary/55 hover:text-primary"
                              aria-label={`Voltar ${label}`}
                            >
                              <ChevronLeft size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => scrollSectionSeries(seriesKey, 240)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-outline-variant/45 bg-black/35 text-on-surface-variant transition-colors hover:border-primary/55 hover:text-primary"
                              aria-label={`Avançar ${label}`}
                            >
                              <ChevronRight size={13} />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <h4 className="font-headline font-extrabold text-lg sm:text-xl text-on-surface tracking-tighter uppercase leading-none">
                            {label}
                          </h4>
                          {minReads > 0 && (
                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
                              (Lido {minReads} vez{minReads > 1 ? 'es' : ''})
                            </span>
                          )}
                        </div>
                        {seriesDescription && (
                          <p className="mt-1 text-[9px] sm:text-[10px] text-on-surface-variant/60 leading-snug font-medium max-w-sm">
                            {seriesDescription}
                          </p>
                        )}
                      </div>

                      <div
                        ref={(element) => {
                          sectionSeriesRowRefs.current[seriesKey] = element;
                        }}
                        className="relative -mx-4 px-4 sm:-mx-6 sm:px-6"
                      >
                        <DragScrollRow>
                          {items.map((item, j) => (
                            <BookCard
                              key={item.slug}
                              item={item}
                              displayVolume={extractVolumeFromBook(item) ?? (j + 1)}
                              onSelect={() => handleSelectBook(item.slug)}
                            />
                          ))}
                        </DragScrollRow>
                      </div>

                      {index < seriesInSubsecao.length - 1 && (
                        <div className="mt-2.5 sm:mt-3 px-1">
                          <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/55 to-transparent animate-[pulse_4.5s_ease-in-out_infinite]" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {seriesInSubsecao.length === 0 && (
                  <div className="rounded-2xl border border-primary/20 bg-black/20 px-4 sm:px-5 py-4 sm:py-5">
                    <p className="text-xs sm:text-sm font-semibold text-primary/95">
                      Em preparação
                    </p>
                    <p className="mt-1 text-[11px] sm:text-xs text-on-surface-variant/80 leading-relaxed">
                      Esta área será preenchida quando as séries deste tema forem adicionadas.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        );
      }

      return (
        <div className="pt-4 sm:pt-6 pb-24 sm:pb-28 px-4 sm:px-6 max-w-7xl mx-auto min-h-screen bg-surface-container-lowest">
          <section className="relative overflow-hidden rounded-3xl border border-outline-variant/25 bg-gradient-to-b from-surface-container-low to-surface-container p-4 sm:p-6">
            <FireflyLayer />

            <button
              onClick={() => setSelectedSection(null)}
              className="relative z-10 inline-flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-on-surface-variant/70 hover:text-primary transition-colors"
            >
              <ArrowLeft size={12} />
              Selah
            </button>

            <div className="relative z-10 mt-3 sm:mt-4 mb-4 sm:mb-5">
              <span className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 sm:py-1 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.18em] text-primary mb-1.5 sm:mb-2">
                Seção Selah
              </span>
              <h2 className="font-headline text-2xl sm:text-4xl font-black tracking-tight text-on-surface uppercase">
                {themeLabel}
              </h2>
              <p className="text-[11px] sm:text-xs text-on-surface-variant leading-relaxed mt-1.5 sm:mt-2 max-w-3xl">{themeDescription}</p>
            </div>

            <div className="relative z-10 border-t border-primary/15 pt-4 sm:pt-5">
              <h3 className="font-headline text-lg sm:text-xl font-black tracking-tight text-on-surface mb-3">
                Subseções
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
                {SELAH_SUBSECTIONS_BY_THEME_TITLE[selectedTheme].map((subsecaoEntry) => {
                  const subsecao = subsecaoEntry.title;
                  const count = subsectionCounts.get(subsecao) || 0;
                  const subsecaoCover = booksBySection[selectedSection]
                    .find((book) => (
                      resolveSelahSubsectionTitle(selectedTheme, (book.subsecao || '').trim()) === subsecao
                      && resolveSelahTheme(book) === selectedTheme
                      && book.image
                    ))
                    ?.image;

                  return (
                    <button
                      key={`${selectedTheme}-${slugify(subsecao)}`}
                      type="button"
                      onClick={() => setSelectedSubsecao(subsecao)}
                      className={[
                        'subsecao-botao group relative overflow-hidden rounded-xl px-3 sm:px-3.5 py-2.5 sm:py-3 text-left',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(212,175,55,0.45)]',
                        count > 0 ? 'bg-black/20 cursor-pointer' : 'bg-black/15 em-breve cursor-pointer',
                      ].join(' ')}
                    >
                      {subsecaoCover && (
                        <AppImage
                          src={subsecaoCover}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover opacity-35"
                          fallbackClassName="opacity-0"
                        />
                      )}
                      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/55 to-black/15" />

                      <span className="relative block text-[11px] sm:text-xs font-black tracking-wide text-on-surface">{subsecao}</span>
                      {count > 0 ? (
                        <span className="relative mt-1 block text-[9px] sm:text-[10px] text-primary/80">{count} estudo{count > 1 ? 's' : ''}</span>
                      ) : (
                        <span className="relative mt-1 block text-[9px] sm:text-[10px] text-on-surface-variant/85">Em breve</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {seriesWithoutSubsecao.length > 0 && (
                <div className="mt-6 border-t border-amber-300/25 pt-4 sm:pt-5">
                  <h4 className="font-headline text-base sm:text-lg font-black tracking-tight text-amber-100 mb-2">
                    Sem subseção definida
                  </h4>
                  <p className="text-[10px] sm:text-xs text-amber-100/75 mb-3 sm:mb-4">
                    Séries reais deste tema que ainda precisam de classificação editorial.
                  </p>
                  {seriesWithoutSubsecao.map(([cat, items], index) => {
                    const reads = items.map((b) => pm.getReadCount('livraria', b.slug));
                    const minReads = reads.length ? Math.min(...reads) : 0;
                    const label = toSeriesDisplayLabel(cat);
                    const seriesDescription = buildAutoSeriesDescription(cat, items);
                    const badgeLabel = getSeriesBadgeLabel(selectedSection, cat);
                    const seriesKey = `${selectedSection}-sem-subsecao-${slugify(cat)}`;

                    return (
                      <div key={`sem-subsecao-${cat}`} className="mb-5 sm:mb-6">
                        <div className="mb-2">
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <span className="inline-flex items-center rounded-full border border-amber-300/35 bg-amber-400/10 px-2 py-0.5 text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-amber-100">
                              {badgeLabel}
                            </span>
                            <div className="hidden sm:flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => scrollSectionSeries(seriesKey, -240)}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-amber-200/30 bg-black/35 text-amber-100/80 transition-colors hover:border-amber-200/60 hover:text-amber-50"
                                aria-label={`Voltar ${label}`}
                              >
                                <ChevronLeft size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => scrollSectionSeries(seriesKey, 240)}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-amber-200/30 bg-black/35 text-amber-100/80 transition-colors hover:border-amber-200/60 hover:text-amber-50"
                                aria-label={`Avançar ${label}`}
                              >
                                <ChevronRight size={13} />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <h4 className="font-headline font-extrabold text-lg sm:text-xl text-on-surface tracking-tighter uppercase leading-none">
                              {label}
                            </h4>
                            {minReads > 0 && (
                              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
                                (Lido {minReads} vez{minReads > 1 ? 'es' : ''})
                              </span>
                            )}
                          </div>
                          {seriesDescription && (
                            <p className="mt-1 text-[9px] sm:text-[10px] text-on-surface-variant/60 leading-snug font-medium max-w-sm">
                              {seriesDescription}
                            </p>
                          )}
                        </div>
                        <div
                          ref={(element) => {
                            sectionSeriesRowRefs.current[seriesKey] = element;
                          }}
                          className="relative -mx-4 px-4 sm:-mx-6 sm:px-6"
                        >
                          <DragScrollRow>
                            {items.map((item, j) => (
                              <BookCard
                                key={item.slug}
                                item={item}
                                displayVolume={extractVolumeFromBook(item) ?? (j + 1)}
                                onSelect={() => handleSelectBook(item.slug)}
                              />
                            ))}
                          </DragScrollRow>
                        </div>

                        {index < seriesWithoutSubsecao.length - 1 && (
                          <div className="mt-2.5 sm:mt-3 px-1">
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-300/55 to-transparent animate-[pulse_4.5s_ease-in-out_infinite]" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      );
    }

    const { label, description, Icon, numero } = SECTIONS[selectedSection];
    return (
      <div className="pt-4 sm:pt-6 pb-24 sm:pb-28 px-4 sm:px-6 max-w-7xl mx-auto min-h-screen bg-surface-container-lowest">
        <section className="relative overflow-hidden rounded-3xl border border-outline-variant/25 bg-gradient-to-b from-surface-container-low to-surface-container p-4 sm:p-6">
          <FireflyLayer />
          <div className="pointer-events-none absolute right-3 top-1 text-[68px] sm:text-[90px] font-black tracking-tighter text-primary/10 select-none">
            {numero}
          </div>

          <button
            onClick={() => {
              setSelectedSubsecao(null);
              setSelectedSection(null);
            }}
            className="relative z-10 inline-flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-on-surface-variant/70 hover:text-primary transition-colors"
          >
            <ArrowLeft size={12} />
            Selah
          </button>

          <div className="relative z-10 mt-3 sm:mt-4 mb-4 sm:mb-5">
            <span className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 sm:py-1 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.18em] text-primary mb-1.5 sm:mb-2">
              Seção Selah
            </span>
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="rounded-xl border border-primary/25 bg-primary/10 p-2">
                <Icon size={16} className="text-primary" />
              </div>
              <h2 className="font-headline text-2xl sm:text-4xl font-black tracking-tight text-on-surface uppercase">
                {label}
              </h2>
            </div>
            <p className="text-[11px] sm:text-xs text-on-surface-variant leading-relaxed mt-1.5 sm:mt-2 max-w-3xl">{description}</p>
          </div>

          <div className="relative z-10 border-t border-primary/15 pt-4 sm:pt-5">
            {seriesInSection.map(([cat, items], index) => {
              const reads = items.map((b) => pm.getReadCount('livraria', b.slug));
              const minReads = reads.length ? Math.min(...reads) : 0;
              const label = toSeriesDisplayLabel(cat);
              const seriesDescription = buildAutoSeriesDescription(cat, items);
              const badgeLabel = getSeriesBadgeLabel(selectedSection, cat);
              const seriesKey = `${selectedSection}-${slugify(cat)}`;

              return (
                <div key={cat} className="mb-5 sm:mb-6">
                  <div className="mb-2">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center rounded-full border border-primary/35 bg-primary/10 px-2 py-0.5 text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-primary">
                        {badgeLabel}
                      </span>
                      <div className="hidden sm:flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => scrollSectionSeries(seriesKey, -240)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-outline-variant/45 bg-black/35 text-on-surface-variant transition-colors hover:border-primary/55 hover:text-primary"
                          aria-label={`Voltar ${label}`}
                        >
                          <ChevronLeft size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => scrollSectionSeries(seriesKey, 240)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-outline-variant/45 bg-black/35 text-on-surface-variant transition-colors hover:border-primary/55 hover:text-primary"
                          aria-label={`Avançar ${label}`}
                        >
                          <ChevronRight size={13} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <h4 className="font-headline font-extrabold text-lg sm:text-xl text-on-surface tracking-tighter uppercase leading-none">
                        {label}
                      </h4>
                      {minReads > 0 && (
                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
                          (Lido {minReads} vez{minReads > 1 ? 'es' : ''})
                        </span>
                      )}
                    </div>
                    {seriesDescription && (
                      <p className="mt-1 text-[9px] sm:text-[10px] text-on-surface-variant/60 leading-snug font-medium max-w-sm">
                        {seriesDescription}
                      </p>
                    )}
                  </div>
                  <div
                    ref={(element) => {
                      sectionSeriesRowRefs.current[seriesKey] = element;
                    }}
                    className="relative -mx-4 px-4 sm:-mx-6 sm:px-6"
                  >
                    <DragScrollRow>
                      {items.map((item, j) => (
                        <BookCard
                          key={item.slug}
                          item={item}
                          displayVolume={extractVolumeFromBook(item) ?? (j + 1)}
                          onSelect={() => handleSelectBook(item.slug)}
                        />
                      ))}
                    </DragScrollRow>
                  </div>

                  {index < seriesInSection.length - 1 && (
                    <div className="mt-2.5 sm:mt-3 px-1">
                      <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/55 to-transparent animate-[pulse_4.5s_ease-in-out_infinite]" />
                    </div>
                  )}
                </div>
              );
            })}

            {seriesInSection.length === 0 && !loading && (
              <p className="text-center text-[10px] uppercase tracking-widest text-on-surface-variant/40 py-12 sm:py-16 font-bold">
                Em preparação.
              </p>
            )}
          </div>
        </section>
      </div>
    );
  }

  // ── Main grid ──────────────────────────────────────────────────────────────
  return (
    <div className="pb-20 sm:pb-24 min-h-screen bg-surface-container-lowest">
      <div className="pt-6 sm:pt-8 px-4 sm:px-6 mb-6 sm:mb-8">
        <header className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-[#1f1a15] via-[#131110] to-[#0d0d0d] px-4 sm:px-8 py-6 sm:py-10 shadow-[0_24px_65px_rgba(0,0,0,0.58)]">
          <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_18%_20%,rgba(242,192,141,0.26),transparent_42%),radial-gradient(circle_at_78%_88%,rgba(212,165,116,0.16),transparent_36%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-10 [background-image:linear-gradient(rgba(242,192,141,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(242,192,141,0.05)_1px,transparent_1px)] [background-size:20px_20px]" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-2.5 sm:px-3 py-0.5 sm:py-1 mb-2.5 sm:mb-3">
              <Tent size={12} className="text-primary" />
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.22em] text-primary">SEÇÃO SELAH</span>
            </div>
            <h1 className="font-headline text-3xl sm:text-5xl font-black text-primary mb-1.5 sm:mb-2 tracking-tighter text-shadow-glow">
              SELAH
            </h1>
            <p className="text-xs sm:text-base text-on-surface font-semibold mb-1.5 sm:mb-2">
              Biblioteca editorial para discernimento, formação doutrinária e leitura profética.
            </p>
            <p className="text-[11px] sm:text-sm text-on-surface-variant/90 leading-relaxed max-w-3xl">
              Navegue por subseções temáticas com séries e trilogias aprofundadas. Cada frente organiza os conteúdos para facilitar progresso e leitura contínua.
            </p>
          </div>
        </header>
      </div>

      <section className="px-4 sm:px-6 pb-8 sm:pb-10">
        <div className="mb-3 sm:mb-4">
          <h2 className="font-headline text-xl sm:text-3xl font-black tracking-tight text-on-surface">Escolha sua seção</h2>
          <p className="text-xs text-on-surface-variant mt-1">
            Selecione a frente editorial que deseja explorar dentro da biblioteca Selah.
          </p>
        </div>

        {loading ? (
          <div className="py-8 sm:py-10 text-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-50">
            Carregando SELAH...
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
            {visibleSectionOrder.map((sec) => (
              <SectionCard
                key={sec}
                sectionKey={sec}
                books={booksBySection[sec]}
                onSelect={() => {
                  setSelectedSubsecao(null);
                  setSelectedSection(sec);
                }}
              />
            ))}
          </div>
        )}

        {booksWithoutValidSubsecao.length > 0 && (
          <details className="mt-4 rounded-2xl border border-amber-400/35 bg-amber-950/20 px-3 sm:px-4 py-3 sm:py-4">
            <summary className="cursor-pointer text-[10px] sm:text-xs font-black uppercase tracking-widest text-amber-200">
              Ebooks sem subseção válida ({booksWithoutValidSubsecao.length})
            </summary>
            <p className="mt-2 text-[11px] sm:text-xs text-amber-100/85 leading-relaxed">
              Estes conteúdos continuam carregáveis, mas precisam de revisão no campo <span className="font-black">subsecao</span>.
            </p>
            <ul className="mt-2 space-y-1.5">
              {booksWithoutValidSubsecao.map((entry) => (
                <li key={entry.slug} className="rounded-lg border border-amber-300/20 bg-black/20 px-2.5 py-2">
                  <p className="text-[11px] sm:text-xs font-semibold text-amber-100">{entry.title}</p>
                  <p className="text-[10px] sm:text-[11px] text-amber-100/80">
                    Tema: {entry.tema} | Categoria atual: {entry.category}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-amber-100/80">
                    {entry.reason === 'missing'
                      ? 'Subseção ausente.'
                      : `Subseção inválida: ${entry.subsecao}.`}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-amber-100/70">
                    Válidas: {entry.validSubsecoes.join(', ')}
                  </p>
                </li>
              ))}
            </ul>
          </details>
        )}

        {error && (
          <p className="text-red-500 text-[10px] uppercase font-bold text-center py-4">{error}</p>
        )}
      </section>
    </div>
  );
}
