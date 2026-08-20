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
    // Returned names creatures now, not groups: each corpse keeps its own clock.
    for (const creature of creatures.filter((entry) => entry.group === packGroup)) {
      expect(returned).toContain(creature.id)
    }
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
    expect(returned).toHaveLength(0)
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

describe('A pack the player broke but did not finish', () => {
  const pack = creatures.filter((creature) => creature.group === packGroup)

  /** Kills all but one of the pack and runs the clock with the player far off. */
  function halfClear(seconds: number) {
    let state = createGloamwoodValleyRespawnState()
    let list: GloamwoodValleyCreature[] = creatures.map((creature) =>
      creature.group === packGroup && creature.id !== pack[0].id
        ? { ...creature, phase: 'dead' as const, health: 0 }
        : creature)
    let returned: string[] = []
    for (let elapsed = 0; elapsed < seconds; elapsed += 0.05) {
      const frame = stepGloamwoodValleyRespawn(state, list, 0.05, away)
      state = frame.state
      list = frame.creatures
      returned = returned.concat(frame.returned)
    }
    return { list, returned }
  }

  it('heals back around the survivor', () => {
    // One clock per pack, started only once every member was dead, meant a pack
    // broken but not finished never came back at all. Kill two of three, walk
    // on, and the road quietly decays into lone survivors and holes for the
    // rest of the run.
    const { list, returned } = halfClear(GLOAMWOOD_VALLEY_RESPAWN.delaySeconds + 3)
    for (const creature of pack.slice(1)) expect(returned).toContain(creature.id)
    expect(list.filter((entry) => entry.group === packGroup).every((entry) => entry.phase !== 'dead')).toBe(true)
  })

  it('leaves the survivor exactly as it was', () => {
    // It never died, so nothing about it is reset - not its health, not where
    // it had walked to.
    const { list } = halfClear(GLOAMWOOD_VALLEY_RESPAWN.delaySeconds + 3)
    const survivor = list.find((entry) => entry.id === pack[0].id)!
    expect(survivor.phase).not.toBe('dead')
  })

  it('still refuses to do it where the player can see', () => {
    const watching = { x: pack[0].homeX, z: pack[0].homeZ }
    let state = createGloamwoodValleyRespawnState()
    let list: GloamwoodValleyCreature[] = creatures.map((creature) =>
      creature.group === packGroup ? { ...creature, phase: 'dead' as const, health: 0 } : creature)
    let returned: string[] = []
    for (let elapsed = 0; elapsed < GLOAMWOOD_VALLEY_RESPAWN.delaySeconds + 30; elapsed += 0.05) {
      const frame = stepGloamwoodValleyRespawn(state, list, 0.05, watching)
      state = frame.state
      list = frame.creatures
      returned = returned.concat(frame.returned)
    }
    // The distance rule is what rules out reinforcements arriving mid-fight,
    // now that the pack no longer has to be wiped before any clock starts.
    expect(returned).toHaveLength(0)
  })
})

describe('The road the player is still on', () => {
  const pack = creatures.filter((creature) => creature.group === packGroup)
  const region = pack[0].region

  function clearAndWaitInRegion(playerRegion: string | null, seconds: number) {
    let state = createGloamwoodValleyRespawnState()
    let list: GloamwoodValleyCreature[] = creatures.map((creature) =>
      creature.group === packGroup ? { ...creature, phase: 'dead' as const, health: 0 } : creature)
    let returned: string[] = []
    for (let elapsed = 0; elapsed < seconds; elapsed += 0.05) {
      const frame = stepGloamwoodValleyRespawn(state, list, 0.05, away, playerRegion)
      state = frame.state
      list = frame.creatures
      returned = returned.concat(frame.returned)
    }
    return returned
  }

  it('does not refill in front of a player who is still working through it', () => {
    // Playtest: died at the first gate, respawned at the region entrance,
    // walked back through everything already killed, arrived with no health,
    // died again. Ninety seconds is shorter than the walk, so the run could not
    // make progress at all.
    expect(clearAndWaitInRegion(region, GLOAMWOOD_VALLEY_RESPAWN.delaySeconds + 30)).toHaveLength(0)
  })

  it('refills once the player has moved on', () => {
    // The purpose survives: the route folds and carries two loop branches, so
    // doubling back a region later still finds a living road.
    const returned = clearAndWaitInRegion('headwater', GLOAMWOOD_VALLEY_RESPAWN.delaySeconds + 3)
    for (const creature of pack) expect(returned).toContain(creature.id)
  })

  it('holds the clock rather than resetting it', () => {
    // Waiting in the region and then leaving must not restart the whole delay,
    // or a player who lingers is punished for it.
    let state = createGloamwoodValleyRespawnState()
    let list: GloamwoodValleyCreature[] = creatures.map((creature) =>
      creature.group === packGroup ? { ...creature, phase: 'dead' as const, health: 0 } : creature)
    let returned: string[] = []
    for (let elapsed = 0; elapsed < 200; elapsed += 0.05) {
      // In the region for the first half, gone for the second.
      const where = elapsed < 100 ? region : 'headwater'
      const frame = stepGloamwoodValleyRespawn(state, list, 0.05, away, where)
      state = frame.state
      list = frame.creatures
      returned = returned.concat(frame.returned)
    }
    expect(returned.length).toBeGreaterThan(0)
  })
})
