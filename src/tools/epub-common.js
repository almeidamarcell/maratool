// Shared EPUB utilities — JSZip loader, dropzone, and EPUB parsing

var jsZipPromise = null

export function loadJSZip() {
  if (jsZipPromise) return jsZipPromise
  jsZipPromise = new Promise(function (resolve, reject) {
    if (typeof window.JSZip !== 'undefined') {
      resolve(window.JSZip)
      return
    }
    var script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js'
    script.onload = function () { resolve(window.JSZip) }
    script.onerror = function () { reject(new Error('Failed to load JSZip')) }
    document.head.appendChild(script)
  })
  return jsZipPromise
}

export function readFileAsArrayBuffer(file) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader()
    reader.onload = function () { resolve(reader.result) }
    reader.onerror = function () { reject(new Error('Failed to read file')) }
    reader.readAsArrayBuffer(file)
  })
}

export function setupEpubDropzone(dropzoneEl, fileInputEl, onFile) {
  dropzoneEl.addEventListener('click', function () { fileInputEl.click() })

  fileInputEl.addEventListener('change', function (e) {
    var file = e.target.files[0]
    if (file) onFile(file)
  })

  dropzoneEl.addEventListener('dragover', function (e) {
    e.preventDefault()
    dropzoneEl.classList.add('dropzone-active')
  })

  dropzoneEl.addEventListener('dragleave', function () {
    dropzoneEl.classList.remove('dropzone-active')
  })

  dropzoneEl.addEventListener('drop', function (e) {
    e.preventDefault()
    dropzoneEl.classList.remove('dropzone-active')
    var file = e.dataTransfer.files[0]
    if (!file) return
    var name = file.name.toLowerCase()
    if (name.endsWith('.epub') || file.type === 'application/epub+zip') onFile(file)
  })
}

export function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function parseContainerPath(xml) {
  var match = xml.match(/full-path=["']([^"']+)["']/i)
  if (!match) throw new Error('Invalid EPUB: cannot find OPF path in container.xml')
  return match[1]
}

function parseOpf(xml) {
  var doc = new DOMParser().parseFromString(xml, 'application/xml')
  var manifest = {}
  var manifestItems = doc.querySelectorAll('manifest item')
  for (var i = 0; i < manifestItems.length; i++) {
    var el = manifestItems[i]
    var id = el.getAttribute('id')
    if (!id) continue
    manifest[id] = {
      href: el.getAttribute('href') || '',
      mediaType: el.getAttribute('media-type') || el.getAttribute('mediaType') || '',
      properties: el.getAttribute('properties') || '',
    }
  }

  var spine = []
  var spineItems = doc.querySelectorAll('spine itemref')
  for (var j = 0; j < spineItems.length; j++) {
    var ref = spineItems[j].getAttribute('idref')
    if (ref) spine.push(ref)
  }

  var titleEl = doc.querySelector('metadata dc\\:title, metadata title')
  var authorEl = doc.querySelector('metadata dc\\:creator, metadata creator')
  var metadata = {
    title: titleEl ? titleEl.textContent.trim() : '',
    author: authorEl ? authorEl.textContent.trim() : '',
  }

  return { manifest: manifest, spine: spine, metadata: metadata }
}

function resolvePath(baseDir, href) {
  if (!href) return href
  if (/^(https?:|data:|blob:)/i.test(href)) return href
  var parts = (baseDir + href).split('/')
  var resolved = []
  for (var i = 0; i < parts.length; i++) {
    if (parts[i] === '..') resolved.pop()
    else if (parts[i] !== '.' && parts[i] !== '') resolved.push(parts[i])
  }
  return resolved.join('/')
}

function dirname(path) {
  var idx = path.lastIndexOf('/')
  return idx >= 0 ? path.slice(0, idx + 1) : ''
}

async function parseNavTitles(zip, manifest, opfDir) {
  var titles = {}
  var navItem = null
  var ncxItem = null

  for (var id in manifest) {
    if (!Object.prototype.hasOwnProperty.call(manifest, id)) continue
    var item = manifest[id]
    if (item.properties && item.properties.indexOf('nav') !== -1) navItem = item
    if (item.mediaType === 'application/x-dtbncx+xml') ncxItem = item
  }

  if (navItem) {
    var navPath = resolvePath(opfDir, navItem.href)
    var navXml = await zip.file(navPath)?.async('text')
    if (navXml) {
      var navDoc = new DOMParser().parseFromString(navXml, 'application/xhtml+xml')
      var links = navDoc.querySelectorAll('nav[epub\\:type="toc"] a, nav[role="doc-toc"] a, nav.toc a, nav a[href]')
      for (var i = 0; i < links.length; i++) {
        var link = links[i]
        var href = link.getAttribute('href')
        if (!href) continue
        var cleanHref = href.split('#')[0]
        titles[cleanHref] = link.textContent.trim()
        titles[resolvePath(dirname(navPath), cleanHref)] = link.textContent.trim()
      }
    }
  }

  if (ncxItem && Object.keys(titles).length === 0) {
    var ncxPath = resolvePath(opfDir, ncxItem.href)
    var ncxXml = await zip.file(ncxPath)?.async('text')
    if (ncxXml) {
      var ncxDoc = new DOMParser().parseFromString(ncxXml, 'application/xml')
      var points = ncxDoc.querySelectorAll('navPoint')
      for (var j = 0; j < points.length; j++) {
        var point = points[j]
        var content = point.querySelector('content')
        var label = point.querySelector('navLabel text, text')
        if (!content) continue
        var src = content.getAttribute('src')
        if (!src) continue
        var cleanSrc = src.split('#')[0]
        titles[cleanSrc] = label ? label.textContent.trim() : ''
        titles[resolvePath(dirname(ncxPath), cleanSrc)] = label ? label.textContent.trim() : ''
      }
    }
  }

  return titles
}

function extractTitle(html) {
  var doc = new DOMParser().parseFromString(html, 'application/xhtml+xml')
  var h = doc.querySelector('h1, h2, title')
  return h ? h.textContent.trim() : ''
}

function isChapterMediaType(mediaType) {
  return mediaType === 'application/xhtml+xml' ||
    mediaType === 'text/html' ||
    mediaType === 'application/xhtml+xml; charset=utf-8'
}

export async function parseEpub(arrayBuffer) {
  var JSZip = await loadJSZip()
  var zip = await JSZip.loadAsync(arrayBuffer)

  var containerFile = zip.file('META-INF/container.xml')
  if (!containerFile) throw new Error('Invalid EPUB: missing META-INF/container.xml')
  var containerXml = await containerFile.async('text')
  var opfPath = parseContainerPath(containerXml)
  var opfDir = dirname(opfPath)

  var opfFile = zip.file(opfPath)
  if (!opfFile) throw new Error('Invalid EPUB: missing OPF file')
  var opfXml = await opfFile.async('text')
  var parsed = parseOpf(opfXml)
  var navTitles = await parseNavTitles(zip, parsed.manifest, opfDir)

  var chapters = []
  for (var i = 0; i < parsed.spine.length; i++) {
    var idref = parsed.spine[i]
    var item = parsed.manifest[idref]
    if (!item || !isChapterMediaType(item.mediaType)) continue

    var fullPath = resolvePath(opfDir, item.href)
    var file = zip.file(fullPath)
    if (!file) continue
    var content = await file.async('text')
    var title = navTitles[item.href] || navTitles[fullPath] || extractTitle(content) || ('Chapter ' + (chapters.length + 1))

    chapters.push({
      id: idref,
      title: title,
      href: item.href,
      fullPath: fullPath,
      content: content,
    })
  }

  if (chapters.length === 0) throw new Error('No readable chapters found in this EPUB')

  return {
    title: parsed.metadata.title || 'Untitled',
    author: parsed.metadata.author || '',
    chapters: chapters,
    zip: zip,
    opfDir: opfDir,
    manifest: parsed.manifest,
  }
}

export async function rewriteChapterHtml(html, chapterPath, zip, blobCache) {
  var baseDir = dirname(chapterPath)
  var doc = new DOMParser().parseFromString(html, 'application/xhtml+xml')
  var body = doc.querySelector('body')
  if (!body) return { bodyHtml: html, inlineCss: '' }

  var nodes = doc.querySelectorAll('[src], link[href]')
  var pending = []
  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i]
    var attr = node.hasAttribute('src') ? 'src' : 'href'
    var raw = node.getAttribute(attr)
    if (!raw || /^(https?:|data:|blob:|#)/i.test(raw)) continue
    var assetPath = resolvePath(baseDir, raw.split('#')[0])
    if (!blobCache[assetPath]) {
      var assetFile = zip.file(assetPath)
      if (!assetFile) continue
      ;(function (path) {
        var mime = guessMime(path)
        blobCache[path] = assetFile.async('blob').then(function (blob) {
          return URL.createObjectURL(new Blob([blob], { type: mime }))
        })
      })(assetPath)
    }
    pending.push(blobCache[assetPath])
  }

  await Promise.all(pending)

  var urlMap = {}
  var paths = Object.keys(blobCache)
  for (var p = 0; p < paths.length; p++) {
    urlMap[paths[p]] = await blobCache[paths[p]]
  }

  var allNodes = doc.querySelectorAll('[src], link[href]')
  for (var k = 0; k < allNodes.length; k++) {
    var el = allNodes[k]
    var name = el.hasAttribute('src') ? 'src' : 'href'
    var val = el.getAttribute(name)
    if (!val || /^(https?:|data:|blob:|#)/i.test(val)) continue
    var parts = val.split('#')
    var asset = resolvePath(baseDir, parts[0])
    if (urlMap[asset]) el.setAttribute(name, urlMap[asset] + (parts[1] ? '#' + parts[1] : ''))
  }

  var styleEls = doc.querySelectorAll('style')
  var inlineCss = ''
  for (var s = 0; s < styleEls.length; s++) inlineCss += styleEls[s].textContent + '\n'

  return {
    bodyHtml: body.innerHTML,
    inlineCss: inlineCss,
  }
}

function guessMime(path) {
  var lower = path.toLowerCase()
  if (lower.endsWith('.css')) return 'text/css'
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  if (lower.endsWith('.gif')) return 'image/gif'
  if (lower.endsWith('.svg')) return 'image/svg+xml'
  if (lower.endsWith('.webp')) return 'image/webp'
  return 'application/octet-stream'
}

export function htmlToPlainText(html) {
  var doc = new DOMParser().parseFromString(html, 'text/html')
  var text = doc.body ? doc.body.textContent : ''
  return text.replace(/\n{3,}/g, '\n\n').trim()
}

export function buildFullHtml(book, chaptersHtml) {
  var css = 'body{font-family:Georgia,serif;line-height:1.6;max-width:720px;margin:2rem auto;padding:0 1rem;color:#1a1a18;}'
  css += 'h1{font-size:1.75rem;margin:2rem 0 1rem;}h2{font-size:1.35rem;}img{max-width:100%;height:auto;}'

  var parts = [
    '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">',
    '<title>', escapeHtml(book.title), '</title>',
    '<style>', css, '</style></head><body>',
    '<h1>', escapeHtml(book.title), '</h1>',
  ]
  if (book.author) parts.push('<p><em>', escapeHtml(book.author), '</em></p>')

  for (var i = 0; i < chaptersHtml.length; i++) {
    parts.push('<section class="chapter"><h2>', escapeHtml(book.chapters[i].title), '</h2>', chaptersHtml[i], '</section>')
  }
  parts.push('</body></html>')
  return parts.join('')
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function downloadBlob(blob, filename) {
  var url = URL.createObjectURL(blob)
  var a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(function () { URL.revokeObjectURL(url) }, 1000)
}

export function sanitizeFilename(name) {
  return (name || 'ebook').replace(/[<>:"/\\|?*]+/g, '_').replace(/\s+/g, '_').slice(0, 80) || 'ebook'
}
