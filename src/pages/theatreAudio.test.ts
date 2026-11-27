import { describe, expect, it } from 'vitest'
import { pitch } from './theatreAudio'
describe('vocal pitch estimation', () => {
  it.each([110, 220, 330])('estimates a clear %i Hz tone', frequency => {
    const rate = 48000
    const samples = Float32Array.from({length: 2048}, (_, i) => .25 * Math.sin(2 * Math.PI * frequency * i / rate))
    expect(pitch(samples, rate)).toBeCloseTo(frequency, -1)
  })
  it('does not report pitch for silence', () => {
    expect(pitch(new Float32Array(2048), 48000)).toBeNull()
  })
})
