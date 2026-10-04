import type { TseMeta, CargoKey } from './types';

export interface RuntimeTseConfig {
  env: 'oficial';
  baseUrl: string;
  ambiente: string;
  ciclo: string;
  turno: 1 | 2;
  eleicaoFederalOverride: string;
  eleicaoEstadualOverride: string;
  tseMaxRps: number;
  tseMaxConcurrency: number;
  tseTimeoutMs: number;
}

export function getBaseConfig(): RuntimeTseConfig {
  const env = (typeof process !== 'undefined' ? process.env : {}) as Record<string, string | undefined>;
  return {
    env: 'oficial',
    baseUrl: env.TSE_BASE_URL || 'https://resultados.tse.jus.br',
    ambiente: env.TSE_AMBIENTE || 'oficial',
    ciclo: env.TSE_CICLO || 'ele2026',
    turno: Number(env.TSE_TURNO || 1) as 1 | 2,
    eleicaoFederalOverride: env.TSE_ELEICAO_FEDERAL || '',
    eleicaoEstadualOverride: env.TSE_ELEICAO_ESTADUAL || '',
    tseMaxRps: Number(env.TSE_MAX_RPS || 30),
    tseMaxConcurrency: Number(env.TSE_MAX_CONCURRENCY || 10),
    tseTimeoutMs: Number(env.TSE_TIMEOUT_MS || 8000),
  };
}

export function getEffectiveBase(cfg: RuntimeTseConfig): { base: string; ambiente: string; ambienteComum: string } {
  return { base: cfg.baseUrl, ambiente: cfg.ambiente || 'oficial', ambienteComum: 'oficial' };
}

export interface EleCJson {
  dg?: string;
  hg?: string;
  f?: string;
  pl?: Array<{
    cd: string;
    c?: string;
    dt?: string;
    dtlim?: string;
    e?: Array<{
      cd: string;
      cdt2?: string;
      nm?: string;
      t?: string;
      tp?: string;
      abr?: Array<{
        cd: string;
        cp?: Array<{ cd: string; ds: string; tp: string }>;
      }>;
    }>;
  }>;
}

export async function discoverMeta(fetcher: (url: string) => Promise<unknown>): Promise<TseMeta> {
  const cfg = getBaseConfig();
  const { base, ambiente, ambienteComum } = getEffectiveBase(cfg);

  const configUrl = `${base}/${ambienteComum}/comum/config/ele-c.json`;
  const eleC = await fetcher(configUrl) as EleCJson;

  const targetDate = cfg.turno === 1 ? '04/10/2026' : '25/10/2026';
  const pleito = eleC.pl?.find(p => p.c === cfg.ciclo || p.dt === targetDate);
  if (!pleito) {
    throw new Error(`Pleito do ciclo ${cfg.ciclo} (${targetDate}) não encontrado em ele-c.json`);
  }

  const turnoStr = String(cfg.turno);
  const eleicaoFederalRaw = pleito.e?.find(e => e.t === turnoStr && (e.tp === '8' || e.nm?.toLowerCase().includes('federal')));
  const eleicaoEstadualRaw = pleito.e?.find(e => e.t === turnoStr && (e.tp === '1' || e.nm?.toLowerCase().includes('estadual')) && !e.nm?.toLowerCase().includes('municipal'));

  const eleicaoFederal = cfg.eleicaoFederalOverride || eleicaoFederalRaw?.cd;
  const eleicaoEstadual = cfg.eleicaoEstadualOverride || eleicaoEstadualRaw?.cd;

  if (!eleicaoFederal || !eleicaoEstadual) {
    throw new Error(`Não foi possível descobrir eleições federal/estadual no pleito ${pleito.cd}`);
  }

  const cargos: { key: CargoKey; cd: string; label: string }[] = [];
  const cpFederal = eleicaoFederalRaw?.abr?.find(a => a.cd === 'br')?.cp || [];
  const cpEstadual = eleicaoEstadualRaw?.abr?.find(a => a.cd === 'br')?.cp || [];

  const mapCargo: Record<string, CargoKey> = {
    '1': 'presidente',
    '3': 'governador',
    '5': 'senador',
    '6': 'deputado-federal',
    '7': 'deputado-estadual',
    '8': 'deputado-estadual', // distrital mapeado para o mesmo seletor
  };

  for (const cp of cpFederal) {
    const key = mapCargo[cp.cd];
    if (key) cargos.push({ key, cd: cp.cd.padStart(4, '0'), label: cp.ds });
  }
  for (const cp of cpEstadual) {
    const key = mapCargo[cp.cd];
    if (key && !cargos.find(c => c.key === key)) {
      cargos.push({ key, cd: cp.cd.padStart(4, '0'), label: cp.ds });
    }
  }

  // garantir ordem fixa
  const order: CargoKey[] = ['presidente', 'governador', 'senador', 'deputado-federal', 'deputado-estadual'];
  cargos.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));

  return {
    baseUrl: base,
    ambienteComum,
    ambiente,
    ciclo: cfg.ciclo,
    pleito: pleito.cd,
    turno: cfg.turno,
    eleicaoFederal,
    eleicaoEstadual,
    cargos,
    ufs: ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'],
  };
}
