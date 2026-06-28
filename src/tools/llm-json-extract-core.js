/** Extract JSON blocks from LLM output text */

function tryParse(json) {
  try {
    JSON.parse(json)
    return { valid: true, json }
  } catch (e) {
    return { valid: false, json, error: e.message }
  }
}

export function extractJsonFromText(text) {
  if (!text || !text.trim()) return { blocks: [] }

  const blocks = []
  const fenceRe = /```(?:json)?\s*([\s\S]*?)```/gi
  let m
  while ((m = fenceRe.exec(text)) !== null) {
    const raw = m[1].trim()
    if (raw) blocks.push({ source: 'fence', ...tryParse(raw) })
  }

  if (!blocks.length) {
    const objRe = /(\{[\s\S]*\}|\[[\s\S]*\])/g
    while ((m = objRe.exec(text)) !== null) {
      const raw = m[1].trim()
      const parsed = tryParse(raw)
      if (parsed.valid) blocks.push({ source: 'inline', ...parsed })
    }
  }

  return { blocks }
}
