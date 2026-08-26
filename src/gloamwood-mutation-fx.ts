/**
 * Mutation and rending feedback as skill-style additive particles.
 * Presentation only — never damage, range, healing or who got hit.
 *
 * These are not lit debug meshes. Each burst is a readable skill beat:
 * flash + shape (slash / ring / swallow) + sparks that live in 3D.
 */

import { defineGloamwoodTunable } from './gloamwood-tuning'

export const SKILL_FX_TEXTURE_KINDS = ['glow', 'slash', 'ring', 'streak', 'dust', 'pebble', 'plate'] as const
export type SkillFxTextureKind = (typeof SKILL_FX_TEXTURE_KINDS)[number]

export type MutationFxMotion = 'ballistic' | 'attract' | 'rise' | 'drift' | 'expand' | 'draw'
export type MutationFxBillboard = 'camera' | 'ground' | 'slash'

export type MutationFxBurstId =
  | 'carapace'
  | 'spore-aura'
  | 'spore-preview'
  | 'moult'
  | 'metabolism-gain'
  | 'metabolism-decay'
  | 'regeneration'
  | 'tail-sweep'

/** Body-scale hunting claws: three tapered energy slashes, not a screen overlay. */
export const RENDING_CRACK = {
  cuts: 3,
  durationSeconds: 0.58,
  trauma: 0.2,
  planeWidth: 1.62,
  planeHeight: 1.34,
} as const

export interface MutationFxParticleSpec {
  texture: SkillFxTextureKind
  billboard: MutationFxBillboard
  color: number
  startScale: [number, number]
  endScale: [number, number]
  offset: [number, number, number]
  velocity: [number, number, number]
  spin: number
  duration: number
  delay: number
  gravity: number
  motion: MutationFxMotion
  peakOpacity: number
  roll: number
  /** World-occluded particles sit around the body instead of painting over it. */
  depthTest?: boolean
}

export interface MutationFxBurst {
  trauma: number
  particles: MutationFxParticleSpec[]
}

const TAU = Math.PI * 2

/** Hollow ring around the player. Dust never fills the body. */
export const TAIL_SWEEP_TORUS = {
  innerRadius: 1.48,
  outerRadius: 2.72,
  /** One extra shock band outside the measured body. */
  bodyClearance: 0.7,
} as const

const TAIL_SWEEP_SHOCK = {
  startScale: 0.92,
  endScale: 1.18,
  skirtStart: 4.4,
  skirtEnd: 5.5,
} as const

/** Always-on low haze. Soft enough not to fight telegraphs, feet or other FX. */
const SPORE_MIST_OPACITY = defineGloamwoodTunable({
  id: 'SPORE_HAZE.hazeOpacity', group: 'Sporehaze', label: 'Mist opacity',
  value: 0.12, min: 0, max: 0.4, step: 0.005,
  note: 'The aura slows anything inside it, so its footprint is information. With the orbs gone this is the only thing drawing the edge.',
})
const SPORE_MOTE_SIZE = defineGloamwoodTunable({
  id: 'SPORE_HAZE.moteSize', group: 'Sporehaze', label: 'Spore size',
  value: 0.145, min: 0.02, max: 0.4, step: 0.005,
  note: 'World units. At 0.075 they were 2-5 pixels and effectively invisible.',
})

export const SPORE_HAZE = {
  color: 0xc6e878,
  moteColor: 0xe8f6a8,
  /**
   * The mist. Thin on purpose, but not invisible: this aura slows anything
   * inside it by 40%, so its footprint is information the player needs, and
   * with the orbs gone the mist is the only thing that still draws the edge.
   */
  get hazeOpacity() { return SPORE_MIST_OPACITY.value },
  moteOpacity: 0.9,
  height: 0.18,
  radiusScale: 1.22,
  /**
   * The mist is one ground-following disc, not a pile of flat quads.
   *
   * The quads were placed at the player's own ground height and left flat, so
   * anywhere the terrain rose more than a few centimetres inside the aura the
   * ground won the depth test and sliced the mist off along a contour - a hard
   * straight edge with nothing on the far side of it. A disc whose vertices
   * each sample the terrain cannot do that.
   */
  mistRings: 7,
  mistSegments: 30,
  /** How far above the ground each vertex floats. Enough to clear grass. */
  mistLift: 0.12,
  /**
   * Spores, and there are a lot of them now.
   *
   * This used to be six sprites a metre across, drawn with the same soft radial
   * gradient as the mist, and at the game's camera distance they read as a
   * handful of pale bubbles parked around the animal rather than as anything
   * airborne. Many small points of light carry the idea far better: individually
   * they are too small to read as objects, so what the eye gets is a *drift*.
   */
  moteCount: 84,
  /** World units. Small enough that a single one is a spark, not a ball. */
  get moteSize() { return SPORE_MOTE_SIZE.value },
  /** How high a spore climbs over its life before it fades and restarts. */
  moteRise: 1.35,
}

export function sporeHazeLayout(radius: number) {
  const span = Math.max(1.4, radius) * SPORE_HAZE.radiusScale
  const motes: Array<{
    local: [number, number, number]
    size: number
    phase: number
    angle: number
    distance: number
    rise: number
    drift: number
    twinkle: number
  }> = []
  for (let index = 0; index < SPORE_HAZE.moteCount; index += 1) {
    // Golden-angle bearings and a square-rooted radius, which is what spreads
    // points evenly over a disc rather than crowding them at the middle.
    const angle = index * 2.399963
    const distance = span * Math.sqrt(((index * 0.6180339887) % 1)) * 0.94
    const phase = (index * 0.7548776662) % 1
    const size = SPORE_HAZE.moteSize * (0.7 + ((index * 0.3819660113) % 1) * 0.8)
    motes.push({
      // Kept for anything that wants a static position; the runtime animates
      // these from the parameters below.
      local: [Math.cos(angle) * distance, SPORE_HAZE.height + phase * 0.3, Math.sin(angle) * distance],
      size,
      phase,
      angle,
      distance,
      // Each spore climbs at its own rate, so the cloud never pulses as one.
      rise: 0.16 + ((index * 0.5436890127) % 1) * 0.22,
      drift: (index % 2 === 0 ? 1 : -1) * (0.05 + ((index * 0.4501477) % 1) * 0.12),
      twinkle: 1.4 + ((index * 0.2360679) % 1) * 3.2,
    })
  }
  return {
    radius: span,
    color: SPORE_HAZE.color,
    moteColor: SPORE_HAZE.moteColor,
    hazeOpacity: SPORE_HAZE.hazeOpacity,
    moteOpacity: SPORE_HAZE.moteOpacity,
    moteRise: SPORE_HAZE.moteRise,
    mistRings: SPORE_HAZE.mistRings,
    mistSegments: SPORE_HAZE.mistSegments,
    mistLift: SPORE_HAZE.mistLift,
    motes,
  }
}

export function paintSporeHazePatch(context: CanvasRenderingContext2D, width: number, height: number) {
  context.clearRect(0, 0, width, height)
  const cx = width / 2
  const cy = height / 2
  const haze = context.createRadialGradient(cx, cy, width * 0.06, cx, cy, width * 0.5)
  haze.addColorStop(0, 'rgba(255,255,255,0.82)')
  haze.addColorStop(0.42, 'rgba(255,255,255,0.38)')
  haze.addColorStop(0.78, 'rgba(255,255,255,0.1)')
  haze.addColorStop(1, 'rgba(255,255,255,0)')
  context.fillStyle = haze
  context.fillRect(0, 0, width, height)
}

/** Hourglass veins on the flanks. Gain climbs; decay sheds. Not floating orbs. */
export const METABOLIC_VEINS = {
  gainColor: 0xf4b45a,
  decayColor: 0xc45b6c,
  peakOpacity: 0.78,
  rows: 3,
} as const

export function metabolicVeinLayout(bodyRadius: number) {
  const radius = Math.max(1.05, bodyRadius)
  const veins: Array<{ local: [number, number, number]; width: number; height: number; row: number }> = []
  for (const side of [-1, 1] as const) {
    for (let row = 0; row < METABOLIC_VEINS.rows; row += 1) {
      veins.push({
        local: [
          side * radius * (0.4 + row * 0.06),
          -0.14 + row * 0.34,
          0.12 - row * 0.1,
        ],
        width: 0.28 + row * 0.03,
        height: 0.46,
        row,
      })
    }
  }
  return {
    veins,
    gainColor: METABOLIC_VEINS.gainColor,
    decayColor: METABOLIC_VEINS.decayColor,
    peakOpacity: METABOLIC_VEINS.peakOpacity,
  }
}

/** Two triangles sharing a waist: the mutation's hourglass, not a disc. */
export function paintMetabolicChevron(context: CanvasRenderingContext2D, width: number, height: number) {
  context.clearRect(0, 0, width, height)
  const cx = width / 2
  const top = height * 0.08
  const waist = height * 0.5
  const bottom = height * 0.92
  const half = width * 0.36
  const inner = width * 0.08
  const hourglass = (spread: number) => {
    context.beginPath()
    context.moveTo(cx, top)
    context.lineTo(cx + spread, waist)
    context.lineTo(cx, bottom)
    context.lineTo(cx - spread, waist)
    context.closePath()
  }
  hourglass(half)
  const fill = context.createLinearGradient(cx, top, cx, bottom)
  fill.addColorStop(0, 'rgba(255,255,255,0.2)')
  fill.addColorStop(0.5, 'rgba(255,255,255,1)')
  fill.addColorStop(1, 'rgba(255,255,255,0.2)')
  context.fillStyle = fill
  context.fill()
  hourglass(inner)
  context.globalCompositeOperation = 'destination-out'
  context.fillStyle = 'rgba(0,0,0,1)'
  context.fill()
  context.globalCompositeOperation = 'source-over'
}

/** Presentation layout. Grows with the standing body; never changes hit radius. */
export function tailSweepLayout(bodyRadius: number) {
  const innerRadius = Math.max(
    TAIL_SWEEP_TORUS.innerRadius,
    bodyRadius + TAIL_SWEEP_TORUS.bodyClearance,
  )
  const scale = innerRadius / TAIL_SWEEP_TORUS.innerRadius
  return {
    innerRadius,
    scale,
    shockStart: TAIL_SWEEP_SHOCK.startScale * scale,
    shockEnd: TAIL_SWEEP_SHOCK.endScale * scale,
    skirtStart: TAIL_SWEEP_SHOCK.skirtStart * scale,
    skirtEnd: TAIL_SWEEP_SHOCK.skirtEnd * scale,
  }
}

export function paintSkillFxTexture(
  kind: SkillFxTextureKind,
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  context.clearRect(0, 0, width, height)
  if (kind === 'glow') paintGlow(context, width, height)
  else if (kind === 'slash') paintSlash(context, width, height)
  else if (kind === 'ring') paintRing(context, width, height)
  else if (kind === 'dust') paintDust(context, width, height)
  else if (kind === 'pebble') paintPebble(context, width, height)
  else if (kind === 'plate') paintCarapacePlate(context, width, height)
  else paintStreak(context, width, height)
}

/** Hex chitin scale: solid plate with a bright rim. Not a magic disc. */
export function paintCarapacePlate(context: CanvasRenderingContext2D, width: number, height: number) {
  context.clearRect(0, 0, width, height)
  const cx = width / 2
  const cy = height / 2
  const radius = width * 0.42
  const hex = (size: number) => {
    context.beginPath()
    for (let index = 0; index < 6; index += 1) {
      const angle = (index / 6) * TAU - Math.PI / 6
      const x = cx + Math.cos(angle) * size
      const y = cy + Math.sin(angle) * size * 1.12
      if (index === 0) context.moveTo(x, y)
      else context.lineTo(x, y)
    }
    context.closePath()
  }
  hex(radius)
  const fill = context.createRadialGradient(cx, cy - radius * 0.18, radius * 0.06, cx, cy, radius)
  fill.addColorStop(0, 'rgba(255,255,255,0.55)')
  fill.addColorStop(0.42, 'rgba(255,255,255,0.78)')
  fill.addColorStop(0.78, 'rgba(255,255,255,0.9)')
  fill.addColorStop(1, 'rgba(255,255,255,0)')
  context.fillStyle = fill
  context.fill()
  context.strokeStyle = 'rgba(255,255,255,1)'
  context.lineWidth = width * 0.07
  context.lineJoin = 'round'
  context.stroke()
  context.strokeStyle = 'rgba(255,255,255,0.55)'
  context.lineWidth = width * 0.022
  hex(radius * 0.62)
  context.stroke()
}

/**
 * Thick hex plates on an ellipsoid around the torso.
 * Local space: +X right, +Y up from chest, +Z forward. Never a flat card.
 */
export function carapaceShellLayout(bodyRadius: number) {
  const radius = Math.max(1.05, bodyRadius)
  const rx = radius * 0.92
  const ry = radius * 0.58
  const rz = radius * 1.08
  const plates: Array<{ local: [number, number, number]; size: number }> = []
  const rings = [
    { phi: 0.78, count: 6, size: 0.46, stagger: 0.12 },
    { phi: 0.32, count: 10, size: 0.4, stagger: 0.2 },
    { phi: -0.06, count: 9, size: 0.34, stagger: 0.08 },
  ] as const
  for (const ring of rings) {
    for (let index = 0; index < ring.count; index += 1) {
      const theta = (index / ring.count) * TAU + ring.stagger
      const forwardness = Math.cos(theta)
      if (forwardness > 0.78 && ring.phi < 0.55) continue
      const radial = Math.cos(ring.phi)
      plates.push({
        local: [
          Math.sin(theta) * radial * rx,
          Math.sin(ring.phi) * ry,
          Math.cos(theta) * radial * rz,
        ],
        size: ring.size * Math.sqrt(radius / 1.2),
      })
    }
  }
  return plates
}

/** Dorsal half-width. Wide enough to wrap the flanks; nuchal and pygal taper. */
export function moultCarapaceHalfWidth(x: number) {
  const t = Math.min(1, Math.max(0, (x + 1) / 2))
  return 0.82 + 0.3 * Math.sin(Math.PI * t ** 0.72)
}

function moultCarapaceGroove(x: number, v: number) {
  const along = ((x + 1) / 2) * 5
  const across = v * 3.2
  const dist = Math.min(
    Math.abs(along - Math.round(along)),
    Math.abs(across - Math.round(across)),
  )
  return Math.max(0, 0.12 - dist) / 0.12
}

/** Vaulted turtle scute surface. x -1 tail … 1 head, v 0 spine … 1 rim. */
export function moultCarapaceVertex(x: number, v: number, side: 1 | -1) {
  const clampedV = Math.min(1, Math.max(0, v))
  const half = moultCarapaceHalfWidth(x)
  const scallop = 1 + 0.045 * Math.sin(((x + 1) / 2) * 5 * Math.PI) * clampedV * clampedV
  const z = side * half * clampedV * scallop
  const keel = Math.max(0, 1 - clampedV / 0.22) * (1 - x * x) * 0.06
  const dome = Math.max(0, 1 - x * x * 0.92 - clampedV * clampedV * 0.88)
  const groove = moultCarapaceGroove(x, clampedV)
  const y = 0.78 * dome ** 0.62 + keel
  const groovedY = y * (1 - 0.06 * groove * groove) - 0.016 * groove
  return {
    position: [x, Math.max(0.1, groovedY), z] as [number, number, number],
    groove,
    keel,
  }
}

/** Equal-sided rhombi in xz, lifted onto a dome. Seams are scute grooves, not outlines. */
export const MOULT_RHOMBUS = {
  stepX: 0.34,
  stepZ: 0.24,
  fillOpacity: 0.48,
  edgeWidth: 0.0035,
  edgeOpacity: 0.36,
  overlap: 1,
} as const

export const MOULT_VAULT = { rx: 1.06, rz: 0.94, hy: 0.82, rim: 0.1 } as const

/** Low ellipsoid cap. Keep it a shell, not a tent. */
export function moultVaultPoint(x: number, z: number): [number, number, number] {
  const { rx, rz, hy, rim } = MOULT_VAULT
  const r2 = (x / rx) ** 2 + (z / rz) ** 2
  const y = r2 >= 1 ? rim : rim + (hy - rim) * Math.sqrt(Math.max(0, 1 - r2))
  return [x, y, z]
}

/** Crown holds more of the shell; the rim fades out. */
export function moultVaultAlpha(y: number) {
  const t = Math.min(1, Math.max(0, (y - MOULT_VAULT.rim) / (MOULT_VAULT.hy - MOULT_VAULT.rim)))
  return 0.22 + 0.78 * t * t
}

/** Same pale keratin family, only a little richer at the crown. */
export function moultVaultShade(y: number): [number, number, number] {
  const t = Math.min(1, Math.max(0, (y - MOULT_VAULT.rim) / (MOULT_VAULT.hy - MOULT_VAULT.rim)))
  const crown: [number, number, number] = [0.89, 0.76, 0.52]
  const rim: [number, number, number] = [0.95, 0.88, 0.72]
  return [
    rim[0] + (crown[0] - rim[0]) * t,
    rim[1] + (crown[1] - rim[1]) * t,
    rim[2] + (crown[2] - rim[2]) * t,
  ]
}

function vecSub(a: [number, number, number], b: [number, number, number]): [number, number, number] {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}

function vecCross(a: [number, number, number], b: [number, number, number]): [number, number, number] {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}

function vecNormalize(a: [number, number, number]): [number, number, number] {
  const length = Math.hypot(a[0], a[1], a[2]) || 1
  return [a[0] / length, a[1] / length, a[2] / length]
}

function vecScale(a: [number, number, number], s: number): [number, number, number] {
  return [a[0] * s, a[1] * s, a[2] * s]
}

function vecAdd(a: [number, number, number], b: [number, number, number]): [number, number, number] {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
}

function vecDot(a: [number, number, number], b: [number, number, number]) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

function vecDist(a: [number, number, number], b: [number, number, number]) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
}

/** One half-shell: equal-sided rhombi on a dome, plus thin scute grooves. */
export function moultRhombusMeshData(side: 1 | -1) {
  const { stepX, stepZ, edgeWidth, overlap } = MOULT_RHOMBUS
  const positions: number[] = []
  const normals: number[] = []
  const colors: number[] = []
  const alphas: number[] = []
  const edgePositions: number[] = []
  const edgeNormals: number[] = []
  const edgeAlphas: number[] = []
  const pushTri = (
    target: number[],
    targetNormals: number[],
    p: [number, number, number],
    q: [number, number, number],
    r: [number, number, number],
    normal: [number, number, number],
  ) => {
    const isFill = target === positions
    for (const point of [p, q, r]) {
      target.push(point[0], point[1], point[2])
      targetNormals.push(normal[0], normal[1], normal[2])
      const alpha = moultVaultAlpha(point[1])
      if (isFill) {
        alphas.push(alpha)
        colors.push(...moultVaultShade(point[1]))
      } else {
        edgeAlphas.push(alpha)
      }
    }
  }
  const pushFace = (
    a: [number, number, number],
    b: [number, number, number],
    c: [number, number, number],
    target: number[] = positions,
    targetNormals: number[] = normals,
  ) => {
    let normal = vecNormalize(vecCross(vecSub(b, a), vecSub(c, a)))
    if (normal[1] < 0) {
      normal = vecScale(normal, -1)
      pushTri(target, targetNormals, a, c, b, normal)
      return
    }
    pushTri(target, targetNormals, a, b, c, normal)
  }
  const pushGroove = (
    a: [number, number, number],
    b: [number, number, number],
    centroid: [number, number, number],
    normal: [number, number, number],
  ) => {
    const alongEdge = vecNormalize(vecSub(b, a))
    const toCenter = vecSub(centroid, a)
    const inward = vecNormalize(vecSub(toCenter, vecScale(alongEdge, vecDot(toCenter, alongEdge))))
    const half = edgeWidth * 0.5
    const lift = vecScale(normal, 0.002)
    const aOut = vecAdd(vecAdd(a, vecScale(inward, -half)), lift)
    const bOut = vecAdd(vecAdd(b, vecScale(inward, -half)), lift)
    const aIn = vecAdd(vecAdd(a, vecScale(inward, half)), lift)
    const bIn = vecAdd(vecAdd(b, vecScale(inward, half)), lift)
    pushFace(aOut, bOut, bIn, edgePositions, edgeNormals)
    pushFace(aOut, bIn, aIn, edgePositions, edgeNormals)
  }
  let facets = 0
  let maxSideRatio = 1
  const point = (i: number, j: number) => moultVaultPoint(i * stepX - 0.12, side * j * stepZ)
  for (let i = -6; i <= 6; i += 1) {
    for (let j = 1; j <= 6; j += 1) {
      if (((i + j) & 1) !== 0) continue
      const cx = i * stepX - 0.12
      const czAbs = j * stepZ
      if ((cx * cx) / (1.16 * 1.16) + (czAbs * czAbs) / (0.98 * 0.98) > 1) continue
      const west = point(i - 1, j)
      const south = point(i, j - 1)
      const east = point(i + 1, j)
      const north = point(i, j + 1)
      const centroid: [number, number, number] = [
        (west[0] + south[0] + east[0] + north[0]) / 4,
        (west[1] + south[1] + east[1] + north[1]) / 4,
        (west[2] + south[2] + east[2] + north[2]) / 4,
      ]
      let normal = vecNormalize(vecCross(vecSub(east, west), vecSub(north, south)))
      if (normal[1] < 0) normal = vecScale(normal, -1)
      const grow = (vertex: [number, number, number]) => (
        vecAdd(centroid, vecScale(vecSub(vertex, centroid), overlap))
      )
      const W = grow(west)
      const S = grow(south)
      const E = grow(east)
      const N = grow(north)
      const sides = [vecDist(W, S), vecDist(S, E), vecDist(E, N), vecDist(N, W)]
      const longest = Math.max(...sides)
      const shortest = Math.min(...sides) || 1
      maxSideRatio = Math.max(maxSideRatio, longest / shortest)
      pushFace(W, S, E)
      pushFace(W, E, N)
      pushGroove(W, S, centroid, normal)
      pushGroove(S, E, centroid, normal)
      pushGroove(E, N, centroid, normal)
      pushGroove(N, W, centroid, normal)
      facets += 1
    }
  }
  return { positions, normals, colors, alphas, edgePositions, edgeNormals, edgeAlphas, facets, maxSideRatio }
}

/** Hovering keratin cap above the back. Splits in the air; never drops to the ground. */
export function moultHuskLayout(bodyRadius: number) {
  const radius = Math.max(1.05, bodyRadius)
  return {
    color: 0xe2c48a,
    edgeColor: 0xd4b57a,
    edgeOpacity: MOULT_RHOMBUS.edgeOpacity,
    lift: radius * 0.9,
    shiftBack: radius * 0.22,
    peakOpacity: MOULT_RHOMBUS.fillOpacity,
    scale: [radius * 1.18, radius * 0.82, radius * 1.0] as const,
    sides: [
      { half: 'right' as const, peel: 1, spin: 0.18 },
      { half: 'left' as const, peel: -1, spin: -0.18 },
    ] as const,
  }
}

/** Fat middle, needle tips. Constant width is a worm, not a claw. */
export function rendingSlashEnvelope(t: number) {
  const clamped = Math.min(1, Math.max(0, t))
  return (Math.min(clamped, 1 - clamped) * 2) ** 0.65
}

function hash11(n: number) {
  const value = Math.sin(n * 127.1) * 43758.5453
  return value - Math.floor(value)
}

/** Three jagged hunting claws: white-hot core, orange body, needle tips, embers. */
export function paintRendingScratch(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  context.clearRect(0, 0, width, height)
  context.shadowBlur = 0
  const slashes = [
    { x0: width * 0.18, y0: height * 0.72, x1: width * 0.84, y1: height * 0.2, seed: 2.4 },
    { x0: width * 0.2, y0: height * 0.84, x1: width * 0.82, y1: height * 0.34, seed: 6.8 },
    { x0: width * 0.16, y0: height * 0.6, x1: width * 0.86, y1: height * 0.1, seed: 11.2 },
  ]
  for (const slash of slashes) {
    fillTaperedSlash(context, slash, width * 0.028, 'rgba(255, 36, 8, 1)', slash.seed)
    fillTaperedSlash(context, slash, width * 0.016, 'rgba(255, 140, 28, 1)', slash.seed + 1)
    fillTaperedSlash(context, slash, width * 0.007, 'rgba(255, 252, 230, 1)', slash.seed + 2)
  }
}

function fillTaperedSlash(
  context: CanvasRenderingContext2D,
  slash: { x0: number; y0: number; x1: number; y1: number; seed: number },
  maxHalfWidth: number,
  fill: string,
  seed: number,
) {
  const steps = 32
  const dx = slash.x1 - slash.x0
  const dy = slash.y1 - slash.y0
  const length = Math.hypot(dx, dy) || 1
  const nx = -dy / length
  const ny = dx / length
  const left: Array<[number, number]> = []
  const right: Array<[number, number]> = []
  for (let step = 0; step <= steps; step += 1) {
    const t = step / steps
    const envelope = rendingSlashEnvelope(t)
    const jag = (hash11(step * 1.9 + seed) - 0.5) * maxHalfWidth * 0.22 * envelope
    const half = Math.max(maxHalfWidth * envelope * 0.18, maxHalfWidth * envelope + jag)
    const x = slash.x0 + dx * t
    const y = slash.y0 + dy * t
    left.push([x + nx * half, y + ny * half])
    right.push([x - nx * half, y - ny * half])
  }
  context.fillStyle = fill
  context.beginPath()
  context.moveTo(left[0][0], left[0][1])
  for (const point of left) context.lineTo(point[0], point[1])
  for (let index = right.length - 1; index >= 0; index -= 1) {
    context.lineTo(right[index][0], right[index][1])
  }
  context.closePath()
  context.fill()
}

export function mutationFxBurst(id: MutationFxBurstId, facing = 0, bodyRadius = 0): MutationFxBurst {
  if (id === 'carapace') return carapaceBurst(facing, bodyRadius)
  if (id === 'spore-aura') return sporeBurst(facing, false)
  if (id === 'spore-preview') return sporeBurst(facing, true)
  if (id === 'moult') return moultBurst(facing, bodyRadius)
  if (id === 'metabolism-gain') return metabolismBurst(facing, true)
  if (id === 'metabolism-decay') return metabolismBurst(facing, false)
  if (id === 'tail-sweep') return tailSweepBurst(facing, bodyRadius)
  return regenerationBurst(facing)
}

function spec(partial: MutationFxParticleSpec): MutationFxParticleSpec {
  return partial
}

export function rendingSparkBurst(): MutationFxParticleSpec[] {
  const particles: MutationFxParticleSpec[] = []
  for (let index = 0; index < 6; index += 1) {
    const angle = index * 0.71
    particles.push(spec({
      texture: 'glow',
      billboard: 'camera',
      color: index % 2 === 0 ? 0xffe7a8 : 0xff4a12,
      startScale: [0.13, 0.13],
      endScale: [0.03, 0.03],
      offset: [Math.cos(angle) * 0.1, 0.06 + index * 0.012, Math.sin(angle) * 0.1],
      velocity: [Math.cos(angle) * 1.15, 0.85, Math.sin(angle) * 1.15],
      spin: 0,
      duration: 0.3,
      delay: index * 0.012,
      gravity: 2.6,
      motion: 'ballistic',
      peakOpacity: 0.92,
      roll: 0,
    }))
  }
  return particles
}

function paintGlow(context: CanvasRenderingContext2D, width: number, height: number) {
  const cx = width / 2
  const cy = height / 2
  const glow = context.createRadialGradient(cx, cy, 1, cx, cy, width * 0.48)
  glow.addColorStop(0, 'rgba(255,255,255,1)')
  glow.addColorStop(0.18, 'rgba(255,255,255,.92)')
  glow.addColorStop(0.42, 'rgba(255,255,255,.28)')
  glow.addColorStop(1, 'rgba(255,255,255,0)')
  context.fillStyle = glow
  context.fillRect(0, 0, width, height)
}

function paintSlash(context: CanvasRenderingContext2D, width: number, height: number) {
  context.save()
  context.translate(width * 0.06, height * 0.62)
  context.rotate(-0.22)
  context.lineCap = 'round'
  const stroke = context.createLinearGradient(0, 0, width * 0.92, 0)
  stroke.addColorStop(0, 'rgba(255,255,255,0)')
  stroke.addColorStop(0.14, 'rgba(255,255,255,.9)')
  stroke.addColorStop(0.5, 'rgba(255,255,255,1)')
  stroke.addColorStop(0.84, 'rgba(255,255,255,.88)')
  stroke.addColorStop(1, 'rgba(255,255,255,0)')
  context.strokeStyle = stroke
  context.shadowColor = 'rgba(255,255,255,1)'
  context.shadowBlur = 28
  context.beginPath()
  context.moveTo(10, 6)
  context.quadraticCurveTo(width * 0.48, -height * 0.42, width * 0.9, 2)
  context.lineWidth = height * 0.42
  context.stroke()
  context.shadowBlur = 8
  context.lineWidth = height * 0.16
  context.stroke()
  context.restore()
}

function paintRing(context: CanvasRenderingContext2D, width: number, height: number) {
  const cx = width / 2
  const cy = height / 2
  const outer = width * 0.44
  context.strokeStyle = 'rgba(255,255,255,.95)'
  context.lineWidth = width * 0.055
  context.shadowColor = 'rgba(255,255,255,.8)'
  context.shadowBlur = 16
  context.beginPath()
  context.arc(cx, cy, outer, 0, TAU)
  context.stroke()
  context.lineWidth = width * 0.018
  context.globalAlpha = 0.55
  context.beginPath()
  context.arc(cx, cy, outer * 0.72, 0, TAU)
  context.stroke()
}

function paintStreak(context: CanvasRenderingContext2D, width: number, height: number) {
  const cx = width / 2
  const glow = context.createLinearGradient(cx, 0, cx, height)
  glow.addColorStop(0, 'rgba(255,255,255,0)')
  glow.addColorStop(0.35, 'rgba(255,255,255,.55)')
  glow.addColorStop(0.5, 'rgba(255,255,255,1)')
  glow.addColorStop(0.7, 'rgba(255,255,255,.4)')
  glow.addColorStop(1, 'rgba(255,255,255,0)')
  context.fillStyle = glow
  context.beginPath()
  context.ellipse(cx, height * 0.5, width * 0.18, height * 0.48, 0, 0, TAU)
  context.fill()
}

function paintDust(context: CanvasRenderingContext2D, width: number, height: number) {
  const cx = width / 2
  const cy = height / 2
  for (let index = 0; index < 14; index += 1) {
    const ox = (hash11(index * 2.7) - 0.5) * width * 0.36
    const oy = (hash11(index * 4.1) - 0.5) * height * 0.36
    const radius = width * (0.09 + hash11(index + 8) * 0.13)
    const glow = context.createRadialGradient(cx + ox, cy + oy, 0, cx + ox, cy + oy, radius)
    glow.addColorStop(0, 'rgba(255,255,255,0.38)')
    glow.addColorStop(0.5, 'rgba(255,255,255,0.14)')
    glow.addColorStop(1, 'rgba(255,255,255,0)')
    context.fillStyle = glow
    context.beginPath()
    context.arc(cx + ox, cy + oy, radius, 0, TAU)
    context.fill()
  }
}

function paintPebble(context: CanvasRenderingContext2D, width: number, height: number) {
  context.save()
  context.translate(width / 2, height / 2)
  context.beginPath()
  const sides = 6
  for (let index = 0; index < sides; index += 1) {
    const angle = (index / sides) * TAU
    const radius = (0.26 + hash11(index * 2.4) * 0.2) * width
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius * 0.82
    if (index === 0) context.moveTo(x, y)
    else context.lineTo(x, y)
  }
  context.closePath()
  context.fillStyle = 'rgba(255,255,255,1)'
  context.fill()
  context.restore()
}

/** Attack shock annulus: clear hole, readable band, soft inner/outer falloff. */
export function paintTailSweepHalo(context: CanvasRenderingContext2D, width: number, height: number) {
  context.clearRect(0, 0, width, height)
  const cx = width / 2
  const cy = height / 2
  const falloff = context.createRadialGradient(cx, cy, width * 0.24, cx, cy, width * 0.46)
  falloff.addColorStop(0, 'rgba(255,255,255,0)')
  falloff.addColorStop(0.18, 'rgba(255,255,255,0)')
  falloff.addColorStop(0.34, 'rgba(255,255,255,0.22)')
  falloff.addColorStop(0.5, 'rgba(255,255,255,0.82)')
  falloff.addColorStop(0.66, 'rgba(255,255,255,0.28)')
  falloff.addColorStop(1, 'rgba(255,255,255,0)')
  context.fillStyle = falloff
  context.fillRect(0, 0, width, height)
}

function tailSweepBurst(facing: number, bodyRadius = 0): MutationFxBurst {
  const layout = tailSweepLayout(bodyRadius)
  const sizeScale = Math.sqrt(layout.scale)
  const particles: MutationFxParticleSpec[] = []
  for (let index = 0; index < 12; index += 1) {
    const angle = facing + (index / 12) * TAU
    const dx = Math.cos(angle)
    const dz = -Math.sin(angle)
    const radius = layout.innerRadius + 0.15 + (index % 2) * 0.28
    particles.push(spec({
      texture: 'streak', billboard: 'camera',
      color: 0xd2b48a,
      startScale: [0.16 * sizeScale, 0.72 * sizeScale], endScale: [0.08 * sizeScale, 0.28 * sizeScale],
      offset: [dx * radius, 0.2, dz * radius],
      velocity: [dx * 3.6, 0.4, dz * 3.6],
      spin: 0, duration: 0.22, delay: index * 0.006, gravity: 4.2,
      motion: 'ballistic', peakOpacity: 0.78, roll: angle, depthTest: true,
    }))
  }
  for (let index = 0; index < 14; index += 1) {
    const angle = facing + (index / 14) * TAU + 0.11
    const dx = Math.cos(angle)
    const dz = -Math.sin(angle)
    const radius = layout.innerRadius + 0.22 + (index % 2) * 0.32
    const size = (0.3 + (index % 3) * 0.06) * sizeScale
    particles.push(spec({
      texture: 'dust', billboard: 'camera',
      color: index % 2 ? 0xc4a882 : 0x8a6a48,
      startScale: [size, size], endScale: [size * 0.5, size * 0.5],
      offset: [dx * radius, 0.2, dz * radius],
      velocity: [dx * (2.2 + (index % 3) * 0.35), 0.55, dz * (2.2 + (index % 3) * 0.35)],
      spin: 1.1, duration: 0.36, delay: index * 0.007, gravity: 7.8,
      motion: 'ballistic', peakOpacity: 0.68, roll: 0, depthTest: true,
    }))
  }
  for (let index = 0; index < 16; index += 1) {
    const angle = facing + (index / 16) * TAU
    const dx = Math.cos(angle)
    const dz = -Math.sin(angle)
    const radius = layout.innerRadius + 0.18 + (index % 3) * 0.28
    const size = (0.2 + (index % 3) * 0.05) * sizeScale
    particles.push(spec({
      texture: 'pebble', billboard: 'camera',
      color: index % 2 ? 0x8a6a44 : 0x3a2a1c,
      startScale: [size, size], endScale: [size * 0.45, size * 0.45],
      offset: [dx * radius, 0.22, dz * radius],
      velocity: [dx * (2.4 + (index % 3) * 0.4), 1.55 + (index % 4) * 0.28, dz * (2.4 + (index % 3) * 0.4)],
      spin: 5.4, duration: 0.52, delay: index * 0.007, gravity: 9.0,
      motion: 'ballistic', peakOpacity: 0.92, roll: angle, depthTest: true,
    }))
  }
  return { trauma: 0.34, particles }
}

function carapaceBurst(facing: number, bodyRadius = 0): MutationFxBurst {
  const scale = Math.max(1, (bodyRadius || 1.2) / 1.2)
  const particles: MutationFxParticleSpec[] = []
  for (let index = 0; index < 10; index += 1) {
    const angle = facing + (index / 10) * TAU
    const dx = Math.cos(angle)
    const dz = -Math.sin(angle)
    const size = (0.2 + (index % 2) * 0.06) * Math.sqrt(scale)
    particles.push(spec({
      texture: 'dust', billboard: 'camera',
      color: 0xb89a72,
      startScale: [size, size], endScale: [size * 0.4, size * 0.4],
      offset: [dx * 0.7 * scale, 0.55 + (index % 3) * 0.12, dz * 0.7 * scale],
      velocity: [dx * 1.5, 0.45, dz * 1.5],
      spin: 1.1, duration: 0.34, delay: index * 0.01, gravity: 6.2,
      motion: 'ballistic', peakOpacity: 0.58, roll: 0, depthTest: true,
    }))
  }
  return { trauma: 0.26, particles }
}

function sporeBurst(_facing: number, preview: boolean): MutationFxBurst {
  if (!preview) return { trauma: 0, particles: [] }
  const particles: MutationFxParticleSpec[] = []
  for (let index = 0; index < 8; index += 1) {
    const angle = index * (TAU / 8)
    const dx = Math.cos(angle)
    const dz = Math.sin(angle)
    particles.push(spec({
      texture: 'dust', billboard: 'ground', color: SPORE_HAZE.color,
      startScale: [0.9, 0.9], endScale: [1.6, 1.6],
      offset: [dx * 0.7, 0.08, dz * 0.7], velocity: [dx * 0.2, 0.12, dz * 0.2],
      spin: 0.15, duration: 0.7, delay: index * 0.02, gravity: 0,
      motion: 'drift', peakOpacity: 0.22, roll: 0, depthTest: true,
    }))
  }
  return { trauma: 0, particles }
}

function moultBurst(_facing: number, _bodyRadius = 0): MutationFxBurst {
  return { trauma: 0.34, particles: [] }
}

function metabolismBurst(_facing: number, gain: boolean): MutationFxBurst {
  const particles: MutationFxParticleSpec[] = []
  const count = gain ? 8 : 10
  for (let index = 0; index < count; index += 1) {
    const angle = index * (TAU / count) + 0.2
    const dx = Math.cos(angle)
    const dz = Math.sin(angle)
    particles.push(spec({
      texture: gain ? 'streak' : 'dust',
      billboard: gain ? 'slash' : 'camera',
      color: gain ? METABOLIC_VEINS.gainColor : METABOLIC_VEINS.decayColor,
      startScale: gain ? [0.16, 0.42] : [0.18, 0.18],
      endScale: gain ? [0.08, 0.22] : [0.1, 0.1],
      offset: [dx * 0.32, gain ? 0.28 + (index % 3) * 0.12 : 0.72 + (index % 4) * 0.1, dz * 0.32],
      velocity: [dx * 0.08, gain ? 1.35 : -1.15, dz * 0.08],
      spin: gain ? 0.2 : 0.6,
      duration: gain ? 0.55 : 0.7,
      delay: index * 0.02,
      gravity: gain ? 0.1 : 2.1,
      motion: gain ? 'rise' : 'ballistic',
      peakOpacity: gain ? 0.55 : 0.48,
      roll: gain ? dx * 0.4 : 0,
      depthTest: true,
    }))
  }
  return { trauma: gain ? 0.05 : 0.04, particles }
}

function regenerationBurst(facing: number): MutationFxBurst {
  const particles: MutationFxParticleSpec[] = [
    spec({
      texture: 'glow', billboard: 'camera', color: 0xffe0b8,
      startScale: [0.45, 0.45], endScale: [1.35, 1.35],
      offset: [0, 0.82, 0], velocity: [0, 0.1, 0], spin: 0,
      duration: 0.32, delay: 0.14, gravity: 0, motion: 'expand', peakOpacity: 0.62, roll: 0,
    }),
  ]
  for (let index = 0; index < 12; index += 1) {
    const angle = facing + index * (TAU / 12) + 0.3
    const dx = Math.cos(angle)
    const dz = Math.sin(angle)
    particles.push(spec({
      texture: 'glow', billboard: 'camera', color: index % 2 ? 0xf08a62 : 0xffc28a,
      startScale: [0.22, 0.22], endScale: [0.08, 0.08],
      offset: [dx * 1.05, 0.5 + (index % 3) * 0.14, dz * 1.05],
      velocity: [-dx * 2.2, 0.25, -dz * 2.2],
      spin: 0, duration: 0.4, delay: index * 0.012, gravity: 0,
      motion: 'attract', peakOpacity: 0.88, roll: 0,
    }))
  }
  return { trauma: 0.14, particles }
}
