import type { CargoKey, Abrangencia } from '~/shared/types';
import { UFs } from '~/shared/tse';

export function parseCargoUf(query: { cargo?: string; uf?: string }): { cargo: CargoKey; abrangencia: Abrangencia; key: string } | { error: string } {
  const validCargos: CargoKey[] = ['presidente', 'governador', 'senador', 'deputado-federal', 'deputado-estadual'];
  const cargo = query.cargo?.toLowerCase() as CargoKey;
  if (!validCargos.includes(cargo)) {
    return { error: 'cargo inválido' };
  }
  const ufUpper = (query.uf || 'BR').toUpperCase();
  if (cargo === 'presidente') {
    if (!['BR', 'ZZ', ...UFs].includes(ufUpper as any)) return { error: 'uf inválida' };
  } else {
    if (!UFs.includes(ufUpper as any)) return { error: 'uf inválida' };
  }
  const abrangencia = ufUpper as Abrangencia;
  const turno = Number(process.env.TSE_TURNO || 1) as 1 | 2;
  return { cargo, abrangencia, key: `${cargo}:${abrangencia}:${turno}` };
}
