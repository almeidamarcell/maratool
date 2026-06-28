;(function () {
  var input = document.getElementById('wc-input')
  var words = document.getElementById('wc-words')
  var chars = document.getElementById('wc-chars')
  var charsNoSpace = document.getElementById('wc-chars-ns')
  var sentences = document.getElementById('wc-sentences')
  var paragraphs = document.getElementById('wc-paragraphs')

  function update() {
    var t = input.value
    var w = t.trim() ? t.trim().split(/\s+/).length : 0
    words.textContent = w.toLocaleString()
    chars.textContent = t.length.toLocaleString()
    charsNoSpace.textContent = t.replace(/\s/g, '').length.toLocaleString()
    sentences.textContent = (t.match(/[^.!?]+[.!?]+/g) || []).length.toLocaleString()
    paragraphs.textContent = (t.split(/\n\s*\n/).filter(function (p) { return p.trim() }).length || (t.trim() ? 1 : 0)).toLocaleString()
  }

  input.addEventListener('input', update)
  update()
})()
