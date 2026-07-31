// Shared UI helpers for maratool tools. Keep dependency-free — tools are
// plain vanilla JS bundled per page; anything imported here ships everywhere
// it's used.

export function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export function downloadBlob(blob, filename) {
  var url = URL.createObjectURL(blob)
  var a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(function () { URL.revokeObjectURL(url) }, 1000)
}

function legacyCopy(text) {
  var ta = document.createElement('textarea')
  ta.value = text
  ta.setAttribute('readonly', '')
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  var ok = false
  try { ok = document.execCommand('copy') } catch (e) { /* ignore */ }
  document.body.removeChild(ta)
  return ok
}

// Copies text and resolves true/false — never rejects, never throws.
// Reading navigator.clipboard.writeText throws synchronously when the API is
// absent (insecure context, sandboxed iframe), so a bare
// `navigator.clipboard.writeText(x).catch(...)` misses that case entirely;
// the guard below is the point of this helper. The execCommand path is the
// fallback for those contexts — it cannot rescue a *denied* async write,
// because by then the user activation has expired.
export function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).then(
      function () { return true },
      function () { return false }
    )
  }
  return Promise.resolve(legacyCopy(text))
}

// Copies text with the site-wide button feedback convention: label flips to
// "Copied!" + .copied class for 2s, then reverts. Shows "Copy failed" when the
// copy did not happen, so the click is never silent.
export function copyWithFeedback(btn, text, labels) {
  var idle = (labels && labels.idle) != null ? labels.idle : (btn.dataset.copyLabel || btn.textContent)
  var done = (labels && labels.done) || 'Copied!'
  btn.dataset.copyLabel = idle

  function feedback(label, ok) {
    btn.textContent = label
    btn.classList.toggle('copied', ok)
    clearTimeout(btn._copyTimer)
    btn._copyTimer = setTimeout(function () {
      btn.textContent = idle
      btn.classList.remove('copied')
    }, 2000)
  }

  copyText(text).then(function (ok) { feedback(ok ? done : 'Copy failed', ok) })
}

// Wires a copy button: getText() is called at click time so the value is
// always current. Returns the handler for callers that need to detach it.
export function attachCopyButton(btn, getText, labels) {
  function onClick() {
    var text = typeof getText === 'function' ? getText() : String(getText)
    copyWithFeedback(btn, text, labels)
  }
  btn.addEventListener('click', onClick)
  return onClick
}
