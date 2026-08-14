import { describe, expect, it } from 'vitest'
import { FX_DEPTH, WORLD_DEPTH_BASE, worldDepth } from '../src/iso'

describe('isometric world depth', () => {
  it('sorts farther south in front of farther north', () => {
    expect(worldDepth(400)).toBeGreaterThan(worldDepth(200))
    expect(worldDepth(1600)).toBeGreaterThan(worldDepth(400))
    expect(worldDepth(0)).toBe(WORLD_DEPTH_BASE)
  })

  it('keeps combat bursts above y-sorted units', () => {
    expect(FX_DEPTH).toBeGreaterThan(worldDepth(3200, 4))
  })
})
