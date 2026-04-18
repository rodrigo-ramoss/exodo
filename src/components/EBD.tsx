import { useState, useEffect } from 'react';
import { Star, BookOpen, GraduationCap, Gavel } from 'lucide-react';
import { Screen } from '../types';
import { useFetch } from '../hooks/useFetch';
import { MarkdownViewer } from './MarkdownViewer';

interface EBDItem {
  title: string;
  slug: string;
  description: string;
  date: string;
  category: string;
  time: string;
}

interface EBDProps {
  onNavigate: (screen: Screen, transition?: 'push' | 'none') => void;
}

export default function EBD({ onNavigate }: EBDProps) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [markdownContent, setMarkdownContent] = useState<string | null>(null);
  const { data: lessons, loading, error } = useFetch<EBDItem[]>('/content/ebd/index.json');

  useEffect(() => {
    if (selectedSlug) {
      const fetchMarkdown = async () => {
        try {
          const response = await fetch(`/content/ebd/${selectedSlug}.md`);
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
    <div className="pb-32">
      {/* Hero Section */}
      <section className="relative min-h-[520px] flex flex-col justify-center items-start px-6 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            className="w-full h-full object-cover opacity-20 blur-sm" 
            src="https://picsum.photos/seed/ebd-hero/800/600" 
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent"></div>
        </div>
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block px-2 py-0.5 bg-primary-container text-on-primary-container font-headline font-black text-[8px] tracking-[0.2em] mb-4 rounded-sm">
            DISPONÍVEL AGORA
          </span>
          <h1 className="font-headline font-extrabold text-4xl mb-4 tracking-tighter leading-none text-on-surface">
            EBD em Casa — <span className="text-primary">Sem Dogmas</span>
          </h1>
          <p className="font-sans text-sm text-on-surface-variant mb-8 leading-relaxed max-w-xs">
            Escola dominical sem tradições inventadas. Só o texto, contexto e liberdade de pensar. Redescubra o sagrado.
          </p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <input 
              className="bg-surface-container-high border-0 border-b border-outline-variant focus:border-primary focus:ring-0 text-on-surface placeholder:text-outline w-full px-4 py-3 text-sm transition-colors duration-300 outline-none" 
              placeholder="Seu melhor e-mail" 
              type="email" 
            />
            <button 
              onClick={() => alert('Inscrito!')}
              className="bg-primary-container text-on-primary-container px-6 py-3 font-headline font-bold text-[10px] tracking-widest uppercase hover:bg-primary transition-all active:scale-95 whitespace-nowrap"
            >
              Quero ser avisado
            </button>
          </div>
        </div>
      </section>

      {/* Content Preview */}
      <section className="px-6 py-10 space-y-4">
        <h3 className="text-[9px] font-black tracking-[0.2em] uppercase text-primary mb-5">Lições Disponíveis</h3>
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <div className="py-10 text-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-50">Carregando...</div>
          ) : lessons?.map((item, i) => (
            <div 
              key={i} 
              onClick={() => setSelectedSlug(item.slug)}
              className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 hover:bg-surface-container-high transition-all group active:scale-[0.98] cursor-pointer"
            >
              <div className="mb-4">
                <BookOpen className="text-primary" size={28} />
              </div>
              <h3 className="font-headline font-bold text-base mb-2 text-on-surface tracking-tight group-hover:text-primary transition-colors">{item.title}</h3>
              <p className="text-on-surface-variant text-xs leading-relaxed">{item.description}</p>
              <div className="mt-4 flex items-center gap-3 text-[8px] font-black tracking-widest uppercase text-on-surface-variant/60">
                <span>{item.date}</span>
                <span>•</span>
                <span>{item.time}</span>
              </div>
            </div>
          ))}
          {error && <div className="text-red-500 text-[10px] uppercase font-bold text-center py-4">{error}</div>}
        </div>
      </section>

      {/* Redirect CTA */}
      <section className="px-6 py-10 bg-surface-container-lowest border-y border-outline-variant/5">
        <div className="max-w-xl mx-auto text-center">
          <p className="font-sans text-on-surface-variant mb-6 italic text-xs">"Enquanto isso, explore as bases do conhecimento."</p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => onNavigate(Screen.MANA, 'push')}
              className="group flex items-center justify-center gap-2 border border-outline-variant/30 px-6 py-3.5 rounded-xl text-on-surface hover:bg-surface-container-high transition-all active:scale-95"
            >
              <GraduationCap className="text-primary" size={18} />
              <span className="font-headline font-bold text-[10px] tracking-widest uppercase">MANÁ</span>
            </button>
            <button 
              onClick={() => onNavigate(Screen.REFUTACAO, 'push')}
              className="group flex items-center justify-center gap-2 border border-outline-variant/30 px-6 py-3.5 rounded-xl text-on-surface hover:bg-surface-container-high transition-all active:scale-95"
            >
              <Gavel className="text-primary" size={18} />
              <span className="font-headline font-bold text-[10px] tracking-widest uppercase">Refutação</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
