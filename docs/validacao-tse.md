# Validação TSE — Fase 0

Data da validação: 04/10/2026 (dia do 1º turno).
Responsável: agente de desenvolvimento.

## 1. Ambientes testados

| Ambiente | Base | Configuração (`ele-c.json`) | Resultado |
|---|---|---|---|
| Oficial | `https://resultados.tse.jus.br` | Disponível, HTTP 200, `f: "o"`, `c: "ele2026"`, pleito `3220`, eleições `6257` (Federal) e `6259` (Estadual) | OK |
| Simulado | `https://resultados-sim.tse.jus.br/simulado` | Disponível, HTTP 200, `f: "s"`, ambiente interno `simulado2026`, pleito `17801`, eleições `21270` (Federal), `21272` (Estadual), `21274` (Municipal/Conselheiro) | OK |

## 2. Códigos reais descobertos

### 2.1 Oficial (`ele-c.json`)

```json
{
  "cd": "3220",
  "c": "ele2026",
  "dt": "04/10/2026",
  "e": [
    { "cd": "6257", "cdt2": "6258", "nm": "Eleição Ordinária Federal - 2026 1º Turno", "t": "1", "tp": "8", "abr": [{ "cd": "br", "cp": [{ "cd": "1", "ds": "Presidente", "tp": "1" }] }] },
    { "cd": "6259", "cdt2": "6260", "nm": "Eleição Ordinária Estadual - 2026 1º Turno", "t": "1", "tp": "1", "abr": [{ "cd": "br", "cp": [{ "cd": "3", "ds": "Governador" }, { "cd": "5", "ds": "Senador" }, { "cd": "6", "ds": "Deputado Federal" }, { "cd": "7", "ds": "Deputado Estadual" }, { "cd": "8", "ds": "Deputado Distrital" }] }] },
    { "cd": "6261", "cdt2": "", "nm": "Eleição Ordinária Municipal - 2026", "t": "1", "tp": "3", "abr": [{ "cd": "br", "cp": [{ "cd": "25", "ds": "Conselheiro Distrital" }] }] }
  ]
}
```

Observação importante: **os códigos de cargo dentro de `cp` vêm sem zeros à esquerda** (`1`, `3`, `5`, `6`, `7`, `8`).  
Já o **nome do arquivo (`-u.json`) exige o cargo com 4 dígitos** (`c0001`, `c0003`, etc.). O parser/gerador de URL deve fazer o padding.

### 2.2 Simulado (`ele-c.json`)

Pleito `17801`, ciclo `ele2026`, eleições `21270` (Federal), `21272` (Estadual), `21274` (Municipal). Data do simulado: `26/04/2026`.

## 3. Caminhos de URL validados

### 3.1 Oficial

Todos os exemplos abaixo retornaram HTTP 200 no dia 04/10/2026:

| Cargo | UF | URL |
|---|---|---|
| Presidente | BR | `https://resultados.tse.jus.br/oficial/ele2026/6257/dados/br/br-c0001-e006257-u.json` |
| Presidente | SP | `https://resultados.tse.jus.br/oficial/ele2026/6257/dados/sp/sp-c0001-e006257-u.json` |
| Presidente | Exterior (ZZ) | `https://resultados.tse.jus.br/oficial/ele2026/6257/dados/zz/zz-c0001-e006257-u.json` |
| Governador | SP | `https://resultados.tse.jus.br/oficial/ele2026/6259/dados/sp/sp-c0003-e006259-u.json` |
| Senador | SP | `https://resultados.tse.jus.br/oficial/ele2026/6259/dados/sp/sp-c0005-e006259-u.json` |
| Deputado Federal | SP | `https://resultados.tse.jus.br/oficial/ele2026/6259/dados/sp/sp-c0006-e006259-u.json` |
| Deputado Estadual | SP | `https://resultados.tse.jus.br/oficial/ele2026/6259/dados/sp/sp-c0007-e006259-u.json` |
| Deputado Distrital | DF | `https://resultados.tse.jus.br/oficial/ele2026/6259/dados/df/df-c0008-e006259-u.json` |
| Deputado Estadual | DF | `https://resultados.tse.jus.br/oficial/ele2026/6259/dados/df/df-c0007-e006259-u.json` | **404** |
| Acompanhamento Brasil (EA14) Federal | BR | `https://resultados.tse.jus.br/oficial/ele2026/6257/dados/br/br-e006257-ab.json` |
| Acompanhamento Brasil (EA14) Estadual | SP | `https://resultados.tse.jus.br/oficial/ele2026/6259/dados/sp/sp-e006259-ab.json` |

A URL do acompanhamento por UF segue o padrão `{uf}-e{eleicao6d}-ab.json` e contém dados por município (`tpabr: "mun"`).

### 3.2 Simulado

Exemplo validado:

| Cargo | UF | URL |
|---|---|---|
| Presidente | BR | `https://resultados-sim.tse.jus.br/simulado/simulado2026/ele2026/21270/dados/br/br-c0001-e021270-u.json` |

Estrutura idêntica à oficial, mudando apenas base, ambiente (`simulado2026`) e códigos de eleição.

## 4. Cabeçalhos e comportamento da CDN

- `Content-Type: application/json`.
- `ETag` e `Last-Modified` presentes.
- `Cache-Control: max-age=...` (20–59 s observado).
- `x-ratelimit-limit: 2000, 2000;w=1` observado nos headers. O documento cita 100 req/s; o header indica 2000 req/s por IP. Independente disso, o cliente manterá o teto interno de 30 req/s.
- Requisição com header `Origin: https://example.com` retornou **HTTP 403**. Isso confirma que o navegador não pode chamar o TSE diretamente em CORS; a arquitetura backend-only está correta.

## 5. Divergências e campos novos encontrados

### 5.1 Estrutura de `ele-c.json`

- O arquivo contém múltiplos pleitos (incluindo 2024). É preciso filtrar pelo campo `c === "ele2026"` e/ou `dt === "04/10/2026"`.
- Cargos listados em `abr[].cp[].cd` sem zeros à esquerda. O gerador de URL deve aplicar `padStart(4, '0')`.

### 5.2 Arquivo EA20 (`-u.json`)

- O objeto `s` (seções) possui campos extras além do documento: `si`, `psi`, `psin`, `sni`, `psni`, `psnin`, `sa`, `psa`, `psan`, `sna`, `psna`, `psnan`.
- O objeto `e` (eleitorado) possui campos extras: `est`, `pest`, `pestn`, `esnt`, `pesnt`, `pesntn`, `esi`, `pesi`, `pesin`, `esni`, `pesni`, `pesnin`, `esa`, `pesa`, `pesan`, `esna`, `pesna`, `pesnan`.
- O objeto `v` (votos) possui percentuais numéricos e textuais para quase todos os quantitativos (`pvvc`, `pvvcn`, `pvv`, `pvvn`, `pvnom`, `pvnomn`, `pvan`, `pvann`, `pvansj`, `pvansjn`, `pvb`, `pvbn`, `ptvn`, `ptvnn`, `pvn`, `pvnn`, `pvnt`, `pvntn`).
- O campo `md` não apareceu nos arquivos oficiais parciais (`tf=n`). Apareceu apenas nos cenários de totalização final (simulado), e ainda assim opcional.
- O campo `esae` (`n`) e `mnae` (`[]`) apareceram no simulado.
- Candidato possui campo `dt` (data de nascimento) opcional.
- `dvt` pode vir `"Anulado"` ou `"Anulado sub judice"` além de `"Válido"`.
- O campo `vs` (vice/suplentes) usa `tp: "v"` para vice e `tp: "s1"`, `tp: "s2"` para suplentes.
- O campo `subs` (substituído) é uma lista; o primeiro elemento deve ser exibido como "substituído".

### 5.3 Comportamento de `dv` (Presidente)

- No arquivo oficial de Presidente BR obtido antes das 17h, `dv` já vinha `"s"` enquanto `and="n"`. Isso indica que o TSE pode marcar `dv="s"` antes da divulgação propriamente dita. A regra da UI continua sendo: se `dv="n"`, mostrar aviso e não exibir votos; se `dv="s"`, exibir os dados como vierem (mesmo que zerados).

### 5.4 Arquivo de eleitos (`-e.json`)

- Para Presidente no simulado (com `tf="s"`), o arquivo `-e.json` retornou **404**. O documento já alertava que esse arquivo só existe após totalização final e pode não existir para Presidente. A v1 usará apenas `e`/`st` do EA20.

### 5.5 Fotos dos candidatos

Padrão confirmado (a partir das instruções de 2024, aplicado a 2026):

```
<host>/<ambiente>/<ciclo>/<eleicao>/fotos/{br|zz|uf}/<sqcand>.jpeg
```

Exemplos validados:

- `https://resultados.tse.jus.br/oficial/ele2026/6259/fotos/sp/250002541303.jpeg` (Governador SP) → 200
- `https://resultados.tse.jus.br/oficial/ele2026/6257/fotos/br/280002551544.jpeg` (Presidente BR) → 200
- `https://resultados.tse.jus.br/oficial/ele2026/6257/fotos/rj/280002551544.jpeg` → 404

**Decisão para v1:** como o EA20 de Presidente não traz a UF do candidato, a foto será buscada em `fotos/br`. Para cargos estaduais, usa-se a UF da requisição. As fotos serão servidas por proxy com cache; enquanto isso não estiver implementado, o frontend exibe avatar com iniciais.

## 6. Decisão de arquitetura após validação

Durante a Fase 0 confirmamos que a CDN do TSE **bloqueia requisições com header `Origin`** (HTTP 403). Portanto, o navegador não pode chamar o TSE diretamente. A arquitetura final usa as **rotas `/api` do próprio Nuxt** como proxy/cache sem um backend dedicado separado; o frontend consulta essas rotas e o servidor busca os arquivos no TSE. Isso atende ao requisito de "consultas no front" sem criar uma API dedicada externa, respeitando a restrição de CORS.

## 7. Fixtures salvos

Todos os arquivos abaixo estão em `fixtures/`:

- `ele-c.json` (oficial)
- `ele-c-sim.json` (simulado)
- `br-c0001-e006257-u.json` (Presidente BR, oficial)
- `sp-c0001-e006257-u.json` (Presidente SP, oficial)
- `zz-c0001-e006257-u.json` (Presidente Exterior, oficial)
- `sp-c0003-e006259-u.json` (Governador SP, oficial)
- `sp-c0005-e006259-u.json` (Senador SP, oficial)
- `sp-c0006-e006259-u.json` (Deputado Federal SP, oficial)
- `sp-c0007-e006259-u.json` (Deputado Estadual SP, oficial)
- `df-c0008-e006259-u.json` (Deputado Distrital DF, oficial)
- `br-e006257-ab.json` (acompanhamento BR Federal)
- `sp-e006259-ab.json` (acompanhamento SP Estadual)
- `br-c0001-e021270-u.json` (Presidente BR, simulado, `tf="s"`)

## 8. Decisões tomadas com base na validação

1. O parser de `ele-c.json` deve localizar o pleito por `c === "ele2026"` e, no 2º turno, pelo turno `t`.
2. O gerador de URL aplica `padStart(4, '0')` no cargo e `padStart(6, '0')` na eleição.
3. Schema Zod do EA20 usará `passthrough()` para aceitar campos extras sem quebrar.
4. O tratamento de `dv="n"` continua obrigatório, mas a presença de `dv="s"` com dados zerados deve ser exibida normalmente.
5. Fotos: `fotoUrl = null` na v1 até implementar o proxy; o front usa avatar com iniciais.
6. EA10 não será usado na v1.
7. CORS bloqueado confirma arquitetura backend-only.

## 9. Pontos ainda pendentes

- [ ] Confirmar comportamento de `dv="n"` quando a apuração começar (só será observável após as 17h).
- [ ] Confirmar se `md` (`e`/`s`) aparece em arquivos oficiais durante a totalização.
- [ ] Confirmar URL de foto para Presidente quando houver múltiplos candidatos (sempre `fotos/br`).
- [ ] Validar 2º turno (`TSE_TURNO=2`) quando os códigos forem publicados após o 1º turno.
