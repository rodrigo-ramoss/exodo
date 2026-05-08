export type StudySearchSource = 'selah' | 'mana';

export interface StudySearchDocument {
  id: string;
  source: StudySearchSource;
  slug: string;
  sourcePath: string;
  title: string;
  series: string;
  theme: string;
  subsection: string;
  body: string;
}

export interface StudySearchIndex {
  source: StudySearchSource;
  documents: StudySearchDocument[];
}

export interface StudySearchResult {
  document: StudySearchDocument;
  score: number;
  matchedIn: Array<'title' | 'series' | 'theme' | 'subsection' | 'body'>;
  excerpt: string;
}

export interface StudySearchOptions {
  limit?: number;
}

const CONTENT_FILE_EXTENSION_REGEX = /\.(?:md|mdx|markdown|ya?ml)$/i;

type ParsedFrontmatter = Record<string, string>;

function normalizeKey(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function normalizeForSearch(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function parseFrontmatter(markdown: string): ParsedFrontmatter {
  const normalized = markdown.replace(/^\uFEFF/, '').trimStart();
  const match = normalized.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---/);
  if (!match) return {};

  const result: ParsedFrontmatter = {};
  for (const line of match[1].split(/\r?\n/)) {
    const item = line.match(/^\s*([A-Za-z_][\w-]*)\s*:\s*(.*?)\s*$/);
    if (!item) continue;
    const key = item[1].toLowerCase();
    const value = item[2].replace(/^["']|["']$/g, '');
    result[key] = value;
  }
  return result;
}

function stripFrontmatter(markdown: string): string {
  return markdown
    .replace(/^\uFEFF/, '')
    .replace(/^---\s*[\r\n]+[\s\S]*?[\r\n]+---\s*[\r\n]*/m, '');
}

function stripMarkdown(markdown: string): string {
  return stripFrontmatter(markdown)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]+`/g, ' ')
    .replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
    .replace(/\[[^\]]+]\([^)]+\)/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\r?\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function firstHeading(markdown: string): string {
  const heading = stripFrontmatter(markdown).match(/^#\s+(.+)$/m)?.[1]?.trim();
  return heading || '';
}

function titleFromFileName(fileName: string): string {
  return fileName
    .replace(CONTENT_FILE_EXTENSION_REGEX, '')
    .replace(/^(?:ebook|livro|parte|volume|vol\.)\s*\d+\s*-\s*/i, '')
    .trim();
}

function titleCase(raw: string): string {
  return raw
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function toContentRelativePath(pathKey: string): string {
  const normalized = pathKey.replace(/\\/g, '/');
  const marker = '/public/content/';
  const index = normalized.indexOf(marker);
  if (index >= 0) {
    return normalized.slice(index + marker.length);
  }
  return normalized.replace(/^\/+/, '');
}

function deriveSeriesFromPath(parts: string[]): string {
  if (parts.length < 2) return '';
  const parent = parts[parts.length - 2] || '';
  return titleCase(parent.replace(/^serie\s*-\s*/i, '').replace(/^trilogia\s*-\s*/i, ''));
}

function deriveThemeFromPath(source: StudySearchSource, parts: string[]): string {
  if (source === 'mana') return 'Mana';
  if (parts.length < 1) return '';
  return titleCase(parts[0] || '');
}

function deriveSubsectionFromPath(source: StudySearchSource, parts: string[]): string {
  if (source === 'mana') return parts.length > 1 ? titleCase(parts[0] || '') : '';
  return parts.length > 1 ? titleCase(parts[1] || '') : '';
}

function getSearchExcerpt(body: string, query: string): string {
  if (!body) return '';
  const normalizedBody = normalizeForSearch(body);
  const normalizedQuery = normalizeForSearch(query).trim();
  if (!normalizedQuery) return body.slice(0, 180);

  const at = normalizedBody.indexOf(normalizedQuery);
  if (at < 0) return body.slice(0, 180);

  const start = Math.max(0, at - 60);
  const end = Math.min(body.length, at + normalizedQuery.length + 80);
  const prefix = start > 0 ? '...' : '';
  const suffix = end < body.length ? '...' : '';
  return `${prefix}${body.slice(start, end).trim()}${suffix}`;
}

function scoreField(haystack: string, query: string, exactBoost: number, partialBoost: number): number {
  const normalizedHaystack = normalizeForSearch(haystack);
  const normalizedQuery = normalizeForSearch(query).trim();
  if (!normalizedHaystack || !normalizedQuery) return 0;
  if (normalizedHaystack.includes(normalizedQuery)) return exactBoost;
  const terms = normalizedQuery.split(/\s+/).filter(Boolean);
  if (!terms.length) return 0;
  const matched = terms.filter((term) => normalizedHaystack.includes(term)).length;
  if (!matched) return 0;
  return Math.round((matched / terms.length) * partialBoost);
}

export function buildStudySearchIndex(
  modules: Record<string, string>,
  source: StudySearchSource,
): StudySearchIndex {
  const documents: StudySearchDocument[] = [];

  for (const [pathKey, content] of Object.entries(modules)) {
    const relative = toContentRelativePath(pathKey);
    const parts = relative.split('/').filter(Boolean);
    const fileName = parts[parts.length - 1] || '';
    if (!fileName) continue;

    const frontmatter = parseFrontmatter(content);
    const title =
      frontmatter.title?.trim()
      || firstHeading(content)
      || titleFromFileName(fileName);

    const series = frontmatter.category?.trim() || deriveSeriesFromPath(parts);
    const theme = frontmatter.tema?.trim() || frontmatter.theme?.trim() || deriveThemeFromPath(source, parts);
    const subsection = frontmatter.subsecao?.trim() || frontmatter.subsection?.trim() || deriveSubsectionFromPath(source, parts);
    const slug = normalizeKey(relative.replace(CONTENT_FILE_EXTENSION_REGEX, ''));
    const body = stripMarkdown(content);
    const id = `${source}:${slug}`;

    documents.push({
      id,
      source,
      slug,
      sourcePath: pathKey,
      title: title.trim(),
      series: series.trim(),
      theme: theme.trim(),
      subsection: subsection.trim(),
      body,
    });
  }

  return { source, documents };
}

export function searchStudyIndex(
  indexes: StudySearchIndex[],
  rawQuery: string,
  options: StudySearchOptions = {},
): StudySearchResult[] {
  const query = rawQuery.trim();
  if (!query) return [];
  const limit = options.limit ?? 40;

  const results: StudySearchResult[] = [];
  for (const index of indexes) {
    for (const document of index.documents) {
      const matchedIn: StudySearchResult['matchedIn'] = [];
      let score = 0;

      const titleScore = scoreField(document.title, query, 120, 70);
      if (titleScore > 0) {
        score += titleScore;
        matchedIn.push('title');
      }

      const seriesScore = scoreField(document.series, query, 90, 55);
      if (seriesScore > 0) {
        score += seriesScore;
        matchedIn.push('series');
      }

      const themeScore = scoreField(document.theme, query, 70, 40);
      if (themeScore > 0) {
        score += themeScore;
        matchedIn.push('theme');
      }

      const subsectionScore = scoreField(document.subsection, query, 65, 35);
      if (subsectionScore > 0) {
        score += subsectionScore;
        matchedIn.push('subsection');
      }

      const bodyScore = scoreField(document.body, query, 40, 20);
      if (bodyScore > 0) {
        score += bodyScore;
        matchedIn.push('body');
      }

      if (score <= 0) continue;

      results.push({
        document,
        score,
        matchedIn,
        excerpt: getSearchExcerpt(document.body, query),
      });
    }
  }

  return results
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.document.title.localeCompare(b.document.title);
    })
    .slice(0, limit);
}
