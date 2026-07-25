/**
 * Capacitance Converter — config for the shared linear conversion engine.
 * Factors are multiply-to-base; each line cites its source for factor audit.
 * Reference: NIST Special Publication 811 (https://www.nist.gov/pml/special-publication-811)
 */
import './convert-engine.js'

;(function () {
  window.maratoolConvertEngine({
    prefix: 'cpc',
    categories: {
      capacitance: { label: 'Capacitance', base: 'farad', units: {
        'Kilofarad (kF)': 1e3, // exact SI prefix
        'Farad (F)': 1, // SI derived unit (BIPM)
        'Millifarad (mF)': 1e-3, // exact SI prefix
        'Microfarad (µF)': 1e-6, // exact SI prefix
        'Nanofarad (nF)': 1e-9, // exact SI prefix
        'Picofarad (pF)': 1e-12, // exact SI prefix
        'Abfarad (abF)': 1e9, // exact: CGS-EMU (NIST SP 811)
        'Statfarad (statF)': 1.112650056e-12, // CGS-ESU (NIST SP 811)
      } }
    },
    defaultFrom: 'Microfarad (µF)',
    defaultTo: 'Nanofarad (nF)',
  })
})()
