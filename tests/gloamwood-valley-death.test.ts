import { describe, expect, it } from 'vitest'

import { gloamwoodPreyBodyRadius } from '../src/gloamwood-3d-ecology'
import { createGloamwoodValleyMap } from '../src/gloamwood-valley-map'
import type { GloamwoodValleyCreature } from '../src/gloamwood-valley-creatures'
import {
  GLOAMWOOD_VALLEY,
  gloamwoodValleyPointAt,
  gloamwoodValleyProject,
  gloamwoodValleyRoadOffset,
  gloamwoodValleyWalkable,
} from '../src/gloamwood-valley-terrain'

const map = createGloamwoodValleyMap(0x5a11e, async () => {}, undefined)

/** Dies somewhere along the route and reports what the map did about it. */
function dieAt(s: number) {
  const point = gloamwoodValleyPointAt(s, gloamwoodValleyRoadOffset(s))
  const started = map.createCreatures()
  // Everything awake and standing on the player, as it would be after a fight.
  const engaged = {
    ...started,
    prey: started.prey.map((prey) => ({
      ...(prey as GloamwoodValleyCreature),
      awake: true,
      x: point.x + (prey.slot % 3) * 0.2,
      z: point.z + (prey.slot % 2) * 0.2,
    })),
  }
  return map.resetAfterDeath(engaged, point)
}

describe('Dying in the valley', () => {
  it('sends every creature home rather than piling them on the player', () => {
    // The Gloamwood sends its wave back to the nest it came out of. Run on the
    // valley, that dropped sixty creatures into one ring around the respawn -
    // the player came back inside a wall of them.
    const { state } = dieAt(300)
    for (const prey of state.prey) {
      const creature = prey as GloamwoodValleyCreature
      expect(creature.x).toBeCloseTo(creature.homeX, 5)
      expect(creature.z).toBeCloseTo(creature.homeZ, 5)
    }
  })

  it('leaves nothing overlapping anything else', () => {
    const living = dieAt(300).state.prey.filter((prey) => prey.phase !== 'dead')
    for (let a = 0; a < living.length; a += 1) {
      for (let b = a + 1; b < living.length; b += 1) {
        const needed = gloamwoodPreyBodyRadius(living[a]) + gloamwoodPreyBodyRadius(living[b])
        expect(Math.hypot(living[a].x - living[b].x, living[a].z - living[b].z))
          .toBeGreaterThanOrEqual(needed)
      }
    }
  })

  it('lets everything forget the player', () => {
    // Respawning into the aggro of whatever just killed you is not a life.
    for (const prey of dieAt(300).state.prey) {
      expect((prey as GloamwoodValleyCreature).awake).toBe(false)
    }
  })

  it('puts the player back at the entrance of the region they died in', () => {
    // Regions are the valley's checkpoints, and walking 1500 units back is a
    // punishment nobody asked for.
    for (const region of GLOAMWOOD_VALLEY.regions) {
      const middle = (region.from + region.to) / 2
      const { playerAt } = dieAt(middle)
      const back = gloamwoodValleyProject(playerAt.x, playerAt.z)
      expect(back.s).toBeGreaterThanOrEqual(Math.min(region.from, GLOAMWOOD_VALLEY.spawnS) - 1)
      expect(back.s).toBeLessThan(middle)
      expect(gloamwoodValleyWalkable(playerAt.x, playerAt.z)).toBe(true)
    }
  })
})
