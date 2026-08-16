import { describe, it, expect } from 'vitest'
import { crc32, buildZip, dosDateTime, uniqueZipName } from './zip-store-core.js'

const bytes = str => new TextEncoder().encode(str)
const u32 = (b, o) => new DataView(b.buffer, b.byteOffset).getUint32(o, true)
const u16 = (b, o) => new DataView(b.buffer, b.byteOffset).getUint16(o, true)

describe('crc32', () => {
  it('matches the reference values for known inputs', () => {
    expect(crc32(bytes(''))).toBe(0)
    expect(crc32(bytes('a'))).toBe(0xe8b7be43)
    expect(crc32(bytes('123456789'))).toBe(0xcbf43926)
    expect(crc32(bytes('The quick brown fox jumps over the lazy dog'))).toBe(0x414fa339)
  })

  it('handles bytes above 0x7f without sign trouble', () => {
    expect(crc32(new Uint8Array([0xff, 0xfe, 0x80]))).toBeGreaterThan(0)
    expect(crc32(new Uint8Array([0xff]))).toBe(0xff000000)
  })
})

describe('buildZip', () => {
  const files = [
    { name: 'sheet-01.png', data: bytes('first tile bytes') },
    { name: 'sheet-02.png', data: bytes('second tile bytes, longer') },
  ]
  const zip = buildZip(files, new Date(2026, 0, 2, 3, 4, 6))

  it('starts with a local file header and ends with the EOCD record', () => {
    expect(u32(zip, 0)).toBe(0x04034b50)
    expect(u32(zip, zip.length - 22)).toBe(0x06054b50)
  })

  it('records every file once in the central directory', () => {
    const eocd = zip.length - 22
    expect(u16(zip, eocd + 8)).toBe(2)
    expect(u16(zip, eocd + 10)).toBe(2)
    const centralSize = u32(zip, eocd + 12)
    const centralOffset = u32(zip, eocd + 16)
    expect(centralOffset + centralSize).toBe(eocd)
    expect(u32(zip, centralOffset)).toBe(0x02014b50)
  })

  it('stores the payload uncompressed with matching sizes and CRC', () => {
    expect(u16(zip, 8)).toBe(0) // method 0 = stored
    // Bit 11 tells the unzipper the name is UTF-8; without it an accented
    // filename comes out as mojibake on Windows.
    expect(u16(zip, 6) & 0x0800).toBe(0x0800)
    expect(u32(zip, 14)).toBe(crc32(files[0].data))
    expect(u32(zip, 18)).toBe(files[0].data.length)
    expect(u32(zip, 22)).toBe(files[0].data.length)
    const nameLen = u16(zip, 26)
    expect(nameLen).toBe(files[0].name.length)
    const payload = zip.slice(30 + nameLen, 30 + nameLen + files[0].data.length)
    expect(new TextDecoder().decode(payload)).toBe('first tile bytes')
  })

  it('points each central entry at its local header', () => {
    const centralOffset = u32(zip, zip.length - 22 + 16)
    expect(u32(zip, centralOffset + 42)).toBe(0)
    const secondEntry = centralOffset + 46 + files[0].name.length
    const secondLocal = u32(zip, secondEntry + 42)
    expect(secondLocal).toBe(30 + files[0].name.length + files[0].data.length)
    expect(u32(zip, secondLocal)).toBe(0x04034b50)
  })

  it('produces a valid empty archive', () => {
    const empty = buildZip([])
    expect(empty.length).toBe(22)
    expect(u32(empty, 0)).toBe(0x06054b50)
  })

  it('accepts ArrayBuffer payloads', () => {
    const out = buildZip([{ name: 'a.bin', data: bytes('hello').buffer }])
    expect(u32(out, 18)).toBe(5)
  })
})

describe('dosDateTime', () => {
  it('packs the date and time into DOS fields', () => {
    const { date, time } = dosDateTime(new Date(2026, 7, 15, 13, 30, 20))
    expect((date >> 9) + 1980).toBe(2026)
    expect((date >> 5) & 0x0f).toBe(8)
    expect(date & 0x1f).toBe(15)
    expect(time >> 11).toBe(13)
    expect((time >> 5) & 0x3f).toBe(30)
  })

  it('clamps years before 1980 instead of writing a negative field', () => {
    expect(dosDateTime(new Date(1970, 0, 1)).date >> 9).toBe(0)
  })
})

describe('uniqueZipName', () => {
  it('leaves the first use of a name alone', () => {
    const taken = {}
    expect(uniqueZipName('tile.png', taken)).toBe('tile.png')
  })

  it('suffixes repeats before the extension', () => {
    const taken = {}
    uniqueZipName('tile.png', taken)
    expect(uniqueZipName('tile.png', taken)).toBe('tile-2.png')
    expect(uniqueZipName('tile.png', taken)).toBe('tile-3.png')
  })

  it('handles names with no extension', () => {
    const taken = {}
    uniqueZipName('README', taken)
    expect(uniqueZipName('README', taken)).toBe('README-2')
  })
})
