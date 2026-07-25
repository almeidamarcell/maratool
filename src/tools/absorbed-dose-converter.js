/**
 * Gray to Rad — config for the shared linear conversion engine.
 * Factors are multiply-to-base; each line cites its source for factor audit.
 * Reference: US NRC — Measuring Radiation (https://www.nrc.gov/about-nrc/radiation/health-effects/measuring-radiation.html)
 */
import './convert-engine.js'

;(function () {
  window.maratoolConvertEngine({
    prefix: 'adc',
    categories: {
      absdose: { label: 'Absorbed dose', base: 'gray', units: {
        'Kilogray (kGy)': 1e3, // exact SI prefix
        'Gray (Gy)': 1, // SI derived unit: 1 J/kg (BIPM)
        'Centigray (cGy)': 0.01, // exact (common in radiotherapy)
        'Milligray (mGy)': 1e-3, // exact SI prefix
        'Microgray (µGy)': 1e-6, // exact SI prefix
        'Rad (rad)': 0.01, // exact: NIST SP 811 / US NRC
        'Millirad (mrad)': 1e-5, // exact
      } }
    },
    defaultFrom: 'Gray (Gy)',
    defaultTo: 'Rad (rad)',
  })
})()
