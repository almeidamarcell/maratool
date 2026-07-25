/**
 * Field Strength — config for the shared linear conversion engine.
 * Factors are multiply-to-base; each line cites its source for factor audit.
 * Reference: NIST Special Publication 811 (https://www.nist.gov/pml/special-publication-811)
 */
import './convert-engine.js'

;(function () {
  window.maratoolConvertEngine({
    prefix: 'msc',
    categories: {
      magstrength: { label: 'Magnetic field strength', base: 'ampere per meter', units: {
        'Kiloampere per meter (kA/m)': 1e3, // exact
        'Ampere per meter (A/m)': 1, // SI unit (BIPM)
        'Ampere per centimeter (A/cm)': 100, // exact
        'Kilooersted (kOe)': 79577.47154594767, // exact-derived: 1000 × Oe
        'Oersted (Oe)': 79.57747154594767, // exact-derived: 1000/(4π) A/m (NIST SP 811)
        'Millioersted (mOe)': 0.07957747154594767, // exact-derived: Oe/1000
      } }
    },
    defaultFrom: 'Oersted (Oe)',
    defaultTo: 'Ampere per meter (A/m)',
  })
})()
