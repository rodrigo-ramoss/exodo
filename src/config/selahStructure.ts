export type SelahThemeTitle =
  | 'JESUS CRISTO'
  | 'IA & APOCALIPSE'
  | 'SATANÁS E DEMÔNIOS'
  | 'DEUS PAI'
  | 'ESPÍRITO SANTO'
  | 'BATALHA ESPIRITUAL'
  | 'REINO DE DEUS'
  | 'COSMOLOGIA BÍBLICA'
  | 'MUNDO ESPIRITUAL'
  | 'APÓCRIFOS'
  | 'FIM DOS TEMPOS';

export type SelahThemeSlug =
  | 'jesus-cristo'
  | 'ia-e-apocalipse'
  | 'satanas-e-demonios'
  | 'deus-pai'
  | 'espirito-santo'
  | 'batalha-espiritual'
  | 'reino-de-deus'
  | 'cosmologia-biblica'
  | 'mundo-espiritual'
  | 'apocrifos'
  | 'fim-dos-tempos';

export type SelahSubsectionState = 'ready' | 'coming-soon';

export interface SelahSubsectionConfig {
  id: string;
  slug: string;
  title: string;
  order: number;
  initialState: SelahSubsectionState;
  expectedContentPath: string;
}

export interface SelahThemeConfig {
  id: SelahThemeSlug;
  slug: SelahThemeSlug;
  title: SelahThemeTitle;
  description: string;
  order: number;
  subsections: SelahSubsectionConfig[];
}

function buildSubsections(themeSlug: SelahThemeSlug, titles: readonly string[]): SelahSubsectionConfig[] {
  return titles.map((title, index) => ({
    id: `${themeSlug}-${slugifyStable(title)}`,
    slug: slugifyStable(title),
    title,
    order: index + 1,
    initialState: 'ready',
    expectedContentPath: `/public/content/selah/${themeSlug}/${slugifyStable(title)}`,
  }));
}

export const SELAH_STRUCTURE: SelahThemeConfig[] = [
  {
    id: 'jesus-cristo',
    slug: 'jesus-cristo',
    title: 'JESUS CRISTO',
    description: 'Pessoa, obra, autoridade e missão de Cristo.',
    order: 1,
    subsections: buildSubsections('jesus-cristo', ['Ressurreição', 'Sangue', 'Cruz', 'Batalha', 'Salvador', 'Sumo Sacerdote', 'Logos', 'Cordeiro']),
  },
  {
    id: 'ia-e-apocalipse',
    slug: 'ia-e-apocalipse',
    title: 'IA & APOCALIPSE',
    description: 'Tecnologia, controle, marca e sinais do fim.',
    order: 2,
    subsections: buildSubsections('ia-e-apocalipse', ['Marca', 'Imagem da besta', 'Transhumanismo', 'Singularidade', 'Vigilância', 'CBDC', 'Metaverso', 'Falsa revelação']),
  },
  {
    id: 'satanas-e-demonios',
    slug: 'satanas-e-demonios',
    title: 'SATANÁS E DEMÔNIOS',
    description: 'Queda, rebelião, atuação e derrota do império das trevas.',
    order: 3,
    subsections: buildSubsections('satanas-e-demonios', ['Belial', 'Gadreel', 'Nefilim', 'Possessão', 'Sedução', 'Acusador', 'Estratégias', 'Derrota']),
  },
  {
    id: 'deus-pai',
    slug: 'deus-pai',
    title: 'DEUS PAI',
    description: 'Aliança, governo, justiça, misericórdia e santidade do Pai.',
    order: 4,
    subsections: buildSubsections('deus-pai', ['Yahweh', 'Conselho divino', 'Aliança', 'Eleição', 'Justiça', 'Misericórdia', 'Santidade', 'Onipresença']),
  },
  {
    id: 'espirito-santo',
    slug: 'espirito-santo',
    title: 'ESPÍRITO SANTO',
    description: 'Pessoa, dons, frutos e ministério do Espírito.',
    order: 5,
    subsections: buildSubsections('espirito-santo', ['Pentecostes', 'Unção', 'Dons', 'Frutos', 'Selo', 'Convicção', 'Revelação', 'Intercessão']),
  },
  {
    id: 'batalha-espiritual',
    slug: 'batalha-espiritual',
    title: 'BATALHA ESPIRITUAL',
    description: 'Discernimento, resistência e estratégias de guerra espiritual.',
    order: 6,
    subsections: buildSubsections('batalha-espiritual', ['Armadura', 'Oração', 'Jejum', 'Discernimento', 'Autoridade', 'Libertação', 'Vitória', 'Resistência']),
  },
  {
    id: 'reino-de-deus',
    slug: 'reino-de-deus',
    title: 'REINO DE DEUS',
    description: 'Teologia do Reino, cidadania e consumação escatológica.',
    order: 7,
    subsections: buildSubsections('reino-de-deus', ['Já e ainda não', 'Cidadania', 'Remanescente', 'Justiça', 'Nova Jerusalém', 'Milênio', 'Trono', 'Filhos do Reino']),
  },
  {
    id: 'cosmologia-biblica',
    slug: 'cosmologia-biblica',
    title: 'COSMOLOGIA BÍBLICA',
    description: 'Leitura bíblica da criação, céus, firmamento e abismo.',
    order: 8,
    subsections: buildSubsections('cosmologia-biblica', ['Terra plana', 'Estrelas', 'Planetas', 'Inferno', 'Céus', 'Mundos', 'Firmamento', 'Abismo']),
  },
  {
    id: 'mundo-espiritual',
    slug: 'mundo-espiritual',
    title: 'MUNDO ESPIRITUAL',
    description: 'Conselho celestial, hierarquias e geografia invisível.',
    order: 9,
    subsections: buildSubsections('mundo-espiritual', ['Vigilantes', 'Anjos', 'Querubins', 'Sarim territoriais', 'Conselho divino', 'Tártaro', 'Sheol', 'Hierarquia celestial']),
  },
  {
    id: 'apocrifos',
    slug: 'apocrifos',
    title: 'APÓCRIFOS',
    description: 'Enoque, Jubileus e textos intertestamentários.',
    order: 10,
    subsections: buildSubsections('apocrifos', ['Enoque', 'Jubileus', 'Testamentos', 'Apocalipse de Abraão', '2 Baruque', '4 Esdras', 'Qumran', 'Cânon perdido']),
  },
  {
    id: 'fim-dos-tempos',
    slug: 'fim-dos-tempos',
    title: 'FIM DOS TEMPOS',
    description: 'Escatologia bíblica, juízo, restauração e consumação.',
    order: 11,
    subsections: buildSubsections('fim-dos-tempos', ['Anticristo', 'Tribulação', 'Arrebatamento', 'Trombetas', 'Bestas', 'Babilônia', 'Armagedom', 'Restauração', 'Tempo']),
  },
];

export const SELAH_THEME_BY_SLUG = SELAH_STRUCTURE.reduce<Record<string, SelahThemeConfig>>((acc, theme) => {
  acc[theme.slug] = theme;
  return acc;
}, {});

export const SELAH_THEME_BY_TITLE = SELAH_STRUCTURE.reduce<Record<string, SelahThemeConfig>>((acc, theme) => {
  acc[theme.title] = theme;
  return acc;
}, {});

export const SELAH_THEME_TITLES_IN_ORDER: SelahThemeTitle[] = SELAH_STRUCTURE
  .slice()
  .sort((a, b) => a.order - b.order)
  .map((theme) => theme.title);

export const SELAH_THEME_SLUG_BY_TITLE = SELAH_STRUCTURE.reduce<Record<SelahThemeTitle, SelahThemeSlug>>((acc, theme) => {
  acc[theme.title] = theme.slug;
  return acc;
}, {} as Record<SelahThemeTitle, SelahThemeSlug>);

export const SELAH_SUBSECTIONS_BY_THEME_TITLE = SELAH_STRUCTURE.reduce<Record<SelahThemeTitle, SelahSubsectionConfig[]>>((acc, theme) => {
  acc[theme.title] = theme.subsections.slice().sort((a, b) => a.order - b.order);
  return acc;
}, {} as Record<SelahThemeTitle, SelahSubsectionConfig[]>);

export function slugifyStable(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function resolveSelahThemeTitleFromSlug(value: string): SelahThemeTitle | null {
  const normalized = slugifyStable(value);
  if (!normalized) return null;

  const bySlug = SELAH_THEME_BY_SLUG[normalized];
  if (bySlug) return bySlug.title;

  return SELAH_STRUCTURE.find((theme) => slugifyStable(theme.title) === normalized)?.title ?? null;
}

export function resolveSelahSubsectionTitle(themeTitle: SelahThemeTitle, value: string): string | null {
  const normalized = slugifyStable(value);
  if (!normalized) return null;

  const subsection = SELAH_SUBSECTIONS_BY_THEME_TITLE[themeTitle].find(
    (item) => item.slug === normalized || slugifyStable(item.title) === normalized,
  );
  return subsection?.title ?? null;
}

export function resolveSelahSubsectionSlug(themeTitle: SelahThemeTitle, value: string): string | null {
  const normalized = slugifyStable(value);
  if (!normalized) return null;

  const subsection = SELAH_SUBSECTIONS_BY_THEME_TITLE[themeTitle].find(
    (item) => item.slug === normalized || slugifyStable(item.title) === normalized,
  );
  return subsection?.slug ?? null;
}
