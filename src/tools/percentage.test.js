import { describe, test, expect } from 'vitest'
import {
  percentOf,
  whatPercent,
  percentIncrease,
  percentDecrease,
  proportionPercent,
  addPercent,
  subtractPercent,
  originalBeforeIncrease,
  originalBeforeDecrease,
} from './percentage-calc.js'

describe('percentOf — what is X% of Y?', () => {
  test('10% of 200 is 20', () => {
    expect(percentOf(10, 200)).toBe(20)
  })
  test('25% of 80 is 20', () => {
    expect(percentOf(25, 80)).toBe(20)
  })
  test('0% of 100 is 0', () => {
    expect(percentOf(0, 100)).toBe(0)
  })
  test('100% of 50 is 50', () => {
    expect(percentOf(100, 50)).toBe(50)
  })
  test('50% of 0 is 0', () => {
    expect(percentOf(50, 0)).toBe(0)
  })
  test('handles decimals: 12.5% of 200 is 25', () => {
    expect(percentOf(12.5, 200)).toBe(25)
  })
})

describe('whatPercent — X is what % of Y?', () => {
  test('50 is 25% of 200', () => {
    expect(whatPercent(50, 200)).toBe(25)
  })
  test('0 is 0% of 100', () => {
    expect(whatPercent(0, 100)).toBe(0)
  })
  test('returns null when Y is 0 (division by zero)', () => {
    expect(whatPercent(50, 0)).toBe(null)
  })
  test('100 is 100% of 100', () => {
    expect(whatPercent(100, 100)).toBe(100)
  })
  test('handles result with decimals: 1 is 33.33% of 3', () => {
    expect(whatPercent(1, 3)).toBeCloseTo(33.33, 2)
  })
})

describe('percentIncrease — from X to Y, what % increase?', () => {
  test('100 to 150 is 50% increase', () => {
    expect(percentIncrease(100, 150)).toBe(50)
  })
  test('200 to 250 is 25% increase', () => {
    expect(percentIncrease(200, 250)).toBe(25)
  })
  test('returns null when original is 0', () => {
    expect(percentIncrease(0, 100)).toBe(null)
  })
  test('50 to 50 is 0% increase', () => {
    expect(percentIncrease(50, 50)).toBe(0)
  })
  test('80 to 100 is 25% increase', () => {
    expect(percentIncrease(80, 100)).toBe(25)
  })
})

describe('percentDecrease — from X to Y, what % decrease?', () => {
  test('200 to 150 is 25% decrease', () => {
    expect(percentDecrease(200, 150)).toBe(25)
  })
  test('100 to 75 is 25% decrease', () => {
    expect(percentDecrease(100, 75)).toBe(25)
  })
  test('returns null when original is 0', () => {
    expect(percentDecrease(0, 50)).toBe(null)
  })
  test('100 to 100 is 0% decrease', () => {
    expect(percentDecrease(100, 100)).toBe(0)
  })
  test('100 to 0 is 100% decrease', () => {
    expect(percentDecrease(100, 0)).toBe(100)
  })
})

describe('proportionPercent — X over Y is what %?', () => {
  test('30 over 200 is 15%', () => {
    expect(proportionPercent(30, 200)).toBe(15)
  })
  test('1 over 4 is 25%', () => {
    expect(proportionPercent(1, 4)).toBe(25)
  })
  test('returns null when Y is 0', () => {
    expect(proportionPercent(10, 0)).toBe(null)
  })
})

describe('addPercent — increase X by Y%', () => {
  test('100 + 10% = 110', () => {
    expect(addPercent(100, 10)).toBe(110)
  })
  test('200 + 25% = 250', () => {
    expect(addPercent(200, 25)).toBe(250)
  })
  test('50 + 0% = 50', () => {
    expect(addPercent(50, 0)).toBe(50)
  })
  test('80 + 100% = 160', () => {
    expect(addPercent(80, 100)).toBe(160)
  })
})

describe('subtractPercent — decrease X by Y%', () => {
  test('100 - 10% = 90', () => {
    expect(subtractPercent(100, 10)).toBe(90)
  })
  test('200 - 25% = 150', () => {
    expect(subtractPercent(200, 25)).toBe(150)
  })
  test('50 - 0% = 50', () => {
    expect(subtractPercent(50, 0)).toBe(50)
  })
  test('80 - 100% = 0', () => {
    expect(subtractPercent(80, 100)).toBe(0)
  })
})

describe('originalBeforeIncrease — increased by X% became Y, what was original?', () => {
  test('increased by 25% became 125, original is 100', () => {
    expect(originalBeforeIncrease(25, 125)).toBe(100)
  })
  test('increased by 50% became 150, original is 100', () => {
    expect(originalBeforeIncrease(50, 150)).toBe(100)
  })
  test('increased by 0% became 200, original is 200', () => {
    expect(originalBeforeIncrease(0, 200)).toBe(200)
  })
  test('returns null when percentage is -100 (division by zero)', () => {
    expect(originalBeforeIncrease(-100, 50)).toBe(null)
  })
  test('increased by 10% became 220, original is 200', () => {
    expect(originalBeforeIncrease(10, 220)).toBe(200)
  })
})

describe('originalBeforeDecrease — decreased by X% became Y, what was original?', () => {
  test('decreased by 25% became 75, original is 100', () => {
    expect(originalBeforeDecrease(25, 75)).toBe(100)
  })
  test('decreased by 50% became 50, original is 100', () => {
    expect(originalBeforeDecrease(50, 50)).toBe(100)
  })
  test('decreased by 0% became 200, original is 200', () => {
    expect(originalBeforeDecrease(0, 200)).toBe(200)
  })
  test('returns null when percentage is 100 (division by zero)', () => {
    expect(originalBeforeDecrease(100, 0)).toBe(null)
  })
  test('decreased by 20% became 160, original is 200', () => {
    expect(originalBeforeDecrease(20, 160)).toBe(200)
  })
})
