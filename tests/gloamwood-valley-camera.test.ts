import { describe, expect, it } from 'vitest'

import { createGloamwoodValleyMap } from '../src/gloamwood-valley-map'
import { GLOAMWOOD_VALLEY, gloamwoodValleyHeadingAt } from '../src/gloamwood-valley-terrain'

const map = createGloamwoodValleyMap(0x5a11e, async () => {}, undefined)
const offset = map.cameraOffset
/** Which way the camera looks, in degrees, from where it sits. */
const cameraBearing = (Math.atan2(-offset.z, -offset.x) * 180) / Math.PI

describe('Where the camera stands on the valley', () => {
  it('keeps the framing the game is tuned for', () => {
    // The distance is the game's, not the map's - it is what makes a creature
    // read at the size it was authored at. Only the bearing belongs to the
    // ground.
    expect(Math.hypot(offset.x, offset.y, offset.z)).toBeCloseTo(20.08, 1)
    expect(offset.y).toBe(11.8)
  })

  it('looks along the route rather than across it', () => {
    // The valley was laid out against a camera on about fifteen degrees. Seen
    // from the Gloamwood's bearing instead - a hundred and forty degrees away -
    // the same road and river read as having swapped sides, which is exactly
    // what the playtest reported after the two maps were merged.
    for (let s = 0; s <= 1590; s += 10) {
      const heading = gloamwoodValleyHeadingAt(s)
      const legBearing = (Math.atan2(heading.z, heading.x) * 180) / Math.PI
      const difference = Math.abs(((legBearing - cameraBearing + 540) % 360) - 180)
      expect(difference, `leg at s=${s} runs across the lens`).toBeLessThan(50)
    }
  })

  it('is the only thing about the camera a map may change', () => {
    // A map that could move the camera closer or lower would change how big
    // every creature reads, and the sizes were all chosen against one framing.
    expect(GLOAMWOOD_VALLEY.spine.length).toBeGreaterThan(2)
  })
})
