export default defineNuxtConfig({
  devtools: { enabled: false },
  ssr: false,
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
  },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      tseTurno: Number(process.env.TSE_TURNO || 1),
    },
    tseEnv: 'oficial',
    tseBaseUrl: process.env.TSE_BASE_URL || 'https://resultados.tse.jus.br',
    tseAmbiente: process.env.TSE_AMBIENTE || 'oficial',
    tseCiclo: process.env.TSE_CICLO || 'ele2026',
    tseTurno: Number(process.env.TSE_TURNO || '1') as 1 | 2,
    tseEleicaoFederal: process.env.TSE_ELEICAO_FEDERAL || '',
    tseEleicaoEstadual: process.env.TSE_ELEICAO_ESTADUAL || '',
    tseMaxRps: Number(process.env.TSE_MAX_RPS || '30'),
    tseMaxConcurrency: Number(process.env.TSE_MAX_CONCURRENCY || '10'),
    tseTimeoutMs: Number(process.env.TSE_TIMEOUT_MS || '8000'),
  },
  nitro: {
    routeRules: {
      '/': { headers: { 'X-Frame-Options': 'DENY', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin' } },
      '/api/**': { headers: { 'Cache-Control': 'no-store' } },
    },
  },
  compatibilityDate: '2026-10-04',
});
