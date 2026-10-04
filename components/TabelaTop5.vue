<script setup lang="ts">
import type { Snapshot, CandidatoRank } from '~/shared/types';

const props = defineProps<{ snapshot: Snapshot; maxInicial?: number }>();

const busca = ref('');
const expandido = ref(false);

const todos = computed(() => props.snapshot.candidatos || props.snapshot.top5 || []);
const maxVotos = computed(() => Math.max(...todos.value.map(c => c.votos), 1));

const filtrados = computed(() => {
  const q = busca.value.trim().toLowerCase();
  if (!q) return todos.value;
  return todos.value.filter((c: CandidatoRank) =>
    c.nomeUrna.toLowerCase().includes(q) ||
    c.nome.toLowerCase().includes(q) ||
    c.numero.includes(q) ||
    c.partido.toLowerCase().includes(q)
  );
});
const visiveis = computed(() => {
  if (expandido.value || busca.value.trim()) return filtrados.value;
  return filtrados.value.slice(0, props.maxInicial ?? 5);
});
const temMais = computed(() => filtrados.value.length > (props.maxInicial ?? 5));

function fmt(n?: number | null) {
  if (n === undefined || n === null) return '-';
  return n.toLocaleString('pt-BR');
}
function pct(n?: number | null) {
  if (n === undefined || n === null) return '-';
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
}
function situacao(c: CandidatoRank) {
  if (c.eleito) return 'Eleito';
  if (c.destinacao !== 'valido') return 'Indeferido/Anulado';
  if (props.snapshot.andamento === 'f' || props.snapshot.totalizacaoFinal) return 'Não eleito';
  return 'Em apuração';
}
</script>

<template>
  <div class="tabela-wrap tabela-top5">
    <div class="ferramentas">
      <label class="busca">
        <span class="sr-only">Buscar candidato</span>
        <input v-model="busca" type="search" placeholder="Buscar candidato por nome, número ou partido" />
      </label>
      <div class="contador">{{ filtrados.length }} candidatos</div>
    </div>

    <table class="tabela">
      <caption class="sr-only">Resultados da apuração</caption>
      <thead>
        <tr>
          <th scope="col" class="col-pos">#</th>
          <th scope="col">Candidato</th>
          <th scope="col" class="col-pct">%</th>
          <th scope="col" class="col-num">Votos</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="c in visiveis" :key="c.sqcand">
          <td class="col-pos pos">{{ c.posicao }}º</td>
          <td class="candidato">
            <img v-if="c.fotoUrl" :src="c.fotoUrl" alt="" class="foto" loading="lazy" referrerpolicy="no-referrer" />
            <div v-else class="foto avatar">{{ c.nomeUrna.charAt(0) }}</div>
            <div class="info">
              <div class="nome-linha">
                <span class="nome">{{ c.nomeUrna }}</span>
                <span v-if="c.eleito" class="selo eleito">Eleito</span>
                <span v-else-if="c.destinacao !== 'valido'" class="selo alerta">{{ situacao(c) }}</span>
              </div>
              <div class="partido">{{ c.partido }} · {{ c.numero }}</div>
              <div class="barra-linha">
                <div class="barra">
                  <div class="preenchimento" :style="{ width: `${(c.votos / maxVotos) * 100}%` }" />
                </div>
              </div>
            </div>
          </td>
          <td class="col-pct pct">{{ pct(c.pct) }}</td>
          <td class="col-num votos">{{ fmt(c.votos) }}</td>
        </tr>
        <tr v-if="filtrados.length === 0">
          <td colspan="4" class="vazio">Nenhum candidato encontrado.</td>
        </tr>
      </tbody>
    </table>

    <button v-if="temMais && !expandido && !busca.trim()" class="expandir" @click="expandido = true">
      Ver todos os {{ filtrados.length }} candidatos
    </button>
    <button v-else-if="expandido && !busca.trim()" class="expandir" @click="expandido = false">
      Mostrar menos
    </button>
  </div>
</template>

<style scoped>
.tabela-wrap { margin-top: 0.5rem; }
.ferramentas {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.busca { flex: 1; min-width: 240px; }
.busca input {
  width: 100%;
  padding: 0.625rem 1rem;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  color: var(--fg);
  font-size: 0.9375rem;
}
.busca input::placeholder { color: var(--muted); }
.busca input:focus {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
.contador {
  font-size: 0.875rem;
  color: var(--muted);
  font-weight: 500;
}
.tabela {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: var(--surface);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow);
}
.tabela th, .tabela td {
  padding: 0.875rem 1rem;
  border-bottom: 1px solid var(--border);
  text-align: left;
  vertical-align: middle;
}
.tabela th {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted);
  font-weight: 600;
  background: rgba(0,0,0,0.03);
}
.col-pos { width: 2.5rem; text-align: center; }
.col-pct { width: 5rem; text-align: right; }
.col-num { width: 6rem; text-align: right; }
.pos {
  font-weight: 700;
  color: var(--accent);
  font-size: 1rem;
}
.candidato {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}
.foto {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  object-fit: cover;
  background: var(--bg);
  border: 1px solid var(--border);
  flex-shrink: 0;
}
.foto.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: var(--accent);
  text-transform: uppercase;
}
.info { flex: 1; min-width: 0; }
.nome-linha {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.nome {
  font-weight: 700;
  color: var(--fg);
  font-size: 1.05rem;
}
.partido {
  font-size: 0.8125rem;
  color: var(--muted);
  margin-top: 0.125rem;
}
.barra-linha { margin-top: 0.5rem; }
.barra {
  height: 0.375rem;
  background: var(--bg);
  border-radius: 999px;
  overflow: hidden;
}
.preenchimento {
  height: 100%;
  background: var(--accent);
  border-radius: 999px;
}
.pct, .votos {
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  font-size: 1rem;
}
.selo {
  display: inline-block;
  font-size: 0.7rem;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-weight: 700;
  white-space: nowrap;
}
.eleito { background: rgba(16, 185, 129, 0.15); color: var(--success); }
.alerta { background: rgba(239, 68, 68, 0.15); color: var(--danger); }
.vazio {
  text-align: center;
  color: var(--muted);
  padding: 2rem;
}
.expandir {
  display: block;
  width: 100%;
  margin-top: 1rem;
  padding: 0.75rem;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--accent);
  border-radius: 999px;
  cursor: pointer;
  font-weight: 600;
}
.expandir:hover { background: var(--bg); }
@media (max-width: 640px) {
  .tabela th, .tabela td { padding: 0.625rem; }
  .foto { width: 2.5rem; height: 2.5rem; }
  .nome { font-size: 0.95rem; }
}
</style>
