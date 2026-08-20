import { describe, expect, it } from 'vitest'

import { GLOAMWOOD_PREY, type GloamwoodPreyKind } from '../src/gloamwood-3d-ecology'
import {
  GLOAMWOOD_MEAT,
  createGloamwoodMeatDrop,
  gloamwoodMeatDropPosition,
  gloamwoodMeatHeal,
  gloamwoodMeatOpacity,
  stepGloamwoodMeat,
} from '../src/gloamwood-meat'

const player = (x: number, health = 40) => ({ x, z: 0, health, maxHealth: 110, bodyRadius: 1.28 })

describe('What a kill leaves behind', () => {
  it('feeds every kill rather than rolling for one', () => {
    // The complaint is that the run is too hard, and a random drop makes the
    // bad case worse: the fight barely survived is exactly the one that would
    // have rolled nothing.
    for (const kind of Object.keys(GLOAMWOOD_PREY) as GloamwoodPreyKind[]) {
      expect(gloamwoodMeatHeal(kind)).toBeGreaterThan(0)
    }
  })

  it('pays out by what the creature was worth eating', () => {
    // Tied to biomass, which is already the measure of that. A second table
    // would let the two disagree about which animal is the bigger meal.
    expect(gloamwoodMeatHeal('shell')).toBeGreaterThan(gloamwoodMeatHeal('fang'))
    expect(gloamwoodMeatHeal('fang')).toBeGreaterThan(gloamwoodMeatHeal('swarm'))
  })

  it('does not make the road free', () => {
    // Clearing the shallows is worth about a third of a bar - roughly what
    // fighting it costs. Arrive whole by fighting, or early by walking past.
    const road = 3 * (gloamwoodMeatHeal('fang') + 2 * gloamwoodMeatHeal('swarm'))
    expect(road).toBeLessThan(110)
    expect(road).toBeGreaterThan(20)
  })
})

describe('Eating it', () => {
  const drop = createGloamwoodMeatDrop('m1', 'fang', 0, 0)

  it('needs no button, only standing on it', () => {
    const frame = stepGloamwoodMeat([drop], 1 / 60, player(0.5))
    expect(frame.healed).toBe(gloamwoodMeatHeal('fang'))
    expect(frame.drops).toHaveLength(0)
  })

  it('is not eaten from across the road', () => {
    const frame = stepGloamwoodMeat([drop], 1 / 60, player(9))
    expect(frame.healed).toBe(0)
    expect(frame.drops).toHaveLength(1)
  })

  it('is left where it is by a player who is already whole', () => {
    // Spending it on nothing is the difference between rewarding a good fight
    // and deleting itself - it should still be there after the next exchange.
    const frame = stepGloamwoodMeat([drop], 1 / 60, { ...player(0.5), health: 110 })
    expect(frame.healed).toBe(0)
    expect(frame.drops).toHaveLength(1)
  })

  it('reaches further for a bigger body, as everything else does', () => {
    // 2.8 is outside 1.28 + 1.15 and inside 2.0 + 1.15.
    const far = { ...player(2.8), bodyRadius: 1.28 }
    expect(stepGloamwoodMeat([drop], 1 / 60, far).healed).toBe(0)
    expect(stepGloamwoodMeat([drop], 1 / 60, { ...far, bodyRadius: 2.0 }).healed).toBeGreaterThan(0)
  })
})

describe('How long it lasts', () => {
  const run = (seconds: number, x = 99) => {
    let drops = [createGloamwoodMeatDrop('m1', 'fang', 0, 0)]
    for (let t = 0; t < seconds * 60; t += 1) drops = stepGloamwoodMeat(drops, 1 / 60, player(x)).drops
    return drops
  }

  it('survives the fight it fell in', () => {
    expect(run(GLOAMWOOD_MEAT.lifetimeSeconds - 2)).toHaveLength(1)
  })

  it('cannot be stockpiled or walked back to', () => {
    // A larder the player returns to would fight the shape of the map. The
    // valley is a road.
    expect(run(GLOAMWOOD_MEAT.lifetimeSeconds + 1)).toHaveLength(0)
  })

  it('fades before it goes, so vanishing is never a surprise', () => {
    expect(gloamwoodMeatOpacity({ age: 0 })).toBe(1)
    expect(gloamwoodMeatOpacity({ age: GLOAMWOOD_MEAT.lifetimeSeconds - 1 })).toBeLessThan(1)
    expect(gloamwoodMeatOpacity({ age: GLOAMWOOD_MEAT.lifetimeSeconds })).toBe(0)
  })
})

describe('Where the meal lands', () => {
  it('falls toward whoever made the kill', () => {
    // A creature dies at its attack distance, which is by construction further
    // from the player than they can reach. Measured in engine, three kills left
    // three meals on the ground and the player went from 55 health to 31 with
    // two of them in sight.
    const at = gloamwoodMeatDropPosition({ x: 3, z: 0 }, { x: 0, z: 0 })
    expect(at.x).toBeLessThan(3)
    expect(at.x).toBeGreaterThan(0)
  })

  it('lands inside reach of a player standing where the fight was', () => {
    // The furthest a modelled creature stands off is about 3.5.
    for (const corpse of [2.5, 3.0, 3.5]) {
      const at = gloamwoodMeatDropPosition({ x: corpse, z: 0 }, { x: 0, z: 0 })
      const reach = 1.04 + GLOAMWOOD_MEAT.reach
      expect(Math.hypot(at.x, at.z), `a kill at ${corpse} must be edible`).toBeLessThan(reach)
    }
  })

  it('is still a place on the ground, not a pickup that flies at you', () => {
    // Back away and you leave it. Hold the spot and it feeds you.
    const at = gloamwoodMeatDropPosition({ x: 3, z: 0 }, { x: 0, z: 0 })
    expect(Math.hypot(at.x, at.z)).toBeGreaterThan(1)
  })
})
