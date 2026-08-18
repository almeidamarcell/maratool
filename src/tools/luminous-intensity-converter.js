/**
 * Luminous Intensity — config for the shared linear conversion engine.
 * Factors are multiply-to-base; each line cites its source for factor audit.
 * Reference: NIST Special Publication 811 (https://www.nist.gov/pml/special-publication-811)
 */
import './convert-engine.js'

;(function () {
  window.maratoolConvertEngine({
    prefix: 'lic',
    categories: {
      lumintensity: { label: 'Luminous intensity', base: 'candela', units: {
        'Kilocandela (kcd)': 1e3, // exact SI prefix
        'Candela (cd)': 1, // SI base unit (BIPM)
        'Millicandela (mcd)': 1e-3, // exact SI prefix
        'Candlepower, modern (cp)': 1, // exact: redefined as 1 cd (NIST)
        'Hefner candle (HK)': 0.903, // NIST: historical German standard
        'International candle (IC)': 1.019, // historical pre-1948 standard
      } }
    },
    defaultFrom: 'Millicandela (mcd)',
    defaultTo: 'Candela (cd)',
  })
})()
