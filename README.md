# maratool

A collection of free, browser-based developer, design, and productivity
tools. All tools run entirely client-side — no uploads, no accounts, no
tracking beyond standard AdSense (eventually, because currently there is no AdSense).

Live at **[maratool.com](https://maratool.com)**.

## License

This project is **source-available** under the
[O'Saasy License](./LICENSE). You can read, fork, modify, and self-host
the code freely. You **cannot** offer it to third parties as a competing
hosted, managed, or SaaS product.

> Note: O'Saasy is not an OSI-approved open-source license. It is a
> source-available license modelled on MIT with an added SaaS-competition
> clause. See [LICENSE](./LICENSE) for the full text.

## Stack

- **Framework:** [Astro](https://astro.build) (static output, zero JS framework)
- **Styling:** Plain CSS + CSS variables
- **Tool logic:** Vanilla JS in `src/tools/`
- **Hosting:** Cloudflare Pages (static)
- **Instagram media worker:** Cloudflare Worker in `worker/`

## Local development

```sh
npm install
npm run dev      # http://localhost:4321
```

Build a production bundle:

```sh
npm run build
npm run preview
```

Run unit tests:

```sh
npm test
```

## Self-hosting

The site is a pure static build — you can deploy `dist/` to any static
host (Cloudflare Pages, Netlify, Vercel, GitHub Pages, an S3 bucket).
Cloudflare Pages is what we use because it is free and global.

### Instagram media tool

The `/instagram` tool depends on a separate Cloudflare Worker in
`worker/`. To self-host that tool you need:

1. A Cloudflare account.
2. A [RapidAPI](https://rapidapi.com/) subscription to the
   `instagram120` API for the primary extraction path.
3. The worker deployed via `wrangler deploy` with `RAPIDAPI_KEY` set as
   a Cloudflare Worker secret:

   ```sh
   cd worker
   wrangler secret put RAPIDAPI_KEY
   wrangler deploy
   ```

   Without `RAPIDAPI_KEY`, the worker still works through the free
   `cobalt.tools` and `kohi` fallbacks, but quality and reliability
   drop.

4. Update `ALLOWED_ORIGIN` in `worker/wrangler.toml` to point at your
   own domain.

## Project structure

```
src/
├── components/   Astro components (Layout, Sidebar, Topbar, AdColumn, ToolShell, …)
├── data/         tools.ts — central registry of every tool's metadata
├── layouts/      Base.astro — HTML shell, meta, schema
├── pages/        Every tool, blog post, and content page (one .astro per route)
└── tools/        Vanilla JS implementations of each tool

worker/           Cloudflare Worker proxying Instagram media APIs
public/           Static assets served as-is (favicon, robots.txt, vendored libs)
scripts/          Build-time generators (llms.txt, palette JSON, OG images, lastmod)
```

## Reporting issues

- **Security vulnerabilities:** see [SECURITY.md](./SECURITY.md).
- **Bugs in a specific tool:** open a GitHub issue or email
  `maratool@marcell.com.br`.
- **Clinical/medical formula corrections:** email
  `maratool@marcell.com.br` — these are treated as priority.
