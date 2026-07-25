/**
 * Force Converter — config for the shared linear conversion engine.
 * Factors are multiply-to-base; each line cites its source for factor audit.
 * Reference: NIST Special Publication 811 (https://www.nist.gov/pml/special-publication-811)
 */
import './convert-engine.js'

;(function () {
  window.maratoolConvertEngine({
    prefix: 'foc',
    categories: {
      force: { label: 'Force', base: 'newton', units: {
        'Newton (N)': 1, // base unit
        'Kilonewton (kN)': 1000, // exact
        'Kilogram-force (kgf)': 9.80665, // exact: standard gravity (NIST SP 811)
        'Gram-force (gf)': 0.00980665, // exact: kgf/1000
        'Pound-force (lbf)': 4.4482216152605, // exact: NIST SP 811
        'Ounce-force (ozf)': 0.27801385095378125, // exact: lbf/16
        'Poundal (pdl)': 0.138254954376, // exact: NIST SP 811
        'Dyne (dyn)': 1e-5, // exact: NIST SP 811
      } }
    },
    defaultFrom: 'Kilogram-force (kgf)',
    defaultTo: 'Newton (N)',
  })
})()
