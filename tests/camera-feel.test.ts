import { describe, expect, it } from 'vitest'
import { cameraProfileFor, normalizedLookAhead, worldViewSize } from '../src/camera-feel'

describe('responsive combat camera', () => {
  it('shows more world on desktop exploration', () => {
    const profile = cameraProfileFor(1440, 900, false)
    const view = worldViewSize(1280, 720, profile.zoom)
    expect(profile.zoom).toBe(0.88)
    expect(view.width).toBeGreaterThan(1450)
    expect(view.height).toBeGreaterThan(810)
  })

  it('preserves readable entity size on compact landscape', () => {
    expect(cameraProfileFor(844, 390, false).zoom).toBe(1)
    expect(cameraProfileFor(844, 390, true).zoom).toBe(1)
  })

  it('uses a tighter desktop boss framing than exploration', () => {
    expect(cameraProfileFor(1440, 900, true).zoom).toBeGreaterThan(cameraProfileFor(1440, 900, false).zoom)
  })

  it('keeps the camera centered on the player instead of the pointer', () => {
    expect(cameraProfileFor(1440, 900, false).lookAhead).toBe(0)
    expect(cameraProfileFor(844, 390, false).lookAhead).toBe(0)
  })

  it('normalizes diagonal camera look-ahead', () => {
    const offset = normalizedLookAhead(1, 1, 100)
    expect(Math.hypot(offset.x, offset.y)).toBeCloseTo(100)
  })
})
