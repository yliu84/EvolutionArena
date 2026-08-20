import { describe, expect, it } from 'vitest'

import { createGloamwoodValleyCreatures, type GloamwoodValleyCreature } from '../src/gloamwood-valley-creatures'
import {
  GLOAMWOOD_VALLEY_NEST,
  createGloamwoodValleyNests,
  stepGloamwoodValleyNests,
} from '../src/gloamwood-valley-nests'
import { GLOAMWOOD_LOCK_RANGE } from '../src/gloamwood-3d-hunt'
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
  for (let tick = 0; tick < limit; tick += 1) {
    const frame = stepGloamwoodValleyNests(nests, list, 0.05, { x: marker.homeX, z: marker.homeZ })
    nests = frame.nests
    list = frame.creatures
    cleared.push(...frame.cleared)
    const nest = nests.find((entry) => entry.id === marker.id)!
    if (nest.phase === 'wave' && !waves.includes(nest.wave)) waves.push(nest.wave)
    // Clear what is standing - the wave and the marker, because the marker
    // fights too and the nest now waits for it.
    list = list.map((creature) => creature.group === `${marker.id}-wave` || creature.id === marker.id
      ? { ...creature, phase: 'dead' as const, health: 0 }
      : creature)
    if (cleared.includes(marker.id)) break
  }
  return { nests, list, cleared, waves }
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

  it('leaves every wave creature standing somewhere it can be fought', () => {
    for (const creature of result.list.filter((entry) => entry.group === `${marker.id}-wave`)) {
      expect(Math.hypot(creature.x - marker.homeX, creature.z - marker.homeZ))
        .toBeLessThan(GLOAMWOOD_VALLEY_NEST.spawnRadius * 2)
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
