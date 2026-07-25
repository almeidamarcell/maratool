/**
 * Conductance Converter — config for the shared linear conversion engine.
 * Factors are multiply-to-base; each line cites its source for factor audit.
 * Reference: NIST Special Publication 811 (https://www.nist.gov/pml/special-publication-811)
 */
import './convert-engine.js'

;(function () {
  window.maratoolConvertEngine({
    prefix: 'cdc',
    categories: {
      conductance: { label: 'Electrical conductance', base: 'siemens', units: {
        'Kilosiemens (kS)': 1e3, // exact SI prefix
        'Siemens (S)': 1, // SI derived unit (BIPM)
        'Millisiemens (mS)': 1e-3, // exact SI prefix
        'Microsiemens (µS)': 1e-6, // exact SI prefix
        'Mho (℧)': 1, // exact: legacy name for siemens (NIST SP 811)
        'Micromho (µ℧)': 1e-6, // exact
        'Abmho (ab℧)': 1e9, // exact: CGS-EMU (NIST SP 811)
        'Statmho (stat℧)': 1.112650056e-12, // CGS-ESU (NIST SP 811)
      } }
    },
    defaultFrom: 'Microsiemens (µS)',
    defaultTo: 'Millisiemens (mS)',
  })
})()
