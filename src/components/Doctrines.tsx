import { useMemo, useState } from 'react';
import { Diamond, Star, History, Brain, ShieldAlert, Wallet, Flame, Link, Skull, Moon, Network, ChevronRight, ArrowLeft } from 'lucide-react';
import { MarkdownViewer } from './MarkdownViewer';

interface DoctrineLayer {
  title: string;
  slug: string;
}

interface DoctrineItem {
  title: string;
  description: string;
  category: string;
  image?: string;
  layers: DoctrineLayer[];
  track: DoctrineTrack;
}

type DoctrineTrack = 'expostas' | 'biblicas';

const trackLabels: Record<DoctrineTrack, string> = {
  expostas: 'Doutrinas Expostas',
  biblicas: 'Doutrinas Bíblicas',
};

const trackDescriptions: Record<DoctrineTrack, string> = {
  expostas:
    'Exposição de dogmas humanos sob a luz da exegese: confronte o que você sempre ouviu com o que o Texto Sagrado realmente diz.',
  biblicas:
    'As verdadeiras doutrinas que deveriam ser ensinadas, mas que confrontam os dogmas de qualquer instituição.',
};

const doctrineIndexModules = import.meta.glob('../content/doutrinas/{expostas,biblicas}/index.json', {
  eager: true,
  import: 'default',
}) as Record<string, Omit<DoctrineItem, 'track'>[]>;

const doctrineMarkdownModules = import.meta.glob('../content/doutrinas/{expostas,biblicas}/**/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

function loadDoctrines(track: DoctrineTrack): DoctrineItem[] {
  const indexPath = `../content/doutrinas/${track}/index.json`;
  const items = doctrineIndexModules[indexPath] || [];
  return items.map(item => ({ ...item, track }));
}

const iconMap: Record<string, any> = {
  'Arrebatamento Secreto': Star,
  'Arrependimento de Deus': History,
  'Batismo no Espírito Santo': Star,
  'A Doutrina dos Demônios': Brain,
  'A Doutrina de Satanás': ShieldAlert,
  'Demônios': Brain,
  'Satanás': ShieldAlert,
  'Dízimo': Wallet,
  'Inferno': Flame,
  'Maldição Hereditária': Link,
  'Segunda Morte': Skull,
  'Sono da Alma': Moon,
  'Trindade': Network,
};

export default function Doctrines() {
  const [selectedTrack, setSelectedTrack] = useState<DoctrineTrack>('expostas');
  const [selectedLayer, setSelectedLayer] = useState<{ track: DoctrineTrack; slug: string } | null>(null);
  const [expandedTheme, setExpandedTheme] = useState<string | null>(null);
  const allDoctrines = useMemo(
    () => [...loadDoctrines('expostas'), ...loadDoctrines('biblicas')],
    [],
  );
  const doctrines = useMemo(
    () => allDoctrines.filter(doctrine => doctrine.track === selectedTrack),
    [allDoctrines, selectedTrack],
  );
  const loading = false;
  const error = null;
  const markdownContent = selectedLayer
    ? doctrineMarkdownModules[`../content/doutrinas/${selectedLayer.track}/${selectedLayer.slug}.md`] || null
    : null;

  const handleTrackChange = (nextTrack: DoctrineTrack) => {
    setSelectedTrack(nextTrack);
    setExpandedTheme(null);
  };

  // Se um arquivo MD está selecionado, mostra o visualizador em tela cheia
  if (selectedLayer && markdownContent) {
    return (
      <MarkdownViewer 
        content={markdownContent} 
        slug={selectedLayer.slug} 
        onClose={() => setSelectedLayer(null)} 
      />
    );
  }

  // Lista principal de Doutrinas com Accordions
  return (
    <div className="pt-8 pb-32 px-5 max-w-4xl mx-auto min-h-screen">
      {/* Hero Branding Section */}
      <div className="mb-8 border-l-2 border-primary-container pl-4 py-1">
        <h1 className="text-3xl font-headline font-extrabold tracking-tighter text-on-surface mb-1">
          Doutrinas <span className="text-primary">{selectedTrack === 'expostas' ? 'Expostas' : 'Bíblicas'}</span>
        </h1>
        <p className="text-on-surface-variant/70 text-[11px] max-w-[280px] font-medium leading-relaxed">
          {trackDescriptions[selectedTrack]}
        </p>
      </div>

      {/* Category Bar */}
      <section className="mb-6">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
          {(Object.keys(trackLabels) as DoctrineTrack[]).map((track) => (
            <button
              key={track}
              onClick={() => handleTrackChange(track)}
              className={`gold-glow-hover flex-shrink-0 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border transition-all rounded-full ${
                selectedTrack === track
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-surface-container-high text-on-surface-variant border-outline-variant/20 hover:border-primary/50'
              }`}
            >
              {trackLabels[track]}
            </button>
          ))}
        </div>
      </section>

      {selectedTrack === 'biblicas' && (
        <section className="mb-6">
          <div className="border-l-4 border-primary bg-transparent pl-5 py-2">
            <p className="text-[11px] leading-relaxed italic opacity-90 text-on-surface-variant font-semibold tracking-[0.01em]">
              As verdadeiras doutrinas que deveriam ser ensinadas, mas que confrontam os dogmas de qualquer instituição.
            </p>
            <p className="mt-2 text-[9px] uppercase tracking-[0.24em] text-primary/90 font-black">
              Manifesto Oficial • Voz do Deserto
            </p>
          </div>
        </section>
      )}

      {/* Investigation Cards Grid (Expandable) */}
      <div className="flex flex-col gap-4">
        {!loading && doctrines.length === 0 && (
          <div className="py-14 text-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-60 border border-dashed border-outline-variant/20 rounded-3xl">
            Nenhuma doutrina encontrada nesta categoria.
          </div>
        )}
        {loading ? (
          <div className="py-10 text-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-50">Carregando...</div>
        ) : doctrines.map((doctrine, i) => {
          const Icon = iconMap[doctrine.title] || Diamond;
          const isExpanded = expandedTheme === doctrine.title;

          return (
            <div 
              key={i}
              className={`interactive-card gold-glow-hover group relative flex flex-col bg-surface-container-low border-l-4 transition-all rounded-r-2xl overflow-hidden ${isExpanded ? 'border-primary bg-surface-container-high shadow-xl' : 'border-transparent hover:border-primary/40 hover:bg-surface-container-high'}`}
            >
              {/* Card Header (Toggle) */}
              <div 
                onClick={() => setExpandedTheme(isExpanded ? null : doctrine.title)}
                className="flex items-center h-[80px] px-4 cursor-pointer active:opacity-70"
              >
                {doctrine.image ? (
                  <div className="w-14 h-10 rounded-xl overflow-hidden flex-shrink-0 mr-4 border border-outline-variant/10 bg-surface-container-lowest">
                    <img src={doctrine.image} alt={doctrine.title} className="w-full h-full object-cover object-center" />
                  </div>
                ) : (
                  <div className="w-14 h-10 rounded-xl bg-surface-container-lowest flex items-center justify-center flex-shrink-0 mr-4">
                    <Icon className="text-primary" size={20} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm font-bold font-headline transition-colors truncate ${isExpanded ? 'text-primary' : 'text-on-surface group-hover:text-primary'}`}>
                    {doctrine.title}
                  </h3>
                  <p className="text-on-surface-variant text-[10px] truncate font-medium">
                    {doctrine.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-black text-primary/40 uppercase tracking-widest">{doctrine.layers.length} camadas</span>
                  <ChevronRight className={`text-primary/40 transition-transform duration-300 ${isExpanded ? 'rotate-90 text-primary' : ''}`} size={16} />
                </div>
              </div>

              {/* Expanded Content (Layers List) */}
              {isExpanded && (
                <div className="px-4 pb-6 pt-2 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300 border-t border-outline-variant/5">
                  <div className="text-[8px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40 mb-3 px-2">Selecione uma camada para aprofundar:</div>
                  {doctrine.layers.map((layer, j) => {
                    const progress = typeof window !== 'undefined' ? localStorage.getItem(`progress_${layer.slug}`) : null;
                    
                    return (
                      <div 
                        key={j}
                        onClick={() => setSelectedLayer({ track: doctrine.track, slug: layer.slug })}
                        className="interactive-card gold-glow-hover flex flex-col gap-2 p-3 bg-surface-container-lowest/50 hover:bg-primary/5 border border-outline-variant/5 rounded-xl cursor-pointer active:scale-[0.99] transition-all group/layer"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-lg bg-surface-container-high flex items-center justify-center text-primary font-black text-[10px]">
                              {j}
                            </div>
                            <span className="text-xs font-bold text-on-surface-variant group-hover/layer:text-primary transition-colors line-clamp-1">{layer.title}</span>
                          </div>
                          <ChevronRight size={14} className="text-primary/20 group-hover/layer:text-primary transition-colors" />
                        </div>
                        
                        {/* Progress Bar for Layer */}
                        {progress && parseInt(progress) > 0 && (
                          <div className="flex items-center gap-2 pl-9">
                            <div className="h-1 flex-1 bg-surface-container-high rounded-full overflow-hidden border border-white/5">
                              <div 
                                className="h-full bg-gradient-to-r from-orange-500 to-yellow-400" 
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                            <span className="text-[6px] font-black text-orange-400 uppercase tracking-widest">{progress}% Lido</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {error && <div className="text-red-500 text-[10px] uppercase font-bold text-center py-4">{error}</div>}
      </div>
    </div>
  );
}
