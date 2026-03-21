(function () {
  var COLORS = ['#2d6ef6', '#e74c3c', '#27ae60', '#f39c12']
  var canvas = document.getElementById('gc-canvas')
  var ctx = canvas.getContext('2d')
  var cursorInfo = document.getElementById('gc-cursor-info')
  var plotBtn = document.getElementById('gc-plot-btn')
  var zoomInBtn = document.getElementById('gc-zoom-in')
  var zoomOutBtn = document.getElementById('gc-zoom-out')
  var resetBtn = document.getElementById('gc-reset')
  var xminInput = document.getElementById('gc-xmin')
  var xmaxInput = document.getElementById('gc-xmax')
  var yminInput = document.getElementById('gc-ymin')
  var ymaxInput = document.getElementById('gc-ymax')
  var fnInputs = document.querySelectorAll('.gc-fn-input')

  var xMin = -10, xMax = 10, yMin = -10, yMax = 10
  var isDragging = false
  var dragStart = { x: 0, y: 0, xMin: 0, xMax: 0, yMin: 0, yMax: 0 }
  var dpr = window.devicePixelRatio || 1

  function resizeCanvas() {
    var rect = canvas.parentElement.getBoundingClientRect()
    var w = rect.width
    var h = Math.max(400, w * 0.625)
    canvas.style.width = w + 'px'
    canvas.style.height = h + 'px'
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  function getCanvasSize() {
    return { w: canvas.width / dpr, h: canvas.height / dpr }
  }

  function graphToCanvas(gx, gy) {
    var size = getCanvasSize()
    var cx = (gx - xMin) / (xMax - xMin) * size.w
    var cy = (1 - (gy - yMin) / (yMax - yMin)) * size.h
    return { x: cx, y: cy }
  }

  function canvasToGraph(cx, cy) {
    var size = getCanvasSize()
    var gx = xMin + cx / size.w * (xMax - xMin)
    var gy = yMax - cy / size.h * (yMax - yMin)
    return { x: gx, y: gy }
  }

  function niceStep(range) {
    var rough = range / 10
    var mag = Math.pow(10, Math.floor(Math.log10(rough)))
    var residual = rough / mag
    if (residual <= 1.5) return mag
    if (residual <= 3) return 2 * mag
    if (residual <= 7) return 5 * mag
    return 10 * mag
  }

  function drawGrid() {
    var size = getCanvasSize()
    ctx.clearRect(0, 0, size.w, size.h)

    // Background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size.w, size.h)

    var xStep = niceStep(xMax - xMin)
    var yStep = niceStep(yMax - yMin)

    // Grid lines
    ctx.strokeStyle = '#f0f0f0'
    ctx.lineWidth = 1

    // Vertical grid lines
    var xStart = Math.ceil(xMin / xStep) * xStep
    for (var x = xStart; x <= xMax; x += xStep) {
      var p = graphToCanvas(x, 0)
      ctx.beginPath()
      ctx.moveTo(Math.round(p.x) + 0.5, 0)
      ctx.lineTo(Math.round(p.x) + 0.5, size.h)
      ctx.stroke()
    }

    // Horizontal grid lines
    var yStart = Math.ceil(yMin / yStep) * yStep
    for (var y = yStart; y <= yMax; y += yStep) {
      var p = graphToCanvas(0, y)
      ctx.beginPath()
      ctx.moveTo(0, Math.round(p.y) + 0.5)
      ctx.lineTo(size.w, Math.round(p.y) + 0.5)
      ctx.stroke()
    }

    // Axes
    ctx.strokeStyle = '#ccc'
    ctx.lineWidth = 1.5

    // X axis
    if (yMin <= 0 && yMax >= 0) {
      var ax = graphToCanvas(0, 0)
      ctx.beginPath()
      ctx.moveTo(0, Math.round(ax.y) + 0.5)
      ctx.lineTo(size.w, Math.round(ax.y) + 0.5)
      ctx.stroke()
    }

    // Y axis
    if (xMin <= 0 && xMax >= 0) {
      var ay = graphToCanvas(0, 0)
      ctx.beginPath()
      ctx.moveTo(Math.round(ay.x) + 0.5, 0)
      ctx.lineTo(Math.round(ay.x) + 0.5, size.h)
      ctx.stroke()
    }

    // Tick labels
    ctx.fillStyle = '#999'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'

    for (var x = xStart; x <= xMax; x += xStep) {
      if (Math.abs(x) < xStep * 0.01) continue // skip zero
      var p = graphToCanvas(x, 0)
      var labelY = yMin <= 0 && yMax >= 0 ? Math.min(Math.max(p.y + 4, 4), size.h - 14) : size.h - 14
      var label = Math.abs(x) < 0.001 ? x.toExponential(1) : parseFloat(x.toPrecision(6)).toString()
      ctx.fillText(label, p.x, labelY)
    }

    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    for (var y = yStart; y <= yMax; y += yStep) {
      if (Math.abs(y) < yStep * 0.01) continue
      var p = graphToCanvas(0, y)
      var labelX = xMin <= 0 && xMax >= 0 ? Math.max(Math.min(p.x - 4, size.w - 4), 30) : 30
      var label = Math.abs(y) < 0.001 ? y.toExponential(1) : parseFloat(y.toPrecision(6)).toString()
      ctx.fillText(label, labelX, p.y)
    }
  }

  function evaluateFunction(expr, x) {
    try {
      return math.evaluate(expr, { x: x })
    } catch (e) {
      return NaN
    }
  }

  function plotFunction(expr, color) {
    if (!expr.trim()) return
    var size = getCanvasSize()
    var numPoints = Math.max(800, size.w * 2)
    var dx = (xMax - xMin) / numPoints

    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.beginPath()

    var started = false
    var prevY = NaN

    for (var i = 0; i <= numPoints; i++) {
      var gx = xMin + i * dx
      var gy = evaluateFunction(expr, gx)

      if (typeof gy !== 'number' || isNaN(gy) || !isFinite(gy)) {
        started = false
        prevY = NaN
        continue
      }

      var p = graphToCanvas(gx, gy)

      // Detect discontinuities (large jumps)
      if (started && !isNaN(prevY)) {
        var jump = Math.abs(gy - prevY)
        var range = yMax - yMin
        if (jump > range * 5) {
          ctx.stroke()
          ctx.beginPath()
          started = false
        }
      }

      if (!started) {
        ctx.moveTo(p.x, p.y)
        started = true
      } else {
        ctx.lineTo(p.x, p.y)
      }
      prevY = gy
    }
    ctx.stroke()
  }

  function draw() {
    drawGrid()
    for (var i = 0; i < fnInputs.length; i++) {
      var expr = fnInputs[i].value.trim()
      if (expr) {
        // Validate
        try {
          math.evaluate(expr, { x: 1 })
          fnInputs[i].classList.remove('error')
          plotFunction(expr, COLORS[i])
        } catch (e) {
          fnInputs[i].classList.add('error')
        }
      } else {
        fnInputs[i].classList.remove('error')
      }
    }
  }

  function syncViewportInputs() {
    xminInput.value = parseFloat(xMin.toPrecision(6))
    xmaxInput.value = parseFloat(xMax.toPrecision(6))
    yminInput.value = parseFloat(yMin.toPrecision(6))
    ymaxInput.value = parseFloat(yMax.toPrecision(6))
  }

  function readViewportInputs() {
    var xm = parseFloat(xminInput.value)
    var xx = parseFloat(xmaxInput.value)
    var ym = parseFloat(yminInput.value)
    var yx = parseFloat(ymaxInput.value)
    if (!isNaN(xm) && !isNaN(xx) && xm < xx) { xMin = xm; xMax = xx }
    if (!isNaN(ym) && !isNaN(yx) && ym < yx) { yMin = ym; yMax = yx }
  }

  function zoom(factor, centerX, centerY) {
    if (centerX === undefined) centerX = (xMin + xMax) / 2
    if (centerY === undefined) centerY = (yMin + yMax) / 2

    var newXRange = (xMax - xMin) * factor
    var newYRange = (yMax - yMin) * factor

    // Clamp
    if (newXRange < 0.01 || newXRange > 100000) return
    if (newYRange < 0.01 || newYRange > 100000) return

    var xRatio = (centerX - xMin) / (xMax - xMin)
    var yRatio = (centerY - yMin) / (yMax - yMin)

    xMin = centerX - newXRange * xRatio
    xMax = centerX + newXRange * (1 - xRatio)
    yMin = centerY - newYRange * yRatio
    yMax = centerY + newYRange * (1 - yRatio)

    syncViewportInputs()
    draw()
  }

  // Events
  plotBtn.addEventListener('click', function () {
    readViewportInputs()
    draw()
  })

  zoomInBtn.addEventListener('click', function () { zoom(0.8) })
  zoomOutBtn.addEventListener('click', function () { zoom(1.25) })
  resetBtn.addEventListener('click', function () {
    xMin = -10; xMax = 10; yMin = -10; yMax = 10
    syncViewportInputs()
    draw()
  })

  // Viewport input changes
  var vpInputs = [xminInput, xmaxInput, yminInput, ymaxInput]
  for (var i = 0; i < vpInputs.length; i++) {
    vpInputs[i].addEventListener('change', function () {
      readViewportInputs()
      draw()
    })
  }

  // Enter key on function inputs
  for (var i = 0; i < fnInputs.length; i++) {
    fnInputs[i].addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); draw() }
    })
  }

  // Mouse wheel zoom
  canvas.addEventListener('wheel', function (e) {
    e.preventDefault()
    var rect = canvas.getBoundingClientRect()
    var cx = e.clientX - rect.left
    var cy = e.clientY - rect.top
    var g = canvasToGraph(cx, cy)
    var factor = e.deltaY > 0 ? 1.15 : 0.87
    zoom(factor, g.x, g.y)
  }, { passive: false })

  // Pan: mouse drag
  canvas.addEventListener('mousedown', function (e) {
    isDragging = true
    dragStart.x = e.clientX
    dragStart.y = e.clientY
    dragStart.xMin = xMin
    dragStart.xMax = xMax
    dragStart.yMin = yMin
    dragStart.yMax = yMax
    canvas.style.cursor = 'grabbing'
  })

  window.addEventListener('mousemove', function (e) {
    if (!isDragging) {
      // Show cursor coordinates
      var rect = canvas.getBoundingClientRect()
      var cx = e.clientX - rect.left
      var cy = e.clientY - rect.top
      if (cx >= 0 && cy >= 0 && cx <= rect.width && cy <= rect.height) {
        var g = canvasToGraph(cx, cy)
        cursorInfo.textContent = 'x: ' + g.x.toFixed(2) + ', y: ' + g.y.toFixed(2)
      }
      return
    }
    var rect = canvas.getBoundingClientRect()
    var dx = (e.clientX - dragStart.x) / rect.width * (dragStart.xMax - dragStart.xMin)
    var dy = (e.clientY - dragStart.y) / rect.height * (dragStart.yMax - dragStart.yMin)
    xMin = dragStart.xMin - dx
    xMax = dragStart.xMax - dx
    yMin = dragStart.yMin + dy
    yMax = dragStart.yMax + dy
    syncViewportInputs()
    draw()
  })

  window.addEventListener('mouseup', function () {
    if (isDragging) {
      isDragging = false
      canvas.style.cursor = 'crosshair'
    }
  })

  // Touch pan support
  var touchStart = null
  canvas.addEventListener('touchstart', function (e) {
    if (e.touches.length === 1) {
      touchStart = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        xMin: xMin, xMax: xMax, yMin: yMin, yMax: yMax
      }
    }
  }, { passive: true })

  canvas.addEventListener('touchmove', function (e) {
    if (!touchStart || e.touches.length !== 1) return
    e.preventDefault()
    var rect = canvas.getBoundingClientRect()
    var dx = (e.touches[0].clientX - touchStart.x) / rect.width * (touchStart.xMax - touchStart.xMin)
    var dy = (e.touches[0].clientY - touchStart.y) / rect.height * (touchStart.yMax - touchStart.yMin)
    xMin = touchStart.xMin - dx
    xMax = touchStart.xMax - dx
    yMin = touchStart.yMin + dy
    yMax = touchStart.yMax + dy
    syncViewportInputs()
    draw()
  }, { passive: false })

  canvas.addEventListener('touchend', function () { touchStart = null })

  // Window resize
  var resizeTimer = null
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(function () {
      resizeCanvas()
      draw()
    }, 100)
  })

  // Init
  resizeCanvas()
  syncViewportInputs()
  draw()
})()
