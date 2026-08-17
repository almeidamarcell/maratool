import { describe, test, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const ROOT = resolve(import.meta.dirname, '..')
const read = p => readFileSync(resolve(ROOT, p), 'utf-8')

describe('vendored exercise sources', () => {
  test('everkinetic raw json exists and has records with SVG pairs', () => {
    const ek = JSON.parse(read('src/data/exercises/everkinetic.raw.json'))
    expect(Array.isArray(ek)).toBe(true)
    expect(ek.length).toBeGreaterThanOrEqual(260)
    expect(ek[0]).toHaveProperty('id_num')
    expect(ek[0]).toHaveProperty('title')
  })

  test('free-exercise-db raw json exists with 873 records', () => {
    const fe = JSON.parse(read('src/data/exercises/free-exercise-db.raw.json'))
    expect(fe.length).toBe(873)
    expect(fe[0]).toHaveProperty('primaryMuscles')
    expect(fe[0]).toHaveProperty('images')
  })

  test('EXERCISES_SOURCE.md records both commits and licenses', () => {
    const doc = read('src/data/exercises/EXERCISES_SOURCE.md')
    expect(doc).toContain('everkinetic/data')
    expect(doc).toContain('yuhonas/free-exercise-db')
    expect(doc).toContain('CC BY-SA 4.0')
    expect(doc).toContain('Unlicense')
    expect(doc).toMatch(/[0-9a-f]{40}/)  // a pinned commit sha
  })

  test('no Gym visual media anywhere in vendored data', () => {
    const ek = read('src/data/exercises/everkinetic.raw.json')
    const fe = read('src/data/exercises/free-exercise-db.raw.json')
    expect(ek.toLowerCase()).not.toContain('gymvisual')
    expect(fe.toLowerCase()).not.toContain('gymvisual')
  })

  test('everkinetic SVG assets are present in public/', () => {
    const ek = JSON.parse(read('src/data/exercises/everkinetic.raw.json'))
    const sample = ek[0].id_num
    expect(existsSync(resolve(ROOT, `public/exercises/svg/${sample}-relaxation.svg`))).toBe(true)
    expect(existsSync(resolve(ROOT, `public/exercises/svg/${sample}-tension.svg`))).toBe(true)
  })
})
