(function () {
  var chart = document.getElementById('csc-chart')
  var region = document.getElementById('csc-region')
  var size = document.getElementById('csc-size')
  var out = document.getElementById('csc-out')
  var msg = document.getElementById('csc-msg')

  // Industry-standard alignments on the ISO 8559-1 size-designation framework.
  // Each row is one garment size expressed in every system.
  var CHARTS = {
    dress: {
      label: "Women's dress",
      regions: ['US', 'UK', 'EU', 'IT', 'JP'],
      rows: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18].map(function (us) {
        return [us, us + 4, us + 32, us + 36, us + 5] // UK=US+4, EU=US+32, IT=US+36, JP=US+5
      }),
    },
    suit: {
      label: "Men's suit / blazer",
      regions: ['US', 'UK', 'EU'],
      rows: [34, 36, 38, 40, 42, 44, 46, 48, 50, 52].map(function (us) {
        return [us, us, us + 10] // UK numbers match US (chest inches); EU=US+10
      }),
    },
    shirt: {
      label: "Men's shirt (collar)",
      regions: ['US/UK (in)', 'EU (cm)'],
      rows: [14, 14.5, 15, 15.5, 16, 16.5, 17, 17.5, 18].map(function (inch) {
        return [inch, Math.round(inch * 2.54)] // EU collar = inches in cm
      }),
    },
  }

  function fillRegions() {
    var c = CHARTS[chart.value]
    region.innerHTML = ''
    c.regions.forEach(function (r, i) {
      var o = document.createElement('option')
      o.value = String(i)
      o.textContent = r
      region.appendChild(o)
    })
    fillSizes()
  }

  function fillSizes() {
    var c = CHARTS[chart.value]
    var ri = Number(region.value) || 0
    size.innerHTML = ''
    c.rows.forEach(function (row, i) {
      var o = document.createElement('option')
      o.value = String(i)
      o.textContent = String(row[ri])
      size.appendChild(o)
    })
    render()
  }

  function render() {
    var c = CHARTS[chart.value]
    var row = c.rows[Number(size.value) || 0]
    out.innerHTML = ''
    if (!row) { msg.textContent = 'Pick a chart, system, and size to see equivalents.'; return }
    c.regions.forEach(function (r, i) {
      var stat = document.createElement('div')
      stat.className = 'tool-stat'
      var v = document.createElement('span')
      v.className = 'tool-stat-value'
      v.textContent = String(row[i])
      var l = document.createElement('span')
      l.className = 'tool-stat-label'
      l.textContent = r
      stat.appendChild(v)
      stat.appendChild(l)
      out.appendChild(stat)
    })
    msg.textContent = 'Sizing varies by brand — treat this as the size to try first.'
  }

  chart.addEventListener('change', fillRegions)
  region.addEventListener('change', fillSizes)
  size.addEventListener('change', render)

  fillRegions()
})()
