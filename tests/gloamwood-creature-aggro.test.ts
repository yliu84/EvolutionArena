import { describe, expect, it } from 'vitest'

import {
  GLOAMWOOD_AGGRO,
  gloamwoodAwakeCreatures,
  updateGloamwoodAggro,
  type GloamwoodAggroCreature,
} from '../src/gloamwood-creature-aggro'

function creature(
  id: string,
  role: 'passive' | 'aggressive',
  x: number,
  z = 0,
  awake = false,
): GloamwoodAggroCreature {
  return { id, role, x, z, awake, outOfReachSeconds: 0 }
}

describe('Noticing the player', () => {
  it('lets the player see a pack before the pack sees them', () => {
    // The camera frames roughly eighteen units either side. Notice inside that,
    // and every fight on the road is one the player chose to start.
    expect(GLOAMWOOD_AGGRO.noticeRadius).toBeLessThan(18)
  })

  it('wakes an aggressive creature that comes into range, and not before', () => {
    const far = updateGloamwoodAggro([creature('a', 'aggressive', GLOAMWOOD_AGGRO.noticeRadius + 1)], {
      playerX: 0, playerZ: 0, delta: 0.05,
    })
    expect(far.creatures[0].awake).toBe(false)
    const near = updateGloamwoodAggro([creature('a', 'aggressive', GLOAMWOOD_AGGRO.noticeRadius - 1)], {
      playerX: 0, playerZ: 0, delta: 0.05,
    })
    expect(near.creatures[0].awake).toBe(true)
    expect(near.events).toContainEqual({ type: 'woke', id: 'a', cause: 'noticed' })
  })

  it('leaves a passive creature alone however close the player walks', () => {
    const result = updateGloamwoodAggro([creature('a', 'passive', 0.5)], {
      playerX: 0, playerZ: 0, delta: 0.05,
    })
    expect(result.creatures[0].awake).toBe(false)
    expect(result.events).toHaveLength(0)
  })

  it('keeps an aggressive creature calm during the opening read period', () => {
    const result = updateGloamwoodAggro([creature('a', 'aggressive', 0.5)], {
      playerX: 0, playerZ: 0, delta: 0.05, allowNotice: false,
    })
    expect(result.creatures[0].awake).toBe(false)
    expect(result.events).toHaveLength(0)
  })

  it('wakes anything the player hits, whatever it was doing', () => {
    const result = updateGloamwoodAggro([creature('a', 'passive', 40)], {
      playerX: 0, playerZ: 0, delta: 0.05, struck: ['a'],
    })
    expect(result.creatures[0].awake).toBe(true)
    expect(result.events).toContainEqual({ type: 'woke', id: 'a', cause: 'struck' })
  })
})

describe('The alarm', () => {
  it('carries to neighbours of the creature that was struck', () => {
    const result = updateGloamwoodAggro(
      [creature('hit', 'passive', 0), creature('near', 'passive', GLOAMWOOD_AGGRO.wakeRadius - 1)],
      { playerX: 60, playerZ: 0, delta: 0.05, struck: ['hit'] },
    )
    expect(gloamwoodAwakeCreatures(result.creatures).map((entry) => entry.id)).toEqual(['hit', 'near'])
  })

  it('does not reach past its own radius', () => {
    const result = updateGloamwoodAggro(
      [creature('hit', 'passive', 0), creature('far', 'passive', GLOAMWOOD_AGGRO.wakeRadius + 1)],
      { playerX: 60, playerZ: 0, delta: 0.05, struck: ['hit'] },
    )
    expect(result.creatures[1].awake).toBe(false)
  })

  it('spreads one hop and stops, so one hit never wakes the region', () => {
    // A chain reaction turns a clearing into a single fight against everything
    // in it, and there is then no reason to ever pick a fight at all.
    const chain = [
      creature('hit', 'passive', 0),
      creature('b', 'passive', 3),
      creature('c', 'passive', 6),
      creature('d', 'passive', 9),
    ]
    const result = updateGloamwoodAggro(chain, { playerX: 90, playerZ: 0, delta: 0.05, struck: ['hit'] })
    expect(gloamwoodAwakeCreatures(result.creatures).map((entry) => entry.id)).toEqual(['hit', 'b'])
  })
})

describe('The lure', () => {
  it('pulls passive creatures', () => {
    const result = updateGloamwoodAggro([creature('a', 'passive', 20)], {
      playerX: 0, playerZ: 0, delta: 0.05, lured: ['a'],
    })
    expect(result.creatures[0].awake).toBe(true)
    expect(result.events).toContainEqual({ type: 'woke', id: 'a', cause: 'lured' })
  })

  it('refuses to pull an aggressive one, and says so', () => {
    // A lure that can drag an aggressive pack onto the player is not a tool,
    // it is a trap. The rule lives here rather than in the caller so no future
    // caller can opt out of it.
    const result = updateGloamwoodAggro([creature('a', 'aggressive', 40)], {
      playerX: 0, playerZ: 0, delta: 0.05, lured: ['a'],
    })
    expect(result.creatures[0].awake).toBe(false)
    expect(result.events).toContainEqual({ type: 'lure-refused', id: 'a' })
  })
})

describe('Giving up', () => {
  it('holds on while the player is inside the leash', () => {
    let creatures = [creature('a', 'aggressive', GLOAMWOOD_AGGRO.leashRadius - 1, 0, true)]
    for (let tick = 0; tick < 200; tick += 1) {
      creatures = updateGloamwoodAggro(creatures, { playerX: 0, playerZ: 0, delta: 0.05 }).creatures
    }
    expect(creatures[0].awake).toBe(true)
  })

  it('gives up only after holding the distance, not the instant it is crossed', () => {
    // Otherwise a creature knocked back past the line drops aggro mid-fight.
    let creatures = [creature('a', 'aggressive', GLOAMWOOD_AGGRO.leashRadius + 4, 0, true)]
    const step = 0.05
    for (let elapsed = 0; elapsed < GLOAMWOOD_AGGRO.leashSeconds - step * 2; elapsed += step) {
      creatures = updateGloamwoodAggro(creatures, { playerX: 0, playerZ: 0, delta: step }).creatures
    }
    expect(creatures[0].awake).toBe(true)
    for (let tick = 0; tick < 4; tick += 1) {
      creatures = updateGloamwoodAggro(creatures, { playerX: 0, playerZ: 0, delta: step }).creatures
    }
    expect(creatures[0].awake).toBe(false)
  })

  it('forgets the timer the moment the player comes back', () => {
    let creatures = [creature('a', 'aggressive', GLOAMWOOD_AGGRO.leashRadius + 4, 0, true)]
    creatures = updateGloamwoodAggro(creatures, { playerX: 0, playerZ: 0, delta: 3 }).creatures
    expect(creatures[0].outOfReachSeconds).toBeCloseTo(3, 5)
    creatures[0].x = 5
    creatures = updateGloamwoodAggro(creatures, { playerX: 0, playerZ: 0, delta: 0.05 }).creatures
    expect(creatures[0].outOfReachSeconds).toBe(0)
    expect(creatures[0].awake).toBe(true)
  })

  it('leaves the dead out of it', () => {
    const result = updateGloamwoodAggro(
      [{ ...creature('a', 'aggressive', 1), dead: true }],
      { playerX: 0, playerZ: 0, delta: 0.05, struck: ['a'] },
    )
    expect(result.creatures[0].awake).toBe(false)
    expect(gloamwoodAwakeCreatures(result.creatures)).toHaveLength(0)
  })
})
