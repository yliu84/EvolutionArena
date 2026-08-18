/**
 * The valley's shape, as pure functions of position.
 *
 * There is no artist on this project and the existing map is already generated
 * rather than authored - `terrainHeight` is a function, the ground is a plane
 * with a tiled CC0 texture, and the props are scattered from a seed. So the
 * valley is built the same way, and needs no new art at all.
 *
 * Coordinates come from `docs/design/maps/VALLEY-MAP-SPEC-V1.md`, where the
 * 1600-unit length was derived from a time budget rather than chosen: 25 minutes
 * minus what the encounters actually cost leaves 485s of travel, which at
 * PLAYER_SPEED 6.2 and 70% path efficiency is a 1565-unit main road.
 */

export const GLOAMWOOD_VALLEY = {
  length: 1600,
  /** Widest the valley opens, at the three basins. */
  basinHalfWidth: 150,
  /** Narrowest, at the two chokes. Passable but unmistakably a gate. */
  chokeHalfWidth: 26,
  corridorHalfWidth: 96,
  wallHeight: 11,
  spawn: { x: 40, z: 0 },
  chokes: [540, 1120],
  chokeSpan: 46,
  basins: [[120, 380], [700, 960], [1260, 1500]],
  regions: [
    { id: 'shallows', from: 0, to: 500, tier: 1 },
    { id: 'gorge', from: 580, to: 1080, tier: 2 },
    { id: 'headwater', from: 1160, to: 1600, tier: 3 },
  ],
} as const

export type GloamwoodValleyRegionId = typeof GLOAMWOOD_VALLEY.regions[number]['id']

/** Half-width of the walkable floor at this point along the valley. */
export function gloamwoodValleyHalfWidth(x: number) {
  for (const choke of GLOAMWOOD_VALLEY.chokes) {
    const distance = Math.abs(x - choke)
    if (distance < GLOAMWOOD_VALLEY.chokeSpan) {
      // Ease out of the choke rather than stepping, or the walls read as a door
      // frame dropped into the terrain.
      const t = distance / GLOAMWOOD_VALLEY.chokeSpan
      return GLOAMWOOD_VALLEY.chokeHalfWidth
        + (GLOAMWOOD_VALLEY.corridorHalfWidth - GLOAMWOOD_VALLEY.chokeHalfWidth) * smoothstep(t)
    }
  }
  for (const [from, to] of GLOAMWOOD_VALLEY.basins) {
    if (x > from && x < to) {
      // Basins swell and close again, so the space reads as a clearing rather
      // than a corridor that happens to be wide.
      const t = (x - from) / (to - from)
      const swell = Math.sin(t * Math.PI)
      return GLOAMWOOD_VALLEY.corridorHalfWidth
        + (GLOAMWOOD_VALLEY.basinHalfWidth - GLOAMWOOD_VALLEY.corridorHalfWidth) * swell
    }
  }
  return GLOAMWOOD_VALLEY.corridorHalfWidth
}

function smoothstep(t: number) {
  const clamped = Math.min(1, Math.max(0, t))
  return clamped * clamped * (3 - 2 * clamped)
}

/**
 * Ground height. Flat road, banks that lift, then walls.
 *
 * The silhouette does most of the work in a generated map, so the wall rises
 * hard rather than gently: a valley the player can see the top of is a field.
 */
export function gloamwoodValleyHeight(x: number, z: number) {
  const half = gloamwoodValleyHalfWidth(x)
  const across = Math.abs(z) / half
  const rolling = Math.sin(x * 0.037) * 0.34 + Math.cos(z * 0.055) * 0.22 + Math.sin((x * 0.6 + z) * 0.021) * 0.28
  // The road is graded flat; rolling only shows once off it.
  const road = Math.exp(-Math.pow(z, 2) / 320)
  const bank = smoothstep((across - 0.42) / 0.38) * 1.9
  const wall = Math.pow(Math.max(0, across - 0.82) / 0.34, 1.7) * GLOAMWOOD_VALLEY.wallHeight
  // A long ascent up-valley, so the headwater sits above the river mouth.
  const gradient = x / GLOAMWOOD_VALLEY.length * 4.5
  return gradient + bank + wall + rolling * (1 - road * 0.85)
}

export type GloamwoodValleySurface = 'road' | 'bank' | 'wall'

/**
 * Which material dominates here.
 *
 * Blending by position rather than painting a splat map is what makes a
 * generated valley look like terrain instead of one tiled photograph, and it
 * costs nothing but arithmetic.
 */
export function gloamwoodValleySurfaceWeights(x: number, z: number) {
  const half = gloamwoodValleyHalfWidth(x)
  const across = Math.abs(z) / half
  const road = Math.max(0, 1 - Math.pow(Math.abs(z) / 22, 1.6))
  const wall = smoothstep((across - 0.78) / 0.3)
  const bank = Math.max(0, 1 - road - wall)
  const total = road + bank + wall || 1
  return { road: road / total, bank: bank / total, wall: wall / total }
}

export function gloamwoodValleyDominantSurface(x: number, z: number): GloamwoodValleySurface {
  const weights = gloamwoodValleySurfaceWeights(x, z)
  if (weights.wall >= weights.road && weights.wall >= weights.bank) return 'wall'
  return weights.road >= weights.bank ? 'road' : 'bank'
}

/** Region containing this point, or null in the gaps the chokes occupy. */
export function gloamwoodValleyRegionAt(x: number) {
  return GLOAMWOOD_VALLEY.regions.find((region) => x >= region.from && x <= region.to) ?? null
}

/** True where the player may stand. Beyond this the wall takes over. */
export function gloamwoodValleyWalkable(x: number, z: number) {
  if (x < 0 || x > GLOAMWOOD_VALLEY.length) return false
  return Math.abs(z) <= gloamwoodValleyHalfWidth(x) * 0.82
}

/** Push a position back inside the walkable floor, preserving the road axis. */
export function gloamwoodValleyConfine(x: number, z: number) {
  const clampedX = Math.min(GLOAMWOOD_VALLEY.length, Math.max(0, x))
  const limit = gloamwoodValleyHalfWidth(clampedX) * 0.82
  return { x: clampedX, z: Math.min(limit, Math.max(-limit, z)) }
}
