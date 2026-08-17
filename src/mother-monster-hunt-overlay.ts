import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

import { CORAL_GECKO_PRESENTATION } from './quality-3d-character-presentation'
import { getQuality3DGLBAsset } from './quality-3d-glb-assets'
import {
  applyScarletGeckoSurfaceGrade,
  SCARLET_GECKO_PRESENTATION,
  stabilizeScarletGeckoLocomotionClip,
} from './scarlet-gecko-character-presentation'
import { SCARLET_HUNTER_PRESENTATION } from './scarlet-hunter-character-presentation'
import type { FormalHuntBasicAttackAction } from './formal-hunt-basic-attack'
import { QUALITY_3D_RESCUE_CAMERA } from './quality-3d-camera'
import { juvenileLeapBiteMotionFrame, juvenileSpinTailSwipeMotionFrame, quadrupedPounceFrame } from './quadruped-combat-motion'

export type MotherMonsterHuntAction = FormalHuntBasicAttackAction | 'Hit' | 'Death' | null

export interface MotherMonsterHuntOverlaySnapshot {
  screenX: number
  screenY: number
  facingRadians: number
  moving: boolean
  visible: boolean
  action: MotherMonsterHuntAction
  deltaSeconds: number
}

export interface MotherMonsterHuntOverlayState {
  ready: boolean
  source: 'loading' | 'glb' | 'failed'
  stage: number
  formId: string
  baselineId: string
  profileId: string
  activeClip: string
  modelUrl: string
  camera: {
    mode: typeof QUALITY_3D_RESCUE_CAMERA.mode
    fovDegrees: number
    pitchDegrees: number
    distance: number
  }
}

const RENDER_WIDTH = 220
const RENDER_HEIGHT = 190
// The accepted rescue camera sees roughly twice the vertical world height of
// the former orthographic card. This compensates only inside the transparent
// presentation layer; Phaser collision, range and the stage-to-stage 20%/18%
// size relationship remain authoritative and unchanged.
const FORMAL_HUNT_PERSPECTIVE_SCALE = 2.05

export class MotherMonsterHuntOverlay {
  private readonly scene = new THREE.Scene()
  private readonly camera = new THREE.PerspectiveCamera(
    QUALITY_3D_RESCUE_CAMERA.fovDegrees,
    RENDER_WIDTH / RENDER_HEIGHT,
    QUALITY_3D_RESCUE_CAMERA.near,
    QUALITY_3D_RESCUE_CAMERA.far,
  )
  private readonly renderer: THREE.WebGLRenderer
  private readonly loader = new GLTFLoader()
  private readonly root = new THREE.Group()
  private mixer?: THREE.AnimationMixer
  private actions = new Map<string, THREE.AnimationAction>()
  private activeClip = 'loading'
  private actionElapsed = 0
  private source: MotherMonsterHuntOverlayState['source'] = 'loading'
  private disposed = false
  private assetStage: 0 | 1 | 2
  private loadToken = 0
  private loadedScene?: THREE.Object3D
  private readonly container: HTMLElement
  private readonly phaserCanvas: HTMLCanvasElement

  constructor(
    container: HTMLElement,
    phaserCanvas: HTMLCanvasElement,
    assetStage: 0 | 1 | 2 = 0,
  ) {
    this.container = container
    this.phaserCanvas = phaserCanvas
    this.assetStage = assetStage
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
    this.renderer.setSize(RENDER_WIDTH, RENDER_HEIGHT, false)
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.domElement.className = 'mother-monster-hunt-overlay'
    Object.assign(this.renderer.domElement.style, {
      position: 'absolute',
      pointerEvents: 'none',
      zIndex: '4',
      width: `${RENDER_WIDTH}px`,
      height: `${RENDER_HEIGHT}px`,
      display: 'none',
    })
    this.container.append(this.renderer.domElement)

    const pitch = THREE.MathUtils.degToRad(QUALITY_3D_RESCUE_CAMERA.pitchDegrees)
    const orbit = THREE.MathUtils.degToRad(QUALITY_3D_RESCUE_CAMERA.orbitDegrees)
    const horizontalDistance = Math.cos(pitch) * QUALITY_3D_RESCUE_CAMERA.distance
    this.camera.position.set(
      Math.sin(orbit) * horizontalDistance,
      QUALITY_3D_RESCUE_CAMERA.pivotHeight + Math.sin(pitch) * QUALITY_3D_RESCUE_CAMERA.distance,
      Math.cos(orbit) * horizontalDistance,
    )
    this.camera.lookAt(0, QUALITY_3D_RESCUE_CAMERA.pivotHeight, 0)
    this.scene.add(new THREE.HemisphereLight(0xcfe8d7, 0x263024, 2.25))
    const key = new THREE.DirectionalLight(0xffdfad, 4.1)
    key.position.set(-4, 7, 5)
    this.scene.add(key)
    const rim = new THREE.DirectionalLight(0x74d7ff, 1.9)
    rim.position.set(5, 3, -4)
    this.scene.add(rim)
    this.scene.add(this.root)

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.78, 40),
      new THREE.MeshBasicMaterial({ color: 0x020604, transparent: true, opacity: 0.42, depthWrite: false }),
    )
    shadow.scale.set(1.5, 0.58, 1)
    shadow.rotation.x = -Math.PI / 2
    shadow.position.y = 0.015
    this.scene.add(shadow)
  }

  async load() {
    await this.setStage(this.assetStage, true)
  }

  async setStage(stage: number, force = false) {
    const nextStage: 0 | 1 | 2 = stage >= 2 ? 2 : stage >= 1 ? 1 : 0
    if (!force && nextStage === this.assetStage) return
    this.assetStage = nextStage
    const token = ++this.loadToken
    this.source = 'loading'
    this.renderer.domElement.style.display = 'none'
    const asset = getQuality3DGLBAsset(nextStage)
    if (!asset) throw new Error(`Missing mother-monster stage-${nextStage} GLB contract`)
    try {
      const gltf = await this.loader.loadAsync(asset.url)
      const missingNode = asset.requiredNodes.find((name) => !gltf.scene.getObjectByName(name))
      const missingClip = asset.requiredClips.find((name) => !gltf.animations.some((clip) => clip.name === name))
      if (missingNode || missingClip) throw new Error(`Invalid coral-gecko GLB: missing ${missingNode ?? missingClip}`)
      if (this.disposed || token !== this.loadToken) return

      this.disposeLoadedScene()
      gltf.scene.rotation.y = asset.modelYaw ?? 0
      const materialProfile = nextStage === 2
        ? SCARLET_HUNTER_PRESENTATION.material
        : nextStage === 1
          ? SCARLET_GECKO_PRESENTATION.material
          : CORAL_GECKO_PRESENTATION.material
      gltf.scene.traverse((node) => {
        if (node.name === 'Icosphere') {
          node.visible = false
          if (node instanceof THREE.Mesh) {
            node.castShadow = false
            node.receiveShadow = false
          }
          return
        }
        if (!(node instanceof THREE.Mesh)) return
        const materials = Array.isArray(node.material) ? node.material : [node.material]
        for (const material of materials) {
          if (!(material instanceof THREE.MeshStandardMaterial)) continue
          material.roughness = THREE.MathUtils.clamp(
            material.roughness * 1.06,
            materialProfile.minimumRoughness,
            materialProfile.maximumRoughness,
          )
          material.metalness = Math.min(material.metalness, materialProfile.maximumMetalness)
          material.envMapIntensity = materialProfile.environmentIntensity
          if (nextStage === 1) {
            material.color.setHex(SCARLET_GECKO_PRESENTATION.material.colorTint)
            material.emissive.setHex(0xffffff)
            material.emissiveMap = material.map
            material.emissiveIntensity = SCARLET_GECKO_PRESENTATION.material.emissiveIntensity
            applyScarletGeckoSurfaceGrade(material)
          }
          if (nextStage === 2) {
            material.flatShading = false
            material.normalMap = null
          }
          if (material.aoMap) material.aoMapIntensity = materialProfile.aoStrength
          if (material.normalMap) material.normalScale.setScalar(materialProfile.normalStrength)
          if (nextStage === 2) {
            material.emissive.setHex(0x1b0603)
            material.emissiveIntensity = 0.14
          }
          for (const texture of [material.map, material.normalMap, material.roughnessMap, material.metalnessMap]) {
            if (!texture) continue
            texture.anisotropy = Math.min(
              materialProfile.maximumAnisotropy,
              this.renderer.capabilities.getMaxAnisotropy(),
            )
          }
          material.needsUpdate = true
        }
      })
      this.root.add(gltf.scene)
      this.loadedScene = gltf.scene
      this.root.scale.setScalar(asset.scale * FORMAL_HUNT_PERSPECTIVE_SCALE)
      this.root.position.set(0, -0.12, 0)
      this.mixer = new THREE.AnimationMixer(this.root)
      this.actions = new Map(gltf.animations.map((sourceClip) => {
        const clip = nextStage === 1 ? stabilizeScarletGeckoLocomotionClip(sourceClip) : sourceClip
        return [clip.name, this.mixer!.clipAction(clip)] as const
      }))
      this.source = 'glb'
      this.setAction('Idle', true)
    } catch (error) {
      if (token === this.loadToken) this.source = 'failed'
      throw error
    }
  }

  update(snapshot: MotherMonsterHuntOverlaySnapshot) {
    if (this.disposed) return
    const ready = this.source === 'glb'
    this.renderer.domElement.style.display = ready && snapshot.visible ? 'block' : 'none'
    if (!ready || !snapshot.visible) return
    this.positionOverPlayer(snapshot.screenX, snapshot.screenY)
    this.root.rotation.y = -snapshot.facingRadians
    const desired = snapshot.action ?? (snapshot.moving ? 'Run' : 'Idle')
    this.setAction(desired)
    const delta = Math.min(0.05, Math.max(0, snapshot.deltaSeconds))
    this.actionElapsed = desired === 'Pounce' || desired === 'TailSwipe' ? this.actionElapsed + delta : 0
    const presentation = this.assetStage === 2
      ? SCARLET_HUNTER_PRESENTATION
      : this.assetStage === 1
        ? SCARLET_GECKO_PRESENTATION
        : CORAL_GECKO_PRESENTATION
    const leapBite = desired === 'Pounce'
      ? juvenileLeapBiteMotionFrame(this.actionElapsed, presentation.combat.pounceDurationSeconds)
      : null
    const tailSpin = desired === 'TailSwipe'
      ? juvenileSpinTailSwipeMotionFrame(
          this.actionElapsed,
          presentation.combat.tailSwipeDurationSeconds,
          presentation.combat.tailSwipeContactSeconds,
        )
      : null
    const pounce = leapBite ?? tailSpin ?? quadrupedPounceFrame(
          desired === 'Pounce' ? this.actionElapsed : 0,
          SCARLET_HUNTER_PRESENTATION.combat.pounceDurationSeconds,
          SCARLET_HUNTER_PRESENTATION.combat.pounceMotion.visualTravel,
        )
    this.root.position.x = pounce.forwardOffset
    this.root.position.y = -0.12 + pounce.liftOffset
    this.root.rotation.y = -snapshot.facingRadians + (tailSpin?.yawRadians ?? 0)
    this.root.rotation.z = leapBite?.pitchRadians ?? tailSpin?.pitchRadians ?? 0
    this.mixer?.update(delta)
    this.renderer.render(this.scene, this.camera)
  }

  getState(): MotherMonsterHuntOverlayState {
    const asset = getQuality3DGLBAsset(this.assetStage)
    const presentation = this.assetStage === 2
      ? SCARLET_HUNTER_PRESENTATION
      : this.assetStage === 1
        ? SCARLET_GECKO_PRESENTATION
        : CORAL_GECKO_PRESENTATION
    return {
      ready: this.source === 'glb',
      source: this.source,
      stage: this.assetStage,
      formId: asset?.formId ?? 'missing',
      baselineId: presentation.baselineId,
      profileId: presentation.combat.profileId,
      activeClip: this.activeClip,
      modelUrl: asset?.url ?? 'missing',
      camera: {
        mode: QUALITY_3D_RESCUE_CAMERA.mode,
        fovDegrees: QUALITY_3D_RESCUE_CAMERA.fovDegrees,
        pitchDegrees: QUALITY_3D_RESCUE_CAMERA.pitchDegrees,
        distance: QUALITY_3D_RESCUE_CAMERA.distance,
      },
    }
  }

  dispose() {
    this.disposed = true
    this.mixer?.stopAllAction()
    this.disposeLoadedScene()
    this.scene.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return
      node.geometry.dispose()
      const materials = Array.isArray(node.material) ? node.material : [node.material]
      for (const material of materials) material.dispose()
    })
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }

  private positionOverPlayer(screenX: number, screenY: number) {
    const gameRect = this.phaserCanvas.getBoundingClientRect()
    const containerRect = this.container.getBoundingClientRect()
    const scaleX = gameRect.width / Math.max(1, this.phaserCanvas.width)
    const scaleY = gameRect.height / Math.max(1, this.phaserCanvas.height)
    const cssWidth = RENDER_WIDTH * scaleX
    const cssHeight = RENDER_HEIGHT * scaleY
    Object.assign(this.renderer.domElement.style, {
      left: `${gameRect.left - containerRect.left + screenX * scaleX - cssWidth / 2}px`,
      top: `${gameRect.top - containerRect.top + screenY * scaleY - cssHeight * 0.78}px`,
      width: `${cssWidth}px`,
      height: `${cssHeight}px`,
    })
  }

  private setAction(name: string, force = false) {
    const clipName = this.assetStage <= 1 && name === 'Pounce'
      ? CORAL_GECKO_PRESENTATION.combat.leapBiteMotion.clipName
      : name
    const next = this.actions.get(clipName)
    if (!next || (this.activeClip === name && !force)) return
    const previousClipName = this.assetStage <= 1 && this.activeClip === 'Pounce'
      ? CORAL_GECKO_PRESENTATION.combat.leapBiteMotion.clipName
      : this.activeClip
    const previous = this.actions.get(previousClipName)
    const oneShot = name === 'Bite' || name === 'Claw' || name === 'Pounce' || name === 'TailSwipe' || name === 'Hit' || name === 'Death'
    const presentation = this.assetStage === 2
      ? SCARLET_HUNTER_PRESENTATION
      : this.assetStage === 1
        ? SCARLET_GECKO_PRESENTATION
        : CORAL_GECKO_PRESENTATION
    const attackPlaybackRate = this.assetStage <= 1 && name === 'Pounce'
      ? CORAL_GECKO_PRESENTATION.combat.leapBiteMotion.clipPlaybackRate
      : this.assetStage === 2
      && (name === 'Pounce' || name === 'Claw' || name === 'TailSwipe')
      ? SCARLET_HUNTER_PRESENTATION.combat.attackPlaybackRate[name]
      : 1
    const playbackRate = name === 'Run'
      ? presentation.animation.runPlaybackRate
      : name === 'Turn'
        ? presentation.animation.turnPlaybackRate
        : attackPlaybackRate
    next.setEffectiveTimeScale(playbackRate)
    next.setLoop(oneShot ? THREE.LoopOnce : THREE.LoopRepeat, oneShot ? 1 : Infinity)
    next.clampWhenFinished = oneShot
    const crossfade = oneShot
      ? presentation.combat.oneShotCrossfadeSeconds
      : presentation.animation.crossfadeSeconds
    previous?.fadeOut(crossfade)
    next.reset().fadeIn(crossfade).play()
    this.activeClip = name
    this.actionElapsed = 0
  }

  private disposeLoadedScene() {
    this.mixer?.stopAllAction()
    this.mixer = undefined
    this.actions.clear()
    this.loadedScene?.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return
      node.geometry.dispose()
      const materials = Array.isArray(node.material) ? node.material : [node.material]
      for (const material of materials) material.dispose()
    })
    if (this.loadedScene) this.root.remove(this.loadedScene)
    this.loadedScene = undefined
  }
}
