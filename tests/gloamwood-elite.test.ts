import { describe, expect, it } from 'vitest'

import { ELITE_AFFIX_IDS, TOXIC_BURST_RADIUS } from '../src/elite-affixes'
import { GLOAMWOOD_BOSS } from '../src/gloamwood-3d-boss'
import { GLOAMWOOD_PREY } from '../src/gloamwood-3d-ecology'
import {
  GLOAMWOOD_ELITE,
  createGloamwoodElite,
  gloamwoodEliteAbsorb,
  gloamwoodEliteBurstHits,
  gloamwoodEliteDamage,
  gloamwoodEliteDeathBurst,
  gloamwoodEliteMaxHealth,
  gloamwoodEliteSiphon,
  gloamwoodEliteSpeed,
  gloamwoodEliteSplits,
  type GloamwoodEliteState,
} from '../src/gloamwood-elite'

function elite(affix: GloamwoodEliteState['affix'], shield = 0): GloamwoodEliteState {
  return { affix, shield, broodTriggered: false }
}

describe('Units', () => {
  it('does not inherit the pixel distances of the 2D stack', () => {
    // The affix rules are reused; their numbers cannot be. 132 is screen pixels
    // in a stack that measures in them, and dropped in here unchanged it is a
    // burst covering the whole valley.
    expect(GLOAMWOOD_ELITE.burstRadius).toBeLessThan(TOXIC_BURST_RADIUS / 10)
  })

  it('reaches less far than the region boss it sits below', () => {
    expect(GLOAMWOOD_ELITE.burstRadius).toBeLessThan(GLOAMWOOD_BOSS.patterns['root-slam'].radius)
  })

  it('reaches further than a prey attack, so stepping away is a real decision', () => {
    for (const spec of Object.values(GLOAMWOOD_PREY)) {
      expect(GLOAMWOOD_ELITE.burstRadius).toBeGreaterThan(spec.attackRange)
    }
  })

  it('gives the player time to leave the burst on foot', () => {
    // PLAYER_SPEED is 6.2 world units a second.
    expect(GLOAMWOOD_ELITE.burstTelegraphSeconds * 6.2).toBeGreaterThan(GLOAMWOOD_ELITE.burstRadius)
  })
})

describe('Drawing an affix', () => {
  it('is stable for a run and a place, so a reload is the same fight', () => {
    const first = createGloamwoodElite('run-a', 'scree-shelf', 100)
    const second = createGloamwoodElite('run-a', 'scree-shelf', 100)
    expect(first.affix).toBe(second.affix)
  })

  it('varies across places within one run', () => {
    const drawn = new Set(
      ['fern-hollow', 'scree-shelf', 'dead-grove', 'high-terrace', 'stone-bowl', 'reed-ford']
        .map((place) => createGloamwoodElite('run-a', place, 100).affix),
    )
    expect(drawn.size).toBeGreaterThan(1)
  })

  it('only ever draws an affix that exists', () => {
    for (let index = 0; index < 60; index += 1) {
      expect(ELITE_AFFIX_IDS).toContain(createGloamwoodElite(`run-${index}`, 'chamber', 100).affix)
    }
  })
})

describe('Health', () => {
  it('makes a fight long enough for an affix to happen', () => {
    expect(gloamwoodEliteMaxHealth(GLOAMWOOD_PREY.fang.maxHealth)).toBeGreaterThan(90)
  })
})

describe('Barrier', () => {
  it('eats damage until it is gone, then stops', () => {
    let state = elite('barrier', 30)
    let result = gloamwoodEliteAbsorb(state, 12)
    expect(result.absorbed).toBe(12)
    expect(result.elite!.shield).toBe(18)
    state = result.elite!
    result = gloamwoodEliteAbsorb(state, 25)
    expect(result.absorbed).toBe(18)
    expect(result.damage).toBe(7)
    expect(result.elite!.shield).toBe(0)
  })

  it('never reduces a hit to nothing while the shield holds', () => {
    // A hit that lands for zero reads as a miss, and the player stops attacking
    // the thing they are supposed to be breaking through.
    const result = gloamwoodEliteAbsorb(elite('barrier', 40), 10)
    expect(result.damage).toBe(0)
    expect(result.absorbed).toBe(10)
  })

  it('leaves the damage of every other affix exactly as it found it', () => {
    for (const affix of ELITE_AFFIX_IDS) {
      if (affix === 'barrier') continue
      expect(gloamwoodEliteAbsorb(elite(affix), 17).damage).toBe(17)
    }
  })

  it('does nothing at all when the creature is not an elite', () => {
    expect(gloamwoodEliteAbsorb(undefined, 17)).toEqual({ elite: undefined, damage: 17, absorbed: 0 })
  })
})

describe('Brood', () => {
  it('splits once, on the hit that crosses half health', () => {
    expect(gloamwoodEliteSplits(elite('brood'), 60, 49, 100)).toBe(true)
    expect(gloamwoodEliteSplits(elite('brood'), 49, 40, 100)).toBe(false)
  })

  it('does not split on the hit that kills it', () => {
    expect(gloamwoodEliteSplits(elite('brood'), 60, 0, 100)).toBe(false)
  })

  it('never splits twice', () => {
    expect(gloamwoodEliteSplits({ ...elite('brood'), broodTriggered: true }, 60, 49, 100)).toBe(false)
  })
})

describe('Volatile', () => {
  it('leaves a burst where it died, and only for volatile', () => {
    expect(gloamwoodEliteDeathBurst(elite('volatile'), 12, -4)).toMatchObject({ x: 12, z: -4 })
    for (const affix of ELITE_AFFIX_IDS) {
      if (affix === 'volatile') continue
      expect(gloamwoodEliteDeathBurst(elite(affix), 12, -4)).toBeNull()
    }
  })

  it('hits inside its radius and misses outside it', () => {
    const burst = gloamwoodEliteDeathBurst(elite('volatile'), 0, 0)!
    expect(gloamwoodEliteBurstHits(burst, GLOAMWOOD_ELITE.burstRadius - 0.1, 0)).toBe(true)
    expect(gloamwoodEliteBurstHits(burst, GLOAMWOOD_ELITE.burstRadius + 0.1, 0)).toBe(false)
  })
})

describe('Siphon and berserker', () => {
  it('heals a siphon elite when it lands a hit, and nothing else', () => {
    expect(gloamwoodEliteSiphon(elite('siphon'), 50, 100, 20)).toBeGreaterThan(50)
    expect(gloamwoodEliteSiphon(elite('barrier'), 50, 100, 20)).toBe(50)
    expect(gloamwoodEliteSiphon(undefined, 50, 100, 20)).toBe(50)
  })

  it('winds a berserker up only below half health', () => {
    expect(gloamwoodEliteSpeed(elite('berserker'), 60, 100)).toBe(1)
    expect(gloamwoodEliteSpeed(elite('berserker'), 40, 100)).toBeGreaterThan(1)
    expect(gloamwoodEliteDamage(elite('berserker'), 40, 100)).toBeGreaterThan(1)
  })

  it('leaves an ordinary creature at exactly one on every multiplier', () => {
    expect(gloamwoodEliteSpeed(undefined, 40, 100)).toBe(1)
    expect(gloamwoodEliteDamage(undefined, 40, 100)).toBe(1)
  })
})
