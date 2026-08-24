import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import {
  BASALT_BULWARK_PRESENTATION,
  BASALT_BULWARK_CHAIN_DAMAGE,
  BASALT_BULWARK_CHAIN_SECONDS,
  SCARLET_HUNTER_CHAIN_DAMAGE,
  SCARLET_HUNTER_CHAIN_SECONDS,
} from '../src/basalt-bulwark-character-presentation'
import { STONE_PANGOLIN_PRESENTATION } from '../src/stone-pangolin-character-presentation'
import { SCARLET_HUNTER_PRESENTATION } from '../src/scarlet-hunter-character-presentation'
import { getQuality3DGLBAsset, quality3DBodyStageForFamily } from '../src/quality-3d-glb-assets'
import { getGloamwoodPlayerCollisionProfile } from '../src/gloamwood-3d-collision'
import { gloamwoodCharacterWorldHeight, gloamwoodFormCombatProfile } from '../src/gloamwood-3d-hunt'

const SHELL_2 = BASALT_BULWARK_PRESENTATION
const SHELL_1 = STONE_PANGOLIN_PRESENTATION
const FANG_2 = SCARLET_HUNTER_PRESENTATION

describe('Shell stage-2 form', () => {
  it('closes the gap that made a Shell second evolution invisible', () => {
    // The whole reason this form exists. quality3DBodyStageForFamily returned 1
    // for a stage-2 Shell, and because loadCharacter receives that *body* stage
    // rather than the requested one, the body, world height and combat chain all
    // stayed at stage 1. Verified in a live browser before the fix: taking the
    // Shell candidate twice produced an identical model both times.
    expect(quality3DBodyStageForFamily(2, 'shell')).toBe(2)
    expect(getQuality3DGLBAsset(2, 'shell')?.formId).toBe('basalt-bulwark')
    // The world-height table's third entry stops being unreachable dead data.
    expect(gloamwoodCharacterWorldHeight(2, 'shell')).toBe(2.55)
    expect(gloamwoodCharacterWorldHeight(1, 'shell')).toBe(1.8)
  })

  it('holds the two proportion gates the contract makes hard rejections', () => {
    // Measured from the runtime GLB, not estimated. The runtime scales by height
    // alone, so an elongated source becomes footprint the moment it is
    // normalised - which is why these are source gates rather than targets.
    expect(SHELL_2.silhouette.lengthToHeight).toBeLessThanOrEqual(2.2)
    expect(SHELL_2.silhouette.widthToHeight).toBeGreaterThanOrEqual(0.95)
    // Stage 1 fails both, which is the reason a new mesh was required rather
    // than a scaled-up one.
    expect(SHELL_1.silhouette.lengthToHeight).toBeGreaterThan(2.2)
    expect(SHELL_1.silhouette.widthToHeight).toBeLessThan(0.95)
  })

  it('grows upward and outward rather than longer', () => {
    const width = (form: { silhouette: { widthToHeight: number }; worldHeight: number }) =>
      form.silhouette.widthToHeight * form.worldHeight
    const length = (form: { silhouette: { lengthToHeight: number }; worldHeight: number }) =>
      form.silhouette.lengthToHeight * form.worldHeight

    // +70% width and +42% height against only +10% length.
    expect(width(SHELL_2) / width(SHELL_1)).toBeGreaterThan(1.6)
    expect(SHELL_2.worldHeight / SHELL_1.worldHeight).toBeGreaterThan(1.4)
    expect(length(SHELL_2) / length(SHELL_1)).toBeLessThan(1.2)

    // The widest body in the game, and shorter than the 6.48 a naively scaled
    // stage-1 body would have produced at the same height.
    const fangTwoWidth = FANG_2.silhouette.widthRatio
    expect(width(SHELL_2)).toBeGreaterThan(2.6)
    expect(width(SHELL_2)).toBeGreaterThan(fangTwoWidth)
    expect(length(SHELL_2)).toBeLessThan(6.48)
  })

  it('hits as hard as the other stage-2 form but in fewer, slower blows', () => {
    // The Shell line's compensation is mitigation, not damage, so the two
    // stage-2 forms are deliberately matched on damage per committed second.
    const shellRate = BASALT_BULWARK_CHAIN_DAMAGE / BASALT_BULWARK_CHAIN_SECONDS
    const fangRate = SCARLET_HUNTER_CHAIN_DAMAGE / SCARLET_HUNTER_CHAIN_SECONDS
    expect(Math.abs(shellRate - fangRate)).toBeLessThan(0.5)

    // Delivered differently: bigger single hits over a longer commitment.
    expect(BASALT_BULWARK_CHAIN_SECONDS).toBeGreaterThan(SCARLET_HUNTER_CHAIN_SECONDS)
    expect(BASALT_BULWARK_CHAIN_DAMAGE).toBeGreaterThan(SCARLET_HUNTER_CHAIN_DAMAGE)
    // And the window to continue the chain has to cover the longer steps, or the
    // chain drops itself mid-swing.
    expect(SHELL_2.combat.comboResetSeconds).toBeGreaterThan(FANG_2.combat.comboResetSeconds)
  })

  it('moves the payoff to the club at the end of the chain', () => {
    const feedback = SHELL_2.combat.hitFeedback
    // Stage 1 put the heaviest hit in the middle, on Slam, and ended on its
    // lightest step. The stone club at the tail tip makes the finisher the
    // payoff instead, and the heaviest single blow in the game.
    expect(feedback.tailSwipeDamage).toBeGreaterThan(feedback.pounceDamage)
    expect(feedback.pounceDamage).toBeGreaterThan(feedback.biteDamage)
    const stageOne = SHELL_1.combat.hitFeedback
    expect(stageOne.pounceDamage).toBeGreaterThan(stageOne.tailSwipeDamage)
    expect(feedback.tailSwipeDamage).toBeGreaterThan(FANG_2.combat.hitFeedback.pounceDamage)
    // The club also reaches furthest of anything in the chain.
    expect(feedback.tailSwipeRange).toBeGreaterThan(feedback.pounceRange)
    expect(feedback.pounceRange).toBeGreaterThan(feedback.biteRange)
  })

  it('keeps the leap its body still cannot sell, and every step has a clip', () => {
    // A heavier, taller version of a body that could not sell a leap still
    // cannot sell one. `Pounce` here is the authority's name for the step; the
    // runtime redirects the clip to `Slam` for the whole shell family.
    expect(SHELL_2.combat.primaryCombo).toEqual(SHELL_1.combat.primaryCombo)
    expect(SHELL_2.asset.clips).toContain('Slam')
    expect(SHELL_2.asset.clips).not.toContain('Pounce')
    expect(SHELL_2.combat.primaryCombo).not.toContain('Claw')

    const asset = getQuality3DGLBAsset(2, 'shell')
    for (const step of SHELL_2.combat.primaryCombo) {
      const clip = step === 'Pounce' ? 'Slam' : step
      expect(asset?.requiredClips, `chain step ${step}`).toContain(clip)
    }
    expect(SHELL_2.combat.skillsEnabled).toBe(false)
  })

  it('runs its own combat authority rather than the Fang hunter\'s', () => {
    const resolved = gloamwoodFormCombatProfile('basalt-bulwark', 2)
    expect(resolved.matchedForm).toBe(true)
    expect(resolved.profile).toBe(SHELL_2.combat)
    expect(resolved.profile).not.toBe(FANG_2.combat)
  })

  it('carries a typed footprint sized to the measured body', () => {
    const profile = getGloamwoodPlayerCollisionProfile(2, 'shell')
    const halfWidth = (SHELL_2.silhouette.widthToHeight * SHELL_2.worldHeight) / 2
    // Radius follows measured half-width, never a stage default.
    expect(profile.radius).toBeGreaterThan(halfWidth * 0.8)
    expect(profile.radius).toBeLessThanOrEqual(halfWidth)
    // The rear probe deliberately lags the body's length growth: the stone club
    // is display mass, not an authoritative body.
    const halfLength = (SHELL_2.silhouette.lengthToHeight * SHELL_2.worldHeight) / 2
    expect(profile.rearOffset).toBeLessThan(halfLength)
  })

  it('keeps the stone material grade, because its relief lives in the normal map', () => {
    // Never the Fang stage-2 grade, which sets normalMap = null. Correct for a
    // smooth toon surface, destructive for cracked cliff rock.
    expect(SHELL_2.material.normalStrength).toBe(1)
    expect(FANG_2.material.normalStrength).toBe(0)
    expect(SHELL_2.material).toMatchObject({
      minimumRoughness: SHELL_1.material.minimumRoughness,
      maximumRoughness: SHELL_1.material.maximumRoughness,
      emissiveIntensity: 0,
    })
  })

  it('plays its whole authored motion instead of being cut off two thirds through', () => {
    // A one-shot attack clip is stopped when its action window ends. `setAction`
    // read the Fang hunter's playback rates for *every* form, so most attack
    // clips in the game never reach their recovery: measured across the cast,
    // Bite played 64% of itself and Slam 65%. What survives truncation is the
    // anticipation and the contact - and for this form both steps' anticipations
    // were the same "front end pitches down" gesture, which is why the owner
    // read Bite and Slam as identical.
    //
    // Every window here matches its clip at playback rate 1. Read from the
    // shipped binary, so re-authoring a clip without retiming its window fails.
    const buffer = readFileSync(new URL('../public/assets/quality-3d/models/basalt-bulwark-rigged-v1.glb', import.meta.url))
    let offset = 12
    let json: { animations?: { name: string; samplers: { input: number }[] }[]; accessors?: { max?: number[] }[] } | undefined
    while (offset + 8 <= buffer.length) {
      const length = buffer.readUInt32LE(offset)
      if (buffer.readUInt32LE(offset + 4) === 0x4e4f534a) {
        json = JSON.parse(buffer.subarray(offset + 8, offset + 8 + length).toString('utf8'))
        break
      }
      offset += 8 + length
    }
    const clipSeconds = (name: string) => {
      const animation = json?.animations?.find((entry) => entry.name === name)
      expect(animation, `clip ${name} missing`).toBeDefined()
      return Math.max(...animation!.samplers.map((s) => json!.accessors![s.input].max?.[0] ?? 0))
    }

    const combat = SHELL_2.combat
    const pairs: [string, number, number][] = [
      ['Bite', clipSeconds('Bite'), combat.biteDurationSeconds],
      ['Slam', clipSeconds('Slam'), combat.pounceDurationSeconds],
      ['TailSwipe', clipSeconds('TailSwipe'), combat.tailSwipeDurationSeconds],
    ]
    for (const [name, clip, window] of pairs) {
      expect(Math.abs(clip - window), `${name}: clip ${clip}s vs window ${window}s`).toBeLessThan(0.06)
    }
    // Rate 1 across the board, so the authored heaviness is what plays.
    for (const rate of Object.values(combat.attackPlaybackRate)) expect(rate).toBe(1)
  })

  it('separates its three steps by shape, not by a few degrees', () => {
    // Bite is a head snap over a still body; Slam rears the whole front end and
    // drops it; TailSwipe turns the body to swing the club. Measured from the
    // shipped clips, each is led by a different bone - which is what makes them
    // tell apart at 13.3% screen height, where four degrees of difference on the
    // same gesture does not.
    const combat = SHELL_2.combat
    // The cheap opener commits least; the finisher commits most.
    expect(combat.biteDurationSeconds).toBeLessThan(combat.pounceDurationSeconds)
    expect(combat.pounceDurationSeconds).toBeLessThan(combat.tailSwipeDurationSeconds)
    // Contact lands inside its own window, never after the clip has been cut.
    expect(combat.biteContactSeconds).toBeLessThan(combat.biteDurationSeconds)
    expect(combat.pounceContactSeconds).toBeLessThan(combat.pounceDurationSeconds)
    expect(combat.tailSwipeContactSeconds).toBeLessThan(combat.tailSwipeDurationSeconds)
    // Slam's contact sits late because the rear-up and hold come first: that
    // anticipation is the tell, and removing it is what made it read as a bite.
    expect(combat.pounceContactSeconds / combat.pounceDurationSeconds).toBeGreaterThan(0.55)
    expect(combat.biteContactSeconds / combat.biteDurationSeconds).toBeLessThan(0.55)
  })

  it('holds the runtime triangle and rig budget without decimation', () => {
    // The source arrived at 20,660 already inside budget, so the plates keep
    // their hard lifted lips. Every other creature in this project needed
    // staged collapse.
    expect(SHELL_2.asset.triangles).toBeGreaterThan(20_000)
    expect(SHELL_2.asset.triangles).toBeLessThanOrEqual(24_000)
    expect(SHELL_2.asset.bones).toBe(SHELL_1.asset.bones)
    expect(SHELL_2.silhouette.attachmentCount).toBe(0)
  })
})
