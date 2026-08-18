/**
 * Kinematic Viscosity — config for the shared linear conversion engine.
 * Factors are multiply-to-base; each line cites its source for factor audit.
 * Reference: NIST Special Publication 811 (https://www.nist.gov/pml/special-publication-811)
 */
import './convert-engine.js'

;(function () {
  window.maratoolConvertEngine({
    prefix: 'kvc',
    categories: {
      kinvisc: { label: 'Kinematic viscosity', base: 'square meter per second', units: {
        'Square meter per second (m²/s)': 1, // base unit (SI)
        'Square centimeter per second / Stokes (St)': 1e-4, // exact: NIST SP 811
        'Centistokes (cSt)': 1e-6, // exact: NIST SP 811
        'Square millimeter per second (mm²/s)': 1e-6, // exact (identical to cSt)
        'Square foot per second (ft²/s)': 0.09290304, // exact: NIST SP 811
        'Square inch per second (in²/s)': 0.00064516, // exact: NIST SP 811
      } }
    },
    defaultFrom: 'Centistokes (cSt)',
    defaultTo: 'Square meter per second (m²/s)',
  })
})()
