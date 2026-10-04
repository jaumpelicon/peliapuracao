import type { CargoKey, Uf, Abrangencia } from '~/shared/tse';
import type { Snapshot } from '~/server/tse/types';

export interface Meta {
  status: string;
  ambiente: string;
  ciclo: string;
  pleito: string;
  turno: 1 | 2;
  eleicaoFederal: string;
  eleicaoEstadual: string;
  cargos: { key: CargoKey; cd: string; label: string }[];
  ufs: Uf[];
}

export function useApuracao() {
  const route = useRoute();
  const router = useRouter();

  const cargo = computed<CargoKey>({
    get: () => (route.query.cargo as CargoKey) || 'presidente',
    set: (v) => router.replace({ query: { ...route.query, cargo: v } }),
  });

  const uf = computed<string>({
    get: () => (route.query.uf as string) || 'BR',
    set: (v) => router.replace({ query: { ...route.query, uf: v } }),
  });

  const abrangencia = computed<Abrangencia>(() => uf.value.toUpperCase() as Abrangencia);
  const config = useRuntimeConfig();
  const turno = Number(config.public.tseTurno || 1) as 1 | 2;

  const cacheBuster = ref(Date.now());

  const { data: meta, error: metaError, refresh: refreshMeta } = useFetch<Meta>(
    () => `/data/meta.json?_=${cacheBuster.value}`,
    { server: false, default: () => undefined },
  );

  const { data: snapshot, pending, error, refresh } = useFetch<Snapshot>(
    () => `/data/${cargo.value}-${abrangencia.value}-${turno}.json?_=${cacheBuster.value}`,
    { server: false, watch: [cargo, uf], default: () => undefined },
  );

  const ultimaAtualizacao = ref(Date.now());
  const desatualizadoSegundos = computed(() => {
    if (!snapshot.value) return null;
    const t = new Date(snapshot.value.buscadoEm).getTime();
    return Math.floor((Date.now() - t) / 1000);
  });

  let interval: ReturnType<typeof setInterval> | null = null;

  function atualizar() {
    cacheBuster.value = Date.now();
    ultimaAtualizacao.value = Date.now();
    nextTick(() => {
      refreshMeta();
      refresh();
    });
  }

  onMounted(() => {
    interval = setInterval(() => {
      cacheBuster.value = Date.now();
      ultimaAtualizacao.value = Date.now();
      refreshMeta();
      refresh();
    }, 60000);
  });

  onUnmounted(() => {
    if (interval) clearInterval(interval);
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
    metaError,
    snapshot,
    pending,
    error,
    refresh,
    atualizar,
    ultimaAtualizacao,
    desatualizadoSegundos,
    formatNum,
    formatPct,
  };
}
