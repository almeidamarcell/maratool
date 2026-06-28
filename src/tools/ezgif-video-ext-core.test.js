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
  buildVideoFiltersArgs,
  buildVideoStabilizerArgs,
  buildSubtitlesArgs,
  buildInterpolateArgs,
  buildAnimatedToGifArgs,
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

describe('buildVideoFiltersArgs', () => {
  it('applies video filter', () => {
    const args = buildVideoFiltersArgs({ inputName: 'in.mp4', outputName: 'out.mp4', filter: 'hue=s=0' })
    expect(args.join(' ')).toContain('hue=s=0')
  })
})

describe('buildVideoStabilizerArgs', () => {
  it('uses deshake filter', () => {
    expect(buildVideoStabilizerArgs({ inputName: 'in.mp4', outputName: 'out.mp4' }).join(' ')).toContain('deshake')
  })
})

describe('buildInterpolateArgs', () => {
  it('uses minterpolate for higher fps', () => {
    expect(buildInterpolateArgs({ inputName: 'in.mp4', outputName: 'out.mp4', fps: 30 }).join(' ')).toContain('minterpolate')
  })
})

describe('buildAnimatedToGifArgs', () => {
  it('converts animated format to gif with fps and scale', () => {
    const args = buildAnimatedToGifArgs({ inputName: 'in.webp', outputName: 'out.gif', fps: 10, width: 480 })
    expect(args.join(' ')).toContain('fps=10')
    expect(args.join(' ')).toContain('scale=480')
  })
})

describe('getVideoExtOutputFilename', () => {
  it('replaces extension with suffix', () => {
    expect(getVideoExtOutputFilename('clip.mp4', 'reversed', '.mp4')).toBe('clip-reversed.mp4')
    expect(getVideoExtOutputFilename('anim.gif', 'mp4', '.mp4')).toBe('anim-mp4.mp4')
  })
})
