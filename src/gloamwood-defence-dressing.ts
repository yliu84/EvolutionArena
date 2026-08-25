import {
  GLOAMWOOD_DEFENCE,
  gloamwoodDefenceCameraLaneDistance,
  gloamwoodDefenceNearestWalkable,
  gloamwoodDefenceWalkable,
} from './gloamwood-defence-terrain'

/**
 * Where the props go on the defence map.
 *
 * Kept separate from the scene that draws them, and pure, because the one thing
 * this scatter must guarantee is a rule about *space* rather than about looks:
 * the bowl and the road stay clear. The owner's brief was explicit - "树和石头
 * 太多影响视野和操作" - and a rule that only holds because nobody looked closely
 * is not a rule.
 *
 * The wall is `gloamwoodDefenceConfine`, not these props. Nothing here blocks
 * anyone; the confine already refuses to put a body outside the walkable
 * ground. The trees exist so the wall is *legible* - so a player reads the edge
 * of the bowl as a forest they cannot enter rather than as an invisible fence.
 *
 * That split is deliberate and worth keeping. Deriving collision from scattered
 * props is right on the valley, where the corridor is wide and the props are
 * what make it narrow. Here the shape is the corridor, and turning a band of
 * decorative trunks into collision would give the bowl a ragged rim that
 * disagrees with the circle every distance in the layout was measured against.
 */

export type GloamwoodDefencePropKind = 'tree' | 'rock' | 'plant'

export interface GloamwoodDefenceProp {
  kind: GloamwoodDefencePropKind
  x: number
  z: number
  /** Index into the kit's variant list for this kind. */
  variant: number
  rotation: number
  scale: number
}

/** Deterministic, because the same map has to be rebuilt from the same seed. */
function mulberry(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = Math.imul(state ^ (state >>> 15), 1 | state)
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * How far from the walkable edge a prop has to stand before it may be drawn.
 *
 * A trunk centred exactly on the boundary reads as growing out of the floor and
 * its canopy hangs over ground the player fights on, which is the visual noise
 * the brief asked to remove. One clearance is spent on trunks, a smaller one on
 * ground plants, which are allowed to creep up to the rim because they are flat
 * and do not occlude.
 */
export const GLOAMWOOD_DEFENCE_SCATTER = {
  treeClearance: 1.6,
  plantClearance: 0.2,
  /** Beyond this the bank is out of frame at the gameplay camera; drawing it is waste. */
  wallBandDepth: 14,
  /**
   * How wide a lane the camera needs kept free of trunks and boulders.
   *
   * The altar is against the south wall, so the lens sits *inside* that wall
   * whenever the player is defending. Without this the first build framed a
   * screenful of canopy. The gap it carves is always behind the lens, which is
   * why it costs nothing to look at.
   */
  cameraClearance: 5,
  trees: 320,
  rocks: 90,
  plants: 260,
} as const

function outsideEnough(x: number, z: number, clearance: number) {
  if (gloamwoodDefenceWalkable(x, z)) return false
  return gloamwoodDefenceNearestWalkable(x, z).distance >= clearance
}

/**
 * Scatter the whole map from a seed.
 *
 * Rejection sampling rather than a formula: the walkable region is a circle
 * unioned with a tapering road, and every closed form for "just outside that"
 * this had before was a shape that disagreed with `walkable` somewhere. Asking
 * the same function the runtime asks cannot disagree with it.
 */
export function scatterGloamwoodDefence(seed: number): GloamwoodDefenceProp[] {
  const random = mulberry(seed)
  const { halfWidth, halfDepth } = GLOAMWOOD_DEFENCE.bounds
  const props: GloamwoodDefenceProp[] = []

  const place = (
    kind: GloamwoodDefencePropKind,
    count: number,
    variants: number,
    clearance: number,
    scaleRange: readonly [number, number],
  ) => {
    let placed = 0
    // Bounded: a scatter that cannot meet its budget must give up rather than
    // spin. The band is deliberately generous, so falling short means the
    // layout changed shape and the count wants revisiting.
    for (let attempt = 0; attempt < count * 40 && placed < count; attempt += 1) {
      const x = (random() * 2 - 1) * halfWidth
      const z = (random() * 2 - 1) * halfDepth
      if (!outsideEnough(x, z, clearance)) continue
      if (gloamwoodDefenceNearestWalkable(x, z).distance > GLOAMWOOD_DEFENCE_SCATTER.wallBandDepth) continue
      // Ground cover is flat and never occludes, so only trunks and boulders
      // are kept out of the camera's lane.
      if (kind !== 'plant'
        && gloamwoodDefenceCameraLaneDistance(x, z) < GLOAMWOOD_DEFENCE_SCATTER.cameraClearance) continue
      props.push({
        kind,
        x,
        z,
        variant: Math.floor(random() * variants),
        rotation: random() * Math.PI * 2,
        scale: scaleRange[0] + random() * (scaleRange[1] - scaleRange[0]),
      })
      placed += 1
    }
    return placed
  }

  place('tree', GLOAMWOOD_DEFENCE_SCATTER.trees, 6, GLOAMWOOD_DEFENCE_SCATTER.treeClearance, [0.8, 1.35])
  place('rock', GLOAMWOOD_DEFENCE_SCATTER.rocks, 3, GLOAMWOOD_DEFENCE_SCATTER.treeClearance, [0.7, 1.6])
  place('plant', GLOAMWOOD_DEFENCE_SCATTER.plants, 7, GLOAMWOOD_DEFENCE_SCATTER.plantClearance, [0.6, 1.1])
  return props
}
