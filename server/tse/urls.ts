import type { CargoKey, Abrangencia, TseMeta } from './types';
import { CARGOS, cargoCode } from '~/shared/tse';

const pad = (n: number | string, w: number) => String(n).padStart(w, '0');

export function urlConfigEleicoes(meta: TseMeta) {
  return `${meta.baseUrl}/${meta.ambienteComum}/comum/config/ele-c.json`;
}

export function urlResultado(meta: TseMeta, cargo: CargoKey, abrangencia: Abrangencia) {
  const info = cargoCode(cargo, abrangencia);
  const uf = abrangencia.toLowerCase();
  const eleicao = CARGOS[cargo].eleicao === 'federal' ? meta.eleicaoFederal : meta.eleicaoEstadual;
  return `${meta.baseUrl}/${meta.ambiente}/${meta.ciclo}/${eleicao}/dados/${uf}/${uf}-c${pad(info, 4)}-e${pad(eleicao, 6)}-u.json`;
}

export function urlAcompanhamento(meta: TseMeta, abrangencia: Abrangencia, eleicaoTipo: 'federal' | 'estadual') {
  const uf = abrangencia.toLowerCase();
  const eleicao = eleicaoTipo === 'federal' ? meta.eleicaoFederal : meta.eleicaoEstadual;
  return `${meta.baseUrl}/${meta.ambiente}/${meta.ciclo}/${eleicao}/dados/${uf}/${uf}-e${pad(eleicao, 6)}-ab.json`;
}

export function urlEleitos(meta: TseMeta, cargo: CargoKey, abrangencia: Abrangencia) {
  const info = cargoCode(cargo, abrangencia);
  const uf = abrangencia.toLowerCase();
  const eleicao = CARGOS[cargo].eleicao === 'federal' ? meta.eleicaoFederal : meta.eleicaoEstadual;
  return `${meta.baseUrl}/${meta.ambiente}/${meta.ciclo}/${eleicao}/dados/${uf}/${uf}-c${pad(info, 4)}-e${pad(eleicao, 6)}-e.json`;
}

export function urlFoto(meta: TseMeta, sqcand: string, abrangencia: Abrangencia, eleicaoTipo: 'federal' | 'estadual') {
  const uf = abrangencia.toLowerCase();
  const eleicao = eleicaoTipo === 'federal' ? meta.eleicaoFederal : meta.eleicaoEstadual;
  return `${meta.baseUrl}/${meta.ambiente}/${meta.ciclo}/${eleicao}/fotos/${uf}/${sqcand}.jpeg`;
}
