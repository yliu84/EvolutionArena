import {
  GLOAMWOOD_POND,
  GLOAMWOOD_RIVER,
  LANDSCAPE,
  catmullRom,
  createGloamwoodLandscape,
  fbm,
  landscapeStats,
  riverWidth,
  sampleLandscape,
  splatWeights,
  type GroundKind,
  type LandscapeField,
  type Vec2,
} from './terrain'

export interface TerrainMaps {
  forest: CanvasImageSource
  dirt: CanvasImageSource
  mud: CanvasImageSource
  grass: CanvasImageSource
}

interface Raster {
  data: Uint8ClampedArray
  size: number
}

function mixChannel(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function wrap(value: number, size: number) {
  return ((value % size) + size) % size
}

function rasterize(source: CanvasImageSource, size = 1024): Raster {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d', { alpha: false })
  if (!context) return { data: new Uint8ClampedArray(size * size * 4), size }
  context.imageSmoothingEnabled = true
  context.drawImage(source, 0, 0, size, size)
  return { data: context.getImageData(0, 0, size, size).data, size }
}

function sampleTex(map: Raster, u: number, v: number): [number, number, number] {
  const x = wrap(u, map.size)
  const y = wrap(v, map.size)
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const x1 = (x0 + 1) % map.size
  const y1 = (y0 + 1) % map.size
  const tx = x - x0
  const ty = y - y0
  const i00 = (y0 * map.size + x0) * 4
  const i10 = (y0 * map.size + x1) * 4
  const i01 = (y1 * map.size + x0) * 4
  const i11 = (y1 * map.size + x1) * 4
  const r = mixChannel(mixChannel(map.data[i00], map.data[i10], tx), mixChannel(map.data[i01], map.data[i11], tx), ty)
  const g = mixChannel(mixChannel(map.data[i00 + 1], map.data[i10 + 1], tx), mixChannel(map.data[i01 + 1], map.data[i11 + 1], tx), ty)
  const b = mixChannel(mixChannel(map.data[i00 + 2], map.data[i10 + 2], tx), mixChannel(map.data[i01 + 2], map.data[i11 + 2], tx), ty)
  return [r, g, b]
}

function mixRgb(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [
    mixChannel(a[0], b[0], t),
    mixChannel(a[1], b[1], t),
    mixChannel(a[2], b[2], t),
  ]
}

function layered(map: Raster, x: number, y: number, scale: number): [number, number, number] {
  const close = sampleTex(map, x * scale, y * scale)
  const wide = sampleTex(map, x * scale * 0.34 + 40, y * scale * 0.34 + 18)
  return mixRgb(close, wide, 0.32)
}

function riverSpline(width: number, height: number) {
  return catmullRom(GLOAMWOOD_RIVER.map((point) => ({ x: point.x * width, y: point.y * height })), 24)
}

function pondSpec(width: number, height: number) {
  return {
    x: width * GLOAMWOOD_POND.x,
    y: height * GLOAMWOOD_POND.y,
    radius: Math.min(width, height) * GLOAMWOOD_POND.radius,
  }
}

function bankPair(path: readonly Vec2[], widthAt: (point: Vec2) => number) {
  const left: Vec2[] = []
  const right: Vec2[] = []
  for (let index = 0; index < path.length; index += 1) {
    const prev = path[Math.max(0, index - 1)]
    const next = path[Math.min(path.length - 1, index + 1)]
    let dx = next.x - prev.x
    let dy = next.y - prev.y
    const length = Math.hypot(dx, dy) || 1
    dx /= length
    dy /= length
    const point = path[index]
    const wobble = 0.82 + 0.32 * fbm(point.x * 0.018, point.y * 0.018, 3)
    const radius = widthAt(point) * wobble
    left.push({ x: point.x - dy * radius, y: point.y + dx * radius })
    right.push({ x: point.x + dy * radius, y: point.y - dx * radius })
  }
  return { left, right }
}

function pondOutline(cx: number, cy: number, radius: number, scale: number) {
  const points: Vec2[] = []
  const count = 36
  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * Math.PI * 2
    const reach = radius * scale * (0.78 + 0.28 * fbm(Math.cos(angle) * 2.4 + 8, Math.sin(angle) * 2.4 + 3, 3))
    points.push({
      x: cx + Math.cos(angle) * reach * 1.18,
      y: cy + Math.sin(angle) * reach * 0.78,
    })
  }
  return points
}

function paintFoam(context: CanvasRenderingContext2D, width: number, height: number) {
  const path = riverSpline(width, height)
  const water = bankPair(path, (point) => riverWidth(point.x, point.y) * 0.94)
  const pond = pondSpec(width, height)
  const pondEdge = pondOutline(pond.x, pond.y, pond.radius, 0.98)
  context.save()
  context.lineJoin = 'round'
  context.lineCap = 'round'
  context.strokeStyle = 'rgba(210, 228, 220, 0.1)'
  context.lineWidth = 1.6
  context.beginPath()
  context.moveTo(water.left[0].x, water.left[0].y)
  for (let index = 1; index < water.left.length; index += 1) context.lineTo(water.left[index].x, water.left[index].y)
  context.stroke()
  context.beginPath()
  context.moveTo(water.right[0].x, water.right[0].y)
  for (let index = 1; index < water.right.length; index += 1) context.lineTo(water.right[index].x, water.right[index].y)
  context.stroke()
  context.beginPath()
  context.moveTo(pondEdge[0].x, pondEdge[0].y)
  for (let index = 1; index < pondEdge.length; index += 1) context.lineTo(pondEdge[index].x, pondEdge[index].y)
  context.closePath()
  context.stroke()
  context.restore()
}

function paintLight(context: CanvasRenderingContext2D, field: LandscapeField) {
  const shadeCanvas = document.createElement('canvas')
  shadeCanvas.width = field.cols
  shadeCanvas.height = field.rows
  const shadeContext = shadeCanvas.getContext('2d')
  if (!shadeContext) return
  const image = shadeContext.createImageData(field.cols, field.rows)
  const data = image.data
  for (let row = 0; row < field.rows; row += 1) {
    for (let col = 0; col < field.cols; col += 1) {
      const sample = sampleLandscape(field, col * field.scale, row * field.scale)
      const value = Math.max(0, Math.min(255, Math.round(128 + sample.light * 78 + sample.elevation * 28)))
      const index = (row * field.cols + col) * 4
      data[index] = value
      data[index + 1] = value
      data[index + 2] = value
      data[index + 3] = 255
    }
  }
  shadeContext.putImageData(image, 0, 0)
  context.save()
  context.globalCompositeOperation = 'overlay'
  context.globalAlpha = 0.22
  context.imageSmoothingEnabled = true
  context.drawImage(shadeCanvas, 0, 0, field.width, field.height)
  context.restore()
}

function paintSplat(context: CanvasRenderingContext2D, field: LandscapeField, maps: TerrainMaps) {
  const forest = rasterize(maps.forest)
  const dirt = rasterize(maps.dirt)
  const mud = rasterize(maps.mud)
  const grass = rasterize(maps.grass)
  const width = field.width
  const height = field.height
  const image = context.createImageData(width, height)
  const data = image.data

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const sample = sampleLandscape(field, x, y)
      const widthAt = riverWidth(x, y)
      const dirtNoise = fbm(x * 0.007 + 5, y * 0.007, 4)
      const meadow = fbm(x * 0.0045 + 21, y * 0.0045, 3)
      const weight = splatWeights(sample.river, sample.slope, dirtNoise, widthAt, meadow)
      const forestRgb = layered(forest, x, y, 2.35)
      const grassRgb = layered(grass, x, y, 2.7)
      const dirtRgb = layered(dirt, x, y, 2.1)
      const mudRgb = mixRgb(layered(dirt, x, y, 1.9), layered(mud, x, y, 1.7), 0.28)
      const land: [number, number, number] = [
        forestRgb[0] * weight.forest + grassRgb[0] * weight.grass + dirtRgb[0] * weight.dirt + mudRgb[0] * weight.mud,
        forestRgb[1] * weight.forest + grassRgb[1] * weight.grass + dirtRgb[1] * weight.dirt + mudRgb[1] * weight.mud,
        forestRgb[2] * weight.forest + grassRgb[2] * weight.grass + dirtRgb[2] * weight.dirt + mudRgb[2] * weight.mud,
      ]
      const landScale = Math.max(0.001, 1 - weight.water)
      land[0] /= landScale
      land[1] /= landScale
      land[2] /= landScale
      const caustic = 0.72 + 0.28 * fbm(x * 0.045 + 8, y * 0.09, 3)
      const wet: [number, number, number] = [
        mudRgb[0] * 0.42 * caustic,
        mudRgb[1] * 0.55 * caustic,
        mudRgb[2] * 0.62 * caustic + 12,
      ]
      const color = mixRgb(land, wet, weight.water)
      const light = 0.74 + sample.light * 0.32
      const index = (y * width + x) * 4
      data[index] = Math.max(0, Math.min(255, color[0] * light))
      data[index + 1] = Math.max(0, Math.min(255, color[1] * light))
      data[index + 2] = Math.max(0, Math.min(255, color[2] * light))
      data[index + 3] = 255
    }
  }

  context.putImageData(image, 0, 0)
}

export const TERRAIN_TEXTURES = {
  forest: 'assets/terrain/forest.jpg',
  dirt: 'assets/terrain/dirt.jpg',
  mud: 'assets/terrain/mud.jpg',
  grass: 'assets/terrain/grass.jpg',
  bark: 'assets/terrain/bark.jpg',
} as const

export function paintGloamwoodCanvas(
  width = LANDSCAPE.width,
  height = LANDSCAPE.height,
  maps?: TerrainMaps,
): { canvas: HTMLCanvasElement; stats: Record<GroundKind, number> } {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const field = createGloamwoodLandscape(width, height)
  const stats = landscapeStats(field)
  const context = canvas.getContext('2d', { alpha: false })
  if (!context) return { canvas, stats }
  if (!maps) {
    context.fillStyle = '#3a4a28'
    context.fillRect(0, 0, width, height)
    return { canvas, stats }
  }

  paintSplat(context, field, maps)
  paintFoam(context, width, height)
  paintLight(context, field)
  return { canvas, stats }
}
