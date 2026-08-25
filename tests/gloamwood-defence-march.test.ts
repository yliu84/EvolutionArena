import { describe, expect, it } from 'vitest'

import { createGloamwoodDefenceMap } from '../src/gloamwood-defence-map'
import { GLOAMWOOD_DEFENCE } from '../src/gloamwood-defence-terrain'
import type { GloamwoodNestState } from '../src/gloamwood-3d-ecology'

/**
 * Does a creature actually come out of the portal and walk the road?
 *
 * The owner reported that they did not, and every attempt to check it in a
 * browser was spoiled by something outside the mode: the pane throttles the
 * game to 1-3 FPS, the delta clamp turns that into slow motion, and a death
 * dialog pauses the simulation entirely - so a still frame showing creatures
 * near the altar proves nothing about where they started.
 *
 * Driving the real map contract with a fixed delta answers it in milliseconds
 * and cannot be paused, throttled or misread.
 */

function march(playerAt: { x: number; z: number }, seconds: number) {
  const map = createGloamwoodDefenceMap(async () => {})
  let state: GloamwoodNestState = map.createCreatures()
  const player = { ...playerAt, alive: true, bodyRadius: 1.2 }
  const samples: Array<{ t: number; id: string; x: number; z: number }> = []
  const frames = Math.round(seconds * 60)
  for (let frame = 0; frame < frames; frame += 1) {
    state = map.stepCreatures(state, 1 / 60, player, []).state
    // Found rather than named: ids carry the spawning wave now, and a test
    // that hardcodes one breaks for a reason that has nothing to do with the
    // rule it guards.
    const first = state.prey.find((prey) => prey.tier !== 'boss')
    if (first) samples.push({ t: frame / 60, id: first.id, x: first.x, z: first.z })
  }
  return { state, samples }
}

describe('a wave walks the road', () => {
  // Behind the altar and off to one side: far enough that nothing turns on the
  // player, so what is measured is the march and nothing else.
  const CLEAR_OF_THE_LANE = { x: 16, z: 30 }

  it('puts the first creature at the portal, not in the bowl', () => {
    const { samples } = march(CLEAR_OF_THE_LANE, 0.2)
    expect(samples.length).toBeGreaterThan(0)
    const first = samples[0]
    // Within one frame's walk of the portal. The sample is taken after a step,
    // so it has already moved - the point is that it started there rather than
    // in the bowl, sixty-eight units away.
    expect(first.z, 'spawned away from the portal')
      .toBeGreaterThan(GLOAMWOOD_DEFENCE.portal.z - 0.5)
    expect(first.z).toBeLessThan(GLOAMWOOD_DEFENCE.portal.z + 0.5)
    expect(Math.abs(first.x)).toBeLessThanOrEqual(GLOAMWOOD_DEFENCE.road.halfWidth)
  })

  it('walks it steadily toward the altar rather than jumping', () => {
    const { samples } = march(CLEAR_OF_THE_LANE, 12)
    let biggestStep = 0
    for (let index = 1; index < samples.length; index += 1) {
      biggestStep = Math.max(
        biggestStep,
        Math.hypot(samples[index].x - samples[index - 1].x, samples[index].z - samples[index - 1].z),
      )
    }
    // A frame is 1/60s and the fastest march is 3.65 x 1.9, so a single step
    // can never legitimately exceed about 0.12 units. Anything larger is a
    // teleport, which is what a creature appearing in the bowl would be.
    expect(biggestStep).toBeLessThan(0.25)
  })

  it('spends real time on the road before it reaches the bowl', () => {
    const { samples } = march(CLEAR_OF_THE_LANE, 30)
    const enteredBowl = samples.find((sample) => sample.z > GLOAMWOOD_DEFENCE.road.endZ)
    expect(enteredBowl, 'never reached the bowl at all').toBeDefined()
    // The road is 48 units at a marched 6.9 units a second.
    expect(enteredBowl!.t).toBeGreaterThan(4)
    // ...and it must not still be trudging a minute later.
    expect(enteredBowl!.t).toBeLessThan(20)
  })

  it('stays on walkable ground the whole way down', () => {
    const { samples } = march(CLEAR_OF_THE_LANE, 20)
    for (const sample of samples) {
      const onRoad = sample.z <= GLOAMWOOD_DEFENCE.road.endZ
        && Math.abs(sample.x) <= GLOAMWOOD_DEFENCE.road.mouthHalfWidth
      const inBowl = Math.hypot(
        sample.x - GLOAMWOOD_DEFENCE.arena.x,
        sample.z - GLOAMWOOD_DEFENCE.arena.z,
      ) <= GLOAMWOOD_DEFENCE.arena.radius + 0.5
      expect(onRoad || inBowl, `off the floor at t=${sample.t.toFixed(2)} (${sample.x.toFixed(1)}, ${sample.z.toFixed(1)})`).toBe(true)
    }
  })

  it('arrives at the altar and starts taking it apart', () => {
    const map = createGloamwoodDefenceMap(async () => {})
    let state: GloamwoodNestState = map.createCreatures()
    const player = { ...CLEAR_OF_THE_LANE, alive: true, bodyRadius: 1.2 }
    let struck = false
    for (let frame = 0; frame < 60 * 60 && !struck; frame += 1) {
      const result = map.stepCreatures(state, 1 / 60, player, [])
      state = result.state
      struck = result.events.some((event) => event.type === 'defence-altar-damaged')
    }
    expect(struck, 'nothing ever reached the altar').toBe(true)
    expect(map.defenceRun().altarHealth).toBeLessThan(map.defenceRun().altarMaxHealth)
  })
})
