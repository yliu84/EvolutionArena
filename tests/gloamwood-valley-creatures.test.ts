import { describe, expect, it } from 'vitest'

import { GLOAMWOOD_PREY, inspectGloamwoodPreyPairClearance } from '../src/gloamwood-3d-ecology'
import { GLOAMWOOD_AGGRO } from '../src/gloamwood-creature-aggro'
import { GLOAMWOOD_ELITE } from '../src/gloamwood-elite'
import {
  GLOAMWOOD_VALLEY_WANDER,
  createGloamwoodValleyCreatures,
  gloamwoodValleyAwake,
  stepGloamwoodValleyCreatures,
  type GloamwoodValleyCreature,
} from '../src/gloamwood-valley-creatures'
import { gloamwoodValleyCorridorAt, gloamwoodValleyWalkable } from '../src/gloamwood-valley-terrain'

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
      } else if (creature.tier === 'boss') {
        expect(creature.elite).toBeUndefined()
      } else {
        expect(creature.elite).toBeUndefined()
        expect(creature.maxHealth).toBe(GLOAMWOOD_PREY[creature.kind].maxHealth)
      }
    }
    expect(GLOAMWOOD_ELITE.healthMultiplier).toBeGreaterThan(1)
  })

  it('stands every boss behind more health than any elite', () => {
    // Bosses read their health from their own spec now. Reading the family's
    // put three region bosses behind ninety-two hit points - fewer than the
    // elite down the branch, and the same as the beetle standing beside them.
    const elites = creatures.filter((creature) => creature.tier === 'elite')
    const strongestElite = Math.max(...elites.map((creature) => creature.maxHealth))
    const bosses = creatures.filter((creature) => creature.tier === 'boss')
    expect(bosses).toHaveLength(3)
    for (const boss of bosses) expect(boss.maxHealth).toBeGreaterThan(strongestElite)
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

describe('Grazing', () => {
  const grazers = creatures.filter((creature) => creature.role === 'passive')
  const away = { x: 99999, z: 99999, alive: true, bodyRadius: 1.56 }

  it('moves, because a map of statues reads as a diorama', () => {
    const after = run(creatures, away, 30).creatures
    const moved = grazers.filter((grazer) => {
      const now = after.find((entry) => entry.id === grazer.id)!
      return Math.hypot(now.x - grazer.homeX, now.z - grazer.homeZ) > 0.4
    })
    expect(moved.length).toBeGreaterThan(grazers.length * 0.5)
  }, 15_000)

  it('keeps an action gap while grazers wander', () => {
    // A body gap alone is not enough: two creatures can stop intersecting and
    // still leave no readable wind-up or strike space between their models.
    const after = run(creatures, away, 5).creatures
    expect(inspectGloamwoodPreyPairClearance(after)).toBeGreaterThanOrEqual(-0.001)
  })

  it('keeps that gap around the real river-valley spawn point', () => {
    const after = run(creatures, { x: 78.83, z: 11.22, alive: true, bodyRadius: 1.56 }, 5).creatures
    expect(inspectGloamwoodPreyPairClearance(after)).toBeGreaterThanOrEqual(-0.001)
  })

  it('never goes far, so it can still be walked past on purpose', () => {
    // A creature that is not where it was last seen cannot be avoided
    // deliberately, and the placement that put the pebble among real boulders
    // would be undone by the first frame.
    const after = run(creatures, away, 60).creatures
    for (const grazer of grazers) {
      const now = after.find((entry) => entry.id === grazer.id)!
      expect(
        Math.hypot(now.x - grazer.homeX, now.z - grazer.homeZ),
        `${grazer.id} wandered off`,
      ).toBeLessThanOrEqual(GLOAMWOOD_VALLEY_WANDER.radius + 0.2)
    }
  }, 15_000)

  it('stays off the road it was placed beside', () => {
    // A grazer standing in the path is standing in the fight the player is
    // walking into.
    const after = run(creatures, away, 60).creatures
    for (const grazer of grazers) {
      const now = after.find((entry) => entry.id === grazer.id)!
      const corridor = gloamwoodValleyCorridorAt(now.x, now.z)
      expect(corridor.pathDistance, `${grazer.id} stepped onto the path`).toBeGreaterThan(corridor.pathHalfWidth * 0.7)
    }
  })

  it('never leaves the ground it can stand on', () => {
    const after = run(creatures, away, 60).creatures
    for (const creature of after) {
      expect(gloamwoodValleyWalkable(creature.x, creature.z), `${creature.id} left the map`).toBe(true)
    }
  })

  it('replays identically, so a recorded run means something', () => {
    const first = run(createGloamwoodValleyCreatures(SEED), away, 20).creatures
    const second = run(createGloamwoodValleyCreatures(SEED), away, 20).creatures
    expect(first.map((entry) => [entry.id, entry.x, entry.z]))
      .toEqual(second.map((entry) => [entry.id, entry.x, entry.z]))
  })

  it('leaves the packs planted where they were placed to ambush from', () => {
    // The spacing that stops one pack waking the next is measured from where
    // they stand, so a pack that drifts undoes it.
    const after = run(creatures, away, 60).creatures
    for (const creature of creatures.filter((entry) => entry.role === 'aggressive')) {
      const now = after.find((entry) => entry.id === creature.id)!
      expect(Math.hypot(now.x - creature.homeX, now.z - creature.homeZ)).toBeLessThan(0.5)
    }
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
