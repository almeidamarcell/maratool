/**
 * Electric Charge — config for the shared linear conversion engine.
 * Factors are multiply-to-base; each line cites its source for factor audit.
 * Reference: NIST Special Publication 811 (https://www.nist.gov/pml/special-publication-811)
 */
import './convert-engine.js'

;(function () {
  window.maratoolConvertEngine({
    prefix: 'ecc',
    categories: {
      charge: { label: 'Electric charge', base: 'coulomb', units: {
        'Kilocoulomb (kC)': 1e3, // exact
        'Coulomb (C)': 1, // SI derived unit: 1 A·s (BIPM)
        'Millicoulomb (mC)': 1e-3, // exact
        'Microcoulomb (µC)': 1e-6, // exact
        'Nanocoulomb (nC)': 1e-9, // exact
        'Ampere-hour (Ah)': 3600, // exact: 1 A × 3600 s
        'Milliampere-hour (mAh)': 3.6, // exact: Ah/1000
        'Faraday (F)': 96485.33212, // NIST: Faraday constant, C/mol
        'Abcoulomb (abC)': 10, // exact: CGS-EMU (NIST SP 811)
        'Statcoulomb (statC)': 3.335640951e-10, // CGS-ESU (NIST SP 811)
      } }
    },
    defaultFrom: 'Milliampere-hour (mAh)',
    defaultTo: 'Coulomb (C)',
  })
})()
