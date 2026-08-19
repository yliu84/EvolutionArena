import { describe, expect, it } from 'vitest'

import {
  GLOAMWOOD_OCCLUDER_MIN_HEIGHT,
  gloamwoodOccludesCameraView,
  gloamwoodRockOccluder,
  gloamwoodTreeOccluder,
  type GloamwoodOccluder,
} from '../src/gloamwood-camera-occlusion'
import { GLOAMWOOD_ROCK_VARIANTS, GLOAMWOOD_TREE_VARIANTS } from '../src/gloamwood-environment-kit'
import { scatterGloamwoodValley, gloamwoodValleyTreeVariantId } from '../src/gloamwood-valley-dressing'
import {
  GLOAMWOOD_VALLEY_LENGTH,
  gloamwoodValleyHeight,
  gloamwoodValleyPointAt,
  gloamwoodValleyRoadOffset,
} from '../src/gloamwood-valley-terrain'

// The preview's camera: 15.7 back, 11.8 up, 4.2 across.
const CAMERA = { x: -15.7, y: 11.8, z: -4.2 }

function valleyOccluders(): GloamwoodOccluder[] {
  const occluders: GloamwoodOccluder[] = []
  for (const prop of scatterGloamwoodValley(0x5a11e, 6200)) {
    if (prop.kind === 'undergrowth') continue
    const ground = gloamwoodValleyHeight(prop.x, prop.z)
    if (prop.kind === 'tree') {
      const variant = GLOAMWOOD_TREE_VARIANTS.find((entry) => entry.id === gloamwoodValleyTreeVariantId(prop.variant))
      const height = (variant?.height ?? 8) * prop.scale
      if (height < GLOAMWOOD_OCCLUDER_MIN_HEIGHT) continue
      occluders.push(gloamwoodTreeOccluder(prop.x, ground, prop.z, height))
    } else {
      const diameter = GLOAMWOOD_ROCK_VARIANTS[prop.variant].diameter * prop.scale
      if (diameter < GLOAMWOOD_OCCLUDER_MIN_HEIGHT) continue
      occluders.push(gloamwoodRockOccluder(prop.x, ground, prop.z, diameter))
    }
  }
  return occluders
}

describe('Walking the valley with the camera behind you', () => {
  const occluders = valleyOccluders()

  it('has props tall enough to get in the way at all', () => {
    expect(occluders.length).toBeGreaterThan(500)
  })

  it('is blocked often enough that the pass is worth having', () => {
    // If nothing ever blocked, the whole mechanism would be dead code that
    // looks like it works.
    let blocked = 0
    let sampled = 0
    for (let s = 20; s < GLOAMWOOD_VALLEY_LENGTH - 20; s += 7) {
      const point = gloamwoodValleyPointAt(s, gloamwoodValleyRoadOffset(s))
      const from = { x: point.x, y: gloamwoodValleyHeight(point.x, point.z) + 1.2, z: point.z }
      const to = { x: from.x + CAMERA.x, y: from.y + CAMERA.y, z: from.z + CAMERA.z }
      sampled += 1
      if (occluders.some((occluder) => gloamwoodOccludesCameraView(occluder, from, to))) blocked += 1
    }
    expect(blocked / sampled).toBeGreaterThan(0.03)
    // And not so often that the player walks the road through a permanent
    // ghost, which would mean the road is scattered too heavily rather than
    // that the camera needs help.
    expect(blocked / sampled).toBeLessThan(0.45)
  })

  it('never has to clear more than a handful at once', () => {
    // Each cleared prop is a hole in the scene. A dozen at a time is a
    // dissolving forest, not a camera getting out of the way.
    let worst = 0
    for (let s = 20; s < GLOAMWOOD_VALLEY_LENGTH - 20; s += 7) {
      const point = gloamwoodValleyPointAt(s, gloamwoodValleyRoadOffset(s))
      const from = { x: point.x, y: gloamwoodValleyHeight(point.x, point.z) + 1.2, z: point.z }
      const to = { x: from.x + CAMERA.x, y: from.y + CAMERA.y, z: from.z + CAMERA.z }
      worst = Math.max(worst, occluders.filter((occluder) => gloamwoodOccludesCameraView(occluder, from, to)).length)
    }
    expect(worst).toBeLessThanOrEqual(8)
  })
})
