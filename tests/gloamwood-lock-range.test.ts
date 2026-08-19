import { describe, expect, it } from 'vitest'

import { GLOAMWOOD_AGGRO } from '../src/gloamwood-creature-aggro'
import {
  GLOAMWOOD_LOCK_RANGE,
  gloamwoodPrimaryAttackShouldClose,
  nextGloamwoodLockTarget,
} from '../src/gloamwood-3d-hunt'
import type { GloamwoodNestPrey } from '../src/gloamwood-3d-ecology'

function prey(id: string, x: number, z = 0): GloamwoodNestPrey {
  return {
    id, kind: 'fang', phase: 'chase', phaseElapsed: 0, health: 10, maxHealth: 10,
    x, z, facingRadians: 0, attackResolved: false, slot: 0,
  }
}

describe('What Tab can reach', () => {
  const player = { x: 0, z: 0 }

  it('ignores anything past its range', () => {
    // Unlimited, the cycle ran the whole map: on the valley a second press
    // jumped to something a hundred metres away and the lock read as lost.
    const far = prey('far', GLOAMWOOD_LOCK_RANGE + 5)
    expect(nextGloamwoodLockTarget([far], null, player)).toBeNull()
  })

  it('reaches a little further than a creature can notice you', () => {
    // So the player can pick a fight before it picks them, which is the whole
    // relationship the aggro radius was chosen for.
    expect(GLOAMWOOD_LOCK_RANGE).toBeGreaterThan(GLOAMWOOD_AGGRO.noticeRadius)
  })

  it('cycles nearest first, and comes back round', () => {
    const near = prey('near', 3)
    const middle = prey('middle', 8)
    const outer = prey('outer', 14)
    const pack = [outer, near, middle]
    expect(nextGloamwoodLockTarget(pack, null, player)).toBe('near')
    expect(nextGloamwoodLockTarget(pack, 'near', player)).toBe('middle')
    expect(nextGloamwoodLockTarget(pack, 'middle', player)).toBe('outer')
    expect(nextGloamwoodLockTarget(pack, 'outer', player)).toBe('near')
  })

  it('takes the nearest again when what was locked is gone', () => {
    // Pressing Tab twice on a single creature used to hand back nothing and
    // never recover. Losing a target must fall back, not give up.
    const only = prey('only', 4)
    expect(nextGloamwoodLockTarget([only], 'only', player)).toBe('only')
    expect(nextGloamwoodLockTarget([only], 'a-ghost', player)).toBe('only')
    expect(nextGloamwoodLockTarget([only, prey('second', 6)], 'only', player)).toBe('second')
  })

  it('skips the dead', () => {
    const dead = { ...prey('dead', 2), phase: 'dead' as const }
    expect(nextGloamwoodLockTarget([dead, prey('alive', 9)], null, player)).toBe('alive')
  })
})


describe('Pressing attack on something out of reach', () => {
  const player = { x: 0, z: 0 }
  const reach = 2.4
  const radius = 0.64

  it('walks rather than swinging', () => {
    // Playtest: locking a creature and pressing attack threw one swing at empty
    // ground, printed "target out of reach", and only then began walking - and
    // held down, the next swing started before a step was taken, so the player
    // appeared not to move at all. Movement is suppressed for the whole of an
    // attack, so the press was giving the order and then blocking it.
    expect(gloamwoodPrimaryAttackShouldClose(12, radius, reach)).toBe(true)
  })

  it('swings when the blow can actually land', () => {
    expect(gloamwoodPrimaryAttackShouldClose(reach + radius - 0.1, radius, reach)).toBe(false)
  })

  it('measures to the hurt surface, not to the centre', () => {
    // A boss four metres across is in reach at a centre distance that would be
    // far out of it for a swarm creature.
    const centre = reach + 3
    expect(gloamwoodPrimaryAttackShouldClose(centre, 3.5, reach)).toBe(false)
    expect(gloamwoodPrimaryAttackShouldClose(centre, 0.3, reach)).toBe(true)
  })

  it('still swings at something past the lock range', () => {
    // The approach refuses to run beyond it, so refusing to swing as well would
    // leave the button doing nothing at all. The honest miss is the answer.
    expect(gloamwoodPrimaryAttackShouldClose(GLOAMWOOD_LOCK_RANGE + 1, radius, reach)).toBe(false)
  })

  it('agrees with the lock about what can be walked to', () => {
    // If it can be locked it can be walked to. Anything the cycle will select
    // must therefore be something the press will close on rather than whiff at.
    const edge = prey('edge', GLOAMWOOD_LOCK_RANGE - 0.5)
    expect(nextGloamwoodLockTarget([edge], null, player)).toBe('edge')
    expect(gloamwoodPrimaryAttackShouldClose(GLOAMWOOD_LOCK_RANGE - 0.5, radius, reach)).toBe(true)
  })
})
