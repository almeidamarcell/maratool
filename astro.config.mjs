import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import { buildLastModMap } from './scripts/lib/git-lastmod.mjs'

const CATEGORY_PAGES = [
  '/converter/', '/pdf/', '/text/', '/image/', '/color/', '/developer/', '/marketing/', '/health/', '/mockup/',
]
const SUBCATEGORY_RE = /\/(converter|pdf|text|image|color|developer|marketing|health|mockup)\/[^/]+\/$/

// Single git pass shared across all sitemap entries (was one `git log -1`
// subprocess per URL — ~900 spawns per build).
const gitDates = buildLastModMap(process.cwd())
const BUILD_DATE = new Date().toISOString().split('T')[0]

/**
 * Get the last git commit date for a page's source file.
 * Falls back to the current build date if the file has no git history.
 */
function getPageLastMod(url) {
  // Map URL path to source file
  const path = new URL(url).pathname.replace(/\/$/, '') || '/index'
  return (
    gitDates.get(`src/pages${path}.astro`) ||
    gitDates.get(`src/pages${path}/index.astro`) ||
    BUILD_DATE
  )
}

export default defineConfig({
  vite: {
    assetsInclude: ['**/*.wasm'],
  },
  output: 'static',
  // No adapter needed — output is pure static HTML served directly by
  // Cloudflare Pages. The @astrojs/cloudflare adapter generated a
  // _worker.js + _routes.json that returned 500 on /compare/* because
  // nested dynamic routes (compare/[category]/[pair].astro) were not
  // properly excluded from worker routing.
  site: 'https://maratool.com',
  integrations: [
    sitemap({
      serialize(item) {
        const url = item.url
        const lastmod = getPageLastMod(url)

        // Homepage
        if (url === 'https://maratool.com/') {
          return { ...item, priority: 1.0, lastmod }
        }

        // Category landing pages
        if (CATEGORY_PAGES.some(p => url.endsWith(p))) {
          return { ...item, priority: 0.9, lastmod }
        }

        // Subcategory pages (e.g. /developer/crypto/)
        if (SUBCATEGORY_RE.test(url)) {
          return { ...item, priority: 0.85, lastmod }
        }

        // Blog index
        if (url.endsWith('/blog/')) {
          return { ...item, priority: 0.8, lastmod }
        }

        // Blog posts
        if (url.includes('/blog/')) {
          return { ...item, priority: 0.7, lastmod }
        }

        // Contact, About
        if (url.endsWith('/contact/') || url.endsWith('/about/')) {
          return { ...item, priority: 0.4, lastmod }
        }

        // All tool pages — default
        return { ...item, priority: 0.8, lastmod }
      },
    }),
  ],
})
