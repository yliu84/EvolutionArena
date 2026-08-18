import { GLOAMWOOD_ROCK_VARIANTS, GLOAMWOOD_TREE_VARIANTS } from './gloamwood-environment-kit'
import {
  GLOAMWOOD_VALLEY_BRANCHES,
  gloamwoodValleyBranchHalfWidth,
  type GloamwoodValleyBranchTerrain,
} from './gloamwood-valley-branches'
import {
  GLOAMWOOD_VALLEY,
  GLOAMWOOD_VALLEY_LENGTH,
  gloamwoodValleyBranchPointAt,
  gloamwoodValleyCorridorAt,
  gloamwoodValleyDominantSurface,
  gloamwoodValleyHalfWidth,
  gloamwoodValleyPointAt,
  type GloamwoodValleyRegionId,
} from './gloamwood-valley-terrain'

/**
 * How the valley is dressed, given only trees, grass and rocks.
 *
 * There is no artist and no prop library: the kit is seven plants, three rocks
 * and a mushroom. A wilderness needs no buildings, so the interest has to come
 * from somewhere else - terrain silhouette, rock massing, and the same species
 * distributed differently per place. A rock scaled eight times with a random
 * rotation reads as an outcrop rather than a rock, which is the single most
 * useful fact available here.
 *
 * Pure data and pure functions, so what each place should look like is
 * reviewable without rendering it.
 */

export interface GloamwoodValleyDressing {
  /** Tint applied to props, so different places read as different places. */
  tint: number
  /** Trees per unit of mix weight. */
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
   * *whether*, so everywhere ends up equally covered and reads as one place.
   * The headwater has to be visibly emptier, not merely rockier.
   */
  coverage: number
  /** Boulders per unit of mix weight, before wall massing. */
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

export interface GloamwoodValleyRegionDressing extends GloamwoodValleyDressing {
  id: GloamwoodValleyRegionId
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

/**
 * What each branch is made of.
 *
 * A branch that looks like the road it left is not worth walking. These are the
 * same seven plants and three rocks as everywhere else - what changes is how
 * many, how big, and how much bare ground is left between them.
 */
export const GLOAMWOOD_VALLEY_TERRAIN_DRESSING: Record<GloamwoodValleyBranchTerrain, GloamwoodValleyDressing> = {
  // Sunken, sheltered, overgrown. The densest ground in the map.
  hollow: {
    tint: 0x93bf7c, treeDensity: 3, coniferShare: 0.08, deadShare: 0.04, undergrowthDensity: 78,
    coverage: 0.97, boulderDensity: 2, cliffScale: 7, fogDensity: 0.016,
    fogColor: 0x7ea87f, sunColor: 0xf6e9c0, sunIntensity: 1.7,
  },
  // Wet flat by the river. Reeds and standing water, almost no canopy.
  marsh: {
    tint: 0x8aa679, treeDensity: 1.2, coniferShare: 0.1, deadShare: 0.55, undergrowthDensity: 64,
    coverage: 0.84, boulderDensity: 0.8, cliffScale: 5, fogDensity: 0.026,
    fogColor: 0x6d8676, sunColor: 0xe4e6c6, sunIntensity: 1.3,
  },
  // Rockfall. Bare, loud underfoot, nothing grows.
  scree: {
    tint: 0xa3a79c, treeDensity: 0.4, coniferShare: 0.7, deadShare: 0.5, undergrowthDensity: 3,
    coverage: 0.5, boulderDensity: 26, cliffScale: 8, fogDensity: 0.022,
    fogColor: 0x5a6668, sunColor: 0xd6dbdc, sunIntensity: 1.35,
  },
  // Standing dead timber, packed close. Sightlines are the point.
  deadwood: {
    tint: 0x6d7a68, treeDensity: 7, coniferShare: 0.1, deadShare: 0.88, undergrowthDensity: 6,
    coverage: 0.58, boulderDensity: 4, cliffScale: 8, fogDensity: 0.028,
    fogColor: 0x47554b, sunColor: 0xc9cfb6, sunIntensity: 1.1,
  },
  // A shelf above the road, looking back down it.
  terrace: {
    tint: 0x76888c, treeDensity: 2.2, coniferShare: 0.85, deadShare: 0.3, undergrowthDensity: 12,
    coverage: 0.44, boulderDensity: 9, cliffScale: 12, fogDensity: 0.024,
    fogColor: 0x53656e, sunColor: 0xd4e2ea, sunIntensity: 1.6,
  },
}

export function gloamwoodValleyDressingFor(id: GloamwoodValleyRegionId) {
  return GLOAMWOOD_VALLEY_DRESSING.find((entry) => entry.id === id) ?? GLOAMWOOD_VALLEY_DRESSING[0]
}

/** Dressing at a point along the route, before any branch overrides it. */
export function gloamwoodValleyDressingAt(s: number) {
  const region = GLOAMWOOD_VALLEY.regions.find((entry) => s >= entry.from && s <= entry.to)
  // Chokes are dressed as the gorge, so a gate never reads as untended ground.
  return gloamwoodValleyDressingFor(region?.id ?? 'gorge')
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
  /** Branch it belongs to, or null on the main route. */
  branch: string | null
}

/**
 * Scatter the whole valley from a seed.
 *
 * Deterministic because the run already is: the same seed has to rebuild the
 * same valley, or a recorded session cannot be replayed against the map it
 * happened on.
 */
export function scatterGloamwoodValley(seed: number, budget = 6200): GloamwoodValleyProp[] {
  const random = seededRandom(seed)
  const props: GloamwoodValleyProp[] = []
  const branchBudget = Math.round(budget * 0.32)
  const routeBudget = budget - branchBudget
  const step = GLOAMWOOD_VALLEY_LENGTH / routeBudget

  for (let index = 0; index < routeBudget; index += 1) {
    const s = index * step + random() * step
    const dressing = gloamwoodValleyDressingAt(s)
    const lateral = (random() < 0.5 ? -1 : 1) * gloamwoodValleyHalfWidth(s) * random()
    const point = gloamwoodValleyPointAt(s, lateral)
    place(props, random, dressing, point.x, point.z, null)
  }

  // Branch budget follows chamber size, so a wide chamber is not left bare next
  // to a narrow spur that got the same number of samples.
  const reach = GLOAMWOOD_VALLEY_BRANCHES.map((branch) => branch.chamberHalfWidth * branch.reach)
  const reachTotal = reach.reduce((sum, value) => sum + value, 0)
  for (const [index, branch] of GLOAMWOOD_VALLEY_BRANCHES.entries()) {
    const count = Math.round(branchBudget * (reach[index] / reachTotal))
    const dressing = GLOAMWOOD_VALLEY_TERRAIN_DRESSING[branch.terrain]
    for (let sample = 0; sample < count; sample += 1) {
      const t = (sample + random()) / count
      const half = gloamwoodValleyBranchHalfWidth(branch, t)
      const lateral = (random() < 0.5 ? -1 : 1) * half * random()
      const point = gloamwoodValleyBranchPointAt(index, t, lateral)
      place(props, random, dressing, point.x, point.z, branch.id)
    }
  }
  return props
}

function place(
  props: GloamwoodValleyProp[],
  random: () => number,
  dressing: GloamwoodValleyDressing,
  x: number,
  z: number,
  branch: string | null,
) {
  const surface = gloamwoodValleyDominantSurface(x, z)
  // The path stays bare. A road is read by what is not on it.
  if (surface === 'road') return

  if (surface === 'wall') {
    // Walls are built from the same three rocks at many times their size.
    // Massing is what turns a prop into terrain.
    const variant = Math.floor(random() * 3)
    // A cliff may not reach out over the floor. Unclamped, the region's
    // cliffScale put nine-times rocks on a choke seven units wide: the gate
    // read superbly and the camera was inside the rock, with the player and
    // the whole fight behind it.
    const clearance = gloamwoodValleyWallClearance(x, z)
    // Radius three quarters of the clearance, not all of it. Touching the edge
    // of the floor is not the same as being out of the way: the camera sits
    // 16 back and 11.8 up, so a rock standing exactly on the boundary of a
    // sixteen-unit chamber still puts itself between the lens and the player.
    const ceiling = Math.min(dressing.cliffScale, clearance * 1.5 / GLOAMWOOD_ROCK_VARIANTS[variant].diameter)
    if (ceiling < 1.4) return
    const scale = 1.4 + random() * (ceiling - 1.4)
    props.push({
      kind: scale > dressing.cliffScale * 0.62 ? 'cliff' : 'boulder',
      x, z, scale, rotation: random() * Math.PI * 2, variant, tint: dressing.tint, branch,
    })
    return
  }

  // Walls keep their massing whatever the place: a cliff is not optional.
  if (random() > dressing.coverage) return

  const roll = random() * (dressing.treeDensity + dressing.undergrowthDensity + dressing.boulderDensity)
  if (roll < dressing.treeDensity) {
    const kindRoll = random()
    const variant = kindRoll < dressing.deadShare ? 6
      : kindRoll < dressing.deadShare + dressing.coniferShare ? 4 + Math.floor(random() * 2)
      : Math.floor(random() * 4)
    props.push({
      kind: 'tree', x, z, scale: 0.8 + random() * 0.55,
      rotation: random() * Math.PI * 2, variant, tint: dressing.tint, branch,
    })
  } else if (roll < dressing.treeDensity + dressing.undergrowthDensity) {
    props.push({
      kind: 'undergrowth', x, z, scale: 0.85 + random() * 0.95,
      rotation: random() * Math.PI * 2, variant: Math.floor(random() * 5), tint: dressing.tint, branch,
    })
  } else {
    props.push({
      // Loose rock on the floor stays small. At the first meshed pass these
      // ran to five units across and the shallows read as a quarry rather
      // than as the green, open place the player is meant to learn in.
      kind: 'boulder', x, z, scale: 0.5 + random() * 1.1,
      rotation: random() * Math.PI * 2, variant: Math.floor(random() * 3), tint: dressing.tint, branch,
    })
  }
}

/**
 * How far a wall point sits beyond the nearest standable ground.
 *
 * Read off the corridor solve rather than off a width passed in, so a rock
 * beside a branch is measured against that branch's floor and not against the
 * route's.
 */
export function gloamwoodValleyWallClearance(x: number, z: number) {
  const corridor = gloamwoodValleyCorridorAt(x, z)
  return Math.max(0, (corridor.across - GLOAMWOOD_VALLEY.walkShare) * corridor.halfWidth)
}

/**
 * Which kit tree a scattered `variant` means.
 *
 * The scatter decides broadleaf / conifer / dead from the shares and writes a
 * number. The kit's own array is ordered by when each model was added, so index
 * 3 is a pine and index 6 is another one - reading the scatter's number straight
 * off that array puts conifers in the shallows and broadleaf in the headwater,
 * which is the reverse of what the dressing data asks for.
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

export const GLOAMWOOD_VALLEY_TREE_IDS: readonly string[] = GLOAMWOOD_TREE_VARIANTS.map((variant) => variant.id)

/**
 * Where each region's look is centred along the route.
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

export function gloamwoodValleyAtmosphereAt(s: number): GloamwoodValleyAtmosphere {
  const last = GLOAMWOOD_VALLEY_DRESSING.length - 1
  if (s <= regionCenter(0)) return atmosphereOf(GLOAMWOOD_VALLEY_DRESSING[0])
  if (s >= regionCenter(last)) return atmosphereOf(GLOAMWOOD_VALLEY_DRESSING[last])
  for (let index = 0; index < last; index += 1) {
    const from = regionCenter(index)
    const to = regionCenter(index + 1)
    if (s > to) continue
    const t = (s - from) / (to - from)
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

/** Ground tint at this point along the route, blended the way the fog is. */
export function gloamwoodValleyTintAt(s: number) {
  const last = GLOAMWOOD_VALLEY_DRESSING.length - 1
  if (s <= regionCenter(0)) return GLOAMWOOD_VALLEY_DRESSING[0].tint
  if (s >= regionCenter(last)) return GLOAMWOOD_VALLEY_DRESSING[last].tint
  for (let index = 0; index < last; index += 1) {
    const from = regionCenter(index)
    const to = regionCenter(index + 1)
    if (s > to) continue
    return mixColor(GLOAMWOOD_VALLEY_DRESSING[index].tint, GLOAMWOOD_VALLEY_DRESSING[index + 1].tint, (s - from) / (to - from))
  }
  return GLOAMWOOD_VALLEY_DRESSING[last].tint
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

function seededRandom(seed: number) {
  let value = seed >>> 0 || 1
  return () => {
    value ^= value << 13
    value ^= value >>> 17
    value ^= value << 5
    return ((value >>> 0) % 100000) / 100000
  }
}
