import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, Settings, Type, Sun, Moon, Coffee, X, Highlighter, Trash2, Pencil, FileText, PenLine } from 'lucide-react';
import type { Components } from 'react-markdown';
import { pm, type Category } from '../lib/progressManager';

// ── Highlight helpers ─────────────────────────────────────────────────────────
const HL_KEY = (slug: string) => `exodo_hl_${slug}`;
const NOTES_KEY = (slug: string) => `exodo_notes_${slug}`;

type ReaderNote = {
  id: string;
  text: string;
  note: string;
  createdAt: number;
  updatedAt: number;
};

function loadHighlights(slug: string): string[] {
  try {
    const raw = localStorage.getItem(HL_KEY(slug));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch { return []; }
}

function saveHighlights(slug: string, list: string[]): void {
  try { localStorage.setItem(HL_KEY(slug), JSON.stringify(list)); } catch { /* noop */ }
}

function loadNotes(slug: string): ReaderNote[] {
  try {
    const raw = localStorage.getItem(NOTES_KEY(slug));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item.id === 'string' && typeof item.text === 'string')
      .map((item) => ({
        id: item.id,
        text: item.text,
        note: typeof item.note === 'string' ? item.note : '',
        createdAt: Number.isFinite(item.createdAt) ? item.createdAt : Date.now(),
        updatedAt: Number.isFinite(item.updatedAt) ? item.updatedAt : Date.now(),
      }));
  } catch {
    return [];
  }
}

function saveNotes(slug: string, notes: ReaderNote[]): void {
  try {
    localStorage.setItem(NOTES_KEY(slug), JSON.stringify(notes));
  } catch {
    // noop
  }
}

/**
 * Caminha pelos nós de texto do elemento e envolve cada ocorrência de `text`
 * num <mark data-hl> com a classe dourada. Case-insensitive.
 */
function applyHighlightToDOM(root: HTMLElement, text: string): void {
  if (!text.trim()) return;
  const lower = text.toLowerCase();

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const p = node.parentElement;
      if (!p || p.tagName === 'MARK' || p.closest('button, input, textarea')) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const toWrap: { node: Text; idx: number }[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const textNode = node as Text;
    const idx = textNode.textContent?.toLowerCase().indexOf(lower) ?? -1;
    if (idx !== -1) toWrap.push({ node: textNode, idx });
  }

  // Process in reverse so insertions don't shift indices
  for (let i = toWrap.length - 1; i >= 0; i--) {
    const { node: textNode, idx } = toWrap[i]!;
    const content = textNode.textContent ?? '';
    const parent = textNode.parentNode;
    if (!parent) continue;

    const before = document.createTextNode(content.slice(0, idx));
    const mark = document.createElement('mark');
    mark.setAttribute('data-hl', text);
    mark.style.cssText =
      'background:rgba(212,175,55,0.35);color:inherit;border-radius:3px;padding:0 2px;cursor:pointer;';
    mark.textContent = content.slice(idx, idx + text.length);
    const after = document.createTextNode(content.slice(idx + text.length));

    parent.replaceChild(after, textNode);
    parent.insertBefore(mark, after);
    parent.insertBefore(before, mark);
  }
}

/** Remove todos os <mark data-hl> e restaura o texto plano */
function clearHighlightsFromDOM(root: HTMLElement): void {
  root.querySelectorAll('mark[data-hl]').forEach((mark) => {
    const parent = mark.parentNode;
    if (!parent) return;
    parent.replaceChild(document.createTextNode(mark.textContent ?? ''), mark);
    (parent as Element | Text).normalize?.();
  });
}

interface MarkdownViewerProps {
  content?: string | null;
  slug: string;
  category?: Category;
  onClose: () => void;
}

type ReadingTheme = 'dark' | 'light' | 'sepia';

type MarkdownMetadata = {
  title?: string;
  subcategory?: string;
};

const YAML_KEY_REGEX = /^[A-Za-z_][\w-]*\s*:/;

function hasYamlMetadataLine(raw: string): boolean {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .some((line) => Boolean(line) && !line.startsWith('#') && YAML_KEY_REGEX.test(line));
}

function findFrontmatterStart(raw: string): number | null {
  const frontmatterAnywhereRegex = /(^|\r?\n)---\s*\r?\n([\s\S]*?)\r?\n---\s*(?=\r?\n|$)/;
  const match = raw.match(frontmatterAnywhereRegex);
  if (!match) return null;
  const metadataRaw = match[2] ?? '';
  if (!hasYamlMetadataLine(metadataRaw)) return null;
  const prefix = match[1] ?? '';
  const matchIndex = match.index ?? 0;
  return matchIndex + prefix.length;
}

function stripLeadingCategoryHeaders(raw: string): string {
  const lines = raw.split(/\r?\n/);
  let index = 0;

  while (index < lines.length && !lines[index].trim()) {
    index += 1;
  }

  const isCategoryLike = (line: string) => /^(?:#{1,6}\s*)?categoria\s*:/i.test(line.trim());
  const isSubcategoryLike = (line: string) => /^(?:#{1,6}\s*)?subcategoria\s*:/i.test(line.trim());

  if (index >= lines.length || !isCategoryLike(lines[index] ?? '')) {
    return raw;
  }

  index += 1;
  while (index < lines.length && !lines[index].trim()) {
    index += 1;
  }

  if (index < lines.length && isSubcategoryLike(lines[index] ?? '')) {
    index += 1;
  }

  while (index < lines.length && !lines[index].trim()) {
    index += 1;
  }

  return lines.slice(index).join('\n');
}

function normalizeToStudyMarkdown(raw: string): string {
  const source = (raw || '').replace(/^\uFEFF/, '').trim();

  // If AI wrapped the markdown in a fenced block, keep only the fenced payload.
  const fencedMatch = source.match(/```(?:markdown|md)?\s*([\s\S]*?)```/i);
  const withoutFence = fencedMatch ? fencedMatch[1].trim() : source;
  const withoutCatalogHeaders = stripLeadingCategoryHeaders(withoutFence);

  // Only treat --- blocks as frontmatter when they look like YAML.
  // This avoids cutting real content that uses --- as a visual divider.
  const fmStart = findFrontmatterStart(withoutCatalogHeaders);
  if (fmStart !== null) {
    return withoutCatalogHeaders.slice(fmStart).trim();
  }

  return withoutCatalogHeaders
    .replace(/^#\s*Resposta da IA\s*$/im, '')
    .replace(/^Projeto:\s.*$/gim, '')
    .replace(/^Sess[aã]o:\s.*$/gim, '')
    .replace(/^Data:\s.*$/gim, '')
    .replace(/^---\s*$/gim, '')
    .trim();
}

function safeParseMarkdown(rawContent?: string | null): { metadata: MarkdownMetadata; parsedContent: string } {
  const fallback = (rawContent ?? '').trim();
  if (!fallback) return { metadata: {}, parsedContent: '' };

  try {
    const normalized = normalizeToStudyMarkdown(fallback);
    const frontmatterRegex = /^---\s*[\r\n]+([\s\S]*?)[\r\n]+---\s*[\r\n]*([\s\S]*)$/;
    const match = normalized.match(frontmatterRegex);

    if (!match || !hasYamlMetadataLine(match[1] ?? '')) {
      return { metadata: {}, parsedContent: normalized };
    }

    const metadataRaw = match[1];
    const body = (match[2] ?? '').trim();
    const metadata: MarkdownMetadata = {};

    metadataRaw.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const keyMatch = trimmed.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
      if (!keyMatch) return;
      const key = keyMatch[1].toLowerCase();
      const value = keyMatch[2].trim().replace(/^["']|["']$/g, '');
      if (key === 'title') metadata.title = value;
      if (key === 'subcategory') metadata.subcategory = value;
    });

    return { metadata, parsedContent: body || normalized };
  } catch {
    return { metadata: {}, parsedContent: fallback };
  }
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content, slug, category = 'biblica', onClose }) => {
  const [progress, setProgress] = useState(0);
  const [fontSize, setFontSize] = useState(18);
  const [theme, setTheme] = useState<ReadingTheme>('dark');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [savedScrollPos, setSavedScrollPos] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const contentBodyRef = useRef<HTMLDivElement>(null);
  const didFinalizeRef = useRef(false);
  const reachedEndRef = useRef(false);
  const completionCountedRef = useRef(false);
  const isCoarsePointer = useMemo(
    () => (typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(pointer: coarse)').matches
      : false),
    [],
  );

  // ── Highlight state ────────────────────────────────────────────────────────
  const [highlights, setHighlights] = useState<string[]>(() => loadHighlights(slug));
  const [notes, setNotes] = useState<ReaderNote[]>(() => loadNotes(slug));
  const [selPopup, setSelPopup] = useState<{ x: number; y: number; text: string } | null>(null);
  const [rmPopup, setRmPopup] = useState<{ x: number; y: number; text: string } | null>(null);
  const [isMarkupMode, setIsMarkupMode] = useState(false);
  const [selectionText, setSelectionText] = useState<string | null>(null);
  const [isNotesPanelOpen, setIsNotesPanelOpen] = useState(false);
  const [isNoteEditorOpen, setIsNoteEditorOpen] = useState(false);
  const [noteSelectionText, setNoteSelectionText] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [showMarkupHint, setShowMarkupHint] = useState(false);
  const markupHintTimerRef = useRef<number | null>(null);

  const clearMarkupSelection = useCallback(() => {
    setSelPopup(null);
    setRmPopup(null);
    setSelectionText(null);
    window.getSelection()?.removeAllRanges();
  }, []);

  const closeNoteEditor = useCallback(() => {
    setIsNoteEditorOpen(false);
    setEditingNoteId(null);
    setNoteSelectionText(null);
    setNoteDraft('');
    clearMarkupSelection();
  }, [clearMarkupSelection]);

  useEffect(() => {
    setHighlights(loadHighlights(slug));
    setNotes(loadNotes(slug));
    setSelPopup(null);
    setRmPopup(null);
    setSelectionText(null);
    setIsNoteEditorOpen(false);
    setNoteSelectionText(null);
    setNoteDraft('');
    setEditingNoteId(null);
    setIsNotesPanelOpen(false);
    setShowMarkupHint(false);
  }, [slug]);

  useEffect(() => {
    return () => {
      if (markupHintTimerRef.current !== null) {
        window.clearTimeout(markupHintTimerRef.current);
      }
    };
  }, []);

  /**
   * Marca a leitura como concluída (via progressManager).
   * O progressManager tem debounce de 1 min contra reload duplicado.
   * O completionCountedRef evita dupla contagem na mesma sessão.
   */
  const markReadCompletion = useCallback((updateUi: boolean) => {
    if (completionCountedRef.current) return;
    completionCountedRef.current = true;

    pm.markAsRead(category, slug);
    reachedEndRef.current = false;

    if (updateUi) {
      setProgress(0);
    }
  }, [category, slug]);

  const persistCompletionIfNeeded = useCallback((percentage: number, updateUi: boolean) => {
    if (percentage < 100) return false;
    pm.setProgress(category, slug, 100);
    markReadCompletion(updateUi);
    return true;
  }, [category, slug, markReadCompletion]);

  // History sync for hardware back button
  useEffect(() => {
    // Push a new state when the reader opens
    window.history.pushState({ readerOpen: true, slug }, '');

    const handlePopState = (_event: PopStateEvent) => {
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

  const { metadata, parsedContent } = useMemo(() => safeParseMarkdown(content), [content]);

  const title = metadata?.title;
  const subcategory = metadata?.subcategory;
  const isMatrixReader = category === 'refutacao';
  const matrixOverlayActive = isMatrixReader && theme === 'dark';

  // Load settings and progress
  useEffect(() => {
    const savedFontSize = localStorage.getItem('reader_font_size');
    const savedTheme = localStorage.getItem('reader_theme') as ReadingTheme;

    if (savedFontSize) setFontSize(parseInt(savedFontSize, 10));
    if (savedTheme) setTheme(savedTheme);

    // CORREÇÃO DO BUG DE DUPLA CONTAGEM:
    // Não chamamos markReadCompletion ao abrir um artigo já lido.
    // A contagem só acontece quando o usuário de fato chega ao fim durante
    // a sessão atual (via IntersectionObserver ou handleScroll).
    const savedProgress = pm.getProgress(category, slug);
    if (savedProgress > 0 && savedProgress < 100) {
      setProgress(savedProgress);
    }
    // Se estava em 100, começa do zero — nova leitura

    // Oferece botão para retomar na posição salva
    const savedScroll = pm.getScrollPos(category, slug);
    if (savedScroll > 100) {
      setSavedScrollPos(savedScroll);
      setShowToast(true);
    }
  }, [category, slug]);

  // Finaliza sessão ao fechar/desmontar
  useEffect(() => {
    return () => {
      if (didFinalizeRef.current) return;
      didFinalizeRef.current = true;

      const container = containerRef.current;
      let completionByScroll = false;
      if (container) {
        const totalScrollable = container.scrollHeight - container.clientHeight;
        if (totalScrollable > 0) {
          const ratio = container.scrollTop / totalScrollable;
          completionByScroll = ratio >= 0.995;
        }
      }

      const savedProgress = pm.getProgress(category, slug);
      const didComplete = reachedEndRef.current || completionByScroll || savedProgress >= 100;

      if (didComplete && !completionCountedRef.current) {
        persistCompletionIfNeeded(100, false);
      }
    };
  }, [category, slug, persistCompletionIfNeeded]);

  // Save settings
  useEffect(() => {
    localStorage.setItem('reader_font_size', fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('reader_theme', theme);
  }, [theme]);

  // IntersectionObserver no sentinel (div no fim do conteúdo)
  // Gatilho robusto de conclusão — complementa o scroll listener
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && progress >= 10) {
          // Só conta se o usuário rolou pelo menos 10% — evita artigos curtíssimos
          reachedEndRef.current = true;
          persistCompletionIfNeeded(100, true);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [progress, persistCompletionIfNeeded]);

  // Scroll listener: rastreia progresso % e posição de scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight - container.clientHeight;
      if (scrollHeight <= 0) return;
      const ratio = scrollTop / scrollHeight;
      const reachedEnd = ratio >= 0.995;
      const scrolled = reachedEnd ? 100 : Math.round(ratio * 100);

      if (reachedEnd) {
        reachedEndRef.current = true;
        persistCompletionIfNeeded(100, true);
        return;
      }

      if (scrollTop > 0) {
        pm.setProgress(category, slug, scrolled, scrollTop);
      }

      setProgress((current) => {
        const next = Math.max(current, scrolled);
        return next;
      });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [category, slug, persistCompletionIfNeeded]);

  // Theme styles - Cleaned up to rely on global CSS for red headings
  const themeStyles = {
    dark: 'bg-coal text-[#e5e2e1] prose-invert',
    light: 'bg-white text-[#0f172a] prose-slate',
    sepia: 'bg-[#f4ecd8] text-[#433422] prose-sepia'
  };

  // ── Apply / re-apply highlights after render ────────────────────────────────
  useEffect(() => {
    const el = contentBodyRef.current;
    if (!el) return;
    clearHighlightsFromDOM(el);
    highlights.forEach((hl) => applyHighlightToDOM(el, hl));
  // parsedContent included so highlights re-apply when content changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlights, parsedContent]);

  // ── Selection → popup ──────────────────────────────────────────────────────
  const showSelectionPopup = useCallback(() => {
    if (isNoteEditorOpen) return;
    const root = contentBodyRef.current;
    if (!root) return;

    // Slight delay so selection is finalised before we read it
    setTimeout(() => {
      const sel = window.getSelection();
      const text = sel?.toString().trim() ?? '';
      if (!text || text.length < 3 || text.length > 400 || !sel || sel.rangeCount === 0) {
        setSelPopup(null);
        setSelectionText(null);
        return;
      }

      const range = sel.getRangeAt(0);
      const common = range.commonAncestorContainer;
      const commonElement = common.nodeType === Node.TEXT_NODE ? common.parentElement : (common as HTMLElement);
      if (!commonElement || !root.contains(commonElement)) {
        setSelPopup(null);
        setSelectionText(null);
        return;
      }

      const rect = range.getBoundingClientRect();
      if (!rect || (rect.width === 0 && rect.height === 0)) return;
      setSelectionText(text);
      if (isMarkupMode || isCoarsePointer) {
        setSelPopup(null);
        if (isCoarsePointer && !isMarkupMode) {
          setShowMarkupHint(true);
          if (markupHintTimerRef.current !== null) {
            window.clearTimeout(markupHintTimerRef.current);
          }
          markupHintTimerRef.current = window.setTimeout(() => {
            setShowMarkupHint(false);
            markupHintTimerRef.current = null;
          }, 2000);
        }
      } else {
        setSelPopup({ x: rect.left + rect.width / 2, y: rect.top - 8, text });
      }
      setRmPopup(null);
    }, 0);
  }, [isCoarsePointer, isMarkupMode, isNoteEditorOpen]);

  const handleContentMouseUp = useCallback(() => {
    showSelectionPopup();
  }, [showSelectionPopup]);

  const handleContentTouchEnd = useCallback(() => {
    showSelectionPopup();
  }, [showSelectionPopup]);

  // ── Click on a <mark> → show remove popup ─────────────────────────────────
  const handleContentClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName !== 'MARK') { setRmPopup(null); return; }
    const hl = target.getAttribute('data-hl');
    if (!hl) return;
    e.stopPropagation();
    const rect = target.getBoundingClientRect();
    setRmPopup({ x: rect.left + rect.width / 2, y: rect.top + window.scrollY - 8, text: hl });
    setSelPopup(null);
  }, []);

  const handleContentTouchStart = useCallback((e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName !== 'MARK') return;
    const hl = target.getAttribute('data-hl');
    if (!hl) return;
    const rect = target.getBoundingClientRect();
    setRmPopup({ x: rect.left + rect.width / 2, y: rect.top - 8, text: hl });
    setSelPopup(null);
  }, []);

  // ── Add / remove highlight helpers ─────────────────────────────────────────
  const addHighlight = useCallback(() => {
    const text = selectionText || selPopup?.text;
    if (!text) return;
    setHighlights((prev) => {
      if (prev.includes(text)) return prev;
      const next = [...prev, text];
      saveHighlights(slug, next);
      return next;
    });
    setSelPopup(null);
    setSelectionText(null);
    window.getSelection()?.removeAllRanges();
  }, [selectionText, selPopup, slug]);

  const startNoteEditor = useCallback(() => {
    const text = selectionText || selPopup?.text;
    if (!text) return;
    setEditingNoteId(null);
    setNoteDraft('');
    setNoteSelectionText(text);
    setIsNoteEditorOpen(true);
  }, [selectionText, selPopup]);

  const openNoteForEdit = useCallback((note: ReaderNote) => {
    setEditingNoteId(note.id);
    setSelectionText(note.text);
    setNoteSelectionText(note.text);
    setNoteDraft(note.note);
    setIsNoteEditorOpen(true);
    setIsNotesPanelOpen(false);
  }, []);

  const saveNoteFromSelection = useCallback(() => {
    const text = (noteSelectionText || selectionText || selPopup?.text || '').trim();
    const noteText = noteDraft.trim();
    if (!text || !noteText) return;

    setHighlights((prev) => {
      if (prev.includes(text)) return prev;
      const next = [...prev, text];
      saveHighlights(slug, next);
      return next;
    });

    setNotes((prev) => {
      const now = Date.now();
      const existingIndex = editingNoteId ? prev.findIndex((item) => item.id === editingNoteId) : -1;
      let next: ReaderNote[];
      if (existingIndex >= 0) {
        next = prev.map((item, index) => (
          index === existingIndex
            ? { ...item, text, note: noteText, updatedAt: now }
            : item
        ));
      } else {
        const item: ReaderNote = {
          id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
          text,
          note: noteText,
          createdAt: now,
          updatedAt: now,
        };
        next = [item, ...prev];
      }
      saveNotes(slug, next);
      return next;
    });

    closeNoteEditor();
  }, [closeNoteEditor, editingNoteId, noteDraft, noteSelectionText, selectionText, selPopup, slug]);

  const removeHighlight = useCallback((text: string) => {
    setHighlights((prev) => {
      const next = prev.filter((h) => h !== text);
      saveHighlights(slug, next);
      return next;
    });
    setRmPopup(null);
  }, [slug]);

  const removeNote = useCallback((id: string) => {
    setNotes((prev) => {
      const next = prev.filter((item) => item.id !== id);
      saveNotes(slug, next);
      return next;
    });
  }, [slug]);

  const jumpToHighlightedText = useCallback((text: string) => {
    const root = contentBodyRef.current;
    if (!root) return;
    const target = Array.from(root.querySelectorAll('mark[data-hl]')).find(
      (item) => (item as HTMLElement).getAttribute('data-hl') === text,
    ) as HTMLElement | undefined;
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setIsNotesPanelOpen(false);
  }, []);

  // Close popups on scroll
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const hide = () => { setSelPopup(null); setRmPopup(null); };
    el.addEventListener('scroll', hide, { passive: true });
    return () => el.removeEventListener('scroll', hide);
  }, []);

  // Keeps highlight popup usable on mobile while user adjusts native selection handles.
  useEffect(() => {
    let frame = 0;
    const onSelectionChange = () => {
      if (!contentBodyRef.current) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        showSelectionPopup();
      });
    };

    document.addEventListener('selectionchange', onSelectionChange);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('selectionchange', onSelectionChange);
    };
  }, [showSelectionPopup]);

  const markdownComponents: Components = {
    table: ({ children }) => (
      <div className="table-responsive overflow-x-auto">
        <table>{children}</table>
      </div>
    ),
    h2: ({ children }) => (
      <h2 className="font-headline font-bold text-2xl mt-8 mb-4 border-b border-outline-variant/20 pb-2">
        {children}
      </h2>
    ),
    ul: ({ children }) => <ul className="font-sans list-disc ml-5 mb-6 space-y-2">{children}</ul>,
    ol: ({ children }) => <ol className="font-sans list-decimal ml-5 mb-6 space-y-2">{children}</ol>,
    li: ({ children }) => <li className="font-sans leading-relaxed">{children}</li>,
  };

  console.log('Conteúdo carregado:', content);

  if (!content || !content.trim()) {
    return (
      <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-coal text-on-surface p-6">
        <button
          onClick={handleManualClose}
          className="absolute top-4 left-4 flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest"
        >
          <ArrowLeft size={18} />
          <span>Sair</span>
        </button>
        <p className="font-headline text-xl mb-2">Carregando conteúdo...</p>
        <p className="text-sm opacity-70 text-center">O estudo ainda não foi carregado ou está vazio.</p>
      </div>
    );
  }

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

          <button
            onClick={() => {
              setIsMarkupMode((prev) => !prev);
              clearMarkupSelection();
              if (isMarkupMode) {
                setShowMarkupHint(false);
              }
            }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 ${
              isMarkupMode
                ? 'bg-primary text-on-primary'
                : theme === 'dark'
                  ? 'bg-surface-container-highest text-primary'
                  : theme === 'sepia'
                    ? 'bg-[#e8dfc8] text-[#433422]'
                    : 'bg-slate-100 text-slate-900 shadow-sm border border-slate-200'
            }`}
            aria-label={isMarkupMode ? 'Desativar marcação' : 'Ativar marcação'}
            title={isMarkupMode ? 'Desativar marcação' : 'Ativar marcação'}
          >
            <Pencil size={18} />
          </button>

          <button
            onClick={() => setIsNotesPanelOpen(true)}
            className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 ${
              theme === 'dark'
                ? 'bg-surface-container-highest text-primary'
                : theme === 'sepia'
                  ? 'bg-[#e8dfc8] text-[#433422]'
                  : 'bg-slate-100 text-slate-900 shadow-sm border border-slate-200'
            }`}
            aria-label="Abrir notas do ebook"
            title="Abrir notas do ebook"
          >
            <FileText size={18} />
            {notes.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-primary text-[9px] leading-4 font-black text-on-primary">
                {notes.length > 99 ? '99+' : notes.length}
              </span>
            )}
          </button>
          
          {/* Settings Button moved here */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 ${isMenuOpen ? 'bg-primary text-on-primary' : theme === 'dark' ? 'bg-surface-container-highest text-primary' : theme === 'sepia' ? 'bg-[#e8dfc8] text-[#433422]' : 'bg-slate-100 text-slate-900 shadow-sm border border-slate-200'}`}
          >
            {isMenuOpen ? <X size={20} /> : <Settings size={20} />}
          </button>
        </div>
      </div>

      {isMarkupMode && (
        <div className={`sticky top-16 z-[10004] px-4 py-2 border-b backdrop-blur-md ${
          theme === 'dark'
            ? 'bg-coal/92 border-white/10'
            : theme === 'sepia'
              ? 'bg-[#f4ecd8]/92 border-[#433422]/10'
              : 'bg-white/92 border-slate-200'
        }`}>
          <div className="max-w-2xl mx-auto flex flex-wrap items-center gap-2">
            <button
              onClick={addHighlight}
              disabled={!selectionText}
              className="inline-flex items-center gap-1.5 bg-[#D4AF37] text-black text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-full border border-[#F5D76E]/50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Highlighter size={12} />
              Destacar
            </button>
            <button
              onClick={startNoteEditor}
              disabled={!selectionText}
              className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-full border disabled:opacity-40 disabled:cursor-not-allowed ${
                theme === 'dark'
                  ? 'bg-surface-container-high text-on-surface border-white/15'
                  : theme === 'sepia'
                    ? 'bg-[#e8dfc8] text-[#433422] border-[#433422]/20'
                    : 'bg-slate-100 text-slate-900 border-slate-300'
              }`}
            >
              <PenLine size={12} />
              Destacar + Nota
            </button>
            <button
              onClick={() => setIsNotesPanelOpen(true)}
              className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-full border ${
                theme === 'dark'
                  ? 'bg-surface-container-high text-on-surface border-white/15'
                  : theme === 'sepia'
                    ? 'bg-[#e8dfc8] text-[#433422] border-[#433422]/20'
                    : 'bg-slate-100 text-slate-900 border-slate-300'
              }`}
            >
              <FileText size={12} />
              Notas ({notes.length})
            </button>
            <span className={`text-[10px] font-semibold ${theme === 'dark' ? 'text-on-surface-variant' : 'text-current/70'}`}>
              {selectionText ? 'Texto selecionado pronto para marcar.' : 'Selecione um trecho para marcar.'}
            </span>
          </div>
        </div>
      )}

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
          className={`h-full transition-all duration-300 ${
            matrixOverlayActive
              ? 'bg-gradient-to-r from-[#0f7a3a] via-[#21d07a] to-[#9bffc3] shadow-[0_0_10px_rgba(34,197,94,0.55)]'
              : 'bg-gradient-to-r from-orange-500 to-yellow-400 shadow-[0_0_10px_rgba(249,115,22,0.5)]'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Reader Content */}
      <div className="relative max-w-2xl mx-auto w-full px-6 py-12 pb-32">
        {matrixOverlayActive && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -mx-2 rounded-3xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,197,94,0.14),transparent_58%),radial-gradient(ellipse_at_bottom,rgba(16,185,129,0.10),transparent_62%)]" />
            <div className="absolute inset-0 opacity-25 bg-[repeating-linear-gradient(180deg,rgba(134,255,184,0.12)_0px,rgba(134,255,184,0.12)_1px,transparent_1px,transparent_7px)]" />
            <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#1ee07a]/10 to-transparent" />
          </div>
        )}
        {/* Header Section */}
        {(title || subcategory) && (
          <header className="mb-12 pt-4">
            <div className="flex justify-between items-center mb-4">
              {subcategory && (
                <span className={`font-black text-[10px] uppercase tracking-[0.4em] ${theme === 'dark' ? 'text-primary' : 'text-[#b83025]'}`}>
                  {subcategory}
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
          ref={contentBodyRef}
          className={`prose max-w-none prose-p:leading-relaxed prose-headings:font-headline prose-headings:tracking-tight prose-li:marker:text-primary transition-all duration-300 ${theme === 'dark' ? 'prose-invert' : 'prose-p:text-current'}`}
          style={{ fontSize: `${fontSize}px` }}
          onMouseUp={handleContentMouseUp}
          onTouchEnd={handleContentTouchEnd}
          onTouchStart={handleContentTouchStart}
          onClick={handleContentClick}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {parsedContent}
          </ReactMarkdown>
        </div>

        {/* Sentinel: IntersectionObserver observa este elemento para detectar fim de leitura */}
        <div ref={sentinelRef} className="h-1 w-full mt-4" aria-hidden="true" />
      </div>

      {/* ── Highlight: selection popup ──────────────────────────────────────── */}
      {selPopup && (
        <div
          className="fixed z-[10010] -translate-x-1/2 -translate-y-full pointer-events-auto"
          style={{ left: selPopup.x, top: selPopup.y }}
        >
          <button
            onMouseDown={(e) => { e.preventDefault(); addHighlight(); }}
            className="flex items-center gap-1.5 bg-[#D4AF37] text-black text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-full shadow-2xl border border-[#F5D76E]/50 active:scale-95 transition-transform"
          >
            <Highlighter size={12} />
            Destacar
          </button>
          {/* Small arrow */}
          <div className="w-2.5 h-2.5 bg-[#D4AF37] rotate-45 mx-auto -mt-1.5 border-r border-b border-[#F5D76E]/50" />
        </div>
      )}

      {/* ── Highlight: remove popup ─────────────────────────────────────────── */}
      {rmPopup && (
        <div
          className="fixed z-[10010] -translate-x-1/2 -translate-y-full pointer-events-auto"
          style={{ left: rmPopup.x, top: rmPopup.y }}
        >
          <button
            onMouseDown={(e) => { e.preventDefault(); removeHighlight(rmPopup.text); }}
            className="flex items-center gap-1.5 bg-surface-container-high text-on-surface-variant text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-full shadow-2xl border border-white/10 active:scale-95 transition-transform"
          >
            <Trash2 size={12} />
            Remover destaque
          </button>
          <div className="w-2.5 h-2.5 bg-surface-container-high rotate-45 mx-auto -mt-1.5 border-r border-b border-white/10" />
        </div>
      )}

      {isNoteEditorOpen && (
        <div className="fixed inset-0 z-[10012] bg-black/60 backdrop-blur-[2px] flex items-center justify-center px-4">
          <div className={`w-full max-w-lg rounded-2xl border p-4 sm:p-5 ${
            theme === 'dark'
              ? 'bg-surface-container border-white/10'
              : theme === 'sepia'
                ? 'bg-[#f4ecd8] border-[#433422]/20'
                : 'bg-white border-slate-200'
          }`}>
            <h3 className="font-headline text-lg font-black tracking-tight">Nota da Marcação</h3>
            <p className={`mt-1 text-xs ${theme === 'dark' ? 'text-on-surface-variant' : 'text-current/70'}`}>
              Trecho selecionado:
            </p>
            <div className={`mt-2 rounded-xl border px-3 py-2 text-xs leading-relaxed max-h-24 overflow-y-auto ${
              theme === 'dark'
                ? 'border-white/10 bg-black/25 text-on-surface'
                : theme === 'sepia'
                  ? 'border-[#433422]/20 bg-[#efe4cb] text-[#433422]'
                  : 'border-slate-200 bg-slate-50 text-slate-900'
            }`}>
              {(noteSelectionText || selectionText || selPopup?.text || '').trim() || 'Nenhum trecho selecionado.'}
            </div>

            <textarea
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="Escreva sua observação aqui..."
              className={`mt-3 w-full min-h-[130px] rounded-xl border px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 ${
                theme === 'dark'
                  ? 'bg-black/30 border-white/15 text-on-surface placeholder:text-on-surface-variant/60 focus:ring-primary/45'
                  : theme === 'sepia'
                    ? 'bg-[#efe4cb] border-[#433422]/20 text-[#433422] placeholder:text-[#433422]/55 focus:ring-[#433422]/40'
                    : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 focus:ring-primary/35'
              }`}
            />

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={closeNoteEditor}
                className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider ${
                  theme === 'dark'
                    ? 'bg-surface-container-high text-on-surface-variant'
                    : theme === 'sepia'
                      ? 'bg-[#e8dfc8] text-[#433422]'
                      : 'bg-slate-100 text-slate-700'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={saveNoteFromSelection}
                disabled={!noteDraft.trim() || !(noteSelectionText || selectionText || selPopup?.text)}
                className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-primary text-on-primary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Salvar nota
              </button>
            </div>
          </div>
        </div>
      )}

      {isNotesPanelOpen && (
        <div className="fixed inset-0 z-[10011] bg-black/55 backdrop-blur-[2px] flex justify-end">
          <div className={`h-full w-full max-w-md border-l px-4 py-4 overflow-y-auto ${
            theme === 'dark'
              ? 'bg-surface-container border-white/10'
              : theme === 'sepia'
                ? 'bg-[#f4ecd8] border-[#433422]/20'
                : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className="font-headline text-xl font-black tracking-tight">Notas do Ebook</h3>
              <button
                onClick={() => setIsNotesPanelOpen(false)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  theme === 'dark'
                    ? 'bg-surface-container-high text-on-surface-variant'
                    : theme === 'sepia'
                      ? 'bg-[#e8dfc8] text-[#433422]'
                      : 'bg-slate-100 text-slate-700'
                }`}
                aria-label="Fechar notas"
              >
                <X size={16} />
              </button>
            </div>

            {notes.length === 0 ? (
              <div className={`mt-6 rounded-2xl border px-4 py-4 text-sm ${
                theme === 'dark'
                  ? 'border-white/10 bg-black/20 text-on-surface-variant'
                  : theme === 'sepia'
                    ? 'border-[#433422]/20 bg-[#efe4cb] text-[#433422]/80'
                    : 'border-slate-200 bg-slate-50 text-slate-600'
              }`}>
                Nenhuma nota ainda neste ebook.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {notes.map((item) => (
                  <article
                    key={item.id}
                    className={`rounded-2xl border p-3 ${
                      theme === 'dark'
                        ? 'border-white/10 bg-black/20'
                        : theme === 'sepia'
                          ? 'border-[#433422]/20 bg-[#efe4cb]'
                          : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <button
                      onClick={() => jumpToHighlightedText(item.text)}
                      className={`w-full text-left text-xs font-semibold leading-relaxed line-clamp-3 ${
                        theme === 'dark' ? 'text-on-surface-variant hover:text-primary' : 'hover:text-primary'
                      }`}
                    >
                      “{item.text}”
                    </button>
                    <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{item.note}</p>
                    <div className={`mt-3 text-[10px] ${theme === 'dark' ? 'text-on-surface-variant/70' : 'text-current/60'}`}>
                      {new Date(item.updatedAt).toLocaleString('pt-BR')}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => openNoteForEdit(item)}
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          theme === 'dark'
                            ? 'bg-surface-container-high text-on-surface'
                            : theme === 'sepia'
                              ? 'bg-[#e1d4b8] text-[#433422]'
                              : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => removeNote(item.id)}
                        className="px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-red-600/90 text-white"
                      >
                        Excluir
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Continue Reading Button */}
      {showToast && savedScrollPos !== null && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[10003] animate-in fade-in slide-in-from-bottom-4 duration-500 flex items-center gap-2">
          <button
            onClick={() => {
              if (containerRef.current) containerRef.current.scrollTop = savedScrollPos;
              setShowToast(false);
            }}
            className="bg-primary/90 backdrop-blur-md text-on-primary px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/20 active:scale-95 transition-transform"
          >
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-xs font-bold uppercase tracking-wider whitespace-nowrap">
              Continuar leitura
            </span>
          </button>
          <button
            onClick={() => setShowToast(false)}
            className="bg-surface-container-high/90 backdrop-blur-md text-on-surface-variant w-10 h-10 rounded-2xl flex items-center justify-center border border-white/10 active:scale-95 transition-transform"
            aria-label="Fechar"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {showMarkupHint && !isMarkupMode && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-[10009] px-4">
          <div className="bg-black/85 text-white text-[11px] font-bold px-3 py-2 rounded-xl border border-white/15 shadow-xl">
            Ative o lápis para marcar
          </div>
        </div>
      )}
    </div>
  );
};
