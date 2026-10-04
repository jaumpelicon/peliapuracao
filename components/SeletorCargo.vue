<script setup lang="ts">
import type { CargoKey } from '~/shared/tse';

const props = defineProps<{ modelValue: CargoKey; cargos?: { key: CargoKey; label: string }[]; turno?: 1 | 2 }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: CargoKey): void }>();

const allItems = props.cargos || [
  { key: 'presidente', label: 'Presidente' },
  { key: 'governador', label: 'Governador' },
  { key: 'senador', label: 'Senador' },
  { key: 'deputado-federal', label: 'Deputado Federal' },
  { key: 'deputado-estadual', label: 'Deputado Estadual/Distrital' },
];
const items = computed(() => {
  if (props.turno === 2) return allItems.filter(i => i.key === 'presidente' || i.key === 'governador');
  return allItems;
});
</script>

<template>
  <div role="tablist" aria-label="Cargo" class="seletor-cargo">
    <button
      v-for="item in items"
      :key="item.key"
      role="tab"
      :aria-selected="modelValue === item.key"
      :class="['cargo-btn', { active: modelValue === item.key }]"
      @click="emit('update:modelValue', item.key)"
    >
      {{ item.label }}
    </button>
  </div>
</template>

<style scoped>
.seletor-cargo {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.cargo-btn {
  padding: 0.625rem 1.125rem;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--muted);
  border-radius: 999px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9375rem;
  transition: all 0.15s ease;
}
.cargo-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}
.cargo-btn.active {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
  box-shadow: var(--shadow);
}
</style>
