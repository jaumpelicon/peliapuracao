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

const itens = computed(() => [
  { label: 'Válidos', valor: fmt(props.snapshot.votos.validos), pct: pct(props.snapshot.votos.validos / props.snapshot.votos.total * 100) },
  { label: 'Brancos', valor: fmt(props.snapshot.votos.brancos), pct: pct(props.snapshot.votos.brancos / props.snapshot.votos.total * 100) },
  { label: 'Nulos', valor: fmt(props.snapshot.votos.nulos), pct: pct(props.snapshot.votos.nulos / props.snapshot.votos.total * 100) },
  { label: 'Abstenções', valor: fmt(props.snapshot.eleitorado.abstencao), pct: pct(props.snapshot.eleitorado.pctAbstencao) },
]);
</script>

<template>
  <div class="resumo-votos">
    <div class="total">
      <div class="rotulo">Total de votos</div>
      <div class="valor">{{ fmt(snapshot.votos.total) }}</div>
    </div>
    <div class="itens">
      <div v-for="item in itens" :key="item.label" class="item">
        <div class="info">
          <span class="label">{{ item.label }}</span>
          <span class="pct">{{ item.pct }}</span>
        </div>
        <div class="valor">{{ item.valor }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.resumo-votos {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1rem 1.25rem;
  margin-bottom: 1rem;
  box-shadow: var(--shadow);
  align-items: center;
}
.total {
  padding-right: 1.25rem;
  border-right: 1px solid var(--border);
}
.rotulo {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted);
  font-weight: 600;
}
.valor {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--fg);
  font-variant-numeric: tabular-nums;
}
.itens {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
}
.item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.info {
  display: flex;
  justify-content: space-between;
  font-size: 0.8125rem;
}
.label { color: var(--muted); font-weight: 500; }
.pct { color: var(--accent); font-weight: 600; }
.item .valor { font-size: 1rem; }
@media (max-width: 640px) {
  .resumo-votos { grid-template-columns: 1fr; }
  .total { border-right: none; border-bottom: 1px solid var(--border); padding-right: 0; padding-bottom: 0.75rem; }
}
</style>
