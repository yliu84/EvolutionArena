import { describe, expect, it } from 'vitest'
import {
  V4_FOG_CELL_SIZE,
  createV4FogGrid,
  revealV4Fog,
  v4FogExploredPercent,
} from '../src/v4-live-fog'

describe('V4 live fog', () => {
  it('covers the full world including a partial final row and column', () => {
    const cells = createV4FogGrid(300, 260)
    expect(cells).toHaveLength(Math.ceil(300 / V4_FOG_CELL_SIZE) * Math.ceil(260 / V4_FOG_CELL_SIZE))
    expect(cells.at(-1)).toMatchObject({
      x: Math.floor(300 / V4_FOG_CELL_SIZE) * V4_FOG_CELL_SIZE,
      y: Math.floor(260 / V4_FOG_CELL_SIZE) * V4_FOG_CELL_SIZE,
    })
  })

  it('reveals only cells within the exploration radius', () => {
    const cells = createV4FogGrid(512, 512)
    const revealed = revealV4Fog(cells, 48, 48, 40)
    expect(revealed).toBe(1)
    expect(cells[0].explored).toBe(true)
    expect(cells[1].explored).toBe(false)
  })

  it('does not count already explored cells twice', () => {
    const cells = createV4FogGrid(256, 256)
    expect(revealV4Fog(cells, 128, 128, 256)).toBe(cells.length)
    expect(revealV4Fog(cells, 128, 128, 256)).toBe(0)
    expect(v4FogExploredPercent(cells)).toBe(100)
  })
})
