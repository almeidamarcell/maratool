(function () {
  // ── Curated palette data ──
  var PALETTES = [
    // Classic
    { name: 'Mayfair', colors: ['#2c3e50', '#e74c3c', '#ecf0f1', '#3498db', '#2ecc71'], tags: ['classic', 'bold'] },
    { name: 'Piccadilly', colors: ['#1a1a2e', '#16213e', '#0f3460', '#e94560'], tags: ['classic', 'dark'] },
    { name: 'Bond Street', colors: ['#f8b500', '#fc5185', '#3fc1c9', '#364f6b'], tags: ['classic', 'vibrant'] },
    { name: 'Westminster', colors: ['#2d4059', '#ea5455', '#f07b3f', '#ffd460', '#fee761'], tags: ['classic', 'warm'] },
    { name: 'Kensington', colors: ['#1b262c', '#0f4c75', '#3282b8', '#bbe1fa'], tags: ['classic', 'cool'] },
    { name: 'Chelsea', colors: ['#303841', '#3a4750', '#d72323', '#eeeeee'], tags: ['classic', 'dark'] },
    { name: 'Notting Hill', colors: ['#ffc7c7', '#ffe2e2', '#f6f6f6', '#8785a2'], tags: ['classic', 'pastel'] },
    { name: 'Camden', colors: ['#0c0032', '#190061', '#240090', '#3500d3', '#282828'], tags: ['classic', 'dark'] },
    { name: 'Soho', colors: ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff'], tags: ['classic', 'vibrant'] },

    // Nature
    { name: 'Sequoia', colors: ['#2d5016', '#527318', '#8fae1b', '#c5d86d', '#f7f7f2'], tags: ['nature', 'warm'] },
    { name: 'Patagonia', colors: ['#1b4332', '#2d6a4f', '#40916c', '#52b788', '#95d5b2'], tags: ['nature', 'cool'] },
    { name: 'Sahara', colors: ['#d4a373', '#ccd5ae', '#e9edc9', '#fefae0', '#faedcd'], tags: ['nature', 'warm', 'pastel'] },
    { name: 'Nordic Forest', colors: ['#0b3d0b', '#1a5c1a', '#2e7d32', '#66bb6a', '#a5d6a7'], tags: ['nature', 'cool'] },
    { name: 'Coral Reef', colors: ['#ff7f50', '#ff6b81', '#ee5a24', '#f8c291', '#e77f67'], tags: ['nature', 'warm', 'vibrant'] },
    { name: 'Arctic', colors: ['#dfe6e9', '#b2bec3', '#636e72', '#2d3436', '#74b9ff'], tags: ['nature', 'cool', 'minimal'] },
    { name: 'Lavender Fields', colors: ['#6c5ce7', '#a29bfe', '#dfe6e9', '#ffeaa7', '#fab1a0'], tags: ['nature', 'pastel'] },
    { name: 'Autumn Leaves', colors: ['#6b4226', '#b85c38', '#e08e45', '#f1c40f', '#c0392b'], tags: ['nature', 'warm'] },
    { name: 'Ocean Depths', colors: ['#0a1628', '#122c4a', '#1a3c5e', '#2980b9', '#5dade2'], tags: ['nature', 'cool', 'dark'] },
    { name: 'Cherry Blossom', colors: ['#ffb7c5', '#ff8fab', '#ff6b8a', '#fb6f92', '#ffc2d1'], tags: ['nature', 'pastel', 'warm'] },

    // Keycaps
    { name: 'GMK 8008', colors: ['#f44c7f', '#939eae', '#e8e0d5', '#333a45'], tags: ['keycaps', 'retro'] },
    { name: 'GMK Miami', colors: ['#39c4cf', '#f78da7', '#ffe156', '#ff6b6b'], tags: ['keycaps', 'vibrant', 'retro'] },
    { name: 'GMK Olivia', colors: ['#e8b4b8', '#2b2b2b', '#f5e6e8', '#1a1a1a'], tags: ['keycaps', 'dark'] },
    { name: 'GMK Dracula', colors: ['#282a36', '#44475a', '#f8f8f2', '#bd93f9', '#ff79c6'], tags: ['keycaps', 'dark'] },
    { name: 'GMK Botanical', colors: ['#2d5016', '#8fae1b', '#f0eada', '#3a3a3a'], tags: ['keycaps', 'nature'] },
    { name: 'SA Bliss', colors: ['#f5c2e0', '#3b3b3b', '#f7e2ef', '#e895c2'], tags: ['keycaps', 'pastel'] },
    { name: 'GMK Nord', colors: ['#2e3440', '#3b4252', '#88c0d0', '#5e81ac', '#eceff4'], tags: ['keycaps', 'cool'] },
    { name: 'GMK Solarized', colors: ['#002b36', '#073642', '#586e75', '#b58900', '#cb4b16'], tags: ['keycaps', 'retro'] },

    // Vintage
    { name: 'Wes Anderson', colors: ['#f2d9c7', '#c4956a', '#d05a5a', '#1e3d59', '#f5c34b'], tags: ['vintage', 'warm', 'retro'] },
    { name: 'Film Noir', colors: ['#0d0d0d', '#1a1a1a', '#333333', '#666666', '#999999'], tags: ['vintage', 'dark', 'minimal'] },
    { name: 'Polaroid', colors: ['#fff8e7', '#c9a96e', '#8b6d2e', '#4a3f35', '#eeeeee'], tags: ['vintage', 'warm', 'retro'] },
    { name: 'Art Deco', colors: ['#1c1c1c', '#c9a96e', '#d4af37', '#f5f5dc', '#2f4f4f'], tags: ['vintage', 'dark', 'bold'] },
    { name: 'Gatsby', colors: ['#0d1117', '#d4af37', '#b8860b', '#ffd700', '#1c2833'], tags: ['vintage', 'dark'] },
    { name: 'Hitchcock', colors: ['#1a1a1a', '#b30000', '#800000', '#d9d9d9', '#4d0000'], tags: ['vintage', 'dark', 'bold'] },
    { name: 'Kodachrome', colors: ['#e8401c', '#f09819', '#f5de19', '#53a653', '#2d8bc9'], tags: ['vintage', 'vibrant', 'retro'] },
    { name: 'Sepia', colors: ['#704214', '#c49a6c', '#e6ccb2', '#f0dfc8', '#f5eee0'], tags: ['vintage', 'warm'] },

    // Modern
    { name: 'Vercel', colors: ['#000000', '#111111', '#333333', '#666666', '#ffffff'], tags: ['modern', 'minimal', 'dark'] },
    { name: 'Linear', colors: ['#5e6ad2', '#26293b', '#f7f8f8', '#b8b9c1', '#454758'], tags: ['modern', 'cool'] },
    { name: 'Stripe', colors: ['#635bff', '#00d4ff', '#80e9ff', '#0a2540', '#425466'], tags: ['modern', 'vibrant'] },
    { name: 'Figma', colors: ['#f24e1e', '#ff7262', '#a259ff', '#1abcfe', '#0acf83'], tags: ['modern', 'vibrant'] },
    { name: 'GitHub', colors: ['#24292e', '#586069', '#6f42c1', '#0366d6', '#28a745'], tags: ['modern', 'cool'] },
    { name: 'Notion', colors: ['#2f3437', '#787774', '#9b9a97', '#e3e2e0', '#ffffff'], tags: ['modern', 'minimal'] },
    { name: 'Tailwind', colors: ['#06b6d4', '#3b82f6', '#8b5cf6', '#f43f5e', '#f97316'], tags: ['modern', 'vibrant'] },
    { name: 'Supabase', colors: ['#1c1c1c', '#3ecf8e', '#1f8547', '#24b47e', '#f0f0f0'], tags: ['modern', 'cool'] },

    // Bold
    { name: 'Tropical Punch', colors: ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#00d2d3'], tags: ['bold', 'vibrant'] },
    { name: 'Neon Sign', colors: ['#ff00ff', '#00ffff', '#ff3366', '#39ff14', '#ffff00'], tags: ['bold', 'vibrant', 'dark'] },
    { name: 'Carnival', colors: ['#e74c3c', '#f39c12', '#2ecc71', '#3498db', '#9b59b6'], tags: ['bold', 'vibrant'] },
    { name: 'Electric', colors: ['#7f00ff', '#e100ff', '#00bfff', '#39ff14', '#ff073a'], tags: ['bold', 'vibrant', 'dark'] },
    { name: 'Sunset Boulevard', colors: ['#ff416c', '#ff4b2b', '#f7971e', '#ffd200', '#a770ef'], tags: ['bold', 'warm', 'vibrant'] },
    { name: 'Pop Art', colors: ['#ff0000', '#ffff00', '#0000ff', '#00ff00', '#ff69b4'], tags: ['bold', 'vibrant', 'retro'] },
    { name: 'Candy', colors: ['#ff6f91', '#ff9671', '#ffc75f', '#f9f871', '#d65db1'], tags: ['bold', 'warm', 'vibrant'] },
    { name: 'Juicy', colors: ['#fc5c65', '#fd9644', '#f7b731', '#26de81', '#2bcbba'], tags: ['bold', 'vibrant'] },

    // Soft / Pastel
    { name: 'Cashmere', colors: ['#f1e3d3', '#d9c5b2', '#c4a882', '#b08968', '#9c6644'], tags: ['soft', 'warm', 'pastel'] },
    { name: 'Macaron', colors: ['#fbc4ab', '#f8ad9d', '#f4978e', '#ffdab9', '#fec89a'], tags: ['soft', 'warm', 'pastel'] },
    { name: 'Rose Quartz', colors: ['#f7cac9', '#f2b5d4', '#c9b1ff', '#b8e0d2', '#d6eadf'], tags: ['soft', 'pastel', 'cool'] },
    { name: 'Marshmallow', colors: ['#fdf2f8', '#fce7f3', '#fbcfe8', '#f9a8d4', '#f472b6'], tags: ['soft', 'pastel', 'warm'] },
    { name: 'Cloud', colors: ['#f0f4f8', '#d9e2ec', '#bcccdc', '#9fb3c8', '#829ab1'], tags: ['soft', 'cool', 'minimal'] },
    { name: 'Mint Tea', colors: ['#d4edda', '#c3e6cb', '#b1dfbb', '#a9dfbf', '#82e0aa'], tags: ['soft', 'cool', 'pastel'] },
    { name: 'Peach Blush', colors: ['#fdcb6e', '#fab1a0', '#ff7675', '#fd79a8', '#e17055'], tags: ['soft', 'warm'] },
    { name: 'Morning Mist', colors: ['#dfe6e9', '#b2bec3', '#74b9ff', '#a29bfe', '#dfe6e9'], tags: ['soft', 'cool', 'pastel'] },
    { name: 'Cotton Candy', colors: ['#ffb3ba', '#ffdfba', '#ffffba', '#baffc9', '#bae1ff'], tags: ['soft', 'pastel', 'vibrant'] },

    // Monochrome
    { name: 'Blue Mono', colors: ['#03045e', '#023e8a', '#0077b6', '#0096c7', '#48cae4', '#ade8f4'], tags: ['monochrome', 'cool'] },
    { name: 'Green Mono', colors: ['#1b4332', '#2d6a4f', '#40916c', '#52b788', '#74c69d', '#b7e4c7'], tags: ['monochrome', 'cool', 'nature'] },
    { name: 'Red Mono', colors: ['#641220', '#6e1423', '#85182a', '#a71e34', '#c71f37', '#e01e37'], tags: ['monochrome', 'warm', 'bold'] },
    { name: 'Purple Mono', colors: ['#240046', '#3c096c', '#5a189a', '#7b2cbf', '#9d4edd', '#c77dff'], tags: ['monochrome', 'cool'] },
    { name: 'Grey Mono', colors: ['#212529', '#343a40', '#495057', '#6c757d', '#adb5bd', '#dee2e6'], tags: ['monochrome', 'minimal'] },
    { name: 'Amber Mono', colors: ['#7c2d12', '#9a3412', '#c2410c', '#ea580c', '#f97316', '#fdba74'], tags: ['monochrome', 'warm'] },

    // Seasonal
    { name: 'Spring Bloom', colors: ['#b5e48c', '#99d98c', '#76c893', '#52b69a', '#34a0a4'], tags: ['seasonal', 'nature', 'cool'] },
    { name: 'Summer Vibes', colors: ['#ff6b6b', '#ffa502', '#ffc312', '#12cbc4', '#1289a7'], tags: ['seasonal', 'warm', 'vibrant'] },
    { name: 'Autumn Harvest', colors: ['#6b4226', '#b85c38', '#e08e45', '#f1c40f', '#d35400'], tags: ['seasonal', 'warm'] },
    { name: 'Winter Frost', colors: ['#dfe6e9', '#b2bec3', '#74b9ff', '#0984e3', '#2d3436'], tags: ['seasonal', 'cool'] },
    { name: 'Golden Hour', colors: ['#f39c12', '#f1c40f', '#e67e22', '#d35400', '#c0392b'], tags: ['seasonal', 'warm'] },
    { name: 'Midnight', colors: ['#0c0c1d', '#1a1a3e', '#2c2c54', '#40407a', '#706fd3'], tags: ['seasonal', 'dark', 'cool'] },

    // Artistic
    { name: 'Monet', colors: ['#6c88a1', '#89a7b8', '#b3cdd1', '#d4e4e0', '#f0ede5'], tags: ['artistic', 'cool', 'pastel'] },
    { name: 'Van Gogh', colors: ['#1b3a4b', '#2e6f95', '#f2c94c', '#f2994a', '#eb5757'], tags: ['artistic', 'vibrant'] },
    { name: 'Mondrian', colors: ['#ffffff', '#000000', '#dd0100', '#fac901', '#225095'], tags: ['artistic', 'bold', 'minimal'] },
    { name: 'Rothko', colors: ['#7b2d26', '#c0392b', '#e74c3c', '#f5b7b1', '#fadbd8'], tags: ['artistic', 'warm'] },
    { name: 'Hokusai', colors: ['#1a3c5e', '#2980b9', '#5dade2', '#aed6f1', '#d6eaf8'], tags: ['artistic', 'cool'] },
    { name: 'Matisse', colors: ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#1a1a2e'], tags: ['artistic', 'vibrant', 'bold'] },
    { name: 'Klimt', colors: ['#d4af37', '#c9a96e', '#8b6d2e', '#4a3f35', '#f5f5dc'], tags: ['artistic', 'warm'] },
    { name: 'Bauhaus', colors: ['#e74c3c', '#2d6ef6', '#f1c40f', '#1a1a1a', '#f5f5f5'], tags: ['artistic', 'bold', 'minimal'] },

    // Retro
    { name: 'Synthwave', colors: ['#2b1055', '#7303c0', '#ec38bc', '#fdeff9', '#ff077f'], tags: ['retro', 'dark', 'vibrant'] },
    { name: 'Vaporwave', colors: ['#ff71ce', '#01cdfe', '#05ffa1', '#b967ff', '#fffb96'], tags: ['retro', 'vibrant', 'pastel'] },
    { name: '70s Groove', colors: ['#b85c38', '#e08e45', '#f8c291', '#6ab04c', '#eb4d4b'], tags: ['retro', 'warm'] },
    { name: '80s Memphis', colors: ['#ff6b6b', '#feca57', '#48dbfb', '#1dd1a1', '#f368e0'], tags: ['retro', 'vibrant', 'bold'] },
    { name: '90s Grunge', colors: ['#2c3e50', '#7f8c8d', '#95a5a6', '#bdc3c7', '#6c3483'], tags: ['retro', 'dark'] },
    { name: 'Retro Terminal', colors: ['#0c0c0c', '#00ff41', '#008f11', '#003b00', '#1a1a1a'], tags: ['retro', 'dark', 'minimal'] },
    { name: 'Pixel Art', colors: ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71', '#8e44ad', '#ffffff'], tags: ['retro', 'vibrant'] },

    // Misc curated
    { name: 'Dracula Theme', colors: ['#282a36', '#44475a', '#f8f8f2', '#bd93f9', '#ff79c6', '#50fa7b'], tags: ['dark', 'modern'] },
    { name: 'Nord Theme', colors: ['#2e3440', '#3b4252', '#434c5e', '#d8dee9', '#88c0d0', '#81a1c1'], tags: ['dark', 'cool', 'modern'] },
    { name: 'Catppuccin', colors: ['#1e1e2e', '#313244', '#cdd6f4', '#f38ba8', '#a6e3a1', '#89b4fa'], tags: ['dark', 'modern', 'pastel'] },
    { name: 'Gruvbox', colors: ['#282828', '#3c3836', '#ebdbb2', '#fb4934', '#b8bb26', '#fabd2f'], tags: ['dark', 'retro', 'warm'] },
    { name: 'One Dark', colors: ['#282c34', '#3e4451', '#abb2bf', '#e06c75', '#98c379', '#61afef'], tags: ['dark', 'modern'] },
    { name: 'Tokyo Night', colors: ['#1a1b26', '#24283b', '#c0caf5', '#ff9e64', '#7aa2f7', '#bb9af7'], tags: ['dark', 'modern', 'cool'] },
    { name: 'Earth Tones', colors: ['#5c4033', '#8b6914', '#c2b280', '#d2b48c', '#f5f5dc'], tags: ['warm', 'nature'] },
    { name: 'Ocean Breeze', colors: ['#006994', '#0099cc', '#66cccc', '#99e5e5', '#ccf2f2'], tags: ['cool', 'nature'] },
    { name: 'Terracotta', colors: ['#8c4a2f', '#c67a4e', '#e0a170', '#f0c9a6', '#f7e4d0'], tags: ['warm', 'nature'] },
    { name: 'Sage & Stone', colors: ['#808f7c', '#a3b18a', '#dad7cd', '#e9e5df', '#f5f1eb'], tags: ['nature', 'minimal', 'cool'] },
  ]

  // ── Collect all unique tags ──
  var allTags = {}
  for (var i = 0; i < PALETTES.length; i++) {
    for (var j = 0; j < PALETTES[i].tags.length; j++) {
      allTags[PALETTES[i].tags[j]] = (allTags[PALETTES[i].tags[j]] || 0) + 1
    }
  }
  // Sort tags by frequency
  var tagList = Object.keys(allTags).sort(function (a, b) { return allTags[b] - allTags[a] })

  // ── DOM refs ──
  var searchInput = document.getElementById('pc-search')
  var tagsContainer = document.getElementById('pc-tags')
  var countEl = document.getElementById('pc-count')
  var gridEl = document.getElementById('pc-grid')

  var activeTag = ''

  // ── Render tag buttons ──
  function renderTags() {
    tagsContainer.innerHTML = ''
    var btn = document.createElement('button')
    btn.className = 'pc-tag' + (activeTag === '' ? ' active' : '')
    btn.textContent = 'All'
    btn.addEventListener('click', function () { activeTag = ''; render() })
    tagsContainer.appendChild(btn)

    for (var i = 0; i < tagList.length; i++) {
      ;(function (tag) {
        var b = document.createElement('button')
        b.className = 'pc-tag' + (activeTag === tag ? ' active' : '')
        b.textContent = tag + ' (' + allTags[tag] + ')'
        b.addEventListener('click', function () {
          activeTag = activeTag === tag ? '' : tag
          render()
        })
        tagsContainer.appendChild(b)
      })(tagList[i])
    }
  }

  // ── Filter palettes ──
  function getFiltered() {
    var q = searchInput.value.trim().toLowerCase()
    return PALETTES.filter(function (p) {
      if (activeTag && p.tags.indexOf(activeTag) === -1) return false
      if (!q) return true
      if (p.name.toLowerCase().indexOf(q) !== -1) return true
      for (var t = 0; t < p.tags.length; t++) {
        if (p.tags[t].indexOf(q) !== -1) return true
      }
      // Search by hex color
      for (var c = 0; c < p.colors.length; c++) {
        if (p.colors[c].toLowerCase().indexOf(q) !== -1) return true
      }
      return false
    })
  }

  // ── Copy helpers ──
  function copyText(text, el, origText) {
    navigator.clipboard.writeText(text).then(function () {
      el.classList.add('copied')
      if (origText !== undefined) {
        var prev = el.textContent
        el.textContent = 'Copied!'
        setTimeout(function () {
          el.classList.remove('copied')
          el.textContent = prev
        }, 2000)
      } else {
        setTimeout(function () { el.classList.remove('copied') }, 2000)
      }
    })
  }

  // ── Render grid ──
  function renderGrid(palettes) {
    gridEl.innerHTML = ''
    countEl.textContent = palettes.length + ' palette' + (palettes.length !== 1 ? 's' : '')

    for (var i = 0; i < palettes.length; i++) {
      var p = palettes[i]
      var card = document.createElement('div')
      card.className = 'pc-card'

      // Color swatches row
      var colorsRow = document.createElement('div')
      colorsRow.className = 'pc-colors'
      for (var c = 0; c < p.colors.length; c++) {
        ;(function (hex) {
          var swatch = document.createElement('div')
          swatch.className = 'pc-color-swatch'
          swatch.style.background = hex
          var hexLabel = document.createElement('span')
          hexLabel.className = 'pc-swatch-hex'
          hexLabel.textContent = hex
          swatch.appendChild(hexLabel)
          swatch.addEventListener('click', function () {
            copyText(hex, swatch)
            hexLabel.textContent = 'Copied!'
            setTimeout(function () { hexLabel.textContent = hex }, 2000)
          })
          colorsRow.appendChild(swatch)
        })(p.colors[c])
      }

      // Info row
      var info = document.createElement('div')
      info.className = 'pc-card-info'

      var nameBtn = document.createElement('button')
      nameBtn.className = 'pc-card-name'
      nameBtn.textContent = p.name
      ;(function (palette, nameEl) {
        nameEl.addEventListener('click', function () {
          var css = palette.colors.map(function (hex, idx) {
            return '  --palette-' + (idx + 1) + ': ' + hex + ';'
          }).join('\n')
          var text = '/* ' + palette.name + ' */\n:root {\n' + css + '\n}'
          copyText(text, nameEl, nameEl.textContent)
        })
      })(p, nameBtn)

      var tagsDiv = document.createElement('div')
      tagsDiv.className = 'pc-card-tags'
      for (var t = 0; t < p.tags.length; t++) {
        var tagSpan = document.createElement('span')
        tagSpan.className = 'pc-card-tag'
        tagSpan.textContent = p.tags[t]
        tagsDiv.appendChild(tagSpan)
      }

      info.appendChild(nameBtn)
      info.appendChild(tagsDiv)
      card.appendChild(colorsRow)
      card.appendChild(info)
      gridEl.appendChild(card)
    }
  }

  // ── Main render ──
  function render() {
    renderTags()
    renderGrid(getFiltered())
  }

  // ── Events ──
  searchInput.addEventListener('input', function () {
    renderGrid(getFiltered())
  })

  // ── Init ──
  render()
})()
