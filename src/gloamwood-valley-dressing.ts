import { GLOAMWOOD_ROCK_VARIANTS } from './gloamwood-environment-kit'
import {
  GLOAMWOOD_VALLEY,
  gloamwoodValleyDominantSurface,
  gloamwoodValleyHalfWidth,
  gloamwoodValleyWalkableHalfWidth,
  type GloamwoodValleyRegionId,
} from './gloamwood-valley-terrain'

/**
 * How the valley is dressed, given only trees, grass and rocks.
 *
 * There is no artist and no prop library: the kit is seven plants, three rocks
 * and a mushroom. A wilderness needs no buildings, so the interest has to come
 * from somewhere else - terrain silhouette, rock massing, and the same species
 * distributed differently per region. A rock scaled eight times with a random
 * rotation reads as an outcrop rather than a rock, which is the single most
 * useful fact available here.
 *
 * Pure data and pure functions, so what each region should look like is
 * reviewable without rendering it.
 */

export interface GloamwoodValleyRegionDressing {
  id: GloamwoodValleyRegionId
  /** Tint applied to props, so three regions read as three places. */
  tint: number
  /** Trees per 1000 square units of bank. */
  treeDensity: number
  /** Share of trees that are conifers rather than broadleaf. */
  coniferShare: number
  /** Share that are bare dead trunks. */
  deadShare: number
  undergrowthDensity: number
  /**
   * Share of sample points that produce anything at all.
   *
   * Without this the per-species densities only decide *what* appears, never
   * *whether*, so every region ends up equally covered and the three read as
   * one. The headwater has to be visibly emptier, not merely rockier.
   */
  coverage: number
  /** Boulders per 1000 square units, before wall massing. */
  boulderDensity: number
  /** Largest multiple of a rock's authored size used on the walls. */
  cliffScale: number
  fogDensity: number
  /** Colour the distance fades to. Carries most of a region's mood. */
  fogColor: number
  /** Sun colour and strength, so the valley darkens as it climbs. */
  sunColor: number
  sunIntensity: number
}

export const GLOAMWOOD_VALLEY_DRESSING: readonly GloamwoodValleyRegionDressing[] = [
  {
    // River mouth: open, green, safe-looking. The player learns here.
    id: 'shallows',
    tint: 0x9fbe86,
    treeDensity: 5.5,
    coniferShare: 0.15,
    deadShare: 0.05,
    undergrowthDensity: 40,
    coverage: 0.92,
    boulderDensity: 3.2,
    cliffScale: 6,
    fogDensity: 0.012,
    fogColor: 0x8fb08c,
    sunColor: 0xffeec4,
    sunIntensity: 2.1,
  },
  {
    // Gorge: walls close in, light drops, conifers take over from broadleaf.
    id: 'gorge',
    tint: 0x7f9c7a,
    treeDensity: 3.4,
    coniferShare: 0.62,
    deadShare: 0.18,
    undergrowthDensity: 22,
    coverage: 0.62,
    boulderDensity: 6.8,
    cliffScale: 9,
    fogDensity: 0.02,
    fogColor: 0x4e6b5e,
    sunColor: 0xd9e2c8,
    sunIntensity: 1.5,
  },
  {
    // Headwater: high, cold and largely dead. Rock does the talking.
    id: 'headwater',
    tint: 0x6f8388,
    treeDensity: 1.9,
    coniferShare: 0.5,
    deadShare: 0.42,
    undergrowthDensity: 11,
    coverage: 0.34,
    boulderDensity: 11.5,
    cliffScale: 12,
    fogDensity: 0.03,
    fogColor: 0x3c4c56,
    sunColor: 0xc2d4e0,
    sunIntensity: 1.05,
  },
]

export function gloamwoodValleyDressingFor(id: GloamwoodValleyRegionId) {
  return GLOAMWOOD_VALLEY_DRESSING.find((entry) => entry.id === id) ?? GLOAMWOOD_VALLEY_DRESSING[0]
}

export type GloamwoodValleyPropKind = 'tree' | 'undergrowth' | 'boulder' | 'cliff'

export interface GloamwoodValleyProp {
  kind: GloamwoodValleyPropKind
  x: number
  z: number
  /** Multiple of the asset's authored size. */
  scale: number
  rotation: number
  variant: number
  tint: number
}

/**
 * Scatter the whole valley from a seed.
 *
 * Deterministic because the run already is: the same seed has to rebuild the
 * same valley, or a recorded session cannot be replayed against the map it
 * happened on.
 */
export function scatterGloamwoodValley(seed: number, budget = 2600): GloamwoodValleyProp[] {
  const random = seededRandom(seed)
  const props: GloamwoodValleyProp[] = []
  const step = GLOAMWOOD_VALLEY.length / budget

  for (let index = 0; index < budget; index += 1) {
    const x = index * step + random() * step
    const region = GLOAMWOOD_VALLEY.regions.find((entry) => x >= entry.from && x <= entry.to)
    // Chokes are dressed as the gorge, so a gate never reads as untended ground.
    const dressing = gloamwoodValleyDressingFor(region?.id ?? 'gorge')
    const half = gloamwoodValleyHalfWidth(x)
    const side = random() < 0.5 ? -1 : 1
    const across = random()
    const z = side * half * across

    const surface = gloamwoodValleyDominantSurface(x, z)
    // The road stays bare. A path is read by what is not on it.
    if (surface === 'road') continue

    // Walls keep their massing whatever the region: a cliff is not optional.
    if (surface !== 'wall' && random() > dressing.coverage) continue

    if (surface === 'wall') {
      // Walls are built from the same three rocks at many times their size.
      // Massing is what turns a prop into terrain.
      const variant = Math.floor(random() * 3)
      // A cliff may not reach out over the floor. Unclamped, the region's
      // cliffScale put nine-times rocks on a choke seven units wide: the gate
      // read superbly and the camera was inside the rock, with the player and
      // the whole fight behind it. Height sells enclosure at a choke; width
      // cannot, because there is none to spare.
      const clearance = Math.abs(z) - gloamwoodValleyWalkableHalfWidth(x)
      const ceiling = Math.min(dressing.cliffScale, clearance * 2 / GLOAMWOOD_ROCK_VARIANTS[variant].diameter)
      if (ceiling < 1.4) continue
      const scale = 1.4 + random() * (ceiling - 1.4)
      props.push({
        kind: scale > dressing.cliffScale * 0.62 ? 'cliff' : 'boulder',
        x, z, scale, rotation: random() * Math.PI * 2,
        variant, tint: dressing.tint,
      })
      continue
    }

    const roll = random() * (dressing.treeDensity + dressing.undergrowthDensity + dressing.boulderDensity)
    if (roll < dressing.treeDensity) {
      const kindRoll = random()
      const variant = kindRoll < dressing.deadShare ? 6
        : kindRoll < dressing.deadShare + dressing.coniferShare ? 4 + Math.floor(random() * 2)
        : Math.floor(random() * 4)
      props.push({
        kind: 'tree', x, z, scale: 0.8 + random() * 0.55,
        rotation: random() * Math.PI * 2, variant, tint: dressing.tint,
      })
    } else if (roll < dressing.treeDensity + dressing.undergrowthDensity) {
      props.push({
        kind: 'undergrowth', x, z, scale: 0.85 + random() * 0.95,
        rotation: random() * Math.PI * 2, variant: Math.floor(random() * 5), tint: dressing.tint,
      })
    } else {
      props.push({
        // Loose rock on the floor stays small. At the first meshed pass these
        // ran to five units across and the shallows read as a quarry rather
        // than as the green, open place the player is meant to learn in.
        kind: 'boulder', x, z, scale: 0.5 + random() * 1.1,
        rotation: random() * Math.PI * 2, variant: Math.floor(random() * 3), tint: dressing.tint,
      })
    }
  }
  return props
}

function seededRandom(seed: number) {
  let value = seed >>> 0 || 1
  return () => {
    value ^= value << 13
    value ^= value >>> 17
    value ^= value << 5
    return ((value >>> 0) % 100000) / 100000
  }
}

/**
 * Where each region's look is centred along the valley.
 *
 * Fog and light are global in the renderer, so they cannot be zoned the way
 * props are - there is one fog for the whole scene. They are driven off the
 * camera instead, which is better anyway: the player walks and the light
 * changes with them, rather than crossing an invisible line where the whole
 * valley recolours at once.
 */
function regionCenter(index: number) {
  const region = GLOAMWOOD_VALLEY.regions[index]
  return (region.from + region.to) / 2
}

export interface GloamwoodValleyAtmosphere {
  fogColor: number
  fogDensity: number
  sunColor: number
  sunIntensity: number
}

export function gloamwoodValleyAtmosphereAt(x: number): GloamwoodValleyAtmosphere {
  const last = GLOAMWOOD_VALLEY_DRESSING.length - 1
  if (x <= regionCenter(0)) return atmosphereOf(GLOAMWOOD_VALLEY_DRESSING[0])
  if (x >= regionCenter(last)) return atmosphereOf(GLOAMWOOD_VALLEY_DRESSING[last])
  for (let index = 0; index < last; index += 1) {
    const from = regionCenter(index)
    const to = regionCenter(index + 1)
    if (x > to) continue
    const t = (x - from) / (to - from)
    return {
      fogColor: mixColor(GLOAMWOOD_VALLEY_DRESSING[index].fogColor, GLOAMWOOD_VALLEY_DRESSING[index + 1].fogColor, t),
      fogDensity: mix(GLOAMWOOD_VALLEY_DRESSING[index].fogDensity, GLOAMWOOD_VALLEY_DRESSING[index + 1].fogDensity, t),
      sunColor: mixColor(GLOAMWOOD_VALLEY_DRESSING[index].sunColor, GLOAMWOOD_VALLEY_DRESSING[index + 1].sunColor, t),
      sunIntensity: mix(GLOAMWOOD_VALLEY_DRESSING[index].sunIntensity, GLOAMWOOD_VALLEY_DRESSING[index + 1].sunIntensity, t),
    }
  }
  return atmosphereOf(GLOAMWOOD_VALLEY_DRESSING[last])
}

function atmosphereOf(dressing: GloamwoodValleyRegionDressing): GloamwoodValleyAtmosphere {
  return {
    fogColor: dressing.fogColor,
    fogDensity: dressing.fogDensity,
    sunColor: dressing.sunColor,
    sunIntensity: dressing.sunIntensity,
  }
}

function mix(from: number, to: number, t: number) {
  return from + (to - from) * t
}

/** Per channel, so two greens do not blend through a muddy grey. */
function mixColor(from: number, to: number, t: number) {
  const red = Math.round(mix((from >> 16) & 255, (to >> 16) & 255, t))
  const green = Math.round(mix((from >> 8) & 255, (to >> 8) & 255, t))
  const blue = Math.round(mix(from & 255, to & 255, t))
  return (red << 16) | (green << 8) | blue
}

/**
 * Which kit tree a scattered `variant` means.
 *
 * The scatter decides broadleaf / conifer / dead from the region's shares and
 * writes a number. The kit's own array is ordered by when each model was added,
 * so index 3 is a pine and index 6 is another one - reading the scatter's
 * number straight off that array puts conifers in the shallows and broadleaf in
 * the headwater, which is the reverse of what the dressing data asks for.
 */
export const GLOAMWOOD_VALLEY_TREE_KINDS = {
  broadleaf: ['broadleaf-a', 'broadleaf-b', 'broadleaf-c', 'broadleaf-d'],
  conifer: ['pine-a', 'pine-b'],
  dead: ['dead-a'],
} as const

export function gloamwoodValleyTreeVariantId(variant: number) {
  if (variant >= 6) return GLOAMWOOD_VALLEY_TREE_KINDS.dead[0]
  if (variant >= 4) return GLOAMWOOD_VALLEY_TREE_KINDS.conifer[variant - 4]
  return GLOAMWOOD_VALLEY_TREE_KINDS.broadleaf[variant]
}

/** Ground tint at this point, blended between regions the way the fog is. */
export function gloamwoodValleyTintAt(x: number) {
  const last = GLOAMWOOD_VALLEY_DRESSING.length - 1
  if (x <= regionCenter(0)) return GLOAMWOOD_VALLEY_DRESSING[0].tint
  if (x >= regionCenter(last)) return GLOAMWOOD_VALLEY_DRESSING[last].tint
  for (let index = 0; index < last; index += 1) {
    const from = regionCenter(index)
    const to = regionCenter(index + 1)
    if (x > to) continue
    return mixColor(GLOAMWOOD_VALLEY_DRESSING[index].tint, GLOAMWOOD_VALLEY_DRESSING[index + 1].tint, (x - from) / (to - from))
  }
  return GLOAMWOOD_VALLEY_DRESSING[last].tint
}
