import { describe, expect, test } from 'vitest'
import {
  getCodecs,
  toArgs,
  isVideoFormat,
  isAudioFormat,
  isAlacOutput,
  buildFfmpegCommand,
  buildVideoToVideoArgs,
  VIDEO_FORMAT_EXTENSIONS,
  AUDIO_OUTPUT_EXTENSIONS,
} from './vert-converter-ffmpeg-core.js'

describe('isVideoFormat / isAudioFormat', () => {
  test('classifies VERT ffmpeg formats', () => {
    expect(isVideoFormat('mp4')).toBe(true)
    expect(isVideoFormat('mkv')).toBe(true)
    expect(isAudioFormat('mp3')).toBe(true)
    expect(isAudioFormat('flac')).toBe(true)
    expect(isAudioFormat('mp4')).toBe(false)
  })
})

describe('getCodecs', () => {
  test('returns VERT codec pairs for common formats', () => {
    expect(getCodecs('.mp4')).toEqual({ video: 'libx264', audio: 'aac' })
    expect(getCodecs('.webm')).toEqual({ video: 'libvpx', audio: 'libvorbis' })
    expect(getCodecs('.mp3')).toEqual({ video: 'libx264', audio: 'libmp3lame' })
    expect(getCodecs('.m4a', true)).toEqual({ video: 'libx264', audio: 'alac' })
  })
})

describe('toArgs', () => {
  test('adds libx264 preset for h264 outputs', () => {
    var args = toArgs('.mp4')
    expect(args).toContain('-c:v')
    expect(args).toContain('libx264')
    expect(args).toContain('-preset')
    expect(args).toContain('ultrafast')
  })

  test('prepends avi format for divx', () => {
    var args = toArgs('.divx')
    expect(args[0]).toBe('-f')
    expect(args[1]).toBe('avi')
  })
})

describe('isAlacOutput', () => {
  test('detects alac target', () => {
    expect(isAlacOutput('.alac')).toBe(true)
    expect(isAlacOutput('.mp3')).toBe(false)
  })
})

describe('buildFfmpegCommand', () => {
  test('video to audio extracts audio stream', () => {
    var cmd = buildFfmpegCommand({
      inputFormat: 'mp4',
      outputFormat: 'mp3',
      settings: { quality: '128', sampleRate: '44100', keepMetadata: false },
    })
    expect(cmd).toContain('-map')
    expect(cmd).toContain('0:a:0')
    expect(cmd[cmd.length - 1]).toBe('output.mp3')
  })

  test('audio to audio uses codec from getCodecs', () => {
    var cmd = buildFfmpegCommand({
      inputFormat: 'wav',
      outputFormat: 'mp3',
      settings: { quality: '192', sampleRate: 'auto', keepMetadata: true },
    })
    expect(cmd).toContain('-c:a')
    expect(cmd).toContain('libmp3lame')
    expect(cmd).toContain('-b:a')
    expect(cmd).toContain('192k')
  })

  test('audio to video uses lavfi color background', () => {
    var cmd = buildFfmpegCommand({
      inputFormat: 'mp3',
      outputFormat: 'mp4',
      settings: { quality: 'auto', sampleRate: 'auto', keepMetadata: false },
      hasAlbumArt: false,
    })
    expect(cmd).toContain('lavfi')
    expect(cmd).toContain('color=c=black:s=512x512:rate=1')
  })

  test('alac output rewrites to m4a container', () => {
    var cmd = buildFfmpegCommand({
      inputFormat: 'flac',
      outputFormat: 'alac',
      settings: { quality: 'auto', sampleRate: 'auto', keepMetadata: true },
    })
    expect(cmd[cmd.length - 1]).toBe('output.m4a')
    expect(cmd).toContain('alac')
  })
})

describe('buildVideoToVideoArgs', () => {
  test('builds re-encode args for video conversion', () => {
    var args = buildVideoToVideoArgs({
      inputName: 'input.mov',
      outputName: 'output.mp4',
      inputFormat: 'mov',
      outputFormat: 'mp4',
    })
    expect(args[0]).toBe('-i')
    expect(args[1]).toBe('input.mov')
    expect(args).toContain('-c:v')
    expect(args).toContain('libx264')
    expect(args[args.length - 1]).toBe('output.mp4')
  })

  test('uses webm codecs for webm output', () => {
    var args = buildVideoToVideoArgs({
      inputName: 'in.mp4',
      outputName: 'out.webm',
      inputFormat: 'mp4',
      outputFormat: 'webm',
    })
    expect(args).toContain('libvpx')
    expect(args).toContain('libvorbis')
  })
})

describe('format lists', () => {
  test('matches VERT native audio and video output counts', () => {
    expect(AUDIO_OUTPUT_EXTENSIONS.length).toBeGreaterThanOrEqual(18)
    expect(VIDEO_FORMAT_EXTENSIONS.length).toBeGreaterThanOrEqual(22)
  })
})
