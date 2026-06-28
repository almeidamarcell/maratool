// TDD for mobile sidebar drawer behavior.
import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { JSDOM } from 'jsdom'
import { setSidebarOpen, isSidebarOpen, initSidebarMobile } from './sidebar-mobile.js'

function setupDom() {
  const dom = new JSDOM(`<!DOCTYPE html><html><body>
    <button id="sidebar-menu-toggle" aria-expanded="false" aria-label="Open navigation menu"></button>
    <div id="sidebar-backdrop" hidden></div>
    <nav id="site-sidebar"><a href="/health">Health</a></nav>
  </body></html>`)
  return dom
}

describe('sidebar-mobile — setSidebarOpen', () => {
  /** @type {JSDOM} */
  let dom

  beforeEach(() => {
    dom = setupDom()
  })

  afterEach(() => {
    dom.window.close()
  })

  test('adds sidebar-open class and updates ARIA when opening', () => {
    const { document } = dom.window
    const menuToggle = document.getElementById('sidebar-menu-toggle')
    const backdrop = document.getElementById('sidebar-backdrop')

    setSidebarOpen(true, { body: document.body, menuToggle, backdrop })

    expect(document.body.classList.contains('sidebar-open')).toBe(true)
    expect(menuToggle?.getAttribute('aria-expanded')).toBe('true')
    expect(menuToggle?.getAttribute('aria-label')).toBe('Close navigation menu')
    expect(backdrop?.hidden).toBe(false)
    expect(document.body.style.overflow).toBe('hidden')
  })

  test('removes sidebar-open class and restores scroll when closing', () => {
    const { document } = dom.window
    const menuToggle = document.getElementById('sidebar-menu-toggle')
    const backdrop = document.getElementById('sidebar-backdrop')

    setSidebarOpen(true, { body: document.body, menuToggle, backdrop })
    setSidebarOpen(false, { body: document.body, menuToggle, backdrop })

    expect(document.body.classList.contains('sidebar-open')).toBe(false)
    expect(menuToggle?.getAttribute('aria-expanded')).toBe('false')
    expect(menuToggle?.getAttribute('aria-label')).toBe('Open navigation menu')
    expect(backdrop?.hidden).toBe(true)
    expect(document.body.style.overflow).toBe('')
  })

  test('isSidebarOpen reflects body class', () => {
    const { document } = dom.window
    expect(isSidebarOpen(document.body)).toBe(false)
    document.body.classList.add('sidebar-open')
    expect(isSidebarOpen(document.body)).toBe(true)
  })
})

describe('sidebar-mobile — initSidebarMobile', () => {
  /** @type {JSDOM} */
  let dom

  beforeEach(() => {
    dom = setupDom()
    initSidebarMobile(dom.window.document)
  })

  afterEach(() => {
    dom.window.close()
  })

  test('toggle button opens and closes the drawer', () => {
    const { document } = dom.window
    const menuToggle = document.getElementById('sidebar-menu-toggle')

    menuToggle?.click()
    expect(isSidebarOpen(document.body)).toBe(true)

    menuToggle?.click()
    expect(isSidebarOpen(document.body)).toBe(false)
  })

  test('backdrop click closes an open drawer', () => {
    const { document } = dom.window
    const menuToggle = document.getElementById('sidebar-menu-toggle')
    const backdrop = document.getElementById('sidebar-backdrop')

    menuToggle?.click()
    backdrop?.click()
    expect(isSidebarOpen(document.body)).toBe(false)
  })

  test('Escape key closes an open drawer', () => {
    const { document } = dom.window
    const menuToggle = document.getElementById('sidebar-menu-toggle')

    menuToggle?.click()
    document.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape' }))
    expect(isSidebarOpen(document.body)).toBe(false)
  })

  test('clicking a sidebar link closes the drawer', () => {
    const { document } = dom.window
    const menuToggle = document.getElementById('sidebar-menu-toggle')
    const link = document.querySelector('#site-sidebar a')

    menuToggle?.click()
    link?.click()
    expect(isSidebarOpen(document.body)).toBe(false)
  })

  test('no-ops when required elements are missing', () => {
    const empty = new JSDOM('<!DOCTYPE html><html><body></body></html>')
    expect(() => initSidebarMobile(empty.window.document)).not.toThrow()
    empty.window.close()
  })
})
