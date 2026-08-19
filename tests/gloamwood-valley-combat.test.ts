import { describe, expect, it } from 'vitest'

import { GLOAMWOOD_AGGRO } from '../src/gloamwood-creature-aggro'
import { createGloamwoodValleyCreatures, type GloamwoodValleyCreature } from '../src/gloamwood-valley-creatures'
import {
  GLOAMWOOD_VALLEY_PLAYER,
  createGloamwoodValleyCombat,
  gloamwoodValleyAcquire,
  spendGloamwoodValleyLife,
  stepGloamwoodValleyCombat,
  takeGloamwoodValleyHit,
} from '../src/gloamwood-valley-combat'
import { createGloamwoodValleyProgression } from '../src/gloamwood-valley-progression'

const creatures = createGloamwoodValleyCreatures(0x5a11e)

/** Swings at a target standing just inside reach, until it dies or time runs out. */
function fight(target: GloamwoodValleyCreature, list: readonly GloamwoodValleyCreature[], swings = 40) {
  let state = createGloamwoodValleyCombat()
  let current = [...list]
  let now = 0
  const hits = []
  for (let swing = 0; swing < swings; swing += 1) {
    for (let tick = 0; tick < 24; tick += 1) {
      // Following it. Each hit knocks the target back, so a player who stands
      // still lands two blows and then swings at air - which is what a player
      // actually does about it, and what the test has to do too.
      const live = current.find((entry) => entry.id === target.id)!
      const frame = stepGloamwoodValleyCombat(state, current, {
        now,
        delta: 0.05,
        player: { x: live.x - 2.6, z: live.z },
        attackHeld: true,
        attackPressed: tick === 0,
        facingRadians: 0,
      })
      state = frame.state
      current = frame.creatures
      hits.push(...frame.hits)
      now += 50
    }
  }
  return { state, creatures: current, hits }
}

describe('Picking a target', () => {
  it('never locks something further than the reach it was given', () => {
    const target = creatures[0]
    const far = gloamwoodValleyAcquire(creatures, {
      x: target.x + GLOAMWOOD_VALLEY_PLAYER.acquireRange + 40,
      z: target.z + 200,
    })
    expect(far).toBeNull()
  })

  it('cannot reach as far as a creature can notice', () => {
    // Otherwise the first move of every fight is a free hit from outside the
    // creature's world.
    expect(GLOAMWOOD_VALLEY_PLAYER.acquireRange).toBeLessThan(GLOAMWOOD_AGGRO.noticeRadius)
  })

  it('prefers the creature that is coming for you over the one that is not', () => {
    // A player fighting a pack that keeps locking the grazer behind it is
    // fighting a mystery.
    const awake = { ...creatures[0], awake: true, x: 0, z: 0, id: 'awake' }
    const asleep = { ...creatures[1], awake: false, x: 1.2, z: 0, id: 'asleep' }
    expect(gloamwoodValleyAcquire([asleep, awake], { x: 3, z: 0 })).toBe('awake')
  })

  it('drops a lock on something that died', () => {
    const target = { ...creatures[0], x: 0, z: 0, awake: true }
    const dead = { ...target, phase: 'dead' as const }
    const state = { ...createGloamwoodValleyCombat(), lockedId: target.id }
    const frame = stepGloamwoodValleyCombat(state, [dead], {
      now: 0, delta: 0.05, player: { x: 2, z: 0 }, attackHeld: false, attackPressed: false, facingRadians: 0,
    })
    expect(frame.state.lockedId).not.toBe(target.id)
  })
})

describe('Swinging', () => {
  const target = { ...creatures.find((entry) => entry.kind === 'fang')!, x: 0, z: 0, awake: true }

  it('kills something it keeps hitting', () => {
    const result = fight(target, [target])
    expect(result.hits.length).toBeGreaterThan(0)
    expect(result.creatures[0].phase).toBe('dead')
  })

  it('reports every hit through the one damage gate', () => {
    const result = fight(target, [target], 3)
    for (const hit of result.hits) expect(hit.damage).toBeGreaterThan(0)
  })

  it('wakes whatever it hits', () => {
    const asleep = { ...target, awake: false }
    let state = { ...createGloamwoodValleyCombat(), lockedId: asleep.id }
    let struck: string[] = []
    let now = 0
    for (let tick = 0; tick < 40 && struck.length === 0; tick += 1) {
      const frame = stepGloamwoodValleyCombat(state, [asleep], {
        now, delta: 0.05, player: { x: -2.6, z: 0 }, attackHeld: true, attackPressed: tick === 0, facingRadians: 0,
      })
      state = frame.state
      struck = frame.struck
      now += 50
    }
    expect(struck).toEqual([asleep.id])
  })

  it('misses a target it is not facing', () => {
    let state = { ...createGloamwoodValleyCombat(), lockedId: target.id }
    let hits = 0
    let now = 0
    for (let tick = 0; tick < 60; tick += 1) {
      const frame = stepGloamwoodValleyCombat(state, [target], {
        now, delta: 0.05, player: { x: -2.6, z: 0 }, attackHeld: true, attackPressed: tick === 0,
        // Facing away.
        facingRadians: Math.PI,
      })
      state = frame.state
      hits += frame.hits.length
      now += 50
    }
    expect(hits).toBe(0)
  })

  it('measures reach to the target surface, not its origin', () => {
    // A wide creature blocks the player while its centre stays outside every
    // action's range, and then nothing can ever be hit.
    const wide = { ...creatures.find((entry) => entry.kind === 'shell')!, x: 0, z: 0, awake: true }
    const result = fight(wide, [wide], 4)
    expect(result.hits.length).toBeGreaterThan(0)
  })
})

describe('Taking a hit', () => {
  it('takes damage and then cannot be hit again immediately', () => {
    // A pack of four resolving four blows in one frame kills a player who had
    // no frame in which to answer.
    const first = takeGloamwoodValleyHit(createGloamwoodValleyCombat(), 20)
    expect(first.state.health).toBe(GLOAMWOOD_VALLEY_PLAYER.maxHealth - 20)
    const second = takeGloamwoodValleyHit(first.state, 20)
    expect(second.state.health).toBe(first.state.health)
  })

  it('reports the death that empties the bar', () => {
    const combat = { ...createGloamwoodValleyCombat(), health: 5 }
    expect(takeGloamwoodValleyHit(combat, 12).died).toBe(true)
  })
})

describe('Lives', () => {
  it('restores the player and spends one', () => {
    const progression = createGloamwoodValleyProgression()
    const result = spendGloamwoodValleyLife({ ...createGloamwoodValleyCombat(), health: 0 }, progression)
    expect(result.runOver).toBe(false)
    expect(result.combat.health).toBe(GLOAMWOOD_VALLEY_PLAYER.maxHealth)
    expect(result.progression.livesRemaining).toBe(progression.livesRemaining - 1)
  })

  it('ends the run on the last one', () => {
    const progression = { ...createGloamwoodValleyProgression(), livesRemaining: 1 }
    expect(spendGloamwoodValleyLife(createGloamwoodValleyCombat(), progression).runOver).toBe(true)
  })

  it('gives a moment of mercy on respawn', () => {
    const result = spendGloamwoodValleyLife(createGloamwoodValleyCombat(), createGloamwoodValleyProgression())
    expect(result.combat.mercySeconds).toBeGreaterThan(0)
  })
})

describe('Facing', () => {
  it('turns toward the locked target while swinging', () => {
    // Without this a lock is decoration: the player faces wherever they last
    // walked, the contact test rejects the aim, and a creature that circled
    // behind them cannot be hit for a reason nothing on screen explains.
    const target = { ...creatures[0], x: 0, z: 4, awake: true }
    let state = { ...createGloamwoodValleyCombat(), lockedId: target.id, facingRadians: 0 }
    let now = 0
    for (let tick = 0; tick < 20; tick += 1) {
      const frame = stepGloamwoodValleyCombat(state, [target], {
        now, delta: 0.05, player: { x: 0, z: 0 }, attackHeld: true, attackPressed: tick === 0, facingRadians: 0,
      })
      state = frame.state
      now += 50
    }
    // The target is at -Z in world terms, which is +90 degrees of facing.
    expect(Math.abs(state.facingRadians)).toBeGreaterThan(0.5)
  })

  it('leaves facing alone when nothing is being swung at', () => {
    const target = { ...creatures[0], x: 0, z: 4, awake: true }
    const frame = stepGloamwoodValleyCombat(
      { ...createGloamwoodValleyCombat(), lockedId: target.id, facingRadians: 0 },
      [target],
      { now: 0, delta: 0.05, player: { x: 0, z: 0 }, attackHeld: false, attackPressed: false, facingRadians: 0 },
    )
    expect(frame.state.facingRadians).toBe(0)
  })
})
