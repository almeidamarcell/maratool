/** Lightweight JSON Schema validator (subset: type, required, properties, items) */

export function validateJson(instance, schema, path = '') {
  const errors = []

  function err(msg) {
    errors.push((path || 'root') + ': ' + msg)
  }

  function check(inst, sch, p) {
    if (!sch || typeof sch !== 'object') return
    if (sch.type) {
      const types = Array.isArray(sch.type) ? sch.type : [sch.type]
      const actual = inst === null ? 'null' : Array.isArray(inst) ? 'array' : typeof inst
      const map = { integer: 'number' }
      const ok = types.some(t => actual === t || (t === 'integer' && Number.isInteger(inst)))
      if (!ok) err(`expected type ${types.join('|')}, got ${actual}`)
    }
    if (sch.required && typeof inst === 'object' && inst && !Array.isArray(inst)) {
      for (const key of sch.required) {
        if (!(key in inst)) err(`missing required property "${key}"`)
      }
    }
    if (sch.properties && typeof inst === 'object' && inst && !Array.isArray(inst)) {
      for (const [key, sub] of Object.entries(sch.properties)) {
        if (key in inst) check(inst[key], sub, p ? `${p}.${key}` : key)
      }
    }
    if (sch.items && Array.isArray(inst)) {
      inst.forEach((item, i) => check(item, sch.items, `${p}[${i}]`))
    }
    if (sch.minLength != null && typeof inst === 'string' && inst.length < sch.minLength) {
      err(`string shorter than minLength ${sch.minLength}`)
    }
    if (sch.minimum != null && typeof inst === 'number' && inst < sch.minimum) {
      err(`number below minimum ${sch.minimum}`)
    }
  }

  check(instance, schema, path)
  return { valid: errors.length === 0, errors }
}
