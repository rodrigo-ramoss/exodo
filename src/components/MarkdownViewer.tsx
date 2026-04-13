import React, { useEffect, useState, useRef } from 'react';
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
  const [fontSize, setFontSize] = useState(18);
  const [theme, setTheme] = useState<ReadingTheme>('dark');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Custom lightweight frontmatter parser to avoid gray-matter/Buffer issues in browser
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
      
      
      // Increased delay and multiple attempts to ensure content is fully rendered
      const restoreScroll = () => {
        if (!containerRef.current) return;
        
        const scrollPos = parseInt(savedScroll, 10);
        containerRef.current.scrollTop = scrollPos;
        
        // Show confirmation toast
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
        
        // Allow scroll saving again after a small buffer
        setTimeout(() => setIsRestoring(false), 200);
      };

      // Try restoring after a delay
      const timer = setTimeout(restoreScroll, 800);
      return () => clearTimeout(timer);
    }
  }, [slug]);

  // Save settings when they change
  useEffect(() => {
    localStorage.setItem('reader_font_size', fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('reader_theme', theme);
  }, [theme]);

  // Track scroll and save progress
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

  // Theme styles
  const themeStyles = {
    dark: 'bg-coal text-on-surface-variant prose-invert',
    light: 'bg-white text-slate-900 prose-slate',
    sepia: 'bg-[#f4ecd8] text-[#5b4636] prose-sepia'
  };

  return (
    <div 
      ref={containerRef} 
      className={`fixed inset-0 z-[100] flex flex-col overflow-y-auto transition-colors duration-500 ${themeStyles[theme]} ${theme === 'sepia' ? 'selection:bg-[#5b4636]/20' : ''}`}
    >
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1.5 z-[120] bg-surface-container-highest/30 backdrop-blur-sm">
        <div 
          className="h-full bg-gradient-to-r from-orange-500 to-yellow-400 shadow-[0_0_10px_rgba(249,115,22,0.5)] transition-all duration-300" 
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Floating Settings Menu */}
      <div className="fixed bottom-8 right-6 z-[130] flex flex-col items-end gap-4">
        {isMenuOpen && (
          <div className="bg-surface-container-high/95 backdrop-blur-xl border border-white/10 p-5 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-6 w-64">
            <div className="flex flex-col gap-3">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-50 flex items-center gap-2">
                <Type size={12} /> Tamanho da Fonte
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setFontSize(prev => Math.max(12, prev - 2))}
                  className="flex-1 h-10 bg-surface-container-highest rounded-xl flex items-center justify-center font-bold hover:bg-primary/20 transition-colors border border-white/5"
                >
                  A-
                </button>
                <div className="w-12 text-center font-mono text-xs font-black">{fontSize}px</div>
                <button 
                  onClick={() => setFontSize(prev => Math.min(32, prev + 2))}
                  className="flex-1 h-10 bg-surface-container-highest rounded-xl flex items-center justify-center font-bold hover:bg-primary/20 transition-colors border border-white/5"
                >
                  A+
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-50 flex items-center gap-2">
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
        )}
        
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-90 bg-surface-container-highest text-primary hover:bg-primary/10"
        >
          {isMenuOpen ? <X size={24} /> : <Settings size={24} />}
        </button>
      </div>

      {/* Reader Content */}
      <div className="max-w-2xl mx-auto w-full px-6 py-12 pb-32">
        {/* Header Section */}
        {(title || category) && (
          <header className="mb-12 pt-4">
            <div className="flex justify-between items-center mb-4">
              {category && (
                <span className="text-primary font-black text-[10px] uppercase tracking-[0.4em]">
                  {category}
                </span>
              )}
              <div className="bg-primary/10 px-2 py-0.5 rounded text-primary text-[8px] font-black tracking-widest uppercase">
                {progress}% Lido
              </div>
            </div>
            {title && (
              <h1 className={`font-headline font-extrabold text-4xl md:text-5xl leading-tight mb-8 tracking-tighter ${theme === 'light' ? 'text-slate-900' : theme === 'sepia' ? 'text-[#5b4636]' : 'text-on-surface'}`}>
                {title}
              </h1>
            )}
            <div className={`flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.2em] opacity-40`}>
              <span>Arquivo Sagrado</span>
              <span className="w-1 h-1 bg-current rounded-full"></span>
              <span>{new Date().toLocaleDateString('pt-BR')}</span>
            </div>
            <div className={`h-[1px] w-full mt-10 ${theme === 'light' ? 'bg-slate-200' : theme === 'sepia' ? 'bg-[#5b4636]/10' : 'bg-gradient-to-r from-primary/30 via-outline-variant/10 to-transparent'}`} />
          </header>
        )}

        {/* Markdown Body */}
        <div 
          className={`prose max-w-none prose-p:leading-relaxed prose-headings:font-headline prose-headings:tracking-tight prose-li:marker:text-primary transition-all duration-300 ${theme === 'dark' ? 'prose-invert' : ''}`}
          style={{ fontSize: `${fontSize}px` }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {parsedContent}
          </ReactMarkdown>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[140] animate-in fade-in slide-in-from-bottom-4 duration-500">
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
