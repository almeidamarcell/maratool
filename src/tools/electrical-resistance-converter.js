/**
 * Resistance Converter — config for the shared linear conversion engine.
 * Factors are multiply-to-base; each line cites its source for factor audit.
 * Reference: NIST Special Publication 811 (https://www.nist.gov/pml/special-publication-811)
 */
import './convert-engine.js'

;(function () {
  window.maratoolConvertEngine({
    prefix: 'erc',
    categories: {
      resistance: { label: 'Electrical resistance', base: 'ohm', units: {
        'Gigaohm (GΩ)': 1e9, // exact SI prefix
        'Megaohm (MΩ)': 1e6, // exact SI prefix
        'Kiloohm (kΩ)': 1e3, // exact SI prefix
        'Ohm (Ω)': 1, // SI derived unit (BIPM)
        'Milliohm (mΩ)': 1e-3, // exact SI prefix
        'Microohm (µΩ)': 1e-6, // exact SI prefix
        'Abohm (abΩ)': 1e-9, // exact: CGS-EMU (NIST SP 811)
        'Statohm (statΩ)': 8.987551787e11, // CGS-ESU (NIST SP 811)
      } }
    },
    defaultFrom: 'Kiloohm (kΩ)',
    defaultTo: 'Ohm (Ω)',
  })
})()
