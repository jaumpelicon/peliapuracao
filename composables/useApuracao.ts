import type { CargoKey, Abrangencia, Snapshot, TseMeta } from '~/shared/types';
import { parseEa20 } from '~/shared/parser';
import { urlResultado, cargoCode } from '~/shared/tse';

export { type TseMeta };

export function useApuracao() {
  const route = useRoute();
  const router = useRouter();
  const config = useRuntimeConfig();
  const turno = Number(config.public.tseTurno || 1) as 1 | 2;
  const corsProxy = String(config.public.corsProxy || '');

  const cargo = computed<CargoKey>({
    get: () => (route.query.cargo as CargoKey) || 'presidente',
    set: (v) => router.replace({ query: { ...route.query, cargo: v } }),
  });

  const uf = computed<string>({
    get: () => (route.query.uf as string) || 'BR',
    set: (v) => router.replace({ query: { ...route.query, uf: v } }),
  });

  const abrangencia = computed<Abrangencia>(() => uf.value.toUpperCase() as Abrangencia);

  const meta = ref<TseMeta | undefined>(undefined);
  const snapshot = ref<Snapshot | undefined>(undefined);
  const pending = ref(false);
  const error = ref<string | null>(null);
  const ultimaAtualizacao = ref(Date.now());
  const modo = ref<'live' | 'static' | null>(null);

  function fotoUrl(sqcand: string) {
    if (!meta.value) return null;
    const m = meta.value;
    const isFederal = cargo.value === 'presidente';
    const uf = isFederal ? 'br' : abrangencia.value.toLowerCase();
    const eleicao = isFederal ? m.eleicaoFederal : m.eleicaoEstadual;
    return `${m.baseUrl}/${m.ambiente}/${m.ciclo}/${eleicao}/fotos/${uf}/${sqcand}.jpeg`;
  }

  function aplicarFotos(s: Snapshot) {
    for (const c of s.top5) c.fotoUrl = fotoUrl(c.sqcand);
    for (const c of s.candidatos) c.fotoUrl = fotoUrl(c.sqcand);
  }

  async function fetchJson(url: string, opts?: RequestInit) {
    const res = await fetch(url, { ...opts, headers: { Accept: 'application/json', ...(opts?.headers || {}) } });
    if (res.status === 200) return res.json();
    throw new Error(`${res.status}`);
  }

  async function carregarMeta() {
    const bust = Date.now();
    const local = await fetchJson(`/data/meta.json?_=${bust}`).catch(() => null);
    if (local) {
      meta.value = local as TseMeta;
      return;
    }
    throw new Error('meta não disponível');
  }

  async function carregarViaProxy() {
    if (!meta.value || !corsProxy) throw new Error('proxy não configurado');
    const tseUrl = urlResultado(meta.value, cargo.value, abrangencia.value);
    const proxyUrl = `${corsProxy}${encodeURIComponent(tseUrl)}&_=${Date.now()}`;
    const raw = await fetchJson(proxyUrl, { cache: 'no-store' });
    const s = parseEa20(raw, cargo.value, abrangencia.value, turno);
    aplicarFotos(s);
    return s;
  }

  async function carregarEstatico() {
    const bust = Date.now();
    const url = `/data/${cargo.value}-${abrangencia.value}-${turno}.json?_=${bust}`;
    const raw = await fetchJson(url, { cache: 'no-store' });
    return raw as Snapshot;
  }

  async function atualizar(forcarLive = false) {
    pending.value = true;
    error.value = null;
    try {
      if (!meta.value) await carregarMeta();

      if (corsProxy && (modo.value !== 'static' || forcarLive)) {
        try {
          const s = await carregarViaProxy();
          snapshot.value = s;
          modo.value = 'live';
          ultimaAtualizacao.value = Date.now();
          pending.value = false;
          return;
        } catch (e) {
          if (modo.value === 'live') {
            error.value = `Live falhou: ${e.message}. Usando fallback estático.`;
          }
        }
      }

      const s = await carregarEstatico();
      snapshot.value = s;
      modo.value = 'static';
      ultimaAtualizacao.value = Date.now();
    } catch (e: any) {
      error.value = e.message || 'Erro ao carregar dados';
    } finally {
      pending.value = false;
    }
  }

  let interval: ReturnType<typeof setInterval> | null = null;

  onMounted(() => {
    atualizar();
    interval = setInterval(() => {
      atualizar();
    }, 15000);
  });

  onUnmounted(() => {
    if (interval) clearInterval(interval);
  });

  watch([cargo, uf], () => {
    snapshot.value = undefined;
    atualizar();
  });

  function formatNum(n?: number | null) {
    if (n === undefined || n === null) return '-';
    return n.toLocaleString('pt-BR');
  }

  function formatPct(n?: number | null) {
    if (n === undefined || n === null) return '-';
    return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
  }

  return {
    cargo,
    uf,
    abrangencia,
    meta,
    snapshot,
    pending,
    error,
    modo,
    atualizar,
    ultimaAtualizacao,
    formatNum,
    formatPct,
  };
}
