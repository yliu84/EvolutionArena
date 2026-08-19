import { describe, expect, it } from 'vitest'

import { GLOAMWOOD_PREY } from '../src/gloamwood-3d-ecology'
import { GLOAMWOOD_AGGRO } from '../src/gloamwood-creature-aggro'
import { GLOAMWOOD_ELITE } from '../src/gloamwood-elite'
import {
  createGloamwoodValleyCreatures,
  gloamwoodValleyAwake,
  stepGloamwoodValleyCreatures,
  type GloamwoodValleyCreature,
} from '../src/gloamwood-valley-creatures'
import { gloamwoodValleyWalkable } from '../src/gloamwood-valley-terrain'

const SEED = 0x5a11e
const creatures = createGloamwoodValleyCreatures(SEED)

function at(creature: GloamwoodValleyCreature, distance = 0) {
  return { x: creature.x + distance, z: creature.z, alive: true, bodyRadius: 1.56 }
}

function run(
  start: readonly GloamwoodValleyCreature[],
  player: ReturnType<typeof at>,
  seconds: number,
  input: { struck?: string[] } = {},
) {
  let current = [...start]
  const events = []
  for (let elapsed = 0; elapsed < seconds; elapsed += 0.05) {
    const frame = stepGloamwoodValleyCreatures(current, 0.05, player, elapsed === 0 ? input : {})
    current = frame.creatures
    events.push(...frame.events)
  }
  return { creatures: current, events }
}

describe('Who is out there', () => {
  it('builds one creature per placed spawn', () => {
    expect(creatures.length).toBe(63)
  })

  it('starts everything asleep, including the aggressive ones', () => {
    // Nothing has seen the player yet, so the map opens quiet. An aggressive
    // creature that starts awake is one already walking at a player who has not
    // arrived.
    expect(gloamwoodValleyAwake(creatures)).toHaveLength(0)
  })

  it('gives elites their affix and their health, and nothing else one', () => {
    for (const creature of creatures) {
      if (creature.tier === 'elite') {
        expect(creature.elite).toBeDefined()
        expect(creature.maxHealth).toBeGreaterThan(GLOAMWOOD_PREY[creature.kind].maxHealth)
      } else {
        expect(creature.elite).toBeUndefined()
        expect(creature.maxHealth).toBe(GLOAMWOOD_PREY[creature.kind].maxHealth)
      }
    }
    expect(GLOAMWOOD_ELITE.healthMultiplier).toBeGreaterThan(1)
  })

  it('rebuilds identically from the same seed', () => {
    expect(createGloamwoodValleyCreatures(SEED)).toEqual(creatures)
  })
})

describe('Noticing', () => {
  const aggressive = creatures.find((creature) => creature.role === 'aggressive' && creature.tier === 'pack')!
  const grazer = creatures.find((creature) => creature.role === 'passive')!

  it('wakes an aggressive creature the player walks up to', () => {
    const frame = stepGloamwoodValleyCreatures(creatures, 0.05, at(aggressive, 4))
    expect(frame.creatures.find((entry) => entry.id === aggressive.id)!.awake).toBe(true)
  })

  it('leaves a grazer alone at the same distance', () => {
    const frame = stepGloamwoodValleyCreatures(creatures, 0.05, at(grazer, 4))
    expect(frame.creatures.find((entry) => entry.id === grazer.id)!.awake).toBe(false)
  })

  it('wakes a grazer that is struck', () => {
    const frame = stepGloamwoodValleyCreatures(creatures, 0.05, at(grazer, 4), { struck: [grazer.id] })
    expect(frame.creatures.find((entry) => entry.id === grazer.id)!.awake).toBe(true)
  })

  it('never wakes the whole map at once', () => {
    // Standing on one pack must not bring the region. The packs are spaced off
    // the notice radius for exactly this, and this is the check that the spacing
    // and the aggro layer agree about what that radius means.
    const frame = stepGloamwoodValleyCreatures(creatures, 0.05, at(aggressive, 1))
    expect(gloamwoodValleyAwake(frame.creatures).length).toBeLessThanOrEqual(6)
  })
})

describe('Standing still', () => {
  it('keeps an unwoken creature where it was placed', () => {
    // A grazer that wanders cannot be walked past on purpose, and the placement
    // work that put it among the right rocks is undone by the first frame.
    const grazer = creatures.find((creature) => creature.role === 'passive')!
    const after = run(creatures, { x: 9999, z: 9999, alive: true, bodyRadius: 1.56 }, 8).creatures
    const moved = after.find((entry) => entry.id === grazer.id)!
    expect(Math.hypot(moved.x - grazer.homeX, moved.z - grazer.homeZ)).toBeLessThan(0.5)
  })
})

describe('Coming for the player', () => {
  const pack = creatures.filter((creature) => creature.group === creatures.find((entry) => entry.tier === 'pack')!.group)

  it('closes the distance and attacks', () => {
    const anchor = pack[0]
    const player = at(anchor, 9)
    const { events } = run(creatures, player, 12)
    expect(events.some((event) => event.type === 'prey-attack')).toBe(true)
  })

  it('never leaves a creature somewhere it cannot stand', () => {
    // A creature pushed into the river or through a wall by its own chase is
    // one the player cannot reach and the run cannot clear.
    const anchor = pack[0]
    const after = run(creatures, at(anchor, 9), 12).creatures
    for (const creature of after) {
      expect(gloamwoodValleyWalkable(creature.x, creature.z), `${creature.id} left the map`).toBe(true)
    }
  })

  it('does not stack a pack into one body', () => {
    const anchor = pack[0]
    const after = run(creatures, at(anchor, 9), 12).creatures
    const engaged = after.filter((creature) => creature.awake && creature.phase !== 'dead')
    for (let a = 0; a < engaged.length; a += 1) {
      for (let b = a + 1; b < engaged.length; b += 1) {
        expect(Math.hypot(engaged[a].x - engaged[b].x, engaged[a].z - engaged[b].z)).toBeGreaterThan(0.4)
      }
    }
  })

  it('gives up when the player leaves, and goes home', () => {
    const anchor = pack[0]
    let current = run(creatures, at(anchor, 4), 3).creatures
    expect(gloamwoodValleyAwake(current).length).toBeGreaterThan(0)
    current = run(current, { x: anchor.x + 400, z: anchor.z, alive: true, bodyRadius: 1.56 }, GLOAMWOOD_AGGRO.leashSeconds + 2).creatures
    expect(gloamwoodValleyAwake(current)).toHaveLength(0)
  })
})
