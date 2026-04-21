import { useMemo, useState } from 'react';
import { AlertTriangle, ChevronLeft, Shield, Sparkles } from 'lucide-react';
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
}

interface RefutationTheme {
  id: string;
  label: string;
  subtitle: string;
  accent: string;
}

const REFUTATION_THEMES: RefutationTheme[] = [
  {
    id: 'revelacao-adversaria',
    label: 'Cosmologia / Matrix',
    subtitle: 'A ordem mundial opera sob uma economia de revelação ritual. O sistema anuncia seus movimentos através de símbolos públicos, ficção preditiva e cerimônias.',
    accent: 'from-[#271a30]/95 via-[#171223]/82 to-[#0f1115]/45',
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

function sortByNewest(a: RefutationStudy, b: RefutationStudy): number {
  const dateA = new Date(a.date ?? 0).getTime();
  const dateB = new Date(b.date ?? 0).getTime();
  if (dateA !== dateB) return dateB - dateA;
  return a.title.localeCompare(b.title, 'pt-BR');
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
      const slug = fileName.replace(/\.md$/i, '');

      return {
        title: frontmatter.title || fileName.replace(/\.md$/i, ''),
        description: frontmatter.description,
        date: frontmatter.date,
        image: frontmatter.image || '/image/livraria da matrix/a paisagem da crise.webp',
        slug,
        pathKey,
        content,
        themeId,
      };
    })
    .sort(sortByNewest);
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
          className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors mb-5 active:scale-95 text-[10px] font-black uppercase tracking-widest"
        >
          <ChevronLeft size={15} />
          Livraria da Matrix
        </button>

        <article className="relative w-full h-44 rounded-2xl overflow-hidden border border-white/10 mb-6">
          <AppImage src={cover} alt={selectedTheme.label} className="absolute inset-0 w-full h-full object-cover opacity-45" priority />
          <div className={`absolute inset-0 bg-gradient-to-r ${selectedTheme.accent}`} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
          <div className="relative h-full p-5 flex flex-col justify-end">
            <h2 className="font-headline font-black text-2xl text-on-surface tracking-tight uppercase leading-none">
              {selectedTheme.label}
            </h2>
            <p className="mt-1 text-[10px] text-on-surface-variant/80 max-w-lg leading-relaxed">
              {selectedTheme.subtitle}
            </p>
          </div>
        </article>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {themeStudies.map((study) => (
            <article
              key={study.pathKey}
              onClick={() => setSelectedStudy(study)}
              className="gold-glow-hover group cursor-pointer rounded-2xl border border-outline-variant/20 bg-surface-container-low/80 backdrop-blur-sm p-4 hover:scale-[1.02] transition-transform duration-300"
            >
              <p className="text-[8px] uppercase tracking-[0.16em] font-black text-primary/85 mb-1">
                Revelação Adversária
              </p>
              <h4 className="font-headline text-base font-extrabold tracking-tight text-on-surface line-clamp-2 group-hover:text-primary transition-colors">
                {study.title}
              </h4>
              <p className="mt-1 text-[10px] text-on-surface-variant/75 leading-relaxed line-clamp-2">
                {study.description || 'Conteúdo preparado para aprofundamento exegético.'}
              </p>
              <span className="mt-2 block text-[8px] uppercase tracking-widest font-bold text-on-surface-variant/45">
                {study.date || 'sem data'}
              </span>
            </article>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pt-6 pb-32 px-5 max-w-7xl mx-auto">
      <header className="mb-7">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 mb-3">
          <Shield size={12} className="text-primary" />
          <span className="text-[9px] font-black uppercase tracking-[0.16em] text-primary">
            Livraria da Matrix
          </span>
        </div>
        <h2 className="font-headline font-extrabold text-3xl text-primary tracking-tighter mb-2 uppercase">
          LIVRARIA DA MATRIX
        </h2>
        <p className="text-on-surface-variant/75 text-[11px] max-w-2xl font-medium leading-relaxed">
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
              className="gold-glow-hover group relative w-full h-48 rounded-2xl overflow-hidden cursor-pointer active:scale-[0.99] transition-all duration-300 border border-white/10 text-left"
            >
              <AppImage
                src={cover}
                alt={theme.label}
                className="absolute inset-0 w-full h-full object-cover opacity-45 group-hover:opacity-60 group-hover:scale-105 transition-all duration-700"
              />
              <div className={`absolute inset-0 bg-gradient-to-r ${theme.accent}`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
              <div className="relative h-full p-5 flex flex-col justify-between">
                <div className="inline-flex items-center gap-2 w-fit px-2 py-1 rounded-full border border-[#ff9c9c]/25 bg-[#1a1114]/60 backdrop-blur-sm">
                  <AlertTriangle size={12} className="text-[#f4b1b1]" />
                  <span className="text-[9px] font-black uppercase tracking-[0.16em] text-[#f4b1b1]">
                    Nova Sessão
                  </span>
                </div>
                <div>
                  <h3 className="font-headline font-black text-[22px] text-on-surface tracking-tight uppercase leading-none mb-1">
                    {theme.label}
                  </h3>
                  <p className="text-[10px] text-on-surface-variant/75 leading-snug font-medium line-clamp-2">
                    {theme.subtitle}
                  </p>
                  <p className="mt-2 text-[9px] uppercase tracking-[0.14em] font-black text-[#f4b1b1]/85">
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
          <Sparkles size={13} className="text-primary" />
          <h3 className="font-headline text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant">
            Últimas Publicações
          </h3>
        </div>
        <div className="space-y-2">
          {studies.slice(0, 6).map((study) => (
            <article
              key={study.pathKey}
              onClick={() => setSelectedStudy(study)}
              className="gold-glow-hover rounded-xl border border-outline-variant/15 bg-surface-container-low/80 backdrop-blur-sm px-3 py-2.5 flex items-center gap-2.5 cursor-pointer hover:scale-[1.01] transition-transform duration-300"
            >
              <div className="w-16 h-11 rounded-lg overflow-hidden border border-white/10 shrink-0">
                <AppImage src={study.image} alt={study.title} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-headline text-[11px] font-extrabold tracking-tight text-on-surface line-clamp-1">
                  {study.title}
                </h4>
                <p className="text-[9px] text-on-surface-variant/65 line-clamp-1">
                  {study.description || 'Clique para abrir a análise.'}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
