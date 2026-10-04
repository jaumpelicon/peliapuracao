#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getBaseConfig, getEffectiveBase, discoverMeta } from '../server/tse/config.ts';
import { urlResultado } from '../server/tse/urls.ts';
import { parseEa20 } from '../server/tse/parser.ts';
import { generateKeyWhitelist } from '../server/utils/keys.ts';
import type { CargoKey, Abrangencia, TseMeta } from '../server/tse/types.ts';

const DATA_DIR = join(process.cwd(), 'public', 'data');

function fotoUrl(meta: TseMeta, cargo: CargoKey, abrangencia: Abrangencia, sqcand: string) {
  const uf = cargo === 'presidente' ? 'br' : abrangencia.toLowerCase();
  const eleicao = cargo === 'presidente' ? meta.eleicaoFederal : meta.eleicaoEstadual;
  return `${meta.baseUrl}/${meta.ambiente}/${meta.ciclo}/${eleicao}/fotos/${uf}/${sqcand}.jpeg`;
}

async function main() {
  mkdirSync(DATA_DIR, { recursive: true });

  const cfg = getBaseConfig();
  const { base, ambienteComum } = getEffectiveBase(cfg);
  console.log(`Buscando dados reais do TSE: ${base}, turno ${cfg.turno}`);

  const meta = await discoverMeta(async (url) => {
    const res = await fetch(url, { headers: { 'User-Agent': 'apuracao-eleicoes-2026/1.0' } });
    if (res.status === 200) return res.json();
    throw new Error(`ele-c.json ${res.status}`);
  });

  writeFileSync(join(DATA_DIR, 'meta.json'), JSON.stringify({
    status: 'ok',
    baseUrl: meta.baseUrl,
    ambienteComum: meta.ambienteComum,
    ambiente: meta.ambiente,
    ciclo: meta.ciclo,
    pleito: meta.pleito,
    turno: meta.turno,
    eleicaoFederal: meta.eleicaoFederal,
    eleicaoEstadual: meta.eleicaoEstadual,
    cargos: meta.cargos,
    ufs: meta.ufs,
    serverTime: new Date().toISOString(),
  }), 'utf8');

  const keys = generateKeyWhitelist(meta);
  console.log(`Buscando ${keys.length} chaves...`);

  for (const { cargo, abrangencia, key } of keys) {
    const url = urlResultado(meta, cargo, abrangencia);
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json', 'User-Agent': 'apuracao-eleicoes-2026/1.0' },
      });
      if (res.status === 200) {
        const raw = await res.json();
        const snap = parseEa20(raw, cargo, abrangencia, meta.turno, new Date().toISOString());
        for (const c of snap.top5) {
          c.fotoUrl = fotoUrl(meta, cargo, abrangencia, c.sqcand);
        }
        writeFileSync(join(DATA_DIR, `${key.replace(/:/g, '-')}.json`), JSON.stringify(snap), 'utf8');
        console.log(`✓ ${key}`);
      } else if (res.status === 404) {
        console.log(`- ${key} (404)`);
      } else {
        console.log(`✗ ${key} (${res.status})`);
      }
    } catch (err) {
      console.log(`✗ ${key} ${err.message}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
