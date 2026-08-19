import { describe, expect, it } from 'vitest'

import { GLOAMWOOD_AGGRO } from '../src/gloamwood-creature-aggro'
import { GLOAMWOOD_LOCK_RANGE, nextGloamwoodLockTarget } from '../src/gloamwood-3d-hunt'
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
