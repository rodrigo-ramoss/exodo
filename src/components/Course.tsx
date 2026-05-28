import { useMemo, useState } from 'react';
import { BookOpen, GraduationCap, Info, Lock, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MarkdownViewer } from './MarkdownViewer';

type CourseDoc = {
  slug: string;
  title: string;
  description: string;
  content: string;
  relativePath: string;
  moduleNumber: number | null;
  isDescription: boolean;
};

const CONTENT_FILE_EXTENSION_REGEX = /\.(?:md|mdx|markdown|ya?ml)$/i;

const courseModules = {
  ...import.meta.glob('/public/content/curso/**/*.md', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/curso/**/*.mdx', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/curso/**/*.yaml', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/public/content/curso/**/*.yml', { eager: true, query: '?raw', import: 'default' }),
} as Record<string, string>;

function parseFrontmatter(markdown: string): Record<string, string> {
  const normalized = markdown.replace(/^\uFEFF/, '').trimStart();
  const match = normalized.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---/);
  if (!match) return {};

  const result: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const entry = line.match(/^\s*([\p{L}_][\p{L}\p{N}_-]*)\s*:\s*(.*?)\s*$/u);
    if (!entry) continue;
    const key = entry[1].toLowerCase();
    result[key] = entry[2].replace(/^["']|["']$/g, '');
  }
  return result;
}

function removeFrontmatter(markdown: string): string {
  const normalized = markdown.replace(/^\uFEFF/, '').trimStart();
  return normalized.replace(/^---\s*[\r\n]+[\s\S]*?[\r\n]+---\s*[\r\n]*/m, '');
}

function toRelativeCoursePath(pathKey: string): string {
  const normalized = pathKey.replace(/\\/g, '/');
  const marker = '/public/content/curso/';
  const idx = normalized.indexOf(marker);
  if (idx < 0) return normalized;
  return normalized.slice(idx + marker.length);
}

function toTitleCase(raw: string): string {
  return raw
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function detectTitle(pathKey: string, markdown: string): string {
  const frontmatter = parseFrontmatter(markdown);
  const fromMeta = (frontmatter.title || '').trim();
  if (fromMeta) return fromMeta;

  const heading = removeFrontmatter(markdown)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => /^#\s+/.test(line));
  if (heading) return heading.replace(/^#\s+/, '').trim();

  const fileName = pathKey.replace(/\\/g, '/').split('/').pop() || 'Curso';
  return toTitleCase(fileName.replace(CONTENT_FILE_EXTENSION_REGEX, ''));
}

function detectDescription(markdown: string): string {
  const frontmatter = parseFrontmatter(markdown);
  const fromMeta = (frontmatter.description || '').trim();
  if (fromMeta) return fromMeta;

  const paragraph = removeFrontmatter(markdown)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith('#') && !line.startsWith('*') && !line.startsWith('-'));

  if (!paragraph) return 'Conteúdo do curso disponível para leitura.';
  return paragraph.length > 220 ? `${paragraph.slice(0, 217)}...` : paragraph;
}

function detectModuleNumber(relativePath: string): number | null {
  const normalized = relativePath
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const match = normalized.match(/modulo\s*(\d+)/);
  if (!match) return null;
  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function discoverCourseDocs(): CourseDoc[] {
  const list: CourseDoc[] = [];

  for (const [pathKey, content] of Object.entries(courseModules)) {
    const relativePath = toRelativeCoursePath(pathKey);
    const slug = relativePath.replace(CONTENT_FILE_EXTENSION_REGEX, '');
    list.push({
      slug,
      title: detectTitle(pathKey, content),
      description: detectDescription(content),
      content: content.replace(/^\uFEFF/, ''),
      relativePath,
      moduleNumber: detectModuleNumber(relativePath),
      isDescription: relativePath.toLowerCase().includes('descricao/'),
    });
  }

  return list.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
}

export default function Course() {
  const docs = useMemo(() => discoverCourseDocs(), []);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [selectedLessonSlug, setSelectedLessonSlug] = useState<string | null>(null);

  const descriptionDoc = useMemo(
    () => docs.find((doc) => doc.isDescription) ?? null,
    [docs],
  );

  const module1Doc = useMemo(
    () => docs.find((doc) => doc.moduleNumber === 1 && !doc.isDescription) ?? null,
    [docs],
  );

  const selectedLesson = useMemo(
    () => docs.find((doc) => doc.slug === selectedLessonSlug) ?? null,
    [docs, selectedLessonSlug],
  );

  if (selectedLesson) {
    return (
      <MarkdownViewer
        content={selectedLesson.content}
        slug={`curso/${selectedLesson.slug}`}
        onClose={() => setSelectedLessonSlug(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-surface-container-lowest pb-24">
      <div className="pt-6 sm:pt-8 px-4 sm:px-6">
        <header className="rounded-3xl border border-primary/25 bg-gradient-to-br from-[#1f1a15] via-[#141210] to-[#0e0e0e] p-5 sm:p-7 shadow-[0_20px_48px_rgba(0,0,0,0.48)]">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-3 py-1">
            <GraduationCap size={13} className="text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Curso</span>
          </div>
          <h1 className="mt-2 font-headline text-3xl sm:text-5xl font-black tracking-tighter text-primary">
            O Conselho Divino
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-on-surface-variant max-w-3xl">
            Formação bíblica em módulos para aprofundar a leitura das Escrituras com base profética, apostólica e pastoral.
          </p>
        </header>
      </div>

      <section className="px-4 sm:px-6 mt-4 sm:mt-6">
        <article className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 sm:p-5">
          <h2 className="font-headline text-lg sm:text-xl font-black tracking-tight text-on-surface">
            Curso: O Conselho Divino
          </h2>
          <p className="mt-1 text-[11px] sm:text-xs text-on-surface-variant/80">
            Imersão teológica para compreender o governo celestial, o conselho divino e suas implicações para a igreja.
          </p>
          <button
            type="button"
            onClick={() => setIsInfoOpen(true)}
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-[#D4AF37]/55 bg-[#D4AF37]/18 px-3 py-2 text-[10px] sm:text-xs font-black uppercase tracking-[0.14em] text-[#F5D76E] hover:bg-[#D4AF37]/24 transition-colors"
          >
            <Info size={13} />
            Saber mais
          </button>
        </article>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5].map((moduleNumber) => {
            const isReady = moduleNumber === 1;
            const isLessonAvailable = isReady && Boolean(module1Doc);
            return (
              <article
                key={moduleNumber}
                className={`rounded-2xl border p-4 sm:p-5 ${
                  isReady
                    ? 'border-[#D4AF37]/35 bg-surface-container-low shadow-[0_12px_34px_rgba(0,0,0,0.20)]'
                    : 'border-outline-variant/20 bg-black/20'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-headline text-base sm:text-lg font-black tracking-tight text-on-surface">
                    Módulo {moduleNumber}
                  </h3>
                  <span
                    className={`text-[10px] font-black uppercase tracking-[0.14em] px-2 py-1 rounded-full ${
                      isReady
                        ? 'bg-[#D4AF37]/20 text-[#F5D76E] border border-[#D4AF37]/40'
                        : 'bg-black/35 text-on-surface-variant border border-outline-variant/30'
                    }`}
                  >
                    {isReady ? 'Disponível' : 'Em preparação'}
                  </span>
                </div>

                {isReady ? (
                  <>
                    <p className="mt-2 text-[11px] sm:text-xs text-on-surface-variant/80">
                      Aulas 1 a 3
                    </p>
                    <div className="mt-3 space-y-2">
                      <button
                        type="button"
                        onClick={() => isLessonAvailable && setSelectedLessonSlug(module1Doc!.slug)}
                        disabled={!isLessonAvailable}
                        className={`w-full rounded-xl border px-3 py-2.5 text-left transition-colors ${
                          isLessonAvailable
                            ? 'border-[#D4AF37]/45 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/18'
                            : 'border-outline-variant/20 bg-black/15 cursor-not-allowed opacity-70'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <BookOpen size={13} className="text-primary shrink-0" />
                          <p className="text-xs sm:text-sm font-black text-on-surface">Aula 1 — O Conselho Divino</p>
                        </div>
                      </button>

                      <div className="w-full rounded-xl border border-outline-variant/20 bg-black/15 px-3 py-2.5">
                        <p className="text-xs sm:text-sm font-semibold text-on-surface-variant">Aula 2 — Em preparação</p>
                      </div>

                      <div className="w-full rounded-xl border border-outline-variant/20 bg-black/15 px-3 py-2.5">
                        <p className="text-xs sm:text-sm font-semibold text-on-surface-variant">Aula 3 — Em preparação</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-outline-variant/30 bg-black/25 px-3 py-2 text-[11px] sm:text-xs font-semibold text-on-surface-variant">
                    <Lock size={13} />
                    Conteúdo em preparação
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {isInfoOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 px-3 sm:px-4">
          <div className="w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl border border-[#D4AF37]/40 bg-[#0f0f0f] shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
            <div className="flex items-center justify-between gap-3 border-b border-[#D4AF37]/25 px-4 py-3">
              <h3 className="font-headline text-sm sm:text-base font-black tracking-tight text-primary">
                Mais informações do curso
              </h3>
              <button
                type="button"
                onClick={() => setIsInfoOpen(false)}
                className="inline-flex items-center gap-1 rounded-lg border border-[#D4AF37]/35 bg-[#D4AF37]/12 px-2.5 py-1.5 text-[10px] sm:text-xs font-black uppercase tracking-[0.14em] text-[#F5D76E] hover:bg-[#D4AF37]/20 transition-colors"
              >
                <X size={13} />
                Fechar
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(85vh-64px)] px-4 py-4 prose prose-invert prose-sm max-w-none">
              {descriptionDoc ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {removeFrontmatter(descriptionDoc.content)}
                </ReactMarkdown>
              ) : (
                <p>Descrição do curso não encontrada em `public/content/curso/descricao/descricao.md`.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
