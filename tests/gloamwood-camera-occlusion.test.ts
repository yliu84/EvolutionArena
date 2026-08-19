import { describe, expect, it } from 'vitest'

import {
  GLOAMWOOD_OCCLUSION,
  gloamwoodOccluderFade,
  gloamwoodOccludesCameraView,
  gloamwoodRockOccluder,
  gloamwoodTreeOccluder,
} from '../src/gloamwood-camera-occlusion'

const player = { x: 0, y: 0.92, z: 0 }
// The hunt's camera: 16.25 back, 11.8 up.
const camera = { x: -16.25, y: 11.8, z: 0 }

describe('Standing in the way', () => {
  it('catches a crown on the sightline', () => {
    const tree = gloamwoodTreeOccluder(-8, 0, 0, 9)
    expect(gloamwoodOccludesCameraView(tree, player, camera)).toBe(true)
  })

  it('ignores one beside the sightline', () => {
    const tree = gloamwoodTreeOccluder(-8, 0, 7, 9)
    expect(gloamwoodOccludesCameraView(tree, player, camera)).toBe(false)
  })

  it('ignores one behind the player', () => {
    // On the line the segment extends along, but not on the segment. Hiding it
    // would make things vanish for no reason the player can see.
    const tree = gloamwoodTreeOccluder(9, 0, 0, 9)
    expect(gloamwoodOccludesCameraView(tree, player, camera)).toBe(false)
  })

  it('ignores one further out than the camera', () => {
    const tree = gloamwoodTreeOccluder(-30, 0, 0, 9)
    expect(gloamwoodOccludesCameraView(tree, player, camera)).toBe(false)
  })

  it('lets the camera see over a rock too low to matter', () => {
    // The sightline climbs 11.8 over 16.25, so it clears a knee-high rock long
    // before it reaches it.
    const pebble = gloamwoodRockOccluder(-8, 0, 0, 1.2)
    expect(gloamwoodOccludesCameraView(pebble, player, camera)).toBe(false)
  })

  it('catches the boulder that swallowed the camera on the scree shelf', () => {
    // A ten-unit rock at the edge of a sixteen-unit chamber, which is what
    // walking the branch actually produced.
    const boulder = gloamwoodRockOccluder(-7, 0, 1.5, 10)
    expect(gloamwoodOccludesCameraView(boulder, player, camera)).toBe(true)
  })
})

describe('Getting out of the way', () => {
  it('fades rather than switches, because a thousand props toggling is a flicker', () => {
    let fade = 1
    fade = gloamwoodOccluderFade(fade, true, 0.016)
    expect(fade).toBeLessThan(1)
    expect(fade).toBeGreaterThan(GLOAMWOOD_OCCLUSION.blockedOpacity)
  })

  it('reaches the target and stops there', () => {
    let fade = 1
    for (let tick = 0; tick < 120; tick += 1) fade = gloamwoodOccluderFade(fade, true, 0.016)
    expect(fade).toBeCloseTo(GLOAMWOOD_OCCLUSION.blockedOpacity, 6)
    for (let tick = 0; tick < 120; tick += 1) fade = gloamwoodOccluderFade(fade, false, 0.016)
    expect(fade).toBeCloseTo(1, 6)
  })

  it('clears out faster than it comes back', () => {
    // Being able to see is worth more than the prop being there.
    expect(GLOAMWOOD_OCCLUSION.fadeOutSeconds).toBeLessThan(GLOAMWOOD_OCCLUSION.fadeInSeconds)
  })

  it('leaves a ghost rather than nothing, so cover still reads as cover', () => {
    expect(GLOAMWOOD_OCCLUSION.blockedOpacity).toBeGreaterThan(0)
  })
})
