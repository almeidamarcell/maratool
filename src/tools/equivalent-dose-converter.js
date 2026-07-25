/**
 * Sievert to Rem — config for the shared linear conversion engine.
 * Factors are multiply-to-base; each line cites its source for factor audit.
 * Reference: US NRC — Measuring Radiation (https://www.nrc.gov/about-nrc/radiation/health-effects/measuring-radiation.html)
 */
import './convert-engine.js'

;(function () {
  window.maratoolConvertEngine({
    prefix: 'edc',
    categories: {
      eqdose: { label: 'Equivalent dose', base: 'sievert', units: {
        'Sievert (Sv)': 1, // SI derived unit (BIPM)
        'Millisievert (mSv)': 1e-3, // exact SI prefix
        'Microsievert (µSv)': 1e-6, // exact SI prefix
        'Rem (rem)': 0.01, // exact: NIST SP 811 / US NRC
        'Millirem (mrem)': 1e-5, // exact
        'Microrem (µrem)': 1e-8, // exact
      } }
    },
    defaultFrom: 'Millisievert (mSv)',
    defaultTo: 'Millirem (mrem)',
  })
})()
