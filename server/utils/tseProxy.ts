import type { CargoKey, Abrangencia, Snapshot, TseMeta } from '../tse/types';
import { getBaseConfig, getEffectiveBase, discoverMeta } from '../tse/config';
import { urlResultado } from '../tse/urls';
import { parseEa20 } from '../tse/parser';

interface CacheEntry {
  snapshot: Snapshot;
  etag?: string;
  lastModified?: string;
  fetchedAt: number;
}

const metaPromise: { current?: Promise<TseMeta> } = {};
const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<Snapshot | undefined>>();

function userAgent() {
  return 'apuracao-eleicoes-2026/1.0 (proxy; respeita limites TSE)';
}

async function getMeta(): Promise<TseMeta> {
  if (!metaPromise.current) {
    metaPromise.current = discoverMeta(async (url) => {
      const res = await fetch(url, { headers: { 'User-Agent': userAgent() } });
      if (res.status === 200) return res.json();
      throw new Error(`ele-c.json returned ${res.status}`);
    });
  }
  return metaPromise.current;
}

function getEffectiveBaseCached() {
  const cfg = getBaseConfig();
  return getEffectiveBase(cfg);
}

export function baseUrlForEnvironment() {
  return getEffectiveBaseCached().base;
}

export async function fetchSnapshot(
  cargo: CargoKey,
  abrangencia: Abrangencia,
  turno: 1 | 2 = 1,
): Promise<Snapshot | undefined> {
  const key = `${cargo}:${abrangencia}:${turno}`;
  const now = Date.now();
  const ttl = 10_000;
  const cached = cache.get(key);
  if (cached && now - cached.fetchedAt < ttl) return cached.snapshot;

  const existing = inFlight.get(key);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const meta = await getMeta();
      const url = urlResultado(meta, cargo, abrangencia);
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'User-Agent': userAgent(),
      };
      if (cached?.etag) headers['If-None-Match'] = cached.etag;
      if (cached?.lastModified) headers['If-Modified-Since'] = cached.lastModified;

      const res = await fetch(url, { headers });
      if (res.status === 304 && cached) {
        cached.fetchedAt = now;
        return cached.snapshot;
      }
      if (res.status === 200) {
        const body = await res.json();
        const snapshot = parseEa20(body, cargo, abrangencia, turno);
        cache.set(key, {
          snapshot,
          etag: res.headers.get('etag') || undefined,
          lastModified: res.headers.get('last-modified') || undefined,
          fetchedAt: now,
        });
        return snapshot;
      }
      if (cached) return cached.snapshot;
      return undefined;
    } catch {
      if (cached) return cached.snapshot;
      return undefined;
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, promise);
  return promise;
}

export function clearCache() {
  cache.clear();
  metaPromise.current = undefined;
}
