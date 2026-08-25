import { describe, expect, it } from 'vitest'

import {
  GLOAMWOOD_DEFENCE_BOSSES,
  GLOAMWOOD_DEFENCE_RUN,
  GLOAMWOOD_DEFENCE_WAVES,
  createGloamwoodDefenceBossPrey,
  createGloamwoodDefencePrey,
  createGloamwoodDefenceState,
  damageGloamwoodDefenceAltar,
  gloamwoodDefenceSpawnPoint,
  gloamwoodDefenceSpeedMultiplier,
  gloamwoodDefenceTarget,
  stepGloamwoodDefence,
  summariseGloamwoodDefenceRun,
  type GloamwoodDefenceState,
} from '../src/gloamwood-defence-director'
import { GLOAMWOOD_DEFENCE, gloamwoodDefenceWalkable } from '../src/gloamwood-defence-terrain'
import { GLOAMWOOD_PREY } from '../src/gloamwood-3d-ecology'

/**
 * The director decides three things a player can feel: what comes out, what it
 * walks at, and when the run ends. All three are asserted here rather than
 * played, because the failure modes are quiet - a wave that never clears, a
 * creature that walks at nothing, a run that cannot be lost.
 */

function runToPhase(target: GloamwoodDefenceState['phase'], aliveFor: (wave: number) => number) {
  let state = createGloamwoodDefenceState()
  const seen: string[] = []
  let alive = 0
  for (let frame = 0; frame < 40_000 && state.phase !== target; frame += 1) {
    const result = stepGloamwoodDefence(state, 1 / 60, { alive, total: alive })
    state = result.state
    alive += result.release.length
    for (const event of result.events) {
      seen.push(event.type)
      if (event.type === 'wave-started') alive = 0
      // The caller decides how long a wave survives.
      if (event.type === 'wave-cleared') alive = 0
    }
    if (state.phase === 'holding') alive = Math.max(0, aliveFor(state.wave))
  }
  return { state, seen }
}

describe('the run is twelve waves with four bosses', () => {
  it('runs twelve waves', () => {
    expect(GLOAMWOOD_DEFENCE_WAVES).toHaveLength(12)
    expect(GLOAMWOOD_DEFENCE_WAVES.map((wave) => wave.index)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
  })

  it('puts a boss on every third wave and no more than four in the run', () => {
    const bosses = GLOAMWOOD_DEFENCE_WAVES.filter((wave) => wave.boss)
    expect(bosses.map((wave) => wave.index)).toEqual([3, 6, 9, 12])
    expect(bosses).toHaveLength(4)
  })

  it('uses each authored boss body once', () => {
    // Four modelled boss bodies exist in the project and the owner asked for at
    // most four. Repeating one would waste the coincidence.
    const bosses = GLOAMWOOD_DEFENCE_WAVES.flatMap((wave) => wave.boss ? [wave.boss] : [])
    expect(new Set(bosses).size).toBe(4)
    expect(bosses[bosses.length - 1]).toBe('thornheart-warden')
  })

  it('gets bigger as it goes', () => {
    const summary = summariseGloamwoodDefenceRun()
    const early = summary.slice(0, 4).reduce((total, wave) => total + wave.count, 0)
    const late = summary.slice(-4).reduce((total, wave) => total + wave.count, 0)
    expect(late).toBeGreaterThan(early)
  })

  it('sends an escort in with every boss', () => {
    // A boss alone is a duel the player can win by ignoring the altar.
    for (const wave of GLOAMWOOD_DEFENCE_WAVES) {
      if (!wave.boss) continue
      expect(wave.kinds.length, `wave ${wave.index} boss arrives alone`).toBeGreaterThan(0)
    }
  })
})

describe('creatures come out of the portal and walk at the altar', () => {
  it('spawns on ground that can be walked, spread across the throat', () => {
    const lanes = new Set<number>()
    for (let sequence = 0; sequence < 12; sequence += 1) {
      const at = gloamwoodDefenceSpawnPoint(sequence)
      expect(gloamwoodDefenceWalkable(at.x, at.z), `sequence ${sequence} spawned in the wall`).toBe(true)
      lanes.add(Number(at.x.toFixed(3)))
    }
    // Not all on the spine, or a wave is single file before the flare even
    // has a chance to spread it.
    expect(lanes.size).toBeGreaterThan(2)
  })

  it('walks at the altar when the player is far away', () => {
    const prey = createGloamwoodDefencePrey('fang', 0)
    const player = { x: 0, z: 25, alive: true }
    const target = gloamwoodDefenceTarget(prey, player)
    expect(target.marching).toBe(true)
    expect(target.presence.x).toBe(GLOAMWOOD_DEFENCE.altar.x)
    expect(target.presence.z).toBe(GLOAMWOOD_DEFENCE.altar.z)
  })

  it('turns on the player who steps into its path', () => {
    const prey = createGloamwoodDefencePrey('fang', 0)
    const player = { x: prey.x + 3, z: prey.z + 2, alive: true }
    const target = gloamwoodDefenceTarget(prey, player)
    expect(target.marching).toBe(false)
    expect(target.presence).toBe(player)
  })

  it('ignores a dead player, so a corpse cannot hold the line', () => {
    const prey = createGloamwoodDefencePrey('fang', 0)
    const player = { x: prey.x, z: prey.z, alive: false }
    expect(gloamwoodDefenceTarget(prey, player).marching).toBe(true)
  })

  it('marches faster than it fights, and only while marching', () => {
    const far = createGloamwoodDefencePrey('shell', 0)
    expect(gloamwoodDefenceSpeedMultiplier(far, true)).toBe(GLOAMWOOD_DEFENCE_RUN.marchSpeedMultiplier)
    // Engaged with the player: never boosted, or the mode quietly rebalances
    // families the whole game was tuned around.
    expect(gloamwoodDefenceSpeedMultiplier(far, false)).toBe(1)
    // Arrived at the altar: attacking, not walking.
    const arrived = { x: GLOAMWOOD_DEFENCE.altar.x, z: GLOAMWOOD_DEFENCE.altar.z - 2 }
    expect(gloamwoodDefenceSpeedMultiplier(arrived, true)).toBe(1)
  })

  it('brings the slowest family down the road in a time worth waiting through', () => {
    // 48 units at 1.48 is 32 seconds of standing and watching. The boost is
    // sized against exactly this number.
    const road = GLOAMWOOD_DEFENCE.road.endZ - GLOAMWOOD_DEFENCE.portal.z
    const boosted = road / (GLOAMWOOD_PREY.shell.moveSpeed * GLOAMWOOD_DEFENCE_RUN.marchSpeedMultiplier)
    expect(boosted).toBeLessThan(20)
    const fang = road / (GLOAMWOOD_PREY.fang.moveSpeed * GLOAMWOOD_DEFENCE_RUN.marchSpeedMultiplier)
    expect(fang).toBeGreaterThan(4)
  })
})

describe('the altar is how the run is lost', () => {
  it('starts full and takes damage', () => {
    let state = createGloamwoodDefenceState()
    expect(state.altarHealth).toBe(GLOAMWOOD_DEFENCE_RUN.altarHealth)
    const hit = damageGloamwoodDefenceAltar(state, 40)
    state = hit.state
    expect(state.altarHealth).toBe(GLOAMWOOD_DEFENCE_RUN.altarHealth - 40)
    expect(hit.events[0]).toEqual({ type: 'altar-damaged', damage: 40, remaining: state.altarHealth })
  })

  it('ends the run when it is emptied, exactly once', () => {
    let state = createGloamwoodDefenceState()
    state = damageGloamwoodDefenceAltar(state, GLOAMWOOD_DEFENCE_RUN.altarHealth).state
    expect(state.phase).toBe('lost')
    expect(state.altarHealth).toBe(0)
    // A second blow in the same frame must not fire a second loss.
    const again = damageGloamwoodDefenceAltar(state, 40)
    expect(again.events).toEqual([])
    expect(again.state.altarHealth).toBe(0)
  })

  it('survives several breaches but not endless ones', () => {
    // The size was chosen against one breach costing roughly a player's health
    // bar. Asserted so a later tuning pass has to face the intent.
    const breach = 130
    expect(GLOAMWOOD_DEFENCE_RUN.altarHealth / breach).toBeGreaterThan(3)
    expect(GLOAMWOOD_DEFENCE_RUN.altarHealth / breach).toBeLessThan(6)
  })

  it('cannot be damaged after the run is already over', () => {
    let state = createGloamwoodDefenceState()
    state = { ...state, phase: 'won' }
    expect(damageGloamwoodDefenceAltar(state, 100).state.altarHealth).toBe(GLOAMWOOD_DEFENCE_RUN.altarHealth)
  })
})

describe('a whole run reaches its end', () => {
  it('wins when every wave is cleared', () => {
    const { state, seen } = runToPhase('won', () => 0)
    expect(state.phase).toBe('won')
    expect(state.wave).toBe(GLOAMWOOD_DEFENCE_RUN.waves)
    expect(seen.filter((type) => type === 'wave-started')).toHaveLength(12)
    expect(seen.filter((type) => type === 'wave-cleared')).toHaveLength(12)
    expect(seen[seen.length - 1]).toBe('run-won')
  })

  it('never releases more than the field allows at once', () => {
    let state = createGloamwoodDefenceState()
    let alive = 0
    let peak = 0
    for (let frame = 0; frame < 6000; frame += 1) {
      const result = stepGloamwoodDefence(state, 1 / 60, { alive, total: alive })
      state = result.state
      // Nothing ever dies in this run, so the cap is the only thing holding the
      // field down - which is exactly what is being tested.
      alive += result.release.length
      peak = Math.max(peak, alive)
    }
    expect(peak).toBeLessThanOrEqual(GLOAMWOOD_DEFENCE_RUN.maximumActive)
  })

  it('holds a wave open until the field is actually clear', () => {
    let state = createGloamwoodDefenceState()
    for (let frame = 0; frame < 1200; frame += 1) {
      state = stepGloamwoodDefence(state, 1 / 60, { alive: 3, total: 3 }).state
    }
    // Something is always alive, so the run can never leave wave one.
    expect(state.wave).toBe(1)
    expect(state.phase).not.toBe('won')
  })
})

describe('a blow does less to the player here than it does elsewhere', () => {
  it('scales the player\'s incoming damage without touching the shared table', () => {
    // Standing still through wave one killed a full-health player, which is
    // what the scale exists for. It must not reach `GLOAMWOOD_PREY`: the river
    // valley fights on that table and its balance is accepted.
    expect(GLOAMWOOD_DEFENCE_RUN.playerDamageScale).toBeLessThan(1)
    expect(GLOAMWOOD_DEFENCE_RUN.playerDamageScale).toBeGreaterThan(0.4)
    expect(GLOAMWOOD_PREY.fang.damage).toBe(12)
  })

  it('leaves the player enough hits to be worth defending with', () => {
    const scaled = GLOAMWOOD_PREY.fang.damage * GLOAMWOOD_DEFENCE_RUN.playerDamageScale
    const playerHealth = 130
    // A stage-0 player should survive well over a dozen Fang blows, so holding
    // a line is a decision rather than a countdown.
    expect(playerHealth / scaled).toBeGreaterThan(15)
  })

  it('leaves the altar on the raw numbers it was sized against', () => {
    // Sized at four to five breaches of roughly a player's health bar.
    const breach = 130
    expect(GLOAMWOOD_DEFENCE_RUN.altarHealth / breach).toBeGreaterThan(3)
  })
})

describe('bosses actually come through the portal', () => {
  it('releases the boss before its escort, on every boss wave', () => {
    let state = createGloamwoodDefenceState()
    let alive = 0
    const bosses: string[] = []
    const orderWithinWave: string[] = []
    for (let frame = 0; frame < 60_000 && state.phase !== 'won'; frame += 1) {
      const result = stepGloamwoodDefence(state, 1 / 60, { alive, total: alive })
      state = result.state
      if (result.releaseBoss) {
        bosses.push(result.releaseBoss)
        orderWithinWave.push(`boss-${state.wave}`)
      }
      if (result.release.length > 0) orderWithinWave.push(`escort-${state.wave}`)
      alive += result.release.length + (result.releaseBoss ? 1 : 0)
      for (const event of result.events) if (event.type === 'wave-started') alive = 0
      if (state.phase === 'holding') alive = 0
    }
    expect(bosses).toEqual(['bladeshell', 'cliff-maw', 'source-root', 'thornheart-warden'])
    // On each boss wave the boss must be the first thing out, or it arrives
    // buried in its own escort.
    for (const wave of [3, 6, 9, 12]) {
      const first = orderWithinWave.find((entry) => entry.endsWith(`-${wave}`))
      expect(first, `wave ${wave}`).toBe(`boss-${wave}`)
    }
  })

  it('releases each boss exactly once', () => {
    let state = createGloamwoodDefenceState()
    let alive = 0
    const counts = new Map<string, number>()
    for (let frame = 0; frame < 60_000 && state.phase !== 'won'; frame += 1) {
      const result = stepGloamwoodDefence(state, 1 / 60, { alive, total: alive })
      state = result.state
      if (result.releaseBoss) counts.set(result.releaseBoss, (counts.get(result.releaseBoss) ?? 0) + 1)
      alive += result.release.length + (result.releaseBoss ? 1 : 0)
      for (const event of result.events) if (event.type === 'wave-started') alive = 0
      if (state.phase === 'holding') alive = 0
    }
    expect([...counts.values()]).toEqual([1, 1, 1, 1])
  })

  it('builds a boss with a body, a tier and health that escalates', () => {
    const health = (['bladeshell', 'cliff-maw', 'source-root', 'thornheart-warden'] as const)
      .map((boss) => GLOAMWOOD_DEFENCE_BOSSES[boss].health)
    expect(health).toEqual([...health].sort((a, b) => a - b))
    const prey = createGloamwoodDefenceBossPrey('thornheart-warden', 0)
    // The tier is what stops the shell family's frontal mitigation applying.
    expect(prey.tier).toBe('boss')
    expect(prey.maxHealth).toBe(GLOAMWOOD_DEFENCE_BOSSES['thornheart-warden'].health)
    expect(prey.bodyRadius).toBe(GLOAMWOOD_DEFENCE_BOSSES['thornheart-warden'].footprintRadius)
    // Its id has to survive the round trip that `bodyFor` reads it back through.
    expect(prey.id).toBe('defence-boss-thornheart-warden')
    expect(prey.id.replace('defence-boss-', '')).toBe('thornheart-warden')
  })

  it('outclasses an ordinary creature by a wide margin', () => {
    const ordinary = createGloamwoodDefencePrey('shell', 0)
    for (const boss of Object.values(GLOAMWOOD_DEFENCE_BOSSES)) {
      expect(boss.health).toBeGreaterThan(ordinary.maxHealth * 3)
    }
  })
})
