<script setup lang="ts">
import { CARGOS } from '~/shared/tse';
import type { CargoKey } from '~/shared/tse';

const { cargo, uf, snapshot, pending, error, ultimaAtualizacao, atualizar } = useApuracao();

const cargoAtual = computed(() => ({ label: CARGOS[cargo.value as CargoKey]?.label ?? cargo.value }));

watch(cargo, (novo) => {
  if (novo === 'presidente' && uf.value !== 'BR' && uf.value !== 'ZZ') {
    uf.value = 'BR';
  }
});

useSeoMeta({
  title: () => `Peliapuração · ${cargoAtual.value?.label || 'Presidente'}`,
  description: 'Resultados da apuração das Eleições 2026 com dados oficiais do TSE.',
});

const verComo = ref<'grafico' | 'tabela'>('grafico');
</script>

<template>
  <div class="page">
    <header class="topo">
      <div class="brand">
        <div class="escudo" aria-hidden="true">BR</div>
        <div>
          <h1>Peliapuração</h1>
          <p class="sub">Resultados oficiais do Tribunal Superior Eleitoral</p>
        </div>
      </div>
      <div class="acoes-topo">
        <button
          class="btn-atualizar"
          aria-label="Atualizar dados"
          title="Atualizar dados"
          :disabled="pending"
          @click="atualizar"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/>
          </svg>
        </button>
        <StatusAoVivo :atualizando="pending" :ultima-atualizacao="ultimaAtualizacao" :erro="error" />
      </div>
    </header>

    <main class="container">
      <section class="controles" aria-label="Filtros">
        <SeletorCargo v-model="cargo" />
        <SeletorUf v-model="uf" :cargo="cargo" />
      </section>

      <template v-if="snapshot">
        <PainelAndamento :snapshot="snapshot" />
        <section class="conteudo">
          <div class="titulo-secao">
            <h2>{{ cargoAtual?.label }} · {{ uf }}</h2>
            <div class="toggle" role="group" aria-label="Visualização">
              <button :class="{ active: verComo === 'grafico' }" @click="verComo = 'grafico'">Gráfico</button>
              <button :class="{ active: verComo === 'tabela' }" @click="verComo = 'tabela'">Tabela</button>
            </div>
          </div>
          <GraficoTop5 v-if="verComo === 'grafico'" :snapshot="snapshot" />
          <TabelaTop5 v-else :snapshot="snapshot" />
        </section>
      </template>

      <div v-else-if="error" class="erro" role="alert">
        Não foi possível carregar os dados. <button class="link" @click="reloadNuxtApp({ path: $route.fullPath })">Tentar novamente</button>.
      </div>

      <div v-else class="carregando">
        <span class="spinner" aria-hidden="true" />
        Carregando dados oficiais…
      </div>
    </main>

    <footer class="rodape">
      <img src="/header.png" alt="Pelicodas" class="header-rodape" />
      <p>Fonte: TSE — resultados.tse.jus.br · Atualizado automaticamente.</p>
    </footer>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.topo {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  box-shadow: var(--shadow);
}
.brand {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}
.escudo {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.875rem;
}
h1 {
  font-size: 1.25rem;
  margin: 0;
  line-height: 1.2;
}
.sub {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--muted);
}
.acoes-topo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.btn-atualizar {
  width: 2.25rem;
  height: 2.25rem;
  border: 1px solid var(--border);
  border-radius: 50%;
  background: var(--surface);
  color: var(--fg);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease, border-color 0.2s ease;
}
.btn-atualizar:hover {
  border-color: var(--accent);
  color: var(--accent);
}
.btn-atualizar:active {
  transform: rotate(180deg);
}
.btn-atualizar:disabled {
  opacity: 0.6;
  cursor: wait;
}
.btn-atualizar svg {
  width: 1.1rem;
  height: 1.1rem;
}
.container {
  flex: 1;
  width: min(1000px, 100% - 2rem);
  margin: 0 auto;
  padding: 1.5rem 0 3rem;
}
.controles {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}
.conteudo {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.25rem;
  box-shadow: var(--shadow);
}
.titulo-secao {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}
.titulo-secao h2 {
  margin: 0;
  font-size: 1.25rem;
}
.toggle {
  display: inline-flex;
  border: 1px solid var(--border);
  border-radius: 999px;
  overflow: hidden;
}
.toggle button {
  border: none;
  background: var(--bg);
  color: var(--muted);
  padding: 0.5rem 1rem;
  font-weight: 500;
  cursor: pointer;
}
.toggle button.active {
  background: var(--accent);
  color: white;
}
.carregando, .erro {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 4rem 1rem;
  color: var(--muted);
  font-weight: 500;
}
.erro { color: var(--danger); }
.link {
  background: none;
  border: none;
  color: var(--accent);
  text-decoration: underline;
  cursor: pointer;
  font: inherit;
  padding: 0;
}
.spinner {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: gira 0.8s linear infinite;
}
@keyframes gira { to { transform: rotate(360deg); } }
.rodape {
  text-align: center;
  padding: 1.5rem;
  color: var(--muted);
  font-size: 0.8125rem;
  border-top: 1px solid var(--border);
}
.header-rodape {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius);
  margin-bottom: 0.75rem;
}
@media (max-width: 640px) {
  .topo { flex-direction: column; align-items: flex-start; }
  .controles { flex-direction: column; align-items: stretch; }
  .titulo-secao { flex-direction: column; align-items: flex-start; }
}
</style>
