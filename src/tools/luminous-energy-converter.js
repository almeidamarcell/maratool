/**
 * Luminous Energy — config for the shared linear conversion engine.
 * Factors are multiply-to-base; each line cites its source for factor audit.
 * Reference: BIPM SI Brochure (https://www.bipm.org/en/publications/si-brochure)
 */
import './convert-engine.js'

;(function () {
  window.maratoolConvertEngine({
    prefix: 'lec',
    categories: {
      lumenergy: { label: 'Luminous energy', base: 'lumen-second', units: {
        'Kilolumen-second (klm·s)': 1e3, // exact
        'Lumen-second (lm·s)': 1, // SI practice unit (BIPM)
        'Talbot (T)': 1, // exact: synonym for lm·s
        'Lumen-minute (lm·min)': 60, // exact
        'Lumen-hour (lm·h)': 3600, // exact
      } }
    },
    defaultFrom: 'Lumen-hour (lm·h)',
    defaultTo: 'Lumen-second (lm·s)',
  })
})()
