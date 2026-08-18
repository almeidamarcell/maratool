# SEO backlog, agosto 2026

Cards prontos para subir num board kanban. Origem: diagnóstico do GSC de
12/08/2026 cruzado com Semrush.

Onde estamos: 57 cliques e 10.255 impressões em 5 meses, posição média 72, 272
páginas indexadas contra 1.112 não indexadas. As páginas que convertem são
nichos sem concorrência. As de maior volume de impressão estão em queries que o
domínio não tem autoridade para ganhar, com Authority Score 2 e 20 domínios
referenciando.

Premissa fixa: o site mantém todas as páginas. Nada de poda, nada de noindex em
ferramenta. O plano trabalha priorização de crawl e de links internos, não
redução de catálogo.

Já feito, não precisa subir para o board:

- Ação 5, trailing slash em todos os links internos mais o invariante no teste
  (commit `8ead8eb`)
- Ação 1, títulos, h1 e meta das 25 páginas prioritárias (commit `e4555b1`)
- Ação 2, faixa "Most used in X" nos hubs grandes, manualBoost do cluster,
  destaques da homepage, e 5 páginas órfãs passando a receber links internos
  (commit `e4555b1`)

Um bloqueio que não é código: o bloco "Cloudflare Managed content" do robots.txt
está bloqueando GPTBot, ClaudeBot e Google-Extended, contradizendo o comentário
do próprio arquivo e o llms.txt. É um toggle no painel do Cloudflare ("Block AI
bots") e precisa ser desligado por você.

---

## AÇÃO 3: profundidade nas páginas vencedoras

A meta é sair de "calculadora que só calcula" para a página mais completa da
query. O MDCalc ganha não pelo cálculo, mas pelo contexto ao redor dele. Cada
card abaixo é uma entrega; fazer em lotes pequenos.

### 3.1 Tabela de interpretação nas 12 calculadoras prioritárias

O usuário calcula o escore e a pergunta seguinte é sempre "e daí?". Hoje a
página responde com uma faixa colorida e nada mais. Esse é o bloco que segura o
usuário na página e que a IA cita.

Entregar uma tabela por página, com escore, interpretação e conduta sugerida,
usando as faixas exatas do paper original.

Páginas: `aldrete-recovery`, `maddrey-discriminant`,
`rope-paradoxical-embolism`, `pack-year`, `karnofsky-performance`,
`saag-albumin-gradient`, `san-francisco-syncope`, `finnegan-score`,
`mascc-febrile-neutropenia`, `ramsay-sedation`, `uceis-uc`, `candida-score`.

Pronto quando as 12 páginas tiverem a tabela, cada linha rastreável à referência
já listada no rodapé da página, e `npm test` passar.

Estimativa: 3 lotes de 4 páginas.

### 3.2 Bloco "quando não usar" nas mesmas 12 páginas

Limitação e população de validação separam conteúdo clínico de conteúdo raso. É
também o trecho que a IA cita, porque responde uma pergunta que a concorrência
não responde.

Um parágrafo por página: em que população o escore foi validado, onde ele falha,
e qual usar no lugar, com link interno para essa alternativa. Vale como
linkagem interna de bônus.

Pronto quando as 12 páginas tiverem o bloco e cada uma linkar pelo menos uma
alternativa que exista no site.

### 3.3 Galeria de exemplos nos 5 mockups prioritários

"fake tweet generator" é uma query visual. Quem chega quer ver o resultado antes
de usar, e hoje a página abre num estado vazio.

Entregar 3 ou 4 presets clicáveis por ferramenta que preenchem o mockup com um
exemplo pronto: conversa de suporte, thread viral, e-mail de cobrança. Preset é
estado local, não rota nova.

Páginas: `x-post-mockup`, `imessage-chat-mockup`, `whatsapp-chat-mockup`,
`gmail-mockup`, `instagram-chat-mockup`.

Pronto quando cada ferramenta tiver os presets, o CLS continuar zero (o
min-height já está definido) e o estado inicial carregar um preset em vez de
vazio.

### 3.4 Export além do PNG nos mockups

Os concorrentes das queries de 3.6k por mês só exportam PNG. Dá para
diferenciar barato aqui.

Adicionar export em JPG e cópia direta para a área de transferência. Usar
`downloadBlob` e `copyWithFeedback` de `src/tools/tool-utils.js`, sem
re-implementar.

Pronto quando os 5 mockups exportarem nos 3 modos, com o feedback "Copied!" de 2
segundos que é o padrão do projeto.

### 3.5 Post de blog para cada calculadora prioritária que ainda não tem

O CLAUDE.md já exige isso via `blogPost: true`, e o post é o ativo que atrai link
externo. A calculadora sozinha não atrai.

Auditar quais das 12 já têm post e escrever os que faltam seguindo o template:
schema `BlogPosting`, embed, "how it works" em 3 passos, uma ou duas seções
explicativas, link de volta. Rodar `/humanizer` na prosa de cada um.

Pronto quando todas as 12 tiverem post, entrada em `blog/index.astro`, e
`npm test` validar.

Este é o card mais demorado da lista. Quebrar por página.

---

## AÇÃO 4: expandir o cluster de mockups

Atacar as queries grandes do cluster que já converte. A regra de ritmo é uma
ferramenta por semana, nunca em lote. O histórico é claro: todo lote grande (131
páginas em 18/mai, 235 em 23/mai, 101 em 24/jul) foi seguido de queda no número
de páginas indexadas.

### 4.1 Fake Snapchat Generator

Query `fake snapchat generator`, 260 buscas por mês, KD 22. Não existe hoje e é
a maior lacuna do cluster. Slug `snapchat-chat-mockup`. Entregar com página,
entrada em `tools.ts`, post de blog e os presets do card 3.3.

### 4.2 Fake Telegram Chat Generator

Mesmo cluster de chat, mesma engine dos mockups existentes. Slug
`telegram-chat-mockup`. Validar volume no Semrush antes de construir.

### 4.3 Fake SMS / Android Message Generator

Complementa o `imessage-chat-mockup`, que cobre só o lado iPhone da query "fake
text message generator" (1.900 por mês, KD 18).

Decidir antes de codar: página separada ou toggle iOS/Android dentro da
existente. Página separada só se a query Android tiver volume próprio, senão
vira canibalização.

### 4.4 Fake LinkedIn Post Mockup

Cluster de posts, ao lado de `x-post-mockup` e `instagram-post-mockup`. Validar
volume antes.

### 4.5 Reposicionar as páginas de baixo tráfego do cluster

`discord-chat-mockup`, `instagram-post-mockup` e `chatgpt-mockup` ficaram fora
da ação 1. Rodar a mesma pesquisa de query exata e reescrever título, h1 e meta.

Critério de aceite para qualquer card da ação 4: antes de escrever código, rodar
a pesquisa de keyword (Semrush, autocomplete, "People also ask") e registrar
volume e KD no card. Sem esse número o card não sai do backlog. Essa regra já
está no CLAUDE.md e não foi seguida nas ondas anteriores.

---

## Contínuo: backlinks

É a restrição real do projeto. Authority Score 2 de 100, 36 backlinks vindos de
20 domínios. Enquanto isso não mudar, as ações 3 e 4 rendem menos do que
poderiam.

### C.1 Divulgação do cluster de mockups

Product Hunt, diretórios de ferramentas de design, newsletters de design e
marketing, subreddits de design e social media. O ângulo é gerador de mockup que
roda 100% no navegador, sem upload.

### C.2 Divulgação do cluster médico

Comunidades de educação médica, grupos de residência, subreddits médicos, listas
de recursos de faculdades. O ângulo é calculadora com referência ao paper
original que não manda dado de paciente para servidor nenhum.

### C.3 Explorar o fato de ser open source

O repositório é público e isso ainda não gerou um único link. Listas "awesome",
GitHub topics, Show HN, comunidades de dev.

### C.4 Ritmo de publicação escalonado — FEITO em 16/08/2026

Continuar construindo tudo, porque a premissa é ter o catálogo completo, mas
liberar no sitemap em levas. Resolve o conflito entre catálogo completo e o
Google punindo despejo em massa.

Implementado exatamente como descrito: campo `sitemapFrom` (YYYY-MM-DD) em
`tools.ts`, lido pelo `astro.config.mjs` via `scripts/lib/load-tools.mjs` (o
mesmo loader que `gen-llms` e `gen-palette` já usam) e aplicado no `filter` do
`@astrojs/sitemap`. Ausência do campo significa "no sitemap agora", então nada
do catálogo existente mudou.

A página continua construída, navegável, linkada na sidebar e presente no
`llms.txt` desde o build. Só a entrada no `sitemap.xml` espera. Verificado: das
15 páginas da leva de agosto, 12 ficaram fora do sitemap junto com seus 12
posts, 24 URLs exatas, e nenhuma outra. As seguradas seguem recebendo entre 2 e
9 links internos.

Calendário desta leva:

| Data | Páginas |
|---|---|
| imediato | `heic-to-jpg`, `resize-image`, `case-converter` |
| 23/08 | `crop-image`, `url-encode-decode`, `tdee-calculator` |
| 30/08 | `rotate-image`, `sort-lines`, `bmr-calculator` |
| 06/09 | `svg-to-png`, `remove-duplicate-lines`, `days-between-dates` |
| 13/09 | `slug-generator`, `html-escape`, `random-number-generator` |

Não há job agendado: a data é lida a cada build, então a leva entra sozinha no
próximo deploy após a data. Se ficar semanas sem deploy, as páginas ficam
retidas — vale um build periódico ou revisar as datas antes de um deploy grande.

---

## Métrica semanal

Registrar toda segunda:

| Métrica | Onde | Baseline em 12/08/2026 |
|---|---|---|
| Páginas indexadas | GSC Coverage | 272 |
| Páginas não indexadas | GSC Coverage | 1.112 |
| "Discovered - currently not indexed" | GSC Coverage | 661 |
| "Page with redirect" | GSC Coverage | 224, deve zerar após o deploy do `8ead8eb` |
| Cliques em 7 dias | GSC Performance | ~10 |
| Keywords do cluster no top 20 | Semrush | 0 |
| Domínios referenciando | Semrush | 20 |

Sucesso em 8 semanas: `rope`, `aldrete`, `mascc` e "fake text message generator"
no top 20, "Page with redirect" zerado, e indexadas acima de 350.

---

# Adendo, 15/08/2026

Levantado numa auditoria do catálogo, não do GSC. As duas ações abaixo ficaram
de fora do plano original e não têm dono. Nenhuma delas tem volume de busca
validado ainda: a conta do Semrush estava com as API units zeradas
(`ERROR 132`) no dia do levantamento. A regra da Ação 4 vale aqui também —
número antes de código.

## AÇÃO 6: fechar o buraco de blog posts

249 das 513 ferramentas live não têm post. O `CLAUDE.md` exige um post por
ferramenta nova via `blogPost: true`, mas a regra só passou a valer depois que
boa parte do catálogo já existia, então o passivo nunca foi pago. O post é o
ativo que atrai link externo; a ferramenta sozinha não atrai.

Distribuição do passivo:

| Categoria | Sem post | Onde dói mais |
|---|---|---|
| Health | 131 | `Score` 65, `Pediatric` 10, `Scale` 9, `Prognosis` 7, `Renal` 7 |
| Converter | 27 | `Video` 13, `Format` 8, `Unit` 6 |
| Image | 24 | `Transform` 18 |
| Developer | 20 | `Generate` 6, `Audit` 5, `Crypto` 4 |
| Text | 12 | `Generate` 5, `Analyze` 4 |
| Color | 9 | `Generate` 6 |
| PDF | 8 | — |
| Mockup | 8 | **os 8, ou seja o cluster inteiro** |
| Marketing | 6 | — |
| Education | 4 | — |

### 6.1 Mockups primeiro — 8 posts

Este é o card de maior retorno da lista inteira e o mais barato. O cluster de
mockup é o único que já converte clique (`gmail-mockup` em posição 8) e é
exatamente o cluster com cobertura zero de blog. Oito posts fecham a categoria.

Ordem sugerida: `gmail-mockup`, `imessage-chat-mockup`, `x-post-mockup`,
`whatsapp-chat-mockup`, `instagram-chat-mockup`, `instagram-post-mockup`,
`discord-chat-mockup`, `chatgpt-mockup`.

Fazer depois dos presets da Ação 3.3, para que o embed do post já abra com um
exemplo preenchido em vez de um mockup vazio.

### 6.2 O resto, em lotes por subcategoria

Não fazer os 241 restantes como projeto único. Escolher a subcategoria por
impressão no GSC, não por tamanho: `Converter/Video` (13 páginas) e
`Image/Transform` (18) provavelmente rendem mais que `Health/Score` (65), porque
o post de calculadora clínica compete com literatura de verdade.

Pronto por lote quando cada ferramenta tem post com `BlogToolEmbed`, entrada em
`blog/index.astro`, `blogPost: true` no registry, `/humanizer` rodado na prosa,
e `npm test` passando.

## AÇÃO 8: páginas que entregam ferramenta diferente do título — EM EXECUÇÃO

Descoberto em 15/08 pelos agentes que reescreveram a copy do registry: ao ler o
código para descrever cada ferramenta com honestidade, encontraram páginas cujo
`<title>` promete um trabalho e cujo código faz outro. Cada item abaixo foi
confirmado abrindo o arquivo, não é hipótese.

**Decisão tomada: consertar o código, não renomear a página.** O título é o alvo
de keyword. Renomear para o que o código faz descarta o alvo e ainda exige
redirect. Consertar faz a página passar a satisfazer a intenção da query, que é
o sinal que ranqueia. Também preserva a premissa de não podar nada.

| Página | Promete | Executava |
|---|---|---|
| `interpolate-frames` | interpolação de GIF | `accept` só MP4/WebM/MOV, saída MP4 |
| `view-metadata` | visualizador de EXIF | nome, MIME, bytes, dimensões |
| `crop-pdf` | cortar PDF | `mode: 'compress'`, duplicata de `compress-pdf` |
| `gif-split` | cortar em segmentos | `mode: 'to-frames'`, duplicata de `gif-to-frames` |
| `bulk-jpg-to-png` | JPG para PNG | devolvia JPEG |
| `bulk-png-to-jpg` | PNG para JPG | devolvia PNG |
| `bulk-avif-to-jpg` | AVIF para JPG | devolvia PNG |
| os 5 `bulk-*` | conversão em lote | `multiple` só existe nos modos `compare` e `collage` |
| `sprite-cutter` | baixar todos os frames | desenhava só `tiles[0]` |
| `compare-images` | lado a lado, slider, diferença | só lado a lado |
| `video-filters` | brilho, contraste, saturação | 3 presets fixos num select |
| `video-subtitles` | digitar legenda à mão | exigia upload de `.srt` |
| `gif-repair` | reparo de GIF | só reescrevia o loop flag |
| `compress-pdf` | campo "Image quality (1-100)" | controle morto, ignorado no modo compress |

Lição de processo: essas páginas passaram por review e por `npm test` sem que
ninguém rodasse a ferramenta. A suíte cobre bem as invariantes de SEO e a lógica
pura dos `*-core.js`, mas não cobria o casamento entre o que a página promete e
qual `mode` o shim passa.

Fechado com `src/tool-shim-invariants.test.js`, que não proíbe compartilhar
engine — várias landing pages sobre uma implementação é escolha deliberada aqui
— mas exige que o compartilhamento esteja declarado com motivo em
`DECLARED_SHARED_ENGINES`. Colisão nova e não declarada quebra o build. O teste
foi validado revertendo `gif-split` para `to-frames`, e ele falha como esperado.

Dois casos que o teste expôs e que ficaram apenas declarados, não resolvidos:
`gif-add-text` e `white-box-caption` rodam a mesma engine, assim como
`gif-resizer` e `instagif`. São candidatos a diferenciação real.

### 8.1 O `howTo` placeholder em 65 páginas

Levantado ao corrigir as 14 acima. Sessenta e cinco páginas ainda trazem:

```js
const howTo = [
  'Upload or drop your file.',
  'Adjust settings if needed.',
  'Click Process and download the result.',
]
```

Junto costuma vir um `faq` igualmente genérico ("Is this tool free?") e, em
várias, um bloco herdado que fala de limite de GIF numa ferramenta que não mexe
com GIF. É o mesmo problema das descrições boilerplate do registry, uma camada
acima: ocupa o espaço onde deveria estar o conteúdo que responde a query.

Fazer em lotes por categoria, lendo a implementação antes de escrever, como foi
feito nas 14 da Ação 8.

## AÇÃO 7: expandir `/vs/`

33 pares de comparação para 513 ferramentas. A distribuição atual: Health 11,
Developer 5, Image 3, Text 3, Converter 3, Color 2, Marketing 2, Mockup 2,
PDF 2.

A página de comparação captura a query "X vs Y", que tem intenção alta e
concorrência baixa, e serve de link interno entre duas ferramentas que hoje só
se conhecem pelo `relatedTools`.

Cuidado: isso é geração programática e o histórico do projeto é ruim com lote
grande (131 páginas em 18/mai, 235 em 23/mai, 101 em 24/jul, todas seguidas de
queda de indexação). Não gerar o produto cartesiano. Cada par precisa de uma
diferença real para explicar — se a resposta for "são a mesma coisa", o par não
existe.

Candidatos onde a diferença é substantiva e a query é plausível:

- `heic-to-jpg` vs `image-converter` — quando usar o dedicado e quando o geral
- `resize-image` vs `enlarge-image` vs `image-compressor` — os três mexem em
  dimensão por motivos diferentes, e essa confusão é a própria query
- `crop-image` vs `social-media-cropper` — livre contra preset
- `case-converter` vs `text-line-tools` — página única contra hub
- `url-encode-decode` vs `base64` — os dois "encodings" que as pessoas
  confundem
- `bmr-calculator` vs `tdee-calculator` — a diferença é o multiplicador de
  atividade e quase ninguém explica isso direito
- `mp4-to-webm` vs `compress-video`
- `pdf-to-text` vs `pdf-to-markdown`

Pronto quando cada par novo tiver entrada em `compare-pairs.ts` com
`whenToUseA` / `whenToUseB` escritos à mão, e o release for escalonado no ritmo
da Ação 4 (um por semana), não em lote.
