(function () {
  var uploadEl = document.getElementById('fg-upload')
  var fileInput = document.getElementById('fg-file')
  var browseBtn = document.getElementById('fg-browse')
  var sourceEl = document.getElementById('fg-source')
  var sourceImg = document.getElementById('fg-source-img')
  var sourceInfo = document.getElementById('fg-source-info')
  var changeBtn = document.getElementById('fg-change')
  var sizesEl = document.getElementById('fg-sizes')
  var sizesGrid = document.getElementById('fg-sizes-grid')
  var downloadsEl = document.getElementById('fg-downloads')
  var downloadIco = document.getElementById('fg-download-ico')
  var downloadZip = document.getElementById('fg-download-zip')

  var sizes = [16, 32, 48, 180, 192, 512]
  var generated = {} // { size: { canvas, blob } }

  // ── CRC32 ──

  var crcTable = null
  function makeCrcTable() {
    crcTable = []
    for (var i = 0; i < 256; i++) {
      var c = i
      for (var j = 0; j < 8; j++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
      }
      crcTable[i] = c
    }
  }

  function crc32(data) {
    if (!crcTable) makeCrcTable()
    var crc = 0xFFFFFFFF
    for (var k = 0; k < data.length; k++) {
      crc = crcTable[(crc ^ data[k]) & 0xFF] ^ (crc >>> 8)
    }
    return (crc ^ 0xFFFFFFFF) >>> 0
  }

  // ── File handling ──

  function handleFile(file) {
    if (!file) return
    if (!file.type.match(/^image\/(png|jpeg|svg\+xml)$/)) return

    var reader = new FileReader()
    reader.onload = function () {
      var img = new Image()
      img.onload = function () {
        showSource(img, file)
        generateAll(img)
      }
      if (file.type === 'image/svg+xml') {
        var blob = new Blob([reader.result], { type: 'image/svg+xml' })
        img.src = URL.createObjectURL(blob)
      } else {
        img.src = reader.result
      }
    }
    if (file.type === 'image/svg+xml') {
      reader.readAsText(file)
    } else {
      reader.readAsDataURL(file)
    }
  }

  function showSource(img, file) {
    sourceImg.src = img.src
    sourceInfo.textContent = img.naturalWidth + ' × ' + img.naturalHeight + ' — ' + file.name
    uploadEl.style.display = 'none'
    sourceEl.style.display = 'flex'
  }

  function reset() {
    uploadEl.style.display = 'block'
    sourceEl.style.display = 'none'
    sizesEl.style.display = 'none'
    downloadsEl.style.display = 'none'
    sizesGrid.innerHTML = ''
    generated = {}
    fileInput.value = ''
  }

  // ── Generation ──

  function generateAll(img) {
    sizesGrid.innerHTML = ''
    generated = {}
    var pending = sizes.length

    for (var i = 0; i < sizes.length; i++) {
      (function (size) {
        var canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        var ctx = canvas.getContext('2d')
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, size, size)

        // Preview canvas (max display 64px)
        var displaySize = Math.min(size, 64)
        var previewCanvas = document.createElement('canvas')
        previewCanvas.width = displaySize
        previewCanvas.height = displaySize
        previewCanvas.style.width = displaySize + 'px'
        previewCanvas.style.height = displaySize + 'px'
        var pCtx = previewCanvas.getContext('2d')
        pCtx.imageSmoothingEnabled = true
        pCtx.imageSmoothingQuality = 'high'
        pCtx.drawImage(img, 0, 0, displaySize, displaySize)

        canvas.toBlob(function (blob) {
          generated[size] = { canvas: canvas, blob: blob }

          var card = document.createElement('div')
          card.className = 'fg-size-card'
          card.appendChild(previewCanvas)
          var label = document.createElement('div')
          label.className = 'fg-size-label'
          label.textContent = size + '×' + size
          card.appendChild(label)
          var dl = document.createElement('button')
          dl.className = 'fg-size-download'
          dl.textContent = 'Download'
          dl.type = 'button'
          dl.addEventListener('click', function () {
            downloadBlob(blob, 'favicon-' + size + 'x' + size + '.png')
          })
          card.appendChild(dl)
          sizesGrid.appendChild(card)

          pending--
          if (pending === 0) {
            sizesEl.style.display = 'block'
            downloadsEl.style.display = 'flex'
          }
        }, 'image/png')
      })(sizes[i])
    }
  }

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob)
    var a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── ICO generation ──

  function createIco(callback) {
    var icoSizes = [16, 32, 48]
    var blobs = []
    var pending = icoSizes.length

    for (var i = 0; i < icoSizes.length; i++) {
      (function (idx) {
        var size = icoSizes[idx]
        var blob = generated[size] && generated[size].blob
        if (!blob) { pending--; return }
        var reader = new FileReader()
        reader.onload = function () {
          blobs[idx] = new Uint8Array(reader.result)
          pending--
          if (pending === 0) buildIco(blobs, icoSizes, callback)
        }
        reader.readAsArrayBuffer(blob)
      })(i)
    }
  }

  function buildIco(pngArrays, icoSizes, callback) {
    var count = pngArrays.length
    var headerSize = 6
    var dirSize = 16 * count
    var dataOffset = headerSize + dirSize
    var totalSize = dataOffset
    for (var i = 0; i < count; i++) totalSize += pngArrays[i].length

    var buf = new ArrayBuffer(totalSize)
    var view = new DataView(buf)
    var arr = new Uint8Array(buf)

    // Header
    view.setUint16(0, 0, true) // reserved
    view.setUint16(2, 1, true) // type = ICO
    view.setUint16(4, count, true)

    var offset = dataOffset
    for (var d = 0; d < count; d++) {
      var dirPos = 6 + d * 16
      var s = icoSizes[d] >= 256 ? 0 : icoSizes[d]
      view.setUint8(dirPos, s) // width
      view.setUint8(dirPos + 1, s) // height
      view.setUint8(dirPos + 2, 0) // colors
      view.setUint8(dirPos + 3, 0) // reserved
      view.setUint16(dirPos + 4, 1, true) // planes
      view.setUint16(dirPos + 6, 32, true) // bitcount
      view.setUint32(dirPos + 8, pngArrays[d].length, true) // datasize
      view.setUint32(dirPos + 12, offset, true) // offset
      arr.set(pngArrays[d], offset)
      offset += pngArrays[d].length
    }

    callback(new Blob([buf], { type: 'image/x-icon' }))
  }

  // ── ZIP generation ──

  function createZip(callback) {
    // Collect all files
    var files = []
    var pending = sizes.length + 1 // +1 for ICO

    function checkDone() {
      pending--
      if (pending === 0) buildZip(files, callback)
    }

    // Add PNGs
    for (var i = 0; i < sizes.length; i++) {
      (function (size) {
        var blob = generated[size] && generated[size].blob
        if (!blob) { checkDone(); return }
        var reader = new FileReader()
        reader.onload = function () {
          files.push({ name: 'favicon-' + size + 'x' + size + '.png', data: new Uint8Array(reader.result) })
          checkDone()
        }
        reader.readAsArrayBuffer(blob)
      })(sizes[i])
    }

    // Add ICO
    createIco(function (icoBlob) {
      var reader = new FileReader()
      reader.onload = function () {
        files.push({ name: 'favicon.ico', data: new Uint8Array(reader.result) })
        checkDone()
      }
      reader.readAsArrayBuffer(icoBlob)
    })
  }

  function buildZip(files, callback) {
    // DOS date/time for now
    var now = new Date()
    var dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)
    var dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()

    var localHeaders = []
    var centralEntries = []
    var dataOffset = 0

    for (var i = 0; i < files.length; i++) {
      var f = files[i]
      var nameBytes = new TextEncoder().encode(f.name)
      var fileCrc = crc32(f.data)

      // Local file header: 30 + nameLen + data
      var localSize = 30 + nameBytes.length + f.data.length
      var local = new ArrayBuffer(30 + nameBytes.length)
      var lv = new DataView(local)
      lv.setUint32(0, 0x04034b50, true) // signature
      lv.setUint16(4, 20, true) // version needed
      lv.setUint16(6, 0, true) // flags
      lv.setUint16(8, 0, true) // method: stored
      lv.setUint16(10, dosTime, true)
      lv.setUint16(12, dosDate, true)
      lv.setUint32(14, fileCrc, true)
      lv.setUint32(18, f.data.length, true) // compressed
      lv.setUint32(22, f.data.length, true) // uncompressed
      lv.setUint16(26, nameBytes.length, true)
      lv.setUint16(28, 0, true) // extra field length
      new Uint8Array(local).set(nameBytes, 30)

      localHeaders.push({ header: new Uint8Array(local), data: f.data, offset: dataOffset })
      dataOffset += localSize

      // Central directory entry: 46 + nameLen
      var central = new ArrayBuffer(46 + nameBytes.length)
      var cv = new DataView(central)
      cv.setUint32(0, 0x02014b50, true)
      cv.setUint16(4, 20, true) // version made by
      cv.setUint16(6, 20, true) // version needed
      cv.setUint16(8, 0, true) // flags
      cv.setUint16(10, 0, true) // method
      cv.setUint16(12, dosTime, true)
      cv.setUint16(14, dosDate, true)
      cv.setUint32(16, fileCrc, true)
      cv.setUint32(20, f.data.length, true)
      cv.setUint32(24, f.data.length, true)
      cv.setUint16(28, nameBytes.length, true)
      cv.setUint16(30, 0, true) // extra
      cv.setUint16(32, 0, true) // comment
      cv.setUint16(34, 0, true) // disk
      cv.setUint16(36, 0, true) // internal attrs
      cv.setUint32(38, 0, true) // external attrs
      cv.setUint32(42, localHeaders[i].offset, true)
      new Uint8Array(central).set(nameBytes, 46)

      centralEntries.push(new Uint8Array(central))
    }

    var centralSize = 0
    for (var c = 0; c < centralEntries.length; c++) centralSize += centralEntries[c].length

    // EOCD: 22 bytes
    var eocd = new ArrayBuffer(22)
    var ev = new DataView(eocd)
    ev.setUint32(0, 0x06054b50, true)
    ev.setUint16(4, 0, true) // disk
    ev.setUint16(6, 0, true) // disk start
    ev.setUint16(8, files.length, true)
    ev.setUint16(10, files.length, true)
    ev.setUint32(12, centralSize, true)
    ev.setUint32(16, dataOffset, true)
    ev.setUint16(20, 0, true) // comment

    var parts = []
    for (var l = 0; l < localHeaders.length; l++) {
      parts.push(localHeaders[l].header)
      parts.push(localHeaders[l].data)
    }
    for (var ce = 0; ce < centralEntries.length; ce++) {
      parts.push(centralEntries[ce])
    }
    parts.push(new Uint8Array(eocd))

    callback(new Blob(parts, { type: 'application/zip' }))
  }

  // ── Events ──

  browseBtn.addEventListener('click', function (e) {
    e.stopPropagation()
    fileInput.click()
  })

  uploadEl.addEventListener('click', function () {
    fileInput.click()
  })

  fileInput.addEventListener('change', function () {
    handleFile(fileInput.files[0])
  })

  uploadEl.addEventListener('dragover', function (e) {
    e.preventDefault()
    uploadEl.classList.add('dragover')
  })

  uploadEl.addEventListener('dragleave', function () {
    uploadEl.classList.remove('dragover')
  })

  uploadEl.addEventListener('drop', function (e) {
    e.preventDefault()
    uploadEl.classList.remove('dragover')
    handleFile(e.dataTransfer.files[0])
  })

  changeBtn.addEventListener('click', reset)

  downloadIco.addEventListener('click', function () {
    createIco(function (blob) {
      downloadBlob(blob, 'favicon.ico')
    })
  })

  downloadZip.addEventListener('click', function () {
    createZip(function (blob) {
      downloadBlob(blob, 'favicons.zip')
    })
  })
})()
