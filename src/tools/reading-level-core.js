/** Flesch-Kincaid grade level estimate */

function countSyllables(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, '')
  if (!w) return 0
  if (w.length <= 3) return 1
  const groups = w.match(/[aeiouy]+/g)
  let count = groups ? groups.length : 1
  if (w.endsWith('e')) count = Math.max(1, count - 1)
  return count
}

export function calcReadingLevel(text) {
  const t = String(text || '').trim()
  if (!t) {
    return { words: 0, sentences: 0, syllables: 0, gradeLevel: 0, readingEase: 0 }
  }

  const words = t.split(/\s+/).filter(Boolean)
  const sentences = Math.max(1, (t.match(/[.!?]+/g) || []).length)
  const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0)
  const w = words.length
  const asl = w / sentences
  const asw = syllables / w

  const gradeLevel = Math.max(0, Math.round((0.39 * asl + 11.8 * asw - 15.59) * 10) / 10)
  const readingEase = Math.round((206.835 - 1.015 * asl - 84.6 * asw) * 10) / 10

  return { words: w, sentences, syllables, gradeLevel, readingEase }
}
