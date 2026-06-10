import { neon } from '@neondatabase/serverless';

let sqlClient: ReturnType<typeof neon> | null = null;
let schemaReady: Promise<void> | null = null;

export function getSql() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error('DATABASE_URL não configurado.');
  }
  if (!sqlClient) {
    sqlClient = neon(databaseUrl);
  }
  return sqlClient;
}

export async function ensureUser(email: string): Promise<void> {
  await ensureSchema();
  const sql = getSql();
  await sql`
    INSERT INTO app_users (email)
    VALUES (${email})
    ON CONFLICT (email) DO NOTHING
  `;
}

export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const sql = getSql();
      await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;
      await sql`
        CREATE TABLE IF NOT EXISTS app_users (
          email TEXT PRIMARY KEY,
          name TEXT NOT NULL DEFAULT '',
          photo_url TEXT,
          notifications_enabled BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS reading_progress (
          user_email TEXT NOT NULL REFERENCES app_users(email) ON DELETE CASCADE,
          category TEXT NOT NULL,
          slug TEXT NOT NULL,
          read_count INTEGER NOT NULL DEFAULT 0,
          last_read TIMESTAMPTZ,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
          scroll_pos INTEGER NOT NULL DEFAULT 0 CHECK (scroll_pos >= 0),
          PRIMARY KEY (user_email, category, slug)
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS idx_reading_progress_user_updated
        ON reading_progress (user_email, updated_at DESC)
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS reader_highlights (
          user_email TEXT NOT NULL REFERENCES app_users(email) ON DELETE CASCADE,
          id TEXT NOT NULL,
          slug TEXT NOT NULL,
          text TEXT NOT NULL,
          start_offset INTEGER NOT NULL DEFAULT -1,
          end_offset INTEGER NOT NULL DEFAULT -1,
          created_at_ms BIGINT NOT NULL,
          updated_at_ms BIGINT NOT NULL,
          PRIMARY KEY (user_email, id)
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS idx_reader_highlights_user_slug
        ON reader_highlights (user_email, slug)
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS reader_notes (
          user_email TEXT NOT NULL REFERENCES app_users(email) ON DELETE CASCADE,
          id TEXT NOT NULL,
          slug TEXT NOT NULL,
          highlight_id TEXT,
          text TEXT NOT NULL,
          note TEXT NOT NULL,
          created_at_ms BIGINT NOT NULL,
          updated_at_ms BIGINT NOT NULL,
          PRIMARY KEY (user_email, id)
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS idx_reader_notes_user_slug
        ON reader_notes (user_email, slug)
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS reader_settings (
          user_email TEXT PRIMARY KEY REFERENCES app_users(email) ON DELETE CASCADE,
          font_size INTEGER,
          theme TEXT,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}

export function toIsoOrNull(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const ms = new Date(value).getTime();
  if (!Number.isFinite(ms)) return null;
  return new Date(ms).toISOString();
}

export function clampInt(value: unknown, min: number, max: number, fallback = 0): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.round(parsed)));
}

export function cleanText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}
