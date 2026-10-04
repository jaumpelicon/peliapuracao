# Operação do site de apuração

## Variáveis de ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `TSE_BASE_URL` | `https://resultados.tse.jus.br` | URL base da produção |
| `TSE_AMBIENTE` | `oficial` | Ambiente (pasta) da produção |
| `TSE_CICLO` | `ele2026` | Ciclo da eleição |
| `TSE_TURNO` | `1` | `1` ou `2` |
| `TSE_ELEICAO_FEDERAL` | *(vazio)* | Código fixo da eleição federal (6257) |
| `TSE_ELEICAO_ESTADUAL` | *(vazio)* | Código fixo da eleição estadual (6259) |
| `TSE_MAX_RPS` | `30` | Teto interno de req/s para o TSE |
| `TSE_MAX_CONCURRENCY` | `10` | Concorrência máxima de requisições ao TSE |
| `TSE_TIMEOUT_MS` | `8000` | Timeout de requisição ao TSE |

## Como rodar

### Local com dados reais do TSE

```bash
npm install
npm run data:fetch
npm run generate
npx serve .output/public
```

### Local com fixtures reais (offline)

```bash
npm install
npm run data:fixtures
npm run generate
npx serve .output/public
```

### Produção (Docker)

```bash
docker compose up --build -d
```

### GitHub Pages

O repositório já inclui `.github/workflows/deploy.yml`. Para ativar:

1. Vá em **Settings → Pages** do repositório.
2. Em **Build and deployment**, selecione **GitHub Actions**.
3. Faça push para `main`.
4. A Actions buscará os dados do TSE a cada 5 minutos e gerará o site estático.

**Importante:** GitHub Pages só serve conteúdo estático. Por isso os dados são pré-buscados pela Actions e commitados no artefato de deploy. A atualização fica limitada ao intervalo do cron (mínimo 5 minutos no GitHub Actions).

## Virada do 1º para o 2º turno

1. Verifique os novos códigos no `ele-c.json` oficial (pleito do 25/10/2026).
2. Altere `TSE_TURNO=2` e reinicie o container.
3. O frontend desabilitará automaticamente cargos que não existem no 2º turno (Senador, Deputados).

## Monitoramento

- Health check: `GET /api/health`
- Métricas básicas: `GET /api/health` retorna modo e versão.
- O limite de requisições ao TSE é controlado por `TSE_MAX_RPS` e `TSE_MAX_CONCURRENCY`.

## Segurança

- Validação de entrada em todas as rotas `/api/*`.
- Lista branca de cargos/UFs; nenhuma URL ao TSE é montada a partir de entrada do usuário.
- Rate limit próprio: 120 req/min por IP nas rotas `/api`.
- Headers de segurança: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`.

## Riscos conhecidos

- CORS do TSE bloqueia chamadas diretas do navegador; por isso o frontend consome dados estáticos gerados pela GitHub Action.
- O site não é oficial; os dados são reproduzidos conforme publicado pelo TSE.
