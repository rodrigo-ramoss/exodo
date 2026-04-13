import { useState, useEffect } from 'react';
import { Search, Filter, Star, TrendingUp, Plus, Minus, BookOpen, ChevronDown, ArrowLeft } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { MarkdownViewer } from './MarkdownViewer';

interface SignItem {
  title: string;
  slug: string;
  description: string;
  date: string;
  category: string;
  time: string;
  image?: string;
}

export default function Signs() {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [markdownContent, setMarkdownContent] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const { data: signs, loading, error } = useFetch<SignItem[]>('/content/sinais/index.json');

  // Get unique categories for filter
  const categories = signs ? Array.from(new Set(signs.map(s => s.category))) : [];

  // Filter and Sort Logic
  const filteredSigns = signs ? [...signs]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .filter(item => !expandedCategory || item.category === expandedCategory)
    .slice(0, 10) : [];

  useEffect(() => {
    if (selectedSlug) {
      const fetchMarkdown = async () => {
        try {
          const response = await fetch(`/content/sinais/${selectedSlug}.md`);
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
    <div className="pt-6 pb-32 px-5 max-w-7xl mx-auto min-h-screen bg-surface-container-lowest">
      {/* Editorial Header */}
      <div className="mb-6 border-l-2 border-primary-container pl-4 py-1">
        <h1 className="font-headline text-4xl font-bold text-primary mb-1">Sinais</h1>
        <p className="text-on-surface-variant/70 text-[11px] max-w-[280px] font-medium leading-relaxed">
          Decifrando o agora: análise semanal de eventos globais sob a ótica de padrões proféticos, sem sensacionalismo ou hype.
        </p>
      </div>

      {/* Filter Pills */}
      <section className="mb-8">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
          <button 
            onClick={() => setExpandedCategory(null)}
            className={`flex-shrink-0 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border transition-all rounded-full ${!expandedCategory ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-high text-on-surface-variant border-outline-variant/20 hover:border-primary/50'}`}
          >
            Todos
          </button>
          {categories.map((cat, i) => (
            <button 
              key={i}
              onClick={() => setExpandedCategory(expandedCategory === cat ? null : cat)}
              className={`flex-shrink-0 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border transition-all rounded-full ${expandedCategory === cat ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-high text-on-surface-variant border-outline-variant/20 hover:border-primary/50'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Simplified Articles List */}
      <section className="space-y-6">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-[9px] font-black tracking-[0.3em] uppercase text-primary">
            {expandedCategory ? `Resultados: ${expandedCategory}` : 'Investigações Recentes'}
          </h2>
          <span className="text-[8px] font-bold text-on-surface-variant opacity-40 uppercase">Top 10 Arquivos</span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant opacity-50 animate-pulse">
            Descriptografando arquivos...
          </div>
        ) : filteredSigns.length > 0 ? (
          filteredSigns.map((item, i) => {
            const progress = typeof window !== 'undefined' ? localStorage.getItem(`progress_${item.slug}`) : null;
            
            return (
              <div 
                key={i} 
                onClick={() => setSelectedSlug(item.slug)}
                className="flex gap-4 group cursor-pointer active:scale-[0.98] transition-all bg-surface-container-high/30 p-3 rounded-2xl border border-outline-variant/5 hover:bg-surface-container-high/60 hover:border-primary/20"
              >
                {/* Small Square Image on Left */}
                <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 overflow-hidden rounded-xl border border-outline-variant/10 shadow-lg relative">
                  <img 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                    src={item.image || `https://picsum.photos/seed/${item.slug}/400/400`} 
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

                {/* Info on Right */}
                <div className="flex flex-col justify-center flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[7px] font-black text-primary uppercase tracking-[0.2em] bg-primary/10 px-1.5 py-0.5 rounded">
                      {item.category}
                    </span>
                    <span className="text-[7px] font-bold text-on-surface-variant/40 uppercase">
                      {item.date}
                    </span>
                  </div>
                  
                  <h3 className="font-headline text-sm sm:text-base font-extrabold leading-tight text-on-surface group-hover:text-primary transition-colors mb-1.5 line-clamp-2">
                    {item.title}
                  </h3>
                  
                  <p className="text-[10px] sm:text-xs text-on-surface-variant font-medium leading-relaxed line-clamp-2 opacity-70">
                    {item.description}
                  </p>

                  <div className="mt-2.5 flex items-center gap-3">
                    <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-on-surface-variant/60">
                      <TrendingUp size={10} className="text-primary" />
                      <span>{item.time}</span>
                    </div>
                    {progress && parseInt(progress) > 0 && (
                      <span className="text-[8px] font-black text-orange-400 uppercase tracking-widest">
                        {progress}% Lido
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-20 text-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-50 border border-dashed border-outline-variant/20 rounded-3xl">
            Nenhum arquivo encontrado nesta categoria.
          </div>
        )}
      </section>

      {error && (
        <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] uppercase font-bold text-center">
          Erro ao carregar sinais: {error}
        </div>
      )}
    </div>
  );
}
