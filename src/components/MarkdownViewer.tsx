import React from 'react';
import matter from 'gray-matter';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownViewerProps {
  content: string;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content }) => {
  // gray-matter can be tricky in the browser, so we'll use a simple fallback
  // if matter() fails or if we want to avoid Buffer polyfill issues.
  let parsedContent = content;
  let metadata: any = {};

  try {
    // Attempt to use gray-matter
    const { data, content: body } = matter(content);
    metadata = data;
    parsedContent = body;
  } catch (err) {
    console.warn('gray-matter failed, attempting manual parse:', err);
    const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
    if (match) {
      const yamlStr = match[1];
      parsedContent = match[2];
      
      // Basic YAML-like parser for simple key-value pairs
      yamlStr.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length > 0) {
          const value = valueParts.join(':').trim().replace(/^["'](.*)["']$/, '$1');
          metadata[key.trim()] = value;
        }
      });
    }
  }

  const { title, category, image } = metadata;

  return (
    <div className="flex flex-col gap-8 max-w-none w-full">
      {/* Capa do Artigo */}
      {(title || category) && (
        <header className="mb-4 w-full pt-2">
          <div className="px-1">
            {category && (
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-1 bg-primary rounded-full animate-pulse"></div>
                <span className="text-primary font-black text-[10px] uppercase tracking-[0.4em] block">
                  {category}
                </span>
              </div>
            )}
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
