/**
 * Magnetomotive Force — config for the shared linear conversion engine.
 * Factors are multiply-to-base; each line cites its source for factor audit.
 * Reference: NIST Special Publication 811 (https://www.nist.gov/pml/special-publication-811)
 */
import './convert-engine.js'

;(function () {
  window.maratoolConvertEngine({
    prefix: 'mmf',
    categories: {
      mmf: { label: 'Magnetomotive force', base: 'ampere-turn', units: {
        'Kiloampere-turn (kAt)': 1e3, // exact
        'Ampere-turn (At)': 1, // SI practice unit (= ampere, BIPM)
        'Milliampere-turn (mAt)': 1e-3, // exact
        'Gilbert (Gb)': 0.7957747154594768, // exact-derived: 10/(4π) At (NIST SP 811)
        'Kilogilbert (kGb)': 795.7747154594768, // exact-derived: 1000 × Gb
      } }
    },
    defaultFrom: 'Gilbert (Gb)',
    defaultTo: 'Ampere-turn (At)',
  })
})()
