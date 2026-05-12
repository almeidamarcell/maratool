import { describe, test, expect } from 'vitest'
import { calculateBMI, classifyBMI, calculateBSA } from './bmi.js'

describe('calculateBMI — kg/m² rounded to 1 decimal', () => {
  test('70 kg, 1.75 m → 22.9', () => {
    expect(calculateBMI(70, 1.75)).toBe(22.9)
  })

  test('80 kg, 1.80 m → 24.7', () => {
    expect(calculateBMI(80, 1.80)).toBe(24.7)
  })

  test('50 kg, 1.60 m → 19.5', () => {
    expect(calculateBMI(50, 1.60)).toBe(19.5)
  })

  test('100 kg, 1.70 m → 34.6', () => {
    expect(calculateBMI(100, 1.70)).toBe(34.6)
  })

  test('returns null when height is 0', () => {
    expect(calculateBMI(70, 0)).toBe(null)
  })

  test('returns null when weight is 0', () => {
    expect(calculateBMI(0, 1.75)).toBe(null)
  })

  test('returns null when weight is negative', () => {
    expect(calculateBMI(-10, 1.75)).toBe(null)
  })

  test('returns null when height is negative', () => {
    expect(calculateBMI(70, -1.75)).toBe(null)
  })

  test('accepts height in centimeters when ≥ 3 (heuristic)', () => {
    // 175 cm should be interpreted as 1.75 m → 22.9
    expect(calculateBMI(70, 175)).toBe(22.9)
  })
})

describe('classifyBMI — WHO categories (adults ≥ 18y)', () => {
  test('BMI < 18.5 → Underweight', () => {
    expect(classifyBMI(17.0)).toBe('Underweight')
    expect(classifyBMI(18.4)).toBe('Underweight')
  })

  test('18.5 ≤ BMI < 25 → Normal weight', () => {
    expect(classifyBMI(18.5)).toBe('Normal weight')
    expect(classifyBMI(22.9)).toBe('Normal weight')
    expect(classifyBMI(24.9)).toBe('Normal weight')
  })

  test('25 ≤ BMI < 30 → Overweight', () => {
    expect(classifyBMI(25)).toBe('Overweight')
    expect(classifyBMI(29.9)).toBe('Overweight')
  })

  test('30 ≤ BMI < 35 → Obesity class I', () => {
    expect(classifyBMI(30)).toBe('Obesity class I')
    expect(classifyBMI(34.9)).toBe('Obesity class I')
  })

  test('35 ≤ BMI < 40 → Obesity class II', () => {
    expect(classifyBMI(35)).toBe('Obesity class II')
    expect(classifyBMI(39.9)).toBe('Obesity class II')
  })

  test('BMI ≥ 40 → Obesity class III', () => {
    expect(classifyBMI(40)).toBe('Obesity class III')
    expect(classifyBMI(55)).toBe('Obesity class III')
  })

  test('returns null when BMI is null', () => {
    expect(classifyBMI(null)).toBe(null)
  })
})

describe('calculateBSA — Mosteller formula (Whitebook-aligned)', () => {
  // Mosteller: BSA = √((H_cm × W_kg) / 3600)
  // Validated against Whitebook outputs.
  test('70 kg, 175 cm → 1.84 m² (matches Whitebook)', () => {
    // √(175*70/3600) = √(12250/3600) = √3.4028 = 1.8447
    expect(calculateBSA(70, 175)).toBe(1.84)
  })

  test('100 kg, 175 cm → 2.20 m² (matches Whitebook)', () => {
    expect(calculateBSA(100, 175)).toBe(2.2)
  })

  test('80 kg, 180 cm → 2.00 m²', () => {
    // √((180*80)/3600) = √4 = 2.00
    expect(calculateBSA(80, 180)).toBe(2)
  })

  test('60 kg, 165 cm → 1.66 m² (matches Whitebook)', () => {
    expect(calculateBSA(60, 165)).toBe(1.66)
  })

  test('90 kg, 180 cm → 2.12 m² (matches Whitebook)', () => {
    expect(calculateBSA(90, 180)).toBe(2.12)
  })

  test('80 kg, 170 cm → 1.94 m² (matches Whitebook)', () => {
    expect(calculateBSA(80, 170)).toBe(1.94)
  })

  test('accepts height in meters when < 3 (heuristic): 70 kg, 1.75 m', () => {
    expect(calculateBSA(70, 1.75)).toBe(1.84)
  })

  test('returns null when weight is 0', () => {
    expect(calculateBSA(0, 175)).toBe(null)
  })

  test('returns null when height is 0', () => {
    expect(calculateBSA(70, 0)).toBe(null)
  })
})
