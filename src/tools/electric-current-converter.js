/**
 * Electric Current — config for the shared linear conversion engine.
 * Factors are multiply-to-base; each line cites its source for factor audit.
 * Reference: BIPM SI Brochure (https://www.bipm.org/en/publications/si-brochure)
 */
import './convert-engine.js'

;(function () {
  window.maratoolConvertEngine({
    prefix: 'cuc',
    categories: {
      current: { label: 'Electric current', base: 'ampere', units: {
        'Kiloampere (kA)': 1e3, // exact SI prefix
        'Ampere (A)': 1, // SI base unit (BIPM)
        'Milliampere (mA)': 1e-3, // exact SI prefix
        'Microampere (µA)': 1e-6, // exact SI prefix
        'Nanoampere (nA)': 1e-9, // exact SI prefix
        'Abampere / Biot (abA)': 10, // exact: CGS-EMU (NIST SP 811)
        'Statampere (statA)': 3.335640951e-10, // CGS-ESU (NIST SP 811)
      } }
    },
    defaultFrom: 'Milliampere (mA)',
    defaultTo: 'Ampere (A)',
  })
})()
