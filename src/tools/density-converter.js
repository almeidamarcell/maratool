/**
 * Density Converter — config for the shared linear conversion engine.
 * Factors are multiply-to-base; each line cites its source for factor audit.
 * Reference: NIST Special Publication 811 (https://www.nist.gov/pml/special-publication-811)
 */
import './convert-engine.js'

;(function () {
  window.maratoolConvertEngine({
    prefix: 'dnc',
    categories: {
      density: { label: 'Density', base: 'kilogram per cubic meter', units: {
        'Kilogram per cubic meter (kg/m³)': 1, // base unit
        'Gram per cubic centimeter (g/cm³)': 1000, // exact
        'Gram per milliliter (g/mL)': 1000, // exact (1 mL = 1 cm³)
        'Kilogram per liter (kg/L)': 1000, // exact
        'Gram per liter (g/L)': 1, // exact
        'Pound per cubic foot (lb/ft³)': 16.018463373960142, // exact: 0.45359237/0.028316846592
        'Pound per cubic inch (lb/in³)': 27679.904710203125, // exact: 0.45359237/1.6387064e-5
        'Pound per US gallon (lb/gal)': 119.82642731689663, // exact: 0.45359237/3.785411784e-3
        'Ounce per cubic inch (oz/in³)': 1729.9940443876953, // exact: lb/in³ ÷ 16
      } }
    },
    defaultFrom: 'Gram per cubic centimeter (g/cm³)',
    defaultTo: 'Kilogram per cubic meter (kg/m³)',
  })
})()
