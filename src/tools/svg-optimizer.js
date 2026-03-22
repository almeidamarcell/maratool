(function () {
  var input = document.getElementById('so-input')
  var output = document.getElementById('so-output')
  var outputSection = document.getElementById('so-output-section')
  var statsEl = document.getElementById('so-stats')
  var errorEl = document.getElementById('so-error')
  var originalSizeEl = document.getElementById('so-original-size')
  var optimizedSizeEl = document.getElementById('so-optimized-size')
  var savingsEl = document.getElementById('so-savings')
  var copyBtn = document.getElementById('so-copy')
  var previewEl = document.getElementById('so-preview')
  var previewOriginal = document.getElementById('so-preview-original')
  var previewOptimized = document.getElementById('so-preview-optimized')

  var debounceTimer = null

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B'
    return (bytes / 1024).toFixed(1) + ' KB'
  }

  function stripScripts(html) {
    return html.replace(/<script[\s\S]*?<\/script>/gi, '')
  }

  function removeComments(node) {
    var children = node.childNodes
    for (var i = children.length - 1; i >= 0; i--) {
      if (children[i].nodeType === 8) {
        node.removeChild(children[i])
      } else if (children[i].nodeType === 1) {
        removeComments(children[i])
      }
    }
  }

  function removeElements(node) {
    var tags = ['metadata', 'title', 'desc']
    for (var t = 0; t < tags.length; t++) {
      var els = node.getElementsByTagName(tags[t])
      for (var i = els.length - 1; i >= 0; i--) {
        els[i].parentNode.removeChild(els[i])
      }
    }
    // Remove empty <defs>
    var defs = node.getElementsByTagName('defs')
    for (var d = defs.length - 1; d >= 0; d--) {
      if (defs[d].children.length === 0) {
        defs[d].parentNode.removeChild(defs[d])
      }
    }
  }

  var editorPrefixes = ['inkscape:', 'sodipodi:', 'sketch:', 'xmlns:inkscape', 'xmlns:sodipodi', 'xmlns:sketch']
  var editorNs = ['http://www.inkscape.org/namespaces/inkscape', 'http://sodipodi.sourceforge.net/DTD/sodipodi-0.0.dtd']

  function stripEditorAttrs(node) {
    if (node.nodeType !== 1) return
    var attrs = node.attributes
    var toRemove = []
    for (var i = 0; i < attrs.length; i++) {
      var name = attrs[i].name
      for (var p = 0; p < editorPrefixes.length; p++) {
        if (name.indexOf(editorPrefixes[p]) === 0) {
          toRemove.push(name)
          break
        }
      }
      if (name === 'data-name') toRemove.push(name)
      if (attrs[i].value === '') toRemove.push(name)
    }
    for (var r = 0; r < toRemove.length; r++) {
      node.removeAttribute(toRemove[r])
    }
    var children = node.children
    for (var c = 0; c < children.length; c++) {
      stripEditorAttrs(children[c])
    }
  }

  var defaultAttrs = {
    'fill-opacity': '1',
    'stroke-opacity': '1',
    'opacity': '1',
    'fill-rule': 'nonzero'
  }

  function removeDefaultAttrs(node) {
    if (node.nodeType !== 1) return
    var keys = Object.keys(defaultAttrs)
    for (var k = 0; k < keys.length; k++) {
      if (node.getAttribute(keys[k]) === defaultAttrs[keys[k]]) {
        node.removeAttribute(keys[k])
      }
    }
    var children = node.children
    for (var c = 0; c < children.length; c++) {
      removeDefaultAttrs(children[c])
    }
  }

  function collapseWhitespace(node) {
    var children = node.childNodes
    for (var i = children.length - 1; i >= 0; i--) {
      if (children[i].nodeType === 3) {
        children[i].textContent = children[i].textContent.replace(/\s+/g, ' ')
        if (children[i].textContent.trim() === '' && node.children.length > 0) {
          node.removeChild(children[i])
        }
      } else if (children[i].nodeType === 1) {
        collapseWhitespace(children[i])
      }
    }
  }

  function minifyPaths(node) {
    var paths = node.querySelectorAll('[d]')
    for (var i = 0; i < paths.length; i++) {
      var d = paths[i].getAttribute('d')
      if (!d) continue
      d = d.replace(/\s+/g, ' ')
      d = d.replace(/,\s+/g, ',')
      d = d.replace(/\s+,/g, ',')
      d = d.trim()
      paths[i].setAttribute('d', d)
    }
  }

  function optimize(svgString) {
    var parser = new DOMParser()
    var doc = parser.parseFromString(svgString, 'image/svg+xml')
    var errorNode = doc.querySelector('parsererror')
    if (errorNode) return { error: true }

    var svg = doc.documentElement
    removeComments(svg)
    removeElements(svg)
    stripEditorAttrs(svg)
    removeDefaultAttrs(svg)
    collapseWhitespace(svg)
    minifyPaths(svg)

    var serializer = new XMLSerializer()
    var result = serializer.serializeToString(svg)
    return { error: false, result: result }
  }

  function hideAll() {
    statsEl.style.display = 'none'
    outputSection.style.display = 'none'
    previewEl.style.display = 'none'
    errorEl.style.display = 'none'
  }

  function showError() {
    hideAll()
    errorEl.style.display = 'block'
  }

  function showResult(original, optimized) {
    hideAll()
    var origBytes = new Blob([original]).size
    var optBytes = new Blob([optimized]).size
    var savings = origBytes > 0 ? Math.round((1 - optBytes / origBytes) * 100) : 0

    originalSizeEl.textContent = formatSize(origBytes)
    optimizedSizeEl.textContent = formatSize(optBytes)
    savingsEl.textContent = savings + '%'

    output.textContent = optimized
    statsEl.style.display = 'flex'
    outputSection.style.display = 'block'

    previewOriginal.innerHTML = stripScripts(original)
    previewOptimized.innerHTML = stripScripts(optimized)
    previewEl.style.display = 'grid'
  }

  function run() {
    var val = input.value.trim()
    if (!val) { hideAll(); return }
    var result = optimize(val)
    if (result.error) { showError(); return }
    showResult(val, result.result)
  }

  input.addEventListener('input', function () {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(run, 300)
  })

  var fileInput = document.getElementById('so-file-input')
  fileInput.addEventListener('change', function () {
    var file = fileInput.files[0]
    if (!file) return
    var reader = new FileReader()
    reader.onload = function () {
      input.value = reader.result
      run()
    }
    reader.readAsText(file)
    fileInput.value = ''
  })

  copyBtn.addEventListener('click', function () {
    navigator.clipboard.writeText(output.textContent).then(function () {
      var orig = copyBtn.textContent
      copyBtn.textContent = 'Copied!'
      setTimeout(function () { copyBtn.textContent = orig }, 2000)
    })
  })
})()
