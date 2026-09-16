const redisUrl = () => process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "");
const redisToken = () => process.env.UPSTASH_REDIS_REST_TOKEN;

export function redisConfigured() {
  return Boolean(redisUrl() && redisToken());
}

export async function redisCommand<T = unknown>(command: unknown[]): Promise<T> {
  const url = redisUrl();
  const token = redisToken();
  if (!url || !token) throw new Error("Redis environment variables are missing.");
  const response = await fetch(url, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  const data = await response.json() as { result?: T; error?: string };
  if (!response.ok || data.error) throw new Error(data.error || "Database request failed.");
  return data.result as T;
}

export async function redisPipeline(commands: unknown[][]) {
  const url = redisUrl();
  const token = redisToken();
  if (!url || !token) throw new Error("Redis environment variables are missing.");
  const response = await fetch(`${url}/multi-exec`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(commands),
    cache: "no-store",
  });
  const data = await response.json() as Array<{ result?: unknown; error?: string }>;
  if (!response.ok || data.some(item => item.error)) throw new Error("Database pipeline failed.");
  return data.map(item => item.result);
}
