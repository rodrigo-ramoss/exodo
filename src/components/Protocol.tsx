import React, { useState, useEffect } from 'react';
import { Shield, Lock, Play, Clock, ArrowRight } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { MarkdownViewer } from './MarkdownViewer';

interface Mission {
  title: string;
  slug: string;
  duration: string;
  status: 'liberado' | 'bloqueado';
}

interface Trilha {
  id: string;
  title: string;
  description: string;
  image: string;
  status: 'liberado' | 'bloqueado';
  missions: Mission[];
}

const Protocol: React.FC = () => {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [markdownContent, setMarkdownContent] = useState<string | null>(null);
  const { data: trilhas, loading, error } = useFetch<Trilha[]>('/content/apocrifos/apocrifos-index.json');

  useEffect(() => {
    if (selectedSlug) {
      const fetchMarkdown = async () => {
        try {
          const response = await fetch(`/content/apocrifos/${selectedSlug}.md`);
          if (response.ok) {
            const text = await response.text();
            setMarkdownContent(text);
          }
        } catch (err) {
          console.error('Error fetching apocrypha mission:', err);
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
    <div className="pb-32 px-4 sm:px-6 max-w-4xl mx-auto min-h-screen bg-surface-container-lowest pt-8">
      {/* Apocrypha Header */}
      <div className="mb-10 border-l-2 border-primary-container pl-4 py-1 ml-2">
        <div className="flex items-center gap-2 text-primary mb-2">
          <Shield size={20} />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Análise Técnica</span>
        </div>
        <h1 className="font-headline text-4xl font-bold text-on-surface mb-2 tracking-tighter">
          <span className="text-primary">Apócrifos</span>
        </h1>
        <p className="text-on-surface-variant/70 text-xs max-w-md font-medium leading-relaxed italic">
          Interpretação profunda de Enoque, Jubileus e outros escritos em diálogo direto com a base Bíblica, com leitura técnica e comparativa.
        </p>
      </div>

      <section className="mb-8">
        <div className="border-l-4 border-primary bg-transparent pl-5 py-2">
          <p className="text-[11px] leading-relaxed italic opacity-90 text-on-surface-variant font-semibold tracking-[0.01em]">
            Descriptografando o que foi ocultado: Análise técnica e histórica das fontes primárias em conexão direta com o cânon bíblico. Além da superfície.
          </p>
        </div>
      </section>

      {loading ? (
        <div className="py-20 text-center text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant opacity-50 animate-pulse">
          Sincronizando acervo apócrifo...
        </div>
      ) : (
        <div className="space-y-12">
          {trilhas?.map((trilha) => (
            <div key={trilha.id} className="group">
              {/* Trilha Header */}
              <div className="relative h-48 rounded-3xl overflow-hidden mb-6 shadow-2xl border border-outline-variant/10">
                <img 
                  src={trilha.image} 
                  alt={trilha.title}
                  className={`w-full h-full object-cover transition-all duration-700 ${trilha.status === 'bloqueado' ? 'grayscale blur-sm' : 'group-hover:scale-110'}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/40 to-transparent"></div>
                
                {trilha.status === 'bloqueado' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                    <div className="bg-surface-container-high/90 p-4 rounded-2xl flex flex-col items-center gap-2 border border-white/10 shadow-2xl scale-90">
                      <Lock size={24} className="text-primary" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-primary">Acesso Bloqueado</span>
                    </div>
                  </div>
                )}

                <div className="absolute bottom-6 left-6 right-6">
                  <h2 className="font-headline text-2xl font-extrabold text-on-surface mb-1">{trilha.title}</h2>
                  <p className="text-[10px] text-on-surface-variant font-bold leading-relaxed line-clamp-2 max-w-sm">
                    {trilha.description}
                  </p>
                </div>
              </div>

              {/* Missions List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {trilha.missions.map((mission, i) => (
                  <div 
                    key={i}
                    onClick={() => mission.status === 'liberado' && setSelectedSlug(mission.slug)}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                      mission.status === 'liberado' 
                        ? 'bg-surface-container-high/40 border-outline-variant/10 hover:border-primary/40 hover:bg-surface-container-high/60 active:scale-[0.98]' 
                        : 'bg-surface-container-lowest/50 border-outline-variant/5 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${mission.status === 'liberado' ? 'bg-primary/10 text-primary' : 'bg-surface-container-highest text-on-surface-variant/40'}`}>
                        {mission.status === 'liberado' ? <Play size={18} fill="currentColor" /> : <Lock size={18} />}
                      </div>
                      <div className="flex flex-col">
                        <h3 className="font-bold text-sm text-on-surface leading-tight">{mission.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock size={10} className="text-on-surface-variant opacity-40" />
                          <span className="text-[8px] font-black uppercase tracking-widest text-on-surface-variant opacity-40">{mission.duration}</span>
                        </div>
                      </div>
                    </div>
                    {mission.status === 'liberado' && <ArrowRight size={16} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] uppercase font-bold text-center">
          Erro ao sincronizar Apócrifos: {error}
        </div>
      )}
    </div>
  );
};

export default Protocol;
