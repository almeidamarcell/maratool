// One-pass git lastmod map for src/pages.
//
// The sitemap serializer and gen-lastmod.mjs both need "when was this page's
// source last committed". Spawning `git log -1` per page meant ~1300 git
// processes per build; instead we walk the log once (newest-first) and take
// the first commit date seen for each file.

import { execSync } from 'node:child_process'

// Keyed by root: astro.config.mjs passes process.cwd() and gen-lastmod.mjs
// passes ROOT, so a single shared slot would hand the second caller the first
// caller's map.
const cache = new Map()

export function buildLastModMap(root) {
  if (cache.has(root)) return cache.get(root)
  const map = new Map()
  try {
    const out = execSync('git log --format=%x01%aI --name-only -- src/pages', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
      cwd: root,
      maxBuffer: 128 * 1024 * 1024,
    })
    let currentDate = null
    for (const line of out.split('\n')) {
      if (line.charCodeAt(0) === 1) {
        currentDate = line.slice(1).split('T')[0]
      } else if (line && currentDate && !map.has(line)) {
        map.set(line, currentDate)
      }
    }
  } catch (err) {
    // Not a git checkout (e.g. tarball deploy) — callers fall back per-file.
    // A buffer overflow is NOT that, and silently zeroing every lastmod would
    // look identical, so make it loud.
    if (err && err.code === 'ENOBUFS') {
      console.warn('git-lastmod: git log exceeded maxBuffer — lastmod falls back to build date')
    }
  }
  cache.set(root, map)
  return map
}
