import { fetchSnapshot } from '../utils/tseProxy';
import { parseCargoUf } from './_utils';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const parsed = parseCargoUf(query as { cargo?: string; uf?: string });
  if ('error' in parsed) {
    throw createError({ statusCode: 400, statusMessage: parsed.error });
  }
  const snapshot = await fetchSnapshot(parsed.cargo, parsed.abrangencia, parsed.key.endsWith(':2') ? 2 : 1);
  if (!snapshot) {
    throw createError({ statusCode: 503, statusMessage: 'dados ainda não disponíveis' });
  }
  return snapshot;
});
