/**
 * Luminous Flux — config for the shared linear conversion engine.
 * Factors are multiply-to-base; each line cites its source for factor audit.
 * Reference: BIPM SI Brochure (https://www.bipm.org/en/publications/si-brochure)
 */
import './convert-engine.js'

;(function () {
  window.maratoolConvertEngine({
    prefix: 'lfc',
    categories: {
      lumflux: { label: 'Luminous flux', base: 'lumen', units: {
        'Kilolumen (klm)': 1e3, // exact SI prefix
        'Lumen (lm)': 1, // SI derived unit (BIPM)
        'Millilumen (mlm)': 1e-3, // exact SI prefix
        'Candela-steradian (cd·sr)': 1, // exact: definition of the lumen
      } }
    },
    defaultFrom: 'Kilolumen (klm)',
    defaultTo: 'Lumen (lm)',
  })
})()
