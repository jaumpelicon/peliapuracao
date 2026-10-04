#!/usr/bin/env node
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseEa20 } from '../server/tse/parser.ts';
import type { CargoKey, Abrangencia, TseMeta } from '../shared/types.ts';

const DATA_DIR = join(process.cwd(), 'public', 'data');

const FIXTURES: { cargo: CargoKey; abrangencia: Abrangencia; file: string }[] = [
  { cargo: 'presidente', abrangencia: 'BR', file: 'br-c0001-e006257-u.json' },
  { cargo: 'presidente', abrangencia: 'SP', file: 'sp-c0001-e006257-u.json' },
  { cargo: 'presidente', abrangencia: 'ZZ', file: 'zz-c0001-e006257-u.json' },
  { cargo: 'governador', abrangencia: 'SP', file: 'sp-c0003-e006259-u.json' },
  { cargo: 'senador', abrangencia: 'SP', file: 'sp-c0005-e006259-u.json' },
  { cargo: 'deputado-federal', abrangencia: 'SP', file: 'sp-c0006-e006259-u.json' },
  { cargo: 'deputado-estadual', abrangencia: 'SP', file: 'sp-c0007-e006259-u.json' },
  { cargo: 'deputado-estadual', abrangencia: 'DF', file: 'df-c0008-e006259-u.json' },
];

const meta: TseMeta = {
  baseUrl: 'https://resultados.tse.jus.br',
  ambienteComum: 'oficial',
  ambiente: 'oficial',
  ciclo: 'ele2026',
  pleito: '3220',
  turno: 1,
  eleicaoFederal: '6257',
  eleicaoEstadual: '6259',
  cargos: [
    { key: 'presidente', cd: '0001', label: 'Presidente' },
    { key: 'governador', cd: '0003', label: 'Governador' },
    { key: 'senador', cd: '0005', label: 'Senador' },
    { key: 'deputado-federal', cd: '0006', label: 'Deputado Federal' },
    { key: 'deputado-estadual', cd: '0007', label: 'Deputado Estadual/Distrital' },
  ],
  ufs: ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'],
};

function fotoUrl(cargo: CargoKey, abrangencia: Abrangencia, sqcand: string) {
  const uf = cargo === 'presidente' ? 'br' : abrangencia.toLowerCase();
  const eleicao = cargo === 'presidente' ? meta.eleicaoFederal : meta.eleicaoEstadual;
  return `https://resultados.tse.jus.br/oficial/ele2026/${eleicao}/fotos/${uf}/${sqcand}.jpeg`;
}

async function main() {
  mkdirSync(DATA_DIR, { recursive: true });

  writeFileSync(join(DATA_DIR, 'meta.json'), JSON.stringify({
    status: 'ok',
    ...meta,
    serverTime: new Date().toISOString(),
  }), 'utf8');

  for (const { cargo, abrangencia, file } of FIXTURES) {
    const raw = JSON.parse(readFileSync(join(process.cwd(), 'fixtures', file), 'utf8'));
    const snap = parseEa20(raw, cargo, abrangencia, meta.turno, new Date().toISOString());
    for (const c of snap.top5) {
      c.fotoUrl = fotoUrl(cargo, abrangencia, c.sqcand);
    }
    const key = `${cargo}-${abrangencia}-${meta.turno}`;
    writeFileSync(join(DATA_DIR, `${key}.json`), JSON.stringify(snap), 'utf8');
    console.log(`✓ ${key}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
