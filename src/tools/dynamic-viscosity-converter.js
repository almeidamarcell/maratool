/**
 * Dynamic Viscosity — config for the shared linear conversion engine.
 * Factors are multiply-to-base; each line cites its source for factor audit.
 * Reference: NIST Special Publication 811 (https://www.nist.gov/pml/special-publication-811)
 */
import './convert-engine.js'

;(function () {
  window.maratoolConvertEngine({
    prefix: 'dvc',
    categories: {
      dynvisc: { label: 'Dynamic viscosity', base: 'pascal-second', units: {
        'Pascal-second (Pa·s)': 1, // base unit (SI)
        'Millipascal-second (mPa·s)': 0.001, // exact
        'Poise (P)': 0.1, // exact: NIST SP 811
        'Centipoise (cP)': 0.001, // exact: NIST SP 811
        'Pound per foot-second (lb/(ft·s))': 1.4881639435695542, // exact: 0.45359237/0.3048
        'Pound-force second per square foot (lbf·s/ft²)': 47.88025898033584, // exact: NIST SP 811 (slug/(ft·s))
        'Kilogram per meter-hour (kg/(m·h))': 0.0002777777777777778, // exact fraction: 1/3600
      } }
    },
    defaultFrom: 'Centipoise (cP)',
    defaultTo: 'Pascal-second (Pa·s)',
  })
})()
