import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { SPORE_STALKER_PRESENTATION } from '../src/spore-stalker-character-presentation'
import { SCARLET_GECKO_PRESENTATION } from '../src/scarlet-gecko-character-presentation'
import { STONE_PANGOLIN_PRESENTATION } from '../src/stone-pangolin-character-presentation'
import { getGloamwoodPlayerCollisionProfile } from '../src/gloamwood-3d-collision'

describe('Swarm stage-1 form', () => {
  it('is the narrowest body in the game, which is the only thing separating it', () => {
    // The concept aimed for a shorter body than the Fang form and missed:
    // length:height came out 2.01 against 1.85. Width is what actually carries
    // the difference at 13.3% of screen height, so it is what the test guards.
    expect(SPORE_STALKER_PRESENTATION.silhouette.widthToHeight).toBeLessThan(0.72)
    expect(SPORE_STALKER_PRESENTATION.silhouette.widthToHeight)
      .toBeLessThan(STONE_PANGOLIN_PRESENTATION.silhouette.widthToHeight)
    expect(SPORE_STALKER_PRESENTATION.silhouette.attachmentCount).toBe(0)
  })

  it('holds the stage-1 triangle budget the accepted forms set', () => {
    expect(SPORE_STALKER_PRESENTATION.asset.triangles).toBeGreaterThan(15_000)
    expect(SPORE_STALKER_PRESENTATION.asset.triangles).toBeLessThanOrEqual(21_000)
    expect(SPORE_STALKER_PRESENTATION.asset.bones).toBe(STONE_PANGOLIN_PRESENTATION.asset.bones)
  })

  it('keeps the Fang chain rather than the Shell one', () => {
    // Long hind legs can sell a leap; the Shell form's stout ones could not.
    expect(SPORE_STALKER_PRESENTATION.combat.primaryCombo).toEqual(['Bite', 'Pounce', 'TailSwipe'])
    expect(SPORE_STALKER_PRESENTATION.asset.clips).toContain('Pounce')
    expect(SPORE_STALKER_PRESENTATION.asset.clips).not.toContain('Slam')
  })

  it('gets a narrower collision footprint than the stage default', () => {
    const swarm = getGloamwoodPlayerCollisionProfile(1, 'swarm')
    const fang = getGloamwoodPlayerCollisionProfile(1, 'fang')
    expect(swarm.radius).toBeLessThan(fang.radius)
    expect(swarm).not.toEqual(fang)
  })

  it('is graded by form, never by stage', () => {
    const source = readFileSync(new URL('../src/gloamwood-3d-hunt.ts', import.meta.url), 'utf8')
    // Grading stage 1 as a whole is what tinted the Shell body warm and cut its
    // normal map to 62%. Three bodies share stage 1 now.
    expect(source).toContain("asset.formId === 'spore-stalker'")
    expect(source).toContain('gloamwoodFormBaseline(asset?.formId, stage)')
    // The scarlet-gecko branch substitutes the base-colour map as an emissive.
    // Doing that here would light the whole hide and erase the spore sac, which
    // is the one feature this silhouette is built around.
    const graded = source.slice(source.indexOf("asset.formId === 'spore-stalker'"))
    const branch = graded.slice(0, graded.indexOf('} else {'))
    expect(branch).not.toContain('emissiveMap = material.map')
    expect(branch).toContain('emissiveIntensity')
  })

  it('carries a real emissive, unlike either other stage-1 form', () => {
    expect(SPORE_STALKER_PRESENTATION.material.emissiveIntensity).toBeGreaterThan(0)
    expect(STONE_PANGOLIN_PRESENTATION.material.emissiveIntensity).toBe(0)
    // And it must not inherit the scarlet gecko's warm tint over a black hide.
    expect(SPORE_STALKER_PRESENTATION.material).not.toHaveProperty('colorTint')
    expect(SCARLET_GECKO_PRESENTATION.material).toHaveProperty('colorTint')
  })
})
