import { GLOAMWOOD_VALLEY_BRANCHES } from './gloamwood-valley-branches'
import {
  GLOAMWOOD_VALLEY,
  GLOAMWOOD_VALLEY_LENGTH,
  gloamwoodValleyBranchPointAt,
  gloamwoodValleyPointAt,
  gloamwoodValleyRiverOffset,
  type GloamwoodValleyRegionId,
} from './gloamwood-valley-terrain'

export interface GloamwoodValleyRadarPoint { x: number; y: number }
export interface GloamwoodValleyRadarViewport { x: number; z: number; facingRadians: number }
export interface GloamwoodValleyRadarMarker extends GloamwoodValleyRadarPoint { offscreen: boolean }

const VIEW = 100
const PAD = 12
const SAMPLES = 72
const LOCAL_CENTER = VIEW / 2
const LOCAL_RADIUS_WORLD = 72
const LOCAL_RADIUS_VIEW = 41
const LOCAL_MARKER_RADIUS = 39
/** River Valley's world-forward map bearing. Players turn, the map does not. */
export const GLOAMWOOD_VALLEY_RADAR_NORTH_UP = 0
const ROUTE = Array.from({ length: SAMPLES + 1 }, (_, index) => gloamwoodValleyPointAt(GLOAMWOOD_VALLEY_LENGTH * index / SAMPLES))
const RIVER = Array.from({ length: SAMPLES + 1 }, (_, index) => {
  const s = GLOAMWOOD_VALLEY_LENGTH * index / SAMPLES
  return gloamwoodValleyPointAt(s, gloamwoodValleyRiverOffset(s))
})
const BRANCHES = GLOAMWOOD_VALLEY_BRANCHES.map((_, branchIndex) => (
  Array.from({ length: 15 }, (_, index) => gloamwoodValleyBranchPointAt(branchIndex, index / 14, 0))
))
const BOUNDS = [...ROUTE, ...RIVER, ...BRANCHES.flat()].reduce((bounds, point) => ({
  minX: Math.min(bounds.minX, point.x), maxX: Math.max(bounds.maxX, point.x),
  minZ: Math.min(bounds.minZ, point.z), maxZ: Math.max(bounds.maxZ, point.z),
}), { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity })
const SCALE = Math.min((VIEW - PAD * 2) / (BOUNDS.maxX - BOUNDS.minX), (VIEW - PAD * 2) / (BOUNDS.maxZ - BOUNDS.minZ))

export function gloamwoodValleyRadarPoint(x: number, z: number): GloamwoodValleyRadarPoint {
  return {
    x: PAD + (x - BOUNDS.minX) * SCALE,
    y: VIEW - PAD - (z - BOUNDS.minZ) * SCALE,
  }
}

export function gloamwoodValleyRadarRoutePath() {
  return radarPath(ROUTE)
}

/** The river gives the tiny map a second, truthful landmark without new art. */
export function gloamwoodValleyRadarRiverPath() {
  return radarPath(RIVER)
}

/** Actual side canyons make the radar describe a valley network, not a corridor. */
export function gloamwoodValleyRadarBranchPaths() {
  return BRANCHES.map((branch) => radarPath(branch))
}

/** The chambers are the readable destinations at the end of each side route. */
export function gloamwoodValleyRadarBranchEndpoints() {
  return BRANCHES.map((branch) => {
    const point = branch[branch.length - 1]
    return gloamwoodValleyRadarPoint(point.x, point.z)
  })
}

/** A broad, low-contrast region stroke reads as valley floor rather than road. */
export function gloamwoodValleyRadarRegionPath(regionId: GloamwoodValleyRegionId) {
  const region = GLOAMWOOD_VALLEY.regions.find((entry) => entry.id === regionId)
  if (!region) return ''
  const samples = 18
  return radarPath(Array.from({ length: samples + 1 }, (_, index) => (
    gloamwoodValleyPointAt(region.from + (region.to - region.from) * index / samples)
  )))
}

export function gloamwoodValleyRadarPointAt(s: number) {
  const point = gloamwoodValleyPointAt(Math.max(0, Math.min(GLOAMWOOD_VALLEY_LENGTH, s)))
  return gloamwoodValleyRadarPoint(point.x, point.z)
}

/**
 * Player-centred radar projection. The player is always centred and their
 * current facing is always up, so the display answers "what is ahead?" rather
 * than requiring a player to mentally rotate a whole-map thumbnail.
 */
export function gloamwoodValleyRadarLocalPoint(x: number, z: number, viewport: GloamwoodValleyRadarViewport): GloamwoodValleyRadarPoint {
  const dx = x - viewport.x
  const dz = z - viewport.z
  const forwardX = Math.cos(viewport.facingRadians)
  const forwardZ = -Math.sin(viewport.facingRadians)
  const rightX = -forwardZ
  const rightZ = forwardX
  return {
    x: LOCAL_CENTER + (dx * rightX + dz * rightZ) * LOCAL_RADIUS_VIEW / LOCAL_RADIUS_WORLD,
    y: LOCAL_CENTER - (dx * forwardX + dz * forwardZ) * LOCAL_RADIUS_VIEW / LOCAL_RADIUS_WORLD,
  }
}

/** Keep distant Boss/gate intent visible as an edge marker instead of hiding it. */
export function gloamwoodValleyRadarLocalMarker(x: number, z: number, viewport: GloamwoodValleyRadarViewport): GloamwoodValleyRadarMarker {
  const point = gloamwoodValleyRadarLocalPoint(x, z, viewport)
  const dx = point.x - LOCAL_CENTER
  const dy = point.y - LOCAL_CENTER
  const distance = Math.hypot(dx, dy)
  if (distance <= LOCAL_MARKER_RADIUS) return { ...point, offscreen: false }
  const scale = LOCAL_MARKER_RADIUS / distance
  return { x: LOCAL_CENTER + dx * scale, y: LOCAL_CENTER + dy * scale, offscreen: true }
}

export function gloamwoodValleyRadarLocalRoutePath(viewport: GloamwoodValleyRadarViewport) {
  return localRadarPath(ROUTE, viewport)
}

export function gloamwoodValleyRadarLocalRiverPath(viewport: GloamwoodValleyRadarViewport) {
  return localRadarPath(RIVER, viewport)
}

export function gloamwoodValleyRadarLocalBranchPaths(viewport: GloamwoodValleyRadarViewport) {
  return BRANCHES.map((branch) => localRadarPath(branch, viewport))
}

export function gloamwoodValleyRadarLocalBranchEndpoints(viewport: GloamwoodValleyRadarViewport) {
  return BRANCHES.map((branch) => {
    const point = branch[branch.length - 1]
    return gloamwoodValleyRadarLocalPoint(point.x, point.z, viewport)
  })
}

export function gloamwoodValleyRadarLocalRegionPath(regionId: GloamwoodValleyRegionId, viewport: GloamwoodValleyRadarViewport) {
  const region = GLOAMWOOD_VALLEY.regions.find((entry) => entry.id === regionId)
  if (!region) return ''
  const samples = 18
  return localRadarPath(Array.from({ length: samples + 1 }, (_, index) => (
    gloamwoodValleyPointAt(region.from + (region.to - region.from) * index / samples)
  )), viewport)
}

export function gloamwoodValleyRadarLocalPointAt(s: number, viewport: GloamwoodValleyRadarViewport) {
  const point = gloamwoodValleyPointAt(Math.max(0, Math.min(GLOAMWOOD_VALLEY_LENGTH, s)))
  return gloamwoodValleyRadarLocalPoint(point.x, point.z, viewport)
}

export function gloamwoodValleyRadarLocalMarkerAt(s: number, viewport: GloamwoodValleyRadarViewport) {
  const point = gloamwoodValleyPointAt(Math.max(0, Math.min(GLOAMWOOD_VALLEY_LENGTH, s)))
  return gloamwoodValleyRadarLocalMarker(point.x, point.z, viewport)
}

function radarPath(points: ReadonlyArray<{ x: number; z: number }>) {
  return points.map((point, index) => {
    const radar = gloamwoodValleyRadarPoint(point.x, point.z)
    return `${index === 0 ? 'M' : 'L'}${radar.x.toFixed(2)} ${radar.y.toFixed(2)}`
  }).join(' ')
}

function localRadarPath(points: ReadonlyArray<{ x: number; z: number }>, viewport: GloamwoodValleyRadarViewport) {
  return points.map((point, index) => {
    const radar = gloamwoodValleyRadarLocalPoint(point.x, point.z, viewport)
    return `${index === 0 ? 'M' : 'L'}${radar.x.toFixed(2)} ${radar.y.toFixed(2)}`
  }).join(' ')
}
