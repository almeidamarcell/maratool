/**
 * Tesla to Gauss — config for the shared linear conversion engine.
 * Factors are multiply-to-base; each line cites its source for factor audit.
 * Reference: NIST Special Publication 811 (https://www.nist.gov/pml/special-publication-811)
 */
import './convert-engine.js'

;(function () {
  window.maratoolConvertEngine({
    prefix: 'mgc',
    categories: {
      magfield: { label: 'Magnetic flux density', base: 'tesla', units: {
        'Tesla (T)': 1, // SI derived unit (BIPM)
        'Millitesla (mT)': 1e-3, // exact SI prefix
        'Microtesla (µT)': 1e-6, // exact SI prefix
        'Nanotesla (nT)': 1e-9, // exact SI prefix
        'Kilogauss (kG)': 0.1, // exact: 1000 G
        'Gauss (G)': 1e-4, // exact: NIST SP 811
        'Milligauss (mG)': 1e-7, // exact
        'Gamma (γ)': 1e-9, // exact: NIST SP 811 (= 1 nT)
      } }
    },
    defaultFrom: 'Tesla (T)',
    defaultTo: 'Gauss (G)',
  })
})()
