import { describe, expect, it } from 'vitest'

import { gloamwoodFormCombatProfile } from '../src/gloamwood-3d-hunt'
import { CORAL_GECKO_PRESENTATION } from '../src/quality-3d-character-presentation'
import { SCARLET_GECKO_PRESENTATION } from '../src/scarlet-gecko-character-presentation'
import { SCARLET_HUNTER_PRESENTATION } from '../src/scarlet-hunter-character-presentation'
import { SPORE_STALKER_PRESENTATION } from '../src/spore-stalker-character-presentation'
import { STONE_PANGOLIN_PRESENTATION } from '../src/stone-pangolin-character-presentation'
import { BASALT_BULWARK_PRESENTATION } from '../src/basalt-bulwark-character-presentation'
import { QUALITY_3D_GLB_ASSETS } from '../src/quality-3d-glb-assets'

/**
 * The combat authority is selected by form, never by stage.
 *
 * Stage-keyed selection has cost this project three separate defects, and the
 * one guarded here had not fired yet: `stage >= 2` answered for the Fang hunter
 * by position, so the next form to reach stage 2 would have silently inherited
 * its damage, reach, timings and a `Claw` opening step a plated body has no clip
 * for.
 */
describe('form combat authority', () => {
  it('gives every produced form its own profile rather than the stage default', () => {
    const cases = [
      ['coral-gecko', CORAL_GECKO_PRESENTATION],
      ['scarlet-gecko', SCARLET_GECKO_PRESENTATION],
      ['scarlet-hunter', SCARLET_HUNTER_PRESENTATION],
      ['stone-pangolin', STONE_PANGOLIN_PRESENTATION],
      ['basalt-bulwark', BASALT_BULWARK_PRESENTATION],
      ['spore-stalker', SPORE_STALKER_PRESENTATION],
    ] as const

    for (const [formId, presentation] of cases) {
      // The stage argument is deliberately wrong in every call. A form that
      // reports its own authority must not be reachable through the stage path.
      for (const stage of [0, 1, 2]) {
        const resolved = gloamwoodFormCombatProfile(formId, stage)
        expect(resolved.profile, `${formId} at stage ${stage}`).toBe(presentation.combat)
        expect(resolved.matchedForm, `${formId} at stage ${stage}`).toBe(true)
      }
    }
  })

  it('every registered runtime form declares its own authority', () => {
    // The registry is the list of bodies that can actually reach the player.
    // Stage 3 and 6 are route-independent endpoints with no authored profile;
    // they are the only entries allowed to fall back.
    for (const asset of QUALITY_3D_GLB_ASSETS) {
      const resolved = gloamwoodFormCombatProfile(asset.formId, asset.stage)
      if (asset.stage <= 2) {
        expect(resolved.matchedForm, `${asset.formId} (stage ${asset.stage})`).toBe(true)
      }
    }
  })

  it("reports a borrowed profile rather than passing it off as the form's own", () => {
    // This is the shape of the defect. A stage-2 body that is not the Fang
    // hunter must come back flagged, so debug state shows the substitution the
    // way characterFamily already shows a borrowed body. The Shell line's
    // stage-2 form has since shipped and is named explicitly, so the example
    // here is a form that does not exist.
    const unknownStageTwo = gloamwoodFormCombatProfile('some-unproduced-stage-2-form', 2)
    expect(unknownStageTwo.matchedForm).toBe(false)
    expect(unknownStageTwo.profile).toBe(SCARLET_HUNTER_PRESENTATION.combat)

    const missingAsset = gloamwoodFormCombatProfile(undefined, 0)
    expect(missingAsset.matchedForm).toBe(false)
  })

  it('never hands a Shell body a chain step it has no clip for', () => {
    // This is the concrete harm the stage fallback would have done. `Pounce` is
    // safe - setAction redirects it to Slam for the whole shell family, keyed on
    // family rather than stage, so a stage-2 Shell body inherits that correctly.
    // `Claw` is not: the hunter's chain opens with it, and no Shell GLB declares
    // a Claw clip, so setAction would find no action and play nothing while the
    // authority still resolved damage. That exact failure shipped on Shell
    // stage 1 and was only found in play.
    const shellAsset = QUALITY_3D_GLB_ASSETS.find((asset) => asset.family === 'shell')
    expect(shellAsset?.requiredClips).toContain('Slam')
    expect(shellAsset?.requiredClips).not.toContain('Claw')
    expect(SCARLET_HUNTER_PRESENTATION.combat.primaryCombo).toContain('Claw')

    const shellChain = gloamwoodFormCombatProfile('stone-pangolin', 2).profile.primaryCombo
    expect(shellChain).not.toContain('Claw')
    for (const step of shellChain) {
      const clip = step === 'Pounce' ? 'Slam' : step
      expect(shellAsset?.requiredClips, `chain step ${step}`).toContain(clip)
    }
  })
})
