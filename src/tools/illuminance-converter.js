/**
 * Lux to Foot-Candles — config for the shared linear conversion engine.
 * Factors are multiply-to-base; each line cites its source for factor audit.
 * Reference: NIST Special Publication 811 (https://www.nist.gov/pml/special-publication-811)
 */
import './convert-engine.js'

;(function () {
  window.maratoolConvertEngine({
    prefix: 'ilc',
    categories: {
      illuminance: { label: 'Illuminance', base: 'lux', units: {
        'Kilolux (klx)': 1e3, // exact SI prefix
        'Lux (lx)': 1, // SI derived unit: lm/m² (BIPM)
        'Lumen per square meter (lm/m²)': 1, // exact: identical to lux
        'Foot-candle (fc)': 10.763910416709722, // exact-derived: 1/0.09290304 (NIST SP 811)
        'Phot (ph)': 1e4, // exact: lm/cm² (NIST SP 811)
        'Nox (nx)': 1e-3, // exact: 1 mlx
      } }
    },
    defaultFrom: 'Foot-candle (fc)',
    defaultTo: 'Lux (lx)',
  })
})()
