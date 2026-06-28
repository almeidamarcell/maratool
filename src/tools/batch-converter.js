// Reusable batch file conversion UI for converter tools.
// Supports multi-file upload, per-file progress, individual download, and ZIP export.

export function createBatchConverter(options) {
  options = options || {}
  var mount = options.mount
  var prefix = options.prefix || 'batch'
  var files = []
  var results = []

  if (mount) {
    mount.innerHTML =
      '<div class="' + prefix + '-zone" id="' + prefix + '-zone">' +
      '<p>Drop multiple files or <button type="button" class="copy-btn" id="' + prefix + '-pick">select files</button></p>' +
      '<input type="file" id="' + prefix + '-input" hidden ' + (options.multiple ? 'multiple' : '') +
      (options.accept ? ' accept="' + options.accept + '"' : '') + ' /></div>' +
      '<div id="' + prefix + '-list" class="' + prefix + '-list"></div>' +
      '<div class="' + prefix + '-actions" id="' + prefix + '-actions" style="display:none;">' +
      '<button class="copy-btn" id="' + prefix + '-zip">Download all as ZIP</button></div>'

    var zone = document.getElementById(prefix + '-zone')
    var input = document.getElementById(prefix + '-input')
    document.getElementById(prefix + '-pick').addEventListener('click', function () { input.click() })
    zone.addEventListener('dragover', function (e) { e.preventDefault() })
    zone.addEventListener('drop', function (e) {
      e.preventDefault()
      addFiles(Array.from(e.dataTransfer.files))
    })
    input.addEventListener('change', function () {
      addFiles(Array.from(input.files))
      input.value = ''
    })
    document.getElementById(prefix + '-zip').addEventListener('click', downloadZip)
  }

  function renderList() {
    var list = document.getElementById(prefix + '-list')
    if (!list) return
    list.innerHTML = files.map(function (f, i) {
      return '<div class="' + prefix + '-item" id="' + prefix + '-item-' + i + '">' +
        '<span class="' + prefix + '-name">' + escapeHtml(f.name) + '</span>' +
        '<div class="' + prefix + '-bar"><div class="' + prefix + '-fill" id="' + prefix + '-fill-' + i + '"></div></div>' +
        '<span class="' + prefix + '-status" id="' + prefix + '-status-' + i + '">Queued</span>' +
        '<button class="copy-btn ' + prefix + '-dl" id="' + prefix + '-dl-' + i + '" style="display:none;">Download</button></div>'
    }).join('')

    var style = document.getElementById(prefix + '-style')
    if (!style) {
      style = document.createElement('style')
      style.id = prefix + '-style'
      style.textContent =
        '.' + prefix + '-list { display: flex; flex-direction: column; gap: 0.5rem; margin: 1rem 0; }' +
        '.' + prefix + '-item { display: grid; grid-template-columns: 1fr 120px 80px auto; gap: 0.5rem; align-items: center; font-size: 0.8125rem; }' +
        '.' + prefix + '-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }' +
        '.' + prefix + '-bar { height: 6px; background: var(--bg-hover); border-radius: 3px; overflow: hidden; }' +
        '.' + prefix + '-fill { height: 100%; background: var(--accent); width: 0%; transition: width 0.2s; }' +
        '.' + prefix + '-zone { border: 1px dashed var(--border); border-radius: var(--radius); padding: 1rem; text-align: center; font-size: 0.875rem; color: var(--text-2); }'
      document.head.appendChild(style)
    }
    document.getElementById(prefix + '-actions').style.display = files.length ? '' : 'none'
  }

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }

  function addFiles(newFiles) {
    newFiles.forEach(function (f) { files.push(f) })
    renderList()
  }

  function setProgress(i, pct, status) {
    var fill = document.getElementById(prefix + '-fill-' + i)
    var stat = document.getElementById(prefix + '-status-' + i)
    if (fill) fill.style.width = pct + '%'
    if (stat) stat.textContent = status
  }

  async function run(fileList, processor) {
    var list = fileList || files
    results = []
    for (var i = 0; i < list.length; i++) {
      setProgress(i, 0, 'Processing...')
      try {
        var result = await processor(list[i], function (pct) {
          setProgress(i, pct, pct >= 100 ? 'Done' : 'Processing...')
        })
        results[i] = result
        setProgress(i, 100, 'Done')
        var dl = document.getElementById(prefix + '-dl-' + i)
        if (dl && result.blob) {
          dl.style.display = ''
          dl.addEventListener('click', function () {
            downloadBlob(result.blob, result.filename)
          })
        }
      } catch (e) {
        setProgress(i, 0, 'Error')
        var stat = document.getElementById(prefix + '-status-' + i)
        if (stat) stat.textContent = e.message || 'Failed'
      }
    }
  }

  function downloadBlob(blob, name) {
    var url = URL.createObjectURL(blob)
    var a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    setTimeout(function () { URL.revokeObjectURL(url) }, 1000)
  }

  async function downloadZip() {
    var done = results.filter(function (r) { return r && r.blob })
    if (!done.length) return
    if (done.length === 1) {
      downloadBlob(done[0].blob, done[0].filename)
      return
    }
    var zip = await buildSimpleZip(done)
    downloadBlob(zip, 'converted-files.zip')
  }

  return {
    addFiles: addFiles,
    getFiles: function () { return files.slice() },
    run: run,
    clear: function () { files = []; results = []; renderList() },
  }
}

async function buildSimpleZip(entries) {
  var parts = []
  var central = []
  var offset = 0

  for (var i = 0; i < entries.length; i++) {
    var name = entries[i].filename
    var data = new Uint8Array(await entries[i].blob.arrayBuffer())
    var nameBytes = new TextEncoder().encode(name)
    var header = new Uint8Array(30 + nameBytes.length)
    var view = new DataView(header.buffer)
    view.setUint32(0, 0x04034b50, true)
    view.setUint16(8, 0, true)
    view.setUint16(26, nameBytes.length, true)
    header.set(nameBytes, 30)
    parts.push(header, data)

    var cd = new Uint8Array(46 + nameBytes.length)
    var cv = new DataView(cd.buffer)
    cv.setUint32(0, 0x02014b50, true)
    cv.setUint32(16, 0x04034b50, true)
    cv.setUint16(28, nameBytes.length, true)
    cv.setUint32(42, offset, true)
    cd.set(nameBytes, 46)
    central.push(cd)
    offset += header.length + data.length
  }

  var centralSize = central.reduce(function (s, c) { return s + c.length }, 0)
  var end = new Uint8Array(22)
  var ev = new DataView(end.buffer)
  ev.setUint32(0, 0x06054b50, true)
  ev.setUint16(8, entries.length, true)
  ev.setUint16(10, entries.length, true)
  ev.setUint32(12, centralSize, true)
  ev.setUint32(16, offset, true)

  return new Blob(parts.concat(central, [end]), { type: 'application/zip' })
}
