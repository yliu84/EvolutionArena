/**
 * Typed manifest for the Gloamwood 3D environment kit
 * (Quaternius Stylized Nature MegaKit, CC0).
 *
 * Sizes are in world units. The stage-2 player stands 2.55 world units tall,
 * so tree heights of 7.2–8.8 keep the established "trees are roughly 3–4x the
 * hunter" scale. Footprint ratios are fractions of the final tree height and
 * must match the visible trunk/canopy so authoritative collision and camera
 * occlusion stay honest (Goal 2 lesson: blocking must match visible footprint).
 */

export interface GloamwoodTreeVariant {
  id: string
  url: string
  /** Final world height at sizeFactor 1. */
  height: number
  /** Trunk collision radius as a fraction of final height. */
  trunkRatio: number
  /** Canopy occluder center height as a fraction of final height. */
  canopyCenterRatio: number
  /** Canopy occluder radius as a fraction of final height. */
  canopyRadiusRatio: number
}

export interface GloamwoodRockVariant {
  id: string
  url: string
  /** Max lateral diameter in world units at sizeFactor 1. */
  diameter: number
}

export const GLOAMWOOD_PLAYER_STAGE2_HEIGHT = 2.55

const KIT = '/assets/gloamwood/kit/quaternius'

export const GLOAMWOOD_TREE_VARIANTS: readonly GloamwoodTreeVariant[] = [
  {
    id: 'broadleaf-a',
    url: `${KIT}/tree-a.glb`,
    height: 8.2,
    trunkRatio: 0.07,
    canopyCenterRatio: 0.62,
    canopyRadiusRatio: 0.24,
  },
  {
    id: 'broadleaf-b',
    url: `${KIT}/tree-b.glb`,
    height: 8.0,
    trunkRatio: 0.07,
    canopyCenterRatio: 0.62,
    canopyRadiusRatio: 0.22,
  },
  {
    id: 'broadleaf-c',
    url: `${KIT}/tree-c.glb`,
    height: 7.4,
    trunkRatio: 0.075,
    canopyCenterRatio: 0.6,
    canopyRadiusRatio: 0.3,
  },
  {
    id: 'pine-a',
    url: `${KIT}/pine-a.glb`,
    height: 8.6,
    trunkRatio: 0.055,
    canopyCenterRatio: 0.56,
    canopyRadiusRatio: 0.34,
  },
  {
    id: 'broadleaf-d',
    url: `${KIT}/tree-d.glb`,
    height: 7.2,
    trunkRatio: 0.075,
    canopyCenterRatio: 0.6,
    canopyRadiusRatio: 0.32,
  },
  {
    id: 'broadleaf-b',
    url: `${KIT}/tree-b.glb`,
    height: 8.0,
    trunkRatio: 0.07,
    canopyCenterRatio: 0.62,
    canopyRadiusRatio: 0.22,
  },
  {
    id: 'pine-b',
    url: `${KIT}/pine-b.glb`,
    height: 8.8,
    trunkRatio: 0.055,
    canopyCenterRatio: 0.55,
    canopyRadiusRatio: 0.36,
  },
  {
    id: 'dead-a',
    url: `${KIT}/dead-a.glb`,
    height: 8.0,
    trunkRatio: 0.055,
    canopyCenterRatio: 0.58,
    canopyRadiusRatio: 0.3,
  },
] as const

export const GLOAMWOOD_ROCK_VARIANTS: readonly GloamwoodRockVariant[] = [
  { id: 'boulder-a', url: `${KIT}/rock-a.glb`, diameter: 1.9 },
  { id: 'boulder-b', url: `${KIT}/rock-b.glb`, diameter: 2.0 },
  { id: 'boulder-c', url: `${KIT}/rock-c.glb`, diameter: 2.1 },
] as const

/** Maps the legacy per-tree scale sample (0.78–1.5) onto a gentle size factor. */
export function treeSizeFactor(scaleSample: number) {
  return 0.82 + (scaleSample - 0.78) * 0.42
}

export function treeVariantForIndex(index: number) {
  return GLOAMWOOD_TREE_VARIANTS[index % GLOAMWOOD_TREE_VARIANTS.length]
}

export function rockVariantForIndex(index: number) {
  return GLOAMWOOD_ROCK_VARIANTS[index % GLOAMWOOD_ROCK_VARIANTS.length]
}

export function treeFootprint(variant: GloamwoodTreeVariant, sizeFactor: number) {
  const height = variant.height * sizeFactor
  return {
    height,
    trunkRadius: Math.max(0.5, height * variant.trunkRatio),
    canopyCenterY: height * variant.canopyCenterRatio,
    canopyRadius: height * variant.canopyRadiusRatio,
  }
}

export function rockFootprint(variant: GloamwoodRockVariant, scaleSample: number) {
  const diameter = variant.diameter * (0.5 + scaleSample * 0.85)
  return { diameter, radius: diameter * 0.5 }
}

export type GloamwoodVegetationLayer = 'bush' | 'grass' | 'tall-grass' | 'fern' | 'mushroom'

export interface GloamwoodVegetationVariant {
  id: GloamwoodVegetationLayer
  url: string
  /** Normalization axis: height for upright plants, lateral for lying props. */
  mode: 'height' | 'lateral'
  /** Final world size in world units at the mid jitter sample (0.5). */
  baseSize: number
  /** ± fraction of baseSize applied across the jitter sample range 0..1. */
  sizeJitter: number
  /** Instances to scatter across the map. */
  count: number
  /** Minimum distance from the walkable path centerline. */
  pathClearance: number
  /** Anchor placements around existing trees instead of open ground. */
  anchorToTrees: boolean
  /** Grass-scale props skip shadow casting to keep the shadow pass cheap. */
  castShadow: boolean
}

/**
 * Purely decorative undergrowth: none of these layers registers a collision
 * obstacle, so combat movement and prey pathing are untouched by density.
 */
export const GLOAMWOOD_VEGETATION_VARIANTS: readonly GloamwoodVegetationVariant[] = [
  {
    id: 'bush',
    url: `${KIT}/bush.glb`,
    mode: 'height',
    baseSize: 0.92,
    sizeJitter: 0.32,
    count: 80,
    pathClearance: 2.6,
    anchorToTrees: false,
    castShadow: true,
  },
  {
    id: 'grass',
    url: `${KIT}/grass-clump.glb`,
    mode: 'height',
    baseSize: 0.95,
    sizeJitter: 0.4,
    count: 180,
    pathClearance: 1.5,
    anchorToTrees: false,
    castShadow: false,
  },
  {
    id: 'tall-grass',
    url: `${KIT}/tall-grass.glb`,
    mode: 'height',
    baseSize: 0.95,
    sizeJitter: 0.32,
    count: 64,
    pathClearance: 1.9,
    anchorToTrees: false,
    castShadow: false,
  },
  {
    id: 'fern',
    url: `${KIT}/fern.glb`,
    mode: 'height',
    baseSize: 0.7,
    sizeJitter: 0.28,
    count: 56,
    pathClearance: 2.4,
    anchorToTrees: true,
    castShadow: false,
  },
  {
    id: 'mushroom',
    url: `${KIT}/mushroom.glb`,
    mode: 'height',
    baseSize: 0.32,
    sizeJitter: 0.35,
    count: 28,
    pathClearance: 2.6,
    anchorToTrees: true,
    castShadow: false,
  },
] as const

export function vegetationWorldSize(variant: GloamwoodVegetationVariant, jitterSample: number) {
  return variant.baseSize * (1 + (jitterSample - 0.5) * 2 * variant.sizeJitter)
}
