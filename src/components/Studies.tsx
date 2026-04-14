import { useState, useEffect } from 'react';
import { Search, Star, ChevronDown, ChevronUp, Clock, ArrowLeft } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { MarkdownViewer } from './MarkdownViewer';

interface StudyItem {
  title: string;
  slug: string;
  description: string;
  date: string;
  category: string;
  time: string;
  image?: string;
}

export default function Studies() {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [markdownContent, setMarkdownContent] = useState<string | null>(null);
  const { data: studies, loading, error } = useFetch<StudyItem[]>('/content/estudos/index.json');

  // Featured and Recent logic with deduplication
  const featuredStudies = studies ? studies.slice(0, 4) : [];
  const recentStudies = studies ? studies.slice(4) : [];

  // Group studies by category for Library section
  const categories = studies ? Array.from(new Set(studies.map(s => s.category))) : [];
  const groupedStudies = categories.reduce((acc, cat) => {
    acc[cat] = studies?.filter(s => s.category === cat) || [];
    return acc;
  }, {} as Record<string, StudyItem[]>);

  useEffect(() => {
    if (selectedSlug) {
      const fetchMarkdown = async () => {
        try {
          const response = await fetch(`/content/estudos/${selectedSlug}.md`);
          if (response.ok) {
            const text = await response.text();
            setMarkdownContent(text);
          }
        } catch (err) {
          console.error('Error fetching markdown:', err);
        }
      };
      fetchMarkdown();
    } else {
      setMarkdownContent(null);
    }
  }, [selectedSlug]);

  if (selectedSlug && markdownContent) {
    return (
      <MarkdownViewer 
        content={markdownContent} 
        slug={selectedSlug} 
        onClose={() => setSelectedSlug(null)} 
      />
    );
  }

  return (
    <div className="pb-24 min-h-screen bg-surface-container-lowest">
      {/* Editorial Header */}
      <div className="pt-8 px-4 sm:px-6 mb-6 border-l-2 border-primary-container py-1 ml-4 sm:ml-6">
        <h1 className="font-headline text-4xl font-bold text-primary mb-1 tracking-tighter">Estudos</h1>
        <p className="text-on-surface-variant/70 text-[11px] max-w-[280px] font-medium leading-relaxed">
          A prática da fé no cotidiano: ferramentas para oração, vida com Deus e o preparo espiritual para as provações no deserto.
        </p>
      </div>

      {/* Investigative Search */}
      <section className="px-4 sm:px-6 mt-4">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
          <input 
            className="w-full bg-surface-container-high border-b border-outline-variant focus:border-primary focus:ring-0 text-on-surface placeholder:text-on-surface-variant/50 transition-all px-11 py-3.5 font-sans text-sm tracking-wide outline-none" 
            placeholder="Buscar estudo..." 
            type="text" 
          />
          <Star className="absolute right-4 top-1/2 -translate-y-1/2 text-primary opacity-0 group-focus-within:opacity-100 transition-opacity" size={18} />
        </div>
      </section>

      {/* Featured Carousel */}
      <section className="mt-8">
        <div className="px-4 sm:px-6 flex justify-between items-baseline mb-3">
          <h2 className="font-headline font-bold text-[10px] tracking-[0.2em] uppercase text-on-surface opacity-60">
            Estudos em Destaque
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
                onClick={() => setSelectedSlug(item.slug)}
                className="relative aspect-[16/10] rounded-2xl overflow-hidden group cursor-pointer active:scale-95 transition-transform"
              >
                <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src={item.image || `https://picsum.photos/seed/${item.slug}/600/400`} />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/40 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <span className="text-[8px] font-black tracking-[0.3em] uppercase text-primary mb-1 block">✦ INVESTIGAÇÃO</span>
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
      <section className="mt-12 mb-8 container-biblioteca">
        <div className="flex items-center gap-4">
          <h2 className="font-headline font-extrabold text-2xl tracking-tighter text-on-surface">Biblioteca</h2>
          <div className="h-[1px] flex-1 bg-outline-variant/20"></div>
        </div>
      </section>

      {/* Library Rows (Horizontal Rows per Category) */}
      <section className="space-y-10">
        {loading ? null : categories.map((cat, i) => (
          <div key={i} className="flex flex-col gap-4">
            <div className="flex items-center justify-between container-biblioteca">
              <h3 className="text-[10px] font-black tracking-[0.25em] uppercase text-primary opacity-80">{cat}</h3>
              <div className="h-[1px] flex-1 ml-4 bg-outline-variant/10"></div>
            </div>
            
            <div className="flex gap-4 overflow-x-auto hide-scrollbar snap-x snap-mandatory">
              <div className="w-4 sm:w-6 flex-shrink-0" /> {/* Left Spacer to align with px-4/sm:px-6 */}
              {groupedStudies[cat].map((item, j) => {
                const progress = typeof window !== 'undefined' ? localStorage.getItem(`progress_${item.slug}`) : null;
                
                return (
                  <div 
                    key={j} 
                    onClick={() => setSelectedSlug(item.slug)}
                    className="flex-shrink-0 w-40 sm:w-48 snap-start group cursor-pointer active:scale-[0.98] transition-all"
                  >
                    <div className="aspect-[4/3] rounded-xl overflow-hidden mb-2 border border-outline-variant/10 shadow-sm relative">
                      <img 
                        src={item.image || `https://picsum.photos/seed/${item.slug}/400/300`} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      {progress && parseInt(progress) > 0 && (
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-black/40">
                          <div 
                            className="h-full bg-gradient-to-r from-orange-500 to-yellow-400" 
                            style={{ width: `${progress}%` }}
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
      <section className="mt-16 pb-12 container-biblioteca">
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
              onClick={() => setSelectedSlug(item.slug)}
              className="flex flex-col group cursor-pointer active:scale-[0.98] transition-all"
            >
              <div className="aspect-[16/9] rounded-xl overflow-hidden mb-3 border border-outline-variant/10">
                <img 
                  src={item.image || `https://picsum.photos/seed/${item.slug}/400/225`} 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" 
                />
              </div>
              <div className="flex flex-col flex-1">
                <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em] mb-1.5">
                  {item.category}
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
