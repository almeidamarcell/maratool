;(function () {
  var left = document.getElementById('jd-left')
  var right = document.getElementById('jd-right')
  var output = document.getElementById('jd-output')
  var compareBtn = document.getElementById('jd-compare')

  function flattenKeys(obj, prefix) {
    prefix = prefix || ''
    var keys = []
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      Object.keys(obj).sort().forEach(function (k) {
        var path = prefix ? prefix + '.' + k : k
        if (obj[k] && typeof obj[k] === 'object' && !Array.isArray(obj[k])) {
          keys = keys.concat(flattenKeys(obj[k], path))
        } else {
          keys.push({ path: path, value: JSON.stringify(obj[k]) })
        }
      })
    }
    return keys
  }

  function compare() {
    try {
      var a = JSON.parse(left.value || '{}')
      var b = JSON.parse(right.value || '{}')
    } catch (e) {
      output.innerHTML = '<span class="jd-error">Invalid JSON: ' + e.message + '</span>'
      return
    }
    var keysA = flattenKeys(a)
    var keysB = flattenKeys(b)
    var mapA = Object.fromEntries(keysA.map(function (k) { return [k.path, k.value] }))
    var mapB = Object.fromEntries(keysB.map(function (k) { return [k.path, k.value] }))
    var allPaths = [...new Set([...Object.keys(mapA), ...Object.keys(mapB)])].sort()
    var html = ''
    var added = 0, removed = 0, changed = 0
    allPaths.forEach(function (path) {
      var inA = path in mapA
      var inB = path in mapB
      if (inA && inB && mapA[path] === mapB[path]) {
        html += '<div class="jd-line jd-equal">' + path + ': ' + mapA[path] + '</div>'
      } else if (inA && inB) {
        changed++
        html += '<div class="jd-line jd-changed">' + path + ': ' + mapA[path] + ' → ' + mapB[path] + '</div>'
      } else if (inA) {
        removed++
        html += '<div class="jd-line jd-removed">− ' + path + ': ' + mapA[path] + '</div>'
      } else {
        added++
        html += '<div class="jd-line jd-added">+ ' + path + ': ' + mapB[path] + '</div>'
      }
    })
    output.innerHTML = '<div class="jd-stats">' + added + ' added · ' + removed + ' removed · ' + changed + ' changed</div>' + (html || '<span style="color:var(--text-3)">No differences</span>')
  }

  compareBtn.addEventListener('click', compare)
})()
