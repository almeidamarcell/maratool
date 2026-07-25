/**
 * Amount of Substance — config for the shared linear conversion engine.
 * Factors are multiply-to-base; each line cites its source for factor audit.
 * Reference: BIPM SI Brochure (https://www.bipm.org/en/publications/si-brochure)
 */
import './convert-engine.js'

;(function () {
  window.maratoolConvertEngine({
    prefix: 'aoc',
    categories: {
      amount: { label: 'Amount of substance', base: 'mole', units: {
        'Kilomole (kmol)': 1000, // exact
        'Mole (mol)': 1, // SI base unit (BIPM)
        'Millimole (mmol)': 0.001, // exact
        'Micromole (µmol)': 1e-6, // exact
        'Nanomole (nmol)': 1e-9, // exact
        'Picomole (pmol)': 1e-12, // exact
        'Pound-mole (lb-mol)': 453.59237, // exact: NIST SP 811 pound definition
      } }
    },
    defaultFrom: 'Millimole (mmol)',
    defaultTo: 'Mole (mol)',
  })
})()
