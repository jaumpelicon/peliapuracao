<script setup lang="ts">
const props = defineProps<{ atualizando: boolean; ultimaAtualizacao?: string; erro?: string | null }>();
</script>

<template>
  <div class="status-ao-vivo" role="status" aria-live="polite">
    <span class="bolinha" :class="{ pulso: atualizando }" aria-hidden="true" />
    <span class="texto">
      <template v-if="erro">
        <strong>Erro:</strong> {{ erro }}
      </template>
      <template v-else-if="atualizando">
        Atualizando dados…
      </template>
      <template v-else-if="ultimaAtualizacao">
        Ao vivo · atualizado {{ new Date(ultimaAtualizacao).toLocaleTimeString('pt-BR') }}
      </template>
      <template v-else>
        Ao vivo
      </template>
    </span>
  </div>
</template>

<style scoped>
.status-ao-vivo {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: var(--muted);
  font-weight: 500;
}
.bolinha {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--success);
}
.bolinha.pulso {
  animation: pulso 1s infinite;
}
@keyframes pulso {
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.3); }
  100% { opacity: 1; transform: scale(1); }
}
@media (prefers-reduced-motion: reduce) {
  .bolinha.pulso { animation: none; }
}
</style>
