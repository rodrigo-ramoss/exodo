import { Star, ChevronLeft, ChevronRight, Moon, Bookmark } from 'lucide-react';

export default function Bible() {
  return (
    <div className="pt-6 pb-32 px-4 max-w-4xl mx-auto min-h-screen relative">
      {/* Version Selector */}
      <section className="mb-8">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
          <button className="px-5 py-2 rounded-xl bg-primary-container text-on-primary-container font-bold text-[10px] uppercase tracking-widest transition-transform active:scale-95 whitespace-nowrap">
            Tradicional
          </button>
          <button className="px-5 py-2 rounded-xl bg-surface-container-high text-on-surface-variant font-bold text-[10px] uppercase tracking-widest border border-outline-variant/15 hover:bg-surface-bright transition-colors whitespace-nowrap">
            Católica
          </button>
          <button className="px-5 py-2 rounded-xl bg-surface-container-high text-on-surface-variant font-bold text-[10px] uppercase tracking-widest border border-outline-variant/15 hover:bg-surface-bright transition-colors whitespace-nowrap">
            ETÍOPE
          </button>
        </div>
      </section>

      {/* Book Navigation */}
      <section className="mb-10">
        <div className="flex gap-6 mb-4 border-b border-outline-variant/10 overflow-x-auto hide-scrollbar">
          <button className="pb-2 text-primary border-b-2 border-primary font-headline text-[10px] uppercase tracking-widest font-bold whitespace-nowrap">
            Antigo Testamento
          </button>
          <button className="pb-2 text-on-surface-variant hover:text-on-surface transition-colors font-headline text-[10px] uppercase tracking-widest font-bold whitespace-nowrap">
            Novo Testamento
          </button>
          <button className="pb-2 text-on-surface-variant hover:text-on-surface transition-colors font-headline text-[10px] uppercase tracking-widest font-bold whitespace-nowrap">
            Apócrifos
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-surface-container-low border border-outline-variant/15 p-3 rounded-xl hover:bg-surface-container-high transition-all cursor-pointer group active:scale-95">
            <span className="text-[8px] text-primary/60 font-black block mb-1">AT 01</span>
            <h3 className="font-headline font-bold text-on-surface group-hover:text-primary transition-colors text-xs">Gênesis</h3>
          </div>
          <div className="bg-surface-container-high border border-primary/30 p-3 rounded-xl cursor-pointer relative overflow-hidden active:scale-95">
            <div className="absolute top-0 right-0 p-1">
              <Star className="text-primary" size={10} fill="currentColor" />
            </div>
            <span className="text-[8px] text-primary/60 font-black block mb-1">AT 02</span>
            <h3 className="font-headline font-bold text-primary text-xs">Êxodo</h3>
          </div>
          <div className="bg-surface-container-low border border-outline-variant/15 p-3 rounded-xl hover:bg-surface-container-high transition-all cursor-pointer group active:scale-95">
            <span className="text-[8px] text-primary/60 font-black block mb-1">AT 03</span>
            <h3 className="font-headline font-bold text-on-surface group-hover:text-primary transition-colors text-xs">Levítico</h3>
          </div>
        </div>
      </section>

      {/* Reading Area */}
      <section className="bg-surface-container-lowest p-6 md:p-10 rounded-2xl shadow-xl border border-outline-variant/5">
        <header className="mb-8 text-center">
          <div className="flex justify-center items-center gap-2 text-primary mb-2">
            <span className="h-[1px] w-6 bg-primary/30"></span>
            <Star size={12} />
            <span className="h-[1px] w-6 bg-primary/30"></span>
          </div>
          <h2 className="text-2xl font-headline font-extrabold tracking-tighter text-on-surface mb-1">Êxodo 20</h2>
          <p className="text-on-surface-variant font-bold uppercase tracking-[0.2em] text-[9px]">A Entrega dos Dez Mandamentos</p>
        </header>
        <article className="text-base leading-[1.7] text-on-surface-variant font-light space-y-5 max-w-2xl mx-auto">
          <p>
            <span className="text-primary font-black mr-2 text-[10px] align-top">1</span>
            Então falou Deus todas estas palavras, dizendo: 
            <span className="text-primary font-black mx-2 text-[10px] align-top">2</span>
            Eu sou o Senhor teu Deus, que te tirei da terra do Egito, da casa da servidão.
          </p>
          <p>
            <span className="text-primary font-black mr-2 text-[10px] align-top">3</span>
            Não terás outros deuses diante de mim.
          </p>
          <p>
            <span className="text-primary font-black mr-2 text-[10px] align-top">4</span>
            Não farás para ti imagem de escultura, nem alguma semelhança do que há em cima nos céus, nem em baixo na terra, nem nas águas debaixo da terra.
          </p>
          <div className="my-8 flex justify-center">
            <div className="w-12 h-12 rounded-full border border-primary/20 flex items-center justify-center opacity-40">
              <span className="text-primary font-headline text-lg">✦</span>
            </div>
          </div>
          <p>
            <span className="text-primary font-black mr-2 text-[10px] align-top">5</span>
            Não te encurvarás a elas nem as servirás; porque eu, o Senhor teu Deus, sou Deus zeloso, que visito a iniquidade dos pais nos filhos, até a terceira e quarta geração daqueles que me odeiam.
          </p>
        </article>
        <nav className="mt-12 flex justify-between items-center border-t border-outline-variant/10 pt-6">
          <button className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-headline font-bold uppercase text-[10px] tracking-widest group active:scale-95">
            <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Anterior
          </button>
          <div className="h-1.5 w-1.5 bg-primary/20 rounded-full"></div>
          <button className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-headline font-bold uppercase text-[10px] tracking-widest group active:scale-95">
            Próximo
            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </nav>
      </section>

      {/* Reading Controls */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-50">
        <div className="bg-surface-container-high/95 backdrop-blur-2xl p-3 rounded-2xl border border-outline-variant/20 shadow-2xl flex items-center gap-4">
          <div className="flex-1 flex items-center gap-3">
            <span className="text-[9px] font-black text-on-surface-variant">A</span>
            <input 
              className="flex-1 h-1 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary" 
              max="24" min="14" type="range" defaultValue="18" 
            />
            <span className="text-sm font-black text-on-surface-variant">A</span>
          </div>
          <div className="flex items-center gap-3 border-l border-outline-variant/20 pl-3">
            <button onClick={() => alert('Modo Noturno')} className="text-on-surface-variant hover:text-primary transition-colors p-1 active:scale-90">
              <Moon size={18} />
            </button>
            <button onClick={() => alert('Favoritado')} className="text-primary active:scale-90 transition-transform p-1">
              <Bookmark size={18} fill="currentColor" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
