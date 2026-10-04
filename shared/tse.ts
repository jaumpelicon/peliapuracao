export type CargoKey = 'presidente' | 'governador' | 'senador' | 'deputado-federal' | 'deputado-estadual';

export const CARGOS: Record<CargoKey, { cd: string; label: string; eleicao: 'federal' | 'estadual' }> = {
  presidente: { cd: '0001', label: 'Presidente', eleicao: 'federal' },
  governador: { cd: '0003', label: 'Governador', eleicao: 'estadual' },
  senador: { cd: '0005', label: 'Senador', eleicao: 'estadual' },
  'deputado-federal': { cd: '0006', label: 'Deputado Federal', eleicao: 'estadual' },
  'deputado-estadual': { cd: '0007', label: 'Deputado Estadual/Distrital', eleicao: 'estadual' },
};

export const UFs = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
] as const;

export type Uf = (typeof UFs)[number];
export type Abrangencia = Uf | 'BR' | 'ZZ';

export function cargoCode(cargo: CargoKey, abrangencia?: Abrangencia): string {
  if (cargo === 'deputado-estadual' && abrangencia === 'DF') return '0008';
  return CARGOS[cargo].cd;
}

const pad = (n: number | string, w: number) => String(n).padStart(w, '0');

export const TSE_BASE_DEFAULT = 'https://resultados.tse.jus.br';

export interface TseMetaMinimal {
  baseUrl?: string | null;
  ambiente?: string | null;
  ciclo: string;
  eleicaoFederal: string;
  eleicaoEstadual: string;
}

function baseOf(meta: TseMetaMinimal) {
  return meta.baseUrl || TSE_BASE_DEFAULT;
}

function ambienteOf(meta: TseMetaMinimal) {
  return meta.ambiente || 'oficial';
}

export function urlResultado(meta: TseMetaMinimal, cargo: CargoKey, abrangencia: Abrangencia) {
  const info = cargoCode(cargo, abrangencia);
  const uf = abrangencia.toLowerCase();
  const eleicao = CARGOS[cargo].eleicao === 'federal' ? meta.eleicaoFederal : meta.eleicaoEstadual;
  return `${baseOf(meta)}/${ambienteOf(meta)}/${meta.ciclo}/${eleicao}/dados/${uf}/${uf}-c${pad(info, 4)}-e${pad(eleicao, 6)}-u.json`;
}

export function urlConfigEleicoes(meta: TseMetaMinimal) {
  return `${baseOf(meta)}/${ambienteOf(meta)}/comum/config/ele-c.json`;
}
