/**
 * Inductance Converter — config for the shared linear conversion engine.
 * Factors are multiply-to-base; each line cites its source for factor audit.
 * Reference: NIST Special Publication 811 (https://www.nist.gov/pml/special-publication-811)
 */
import './convert-engine.js'

;(function () {
  window.maratoolConvertEngine({
    prefix: 'inc',
    categories: {
      inductance: { label: 'Inductance', base: 'henry', units: {
        'Kilohenry (kH)': 1e3, // exact SI prefix
        'Henry (H)': 1, // SI derived unit (BIPM)
        'Millihenry (mH)': 1e-3, // exact SI prefix
        'Microhenry (µH)': 1e-6, // exact SI prefix
        'Nanohenry (nH)': 1e-9, // exact SI prefix
        'Abhenry (abH)': 1e-9, // exact: CGS-EMU (NIST SP 811)
        'Stathenry (statH)': 8.987551787e11, // CGS-ESU (NIST SP 811)
      } }
    },
    defaultFrom: 'Millihenry (mH)',
    defaultTo: 'Microhenry (µH)',
  })
})()
