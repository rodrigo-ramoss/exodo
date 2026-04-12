import { useState, useEffect } from 'react';
import { Diamond, Download, Layers, Shield, ChevronDown, ArrowLeft } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { MarkdownViewer } from './MarkdownViewer';

interface BookItem {
  title: string;
  slug: string;
  description: string;
  date: string;
  category: string;
  time: string;
}

export default function Bookstore() {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [markdownContent, setMarkdownContent] = useState<string | null>(null);
  const { data: books, loading, error } = useFetch<BookItem[]>('/content/livraria/index.json');

  useEffect(() => {
    if (selectedSlug) {
      const fetchMarkdown = async () => {
        try {
          const response = await fetch(`/content/livraria/${selectedSlug}.md`);
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
          Voltar para livraria
        </button>
        <MarkdownViewer content={markdownContent} />
      </div>
    );
  }

  return (
    <div className="pt-6 pb-32 px-5 max-w-7xl mx-auto">
      {/* Hero Header */}
      <header className="mb-10 relative">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-[100px]"></div>
        <div className="relative z-10">
          <h2 className="font-headline font-extrabold text-3xl text-primary tracking-tighter mb-1 text-shadow-glow">
            Arquivo Secreto
          </h2>
          <p className="text-on-surface-variant font-bold text-sm max-w-[240px] leading-relaxed">
            Conteúdo restrito. Investigações profundas sobre as verdades ocultas do sistema.
          </p>
        </div>
      </header>

      {/* Section: TRILOGIAS */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Diamond className="text-primary" size={18} fill="currentColor" />
            <h3 className="font-headline font-black text-xs tracking-[0.2em] uppercase">TRILOGIAS</h3>
          </div>
          <div className="h-[1px] flex-grow ml-4 bg-outline-variant/20"></div>
        </div>
        <div className="grid grid-cols-1 gap-6">
          {loading ? (
            <div className="py-10 text-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-50">Carregando...</div>
          ) : books?.map((item, i) => (
            <div key={i} className="group relative bg-gradient-to-b from-surface-container-high to-surface-container-lowest border border-outline-variant/15 hover:border-primary/40 transition-all rounded-2xl overflow-hidden flex flex-col h-full active:scale-[0.98]">
              <div className="relative w-full h-[220px] overflow-hidden">
                <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" src={`https://picsum.photos/seed/${item.slug}/400/600`} />
                <div className="absolute top-3 right-3 bg-primary-container text-on-primary-container text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest">Premium</div>
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent"></div>
              </div>
              <div className="p-5 flex-grow flex flex-col">
                <h4 className="font-headline font-bold text-base text-on-surface leading-tight mb-2 uppercase tracking-tight">{item.title}</h4>
                <p className="text-on-surface-variant text-[11px] mb-5 line-clamp-2 leading-relaxed">{item.description}</p>
                <button 
                  onClick={() => setSelectedSlug(item.slug)}
                  className="mt-auto w-full py-2.5 border border-outline-variant/30 rounded-xl text-primary text-[10px] font-black tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors active:scale-95"
                >
                  Ver completa <ChevronDown size={12} />
                </button>
              </div>
            </div>
          ))}
          {error && <div className="text-red-500 text-[10px] uppercase font-bold text-center py-4">{error}</div>}
        </div>
      </section>

      {/* Section: SÉRIES */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Layers className="text-primary" size={18} />
            <h3 className="font-headline font-black text-xs tracking-[0.2em] uppercase">SÉRIES</h3>
          </div>
          <div className="h-[1px] flex-grow ml-4 bg-outline-variant/20"></div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {[
            { title: 'A Invenção do Pecado', desc: 'Uma profunda desconstrução teológica das influências modernas.', img: 'https://picsum.photos/seed/sin/600/400' },
            { title: 'O Cânon Oculto', desc: 'A formação política da Bíblia e a verdade por trás dos evangelhos.', img: 'https://picsum.photos/seed/canon/600/400' },
          ].map((serie, i) => (
            <div key={i} className="group flex bg-surface-container-low border border-outline-variant/10 hover:bg-surface-container-high transition-colors rounded-2xl overflow-hidden active:scale-[0.98]">
              <div className="w-1/3 aspect-[3/4] relative overflow-hidden">
                <img className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" src={serie.img} />
                <div className="absolute top-2 left-2 bg-surface-container-lowest/80 backdrop-blur-md px-1.5 py-0.5 text-[7px] text-primary font-black uppercase tracking-widest rounded-sm">Série</div>
              </div>
              <div className="p-4 w-2/3 flex flex-col justify-center">
                <h4 className="font-headline font-bold text-sm text-on-surface mb-1.5 uppercase tracking-tight leading-tight">{serie.title}</h4>
                <p className="text-on-surface-variant mb-3 text-[10px] leading-relaxed line-clamp-2">{serie.desc}</p>
                <button 
                  onClick={() => alert('Desbloqueando série...')}
                  className="text-[9px] font-black text-primary tracking-widest uppercase border-b border-primary/30 w-fit pb-0.5 active:opacity-50"
                >
                  Desbloquear
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="bg-primary-container/10 border border-primary/20 rounded-3xl p-8 text-center relative overflow-hidden group">
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-primary/10 rounded-full blur-[60px] group-hover:scale-150 transition-transform duration-1000"></div>
        <div className="relative z-10">
          <Shield className="text-primary mx-auto mb-4" size={32} fill="currentColor" />
          <h3 className="font-headline font-extrabold text-xl text-on-surface mb-3 tracking-tighter">Acesso Restrito</h3>
          <p className="text-on-surface-variant text-[11px] max-w-xs mx-auto mb-6 font-bold leading-relaxed">
            O conhecimento que liberta não está na superfície. Baixe o app para acessar todo o conteúdo exclusivo.
          </p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => alert('Baixando app...')}
              className="bg-primary text-on-primary font-black py-3 px-6 rounded-xl text-[10px] tracking-widest uppercase flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Download size={16} /> Baixar Aplicativo
            </button>
            <button 
              onClick={() => alert('Mais informações')}
              className="text-on-surface border border-outline-variant/40 hover:border-primary/40 font-black py-3 px-6 rounded-xl text-[10px] tracking-widest uppercase transition-all active:scale-95"
            >
              Saiba Mais
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
