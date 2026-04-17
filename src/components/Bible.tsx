import { Eye, ScrollText, Sparkles, BookMarked, Sigma, BookOpenCheck, Layers3 } from 'lucide-react';

type LensItem = {
  title: string;
  description: string;
  Icon: React.ElementType;
};

type TrailItem = {
  name: string;
  description: string;
  accent: string;
  Icon: React.ElementType;
};

const LENSES: LensItem[] = [
  {
    title: 'Peshat',
    description: 'O Sentido Literal e Histórico.',
    Icon: ScrollText,
  },
  {
    title: 'Remez',
    description: 'As Alusões e Significados Ocultos.',
    Icon: Sparkles,
  },
  {
    title: 'Derash',
    description: 'O Sentido Comparativo e Homilético.',
    Icon: BookMarked,
  },
  {
    title: 'Sod',
    description: 'O Segredo e a Mística do Conselho Divino.',
    Icon: Eye,
  },
];

const TRAILS: TrailItem[] = [
  {
    name: 'Os Vigilantes e Qumran',
    description: 'Uma leitura dos manuscritos e da linguagem de vigilancia espiritual no Segundo Templo.',
    accent: 'from-amber-900/70 to-amber-700/10',
    Icon: Sigma,
  },
  {
    name: 'Benei Ha’Elohim',
    description: 'A identidade, funcao e queda dos filhos de Deus no eixo Genesis, Enoque e apostolos.',
    accent: 'from-rose-900/70 to-rose-700/10',
    Icon: Layers3,
  },
  {
    name: 'O Calendario Solar de Jubileus',
    description: 'Tempo sagrado, ciclos e liturgia cosmica na estrutura do calendario de Jubileus.',
    accent: 'from-sky-900/70 to-sky-700/10',
    Icon: BookOpenCheck,
  },
  {
    name: 'Geografia do Mundo Espiritual',
    description: 'Trono, conselho, abismo e montanhas santas: cartografia biblica do invisivel.',
    accent: 'from-emerald-900/70 to-emerald-700/10',
    Icon: Eye,
  },
];

export default function Bible() {
  return (
    <div className="pt-6 pb-32 px-5 max-w-7xl mx-auto">
      <header className="mb-8 relative">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-[100px]" />
        <div className="relative z-10">
          <p className="font-headline text-[10px] uppercase tracking-[0.2em] font-black text-primary/80 mb-2">
            A Interpretação
          </p>
          <h2 className="font-headline font-extrabold text-3xl text-primary tracking-tighter mb-3 uppercase">
            BÍBLIA
          </h2>
          <p className="text-on-surface-variant/75 text-[11px] max-w-xl font-medium leading-relaxed">
            A Escritura não é um livro de regras, mas um mapa detalhado da realidade visível e invisível.
            Aqui, a lente milenar do PaRDeS desvela os segredos de Qumran e as pegadas dos Benei Ha’Elohim.
          </p>
        </div>
      </header>

      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={14} className="text-primary" />
          <h3 className="font-headline text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant">
            As 4 Lentes (PaRDeS)
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {LENSES.map((lens) => {
            const Icon = lens.Icon;
            return (
              <article
                key={lens.title}
                className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-primary/15 border border-primary/25 rounded-lg p-1.5">
                    <Icon size={14} className="text-primary" />
                  </div>
                  <h4 className="font-headline font-black text-sm uppercase tracking-wide text-on-surface">
                    {lens.title}
                  </h4>
                </div>
                <p className="text-[10px] text-on-surface-variant/75 leading-relaxed">
                  {lens.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <ScrollText size={14} className="text-primary" />
          <h3 className="font-headline text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant">
            Trilhas Temáticas
          </h3>
        </div>

        <div className="flex flex-col gap-4">
          {TRAILS.map((trail, index) => {
            const Icon = trail.Icon;
            return (
              <article
                key={trail.name}
                className="group relative w-full min-h-[172px] rounded-2xl overflow-hidden cursor-pointer border border-white/5 hover:border-primary/30 transition-all duration-300"
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${trail.accent} to-transparent`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/35 to-transparent" />

                <div className="relative h-full flex flex-col justify-between p-5">
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-2 py-1">
                      <Icon size={12} className="text-primary" />
                      <span className="text-[8px] font-black uppercase tracking-[0.18em] text-white/60">
                        Trilha {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-headline font-extrabold text-2xl tracking-tight leading-none text-white mb-2 group-hover:text-primary transition-colors">
                      {trail.name}
                    </h4>
                    <p className="text-[10px] text-white/70 max-w-md leading-relaxed">
                      {trail.description}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
