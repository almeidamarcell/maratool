/**
 * Bandwidth Converter — config for the shared linear conversion engine.
 * Factors are multiply-to-base; each line cites its source for factor audit.
 * Reference: BIPM SI Brochure (https://www.bipm.org/en/publications/si-brochure)
 */
import './convert-engine.js'

;(function () {
  window.maratoolConvertEngine({
    prefix: 'bwc',
    categories: {
      bandwidth: { label: 'Bandwidth', base: 'bit per second', units: {
        'Bit per second (bit/s)': 1, // base unit
        'Kilobit per second (kbit/s)': 1e3, // decimal SI prefix (exact)
        'Megabit per second (Mbit/s)': 1e6, // decimal SI prefix (exact)
        'Gigabit per second (Gbit/s)': 1e9, // decimal SI prefix (exact)
        'Terabit per second (Tbit/s)': 1e12, // decimal SI prefix (exact)
        'Byte per second (B/s)': 8, // exact: 1 byte = 8 bits
        'Kilobyte per second (kB/s)': 8e3, // decimal: 1000 B/s
        'Megabyte per second (MB/s)': 8e6, // decimal: 10⁶ B/s
        'Gigabyte per second (GB/s)': 8e9, // decimal: 10⁹ B/s
        'Mebibyte per second (MiB/s)': 8388608, // binary: 1 MiB = 1 048 576 B (exact)
        'Gibibyte per second (GiB/s)': 8589934592, // binary: 1 GiB = 1 073 741 824 B (exact)
      } }
    },
    defaultFrom: 'Megabit per second (Mbit/s)',
    defaultTo: 'Megabyte per second (MB/s)',
  })
})()
