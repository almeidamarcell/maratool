/**
 * Electric Potential — config for the shared linear conversion engine.
 * Factors are multiply-to-base; each line cites its source for factor audit.
 * Reference: NIST Special Publication 811 (https://www.nist.gov/pml/special-publication-811)
 */
import './convert-engine.js'

;(function () {
  window.maratoolConvertEngine({
    prefix: 'epc',
    categories: {
      potential: { label: 'Electric potential', base: 'volt', units: {
        'Megavolt (MV)': 1e6, // exact SI prefix
        'Kilovolt (kV)': 1e3, // exact SI prefix
        'Volt (V)': 1, // SI derived unit (BIPM)
        'Millivolt (mV)': 1e-3, // exact SI prefix
        'Microvolt (µV)': 1e-6, // exact SI prefix
        'Abvolt (abV)': 1e-8, // exact: CGS-EMU (NIST SP 811)
        'Statvolt (statV)': 299.792458, // exact: CGS-ESU (NIST SP 811)
      } }
    },
    defaultFrom: 'Millivolt (mV)',
    defaultTo: 'Volt (V)',
  })
})()
