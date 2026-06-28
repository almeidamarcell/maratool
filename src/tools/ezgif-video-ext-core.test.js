import { describe, it, expect } from 'vitest'
import {
  buildVideoToApngArgs,
  buildVideoToWebpArgs,
  buildVideoToAvifArgs,
  buildGifToMp4Args,
  buildMergeVideosArgs,
  buildReverseVideoArgs,
  buildVideoSpeedArgs,
  buildFreezeVideoArgs,
  buildVideoScreenshotArgs,
  buildImagesToVideoArgs,
  getVideoExtOutputFilename,
  validateFps,
} from './ezgif-video-ext-core.js'

describe('buildVideoToApngArgs', () => {
  it('trims, scales, and muxes to apng', () => {
    expect(buildVideoToApngArgs({
      inputName: 'in.mp4',
      outputName: 'out.apng',
      start: 1,
      end: 5,
      fps: 15,
      width: 480,
    })).toEqual([
      '-ss', '1',
      '-to', '5',
      '-i', 'in.mp4',
      '-vf', 'fps=15,scale=480:-1:flags=lanczos',
      '-f', 'apng',
      '-plays', '0',
      '-y', 'out.apng',
    ])
  })
})

describe('buildVideoToWebpArgs', () => {
  it('outputs animated webp', () => {
    const args = buildVideoToWebpArgs({ inputName: 'in.mp4', outputName: 'out.webp', fps: 10 })
    expect(args).toContain('-f')
    expect(args[args.indexOf('-f') + 1]).toBe('webp')
    expect(args).toContain('-loop')
  })
})

describe('buildGifToMp4Args', () => {
  it('converts gif to h264 mp4', () => {
    const args = buildGifToMp4Args({ inputName: 'in.gif', outputName: 'out.mp4' })
    expect(args).toContain('-i')
    expect(args).toContain('in.gif')
    expect(args).toContain('-c:v')
    expect(args[args.indexOf('-c:v') + 1]).toBe('libx264')
  })
})

describe('buildMergeVideosArgs', () => {
  it('builds concat demuxer file list args', () => {
    expect(buildMergeVideosArgs({
      listFile: 'list.txt',
      outputName: 'merged.mp4',
    })).toEqual([
      '-f', 'concat',
      '-safe', '0',
      '-i', 'list.txt',
      '-c', 'copy',
      '-y', 'merged.mp4',
    ])
  })
})

describe('buildReverseVideoArgs', () => {
  it('reverses video and audio', () => {
    const args = buildReverseVideoArgs({ inputName: 'in.mp4', outputName: 'out.mp4' })
    expect(args.join(' ')).toContain('reverse')
  })
})

describe('buildVideoSpeedArgs', () => {
  it('speeds up video with setpts and atempo', () => {
    const args = buildVideoSpeedArgs({ inputName: 'in.mp4', outputName: 'out.mp4', speed: 2 })
    expect(args.join(' ')).toContain('setpts')
    expect(args.join(' ')).toContain('atempo')
  })
})

describe('buildFreezeVideoArgs', () => {
  it('inserts tpause filter at timestamp', () => {
    const args = buildFreezeVideoArgs({
      inputName: 'in.mp4',
      outputName: 'out.mp4',
      atSeconds: 2,
      durationSeconds: 1,
    })
    expect(args.join(' ')).toContain('tpad')
  })
})

describe('buildVideoScreenshotArgs', () => {
  it('extracts single frame as png', () => {
    expect(buildVideoScreenshotArgs({
      inputName: 'in.mp4',
      outputName: 'frame.png',
      atSeconds: 3.5,
    })).toEqual([
      '-ss', '3.5',
      '-i', 'in.mp4',
      '-frames:v', '1',
      '-y', 'frame.png',
    ])
  })
})

describe('buildImagesToVideoArgs', () => {
  it('builds slideshow from numbered pattern', () => {
    const args = buildImagesToVideoArgs({
      pattern: 'frame%03d.png',
      outputName: 'out.mp4',
      fps: 2,
    })
    expect(args).toContain('-framerate')
    expect(args).toContain('2')
    expect(args).toContain('frame%03d.png')
  })
})

describe('validateFps', () => {
  it('accepts 1-60 fps', () => {
    expect(validateFps(15).valid).toBe(true)
    expect(validateFps(0).valid).toBe(false)
    expect(validateFps(120).valid).toBe(false)
  })
})

describe('getVideoExtOutputFilename', () => {
  it('replaces extension with suffix', () => {
    expect(getVideoExtOutputFilename('clip.mp4', 'reversed', '.mp4')).toBe('clip-reversed.mp4')
    expect(getVideoExtOutputFilename('anim.gif', 'mp4', '.mp4')).toBe('anim-mp4.mp4')
  })
})
