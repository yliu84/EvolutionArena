export interface V4FogCell {
  x: number
  y: number
  centerX: number
  centerY: number
  explored: boolean
}

export const V4_FOG_CELL_SIZE = 96
export const V4_VISION_RADIUS = 610
export const V4_REVEAL_RADIUS = 790

export function createV4FogGrid(width: number, height: number, cellSize = V4_FOG_CELL_SIZE): V4FogCell[] {
  const cells: V4FogCell[] = []
  for (let y = 0; y < height; y += cellSize) {
    for (let x = 0; x < width; x += cellSize) {
      cells.push({
        x,
        y,
        centerX: x + cellSize / 2,
        centerY: y + cellSize / 2,
        explored: false,
      })
    }
  }
  return cells
}

export function revealV4Fog(cells: V4FogCell[], x: number, y: number, radius = V4_REVEAL_RADIUS) {
  const radiusSquared = radius * radius
  let newlyExplored = 0
  for (const cell of cells) {
    if (cell.explored) continue
    const dx = cell.centerX - x
    const dy = cell.centerY - y
    if (dx * dx + dy * dy > radiusSquared) continue
    cell.explored = true
    newlyExplored += 1
  }
  return newlyExplored
}

export function v4FogExploredPercent(cells: readonly V4FogCell[]) {
  if (cells.length === 0) return 0
  return Math.round(cells.filter((cell) => cell.explored).length / cells.length * 1000) / 10
}
