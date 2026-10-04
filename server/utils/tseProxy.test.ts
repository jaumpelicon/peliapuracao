import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { fetchSnapshot, clearCache } from './tseProxy';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { setTimeout } from 'node:timers/promises';

describe('tseProxy', () => {
  let server: ReturnType<typeof createServer>;
  let baseUrl: string;

  beforeAll(async () => {
    process.env.TSE_BASE_URL = '';
    clearCache();

    server = createServer((req, res) => {
      const url = new URL(req.url || '/', `http://localhost`);
      if (url.pathname === '/oficial/comum/config/ele-c.json') {
        const data = readFileSync(join(process.cwd(), 'fixtures', 'ele-c.json'));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(data);
        return;
      }
      if (url.pathname === '/oficial/ele2026/6259/dados/sp/sp-c0003-e006259-u.json') {
        const data = readFileSync(join(process.cwd(), 'fixtures', 'sp-c0003-e006259-u.json'));
        const etag = '"abc123"';
        if (req.headers['if-none-match'] === etag) {
          res.writeHead(304);
          res.end();
          return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json', ETag: etag });
        res.end(data);
        return;
      }
      res.writeHead(404);
      res.end('not found');
    });

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        baseUrl = `http://127.0.0.1:${(addr as any).port}`;
        process.env.TSE_BASE_URL = baseUrl;
        resolve();
      });
    });
  }, 10000);

  afterAll(() => {
    server?.close();
  });

  it('busca snapshot via proxy a partir de fixture real', async () => {
    const snap = await fetchSnapshot('governador', 'SP', 1);
    expect(snap).toBeDefined();
    expect(snap!.cargo).toBe('governador');
    expect(snap!.top5.length).toBeGreaterThan(0);
    expect(snap!.top5[0].nomeUrna).not.toMatch(/^CAND /);
  });

  it('retorna cache para a mesma chave sem nova requisição', async () => {
    const snap1 = await fetchSnapshot('governador', 'SP', 1);
    const snap2 = await fetchSnapshot('governador', 'SP', 1);
    expect(snap1?.buscadoEm).toBe(snap2?.buscadoEm);
  });
});
