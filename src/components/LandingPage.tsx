import {
  BookMarked,
  Library,
  NotebookPen,
  Sparkles,
  UserRound,
  Wheat,
} from 'lucide-react';
import { Screen } from '../types';

interface LandingPageProps {
  onOpenFree: (screen?: Screen) => void;
}

const FEATURES = [
  {
    icon: UserRound,
    label: 'Discípulos',
    desc: 'Jornadas progressivas de discipulado, identidade, maturidade e batalha espiritual.',
    screen: Screen.DISCIPULOS,
  },
  {
    icon: Wheat,
    label: 'Maná',
    desc: 'Estudos para a vida espiritual, a cura interior e os desafios da vida cotidiana.',
    screen: Screen.MANA,
  },
  {
    icon: Library,
    label: 'Rolos',
    desc: 'Uma biblioteca de séries sobre teologia, mundo espiritual, tipologia e profecia.',
    screen: Screen.BOOKSTORE,
  },
  {
    icon: NotebookPen,
    label: 'Pregador',
    desc: 'Sermões, esboços e estudos bíblicos para aprofundamento e preparo da Palavra.',
    screen: Screen.PREACHER,
  },
  {
    icon: BookMarked,
    label: 'Babel',
    desc: 'Análises do sistema mundial, das estruturas de poder e das narrativas da cultura.',
    screen: Screen.REFUTACAO,
  },
];

export default function LandingPage({ onOpenFree }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-background text-on-surface font-sans">
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-20 text-center">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(242,192,141,0.1) 0%, transparent 70%)',
          }}
        />

        <div className="relative z-10 mx-auto max-w-3xl">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5">
            <Sparkles size={12} className="text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">
              Estudos bíblicos e discernimento dos tempos
            </span>
          </div>

          <h1 className="mb-5 font-headline text-5xl font-black uppercase leading-none tracking-tighter text-on-surface sm:text-7xl">
            Ê<span className="text-primary">X</span>ODO
          </h1>

          <h2 className="mx-auto mb-4 max-w-2xl font-headline text-2xl font-black leading-tight tracking-tight text-on-surface sm:text-3xl">
            Aprofunde sua fé. Compreenda as Escrituras. Discernir o mundo começa aqui.
          </h2>

          <p className="mx-auto mb-3 max-w-2xl text-sm leading-relaxed text-on-surface-variant sm:text-base">
            Um aplicativo de estudos bíblicos, formação espiritual e discernimento do sistema
            mundial, criado por Rodrigo Ramos.
          </p>

          <p className="mx-auto mb-8 max-w-xl text-sm leading-relaxed text-on-surface-variant/65">
            Jornadas de discipulado, estudos para a vida diária, séries teológicas, recursos
            para pregadores e análises das forças que moldam a cultura.
          </p>

          <div className="mx-auto mb-4 max-w-xl rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/8 px-4 py-3">
            <p className="text-xs font-bold leading-relaxed text-[#f8dc86] sm:text-sm">
              Acesso gratuito por tempo limitado. Aproveite esta fase para estudar, crescer
              espiritualmente e explorar todo o conteúdo do Êxodo.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onOpenFree(Screen.HOME)}
            className="limited-free-cta w-full max-w-xl rounded-xl px-8 py-4 font-black uppercase tracking-widest text-[#261900] transition-transform active:scale-[0.98]"
          >
            Acessar o app grátis
          </button>

          <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-on-surface-variant/45">
            Sem cobrança durante o período de acesso aberto
          </p>
        </div>

        <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 opacity-30">
          <div className="h-8 w-px bg-on-surface-variant" />
          <span className="text-[9px] uppercase tracking-widest text-on-surface-variant">
            conheça o app
          </span>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-20">
        <div className="mb-12 text-center">
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">
            O que você encontra
          </span>
          <h2 className="mt-2 font-headline text-2xl font-black uppercase tracking-tight text-on-surface">
            Cinco caminhos. Uma jornada.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-on-surface-variant/70">
            Cada área tem um propósito claro — da formação pessoal à leitura bíblica, do preparo
            da Palavra ao discernimento do sistema mundial.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, label, desc, screen }, index) => (
            <button
              key={label}
              type="button"
              onClick={() => onOpenFree(screen)}
              className={`group relative flex min-h-36 flex-col gap-2 overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/45 ${
                index === FEATURES.length - 1 ? 'sm:col-span-2' : ''
              }`}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Icon size={18} className="text-primary" />
              </div>
              <p className="font-headline text-sm font-black uppercase tracking-tight text-on-surface">
                {label}
              </p>
              <p className="max-w-lg text-xs leading-relaxed text-on-surface-variant">{desc}</p>
              <span className="absolute right-4 top-4 text-[8px] font-black uppercase tracking-widest text-primary/60 transition-colors group-hover:text-primary">
                Explorar →
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-outline-variant/10 bg-surface-container-lowest px-6 py-20">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 55% 55% at 18% 45%, rgba(212,175,55,0.09) 0%, transparent 75%)',
          }}
        />

        <div className="relative mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div className="relative mx-auto w-full max-w-sm">
            <div className="absolute -inset-2 rounded-[2rem] border border-[#D4AF37]/15" />
            <div
              className="absolute -inset-5 -z-10 rounded-[2.5rem] opacity-50 blur-2xl"
              style={{ background: 'rgba(212,175,55,0.12)' }}
            />
            <img
              src="/image/rodrigo-ramos-voz-do-deserto.png"
              alt="Rodrigo Ramos, criador do aplicativo Êxodo"
              loading="lazy"
              className="aspect-[4/5] w-full rounded-[1.6rem] border border-[#D4AF37]/30 object-cover object-top shadow-2xl"
            />
            <div className="absolute inset-x-4 bottom-4 rounded-xl border border-white/10 bg-black/75 px-4 py-3 text-center backdrop-blur-md">
              <p className="font-headline text-sm font-black uppercase tracking-[0.12em] text-white">
                Rodrigo Ramos
              </p>
              <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.24em] text-[#e8c85c]">
                Voz do Deserto
              </p>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">
              Quem está por trás do Êxodo
            </span>
            <h2 className="mt-3 font-headline text-3xl font-black uppercase leading-tight tracking-tight text-on-surface sm:text-4xl">
              Rodrigo Ramos
              <span className="mt-1 block text-primary">Voz do Deserto</span>
            </h2>

            <div className="mt-7 space-y-5 text-sm leading-7 text-on-surface-variant">
              <p>
                Há mais de uma década, minha fé deixou de ser uma herança passiva e se tornou uma
                busca incansável pela Verdade. Nos últimos sete anos, mergulhei em um estudo
                teológico independente e profundo das Escrituras, rompendo com as bolhas
                denominacionais para redescobrir a Bíblia a partir de suas raízes judaicas, com os
                olhos dos autores do primeiro século.
              </p>

              <p>
                Meu foco não está em entreter religiosos, mas em equipar o remanescente fiel. Por
                isso, escrevo sobre escatologia e o mundo espiritual com seriedade, conectando os
                sinais dos tempos ao desmascaramento do sistema bestial que opera no mundo. Não
                ofereço leite superficial, mas alimento sólido: análises densas que unem o texto
                canônico, os apócrifos, os Manuscritos do Mar Morto e a cosmovisão do Segundo
                Templo.
              </p>

              <p>
                O Êxodo é o meu cantinho de guerra. Aqui, as séries de e-books não fogem dos temas
                difíceis. Pelo contrário, mergulham de cabeça no plano divino para o fim dos
                tempos, na antropologia bíblica e na batalha cósmica que define nossa geração.
              </p>

              <p className="border-l-2 border-[#D4AF37]/60 pl-5 font-semibold text-on-surface">
                Se você está cansado de respostas fáceis, encontrou o seu lugar no deserto.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-6 pb-24 pt-6 text-center">
        <div
          className="relative overflow-hidden rounded-3xl border border-[#D4AF37]/25 bg-surface-container-low p-8"
          style={{ boxShadow: '0 0 50px rgba(212,175,55,0.08)' }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 80% 80% at 50% 0%, rgba(212,175,55,0.12) 0%, transparent 70%)',
            }}
          />
          <div className="relative">
            <Sparkles size={20} className="mx-auto mb-4 text-[#D4AF37]" />
            <h2 className="font-headline text-xl font-black uppercase tracking-tight text-on-surface">
              Seu tempo de aprofundar é agora
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-on-surface-variant">
              Todo o aplicativo está aberto gratuitamente nesta fase. Entre, escolha um caminho
              e avance no seu ritmo.
            </p>
            <button
              type="button"
              onClick={() => onOpenFree(Screen.HOME)}
              className="limited-free-cta mt-6 w-full rounded-xl px-8 py-4 font-black uppercase tracking-widest text-[#261900] transition-transform active:scale-[0.98]"
            >
              Começar meus estudos
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-outline-variant/10 px-6 py-8 text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/35">
          Êxodo · Criado por Rodrigo Ramos · {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
