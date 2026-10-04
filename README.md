# Apuração Eleições 2026

Site estático de apuração em tempo real das Eleições Gerais 2026, consumindo os arquivos públicos de divulgação de resultados do TSE.

> **Aviso:** este site não é oficial. Os dados são reproduzidos conforme publicado pela Justiça Eleitoral/TSE.

## Arquitetura

GitHub Pages serve apenas conteúdo estático. Por isso:

1. Uma GitHub Action (`deploy.yml`) busca os arquivos do TSE a cada 5 minutos.
2. Os dados são salvos em `public/data/` como JSON.
3. O Nuxt gera um site estático que lê esses JSONs via `fetch` no navegador.
4. O site é deployado no GitHub Pages.

O navegador nunca chama o TSE diretamente (a CDN do TSE bloqueia CORS). O contato com o TSE acontece apenas no lado do servidor durante a execução da Action.

## Rodar localmente

### Com dados reais do TSE

```bash
npm install
npm run data:fetch
npm run generate
npx serve .output/public
```

Acesse `http://localhost:3000`.

### Com fixtures reais salvos (para testes/offline)

```bash
npm install
npm run data:fixtures   # gera public/data a partir dos fixtures do TSE
npm run generate
npx serve .output/public
```

## Testes

```bash
npm test              # unitários/contrato
npm run test:e2e      # Playwright (requer build/generate)
```

## Deploy no GitHub Pages

1. Vá em **Settings → Pages** do repositório.
2. Em **Build and deployment**, escolha **GitHub Actions**.
3. Faça push para `main`.
4. A Actions `deploy.yml` será executada automaticamente a cada 5 minutos e também em pushes.

## Variáveis de ambiente

Veja `docs/operacao.md` para a lista completa.

## Estrutura

- `docs/validacao-tse.md` — resultados da validação contra a API real.
- `docs/operacao.md` — runbook de operação.
- `server/tse/` — parser, URLs, config e cliente do TSE.
- `shared/tse.ts` — constantes e tipos compartilhados entre cliente e servidor.
- `tools/fetch-data.ts` — buscador de dados usado pela Action (dados reais do TSE).
- `tools/generate-from-fixtures.ts` — gera dados de teste a partir de fixtures reais do TSE.
- `fixtures/` — arquivos JSON reais baixados do TSE durante a validação.
- `e2e/` — testes end-to-end com Playwright.
