import { GLOAMWOOD_VALLEY } from './gloamwood-valley-terrain'
import type { GloamwoodValleyProp } from './gloamwood-valley-dressing'

/**
 * How the valley's props are cut up for drawing.
 *
 * The Gloamwood is 58 units across and every prop is always on screen, so it
 * gets away with one batch per species. The valley is 1600 units long and the
 * camera can see perhaps a sixth of it, which changes the problem: an
 * InstancedMesh is culled all or nothing, so a single batch spanning the whole
 * valley draws the headwater's cliffs while the player is still in the
 * shallows.
 *
 * So the props are binned by position and each bin gets its own batches, and
 * bins far from the camera are switched off outright. Fog already hides them -
 * this only stops the GPU paying for what the fog is covering up.
 */
export const GLOAMWOOD_VALLEY_CHUNK_LENGTH = 200

/** How far down the valley a chunk may be and still be drawn. */
export const GLOAMWOOD_VALLEY_DRAW_DISTANCE = 260

export function gloamwoodValleyChunkCount() {
  return Math.ceil(GLOAMWOOD_VALLEY.length / GLOAMWOOD_VALLEY_CHUNK_LENGTH)
}

export function gloamwoodValleyChunkOf(x: number) {
  const index = Math.floor(x / GLOAMWOOD_VALLEY_CHUNK_LENGTH)
  return Math.min(gloamwoodValleyChunkCount() - 1, Math.max(0, index))
}

/**
 * True when any part of the chunk is near enough to matter.
 *
 * Measured to the chunk's nearest edge rather than its centre: measuring to the
 * centre switches a chunk off while the player is still looking down its near
 * half, which is a popping seam directly ahead of them.
 */
export function gloamwoodValleyChunkDrawn(chunk: number, cameraX: number) {
  const from = chunk * GLOAMWOOD_VALLEY_CHUNK_LENGTH
  const to = from + GLOAMWOOD_VALLEY_CHUNK_LENGTH
  const distance = cameraX < from ? from - cameraX : cameraX > to ? cameraX - to : 0
  return distance <= GLOAMWOOD_VALLEY_DRAW_DISTANCE
}

export function groupGloamwoodValleyProps(props: readonly GloamwoodValleyProp[]) {
  const chunks: GloamwoodValleyProp[][] = Array.from(
    { length: gloamwoodValleyChunkCount() },
    () => [],
  )
  for (const prop of props) chunks[gloamwoodValleyChunkOf(prop.x)].push(prop)
  return chunks
}

/** Props actually submitted for drawing from a given point along the valley. */
export function gloamwoodValleyDrawnPropCount(props: readonly GloamwoodValleyProp[], cameraX: number) {
  return groupGloamwoodValleyProps(props).reduce(
    (total, chunk, index) => total + (gloamwoodValleyChunkDrawn(index, cameraX) ? chunk.length : 0),
    0,
  )
}
