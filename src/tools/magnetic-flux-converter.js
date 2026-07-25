/**
 * Magnetic Flux — config for the shared linear conversion engine.
 * Factors are multiply-to-base; each line cites its source for factor audit.
 * Reference: NIST Special Publication 811 (https://www.nist.gov/pml/special-publication-811)
 */
import './convert-engine.js'

;(function () {
  window.maratoolConvertEngine({
    prefix: 'mxc',
    categories: {
      magflux: { label: 'Magnetic flux', base: 'weber', units: {
        'Weber (Wb)': 1, // SI derived unit (BIPM)
        'Milliweber (mWb)': 1e-3, // exact SI prefix
        'Microweber (µWb)': 1e-6, // exact SI prefix
        'Volt-second (V·s)': 1, // exact: identical to weber
        'Tesla square meter (T·m²)': 1, // exact: identical to weber
        'Kilomaxwell (kMx)': 1e-5, // exact
        'Maxwell (Mx)': 1e-8, // exact: NIST SP 811
      } }
    },
    defaultFrom: 'Weber (Wb)',
    defaultTo: 'Maxwell (Mx)',
  })
})()
