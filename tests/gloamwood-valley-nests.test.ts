import { describe, expect, it } from 'vitest'

import { createGloamwoodValleyCreatures, type GloamwoodValleyCreature } from '../src/gloamwood-valley-creatures'
import {
  GLOAMWOOD_VALLEY_NEST,
  createGloamwoodValleyNests,
  stepGloamwoodValleyNests,
} from '../src/gloamwood-valley-nests'
import { GLOAMWOOD_LOCK_RANGE } from '../src/gloamwood-3d-hunt'

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
    // Clear the wave that is standing.
    list = list.map((creature) => creature.group === `${marker.id}-wave`
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

  it('does not count its own marker as part of the fight', () => {
    // The marker is what the player walked into, not a wave. Counting it would
    // leave the nest unclearable while it still stood.
    const still = result.list.find((creature) => creature.id === marker.id)!
    expect(still.phase).not.toBe('dead')
    expect(result.cleared).toContain(marker.id)
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
