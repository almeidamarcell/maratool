/**
 * Molar Mass Converter — config for the shared linear conversion engine.
 * Factors are multiply-to-base; each line cites its source for factor audit.
 * Reference: BIPM SI Brochure (https://www.bipm.org/en/publications/si-brochure)
 */
import './convert-engine.js'

;(function () {
  window.maratoolConvertEngine({
    prefix: 'mmc',
    categories: {
      molarmass: { label: 'Molar mass', base: 'gram per mole', units: {
        'Kilogram per mole (kg/mol)': 1000, // exact
        'Gram per mole (g/mol)': 1, // base unit
        'Milligram per mole (mg/mol)': 0.001, // exact
        'Kilogram per kilomole (kg/kmol)': 1, // identical to g/mol (exact)
        'Pound per pound-mole (lb/lb-mol)': 1, // identical to g/mol (exact ratio)
        'Dalton (Da)': 1, // numerically equal to g/mol (BIPM)
      } }
    },
    defaultFrom: 'Gram per mole (g/mol)',
    defaultTo: 'Kilogram per mole (kg/mol)',
  })
})()
