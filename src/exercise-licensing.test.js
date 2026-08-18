import { describe, test, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync } from 'fs'
import { resolve } from 'path'

const ROOT = resolve(import.meta.dirname, '..')
const read = p => readFileSync(resolve(ROOT, p), 'utf-8')

describe('licensing compliance', () => {
  const page = read('src/pages/exercises/licenses.astro')

  test('names both sources with their licenses', () => {
    expect(page).toContain('Everkinetic')
    expect(page).toContain('CC BY-SA 4.0')
    expect(page).toContain('free-exercise-db')
    expect(page).toMatch(/Unlicense|public domain/i)
  })

  test('states the ShareAlike obligation on our derived versions', () => {
    expect(page.toLowerCase()).toContain('sharealike')
  })

  test('links the canonical license deed', () => {
    expect(page).toContain('https://creativecommons.org/licenses/by-sa/4.0/')
  })

  test('no Gym visual media anywhere in the repo source or public assets', () => {
    const suspicious = []
    const walk = dir => {
      for (const e of readdirSync(resolve(ROOT, dir), { withFileTypes: true })) {
        if (e.name === 'node_modules' || e.name === '.git' || e.name === 'dist') continue
        const rel = `${dir}/${e.name}`
        if (e.isDirectory()) walk(rel)
        else if (/gymvisual/i.test(e.name)) suspicious.push(rel)
      }
    }
    walk('public')
    walk('src')
    expect(suspicious).toEqual([])
  })

  test('the vendored source doc exists and pins both commits', () => {
    expect(existsSync(resolve(ROOT, 'src/data/exercises/EXERCISES_SOURCE.md'))).toBe(true)
    const doc = read('src/data/exercises/EXERCISES_SOURCE.md')
    expect((doc.match(/[0-9a-f]{40}/g) ?? []).length).toBeGreaterThanOrEqual(2)
  })
})
