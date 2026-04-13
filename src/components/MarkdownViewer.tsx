import React, { useEffect, useState, useRef } from 'react';
import matter from 'gray-matter';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownViewerProps {
  content: string;
  slug: string;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content, slug }) => {
  const [progress, setProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load saved progress
  useEffect(() => {
    const savedProgress = localStorage.getItem(`progress_${slug}`);
    if (savedProgress) {
      const p = parseInt(savedProgress, 10);
      setProgress(p);
      // We don't automatically scroll to position here to avoid jarring UX, 
      // but we update the UI percentage.
    }
  }, [slug]);

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = Math.round((winScroll / height) * 100);
      
      if (scrolled > progress) {
        setProgress(scrolled);
        localStorage.setItem(`progress_${slug}`, scrolled.toString());
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [slug, progress]);

  // gray-matter can be tricky in the browser, so we'll use a simple fallback
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

  return (
    <div ref={containerRef} className="flex flex-col gap-8 max-w-none w-full relative">
      {/* Progress Bar Fixed at Top */}
      <div className="fixed top-0 left-0 w-full h-1 z-[100] bg-surface-container-highest">
        <div 
          className="h-full bg-primary transition-all duration-300" 
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Capa do Artigo */}
      {(title || category) && (
        <header className="mb-4 w-full pt-2">
          <div className="px-1">
            <div className="flex justify-between items-center mb-3">
              {category && (
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full animate-pulse"></div>
                  <span className="text-primary font-black text-[10px] uppercase tracking-[0.4em] block">
                    {category}
                  </span>
                </div>
              )}
              <div className="bg-primary/10 px-2 py-0.5 rounded text-primary text-[8px] font-black tracking-widest uppercase">
                {progress}% Lido
              </div>
            </div>
            {title && (
              <h1 className="font-headline font-extrabold text-3xl md:text-5xl leading-tight text-on-surface mb-6 tracking-tighter">
                {title}
              </h1>
            )}
            <div className="flex items-center gap-4 text-on-surface-variant/40 text-[9px] font-black uppercase tracking-[0.2em]">
              <span>Arquivo Sagrado</span>
              <span className="w-1 h-1 bg-outline-variant/30 rounded-full"></span>
              <span>{new Date().toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
          <div className="h-[1px] w-full bg-gradient-to-r from-primary/30 via-outline-variant/10 to-transparent mt-8" />
        </header>
      )}

      {/* Conteúdo do Markdown */}
      <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-headings:font-headline prose-headings:tracking-tight prose-li:marker:text-primary">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {parsedContent}
        </ReactMarkdown>
      </div>
    </div>
  );
};
