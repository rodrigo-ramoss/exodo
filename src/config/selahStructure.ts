export type SelahThemeTitle =
  | 'ANTISSISTEMA'
  | 'ANTROPOLOGIA DO REINO'
  | 'EKKLESIA'
  | 'JESUS CRISTO'
  | 'IA & APOCALIPSE'
  | 'DEUS PAI'
  | 'ESPÍRITO SANTO'
  | 'TIPOLOGIA BÍBLICA'
  | 'BATALHA ESPIRITUAL'
  | 'COSMOLOGIA BÍBLICA'
  | 'MUNDO ESPIRITUAL'
  | 'APÓCRIFOS'
  | 'FIM DOS TEMPOS';

export type SelahThemeSlug =
  | 'antissistema'
  | 'antropologia-do-reino'
  | 'historia-da-igreja'
  | 'jesus-cristo'
  | 'ia-e-apocalipse'
  | 'deus-pai'
  | 'espirito-santo'
  | 'tipologia-biblica'
  | 'batalha-espiritual'
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
    expectedContentPath: `/public/content/rolos/${themeSlug}/${slugifyStable(title)}`,
  }));
}

function buildSubsectionsWithCustomSlugs(
  themeSlug: SelahThemeSlug,
  entries: ReadonlyArray<{ title: string; slug: string }>,
): SelahSubsectionConfig[] {
  return entries.map((entry, index) => ({
    id: `${themeSlug}-${entry.slug}`,
    slug: entry.slug,
    title: entry.title,
    order: index + 1,
    initialState: 'ready',
    expectedContentPath: `/public/content/rolos/${themeSlug}/${entry.slug}`,
  }));
}

export const SELAH_STRUCTURE: SelahThemeConfig[] = [
  {
    id: 'antissistema',
    slug: 'antissistema',
    title: 'ANTISSISTEMA',
    description: 'Estudos que usam a Escritura para discernir as estruturas, narrativas e poderes que moldam o sistema deste século.',
    order: 13,
    subsections: [],
  },
  {
    id: 'antropologia-do-reino',
    slug: 'antropologia-do-reino',
    title: 'ANTROPOLOGIA DO REINO',
    description: 'Estudos sobre a identidade humana à luz do Reino: corpo, alma, espírito, vocação, limites e propósito segundo as Escrituras.',
    order: 14,
    subsections: buildSubsections('antropologia-do-reino', [
      'Alimentação',
      'Corpo Humano',
      'Sexo',
      'Pharmakeia',
      'Cura Divina',
      'Novo Nascimento',
      'Metanoia',
      'Doenças Espirituais',
    ]),
  },
  {
    id: 'historia-da-igreja',
    slug: 'historia-da-igreja',
    title: 'EKKLESIA',
    description: 'A verdadeira igreja não é edifício, nem instituição. É o Corpo de Cristo reunido, onde cada crente é sacerdote, servo e membro vivo. Esta sessão defende a ekklésia bíblica contra distorções e ensina como vivê-la em comunhão.',
    order: 10,
    subsections: buildSubsectionsWithCustomSlugs('historia-da-igreja', [
      {
        title: 'Congregação',
        slug: 'congregacao',
      },
      {
        title: 'Templo',
        slug: 'templo-a-casa-que-virou-masmorra',
      },
      {
        title: 'Missão',
        slug: 'missao',
      },
      {
        title: 'Jejum',
        slug: 'jejum-e-calendario-a-liberdade-que-virou-obrigacao',
      },
      {
        title: 'Ekkelsia',
        slug: 'eclesia-a-comunidade-que-virou-hierarquia',
      },
      {
        title: 'Dízimo e Ofertas',
        slug: 'dizimo-a-generosidade-que-virou-imposto',
      },
      {
        title: 'Adoração',
        slug: 'musica-e-louvor-a-adoracao-que-virou-show',
      },
      {
        title: 'Identidade',
        slug: 'identidade',
      },
      {
        title: 'Sacerdócio',
        slug: 'sacerdocio',
      },
      {
        title: 'Liderança',
        slug: 'lideranca',
      },
      {
        title: 'Pastores e Diáconos',
        slug: 'pastores-e-diaconos',
      },
      {
        title: 'Disciplina',
        slug: 'disciplina',
      },
      {
        title: 'Discernimento',
        slug: 'discernimento',
      },
      {
        title: 'Clericalismo',
        slug: 'clericalismo',
      },
      {
        title: 'Mandamentos',
        slug: 'mandamentos',
      },
      {
        title: 'Remanescente',
        slug: 'remanescente',
      },
      {
        title: 'Esperança',
        slug: 'esperanca',
      },
    ]),
  },
  {
    id: 'jesus-cristo',
    slug: 'jesus-cristo',
    title: 'JESUS CRISTO',
    description: 'Pessoa, obra, autoridade e missão de Cristo.',
    order: 1,
    subsections: buildSubsections('jesus-cristo', [
      'Ressurreição',
      'Morte',
      'Sangue',
      'Cruz',
      'Batalha',
      'Salvador',
      'Sumo Sacerdote',
      'Logos',
      'Cordeiro',
      'O Nome',
      'Ceia do Senhor',
      'Batismo',
      'Novo Nascimento',
      'Pecado e Santidade',
      'Vida de Jesus',
      'Parábolas de Jesus',
    ]),
  },
  {
    id: 'ia-e-apocalipse',
    slug: 'ia-e-apocalipse',
    title: 'IA & APOCALIPSE',
    description: 'Tecnologia, controle, marca e sinais do fim.',
    order: 12,
    subsections: buildSubsections('ia-e-apocalipse', ['Marca', 'Imagem da besta', 'Transhumanismo', 'Singularidade', 'Vigilância', 'CBDC', 'Metaverso', 'Falsa revelação']),
  },
  {
    id: 'deus-pai',
    slug: 'deus-pai',
    title: 'DEUS PAI',
    description: 'Aliança, governo, justiça, misericórdia e santidade do Pai.',
    order: 2,
    subsections: buildSubsections('deus-pai', ['Yahweh', 'Conselho divino', 'Aliança', 'Eleição', 'Justiça', 'Misericórdia', 'Santidade', 'Onipresença']),
  },
  {
    id: 'espirito-santo',
    slug: 'espirito-santo',
    title: 'ESPÍRITO SANTO',
    description: 'Pessoa, dons, frutos e ministério do Espírito.',
    order: 3,
    subsections: buildSubsections('espirito-santo', ['Pentecostes', 'Unção', 'Dons', 'Frutos', 'Selo', 'Blasfêmia', 'Revelação', 'Intercessão']),
  },
  {
    id: 'tipologia-biblica',
    slug: 'tipologia-biblica',
    title: 'TIPOLOGIA BÍBLICA',
    description: 'Leitura tipológica das Escrituras: tabernáculo, arquétipos e geografia simbólica do Reino.',
    order: 4,
    subsections: buildSubsections('tipologia-biblica', ['Tabernáculo', 'Arca de Noé', 'Montes']),
  },
  {
    id: 'batalha-espiritual',
    slug: 'batalha-espiritual',
    title: 'BATALHA ESPIRITUAL',
    description: 'Discernimento, resistência e estratégias de guerra espiritual.',
    order: 5,
    subsections: buildSubsections('batalha-espiritual', [
      'Armadura',
      'Oração',
      'Inimigos',
      'Jejum',
      'Discernimento',
      'Autoridade',
      'Libertação',
      'Vitória',
      'Resistência',
      'Santidade',
      'Arrependimento',
      'Escritura',
      'Lingua',
    ]),
  },
  {
    id: 'cosmologia-biblica',
    slug: 'cosmologia-biblica',
    title: 'COSMOLOGIA BÍBLICA',
    description: 'Leitura bíblica da criação, céus, firmamento e abismo.',
    order: 7,
    subsections: buildSubsections('cosmologia-biblica', ['Terra plana', 'Estrelas', 'Planetas', 'Inferno', 'Céus', 'Mundos', 'Firmamento', 'Abismo']),
  },
  {
    id: 'mundo-espiritual',
    slug: 'mundo-espiritual',
    title: 'MUNDO ESPIRITUAL',
    description: 'Conselho celestial, hierarquias e geografia invisível, incluindo uma frente dedicada a expor conhecimentos ocultos, ocultismo e esoterismo como instrumentos de engano e controle espiritual.',
    order: 6,
    subsections: buildSubsections('mundo-espiritual', [
      'Conselho divino',
      'Tribunal divino',
      'Satanás/Belial',
      'Possessão demoníaca',
      'Nefilim/Demônios',
      'Sheol/Tártaro/Inferno',
      'Hierarquia angelical',
      'Hierarquia demoníaca',
      'Ensinos Demoníacos',
      'Céus/Mundos',
    ]),
  },
  {
    id: 'apocrifos',
    slug: 'apocrifos',
    title: 'APÓCRIFOS',
    description: 'Enoque, Jubileus e textos intertestamentários.',
    order: 9,
    subsections: buildSubsections('apocrifos', ['Enoque', 'Jubileus', 'Testamentos', 'Apocalipse de Abraão', '2 Baruque', '4 Esdras', 'Qumran', 'Cânon perdido']),
  },
  {
    id: 'fim-dos-tempos',
    slug: 'fim-dos-tempos',
    title: 'FIM DOS TEMPOS',
    description: 'Escatologia bíblica, juízo, restauração e consumação.',
    order: 8,
    subsections: buildSubsections('fim-dos-tempos', [
      'Anticristo',
      'Tribulação',
      'Arrebatamento',
      'Trombetas',
      'Bestas',
      'Babilônia',
      'Armagedom',
      'Restauração',
      'Tempo',
      'Sinais do Fim',
    ]),
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

  const legacyThemeAliases: Record<string, SelahThemeTitle> = {
    'satanas-e-demonios': 'MUNDO ESPIRITUAL',
    'reino-de-deus': 'MUNDO ESPIRITUAL',
  };
  const legacyThemeAlias = legacyThemeAliases[normalized];
  if (legacyThemeAlias) return legacyThemeAlias;

  const bySlug = SELAH_THEME_BY_SLUG[normalized];
  if (bySlug) return bySlug.title;

  return SELAH_STRUCTURE.find((theme) => slugifyStable(theme.title) === normalized)?.title ?? null;
}

export function resolveSelahSubsectionTitle(themeTitle: SelahThemeTitle, value: string): string | null {
  const normalized = slugifyStable(value);
  if (!normalized) return null;

  if (themeTitle === 'MUNDO ESPIRITUAL') {
    const mundoAliases: Record<string, string> = {
      anjos: 'Hierarquia angelical',
      querubins: 'Hierarquia angelical',
      'hierarquia-celestial': 'Hierarquia angelical',
      vigilantes: 'Hierarquia demoníaca',
      sarim: 'Hierarquia demoníaca',
      'sarim-territoriais': 'Hierarquia demoníaca',
      belial: 'Satanás/Belial',
      satanas: 'Satanás/Belial',
      'satanas-belial': 'Satanás/Belial',
      possessao: 'Possessão demoníaca',
      'possessao-demoniaca': 'Possessão demoníaca',
      nefilim: 'Nefilim/Demônios',
      demonios: 'Nefilim/Demônios',
      'nefilim-demonios': 'Nefilim/Demônios',
      sheol: 'Sheol/Tártaro/Inferno',
      tartaro: 'Sheol/Tártaro/Inferno',
      inferno: 'Sheol/Tártaro/Inferno',
      'sheol-tartaro': 'Sheol/Tártaro/Inferno',
      'sheol-tartaro-inferno': 'Sheol/Tártaro/Inferno',
      gadreel: 'Hierarquia demoníaca',
      acusador: 'Hierarquia demoníaca',
      estrategias: 'Hierarquia demoníaca',
      seducao: 'Hierarquia demoníaca',
      derrota: 'Hierarquia demoníaca',
      'hierarquia-demoniaca': 'Hierarquia demoníaca',
      'hierarquia-angelical': 'Hierarquia angelical',
      ocultismo: 'Ensinos Demoníacos',
      esoterismo: 'Ensinos Demoníacos',
      'conhecimentos-ocultos': 'Ensinos Demoníacos',
      'ensinos-demoniacos': 'Ensinos Demoníacos',
    };
    const aliasTitle = mundoAliases[normalized];
    if (aliasTitle) return aliasTitle;
  }

  if (themeTitle === 'ESPÍRITO SANTO' && normalized === 'conviccao') {
    return 'Blasfêmia';
  }
  if (themeTitle === 'EKKLESIA') {
    const historiaAliases: Record<string, string> = {
      congregacao: 'Congregação',
      templo: 'Templo',
      tempo: 'Templo',
      missao: 'Missão',
      jejum: 'Jejum',
      'jejum-e-calendario': 'Jejum',
      eclesia: 'Ekkelsia',
      ekkelsia: 'Ekkelsia',
      dizimo: 'Dízimo e Ofertas',
      ofertas: 'Dízimo e Ofertas',
      'dizimo-e-ofertas': 'Dízimo e Ofertas',
      musica: 'Adoração',
      louvor: 'Adoração',
      adoracao: 'Adoração',
      'musica-e-louvor': 'Adoração',
      'verdade-sobre-a-igreja': 'Templo',
      'falsas-doutrinas': 'Discernimento',
    };
    const aliasTitle = historiaAliases[normalized];
    if (aliasTitle) return aliasTitle;
  }

  const subsection = SELAH_SUBSECTIONS_BY_THEME_TITLE[themeTitle].find(
    (item) => item.slug === normalized || slugifyStable(item.title) === normalized,
  );
  return subsection?.title ?? null;
}

export function resolveSelahSubsectionSlug(themeTitle: SelahThemeTitle, value: string): string | null {
  const normalized = slugifyStable(value);
  if (!normalized) return null;

  if (themeTitle === 'MUNDO ESPIRITUAL') {
    const mundoAliasSlugs: Record<string, string> = {
      anjos: 'hierarquia-angelical',
      querubins: 'hierarquia-angelical',
      'hierarquia-celestial': 'hierarquia-angelical',
      vigilantes: 'hierarquia-demoniaca',
      sarim: 'hierarquia-demoniaca',
      'sarim-territoriais': 'hierarquia-demoniaca',
      belial: 'satanas-belial',
      satanas: 'satanas-belial',
      'satanas-belial': 'satanas-belial',
      possessao: 'possessao-demoniaca',
      'possessao-demoniaca': 'possessao-demoniaca',
      nefilim: 'nefilim-demonios',
      demonios: 'nefilim-demonios',
      'nefilim-demonios': 'nefilim-demonios',
      sheol: 'sheol-tartaro-inferno',
      tartaro: 'sheol-tartaro-inferno',
      inferno: 'sheol-tartaro-inferno',
      'sheol-tartaro': 'sheol-tartaro-inferno',
      'sheol-tartaro-inferno': 'sheol-tartaro-inferno',
      gadreel: 'hierarquia-demoniaca',
      acusador: 'hierarquia-demoniaca',
      estrategias: 'hierarquia-demoniaca',
      seducao: 'hierarquia-demoniaca',
      derrota: 'hierarquia-demoniaca',
      'hierarquia-demoniaca': 'hierarquia-demoniaca',
      'hierarquia-angelical': 'hierarquia-angelical',
      ocultismo: 'ensinos-demoniacos',
      esoterismo: 'ensinos-demoniacos',
      'conhecimentos-ocultos': 'ensinos-demoniacos',
      'ensinos-demoniacos': 'ensinos-demoniacos',
    };
    const aliasSlug = mundoAliasSlugs[normalized];
    if (aliasSlug) return aliasSlug;
  }

  if (themeTitle === 'ESPÍRITO SANTO' && normalized === 'conviccao') {
    return 'blasfemia';
  }
  if (themeTitle === 'EKKLESIA') {
    const historiaAliases: Record<string, string> = {
      congregacao: 'congregacao',
      templo: 'templo-a-casa-que-virou-masmorra',
      tempo: 'templo-a-casa-que-virou-masmorra',
      missao: 'missao',
      jejum: 'jejum-e-calendario-a-liberdade-que-virou-obrigacao',
      'jejum-e-calendario': 'jejum-e-calendario-a-liberdade-que-virou-obrigacao',
      eclesia: 'eclesia-a-comunidade-que-virou-hierarquia',
      ekkelsia: 'eclesia-a-comunidade-que-virou-hierarquia',
      dizimo: 'dizimo-a-generosidade-que-virou-imposto',
      ofertas: 'dizimo-a-generosidade-que-virou-imposto',
      'dizimo-e-ofertas': 'dizimo-a-generosidade-que-virou-imposto',
      musica: 'musica-e-louvor-a-adoracao-que-virou-show',
      louvor: 'musica-e-louvor-a-adoracao-que-virou-show',
      adoracao: 'musica-e-louvor-a-adoracao-que-virou-show',
      'musica-e-louvor': 'musica-e-louvor-a-adoracao-que-virou-show',
      'verdade-sobre-a-igreja': 'templo-a-casa-que-virou-masmorra',
      'falsas-doutrinas': 'discernimento',
    };
    const aliasSlug = historiaAliases[normalized];
    if (aliasSlug) return aliasSlug;
  }

  const subsection = SELAH_SUBSECTIONS_BY_THEME_TITLE[themeTitle].find(
    (item) => item.slug === normalized || slugifyStable(item.title) === normalized,
  );
  return subsection?.slug ?? null;
}

