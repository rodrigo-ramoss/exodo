import { ArrowRight, Star } from 'lucide-react';
import { Screen } from '../types';
import { useFetch } from '../hooks/useFetch';
import { cn } from '../lib/utils';

interface StudyItem {
  title: string;
  slug: string;
  description: string;
  date: string;
  category: string;
  time: string;
  image?: string;
}

interface HomeProps {
  onNavigate: (screen: Screen, transition?: 'push' | 'none') => void;
}

export default function Home({ onNavigate }: HomeProps) {
  const { data: studies, loading: loadingStudies } = useFetch<StudyItem[]>('/content/estudos/index.json');
  const { data: signs, loading: loadingSigns } = useFetch<any[]>('/content/sinais/index.json');
  const { data: doctrines, loading: loadingDoctrines } = useFetch<any[]>('/content/doutrinas/index.json');

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative h-[480px] w-full overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://picsum.photos/seed/exodo-hero/1200/800?blur=1')" }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
        </div>
        <div className="relative h-full flex flex-col justify-center px-6 max-w-4xl">
          <div className="flex items-center gap-2 mb-3">
            <Star className="text-primary" size={14} fill="currentColor" />
            <span className="font-headline uppercase tracking-[0.2em] text-[9px] font-bold text-on-surface-variant">
              Investigação Especial
            </span>
          </div>
          <h2 className="font-headline text-3xl font-extrabold text-on-surface leading-tight mb-4 tracking-tighter">
            Profecia no tempo do algoritmo
          </h2>
          <p className="text-on-surface-variant text-xs max-w-[240px] mb-8 leading-relaxed">
            Tecnologia e o sistema religioso se fundem na sombra da era digital. Descubra as verdades ocultas.
          </p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => onNavigate(Screen.STUDIES, 'push')}
              className="bg-primary-container text-on-primary-container px-6 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-primary transition-all active:scale-95 shadow-lg shadow-primary/10"
            >
              Explorar Estudos
            </button>
            <button 
              onClick={() => onNavigate(Screen.BOOKSTORE, 'push')}
              className="border border-outline-variant/40 bg-surface-container-lowest/50 backdrop-blur px-6 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:border-primary transition-all active:scale-95"
            >
              Arquivo Secreto <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* O PROTOCOLO Section */}
      <section className="py-8 px-6">
        <div 
          onClick={() => onNavigate(Screen.PROTOCOL, 'push')}
          className="relative w-full h-[200px] rounded-3xl overflow-hidden group cursor-pointer active:scale-[0.98] transition-transform border border-primary/20"
        >
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800')" }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-r from-coal via-coal/80 to-transparent"></div>
          <div className="relative h-full flex flex-col justify-center p-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-primary p-1 rounded-lg">
                <Shield size={16} className="text-on-primary" />
              </div>
              <h3 className="font-headline font-bold text-2xl tracking-tighter text-on-surface">O PROTOCOLO</h3>
            </div>
            <p className="text-on-surface-variant text-xs max-w-[200px] mb-4 leading-relaxed font-bold italic">
              Treinamento intensivo de desprogramação mental e despertamento espiritual.
            </p>
            <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest">
              Iniciar Treinamento <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </section>

      {/* Estudos em Destaque */}
      <section className="py-8 px-6">
        <div className="flex items-end justify-between mb-6">
          <h3 className="font-headline text-lg font-bold tracking-tight text-primary uppercase text-[10px] tracking-[0.15em]">Estudos em Destaque</h3>
          <button 
            onClick={() => onNavigate(Screen.STUDIES)}
            className="text-on-surface-variant text-[9px] uppercase tracking-widest hover:text-primary transition-colors font-bold"
          >
            Ver todos
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto hide-scrollbar snap-x pb-2">
          {loadingStudies ? (
            <div className="py-10 text-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-50">Carregando...</div>
          ) : studies?.slice(0, 3).map((study, i) => (
            <div 
              key={i}
              onClick={() => onNavigate(Screen.STUDIES, 'push')}
              className="min-w-[240px] bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/10 hover:border-primary/50 transition-all snap-start cursor-pointer group active:scale-[0.98]"
            >
              <div 
                className="h-28 bg-cover bg-center relative"
                style={{ backgroundImage: `url('${study.image || `https://picsum.photos/seed/${study.slug}/600/400`}')` }}
              >
                <div className="absolute top-3 left-3 bg-primary-container/90 backdrop-blur-sm text-[8px] font-black px-2 py-1 rounded-md text-on-primary-container uppercase tracking-wider">
                  {study.category}
                </div>
              </div>
              <div className="p-4 bg-surface-container-high flex flex-col justify-between h-20">
                <h4 className="font-headline font-bold text-xs line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                  {study.title}
                </h4>
                <div className="flex justify-between items-center text-[8px] text-on-surface-variant font-bold uppercase tracking-widest">
                  <span>{study.time} LEITURA</span>
                  <Star className="text-primary" size={10} fill="currentColor" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Seções por Categoria */}
      <section className="py-8 px-6 bg-surface-container-lowest/30">
        <h3 className="font-headline text-lg font-bold mb-6 flex items-center gap-2 uppercase text-[10px] tracking-[0.15em]">
          <Star className="text-primary" size={12} fill="currentColor" /> Biblioteca por Temas
        </h3>
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
          {loadingStudies ? (
            <div className="py-10 text-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-50">Carregando...</div>
          ) : Array.from(new Set(studies?.map(s => s.category) || [])).map((cat, i) => (
            <div 
              key={i}
              onClick={() => onNavigate(Screen.STUDIES, 'push')}
              className="min-w-[140px] h-[120px] bg-surface-container-low rounded-2xl border border-outline-variant/10 transition-all cursor-pointer group flex flex-col items-center justify-center p-4 text-center active:scale-95 hover:border-primary/40"
            >
              <div className="text-xl mb-2 text-on-surface-variant group-hover:text-primary transition-colors">
                <Star size={20} />
              </div>
              <h4 className="font-headline font-bold text-[10px] uppercase tracking-wider">{cat}</h4>
              <p className="text-[8px] text-on-surface-variant leading-tight mt-1">
                {studies?.filter(s => s.category === cat).length} estudos
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Doutrinas Expostas */}
      <section className="py-8 px-6">
        <h3 className="font-headline text-lg font-bold mb-6 uppercase text-[10px] tracking-[0.15em]">Doutrinas Expostas</h3>
        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
          {loadingDoctrines ? (
            <div className="py-4 text-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-50">Carregando...</div>
          ) : doctrines?.slice(0, 4).map((doutrina, i) => (
            <div 
              key={i}
              onClick={() => onNavigate(Screen.DOCTRINES, 'push')}
              className="min-w-[120px] h-[80px] bg-surface-container-high rounded-2xl flex flex-col items-center justify-center gap-1 hover:bg-surface-bright transition-all cursor-pointer border border-outline-variant/5 active:scale-95"
            >
              {doutrina.image ? (
                <div className="w-6 h-6 rounded-md overflow-hidden mb-1">
                  <img src={doutrina.image} alt={doutrina.title} className="w-full h-full object-cover" />
                </div>
              ) : (
                <Star className="text-primary" size={20} />
              )}
              <span className="font-headline text-[9px] font-bold uppercase tracking-widest px-2 text-center line-clamp-1">{doutrina.title}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Arquivo Secreto (Livraria) */}
      <section className="py-8 px-6">
        <div 
          onClick={() => onNavigate(Screen.BOOKSTORE, 'push')}
          className="relative w-full h-[260px] rounded-3xl overflow-hidden group cursor-pointer active:scale-[0.98] transition-transform"
        >
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('https://picsum.photos/seed/bookstore/800/600')" }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent"></div>
          <div className="relative h-full flex flex-col justify-center p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-primary text-on-primary text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider">PREMIUM</span>
              <h3 className="font-headline font-bold text-xl tracking-tighter">Arquivo Secreto</h3>
            </div>
            <p className="text-on-surface-variant text-[10px] max-w-[160px] mb-6 leading-relaxed">
              Acesse a livraria exclusiva com manuscritos decodificados.
            </p>
            <button className="bg-primary-container text-on-primary-container w-fit px-5 py-2 rounded-xl font-bold text-[10px] hover:bg-primary transition-all uppercase tracking-widest">
              Explorar
            </button>
          </div>
        </div>
      </section>

      {/* Sinais Section */}
      <section className="py-8 px-6 bg-surface-container-lowest">
        <div className="flex items-center gap-3 mb-6">
          <h3 className="font-headline text-lg font-black text-primary tracking-tighter uppercase">SINAIS</h3>
          <div className="h-px flex-grow bg-outline-variant/20"></div>
        </div>
        <div className="flex flex-col gap-6">
          {loadingSigns ? (
            <div className="py-10 text-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-50">Carregando...</div>
          ) : signs && signs.length > 0 ? (
            <>
              <div 
                onClick={() => onNavigate(Screen.SIGNS, 'push')}
                className="group cursor-pointer active:scale-[0.98] transition-transform"
              >
                <div className="aspect-video w-full rounded-2xl overflow-hidden mb-3">
                  <img src={signs[0].image || "https://picsum.photos/seed/signs-main/800/450"} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <div className="flex gap-3 mb-2">
                  <span className="text-primary font-black text-[8px] uppercase tracking-[0.2em]">{signs[0].category}</span>
                  <span className="text-on-surface-variant text-[8px] font-bold uppercase tracking-widest">{signs[0].date}</span>
                </div>
                <h4 className="font-headline text-lg font-extrabold mb-2 group-hover:text-primary transition-colors leading-tight">
                  {signs[0].title}
                </h4>
                <p className="text-on-surface-variant text-[10px] leading-relaxed mb-3 line-clamp-2">
                  {signs[0].description}
                </p>
                <button className="text-primary font-bold text-[9px] uppercase tracking-widest flex items-center gap-2">
                  Ler Investigação <ArrowRight size={10} />
                </button>
              </div>
              
              <div className="flex flex-col gap-4">
                {signs.slice(1, 3).map((item, i) => (
                  <div 
                    key={i} 
                    onClick={() => onNavigate(Screen.SIGNS, 'push')}
                    className="flex gap-3 group cursor-pointer active:scale-95 transition-transform"
                  >
                    <div className="w-16 h-16 bg-surface-container-high flex-shrink-0 rounded-xl overflow-hidden">
                      <img src={item.image || `https://picsum.photos/seed/side-${i}/200/200`} className="h-full w-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                    </div>
                    <div className="flex flex-col justify-center">
                      <h5 className="font-headline font-bold text-xs mb-1 group-hover:text-primary transition-colors leading-snug line-clamp-2">{item.title}</h5>
                      <span className="text-[8px] text-on-surface-variant uppercase tracking-[0.2em] font-bold">{item.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </section>

      {/* EBD Section */}
      <section className="py-8 px-6">
        <div 
          onClick={() => onNavigate(Screen.EBD, 'push')}
          className="bg-surface-container-low rounded-3xl p-6 border border-outline-variant/10 text-center cursor-pointer active:scale-[0.98] transition-transform"
        >
          <div className="w-16 h-16 bg-primary-container/10 flex items-center justify-center rounded-full border border-primary/20 mx-auto mb-4">
            <Star className="text-primary" size={24} fill="currentColor" />
          </div>
          <h3 className="font-headline text-lg font-extrabold mb-2 tracking-tight">Escola Bíblica de Dados</h3>
          <p className="text-on-surface-variant text-[10px] mb-5 leading-relaxed">
            Um sistema educacional projetado para a nova geração de investigadores sagrados.
          </p>
          <button className="bg-primary-container text-on-primary-container w-full py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-primary transition-all">
            Saiba Mais
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0E0E0E] py-10 px-6 mt-8 border-t border-[#50453B]/10">
        <div className="flex flex-col items-center justify-center gap-6">
          <div className="text-primary text-xl font-headline opacity-20 font-black uppercase tracking-tighter">ÊXODO</div>
          <nav className="flex flex-wrap justify-center gap-5">
            <button className="font-sans text-[8px] text-on-surface-variant uppercase tracking-[0.2em] font-bold">Termos</button>
            <button className="font-sans text-[8px] text-on-surface-variant uppercase tracking-[0.2em] font-bold">Privacidade</button>
            <button className="font-sans text-[8px] text-on-surface-variant uppercase tracking-[0.2em] font-bold">Apoie</button>
          </nav>
          <p className="font-sans text-[7px] text-on-surface-variant uppercase tracking-[0.2em] text-center opacity-40 font-bold">
            © ÊXODO. O ARQUIVO SAGRADO.
          </p>
        </div>
      </footer>
    </div>
  );
}
