import type { GloamwoodValleyProp } from './gloamwood-valley-dressing'

/**
 * How the valley's props are cut up for drawing.
 *
 * The Gloamwood is 58 units across and every prop is always on screen, so it
 * gets away with one batch per species. The valley is 1600 units of route
 * folded through a 1500-by-600 footprint, and the camera can see perhaps a
 * tenth of it, which changes the problem: an InstancedMesh is culled all or
 * nothing, so a single batch spanning the whole valley draws the headwater's
 * cliffs while the player is still in the shallows.
 *
 * So the props are binned by position and bins far from the camera are switched
 * off outright. The bins are a plain square grid rather than slices along the
 * route: the route turns back on itself, so two points far apart along it can
 * be neighbours in the world, and a player standing between them has to be able
 * to see both.
 */
export const GLOAMWOOD_VALLEY_CELL = 120

/** How far from the camera a cell may be and still be drawn. */
export const GLOAMWOOD_VALLEY_DRAW_DISTANCE = 240

export interface GloamwoodValleyCellKey {
  column: number
  row: number
}

export function gloamwoodValleyCellOf(x: number, z: number): GloamwoodValleyCellKey {
  return { column: Math.floor(x / GLOAMWOOD_VALLEY_CELL), row: Math.floor(z / GLOAMWOOD_VALLEY_CELL) }
}

export function gloamwoodValleyCellId(cell: GloamwoodValleyCellKey) {
  return `${cell.column}:${cell.row}`
}

/**
 * True when any part of the cell is near enough to matter.
 *
 * Measured to the cell's nearest edge rather than its centre: measuring to the
 * centre switches a cell off while the player is still looking across its near
 * half, which is a popping seam directly ahead of them.
 */
export function gloamwoodValleyCellDrawn(cell: GloamwoodValleyCellKey, cameraX: number, cameraZ: number) {
  const left = cell.column * GLOAMWOOD_VALLEY_CELL
  const top = cell.row * GLOAMWOOD_VALLEY_CELL
  const dx = cameraX < left ? left - cameraX : cameraX > left + GLOAMWOOD_VALLEY_CELL ? cameraX - left - GLOAMWOOD_VALLEY_CELL : 0
  const dz = cameraZ < top ? top - cameraZ : cameraZ > top + GLOAMWOOD_VALLEY_CELL ? cameraZ - top - GLOAMWOOD_VALLEY_CELL : 0
  return Math.hypot(dx, dz) <= GLOAMWOOD_VALLEY_DRAW_DISTANCE
}

export interface GloamwoodValleyPropCell {
  cell: GloamwoodValleyCellKey
  props: GloamwoodValleyProp[]
}

export function groupGloamwoodValleyProps(props: readonly GloamwoodValleyProp[]): GloamwoodValleyPropCell[] {
  const cells = new Map<string, GloamwoodValleyPropCell>()
  for (const prop of props) {
    const cell = gloamwoodValleyCellOf(prop.x, prop.z)
    const id = gloamwoodValleyCellId(cell)
    const existing = cells.get(id)
    if (existing) existing.props.push(prop)
    else cells.set(id, { cell, props: [prop] })
  }
  return [...cells.values()]
}

/** Props actually submitted for drawing from a given point in the world. */
export function gloamwoodValleyDrawnPropCount(
  props: readonly GloamwoodValleyProp[],
  cameraX: number,
  cameraZ: number,
) {
  return groupGloamwoodValleyProps(props).reduce(
    (total, cell) => total + (gloamwoodValleyCellDrawn(cell.cell, cameraX, cameraZ) ? cell.props.length : 0),
    0,
  )
}
