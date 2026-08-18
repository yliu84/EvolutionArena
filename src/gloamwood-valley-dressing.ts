import {
  GLOAMWOOD_VALLEY,
  gloamwoodValleyDominantSurface,
  gloamwoodValleyHalfWidth,
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
}

export const GLOAMWOOD_VALLEY_DRESSING: readonly GloamwoodValleyRegionDressing[] = [
  {
    // River mouth: open, green, safe-looking. The player learns here.
    id: 'shallows',
    tint: 0x9fbe86,
    treeDensity: 5.5,
    coniferShare: 0.15,
    deadShare: 0.05,
    undergrowthDensity: 26,
    coverage: 0.92,
    boulderDensity: 3.2,
    cliffScale: 6,
    fogDensity: 0.012,
  },
  {
    // Gorge: walls close in, light drops, conifers take over from broadleaf.
    id: 'gorge',
    tint: 0x7f9c7a,
    treeDensity: 3.4,
    coniferShare: 0.62,
    deadShare: 0.18,
    undergrowthDensity: 15,
    coverage: 0.62,
    boulderDensity: 6.8,
    cliffScale: 9,
    fogDensity: 0.02,
  },
  {
    // Headwater: high, cold and largely dead. Rock does the talking.
    id: 'headwater',
    tint: 0x6f8388,
    treeDensity: 1.9,
    coniferShare: 0.5,
    deadShare: 0.42,
    undergrowthDensity: 8,
    coverage: 0.34,
    boulderDensity: 11.5,
    cliffScale: 12,
    fogDensity: 0.03,
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
      const scale = 3 + random() * (dressing.cliffScale - 3)
      props.push({
        kind: scale > dressing.cliffScale * 0.62 ? 'cliff' : 'boulder',
        x, z, scale, rotation: random() * Math.PI * 2,
        variant: Math.floor(random() * 3), tint: dressing.tint,
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
        kind: 'undergrowth', x, z, scale: 0.7 + random() * 0.7,
        rotation: random() * Math.PI * 2, variant: Math.floor(random() * 5), tint: dressing.tint,
      })
    } else {
      props.push({
        kind: 'boulder', x, z, scale: 0.9 + random() * 1.8,
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
