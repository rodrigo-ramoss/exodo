import { useMemo, useState } from 'react';
import { BookOpen, NotebookPen } from 'lucide-react';
import { MarkdownViewer } from './MarkdownViewer';

type SermonItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
};

const CONTENT_FILE_EXTENSION_REGEX = /\.(?:md|mdx|markdown|ya?ml)$/i;

const preacherMarkdownModules = {
  ...import.meta.glob('/public/content/pregador/**/*.md', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/pregador/**/*.mdx', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/pregador/**/*.yaml', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/pregador/**/*.yml', { eager: true, query: '?raw', import: 'default' }),
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
  const marker = '/public/content/pregador/';
  const idx = normalized.indexOf(marker);
  if (idx < 0) return normalized;
  return normalized.slice(idx + marker.length);
}

function detectTitle(pathKey: string, markdown: string): string {
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
    list.push({
      id: slug,
      slug,
      title: detectTitle(pathKey, content),
      description: buildDescription(content),
      content: content.replace(/^\uFEFF/, ''),
    });
  }

  return list.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
}

export default function Preacher() {
  const sermons = useMemo(() => discoverSermons(), []);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(sermons[0]?.slug ?? null);

  const selected = useMemo(
    () => sermons.find((item) => item.slug === selectedSlug) ?? null,
    [sermons, selectedSlug],
  );

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
            Lista de sermões disponíveis
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
