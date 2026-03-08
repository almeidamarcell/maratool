(function () {
  // ── DOM refs ──
  var generateBtn = document.getElementById('pg-generate')
  var strategySelect = document.getElementById('pg-strategy')
  var strategyDesc = document.getElementById('pg-strategy-desc')
  var countEl = document.getElementById('pg-count')
  var countMinus = document.getElementById('pg-count-minus')
  var countPlus = document.getElementById('pg-count-plus')
  var stripEl = document.getElementById('pg-strip')
  var coloursEl = document.getElementById('pg-colours')

  // Export
  var exportHex = document.getElementById('pg-export-hex')
  var exportCss = document.getElementById('pg-export-css')
  var exportJson = document.getElementById('pg-export-json')
  var exportImg = document.getElementById('pg-export-img')

  // ── Constants ──
  var MIN_COLOURS = 2
  var MAX_COLOURS = 11

  // ── State ──
  var colours = [] // { id, hex, locked }
  var count = 5
  var strategy = 'random-cohesive'
  var nextId = 0

  // ── Strategy info ──
  var STRATEGIES = {
    'true-random': { name: 'Chaos', desc: 'Completely random, no rules', cat: 'Random' },
    'random-cohesive': { name: 'Random', desc: 'Random cohesive palette', cat: 'Random' },
    'analogous': { name: 'Analogous', desc: 'Adjacent hues on the colour wheel', cat: 'Color Theory' },
    'complementary': { name: 'Complementary', desc: 'Opposite hues for high contrast', cat: 'Color Theory' },
    'triadic': { name: 'Triadic', desc: 'Three evenly spaced hues', cat: 'Color Theory' },
    'split-complementary': { name: 'Split-Comp', desc: 'Base + two adjacent to complement', cat: 'Color Theory' },
    'tetradic': { name: 'Tetradic', desc: 'Four evenly spaced hues', cat: 'Color Theory' },
    'monochromatic': { name: 'Mono', desc: 'Single hue, varied lightness', cat: 'Color Theory' },
    'thermos': { name: 'Thermos', desc: 'Warm, cozy, retro tones', cat: 'Moods' },
    'specimen': { name: 'Specimen', desc: 'Cool, clinical, preserved', cat: 'Moods' },
    'souvenir': { name: 'Souvenir', desc: 'Soft, faded pastels', cat: 'Moods' },
    'curfew': { name: 'Curfew', desc: 'Dark, moody depths', cat: 'Moods' },
    'telegraph': { name: 'Telegraph', desc: 'Muted vintage sepia', cat: 'Moods' },
    '70s': { name: '1970s', desc: 'Earth tones, burnt orange, avocado', cat: 'Decades' },
    '80s': { name: '1980s', desc: 'Neon pink, electric blue, hot purple', cat: 'Decades' },
    '90s': { name: '1990s', desc: 'Grunge, forest green, burgundy', cat: 'Decades' },
    'y2k': { name: 'Y2K', desc: 'Chrome, cyan, magenta', cat: 'Decades' },
    'ocean-sunset': { name: 'Ocean Sunset', desc: 'Coral, rose, ocean blue, dusk', cat: 'Nature' },
    'forest-morning': { name: 'Forest Morning', desc: 'Fresh greens, mist, golden light', cat: 'Nature' },
    'desert-dusk': { name: 'Desert Dusk', desc: 'Terracotta, sand, dusty rose', cat: 'Nature' },
    'arctic': { name: 'Arctic', desc: 'Ice blue, white, pale cyan', cat: 'Nature' },
    'volcanic': { name: 'Volcanic', desc: 'Black, deep red, orange, ash', cat: 'Nature' },
    'meadow': { name: 'Meadow', desc: 'Grass green, wildflowers, sky blue', cat: 'Nature' },
    'bauhaus': { name: 'Bauhaus', desc: 'Primary colors, geometric, bold', cat: 'Culture' },
    'art-deco': { name: 'Art Deco', desc: 'Gold, black, cream, emerald', cat: 'Culture' },
    'japanese': { name: 'Japanese', desc: 'Indigo, vermillion, gold, cream', cat: 'Culture' },
    'scandinavian': { name: 'Scandinavian', desc: 'White, pale grey, muted pastels', cat: 'Culture' },
    'mexican': { name: 'Mexican', desc: 'Hot pink, orange, turquoise, yellow', cat: 'Culture' }
  }

  // ── OKLCH colour utilities ──

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(function (x) {
      return Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')
    }).join('')
  }

  function hexToRgb(hex) {
    var r = parseInt(hex.slice(1, 3), 16)
    var g = parseInt(hex.slice(3, 5), 16)
    var b = parseInt(hex.slice(5, 7), 16)
    return [r, g, b]
  }

  function linearToSrgb(c) {
    var v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
    return Math.max(0, Math.min(255, v * 255))
  }

  function oklchToRgb(L, c, h) {
    var hRad = h * Math.PI / 180
    var a = c * Math.cos(hRad)
    var b = c * Math.sin(hRad)
    var l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3)
    var m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3)
    var s = Math.pow(L - 0.0894841775 * a - 1.2914855480 * b, 3)
    var lr = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
    var lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
    var lb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
    return [linearToSrgb(lr), linearToSrgb(lg), linearToSrgb(lb)]
  }

  function oklchToHex(L, c, h) {
    L = Math.max(0, Math.min(1, L))
    c = Math.max(0, Math.min(0.4, c))
    h = ((h % 360) + 360) % 360
    var rgb = oklchToRgb(L, c, h)
    return rgbToHex(Math.round(rgb[0]), Math.round(rgb[1]), Math.round(rgb[2]))
  }

  function rand(min, max) { return Math.random() * (max - min) + min }

  function randomBase() {
    return [rand(0.4, 0.75), rand(0.08, 0.2), rand(0, 360)]
  }

  function pickFromRanges(ranges, defL, defC) {
    var total = 0
    for (var i = 0; i < ranges.length; i++) total += ranges[i].w
    var r = Math.random() * total
    var sel = ranges[0]
    for (var j = 0; j < ranges.length; j++) {
      r -= ranges[j].w
      if (r <= 0) { sel = ranges[j]; break }
    }
    var h = rand(sel.h[0], sel.h[1])
    var L = rand(sel.L ? sel.L[0] : defL[0], sel.L ? sel.L[1] : defL[1])
    var c = rand(sel.C ? sel.C[0] : defC[0], sel.C ? sel.C[1] : defC[1])
    return oklchToHex(L, c, h)
  }

  // ── Luminance for text contrast ──

  function luminance(r, g, b) {
    var rs = r / 255, gs = g / 255, bs = b / 255
    rs = rs <= 0.03928 ? rs / 12.92 : Math.pow((rs + 0.055) / 1.055, 2.4)
    gs = gs <= 0.03928 ? gs / 12.92 : Math.pow((gs + 0.055) / 1.055, 2.4)
    bs = bs <= 0.03928 ? bs / 12.92 : Math.pow((bs + 0.055) / 1.055, 2.4)
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  }

  function textColor(hex) {
    var rgb = hexToRgb(hex)
    return luminance(rgb[0], rgb[1], rgb[2]) > 0.4 ? '#000000' : '#ffffff'
  }

  // ── RGB to OKLCH (for display) ──

  function srgbToLinear(v) {
    v = v / 255
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  }

  function rgbToOklch(r, g, b) {
    var lr = srgbToLinear(r), lg = srgbToLinear(g), lb = srgbToLinear(b)
    var l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb
    var m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb
    var s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb
    l = Math.cbrt(l); m = Math.cbrt(m); s = Math.cbrt(s)
    var L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s
    var a = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s
    var bv = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
    var C = Math.sqrt(a * a + bv * bv)
    var H = Math.atan2(bv, a) * 180 / Math.PI
    if (H < 0) H += 360
    return [L, C, H]
  }

  // ── Color name database (curated ~200 names) ──

  var COLOR_NAMES = [
    ['#000000','Black'],['#1a1a2e','Midnight'],['#16213e','Dark Navy'],['#0f3460','Royal Blue'],
    ['#533483','Grape'],['#e94560','Crimson Pink'],['#ffffff','White'],['#f5f5f5','White Smoke'],
    ['#dcdcdc','Gainsboro'],['#c0c0c0','Silver'],['#a9a9a9','Dark Gray'],['#808080','Gray'],
    ['#696969','Dim Gray'],['#404040','Charcoal'],['#ff0000','Red'],['#ff4500','Orange Red'],
    ['#ff6347','Tomato'],['#ff7f50','Coral'],['#fa8072','Salmon'],['#e9967a','Dark Salmon'],
    ['#f08080','Light Coral'],['#cd5c5c','Indian Red'],['#dc143c','Crimson'],['#b22222','Firebrick'],
    ['#8b0000','Dark Red'],['#800000','Maroon'],['#ff6600','Blaze Orange'],['#ff8c00','Dark Orange'],
    ['#ffa500','Orange'],['#ffd700','Gold'],['#ffff00','Yellow'],['#ffffe0','Light Yellow'],
    ['#fffacd','Lemon Chiffon'],['#fafad2','Light Goldenrod'],['#ffefd5','Papaya Whip'],
    ['#ffe4b5','Moccasin'],['#ffdab9','Peach Puff'],['#eee8aa','Pale Goldenrod'],
    ['#f0e68c','Khaki'],['#bdb76b','Dark Khaki'],['#adff2f','Green Yellow'],['#7fff00','Chartreuse'],
    ['#7cfc00','Lawn Green'],['#00ff00','Lime'],['#32cd32','Lime Green'],['#98fb98','Pale Green'],
    ['#90ee90','Light Green'],['#00fa9a','Medium Spring'],['#00ff7f','Spring Green'],
    ['#3cb371','Medium Sea Green'],['#2e8b57','Sea Green'],['#228b22','Forest Green'],
    ['#008000','Green'],['#006400','Dark Green'],['#9acd32','Yellow Green'],['#6b8e23','Olive Drab'],
    ['#556b2f','Dark Olive'],['#66cdaa','Medium Aquamarine'],['#8fbc8f','Dark Sea Green'],
    ['#20b2aa','Light Sea Green'],['#008b8b','Dark Cyan'],['#008080','Teal'],
    ['#00ffff','Cyan'],['#e0ffff','Light Cyan'],['#afeeee','Pale Turquoise'],
    ['#7fffd4','Aquamarine'],['#40e0d0','Turquoise'],['#48d1cc','Medium Turquoise'],
    ['#00ced1','Dark Turquoise'],['#5f9ea0','Cadet Blue'],['#4682b4','Steel Blue'],
    ['#b0c4de','Light Steel Blue'],['#b0e0e6','Powder Blue'],['#add8e6','Light Blue'],
    ['#87ceeb','Sky Blue'],['#87cefa','Light Sky Blue'],['#00bfff','Deep Sky Blue'],
    ['#1e90ff','Dodger Blue'],['#6495ed','Cornflower Blue'],['#4169e1','Royal Blue'],
    ['#0000ff','Blue'],['#0000cd','Medium Blue'],['#00008b','Dark Blue'],['#000080','Navy'],
    ['#191970','Midnight Blue'],['#e6e6fa','Lavender'],['#d8bfd8','Thistle'],['#dda0dd','Plum'],
    ['#ee82ee','Violet'],['#da70d6','Orchid'],['#ff00ff','Magenta'],['#ba55d3','Medium Orchid'],
    ['#9370db','Medium Purple'],['#8a2be2','Blue Violet'],['#9400d3','Dark Violet'],
    ['#9932cc','Dark Orchid'],['#8b008b','Dark Magenta'],['#800080','Purple'],
    ['#4b0082','Indigo'],['#6a5acd','Slate Blue'],['#483d8b','Dark Slate Blue'],
    ['#7b68ee','Medium Slate Blue'],['#ffc0cb','Pink'],['#ffb6c1','Light Pink'],
    ['#ff69b4','Hot Pink'],['#ff1493','Deep Pink'],['#c71585','Medium Violet Red'],
    ['#db7093','Pale Violet Red'],['#fff8dc','Cornsilk'],['#ffebcd','Blanched Almond'],
    ['#ffe4c4','Bisque'],['#ffdead','Navajo White'],['#f5deb3','Wheat'],['#deb887','Burlywood'],
    ['#d2b48c','Tan'],['#bc8f8f','Rosy Brown'],['#f4a460','Sandy Brown'],['#daa520','Goldenrod'],
    ['#b8860b','Dark Goldenrod'],['#cd853f','Peru'],['#d2691e','Chocolate'],['#8b4513','Saddle Brown'],
    ['#a0522d','Sienna'],['#a52a2a','Brown'],['#fff5ee','Seashell'],['#fdf5e6','Old Lace'],
    ['#faf0e6','Linen'],['#faebd7','Antique White'],['#f5f5dc','Beige'],['#f0f0e0','Ivory Cream'],
    ['#ffe5d0','Peach'],['#c9a0dc','Wisteria'],['#ff7eb3','Flamingo'],['#7ec8e3','Baby Blue'],
    ['#c4e17f','Yellow Green'],['#76d7c4','Mint'],['#f7dc6f','Dandelion'],['#e59866','Apricot'],
    ['#af7ac5','Amethyst'],['#45b39d','Jade'],['#f0b27a','Sandy'],['#85c1e9','Bluebell'],
    ['#82e0aa','Seafoam'],['#d7bde2','Mauve'],['#f9e79f','Buttercup'],['#abebc6','Pistachio'],
    ['#a3e4d7','Mint Cream'],['#fadbd8','Blush'],['#d5f5e3','Honeydew'],['#ebdef0','Lilac'],
    ['#fdebd0','Champagne'],['#d4efdf','Sage'],['#d6eaf8','Ice Blue'],['#e8daef','Heather'],
    ['#fcf3cf','Cream'],['#eafaf1','Mint White'],['#fdedec','Rose White'],['#f2f3f4','Platinum'],
    ['#273746','Gunmetal'],['#1b2631','Obsidian'],['#17202a','Onyx'],['#2e4053','Dark Slate'],
    ['#34495e','Wet Asphalt'],['#5d6d7e','Slate'],['#85929e','Cool Gray'],['#aeb6bf','Silver Sand'],
    ['#d5dbdb','Light Gray'],['#566573','Storm'],['#641e16','Oxblood'],['#78281f','Burgundy'],
    ['#943126','Rust Red'],['#c0392b','Alizarin'],['#e74c3c','Vermillion'],['#ec7063','Pastel Red'],
    ['#f1948a','Melon'],['#f5b7b1','Rose'],['#7b241c','Wine'],['#922b21','Carmine'],
    ['#6e2c00','Espresso'],['#784212','Sepia'],['#9c640c','Amber'],['#b9770e','Butterscotch'],
    ['#d4ac0d','Saffron'],['#f1c40f','Sunflower'],['#f4d03f','Banana'],['#f7dc6f','Jasmine'],
    ['#0e6251','Pine'],['#148f77','Emerald'],['#1abc9c','Turquoise'],['#48c9b0','Medium Aqua'],
    ['#76d7c4','Light Teal'],['#a2d9ce','Pale Aqua'],['#0b5345','Dark Emerald'],['#117a65','Malachite'],
    ['#1a5276','Prussian Blue'],['#2471a3','Cerulean'],['#2e86c1','Azure'],['#5dade2','Maya Blue'],
    ['#85c1e9','Light Azure'],['#aed6f1','Periwinkle'],['#154360','Sapphire'],['#1f618d','Lapis'],
    ['#6c3483','Plum Purple'],['#8e44ad','Violet'],['#a569bd','Lavender Purple'],
    ['#bb8fce','Light Purple'],['#d2b4de','Pale Lavender'],['#512e5f','Eggplant'],['#76448a','Mulberry'],
    ['#196f3d','Clover'],['#27ae60','Shamrock'],['#2ecc71','Emerald Green'],['#58d68d','Light Emerald'],
    ['#82e0aa','Celadon'],['#abebc6','Mint Green'],['#186a3b','Holly'],['#1e8449','Lucky Green']
  ]

  var _nameCache = null
  function getColorNames() {
    if (_nameCache) return _nameCache
    _nameCache = COLOR_NAMES.map(function (c) {
      var rgb = hexToRgb(c[0])
      return { name: c[1], r: rgb[0], g: rgb[1], b: rgb[2] }
    })
    return _nameCache
  }

  function getColourName(hex) {
    var rgb = hexToRgb(hex)
    var names = getColorNames()
    var best = 'Unknown'
    var minDist = Infinity
    for (var i = 0; i < names.length; i++) {
      var dr = rgb[0] - names[i].r
      var dg = rgb[1] - names[i].g
      var db = rgb[2] - names[i].b
      var d = dr * dr + dg * dg + db * db
      if (d < minDist) { minDist = d; best = names[i].name }
      if (d === 0) break
    }
    return best
  }

  // ── Palette generation strategies ──

  function genAnalogous(n) {
    var b = randomBase(), spread = 40, step = spread / (n - 1), start = b[2] - spread / 2
    return Array.from({ length: n }, function (_, i) {
      return oklchToHex(b[0] + rand(-0.1, 0.1), b[1] + rand(-0.05, 0.05), start + step * i)
    })
  }

  function genComplementary(n) {
    var b = randomBase(), comp = (b[2] + 180) % 360, half = Math.ceil(n / 2), out = []
    for (var i = 0; i < half; i++) out.push(oklchToHex(b[0] + rand(-0.15, 0.15), b[1] + rand(-0.05, 0.05), b[2] + rand(-15, 15)))
    for (var j = half; j < n; j++) out.push(oklchToHex(b[0] + rand(-0.15, 0.15), b[1] + rand(-0.05, 0.05), comp + rand(-15, 15)))
    return out
  }

  function genTriadic(n) {
    var b = randomBase(), angles = [b[2], (b[2] + 120) % 360, (b[2] + 240) % 360]
    return Array.from({ length: n }, function (_, i) {
      return oklchToHex(b[0] + rand(-0.15, 0.15), b[1] + rand(-0.05, 0.05), angles[i % 3] + rand(-10, 10))
    })
  }

  function genSplitComp(n) {
    var b = randomBase(), angles = [b[2], (b[2] + 150) % 360, (b[2] + 210) % 360]
    return Array.from({ length: n }, function (_, i) {
      return oklchToHex(b[0] + rand(-0.15, 0.15), b[1] + rand(-0.05, 0.05), angles[i % 3] + rand(-10, 10))
    })
  }

  function genTetradic(n) {
    var b = randomBase(), angles = [b[2], (b[2] + 90) % 360, (b[2] + 180) % 360, (b[2] + 270) % 360]
    return Array.from({ length: n }, function (_, i) {
      return oklchToHex(b[0] + rand(-0.15, 0.15), b[1] + rand(-0.05, 0.05), angles[i % 4] + rand(-10, 10))
    })
  }

  function genMono(n) {
    var h = rand(0, 360), baseC = rand(0.1, 0.2), step = 0.55 / (n - 1)
    return Array.from({ length: n }, function (_, i) {
      var L = 0.85 - step * i, cMod = (L < 0.4 || L > 0.75) ? 0.7 : 1
      return oklchToHex(L, baseC * cMod, h)
    })
  }

  function genCohesive(n) {
    var fns = [genAnalogous, genComplementary, genTriadic, genSplitComp, genTetradic, genMono]
    return fns[Math.floor(Math.random() * fns.length)](n)
  }

  function genTrueRandom(n) {
    return Array.from({ length: n }, function () {
      return rgbToHex(Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256))
    })
  }

  function genSimple(n, hRange, lRange, cRange) {
    return Array.from({ length: n }, function () {
      return oklchToHex(rand(lRange[0], lRange[1]), rand(cRange[0], cRange[1]), rand(hRange[0], hRange[1]))
    })
  }

  function genFromRanges(n, ranges, defL, defC) {
    return Array.from({ length: n }, function () { return pickFromRanges(ranges, defL, defC) })
  }

  function genWithSpecial(n, specialChance, specialFn, ranges, defL, defC) {
    return Array.from({ length: n }, function () {
      return Math.random() < specialChance ? specialFn() : pickFromRanges(ranges, defL, defC)
    })
  }

  function generatePalette(n, strat) {
    switch (strat) {
      case 'true-random': return genTrueRandom(n)
      case 'random-cohesive': return genCohesive(n)
      case 'analogous': return genAnalogous(n)
      case 'complementary': return genComplementary(n)
      case 'triadic': return genTriadic(n)
      case 'split-complementary': return genSplitComp(n)
      case 'tetradic': return genTetradic(n)
      case 'monochromatic': return genMono(n)
      case 'thermos': return genSimple(n, [15, 55], [0.45, 0.75], [0.08, 0.18])
      case 'specimen': return genSimple(n, [170, 220], [0.6, 0.9], [0.03, 0.12])
      case 'souvenir': return genSimple(n, [0, 360], [0.75, 0.92], [0.04, 0.10])
      case 'curfew': return genSimple(n, [0, 360], [0.15, 0.35], [0.05, 0.15])
      case 'telegraph': return genSimple(n, [30, 60], [0.4, 0.7], [0.02, 0.08])
      case '70s': return genFromRanges(n, [{ h: [25, 45], w: 3 }, { h: [75, 100], w: 2 }, { h: [15, 30], w: 2 }, { h: [45, 65], w: 1 }], [0.35, 0.65], [0.08, 0.18])
      case '80s': return genWithSpecial(n, 0.2, function () { return oklchToHex(rand(0.12, 0.22), rand(0.02, 0.08), rand(0, 360)) }, [{ h: [320, 350], w: 3 }, { h: [220, 270], w: 2 }, { h: [280, 320], w: 2 }, { h: [170, 200], w: 1 }], [0.55, 0.75], [0.18, 0.30])
      case '90s': return genFromRanges(n, [{ h: [140, 170], w: 2 }, { h: [350, 380], w: 2 }, { h: [220, 250], w: 2 }, { h: [30, 50], w: 1 }], [0.30, 0.55], [0.05, 0.14])
      case 'y2k': return genWithSpecial(n, 0.3, function () { return oklchToHex(rand(0.7, 0.88), rand(0.01, 0.04), rand(200, 280)) }, [{ h: [180, 200], w: 2 }, { h: [310, 340], w: 2 }, { h: [260, 290], w: 1 }, { h: [50, 70], w: 1 }], [0.55, 0.75], [0.15, 0.28])
      case 'ocean-sunset': return genFromRanges(n, [{ h: [15, 40], w: 2, L: [0.6, 0.75] }, { h: [340, 360], w: 2, L: [0.55, 0.7] }, { h: [200, 230], w: 2, L: [0.35, 0.55] }, { h: [260, 290], w: 1, L: [0.25, 0.45] }], [0.45, 0.7], [0.1, 0.2])
      case 'forest-morning': return genWithSpecial(n, 0.25, function () { return oklchToHex(rand(0.8, 0.92), rand(0.02, 0.06), rand(90, 150)) }, [{ h: [100, 140], w: 3 }, { h: [75, 100], w: 2 }, { h: [45, 60], w: 1 }, { h: [25, 40], w: 1 }], [0.4, 0.7], [0.08, 0.18])
      case 'desert-dusk': return genFromRanges(n, [{ h: [15, 35], w: 3, L: [0.45, 0.65] }, { h: [40, 55], w: 2, L: [0.7, 0.85] }, { h: [350, 375], w: 2, L: [0.55, 0.7] }, { h: [280, 310], w: 1, L: [0.25, 0.4] }], [0.45, 0.7], [0.06, 0.16])
      case 'arctic': return genWithSpecial(n, 0.3, function () { return oklchToHex(rand(0.92, 0.98), rand(0.005, 0.02), rand(200, 220)) }, [{ h: [200, 220], w: 3 }, { h: [180, 200], w: 2 }, { h: [220, 250], w: 1 }], [0.7, 0.9], [0.02, 0.08])
      case 'volcanic': return genWithSpecial(n, 0.25, function () { return oklchToHex(rand(0.12, 0.22), rand(0.01, 0.03), rand(0, 360)) }, [{ h: [0, 20], w: 2 }, { h: [20, 45], w: 2 }, { h: [45, 60], w: 1 }], [0.4, 0.65], [0.15, 0.25])
      case 'meadow': return genFromRanges(n, [{ h: [100, 135], w: 3 }, { h: [280, 320], w: 2 }, { h: [55, 75], w: 2 }, { h: [200, 220], w: 1 }], [0.55, 0.75], [0.12, 0.22])
      case 'bauhaus': return genWithSpecial(n, 0.2, function () { return Math.random() < 0.5 ? oklchToHex(rand(0.08, 0.18), rand(0, 0.02), rand(0, 360)) : oklchToHex(rand(0.92, 0.97), rand(0.01, 0.025), rand(80, 100)) }, [{ h: [15, 35], w: 3, L: [0.5, 0.62], C: [0.18, 0.26] }, { h: [85, 105], w: 3, L: [0.8, 0.88], C: [0.14, 0.2] }, { h: [240, 265], w: 3, L: [0.4, 0.52], C: [0.12, 0.18] }, { h: [0, 15], w: 1, L: [0.45, 0.55], C: [0.2, 0.26] }], [0.5, 0.7], [0.15, 0.22])
      case 'art-deco': return genWithSpecial(n, 0.4, function () { var r = Math.random(); if (r < 0.4) return oklchToHex(rand(0.7, 0.8), rand(0.12, 0.18), rand(85, 100)); if (r < 0.7) return oklchToHex(rand(0.12, 0.2), rand(0.01, 0.03), rand(0, 360)); return oklchToHex(rand(0.9, 0.96), rand(0.015, 0.03), rand(80, 100)) }, [{ h: [155, 175], w: 2 }, { h: [180, 200], w: 1 }, { h: [0, 15], w: 1 }], [0.35, 0.55], [0.1, 0.18])
      case 'japanese': return genWithSpecial(n, 0.15, function () { return oklchToHex(rand(0.88, 0.95), rand(0.01, 0.03), rand(70, 100)) }, [{ h: [245, 270], w: 3, L: [0.25, 0.45], C: [0.06, 0.14] }, { h: [18, 35], w: 2, L: [0.45, 0.58], C: [0.14, 0.22] }, { h: [75, 95], w: 2, L: [0.7, 0.82], C: [0.1, 0.16] }, { h: [120, 145], w: 2, L: [0.35, 0.5], C: [0.06, 0.12] }, { h: [290, 320], w: 1, L: [0.5, 0.7], C: [0.08, 0.14] }, { h: [340, 360], w: 1, L: [0.75, 0.88], C: [0.06, 0.12] }], [0.4, 0.6], [0.08, 0.15])
      case 'scandinavian': return genWithSpecial(n, 0.35, function () { return oklchToHex(rand(0.93, 0.98), rand(0.005, 0.015), rand(80, 110)) }, [{ h: [200, 260], w: 2, L: [0.8, 0.9], C: [0.005, 0.015] }, { h: [0, 360], w: 2, L: [0.8, 0.9], C: [0.02, 0.05] }, { h: [50, 80], w: 1, L: [0.55, 0.7], C: [0.04, 0.08] }], [0.8, 0.9], [0.01, 0.04])
      case 'mexican': return genFromRanges(n, [{ h: [330, 350], w: 2 }, { h: [20, 40], w: 2 }, { h: [175, 195], w: 2 }, { h: [55, 70], w: 2 }, { h: [280, 310], w: 1 }], [0.55, 0.72], [0.18, 0.28])
      default: return genCohesive(n)
    }
  }

  // ── Core logic ──

  function regenerate() {
    var hexes = generatePalette(count, strategy)
    var newColours = []
    var lockedIdx = 0
    for (var i = 0; i < count; i++) {
      if (colours[i] && colours[i].locked) {
        newColours.push(colours[i])
      } else {
        newColours.push({ id: nextId++, hex: hexes[lockedIdx] || hexes[i] || hexes[0], locked: false })
      }
      lockedIdx++
    }
    // If count grew, add extras
    while (newColours.length < count) {
      newColours.push({ id: nextId++, hex: hexes[newColours.length] || '#888888', locked: false })
    }
    colours = newColours.slice(0, count)
    renderAll()
  }

  // ── Render strip ──

  function renderStrip() {
    stripEl.innerHTML = ''
    for (var i = 0; i < colours.length; i++) {
      (function (idx) {
        var c = colours[idx]
        var tc = textColor(c.hex)
        var swatch = document.createElement('div')
        swatch.className = 'pg-swatch'
        swatch.style.background = c.hex
        swatch.style.color = tc
        swatch.setAttribute('data-idx', idx)

        // Controls row at top
        var controls = document.createElement('div')
        controls.className = 'pg-swatch-controls'

        // Remove button (left)
        if (colours.length > MIN_COLOURS) {
          var removeBtn = document.createElement('button')
          removeBtn.type = 'button'
          removeBtn.className = 'pg-swatch-btn'
          removeBtn.innerHTML = '&#128465;'
          removeBtn.title = 'Remove'
          removeBtn.addEventListener('click', function (e) {
            e.stopPropagation()
            colours.splice(idx, 1)
            count = colours.length
            countEl.textContent = count
            renderAll()
          })
          controls.appendChild(removeBtn)
        }

        // Lock button
        var lockBtn = document.createElement('button')
        lockBtn.type = 'button'
        lockBtn.className = 'pg-swatch-btn'
        lockBtn.innerHTML = c.locked ? '&#128274;' : '&#128275;'
        lockBtn.title = c.locked ? 'Unlock' : 'Lock'
        lockBtn.addEventListener('click', function (e) {
          e.stopPropagation()
          colours[idx].locked = !colours[idx].locked
          renderAll()
        })
        controls.appendChild(lockBtn)

        swatch.appendChild(controls)

        // Circle accent in the middle
        var circle = document.createElement('div')
        circle.className = 'pg-swatch-circle'
        swatch.appendChild(circle)

        // Label with lock icon + hex + copy button
        var label = document.createElement('div')
        label.className = 'pg-swatch-label'
        if (c.locked) {
          var lockIcon = document.createElement('span')
          lockIcon.className = 'pg-swatch-lock-icon'
          lockIcon.innerHTML = '&#128274;'
          label.appendChild(lockIcon)
        }
        var hexText = document.createElement('span')
        hexText.textContent = c.hex.toUpperCase()
        label.appendChild(hexText)
        var copyIcon = document.createElement('button')
        copyIcon.type = 'button'
        copyIcon.className = 'pg-swatch-copy'
        copyIcon.innerHTML = '&#128203;'
        copyIcon.title = 'Copy hex'
        copyIcon.addEventListener('click', function (e) {
          e.stopPropagation()
          navigator.clipboard.writeText(c.hex.toUpperCase())
          copyIcon.innerHTML = '&#10003;'
          setTimeout(function () { copyIcon.innerHTML = '&#128203;' }, 1500)
        })
        label.appendChild(copyIcon)
        swatch.appendChild(label)

        stripEl.appendChild(swatch)
      })(i)
    }
  }

  // ── Render colour list ──

  function renderColourList() {
    coloursEl.innerHTML = ''
    for (var i = 0; i < colours.length; i++) {
      (function (idx) {
        var c = colours[idx]
        var rgb = hexToRgb(c.hex)
        var lch = rgbToOklch(rgb[0], rgb[1], rgb[2])
        var name = getColourName(c.hex)

        var row = document.createElement('div')
        row.className = 'pg-colour-row'

        var chip = document.createElement('div')
        chip.className = 'pg-colour-chip'
        chip.style.background = c.hex

        var info = document.createElement('div')
        info.className = 'pg-colour-info'
        var line1 = document.createElement('div')
        line1.className = 'pg-colour-hex'
        line1.innerHTML = '<strong>' + c.hex.toUpperCase() + '</strong> <span class="pg-colour-name">' + name + '</span>'
        var line2 = document.createElement('div')
        line2.className = 'pg-colour-meta'
        line2.textContent = 'RGB ' + rgb[0] + ' ' + rgb[1] + ' ' + rgb[2] + '  |  L' + Math.round(lch[0] * 100) + ' C' + lch[1].toFixed(2) + ' H' + Math.round(lch[2])
        info.appendChild(line1)
        info.appendChild(line2)

        var actions = document.createElement('div')
        actions.className = 'pg-colour-actions'

        // Lock
        var lockBtn = document.createElement('button')
        lockBtn.type = 'button'
        lockBtn.className = 'pg-action-btn' + (c.locked ? ' pg-locked' : '')
        lockBtn.innerHTML = c.locked ? '&#128274;' : '&#128275;'
        lockBtn.title = c.locked ? 'Unlock' : 'Lock'
        lockBtn.addEventListener('click', function () {
          colours[idx].locked = !colours[idx].locked
          renderAll()
        })
        actions.appendChild(lockBtn)

        // Copy
        var copyBtn = document.createElement('button')
        copyBtn.type = 'button'
        copyBtn.className = 'pg-action-btn'
        copyBtn.innerHTML = '&#128203;'
        copyBtn.title = 'Copy hex'
        copyBtn.addEventListener('click', function () {
          navigator.clipboard.writeText(c.hex.toUpperCase())
          copyBtn.innerHTML = '&#10003;'
          setTimeout(function () { copyBtn.innerHTML = '&#128203;' }, 1500)
        })
        actions.appendChild(copyBtn)

        // Shades link
        var shadesBtn = document.createElement('a')
        shadesBtn.className = 'pg-action-btn'
        shadesBtn.href = '/color-shades#' + encodeURIComponent(JSON.stringify({ hex: c.hex }))
        shadesBtn.innerHTML = '&#127912;'
        shadesBtn.title = 'Generate shades'
        actions.appendChild(shadesBtn)

        // Remove
        if (colours.length > MIN_COLOURS) {
          var removeBtn = document.createElement('button')
          removeBtn.type = 'button'
          removeBtn.className = 'pg-action-btn'
          removeBtn.innerHTML = '&#128465;'
          removeBtn.title = 'Remove'
          removeBtn.addEventListener('click', function () {
            colours.splice(idx, 1)
            count = colours.length
            countEl.textContent = count
            renderAll()
          })
          actions.appendChild(removeBtn)
        }

        row.appendChild(chip)
        row.appendChild(info)
        row.appendChild(actions)
        coloursEl.appendChild(row)
      })(i)
    }
  }

  function renderAll() {
    renderStrip()
    renderColourList()
  }

  // ── Events ──

  generateBtn.addEventListener('click', regenerate)

  strategySelect.addEventListener('change', function () {
    strategy = strategySelect.value
    var info = STRATEGIES[strategy]
    strategyDesc.textContent = info ? info.name + ': ' + info.desc : ''
    regenerate()
  })

  countMinus.addEventListener('click', function () {
    if (count > MIN_COLOURS) {
      count--
      countEl.textContent = count
      // Remove last unlocked colour
      for (var i = colours.length - 1; i >= 0; i--) {
        if (!colours[i].locked) { colours.splice(i, 1); break }
      }
      if (colours.length > count) colours = colours.slice(0, count)
      renderAll()
    }
  })

  countPlus.addEventListener('click', function () {
    if (count < MAX_COLOURS) {
      count++
      countEl.textContent = count
      var extra = generatePalette(1, strategy)
      colours.push({ id: nextId++, hex: extra[0], locked: false })
      renderAll()
    }
  })

  // Spacebar to generate
  document.addEventListener('keydown', function (e) {
    if (e.code === 'Space' && e.target === document.body) {
      e.preventDefault()
      regenerate()
    }
  })

  // ── Export ──

  function copyText(text, btn) {
    navigator.clipboard.writeText(text).then(function () {
      var orig = btn.textContent
      btn.textContent = 'Copied!'
      setTimeout(function () { btn.textContent = orig }, 2000)
    })
  }

  exportHex.addEventListener('click', function () {
    copyText(colours.map(function (c) { return c.hex.toUpperCase() }).join(', '), exportHex)
  })

  exportCss.addEventListener('click', function () {
    var css = ':root {\n' + colours.map(function (c, i) {
      return '  --palette-' + (i + 1) + ': ' + c.hex + ';'
    }).join('\n') + '\n}'
    copyText(css, exportCss)
  })

  exportJson.addEventListener('click', function () {
    copyText(JSON.stringify(colours.map(function (c) { return c.hex })), exportJson)
  })

  exportImg.addEventListener('click', function () {
    var n = colours.length
    var swatchW = 120, swatchH = 160, padding = 16
    var canvasW = n * swatchW + (n - 1) * 4 + padding * 2
    var canvasH = swatchH + padding * 2 + 24
    var canvas = document.createElement('canvas')
    canvas.width = canvasW
    canvas.height = canvasH
    var ctx = canvas.getContext('2d')

    // Background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvasW, canvasH)

    // Swatches
    for (var i = 0; i < n; i++) {
      var x = padding + i * (swatchW + 4)
      ctx.fillStyle = colours[i].hex
      ctx.beginPath()
      ctx.roundRect(x, padding, swatchW, swatchH, 8)
      ctx.fill()

      // Hex label
      ctx.fillStyle = textColor(colours[i].hex)
      ctx.font = '600 11px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(colours[i].hex.toUpperCase(), x + swatchW / 2, padding + swatchH - 10)
    }

    // Watermark
    ctx.fillStyle = '#aaa'
    ctx.font = '10px Inter, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText('maratool.com', canvasW - padding, canvasH - 6)

    canvas.toBlob(function (blob) {
      var url = URL.createObjectURL(blob)
      var a = document.createElement('a')
      a.href = url
      a.download = 'palette.png'
      a.click()
      URL.revokeObjectURL(url)
    })
  })

  // ── Init ──

  strategyDesc.textContent = STRATEGIES[strategy].name + ': ' + STRATEGIES[strategy].desc
  regenerate()
})()
