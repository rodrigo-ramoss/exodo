import React from 'react';

interface MarkdownViewerProps {
  content: string;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content }) => {
  const renderMarkdown = (text: string) => {
    // Basic regex-based markdown parser
    let html = text
      // Headings
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4 text-primary">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mb-3 text-on-surface">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mb-2 text-on-surface">$1</h3>')
      // Bold
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      // Blockquotes
      .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-primary pl-4 italic my-4 text-on-surface-variant">$1</blockquote>')
      // Lists
      .replace(/^\- (.*$)/gim, '<li class="ml-4 list-disc text-on-surface-variant">$1</li>')
      // Paragraphs (split by double newlines)
      .split('\n\n')
      .map(p => {
        if (p.startsWith('<h') || p.startsWith('<blockquote') || p.startsWith('<li')) {
          return p;
        }
        return `<p class="mb-4 text-on-surface-variant leading-relaxed">${p}</p>`;
      })
      .join('');

    return { __html: html };
  };

  return (
    <div 
      className="markdown-content"
      dangerouslySetInnerHTML={renderMarkdown(content)} 
    />
  );
};
