import { useState, useEffect } from 'react';
import { Star, BookOpen, GraduationCap, Gavel } from 'lucide-react';
import { Screen } from '../types';
import { useFetch } from '../hooks/useFetch';
import { MarkdownViewer } from './MarkdownViewer';
import { AppImage } from './AppImage';

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
  const heroImage = '/image/selah/o mapa ants da tempestade.webp';
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
        category="ebd"
        onClose={() => setSelectedSlug(null)}
      />
    );
  }

  return (
    <div className="pb-24 sm:pb-32">
      {/* Hero Section */}
      <section className="relative min-h-[420px] sm:min-h-[520px] py-8 sm:py-0 flex flex-col justify-center items-start px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <AppImage
            className="w-full h-full object-cover opacity-20 blur-sm"
            src={heroImage}
            alt="Fundo EBD"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent"></div>
        </div>
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block px-2 py-0.5 bg-primary-container text-on-primary-container font-headline font-black text-[7px] sm:text-[8px] tracking-[0.2em] mb-3 sm:mb-4 rounded-sm">
            DISPONÍVEL AGORA
          </span>
          <h1 className="font-headline font-extrabold text-3xl sm:text-4xl mb-3 sm:mb-4 tracking-tighter leading-none text-on-surface">
            EBD em Casa — <span className="text-primary">Sem Dogmas</span>
          </h1>
          <p className="font-sans text-xs sm:text-sm text-on-surface-variant mb-6 sm:mb-8 leading-relaxed max-w-xs">
            Escola dominical sem tradições inventadas. Só o texto, contexto e liberdade de pensar. Redescubra o sagrado.
          </p>
          <div className="flex flex-col gap-2.5 sm:gap-3 w-full max-w-xs">
            <input 
              className="bg-surface-container-high border-0 border-b border-outline-variant focus:border-primary focus:ring-0 text-on-surface placeholder:text-outline w-full px-3.5 sm:px-4 py-2.5 sm:py-3 text-sm transition-colors duration-300 outline-none" 
              placeholder="Seu melhor e-mail" 
              type="email" 
            />
            <button 
              onClick={() => alert('Inscrito!')}
              className="bg-primary-container text-on-primary-container px-5 sm:px-6 py-2.5 sm:py-3 font-headline font-bold text-[9px] sm:text-[10px] tracking-widest uppercase hover:bg-primary transition-all active:scale-95 whitespace-nowrap"
            >
              Quero ser avisado
            </button>
          </div>
        </div>
      </section>

      {/* Content Preview */}
      <section className="px-4 sm:px-6 py-7 sm:py-10 space-y-3 sm:space-y-4">
        <h3 className="text-[9px] font-black tracking-[0.2em] uppercase text-primary mb-4 sm:mb-5">Lições Disponíveis</h3>
        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          {loading ? (
            <div className="py-10 text-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-50">Carregando...</div>
          ) : lessons?.map((item, i) => (
            <div 
              key={i} 
              onClick={() => setSelectedSlug(item.slug)}
              className="bg-surface-container-low p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-outline-variant/10 hover:bg-surface-container-high transition-all group active:scale-[0.98] cursor-pointer"
            >
              <div className="mb-3 sm:mb-4">
                <BookOpen className="text-primary h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <h3 className="font-headline font-bold text-sm sm:text-base mb-1.5 sm:mb-2 text-on-surface tracking-tight group-hover:text-primary transition-colors">{item.title}</h3>
              <p className="text-on-surface-variant text-[11px] sm:text-xs leading-relaxed">{item.description}</p>
              <div className="mt-3 sm:mt-4 flex items-center gap-2.5 sm:gap-3 text-[7px] sm:text-[8px] font-black tracking-widest uppercase text-on-surface-variant/60">
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
      <section className="px-4 sm:px-6 py-8 sm:py-10 bg-surface-container-lowest border-y border-outline-variant/5">
        <div className="max-w-xl mx-auto text-center">
          <p className="font-sans text-on-surface-variant mb-5 sm:mb-6 italic text-[11px] sm:text-xs">"Enquanto isso, explore as bases do conhecimento."</p>
          <div className="flex flex-col gap-2.5 sm:gap-3">
            <button 
              onClick={() => onNavigate(Screen.MANA, 'push')}
              className="group flex items-center justify-center gap-2 border border-outline-variant/30 px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl text-on-surface hover:bg-surface-container-high transition-all active:scale-95"
            >
              <GraduationCap className="text-primary" size={18} />
              <span className="font-headline font-bold text-[9px] sm:text-[10px] tracking-widest uppercase">MANÁ</span>
            </button>
            <button 
              onClick={() => onNavigate(Screen.REFUTACAO, 'push')}
              className="group flex items-center justify-center gap-2 border border-outline-variant/30 px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl text-on-surface hover:bg-surface-container-high transition-all active:scale-95"
            >
              <Gavel className="text-primary" size={18} />
              <span className="font-headline font-bold text-[9px] sm:text-[10px] tracking-widest uppercase">BABEL</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
