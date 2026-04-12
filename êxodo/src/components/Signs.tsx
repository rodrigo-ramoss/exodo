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
}

export default function Signs() {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [markdownContent, setMarkdownContent] = useState<string | null>(null);
  const { data: signs, loading, error } = useFetch<SignItem[]>('/content/sinais/index.json');

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
      <div className="pb-32 px-5 pt-6 max-w-7xl mx-auto min-h-screen bg-surface-container-lowest">
        <button 
          onClick={() => setSelectedSlug(null)}
          className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-8 active:scale-95 transition-transform"
        >
          <ArrowLeft size={16} />
          Voltar para sinais
        </button>
        <MarkdownViewer content={markdownContent} />
      </div>
    );
  }

  return (
    <div className="pt-6 pb-32 px-5 max-w-7xl mx-auto">
      {/* Editorial Header */}
      <div className="mb-8 border-l-2 border-primary-container pl-4 py-1">
        <h1 className="font-headline text-4xl font-bold text-primary mb-1">Sinais</h1>
        <p className="text-on-surface-variant max-w-xs font-bold tracking-tight text-xs italic opacity-90">
          Profecia no tempo do algoritmo — análises que o mainstream não faz.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <section className="flex flex-col gap-3 mb-10">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant" size={18} />
          <input 
            className="w-full bg-surface-container-low border-b border-outline-variant focus:border-primary px-11 py-3.5 outline-none transition-all placeholder:text-neutral-600 text-on-surface text-sm" 
            placeholder="Buscar em Sinais..." 
            type="text" 
          />
        </div>
        <button 
          className="w-full flex items-center justify-between bg-surface-container-low border-b border-outline-variant px-5 py-3.5 text-on-surface-variant text-xs font-bold active:scale-[0.98]"
        >
          <span className="flex items-center gap-2">
            <Filter className="text-primary" size={14} />
            Categorias
          </span>
          <ChevronDown size={14} />
        </button>
      </section>

      {/* Featured Article */}
      {loading ? (
        <div className="py-10 text-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-50">Carregando...</div>
      ) : signs && signs.length > 0 && (
        <article 
          onClick={() => setSelectedSlug(signs[0].slug)}
          className="mb-12 group relative overflow-hidden bg-surface-container-lowest rounded-2xl active:scale-[0.98] transition-transform cursor-pointer"
        >
          <div className="flex flex-col">
            <div className="aspect-video relative overflow-hidden">
              <img 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                src={`https://picsum.photos/seed/${signs[0].slug}/800/600`} 
              />
            </div>
            <div className="p-6 flex flex-col justify-center bg-surface-container-low/40 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-primary text-[8px] font-black uppercase tracking-widest mb-3">
                <Star className="text-primary" size={10} fill="currentColor" />
                {signs[0].category}
              </div>
              <h2 className="font-headline text-xl text-on-surface font-extrabold leading-tight mb-3">
                {signs[0].title}
              </h2>
              <p className="text-on-surface-variant text-[11px] mb-5 leading-relaxed line-clamp-2">
                {signs[0].description}
              </p>
              <div className="flex items-center gap-3 text-on-surface-variant text-[9px] mb-5 font-black uppercase tracking-widest">
                <span>{signs[0].date}</span>
                <span className="text-primary">•</span>
                <span>{signs[0].time}</span>
              </div>
              <button className="inline-flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest">
                Ler artigo completo 
                <TrendingUp size={14} />
              </button>
            </div>
          </div>
        </article>
      )}

      {/* Category Grade */}
      <section className="grid grid-cols-1 gap-2 mb-12">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-outline">Investigações por Eixo</h3>
          <div className="h-px bg-outline-variant flex-grow ml-4 opacity-20"></div>
        </div>
        
        {/* Accordion Item 1: Active */}
        <div className="border-b border-outline-variant/10">
          <button className="w-full py-4 flex items-center justify-between text-left group active:opacity-70">
            <div className="flex items-center gap-4">
              <span className="text-primary font-headline text-base opacity-40">01</span>
              <h4 className="font-headline text-lg font-bold group-hover:text-primary transition-colors">Escatologia Digital</h4>
            </div>
            <Minus className="text-primary" size={18} />
          </button>
          <div className="pb-6 space-y-4">
            {loading ? (
              <div className="py-4 text-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-50">Carregando...</div>
            ) : signs?.map((item, i) => (
              <div 
                key={i} 
                onClick={() => setSelectedSlug(item.slug)}
                className="flex gap-3 group cursor-pointer active:scale-[0.98] transition-transform"
              >
                <div className="w-16 h-16 flex-shrink-0 overflow-hidden bg-surface-container-high rounded-xl">
                  <img className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" src={`https://picsum.photos/seed/${item.slug}-thumb/200/200`} />
                </div>
                <div className="flex flex-col justify-center">
                  <h5 className="font-headline text-sm font-bold leading-tight mb-1.5 group-hover:text-primary transition-colors">{item.title}</h5>
                  <div className="flex items-center gap-2 text-[8px] text-on-surface-variant uppercase tracking-widest font-black">
                    <span>{item.date}</span>
                    <span>•</span>
                    <span>{item.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {['IA e Controle Social', 'Hollywood Profetizou', 'Reset Mundial'].map((cat, i) => (
          <div key={i} className="border-b border-outline-variant/10">
            <button className="w-full py-4 flex items-center justify-between text-left group active:opacity-70">
              <div className="flex items-center gap-4">
                <span className="text-on-surface-variant font-headline text-base opacity-40">0{i + 2}</span>
                <h4 className="font-headline text-lg font-bold group-hover:text-primary transition-colors">{cat}</h4>
              </div>
              <Plus className="text-on-surface-variant" size={18} />
            </button>
          </div>
        ))}
        
        <div className="py-4 text-center">
          <button className="px-6 py-2.5 bg-surface-container-high text-primary text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-surface-bright transition-colors border border-outline-variant/20 active:scale-95">
            Ver mais categorias
          </button>
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-surface-container-low p-8 rounded-3xl relative overflow-hidden border border-outline-variant/10">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <BookOpen className="text-primary" size={80} />
        </div>
        <div className="relative z-10">
          <h3 className="font-headline text-2xl font-extrabold mb-2 tracking-tighter">Mantenha-se Alerta.</h3>
          <p className="text-on-surface-variant text-[11px] mb-6 leading-relaxed font-bold">
            Receba sinais em tempo real diretamente em seu e-mail.
          </p>
          <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); alert('Inscrito!'); }}>
            <input 
              className="bg-surface-container-lowest border border-outline-variant/30 px-5 py-3.5 rounded-xl focus:border-primary outline-none text-on-surface text-sm" 
              placeholder="seu@email.com" 
              type="email" 
            />
            <button className="bg-primary-container text-on-primary-container font-black px-6 py-3.5 rounded-xl hover:brightness-110 transition-all uppercase text-[10px] tracking-widest active:scale-95">Inscrever</button>
          </form>
        </div>
      </section>
    </div>
  );
}
