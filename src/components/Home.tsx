import { useMemo, useRef } from 'react';
import { ArrowDown, ArrowRight, BookOpenText, Flame, Sparkles } from 'lucide-react';
import { Screen } from '../types';
import { useFetch } from '../hooks/useFetch';
import { AppImage } from './AppImage';

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

interface BookItem {
  title: string;
  slug: string;
  description: string;
  date: string;
  category: string;
  time: string;
  image?: string;
}

interface AxisBanner {
  id: string;
  title: string;
  subtitle: string;
  image?: string;
}

export default function Home({ onNavigate }: HomeProps) {
  const { data: manaStudies, loading: loadingMana } = useFetch<StudyItem[]>('/content/mana/index.json');
  const { data: books, loading: loadingBooks } = useFetch<BookItem[]>('/content/livraria/index.json');
  const sectionsRef = useRef<HTMLElement | null>(null);

  const heroImage = '/image/livraria/a sabedoria do deserto.webp';
  const fallbackImage = '/image/estudos/A espera que renova.webp';

  const axisBanners: AxisBanner[] = [
    {
      id: 'eixo-1-geografia-invisivel',
      title: 'Eixo 1 · Geografia Invisível',
      subtitle: 'Mapas espirituais, conselho divino e territórios celestiais.',
      image: '/assets/imagens/eixos-biblicos/capa-eixo-1-geografia-invisivel.webp',
    },
    {
      id: 'eixo-2-seres-celestiais',
      title: 'Eixo 2 · Seres Celestiais',
      subtitle: 'Ofícios, hierarquias e arquitetura do governo invisível.',
      image: '/image/livraria/a sessao do conselho.webp',
    },
    {
      id: 'eixo-3-rebeliao-cosmica',
      title: 'Eixo 3 · Rebelião Cósmica',
      subtitle: 'Nachash, queda e guerra pela herança das nações.',
      image: '/assets/imagens/eixos-biblicos/capa-eixo-3-rebeliao-cosmica.webp',
    },
  ];

  const toCssImageUrl = (path?: string, fallback = fallbackImage) => {
    const safePath = encodeURI(path || fallback);
    return `url('${safePath}')`;
  };

  const newestMana = useMemo(() => {
    if (!manaStudies?.length) return null;
    return [...manaStudies].sort((a, b) => {
      return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
    })[0];
  }, [manaStudies]);

  const coroaRoubadaLaunch = useMemo(() => {
    if (!books?.length) return null;
    const coroaRoubada = books.filter((book) =>
      book.category.toLowerCase().includes('coroa roubada'),
    );
    if (!coroaRoubada.length) return null;
    return [...coroaRoubada].sort((a, b) => {
      return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
    })[0];
  }, [books]);

  return (
    <div className="flex flex-col bg-[#000000] text-[#D9D9D9]">
      <section className="relative h-[560px] w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: toCssImageUrl(heroImage) }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/35"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/60"></div>
        </div>

        <div className="relative h-full flex flex-col justify-center px-6 max-w-4xl">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="text-[#D4AF37]" size={14} fill="currentColor" />
            <span className="font-headline uppercase tracking-[0.2em] text-[9px] font-bold text-[#C9C9C9]">
              Investigação Especial
            </span>
          </div>

          <h2 className="font-headline text-3xl sm:text-4xl font-extrabold text-[#D4AF37] leading-tight mb-4 tracking-tight">
            VOZ DO DESERTO: A Geopolítica do Invisível
          </h2>

          <p className="text-[#CFCFCF] text-xs sm:text-sm max-w-[520px] mb-8 leading-relaxed">
            Bem-vindo à fronteira final da investigação bíblica. Aqui, a Escritura deixa de ser um livro religioso
            para se tornar o mapa técnico dos reinos, governos e tecnologias da eternidade. Desvende o que está
            oculto entre as linhas do tempo e do espaço.
          </p>

          <p className="text-[11px] text-[#AAAAAA] uppercase tracking-[0.14em] mb-3 font-bold">
            Inicie sua jornada pelos Eixos de Investigação ou explore os últimos relatórios abaixo.
          </p>

          <div className="flex">
            <button
              onClick={() => sectionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="gold-glow-hover bg-[#D4AF37] text-black px-6 py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-[#D4AF37]/20"
            >
              Explorar a Verdade <ArrowDown size={14} />
            </button>
          </div>
        </div>
      </section>

      <section ref={sectionsRef} className="pt-6 pb-28 px-6 space-y-6">
        <article
          onClick={() => onNavigate(Screen.REFUTACAO, 'push')}
          className="interactive-card gold-glow-hover cursor-pointer rounded-xl border border-[#D4AF37]/30 bg-[#0A0A0A] px-4 py-3"
        >
          <p className="text-[9px] uppercase tracking-[0.16em] font-black text-[#D4AF37] mb-1">
            Alerta de Doutrinas
          </p>
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-headline text-sm sm:text-base font-extrabold text-[#EAEAEA]">
              A Fraude do Arrebatamento Secreto
            </h3>
            <ArrowRight size={14} className="text-[#D4AF37] shrink-0" />
          </div>
        </article>

        <article
          onClick={() => onNavigate(Screen.MANA, 'push')}
          className="interactive-card gold-glow-hover rounded-2xl overflow-hidden border border-[#262626] bg-[#0B0B0B] cursor-pointer"
        >
          <div
            className="h-40 bg-cover bg-center relative"
            style={{ backgroundImage: toCssImageUrl(newestMana?.image) }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent"></div>
            <span className="absolute top-3 left-3 bg-[#D4AF37]/95 text-black text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-wider">
              Alimento Diário
            </span>
          </div>
          <div className="p-4">
            <p className="text-[9px] uppercase tracking-[0.14em] font-black text-[#D4AF37] mb-2">Destaque do Maná</p>
            {loadingMana ? (
              <p className="text-[11px] text-[#AFAFAF]">Carregando estudo mais recente...</p>
            ) : (
              <>
                <h3 className="font-headline text-base font-extrabold text-[#E8E8E8] leading-tight">
                  {newestMana?.title || 'Novo estudo em breve'}
                </h3>
                <p className="mt-2 text-[11px] text-[#B9B9B9] line-clamp-2">
                  {newestMana?.description || 'Acompanhe os próximos estudos de preparo espiritual.'}
                </p>
              </>
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-[#232323] bg-[#0B0B0B] p-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpenText size={16} className="text-[#D4AF37]" />
            <h3 className="font-headline text-base font-extrabold text-[#D4AF37]">Geopolítica Celestial</h3>
          </div>
          <p className="text-[11px] text-[#B7B7B7] mb-4">
            Vitrine da Bíblia (Os 7 Eixos): descubra as frentes iniciais da investigação.
          </p>
          <div className="space-y-3">
            {axisBanners.map((axis) => (
              <button
                key={axis.id}
                onClick={() => onNavigate(Screen.BIBLE, 'push')}
                className="interactive-card gold-glow-hover w-full text-left rounded-xl overflow-hidden border border-[#2E2E2E]"
              >
                <div
                  className="h-24 bg-cover bg-center relative"
                  style={{ backgroundImage: toCssImageUrl(axis.image, '/image/livraria/o trono e o templo.webp') }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-black/20"></div>
                  <div className="relative h-full px-3 py-2 flex flex-col justify-center">
                    <h4 className="font-headline text-sm font-black text-[#EAEAEA]">{axis.title}</h4>
                    <p className="text-[10px] text-[#C2C2C2] mt-1 line-clamp-2">{axis.subtitle}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-[#232323] bg-[#0B0B0B] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Flame size={16} className="text-[#D4AF37]" />
            <h3 className="font-headline text-base font-extrabold text-[#D4AF37]">Lançamento da Livraria</h3>
          </div>

          <div className="rounded-xl overflow-hidden border border-[#2E2E2E] bg-[#050505]">
            <div className="h-52 w-full bg-[#111111]">
              <AppImage
                src={coroaRoubadaLaunch?.image || '/image/livraria/o tribunal dos deuses.webp'}
                alt={coroaRoubadaLaunch?.title || 'Trilogia A Coroa Roubada'}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4">
              <p className="text-[9px] uppercase tracking-[0.14em] font-black text-[#D4AF37] mb-2">
                Trilogia · A Coroa Roubada
              </p>
              {loadingBooks ? (
                <p className="text-[11px] text-[#AFAFAF]">Carregando lançamento...</p>
              ) : (
                <h4 className="font-headline text-sm font-extrabold text-[#E8E8E8] mb-4">
                  {coroaRoubadaLaunch?.title || 'Acesso à trilogia em atualização'}
                </h4>
              )}

              <button
                onClick={() => onNavigate(Screen.BOOKSTORE, 'push')}
                className="gold-glow-hover w-full bg-[#D4AF37] text-black py-3 rounded-lg font-black text-[11px] uppercase tracking-[0.12em] transition-all active:scale-95"
              >
                Acessar Biblioteca
              </button>
            </div>
          </div>
        </article>
      </section>

      <footer className="bg-[#000000] py-10 px-6 border-t border-[#1F1F1F]">
        <div className="flex flex-col items-center justify-center gap-6">
          <div className="text-[#D4AF37] text-xl font-headline opacity-30 font-black uppercase tracking-tighter">ÊXODO</div>
          <nav className="flex flex-wrap justify-center gap-5">
            <button className="font-sans text-[8px] text-[#A7A7A7] uppercase tracking-[0.2em] font-bold">Termos</button>
            <button className="font-sans text-[8px] text-[#A7A7A7] uppercase tracking-[0.2em] font-bold">Privacidade</button>
            <button className="font-sans text-[8px] text-[#A7A7A7] uppercase tracking-[0.2em] font-bold">Apoie</button>
          </nav>
          <p className="font-sans text-[7px] text-[#8A8A8A] uppercase tracking-[0.2em] text-center opacity-40 font-bold">
            © ÊXODO. O ARQUIVO SAGRADO.
          </p>
        </div>
      </footer>
    </div>
  );
}
