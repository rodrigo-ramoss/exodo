import { useState, useEffect } from 'react';
import { Diamond, Star, History, Brain, ShieldAlert, Wallet, Flame, Link, Skull, Moon, Network, ChevronRight, ArrowLeft } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { MarkdownViewer } from './MarkdownViewer';

interface DoctrineLayer {
  title: string;
  slug: string;
}

interface DoctrineItem {
  title: string;
  description: string;
  category: string;
  image?: string;
  layers: DoctrineLayer[];
}

const iconMap: Record<string, any> = {
  'Arrebatamento Secreto': Star,
  'Arrependimento de Deus': History,
  'Demônios': Brain,
  'Satanás': ShieldAlert,
  'Dízimo': Wallet,
  'Inferno': Flame,
  'Maldição Hereditária': Link,
  'Segunda Morte': Skull,
  'Sono da Alma': Moon,
  'Trindade': Network,
};

export default function Doctrines() {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [expandedTheme, setExpandedTheme] = useState<string | null>(null);
  const [markdownContent, setMarkdownContent] = useState<string | null>(null);
  const { data: doctrines, loading, error } = useFetch<DoctrineItem[]>('/content/doutrinas/index.json');

  useEffect(() => {
    if (selectedSlug) {
      const fetchMarkdown = async () => {
        try {
          const response = await fetch(`/content/doutrinas/${selectedSlug}.md`);
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

  // Se um arquivo MD está selecionado, mostra o visualizador em tela cheia
  if (selectedSlug && markdownContent) {
    return (
      <MarkdownViewer 
        content={markdownContent} 
        slug={selectedSlug} 
        onClose={() => setSelectedSlug(null)} 
      />
    );
  }

  // Lista principal de Doutrinas com Accordions
  return (
    <div className="pt-8 pb-32 px-5 max-w-4xl mx-auto min-h-screen">
      {/* Hero Branding Section */}
      <div className="mb-8 border-l-2 border-primary-container pl-4 py-1">
        <h1 className="text-3xl font-headline font-extrabold tracking-tighter text-on-surface mb-1">
          Doutrinas <span className="text-primary">Expostas</span>
        </h1>
        <p className="text-on-surface-variant/70 text-[11px] max-w-[280px] font-medium leading-relaxed">
          Exposição de dogmas humanos sob a luz da exegese: confronte o que você sempre ouviu com o que o Texto Sagrado realmente diz.
        </p>
      </div>

      {/* Investigation Cards Grid (Expandable) */}
      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="py-10 text-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-50">Carregando...</div>
        ) : doctrines?.map((doctrine, i) => {
          const Icon = iconMap[doctrine.title] || Diamond;
          const isExpanded = expandedTheme === doctrine.title;

          return (
            <div 
              key={i}
              className={`group relative flex flex-col bg-surface-container-low border-l-4 transition-all rounded-r-2xl overflow-hidden ${isExpanded ? 'border-primary bg-surface-container-high shadow-xl' : 'border-transparent hover:border-primary/40 hover:bg-surface-container-high'}`}
            >
              {/* Card Header (Toggle) */}
              <div 
                onClick={() => setExpandedTheme(isExpanded ? null : doctrine.title)}
                className="flex items-center h-[80px] px-4 cursor-pointer active:opacity-70"
              >
                {doctrine.image ? (
                  <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 mr-4 border border-outline-variant/10">
                    <img src={doctrine.image} alt={doctrine.title} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-surface-container-lowest flex items-center justify-center flex-shrink-0 mr-4">
                    <Icon className="text-primary" size={20} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm font-bold font-headline transition-colors truncate ${isExpanded ? 'text-primary' : 'text-on-surface group-hover:text-primary'}`}>
                    {doctrine.title}
                  </h3>
                  <p className="text-on-surface-variant text-[10px] truncate font-medium">
                    {doctrine.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-black text-primary/40 uppercase tracking-widest">{doctrine.layers.length} camadas</span>
                  <ChevronRight className={`text-primary/40 transition-transform duration-300 ${isExpanded ? 'rotate-90 text-primary' : ''}`} size={16} />
                </div>
              </div>

              {/* Expanded Content (Layers List) */}
              {isExpanded && (
                <div className="px-4 pb-6 pt-2 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300 border-t border-outline-variant/5">
                  <div className="text-[8px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40 mb-3 px-2">Selecione uma camada para aprofundar:</div>
                  {doctrine.layers.map((layer, j) => {
                    const progress = typeof window !== 'undefined' ? localStorage.getItem(`progress_${layer.slug}`) : null;
                    
                    return (
                      <div 
                        key={j}
                        onClick={() => setSelectedSlug(layer.slug)}
                        className="flex flex-col gap-2 p-3 bg-surface-container-lowest/50 hover:bg-primary/5 border border-outline-variant/5 rounded-xl cursor-pointer active:scale-[0.99] transition-all group/layer"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-lg bg-surface-container-high flex items-center justify-center text-primary font-black text-[10px]">
                              {j}
                            </div>
                            <span className="text-xs font-bold text-on-surface-variant group-hover/layer:text-primary transition-colors line-clamp-1">{layer.title}</span>
                          </div>
                          <ChevronRight size={14} className="text-primary/20 group-hover/layer:text-primary transition-colors" />
                        </div>
                        
                        {/* Progress Bar for Layer */}
                        {progress && parseInt(progress) > 0 && (
                          <div className="flex items-center gap-2 pl-9">
                            <div className="h-1 flex-1 bg-surface-container-high rounded-full overflow-hidden border border-white/5">
                              <div 
                                className="h-full bg-gradient-to-r from-orange-500 to-yellow-400" 
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                            <span className="text-[6px] font-black text-orange-400 uppercase tracking-widest">{progress}% Lido</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {error && <div className="text-red-500 text-[10px] uppercase font-bold text-center py-4">{error}</div>}
      </div>
    </div>
  );
}
