/**
 * Mobile sidebar drawer — open/close state and event wiring.
 */

/**
 * @param {boolean} open
 * @param {{ body?: HTMLElement, menuToggle?: HTMLElement | null, backdrop?: HTMLElement | null }} els
 */
export function setSidebarOpen(open, els = {}) {
  const body = els.body ?? document.body
  const menuToggle = els.menuToggle ?? null
  const backdrop = els.backdrop ?? null

  body.classList.toggle('sidebar-open', open)
  if (menuToggle) {
    menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false')
    menuToggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu')
  }
  if (backdrop) backdrop.hidden = !open
  body.style.overflow = open ? 'hidden' : ''
}

/**
 * @param {HTMLElement} [body]
 */
export function isSidebarOpen(body = document.body) {
  return body.classList.contains('sidebar-open')
}

/**
 * @param {Document} [doc]
 */
export function initSidebarMobile(doc = document) {
  const menuToggle = doc.getElementById('sidebar-menu-toggle')
  const sidebar = doc.getElementById('site-sidebar')
  const backdrop = doc.getElementById('sidebar-backdrop')
  if (!menuToggle || !sidebar) return

  const els = { body: doc.body, menuToggle, backdrop }

  menuToggle.addEventListener('click', () => {
    setSidebarOpen(!isSidebarOpen(doc.body), els)
  })

  if (backdrop) {
    backdrop.addEventListener('click', () => setSidebarOpen(false, els))
  }

  doc.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isSidebarOpen(doc.body)) {
      setSidebarOpen(false, els)
    }
  })

  sidebar.addEventListener('click', (e) => {
    const target = e.target
    if (target && typeof target.closest === 'function' && target.closest('a')) {
      setSidebarOpen(false, els)
    }
  })
}
