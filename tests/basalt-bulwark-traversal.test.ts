import { describe, expect, it } from 'vitest'

import {
  GLOAMWOOD_VALLEY,
  GLOAMWOOD_VALLEY_LENGTH,
  gloamwoodValleyWalkableHalfWidth,
} from '../src/gloamwood-valley-terrain'
import { getGloamwoodPlayerCollisionProfile } from '../src/gloamwood-3d-collision'

/**
 * The widest body in the game has to fit through the narrowest part of the map.
 *
 * The stage-1 Shell form was accepted with this check still open - its contract
 * says so in as many words - and its footprint concern was resolved by argument
 * rather than by measurement. This form is 70% wider again, so the check is run
 * against the route's own typed widths instead of being deferred a second time.
 *
 * A live walk confirms the same thing but cannot cover the route: the player
 * dies to the packs long before reaching the second gate. This sweeps every
 * metre of it.
 */
describe('Shell stage-2 traversal', () => {
  const profile = getGloamwoodPlayerCollisionProfile(2, 'shell')

  it('fits through the narrowest gate with real clearance to spare', () => {
    const narrowest = GLOAMWOOD_VALLEY.chokeHalfWidth * GLOAMWOOD_VALLEY.walkShare
    // The body occupies its collision radius either side of the centreline.
    const halfBody = profile.radius
    expect(halfBody).toBeLessThan(narrowest)
    // Not merely passable - it has to not feel like threading a needle. Require
    // the body to use less than half the available half-width.
    expect(halfBody / narrowest).toBeLessThan(0.5)
  })

  it('never exceeds the walkable corridor anywhere along the route', () => {
    let worstRatio = 0
    let worstAt = 0
    for (let s = 0; s <= GLOAMWOOD_VALLEY_LENGTH; s += 1) {
      const walkable = gloamwoodValleyWalkableHalfWidth(s)
      const ratio = profile.radius / walkable
      if (ratio > worstRatio) {
        worstRatio = ratio
        worstAt = s
      }
    }
    expect(worstRatio, `tightest at s=${worstAt}`).toBeLessThan(0.5)
  })

  it('leaves the front and rear probes inside the corridor when turning across it', () => {
    // Turning broadside in a gate is the worst case: the body presents its
    // length to the corridor rather than its width.
    const narrowest = GLOAMWOOD_VALLEY.chokeHalfWidth * GLOAMWOOD_VALLEY.walkShare
    const longestProbe = Math.max(profile.frontOffset, profile.rearOffset)
    const broadsideReach = longestProbe + profile.radius
    expect(broadsideReach, 'body cannot turn across the narrowest gate').toBeLessThan(narrowest)
  })

  it('is bigger than the stage-1 body it replaces but still not the tightest fit the map allows', () => {
    const stageOne = getGloamwoodPlayerCollisionProfile(1, 'shell')
    expect(profile.radius).toBeGreaterThan(stageOne.radius)
    // The Boss is the largest non-player body in the valley at 1.72. The player
    // may approach that, but must not exceed it, or the arena stops working.
    expect(profile.radius).toBeLessThan(1.72)
  })
})
