import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSessionFromRequest, readJsonBody } from './_lib/auth.js';
import { clampInt, cleanText, ensureUser, getSql, toIsoOrNull } from './_lib/db.js';

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

function toMs(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : Date.now();
}

async function readRemoteState(email: string) {
  const sql = getSql();
  const [profile] = (await sql`
    SELECT email, name, photo_url, notifications_enabled
    FROM app_users
    WHERE email = ${email}
    LIMIT 1
  `) as Array<Record<string, any>>;
  const progress = (await sql`
    SELECT category, slug, read_count, last_read, updated_at, progress, scroll_pos
    FROM reading_progress
    WHERE user_email = ${email}
  `) as Array<Record<string, any>>;
  const highlights = (await sql`
    SELECT id, slug, text, start_offset, end_offset, created_at_ms, updated_at_ms
    FROM reader_highlights
    WHERE user_email = ${email}
  `) as Array<Record<string, any>>;
  const notes = (await sql`
    SELECT id, slug, text, note, highlight_id, created_at_ms, updated_at_ms
    FROM reader_notes
    WHERE user_email = ${email}
  `) as Array<Record<string, any>>;
  const [settings] = (await sql`
    SELECT font_size, theme
    FROM reader_settings
    WHERE user_email = ${email}
    LIMIT 1
  `) as Array<Record<string, any>>;

  return {
    profile: {
      email,
      name: profile?.name ?? '',
      photo: profile?.photo_url ?? null,
      notifications: Boolean(profile?.notifications_enabled),
    },
    progress: progress.map((item) => ({
      category: item.category,
      slug: item.slug,
      entry: {
        readCount: Number(item.read_count || 0),
        lastRead: item.last_read ? new Date(item.last_read).toISOString() : '',
        updatedAt: item.updated_at ? new Date(item.updated_at).toISOString() : '',
        progress: Number(item.progress || 0),
        scrollPos: Number(item.scroll_pos || 0),
      },
    })),
    highlights: highlights.map((item) => ({
      slug: item.slug,
      item: {
        id: item.id,
        text: item.text,
        start: item.start_offset,
        end: item.end_offset,
        createdAt: Number(item.created_at_ms),
        updatedAt: Number(item.updated_at_ms),
      },
    })),
    notes: notes.map((item) => ({
      slug: item.slug,
      item: {
        id: item.id,
        text: item.text,
        note: item.note,
        highlightId: item.highlight_id || undefined,
        createdAt: Number(item.created_at_ms),
        updatedAt: Number(item.updated_at_ms),
      },
    })),
    settings: {
      fontSize: settings?.font_size ?? null,
      theme: settings?.theme ?? null,
    },
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  try {
    await ensureUser(session.email);
    const sql = getSql();

    if (req.method === 'GET') {
      return res.status(200).json(await readRemoteState(session.email));
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Método não permitido' });
    }

    const body = await readJsonBody(req);
    const profile = body.profile && typeof body.profile === 'object'
      ? body.profile as Record<string, unknown>
      : null;
    const settings = body.settings && typeof body.settings === 'object'
      ? body.settings as Record<string, unknown>
      : null;

    if (profile) {
      await sql`
        UPDATE app_users
        SET
          name = COALESCE(NULLIF(${cleanText(profile.name, 200)}, ''), name),
          photo_url = COALESCE(NULLIF(${cleanText(profile.photo, 12000)}, ''), photo_url),
          notifications_enabled = ${Boolean(profile.notifications)},
          updated_at = NOW()
        WHERE email = ${session.email}
      `;
    }

    if (settings) {
      await sql`
        INSERT INTO reader_settings (user_email, font_size, theme, updated_at)
        VALUES (
          ${session.email},
          ${settings.fontSize == null ? null : clampInt(settings.fontSize, 12, 28, 16)},
          ${cleanText(settings.theme, 40) || null},
          NOW()
        )
        ON CONFLICT (user_email) DO UPDATE SET
          font_size = COALESCE(EXCLUDED.font_size, reader_settings.font_size),
          theme = COALESCE(EXCLUDED.theme, reader_settings.theme),
          updated_at = NOW()
      `;
    }

    const progress = Array.isArray(body.progress) ? body.progress.slice(0, 10000) : [];
    for (const raw of progress) {
      if (!raw || typeof raw !== 'object') continue;
      const item = raw as Record<string, unknown>;
      const entry = item.entry && typeof item.entry === 'object'
        ? item.entry as Record<string, unknown>
        : {};
      const category = cleanText(item.category, 40);
      const slug = cleanText(item.slug, 600);
      if (!VALID_CATEGORIES.has(category) || !slug) continue;
      const updatedAt = toIsoOrNull(entry.updatedAt) ?? new Date().toISOString();
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
          ${toIsoOrNull(entry.lastRead)},
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
    }

    const highlights = Array.isArray(body.highlights) ? body.highlights.slice(0, 10000) : [];
    for (const raw of highlights) {
      if (!raw || typeof raw !== 'object') continue;
      const row = raw as Record<string, unknown>;
      const item = row.item && typeof row.item === 'object'
        ? row.item as Record<string, unknown>
        : {};
      const slug = cleanText(row.slug, 600);
      const id = cleanText(item.id, 120);
      const text = cleanText(item.text, 12000);
      if (!slug || !id || !text) continue;
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
        ON CONFLICT (user_email, id) DO UPDATE SET
          slug = EXCLUDED.slug,
          text = EXCLUDED.text,
          start_offset = EXCLUDED.start_offset,
          end_offset = EXCLUDED.end_offset,
          created_at_ms = LEAST(reader_highlights.created_at_ms, EXCLUDED.created_at_ms),
          updated_at_ms = GREATEST(reader_highlights.updated_at_ms, EXCLUDED.updated_at_ms)
      `;
    }

    const notes = Array.isArray(body.notes) ? body.notes.slice(0, 10000) : [];
    for (const raw of notes) {
      if (!raw || typeof raw !== 'object') continue;
      const row = raw as Record<string, unknown>;
      const item = row.item && typeof row.item === 'object'
        ? row.item as Record<string, unknown>
        : {};
      const slug = cleanText(row.slug, 600);
      const id = cleanText(item.id, 120);
      const text = cleanText(item.text, 12000);
      if (!slug || !id || !text) continue;
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
          ${cleanText(item.note, 20000)},
          ${toMs(item.createdAt)},
          ${toMs(item.updatedAt)}
        )
        ON CONFLICT (user_email, id) DO UPDATE SET
          slug = EXCLUDED.slug,
          highlight_id = EXCLUDED.highlight_id,
          text = EXCLUDED.text,
          note = EXCLUDED.note,
          created_at_ms = LEAST(reader_notes.created_at_ms, EXCLUDED.created_at_ms),
          updated_at_ms = GREATEST(reader_notes.updated_at_ms, EXCLUDED.updated_at_ms)
      `;
    }

    return res.status(200).json(await readRemoteState(session.email));
  } catch (error) {
    console.error('[sync] erro:', error);
    return res.status(500).json({ error: 'Erro interno' });
  }
}
