// Shared UI helpers for maratool tools. Keep dependency-free — tools are
// plain vanilla JS bundled per page; anything imported here ships everywhere
// it's used.

// Show or hide a state container.
//
// Global CSS carries `[hidden] { display: none !important }`, so clearing the
// inline display is not enough to reveal an element that shipped with the
// attribute — the panel stays invisible and the tool looks dead after upload.
// Both halves are required: the attribute for the global rule, the inline
// display for panels whose own CSS sets `display: flex`.
export function setVisible(el, visible) {
  if (!el) return
  el.hidden = !visible
  el.style.display = visible ? '' : 'none'
}

// Resolves after the browser has had a chance to paint. Canvas/encode work
// runs synchronously on the main thread, so a `showState('progress')` right
// before it never reaches the screen without yielding first.
export function nextPaint() {
  return new Promise(function (resolve) {
    requestAnimationFrame(function () { requestAnimationFrame(function () { resolve() }) })
  })
}

// Drives the shared `.tool-progress-bar` markup:
//   <p id="…-progress-text"></p>
//   <div class="tool-progress-bar"><div id="…-progress-fill" class="tool-progress-fill"></div></div>
// `fillEl` is optional — panels that only have a text line still work.
export function makeProgress(textEl, fillEl) {
  var bar = fillEl && fillEl.parentElement

  function label(text) {
    if (textEl && text != null) textEl.textContent = text
  }

  return {
    // ratio 0..1. Use for work with a known total (file N of M, page N of M).
    set: function (text, ratio) {
      label(text)
      if (bar) bar.classList.remove('indeterminate')
      if (fillEl) fillEl.style.width = Math.max(0, Math.min(1, ratio || 0)) * 100 + '%'
    },
    // For work with no measurable total (FFmpeg boot, a single decode).
    pending: function (text) {
      label(text)
      if (bar) bar.classList.add('indeterminate')
      if (fillEl) fillEl.style.width = ''
    },
    done: function (text) {
      label(text)
      if (bar) bar.classList.remove('indeterminate')
      if (fillEl) fillEl.style.width = '100%'
    },
    reset: function () {
      if (bar) bar.classList.remove('indeterminate')
      if (fillEl) fillEl.style.width = '0%'
    },
  }
}

// Reads a File as a data URL, reporting 0..1 progress while the bytes are
// pulled off disk. Large files (a 20 MB image, a 40 MB GIF) spend real time
// here before any conversion starts, so this is the part users see first.
export function readFileAsDataURL(file, onProgress) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader()
    reader.onprogress = function (e) {
      if (onProgress && e.lengthComputable && e.total) onProgress(e.loaded / e.total)
    }
    reader.onload = function () {
      if (onProgress) onProgress(1)
      resolve(reader.result)
    }
    reader.onerror = function () { reject(new Error('Could not read ' + file.name + '.')) }
    reader.readAsDataURL(file)
  })
}

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
