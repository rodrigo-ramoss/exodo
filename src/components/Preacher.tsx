import { useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, NotebookPen } from 'lucide-react';
import { MarkdownViewer } from './MarkdownViewer';

type SermonItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  format: 'markdown' | 'html';
};

const CONTENT_FILE_EXTENSION_REGEX = /\.(?:md|mdx|markdown|ya?ml|html?)$/i;
const MARKDOWN_FILE_EXTENSION_REGEX = /\.(?:md|mdx|markdown|ya?ml)$/i;

const preacherMarkdownModules = {
  ...import.meta.glob('/public/content/pregador/**/*.md', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/pregador/**/*.mdx', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/pregador/**/*.yaml', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/pregador/**/*.yml', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/pregador/**/*.html', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/pregador/**/*.htm', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/pregadores/**/*.md', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/pregadores/**/*.mdx', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/pregadores/**/*.yaml', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/pregadores/**/*.yml', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/pregadores/**/*.html', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/pregadores/**/*.htm', { eager: true, query: '?raw', import: 'default' }),
} as Record<string, string>;

function titleCase(raw: string): string {
  return raw
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function parseFrontmatter(markdown: string): Record<string, string> {
  const normalized = markdown.replace(/^\uFEFF/, '').trimStart();
  const match = normalized.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---/);
  if (!match) return {};

  const result: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const entry = line.match(/^\s*([A-Za-z_][\w-]*)\s*:\s*(.*?)\s*$/);
    if (!entry) continue;
    result[entry[1].toLowerCase()] = entry[2].replace(/^["']|["']$/g, '');
  }
  return result;
}

function removeFrontmatter(markdown: string): string {
  const normalized = markdown.replace(/^\uFEFF/, '').trimStart();
  return normalized.replace(/^---\s*[\r\n]+[\s\S]*?[\r\n]+---\s*[\r\n]*/m, '');
}

function toRelativePreacherPath(pathKey: string): string {
  const normalized = pathKey.replace(/\\/g, '/');
  const markers = ['/public/content/pregador/', '/public/content/pregadores/'];
  const marker = markers.find((item) => normalized.includes(item));
  if (!marker) return normalized;
  return normalized.slice(normalized.indexOf(marker) + marker.length);
}

function detectTitle(pathKey: string, markdown: string): string {
  const normalizedPath = pathKey.replace(/\\/g, '/').toLowerCase();
  if (/\.html?$/.test(normalizedPath)) {
    const htmlTitle = markdown.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim();
    if (htmlTitle) return htmlTitle;
    const h1Title = markdown.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, '').trim();
    if (h1Title) return h1Title;
  }

  const fm = parseFrontmatter(markdown);
  const fromMeta = (fm.title || '').trim();
  if (fromMeta) return fromMeta;

  const heading = removeFrontmatter(markdown)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => /^#\s+/.test(line));
  if (heading) return heading.replace(/^#\s+/, '').trim();

  const normalized = pathKey.replace(/\\/g, '/');
  const fileName = normalized.split('/').pop() || 'sermao';
  return titleCase(fileName.replace(CONTENT_FILE_EXTENSION_REGEX, ''));
}

function buildDescription(markdown: string): string {
  const htmlDescription = markdown.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1]?.trim();
  if (htmlDescription) return htmlDescription;

  const firstHtmlParagraph = markdown
    .match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1]
    ?.replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (firstHtmlParagraph) {
    return firstHtmlParagraph.length > 180 ? `${firstHtmlParagraph.slice(0, 177)}...` : firstHtmlParagraph;
  }

  const fm = parseFrontmatter(markdown);
  const fromMeta = (fm.description || '').trim();
  if (fromMeta) return fromMeta;

  const firstParagraph = removeFrontmatter(markdown)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith('#') && !line.startsWith('>') && !line.startsWith('-') && !line.startsWith('*'));

  if (!firstParagraph) return 'Sermão disponível para apoio na pregação.';
  return firstParagraph.length > 180 ? `${firstParagraph.slice(0, 177)}...` : firstParagraph;
}

function discoverSermons(): SermonItem[] {
  const list: SermonItem[] = [];
  for (const [pathKey, content] of Object.entries(preacherMarkdownModules)) {
    const relativePath = toRelativePreacherPath(pathKey);
    const slug = relativePath.replace(CONTENT_FILE_EXTENSION_REGEX, '');
    const format: SermonItem['format'] = MARKDOWN_FILE_EXTENSION_REGEX.test(relativePath) ? 'markdown' : 'html';
    list.push({
      id: slug,
      slug,
      title: detectTitle(pathKey, content),
      description: buildDescription(content),
      content: content.replace(/^\uFEFF/, ''),
      format,
    });
  }

  return list.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR', { numeric: true }));
}

export default function Preacher() {
  const sermons = useMemo(() => discoverSermons(), []);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const selected = useMemo(
    () => sermons.find((item) => item.slug === selectedSlug) ?? null,
    [sermons, selectedSlug],
  );

  if (selected?.format === 'html') {
    return (
      <div className="min-h-screen bg-surface-container-lowest pb-6">
        <div className="sticky top-0 z-20 border-b border-primary/25 bg-[#11110f]/95 backdrop-blur px-4 sm:px-6 py-3">
          <div className="mx-auto max-w-6xl flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedSlug(null)}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/35 bg-primary/10 px-3 py-1 text-[10px] sm:text-xs font-black uppercase tracking-[0.16em] text-primary hover:bg-primary/15 transition-colors"
            >
              <ArrowLeft size={12} />
              Voltar
            </button>
            <p className="text-[11px] sm:text-sm font-semibold text-on-surface line-clamp-1">{selected.title}</p>
          </div>
        </div>

        <div className="px-4 sm:px-6 pt-4">
          <iframe
            title={selected.title}
            srcDoc={selected.content}
            className="w-full h-[calc(100vh-130px)] rounded-2xl border border-primary/20 bg-white"
          />
        </div>
      </div>
    );
  }

  if (selected) {
    return (
      <MarkdownViewer
        content={selected.content}
        slug={`pregador/${selected.slug}`}
        category="pregador"
        onClose={() => setSelectedSlug(null)}
      />
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-surface-container-lowest">
      <div className="pt-6 sm:pt-8 px-4 sm:px-6 mb-4 sm:mb-6">
        <header className="rounded-3xl border border-primary/25 bg-gradient-to-br from-[#1f1a15] via-[#141210] to-[#0e0e0e] p-5 sm:p-7 shadow-[0_20px_48px_rgba(0,0,0,0.48)]">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-3 py-1">
            <NotebookPen size={13} className="text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Pregador</span>
          </div>
          <h1 className="mt-2 font-headline text-3xl sm:text-5xl font-black tracking-tighter text-primary">
            Espaço do Pregador
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-on-surface-variant max-w-3xl">
            Sermões para estudar, para pregar e para usar na sua igreja.
          </p>
          <p className="mt-1 text-[11px] sm:text-xs text-on-surface-variant/85 max-w-3xl">
            Aqui terá apenas alguns sermões para ajudar na pregação.
          </p>
        </header>
      </div>

      <section className="px-4 sm:px-6 grid grid-cols-1 gap-3 sm:gap-4">
        <article className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-3 sm:p-4">
          <h2 className="font-headline text-lg sm:text-xl font-black tracking-tight text-on-surface">
            Sermões disponíveis para pregação
          </h2>
          <p className="mt-1 text-[11px] text-on-surface-variant/75">
            Selecione um sermão para abrir e estudar.
          </p>

          <div className="mt-3 space-y-2">
            {sermons.length === 0 ? (
              <div className="rounded-xl border border-outline-variant/20 bg-black/15 px-3 py-4 text-xs text-on-surface-variant/80">
                Nenhum sermão disponível no momento.
              </div>
            ) : (
              sermons.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedSlug(item.slug)}
                  className="w-full rounded-xl border border-outline-variant/25 bg-black/15 px-3 py-2.5 text-left hover:border-primary/35 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen size={13} className="text-primary shrink-0" />
                    <p className="font-headline text-sm font-black tracking-tight text-on-surface line-clamp-1">
                      {item.title}
                    </p>
                  </div>
                  <p className="mt-1 text-[10px] text-on-surface-variant/70 line-clamp-2">
                    {item.description}
                  </p>
                </button>
              ))
            )}
          </div>
        </article>

        <aside className="rounded-2xl border border-[#D4AF37]/28 bg-[#D4AF37]/8 px-4 py-3">
          <p className="text-[11px] sm:text-xs font-semibold leading-relaxed text-on-surface">
            Observação: este não é um catálogo de sermões prontos vendidos na internet ou gerados apenas para venda.
            Este é um espaço sério, por isso os sermões são adicionados aos poucos. O foco principal da plataforma
            continua sendo o estudo bíblico para que cada pessoa desenvolva seus próprios sermões. Estes materiais
            servem como apoio, especialmente quando faltar tempo.
          </p>
        </aside>
      </section>
    </div>
  );
}
