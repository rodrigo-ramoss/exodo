import { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowLeft,
  Eye,
  FilePlus2,
  FileText,
  Highlighter,
  Italic,
  List,
  ListOrdered,
  NotebookPen,
  Quote,
  Save,
  Trash2,
  Type,
} from 'lucide-react';
import { MarkdownViewer } from './MarkdownViewer';

type StoredSermon = {
  id: string;
  slug: string;
  content: string;
  updatedAt: number;
};

type SermonItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  updatedAt: number;
  isBuiltin: boolean;
};

type ReaderState = {
  slug: string;
  content: string;
} | null;

const BUILTIN_PREFIX = 'builtin:';
const CUSTOM_PREFIX = 'custom:';
const STORAGE_DRAFTS_KEY = 'exodo_pregador_drafts_v1';
const STORAGE_CUSTOM_KEY = 'exodo_pregador_custom_v1';
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

function buildDescription(markdown: string): string {
  const body = removeFrontmatter(markdown);
  const firstParagraph = body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith('#') && !line.startsWith('*') && !line.startsWith('-') && !line.startsWith('>'));
  if (!firstParagraph) return 'Sermão em preparação.';
  return firstParagraph.length > 180 ? `${firstParagraph.slice(0, 177)}...` : firstParagraph;
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
  const fileName = normalized.split('/').pop() || 'novo-sermao';
  return titleCase(fileName.replace(CONTENT_FILE_EXTENSION_REGEX, ''));
}

function slugify(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function toRelativePreacherPath(pathKey: string): string {
  const normalized = pathKey.replace(/\\/g, '/');
  const marker = '/public/content/pregador/';
  const idx = normalized.indexOf(marker);
  if (idx < 0) return normalized;
  return normalized.slice(idx + marker.length);
}

function discoverBuiltinSermons(): SermonItem[] {
  const list: SermonItem[] = [];

  for (const [pathKey, content] of Object.entries(preacherMarkdownModules)) {
    const relativePath = toRelativePreacherPath(pathKey);
    const slug = relativePath.replace(CONTENT_FILE_EXTENSION_REGEX, '');
    const title = detectTitle(pathKey, content);
    const description = parseFrontmatter(content).description?.trim() || buildDescription(content);

    list.push({
      id: `${BUILTIN_PREFIX}${slug}`,
      slug,
      title,
      description,
      content: content.replace(/^\uFEFF/, ''),
      updatedAt: 0,
      isBuiltin: true,
    });
  }

  return list.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
}

function loadStoredSermons(key: string): StoredSermon[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item.id === 'string' && typeof item.slug === 'string' && typeof item.content === 'string')
      .map((item) => ({
        id: item.id,
        slug: item.slug,
        content: item.content,
        updatedAt: Number.isFinite(item.updatedAt) ? item.updatedAt : Date.now(),
      }));
  } catch {
    return [];
  }
}

function buildCustomTemplate(order: number): string {
  const now = new Date().toLocaleDateString('pt-BR');
  return `---\ntitle: \"Novo Sermão ${order}\"\ndescription: \"Rascunho do pregador.\"\nseção: pregador\ndate: \"${now}\"\n---\n\n# Novo Sermão ${order}\n\n## Texto-base\n\n- Referência principal:\n- Tema central:\n\n## Esboço\n\n1. Introdução\n2. Desenvolvimento\n3. Aplicação\n4. Conclusão\n\n## Notas rápidas\n\n- \n`;
}

function applyWrap(textarea: HTMLTextAreaElement, prefix: string, suffix = prefix): string {
  const { selectionStart, selectionEnd, value } = textarea;
  const selected = value.slice(selectionStart, selectionEnd);
  const nextValue = `${value.slice(0, selectionStart)}${prefix}${selected}${suffix}${value.slice(selectionEnd)}`;
  const caret = selectionStart + prefix.length + selected.length + suffix.length;
  window.requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(caret, caret);
  });
  return nextValue;
}

function applyInsert(textarea: HTMLTextAreaElement, inserted: string): string {
  const { selectionStart, selectionEnd, value } = textarea;
  const nextValue = `${value.slice(0, selectionStart)}${inserted}${value.slice(selectionEnd)}`;
  const caret = selectionStart + inserted.length;
  window.requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(caret, caret);
  });
  return nextValue;
}

export default function Preacher() {
  const builtinSermons = useMemo(() => discoverBuiltinSermons(), []);
  const builtinById = useMemo(
    () => new Map(builtinSermons.map((item) => [item.id, item])),
    [builtinSermons],
  );

  const [drafts, setDrafts] = useState<StoredSermon[]>(() => loadStoredSermons(STORAGE_DRAFTS_KEY));
  const [customSermons, setCustomSermons] = useState<StoredSermon[]>(() => loadStoredSermons(STORAGE_CUSTOM_KEY));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [dirty, setDirty] = useState(false);
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview'>('edit');
  const [readerState, setReaderState] = useState<ReaderState>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_DRAFTS_KEY, JSON.stringify(drafts));
  }, [drafts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_CUSTOM_KEY, JSON.stringify(customSermons));
  }, [customSermons]);

  const sermons = useMemo(() => {
    const draftMap = new Map(drafts.map((item) => [item.id, item]));
    const customItems: SermonItem[] = customSermons.map((item) => ({
      id: item.id,
      slug: item.slug,
      title: detectTitle(item.slug, item.content),
      description: parseFrontmatter(item.content).description?.trim() || buildDescription(item.content),
      content: item.content,
      updatedAt: item.updatedAt,
      isBuiltin: false,
    }));

    const builtinItems = builtinSermons.map((item) => {
      const override = draftMap.get(item.id);
      if (!override) return item;
      return {
        ...item,
        content: override.content,
        title: detectTitle(item.slug, override.content),
        description: parseFrontmatter(override.content).description?.trim() || buildDescription(override.content),
        updatedAt: override.updatedAt,
      };
    });

    const merged = [...customItems, ...builtinItems];
    return merged.sort((a, b) => {
      if (a.updatedAt !== b.updatedAt) return b.updatedAt - a.updatedAt;
      return a.title.localeCompare(b.title, 'pt-BR');
    });
  }, [builtinSermons, customSermons, drafts]);

  const selected = useMemo(
    () => sermons.find((item) => item.id === selectedId) ?? null,
    [sermons, selectedId],
  );

  useEffect(() => {
    if (!sermons.length) {
      setSelectedId(null);
      setEditorContent('');
      setDirty(false);
      return;
    }
    if (!selectedId || !sermons.some((item) => item.id === selectedId)) {
      const first = sermons[0];
      if (!first) return;
      setSelectedId(first.id);
      setEditorContent(first.content);
      setDirty(false);
    }
  }, [selectedId, sermons]);

  const selectSermon = (nextId: string) => {
    const next = sermons.find((item) => item.id === nextId);
    if (!next) return;
    if (dirty && !window.confirm('Você tem alterações não salvas. Deseja descartar e trocar de sermão?')) return;
    setSelectedId(next.id);
    setEditorContent(next.content);
    setDirty(false);
    setPreviewMode('edit');
  };

  const createCustomSermon = () => {
    const order = customSermons.length + 1;
    const now = Date.now();
    const title = `novo-sermao-${order}-${now}`;
    const slug = `rascunhos/${slugify(title)}`;
    const item: StoredSermon = {
      id: `${CUSTOM_PREFIX}${now}`,
      slug,
      content: buildCustomTemplate(order),
      updatedAt: now,
    };
    setCustomSermons((prev) => [item, ...prev]);
    setSelectedId(item.id);
    setEditorContent(item.content);
    setDirty(false);
    setPreviewMode('edit');
  };

  const saveCurrent = () => {
    if (!selected) return;
    const now = Date.now();
    const next: StoredSermon = {
      id: selected.id,
      slug: selected.slug,
      content: editorContent.trim() ? `${editorContent.trimEnd()}\n` : '',
      updatedAt: now,
    };

    if (selected.isBuiltin) {
      setDrafts((prev) => {
        const others = prev.filter((item) => item.id !== selected.id);
        return [next, ...others];
      });
    } else {
      setCustomSermons((prev) => {
        const others = prev.filter((item) => item.id !== selected.id);
        return [next, ...others];
      });
    }
    setDirty(false);
  };

  const restoreBuiltin = () => {
    if (!selected || !selected.isBuiltin) return;
    const original = builtinById.get(selected.id);
    if (!original) return;
    setDrafts((prev) => prev.filter((item) => item.id !== selected.id));
    setEditorContent(original.content);
    setDirty(false);
  };

  const removeCustom = () => {
    if (!selected || selected.isBuiltin) return;
    if (!window.confirm('Deseja excluir este sermão personalizado?')) return;
    setCustomSermons((prev) => prev.filter((item) => item.id !== selected.id));
    setDirty(false);
  };

  const withTextarea = (apply: (textarea: HTMLTextAreaElement) => string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const next = apply(textarea);
    setEditorContent(next);
    setDirty(true);
  };

  const openStudyMode = () => {
    if (!selected) return;
    setReaderState({
      slug: `pregador/${selected.slug}`,
      content: editorContent,
    });
  };

  if (readerState) {
    return (
      <MarkdownViewer
        content={readerState.content}
        slug={readerState.slug}
        category="pregador"
        onClose={() => setReaderState(null)}
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
          <h1 className="mt-2 font-headline text-3xl sm:text-5xl font-black tracking-tighter text-primary">Espaço do Sermão</h1>
          <p className="mt-2 text-xs sm:text-sm text-on-surface-variant max-w-3xl">
            Escreva, revise e estude seus sermões em Markdown. Use o modo de estudo para destacar trechos e salvar notas.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={createCustomSermon}
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary/45 bg-primary/15 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/25 transition-colors"
            >
              <FilePlus2 size={13} />
              Novo sermão
            </button>
            {selected && (
              <button
                type="button"
                onClick={openStudyMode}
                className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant/40 bg-black/25 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:text-primary hover:border-primary/45 transition-colors"
              >
                <Eye size={13} />
                Modo estudo e notas
              </button>
            )}
          </div>
        </header>
      </div>

      <section className="px-4 sm:px-6 grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-3 sm:gap-4">
        <aside className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-3 sm:p-4">
          <h2 className="font-headline text-lg sm:text-xl font-black tracking-tight text-on-surface">Sermões</h2>
          <p className="mt-1 text-[11px] text-on-surface-variant/75">Abra um sermão para editar ou criar um novo rascunho.</p>

          <div className="mt-3 space-y-2 max-h-[55vh] overflow-y-auto pr-1">
            {sermons.length === 0 ? (
              <p className="rounded-xl border border-outline-variant/20 bg-black/15 px-3 py-3 text-xs text-on-surface-variant/75">
                Nenhum sermão disponível ainda.
              </p>
            ) : (
              sermons.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectSermon(item.id)}
                  className={`w-full text-left rounded-xl border px-3 py-2.5 transition-colors ${
                    selectedId === item.id
                      ? 'border-primary/55 bg-primary/10'
                      : 'border-outline-variant/25 bg-black/15 hover:border-primary/35'
                  }`}
                >
                  <p className="font-headline text-sm font-black tracking-tight text-on-surface line-clamp-2">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-[10px] text-on-surface-variant/70 line-clamp-2">{item.description}</p>
                  <div className="mt-1.5 flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-bold text-on-surface-variant/60">
                    <span>{item.isBuiltin ? 'MD base' : 'Rascunho'}</span>
                    {item.updatedAt > 0 && (
                      <>
                        <span>•</span>
                        <span>{new Date(item.updatedAt).toLocaleDateString('pt-BR')}</span>
                      </>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        <article className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-3 sm:p-4">
          {!selected ? (
            <div className="rounded-xl border border-outline-variant/20 bg-black/15 px-4 py-6 text-center">
              <p className="text-sm font-semibold text-on-surface-variant">Selecione um sermão para começar.</p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-headline text-xl sm:text-2xl font-black tracking-tight text-on-surface">
                    {detectTitle(selected.slug, editorContent)}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-on-surface-variant/70">
                    {selected.isBuiltin ? 'Sermão importado de arquivo .md' : 'Rascunho local do pregador'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPreviewMode('edit')}
                    className={`rounded-lg px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider ${
                      previewMode === 'edit' ? 'bg-primary text-on-primary' : 'bg-black/20 text-on-surface-variant'
                    }`}
                  >
                    Editor
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode('preview')}
                    className={`rounded-lg px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider ${
                      previewMode === 'preview' ? 'bg-primary text-on-primary' : 'bg-black/20 text-on-surface-variant'
                    }`}
                  >
                    Preview
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => withTextarea((textarea) => applyWrap(textarea, '**'))}
                  className="rounded-lg border border-outline-variant/30 bg-black/20 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-on-surface-variant hover:text-primary"
                >
                  <Type size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => withTextarea((textarea) => applyWrap(textarea, '*'))}
                  className="rounded-lg border border-outline-variant/30 bg-black/20 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-on-surface-variant hover:text-primary"
                >
                  <Italic size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => withTextarea((textarea) => applyInsert(textarea, '\n- '))}
                  className="rounded-lg border border-outline-variant/30 bg-black/20 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-on-surface-variant hover:text-primary"
                >
                  <List size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => withTextarea((textarea) => applyInsert(textarea, '\n1. '))}
                  className="rounded-lg border border-outline-variant/30 bg-black/20 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-on-surface-variant hover:text-primary"
                >
                  <ListOrdered size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => withTextarea((textarea) => applyInsert(textarea, '\n> '))}
                  className="rounded-lg border border-outline-variant/30 bg-black/20 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-on-surface-variant hover:text-primary"
                >
                  <Quote size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => withTextarea((textarea) => applyWrap(textarea, '<mark>', '</mark>'))}
                  className="rounded-lg border border-outline-variant/30 bg-black/20 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-on-surface-variant hover:text-primary"
                >
                  <Highlighter size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => withTextarea((textarea) => applyInsert(textarea, '\n→ '))}
                  className="rounded-lg border border-outline-variant/30 bg-black/20 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-on-surface-variant hover:text-primary"
                >
                  →
                </button>
              </div>

              {previewMode === 'edit' ? (
                <textarea
                  ref={textareaRef}
                  value={editorContent}
                  onChange={(event) => {
                    setEditorContent(event.target.value);
                    setDirty(true);
                  }}
                  className="mt-3 w-full min-h-[58vh] rounded-xl border border-outline-variant/25 bg-black/20 px-3 py-3 text-sm leading-relaxed text-on-surface focus:outline-none focus:border-primary/45"
                  spellCheck={false}
                />
              ) : (
                <div className="mt-3 min-h-[58vh] rounded-xl border border-outline-variant/25 bg-black/20 px-4 py-4 overflow-y-auto prose prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {editorContent}
                  </ReactMarkdown>
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant/70">
                  {dirty ? 'Alterações não salvas' : 'Tudo salvo'}
                </div>
                <div className="flex items-center gap-2">
                  {selected.isBuiltin ? (
                    <button
                      type="button"
                      onClick={restoreBuiltin}
                      className="inline-flex items-center gap-1 rounded-lg border border-outline-variant/30 bg-black/20 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-on-surface-variant hover:text-primary"
                    >
                      <ArrowLeft size={12} />
                      Restaurar base
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={removeCustom}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-400/35 bg-red-950/20 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-red-200 hover:bg-red-900/30"
                    >
                      <Trash2 size={12} />
                      Excluir
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={saveCurrent}
                    className="inline-flex items-center gap-1 rounded-lg border border-primary/45 bg-primary/15 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-primary hover:bg-primary/25"
                  >
                    <Save size={12} />
                    Salvar
                  </button>
                  <button
                    type="button"
                    onClick={openStudyMode}
                    className="inline-flex items-center gap-1 rounded-lg border border-outline-variant/30 bg-black/20 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-on-surface-variant hover:text-primary"
                  >
                    <FileText size={12} />
                    Estudar
                  </button>
                </div>
              </div>
            </>
          )}
        </article>
      </section>
    </div>
  );
}
