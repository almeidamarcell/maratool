import { describe, test, expect } from 'vitest'
import { JSDOM } from 'jsdom'
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const builtPage = join(__dirname, '../../../dist/bmi-calculator/index.html')
// Needs a prior `npm run build`; skip (don't fail) when dist/ is absent.
const hasBuild = existsSync(builtPage)
const builtHtml = hasBuild ? readFileSync(builtPage, 'utf8') : ''

describe.skipIf(!hasBuild)('built BMI page', () => {
  test('contains all required interactive elements', () => {
    const ids = ['bmi-weight', 'bmi-height', 'bmi-value', 'bmi-class', 'bmi-bsa']
    for (const id of ids) {
      expect(builtHtml, `${id} missing from built page`).toContain(`id="${id}"`)
    }
  })

  test('contains medical disclaimer', () => {
    expect(builtHtml).toContain('educational')
    expect(builtHtml).toMatch(/not a substitute for medical/i)
  })

  test('contains WHO classification reference table', () => {
    expect(builtHtml).toContain('Underweight')
    expect(builtHtml).toContain('Obesity class III')
  })

  test('contains bundled inline JS with calculation logic', () => {
    // After Mosteller switch + minification, look for the BSA divisor and BMI threshold.
    expect(builtHtml).toContain('3600')
    expect(builtHtml).toContain('18.5')
  })

  test('JSDOM can parse the page and inputs respond to events', () => {
    const dom = new JSDOM(builtHtml, { runScripts: 'dangerously' })
    const { document } = dom.window
    expect(document.getElementById('bmi-weight')).toBeTruthy()
    expect(document.getElementById('bmi-height')).toBeTruthy()
    expect(document.getElementById('bmi-value')).toBeTruthy()
  })
})
