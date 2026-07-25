/**
 * Energy Converter — config for the shared linear conversion engine.
 * Factors are multiply-to-base; each line cites its source for factor audit.
 * Reference: NIST Special Publication 811 (https://www.nist.gov/pml/special-publication-811)
 */
import './convert-engine.js'

;(function () {
  window.maratoolConvertEngine({
    prefix: 'enc',
    categories: {
      energy: { label: 'Energy', base: 'joule', units: {
        'Joule (J)': 1, // base unit
        'Kilojoule (kJ)': 1000, // exact
        'Megajoule (MJ)': 1e6, // exact
        'Watt-hour (Wh)': 3600, // exact: NIST SP 811
        'Kilowatt-hour (kWh)': 3.6e6, // exact: NIST SP 811
        'Calorie, thermochemical (cal)': 4.184, // exact: NIST SP 811
        'Kilocalorie / food Calorie (kcal)': 4184, // exact: NIST SP 811
        'BTU, International Table (BTU)': 1055.05585262, // exact: NIST SP 811
        'Foot-pound (ft·lbf)': 1.3558179483314004, // exact: NIST SP 811
        'Electronvolt (eV)': 1.602176634e-19, // exact: 2019 SI (BIPM)
      } }
    },
    defaultFrom: 'Kilocalorie / food Calorie (kcal)',
    defaultTo: 'Kilojoule (kJ)',
  })
})()
