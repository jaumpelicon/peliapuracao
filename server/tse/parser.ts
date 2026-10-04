import { z } from 'zod';
import type { CargoKey, Abrangencia } from '~/shared/tse';
import { CARGOS, cargoCode } from '~/shared/tse';
import type { Snapshot, CandidatoRank } from './types';

const stringNumber = z.union([z.string(), z.number()]);

const secoesSchema = z.object({
  ts: stringNumber.optional(),
  st: stringNumber.optional(),
  pstn: stringNumber.optional(),
  snt: stringNumber.optional(),
}).passthrough();

const eleitoradoSchema = z.object({
  te: stringNumber.optional(),
  c: stringNumber.optional(),
  pc: stringNumber.optional(),
  a: stringNumber.optional(),
  pa: stringNumber.optional(),
}).passthrough();

const votosSchema = z.object({
  tv: stringNumber.optional(),
  vv: stringNumber.optional(),
  vb: stringNumber.optional(),
  pvb: stringNumber.optional(),
  tvn: stringNumber.optional(),
  vn: stringNumber.optional(),
  vnt: stringNumber.optional(),
  vnom: stringNumber.optional(),
  vl: stringNumber.optional(),
  van: stringNumber.optional(),
  vansj: stringNumber.optional(),
  vscv: stringNumber.optional(),
}).passthrough();

const viceSuplenteSchema = z.object({
  tp: z.string().optional(),
  nm: z.string().optional(),
  nmu: z.string().optional(),
  sgp: z.string().optional(),
}).passthrough();

const substituidoSchema = z.object({
  nm: z.string().optional(),
  nmu: z.string().optional(),
  sgp: z.string().optional(),
}).passthrough();

const candidatoSchema = z.object({
  n: z.string().optional(),
  sqcand: z.string().optional(),
  nm: z.string().optional(),
  nmu: z.string().optional(),
  dvt: z.string().optional(),
  seq: stringNumber.optional(),
  e: z.string().optional(),
  st: z.string().optional(),
  vap: stringNumber.optional(),
  pvap: z.string().optional(),
  pvapn: stringNumber.optional(),
  vs: z.array(viceSuplenteSchema).optional(),
  subs: z.array(substituidoSchema).optional(),
}).passthrough();

const partidoSchema = z.object({
  n: z.string().optional(),
  sg: z.string().optional(),
  nm: z.string().optional(),
  nfed: z.string().optional(),
  cand: z.array(candidatoSchema).optional(),
}).passthrough();

const agrupamentoSchema = z.object({
  n: z.string().optional(),
  nm: z.string().optional(),
  tp: z.string().optional(),
  com: z.string().optional(),
  vag: stringNumber.optional(),
  par: z.array(partidoSchema).optional(),
}).passthrough();

const cargoSchema = z.object({
  cd: stringNumber,
  nmn: z.string().optional(),
  nmm: z.string().optional(),
  nmf: z.string().optional(),
  nv: stringNumber,
  fed: z.array(z.object({}).passthrough()).optional(),
  agr: z.array(agrupamentoSchema).optional(),
}).passthrough();

export const ea20Schema = z.object({
  ele: stringNumber.optional(),
  t: stringNumber.optional(),
  f: z.string().optional(),
  tpabr: z.string().optional(),
  cdabr: z.string().optional(),
  dg: z.string().optional(),
  hg: z.string().optional(),
  dv: z.string().optional(),
  dt: z.string().optional(),
  ht: z.string().optional(),
  tf: z.string().optional(),
  and: z.string().optional(),
  md: z.string().optional(),
  esae: z.string().optional(),
  mnae: z.array(z.any()).optional(),
  carg: z.array(cargoSchema).min(1),
  s: secoesSchema,
  e: eleitoradoSchema,
  v: votosSchema,
}).passthrough();

export type Ea20 = z.infer<typeof ea20Schema>;

function toNum(v: unknown): number {
  if (v === undefined || v === null || v === '') return 0;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  const s = String(v).replace(/\./g, '').replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function toPct(v: unknown): number | null {
  if (v === undefined || v === null || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const s = String(v).replace(/\./g, '').replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function mapDestinacao(dvt?: string): CandidatoRank['destinacao'] {
  if (!dvt) return 'valido';
  if (dvt === 'Válido (legenda)') return 'valido-legenda';
  if (dvt === 'Anulado sub judice' || dvt.toLowerCase().includes('sub judice')) return 'anulado-sub-judice';
  if (dvt === 'Anulado' || dvt.toLowerCase().includes('anul')) return 'anulado';
  return 'valido';
}

export function parseEa20(
  raw: unknown,
  cargo: CargoKey,
  abrangencia: Abrangencia,
  turno: 1 | 2,
  buscadoEm = new Date().toISOString(),
): Snapshot {
  const data = ea20Schema.parse(raw);

  const info = CARGOS[cargo];
  const cargoRaw = data.carg[0];

  // achatar candidatos
  const todos: CandidatoRank[] = [];
  for (const agr of cargoRaw.agr || []) {
    for (const par of agr.par || []) {
      for (const cand of par.cand || []) {
        const vice = cand.vs?.find(v => v.tp === 'v');
        const suplentes = cand.vs?.filter(v => v.tp === 's1' || v.tp === 's2').map(v => v.nmu || '').filter(Boolean);
        const substituiu = cand.subs?.[0]?.nmu;
        const votos = toNum(cand.vap);
        todos.push({
          posicao: 0,
          sqcand: cand.sqcand || '',
          numero: cand.n || '',
          nome: cand.nm || '',
          nomeUrna: cand.nmu || cand.nm || '',
          partido: par.sg || '',
          federacao: agr.tp === 'f' ? agr.nm || undefined : undefined,
          coligacao: agr.tp === 'c' ? agr.com || undefined : undefined,
          votos,
          pct: toPct(cand.pvapn) ?? toPct(cand.pvap),
          destinacao: mapDestinacao(cand.dvt),
          eleito: cand.e === 's',
          situacao: cand.st || undefined,
          vice: vice?.nmu,
          suplentes: suplentes?.length ? suplentes : undefined,
          substituiu,
          fotoUrl: null,
        });
      }
    }
  }

  // ordenar
  todos.sort((a, b) => {
    if (b.votos !== a.votos) return b.votos - a.votos;
    return Number(a.numero) - Number(b.numero);
  });
  todos.forEach((c, i) => { c.posicao = i + 1; });

  const top5 = todos.slice(0, 5);
  const totalCandidatos = todos.length;

  const hashBase = {
    top5: top5.map(c => ({ n: c.numero, v: c.votos, p: c.pct })),
    secoes: { total: toNum(data.s.ts), totalizadas: toNum(data.s.st), naoTotalizadas: toNum(data.s.snt), pct: toPct(data.s.pstn) ?? 0 },
    votos: { total: toNum(data.v.tv), validos: toNum(data.v.vv), brancos: toNum(data.v.vb), nulos: toNum(data.v.vn || data.v.tvn) },
    andamento: data.and || 'n',
    tf: data.tf === 's',
    dv: data.dv === 's',
  };
  const hash = btoa(JSON.stringify(hashBase));

  return {
    chave: `${cargo}:${abrangencia}:${turno}`,
    cargo,
    codigoCargo: cargoCode(cargo, abrangencia) as Snapshot['codigoCargo'],
    abrangencia,
    turno,
    vagas: toNum(cargoRaw.nv),
    geradoEm: { data: data.dg || '', hora: data.hg || '' },
    totalizadoEm: { data: data.dt || '', hora: data.ht || '' },
    buscadoEm,
    andamento: (data.and as 'n' | 'p' | 'f') || 'n',
    totalizacaoFinal: data.tf === 's',
    matematicamenteDefinido: (data.md as 's' | 'e' | 'n') || undefined,
    divulgaVotacao: data.dv === 's',
    secoes: {
      total: toNum(data.s.ts),
      totalizadas: toNum(data.s.st),
      naoTotalizadas: toNum(data.s.snt),
      pct: toPct(data.s.pstn) ?? 0,
    },
    eleitorado: {
      aptos: toNum(data.e.te),
      comparecimento: toNum(data.e.c),
      abstencao: toNum(data.e.a),
      pctComparecimento: toPct(data.e.pc) ?? 0,
      pctAbstencao: toPct(data.e.pa) ?? 0,
    },
    votos: {
      total: toNum(data.v.tv),
      validos: toNum(data.v.vv),
      brancos: toNum(data.v.vb),
      nulos: toNum(data.v.vn || data.v.tvn),
      nominais: toNum(data.v.vnom),
      legenda: toNum(data.v.vl),
    },
    top5,
    totalCandidatos,
    desatualizado: false,
    hash,
  };
}
