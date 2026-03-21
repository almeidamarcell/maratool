(function () {
  var uploadEl = document.getElementById('is-upload')
  var fileInput = document.getElementById('is-file')
  var browseBtn = document.getElementById('is-browse')
  var workspace = document.getElementById('is-workspace')
  var rowsInput = document.getElementById('is-rows')
  var colsInput = document.getElementById('is-cols')
  var tileInfo = document.getElementById('is-tile-info')
  var changeBtn = document.getElementById('is-change')
  var previewImg = document.getElementById('is-preview-img')
  var gridOverlay = document.getElementById('is-grid-overlay')
  var splitBtn = document.getElementById('is-split')

  var currentImg = null
  var currentFileName = ''
  var jsZipLoaded = false
  var jsZipLoading = false

  function handleFile(file) {
    if (!file || !file.type.match(/^image\//)) return
    currentFileName = file.name.replace(/\.[^.]+$/, '')

    var reader = new FileReader()
    reader.onload = function () {
      var img = new Image()
      img.onload = function () {
        currentImg = img
        previewImg.src = img.src
        uploadEl.style.display = 'none'
        workspace.style.display = 'block'
        updateGrid()
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  }

  function reset() {
    uploadEl.style.display = 'block'
    workspace.style.display = 'none'
    currentImg = null
    fileInput.value = ''
    gridOverlay.innerHTML = ''
  }

  function getRows() {
    var v = parseInt(rowsInput.value, 10)
    return (v && v >= 1 && v <= 10) ? v : 2
  }

  function getCols() {
    var v = parseInt(colsInput.value, 10)
    return (v && v >= 1 && v <= 10) ? v : 2
  }

  function updateGrid() {
    if (!currentImg) return
    var rows = getRows()
    var cols = getCols()
    var tileW = Math.floor(currentImg.naturalWidth / cols)
    var tileH = Math.floor(currentImg.naturalHeight / rows)
    var total = rows * cols

    tileInfo.textContent = total + ' tiles \u2014 ' + tileW + ' \u00d7 ' + tileH + ' px each'

    gridOverlay.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)'
    gridOverlay.style.gridTemplateRows = 'repeat(' + rows + ', 1fr)'
    gridOverlay.innerHTML = ''

    for (var i = 0; i < total; i++) {
      var cell = document.createElement('div')
      cell.className = 'is-grid-cell'
      gridOverlay.appendChild(cell)
    }
  }

  // ── CRC32 for ZIP ──

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

  // ── ZIP builder ──

  function buildZip(files, callback) {
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

      var localSize = 30 + nameBytes.length + f.data.length
      var local = new ArrayBuffer(30 + nameBytes.length)
      var lv = new DataView(local)
      lv.setUint32(0, 0x04034b50, true)
      lv.setUint16(4, 20, true)
      lv.setUint16(6, 0, true)
      lv.setUint16(8, 0, true)
      lv.setUint16(10, dosTime, true)
      lv.setUint16(12, dosDate, true)
      lv.setUint32(14, fileCrc, true)
      lv.setUint32(18, f.data.length, true)
      lv.setUint32(22, f.data.length, true)
      lv.setUint16(26, nameBytes.length, true)
      lv.setUint16(28, 0, true)
      new Uint8Array(local).set(nameBytes, 30)

      localHeaders.push({ header: new Uint8Array(local), data: f.data, offset: dataOffset })
      dataOffset += localSize

      var central = new ArrayBuffer(46 + nameBytes.length)
      var cv = new DataView(central)
      cv.setUint32(0, 0x02014b50, true)
      cv.setUint16(4, 20, true)
      cv.setUint16(6, 20, true)
      cv.setUint16(8, 0, true)
      cv.setUint16(10, 0, true)
      cv.setUint16(12, dosTime, true)
      cv.setUint16(14, dosDate, true)
      cv.setUint32(16, fileCrc, true)
      cv.setUint32(20, f.data.length, true)
      cv.setUint32(24, f.data.length, true)
      cv.setUint16(28, nameBytes.length, true)
      cv.setUint16(30, 0, true)
      cv.setUint16(32, 0, true)
      cv.setUint16(34, 0, true)
      cv.setUint16(36, 0, true)
      cv.setUint32(38, 0, true)
      cv.setUint32(42, localHeaders[i].offset, true)
      new Uint8Array(central).set(nameBytes, 46)

      centralEntries.push(new Uint8Array(central))
    }

    var centralSize = 0
    for (var c = 0; c < centralEntries.length; c++) centralSize += centralEntries[c].length

    var eocd = new ArrayBuffer(22)
    var ev = new DataView(eocd)
    ev.setUint32(0, 0x06054b50, true)
    ev.setUint16(4, 0, true)
    ev.setUint16(6, 0, true)
    ev.setUint16(8, files.length, true)
    ev.setUint16(10, files.length, true)
    ev.setUint32(12, centralSize, true)
    ev.setUint32(16, dataOffset, true)
    ev.setUint16(20, 0, true)

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

  // ── Split logic ──

  function splitAndDownload() {
    if (!currentImg) return
    splitBtn.disabled = true
    splitBtn.textContent = 'Splitting\u2026'

    var rows = getRows()
    var cols = getCols()
    var tileW = Math.floor(currentImg.naturalWidth / cols)
    var tileH = Math.floor(currentImg.naturalHeight / rows)
    var total = rows * cols
    var files = []
    var pending = total

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        (function (row, col) {
          var canvas = document.createElement('canvas')
          canvas.width = tileW
          canvas.height = tileH
          var ctx = canvas.getContext('2d')
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          ctx.drawImage(
            currentImg,
            col * tileW, row * tileH, tileW, tileH,
            0, 0, tileW, tileH
          )

          canvas.toBlob(function (blob) {
            var reader = new FileReader()
            reader.onload = function () {
              var name = currentFileName + '-r' + (row + 1) + '-c' + (col + 1) + '.png'
              files.push({ name: name, data: new Uint8Array(reader.result) })
              pending--
              if (pending === 0) {
                // Sort by name for consistent order
                files.sort(function (a, b) { return a.name < b.name ? -1 : 1 })
                buildZip(files, function (zipBlob) {
                  var url = URL.createObjectURL(zipBlob)
                  var a = document.createElement('a')
                  a.href = url
                  a.download = currentFileName + '-tiles.zip'
                  a.click()
                  URL.revokeObjectURL(url)
                  splitBtn.disabled = false
                  splitBtn.textContent = 'Split & Download ZIP'
                })
              }
            }
            reader.readAsArrayBuffer(blob)
          }, 'image/png')
        })(r, c)
      }
    }
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

  rowsInput.addEventListener('input', updateGrid)
  colsInput.addEventListener('input', updateGrid)

  splitBtn.addEventListener('click', splitAndDownload)
})()
