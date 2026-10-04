import type { TseMeta } from './types';
import { urlConfigEleicoes } from './urls';
import { discoverMeta, getBaseConfig, getEffectiveBase, type RuntimeTseConfig } from './config';

export interface FetchResult {
  status: number;
  headers: Headers;
  body?: unknown;
  etag?: string;
  lastModified?: string;
}

interface TokenBucket {
  tokens: number;
  last: number;
}

export class TseClient {
  private meta?: TseMeta;
  private cfg: RuntimeTseConfig;
  private bucket: TokenBucket;
  private inFlight = 0;
  private globalPauseUntil = 0;
  private stats = { ok: 0, notModified: 0, notFound: 0, blocked: 0, error: 0 };

  constructor(cfg?: Partial<RuntimeTseConfig>) {
    this.cfg = cfg ? ({ ...getBaseConfig(), ...cfg } as RuntimeTseConfig) : getBaseConfig();
    this.bucket = { tokens: this.cfg.tseMaxRps, last: Date.now() };
  }

  getMeta() {
    return this.meta;
  }

  getStats() {
    return { ...this.stats };
  }

  isBlocked() {
    return Date.now() < this.globalPauseUntil;
  }

  getBlockedUntil() {
    return this.globalPauseUntil;
  }

  private userAgent() {
    return 'apuracao-eleicoes-2026/1.0 (backend; respeita limites TSE)';
  }

  async init() {
    if (this.meta) return this.meta;
    this.meta = await discoverMeta((url) => this.fetchJson(url).then(r => r.body));
    return this.meta;
  }

  async fetchJson(url: string, etag?: string, lastModified?: string): Promise<FetchResult> {
    if (this.isBlocked()) {
      return { status: 429, headers: new Headers(), etag, lastModified };
    }

    await this.acquireToken();
    await this.acquireConcurrency();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.cfg.tseTimeoutMs);

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'User-Agent': this.userAgent(),
    };
    if (etag) headers['If-None-Match'] = etag;
    if (lastModified) headers['If-Modified-Since'] = lastModified;

    try {
      const res = await fetch(url, { headers, signal: controller.signal });
      clearTimeout(timeout);

      const resEtag = res.headers.get('etag') || etag;
      const resLastModified = res.headers.get('last-modified') || lastModified;

      if (res.status === 200) {
        this.stats.ok++;
        const body = await res.json();
        return { status: 200, headers: res.headers, body, etag: resEtag, lastModified: resLastModified };
      }
      if (res.status === 304) {
        this.stats.notModified++;
        return { status: 304, headers: res.headers, etag: resEtag, lastModified: resLastModified };
      }
      if (res.status === 404) {
        this.stats.notFound++;
        return { status: 404, headers: res.headers, etag, lastModified };
      }
      if (res.status === 403 || res.status === 429) {
        this.stats.blocked++;
        this.globalPauseUntil = Date.now() + 10 * 60 * 1000 + 30 * 1000;
        return { status: res.status, headers: res.headers, etag, lastModified };
      }
      this.stats.error++;
      return { status: res.status, headers: res.headers, etag, lastModified };
    } catch (err) {
      clearTimeout(timeout);
      this.stats.error++;
      return { status: 0, headers: new Headers(), etag, lastModified };
    } finally {
      this.inFlight--;
    }
  }

  private async acquireToken() {
    const now = Date.now();
    const elapsed = (now - this.bucket.last) / 1000;
    this.bucket.tokens = Math.min(this.cfg.tseMaxRps, this.bucket.tokens + elapsed * this.cfg.tseMaxRps);
    this.bucket.last = now;
    if (this.bucket.tokens < 1) {
      const wait = (1 - this.bucket.tokens) / this.cfg.tseMaxRps * 1000;
      await sleep(wait);
      this.bucket.tokens = 0;
    } else {
      this.bucket.tokens--;
    }
  }

  private async acquireConcurrency() {
    while (this.inFlight >= this.cfg.tseMaxConcurrency) {
      await sleep(50);
    }
    this.inFlight++;
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
