<script setup lang="ts">
import type { Snapshot } from '~/server/tse/types';

const props = defineProps<{ snapshot: Snapshot }>();

function fmt(n?: number | null) {
  if (n === undefined || n === null) return '-';
  return n.toLocaleString('pt-BR');
}
function pct(n?: number | null) {
  if (n === undefined || n === null) return '-';
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
}
</script>

<template>
  <table class="tabela-top5">
    <caption>Top 5 candidatos por votos</caption>
    <thead>
      <tr>
        <th scope="col" class="col-pos">#</th>
        <th scope="col">Candidato</th>
        <th scope="col" class="col-num">Votos</th>
        <th scope="col" class="col-num">%</th>
        <th scope="col" class="col-sit">Situação</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="c in snapshot.top5" :key="c.sqcand">
        <td class="col-pos pos">{{ c.posicao }}º</td>
        <td class="candidato">
          <img v-if="c.fotoUrl" :src="c.fotoUrl" alt="" class="foto" loading="lazy" referrerpolicy="no-referrer" />
          <div v-else class="foto avatar">{{ c.nomeUrna.charAt(0) }}</div>
          <div class="info">
            <div class="nome">{{ c.nomeUrna }}</div>
            <div class="partido">{{ c.partido }} · {{ c.numero }}</div>
          </div>
        </td>
        <td class="col-num votos">{{ fmt(c.votos) }}</td>
        <td class="col-num pct">{{ pct(c.pct) }}</td>
        <td class="col-sit">
          <span v-if="c.eleito" class="selo eleito">Eleito</span>
          <span v-else-if="c.destinacao !== 'valido'" class="selo alerta">{{ c.destinacao }}</span>
          <span v-else class="selo neutro">{{ snapshot.andamento === 'f' ? 'Não eleito' : 'Em apuração' }}</span>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
.tabela-top5 {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-top: 1rem;
  background: var(--surface);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow);
}
.tabela-top5 caption {
  caption-side: top;
  text-align: left;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: var(--fg);
}
.tabela-top5 th, .tabela-top5 td {
  padding: 0.875rem 1rem;
  border-bottom: 1px solid var(--border);
  text-align: left;
}
.tabela-top5 th {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted);
  font-weight: 600;
  background: rgba(0,0,0,0.02);
}
.col-pos { width: 3rem; text-align: center; }
.col-num { width: 6rem; text-align: right; }
.col-sit { width: 8rem; }
.pos {
  font-weight: 700;
  color: var(--accent);
  font-size: 1.125rem;
}
.candidato {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}
.foto {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 50%;
  object-fit: cover;
  background: var(--bg);
  border: 1px solid var(--border);
}
.foto.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: var(--accent);
  text-transform: uppercase;
}
.nome {
  font-weight: 600;
  color: var(--fg);
}
.partido {
  font-size: 0.8125rem;
  color: var(--muted);
}
.votos, .pct {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}
.selo {
  display: inline-block;
  font-size: 0.75rem;
  padding: 0.25rem 0.625rem;
  border-radius: 999px;
  font-weight: 600;
}
.eleito { background: #d1fae5; color: #065f46; }
.alerta { background: #fee2e2; color: #991b1b; }
.neutro { background: var(--bg); color: var(--muted); }
@media (prefers-color-scheme: dark) {
  .eleito { background: rgba(16, 185, 129, 0.2); color: #6ee7b7; }
  .alerta { background: rgba(239, 68, 68, 0.2); color: #fca5a5; }
}
@media (max-width: 640px) {
  .tabela-top5 th, .tabela-top5 td { padding: 0.625rem; }
  .foto { width: 2.25rem; height: 2.25rem; }
}
</style>
