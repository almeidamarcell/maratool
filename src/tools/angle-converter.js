/**
 * Angle Converter — config for the shared linear conversion engine.
 * Factors are multiply-to-base; each line cites its source for factor audit.
 * Reference: BIPM SI Brochure (https://www.bipm.org/en/publications/si-brochure)
 */
import './convert-engine.js'

;(function () {
  window.maratoolConvertEngine({
    prefix: 'anc',
    categories: {
      angle: { label: 'Angle', base: 'degree', units: {
        'Degree (°)': 1, // base unit
        'Radian (rad)': 57.29577951308232, // 180/π (BIPM SI Brochure)
        'Milliradian (mrad)': 0.05729577951308232, // rad/1000
        'Gradian (gon)': 0.9, // exact: 400 gon = 360°
        'Arcminute (′)': 0.016666666666666666, // exact: 1/60 degree
        'Arcsecond (″)': 0.0002777777777777778, // exact: 1/3600 degree
        'Turn (tr)': 360, // exact: full revolution
      } }
    },
    defaultFrom: 'Degree (°)',
    defaultTo: 'Radian (rad)',
  })
})()
