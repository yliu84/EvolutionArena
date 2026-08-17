import { CORAL_GECKO_PRESENTATION } from './quality-3d-character-presentation'
import {
  AnimationClip,
  Euler,
  Quaternion,
  QuaternionKeyframeTrack,
  type MeshStandardMaterial,
} from 'three'

export const SCARLET_GECKO_SURFACE_GRADE = {
  contrast: 1.16,
  saturation: 1.24,
} as const

export const SCARLET_GECKO_LOCOMOTION_STABILITY = {
  coreBones: ['Hips', 'chest', 'head'],
  yawScale: 0.22,
  rollScale: 0.18,
} as const

export function stabilizeScarletGeckoLocomotionClip(source: AnimationClip) {
  if (source.name !== 'Run' && source.name !== 'Walk') return source
  const clip = source.clone()
  const coreBones = new Set<string>(SCARLET_GECKO_LOCOMOTION_STABILITY.coreBones)
  for (const track of clip.tracks) {
    const separator = track.name.lastIndexOf('.')
    const boneName = separator >= 0 ? track.name.slice(0, separator) : track.name
    if (!(track instanceof QuaternionKeyframeTrack) || !coreBones.has(boneName)) continue
    const values = track.values
    const rest = new Quaternion(values[0], values[1], values[2], values[3]).normalize()
    const inverseRest = rest.clone().invert()
    const keyed = new Quaternion()
    const delta = new Quaternion()
    const adjusted = new Quaternion()
    const euler = new Euler()
    for (let index = 0; index < values.length; index += 4) {
      keyed.set(values[index], values[index + 1], values[index + 2], values[index + 3]).normalize()
      delta.copy(inverseRest).multiply(keyed)
      euler.setFromQuaternion(delta, 'XYZ')
      euler.y *= SCARLET_GECKO_LOCOMOTION_STABILITY.yawScale
      euler.z *= SCARLET_GECKO_LOCOMOTION_STABILITY.rollScale
      adjusted.setFromEuler(euler)
      keyed.copy(rest).multiply(adjusted).normalize()
      values[index] = keyed.x
      values[index + 1] = keyed.y
      values[index + 2] = keyed.z
      values[index + 3] = keyed.w
    }
  }
  return clip
}

export function applyScarletGeckoSurfaceGrade(material: MeshStandardMaterial) {
  if (material.userData.scarletGeckoSurfaceGrade === true) return
  const previousOnBeforeCompile = material.onBeforeCompile
  material.onBeforeCompile = (shader, renderer) => {
    previousOnBeforeCompile.call(material, shader, renderer)
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `#include <map_fragment>
      float scarletGeckoLuma = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
      diffuseColor.rgb = mix(vec3(scarletGeckoLuma), diffuseColor.rgb, ${SCARLET_GECKO_SURFACE_GRADE.saturation.toFixed(2)});
      diffuseColor.rgb = clamp((diffuseColor.rgb - 0.5) * ${SCARLET_GECKO_SURFACE_GRADE.contrast.toFixed(2)} + 0.5, 0.0, 1.0);`,
    )
  }
  material.customProgramCacheKey = () => 'scarlet-gecko-surface-grade-v1'
  material.userData.scarletGeckoSurfaceGrade = true
  material.needsUpdate = true
}

export const SCARLET_GECKO_PRESENTATION = {
  baselineId: 'scarlet-gecko-first-evolution-master-v2',
  displayScale: 166.1,
  animation: {
    idlePlaybackRate: 0.9,
    runPlaybackRate: 1.45,
    turnPlaybackRate: 1,
    crossfadeSeconds: 0.14,
    footstepEventsPerSecond: 5.8,
    authoredStrideAmplification: 1.22,
  },
  combat: {
    ...CORAL_GECKO_PRESENTATION.combat,
    profileId: 'scarlet-gecko-combat-master-v1',
    system: 'basic-attack',
    skillsEnabled: false,
    primaryCombo: ['Bite', 'Pounce', 'TailSwipe'],
    attackNames: { Bite: '撕咬', Pounce: '跃起重咬', TailSwipe: '旋身尾扫' },
    targeting: {
      ...CORAL_GECKO_PRESENTATION.combat.targeting,
      mode: 'player-selected-live-target',
    },
    pounceVisualTravelScale: 0.32,
    pounceVisualLiftScale: 1.65,
  },
  asset: {
    triangles: 19_406,
    bones: 27,
    clips: ['Idle', 'Walk', 'Run', 'Turn', 'Bite', 'Claw', 'TailSwipe', 'Hit', 'Death'],
    sourceModel: 'scarlet-gecko-meshy-walking-source-v2.glb',
    runtimeModel: 'scarlet-gecko-rigged-v2.glb',
    bodyPlan: 'coral-crested-gecko-drake',
    artStyle: 'stylized-handpainted-quadruped',
  },
  silhouette: {
    lengthRatio: 1.24,
    widthRatio: 1.02,
    heightRatio: 1.12,
    attachmentCount: 0,
    dominantRead: 'volumetric-coral-crested-gecko-drake',
  },
  material: {
    colorTint: 0xb88a7d,
    minimumRoughness: 0.46,
    maximumRoughness: 0.64,
    maximumMetalness: 0,
    normalStrength: 0.62,
    aoStrength: 1,
    environmentIntensity: 0.5,
    emissiveIntensity: 0.18,
    maximumAnisotropy: 8,
  },
} as const

export type ScarletGeckoPresentation = typeof SCARLET_GECKO_PRESENTATION
