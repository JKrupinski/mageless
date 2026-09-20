import Redis from 'ioredis';

/**
 * Lazily-created valkey/redis connection, shared per Node process.
 *
 * The Magento compose stack already runs valkey on :6379; we borrow it on a
 * separate logical DB so storefront keys never collide with Magento's own.
 * Every call site must tolerate the cache being unavailable — a dead cache
 * degrades the storefront to "slower", never to "broken".
 */
let client: Redis | null = null;
let disabled = false;

function readEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export function isCacheEnabled(): boolean {
  return !disabled && readEnv('GRAPHQL_CACHE_ENABLED', 'true') !== 'false';
}

export function getRedis(): Redis | null {
  if (!isCacheEnabled()) return null;
  if (client) return client;

  const url = process.env['REDIS_URL'];
  if (!url) {
    disabled = true;
    return null;
  }

  client = new Redis(url, {
    db: Number(readEnv('REDIS_DB', '5')),
    lazyConnect: false,
    enableOfflineQueue: false,
    // Fail fast: an unreachable cache must not add latency to every request.
    connectTimeout: 500,
    maxRetriesPerRequest: 1,
    retryStrategy: (attempt) => (attempt > 5 ? null : Math.min(attempt * 200, 2000)),
  });

  client.on('error', (error: Error) => {
    // ioredis emits on every reconnect attempt; log once per process and move on.
    if (!disabled) {
      console.warn('[cache] redis unavailable, serving uncached:', error.message);
      disabled = true;
    }
  });

  client.on('ready', () => {
    disabled = false;
  });

  return client;
}

/** Read a JSON value, returning `null` on miss or on any cache failure. */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    const raw = await redis.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/** Write a JSON value with a TTL. Failures are swallowed on purpose. */
export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    /* cache writes are best-effort */
  }
}

/** Drop every storefront key — handy after a Magento reindex. */
export async function cachePurge(prefix = 'gql:'): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;
  let removed = 0;
  try {
    let cursor = '0';
    do {
      const [next, keys] = await redis.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 200);
      cursor = next;
      if (keys.length > 0) removed += await redis.del(...keys);
    } while (cursor !== '0');
  } catch {
    /* ignore */
  }
  return removed;
}
