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
      <div className="pb-24 min-h-screen bg-surface-container-lowest px-5 pt-6">
        <button 
          onClick={() => setSelectedSlug(null)}
          className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-8 active:scale-95 transition-transform"
        >
          <ArrowLeft size={16} />
          Voltar para estudos
        </button>
        <MarkdownViewer content={markdownContent} />
      </div>
    );
  }

  return (
    <div className="pb-24 min-h-screen bg-surface-container-lowest">
      {/* Investigative Search */}
      <section className="px-5 mt-4">
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

      {/* Filter Pills */}
      <section className="mt-4 px-5">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
          {['Exegese', 'Contexto', 'Crítica Textual', 'Teologia'].map((pill, i) => (
            <button 
              key={i}
              className={`flex-shrink-0 px-4 py-1.5 bg-surface-container-highest text-[10px] font-bold uppercase tracking-widest border-[0.5px] transition-colors rounded-full ${i === 0 ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:border-outline-variant'}`}
            >
              {pill}
            </button>
          ))}
        </div>
      </section>

      {/* Featured Carousel */}
      <section className="mt-6">
        <div className="px-5 flex justify-between items-baseline mb-3">
          <h2 className="font-headline font-bold text-[10px] tracking-[0.2em] uppercase text-on-surface opacity-60">
            Estudos em Destaque
          </h2>
          <div className="flex gap-1">
            <span className="w-1 h-1 bg-primary rounded-full"></span>
            <span className="w-1 h-1 bg-surface-container-highest rounded-full"></span>
            <span className="w-1 h-1 bg-surface-container-highest rounded-full"></span>
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto px-5 hide-scrollbar snap-x snap-mandatory">
          {loading ? (
            <div className="w-full py-10 text-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-50">Carregando...</div>
          ) : studies?.map((item, i) => (
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
        </div>
      </section>

      {/* Library Navigation */}
      <section className="mt-8">
        <div className="flex border-b border-outline-variant/15 px-5">
          <button className="flex-1 py-3 text-[9px] font-black tracking-[0.2em] uppercase text-primary border-b-2 border-primary">Antigo</button>
          <button className="flex-1 py-3 text-[9px] font-black tracking-[0.2em] uppercase text-on-surface-variant opacity-60">Novo</button>
          <button className="flex-1 py-3 text-[9px] font-black tracking-[0.2em] uppercase text-on-surface-variant opacity-60">Apócrifos</button>
        </div>
        <div className="space-y-3 px-5 mt-5">
          <div className="group border-b border-outline-variant/10 pb-3">
            <div className="flex justify-between items-center py-2 cursor-pointer active:opacity-70">
              <h4 className="font-headline font-bold text-sm text-on-surface">Pentateuco</h4>
              <ChevronUp className="text-primary" size={18} />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              {['Gênesis', 'Êxodo', 'Levítico', 'Números'].map((book, i) => (
                <div key={i} className="bg-surface-container-high p-3 rounded-xl border-[0.5px] border-outline-variant/20 hover:bg-surface-bright transition-colors cursor-pointer active:scale-95">
                  <h5 className="font-bold text-on-surface text-xs">{book}</h5>
                  <p className="text-[8px] text-on-surface-variant mt-1 uppercase font-black tracking-widest">0 estudos</p>
                </div>
              ))}
            </div>
          </div>
          {['Livros Históricos', 'Profetas'].map((cat, i) => (
            <div key={i} className="group border-b border-outline-variant/10 pb-3">
              <div className="flex justify-between items-center py-2 cursor-pointer active:opacity-70">
                <h4 className="font-headline font-bold text-sm text-on-surface opacity-60">{cat}</h4>
                <ChevronDown className="text-on-surface-variant" size={18} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent List */}
      <section className="mt-6 px-5">
        <h3 className="text-[9px] font-black tracking-[0.2em] uppercase text-primary mb-5">Estudos Recentes</h3>
        <div className="space-y-5">
          {loading ? (
            <div className="py-10 text-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-50">Carregando...</div>
          ) : studies?.map((item, i) => (
            <div 
              key={i} 
              onClick={() => setSelectedSlug(item.slug)}
              className="flex gap-3 items-start pb-5 border-b border-outline-variant/10 active:opacity-80 cursor-pointer"
            >
              <div className="w-16 h-16 bg-surface-container-highest flex-shrink-0 overflow-hidden rounded-xl">
                <img src={item.image || `https://picsum.photos/seed/${item.slug}-thumb/200/200`} className="w-full h-full object-cover opacity-60" />
              </div>
              <div className="flex-1">
                <span className="bg-primary/10 text-primary text-[7px] font-black px-1.5 py-0.5 rounded tracking-tighter uppercase mb-1 inline-block">{item.category}</span>
                <h4 className="font-headline font-bold text-xs text-on-surface leading-tight">{item.title}</h4>
                <p className="text-[10px] text-on-surface-variant mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Clock size={10} className="text-on-surface-variant" />
                  <span className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider">{item.time}</span>
                </div>
              </div>
            </div>
          ))}
          {error && <div className="text-red-500 text-[10px] uppercase font-bold text-center py-4">{error}</div>}
        </div>
      </section>
    </div>
  );
}
