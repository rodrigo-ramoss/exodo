import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSessionFromRequest, readJsonBody } from './_lib/auth';
import { clampInt, cleanText, ensureUser, getSql, toIsoOrNull } from './_lib/db';

const VALID_CATEGORIES = new Set([
  'mana',
  'apocrifos',
  'refutacao',
  'livraria',
  'biblica',
  'ebd',
  'ensinos',
  'discipulos',
  'pregador',
]);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const session = getSessionFromRequest(req);
  if (!session) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  try {
    const body = await readJsonBody(req);
    const category = cleanText(body.category, 40);
    const slug = cleanText(body.slug, 600);
    const entry = body.entry && typeof body.entry === 'object'
      ? body.entry as Record<string, unknown>
      : {};

    if (!VALID_CATEGORIES.has(category) || !slug) {
      return res.status(400).json({ error: 'Dados inválidos' });
    }

    await ensureUser(session.email);
    const sql = getSql();
    const updatedAt = toIsoOrNull(entry.updatedAt) ?? new Date().toISOString();
    const lastRead = toIsoOrNull(entry.lastRead);

    await sql`
      INSERT INTO reading_progress (
        user_email,
        category,
        slug,
        read_count,
        last_read,
        updated_at,
        progress,
        scroll_pos
      )
      VALUES (
        ${session.email},
        ${category},
        ${slug},
        ${clampInt(entry.readCount, 0, 100000, 0)},
        ${lastRead},
        ${updatedAt},
        ${clampInt(entry.progress, 0, 100, 0)},
        ${clampInt(entry.scrollPos, 0, 100000000, 0)}
      )
      ON CONFLICT (user_email, category, slug) DO UPDATE SET
        read_count = GREATEST(reading_progress.read_count, EXCLUDED.read_count),
        last_read = COALESCE(EXCLUDED.last_read, reading_progress.last_read),
        updated_at = GREATEST(reading_progress.updated_at, EXCLUDED.updated_at),
        progress = CASE
          WHEN EXCLUDED.updated_at >= reading_progress.updated_at THEN EXCLUDED.progress
          ELSE reading_progress.progress
        END,
        scroll_pos = CASE
          WHEN EXCLUDED.updated_at >= reading_progress.updated_at THEN EXCLUDED.scroll_pos
          ELSE reading_progress.scroll_pos
        END
    `;

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('[progress] erro:', error);
    return res.status(500).json({ error: 'Erro interno' });
  }
}
