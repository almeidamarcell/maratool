import { describe, it, expect } from 'vitest'
import {
  buildCutAudioArgs,
  buildCompressAudioArgs,
  buildMergeAudioArgs,
  buildFadeAudioArgs,
  buildAudioSpeedArgs,
  buildBoostVolumeArgs,
  buildAudioDenoiseArgs,
  buildWaveformImageArgs,
  getAudioOutputFilename,
  validateAudioBitrate,
} from './ezgif-audio-core.js'

describe('buildCutAudioArgs', () => {
  it('trims audio losslessly when possible', () => {
    expect(buildCutAudioArgs({
      inputName: 'in.mp3',
      outputName: 'out.mp3',
      start: 10,
      end: 30,
    })).toEqual([
      '-ss', '10',
      '-to', '30',
      '-i', 'in.mp3',
      '-c', 'copy',
      '-y', 'out.mp3',
    ])
  })
})

describe('buildCompressAudioArgs', () => {
  it('re-encodes mp3 at target bitrate', () => {
    const args = buildCompressAudioArgs({
      inputName: 'in.wav',
      outputName: 'out.mp3',
      bitrateKbps: 128,
    })
    expect(args).toContain('-b:a')
    expect(args[args.indexOf('-b:a') + 1]).toBe('128k')
  })
})

describe('buildMergeAudioArgs', () => {
  it('concatenates via demuxer list', () => {
    expect(buildMergeAudioArgs({ listFile: 'list.txt', outputName: 'merged.mp3' })).toEqual([
      '-f', 'concat',
      '-safe', '0',
      '-i', 'list.txt',
      '-c', 'copy',
      '-y', 'merged.mp3',
    ])
  })
})

describe('buildFadeAudioArgs', () => {
  it('applies afade in and out', () => {
    const args = buildFadeAudioArgs({
      inputName: 'in.mp3',
      outputName: 'out.mp3',
      fadeInSeconds: 1,
      fadeOutSeconds: 2,
      durationSeconds: 60,
    })
    expect(args.join(' ')).toContain('afade')
  })
})

describe('buildAudioSpeedArgs', () => {
  it('changes tempo with atempo', () => {
    const args = buildAudioSpeedArgs({ inputName: 'in.mp3', outputName: 'out.mp3', speed: 1.5 })
    expect(args.join(' ')).toContain('atempo=1.5')
  })
})

describe('buildBoostVolumeArgs', () => {
  it('applies volume filter in decibels', () => {
    const args = buildBoostVolumeArgs({ inputName: 'in.mp3', outputName: 'out.mp3', gainDb: 6 })
    expect(args.join(' ')).toContain('volume=6dB')
  })
})

describe('buildAudioDenoiseArgs', () => {
  it('applies afftdn filter', () => {
    expect(buildAudioDenoiseArgs({ inputName: 'in.mp3', outputName: 'out.mp3' }).join(' ')).toContain('afftdn')
  })
})

describe('buildWaveformImageArgs', () => {
  it('renders waveform as png', () => {
    const args = buildWaveformImageArgs({ inputName: 'in.mp3', outputName: 'wave.png', width: 800, height: 150 })
    expect(args.join(' ')).toContain('showwavespic')
  })
})

describe('validateAudioBitrate', () => {
  it('accepts common bitrates', () => {
    expect(validateAudioBitrate(128).valid).toBe(true)
    expect(validateAudioBitrate(7).valid).toBe(false)
  })
})

describe('getAudioOutputFilename', () => {
  it('inserts suffix before extension', () => {
    expect(getAudioOutputFilename('song.mp3', 'trimmed')).toBe('song-trimmed.mp3')
  })
})
