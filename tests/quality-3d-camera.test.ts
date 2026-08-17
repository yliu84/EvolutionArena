import { describe, expect, it } from 'vitest'

import {
  QUALITY_3D_RESCUE_CAMERA,
  createQuality3DCameraPivot,
  quality3DVisibleHeightAtPivot,
  stepQuality3DCameraPivot,
} from '../src/quality-3d-camera'

describe('quality 3D rescue camera', () => {
  it('uses a close perspective composition without becoming a shoulder camera', () => {
    expect(QUALITY_3D_RESCUE_CAMERA.mode).toBe('perspective-spring')
    expect(QUALITY_3D_RESCUE_CAMERA.pitchDegrees).toBeGreaterThanOrEqual(27)
    expect(QUALITY_3D_RESCUE_CAMERA.pitchDegrees).toBeLessThanOrEqual(32)
    expect(quality3DVisibleHeightAtPivot()).toBeGreaterThan(9)
    expect(quality3DVisibleHeightAtPivot()).toBeLessThan(10)
  })

  it('snaps on first use and trails smoothly without overshoot', () => {
    const pivot = createQuality3DCameraPivot()
    stepQuality3DCameraPivot(pivot, 2, 1, -3, 1 / 60)
    expect(pivot).toMatchObject({ x: 2, y: 1, z: -3, active: true })
    stepQuality3DCameraPivot(pivot, 4, 1.5, -3, 1 / 60)
    expect(pivot.x).toBeGreaterThan(2)
    expect(pivot.x).toBeLessThan(4)
    expect(Math.hypot(pivot.x - 4, pivot.z + 3)).toBeLessThanOrEqual(QUALITY_3D_RESCUE_CAMERA.horizontalLeash)
  })

  it('snaps after a teleport instead of dragging the player off screen', () => {
    const pivot = createQuality3DCameraPivot()
    stepQuality3DCameraPivot(pivot, 0, 0, 0, 1 / 60)
    stepQuality3DCameraPivot(pivot, 20, 3, -15, 1 / 60)
    expect(pivot).toMatchObject({ x: 20, y: 3, z: -15, vx: 0, vy: 0, vz: 0 })
  })
})
