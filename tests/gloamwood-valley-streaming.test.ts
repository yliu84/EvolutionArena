import { describe, expect, it } from 'vitest'

import { scatterGloamwoodValley } from '../src/gloamwood-valley-dressing'
import { GLOAMWOOD_VALLEY } from '../src/gloamwood-valley-terrain'
import {
  GLOAMWOOD_VALLEY_CHUNK_LENGTH,
  GLOAMWOOD_VALLEY_DRAW_DISTANCE,
  gloamwoodValleyChunkCount,
  gloamwoodValleyChunkDrawn,
  gloamwoodValleyChunkOf,
  gloamwoodValleyDrawnPropCount,
  groupGloamwoodValleyProps,
} from '../src/gloamwood-valley-streaming'

describe('Valley draw chunks', () => {
  it('covers the whole valley with no gaps', () => {
    const props = scatterGloamwoodValley(0x5a11e, 3000)
    const chunks = groupGloamwoodValleyProps(props)
    expect(chunks).toHaveLength(gloamwoodValleyChunkCount())
    expect(chunks.reduce((total, chunk) => total + chunk.length, 0)).toBe(props.length)
    for (const [index, chunk] of chunks.entries()) {
      for (const prop of chunk) expect(gloamwoodValleyChunkOf(prop.x)).toBe(index)
    }
  })

  it('bins by the chunk the prop stands in', () => {
    expect(gloamwoodValleyChunkOf(0)).toBe(0)
    expect(gloamwoodValleyChunkOf(GLOAMWOOD_VALLEY_CHUNK_LENGTH - 1)).toBe(0)
    expect(gloamwoodValleyChunkOf(GLOAMWOOD_VALLEY_CHUNK_LENGTH)).toBe(1)
    expect(gloamwoodValleyChunkOf(GLOAMWOOD_VALLEY.length)).toBe(gloamwoodValleyChunkCount() - 1)
    expect(gloamwoodValleyChunkOf(-40)).toBe(0)
  })

  it('keeps the chunk the camera is standing in', () => {
    for (let x = 0; x <= GLOAMWOOD_VALLEY.length; x += 25) {
      expect(gloamwoodValleyChunkDrawn(gloamwoodValleyChunkOf(x), x)).toBe(true)
    }
  })

  it('measures to the near edge, so nothing pops while it is still ahead', () => {
    // Measuring to the centre switches a chunk off while the player is still
    // looking down its near half.
    const chunk = 4
    const nearEdge = chunk * GLOAMWOOD_VALLEY_CHUNK_LENGTH
    expect(gloamwoodValleyChunkDrawn(chunk, nearEdge - GLOAMWOOD_VALLEY_DRAW_DISTANCE + 1)).toBe(true)
    expect(gloamwoodValleyChunkDrawn(chunk, nearEdge - GLOAMWOOD_VALLEY_DRAW_DISTANCE - 1)).toBe(false)
  })

  it('keeps the drawn prop count inside a budget wherever the player stands', () => {
    // The whole point: a single batch for the valley would draw the headwater's
    // cliffs while the player is still in the shallows. The share culled is not
    // the interesting number - what has to hold is the absolute count the GPU
    // is handed, at the worst spot rather than the average one.
    const props = scatterGloamwoodValley(0x5a11e, 6200)
    let worst = 0
    for (let x = 0; x <= GLOAMWOOD_VALLEY.length; x += 20) {
      worst = Math.max(worst, gloamwoodValleyDrawnPropCount(props, x))
    }
    expect(worst).toBeLessThan(2400)
    expect(gloamwoodValleyDrawnPropCount(props, 830)).toBeGreaterThan(0)
  })
})
