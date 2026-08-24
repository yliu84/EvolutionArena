import { describe, expect, it } from 'vitest'

import {
  LANTERN_LYNX_PRESENTATION,
  LANTERN_LYNX_CHAIN_DAMAGE,
  LANTERN_LYNX_CHAIN_SECONDS,
  SCARLET_HUNTER_REFERENCE_RATE,
} from '../src/lantern-lynx-character-presentation'
import { SPORE_STALKER_PRESENTATION } from '../src/spore-stalker-character-presentation'
import { STONE_PANGOLIN_PRESENTATION } from '../src/stone-pangolin-character-presentation'
import { BASALT_BULWARK_PRESENTATION } from '../src/basalt-bulwark-character-presentation'
import { SCARLET_HUNTER_PRESENTATION } from '../src/scarlet-hunter-character-presentation'
import { getQuality3DGLBAsset, quality3DBodyStageForFamily } from '../src/quality-3d-glb-assets'
import { getGloamwoodPlayerCollisionProfile } from '../src/gloamwood-3d-collision'
import { gloamwoodCharacterWorldHeight, gloamwoodFormCombatProfile } from '../src/gloamwood-3d-hunt'

const SWARM_2 = LANTERN_LYNX_PRESENTATION
const SWARM_1 = SPORE_STALKER_PRESENTATION
const FANG_2 = SCARLET_HUNTER_PRESENTATION
const SHELL_2 = BASALT_BULWARK_PRESENTATION

describe('Swarm stage-2 form', () => {
  it('closes the last family gap: all three routes now have a second evolution', () => {
    expect(quality3DBodyStageForFamily(2, 'swarm')).toBe(2)
    expect(getQuality3DGLBAsset(2, 'swarm')?.formId).toBe('lantern-lynx')
    // Takes the stage default at both stages; unlike the Shell line it needs no
    // world-height override, because it is already tall for its mass.
    expect(gloamwoodCharacterWorldHeight(2, 'swarm')).toBe(2.55)
    expect(gloamwoodCharacterWorldHeight(1, 'swarm')).toBe(2.16)
  })

  it('stays the lightest of the three stage-2 bodies without being forced thin', () => {
    // The torso gate this test used to enforce - "narrowest body in the game",
    // torso w/h <= 0.52 - was WITHDRAWN. Holding it is part of what produced a
    // form the owner refused to play: it pushed the design thin and skeletal.
    // Narrowness is a few percent nobody perceives, while colour and the glowing
    // shoulder ruff separate this family at any distance. See the contract's §0
    // and the second correction in §3.
    //
    // What still binds is the relationship between the three stage-2 forms.
    expect(SWARM_2.silhouette.widthToHeight).toBeLessThan(FANG_2.silhouette.widthRatio)
    expect(SWARM_2.silhouette.widthToHeight).toBeLessThan(SHELL_2.silhouette.widthToHeight)
    // And it is allowed to be chunkier than its own stage 1, which is the point.
    expect(SWARM_2.silhouette.torsoWidthToHeight).toBeGreaterThan(SWARM_1.silhouette.torsoWidthToHeight)
    // Length still holds: it must not become proportionally longer.
    expect(SWARM_2.silhouette.lengthToHeight).toBeLessThanOrEqual(2.1)
    expect(SWARM_2.silhouette.lengthToHeight).toBeLessThan(SWARM_1.silhouette.lengthToHeight)
  })

  it('hits as hard as the other two stage-2 forms, in four fast steps', () => {
    const rate = LANTERN_LYNX_CHAIN_DAMAGE / LANTERN_LYNX_CHAIN_SECONDS
    expect(Math.abs(rate - SCARLET_HUNTER_REFERENCE_RATE)).toBeLessThan(0.5)

    // This route buys speed, biomass and kill-healing and pays in health and
    // damage, so it must not out-damage the others - it gets there faster.
    expect(LANTERN_LYNX_CHAIN_SECONDS).toBeLessThan(
      SHELL_2.combat.biteDurationSeconds
      + SHELL_2.combat.pounceDurationSeconds
      + SHELL_2.combat.tailSwipeDurationSeconds,
    )
    expect(LANTERN_LYNX_CHAIN_DAMAGE).toBeLessThan(
      SHELL_2.combat.hitFeedback.biteDamage
      + SHELL_2.combat.hitFeedback.pounceDamage
      + SHELL_2.combat.hitFeedback.tailSwipeDamage,
    )
  })

  it('keeps four steps with the payoff at the end and the shortest reach on it', () => {
    expect(SWARM_2.combat.primaryCombo).toEqual(['Pounce', 'Claw', 'Claw', 'Bite'])
    expect(SWARM_2.combat.primaryCombo).toEqual(SWARM_1.combat.primaryCombo)
    // Longer chain than either three-step form.
    expect(SWARM_2.combat.primaryCombo.length).toBeGreaterThan(FANG_2.combat.primaryCombo.length)
    expect(SWARM_2.combat.primaryCombo.length).toBeGreaterThan(STONE_PANGOLIN_PRESENTATION.combat.primaryCombo.length)

    const feedback = SWARM_2.combat.hitFeedback
    // The payoff is the finisher, and it is over 40% of the chain.
    expect(feedback.biteDamage / LANTERN_LYNX_CHAIN_DAMAGE).toBeGreaterThan(0.4)
    expect(feedback.biteDamage).toBeGreaterThan(feedback.pounceDamage)
    // And the finisher has the shortest reach, so the step that pays most is
    // only available at closest quarters.
    expect(feedback.biteRange).toBeLessThan(feedback.clawRange)
    expect(feedback.clawRange).toBeLessThan(feedback.pounceRange)
    // It never throws TailSwipe, exactly as at stage 1.
    expect(SWARM_2.combat.primaryCombo).not.toContain('TailSwipe')
    expect(SWARM_2.combat.skillsEnabled).toBe(false)
  })

  it('plays its whole attack animation, which the stage-1 form does not', () => {
    // setAction cuts a one-shot clip when its action window ends. Every window
    // here equals its clip's authored length at playback rate 1.
    const rates = SWARM_2.combat.attackPlaybackRate as Readonly<Record<string, number>>
    for (const step of ['Pounce', 'Claw', 'Bite']) {
      expect(rates[step], `${step} playback rate`).toBe(1)
    }
    // The whole chain is faster than stage 1's, and the rake and the finisher
    // are faster individually. Pounce is the exception and is 0.03s *longer*,
    // because stage 1's 0.68s window only ever played about half of a 1.42s
    // clip - this one completes. Faster overall, and honest about it.
    const stageOneChain = SWARM_1.combat.pounceDurationSeconds
      + SWARM_1.combat.clawDurationSeconds * 2
      + SWARM_1.combat.biteDurationSeconds
    expect(LANTERN_LYNX_CHAIN_SECONDS).toBeLessThan(stageOneChain)
    expect(SWARM_2.combat.clawDurationSeconds).toBeLessThan(SWARM_1.combat.clawDurationSeconds)
    expect(SWARM_2.combat.biteDurationSeconds).toBeLessThan(SWARM_1.combat.biteDurationSeconds)
    // Contact always lands inside the window.
    expect(SWARM_2.combat.pounceContactSeconds).toBeLessThan(SWARM_2.combat.pounceDurationSeconds)
    expect(SWARM_2.combat.clawContactSeconds).toBeLessThan(SWARM_2.combat.clawDurationSeconds)
    expect(SWARM_2.combat.biteContactSeconds).toBeLessThan(SWARM_2.combat.biteDurationSeconds)
  })

  it('runs its own combat authority and keeps the fastest cadence', () => {
    const resolved = gloamwoodFormCombatProfile('lantern-lynx', 2)
    expect(resolved.matchedForm).toBe(true)
    expect(resolved.profile).toBe(SWARM_2.combat)
    expect(resolved.profile).not.toBe(FANG_2.combat)
    // Fastest in the game, and faster again than its own stage 1.
    expect(SWARM_2.animation.runPlaybackRate).toBeGreaterThan(SWARM_1.animation.runPlaybackRate)
    expect(SWARM_2.animation.footstepEventsPerSecond).toBeGreaterThan(SHELL_2.animation.footstepEventsPerSecond)
  })

  it('keeps the glow a minority of the surface so the hide still reads', () => {
    // Emissive is a baked mask, never a global lift: the contract's budget is
    // 15% and the whole distance read is a line of light on a dark body.
    expect(SWARM_2.material.emissiveMaskCoverage).toBeLessThanOrEqual(0.15)
    expect(SWARM_2.material.emissiveMaskCoverage).toBeGreaterThan(0)
    // Same grade as its stage-1 form; the Shell stage-2 grade would be wrong here.
    expect(SWARM_2.material).toMatchObject({
      minimumRoughness: SWARM_1.material.minimumRoughness,
      maximumRoughness: SWARM_1.material.maximumRoughness,
      emissiveIntensity: SWARM_1.material.emissiveIntensity,
    })
    expect(SHELL_2.material.emissiveIntensity).toBe(0)
  })

  it('carries the smallest footprint of the three stage-2 forms', () => {
    const profile = getGloamwoodPlayerCollisionProfile(2, 'swarm')
    const halfWidth = (SWARM_2.silhouette.widthToHeight * SWARM_2.worldHeight) / 2
    const stageOne = getGloamwoodPlayerCollisionProfile(1, 'swarm')
    const stageOneHalfWidth = (SWARM_1.silhouette.widthToHeight * SWARM_1.worldHeight) / 2

    // Radius follows measured half-width at the same fraction the accepted
    // stage-1 profile uses, rather than any stage default.
    const fraction = profile.radius / halfWidth
    expect(Math.abs(fraction - stageOne.radius / stageOneHalfWidth)).toBeLessThan(0.05)
    // Bigger than its own stage 1, and still the smallest of the stage-2 forms:
    // this route is the nimble one.
    expect(profile.radius).toBeGreaterThan(stageOne.radius)
    expect(profile.radius).toBeLessThan(getGloamwoodPlayerCollisionProfile(2, 'shell').radius)
    expect(profile.radius).toBeLessThan(getGloamwoodPlayerCollisionProfile(2).radius)
  })

  it('holds the runtime budget and the shared rig template', () => {
    expect(SWARM_2.asset.triangles).toBeGreaterThan(17_000)
    expect(SWARM_2.asset.triangles).toBeLessThanOrEqual(24_000)
    expect(SWARM_2.asset.bones).toBe(SWARM_1.asset.bones)
    expect(SWARM_2.silhouette.attachmentCount).toBe(0)
    expect(SWARM_2.asset.clips).toEqual(SWARM_1.asset.clips)
  })
})
