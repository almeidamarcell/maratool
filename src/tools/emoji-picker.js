(function () {
  var searchInput = document.getElementById('emoji-search')
  var grid = document.getElementById('emoji-grid')
  var tabs = document.querySelectorAll('.emoji-tab')
  var toast = document.getElementById('emoji-toast')
  var toastTimer = null
  var activeCategory = 'Smileys'
  var currentQuery = ''

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }

  function renderEmojis(emojis) {
    if (emojis.length === 0) {
      grid.innerHTML = '<p class="emoji-no-results">No emojis found.</p>'
      return
    }
    grid.innerHTML = emojis.map(function (e) {
      return '<button class="emoji-btn" title="' + escapeHtml(e.name) + '" aria-label="Copy ' + escapeHtml(e.name) + '" data-char="' + escapeHtml(e.char) + '">' + e.char + '</button>'
    }).join('')
  }

  function getVisible() {
    var q = currentQuery.toLowerCase().trim()
    if (q) {
      var all = []
      for (var cat in emojiData) {
        for (var i = 0; i < emojiData[cat].length; i++) {
          if (emojiData[cat][i].name.toLowerCase().includes(q)) {
            all.push(emojiData[cat][i])
          }
        }
      }
      return all
    }
    return emojiData[activeCategory] || []
  }

  function setTab(cat) {
    activeCategory = cat
    tabs.forEach(function (t) {
      t.classList.toggle('active', t.dataset.cat === cat)
    })
    renderEmojis(getVisible())
  }

  function showToast(emoji) {
    toast.textContent = emoji + ' Copied!'
    toast.classList.add('show')
    clearTimeout(toastTimer)
    toastTimer = setTimeout(function () {
      toast.classList.remove('show')
    }, 1500)
  }

  grid.addEventListener('click', function (e) {
    var btn = e.target.closest('.emoji-btn')
    if (!btn) return
    var char = btn.dataset.char
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(char).then(function () { showToast(char) })
    } else {
      var ta = document.createElement('textarea')
      ta.value = char
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      showToast(char)
    }
  })

  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      currentQuery = ''
      searchInput.value = ''
      setTab(t.dataset.cat)
    })
  })

  var debounce = null
  searchInput.addEventListener('input', function () {
    clearTimeout(debounce)
    debounce = setTimeout(function () {
      currentQuery = searchInput.value
      if (currentQuery.trim()) {
        tabs.forEach(function (t) { t.classList.remove('active') })
      } else {
        tabs.forEach(function (t) {
          t.classList.toggle('active', t.dataset.cat === activeCategory)
        })
      }
      renderEmojis(getVisible())
    }, 120)
  })

  // Initial render
  setTab('Smileys')
})()
