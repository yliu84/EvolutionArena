import { getQuality3DSpeciesForm } from './quality-3d-species-forms'

export const QUALITY_3D = {
  world: { width: 80, depth: 64 },
  spawn: { x: -2, z: 1 },
  bridge: { centerX: 8, minZ: 8.4, maxZ: 15.8, halfWidth: 2.8, height: 0.78 },
  player: { radius: 0.48, speed: 5.8, turnSpeed: 8.8 },
  camera: { viewHeight: 19.2, offsetX: 14.8, offsetY: 18.5, offsetZ: 14.8 },
} as const

export interface Quality3DFootprintProbe {
  name: string
  x: number
  z: number
}

export interface Quality3DFootprint {
  front: number
  rear: number
  halfWidth: number
  maxHeightDelta: number
}

export interface Quality3DFootprintResult {
  clear: boolean
  blockedProbe: string | null
  maxHeightDelta: number
}

export function isQuality3DRequested(search = globalThis.location?.search ?? '') {
  return new URLSearchParams(search).get('quality3d') === '1'
}

export function terrainHeight(x: number, z: number) {
  if (isQuality3DBridge(x, z)) return QUALITY_3D.bridge.height
  const base = quality3DLandHeight(x, z)
  const distance = Math.abs(z - quality3DRiverCenterZ(x))
  const halfWidth = quality3DRiverHalfWidth(x)
  if (distance < halfWidth) {
    const bedRise = smoothstep(0, halfWidth, distance) * 0.48
    return -1.48 + bedRise + Math.sin(x * 0.34) * 0.06
  }
  if (distance < halfWidth + 1.35) {
    return lerp(-0.96, base, smoothstep(halfWidth, halfWidth + 1.35, distance))
  }
  return base
}

export function isQuality3DWalkable(x: number, z: number) {
  const onBridge = isQuality3DBridge(x, z, 0.35, 0.3)
  if (onBridge) return true
  if (isQuality3DRiver(x, z, 0.32)) return false
  if (x < quality3DWestBoundaryX(z) + 0.85 || x > quality3DEastBoundaryX(z) - 0.85) return false
  if (z < -18.5 || z > 20.5) return false
  return true
}

export function getQuality3DFootprint(stage: number): Quality3DFootprint {
  const form = getQuality3DSpeciesForm(stage)
  return {
    // Wings are presentation and may pass above scenery. The collision hull
    // follows the grounded skull, torso and most of the visible tail.
    front: (form.headX + form.headLength * 0.55 + form.snoutLength * 0.82) * form.scale,
    rear: (form.bodyLength * 0.46 + form.tailLength * 0.38) * form.scale,
    halfWidth: Math.max(form.bodyWidth * 0.52, form.legSpread + 0.16) * form.scale,
    maxHeightDelta: 0.82,
  }
}

export function quality3DFootprintProbes(x: number, z: number, yaw: number, stage: number): Quality3DFootprintProbe[] {
  const footprint = getQuality3DFootprint(stage)
  const localProbes: Array<[string, number, number]> = [
    ['center', 0, 0],
    ['head', footprint.front, 0],
    ['chest', footprint.front * 0.52, 0],
    ['tail', -footprint.rear, 0],
    ['hips', -footprint.rear * 0.48, 0],
    ['left', 0, -footprint.halfWidth],
    ['right', 0, footprint.halfWidth],
    ['front-left', footprint.front * 0.58, -footprint.halfWidth * 0.78],
    ['front-right', footprint.front * 0.58, footprint.halfWidth * 0.78],
    ['rear-left', -footprint.rear * 0.58, -footprint.halfWidth * 0.78],
    ['rear-right', -footprint.rear * 0.58, footprint.halfWidth * 0.78],
  ]
  const cosine = Math.cos(yaw)
  const sine = Math.sin(yaw)
  return localProbes.map(([name, localX, localZ]) => ({
    name,
    x: x + localX * cosine + localZ * sine,
    z: z - localX * sine + localZ * cosine,
  }))
}

export function inspectQuality3DFootprint(x: number, z: number, yaw: number, stage: number): Quality3DFootprintResult {
  const footprint = getQuality3DFootprint(stage)
  const centerHeight = terrainHeight(x, z)
  let maximumDelta = 0
  for (const probe of quality3DFootprintProbes(x, z, yaw, stage)) {
    if (!isQuality3DWalkable(probe.x, probe.z)) {
      return { clear: false, blockedProbe: probe.name, maxHeightDelta: maximumDelta }
    }
    const heightDelta = Math.abs(terrainHeight(probe.x, probe.z) - centerHeight)
    maximumDelta = Math.max(maximumDelta, heightDelta)
    if (heightDelta > footprint.maxHeightDelta) {
      return { clear: false, blockedProbe: `${probe.name}-slope`, maxHeightDelta: maximumDelta }
    }
  }
  return { clear: true, blockedProbe: null, maxHeightDelta: maximumDelta }
}

export function isQuality3DFootprintWalkable(x: number, z: number, yaw: number, stage: number) {
  return inspectQuality3DFootprint(x, z, yaw, stage).clear
}

export function quality3DRiverCenterZ(x: number) {
  return 11.8 + Math.sin(x * 0.145) * 1.05 + Math.sin((x + 3.4) * 0.33) * 0.34
}

export function quality3DRiverHalfWidth(x: number) {
  return 2.35 + Math.sin((x - 2) * 0.19) * 0.28 + Math.sin(x * 0.47) * 0.12
}

export function isQuality3DRiver(x: number, z: number, margin = 0) {
  return Math.abs(z - quality3DRiverCenterZ(x)) <= quality3DRiverHalfWidth(x) + margin
}

export function quality3DWestBoundaryX(z: number) {
  return -11.75 + Math.sin(z * 0.22) * 0.82 + Math.sin((z + 2) * 0.51) * 0.3
}

export function quality3DEastBoundaryX(z: number) {
  return 12.45 + Math.sin((z + 4) * 0.19) * 0.88 + Math.sin(z * 0.43) * 0.26
}

export function isQuality3DBridge(x: number, z: number, inset = 0, zMargin = 0) {
  const { bridge } = QUALITY_3D
  return Math.abs(x - bridge.centerX) <= bridge.halfWidth - inset
    && z >= bridge.minZ - zMargin
    && z <= bridge.maxZ + zMargin
}

export function shortestAngleDelta(from: number, to: number) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from))
}

export function turnToward(from: number, to: number, maxStep: number) {
  const delta = shortestAngleDelta(from, to)
  if (Math.abs(delta) <= maxStep) return to
  return from + Math.sign(delta) * maxStep
}

export const QUALITY_3D_MOVE_FACING_TOLERANCE_RADIANS = Math.PI / 30

export function canQuality3DTranslateAfterTurn(facing: number, desired: number) {
  return Math.abs(shortestAngleDelta(facing, desired)) <= QUALITY_3D_MOVE_FACING_TOLERANCE_RADIANS
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

function quality3DLandHeight(x: number, z: number) {
  const rolling = Math.sin(x * 0.31) * 0.2
    + Math.cos(z * 0.27) * 0.16
    + Math.sin((x + z) * 0.18) * 0.11
  const openBasin = -Math.exp(-(x * x + (z - 1) * (z - 1)) / 75) * 0.18
  const westRise = smoothstep(0, 4.2, quality3DWestBoundaryX(z) + 3.7 - x) * 4.15
  const eastRise = smoothstep(0, 4.2, x - quality3DEastBoundaryX(z) + 3.7) * 3.65
  const northShelf = smoothstep(15.5, 21, z) * 0.75
  return rolling + openBasin + northShelf + Math.max(westRise, eastRise)
}

function lerp(from: number, to: number, t: number) {
  return from + (to - from) * t
}
