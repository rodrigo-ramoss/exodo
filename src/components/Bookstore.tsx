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
  image?: string;
}

const categoryInfo: Record<string, { title: string; description: string }> = {
  'Trilogia — O Mapa da Tempestade': {
    title: 'O Mapa da Tempestade',
    description: 'Cartografia profética do colapso sistêmico e o manual para atravessar o interregno entre mundos.'
  },
  'Trilogia — A Marca': {
    title: 'A Marca',
    description: 'Uma investigação profunda sobre o sistema de controle tecnológico e espiritual que molda o fim dos tempos.'
  },
  'Trilogia — O Estrangeiro Próspero': {
    title: 'O Estrangeiro Próspero',
    description: 'O protocolo de Daniel e José para florescer e manter a integridade dentro de sistemas hostis.'
  },
  'Trilogia — A Ciência dos Tempos': {
    title: 'A Ciência dos Tempos',
    description: 'Estratégia e discernimento profético para navegar as crises globais com sabedoria calculada.'
  },
  'Série — A Invenção do Pecado': {
    title: 'A Invenção do Pecado',
    description: 'Desconstruindo as amarras teológicas e históricas que aprisionaram a fé em conceitos institucionais.'
  },
  'Trilogia — O Cânon Oculto': {
    title: 'O Cânon Oculto',
    description: 'A história proibida da formação bíblica e as verdades que foram deixadas fora do sistema dogmático.'
  },
  'Série — A Revelação de Enoque': {
    title: 'A Revelação de Enoque',
    description: 'Uma jornada pelas visões e revelações do profeta Enoque sobre o mundo espiritual e o destino da humanidade.'
  }
};

export default function Bookstore() {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [markdownContent, setMarkdownContent] = useState<string | null>(null);
  const { data: books, loading, error } = useFetch<BookItem[]>('/content/livraria/index.json');

  // Group books by category
  const categories = books ? Array.from(new Set(books.map(b => b.category))) : [];
  
  const groupedBooks = categories.reduce((acc, cat) => {
    acc[cat] = books?.filter(b => b.category === cat) || [];
    return acc;
  }, {} as Record<string, BookItem[]>);

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
      <MarkdownViewer 
        content={markdownContent} 
        slug={selectedSlug} 
        onClose={() => setSelectedSlug(null)} 
      />
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
          <p className="text-on-surface-variant/70 text-[11px] max-w-[280px] font-medium leading-relaxed">
            Conteúdo de alto impacto: trilogias sobre geopolítica, IA e desconstrução teológica. Investigações profundas protegidas pelo ambiente do app.
          </p>
        </div>
      </header>

      {/* Section: TRILOGIAS & SÉRIES */}
      <section className="mb-12">
        {loading ? (
          <div className="py-10 text-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-50">Carregando Estante...</div>
        ) : categories.map((cat, i) => (
          <div key={i} className="mb-16">
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <Diamond className="text-primary" size={16} fill="currentColor" />
                  <h3 className="font-headline font-black text-[10px] tracking-[0.2em] uppercase text-primary">
                    {cat.includes('Trilogia') ? 'Trilogia' : 'Série'}
                  </h3>
                </div>
                <h4 className="font-headline font-extrabold text-xl text-on-surface tracking-tighter uppercase leading-none mb-2">
                  {categoryInfo[cat]?.title || cat}
                </h4>
                <p className="text-on-surface-variant text-[11px] font-bold max-w-lg leading-relaxed opacity-70">
                  {categoryInfo[cat]?.description || 'Coleção de estudos profundos.'}
                </p>
              </div>
            </div>

            {/* Bookshelf Grid */}
            <div className="grid grid-cols-3 gap-4 mt-8 relative">
              {/* Shelf Base Decor */}
              <div className="absolute -bottom-4 left-0 right-0 h-1 bg-gradient-to-r from-primary/30 via-outline-variant/10 to-transparent opacity-20"></div>
              
              {groupedBooks[cat].map((item, j) => {
                const progress = typeof window !== 'undefined' ? localStorage.getItem(`progress_${item.slug}`) : null;
                
                return (
                  <div 
                    key={j} 
                    onClick={() => setSelectedSlug(item.slug)}
                    className="group flex flex-col cursor-pointer active:scale-95 transition-transform"
                  >
                    <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden shadow-2xl border border-outline-variant/10 bg-surface-container-high group-hover:border-primary/50 transition-colors">
                      <img 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" 
                        src={item.image || `https://picsum.photos/seed/${item.slug}/400/600`} 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
                      
                      {/* Progress Overlay */}
                      {progress && parseInt(progress) > 0 && (
                        <div className="absolute top-2 left-2 right-2 flex flex-col gap-1.5">
                          <div className="h-1.5 w-full bg-black/60 rounded-full overflow-hidden backdrop-blur-md border border-white/5">
                            <div 
                              className="h-full bg-gradient-to-r from-orange-500 to-yellow-400 shadow-[0_0_8px_rgba(249,115,22,0.4)]" 
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between items-center px-0.5">
                            <span className="text-[7px] font-black text-orange-400 uppercase tracking-widest drop-shadow-md">{progress}% Lido</span>
                            {parseInt(progress) === 100 && <Diamond size={8} className="text-orange-400 fill-orange-400 animate-pulse" />}
                          </div>
                        </div>
                      )}

                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="h-0.5 w-6 bg-primary opacity-0 group-hover:opacity-100 transition-opacity mb-1"></div>
                        <span className="text-[7px] text-white/40 uppercase font-black tracking-widest block">Vol. 0{j + 1}</span>
                      </div>
                    </div>
                    <div className="mt-3 px-1">
                      <h5 className="font-headline font-bold text-[10px] text-on-surface leading-tight uppercase line-clamp-2 group-hover:text-primary transition-colors">
                        {item.title}
                      </h5>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {error && <div className="text-red-500 text-[10px] uppercase font-bold text-center py-4">{error}</div>}
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
