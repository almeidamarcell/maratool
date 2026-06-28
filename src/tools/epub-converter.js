import {
  loadJSZip,
  readFileAsArrayBuffer,
  setupEpubDropzone,
  formatBytes,
  parseEpub,
  rewriteChapterHtml,
  htmlToPlainText,
  buildFullHtml,
  downloadBlob,
  sanitizeFilename,
} from './epub-common.js'

// EPUB Converter — convert EPUB to PDF, HTML, or TXT in the browser
;(function () {
  'use strict'

  var dropzone = document.getElementById('epc-dropzone')
  var fileInput = document.getElementById('epc-file')
  var progressEl = document.getElementById('epc-progress')
  var fileInfo = document.getElementById('epc-file-info')
  var workspace = document.getElementById('epc-workspace')
  var bookTitle = document.getElementById('epc-book-title')
  var bookMeta = document.getElementById('epc-book-meta')
  var chapterList = document.getElementById('epc-chapter-list')
  var preview = document.getElementById('epc-preview')
  var formatSelect = document.getElementById('epc-format')
  var convertBtn = document.getElementById('epc-convert')
  var newBtn = document.getElementById('epc-new')

  var book = null
  var renderedChapters = []
  var blobCache = {}
  var activeChapter = 0

  function showState(state) {
    dropzone.style.display = state === 'dropzone' ? '' : 'none'
    progressEl.style.display = state === 'progress' ? '' : 'none'
    workspace.style.display = state === 'workspace' ? '' : 'none'
  }

  setupEpubDropzone(dropzone, fileInput, processFile)

  async function processFile(file) {
    showState('progress')
    progressEl.textContent = 'Loading EPUB...'
    fileInfo.textContent = file.name + ' (' + formatBytes(file.size) + ')'
    renderedChapters = []
    blobCache = {}
    activeChapter = 0

    try {
      await loadJSZip()
      var data = await readFileAsArrayBuffer(file)
      progressEl.textContent = 'Parsing chapters...'
      book = await parseEpub(data)
      book.sourceName = file.name.replace(/\.epub$/i, '')

      bookTitle.textContent = book.title
      var metaParts = [book.chapters.length + ' chapters']
      if (book.author) metaParts.push(book.author)
      bookMeta.textContent = metaParts.join(' · ')

      progressEl.textContent = 'Preparing preview...'
      for (var i = 0; i < book.chapters.length; i++) {
        var ch = book.chapters[i]
        var rewritten = await rewriteChapterHtml(ch.content, ch.fullPath, book.zip, blobCache)
        renderedChapters.push(rewritten)
      }

      renderChapterList()
      showChapter(0)
      showState('workspace')
    } catch (e) {
      progressEl.textContent = 'Error: ' + e.message
      progressEl.style.color = 'var(--error, #c4553a)'
    }
  }

  function renderChapterList() {
    chapterList.innerHTML = ''
    for (var i = 0; i < book.chapters.length; i++) {
      var btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'epc-chapter-btn' + (i === activeChapter ? ' active' : '')
      btn.textContent = book.chapters[i].title
      btn.setAttribute('data-index', String(i))
      btn.addEventListener('click', function () {
        showChapter(parseInt(this.getAttribute('data-index'), 10))
      })
      chapterList.appendChild(btn)
    }
  }

  function showChapter(index) {
    activeChapter = index
    var buttons = chapterList.querySelectorAll('.epc-chapter-btn')
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].classList.toggle('active', i === index)
    }

    var chapter = renderedChapters[index]
    if (!chapter) return

    preview.innerHTML = '<article class="epc-chapter-content">' + chapter.bodyHtml + '</article>'
    if (chapter.inlineCss) {
      var style = document.createElement('style')
      style.textContent = chapter.inlineCss
      preview.insertBefore(style, preview.firstChild)
    }
  }

  convertBtn.addEventListener('click', async function () {
    if (!book) return
    var format = formatSelect.value
    convertBtn.disabled = true
    var originalText = convertBtn.textContent
    convertBtn.textContent = 'Converting...'

    try {
      if (format === 'html') {
        await exportHtml()
      } else if (format === 'txt') {
        exportTxt()
      } else if (format === 'pdf') {
        await exportPdf()
      }
    } catch (e) {
      alert('Conversion failed: ' + e.message)
    } finally {
      convertBtn.disabled = false
      convertBtn.textContent = originalText
    }
  })

  async function exportHtml() {
    var bodies = renderedChapters.map(function (ch) { return ch.bodyHtml })
    var html = buildFullHtml(book, bodies)
    var blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    downloadBlob(blob, sanitizeFilename(book.sourceName || book.title) + '.html')
  }

  function exportTxt() {
    var parts = [book.title]
    if (book.author) parts.push('by ' + book.author)
    parts.push('')

    for (var i = 0; i < book.chapters.length; i++) {
      parts.push(book.chapters[i].title)
      parts.push('─'.repeat(Math.min(book.chapters[i].title.length, 40)))
      parts.push(htmlToPlainText(renderedChapters[i].bodyHtml))
      parts.push('')
    }

    var blob = new Blob([parts.join('\n')], { type: 'text/plain;charset=utf-8' })
    downloadBlob(blob, sanitizeFilename(book.sourceName || book.title) + '.txt')
  }

  async function exportPdf() {
    if (typeof window.html2pdf === 'undefined') {
      await loadHtml2Pdf()
    }

    var container = document.createElement('div')
    container.className = 'epc-pdf-source'
    container.innerHTML = buildFullHtml(book, renderedChapters.map(function (ch) { return ch.bodyHtml }))
    document.body.appendChild(container)

    var filename = sanitizeFilename(book.sourceName || book.title) + '.pdf'
    await window.html2pdf().set({
      margin: [12, 12, 12, 12],
      filename: filename,
      image: { type: 'jpeg', quality: 0.92 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] },
    }).from(container).save()

    document.body.removeChild(container)
  }

  function loadHtml2Pdf() {
    return new Promise(function (resolve, reject) {
      if (typeof window.html2pdf !== 'undefined') {
        resolve()
        return
      }
      var script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.2/dist/html2pdf.bundle.min.js'
      script.onload = resolve
      script.onerror = function () { reject(new Error('Failed to load PDF library')) }
      document.head.appendChild(script)
    })
  }

  newBtn.addEventListener('click', function () {
    book = null
    renderedChapters = []
    blobCache = {}
    fileInput.value = ''
    fileInfo.textContent = ''
    progressEl.textContent = ''
    progressEl.style.color = ''
    chapterList.innerHTML = ''
    preview.innerHTML = ''
    showState('dropzone')
  })
})()
