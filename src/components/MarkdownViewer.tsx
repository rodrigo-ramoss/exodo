import React, { useEffect, useState, useRef } from 'react';
import matter from 'gray-matter';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, Settings, Type, Sun, Moon, Coffee, X } from 'lucide-react';

interface MarkdownViewerProps {
  content: string;
  slug: string;
}

type ReadingTheme = 'dark' | 'light' | 'sepia';

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content, slug }) => {
  const [progress, setProgress] = useState(0);
  const [hasSavedScroll, setHasSavedScroll] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [theme, setTheme] = useState<ReadingTheme>('dark');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load settings and progress
  useEffect(() => {
    const savedProgress = localStorage.getItem(`progress_${slug}`);
    const savedFontSize = localStorage.getItem('reader_font_size');
    const savedTheme = localStorage.getItem('reader_theme') as ReadingTheme;
    
    if (savedProgress) setProgress(parseInt(savedProgress, 10));
    if (savedFontSize) setFontSize(parseInt(savedFontSize, 10));
    if (savedTheme) setTheme(savedTheme);
  }, [slug]);

  // Automatic Scroll Restore
  useEffect(() => {
    const savedScroll = localStorage.getItem(`scroll_${slug}`);
    if (savedScroll && parseInt(savedScroll, 10) > 100) {
      setHasSavedScroll(true);
      setIsRestoring(true);
      
      // Wait for content to render
      const timer = setTimeout(() => {
        const scrollPos = parseInt(savedScroll, 10);
        window.scrollTo(0, scrollPos);
        
        // Show "You stopped here" toast
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        
        // Small delay before allowing scroll saving again to avoid overwriting with 0
        setTimeout(() => setIsRestoring(false), 100);
      }, 600); 

      return () => clearTimeout(timer);
    } else {
      setIsRestoring(false);
    }
  }, [slug]);

  // Save settings when they change
  useEffect(() => {
    localStorage.setItem('reader_font_size', fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('reader_theme', theme);
  }, [theme]);

  const handleContinueReading = () => {
    const savedScroll = localStorage.getItem(`scroll_${slug}`);
    if (savedScroll) {
      const scrollPos = parseInt(savedScroll, 10);
      window.scrollTo({
        top: scrollPos,
        behavior: 'smooth'
      });
    }
  };

  // Track scroll progress and exact position
  useEffect(() => {
    const handleScroll = () => {
      if (isRestoring) return; // Don't save while we are jumping to position

      const winScroll = window.scrollY || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      
      if (height <= 0) return;

      const scrolled = Math.round((winScroll / height) * 100);
      
      // Only save if it's a valid positive position
      if (winScroll > 0) {
        localStorage.setItem(`scroll_${slug}`, winScroll.toString());
      }

      if (scrolled > progress) {
        setProgress(scrolled);
        localStorage.setItem(`progress_${slug}`, scrolled.toString());
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [slug, progress, isRestoring]);

  // gray-matter fallback
  let parsedContent = content;
  let metadata: any = {};

  try {
    const { data, content: body } = matter(content);
    metadata = data;
    parsedContent = body;
  } catch (err) {
    const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
    if (match) {
      const yamlStr = match[1];
      parsedContent = match[2];
      yamlStr.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length > 0) {
          metadata[key.trim()] = valueParts.join(':').trim().replace(/^["'](.*)["']$/, '$1');
        }
      });
    }
  }

  const { title, category } = metadata;

  // Theme styles
  const themeStyles = {
    dark: 'bg-coal text-on-surface-variant prose-invert',
    light: 'bg-white text-slate-900 prose-slate',
    sepia: 'bg-[#f4ecd8] text-[#5b4636] prose-sepia'
  };

  return (
    <div 
      ref={containerRef} 
      className={`flex flex-col gap-8 max-w-none w-full relative min-h-screen transition-colors duration-500 ${themeStyles[theme]} ${theme === 'sepia' ? 'selection:bg-[#5b4636]/20' : ''}`}
    >
      {/* Progress Bar Fixed at Top */}
      <div className="fixed top-0 left-0 w-full h-1.5 z-[100] bg-surface-container-highest/50 backdrop-blur-sm">
        <div 
          className="h-full bg-gradient-to-r from-orange-500 to-yellow-400 shadow-[0_0_10px_rgba(249,115,22,0.5)] transition-all duration-300" 
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Floating Settings Menu */}
      <div className="fixed bottom-8 right-6 z-[110] flex flex-col items-end gap-4">
        {isMenuOpen && (
          <div className="bg-surface-container-high/95 backdrop-blur-xl border border-white/10 p-5 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-6 w-64">
            {/* Font Size Section */}
            <div className="flex flex-col gap-3">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-50 flex items-center gap-2">
                <Type size={12} /> Tamanho da Fonte
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setFontSize(prev => Math.max(12, prev - 2))}
                  className="flex-1 h-10 bg-surface-container-highest rounded-xl flex items-center justify-center font-bold hover:bg-primary/20 transition-colors border border-white/5 active:scale-95"
                >
                  A-
                </button>
                <div className="w-12 text-center font-mono text-xs font-black">{fontSize}px</div>
                <button 
                  onClick={() => setFontSize(prev => Math.min(32, prev + 2))}
                  className="flex-1 h-10 bg-surface-container-highest rounded-xl flex items-center justify-center font-bold hover:bg-primary/20 transition-colors border border-white/5 active:scale-95"
                >
                  A+
                </button>
              </div>
            </div>

            {/* Themes Section */}
            <div className="flex flex-col gap-3">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-50 flex items-center gap-2">
                <Sun size={12} /> Tema de Leitura
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setTheme('dark')}
                  className={`flex-1 h-12 rounded-xl flex items-center justify-center transition-all border ${theme === 'dark' ? 'bg-primary/20 border-primary shadow-lg' : 'bg-coal border-white/5'}`}
                  title="Tema Escuro"
                >
                  <Moon size={18} className={theme === 'dark' ? 'text-primary' : 'text-on-surface-variant'} />
                </button>
                <button 
                  onClick={() => setTheme('light')}
                  className={`flex-1 h-12 rounded-xl flex items-center justify-center transition-all border ${theme === 'light' ? 'bg-white border-primary shadow-lg' : 'bg-slate-100 border-white/5'}`}
                  title="Tema Claro"
                >
                  <Sun size={18} className={theme === 'light' ? 'text-primary' : 'text-slate-600'} />
                </button>
                <button 
                  onClick={() => setTheme('sepia')}
                  className={`flex-1 h-12 rounded-xl flex items-center justify-center transition-all border ${theme === 'sepia' ? 'bg-[#f4ecd8] border-primary shadow-lg' : 'bg-[#e8dfc8] border-white/5'}`}
                  title="Tema Sépia"
                >
                  <Coffee size={18} className={theme === 'sepia' ? 'text-primary' : 'text-[#5b4636]'} />
                </button>
              </div>
            </div>
          </div>
        )}
        
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-90 ${isMenuOpen ? 'bg-primary text-on-primary rotate-90' : 'bg-surface-container-highest text-primary hover:bg-primary/10'}`}
        >
          {isMenuOpen ? <X size={24} /> : <Settings size={24} />}
        </button>
      </div>

      {/* Capa do Artigo */}
      {(title || category) && (
        <header className="mb-4 w-full pt-2">
          <div className="px-1">
            <div className="flex justify-between items-center mb-3">
              {category && (
                <div className="flex items-center gap-2">
                  <div className={`w-1 h-1 rounded-full animate-pulse ${theme === 'light' ? 'bg-primary' : 'bg-primary'}`}></div>
                  <span className={`font-black text-[10px] uppercase tracking-[0.4em] block ${theme === 'light' ? 'text-primary' : 'text-primary'}`}>
                    {category}
                  </span>
                </div>
              )}
              <div className={`px-2 py-0.5 rounded text-[8px] font-black tracking-widest uppercase ${theme === 'light' ? 'bg-primary/10 text-primary' : 'bg-primary/10 text-primary'}`}>
                {progress}% Lido
              </div>
            </div>
            {title && (
              <h1 className={`font-headline font-extrabold text-3xl md:text-5xl leading-tight mb-6 tracking-tighter ${theme === 'light' ? 'text-slate-900' : theme === 'sepia' ? 'text-[#5b4636]' : 'text-on-surface'}`}>
                {title}
              </h1>
            )}

            {/* Continue Reading Button */}
            {hasSavedScroll && progress < 100 && (
              <button 
                onClick={handleContinueReading}
                className="mb-8 w-full md:w-fit px-6 py-4 bg-gradient-to-r from-orange-600 to-orange-500 rounded-2xl flex items-center justify-between md:justify-center gap-6 shadow-xl shadow-orange-900/20 active:scale-95 transition-all border border-white/10 group"
              >
                <div className="flex flex-col items-start text-left">
                  <span className="text-[10px] font-black text-white/60 uppercase tracking-widest leading-none mb-1">Retomar de onde parou</span>
                  <span className="text-sm font-bold text-white leading-none">Continuar Leitura</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-white/90">{progress}%</span>
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    <ArrowLeft size={20} className="rotate-180 text-white" />
                  </div>
                </div>
              </button>
            )}

            <div className={`flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.2em] ${theme === 'light' ? 'text-slate-400' : theme === 'sepia' ? 'text-[#5b4636]/60' : 'text-on-surface-variant/40'}`}>
              <span>Arquivo Sagrado</span>
              <span className="w-1 h-1 bg-current opacity-30 rounded-full"></span>
              <span>{new Date().toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
          <div className={`h-[1px] w-full mt-8 ${theme === 'light' ? 'bg-slate-200' : theme === 'sepia' ? 'bg-[#5b4636]/10' : 'bg-gradient-to-r from-primary/30 via-outline-variant/10 to-transparent'}`} />
        </header>
      )}

      {/* Conteúdo do Markdown */}
      <div 
        className={`prose max-w-none prose-p:leading-relaxed prose-headings:font-headline prose-headings:tracking-tight prose-li:marker:text-primary transition-all duration-300 ${theme === 'dark' ? 'prose-invert' : ''}`}
        style={{ fontSize: `${fontSize}px` }}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {parsedContent}
        </ReactMarkdown>
      </div>

      {/* Toast Notification for Scroll Restore */}
      {showToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[120] animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-primary/90 backdrop-blur-md text-on-primary px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/20">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-xs font-bold uppercase tracking-wider whitespace-nowrap">
              Você parou aqui. Retomando leitura...
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
