import { describe, expect, it } from 'vitest'

import {
  GLOAMWOOD_BOSS_FX,
  gloamwoodBossFxFillMode,
  gloamwoodBossFxFrame,
  gloamwoodBossFxReach,
  gloamwoodBossShapeReach,
} from '../src/gloamwood-boss-fx'
import {
  GLOAMWOOD_VALLEY_BOSS_SPECS,
  gloamwoodValleyBossHits,
  type GloamwoodValleyBossSpec,
} from '../src/gloamwood-valley-boss'

const SPEC = GLOAMWOOD_VALLEY_BOSS_SPECS[2]

function winding(spec: GloamwoodValleyBossSpec, patternId: string, elapsed: number, phase: 'telegraph' | 'strike' = 'telegraph') {
  return {
    phase, phaseElapsed: elapsed, x: 0, z: 0,
    bossPattern: patternId, bossPhase: 1 as const, aimX: 6, aimZ: 0,
  }
}

describe('The telegraph is the attack', () => {
  it('draws the pattern shape itself, not a copy of it', () => {
    // The rule this module exists to hold. A telegraph drawn slightly larger
    // than the blow teaches the player a lie; drawn smaller, the boss feels
    // like it cheats. Both are the same defect, and both are impossible while
    // there is only one shape object.
    for (const spec of GLOAMWOOD_VALLEY_BOSS_SPECS) {
      for (const pattern of Object.values(spec.patterns)) {
        const frame = gloamwoodBossFxFrame(winding(spec, pattern.id, 0.1), spec)
        expect(frame?.shape).toBe(pattern.shape)
      }
    }
  })

  it('marks ground that is hit, and leaves ground that is not', () => {
    for (const spec of GLOAMWOOD_VALLEY_BOSS_SPECS) {
      for (const pattern of Object.values(spec.patterns)) {
        const frame = gloamwoodBossFxFrame(winding(spec, pattern.id, 0.1), spec)!
        const shape = frame.shape
        const origin = { x: 0, z: 0 }
        const aim = { x: 6, z: 0 }
        const inside = shape.kind === 'disc' ? { x: shape.radius - 0.2, z: 0 }
          : shape.kind === 'ring' ? { x: (shape.innerRadius + shape.outerRadius) / 2, z: 0 }
          : { x: shape.length - 0.2, z: 0 }
        const outside = shape.kind === 'disc' ? { x: shape.radius + 0.2, z: 0 }
          : shape.kind === 'ring' ? { x: shape.innerRadius - 0.2, z: 0 }
          : { x: shape.length - 0.2, z: shape.halfWidth + 0.2 }
        expect(gloamwoodValleyBossHits(shape, origin, aim, inside), `${pattern.id} inside`).toBe(true)
        expect(gloamwoodValleyBossHits(shape, origin, aim, outside), `${pattern.id} outside`).toBe(false)
      }
    }
  })

  it('fills exactly as the blow lands', () => {
    const pattern = SPEC.patterns['root-slam']
    expect(gloamwoodBossFxFrame(winding(SPEC, 'root-slam', 0), SPEC)?.windup).toBe(0)
    expect(gloamwoodBossFxFrame(winding(SPEC, 'root-slam', pattern.telegraphSeconds), SPEC)?.windup).toBe(1)
    // And the first frame of the blow is still full, never back to zero.
    expect(gloamwoodBossFxFrame(winding(SPEC, 'root-slam', 0, 'strike'), SPEC)?.windup).toBe(1)
  })

  it('grows a disc and a lane, and only brightens a ring', () => {
    // An annulus cannot grow from its centre without covering the safe circle
    // it exists to teach. The middle has to stay visibly empty for the whole
    // wind-up or the pattern says the opposite of what it does.
    for (const spec of GLOAMWOOD_VALLEY_BOSS_SPECS) {
      for (const pattern of Object.values(spec.patterns)) {
        const expected = pattern.shape.kind === 'ring' ? 'brighten' : 'grow'
        expect(gloamwoodBossFxFillMode(pattern.shape)).toBe(expected)
      }
    }
  })

  it('quickens as the wind-up runs, so a glance answers "how long"', () => {
    const pattern = SPEC.patterns['ring-burst']
    const early = gloamwoodBossFxFrame(winding(SPEC, 'ring-burst', 0.05), SPEC)!
    const late = gloamwoodBossFxFrame(winding(SPEC, 'ring-burst', pattern.telegraphSeconds * 0.95), SPEC)!
    expect(late.fillOpacity).toBeGreaterThan(early.fillOpacity)
    expect(late.rimOpacity).toBeGreaterThan(early.rimOpacity)
    expect(GLOAMWOOD_BOSS_FX.pulseHzEnd).toBeGreaterThan(GLOAMWOOD_BOSS_FX.pulseHzStart)
  })

  it('keeps the outline up for the whole wind-up', () => {
    // The rim is the promise. It never dips to nothing between pulses, because
    // it is the one thing that has to stay readable at the edge of vision.
    const pattern = SPEC.patterns['root-slam']
    for (let elapsed = 0; elapsed <= pattern.telegraphSeconds; elapsed += 0.01) {
      const frame = gloamwoodBossFxFrame(winding(SPEC, 'root-slam', elapsed), SPEC)!
      expect(frame.rimOpacity).toBeGreaterThan(0.4)
    }
  })
})

describe('The blow', () => {
  it('washes the area bright and then fades', () => {
    const pattern = SPEC.patterns['root-slam']
    const first = gloamwoodBossFxFrame(winding(SPEC, 'root-slam', 0, 'strike'), SPEC)!
    const later = gloamwoodBossFxFrame(winding(SPEC, 'root-slam', pattern.attackSeconds, 'strike'), SPEC)!
    expect(first.impact).toBe(0)
    expect(first.fillOpacity).toBeGreaterThan(later.fillOpacity)
    expect(first.flashColor).toBe(GLOAMWOOD_BOSS_FX.flashColor)
  })

  it('outlives the blow it is drawing', () => {
    // A 0.26s strike is four frames on a slow machine, and four frames of
    // flash reads as nothing having happened.
    const pattern = SPEC.patterns['root-slam']
    const atEnd = gloamwoodBossFxFrame(winding(SPEC, 'root-slam', pattern.attackSeconds, 'strike'), SPEC)!
    expect(atEnd.fillOpacity).toBeGreaterThan(0)
    expect(GLOAMWOOD_BOSS_FX.impactTailScale).toBeGreaterThan(1)
  })

  it('shakes the camera once, on the frame the blow lands', () => {
    const arriving = gloamwoodBossFxFrame(winding(SPEC, 'root-slam', 0, 'strike'), SPEC, 'telegraph')!
    const continuing = gloamwoodBossFxFrame(winding(SPEC, 'root-slam', 0.05, 'strike'), SPEC, 'strike')!
    expect(arriving.trauma).toBe(SPEC.patterns['root-slam'].trauma)
    expect(continuing.trauma).toBe(0)
  })

  it('never asks for a shake while it is only winding up', () => {
    for (const spec of GLOAMWOOD_VALLEY_BOSS_SPECS) {
      for (const pattern of Object.values(spec.patterns)) {
        expect(gloamwoodBossFxFrame(winding(spec, pattern.id, 0.4), spec, 'chase')?.trauma).toBe(0)
      }
    }
  })
})

describe('What is not drawn', () => {
  it('marks nothing while a boss is chasing, recovering or dead', () => {
    // A telegraph that lingers through recovery marks ground that is safe, and
    // the player learns to ignore the marks.
    for (const phase of ['chase', 'recover', 'stunned', 'dead'] as const) {
      const frame = gloamwoodBossFxFrame(
        { phase, phaseElapsed: 0.3, x: 0, z: 0, bossPattern: 'root-slam', bossPhase: 1 },
        SPEC,
      )
      expect(frame, phase).toBeNull()
    }
  })

  it('marks nothing for a pattern the boss does not have', () => {
    expect(gloamwoodBossFxFrame(winding(SPEC, 'not-a-pattern', 0.3), SPEC)).toBeNull()
  })
})

describe('Phase two', () => {
  it('changes the colour and not one number of the geometry', () => {
    // The tell is that the shapes are the same and everything else is hotter.
    // A phase change that also moved the areas would make the player relearn
    // the fight at the worst possible moment.
    const calm = gloamwoodBossFxFrame(winding(SPEC, 'root-slam', 0.4), SPEC)!
    const enraged = gloamwoodBossFxFrame(
      { ...winding(SPEC, 'root-slam', 0.4), bossPhase: 2 as const },
      SPEC,
    )!
    expect(enraged.shape).toBe(calm.shape)
    expect(enraged.windup).toBe(calm.windup)
    expect(enraged.color).not.toBe(calm.color)
    expect(enraged.color).toBe(GLOAMWOOD_BOSS_FX.enragedColor)
  })
})

describe('Reach', () => {
  it('never grows an effect past the largest area the fight uses', () => {
    for (const spec of GLOAMWOOD_VALLEY_BOSS_SPECS) {
      const reach = gloamwoodBossFxReach(spec)
      for (const pattern of Object.values(spec.patterns)) {
        expect(gloamwoodBossShapeReach(pattern.shape)).toBeLessThanOrEqual(reach)
      }
      expect(reach).toBeGreaterThanOrEqual(spec.bodyRadius)
    }
  })
})

describe('The lane points where the boss aimed', () => {
  it('draws along the committed aim, not at where the player is now', () => {
    const frame = gloamwoodBossFxFrame(
      { ...winding(SPEC, 'root-lunge', 0.2), aimX: 0, aimZ: -6 },
      SPEC,
    )!
    // Facing is atan2(-dz, dx), so straight along -Z is a quarter turn.
    expect(frame.aimRadians).toBeCloseTo(Math.PI / 2, 5)
  })
})
