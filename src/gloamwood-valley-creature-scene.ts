import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { clone as cloneSkinnedHierarchy } from 'three/examples/jsm/utils/SkeletonUtils.js'

import { assetUrl } from './asset-url'
import { GLOAMWOOD_PREY } from './gloamwood-3d-ecology'
import {
  gloamwoodModelledPreyFor,
  gloamwoodPreyClipForPhase,
  gloamwoodPreyClipRate,
  gloamwoodPreyWalkRate,
  type GloamwoodModelledPreyConfig,
} from './gloamwood-modelled-prey'
import {
  gloamwoodValleyCreatureHeight,
  type GloamwoodValleyCreature,
} from './gloamwood-valley-creatures'
import { gloamwoodValleyCellDrawn, gloamwoodValleyCellOf } from './gloamwood-valley-streaming'

/**
 * The valley's creatures on screen.
 *
 * Presentation only. It is handed creature state that has already been decided
 * and puts a body where the state says - it never moves anything, never decides
 * who is awake, and never touches health. Everything it reads is authored
 * somewhere the tests can reach.
 *
 * Bodies are chosen by role and terrain, not by family alone: a hunter and a
 * grazer of the same family are not the same animal, and the grazer on scree is
 * not the one on grass.
 */

interface CreatureVisual {
  root: THREE.Group
  mixer: THREE.AnimationMixer
  clips: Map<string, THREE.AnimationClip>
  config: GloamwoodModelledPreyConfig
  action?: THREE.AnimationAction
  clipName?: string
  previousPhase?: GloamwoodValleyCreature['phase']
  /** Last drawn position, so the walk rate can follow real ground speed. */
  lastX: number
  lastZ: number
  walking?: boolean
}

export interface GloamwoodValleyCreatureScene {
  root: THREE.Group
  /** Bodies loaded, and creatures currently submitted for drawing. */
  stats: { bodies: number; creatures: number }
  drawn: number
  update(creatures: readonly GloamwoodValleyCreature[], cameraX: number, cameraZ: number, delta: number): void
  dispose(): void
}

export async function buildGloamwoodValleyCreatureScene(
  creatures: readonly GloamwoodValleyCreature[],
): Promise<GloamwoodValleyCreatureScene> {
  const loader = new GLTFLoader()
  const root = new THREE.Group()
  root.name = 'ValleyCreatures'

  // One template per body actually needed, so a run with no scree branch walked
  // does not pay for the pebble.
  const wanted = new Map<string, GloamwoodModelledPreyConfig>()
  for (const creature of creatures) {
    const config = gloamwoodModelledPreyFor(creature.kind, creature.role, creature.branch)
    if (config) wanted.set(config.id, config)
  }

  const templates = new Map<string, { scene: THREE.Group; clips: THREE.AnimationClip[] }>()
  await Promise.all([...wanted.values()].map(async (config) => {
    const gltf = await loader.loadAsync(assetUrl(config.url))
    gltf.scene.updateMatrixWorld(true)
    const size = new THREE.Box3().setFromObject(gltf.scene).getSize(new THREE.Vector3())
    // Re-derived rather than trusted from the export, so the visible footprint
    // still matches what blocks the player if a model is ever re-exported at a
    // different scale.
    const halfExtent = Math.max(size.x, size.z) / 2
    gltf.scene.scale.setScalar(config.footprintRadius / Math.max(0.001, halfExtent))
    gltf.scene.updateMatrixWorld(true)
    gltf.scene.position.y -= new THREE.Box3().setFromObject(gltf.scene).min.y
    gltf.scene.rotation.y = config.modelYaw
    gltf.scene.traverse((node) => {
      node.castShadow = true
      node.receiveShadow = true
    })
    templates.set(config.id, { scene: gltf.scene, clips: gltf.animations })
  }))

  const visuals = new Map<string, CreatureVisual>()
  for (const creature of creatures) {
    const config = gloamwoodModelledPreyFor(creature.kind, creature.role, creature.branch)
    const template = config ? templates.get(config.id) : undefined
    if (!config || !template) continue
    const holder = new THREE.Group()
    holder.name = `ValleyCreature-${creature.id}`
    const body = cloneSkinnedHierarchy(template.scene)
    holder.add(body)
    root.add(holder)
    visuals.set(creature.id, {
      root: holder,
      mixer: new THREE.AnimationMixer(body),
      clips: new Map(template.clips.map((clip) => [clip.name, clip])),
      config,
      lastX: creature.x,
      lastZ: creature.z,
    })
  }

  let drawn = 0

  return {
    root,
    stats: { bodies: templates.size, creatures: visuals.size },
    get drawn() {
      return drawn
    },
    update(list, cameraX, cameraZ, delta) {
      drawn = 0
      for (const creature of list) {
        const visual = visuals.get(creature.id)
        if (!visual) continue
        // Culled by the same cells the scenery uses. A creature drawn on the
        // far side of the valley costs a skinned draw call for nothing.
        const near = gloamwoodValleyCellDrawn(gloamwoodValleyCellOf(creature.x, creature.z), cameraX, cameraZ)
        visual.root.visible = near
        if (!near) continue
        drawn += 1
        visual.root.position.set(creature.x, gloamwoodValleyCreatureHeight(creature), creature.z)
        visual.root.rotation.y = creature.facingRadians
        // Measured, not assumed. A creature slowed by circling, by a knockback
        // or by the crowd around it moves at neither its spec speed nor zero,
        // and only the distance it actually covered knows which.
        const travelled = Math.hypot(creature.x - visual.lastX, creature.z - visual.lastZ)
        const groundSpeed = delta > 0 ? travelled / delta : 0
        visual.lastX = creature.x
        visual.lastZ = creature.z

        const spec = GLOAMWOOD_PREY[creature.kind]
        const selection = gloamwoodPreyClipForPhase(
          creature.phase,
          visual.config,
          visual.previousPhase,
          creature.awake,
        )
        const clip = visual.clips.get(selection.clip)
        if (clip && (selection.clip !== visual.clipName || selection.restart)) {
          const next = visual.mixer.clipAction(clip)
          next.reset()
          next.setLoop(selection.once ? THREE.LoopOnce : THREE.LoopRepeat, selection.once ? 1 : Infinity)
          next.clampWhenFinished = selection.once
          next.timeScale = selection.clip === visual.config.clips.attack
            ? gloamwoodPreyClipRate(clip.duration, spec.telegraphSeconds, spec.strikeSeconds)
            : 1
          visual.walking = selection.clip === visual.config.clips.walk
          if (visual.action && visual.action !== next) visual.action.fadeOut(0.12)
          next.fadeIn(0.12).play()
          visual.action = next
          visual.clipName = selection.clip
        }
        // Re-applied every frame rather than only on a clip change: ground
        // speed changes continuously, and a rate set once at the start of the
        // cycle slides again the moment the creature slows down.
        if (visual.walking && visual.action) {
          const clip = visual.clips.get(visual.config.clips.walk)
          if (clip) {
            visual.action.timeScale = gloamwoodPreyWalkRate(
              clip.duration,
              visual.config.footprintRadius,
              groundSpeed,
            )
          }
        }
        visual.previousPhase = creature.phase
        visual.mixer.update(delta)
      }
    },
    dispose() {
      for (const visual of visuals.values()) {
        visual.mixer.stopAllAction()
        visual.root.traverse((node) => {
          if (!(node instanceof THREE.Mesh)) return
          node.geometry.dispose()
          for (const material of Array.isArray(node.material) ? node.material : [node.material]) material.dispose()
        })
      }
      visuals.clear()
      root.clear()
    },
  }
}
