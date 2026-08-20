import { describe, expect, it } from 'vitest'

import { createGloamwoodValleyCreatures, type GloamwoodValleyCreature } from '../src/gloamwood-valley-creatures'
import {
  GLOAMWOOD_VALLEY_NEST,
  createGloamwoodValleyNests,
  gloamwoodValleyNestStatus,
  stepGloamwoodValleyNests,
} from '../src/gloamwood-valley-nests'
import { GLOAMWOOD_LOCK_RANGE } from '../src/gloamwood-3d-hunt'
import { gloamwoodValleyWalkable } from '../src/gloamwood-valley-terrain'
import { gloamwoodValleyRespawns } from '../src/gloamwood-valley-respawn'

const creatures = createGloamwoodValleyCreatures(0x5a11e)
const marker = creatures.find((creature) => creature.tier === 'nest')!
const away = { x: 99999, z: 99999 }

/** Walks into the nest and kills whatever it sends, wave after wave. */
function fightThrough(limit = 400) {
  let nests = createGloamwoodValleyNests(creatures)
  let list: GloamwoodValleyCreature[] = [...creatures]
  const cleared: string[] = []
  const waves: number[] = []
  const events: ReturnType<typeof stepGloamwoodValleyNests>['events'] = []
  for (let tick = 0; tick < limit; tick += 1) {
    const frame = stepGloamwoodValleyNests(nests, list, 0.05, { x: marker.homeX, z: marker.homeZ })
    nests = frame.nests
    list = frame.creatures
    cleared.push(...frame.cleared)
    events.push(...frame.events)
    const nest = nests.find((entry) => entry.id === marker.id)!
    if (nest.phase === 'wave' && !waves.includes(nest.wave)) waves.push(nest.wave)
    // Clear what is standing - the wave and the marker, because the marker
    // fights too and the nest now waits for it.
    list = list.map((creature) => creature.group === `${marker.id}-wave` || creature.id === marker.id
      ? { ...creature, phase: 'dead' as const, health: 0 }
      : creature)
    if (cleared.includes(marker.id)) break
  }
  return { nests, list, cleared, waves, events }
}

describe('Walking into a nest', () => {
  it('stays asleep until the player comes close', () => {
    const frame = stepGloamwoodValleyNests(createGloamwoodValleyNests(creatures), creatures, 0.05, away)
    expect(frame.nests.every((nest) => nest.phase === 'dormant')).toBe(true)
    expect(frame.creatures).toHaveLength(creatures.length)
  })

  it('can be seen coming before it triggers', () => {
    // Everywhere else on this map the player picks their fights. A nest takes
    // that away, so it must never be the first thing they learn about it.
    expect(GLOAMWOOD_VALLEY_NEST.triggerRadius).toBeGreaterThan(GLOAMWOOD_LOCK_RANGE * 0.5)
  })

  it('sends a wave the moment it is entered', () => {
    const frame = stepGloamwoodValleyNests(
      createGloamwoodValleyNests(creatures), creatures, 0.05,
      { x: marker.homeX, z: marker.homeZ },
    )
    const wave = frame.creatures.filter((creature) => creature.group === `${marker.id}-wave`)
    expect(wave.length).toBeGreaterThan(0)
    expect(wave.every((creature) => creature.awake)).toBe(true)
  })
})

describe('Fighting through it', () => {
  const result = fightThrough()

  it('runs every wave and then reports itself cleared', () => {
    expect(result.waves.length).toBeGreaterThanOrEqual(2)
    expect(result.cleared).toContain(marker.id)
  })

  it('counts its own marker as part of the fight', () => {
    // Playtest: "the first beetle isn't even dead and another one shows up."
    // The marker was excluded on the reasoning that it is the thing the player
    // walked into rather than a wave - but it is a live creature that fights
    // back, so waves arrived on top of a beetle still being worked through.
    let nests = createGloamwoodValleyNests(creatures)
    let list: GloamwoodValleyCreature[] = [...creatures]
    // Walk in, then kill only the wave and leave the marker standing.
    for (let tick = 0; tick < 200; tick += 1) {
      const frame = stepGloamwoodValleyNests(nests, list, 0.05, { x: marker.homeX, z: marker.homeZ })
      nests = frame.nests
      list = frame.creatures.map((creature) => creature.group === `${marker.id}-wave`
        ? { ...creature, phase: 'dead' as const, health: 0 }
        : creature)
    }
    const nest = nests.find((entry) => entry.id === marker.id)!
    // It waits. No second wave stacks on top of the creature still standing.
    expect(nest.wave).toBe(1)
    expect(nest.phase).toBe('wave')
    expect(list.filter((creature) => creature.group === `${marker.id}-wave`)).toHaveLength(
      list.filter((creature) => creature.id.startsWith(`${marker.id}-w1-`)).length,
    )
  })

  it('sends nothing back to be farmed', () => {
    // A wave tagged as a road pack put the whole nest - every wave of it,
    // together - back on the respawn clock the moment the player walked away
    // from a fight they had won.
    for (const creature of result.list.filter((entry) => entry.group === `${marker.id}-wave`)) {
      expect(gloamwoodValleyRespawns(creature)).toBe(false)
    }
  })

  it('brings every wave in from off screen rather than into the player\'s lap', () => {
    // "Why do they come out of nowhere instead of being seen crossing the map?"
    // They were born 6.4 units out - close enough to simply exist, next to the
    // player, with no arrival. The camera frames about eighteen units either
    // side, so a wave now starts beyond the edge of the frame and runs in.
    for (const creature of result.list.filter((entry) => entry.group === `${marker.id}-wave`)) {
      const born = Math.hypot(creature.homeX - marker.homeX, creature.homeZ - marker.homeZ)
      expect(born, `${creature.id} was born on top of the fight`).toBeGreaterThan(18)
    }
  })

  it('puts every wave creature somewhere it can stand', () => {
    // Twenty-four units out crosses the river in places, and a creature in the
    // water is one the player cannot reach and the nest cannot clear.
    for (const creature of result.list.filter((entry) => entry.group === `${marker.id}-wave`)) {
      expect(gloamwoodValleyWalkable(creature.homeX, creature.homeZ), creature.id).toBe(true)
    }
  })

  it('stays cleared once it is done', () => {
    let nests = result.nests
    for (let tick = 0; tick < 40; tick += 1) {
      const frame = stepGloamwoodValleyNests(nests, result.list, 0.05, { x: marker.homeX, z: marker.homeZ })
      nests = frame.nests
      expect(frame.cleared).toHaveLength(0)
    }
    expect(nests.find((entry) => entry.id === marker.id)!.phase).toBe('cleared')
  })
})

describe('Saying what it is', () => {
  it('announces itself on the way in, with how many waves are coming', () => {
    // Reported as a broken respawn timer: three creatures killed at the fork,
    // three more 1.6 seconds later, nothing said. The shallows nest sits four
    // units from the first fork, so this is where a player stops to choose a
    // direction - the one fight on the map they cannot walk around has to say
    // so out loud.
    const frame = stepGloamwoodValleyNests(
      createGloamwoodValleyNests(creatures), creatures, 0.05,
      { x: marker.homeX, z: marker.homeZ },
    )
    const entered = frame.events.find((event) => event.type === 'valley-nest-entered')
    expect(entered).toBeDefined()
    expect(entered && entered.type === 'valley-nest-entered' && entered.waves).toBeGreaterThanOrEqual(2)
  })

  it('says nothing at all until the player walks in', () => {
    const frame = stepGloamwoodValleyNests(createGloamwoodValleyNests(creatures), creatures, 0.05, away)
    expect(frame.events).toHaveLength(0)
  })

  it('counts each wave out and reports the end', () => {
    const result = fightThrough()
    const waves = result.events.filter((event) => event.type === 'valley-nest-wave')
    expect(waves.length).toBeGreaterThanOrEqual(2)
    expect(result.events.some((event) => event.type === 'valley-nest-cleared')).toBe(true)
    // Numbered so the player can tell "one more" from "this never ends".
    const numbers = waves.map((event) => event.type === 'valley-nest-wave' ? event.wave : 0)
    expect(numbers).toEqual([...numbers].sort((a, b) => a - b))
  })

  it('never announces a nest twice', () => {
    const result = fightThrough()
    const entered = result.events.filter((event) => event.type === 'valley-nest-entered')
    expect(entered).toHaveLength(1)
  })
})

describe('Saying it for as long as it is true', () => {
  it('says nothing while no nest is running', () => {
    expect(gloamwoodValleyNestStatus(createGloamwoodValleyNests(creatures))).toBeNull()
  })

  it('carries the wave count while the wave is happening', () => {
    // The events announce it once each, and a combat message is gone the moment
    // the next kill writes over it - so a player at the first fork cleared a
    // wave and watched another arrive with nothing on screen explaining it.
    const frame = stepGloamwoodValleyNests(
      createGloamwoodValleyNests(creatures), creatures, 0.05,
      { x: marker.homeX, z: marker.homeZ },
    )
    const status = gloamwoodValleyNestStatus(frame.nests)
    expect(status?.wave).toBe(1)
    expect(status?.waves).toBeGreaterThanOrEqual(2)
    expect(status?.resting).toBe(false)
  })

  it('says the next wave is coming during the breath between them', () => {
    // 1.6 seconds with nothing on screen is exactly where "why did they respawn
    // instantly" comes from.
    let nests = createGloamwoodValleyNests(creatures)
    let list: GloamwoodValleyCreature[] = [...creatures]
    let resting = false
    for (let tick = 0; tick < 200 && !resting; tick += 1) {
      const frame = stepGloamwoodValleyNests(nests, list, 0.05, { x: marker.homeX, z: marker.homeZ })
      nests = frame.nests
      list = frame.creatures.map((creature) => creature.group === `${marker.id}-wave` || creature.id === marker.id
        ? { ...creature, phase: 'dead' as const, health: 0 }
        : creature)
      resting = gloamwoodValleyNestStatus(nests)?.resting === true
    }
    expect(resting).toBe(true)
  })

  it('stops saying anything once the nest is done', () => {
    const result = fightThrough()
    expect(gloamwoodValleyNestStatus(result.nests)).toBeNull()
  })
})

describe('Where a wave comes from', () => {
  const nests = createGloamwoodValleyNests(creatures)

  it('comes from the far side of the den, never over the player\'s shoulder', () => {
    // Standing west of the nest must not put anything behind you to the west.
    for (const nest of nests) {
      const from = { x: nest.x - 10, z: nest.z }
      const frame = stepGloamwoodValleyNests([nest], creatures, 0.05, from)
      const wave = frame.creatures.filter((creature) => creature.group === `${nest.id}-wave`)
      expect(wave.length).toBeGreaterThan(0)
      for (const creature of wave) {
        // Further from the player than the nest is, i.e. on the far side.
        expect(Math.hypot(creature.homeX - from.x, creature.homeZ - from.z))
          .toBeGreaterThan(Math.hypot(nest.x - from.x, nest.z - from.z))
      }
    }
  })

  it('starts every wave outside the frame, at every nest on the map', () => {
    for (const nest of nests) {
      const frame = stepGloamwoodValleyNests([nest], creatures, 0.05, { x: nest.x, z: nest.z })
      for (const creature of frame.creatures.filter((c) => c.group === `${nest.id}-wave`)) {
        expect(Math.hypot(creature.homeX - nest.x, creature.homeZ - nest.z)).toBeGreaterThan(18)
        expect(gloamwoodValleyWalkable(creature.homeX, creature.homeZ), creature.id).toBe(true)
      }
    }
  })
})
