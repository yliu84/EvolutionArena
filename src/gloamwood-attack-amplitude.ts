import { AnimationClip, Euler, Quaternion, QuaternionKeyframeTrack } from 'three'

/**
 * Runtime amplification for the strike clips of the earlier player forms.
 *
 * The owner reported that attacks did not read - "爪子感觉没有抬起来" - and
 * measured across the cast the early forms are far quieter than the late ones.
 * Peak rotation anywhere in the body, on each form's main strike:
 *
 * | form                    | clip  | body peak |
 * | ----------------------- | ----- | --------- |
 * | scarlet-gecko (Fang 1)  | Bite  | 12 deg    |
 * | stone-pangolin (Shell 1)| Bite  | 14 deg    |
 * | coral-gecko (stage 0)   | Bite  | 25 deg    |
 * | basalt-bulwark (Shell 2)| Slam  | 38 deg    |
 * | lantern-lynx (Swarm 2)  | Claw  | 62 deg    |
 *
 * Twelve degrees across an entire body is a twitch, and it belongs to the form
 * the player wears for most of a first run.
 *
 * **Why this is done at runtime rather than re-exported.** Two of the four
 * affected forms cannot be rebuilt: the Meshy sources for `stone-pangolin` and
 * `spore-stalker` are private downloads that are deliberately not in this
 * repository. Re-authoring in Blender would fix half the cast and leave the
 * four forms feeling inconsistent, which is worse than the problem. Amplifying
 * the loaded clip covers every form regardless of where its source lives, is
 * tunable per form, and is reversible by deleting a table entry.
 *
 * The transform is the same one `amplify_quaternion_motion` performs in Blender:
 * take each key's rotation away from the clip's own rest pose, scale that delta,
 * cap it, and put it back. Rotation only - translation tracks are untouched, so
 * root motion and foot planting are unchanged, and bone scale stays at the unit
 * value the runtime requires.
 */

/** Clips this may touch. Locomotion, reactions and death are deliberately absent. */
export const GLOAMWOOD_AMPLIFIED_ATTACK_CLIPS = ['Bite', 'Claw', 'Pounce', 'Slam', 'TailSwipe'] as const

export interface GloamwoodAttackAmplitudeProfile {
  /** Multiplier on each key's rotation away from the rest pose. */
  factor: number
  /**
   * Hard cap on the amplified angle.
   *
   * These rigs were skinned for the motion they shipped with, not for this, and
   * the coral-gecko's V3 stretch came from rotations exceeding what its weights
   * tolerate. The cap is what keeps amplification from turning into that.
   */
  ceilingDegrees: number
}

/**
 * Form-keyed, and only the forms that measured quiet.
 *
 * Absent forms are returned unchanged, which is why `spore-stalker` is not here:
 * its Claw already peaks at 40 degrees and its Bite at 27, in line with the
 * stage-2 bodies. A form is added to this table because it was measured, never
 * because it is old.
 */
export const GLOAMWOOD_ATTACK_AMPLITUDE: Readonly<Record<string, GloamwoodAttackAmplitudeProfile>> = {
  // 12 degrees is the quietest strike in the game and belongs to the first
  // evolution most players see. Taken to roughly 29.
  'scarlet-gecko': { factor: 2.4, ceilingDegrees: 42 },
  // 14 degrees, and a body whose whole identity is weight - a slam that barely
  // moves reads as the armour being foam.
  'stone-pangolin': { factor: 2.2, ceilingDegrees: 42 },
  // Already the liveliest of the three early forms at 25, so it needs the least.
  // Its rig also carries a documented deformation repair, so it gets the lowest
  // factor and the tightest cap of the three.
  'coral-gecko': { factor: 1.5, ceilingDegrees: 38 },
}

const RAD_TO_DEG = 180 / Math.PI

/**
 * Return an amplified copy of a strike clip, or the clip itself when the form
 * declares no profile or the clip is not a strike.
 *
 * Cloning matters: `AnimationClip` tracks are shared through the loader cache,
 * so scaling the values in place would compound every time the same GLB is
 * loaded again - a player evolving twice into the same body would get a form
 * whose attacks grew each time.
 */
export function amplifyGloamwoodAttackClip(clip: AnimationClip, formId: string | undefined): AnimationClip {
  const profile = formId ? GLOAMWOOD_ATTACK_AMPLITUDE[formId] : undefined
  if (!profile) return clip
  if (!(GLOAMWOOD_AMPLIFIED_ATTACK_CLIPS as readonly string[]).includes(clip.name)) return clip

  const amplified = clip.clone()
  const ceiling = profile.ceilingDegrees / RAD_TO_DEG
  const rest = new Quaternion()
  const inverseRest = new Quaternion()
  const keyed = new Quaternion()
  const delta = new Quaternion()
  const scaled = new Quaternion()
  const euler = new Euler()

  for (const track of amplified.tracks) {
    if (!(track instanceof QuaternionKeyframeTrack)) continue
    const values = track.values
    if (values.length < 8) continue
    rest.set(values[0], values[1], values[2], values[3]).normalize()
    inverseRest.copy(rest).invert()
    for (let index = 4; index < values.length; index += 4) {
      keyed.set(values[index], values[index + 1], values[index + 2], values[index + 3]).normalize()
      delta.copy(inverseRest).multiply(keyed).normalize()
      // Shortest arc, so a delta expressed the long way round is not amplified
      // away from the pose the animator authored.
      if (delta.w < 0) delta.set(-delta.x, -delta.y, -delta.z, -delta.w)
      const angle = 2 * Math.acos(Math.min(1, Math.abs(delta.w)))
      if (angle < 1e-6) continue
      // Amplify, never attenuate. The cap exists to stop a small motion being
      // scaled past what a rig's weights tolerate - it must not shrink a motion
      // that was already large. The coral-gecko's TailSwipe is a deliberate
      // 148-degree full spin, an accepted part of its contract, and a naive
      // `min(angle * factor, ceiling)` cut it to 38.
      const target = Math.max(angle, Math.min(angle * profile.factor, ceiling))
      if (target <= angle + 1e-6) continue
      euler.setFromQuaternion(delta, 'XYZ')
      const axisScale = target / angle
      scaled.setFromEuler(new Euler(euler.x * axisScale, euler.y * axisScale, euler.z * axisScale, 'XYZ'))
      keyed.copy(rest).multiply(scaled).normalize()
      values[index] = keyed.x
      values[index + 1] = keyed.y
      values[index + 2] = keyed.z
      values[index + 3] = keyed.w
    }
  }
  return amplified
}

/** Peak rotation away from rest in a clip, in degrees. Used by tests and review. */
export function gloamwoodClipPeakDegrees(clip: AnimationClip) {
  let peak = 0
  const rest = new Quaternion()
  const inverseRest = new Quaternion()
  const keyed = new Quaternion()
  const delta = new Quaternion()
  for (const track of clip.tracks) {
    if (!(track instanceof QuaternionKeyframeTrack)) continue
    const values = track.values
    if (values.length < 8) continue
    rest.set(values[0], values[1], values[2], values[3]).normalize()
    inverseRest.copy(rest).invert()
    for (let index = 4; index < values.length; index += 4) {
      keyed.set(values[index], values[index + 1], values[index + 2], values[index + 3]).normalize()
      delta.copy(inverseRest).multiply(keyed).normalize()
      peak = Math.max(peak, 2 * Math.acos(Math.min(1, Math.abs(delta.w))) * RAD_TO_DEG)
    }
  }
  return peak
}
