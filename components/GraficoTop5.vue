<script setup lang="ts">
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import VChart from 'vue-echarts';
import type { Snapshot } from '~/shared/types';

use([CanvasRenderer, BarChart, GridComponent, TooltipComponent]);

const props = defineProps<{ snapshot: Snapshot }>();

const prefersReduced = ref(false);
const cores = ref({ accent: '#2563eb', accent2: '#3b82f6', fg: '#0f172a', muted: '#64748b', border: '#e2e8f0', bg: '#f8fafc' });

function lerCores() {
  if (typeof window === 'undefined') return;
  const st = getComputedStyle(document.documentElement);
  const get = (v: string, fallback: string) => st.getPropertyValue(v).trim() || fallback;
  cores.value = {
    accent: get('--accent', '#2563eb'),
    accent2: get('--accent-2', '#3b82f6'),
    fg: get('--fg', '#0f172a'),
    muted: get('--muted', '#64748b'),
    border: get('--border', '#e2e8f0'),
    bg: get('--bg', '#f8fafc'),
  };
}

onMounted(() => {
  lerCores();
  const m = window.matchMedia('(prefers-reduced-motion: reduce)');
  prefersReduced.value = m.matches;
  m.addEventListener('change', (e) => { prefersReduced.value = e.matches; });
  window.addEventListener('themechange', lerCores);
});

const option = computed(() => {
  const sorted = [...props.snapshot.top5].sort((a, b) => b.votos - a.votos);
  const c = cores.value;
  return {
    backgroundColor: 'transparent',
    grid: { top: 24, right: 80, bottom: 24, left: 120, containLabel: false },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: c.bg,
      borderColor: c.border,
      textStyle: { color: c.fg },
      formatter: (params: any) => {
        const p = params[0];
        const cand = sorted[p.dataIndex];
        return `<strong>${cand.nomeUrna}</strong><br/>${Number(p.value).toLocaleString('pt-BR')} votos (${cand.pct?.toFixed(2)}%)`;
      },
    },
    xAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: c.border, type: 'dashed' } },
      axisLabel: { color: c.muted, formatter: (v: number) => (v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v)) },
    },
    yAxis: {
      type: 'category',
      data: sorted.map(c => c.nomeUrna),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: c.fg, fontWeight: 600, width: 110, overflow: 'truncate' },
      inverse: true,
    },
    series: [{
      type: 'bar',
      data: sorted.map((cand, i) => ({
        value: cand.votos,
        itemStyle: {
          color: i === 0 ? c.accent : c.accent2,
          borderRadius: [0, 6, 6, 0],
          opacity: 1 - i * 0.12,
        },
      })),
      barWidth: '60%',
      animation: !prefersReduced.value,
      label: { show: true, position: 'right', color: c.fg, formatter: '{c}', fontWeight: 600 },
    }],
  };
});
</script>

<template>
  <VChart class="grafico" :option="option" autoresize @zr:click="lerCores" />
</template>

<style scoped>
.grafico {
  width: 100%;
  height: 320px;
}
@media (min-width: 768px) {
  .grafico { height: 400px; }
}
</style>
