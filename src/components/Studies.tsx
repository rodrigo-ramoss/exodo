import { useMemo, useState } from 'react';
import { Search, Star, Clock, Check } from 'lucide-react';
import { MarkdownViewer } from './MarkdownViewer';
import { useFetch } from '../hooks/useFetch';
import { AppImage } from './AppImage';
import { pm } from '../lib/progressManager';

interface StudyItem {
  title: string;
  slug: string;
  description: string;
  date: string;
  category: string;
  time: string;
  image?: string;
}

interface ManaTheme {
  id: string;
  title: string;
  subtitle: string;
  keywords: string[];
}

interface ManaConfig {
  themes: ManaTheme[];
}

const manaMarkdownModules = import.meta.glob('/public/content/mana/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

function normalizeKey(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function resolveManaMarkdown(study: StudyItem | null): string | null {
  if (!study) return null;
  const slugTail = study.slug.split('/').pop() || study.slug;
  const slugKey = normalizeKey(slugTail);
  const titleKey = normalizeKey(study.title);

  for (const [path, markdown] of Object.entries(manaMarkdownModules)) {
    const fileName = path.split('/').pop()?.replace(/\.md$/i, '') || '';
    const fileKey = normalizeKey(fileName);
    if (fileKey === slugKey || fileKey === titleKey || fileKey.includes(slugKey) || fileKey.includes(titleKey)) {
      return markdown;
    }
  }

  return null;
}

export default function Studies() {
  const [selectedStudy, setSelectedStudy] = useState<StudyItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const { data: manaConfig } = useFetch<ManaConfig>('/content/mana/mana.json');
  const { data: manaStudies, error } = useFetch<StudyItem[]>('/content/mana/index.json');

  const allStudies = useMemo(() => manaStudies ?? [], [manaStudies]);

  const selectedTheme = useMemo(
    () => manaConfig?.themes?.find((theme) => theme.id === selectedThemeId) || null,
    [manaConfig?.themes, selectedThemeId],
  );

  const matchesTheme = (study: StudyItem) => {
    if (!selectedTheme) return true;
    const haystack = `${study.title} ${study.description} ${study.category} ${study.slug}`.toLowerCase();
    return selectedTheme.keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
  };

  const studies = useMemo(() => {
    const lowerSearch = searchTerm.trim().toLowerCase();
    return allStudies
      .filter(study => {
        if (!matchesTheme(study)) return false;
        if (!lowerSearch) return true;
        return (
          study.title.toLowerCase().includes(lowerSearch) ||
          study.description.toLowerCase().includes(lowerSearch) ||
          study.category.toLowerCase().includes(lowerSearch)
        );
      });
  }, [allStudies, searchTerm, selectedTheme]);

  const loading = !manaStudies;

  // Featured and Recent logic with deduplication
  const featuredStudies = studies ? studies.slice(0, 4) : [];
  const recentStudies = studies ? studies.slice(4) : [];

  // Group studies by category for Library section
  const categories = studies ? Array.from(new Set(studies.map(s => s.category))) : [];
  const groupedStudies = categories.reduce((acc, cat) => {
    acc[cat] = studies?.filter(s => s.category === cat) || [];
    return acc;
  }, {} as Record<string, StudyItem[]>);

  const markdownContent = resolveManaMarkdown(selectedStudy);

  if (selectedStudy && markdownContent) {
    return (
      <MarkdownViewer
        content={markdownContent}
        slug={selectedStudy.slug}
        category="mana"
        onClose={() => setSelectedStudy(null)}
      />
    );
  }

  return (
    <div className="pb-24 min-h-screen bg-surface-container-lowest">
      {/* Editorial Header */}
      <div className="pt-8 px-4 sm:px-6 mb-6 border-l-2 border-primary-container py-1 ml-4 sm:ml-6">
        <h1 className="font-headline text-4xl font-bold text-primary mb-1 tracking-tighter">MANÁ</h1>
        <p className="text-on-surface-variant/70 text-[11px] max-w-[280px] font-medium leading-relaxed">
          <span className="italic">'Nem só de pão viverá o homem, mas de toda palavra que sai da boca de Deus.'</span> O alimento diário para a sua jornada no deserto. Estudos voltados para o preparo espiritual, batalhas da mente e a resiliência inabalável diante das provações.
        </p>
      </div>

      {/* Investigative Search */}
      <section className="px-4 sm:px-6 mt-4">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-3 mb-3">
          <button
            className="gold-glow-hover flex-shrink-0 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border transition-all rounded-full bg-primary text-on-primary border-primary"
            type="button"
          >
            MANÁ
          </button>
          <button
            className="gold-glow-hover flex-shrink-0 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border transition-all rounded-full bg-surface-container-high text-on-surface border-outline-variant/40 hover:border-primary"
            type="button"
            onClick={() => setIsCategoriesOpen((prev) => !prev)}
          >
            Categorias
          </button>
        </div>

        {isCategoriesOpen && (
          <div className="mb-4 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-2 max-h-72 overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                setSelectedThemeId(null);
                setIsCategoriesOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-xl transition-colors ${
                !selectedThemeId ? 'bg-primary/15 text-primary' : 'hover:bg-surface-container-high'
              }`}
            >
              <p className="text-[10px] font-black uppercase tracking-wider">Todos os temas</p>
            </button>
            {(manaConfig?.themes || []).map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => {
                  setSelectedThemeId(theme.id);
                  setIsCategoriesOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl transition-colors ${
                  selectedThemeId === theme.id ? 'bg-primary/15 text-primary' : 'hover:bg-surface-container-high'
                }`}
              >
                <p className="text-[10px] font-black uppercase tracking-wider">{theme.title}</p>
                <p className="text-[10px] text-on-surface-variant">{theme.subtitle}</p>
              </button>
            ))}
          </div>
        )}

        {selectedTheme && (
          <div className="mb-4 text-[10px] font-bold uppercase tracking-wider text-primary">
            Tema ativo: {selectedTheme.title}
          </div>
        )}

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
          <input 
            className="w-full bg-surface-container-high border-b border-outline-variant focus:border-primary focus:ring-0 text-on-surface placeholder:text-on-surface-variant/50 transition-all px-11 py-3.5 font-sans text-sm tracking-wide outline-none" 
            placeholder="Buscar estudo..." 
            type="text" 
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <Star className="absolute right-4 top-1/2 -translate-y-1/2 text-primary opacity-0 group-focus-within:opacity-100 transition-opacity" size={18} />
        </div>
      </section>

      {!loading && studies.length === 0 && (
        <section className="px-4 sm:px-6 mt-8">
          <div className="py-16 text-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-60 border border-dashed border-outline-variant/20 rounded-3xl">
            Nenhum estudo encontrado para este tema.
          </div>
        </section>
      )}

      {/* Featured Carousel */}
      <section className={`mt-8 ${studies.length === 0 ? 'hidden' : ''}`}>
        <div className="px-4 sm:px-6 flex justify-between items-baseline mb-3">
          <h2 className="font-headline font-bold text-[10px] tracking-[0.2em] uppercase text-on-surface opacity-60">
            MANÁ em Destaque
          </h2>
          <div className="flex gap-1">
            <span className="w-1 h-1 bg-primary rounded-full"></span>
            <span className="w-1 h-1 bg-surface-container-highest rounded-full"></span>
            <span className="w-1 h-1 bg-surface-container-highest rounded-full"></span>
            <span className="w-1 h-1 bg-surface-container-highest rounded-full"></span>
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto hide-scrollbar snap-x snap-mandatory">
          <div className="w-4 sm:w-6 flex-shrink-0" /> {/* Left Spacer */}
          {loading ? (
            <div className="w-full py-10 text-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-50">Carregando...</div>
          ) : featuredStudies.map((item, i) => (
            <div key={i} className="flex-shrink-0 w-72 snap-center">
              <div 
                onClick={() => setSelectedStudy(item)}
                className="interactive-card gold-glow-hover relative aspect-[16/10] rounded-2xl overflow-hidden group cursor-pointer active:scale-95 transition-transform"
              >
                <AppImage className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src={item.image} alt={item.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/40 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <span className="text-[8px] font-black tracking-[0.3em] uppercase text-primary mb-1 block">✦ {item.category.toUpperCase()}</span>
                  <h3 className="font-headline font-extrabold text-base leading-tight text-on-surface">{item.title}</h3>
                  <p className="text-[9px] text-on-surface-variant mt-1 font-bold uppercase tracking-wider">{item.category} • {item.time}</p>
                </div>
              </div>
            </div>
          ))}
          <div className="w-4 sm:w-6 flex-shrink-0" /> {/* Right Spacer */}
        </div>
      </section>

      {/* Spacing and Library Header */}
      <section className={`mt-12 mb-8 container-biblioteca ${studies.length === 0 ? 'hidden' : ''}`}>
        <div className="flex items-center gap-4">
          <h2 className="font-headline font-extrabold text-2xl tracking-tighter text-on-surface">Biblioteca</h2>
          <div className="h-[1px] flex-1 bg-outline-variant/20"></div>
        </div>
      </section>

      {/* Library Rows (Horizontal Rows per Category) */}
      <section className={`space-y-10 ${studies.length === 0 ? 'hidden' : ''}`}>
        {loading ? null : categories.map((cat, i) => (
          <div key={i} className="flex flex-col gap-4">
            <div className="flex items-center justify-between container-biblioteca">
              <h3 className="text-[10px] font-black tracking-[0.25em] uppercase text-primary opacity-80">{cat}</h3>
              <div className="h-[1px] flex-1 ml-4 bg-outline-variant/10"></div>
            </div>
            
            <div className="flex gap-4 overflow-x-auto hide-scrollbar snap-x snap-mandatory">
              <div className="w-4 sm:w-6 flex-shrink-0" /> {/* Left Spacer to align with px-4/sm:px-6 */}
              {groupedStudies[cat].map((item, j) => {
                const progress = pm.getProgress('mana', item.slug);
                const isCompleted = pm.isRead('mana', item.slug);

                return (
                  <div
                    key={j}
                    onClick={() => setSelectedStudy(item)}
                    className="interactive-card gold-glow-hover flex-shrink-0 w-40 sm:w-48 snap-start group cursor-pointer active:scale-[0.98] transition-all"
                  >
                    <div className="aspect-[4/3] rounded-xl overflow-hidden mb-2 border border-outline-variant/10 shadow-sm relative">
                      <AppImage
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      {isCompleted && (
                        <div className="absolute top-1.5 right-1.5 flex items-center gap-1 rounded-full bg-black/70 border border-[#D4AF37]/60 px-1.5 py-0.5">
                          <Check size={8} className="text-[#D4AF37]" />
                          <span className="text-[7px] font-black uppercase tracking-widest text-[#D4AF37]">Lido</span>
                        </div>
                      )}
                      {progress > 0 && (
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-black/40">
                          <div
                            className={isCompleted
                              ? 'h-full bg-gradient-to-r from-[#D4AF37] to-[#F5D76E]'
                              : 'h-full bg-gradient-to-r from-orange-500 to-yellow-400'
                            }
                            style={{ width: `${isCompleted ? 100 : progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <h4 className="font-headline font-bold text-[11px] leading-tight text-on-surface mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-1.5 opacity-40">
                      <Clock size={10} />
                      <span className="text-[9px] font-bold uppercase tracking-widest">{item.time}</span>
                    </div>
                  </div>
                );
              })}
              <div className="w-4 sm:w-6 flex-shrink-0" /> {/* Right Spacer */}
            </div>
          </div>
        ))}
      </section>

      {/* Recent Studies (2-Column Grid) */}
      <section className={`mt-16 pb-12 container-biblioteca ${studies.length === 0 ? 'hidden' : ''}`}>
        <div className="flex items-center gap-4 mb-8">
          <h2 className="font-headline font-extrabold text-xl tracking-tighter text-on-surface">Explorações Recentes</h2>
          <div className="h-[1px] flex-1 bg-outline-variant/20"></div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-8">
          {loading ? (
            <div className="col-span-2 py-10 text-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-50 animate-pulse">
              Atualizando arquivos...
            </div>
          ) : recentStudies.map((item, i) => (
            <div 
              key={i} 
              onClick={() => setSelectedStudy(item)}
              className="interactive-card gold-glow-hover flex flex-col group cursor-pointer active:scale-[0.98] transition-all"
            >
              <div className="aspect-[16/9] rounded-xl overflow-hidden mb-3 border border-outline-variant/10">
                <AppImage
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                />
              </div>
              <div className="flex flex-col flex-1">
                <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em] mb-1.5">
                  ✦ {item.category.toUpperCase()}
                </span>
                <h4 className="font-headline font-bold text-xs text-on-surface leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
                  {item.title}
                </h4>
                <div className="mt-auto pt-2 border-t border-outline-variant/5 flex items-center justify-between opacity-40">
                  <span className="text-[8px] font-bold uppercase tracking-widest">{item.date}</span>
                  <span className="text-[8px] font-bold uppercase tracking-widest">{item.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {error && <div className="text-red-500 text-[10px] uppercase font-bold text-center py-4">{error}</div>}
      </section>
    </div>
  );
}
