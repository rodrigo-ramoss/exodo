import { useMemo, useState, type ReactNode, type ElementType } from 'react';
import {
  Sparkles,
  Clock3,
  ChevronLeft,
  Orbit,
  Shield,
  Swords,
  ScrollText,
  Dna,
  Cross,
  Flame,
} from 'lucide-react';
import { MarkdownViewer } from './MarkdownViewer';
import { AppImage } from './AppImage';

interface AxisMeta {
  id: string;
  index: number;
  title: string;
  subtitle: string;
  description: string;
  coverImage?: string;
  accentClass: string;
  glowClass: string;
  Icon: ElementType;
}

interface InterpretationStudy {
  title: string;
  displayTitle: string;
  description?: string;
  date?: string;
  pathKey: string;
  content: string;
  axisId: string;
  axisTitle: string;
  subthemeId: string;
  subthemeLabel: string;
  subthemeDescription: string;
  volume: number;
  image?: string;
}

interface StudyGroup {
  subthemeId: string;
  subthemeLabel: string;
  subthemeDescription: string;
  studies: InterpretationStudy[];
}

const AXIS_METADATA: AxisMeta[] = [
  {
    id: 'eixo-1-geografia-invisivel',
    index: 1,
    title: 'Geografia do Mundo Invisível',
    subtitle: 'Mapas Celestiais e Territórios Espirituais',
    description: 'Cartografia bíblica do mundo invisível, montanha cósmica, tronos e fronteiras espirituais.',
    coverImage: '/assets/imagens/eixo-1-geografia-invisivel/a-corte-de-yahweh-parte-1.webp',
    accentClass: 'from-[#2f220f]/95 via-[#1b150f]/70 to-[#0d0f14]/40',
    glowClass: 'shadow-[0_0_30px_rgba(212,175,55,0.1)]',
    Icon: Orbit,
  },
  {
    id: 'eixo-2-seres-celestiais',
    index: 2,
    title: 'Seres Celestiais e Ofícios',
    subtitle: 'Conselho Divino, Funções e Hierarquias',
    description: 'Análise de querubins, vigilantes, mensageiros e seus ofícios na economia do Reino.',
    accentClass: 'from-[#1e2a14]/95 via-[#141b12]/70 to-[#0d0f14]/40',
    glowClass: 'shadow-[0_0_30px_rgba(152,196,120,0.12)]',
    Icon: Shield,
  },
  {
    id: 'eixo-3-rebeliao-cosmica',
    index: 3,
    title: 'Rebelião e Guerra Cósmica',
    subtitle: 'A Queda dos Vigilantes e o Conflito do Éden',
    description: 'Investigação do conflito primordial entre o governo divino e poderes rebeldes.',
    coverImage: '/assets/imagens/eixo-3-rebeliao-cosmica/o-verdadeiro-oficio-do-nachash-no-eden-parte-1.webp',
    accentClass: 'from-[#332114]/95 via-[#20140f]/70 to-[#0d0f14]/40',
    glowClass: 'shadow-[0_0_34px_rgba(255,135,84,0.12)]',
    Icon: Swords,
  },
  {
    id: 'eixo-4-tecnologia-alianca',
    index: 4,
    title: 'Práticas, Símbolos e Liturgias',
    subtitle: 'Padrões de Aliança, Culto e Administração Sagrada',
    description: 'Leitura dos ritos bíblicos como tecnologia espiritual e linguagem do Templo celestial.',
    coverImage: '/assets/imagens/eixo-4-tecnologia-alianca/o-portal-de-melquisedeque-a-teologia-cosmica-do-dizimo-parte-1.webp',
    accentClass: 'from-[#34220f]/95 via-[#1f140f]/70 to-[#0d0f14]/40',
    glowClass: 'shadow-[0_0_34px_rgba(245,199,113,0.12)]',
    Icon: ScrollText,
  },
  {
    id: 'eixo-5-linhagem-semente',
    index: 5,
    title: 'Linhagem, Semente e Corrupção',
    subtitle: 'Genealogias, Fraturas e Disputas de Herança',
    description: 'Rastreio de linhagens espirituais, corrupção da semente e disputa pela promessa.',
    coverImage: '/assets/imagens/eixo-5-linhagem-semente/caim-semente-serpente-parte1.webp',
    accentClass: 'from-[#2d1f30]/95 via-[#1d1320]/70 to-[#0d0f14]/40',
    glowClass: 'shadow-[0_0_34px_rgba(197,142,214,0.12)]',
    Icon: Dna,
  },
  {
    id: 'eixo-6-plano-redencao',
    index: 6,
    title: 'Plano de Redenção e Restauração',
    subtitle: 'Do Éden à Nova Aliança',
    description: 'A arquitetura da redenção, o sacerdócio messiânico e a restauração de todas as coisas.',
    accentClass: 'from-[#1a2e27]/95 via-[#101e18]/70 to-[#0d0f14]/40',
    glowClass: 'shadow-[0_0_34px_rgba(106,190,164,0.12)]',
    Icon: Cross,
  },
  {
    id: 'eixo-7-escatologia-consumacao',
    index: 7,
    title: 'Escatologia e Consumação',
    subtitle: 'Juízo, Reino e Plenitude Final',
    description: 'Panorama escatológico da consumação: juízo, reinado e Nova Criação.',
    accentClass: 'from-[#2a232c]/95 via-[#171118]/70 to-[#0d0f14]/40',
    glowClass: 'shadow-[0_0_34px_rgba(219,157,245,0.12)]',
    Icon: Flame,
  },
];

const AXIS_BY_ID = Object.fromEntries(AXIS_METADATA.map((axis) => [axis.id, axis])) as Record<string, AxisMeta>;

const studyMarkdownModules = import.meta.glob('/public/content/eixos biblicos/eixo-*/**/*.md', {
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

function slugify(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function extractVolume(title: string, fileName: string): number {
  const fromTitle = title.match(/parte\s*(\d+)/i);
  if (fromTitle) return Number(fromTitle[1]);
  const fromFile = fileName.match(/parte\s*(\d+)/i);
  if (fromFile) return Number(fromFile[1]);
  return 1;
}

function formatRecentTitle(title: string): string {
  const [head] = title.split(/\s[:\-–]\s|[:\-–]/);
  return head?.trim() || title;
}

function normalizeSubtheme(raw: string): string {
  return raw
    .replace(/\s*[\-–]\s*parte\s*\d+.*$/i, '')
    .replace(/:\s*.+$/, '')
    .trim();
}

function toSubthemeDescription(subthemeId: string): string {
  if (subthemeId.includes('nachash')) {
    return 'A identidade e o ofício do Nachash no drama cósmico do Éden, da queda à consumação.';
  }
  if (subthemeId.includes('melquisedeque')) {
    return 'O dízimo como linguagem litúrgica da aliança e administração espiritual do Reino.';
  }
  if (subthemeId.includes('fruto-proibido-de-caim')) {
    return 'A disputa entre sementes, linhagem e corrupção na origem dos conflitos espirituais.';
  }
  if (subthemeId.includes('corte-de-yahweh') || subthemeId.includes('conselho-divino')) {
    return 'Mapeamento da geografia invisível do conselho divino, seus ofícios e sua restauração em Cristo.';
  }
  return 'Série temática com estudos progressivos organizados por volume.';
}

function sortByNewest(a: InterpretationStudy, b: InterpretationStudy): number {
  const dateA = new Date(a.date ?? 0).getTime();
  const dateB = new Date(b.date ?? 0).getTime();
  if (dateA !== dateB) return dateB - dateA;
  return a.volume - b.volume;
}

function sortByVolumeThenDate(a: InterpretationStudy, b: InterpretationStudy): number {
  if (a.volume !== b.volume) return a.volume - b.volume;
  return sortByNewest(a, b);
}

function loadInterpretationStudies(): InterpretationStudy[] {
  return Object.entries(studyMarkdownModules)
    .map(([pathKey, content]) => {
      const normalizedPath = pathKey.replace(/\\/g, '/');
      const parts = normalizedPath.split('/');
      const contentIndex = parts.findIndex((part) => part === 'eixos biblicos');
      const axisId = parts[contentIndex + 1] ?? 'eixo-7-escatologia-consumacao';
      const fileName = parts[parts.length - 1] ?? '';
      const frontmatter = parseFrontmatter(content);
      const axis = AXIS_BY_ID[axisId] ?? AXIS_METADATA[6];
      const title = frontmatter.title || fileName.replace(/\.md$/i, '');
      const subthemeSource = normalizeSubtheme(frontmatter.subtema || title || fileName.replace(/\.md$/i, ''));
      const subthemeId = slugify(subthemeSource);

      return {
        title,
        displayTitle: formatRecentTitle(title),
        description: frontmatter.description,
        date: frontmatter.date,
        pathKey,
        content,
        axisId: axis.id,
        axisTitle: axis.title,
        subthemeId,
        subthemeLabel: subthemeSource.toUpperCase(),
        subthemeDescription: toSubthemeDescription(subthemeId),
        volume: extractVolume(title, fileName),
        image: frontmatter.image?.trim() || undefined,
      };
    })
    .sort(sortByNewest);
}

function getProgress(slug: string): number {
  const value = parseInt(localStorage.getItem(`progress_${slug}`) || '0', 10);
  return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
}

function getReads(slug: string): number {
  const value = parseInt(localStorage.getItem(`reads_${slug}`) || '0', 10);
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function AnimatedDivider() {
  return <div className="divider-sheen my-7" />;
}

function DragScrollRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 snap-x snap-mandatory">
      {children}
    </div>
  );
}

export default function Bible() {
  const [selectedAxisId, setSelectedAxisId] = useState<string | null>(null);
  const [selectedStudy, setSelectedStudy] = useState<InterpretationStudy | null>(null);

  const studies = useMemo(() => loadInterpretationStudies(), []);

  const studiesByAxis = useMemo(() => {
    const map = new Map<string, InterpretationStudy[]>();
    for (const study of studies) {
      const group = map.get(study.axisId) ?? [];
      group.push(study);
      map.set(study.axisId, group);
    }
    for (const [axisId, axisStudies] of map.entries()) {
      map.set(axisId, [...axisStudies].sort(sortByVolumeThenDate));
    }
    return map;
  }, [studies]);

  const recentStudies = useMemo(() => studies.slice(0, 10), [studies]);

  const selectedAxis = selectedAxisId ? AXIS_BY_ID[selectedAxisId] : null;

  const selectedAxisGroups = useMemo<StudyGroup[]>(() => {
    if (!selectedAxisId) return [];
    const axisStudies = studiesByAxis.get(selectedAxisId) ?? [];
    const grouped = axisStudies.reduce<Record<string, StudyGroup>>((acc, study) => {
      if (!acc[study.subthemeId]) {
        acc[study.subthemeId] = {
          subthemeId: study.subthemeId,
          subthemeLabel: study.subthemeLabel,
          subthemeDescription: study.subthemeDescription,
          studies: [],
        };
      }
      acc[study.subthemeId].studies.push(study);
      return acc;
    }, {});
    return Object.values(grouped)
      .map((group) => ({
        ...group,
        studies: [...group.studies].sort(sortByVolumeThenDate),
      }))
      .sort((a, b) => a.subthemeLabel.localeCompare(b.subthemeLabel, 'pt-BR'));
  }, [selectedAxisId, studiesByAxis]);

  if (selectedStudy) {
    return (
      <MarkdownViewer
        content={selectedStudy.content}
        slug={selectedStudy.pathKey}
        onClose={() => setSelectedStudy(null)}
      />
    );
  }

  if (selectedAxis && selectedAxisId) {
    const axisStudies = studiesByAxis.get(selectedAxisId) ?? [];
    const cover = axisStudies[0]?.image || selectedAxis.coverImage;

    return (
      <div className="pt-6 pb-32 px-5 max-w-7xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => setSelectedAxisId(null)}
            className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors mb-5 active:scale-95 text-[10px] font-black uppercase tracking-widest"
          >
            <ChevronLeft size={15} />
            BÍBLIA
          </button>

          <article
            className={`relative overflow-hidden rounded-2xl border border-white/10 h-44 ${selectedAxis.glowClass}`}
          >
            <AppImage
              src={cover}
              alt={selectedAxis.title}
              className="absolute inset-0 w-full h-full object-cover opacity-45"
              priority
            />
            <div className={`absolute inset-0 bg-gradient-to-r ${selectedAxis.accentClass}`} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            <div className="relative h-full p-5 flex flex-col justify-between">
              <div className="inline-flex items-center gap-2 w-fit px-2 py-1 rounded-full border border-primary/35 bg-primary/10">
                <selectedAxis.Icon size={12} className="text-primary" />
                <span className="text-[9px] font-black uppercase tracking-[0.16em] text-primary">
                  Eixo {selectedAxis.index.toString().padStart(2, '0')}
                </span>
              </div>
              <div>
                <h2 className="font-headline font-black text-2xl text-on-surface tracking-tight leading-none uppercase">
                  {selectedAxis.title}
                </h2>
                <p className="mt-1 text-[10px] text-on-surface-variant/80 font-medium max-w-xl leading-relaxed">
                  {selectedAxis.subtitle}
                </p>
              </div>
            </div>
          </article>
        </div>

        <AnimatedDivider />

        {selectedAxisGroups.length === 0 && (
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
            <p className="text-[10px] uppercase tracking-[0.16em] font-black text-on-surface-variant/55 mb-2">
              Hub do Eixo
            </p>
            <p className="text-[11px] text-on-surface-variant/70 max-w-md mx-auto">
              Este eixo está em construção. Novos estudos serão organizados por subtemas aqui.
            </p>
          </article>
        )}

        {selectedAxisGroups.map((group) => (
          <section key={group.subthemeId} className="mb-6">
            <div className="mb-2.5">
              <p className="text-[8px] uppercase tracking-[0.16em] font-black text-primary/80 mb-1">
                Subcategoria
              </p>
              <h3 className="font-headline text-lg font-black tracking-tight text-on-surface uppercase">
                {group.subthemeLabel}
              </h3>
              <p className="mt-1 text-[10px] text-on-surface-variant/60 leading-snug max-w-xl font-medium">
                {group.subthemeDescription}
              </p>
              <p className="text-[10px] text-on-surface-variant/55 uppercase tracking-[0.12em] font-black mt-1">
                {group.studies.length} estudo{group.studies.length > 1 ? 's' : ''}
              </p>
            </div>

            <DragScrollRow>
              {group.studies.map((study) => {
                const progress = getProgress(study.pathKey);
                const reads = getReads(study.pathKey);
                return (
                  <article
                    key={study.pathKey}
                    onClick={() => setSelectedStudy(study)}
                    className="gold-glow-hover min-w-[220px] max-w-[220px] rounded-xl border border-outline-variant/20 bg-surface-container-low overflow-hidden cursor-pointer hover:scale-[1.03] transition-transform duration-300 snap-start"
                  >
                    <div className="h-24 w-full border-b border-outline-variant/10">
                      <AppImage src={study.image} alt={study.title} className="w-full h-full object-cover" />
                    </div>

                    <div className="p-3">
                      <p className="text-[8px] uppercase tracking-[0.16em] font-black text-primary/85 mb-1">
                        Volume {study.volume}
                      </p>
                      <h4 className="font-headline text-xs font-extrabold tracking-tight text-on-surface line-clamp-2 mb-1">
                        {study.title}
                      </h4>
                      <p className="text-[9px] text-on-surface-variant/65 line-clamp-2 leading-snug mb-2">
                        {study.description || 'Clique para abrir o estudo.'}
                      </p>

                      <div className="h-1.5 bg-outline-variant/20 rounded-full overflow-hidden border border-outline-variant/20">
                        <div
                          className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F5D76E]"
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="text-[8px] uppercase tracking-wider font-black text-on-surface-variant/55">
                          {reads > 0 && progress === 0 ? `Lido ${reads}x` : 'Em andamento'}
                        </span>
                        <span className="text-[8px] uppercase tracking-widest font-bold text-on-surface-variant/45">
                          {study.date || 'sem data'}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </DragScrollRow>
          </section>
        ))}
      </div>
    );
  }

  return (
    <div className="pt-6 pb-32 px-5 max-w-7xl mx-auto">
      <header className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 mb-3">
          <Sparkles size={12} className="text-primary" />
          <span className="text-[9px] font-black uppercase tracking-[0.16em] text-primary">
            ESTRUTURA POR EIXOS TEMÁTICOS
          </span>
        </div>
        <p className="font-headline text-[10px] uppercase tracking-[0.2em] font-black text-primary/80 mb-2">
          A Interpretação
        </p>
        <h2 className="font-headline font-extrabold text-3xl text-primary tracking-tighter mb-2 uppercase">
          BÍBLIA
        </h2>
        <p className="text-on-surface-variant/75 text-[11px] max-w-xl font-medium leading-relaxed">
          A Escritura é um mapa detalhado da realidade visível e invisível. Este painel organiza anos de investigação em 7 eixos estratégicos, permitindo uma imersão profunda na cosmologia bíblica, na geografia dos reinos espirituais e no governo dos coerdeiros de Cristo.
        </p>
      </header>

      <section className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock3 size={14} className="text-primary" />
          <h3 className="font-headline text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant">
            ESTUDOS RECENTES
          </h3>
        </div>

        <div className="space-y-2">
          {recentStudies.map((study) => (
            <article
              key={study.pathKey}
              onClick={() => setSelectedStudy(study)}
              className="gold-glow-hover rounded-xl border border-outline-variant/15 bg-surface-container-low/80 backdrop-blur-sm px-2.5 py-2 flex items-center gap-2.5 cursor-pointer hover:scale-[1.01] transition-transform duration-300"
            >
              <div className="w-16 h-12 rounded-lg overflow-hidden border border-white/10 shrink-0">
                <AppImage src={study.image} alt={study.title} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[8px] uppercase tracking-[0.16em] font-black text-primary/80 mb-0.5 line-clamp-1">
                  {study.axisTitle}
                </p>
                <h4 className="font-headline text-[11px] font-extrabold tracking-tight text-on-surface line-clamp-1">
                  {study.displayTitle}
                </h4>
                <p className="text-[9px] text-on-surface-variant/65 line-clamp-1">
                  {study.subthemeLabel}
                </p>
              </div>
              <span className="text-[8px] uppercase tracking-widest font-bold text-on-surface-variant/45 shrink-0">
                {study.date || '--'}
              </span>
            </article>
          ))}

          {recentStudies.length === 0 && (
            <article className="rounded-xl border border-outline-variant/15 bg-surface-container-low p-4">
              <p className="text-[10px] text-on-surface-variant/70 leading-relaxed">
                Assim que novos estudos forem adicionados, eles aparecem aqui automaticamente.
              </p>
            </article>
          )}
        </div>
      </section>

      <AnimatedDivider />

      <section className="space-y-3">
        {AXIS_METADATA.map((axis) => {
          const axisStudies = studiesByAxis.get(axis.id) ?? [];
          const cover = axisStudies[0]?.image || axis.coverImage;
          const completed = axisStudies.filter((study) => getProgress(study.pathKey) >= 100).length;

          return (
            <button
              key={axis.id}
              onClick={() => setSelectedAxisId(axis.id)}
              className={`gold-glow-hover group relative w-full h-44 rounded-2xl overflow-hidden cursor-pointer active:scale-[0.99] transition-all duration-300 border border-white/10 text-left ${axis.glowClass}`}
            >
              <AppImage
                src={cover}
                alt={axis.title}
                className="absolute inset-0 w-full h-full object-cover opacity-45 group-hover:opacity-55 group-hover:scale-105 transition-all duration-700"
              />
              <div className={`absolute inset-0 bg-gradient-to-r ${axis.accentClass}`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 shadow-[inset_0_0_40px_rgba(245,199,113,0.08)]" />

              <div className="relative h-full p-5 flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-2.5 py-1">
                    <axis.Icon size={12} className="text-primary" />
                    <span className="text-[9px] font-black uppercase tracking-[0.16em] text-primary">
                      Eixo {axis.index.toString().padStart(2, '0')}
                    </span>
                  </div>
                  <span className="text-[8px] uppercase tracking-widest font-black text-on-surface-variant/65">
                    {axisStudies.length} estudo{axisStudies.length > 1 ? 's' : ''}
                  </span>
                </div>

                <div>
                  <h3 className="font-headline font-black text-[22px] text-on-surface tracking-tight uppercase leading-none mb-1">
                    {axis.title}
                  </h3>
                  <p className="text-[10px] text-on-surface-variant/75 leading-snug font-medium line-clamp-2 max-w-[85%]">
                    {axis.description}
                  </p>
                  {axisStudies.length > 0 && (
                    <p className="mt-2 text-[9px] uppercase tracking-[0.14em] font-black text-primary/85">
                      {completed}/{axisStudies.length} concluídos
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </section>
    </div>
  );
}
