import { defineConfig } from 'astro/config'
import cloudflare from '@astrojs/cloudflare'
import sitemap from '@astrojs/sitemap'

const CATEGORY_PAGES = [
  '/converter/', '/pdf/', '/text/', '/image/', '/color/', '/developer/', '/marketing/',
]
const SUBCATEGORY_RE = /\/(converter|pdf|text|image|color|developer|marketing)\/[^/]+\/$/

export default defineConfig({
  output: 'static',
  adapter: cloudflare(),
  site: 'https://maratool.com',
  integrations: [
    sitemap({
      serialize(item) {
        const url = item.url

        // Homepage
        if (url === 'https://maratool.com/') {
          return { ...item, changefreq: 'daily', priority: 1.0, lastmod: new Date().toISOString().split('T')[0] }
        }

        // Category landing pages
        if (CATEGORY_PAGES.some(p => url.endsWith(p))) {
          return { ...item, changefreq: 'weekly', priority: 0.9 }
        }

        // Subcategory pages (e.g. /developer/crypto/)
        if (SUBCATEGORY_RE.test(url)) {
          return { ...item, changefreq: 'weekly', priority: 0.85 }
        }

        // Blog index
        if (url.endsWith('/blog/')) {
          return { ...item, changefreq: 'weekly', priority: 0.8 }
        }

        // Blog posts
        if (url.includes('/blog/')) {
          return { ...item, changefreq: 'monthly', priority: 0.7 }
        }

        // Contact, About
        if (url.endsWith('/contact/') || url.endsWith('/about/')) {
          return { ...item, changefreq: 'monthly', priority: 0.4 }
        }

        // All tool pages — default
        return { ...item, changefreq: 'monthly', priority: 0.8 }
      },
    }),
  ],
})
