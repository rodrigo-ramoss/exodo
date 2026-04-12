import { useState, useEffect } from 'react';
import { Diamond, Star, History, Brain, ShieldAlert, Wallet, Flame, Link, Skull, Moon, Network, ChevronRight, ArrowLeft } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { MarkdownViewer } from './MarkdownViewer';

interface DoctrineItem {
  title: string;
  slug: string;
  description: string;
  date: string;
  category: string;
  time: string;
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

  if (selectedSlug && markdownContent) {
    return (
      <div className="pb-32 px-5 pt-6 max-w-2xl mx-auto min-h-screen bg-surface-container-lowest">
        <button 
          onClick={() => setSelectedSlug(null)}
          className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-8 active:scale-95 transition-transform"
        >
          <ArrowLeft size={16} />
          Voltar para doutrinas
        </button>
        <MarkdownViewer content={markdownContent} />
      </div>
    );
  }

  return (
    <div className="pt-8 pb-32 px-5 max-w-4xl mx-auto min-h-screen">
      {/* Hero Branding Section */}
      <div className="mb-8 border-l border-primary/20 pl-4">
        <h1 className="text-3xl font-headline font-extrabold tracking-tighter text-on-surface mb-1">
          Doutrinas <span className="text-primary">Expostas</span>
        </h1>
        <p className="text-on-surface-variant text-sm font-bold">
          O que a Bíblia realmente diz.
        </p>
      </div>

      {/* Investigation Cards Grid */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="py-10 text-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-50">Carregando...</div>
        ) : doctrines?.map((doctrine, i) => {
          const Icon = iconMap[doctrine.title] || Diamond;
          return (
            <div 
              key={i}
              onClick={() => setSelectedSlug(doctrine.slug)}
              className="group relative flex items-center h-[80px] bg-surface-container-low hover:bg-surface-container-high border-l-4 border-transparent hover:border-primary transition-all rounded-r-2xl px-4 cursor-pointer active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-xl bg-surface-container-lowest flex items-center justify-center flex-shrink-0 mr-4">
                <Icon className="text-primary" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold font-headline text-on-surface group-hover:text-primary transition-colors truncate">
                  {doctrine.title}
                </h3>
                <p className="text-on-surface-variant text-[10px] truncate font-medium">
                  {doctrine.description}
                </p>
              </div>
              <ChevronRight className="text-primary/40 group-hover:text-primary transition-all" size={16} />
            </div>
          );
        })}
        {error && <div className="text-red-500 text-[10px] uppercase font-bold text-center py-4">{error}</div>}
      </div>
    </div>
  );
}
