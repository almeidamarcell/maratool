import { defineConfig } from 'astro/config'
import { execSync } from 'child_process'
import cloudflare from '@astrojs/cloudflare'
import sitemap from '@astrojs/sitemap'

const CATEGORY_PAGES = [
  '/converter/', '/pdf/', '/text/', '/image/', '/color/', '/developer/', '/marketing/',
]
const SUBCATEGORY_RE = /\/(converter|pdf|text|image|color|developer|marketing)\/[^/]+\/$/

/**
 * Get the last git commit date for a page's source file.
 * Falls back to the current build date if the file has no git history.
 */
function getPageLastMod(url) {
  // Map URL path to source file
  const path = new URL(url).pathname.replace(/\/$/, '') || '/index'
  const candidates = [
    `src/pages${path}.astro`,
    `src/pages${path}/index.astro`,
  ]

  for (const file of candidates) {
    try {
      const date = execSync(`git log -1 --format=%aI -- "${file}"`, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'],
      }).trim()
      if (date) return date.split('T')[0]
    } catch { /* file not tracked */ }
  }

  // Fallback: build date
  return new Date().toISOString().split('T')[0]
}

export default defineConfig({
  output: 'static',
  adapter: cloudflare(),
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
