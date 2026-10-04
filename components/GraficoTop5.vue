<script setup lang="ts">
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import VChart from 'vue-echarts';
import type { Snapshot } from '~/server/tse/types';

use([CanvasRenderer, BarChart, GridComponent, TooltipComponent]);

const props = defineProps<{ snapshot: Snapshot }>();

const prefersReduced = ref(false);
onMounted(() => {
  const m = window.matchMedia('(prefers-reduced-motion: reduce)');
  prefersReduced.value = m.matches;
  m.addEventListener('change', (e) => { prefersReduced.value = e.matches; });
});

const option = computed(() => {
  const sorted = [...props.snapshot.top5].sort((a, b) => b.votos - a.votos);
  return {
    grid: { top: 24, right: 24, bottom: 24, left: 100, containLabel: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const p = params[0];
        const nome = sorted[p.dataIndex].nomeUrna;
        return `${nome}<br/>${Number(p.value).toLocaleString('pt-BR')} votos (${sorted[p.dataIndex].pct?.toFixed(2)}%)`;
      },
    },
    xAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'var(--border)', type: 'dashed' } },
      axisLabel: { color: 'var(--muted)', formatter: (v: number) => (v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v)) },
    },
    yAxis: {
      type: 'category',
      data: sorted.map(c => c.nomeUrna),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: 'var(--fg)', fontWeight: 600 },
      inverse: true,
    },
    series: [{
      type: 'bar',
      data: sorted.map((c, i) => ({
        value: c.votos,
        itemStyle: {
          color: i === 0 ? 'var(--accent)' : 'var(--accent-2)',
          borderRadius: [0, 6, 6, 0],
          opacity: 1 - i * 0.12,
        },
      })),
      barWidth: '60%',
      animation: !prefersReduced.value,
      label: { show: true, position: 'right', color: 'var(--muted)', formatter: '{c}', fontWeight: 600 },
    }],
  };
});
</script>

<template>
  <VChart class="grafico" :option="option" autoresize />
</template>

<style scoped>
.grafico {
  width: 100%;
  height: 280px;
}
@media (min-width: 768px) {
  .grafico { height: 360px; }
}
</style>
