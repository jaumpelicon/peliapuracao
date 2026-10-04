import type { CargoKey, Abrangencia, Uf } from '~/shared/types';
import { UFs } from '~/shared/tse';
import type { TseMeta } from '../tse/types';

export function generateKeyWhitelist(meta: TseMeta): { cargo: CargoKey; abrangencia: Abrangencia; key: string }[] {
  const keys: { cargo: CargoKey; abrangencia: Abrangencia; key: string }[] = [];
  const presidenteAbr: Abrangencia[] = ['BR', ...UFs, 'ZZ'];
  for (const abr of presidenteAbr) keys.push({ cargo: 'presidente', abrangencia: abr, key: `presidente:${abr}:${meta.turno}` });
  const estaduais: CargoKey[] = ['governador', 'senador', 'deputado-federal', 'deputado-estadual'];
  for (const cargo of estaduais) {
    for (const uf of UFs) {
      if (cargo === 'deputado-estadual' && uf === 'DF') continue;
      keys.push({ cargo, abrangencia: uf, key: `${cargo}:${uf}:${meta.turno}` });
    }
  }
  keys.push({ cargo: 'deputado-estadual', abrangencia: 'DF', key: `deputado-estadual:DF:${meta.turno}` });
  return keys;
}
