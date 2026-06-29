// Content-based cache-busting for the static /styles/*.css assets.
//
// These files live in public/ and are served under stable, unhashed paths
// (/styles/layout.css). public/_headers caches /styles/* for 7 days, so a CSS
// change is invisible at the CDN edge until the cache expires — that is why a
// stale layout.css kept the mobile sidebar drawer broken after deploy.
//
// Appending ?v=<hash-of-file-contents> makes the URL change whenever the file
// changes, forcing a cache miss for the new version while keeping the long
// cache safe for unchanged files. Hashes are computed once at build time
// (this module is evaluated once per build; Astro frontmatter runs in Node for
// static output).
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'

// Resolve from the project root (cwd during `astro build` and vitest), not from
// import.meta.url — once this module is bundled by vite its URL no longer points
// at src/lib/, which would make a relative path miss public/styles and silently
// fall back to un-versioned links.
const stylesDir = join(process.cwd(), 'public/styles')

const STYLESHEETS = [
  'global.css',
  'layout.css',
  'tools.css',
  'health-tools.css',
  'discovery-shared.css',
  'discovery.css',
  'mockup.css',
] as const

function hashFile(name: string): string {
  try {
    const buf = readFileSync(join(stylesDir, name))
    return createHash('sha256').update(buf).digest('hex').slice(0, 8)
  } catch {
    return ''
  }
}

export const cssVersion: Record<string, string> = Object.fromEntries(
  STYLESHEETS.map((name) => [name, hashFile(name)]),
)

/** `/styles/<name>?v=<contenthash>` — falls back to the bare path if unreadable. */
export function styleHref(name: string): string {
  const v = cssVersion[name]
  return v ? `/styles/${name}?v=${v}` : `/styles/${name}`
}
