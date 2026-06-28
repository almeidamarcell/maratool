/** Wave 4 education utilities */

export function toRoman(num) {
  const n = Math.floor(Number(num))
  if (!isFinite(n) || n <= 0 || n > 3999) return null
  const map = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
    [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ]
  let x = n
  let out = ''
  for (const [val, sym] of map) {
    while (x >= val) { out += sym; x -= val }
  }
  return out
}

export function fromRoman(roman) {
  const map = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 }
  const s = String(roman || '').toUpperCase()
  if (!s || !/^[IVXLCDM]+$/.test(s)) return null
  let total = 0
  for (let i = 0; i < s.length; i++) {
    const cur = map[s[i]]
    const next = map[s[i + 1]]
    total += cur < next ? -cur : cur
  }
  return total
}

export function formatApaCitation({ author = 'Author, A.', year = '2026', title = 'Title', source = 'Publisher' } = {}) {
  return `${author} (${year}). ${title}. ${source}.`
}

export function formatMlaCitation({ author = 'Author', title = 'Title', publisher = 'Publisher', year = '2026' } = {}) {
  return `${author}. "${title}." ${publisher}, ${year}.`
}

export function convertCitationStyle(fields, to = 'mla') {
  return to === 'apa' ? formatApaCitation(fields) : formatMlaCitation(fields)
}

export function formatFlashcards(lines, sep = '\t') {
  return String(lines || '')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map((line, i) => {
      const [front, back = ''] = line.split(sep)
      return `## Card ${i + 1}\n**Q:** ${front.trim()}\n**A:** ${back.trim()}`
    })
    .join('\n\n')
}

export function formatBibliographyCitation(fields, style = 'apa') {
  return convertCitationStyle(fields, style)
}
