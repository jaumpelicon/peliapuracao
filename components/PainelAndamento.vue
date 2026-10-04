<script setup lang="ts">
import type { Snapshot } from '~/server/tse/types';

const props = defineProps<{ snapshot: Snapshot }>();

const info = computed(() => {
  const s = props.snapshot;
  if (s.totalizacaoFinal) return { label: 'Totalização final', cor: 'sucesso' };
  if (s.andamento === 'e') return { label: 'Apuração encerrada', cor: 'neutro' };
  if (s.andamento === 'f') return { label: 'Apuração finalizada', cor: 'sucesso' };
  if (s.divulgaVotacao) return { label: 'Apuração em andamento', cor: 'atencao' };
  return { label: 'Aguardando divulgação', cor: 'aviso' };
});

function pct(n?: number | null) {
  if (n === undefined || n === null) return '-';
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
}
function fmt(n?: number | null) {
  if (n === undefined || n === null) return '-';
  return n.toLocaleString('pt-BR');
}
</script>

<template>
  <div class="painel" role="status" aria-live="polite">
    <div class="card resumo">
      <div class="rotulo">Seções apuradas</div>
      <div class="principal">{{ pct(snapshot.secoes.pct) }}</div>
      <div class="sub">{{ fmt(snapshot.secoes.totalizadas) }} de {{ fmt(snapshot.secoes.total) }} seções</div>
      <div class="barra"><div class="preenchimento" :style="{ width: `${snapshot.secoes.pct ?? 0}%` }" /></div>
    </div>
    <div class="card resumo">
      <div class="rotulo">Total de votos apurados</div>
      <div class="principal">{{ fmt(snapshot.votos.total) }}</div>
      <div class="sub">Última atualização: {{ new Date(snapshot.buscadoEm).toLocaleTimeString('pt-BR') }}</div>
    </div>
    <div class="card status" :class="info.cor">
      <div class="rotulo">Status</div>
      <div class="principal">{{ info.label }}</div>
      <div class="sub">{{ snapshot.turno }}º turno · {{ snapshot.totalCandidatos }} candidatos</div>
    </div>
  </div>
</template>

<style scoped>
.painel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.125rem;
  box-shadow: var(--shadow);
}
.rotulo {
  font-size: 0.8125rem;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
  margin-bottom: 0.375rem;
}
.principal {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--fg);
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}
.sub {
  font-size: 0.875rem;
  color: var(--muted);
  margin-top: 0.25rem;
}
.barra {
  height: 0.5rem;
  background: var(--bg);
  border-radius: 999px;
  margin-top: 0.875rem;
  overflow: hidden;
}
.preenchimento {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), var(--accent-2));
  border-radius: 999px;
  transition: width 0.6s ease;
}
.status .principal { color: var(--fg); }
.status.sucesso .principal { color: var(--success); }
.status.atencao .principal { color: var(--warning); }
.status.aviso .principal { color: var(--accent); }
.status.neutro .principal { color: var(--muted); }
</style>
