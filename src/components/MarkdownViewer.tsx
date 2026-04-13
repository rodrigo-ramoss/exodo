import React, { useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, Settings, Type, Sun, Moon, Coffee, X } from 'lucide-react';

interface MarkdownViewerProps {
  content: string;
  slug: string;
  onClose: () => void;
}

type ReadingTheme = 'dark' | 'light' | 'sepia';

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content, slug, onClose }) => {
  const [progress, setProgress] = useState(0);
  const [fontSize, setFontSize] = useState(18);
  const [theme, setTheme] = useState<ReadingTheme>('dark');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // History sync for hardware back button
  useEffect(() => {
    // Push a new state when the reader opens
    window.history.pushState({ readerOpen: true, slug }, '');

    const handlePopState = (event: PopStateEvent) => {
      // If the back button is pressed, close the reader
      onClose();
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
      // If we are unmounting but the state is still there (e.g. manual close), 
      // we might want to go back, but it's tricky. 
      // Simple approach: popstate handles the hardware button.
    };
  }, [slug, onClose]);

  const handleManualClose = () => {
    // If the state is still 'readerOpen', go back to remove it from history
    if (window.history.state?.readerOpen) {
      window.history.back();
    } else {
      onClose();
    }
  };

  // Custom lightweight frontmatter parser
  const parseMarkdown = (str: string) => {
    const regex = /^---\s*[\r\n]+([\s\S]*?)[\r\n]+---\s*[\r\n]*([\s\S]*)$/;
    const match = str.match(regex);
    
    if (!match) return { metadata: {}, body: str };
    
    const yamlStr = match[1];
    const body = match[2];
    const metadata: any = {};
    
    yamlStr.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        const value = valueParts.join(':').trim().replace(/^["'](.*)["']$/, '$1');
        metadata[key.trim()] = value;
      }
    });
    
    return { metadata, body };
  };

  // Build trigger: 2026-04-13 15:15 - High visibility fix
  const { metadata, body: parsedContent } = parseMarkdown(content);
  const { title, category } = metadata;

  // Load settings and progress
  useEffect(() => {
    const savedFontSize = localStorage.getItem('reader_font_size');
    const savedTheme = localStorage.getItem('reader_theme') as ReadingTheme;
    const savedProgress = localStorage.getItem(`progress_${slug}`);
    
    if (savedFontSize) setFontSize(parseInt(savedFontSize, 10));
    if (savedTheme) setTheme(savedTheme);
    if (savedProgress) setProgress(parseInt(savedProgress, 10));

    // Restore scroll position
    const savedScroll = localStorage.getItem(`scroll_${slug}`);
    if (savedScroll && parseInt(savedScroll, 10) > 100) {
      setIsRestoring(true);
      
      const restoreScroll = () => {
        if (!containerRef.current) return;
        const scrollPos = parseInt(savedScroll, 10);
        containerRef.current.scrollTop = scrollPos;
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
        setTimeout(() => setIsRestoring(false), 200);
      };

      const timer = setTimeout(restoreScroll, 800);
      return () => clearTimeout(timer);
    }
  }, [slug]);

  // Save settings
  useEffect(() => {
    localStorage.setItem('reader_font_size', fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('reader_theme', theme);
  }, [theme]);

  // Track scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (isRestoring) return;
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight - container.clientHeight;
      if (scrollHeight <= 0) return;
      const scrolled = Math.round((scrollTop / scrollHeight) * 100);
      if (scrollTop > 0) {
        localStorage.setItem(`scroll_${slug}`, scrollTop.toString());
      }
      if (scrolled > progress) {
        setProgress(scrolled);
        localStorage.setItem(`progress_${slug}`, scrolled.toString());
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [slug, progress, isRestoring]);

  // Theme styles - Updated for high contrast and red highlights
  const themeStyles = {
    dark: 'bg-coal text-[#e5e2e1] prose-invert',
    light: 'bg-white text-[#0f172a] prose-slate prose-headings:text-[#b83025] prose-strong:text-[#b83025] prose-strong:font-black',
    sepia: 'bg-[#f4ecd8] text-[#433422] prose-sepia prose-headings:text-[#b83025] prose-strong:text-[#b83025] prose-strong:font-black'
  };

  return (
    <div 
      ref={containerRef} 
      className={`fixed inset-0 z-[99999] flex flex-col overflow-y-auto transition-colors duration-500 ${themeStyles[theme]} ${theme === 'sepia' ? 'selection:bg-[#5b4636]/20' : ''}`}
      style={{ 
        backgroundColor: theme === 'dark' ? '#080705' : theme === 'light' ? '#ffffff' : '#f4ecd8',
        opacity: 1
      }}
    >
      {/* Top Controls Bar */}
      <div className={`sticky top-0 left-0 w-full z-[10000] flex items-center justify-between px-4 h-16 backdrop-blur-md border-b transition-colors duration-500 ${theme === 'dark' ? 'bg-coal/95 border-white/5' : theme === 'sepia' ? 'bg-[#f4ecd8]/95 border-[#433422]/10' : 'bg-white/95 border-slate-200'}`}>
        <button 
          onClick={handleManualClose}
          className={`flex items-center gap-2 font-bold text-xs uppercase tracking-widest active:scale-95 transition-all p-2 rounded-xl ${theme === 'dark' ? 'text-primary hover:bg-primary/10' : theme === 'sepia' ? 'text-[#433422] hover:bg-[#433422]/5' : 'text-slate-900 hover:bg-slate-100'}`}
        >
          <ArrowLeft size={20} />
          <span>Sair</span>
        </button>
        
        <div className="flex items-center gap-3">
          <div className={`px-2 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase ${theme === 'dark' ? 'bg-primary/10 text-primary' : theme === 'sepia' ? 'bg-[#433422]/10 text-[#433422]' : 'bg-slate-100 text-slate-900'}`}>
            {progress}% Lido
          </div>
          
          {/* Settings Button moved here */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 ${isMenuOpen ? 'bg-primary text-on-primary' : theme === 'dark' ? 'bg-surface-container-highest text-primary' : theme === 'sepia' ? 'bg-[#e8dfc8] text-[#433422]' : 'bg-slate-100 text-slate-900 shadow-sm border border-slate-200'}`}
          >
            {isMenuOpen ? <X size={20} /> : <Settings size={20} />}
          </button>
        </div>
      </div>

      {/* Settings Menu (Relative to the Top Bar or absolute) */}
      {isMenuOpen && (
        <div className="fixed top-20 right-4 z-[10001] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className={`backdrop-blur-xl border p-5 rounded-3xl shadow-2xl flex flex-col gap-6 w-64 ${theme === 'dark' ? 'bg-surface-container-high/95 border-white/10' : theme === 'sepia' ? 'bg-[#e8dfc8]/95 border-[#433422]/10' : 'bg-white/95 border-slate-200'}`}>
            <div className="flex flex-col gap-3">
              <span className={`text-[9px] font-black uppercase tracking-[0.2em] opacity-50 flex items-center gap-2 ${theme === 'dark' ? 'text-on-surface-variant' : 'text-current'}`}>
                <Type size={12} /> Tamanho da Fonte
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setFontSize(prev => Math.max(12, prev - 2))}
                  className={`flex-1 h-10 rounded-xl flex items-center justify-center font-bold transition-colors border ${theme === 'dark' ? 'bg-surface-container-highest border-white/5 hover:bg-primary/20' : 'bg-current/5 border-current/10 hover:bg-current/10'}`}
                >
                  A-
                </button>
                <div className="w-12 text-center font-mono text-xs font-black text-current">{fontSize}px</div>
                <button 
                  onClick={() => setFontSize(prev => Math.min(32, prev + 2))}
                  className={`flex-1 h-10 rounded-xl flex items-center justify-center font-bold transition-colors border ${theme === 'dark' ? 'bg-surface-container-highest border-white/5 hover:bg-primary/20' : 'bg-current/5 border-current/10 hover:bg-current/10'}`}
                >
                  A+
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <span className={`text-[9px] font-black uppercase tracking-[0.2em] opacity-50 flex items-center gap-2 ${theme === 'dark' ? 'text-on-surface-variant' : 'text-current'}`}>
                <Sun size={12} /> Tema de Leitura
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setTheme('dark')}
                  className={`flex-1 h-12 rounded-xl flex items-center justify-center transition-all border ${theme === 'dark' ? 'bg-primary/20 border-primary shadow-lg' : 'bg-coal border-white/5'}`}
                >
                  <Moon size={18} className={theme === 'dark' ? 'text-primary' : 'text-on-surface-variant'} />
                </button>
                <button 
                  onClick={() => setTheme('light')}
                  className={`flex-1 h-12 rounded-xl flex items-center justify-center transition-all border ${theme === 'light' ? 'bg-white border-primary shadow-lg' : 'bg-slate-100 border-white/5'}`}
                >
                  <Sun size={18} className={theme === 'light' ? 'text-primary' : 'text-slate-600'} />
                </button>
                <button 
                  onClick={() => setTheme('sepia')}
                  className={`flex-1 h-12 rounded-xl flex items-center justify-center transition-all border ${theme === 'sepia' ? 'bg-[#f4ecd8] border-primary shadow-lg' : 'bg-[#e8dfc8] border-white/5'}`}
                >
                  <Coffee size={18} className={theme === 'sepia' ? 'text-primary' : 'text-[#5b4636]'} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 z-[10002]">
        <div 
          className="h-full bg-gradient-to-r from-orange-500 to-yellow-400 shadow-[0_0_10px_rgba(249,115,22,0.5)] transition-all duration-300" 
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Reader Content */}
      <div className="max-w-2xl mx-auto w-full px-6 py-12 pb-32">
        {/* Header Section */}
        {(title || category) && (
          <header className="mb-12 pt-4">
            <div className="flex justify-between items-center mb-4">
              {category && (
                <span className={`font-black text-[10px] uppercase tracking-[0.4em] ${theme === 'dark' ? 'text-primary' : 'text-[#b83025]'}`}>
                  {category}
                </span>
              )}
            </div>
            {title && (
              <h1 className={`font-headline font-extrabold text-4xl md:text-5xl leading-tight mb-8 tracking-tighter ${theme !== 'dark' ? 'text-[#b83025]' : 'text-[#e5e2e1]'}`}>
                {title}
              </h1>
            )}
            <div className={`flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.2em] opacity-40`}>
              <span>Arquivo Sagrado</span>
              <span className="w-1 h-1 bg-current rounded-full"></span>
              <span>{new Date().toLocaleDateString('pt-BR')}</span>
            </div>
            <div className={`h-[1px] w-full mt-10 ${theme === 'dark' ? 'bg-gradient-to-r from-primary/30 via-outline-variant/10 to-transparent' : 'bg-current/10'}`} />
          </header>
        )}

        {/* Markdown Body */}
        <div 
          className={`prose max-w-none prose-p:leading-relaxed prose-headings:font-headline prose-headings:tracking-tight prose-li:marker:text-primary transition-all duration-300 ${theme === 'dark' ? 'prose-invert' : 'prose-headings:text-[#b83025] prose-p:text-current prose-strong:text-[#b83025] prose-strong:font-black'}`}
          style={{ fontSize: `${fontSize}px` }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {parsedContent}
          </ReactMarkdown>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[10003] animate-in fade-in slide-in-from-bottom-4 duration-500">
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
