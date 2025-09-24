import fetch from "node-fetch";

const API = "https://discord.com/api/v10";

function authHeader(token?: string) {
  const t = token ?? process.env.TOKEN;
  if (!t) throw new Error("BOT TOKEN missing for REST calls (TOKEN)");
  return { Authorization: `Bot ${t}` };
}

export async function getGuildMember(guildID: string, userID: string) {
  const cacheKey = `member:${guildID}:${userID}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;
  const res = await fetch(`${API}/guilds/${guildID}/members/${userID}`, {
    headers: {
      ...authHeader(),
    },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`REST getGuildMember failed: ${res.status}`);
  const data = (await res.json()) as { user: { id: string }; roles: string[]; permissions?: string };
  setCache(cacheKey, data);
  return data;
}

export async function getGuildRoles(guildID: string) {
  const cacheKey = `roles:${guildID}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;
  const res = await fetch(`${API}/guilds/${guildID}/roles`, {
    headers: {
      ...authHeader(),
    },
  });
  if (!res.ok) throw new Error(`REST getGuildRoles failed: ${res.status}`);
  const data = (await res.json()) as Array<{ id: string; permissions: string }>;
  setCache(cacheKey, data);
  return data;
}

// Simple in-memory TTL cache
type CacheEntry = { value: any; expiresAt: number };
const CACHE = new Map<string, CacheEntry>();
const TTL_MS = Number(process.env.REST_CACHE_TTL_MS ?? 30000);

function getCache<T = any>(key: string): T | undefined {
  const e = CACHE.get(key);
  if (!e) return undefined;
  if (Date.now() > e.expiresAt) {
    CACHE.delete(key);
    return undefined;
  }
  return e.value as T;
}

function setCache(key: string, value: any, ttlMs: number = TTL_MS) {
  CACHE.set(key, { value, expiresAt: Date.now() + ttlMs });
}
