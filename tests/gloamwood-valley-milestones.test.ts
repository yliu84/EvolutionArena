import { describe, expect, it } from 'vitest'

import { GLOAMWOOD_VALLEY_LIFE_CAP, GLOAMWOOD_VALLEY_MILESTONES } from '../src/gloamwood-valley-progression'
import { createGloamwoodValleyMap } from '../src/gloamwood-valley-map'
import type { GloamwoodValleyCreature } from '../src/gloamwood-valley-creatures'
import {
  GLOAMWOOD_VALLEY,
  gloamwoodValleyPointAt,
  gloamwoodValleyRoadOffset,
} from '../src/gloamwood-valley-terrain'

const map = createGloamwoodValleyMap(0x5a11e, async () => {}, undefined)
const state = map.createCreatures()

function standingAt(s: number) {
  return gloamwoodValleyPointAt(s, gloamwoodValleyRoadOffset(s))
}

function withBossDead(slot: number) {
  return {
    ...state,
    prey: state.prey.map((prey) => {
      const creature = prey as GloamwoodValleyCreature
      return creature.tier === 'boss' && Math.abs(creature.spawnS - slot) < 60
        ? { ...creature, phase: 'dead' as const, health: 0 }
        : creature
    }),
  }
}

describe('Crossing into a region', () => {
  it('reports the entry once the player is standing in it', () => {
    const gorge = GLOAMWOOD_VALLEY.regions.find((region) => region.id === 'gorge')!
    const point = standingAt((gorge.from + gorge.to) / 2)
    expect(map.reachedMilestones(state, point, [])).toContain('gorge-entered')
  })

  it('says nothing about a region the player has not reached', () => {
    const start = standingAt(GLOAMWOOD_VALLEY.spawnS)
    expect(map.reachedMilestones(state, start, [])).not.toContain('headwater-entered')
  })

  it('never repeats one already recorded', () => {
    // The mutation layer counts milestones, so a boundary that reports itself
    // every frame would pay out a mutation every frame.
    const gorge = GLOAMWOOD_VALLEY.regions.find((region) => region.id === 'gorge')!
    const point = standingAt((gorge.from + gorge.to) / 2)
    expect(map.reachedMilestones(state, point, ['gorge-entered'])).not.toContain('gorge-entered')
  })
})

describe('Killing a region boss', () => {
  it('reports the boss of the slot that died, and no other', () => {
    const [first, second] = GLOAMWOOD_VALLEY.bossSlots
    const reached = map.reachedMilestones(withBossDead(first), standingAt(50), [])
    expect(reached).toContain('shallows-boss-defeated')
    expect(reached).not.toContain('gorge-boss-defeated')
    expect(second).toBeGreaterThan(first)
  })

  it('says nothing while the boss is alive', () => {
    expect(map.reachedMilestones(state, standingAt(50), [])).not.toContain('shallows-boss-defeated')
  })
})

describe('Pacing', () => {
  it('keeps the five deliberate decision boundaries in the run', () => {
    // One is a set-piece nest; the rest are region crossings and bosses. This
    // keeps the player making route/build choices, not opening an offer after
    // every minor clean-up.
    expect(GLOAMWOOD_VALLEY_MILESTONES).toHaveLength(5)
    expect(GLOAMWOOD_VALLEY_MILESTONES.filter((entry) => entry.kind === 'nest')).toHaveLength(1)
  })

  it('can pay out every non-nest boundary today', () => {
    const everythingDead = {
      ...state,
      prey: state.prey.map((prey) => ({ ...prey, phase: 'dead' as const, health: 0 })),
    }
    const seen = new Set<string>()
    for (const region of GLOAMWOOD_VALLEY.regions) {
      for (const milestone of map.reachedMilestones(
        everythingDead,
        standingAt((region.from + region.to) / 2),
        [...seen],
      )) seen.add(milestone)
    }
    expect(seen.size).toBe(4)
  })

  it('pays the Shallows nest boundary after its real waves are cleared', () => {
    const localMap = createGloamwoodValleyMap(0x5a11e, async () => {}, undefined)
    let localState = localMap.createCreatures()
    const marker = localState.prey.find((prey) => (prey as GloamwoodValleyCreature).id === 'shallows-nest') as GloamwoodValleyCreature
    const player = { x: marker.x, z: marker.z, alive: true }
    let paid = false

    for (let tick = 0; tick < 400 && !paid; tick += 1) {
      const frame = localMap.stepCreatures(localState, 0.05, player, [], { allowNotice: false })
      localState = {
        ...frame.state,
        prey: frame.state.prey.map((prey) => {
          const creature = prey as GloamwoodValleyCreature
          return creature.id === marker.id || creature.group === `${marker.id}-wave`
            ? { ...creature, phase: 'dead' as const, health: 0 }
            : creature
        }),
      }
      paid = localMap.reachedMilestones(localState, player, []).includes('shallows-nest-cleared')
    }

    expect(paid).toBe(true)
  })
})

describe('What the map says it is made of', () => {
  const valley = createGloamwoodValleyMap(0x5a11e, async () => {}, undefined)

  it('declares the valley creatures modelled, because it is made of them', () => {
    // They loaded behind ?preyModels=1, which was right while they were being
    // validated on the Gloamwood and wrong the moment a whole map depended on
    // them: a tester opening a bare link got a road with no animals on it,
    // geometry blocks standing where the fights are.
    expect(valley.modelledCreatures).toBe(true)
  })

  it('carries its own life budget rather than the one the Gloamwood uses', () => {
    // 1590 units of road with three regions on it was designed around four.
    expect(valley.lives).toBe(GLOAMWOOD_VALLEY_LIFE_CAP)
  })

  it('has a body for every creature it places, with no exceptions left', () => {
    // This asserted "except the swarm" for as long as the Swarm family had no
    // valley model and fourteen creatures wore code-built primitives. The Spore
    // Toad closed it, and the exception is gone rather than widened: a map that
    // declares its creatures modelled has to be made of them.
    const missing = valley.createCreatures().prey.filter((prey) => !valley.bodyFor(prey))
    expect(missing.map((prey) => `${prey.id}/${prey.kind}`)).toEqual([])
  })
})
