import { describe, expect, it } from 'vitest'

import {
  GLOAMWOOD_NEST,
  createGloamwoodNestState,
  damageGloamwoodNestPrey,
  stepGloamwoodNest,
  type GloamwoodNestPrey,
  type GloamwoodNestState,
} from '../src/gloamwood-3d-ecology'
import { GLOAMWOOD_ELITE, type GloamwoodEliteState } from '../src/gloamwood-elite'

/**
 * These go through the damage gate rather than the elite module.
 *
 * The elite rules have their own tests and they passed while nothing was
 * connected to them. What has to be checked here is that a hit on an elite
 * actually travels through the one gate and comes out changed.
 */
function nestWithElite(affix: GloamwoodEliteState['affix'], shield = 0) {
  const started = stepGloamwoodNest(createGloamwoodNestState(), 0.05, {
    x: GLOAMWOOD_NEST.centerX, z: GLOAMWOOD_NEST.centerZ, alive: true,
  }).state
  const target = started.prey.find((prey) => prey.kind === 'fang')!
  const elite: GloamwoodEliteState = { affix, shield, broodTriggered: false }
  const state: GloamwoodNestState = {
    ...started,
    prey: started.prey.map((prey) => prey.id === target.id ? { ...prey, elite } : prey),
  }
  return { state, target }
}

/** Runs the nest forward to a given wave by killing everything in the way. */
function clearToWave(wave: number) {
  const player = { x: GLOAMWOOD_NEST.centerX, z: GLOAMWOOD_NEST.centerZ, alive: true }
  let state = stepGloamwoodNest(createGloamwoodNestState(), 0.05, player).state
  for (let guard = 0; guard < 400 && state.wave < wave; guard += 1) {
    const alive = state.prey.find((prey) => prey.phase !== 'dead')
    if (alive) state = damageGloamwoodNestPrey(state, alive.id, 999, 'Claw', behind(alive), 0).state
    else state = stepGloamwoodNest(state, 0.05, player).state
  }
  return state
}

function behind(target: GloamwoodNestPrey) {
  return { x: target.x - 2, z: target.z }
}

describe('An elite in the damage gate', () => {
  it('takes less health off through a barrier than the same creature without one', () => {
    const plain = stepGloamwoodNest(createGloamwoodNestState(), 0.05, {
      x: GLOAMWOOD_NEST.centerX, z: GLOAMWOOD_NEST.centerZ, alive: true,
    }).state
    const target = plain.prey.find((prey) => prey.kind === 'fang')!
    const ordinary = damageGloamwoodNestPrey(plain, target.id, 20, 'Claw', behind(target), 0)

    const { state, target: eliteTarget } = nestWithElite('barrier', 40)
    const shielded = damageGloamwoodNestPrey(state, eliteTarget.id, 20, 'Claw', behind(eliteTarget), 0)

    expect(shielded.absorbedByShield).toBeGreaterThan(0)
    expect(shielded.effectiveDamage).toBeLessThan(ordinary.effectiveDamage)
    const after = shielded.state.prey.find((prey) => prey.id === eliteTarget.id)!
    expect(after.elite!.shield).toBeLessThan(40)
  })

  it('applies the family multiplier before the barrier, not after', () => {
    // Order matters and there is no way to see it from the outside: a shell's
    // frontal reduction shrinking the hit before the shield eats it is a very
    // different fight from a shield eating the full hit first.
    // Wave one is two Fangs; the Carapace family arrives in wave two.
    const started = clearToWave(2)
    const shell = started.prey.find((prey) => prey.kind === 'shell')!
    const withShield: GloamwoodNestState = {
      ...started,
      prey: started.prey.map((prey) => prey.id === shell.id
        ? { ...prey, elite: { affix: 'barrier' as const, shield: 100, broodTriggered: false } }
        : prey),
    }
    // Identified by the gate's own `blocked` flag rather than by which side of
    // the creature the attacker was put on: the shell has already turned to
    // face the player by the time the wave is running.
    const hits = [shell.x + 2, shell.x - 2]
      .map((x) => damageGloamwoodNestPrey(withShield, shell.id, 40, 'Pounce', { x, z: shell.z }, 0))
    const blocked = hits.find((hit) => hit.blocked)!
    const open = hits.find((hit) => !hit.blocked)!
    expect(blocked).toBeDefined()
    expect(blocked.absorbedByShield).toBeLessThan(open.absorbedByShield)
  })

  it('reports the split once and never again', () => {
    const { state, target } = nestWithElite('brood')
    let current = state
    let splits = 0
    for (let hit = 0; hit < 12; hit += 1) {
      const alive = current.prey.find((prey) => prey.id === target.id)!
      if (alive.phase === 'dead') break
      const result = damageGloamwoodNestPrey(current, target.id, 6, 'Claw', behind(alive), 0)
      if (result.splits) splits += 1
      current = result.state
    }
    expect(splits).toBe(1)
  })

  it('leaves a burst where a volatile elite died, in world units', () => {
    const { state, target } = nestWithElite('volatile')
    let current = state
    let burst = null as ReturnType<typeof damageGloamwoodNestPrey>['burst']
    for (let hit = 0; hit < 20 && !burst; hit += 1) {
      const alive = current.prey.find((prey) => prey.id === target.id)!
      const result = damageGloamwoodNestPrey(current, target.id, 20, 'Claw', behind(alive), 0)
      burst = result.burst
      current = result.state
    }
    expect(burst).not.toBeNull()
    expect(burst!.radius).toBe(GLOAMWOOD_ELITE.burstRadius)
    // Where it stood, not at the origin - the 2D stack's burst was placed in
    // screen space and this one has to be in the world.
    expect(Math.hypot(burst!.x - target.x, burst!.z - target.z)).toBeLessThan(3)
  })

  it('leaves the results of an ordinary creature untouched', () => {
    const plain = stepGloamwoodNest(createGloamwoodNestState(), 0.05, {
      x: GLOAMWOOD_NEST.centerX, z: GLOAMWOOD_NEST.centerZ, alive: true,
    }).state
    const target = plain.prey.find((prey) => prey.kind === 'fang')!
    const result = damageGloamwoodNestPrey(plain, target.id, 20, 'Claw', behind(target), 0)
    expect(result.absorbedByShield).toBe(0)
    expect(result.splits).toBe(false)
    expect(result.burst).toBeNull()
  })
})

describe('An elite acting', () => {
  it('hits harder once a berserker is wound up', () => {
    const measure = (health: number, affix: GloamwoodEliteState['affix'] | null) => {
      const started = stepGloamwoodNest(createGloamwoodNestState(), 0.05, {
        x: GLOAMWOOD_NEST.centerX, z: GLOAMWOOD_NEST.centerZ, alive: true,
      }).state
      const target = started.prey.find((prey) => prey.kind === 'fang')!
      let state: GloamwoodNestState = {
        ...started,
        prey: started.prey.map((prey) => prey.id === target.id
          ? {
              ...prey,
              health,
              x: GLOAMWOOD_NEST.centerX + 1.2,
              z: GLOAMWOOD_NEST.centerZ,
              ...(affix ? { elite: { affix, shield: 0, broodTriggered: false } } : {}),
            }
          : { ...prey, phase: 'dead' as const }),
      }
      for (let tick = 0; tick < 200; tick += 1) {
        const step = stepGloamwoodNest(state, 0.05, {
          x: GLOAMWOOD_NEST.centerX, z: GLOAMWOOD_NEST.centerZ, alive: true,
        })
        state = step.state
        const attack = step.events.find((event) => event.type === 'prey-attack')
        if (attack && attack.type === 'prey-attack') return attack.damage
      }
      return 0
    }
    const ordinary = measure(10, null)
    const wound = measure(10, 'berserker')
    expect(ordinary).toBeGreaterThan(0)
    expect(wound).toBeGreaterThan(ordinary)
  })
})
