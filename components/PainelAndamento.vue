<script setup lang="ts">
import type { Snapshot } from '~/shared/types';

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
    <div class="big resumo">
      <div class="rotulo">Seções apuradas</div>
      <div class="principal">{{ pct(snapshot.secoes.pct) }}</div>
      <div class="sub">{{ fmt(snapshot.secoes.totalizadas) }} de {{ fmt(snapshot.secoes.total) }} seções</div>
      <div class="barra"><div class="preenchimento" :style="{ width: `${snapshot.secoes.pct ?? 0}%` }" /></div>
    </div>
    <div class="status-box" :class="info.cor">
      <div class="rotulo">Status</div>
      <div class="status-principal">{{ info.label }}</div>
      <div class="sub">{{ snapshot.turno }}º turno · {{ snapshot.totalCandidatos }} candidatos</div>
    </div>
  </div>
</template>

<style scoped>
.painel {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}
.big, .status-box {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.25rem;
  box-shadow: var(--shadow);
}
.rotulo {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted);
  font-weight: 600;
  margin-bottom: 0.375rem;
}
.principal {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--fg);
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}
.sub {
  font-size: 0.875rem;
  color: var(--muted);
  margin-top: 0.25rem;
}
.barra {
  height: 0.625rem;
  background: var(--bg);
  border-radius: 999px;
  margin-top: 1rem;
  overflow: hidden;
}
.preenchimento {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), var(--accent-2));
  border-radius: 999px;
  transition: width 0.6s ease;
}
.status-principal {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.2;
}
.status-box.sucesso .status-principal { color: var(--success); }
.status-box.atencao .status-principal { color: var(--warning); }
.status-box.aviso .status-principal { color: var(--accent); }
.status-box.neutro .status-principal { color: var(--muted); }
@media (max-width: 640px) {
  .painel { grid-template-columns: 1fr; }
  .principal { font-size: 2rem; }
}
</style>
