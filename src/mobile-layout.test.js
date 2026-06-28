// TDD for mobile blog layout and sidebar drawer markup/CSS.
import { describe, test, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

function readSrc(relPath) {
  return readFileSync(resolve(import.meta.dirname, '..', relPath), 'utf-8')
}

/** Extract CSS rules inside a media query block (brace-balanced). */
function mediaBlock(css, maxWidth, contains = '') {
  const marker = `@media (max-width: ${maxWidth}px)`
  let searchFrom = 0
  while (searchFrom < css.length) {
    const start = css.indexOf(marker, searchFrom)
    if (start === -1) return ''
    const open = css.indexOf('{', start)
    let depth = 0
    let block = ''
    for (let i = open; i < css.length; i++) {
      if (css[i] === '{') depth++
      else if (css[i] === '}') {
        depth--
        if (depth === 0) {
          block = css.slice(open + 1, i)
          break
        }
      }
    }
    if (!contains || block.includes(contains)) return block
    searchFrom = start + marker.length
  }
  return ''
}

/** Extract declarations for an exact selector rule within a CSS string. */
function ruleBlock(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`(?:^|[\\n{])\\s*${escaped}\\s*\\{([^}]*)\\}`, 'gm')
  const matches = [...css.matchAll(re)]
  const gridRule = matches.find(m => /grid-/.test(m[1]))
  return (gridRule ?? matches[0])?.[1]?.trim() ?? ''
}

describe('blog index — mobile post list grid', () => {
  const blogIndex = readSrc('src/pages/blog/index.astro')
  const styleBlock = blogIndex.match(/<style is:global>([\s\S]*?)<\/style>/)?.[1] ?? ''
  const mobileCss = mediaBlock(styleBlock, 600)

  test('blog index uses a dedicated mobile breakpoint for the post list', () => {
    expect(styleBlock).toMatch(/@media\s*\(max-width:\s*600px\)/)
  })

  test('mobile layout assigns date, title, and description to separate grid rows', () => {
    const dateRule = ruleBlock(mobileCss, '.blog-post-date')
    const titleRule = ruleBlock(mobileCss, '.blog-post-title')
    const descRule = ruleBlock(mobileCss, '.blog-post-desc')

    expect(dateRule).toMatch(/grid-row:\s*1/)
    expect(titleRule).toMatch(/grid-row:\s*2/)
    expect(descRule).toMatch(/grid-row:\s*3/)
  })

  test('mobile layout does not stack date and title in the same grid row', () => {
    const dateRow = ruleBlock(mobileCss, '.blog-post-date').match(/grid-row:\s*(\d+)/)?.[1]
    const titleRow = ruleBlock(mobileCss, '.blog-post-title').match(/grid-row:\s*(\d+)/)?.[1]
    expect(dateRow).toBeTruthy()
    expect(titleRow).toBeTruthy()
    expect(dateRow).not.toBe(titleRow)
  })

  test('mobile link grid uses a single column', () => {
    const linkRule = ruleBlock(mobileCss, '.blog-post-link')
    expect(linkRule).toMatch(/grid-template-columns:\s*1fr/)
  })

  test('desktop layout keeps date in column 1 and title in column 2', () => {
    expect(styleBlock).toMatch(/\.blog-post-link\s*\{[^}]*grid-template-columns:\s*120px\s+1fr/)
    expect(styleBlock).toMatch(/\.blog-post-title\s*\{[^}]*grid-column:\s*2/)
    expect(styleBlock).toMatch(/\.blog-post-date\s*\{[^}]*grid-row:\s*1/)
    expect(ruleBlock(styleBlock, '.blog-post-date')).not.toMatch(/grid-column:\s*2/)
  })
})

describe('mobile sidebar drawer — component wiring', () => {
  const topbar = readSrc('src/components/Topbar.astro')
  const layout = readSrc('src/components/Layout.astro')
  const sidebar = readSrc('src/components/Sidebar.astro')
  const layoutCss = readSrc('public/styles/layout.css')

  test('Topbar exposes an accessible menu toggle controlling the sidebar', () => {
    expect(topbar).toMatch(/id="sidebar-menu-toggle"/)
    expect(topbar).toMatch(/class="sidebar-menu-toggle"/)
    expect(topbar).toMatch(/aria-controls="site-sidebar"/)
    expect(topbar).toMatch(/aria-expanded="false"/)
  })

  test('Layout renders a backdrop element for the mobile drawer', () => {
    expect(layout).toMatch(/id="sidebar-backdrop"/)
    expect(layout).toMatch(/class="sidebar-backdrop"/)
  })

  test('Sidebar has a stable id for ARIA controls', () => {
    expect(sidebar).toMatch(/id="site-sidebar"/)
  })

  test('Topbar delegates sidebar behavior to sidebar-mobile module', () => {
    expect(topbar).toMatch(/from\s+['"]\.\.\/sidebar-mobile\.js['"]/)
    expect(topbar).toMatch(/initSidebarMobile/)
  })
})

describe('mobile sidebar drawer — CSS', () => {
  const layoutCss = readSrc('public/styles/layout.css')
  const mobileCss = mediaBlock(layoutCss, 768, '.sidebar-menu-toggle')

  test('menu toggle is hidden by default and shown on mobile', () => {
    expect(ruleBlock(layoutCss, '.sidebar-menu-toggle')).toMatch(/display:\s*none/)
    expect(ruleBlock(mobileCss, '.sidebar-menu-toggle')).toMatch(/display:\s*flex/)
  })

  test('mobile sidebar is an off-canvas drawer, not display:none', () => {
    const sidebarRule = ruleBlock(mobileCss, '.sidebar')
    expect(sidebarRule).toMatch(/display:\s*block/)
    expect(sidebarRule).toMatch(/position:\s*fixed/)
    expect(sidebarRule).toMatch(/transform:\s*translateX\(-100%\)/)
    expect(sidebarRule).not.toMatch(/display:\s*none/)
  })

  test('open state slides the drawer into view', () => {
    expect(layoutCss).toMatch(/body\.sidebar-open\s+\.sidebar\s*\{[^}]*transform:\s*translateX\(0\)/)
  })

  test('backdrop is shown only when drawer is open', () => {
    expect(ruleBlock(layoutCss, '.sidebar-backdrop')).toMatch(/display:\s*none/)
    expect(layoutCss).toMatch(/body\.sidebar-open\s+\.sidebar-backdrop\s*\{[^}]*display:\s*block/)
  })

  test('embed mode hides menu toggle and backdrop', () => {
    const embedBlock = layoutCss.match(/html\.embed[\s\S]*?\}/)?.[0] ?? ''
    expect(embedBlock).toMatch(/html\.embed\s+\.sidebar-menu-toggle/)
    expect(embedBlock).toMatch(/html\.embed\s+\.sidebar-backdrop/)
    expect(embedBlock).toMatch(/display:\s*none\s*!important/)
  })
})
