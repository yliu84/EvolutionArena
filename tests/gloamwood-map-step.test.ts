import { describe, expect, it } from 'vitest'

import { gloamwoodMapStep } from '../src/gloamwood-map'
import {
  GLOAMWOOD_VALLEY,
  gloamwoodValleyConfine,
  gloamwoodValleyHalfWidth,
  gloamwoodValleyPointAt,
  gloamwoodValleyRoadOffset,
} from '../src/gloamwood-valley-terrain'

const valley = { confine: gloamwoodValleyConfine }
/** One frame of movement at PLAYER_SPEED. */
const STEP = 6.2 / 60

/** Walks straight at the wall from the road and returns where it ends up. */
function pressIntoWall(s: number, frames = 90) {
  const road = gloamwoodValleyPointAt(s, gloamwoodValleyRoadOffset(s))
  const outward = gloamwoodValleyPointAt(s, gloamwoodValleyRoadOffset(s) + 1)
  const dirX = outward.x - road.x
  const dirZ = outward.z - road.z
  const length = Math.hypot(dirX, dirZ)
  let position = { x: road.x, z: road.z }
  const trail: Array<{ x: number; z: number }> = []
  for (let frame = 0; frame < frames; frame += 1) {
    position = gloamwoodMapStep(valley, position, {
      x: position.x + (dirX / length) * STEP,
      z: position.z + (dirZ / length) * STEP,
    })
    trail.push({ x: position.x, z: position.z })
  }
  return trail
}

describe('Walking into a wall', () => {
  it('never reverses direction, which is what the jitter was', () => {
    // Confining after the fact looked equivalent and was not: the valley's
    // confine pushes a little way inside the limit, so holding a key against
    // the wall threw the player back six percent every frame and they bounced
    // there forever. Measured at 0.31 units a frame - exactly one frame of
    // movement.
    //
    // Coming to a dead stop is not the test, because a curving wall should let
    // the player slide along it and that is movement. What must never happen is
    // the direction reversing between one frame and the next.
    for (const s of [120, 300, 440, 700, 950, 1300]) {
      const trail = pressIntoWall(s)
      const settled = trail.slice(-14)
      for (let index = 2; index < settled.length; index += 1) {
        const previous = { x: settled[index - 1].x - settled[index - 2].x, z: settled[index - 1].z - settled[index - 2].z }
        const current = { x: settled[index].x - settled[index - 1].x, z: settled[index].z - settled[index - 1].z }
        if (Math.hypot(current.x, current.z) < 0.001 || Math.hypot(previous.x, previous.z) < 0.001) continue
        expect(previous.x * current.x + previous.z * current.z, `reversed at s=${s}`).toBeGreaterThan(0)
      }
    }
  })

  it('leaves the player standing somewhere they may stand', () => {
    for (const s of [120, 440, 950]) {
      const last = pressIntoWall(s).at(-1)!
      const held = gloamwoodValleyConfine(last.x, last.z)
      expect(Math.hypot(held.x - last.x, held.z - last.z)).toBeLessThan(0.01)
    }
  })

  it('slides along the wall rather than sticking to it', () => {
    // A valley whose walls curve would stop the player dead every few steps if
    // a blocked step simply cancelled the whole movement.
    const s = 300
    const road = gloamwoodValleyPointAt(s, gloamwoodValleyRoadOffset(s))
    const outward = gloamwoodValleyPointAt(s, gloamwoodValleyRoadOffset(s) + 1)
    const along = gloamwoodValleyPointAt(s + 1, gloamwoodValleyRoadOffset(s + 1))
    const outX = (outward.x - road.x)
    const outZ = (outward.z - road.z)
    const outLength = Math.hypot(outX, outZ)
    const alongX = (along.x - road.x)
    const alongZ = (along.z - road.z)
    const alongLength = Math.hypot(alongX, alongZ)

    // Hard into the wall first, then diagonally forward-and-out.
    let position = pressIntoWall(s).at(-1)!
    const before = { ...position }
    for (let frame = 0; frame < 20; frame += 1) {
      position = gloamwoodMapStep(valley, position, {
        x: position.x + (outX / outLength) * STEP + (alongX / alongLength) * STEP,
        z: position.z + (outZ / outLength) * STEP + (alongZ / alongLength) * STEP,
      })
    }
    expect(Math.hypot(position.x - before.x, position.z - before.z)).toBeGreaterThan(STEP * 8)
  })

  it('reports a blocked step, so presentation can tell', () => {
    const half = gloamwoodValleyHalfWidth(300)
    const outside = gloamwoodValleyPointAt(300, half * 4)
    const inside = gloamwoodValleyPointAt(300, gloamwoodValleyRoadOffset(300))
    expect(gloamwoodMapStep(valley, inside, outside).blocked).toBe(true)
    expect(gloamwoodMapStep(valley, inside, inside).blocked).toBe(false)
    expect(GLOAMWOOD_VALLEY.walkShare).toBeLessThan(1)
  })
})
