import { describe, expect, it } from 'vitest'
import { AnimationClip, QuaternionKeyframeTrack, VectorKeyframeTrack } from 'three'

import {
  GLOAMWOOD_AMPLIFIED_ATTACK_CLIPS,
  GLOAMWOOD_ATTACK_AMPLITUDE,
  amplifyGloamwoodAttackClip,
  gloamwoodClipPeakDegrees,
} from '../src/gloamwood-attack-amplitude'

/** A one-bone clip rotating `degrees` about Y away from rest. */
function strikeClip(name: string, degrees: number) {
  const half = (degrees / 2) * (Math.PI / 180)
  return new AnimationClip(name, -1, [
    new QuaternionKeyframeTrack('chest.quaternion', [0, 0.5], [
      0, 0, 0, 1,
      0, Math.sin(half), 0, Math.cos(half),
    ]),
  ])
}

describe('attack amplitude', () => {
  it('lifts the quiet early strikes toward what the late forms already do', () => {
    // The measured problem: twelve degrees across a whole body, on the form the
    // player wears for most of a first run.
    const raw = strikeClip('Bite', 12)
    expect(gloamwoodClipPeakDegrees(raw)).toBeCloseTo(12, 1)

    const lifted = amplifyGloamwoodAttackClip(raw, 'scarlet-gecko')
    const peak = gloamwoodClipPeakDegrees(lifted)
    expect(peak).toBeGreaterThan(25)
    expect(peak).toBeCloseTo(12 * GLOAMWOOD_ATTACK_AMPLITUDE['scarlet-gecko'].factor, 0)
  })

  it('amplifies but never attenuates, so authored large motion survives', () => {
    // The coral-gecko's TailSwipe is a deliberate 148-degree full spin and an
    // accepted part of its contract. A naive `min(angle * factor, ceiling)` cut
    // it to 38 - the cap was shrinking the very thing it was meant to protect.
    const spin = strikeClip('TailSwipe', 148)
    const peak = gloamwoodClipPeakDegrees(amplifyGloamwoodAttackClip(spin, 'coral-gecko'))
    expect(peak).toBeCloseTo(148, 0)
  })

  it('caps the amplified angle so a rig is not pushed past its weights', () => {
    // The coral-gecko's V3 stretch came from rotations exceeding what its skin
    // tolerates. Without a cap, amplifying a clip that was already large would
    // reproduce exactly that.
    const profile = GLOAMWOOD_ATTACK_AMPLITUDE['scarlet-gecko']
    const large = strikeClip('Claw', 40)
    const peak = gloamwoodClipPeakDegrees(amplifyGloamwoodAttackClip(large, 'scarlet-gecko'))
    expect(40 * profile.factor).toBeGreaterThan(profile.ceilingDegrees)
    expect(peak).toBeLessThanOrEqual(profile.ceilingDegrees + 0.5)
  })

  it('touches strikes only, never locomotion, reactions or death', () => {
    for (const name of ['Idle', 'Walk', 'Run', 'Turn', 'Hit', 'Death']) {
      const clip = strikeClip(name, 12)
      expect(amplifyGloamwoodAttackClip(clip, 'scarlet-gecko'), name).toBe(clip)
    }
    for (const name of GLOAMWOOD_AMPLIFIED_ATTACK_CLIPS) {
      const clip = strikeClip(name, 12)
      expect(amplifyGloamwoodAttackClip(clip, 'scarlet-gecko'), name).not.toBe(clip)
    }
  })

  it('leaves a form with no profile completely alone', () => {
    // Absence is the default. A form is listed because it was measured quiet,
    // never because it is old - spore-stalker already peaks at 40 degrees.
    for (const formId of ['spore-stalker', 'lantern-lynx', 'basalt-bulwark', 'scarlet-hunter', undefined]) {
      const clip = strikeClip('Bite', 12)
      expect(amplifyGloamwoodAttackClip(clip, formId), String(formId)).toBe(clip)
    }
  })

  it('never rewrites the clip it was given, because loader tracks are shared', () => {
    // The GLTF loader caches clips, so amplifying in place would compound each
    // time the same body loaded - a player evolving twice into one form would
    // get attacks that grew between evolutions.
    const raw = strikeClip('Bite', 12)
    const before = Array.from(raw.tracks[0].values)
    const first = gloamwoodClipPeakDegrees(amplifyGloamwoodAttackClip(raw, 'scarlet-gecko'))
    const second = gloamwoodClipPeakDegrees(amplifyGloamwoodAttackClip(raw, 'scarlet-gecko'))
    expect(Array.from(raw.tracks[0].values)).toEqual(before)
    expect(second).toBeCloseTo(first, 5)
  })

  it('does not touch translation, so root motion and foot plants are unchanged', () => {
    const clip = new AnimationClip('Bite', -1, [
      new VectorKeyframeTrack('Hips.position', [0, 0.5], [0, 0, 0, 0, 0.25, 0]),
      new QuaternionKeyframeTrack('chest.quaternion', [0, 0.5], [0, 0, 0, 1, 0, 0.1, 0, 0.995]),
    ])
    const lifted = amplifyGloamwoodAttackClip(clip, 'scarlet-gecko')
    const position = lifted.tracks.find((track) => track.name === 'Hips.position')
    expect(Array.from(position!.values)).toEqual([0, 0, 0, 0, 0.25, 0])
  })

  it('only lists forms that measured quieter than the stage-2 bodies', () => {
    // Guards the table against drift: the stage-2 forms are the reference and
    // must never appear here.
    expect(Object.keys(GLOAMWOOD_ATTACK_AMPLITUDE).sort())
      .toEqual(['coral-gecko', 'scarlet-gecko', 'stone-pangolin'])
    for (const profile of Object.values(GLOAMWOOD_ATTACK_AMPLITUDE)) {
      expect(profile.factor).toBeGreaterThan(1)
      expect(profile.ceilingDegrees).toBeGreaterThan(0)
      expect(profile.ceilingDegrees).toBeLessThanOrEqual(45)
    }
    // The form that needs least gets least, and the quietest gets most.
    expect(GLOAMWOOD_ATTACK_AMPLITUDE['coral-gecko'].factor)
      .toBeLessThan(GLOAMWOOD_ATTACK_AMPLITUDE['scarlet-gecko'].factor)
  })
})
