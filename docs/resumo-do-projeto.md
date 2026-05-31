# maratool — Resumo do Projeto

**maratool.com** é um site de ferramentas gratuitas que rodam no navegador, sem conta e, na prática, sem enviar dados para servidores. Foi criado por **Marcell Almeida** como resposta a tarefas pequenas e repetitivas — converter formatos, calcular algo, editar PDF, simular mockup — que normalmente exigem buscar um site aleatório ou mandar dados para um LLM.

Hoje o projeto está **aberto no GitHub** ([almeidamarcell/maratool](https://github.com/almeidamarcell/maratool)) e publicado em **[maratool.com](https://maratool.com)**.

---

## O que o site oferece

O registro central em `src/data/tools.ts` lista **~100 ferramentas ativas** e **15 “em breve”**, organizadas em categorias:


| Categoria     | Exemplos                                                                    |
| ------------- | --------------------------------------------------------------------------- |
| **Converter** | CSV↔JSON, YAML↔JSON, Base64, conversores de unidade                         |
| **PDF**       | extrair texto, metadados, acessibilidade, edição                            |
| **Text**      | diff checker, contagem de palavras, geradores de lorem ipsum                |
| **Image**     | remoção de fundo, GIF maker, cropper para redes sociais                     |
| **Color**     | paletas, contraste, simulador de daltonismo                                 |
| **Developer** | JWT decoder, hash, regex, cron, bcrypt, UUID                                |
| **Marketing** | UTM builder, meta tags, schema markup                                       |
| **Mockup**    | chats simulados (WhatsApp, Instagram, Gmail, ChatGPT…)                      |
| **Health**    | **mais de 100 calculadoras clínicas** (SOFA, APACHE II, CHA₂DS₂-VASc, etc.) |


Há também páginas de **blog**, **comparação entre ferramentas** (`/vs/`) e hubs por categoria/subcategoria.

---

## Modelo de negócio e SEO

A aposta é **tráfego orgânico via Google**: cada ferramenta é nomeada pela **intenção de busca** (“Decode JWT token online”, não “JWT Decoder”), com title, H1, FAQ schema e JSON-LD pensados para ranquear em keywords de baixa dificuldade e alto CPC. A monetização prevista é **Google AdSense** (ainda não ativo, segundo o README).

---

## Stack técnica


| Camada           | Escolha                                                 |
| ---------------- | ------------------------------------------------------- |
| Framework        | **Astro** — output 100% estático (HTML pré-renderizado) |
| Estilo           | **CSS puro** + variáveis de design (sem Tailwind/React) |
| Lógica dos tools | **JavaScript vanilla** em `src/tools/`                  |
| Deploy           | **Cloudflare Pages**                                    |
| Testes           | **Vitest** + jsdom                                      |


Scripts de build geram `llms.txt`, paleta, lastmod e OG images.

Layout padrão: topbar + sidebar (240px) + conteúdo + coluna de ads (300px) + footer.

**Exceção importante:** só o **Instagram video downloader** usa um **Cloudflare Worker** (`worker/`) que faz proxy para APIs externas. Todo o resto roda client-side.

---

## Filosofia do produto

1. **Privacidade** — dados ficam no navegador; nada é enviado (exceto a ferramenta do Instagram).
2. **Velocidade** — páginas estáticas, JS mínimo, carregamento rápido.
3. **Sem fricção** — sem cadastro, sem upload obrigatório na maioria dos casos.
4. **Precisão** — especialmente nas calculadoras de saúde, implementadas a partir da literatura primária.

---

## Licença

O código é **source-available** sob a **O'Saasy License**: pode ler, forkar, modificar e self-hostar, mas **não pode** oferecer como produto SaaS concorrente.

---

## Estrutura do repositório

```
src/
├── components/   Layout, Sidebar, Topbar, AdColumn, ToolShell, …
├── data/         tools.ts — registro central de metadata
├── layouts/      Base.astro — HTML shell, meta, schema
├── pages/        Uma .astro por rota (tools, blog, hubs)
└── tools/        Implementações vanilla JS de cada ferramenta

public/styles/    CSS global, layout e UI compartilhada
worker/           Cloudflare Worker (Instagram downloader)
scripts/          Geração de llms.txt, palette, lastmod, OG images
```

---

## Estado atual

O projeto **cresceu muito** além do “Wave 1” original de 8 ferramentas para devs. Hoje é uma plataforma ampla de utilitários — com destaque forte para **calculadoras médicas** — mantida como site estático leve, otimizado para SEO e contribuições abertas.

---

## Links úteis

- Site: [maratool.com](https://maratool.com)
- Repositório: [github.com/almeidamarcell/maratool](https://github.com/almeidamarcell/maratool)
- Blog (open source): [/blog/may-2026-open-source](https://maratool.com/blog/may-2026-open-source)
- README: [README.md](../README.md)
- Contexto para agents: [CLAUDE.md](../CLAUDE.md)

