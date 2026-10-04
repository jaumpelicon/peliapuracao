import { getBaseConfig, getEffectiveBase, discoverMeta } from '../tse/config';

export default defineEventHandler(async () => {
  const cfg = getBaseConfig();
  const { base, ambienteComum } = getEffectiveBase(cfg);
  const meta = await discoverMeta(async (url) => {
    const res = await fetch(url, { headers: { 'User-Agent': 'apuracao-eleicoes-2026/1.0' } });
    if (res.status === 200) return res.json();
    throw new Error(`ele-c.json returned ${res.status}`);
  });
  return {
    status: 'ok',
    ambiente: meta.ambiente,
    ciclo: meta.ciclo,
    pleito: meta.pleito,
    turno: meta.turno,
    eleicaoFederal: meta.eleicaoFederal,
    eleicaoEstadual: meta.eleicaoEstadual,
    cargos: meta.cargos,
    ufs: meta.ufs,
    serverTime: new Date().toISOString(),
  };
});
