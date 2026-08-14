import { hash2, fbm, riverWidth, sampleLandscape, type LandscapeField } from './terrain'

export const TREE_KINDS = ['oak', 'pine', 'birch', 'dead'] as const
export type TreeKind = (typeof TREE_KINDS)[number]

export const WOODLAND_VIEW = {
  /**
   * Fake high-angle 2.5D. 1 = 90° straight down.
   * ~0.91 is about 65–70° from the ground: close to a steep RTS shot, not nadir.
   * Warcraft 3's default camera is actually closer to 55–60° from the ground.
   * Not a real 3D camera.
   */
  groundTilt: 0.91,
  treeCount: 16,
  minDist: 260,
  groveSpread: 72,
  playerHeight: 96,
} as const

export interface WoodlandTree {
  x: number
  y: number
  kind: TreeKind
  scale: number
  flipX: boolean
}

export interface TreeMaps {
  bark: CanvasImageSource
  leaves: CanvasImageSource
}

const TREE_SIZE: Record<TreeKind, { width: number; height: number }> = {
  oak: { width: 280, height: 400 },
  pine: { width: 200, height: 420 },
  birch: { width: 200, height: 380 },
  dead: { width: 180, height: 340 },
}

function tilePattern(context: CanvasRenderingContext2D, source: CanvasImageSource) {
  return context.createPattern(source as CanvasImageSource, 'repeat')
}

function fillClipped(
  context: CanvasRenderingContext2D,
  clip: () => void,
  paint: () => void,
) {
  context.save()
  context.beginPath()
  clip()
  context.clip()
  paint()
  context.restore()
}

function paintGroundShadow(context: CanvasRenderingContext2D, cx: number, baseY: number, rx: number, ry: number) {
  context.fillStyle = 'rgba(0,0,0,0.38)'
  context.beginPath()
  context.ellipse(cx + 22, baseY + 6, rx, ry, -0.22, 0, Math.PI * 2)
  context.fill()
}

function paintBarkTrunk(
  context: CanvasRenderingContext2D,
  cx: number,
  topY: number,
  baseY: number,
  topW: number,
  baseW: number,
  bark: CanvasPattern | string,
) {
  const pad = Math.max(baseW, topW) + 6
  fillClipped(context, () => {
    context.moveTo(cx - baseW, baseY)
    context.quadraticCurveTo(cx - baseW - 4, (topY + baseY) * 0.5, cx - topW, topY)
    context.lineTo(cx + topW, topY)
    context.quadraticCurveTo(cx + baseW + 4, (topY + baseY) * 0.5, cx + baseW, baseY)
    context.closePath()
  }, () => {
    context.save()
    context.translate(cx, topY)
    context.scale(0.55, 0.7)
    context.fillStyle = bark
    context.fillRect(-pad * 3, -8, pad * 6, (baseY - topY) * 2 + 16)
    context.restore()
    const shade = context.createLinearGradient(cx - baseW, 0, cx + baseW, 0)
    shade.addColorStop(0, 'rgba(0,0,0,0.62)')
    shade.addColorStop(0.28, 'rgba(0,0,0,0.12)')
    shade.addColorStop(0.4, 'rgba(255,228,190,0.32)')
    shade.addColorStop(0.58, 'rgba(0,0,0,0.06)')
    shade.addColorStop(0.82, 'rgba(0,0,0,0.28)')
    shade.addColorStop(1, 'rgba(0,0,0,0.58)')
    context.fillStyle = shade
    context.fillRect(cx - pad, topY - 2, pad * 2, baseY - topY + 8)
  })
}

function clipLeafMass(context: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, rotate: number) {
  context.ellipse(cx, cy, rx, ry, rotate, 0, Math.PI * 2)
  context.ellipse(cx - rx * 0.42, cy + ry * 0.12, rx * 0.58, ry * 0.52, rotate - 0.2, 0, Math.PI * 2)
  context.ellipse(cx + rx * 0.38, cy - ry * 0.16, rx * 0.5, ry * 0.48, rotate + 0.18, 0, Math.PI * 2)
  context.ellipse(cx + rx * 0.08, cy + ry * 0.38, rx * 0.48, ry * 0.34, rotate + 0.06, 0, Math.PI * 2)
  context.ellipse(cx - rx * 0.12, cy - ry * 0.36, rx * 0.4, ry * 0.32, rotate - 0.1, 0, Math.PI * 2)
}

function paintCanopyGlobe(
  context: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  leaves: CanvasPattern | string,
  tint: string,
  rotate = 0,
) {
  fillClipped(context, () => {
    clipLeafMass(context, cx, cy, rx, ry, rotate)
  }, () => {
    context.save()
    context.translate(cx, cy)
    context.rotate(rotate)
    context.scale(0.55, 0.55)
    context.fillStyle = leaves
    context.fillRect(-rx * 5, -ry * 5, rx * 10, ry * 10)
    context.restore()
    context.globalCompositeOperation = 'multiply'
    context.globalAlpha = 0.55
    context.fillStyle = tint
    context.fillRect(cx - rx * 1.2, cy - ry * 1.2, rx * 2.4, ry * 2.4)
    context.globalAlpha = 1
    context.globalCompositeOperation = 'source-over'
    const shade = context.createLinearGradient(cx - rx, cy - ry, cx + rx * 0.35, cy + ry)
    shade.addColorStop(0, 'rgba(255,255,220,0.14)')
    shade.addColorStop(0.4, 'rgba(0,0,0,0)')
    shade.addColorStop(1, 'rgba(0,0,0,0.42)')
    context.fillStyle = shade
    context.fillRect(cx - rx * 1.2, cy - ry * 1.2, rx * 2.4, ry * 2.4)
    context.fillStyle = 'rgba(0,0,0,0.22)'
    context.beginPath()
    context.ellipse(cx + rx * 0.12, cy + ry * 0.5, rx * 0.72, ry * 0.28, 0.08, 0, Math.PI * 2)
    context.fill()
  })
}

function paintOak(context: CanvasRenderingContext2D, width: number, height: number, bark: CanvasPattern | string, leaves: CanvasPattern | string) {
  const cx = width * 0.5
  const baseY = height - 24
  paintGroundShadow(context, cx, baseY, 54, 14)
  paintCanopyGlobe(context, cx + 18, 128, 58, 44, leaves, '#3d5c28', 0.12)
  paintCanopyGlobe(context, cx - 48, 136, 52, 40, leaves, '#2e4a1c', -0.18)
  paintBarkTrunk(context, cx, 168, baseY, 11, 18, bark)
  context.strokeStyle = 'rgba(40,28,16,0.85)'
  context.lineCap = 'round'
  context.lineWidth = 7
  context.beginPath()
  context.moveTo(cx - 4, 188)
  context.quadraticCurveTo(cx - 38, 160, cx - 62, 142)
  context.moveTo(cx + 6, 176)
  context.quadraticCurveTo(cx + 40, 150, cx + 68, 132)
  context.stroke()
  paintCanopyGlobe(context, cx - 36, 118, 64, 48, leaves, '#456828', -0.22)
  paintCanopyGlobe(context, cx + 46, 108, 56, 42, leaves, '#4a6c2a', 0.2)
  paintCanopyGlobe(context, cx + 4, 92, 78, 58, leaves, '#3d6422', 0.04)
  paintCanopyGlobe(context, cx - 8, 148, 46, 28, leaves, '#2a4816', 0.1)
  context.fillStyle = 'rgba(220,255,160,0.16)'
  context.beginPath()
  context.ellipse(cx - 42, 78, 22, 14, -0.4, 0, Math.PI * 2)
  context.fill()
}

function paintPine(context: CanvasRenderingContext2D, width: number, height: number, bark: CanvasPattern | string, leaves: CanvasPattern | string) {
  const cx = width * 0.5
  const baseY = height - 22
  paintGroundShadow(context, cx, baseY, 32, 10)
  paintBarkTrunk(context, cx, 168, baseY, 7, 12, bark)
  const layers = [
    { y: 268, w: 86, h: 70, tint: '#1c3a18' },
    { y: 214, w: 72, h: 62, tint: '#244820' },
    { y: 166, w: 56, h: 54, tint: '#2c5424' },
    { y: 124, w: 40, h: 44, tint: '#326028' },
    { y: 90, w: 24, h: 36, tint: '#3a6a2c' },
  ]
  for (const layer of layers) {
    fillClipped(context, () => {
      context.moveTo(cx, layer.y - layer.h)
      context.lineTo(cx - layer.w, layer.y + 8)
      context.quadraticCurveTo(cx, layer.y + 18, cx + layer.w * 0.94, layer.y + 10)
      context.closePath()
    }, () => {
      context.save()
      context.translate(cx, layer.y)
      context.scale(0.4, 0.4)
      context.fillStyle = leaves
      context.fillRect(-layer.w * 4, -layer.h * 4, layer.w * 8, layer.h * 8)
      context.restore()
      context.globalCompositeOperation = 'multiply'
      context.globalAlpha = 0.5
      context.fillStyle = layer.tint
      context.fillRect(cx - layer.w - 4, layer.y - layer.h - 4, layer.w * 2 + 8, layer.h + 28)
      context.globalAlpha = 1
      context.globalCompositeOperation = 'source-over'
      const shade = context.createLinearGradient(cx - layer.w, layer.y - layer.h, cx + layer.w * 0.2, layer.y + 12)
      shade.addColorStop(0, 'rgba(255,255,220,0.12)')
      shade.addColorStop(0.45, 'rgba(0,0,0,0)')
      shade.addColorStop(1, 'rgba(0,0,0,0.4)')
      context.fillStyle = shade
      context.fillRect(cx - layer.w - 4, layer.y - layer.h - 4, layer.w * 2 + 8, layer.h + 28)
      context.fillStyle = 'rgba(0,0,0,0.32)'
      context.beginPath()
      context.ellipse(cx + 4, layer.y + 6, layer.w * 0.72, 10, 0, 0, Math.PI * 2)
      context.fill()
    })
  }
}

function paintBirch(context: CanvasRenderingContext2D, width: number, height: number, bark: CanvasPattern | string, leaves: CanvasPattern | string) {
  const cx = width * 0.5
  const baseY = height - 22
  paintGroundShadow(context, cx, baseY, 28, 9)
  paintBarkTrunk(context, cx, 150, baseY, 7, 11, bark)
  fillClipped(context, () => {
    context.moveTo(cx - 11, baseY)
    context.lineTo(cx - 7, 150)
    context.lineTo(cx + 7, 150)
    context.lineTo(cx + 11, baseY)
    context.closePath()
  }, () => {
    context.globalCompositeOperation = 'screen'
    context.fillStyle = 'rgba(236,230,218,0.62)'
    context.fillRect(cx - 12, 148, 24, baseY - 148)
    context.globalCompositeOperation = 'source-over'
    context.fillStyle = '#2a241c'
    for (let index = 0; index < 8; index += 1) {
      context.fillRect(cx - 9, 162 + index * 18, 18, 2)
    }
  })
  paintCanopyGlobe(context, cx - 28, 118, 42, 32, leaves, '#4a6a28', -0.2)
  paintCanopyGlobe(context, cx + 30, 108, 38, 28, leaves, '#3e5e22', 0.18)
  paintCanopyGlobe(context, cx + 2, 86, 52, 42, leaves, '#456426', 0.04)
  paintCanopyGlobe(context, cx - 6, 132, 30, 18, leaves, '#2a4014', 0.08)
}

function paintDead(context: CanvasRenderingContext2D, width: number, height: number, bark: CanvasPattern | string) {
  const cx = width * 0.5
  const baseY = height - 22
  paintGroundShadow(context, cx, baseY, 26, 9)
  paintBarkTrunk(context, cx, 72, baseY, 6, 10, bark)
  context.strokeStyle = '#3a2818'
  context.lineCap = 'round'
  context.lineWidth = 6
  context.beginPath()
  context.moveTo(cx - 2, 128)
  context.lineTo(cx - 42, 82)
  context.moveTo(cx + 2, 116)
  context.lineTo(cx + 38, 74)
  context.moveTo(cx, 94)
  context.lineTo(cx + 12, 42)
  context.moveTo(cx - 4, 150)
  context.lineTo(cx - 28, 118)
  context.stroke()
}

export function paintTreeCanvas(kind: TreeKind, maps?: TreeMaps) {
  const size = TREE_SIZE[kind]
  const canvas = document.createElement('canvas')
  canvas.width = size.width
  canvas.height = size.height
  const context = canvas.getContext('2d')
  if (!context) return canvas
  const bark = maps ? tilePattern(context, maps.bark) ?? '#4a3420' : '#4a3420'
  const leaves = maps ? tilePattern(context, maps.leaves) ?? '#2a5a30' : '#2a5a30'
  if (kind === 'oak') paintOak(context, size.width, size.height, bark, leaves)
  if (kind === 'pine') paintPine(context, size.width, size.height, bark, leaves)
  if (kind === 'birch') paintBirch(context, size.width, size.height, bark, leaves)
  if (kind === 'dead') paintDead(context, size.width, size.height, bark)
  return canvas
}

function chooseKind(x: number, y: number, elevation: number): TreeKind {
  const roll = hash2(Math.floor(x), Math.floor(y) + 17)
  if (elevation > 0.62 && roll > 0.35) return 'pine'
  if (roll > 0.86) return 'dead'
  if (roll > 0.68) return 'birch'
  return 'oak'
}

export function planGloamwoodTrees(
  field: LandscapeField,
  count = WOODLAND_VIEW.treeCount,
): WoodlandTree[] {
  const trees: WoodlandTree[] = []
  const minDist = WOODLAND_VIEW.minDist
  let attempts = 0
  while (trees.length < count && attempts < count * 50) {
    attempts += 1
    const x = 110 + hash2(attempts, 3) * (field.width - 220)
    const y = 140 + hash2(attempts, 9) * (field.height - 260)
    const sample = sampleLandscape(field, x, y)
    if (sample.river < riverWidth(x, y) + 46) continue
    if (fbm(x * 0.0035 + 3, y * 0.0035, 3) > 0.68 && hash2(attempts, 21) > 0.35) continue
    if (trees.some((tree) => Math.hypot(tree.x - x, tree.y - y) < minDist)) continue
    const kind = chooseKind(x, y, sample.elevation)
    const scale = 1.02 + hash2(attempts, 11) * 0.22 + sample.elevation * 0.1
    trees.push({ x, y, kind, scale, flipX: hash2(attempts, 13) > 0.5 })
    if (trees.length < count && hash2(attempts, 19) > 0.42) {
      const mateX = x + (hash2(attempts, 23) - 0.5) * WOODLAND_VIEW.groveSpread * 2
      const mateY = y + (hash2(attempts, 29) - 0.5) * WOODLAND_VIEW.groveSpread
      const mateSample = sampleLandscape(field, mateX, mateY)
      const onLand = mateSample.river > riverWidth(mateX, mateY) + 46
      const clear = trees.every((tree) => Math.hypot(tree.x - mateX, tree.y - mateY) > 58)
      if (onLand && clear && mateX > 80 && mateX < field.width - 80 && mateY > 100 && mateY < field.height - 80) {
        trees.push({
          x: mateX,
          y: mateY,
          kind: chooseKind(mateX, mateY, mateSample.elevation),
          scale: scale * (0.86 + hash2(attempts, 31) * 0.12),
          flipX: hash2(attempts, 37) > 0.5,
        })
      }
    }
  }
  return trees.sort((left, right) => left.y - right.y)
}

export function treeStats(trees: readonly WoodlandTree[]) {
  const counts: Record<TreeKind, number> = { oak: 0, pine: 0, birch: 0, dead: 0 }
  for (const tree of trees) counts[tree.kind] += 1
  return { count: trees.length, kinds: counts }
}

export function findScaleReference(field: LandscapeField) {
  for (let attempt = 1; attempt < 80; attempt += 1) {
    const x = field.width * (0.42 + hash2(attempt, 41) * 0.2)
    const y = field.height * (0.38 + hash2(attempt, 44) * 0.18)
    const sample = sampleLandscape(field, x, y)
    if (sample.river > riverWidth(x, y) + 50) return { x, y }
  }
  return { x: field.width * 0.48, y: field.height * 0.42 }
}
