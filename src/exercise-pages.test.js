import { describe, test, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { exercises } from './data/exercises/index.ts'

const ROOT = resolve(import.meta.dirname, '..')
const page = readFileSync(resolve(ROOT, 'src/pages/exercises/[slug].astro'), 'utf-8')

describe('exercise detail page', () => {
  test('generates one path per exercise via getStaticPaths', () => {
    expect(page).toContain('export function getStaticPaths')
    expect(page).toMatch(/exercises\.map/)
  })

  test('renders the media viewer and the muscle map', () => {
    expect(page).toContain('<ExerciseMedia')
    expect(page).toContain('<MuscleMap')
  })

  test('emits HowTo schema built from the instruction steps', () => {
    expect(page).toContain("'@type': 'HowTo'")
    expect(page).toContain('HowToStep')
  })

  test('renders the license attribution required by CC BY-SA', () => {
    expect(page).toContain('attribution')
    expect(page).toContain('creativecommons.org/licenses/by-sa/4.0')
  })

  test('links related exercises with trailing slashes', () => {
    expect(page).toContain('relatedExercises')
    expect(page).toMatch(/\/exercises\/\$\{[^}]+\}\//)
  })

  test('canonical URL uses a trailing slash', () => {
    expect(page).toMatch(/canonical:\s*`https:\/\/maratool\.com\/exercises\/\$\{[^}]+\}\/`/)
  })

  test('the dataset it renders is non-trivial', () => {
    expect(exercises.length).toBe(1035)
  })
})
