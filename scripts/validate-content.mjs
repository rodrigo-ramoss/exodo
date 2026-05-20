import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const warnings = [];

const INIMIGOS_DIR = path.join(
  root,
  'public',
  'content',
  'selah',
  'batalha-espiritual',
  'inimigos',
);
const CASA_DO_VALENTE_DIR = path.join(INIMIGOS_DIR, 'serie - a casa do valente');
const ALLOWED_CONTENT_EXTENSIONS = new Set(['.md', '.mdx', '.yaml', '.yml']);

function walkFiles(startDir) {
  const out = [];
  const stack = [startDir];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || !fs.existsSync(current)) continue;
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile()) {
        out.push(full);
      }
    }
  }
  return out;
}

function parseFrontmatterImage(markdown) {
  const normalized = markdown.replace(/^\uFEFF/, '').trimStart();
  const match = normalized.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---/);
  if (!match) return '';
  const imageLine = match[1].match(/^\s*image\s*:\s*(.*?)\s*$/im);
  if (!imageLine?.[1]) return '';
  return imageLine[1].replace(/^["']|["']$/g, '').trim();
}

if (!fs.existsSync(INIMIGOS_DIR)) {
  errors.push(`Diretorio nao encontrado: ${INIMIGOS_DIR}`);
} else {
  const contentFiles = walkFiles(INIMIGOS_DIR);
  for (const filePath of contentFiles) {
    const ext = path.extname(filePath).toLowerCase();
    if (!ALLOWED_CONTENT_EXTENSIONS.has(ext)) {
      errors.push(`Arquivo sem extensao suportada: ${path.relative(root, filePath)}`);
    }
  }
}

if (!fs.existsSync(CASA_DO_VALENTE_DIR)) {
  errors.push(`Serie nao encontrada: ${CASA_DO_VALENTE_DIR}`);
} else {
  const serieFiles = fs
    .readdirSync(CASA_DO_VALENTE_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.md'))
    .map((entry) => path.join(CASA_DO_VALENTE_DIR, entry.name))
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));

  if (serieFiles.length === 0) {
    errors.push('Nenhum arquivo .md encontrado em "serie - a casa do valente".');
  }

  for (const filePath of serieFiles) {
    const raw = fs.readFileSync(filePath, 'utf8');
    const image = parseFrontmatterImage(raw);
    if (!image) {
      errors.push(`Frontmatter sem image: ${path.relative(root, filePath)}`);
      continue;
    }
    if (!image.startsWith('/image/selah/')) {
      warnings.push(`Image nao local em ${path.relative(root, filePath)} -> ${image}`);
      continue;
    }

    const localImagePath = path.join(root, 'public', image.replace(/^\//, ''));
    if (!fs.existsSync(localImagePath)) {
      errors.push(`Capa inexistente para ${path.relative(root, filePath)} -> ${image}`);
    }
  }
}

if (warnings.length > 0) {
  console.warn('Avisos:');
  for (const item of warnings) console.warn(`- ${item}`);
}

if (errors.length > 0) {
  console.error('Falhas de validacao:');
  for (const item of errors) console.error(`- ${item}`);
  process.exit(1);
}

console.log('Validacao de conteudo concluida com sucesso.');
