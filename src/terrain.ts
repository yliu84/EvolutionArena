export const LANDSCAPE = {
  width: 1920,
  height: 1280,
  fieldScale: 4,
} as const

export type GroundKind = 'water' | 'foam' | 'mud' | 'dirt' | 'grass'

export interface Vec2 {
  x: number
  y: number
}

export interface LandscapeField {
  width: number
  height: number
  scale: number
  cols: number
  rows: number
  heights: Float32Array
  river: Float32Array
}

export const GLOAMWOOD_RIVER: readonly Vec2[] = [
  { x: 0.02, y: 0.18 },
  { x: 0.18, y: 0.28 },
  { x: 0.34, y: 0.22 },
  { x: 0.48, y: 0.38 },
  { x: 0.58, y: 0.52 },
  { x: 0.72, y: 0.48 },
  { x: 0.86, y: 0.64 },
  { x: 0.98, y: 0.78 },
] as const

export const GLOAMWOOD_POND = { x: 0.22, y: 0.68, radius: 0.072 } as const

export function hash2(ix: number, iy: number) {
  const x = ix | 0
  const y = iy | 0
  let n = Math.imul(x, 374761393) + Math.imul(y, 668265263)
  n = Math.imul(n ^ (n >>> 13), 1274126177)
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296
}

export function valueNoise(x: number, y: number) {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const fx = x - x0
  const fy = y - y0
  const sx = fx * fx * (3 - 2 * fx)
  const sy = fy * fy * (3 - 2 * fy)
  const n00 = hash2(x0, y0)
  const n10 = hash2(x0 + 1, y0)
  const n01 = hash2(x0, y0 + 1)
  const n11 = hash2(x0 + 1, y0 + 1)
  const nx0 = n00 + (n10 - n00) * sx
  const nx1 = n01 + (n11 - n01) * sx
  return nx0 + (nx1 - nx0) * sy
}

export function fbm(x: number, y: number, octaves = 5) {
  let sum = 0
  let amp = 0.5
  let freq = 1
  let norm = 0
  for (let index = 0; index < octaves; index += 1) {
    sum += amp * valueNoise(x * freq, y * freq)
    norm += amp
    amp *= 0.5
    freq *= 2.07
  }
  return sum / norm
}

export function distToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax
  const dy = by - ay
  const length = dx * dx + dy * dy
  if (length < 1e-8) return Math.hypot(px - ax, py - ay)
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / length))
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t))
}

export function catmullRom(points: readonly Vec2[], samplesPerSpan = 12): Vec2[] {
  if (points.length < 2) return [...points]
  const padded = [points[0], ...points, points[points.length - 1]]
  const out: Vec2[] = []
  for (let index = 0; index < padded.length - 3; index += 1) {
    const p0 = padded[index]
    const p1 = padded[index + 1]
    const p2 = padded[index + 2]
    const p3 = padded[index + 3]
    for (let step = 0; step < samplesPerSpan; step += 1) {
      const t = step / samplesPerSpan
      const t2 = t * t
      const t3 = t2 * t
      out.push({
        x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      })
    }
  }
  out.push(points[points.length - 1])
  return out
}

export function riverDistance(x: number, y: number, path: readonly Vec2[]) {
  let nearest = Infinity
  for (let index = 1; index < path.length; index += 1) {
    nearest = Math.min(nearest, distToSegment(x, y, path[index - 1].x, path[index - 1].y, path[index].x, path[index].y))
  }
  return nearest
}

export function riverWidth(x: number, y: number) {
  return 46 + 22 * fbm(x * 0.008, y * 0.008, 3) + 10 * Math.sin((x + y) * 0.009)
}

export function classifyGround(riverDist: number, slope: number, dirtNoise: number, width: number): GroundKind {
  if (riverDist < width * 0.78) return 'water'
  if (riverDist < width * 0.96) return 'foam'
  if (riverDist < width + 34 + slope * 18) return 'mud'
  if (slope > 0.045 || dirtNoise > 0.58) return 'dirt'
  return 'grass'
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value))
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = clamp01((value - edge0) / (edge1 - edge0))
  return t * t * (3 - 2 * t)
}

export interface SplatWeights {
  water: number
  mud: number
  dirt: number
  grass: number
  forest: number
}

export function splatWeights(
  riverDist: number,
  slope: number,
  dirtNoise: number,
  width: number,
  meadow: number,
): SplatWeights {
  const water = 1 - smoothstep(width * 0.52, width * 0.98, riverDist)
  const mud = (1 - water) * (1 - smoothstep(width * 0.9, width + 52, riverDist))
  const remain = Math.max(0, 1 - water - mud)
  const dirt = remain * clamp01((dirtNoise - 0.38) * 2.15 + slope * 9)
  const plant = Math.max(0, remain - dirt)
  const grass = plant * clamp01((meadow - 0.42) * 1.8)
  const forest = Math.max(0, plant - grass)
  return { water, mud, dirt, grass, forest }
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function sampleGrid(grid: Float32Array, cols: number, rows: number, u: number, v: number) {
  const x = Math.max(0, Math.min(cols - 1.001, u))
  const y = Math.max(0, Math.min(rows - 1.001, v))
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const x1 = Math.min(cols - 1, x0 + 1)
  const y1 = Math.min(rows - 1, y0 + 1)
  const tx = x - x0
  const ty = y - y0
  const a = grid[y0 * cols + x0]
  const b = grid[y0 * cols + x1]
  const c = grid[y1 * cols + x0]
  const d = grid[y1 * cols + x1]
  return lerp(lerp(a, b, tx), lerp(c, d, tx), ty)
}

export function createGloamwoodLandscape(
  width = LANDSCAPE.width,
  height = LANDSCAPE.height,
  scale = LANDSCAPE.fieldScale,
): LandscapeField {
  const cols = Math.ceil(width / scale)
  const rows = Math.ceil(height / scale)
  const heightField = new Float32Array(cols * rows)
  const riverField = new Float32Array(cols * rows)
  const path = catmullRom(GLOAMWOOD_RIVER.map((point) => ({ x: point.x * width, y: point.y * height })), 16)
  const pond = {
    x: width * GLOAMWOOD_POND.x,
    y: height * GLOAMWOOD_POND.y,
    radius: Math.min(width, height) * GLOAMWOOD_POND.radius,
  }

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const x = col * scale
      const y = row * scale
      const hills = fbm(x * 0.0024, y * 0.0024, 5)
      const ridges = fbm(x * 0.006 + 40, y * 0.006, 3)
      const river = riverDistance(x, y, path)
      const pondDist = Math.hypot(x - pond.x, y - pond.y) - pond.radius
      const water = Math.min(river, Math.max(0, pondDist + 40))
      const valley = Math.max(0, 1 - water / 120)
      const elevation = hills * 0.72 + ridges * 0.28 - valley * 0.42
      heightField[row * cols + col] = elevation
      riverField[row * cols + col] = water
    }
  }

  return { width, height, scale, cols, rows, heights: heightField, river: riverField }
}

export function sampleLandscape(field: LandscapeField, x: number, y: number) {
  const u = x / field.scale
  const v = y / field.scale
  const elevation = sampleGrid(field.heights, field.cols, field.rows, u, v)
  const river = sampleGrid(field.river, field.cols, field.rows, u, v)
  const west = sampleGrid(field.heights, field.cols, field.rows, u - 1.2, v)
  const east = sampleGrid(field.heights, field.cols, field.rows, u + 1.2, v)
  const north = sampleGrid(field.heights, field.cols, field.rows, u, v - 1.2)
  const south = sampleGrid(field.heights, field.cols, field.rows, u, v + 1.2)
  const slope = Math.hypot(east - west, south - north)
  const light = Math.max(0.42, Math.min(1.18, 0.78 + (west - east) * 3.4 + (north - south) * 2.6))
  return { elevation, river, slope, light }
}

export function landscapeStats(field: LandscapeField) {
  const counts: Record<GroundKind, number> = { water: 0, foam: 0, mud: 0, dirt: 0, grass: 0 }
  const step = 8
  for (let y = 0; y < field.height; y += step) {
    for (let x = 0; x < field.width; x += step) {
      const sample = sampleLandscape(field, x, y)
      const kind = classifyGround(sample.river, sample.slope, fbm(x * 0.018, y * 0.018, 3), riverWidth(x, y))
      counts[kind] += 1
    }
  }
  return counts
}
