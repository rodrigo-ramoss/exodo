type RedisArgument = string | number;
type RedisCommand = [string, ...RedisArgument[]];

interface PipelineRow {
  result?: unknown;
  error?: string;
}

interface UpstashConfig {
  url: string;
  token: string;
}

function getConfig(): UpstashConfig | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return {
    url: url.endsWith('/') ? url.slice(0, -1) : url,
    token,
  };
}

export function isUpstashRedisConfigured(): boolean {
  return !!getConfig();
}

export async function upstashPipeline(commands: RedisCommand[]): Promise<unknown[]> {
  const config = getConfig();
  if (!config) {
    throw new Error('UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN não configurados.');
  }

  const response = await fetch(`${config.url}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(commands),
  });

  const payload = (await response.json().catch(() => null)) as PipelineRow[] | { error?: string } | null;

  if (!response.ok) {
    const message =
      payload && !Array.isArray(payload) && payload.error
        ? payload.error
        : `HTTP ${response.status}`;
    throw new Error(`Upstash pipeline failed: ${message}`);
  }

  if (!Array.isArray(payload)) {
    throw new Error('Resposta inválida do Upstash pipeline.');
  }

  const out: unknown[] = [];
  for (const row of payload) {
    if (row?.error) {
      throw new Error(`Upstash command failed: ${row.error}`);
    }
    out.push(row?.result ?? null);
  }

  return out;
}

