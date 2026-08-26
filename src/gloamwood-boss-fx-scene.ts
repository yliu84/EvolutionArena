import * as THREE from 'three'

import {
  GLOAMWOOD_BOSS_FX,
  gloamwoodBossFxFillMode,
  gloamwoodBossShapeReach,
  type GloamwoodBossFxFrame,
} from './gloamwood-boss-fx'
import type { GloamwoodValleyBossShape } from './gloamwood-valley-boss'

/**
 * Boss attacks, on screen.
 *
 * Presentation only, and deliberately the *only* thing in the boss feature that
 * touches three.js. It is handed a frame that has already been decided by
 * `gloamwood-boss-fx` and draws it - it never reads creature state, never
 * decides an area, and never reports anything back. Turning this module off
 * entirely changes nothing about what the fight does to the player.
 *
 * What it draws, and why each part is there:
 *
 *   the rim   - the full area, from the first frame of the wind-up. This is the
 *               promise. It never grows and never moves.
 *   the fill  - the same area, growing (or brightening) as the clock runs. This
 *               is the timer, and it is what a player reads with their eyes on
 *               the boss rather than on the ground.
 *   the wash  - the area going bright the instant the blow lands, then fading
 *               over rather longer than the blow itself, because a 0.26s strike
 *               is four frames and four frames of flash reads as nothing.
 *   the wave  - a ring leaving the boss on impact, which is the part that sells
 *               weight. It carries no meaning the rim has not already given.
 *   the light - one point light, moved to whichever boss just landed a blow.
 */

export interface GloamwoodBossFxEntry {
  id: string
  x: number
  z: number
  /** Ground height under the boss, so the decal sits on the floor it fights on. */
  groundY: number
  frame: GloamwoodBossFxFrame | null
}

export interface GloamwoodBossFxScene {
  root: THREE.Group
  /** Trauma the frames asked for, summed. The runtime decides what to do with it. */
  update(entries: readonly GloamwoodBossFxEntry[], delta: number): number
  dispose(): void
}

/**
 * Height the decals float at.
 *
 * Enough to clear the ground mesh's own triangulation without reading as
 * hovering. Boss floors are the flattest ground in the valley - the slots were
 * placed on the route, away from the gates - so a flat decal is the right
 * trade; on a slope its far edge will clip into the hill.
 */
const DECAL_LIFT = 0.14

/**
 * The linear luminance a telegraph line is written at, at full opacity.
 *
 * Chosen against the tone mapper rather than against the number, which is the
 * part two earlier passes got wrong. The scene renders through ACES at an
 * exposure of 1.38, and that curve is deep into its shoulder by the time it
 * reaches these values: 0.55 lands at about 87% brightness on screen, 1.55 at
 * 96%, 2.24 at 98%. Everything above about half a unit is already near-white,
 * and differences that look enormous in the buffer are invisible in the frame.
 *
 * So the outline was too bright at its *authored* colour - amber's own
 * luminance is 0.55 - before anything here touched it, which is why the answer
 * came back "too bright" twice. Gaining it to 1.55 made that worse; taking the
 * gain back to 0.62 would have moved it 87% to 89% and fixed nothing. 0.30 puts
 * it at about 76%, which is a change a player can actually see.
 *
 * Still the brightest thing on the ground it is drawn over: the area it
 * outlines peaks at 0.21, about 67%, and the valley floor under both is far
 * darker than either.
 *
 * The normalisation is the part worth keeping from all this, and it was never
 * about brightness. The bloom pass and the eye both weight green heavily, so
 * writing every telegraph colour at a stated luminance is what stops the
 * enraged red (0.29 on its own) from reading dimmer than the wind-up amber
 * (0.55) - when phase two's entire tell is that nothing changed but the light.
 */
export const GLOAMWOOD_TELEGRAPH_RIM_GLOW = 0.3
const RIM_GLOW = GLOAMWOOD_TELEGRAPH_RIM_GLOW

/**
 * Writes a colour at a stated luminance rather than at its own.
 *
 * Normalised rather than given a per-colour multiplier, because the bloom pass
 * thresholds on luminance and luminance is 71% green. The wind-up amber
 * (`0xffb648`) sits at 0.55 and the enraged red (`0xff5a3c`) at 0.28, so one
 * shared gain would have phase two - the hotter phase, whose whole tell is that
 * nothing changed except the light - glow *less* than phase one, or not at all.
 */
export function writeGlowForReview(target: THREE.Color, hex: number, luminance: number) {
  writeGlow(target, hex, luminance)
}

function writeGlow(target: THREE.Color, hex: number, luminance: number) {
  target.setHex(hex)
  // setHex has already converted to the linear working space, which is the
  // space the pass reads.
  const own = 0.2126 * target.r + 0.7152 * target.g + 0.0722 * target.b
  target.multiplyScalar(luminance / Math.max(1e-4, own))
}

interface FxVisual {
  root: THREE.Group
  /** Rebuilt when the pattern changes, because the area changes with it. */
  patternId?: string
  fill?: THREE.Mesh
  rims: THREE.Mesh[]
  /** The rim again, standing up. See `wallGeometries`. */
  walls: THREE.Mesh[]
  wave: THREE.Mesh
  waveReach: number
  fillMode: 'grow' | 'brighten'
}

export function createGloamwoodBossFxScene(): GloamwoodBossFxScene {
  const root = new THREE.Group()
  root.name = 'GloamwoodBossFx'
  const visuals = new Map<string, FxVisual>()

  // One light for every boss on the map. Two bosses never fight the player at
  // once - they stand a region apart - and a light per boss would be paid for
  // on every frame of a run that never reaches them.
  const flash = new THREE.PointLight(GLOAMWOOD_BOSS_FX.flashColor, 0, 26, 1.7)
  flash.visible = false
  root.add(flash)

  const disposeVisual = (visual: FxVisual) => {
    visual.root.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return
      node.geometry.dispose()
      for (const material of Array.isArray(node.material) ? node.material : [node.material]) material.dispose()
    })
    root.remove(visual.root)
  }

  return {
    root,
    update(entries, delta) {
      let trauma = 0
      let flashStrength = 0
      const present = new Set(entries.map((entry) => entry.id))
      for (const [id, visual] of visuals) {
        if (present.has(id)) continue
        disposeVisual(visual)
        visuals.delete(id)
      }

      for (const entry of entries) {
        let visual = visuals.get(entry.id)
        if (!visual) {
          visual = createVisual()
          visuals.set(entry.id, visual)
          root.add(visual.root)
        }
        const frame = entry.frame
        if (!frame) {
          visual.root.visible = false
          continue
        }
        if (visual.patternId !== frame.patternId) rebuild(visual, frame.shape)
        visual.patternId = frame.patternId
        visual.root.visible = true
        visual.root.position.set(entry.x, entry.groundY + DECAL_LIFT, entry.z)
        // A lane is drawn along where the boss committed to; a disc and a ring
        // are the same in every direction and do not care.
        visual.root.rotation.y = frame.aimRadians

        const color = frame.impact === null ? frame.color : frame.flashColor
        if (visual.fill) {
          const material = visual.fill.material as THREE.MeshBasicMaterial
          material.color.setHex(color)
          material.opacity = frame.fillOpacity
          const grow = visual.fillMode === 'grow'
          const scale = frame.impact === null && grow ? Math.max(0.001, frame.windup) : 1
          visual.fill.scale.set(scale, 1, scale)
        }
        // The pulse rides on top of the rim rather than replacing it, so the
        // outline never disappears between beats - it is the one thing on
        // screen that has to be readable for the whole wind-up.
        const rimOpacity = Math.min(1, frame.rimOpacity * (0.72 + frame.pulse * 0.42))
        // Gained during the wind-up and not during the blow. The wind-up is
        // where the outline is doing work and where it is the only bright thing
        // on the ground; by the time the blow lands the fill, the rim and the
        // wave are stacked on the same pixels and adding a gain on top of that
        // is how the impact became a white hole.
        const windingUp = frame.impact === null
        for (const rim of visual.rims) {
          const material = rim.material as THREE.MeshBasicMaterial
          if (windingUp) writeGlow(material.color, color, RIM_GLOW)
          else material.color.setHex(color)
          material.opacity = rimOpacity
        }
        for (const wall of visual.walls) {
          const material = wall.material as THREE.MeshBasicMaterial
          if (windingUp) writeGlow(material.color, color, RIM_GLOW)
          else material.color.setHex(color)
          material.opacity = rimOpacity * 0.72
        }

        if (frame.impact === null) {
          visual.wave.visible = false
        } else {
          const travel = Math.min(1, frame.impact * 1.4)
          const radius = 0.35 + travel * visual.waveReach
          visual.wave.visible = true
          visual.wave.scale.set(radius, 1, radius)
          const material = visual.wave.material as THREE.MeshBasicMaterial
          // Ungained, deliberately. See the note on RIM_GLOW: at the moment of
          // impact the fill, the rim and this ring are all on the same pixels,
          // and they add.
          material.color.setHex(frame.flashColor)
          // 0.3 rather than 0.9, for the same reason the fill and the rim came
          // down: this ring crosses both of them at the moment they are
          // brightest, and additive layers add.
          material.opacity = (1 - travel) ** 1.5 * 0.3
          flashStrength = Math.max(flashStrength, (1 - Math.min(1, frame.impact * 2)) ** 2)
          if (flashStrength > 0) flash.position.set(entry.x, entry.groundY + 1.6, entry.z)
        }
        trauma += frame.trauma
      }

      // Decayed rather than switched off, so the light does not pop out on the
      // frame the strike ends.
      const target = flashStrength * 5.6
      flash.intensity = target > flash.intensity
        ? target
        : Math.max(0, flash.intensity - delta * 14)
      flash.visible = flash.intensity > 0.01
      return trauma
    },
    dispose() {
      for (const visual of visuals.values()) disposeVisual(visual)
      visuals.clear()
      root.clear()
    },
  }
}

function createVisual(): FxVisual {
  const group = new THREE.Group()
  const wave = new THREE.Mesh(
    new THREE.RingGeometry(0.82, 1, 64).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({
      color: GLOAMWOOD_BOSS_FX.flashColor,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    }),
  )
  wave.position.y = 0.02
  wave.renderOrder = 4
  wave.visible = false
  group.add(wave)
  return { root: group, rims: [], walls: [], wave, waveReach: 1, fillMode: 'grow' }
}

function rebuild(visual: FxVisual, shape: GloamwoodValleyBossShape) {
  for (const mesh of [visual.fill, ...visual.rims, ...visual.walls]) {
    if (!mesh) continue
    visual.root.remove(mesh)
    mesh.geometry.dispose()
    ;(mesh.material as THREE.Material).dispose()
  }
  visual.rims = []
  visual.walls = []

  // Additive rather than blended. The valley's ground is dark green in a dark
  // fog and an amber wash at 0.3 alpha over it is a smudge; added to it, the
  // same amber glows and the area reads from across the arena.
  const fill = new THREE.Mesh(areaGeometry(shape), new THREE.MeshBasicMaterial({
    color: GLOAMWOOD_BOSS_FX.telegraphColor,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  }))
  fill.renderOrder = 3
  visual.root.add(fill)
  visual.fill = fill

  for (const geometry of rimGeometries(shape)) {
    const rim = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
      color: GLOAMWOOD_BOSS_FX.telegraphColor,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    }))
    rim.position.y = 0.01
    rim.renderOrder = 5
    visual.root.add(rim)
    visual.rims.push(rim)
  }

  for (const geometry of wallGeometries(shape)) {
    const wall = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
      color: GLOAMWOOD_BOSS_FX.telegraphColor,
      map: verticalFade(),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    }))
    wall.renderOrder = 6
    visual.root.add(wall)
    visual.walls.push(wall)
  }

  visual.fillMode = gloamwoodBossFxFillMode(shape)
  visual.waveReach = gloamwoodBossShapeReach(shape)
}

/** The area itself, in local space where +X is the direction the boss aimed. */
function areaGeometry(shape: GloamwoodValleyBossShape) {
  if (shape.kind === 'disc') return new THREE.CircleGeometry(shape.radius, 72).rotateX(-Math.PI / 2)
  if (shape.kind === 'ring') {
    return new THREE.RingGeometry(shape.innerRadius, shape.outerRadius, 72).rotateX(-Math.PI / 2)
  }
  // Built from the boss outward so scaling x runs the lane out to its full
  // length rather than growing it from the middle in both directions.
  return new THREE.PlaneGeometry(shape.length, shape.halfWidth * 2)
    .rotateX(-Math.PI / 2)
    .translate(shape.length / 2, 0, 0)
}

/**
 * The outline that shows the whole area for the whole wind-up.
 *
 * A ring gets two, inner and outer, because its inner edge is the safe circle -
 * the one piece of information the pattern exists to teach.
 */
function rimGeometries(shape: GloamwoodValleyBossShape): THREE.BufferGeometry[] {
  // Proportional. A fixed 0.16 band is a hairline around a nine-unit disc and
  // a stripe around a three-unit one.
  const band = Math.max(0.18, gloamwoodBossShapeReach(shape) * 0.045)
  if (shape.kind === 'disc') {
    return [new THREE.RingGeometry(shape.radius - band, shape.radius, 72).rotateX(-Math.PI / 2)]
  }
  if (shape.kind === 'ring') {
    return [
      new THREE.RingGeometry(shape.innerRadius, shape.innerRadius + band, 72).rotateX(-Math.PI / 2),
      new THREE.RingGeometry(shape.outerRadius - band, shape.outerRadius, 72).rotateX(-Math.PI / 2),
    ]
  }
  return [laneRim(shape.length, shape.halfWidth, band)]
}

/** A rectangular outline, as one quad strip around the lane. */
function laneRim(length: number, halfWidth: number, band: number) {
  const outer = [
    [0, -halfWidth], [length, -halfWidth], [length, halfWidth], [0, halfWidth],
  ]
  const inner = [
    [band, -halfWidth + band], [length - band, -halfWidth + band],
    [length - band, halfWidth - band], [band, halfWidth - band],
  ]
  const positions: number[] = []
  for (let corner = 0; corner < 4; corner += 1) {
    const next = (corner + 1) % 4
    const [ax, az] = outer[corner]
    const [bx, bz] = outer[next]
    const [cx, cz] = inner[next]
    const [dx, dz] = inner[corner]
    positions.push(ax, 0, az, bx, 0, bz, cx, 0, cz)
    positions.push(ax, 0, az, cx, 0, cz, dx, 0, dz)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.computeVertexNormals()
  return geometry
}

/**
 * The outline again, standing up.
 *
 * The camera looks down the valley at about thirty degrees and a boss is up to
 * four metres across, so the body hides the half of its own decal that is
 * furthest from the player - which is the half they are about to run through.
 * A short wall of light on the boundary is visible over the creature's
 * shoulder, and it costs one more draw call.
 *
 * It carries no meaning the flat rim has not already given: same boundary,
 * same colour, same clock.
 */
function wallGeometries(shape: GloamwoodValleyBossShape): THREE.BufferGeometry[] {
  const height = Math.min(1.7, 0.55 + gloamwoodBossShapeReach(shape) * 0.06)
  const wall = (radius: number) => new THREE.CylinderGeometry(radius, radius, height, 72, 1, true)
    .translate(0, height / 2, 0)
  if (shape.kind === 'disc') return [wall(shape.radius)]
  if (shape.kind === 'ring') return [wall(shape.innerRadius), wall(shape.outerRadius)]
  const side = (z: number) => new THREE.PlaneGeometry(shape.length, height)
    .translate(shape.length / 2, height / 2, 0)
    .rotateY(0)
    .translate(0, 0, z)
  const end = new THREE.PlaneGeometry(shape.halfWidth * 2, height)
    .rotateY(Math.PI / 2)
    .translate(shape.length, height / 2, 0)
  return [side(-shape.halfWidth), side(shape.halfWidth), end]
}

/**
 * A one-pixel-wide vertical alpha ramp, so a wall fades out at the top.
 *
 * Built in code rather than shipped as an asset: it is eight bytes of gradient,
 * and a texture file is one more thing that can 404 on the deployed site.
 */
let fadeTexture: THREE.Texture | null = null
function verticalFade() {
  if (fadeTexture) return fadeTexture
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 64
  const context = canvas.getContext('2d')
  if (!context) return null
  // Brightest at the ground, gone by the top. The boundary is on the floor;
  // the wall is only there to be seen over the creature standing on it.
  const gradient = context.createLinearGradient(0, 0, 0, 64)
  gradient.addColorStop(0, 'rgba(255,255,255,0)')
  gradient.addColorStop(0.55, 'rgba(255,255,255,0.35)')
  gradient.addColorStop(1, 'rgba(255,255,255,1)')
  context.fillStyle = gradient
  context.fillRect(0, 0, 1, 64)
  fadeTexture = new THREE.CanvasTexture(canvas)
  fadeTexture.colorSpace = THREE.SRGBColorSpace
  return fadeTexture
}
