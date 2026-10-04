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

export interface CandidatoRank {
  posicao: number;
  sqcand: string;
  numero: string;
  nome: string;
  nomeUrna: string;
  partido: string;
  federacao?: string;
  coligacao?: string;
  votos: number;
  pct: number | null;
  destinacao: 'valido' | 'valido-legenda' | 'anulado' | 'anulado-sub-judice';
  eleito: boolean;
  situacao?: string;
  vice?: string;
  suplentes?: string[];
  substituiu?: string;
  fotoUrl?: string | null;
}

export interface Snapshot {
  chave: string;
  cargo: CargoKey;
  codigoCargo: '0001' | '0003' | '0005' | '0006' | '0007' | '0008';
  abrangencia: Abrangencia;
  turno: 1 | 2;
  vagas: number;
  geradoEm: { data: string; hora: string };
  totalizadoEm: { data: string; hora: string };
  buscadoEm: string;
  andamento: 'n' | 'p' | 'f';
  totalizacaoFinal: boolean;
  matematicamenteDefinido?: 's' | 'e' | 'n';
  divulgaVotacao: boolean;
  secoes: { total: number; totalizadas: number; naoTotalizadas: number; pct: number };
  eleitorado: { aptos: number; comparecimento: number; abstencao: number; pctComparecimento: number; pctAbstencao: number };
  votos: { total: number; validos: number; brancos: number; nulos: number; nominais?: number; legenda?: number };
  top5: CandidatoRank[];
  candidatos: CandidatoRank[];
  totalCandidatos: number;
  desatualizado: boolean;
  hash: string;
}

export interface TseMeta {
  baseUrl: string;
  ambienteComum: string;
  ambiente: string;
  ciclo: string;
  pleito: string;
  turno: 1 | 2;
  eleicaoFederal: string;
  eleicaoEstadual: string;
  cargos: { key: CargoKey; cd: string; label: string }[];
  ufs: Uf[];
}

export interface ChaveEstado {
  etag?: string;
  lastModified?: string;
  snapshot?: Snapshot;
  proximaBuscaEm: number;
  falhas404: number;
  falhasRede: number;
  assinantes: number;
}
