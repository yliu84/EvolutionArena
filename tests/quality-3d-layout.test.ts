import { describe, expect, it } from 'vitest'
import {
  QUALITY_3D,
  QUALITY_3D_MOVE_FACING_TOLERANCE_RADIANS,
  canQuality3DTranslateAfterTurn,
  getQuality3DFootprint,
  inspectQuality3DFootprint,
  isQuality3DBridge,
  isQuality3DRiver,
  isQuality3DWalkable,
  quality3DFootprintProbes,
  quality3DEastBoundaryX,
  quality3DRiverCenterZ,
  quality3DRiverHalfWidth,
  quality3DWestBoundaryX,
  shortestAngleDelta,
  terrainHeight,
  turnToward,
} from '../src/quality-3d-layout'

describe('quality 3D terrain and turning', () => {
  it('uses one authored height contract for bridge, river and arena', () => {
    expect(terrainHeight(QUALITY_3D.bridge.centerX, 12)).toBe(QUALITY_3D.bridge.height)
    expect(isQuality3DBridge(QUALITY_3D.bridge.centerX, 12)).toBe(true)
    expect(isQuality3DBridge(4.85, 8.88)).toBe(false)
    expect(terrainHeight(0, 12)).toBeLessThan(-1)
    expect(terrainHeight(-16, 0)).toBeGreaterThan(3)
  })

  it('allows the bridge but rejects river and cliff walls', () => {
    expect(isQuality3DWalkable(8, 12)).toBe(true)
    expect(isQuality3DWalkable(0, 12)).toBe(false)
    expect(isQuality3DWalkable(-14, 0)).toBe(false)
    expect(isQuality3DWalkable(0, 0)).toBe(true)
    expect(isQuality3DWalkable(0, 17)).toBe(true)
  })

  it('builds a curved river with rising sand banks from the same topology', () => {
    const westCenter = quality3DRiverCenterZ(-10)
    const eastCenter = quality3DRiverCenterZ(10)
    expect(Math.abs(westCenter - eastCenter)).toBeGreaterThan(1)
    expect(isQuality3DRiver(0, quality3DRiverCenterZ(0))).toBe(true)
    expect(isQuality3DWalkable(0, quality3DRiverCenterZ(0))).toBe(false)
    const riverbed = terrainHeight(0, quality3DRiverCenterZ(0))
    const sandBank = terrainHeight(0, quality3DRiverCenterZ(0) + quality3DRiverHalfWidth(0) + 0.8)
    expect(sandBank).toBeGreaterThan(riverbed)
  })

  it('uses irregular east and west cliff boundaries and an open-map camera scale', () => {
    expect(quality3DWestBoundaryX(-8)).not.toBeCloseTo(quality3DWestBoundaryX(8))
    expect(quality3DEastBoundaryX(-8)).not.toBeCloseTo(quality3DEastBoundaryX(8))
    expect(QUALITY_3D.camera.viewHeight).toBeGreaterThanOrEqual(19)
    expect(QUALITY_3D.player.radius).toBeLessThan(0.5)
  })

  it('turns through the shortest wrapped angle without snapping', () => {
    const from = Math.PI - 0.1
    const to = -Math.PI + 0.1
    expect(shortestAngleDelta(from, to)).toBeCloseTo(0.2)
    expect(turnToward(from, to, 0.05)).toBeCloseTo(from + 0.05)
  })

  it('opens translation only after the body faces the requested direction', () => {
    expect(canQuality3DTranslateAfterTurn(0, Math.PI)).toBe(false)
    expect(canQuality3DTranslateAfterTurn(0, QUALITY_3D_MOVE_FACING_TOLERANCE_RADIANS)).toBe(true)
    expect(canQuality3DTranslateAfterTurn(0, QUALITY_3D_MOVE_FACING_TOLERANCE_RADIANS + 0.001)).toBe(false)
  })

  it('keeps the head, flanks and tail inside the authored walkable topology', () => {
    const hatchling = getQuality3DFootprint(0)
    const ancient = getQuality3DFootprint(6)
    expect(hatchling.front).toBeGreaterThan(0.9)
    expect(hatchling.rear).toBeGreaterThan(0.8)
    expect(ancient.front).toBeGreaterThan(hatchling.front * 3)
    expect(ancient.rear).toBeGreaterThan(hatchling.rear * 2)

    const open = inspectQuality3DFootprint(0, 0, 0, 0)
    expect(open.clear).toBe(true)
    const nearWestWall = inspectQuality3DFootprint(quality3DWestBoundaryX(0) + 1.05, 0, Math.PI, 0)
    expect(nearWestWall.clear).toBe(false)
    expect(nearWestWall.blockedProbe).toMatch(/head|front|slope/)

    const probes = quality3DFootprintProbes(0, 0, Math.PI / 2, 0)
    const head = probes.find((probe) => probe.name === 'head')!
    const tail = probes.find((probe) => probe.name === 'tail')!
    expect(head.z).toBeLessThan(0)
    expect(tail.z).toBeGreaterThan(0)
  })
})
