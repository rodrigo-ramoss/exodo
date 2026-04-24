import { useMemo, useState } from 'react';
import { Search, Star, Clock, Check, ArrowRight } from 'lucide-react';
import { MarkdownViewer } from './MarkdownViewer';
import { useFetch } from '../hooks/useFetch';
import { AppImage } from './AppImage';
import { pm } from '../lib/progressManager';

type TendaId = 'vida-espiritual' | 'vida-interior' | 'vida-exterior';

interface StudyItem {
  title: string;
  slug: string;
  description: string;
  date: string;
  category: string;
  time: string;
  image?: string;
  tenda?: TendaId;
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

interface TendaCard {
  id: TendaId;
  title: string;
  subtitle: string;
  description: string;
  cta: string;
}

const TENDA_CARDS: TendaCard[] = [
  {
    id: 'vida-espiritual',
    title: 'Tenda 1 - Vida Espiritual',
    subtitle: 'O núcleo da guerra',
    description:
      'Oração, guerra espiritual, discernimento, jejum, intimidade com Deus e armas espirituais para sustentar sua caminhada.',
    cta: 'Entrar na tenda',
  },
  {
    id: 'vida-interior',
    title: 'Tenda 2 - Vida Interior',
    subtitle: 'Mente, emoções e relacionamentos',
    description:
      'Estudos sobre ansiedade, depressão, cura interior, batalha da mente, casamento, sexualidade, perdão e vínculos espirituais.',
    cta: 'Entrar na tenda',
  },
  {
    id: 'vida-exterior',
    title: 'Tenda 3 - Vida Exterior',
    subtitle: 'Trabalho, missão e sociedade',
    description:
      'Conteúdos sobre vocação, finanças, missão, evangelismo, cultura, influência, igreja e vida pública diante do Reino.',
    cta: 'Entrar na tenda',
  },
];

const TENDA_LABEL: Record<TendaId, string> = {
  'vida-espiritual': 'Vida Espiritual',
  'vida-interior': 'Vida Interior',
  'vida-exterior': 'Vida Exterior',
};

const TENDA_KEYWORDS: Record<TendaId, string[]> = {
  'vida-espiritual': [
    'oração',
    'jejum',
    'comunhão',
    'intimidade',
    'deus',
    'guerra espiritual',
    'discernimento',
    'ensinos de jesus',
  ],
  'vida-interior': [
    'ansiedade',
    'depressão',
    'cura interior',
    'mente',
    'emoções',
    'perdão',
    'provações',
    'silêncio',
    'espera',
  ],
  'vida-exterior': [
    'vocação',
    'finanças',
    'missão',
    'evangelismo',
    'cultura',
    'influência',
    'igreja',
    'reino',
    'aplicação prática',
  ],
};

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

function inferTenda(study: StudyItem): TendaId {
  const normalized = normalizeKey(`${study.title} ${study.description} ${study.category} ${study.slug}`);
  const scoreByTenda = Object.entries(TENDA_KEYWORDS).map(([id, keywords]) => {
    const score = keywords.reduce((acc, keyword) => (normalized.includes(normalizeKey(keyword)) ? acc + 1 : acc), 0);
    return { id: id as TendaId, score };
  });

  const winner = scoreByTenda.sort((a, b) => b.score - a.score)[0];
  return winner.score > 0 ? winner.id : 'vida-espiritual';
}

export default function Studies() {
  const [selectedStudy, setSelectedStudy] = useState<StudyItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [selectedTendaId, setSelectedTendaId] = useState<TendaId | null>(null);
  const { data: manaConfig } = useFetch<ManaConfig>('/content/mana/mana.json');
  const { data: manaStudies, error } = useFetch<StudyItem[]>('/content/mana/index.json');

  const allStudies = useMemo(
    () =>
      (manaStudies ?? []).map((study) => ({
        ...study,
        tenda: study.tenda ?? inferTenda(study),
      })),
    [manaStudies],
  );

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
    return allStudies.filter((study) => {
      if (selectedTendaId && study.tenda !== selectedTendaId) return false;
      if (!matchesTheme(study)) return false;
      if (!lowerSearch) return true;
      return (
        study.title.toLowerCase().includes(lowerSearch) ||
        study.description.toLowerCase().includes(lowerSearch) ||
        study.category.toLowerCase().includes(lowerSearch)
      );
    });
  }, [allStudies, searchTerm, selectedTheme, selectedTendaId]);

  const loading = !manaStudies;

  const featuredStudies = studies ? studies.slice(0, 4) : [];
  const recentStudies = studies ? studies.slice(4) : [];

  const categories = studies ? Array.from(new Set(studies.map((s) => s.category))) : [];
  const groupedStudies = categories.reduce((acc, cat) => {
    acc[cat] = studies?.filter((s) => s.category === cat) || [];
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
      <div className="pt-8 px-4 sm:px-6 mb-8">
        <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-surface-container-high/90 via-surface-container/90 to-surface-container-low p-6 sm:p-8 shadow-[0_14px_40px_rgba(0,0,0,0.45)]">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-primary/80 mb-2">Seção Maná</p>
          <h1 className="font-headline text-4xl sm:text-5xl font-bold text-primary mb-2 tracking-tighter">MANÁ</h1>
          <p className="text-sm sm:text-base text-on-surface font-semibold mb-2">
            O alimento sólido para a batalha de hoje.
          </p>
          <p className="text-xs sm:text-sm text-on-surface-variant/90 leading-relaxed max-w-3xl">
            E-books e estudos profundos para fortalecer sua vida espiritual, curar sua vida interior e preparar você
            para cumprir sua missão no mundo.
          </p>
        </div>
      </div>

      <section className="px-4 sm:px-6 mb-8">
        <div className="flex items-end justify-between gap-3 mb-4">
          <div>
            <h2 className="font-headline text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">Escolha sua tenda</h2>
            <p className="text-xs text-on-surface-variant mt-1">
              O Maná é organizado em três tendas. Escolha uma porta de entrada para focar seus estudos.
            </p>
          </div>
          {selectedTendaId && (
            <button
              type="button"
              onClick={() => setSelectedTendaId(null)}
              className="text-[10px] font-black uppercase tracking-widest text-primary border border-primary/40 rounded-full px-3 py-1 hover:bg-primary/15 transition-colors"
            >
              Ver todas as tendas
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TENDA_CARDS.map((tenda) => {
            const isActive = selectedTendaId === tenda.id;
            return (
              <button
                key={tenda.id}
                type="button"
                onClick={() => setSelectedTendaId(tenda.id)}
                className={`text-left rounded-2xl border p-5 transition-all duration-300 cursor-pointer active:scale-[0.99] ${
                  isActive
                    ? 'border-primary/70 bg-primary/12 shadow-[0_0_0_1px_rgba(212,175,55,0.25),0_15px_35px_rgba(0,0,0,0.35)]'
                    : 'border-outline-variant/25 bg-surface-container hover:border-primary/45 hover:bg-surface-container-high hover:-translate-y-0.5'
                }`}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary/80 mb-2">{tenda.title}</p>
                <h3 className="font-headline text-lg leading-tight text-on-surface mb-2">{tenda.subtitle}</h3>
                <p className="text-xs leading-relaxed text-on-surface-variant min-h-[72px]">{tenda.description}</p>
                <div className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                  {tenda.cta}
                  <ArrowRight size={12} />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="px-4 sm:px-6 mt-2">
        {(selectedTendaId || selectedTheme) && (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {selectedTendaId && (
              <span className="inline-flex items-center rounded-full border border-primary/45 bg-primary/12 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
                Tenda ativa: {TENDA_LABEL[selectedTendaId]}
              </span>
            )}
            {selectedTheme && (
              <span className="inline-flex items-center rounded-full border border-primary/45 bg-primary/12 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
                Tema ativo: {selectedTheme.title}
              </span>
            )}
          </div>
        )}

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
            Nenhum estudo encontrado para este filtro.
          </div>
        </section>
      )}

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
          <div className="w-4 sm:w-6 flex-shrink-0" />
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
          <div className="w-4 sm:w-6 flex-shrink-0" />
        </div>
      </section>

      <section className={`mt-12 mb-8 container-biblioteca ${studies.length === 0 ? 'hidden' : ''}`}>
        <div className="flex items-center gap-4">
          <h2 className="font-headline font-extrabold text-2xl tracking-tighter text-on-surface">Biblioteca</h2>
          <div className="h-[1px] flex-1 bg-outline-variant/20"></div>
        </div>
      </section>

      <section className={`space-y-10 ${studies.length === 0 ? 'hidden' : ''}`}>
        {loading ? null : categories.map((cat, i) => (
          <div key={i} className="flex flex-col gap-4">
            <div className="flex items-center justify-between container-biblioteca">
              <h3 className="text-[10px] font-black tracking-[0.25em] uppercase text-primary opacity-80">{cat}</h3>
              <div className="h-[1px] flex-1 ml-4 bg-outline-variant/10"></div>
            </div>

            <div className="flex gap-4 overflow-x-auto hide-scrollbar snap-x snap-mandatory">
              <div className="w-4 sm:w-6 flex-shrink-0" />
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
              <div className="w-4 sm:w-6 flex-shrink-0" />
            </div>
          </div>
        ))}
      </section>

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
