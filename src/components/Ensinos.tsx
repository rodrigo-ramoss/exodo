import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, Sparkles, Tent } from 'lucide-react';

type EnsinoTemaId =
  | 'parabolas-de-jesus'
  | 'ensinos-de-jesus'
  | 'ensinos-da-torah'
  | 'ensinos-de-salomao';

interface EnsinoTema {
  id: EnsinoTemaId;
  numero: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
}

interface ParabolaItem {
  title: string;
  references: string;
}

interface ParabolaGroup {
  id: string;
  title: string;
  description: string;
  items: string[];
}

const ENSINOS_TEMAS: EnsinoTema[] = [
  {
    id: 'parabolas-de-jesus',
    numero: '01',
    badge: 'Tema 01',
    title: 'PARÁBOLAS DE JESUS',
    subtitle: 'Linguagem do Reino',
    description: 'Leituras organizadas para compreender as parábolas e seu chamado prático ao discipulado.',
  },
  {
    id: 'ensinos-de-jesus',
    numero: '02',
    badge: 'Tema 02',
    title: 'ENSINOS DE JESUS',
    subtitle: 'Doutrina do Messias',
    description: 'Direções de Cristo para mente, caráter e obediência no caminho do Reino.',
  },
  {
    id: 'ensinos-da-torah',
    numero: '03',
    badge: 'Tema 03',
    title: 'ENSINOS DA TORAH',
    subtitle: 'Fundamentos da Aliança',
    description: 'Princípios da Torah aplicados à formação espiritual e à justiça bíblica.',
  },
  {
    id: 'ensinos-de-salomao',
    numero: '04',
    badge: 'Tema 04',
    title: 'ENSINOS DE SALOMÃO',
    subtitle: 'Sabedoria para viver',
    description: 'Sabedoria, discernimento e governo do coração a partir dos escritos sapienciais.',
  },
];

const PARABOLAS_DE_CRISTO: ParabolaItem[] = [
  { title: 'O Semeador', references: 'Mt 13:1-9; Mc 4:1-9; Lc 8:4-8' },
  { title: 'O Joio e o Trigo', references: 'Mt 13:24-30' },
  { title: 'O Grão de Mostarda', references: 'Mt 13:31-32; Mc 4:30-32; Lc 13:18-19' },
  { title: 'O Fermento', references: 'Mt 13:33; Lc 13:20-21' },
  { title: 'O Tesouro Escondido', references: 'Mt 13:44' },
  { title: 'A Pérola de Grande Valor', references: 'Mt 13:45-46' },
  { title: 'A Rede de Pesca', references: 'Mt 13:47-50' },
  { title: 'A Ovelha Perdida', references: 'Mt 18:12-14; Lc 15:4-7' },
  { title: 'O Servo Implacável', references: 'Mt 18:21-35' },
  { title: 'Os Trabalhadores da Vinha', references: 'Mt 20:1-16' },
  { title: 'Os Dois Filhos', references: 'Mt 21:28-32' },
  { title: 'Os Lavradores Maus', references: 'Mt 21:33-46; Mc 12:1-12; Lc 20:9-19' },
  { title: 'O Banquete de Casamento', references: 'Mt 22:1-14' },
  { title: 'As Dez Virgens', references: 'Mt 25:1-13' },
  { title: 'Os Talentos', references: 'Mt 25:14-30' },
  { title: 'As Ovelhas e os Cabritos', references: 'Mt 25:31-46' },
  { title: 'O Semeador que Dorme', references: 'Mc 4:26-29' },
  { title: 'O Bom Samaritano', references: 'Lc 10:25-37' },
  { title: 'O Amigo Importuno', references: 'Lc 11:5-8' },
  { title: 'O Rico Insensato', references: 'Lc 12:13-21' },
  { title: 'A Figueira Estéril', references: 'Lc 13:6-9' },
  { title: 'A Dracma Perdida', references: 'Lc 15:8-10' },
  { title: 'O Filho Pródigo', references: 'Lc 15:11-32' },
  { title: 'O Administrador Infiel', references: 'Lc 16:1-13' },
  { title: 'O Rico e Lázaro', references: 'Lc 16:19-31' },
  { title: 'O Servo Inútil', references: 'Lc 17:7-10' },
  { title: 'O Juiz Iníquo', references: 'Lc 18:1-8' },
  { title: 'O Fariseu e o Publicano', references: 'Lc 18:9-14' },
  { title: 'As Minas', references: 'Lc 19:11-27' },
  { title: 'O Bom Pastor', references: 'Jo 10:1-18' },
  { title: 'A Videira Verdadeira', references: 'Jo 15:1-8' },
];

const PARABOLAS_GRUPOS: ParabolaGroup[] = [
  {
    id: '01',
    title: 'A Origem Oculta do Reino',
    description: 'O Reino começa pequeno e opera silenciosamente, mas cresce até encher toda a criação.',
    items: ['O Semeador', 'O Semeador que Dorme', 'O Grão de Mostarda', 'O Fermento'],
  },
  {
    id: '02',
    title: 'A Aquisição do Reino',
    description: 'O valor supremo do Reino exige a entrega total.',
    items: ['O Tesouro Escondido', 'A Pérola de Grande Valor'],
  },
  {
    id: '03',
    title: 'A Ética Invertida do Reino',
    description: 'A graça subverte a lógica do mérito e da exclusão.',
    items: [
      'Os Trabalhadores da Vinha',
      'O Bom Samaritano',
      'O Servo Implacável',
      'O Fariseu e o Publicano',
      'O Filho Pródigo',
      'O Administrador Infiel',
    ],
  },
  {
    id: '04',
    title: 'A Consumação e o Juízo do Reino',
    description: 'A separação final entre o sistema iníquo e os filhos do Reino.',
    items: [
      'O Joio e o Trigo',
      'A Rede de Pesca',
      'O Banquete de Casamento',
      'As Dez Virgens',
      'Os Talentos / As Minas',
      'As Ovelhas e os Cabritos',
      'O Rico e Lázaro',
      'O Rico Insensato',
      'Os Lavradores Maus',
    ],
  },
  {
    id: '05',
    title: 'A Vigilância e a Espera do Reino',
    description: 'A atitude do remanescente entre a primeira e a segunda vinda do Rei.',
    items: ['A Figueira Estéril', 'O Amigo Importuno', 'O Juiz Iníquo', 'O Servo Inútil'],
  },
  {
    id: '06',
    title: 'A Identidade do Rei (Parábolas Joaninas)',
    description: 'O Reino é orgânico e pessoal: Ele é o Pastor e a Videira.',
    items: ['O Bom Pastor', 'A Videira Verdadeira'],
  },
  {
    id: '07',
    title: 'A Tipologia do Remanescente',
    description: 'A divisão entre os que apenas dizem e os que de fato respondem ao chamado.',
    items: ['Os Dois Filhos', 'A Ovelha Perdida', 'A Dracma Perdida'],
  },
];

function EnsinoThemeCard({ tema, onOpen }: { tema: EnsinoTema; onOpen: () => void }) {
  const isReady = tema.id === 'parabolas-de-jesus';

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative w-full overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-[#1f1a15] via-[#151312] to-[#101010] p-4 sm:p-5 text-left shadow-[0_18px_42px_rgba(0,0,0,0.38)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/55 hover:shadow-[0_22px_50px_rgba(0,0,0,0.5)]"
    >
      <div className="pointer-events-none absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_90%_10%,rgba(242,192,141,0.2),transparent_45%)]" />
      <div className="pointer-events-none absolute right-2 top-0 text-[62px] sm:text-[84px] font-black tracking-tighter text-primary/10 select-none">
        {tema.numero}
      </div>

      <div className="relative z-10">
        <div className="mb-2.5 sm:mb-3 flex items-center justify-between gap-2">
          <span className="inline-flex rounded-full border border-primary/35 bg-primary/10 px-2 py-0.5 sm:py-1 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.17em] text-primary">
            {tema.badge}
          </span>
          <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary/85" />
        </div>

        <h3 className="font-headline text-2xl sm:text-3xl leading-none font-black text-on-surface mb-1.5 sm:mb-2">
          {tema.title}
        </h3>
        <p className="text-xs sm:text-sm font-semibold text-primary/90 mb-1.5 sm:mb-2">{tema.subtitle}</p>
        <p className="text-[11px] sm:text-xs text-on-surface-variant leading-relaxed">{tema.description}</p>

        <div className="mt-3.5 sm:mt-4 rounded-xl border border-primary/20 bg-black/25 px-3.5 sm:px-4 py-2.5 sm:py-3">
          <p className="text-[10px] sm:text-[11px] font-semibold text-primary/95">{isReady ? 'Disponível' : 'Em preparação'}</p>
          <p className="mt-1 text-[9px] sm:text-[10px] leading-snug text-on-surface-variant/75">
            {isReady
              ? 'Inventário com 31 parábolas de Cristo e organização em 7 grupos temáticos.'
              : 'Esta área será preenchida quando os estudos deste tema forem adicionados.'}
          </p>
        </div>
      </div>
    </button>
  );
}

function ParabolasInventory() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-2xl border border-primary/25 bg-black/20 px-3.5 sm:px-5 py-3.5 sm:py-4">
        <p className="text-xs sm:text-sm font-semibold text-primary/95">Inventário Completo</p>
        <p className="mt-1 text-[11px] sm:text-xs leading-relaxed text-on-surface-variant/80 max-w-3xl">
          Lista com 31 parábolas de Cristo e organização temática para estudo contínuo.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
            31 parábolas
          </span>
          <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
            7 grupos
          </span>
        </div>
      </div>

      <article className="rounded-2xl border border-outline-variant/25 bg-black/15 p-3.5 sm:p-5">
        <h3 className="text-sm sm:text-base font-black uppercase tracking-wide text-on-surface">As 31 Parábolas de Cristo</h3>
        <ol className="mt-3 grid grid-cols-1 xl:grid-cols-2 gap-2.5 sm:gap-3">
          {PARABOLAS_DE_CRISTO.map((parabola, index) => (
            <li key={parabola.title} className="rounded-xl border border-primary/15 bg-black/20 px-3 py-2.5">
              <p className="text-[11px] sm:text-xs font-semibold text-on-surface">
                {index + 1}. {parabola.title}
              </p>
              <p className="mt-0.5 text-[10px] sm:text-[11px] text-primary/90">{parabola.references}</p>
            </li>
          ))}
        </ol>
      </article>

      <article className="rounded-2xl border border-outline-variant/25 bg-black/15 p-3.5 sm:p-5">
        <h3 className="text-sm sm:text-base font-black uppercase tracking-wide text-on-surface">Grupos Temáticos</h3>
        <div className="mt-3 grid grid-cols-1 xl:grid-cols-2 gap-3">
          {PARABOLAS_GRUPOS.map((grupo) => (
            <section key={grupo.id} className="rounded-xl border border-primary/15 bg-black/20 px-3.5 sm:px-4 py-3">
              <span className="inline-flex rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-primary">
                Grupo {grupo.id}
              </span>
              <h4 className="mt-1.5 text-xs sm:text-sm font-black text-on-surface uppercase">{grupo.title}</h4>
              <p className="mt-1 text-[10px] sm:text-[11px] leading-relaxed text-on-surface-variant/80">{grupo.description}</p>
              <ul className="mt-2.5 space-y-1.5">
                {grupo.items.map((item) => (
                  <li key={`${grupo.id}-${item}`} className="text-[10px] sm:text-[11px] text-on-surface-variant">
                    - {item}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}

interface EnsinosProps {
  openSlug?: string;
}

function clearOpenSlugFromUrl() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has('open')) return;
  url.searchParams.delete('open');
  const nextUrl = `${url.pathname}${url.search ? url.search : ''}`;
  window.history.replaceState(null, '', nextUrl);
}

export default function Ensinos({ openSlug }: EnsinosProps) {
  const [activeTemaId, setActiveTemaId] = useState<EnsinoTemaId | null>(null);

  const activeTema = useMemo(
    () => ENSINOS_TEMAS.find((tema) => tema.id === activeTemaId) ?? null,
    [activeTemaId],
  );

  useEffect(() => {
    if (!openSlug || activeTemaId) return;
    const matchedTema = ENSINOS_TEMAS.find(
      (tema) => openSlug === tema.id || openSlug.startsWith(`${tema.id}/`) || openSlug.includes(tema.id),
    );
    if (!matchedTema) return;
    setActiveTemaId(matchedTema.id);
    clearOpenSlugFromUrl();
  }, [activeTemaId, openSlug]);

  if (activeTema) {
    return (
      <div className="pt-4 sm:pt-6 pb-24 sm:pb-28 px-4 sm:px-6 max-w-7xl mx-auto min-h-screen bg-surface-container-lowest">
        <section className="rounded-3xl border border-outline-variant/25 bg-gradient-to-b from-surface-container-low to-surface-container p-4 sm:p-6">
          <button
            type="button"
            onClick={() => setActiveTemaId(null)}
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/70 hover:text-primary transition-colors"
          >
            <ArrowLeft size={12} />
            Ensinos
          </button>

          <div className="mt-3 sm:mt-4 mb-4 sm:mb-5">
            <span className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 sm:py-1 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.18em] text-primary mb-1.5 sm:mb-2">
              {activeTema.badge}
            </span>
            <h2 className="font-headline text-2xl sm:text-4xl font-black tracking-tight text-on-surface uppercase">
              {activeTema.title}
            </h2>
            <p className="text-xs sm:text-sm text-primary/85 font-semibold mt-1">{activeTema.subtitle}</p>
            <p className="text-[11px] sm:text-xs text-on-surface-variant leading-relaxed mt-1.5 sm:mt-2 max-w-3xl">
              {activeTema.description}
            </p>
          </div>

          {activeTema.id === 'parabolas-de-jesus' ? (
            <ParabolasInventory />
          ) : (
            <div className="mt-5 sm:mt-7 rounded-2xl border border-primary/20 bg-black/20 px-3.5 sm:px-5 py-3.5 sm:py-4">
              <p className="text-xs sm:text-sm font-semibold text-primary/95">Em preparação</p>
              <p className="mt-1 text-[11px] sm:text-xs leading-relaxed text-on-surface-variant/80 max-w-2xl">
                Esta área será preenchida quando os estudos deste tema forem adicionados.
              </p>
            </div>
          )}
        </section>
      </div>
  );
}

  return (
    <div className="pb-20 sm:pb-24 min-h-screen bg-surface-container-lowest">
      <div className="pt-6 sm:pt-8 px-4 sm:px-6 mb-6 sm:mb-8">
        <header className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-[#1f1a15] via-[#131110] to-[#0d0d0d] px-4 sm:px-8 py-6 sm:py-10 shadow-[0_24px_65px_rgba(0,0,0,0.58)]">
          <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_18%_20%,rgba(242,192,141,0.26),transparent_42%),radial-gradient(circle_at_78%_88%,rgba(212,165,116,0.16),transparent_36%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-10 [background-image:linear-gradient(rgba(242,192,141,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(242,192,141,0.05)_1px,transparent_1px)] [background-size:20px_20px]" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-2.5 sm:px-3 py-0.5 sm:py-1 mb-2.5 sm:mb-3">
              <Tent size={12} className="text-primary" />
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.22em] text-primary">
                Seção Ensinos
              </span>
            </div>
            <h1 className="font-headline text-3xl sm:text-5xl font-black text-primary mb-1.5 sm:mb-2 tracking-tighter text-shadow-glow">
              ENSINOS
            </h1>
            <p className="text-xs sm:text-base text-on-surface font-semibold mb-1.5 sm:mb-2">
              As palavras que formam a mente do Reino.
            </p>
            <p className="text-[11px] sm:text-sm text-on-surface-variant/90 leading-relaxed max-w-3xl">
              Uma área dedicada aos ensinamentos bíblicos organizados por mestres, temas e fundamentos espirituais.
            </p>
          </div>
        </header>
      </div>

      <section className="px-4 sm:px-6 pb-8 sm:pb-10">
        <div className="mb-3 sm:mb-4">
          <h2 className="font-headline text-xl sm:text-3xl font-black tracking-tight text-on-surface">Escolha seu tema</h2>
          <p className="text-xs text-on-surface-variant mt-1">
            Cada tema abre uma trilha de formação bíblica para leitura contínua.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
          {ENSINOS_TEMAS.map((tema) => (
            <EnsinoThemeCard key={tema.id} tema={tema} onOpen={() => setActiveTemaId(tema.id)} />
          ))}
        </div>

        <div className="mt-4 sm:mt-5 rounded-2xl border border-primary/20 bg-black/20 px-3.5 sm:px-5 py-3.5 sm:py-4">
          <p className="text-xs sm:text-sm font-semibold text-primary/95 inline-flex items-center gap-2">
            <Sparkles size={14} />
            Em preparação
          </p>
          <p className="mt-1 text-[11px] sm:text-xs leading-relaxed text-on-surface-variant/80 max-w-2xl">
            Esta área será preenchida quando os estudos deste tema forem adicionados.
          </p>
        </div>
      </section>
    </div>
  );
}
