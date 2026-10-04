<script setup lang="ts">
import { UFs } from '~/shared/tse';

const props = defineProps<{ modelValue: string; cargo?: string }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>();

const opcoes = computed(() => {
  const lista: { value: string; label: string }[] = [];
  if (props.cargo === 'presidente') {
    lista.push({ value: 'BR', label: 'Brasil' });
    lista.push({ value: 'ZZ', label: 'Exterior' });
  }
  for (const uf of UFs) {
    lista.push({ value: uf, label: uf });
  }
  return lista;
});
</script>

<template>
  <label class="seletor-uf">
    <span class="sr-only">Estado</span>
    <select :value="modelValue" @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)">
      <option v-for="opt in opcoes" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
    </select>
  </label>
</template>

<style scoped>
.seletor-uf select {
  appearance: none;
  padding: 0.625rem 2.25rem 0.625rem 1rem;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%2364748b' viewBox='0 0 16 16'%3E%3Cpath d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3E%3C/svg%3E") no-repeat right 0.75rem center;
  color: var(--fg);
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  min-width: 7rem;
}
.seletor-uf select:focus {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
</style>
