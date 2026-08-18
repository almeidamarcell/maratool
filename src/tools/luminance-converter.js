/**
 * Luminance Converter — config for the shared linear conversion engine.
 * Factors are multiply-to-base; each line cites its source for factor audit.
 * Reference: NIST Special Publication 811 (https://www.nist.gov/pml/special-publication-811)
 */
import './convert-engine.js'

;(function () {
  window.maratoolConvertEngine({
    prefix: 'lmc',
    categories: {
      luminance: { label: 'Luminance', base: 'candela per square meter', units: {
        'Candela per square meter / Nit (cd/m²)': 1, // SI unit (BIPM)
        'Kilocandela per square meter (kcd/m²)': 1e3, // exact
        'Stilb (sb)': 1e4, // exact: cd/cm² (NIST SP 811)
        'Candela per square foot (cd/ft²)': 10.763910416709722, // exact-derived: 1/0.09290304
        'Candela per square inch (cd/in²)': 1550.0031000062, // exact-derived: 1/0.00064516
        'Foot-lambert (fL)': 3.4262590996323, // NIST SP 811: (1/π) cd/ft²
        'Lambert (L)': 3183.098861837907, // NIST SP 811: (10⁴/π) cd/m²
        'Apostilb (asb)': 0.3183098861837907, // exact-derived: 1/π cd/m²
      } }
    },
    defaultFrom: 'Candela per square meter / Nit (cd/m²)',
    defaultTo: 'Foot-lambert (fL)',
  })
})()
