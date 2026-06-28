import { describe, it, expect } from 'vitest'
import { calcGpa } from './education-gpa-core.js'
import { calcWeightedGrade } from './education-grade-core.js'
import { calcFinalGradeNeeded } from './education-final-grade-core.js'
import { calcReadingLevel } from './reading-level-core.js'

describe('calcGpa', () => {
  it('calculates weighted GPA on 4.0 scale', () => {
    var gpa = calcGpa([
      { grade: 'A', credits: 3 },
      { grade: 'B', credits: 3 },
    ])
    expect(gpa.value).toBeCloseTo(3.5, 2)
  })
})

describe('calcWeightedGrade', () => {
  it('calculates percent from weighted assignments', () => {
    var r = calcWeightedGrade([
      { name: 'HW', score: 90, weight: 20 },
      { name: 'Exam', score: 80, weight: 80 },
    ])
    expect(r.percent).toBeCloseTo(82, 1)
  })
})

describe('calcFinalGradeNeeded', () => {
  it('calculates required final exam score', () => {
    var r = calcFinalGradeNeeded({ currentPercent: 85, desiredPercent: 90, finalWeight: 30 })
    expect(r.neededPercent).toBeCloseTo(101.67, 1)
    expect(r.possible).toBe(false)
  })

  it('returns achievable score', () => {
    var r = calcFinalGradeNeeded({ currentPercent: 80, desiredPercent: 85, finalWeight: 40 })
    expect(r.neededPercent).toBeCloseTo(92.5, 1)
    expect(r.possible).toBe(true)
  })
})

describe('calcReadingLevel', () => {
  it('returns grade level for simple text', () => {
    var r = calcReadingLevel(
      'The implementation of computational linguistics requires understanding phonological structures. ' +
      'Researchers analyze syntactic patterns across multiple paragraphs.'
    )
    expect(r.gradeLevel).toBeGreaterThan(0)
    expect(r.words).toBeGreaterThan(5)
  })
})
