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
