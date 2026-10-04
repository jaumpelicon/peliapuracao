import type { CargoKey, Abrangencia, Snapshot, TseMeta } from '~/shared/types';
import { parseEa20 } from '~/shared/parser';
import { urlResultado, cargoCode, TSE_BASE_DEFAULT } from '~/shared/tse';

export { type TseMeta };

export function useApuracao() {
  const route = useRoute();
  const router = useRouter();
  const config = useRuntimeConfig();
  const turno = Number(config.public.tseTurno || 1) as 1 | 2;
  const corsProxy = String(config.public.corsProxy || '');
  const base = String(config.app?.baseURL || '/').replace(/\/$/, '');

  function dataUrl(path: string) {
    return `${base}${path}`;
  }

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
    const base = m.baseUrl || TSE_BASE_DEFAULT;
    return `${base}/${m.ambiente || 'oficial'}/${m.ciclo}/${eleicao}/fotos/${uf}/${sqcand}.jpeg`;
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

  async function fetchTexto(url: string, timeoutMs = 7000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: ctrl.signal, cache: 'no-store' });
      if (res.status !== 200) throw new Error(`${res.status}`);
      return await res.text();
    } finally {
      clearTimeout(timer);
    }
  }

  function unwrapJina(texto: string) {
    const i = texto.indexOf('{');
    if (i < 0) throw new Error('resposta sem JSON');
    return JSON.parse(texto.slice(i));
  }

  type ProxyDef = { nome: string; montar: (tseUrl: string) => string; unwrap?: (t: string) => unknown };

  const proxies: ProxyDef[] = [];
  if (corsProxy && !corsProxy.startsWith('https://api.allorigins.win')) {
    proxies.push({ nome: 'proxy', montar: (u) => `${corsProxy}${encodeURIComponent(u)}` });
  }
  proxies.push(
    { nome: 'jina', montar: (u) => `https://r.jina.ai/${u}`, unwrap: unwrapJina },
    { nome: 'allorigins', montar: (u) => `${'https://api.allorigins.win/raw?url='}${encodeURIComponent(u)}&_=${Date.now()}` },
    { nome: 'codetabs', montar: (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}` },
  );

  async function carregarMeta() {
    const bust = Date.now();
    const local = await fetchJson(`${dataUrl('/data/meta.json')}?_=${bust}`).catch(() => null);
    if (local) {
      meta.value = local as TseMeta;
      return;
    }
    throw new Error('meta não disponível');
  }

  async function carregarViaProxy() {
    if (!meta.value) throw new Error('meta indisponível');
    const tseUrl = urlResultado(meta.value, cargo.value, abrangencia.value);
    const erros: string[] = [];
    for (const p of proxies) {
      try {
        const texto = await fetchTexto(p.montar(tseUrl));
        const raw = p.unwrap ? p.unwrap(texto) : JSON.parse(texto);
        const s = parseEa20(raw, cargo.value, abrangencia.value, turno);
        aplicarFotos(s);
        return s;
      } catch (e: any) {
        erros.push(`${p.nome} ${e?.message || e}`);
      }
    }
    throw new Error(erros.join(' · '));
  }

  async function carregarEstatico() {
    const bust = Date.now();
    const url = `${dataUrl(`/data/${cargo.value}-${abrangencia.value}-${turno}.json`)}?_=${bust}`;
    const raw = await fetchJson(url, { cache: 'no-store' });
    return raw as Snapshot;
  }

  function aplicarEstatico(s: Snapshot) {
    snapshot.value = s;
    modo.value = 'static';
    ultimaAtualizacao.value = Date.now();
  }

  async function tentarLive() {
    if (!proxies.length) return;
    try {
      const s = await carregarViaProxy();
      snapshot.value = s;
      modo.value = 'live';
      ultimaAtualizacao.value = Date.now();
      error.value = null;
    } catch (e: any) {
      if (modo.value === 'live') {
        modo.value = 'static';
        error.value = `Tempo real indisponível (${e.message}) — usando atualização automática.`;
        await carregarEstatico().then(aplicarEstatico).catch(() => {});
      }
    }
  }

  let rodando = false;

  async function atualizar(_forcarLive = false) {
    if (rodando) return;
    rodando = true;
    error.value = null;
    pending.value = true;
    try {
      if (!meta.value) await carregarMeta();

      if (!snapshot.value) {
        const s = await carregarEstatico();
        aplicarEstatico(s);
      }

      await tentarLive();

      if (!snapshot.value) {
        const s = await carregarEstatico();
        aplicarEstatico(s);
      }
    } catch (e: any) {
      if (!snapshot.value) error.value = e?.message || 'Erro ao carregar dados';
    } finally {
      pending.value = false;
      rodando = false;
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
