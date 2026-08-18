/**
 * Acceleration Converter — config for the shared linear conversion engine.
 * Factors are multiply-to-base; each line cites its source for factor audit.
 * Reference: NIST Special Publication 811 (https://www.nist.gov/pml/special-publication-811)
 */
import './convert-engine.js'

;(function () {
  window.maratoolConvertEngine({
    prefix: 'acc',
    categories: {
      acceleration: { label: 'Acceleration', base: 'meter per second squared', units: {
        'Meter per second squared (m/s²)': 1, // base unit
        'Standard gravity (g)': 9.80665, // exact: NIST SP 811
        'Foot per second squared (ft/s²)': 0.3048, // exact: NIST SP 811
        'Gal / centimeter per second squared (Gal)': 0.01, // exact: NIST SP 811
        'Kilometer per hour per second (km/h·s)': 0.2777777777777778, // 1/3.6 (derived, exact fraction)
        'Mile per hour per second (mph/s)': 0.44704, // exact: NIST SP 811
      } }
    },
    defaultFrom: 'Standard gravity (g)',
    defaultTo: 'Meter per second squared (m/s²)',
  })
})()
