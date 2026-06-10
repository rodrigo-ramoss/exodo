import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSessionFromRequest, readJsonBody } from './_lib/auth';
import { clampInt, cleanText, ensureUser, getSql } from './_lib/db';

function toMs(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : Date.now();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  const sql = getSql();

  if (req.method === 'GET') {
    const slug = cleanText(req.query.slug, 600);
    if (!slug) return res.status(400).json({ error: 'Slug obrigatório' });

    try {
      await ensureUser(session.email);
      const highlights = (await sql`
        SELECT id, text, start_offset, end_offset, created_at_ms, updated_at_ms
        FROM reader_highlights
        WHERE user_email = ${session.email} AND slug = ${slug}
        ORDER BY created_at_ms ASC
      `) as Array<Record<string, any>>;
      const notes = (await sql`
        SELECT id, text, note, highlight_id, created_at_ms, updated_at_ms
        FROM reader_notes
        WHERE user_email = ${session.email} AND slug = ${slug}
        ORDER BY created_at_ms ASC
      `) as Array<Record<string, any>>;

      return res.status(200).json({
        highlights: highlights.map((item) => ({
          id: item.id,
          text: item.text,
          start: item.start_offset,
          end: item.end_offset,
          createdAt: Number(item.created_at_ms),
          updatedAt: Number(item.updated_at_ms),
        })),
        notes: notes.map((item) => ({
          id: item.id,
          text: item.text,
          note: item.note,
          highlightId: item.highlight_id || undefined,
          createdAt: Number(item.created_at_ms),
          updatedAt: Number(item.updated_at_ms),
        })),
      });
    } catch (error) {
      console.error('[reader-state:get] erro:', error);
      return res.status(500).json({ error: 'Erro interno' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const body = await readJsonBody(req);
      const slug = cleanText(body.slug, 600);
      const highlights = Array.isArray(body.highlights) ? body.highlights.slice(0, 1000) : [];
      const notes = Array.isArray(body.notes) ? body.notes.slice(0, 1000) : [];
      if (!slug) return res.status(400).json({ error: 'Slug obrigatório' });

      await ensureUser(session.email);
      await sql`DELETE FROM reader_highlights WHERE user_email = ${session.email} AND slug = ${slug}`;
      await sql`DELETE FROM reader_notes WHERE user_email = ${session.email} AND slug = ${slug}`;

      for (const raw of highlights) {
        if (!raw || typeof raw !== 'object') continue;
        const item = raw as Record<string, unknown>;
        const id = cleanText(item.id, 120);
        const text = cleanText(item.text, 12000);
        if (!id || !text) continue;
        await sql`
          INSERT INTO reader_highlights (
            user_email,
            id,
            slug,
            text,
            start_offset,
            end_offset,
            created_at_ms,
            updated_at_ms
          )
          VALUES (
            ${session.email},
            ${id},
            ${slug},
            ${text},
            ${clampInt(item.start, -1, 10000000, -1)},
            ${clampInt(item.end, -1, 10000000, -1)},
            ${toMs(item.createdAt)},
            ${toMs(item.updatedAt)}
          )
        `;
      }

      for (const raw of notes) {
        if (!raw || typeof raw !== 'object') continue;
        const item = raw as Record<string, unknown>;
        const id = cleanText(item.id, 120);
        const text = cleanText(item.text, 12000);
        const note = cleanText(item.note, 20000);
        if (!id || !text) continue;
        await sql`
          INSERT INTO reader_notes (
            user_email,
            id,
            slug,
            highlight_id,
            text,
            note,
            created_at_ms,
            updated_at_ms
          )
          VALUES (
            ${session.email},
            ${id},
            ${slug},
            ${cleanText(item.highlightId, 120) || null},
            ${text},
            ${note},
            ${toMs(item.createdAt)},
            ${toMs(item.updatedAt)}
          )
        `;
      }

      return res.status(200).json({ ok: true });
    } catch (error) {
      console.error('[reader-state:put] erro:', error);
      return res.status(500).json({ error: 'Erro interno' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
