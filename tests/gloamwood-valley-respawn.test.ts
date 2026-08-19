import { describe, expect, it } from 'vitest'

import { createGloamwoodValleyCreatures, type GloamwoodValleyCreature } from '../src/gloamwood-valley-creatures'
import {
  GLOAMWOOD_VALLEY_RESPAWN,
  createGloamwoodValleyRespawnState,
  gloamwoodValleyCorpseGone,
  gloamwoodValleyRespawns,
  stepGloamwoodValleyRespawn,
} from '../src/gloamwood-valley-respawn'

const creatures = createGloamwoodValleyCreatures(0x5a11e)
const away = { x: 99999, z: 99999 }

/** Kills a whole group and runs the clock. */
function clearAndWait(group: string, seconds: number, player = away) {
  let state = createGloamwoodValleyRespawnState()
  let list: GloamwoodValleyCreature[] = creatures.map((creature) =>
    creature.group === group ? { ...creature, phase: 'dead' as const, health: 0 } : creature)
  let returned: string[] = []
  for (let elapsed = 0; elapsed < seconds; elapsed += 0.05) {
    const frame = stepGloamwoodValleyRespawn(state, list, 0.05, player)
    state = frame.state
    list = frame.creatures
    returned = returned.concat(frame.returned)
  }
  return { list, returned }
}

const packGroup = creatures.find((creature) => creature.tier === 'pack')!.group
const eliteGroup = creatures.find((creature) => creature.tier === 'elite')!.group

describe('What comes back', () => {
  it('brings a road pack back once its time is up', () => {
    const { list, returned } = clearAndWait(packGroup, GLOAMWOOD_VALLEY_RESPAWN.delaySeconds + 3)
    expect(returned).toContain(packGroup)
    for (const creature of list.filter((entry) => entry.group === packGroup)) {
      expect(creature.phase).not.toBe('dead')
      expect(creature.health).toBe(creature.maxHealth)
      expect(creature.x).toBeCloseTo(creature.homeX, 5)
    }
  })

  it('leaves an elite dead for good', () => {
    // Clearing a branch has to stay cleared, or the valley becomes a place to
    // farm rather than a place to get through.
    const { list, returned } = clearAndWait(eliteGroup, GLOAMWOOD_VALLEY_RESPAWN.delaySeconds + 30)
    expect(returned).not.toContain(eliteGroup)
    expect(list.filter((entry) => entry.group === eliteGroup).every((entry) => entry.phase === 'dead')).toBe(true)
  })

  it('never returns anything but a road pack', () => {
    for (const creature of creatures) {
      expect(gloamwoodValleyRespawns(creature)).toBe(creature.tier === 'pack')
    }
  })

  it('waits until the player is not there to watch', () => {
    // A creature that appears in view has no explanation. One that is simply
    // there when you come back the other way does.
    const anchor = creatures.find((creature) => creature.group === packGroup)!
    const watching = { x: anchor.homeX, z: anchor.homeZ }
    const { returned } = clearAndWait(packGroup, GLOAMWOOD_VALLEY_RESPAWN.delaySeconds + 30, watching)
    expect(returned).toHaveLength(0)
  })
})

describe('Corpses', () => {
  it('are gone from the scene after their time', () => {
    const { list } = clearAndWait(eliteGroup, GLOAMWOOD_VALLEY_RESPAWN.corpseSeconds + 1)
    for (const creature of list.filter((entry) => entry.group === eliteGroup)) {
      expect(gloamwoodValleyCorpseGone(creature)).toBe(true)
    }
  })

  it('linger long enough to be seen dying', () => {
    const { list } = clearAndWait(eliteGroup, 1)
    for (const creature of list.filter((entry) => entry.group === eliteGroup)) {
      expect(gloamwoodValleyCorpseGone(creature)).toBe(false)
    }
  })

  it('carry no age while alive', () => {
    const { list } = clearAndWait(eliteGroup, 1)
    for (const creature of list.filter((entry) => entry.phase !== 'dead')) {
      expect(creature.corpseSeconds).toBeUndefined()
    }
  })
})
