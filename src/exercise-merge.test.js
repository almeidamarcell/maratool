import { describe, test, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { MUSCLES, EQUIPMENT } from './data/exercises/vocab.mjs'

const ROOT = resolve(import.meta.dirname, '..')
const load = p => JSON.parse(readFileSync(resolve(ROOT, p), 'utf-8'))
const all = load('src/data/exercises/exercises.json')
const fe = load('src/data/exercises/free-exercise-db.raw.json')
const feById = new Map(fe.map(x => [x.id, x]))

describe('merged exercise dataset', () => {
  test('has 1035 unique exercises', () => {
    expect(all.length).toBe(1035)
  })

  test('every slug is unique and URL-safe', () => {
    const slugs = all.map(x => x.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9-]+$/)
  })

  test('266 records use vector media, the rest photos', () => {
    const vector = all.filter(x => x.media.kind === 'vector')
    const photo = all.filter(x => x.media.kind === 'photo')
    expect(vector.length).toBe(266)
    expect(photo.length).toBe(769)
  })

  test('every record has a non-empty name, instructions and media pair', () => {
    for (const x of all) {
      expect(x.name.length).toBeGreaterThan(0)
      expect(Array.isArray(x.instructions)).toBe(true)
      expect(x.instructions.length).toBeGreaterThan(0)
      expect(x.media.start.length).toBeGreaterThan(0)
      expect(x.media.end.length).toBeGreaterThan(0)
    }
  })

  test('every record has at least one primary muscle', () => {
    for (const x of all) {
      expect(Array.isArray(x.primaryMuscles)).toBe(true)
      expect(x.primaryMuscles.length).toBeGreaterThan(0)
    }
  })

  test('every muscle and equipment value is canonical', () => {
    for (const x of all) {
      expect(x.primaryMuscles.length).toBeGreaterThan(0)
      for (const m of [...x.primaryMuscles, ...x.secondaryMuscles]) {
        expect(MUSCLES).toContain(m)
      }
      for (const e of x.equipment) expect(EQUIPMENT).toContain(e)
    }
  })

  test('mechanic is a single canonical value, never a comma-joined string', () => {
    // Regression: the generator used to fall back to Everkinetic's `type`,
    // which carries values like "isolation, compound". Those reached the
    // exercise page verbatim and rendered as one nonsense pill.
    const MECHANICS = ['compound', 'isolation', 'isometric']
    for (const x of all) {
      if (x.mechanic === null) continue
      expect(x.mechanic).not.toContain(',')
      expect(MECHANICS).toContain(x.mechanic)
    }
  })

  test('every everkinetic-sourced record carries CC BY-SA attribution', () => {
    for (const x of all.filter(x => x.source === 'everkinetic')) {
      expect(x.attribution).toContain('Everkinetic')
      expect(x.attribution).toContain('CC BY-SA 4.0')
    }
  })

  test('vector media points at existing public SVG paths', () => {
    const v = all.find(x => x.media.kind === 'vector')
    expect(v.media.start).toMatch(/^\/exercises\/svg\/\d+-relaxation\.svg$/)
    expect(v.media.end).toMatch(/^\/exercises\/svg\/\d+-tension\.svg$/)
  })

  test('browse index is lean — only the fields the browser filters on', () => {
    const idx = load('public/exercises/browse-index.json')
    expect(idx.length).toBe(1035)
    expect(Object.keys(idx[0]).sort()).toEqual(
      ['category', 'equipment', 'level', 'mediaKind', 'name', 'primaryMuscles', 'slug'].sort()
    )
    // Must stay small enough to ship to the client.
    const bytes = readFileSync(resolve(ROOT, 'public/exercises/browse-index.json')).length
    expect(bytes).toBeLessThan(400_000)
  })

  test('merge map snapshot — guards against silent fuzzy-match drift', () => {
    // A bare count can't detect that a PAIRING changed (e.g. a mediocre match
    // stealing a row a better candidate needed) — only a real map of who
    // matched whom can. Compare the generated map against a checked-in
    // fixture; regenerating that fixture is a deliberate, reviewable act.
    const computed = all
      .filter(x => x.mergedFrom)
      .map(x => `"${x.name}" => "${feById.get(x.mergedFrom)?.name}"`)
      .sort()

    const fixtureRaw = readFileSync(
      resolve(ROOT, 'src/data/exercises/merge-map.snapshot.txt'), 'utf-8'
    )
    const fixture = fixtureRaw
      .split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#'))
      .sort()

    const onlyInComputed = computed.filter(l => !fixture.includes(l))
    const onlyInFixture = fixture.filter(l => !computed.includes(l))
    const diffMessage = [
      `merge map drifted from src/data/exercises/merge-map.snapshot.txt`,
      onlyInComputed.length ? `  gained (in computed, not fixture):\n    ${onlyInComputed.join('\n    ')}` : null,
      onlyInFixture.length ? `  lost (in fixture, not computed):\n    ${onlyInFixture.join('\n    ')}` : null,
    ].filter(Boolean).join('\n')

    expect(computed, diffMessage).toEqual(fixture)
  })
})
