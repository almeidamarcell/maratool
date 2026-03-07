(function () {
  var contentEl = document.getElementById('qr-content')
  var previewEl = document.getElementById('qr-preview')
  var placeholderEl = document.getElementById('qr-placeholder')

  // Basics
  var sizeSlider = document.getElementById('qr-size')
  var sizeValue = document.getElementById('qr-size-value')
  var paddingSlider = document.getElementById('qr-padding')
  var paddingValue = document.getElementById('qr-padding-value')
  var ecGroup = document.getElementById('qr-ec-group')

  // Colors
  var fgColor = document.getElementById('qr-fg-color')
  var fgHex = document.getElementById('qr-fg-hex')
  var bgColor = document.getElementById('qr-bg-color')
  var bgHex = document.getElementById('qr-bg-hex')

  // Shapes
  var dotGroup = document.getElementById('qr-dot-group')
  var eyeGroup = document.getElementById('qr-eye-group')
  var pupilGroup = document.getElementById('qr-pupil-group')

  // Logo
  var logoFile = document.getElementById('qr-logo-file')
  var logoBrowse = document.getElementById('qr-logo-browse')
  var logoName = document.getElementById('qr-logo-name')
  var logoClear = document.getElementById('qr-logo-clear')
  var logoSizeRow = document.getElementById('qr-logo-size-row')
  var logoSizeSlider = document.getElementById('qr-logo-size')
  var logoSizeValue = document.getElementById('qr-logo-size-value')
  var logoMarginRow = document.getElementById('qr-logo-margin-row')
  var logoMarginSlider = document.getElementById('qr-logo-margin')
  var logoMarginValue = document.getElementById('qr-logo-margin-value')

  // Export
  var dlPng = document.getElementById('qr-dl-png')
  var dlSvg = document.getElementById('qr-dl-svg')
  var copyBtn = document.getElementById('qr-copy')

  // Quick styles
  var styleBar = document.getElementById('qr-style-bar')

  // Type bar
  var typeBar = document.querySelector('.qr-type-bar')

  // Tabs
  var tabs = document.querySelectorAll('.qr-tab')
  var panelSingle = document.getElementById('qr-panel-single')
  var panelVcard = document.getElementById('qr-panel-vcard')
  var panelBatch = document.getElementById('qr-panel-batch')
  var mainLayout = document.getElementById('qr-main-layout')

  // vCard fields
  var vcFirst = document.getElementById('qr-vc-first')
  var vcLast = document.getElementById('qr-vc-last')
  var vcOrg = document.getElementById('qr-vc-org')
  var vcTitle = document.getElementById('qr-vc-title')
  var vcEmail = document.getElementById('qr-vc-email')
  var vcPhone = document.getElementById('qr-vc-phone')
  var vcUrl = document.getElementById('qr-vc-url')
  var vcAddr = document.getElementById('qr-vc-addr')

  // Batch elements
  var batchInput = document.getElementById('qr-batch-input')
  var batchGenerate = document.getElementById('qr-batch-generate')
  var batchDownload = document.getElementById('qr-batch-download')
  var batchStatus = document.getElementById('qr-batch-status')
  var batchGrid = document.getElementById('qr-batch-grid')

  // ── State ──

  var opts = {
    size: 300,
    padding: 2,
    ec: 'M',
    fgColor: '#000000',
    bgColor: '#ffffff',
    dotType: 'square',
    eyeType: 'square',
    pupilType: 'square',
    logo: null,
    logoSize: 0.3,
    logoMargin: 4
  }

  var qrInstance = null
  var debounceTimer = null
  var activeTab = 'single'
  var batchBlobs = [] // { label, blob }

  // ── Quick style presets ──

  var STYLES = {
    classic: { dotType: 'square', eyeType: 'square', pupilType: 'square', fgColor: '#000000', bgColor: '#ffffff' },
    rounded: { dotType: 'rounded', eyeType: 'extra-rounded', pupilType: 'dot', fgColor: '#000000', bgColor: '#ffffff' },
    dots: { dotType: 'dots', eyeType: 'dot', pupilType: 'dot', fgColor: '#000000', bgColor: '#ffffff' },
    classy: { dotType: 'classy-rounded', eyeType: 'extra-rounded', pupilType: 'square', fgColor: '#000000', bgColor: '#ffffff' },
    indigo: { dotType: 'rounded', eyeType: 'extra-rounded', pupilType: 'dot', fgColor: '#6366f1', bgColor: '#ffffff' },
    rose: { dotType: 'extra-rounded', eyeType: 'extra-rounded', pupilType: 'dot', fgColor: '#e11d48', bgColor: '#ffffff' },
    teal: { dotType: 'classy', eyeType: 'square', pupilType: 'square', fgColor: '#0d9488', bgColor: '#ffffff' }
  }

  // ── Content type templates ──

  var TYPE_TEMPLATES = {
    url: 'https://example.com',
    email: 'mailto:hello@example.com',
    phone: 'tel:+1234567890',
    wifi: 'WIFI:T:WPA;S:NetworkName;P:password;;',
    sms: 'sms:+1234567890?body=Hello',
    geo: 'geo:40.7128,-74.0060'
  }

  // ── Tab switching ──

  function switchTab(tab) {
    activeTab = tab
    tabs.forEach(function (t) {
      t.classList.toggle('active', t.getAttribute('data-tab') === tab)
    })
    panelSingle.style.display = tab === 'single' ? 'block' : 'none'
    panelVcard.style.display = tab === 'vcard' ? 'block' : 'none'
    panelBatch.style.display = tab === 'batch' ? 'block' : 'none'
    mainLayout.style.display = tab === 'batch' ? 'none' : 'grid'

    if (tab === 'vcard') {
      buildVcard()
      render()
    } else if (tab === 'single') {
      render()
    }
  }

  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      switchTab(t.getAttribute('data-tab'))
    })
  })

  // ── vCard builder ──

  function buildVcard() {
    var first = vcFirst.value.trim()
    var last = vcLast.value.trim()
    var org = vcOrg.value.trim()
    var title = vcTitle.value.trim()
    var email = vcEmail.value.trim()
    var phone = vcPhone.value.trim()
    var url = vcUrl.value.trim()
    var addr = vcAddr.value.trim()

    if (!first && !last && !email && !phone) {
      contentEl.value = ''
      return
    }

    var lines = ['BEGIN:VCARD', 'VERSION:3.0']
    if (last || first) lines.push('N:' + last + ';' + first + ';;;')
    if (first || last) lines.push('FN:' + (first + ' ' + last).trim())
    if (org) lines.push('ORG:' + org)
    if (title) lines.push('TITLE:' + title)
    if (email) lines.push('EMAIL:' + email)
    if (phone) lines.push('TEL:' + phone)
    if (url) lines.push('URL:' + url)
    if (addr) lines.push('ADR:;;' + addr + ';;;;')
    lines.push('END:VCARD')

    contentEl.value = lines.join('\n')
  }

  var vcardFields = [vcFirst, vcLast, vcOrg, vcTitle, vcEmail, vcPhone, vcUrl, vcAddr]
  vcardFields.forEach(function (field) {
    field.addEventListener('input', function () {
      if (activeTab !== 'vcard') return
      buildVcard()
      debouncedRender()
    })
  })

  // ── Hash state ──

  function readHash() {
    try {
      var h = window.location.hash.slice(1)
      if (!h) return {}
      return JSON.parse(decodeURIComponent(h))
    } catch (e) { return {} }
  }

  function writeHash() {
    var state = { content: contentEl.value }
    if (opts.fgColor !== '#000000') state.fg = opts.fgColor
    if (opts.bgColor !== '#ffffff') state.bg = opts.bgColor
    if (opts.dotType !== 'square') state.dot = opts.dotType
    if (opts.eyeType !== 'square') state.eye = opts.eyeType
    if (opts.pupilType !== 'square') state.pupil = opts.pupilType
    if (opts.ec !== 'M') state.ec = opts.ec
    if (opts.size !== 300) state.size = opts.size
    if (opts.padding !== 2) state.padding = opts.padding
    history.replaceState(null, '', '#' + encodeURIComponent(JSON.stringify(state)))
  }

  // ── QR rendering ──

  function buildQrOpts(data) {
    var qrOpts = {
      width: opts.size,
      height: opts.size,
      type: 'svg',
      data: data,
      margin: opts.padding * 4,
      qrOptions: {
        errorCorrectionLevel: opts.ec
      },
      dotsOptions: {
        color: opts.fgColor,
        type: opts.dotType
      },
      backgroundOptions: {
        color: opts.bgColor
      },
      cornersSquareOptions: {
        color: opts.fgColor,
        type: opts.eyeType
      },
      cornersDotOptions: {
        color: opts.fgColor,
        type: opts.pupilType
      }
    }

    if (opts.logo) {
      qrOpts.image = opts.logo
      qrOpts.imageOptions = {
        crossOrigin: 'anonymous',
        margin: opts.logoMargin,
        imageSize: opts.logoSize
      }
    }

    return qrOpts
  }

  function render() {
    var data = contentEl.value.trim()
    if (!data) {
      placeholderEl.style.display = 'block'
      var existing = previewEl.querySelector('canvas, svg, img')
      if (existing) existing.remove()
      return
    }
    placeholderEl.style.display = 'none'

    var qrOpts = buildQrOpts(data)

    if (qrInstance) {
      qrInstance.update(qrOpts)
    } else {
      qrInstance = new QRCodeStyling(qrOpts)
      var existing = previewEl.querySelector('canvas, svg, img')
      if (existing) existing.remove()
      qrInstance.append(previewEl)
    }

    writeHash()
  }

  function debouncedRender() {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(render, 200)
  }

  // ── UI sync helpers ──

  function setActiveBtn(group, attrName, value) {
    var btns = group.querySelectorAll('.qr-opt-btn')
    for (var i = 0; i < btns.length; i++) {
      var btnVal = btns[i].getAttribute('data-' + attrName)
      if (btnVal === value) {
        btns[i].classList.add('active')
      } else {
        btns[i].classList.remove('active')
      }
    }
  }

  function syncUI() {
    sizeSlider.value = opts.size
    sizeValue.textContent = opts.size + 'px'
    paddingSlider.value = opts.padding
    paddingValue.textContent = opts.padding

    fgColor.value = opts.fgColor
    fgHex.value = opts.fgColor
    bgColor.value = opts.bgColor
    bgHex.value = opts.bgColor

    setActiveBtn(ecGroup, 'ec', opts.ec)
    setActiveBtn(dotGroup, 'dot', opts.dotType)
    setActiveBtn(eyeGroup, 'eye', opts.eyeType)
    setActiveBtn(pupilGroup, 'pupil', opts.pupilType)
  }

  // ── Event listeners ──

  contentEl.addEventListener('input', debouncedRender)

  // Content type buttons
  typeBar.addEventListener('click', function (e) {
    var btn = e.target.closest('.qr-type-btn')
    if (!btn) return
    var type = btn.getAttribute('data-type')
    var wasActive = btn.classList.contains('active')
    typeBar.querySelectorAll('.qr-type-btn').forEach(function (b) { b.classList.remove('active') })
    if (!wasActive) {
      btn.classList.add('active')
      contentEl.value = TYPE_TEMPLATES[type] || ''
      contentEl.focus()
      contentEl.select()
    }
    debouncedRender()
  })

  // Size
  sizeSlider.addEventListener('input', function () {
    opts.size = parseInt(sizeSlider.value)
    sizeValue.textContent = opts.size + 'px'
    debouncedRender()
  })

  // Padding
  paddingSlider.addEventListener('input', function () {
    opts.padding = parseInt(paddingSlider.value)
    paddingValue.textContent = opts.padding
    debouncedRender()
  })

  // Error correction
  ecGroup.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-ec]')
    if (!btn) return
    opts.ec = btn.getAttribute('data-ec')
    setActiveBtn(ecGroup, 'ec', opts.ec)
    render()
  })

  // Colors
  fgColor.addEventListener('input', function () {
    opts.fgColor = fgColor.value
    fgHex.value = fgColor.value
    render()
  })
  fgHex.addEventListener('input', function () {
    var v = fgHex.value.trim()
    if (v.charAt(0) !== '#') v = '#' + v
    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
      opts.fgColor = v
      fgColor.value = v
      render()
    }
  })
  bgColor.addEventListener('input', function () {
    opts.bgColor = bgColor.value
    bgHex.value = bgColor.value
    render()
  })
  bgHex.addEventListener('input', function () {
    var v = bgHex.value.trim()
    if (v.charAt(0) !== '#') v = '#' + v
    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
      opts.bgColor = v
      bgColor.value = v
      render()
    }
  })

  // Dot type
  dotGroup.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-dot]')
    if (!btn) return
    opts.dotType = btn.getAttribute('data-dot')
    setActiveBtn(dotGroup, 'dot', opts.dotType)
    render()
  })

  // Eye type
  eyeGroup.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-eye]')
    if (!btn) return
    opts.eyeType = btn.getAttribute('data-eye')
    setActiveBtn(eyeGroup, 'eye', opts.eyeType)
    render()
  })

  // Pupil type
  pupilGroup.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-pupil]')
    if (!btn) return
    opts.pupilType = btn.getAttribute('data-pupil')
    setActiveBtn(pupilGroup, 'pupil', opts.pupilType)
    render()
  })

  // Logo
  logoBrowse.addEventListener('click', function () { logoFile.click() })

  logoFile.addEventListener('change', function () {
    var file = logoFile.files[0]
    if (!file) return
    var reader = new FileReader()
    reader.onload = function () {
      opts.logo = reader.result
      logoName.textContent = file.name
      logoClear.style.display = 'inline'
      logoSizeRow.style.display = 'flex'
      logoMarginRow.style.display = 'flex'
      opts.ec = 'H'
      setActiveBtn(ecGroup, 'ec', 'H')
      render()
    }
    reader.readAsDataURL(file)
  })

  logoClear.addEventListener('click', function () {
    opts.logo = null
    logoFile.value = ''
    logoName.textContent = 'No file chosen'
    logoClear.style.display = 'none'
    logoSizeRow.style.display = 'none'
    logoMarginRow.style.display = 'none'
    render()
  })

  logoSizeSlider.addEventListener('input', function () {
    opts.logoSize = parseInt(logoSizeSlider.value) / 100
    logoSizeValue.textContent = logoSizeSlider.value + '%'
    debouncedRender()
  })

  logoMarginSlider.addEventListener('input', function () {
    opts.logoMargin = parseInt(logoMarginSlider.value)
    logoMarginValue.textContent = logoMarginSlider.value + 'px'
    debouncedRender()
  })

  // Quick styles
  styleBar.addEventListener('click', function (e) {
    var btn = e.target.closest('.qr-style-btn')
    if (!btn) return
    var style = btn.getAttribute('data-style')
    var preset = STYLES[style]
    if (!preset) return

    styleBar.querySelectorAll('.qr-style-btn').forEach(function (b) { b.classList.remove('active') })
    btn.classList.add('active')

    opts.dotType = preset.dotType
    opts.eyeType = preset.eyeType
    opts.pupilType = preset.pupilType
    opts.fgColor = preset.fgColor
    opts.bgColor = preset.bgColor
    syncUI()
    render()
  })

  // ── Export ──

  dlPng.addEventListener('click', function () {
    if (!qrInstance) return
    qrInstance.download({ name: 'qr-code', extension: 'png' })
  })

  dlSvg.addEventListener('click', function () {
    if (!qrInstance) return
    qrInstance.download({ name: 'qr-code', extension: 'svg' })
  })

  copyBtn.addEventListener('click', function () {
    if (!qrInstance) return
    qrInstance.getRawData('png').then(function (blob) {
      navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]).then(function () {
        var orig = copyBtn.textContent
        copyBtn.textContent = 'Copied!'
        setTimeout(function () { copyBtn.textContent = orig }, 2000)
      })
    })
  })

  // ── Batch mode ──

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

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob)
    var a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  batchGenerate.addEventListener('click', function () {
    var lines = batchInput.value.split('\n').map(function (l) { return l.trim() }).filter(function (l) { return l.length > 0 })
    if (lines.length === 0) return

    batchGrid.innerHTML = ''
    batchBlobs = []
    batchDownload.style.display = 'none'
    batchStatus.textContent = 'Generating 0 / ' + lines.length + '...'

    var completed = 0

    for (var i = 0; i < lines.length; i++) {
      (function (idx, data) {
        var qrOpts = buildQrOpts(data)
        qrOpts.width = 200
        qrOpts.height = 200
        qrOpts.type = 'canvas'

        var instance = new QRCodeStyling(qrOpts)

        var card = document.createElement('div')
        card.className = 'qr-batch-item'
        var container = document.createElement('div')
        card.appendChild(container)
        var label = document.createElement('div')
        label.className = 'qr-batch-item-label'
        label.textContent = data.length > 30 ? data.substring(0, 30) + '...' : data
        label.title = data
        card.appendChild(label)
        batchGrid.appendChild(card)

        instance.append(container)

        instance.getRawData('png').then(function (blob) {
          var reader = new FileReader()
          reader.onload = function () {
            batchBlobs[idx] = {
              label: 'qr-' + (idx + 1) + '.png',
              data: new Uint8Array(reader.result)
            }
            completed++
            batchStatus.textContent = 'Generated ' + completed + ' / ' + lines.length
            if (completed === lines.length) {
              batchDownload.style.display = 'inline-block'
              batchStatus.textContent = lines.length + ' QR codes ready'
            }
          }
          reader.readAsArrayBuffer(blob)
        })
      })(i, lines[i])
    }
  })

  batchDownload.addEventListener('click', function () {
    var files = batchBlobs.filter(function (b) { return b })
    if (files.length === 0) return

    var zipFiles = files.map(function (f) {
      return { name: f.label, data: f.data }
    })

    buildZip(zipFiles, function (blob) {
      downloadBlob(blob, 'qr-codes.zip')
    })
  })

  // ── Init from hash ──

  var state = readHash()
  if (state.content) contentEl.value = state.content
  if (state.fg) opts.fgColor = state.fg
  if (state.bg) opts.bgColor = state.bg
  if (state.dot) opts.dotType = state.dot
  if (state.eye) opts.eyeType = state.eye
  if (state.pupil) opts.pupilType = state.pupil
  if (state.ec) opts.ec = state.ec
  if (state.size) opts.size = state.size
  if (state.padding !== undefined) opts.padding = state.padding

  syncUI()
  if (contentEl.value.trim()) render()
})()
