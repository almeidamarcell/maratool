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

### C.4 Ritmo de publicação escalonado

Continuar construindo tudo, porque a premissa é ter o catálogo completo, mas
liberar no sitemap em levas de 20 a 30 páginas por semana. Resolve o conflito
entre catálogo completo e o Google punindo despejo em massa.

Implementação: campo de data de liberação em `tools.ts` que o `astro.config.mjs`
usa para filtrar o sitemap. A página fica no ar e navegável desde o build, só a
entrada no sitemap é escalonada.

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
