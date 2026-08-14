export const WORLD_DEPTH_BASE = 4
export const FX_DEPTH = 45
export const GROUND_DEPTH = 0
export const UNIT_ORIGIN = { x: 0.5, y: 0.82 } as const
export const PROP_ORIGIN = { x: 0.5, y: 0.88 } as const

export function worldDepth(y: number, bias = 0) {
  return WORLD_DEPTH_BASE + y * 0.01 + bias
}

export function fillIsoDiamond(
  g: { fillStyle: (color: number, alpha?: number) => unknown; fillTriangle: (...args: number[]) => unknown },
  cx: number,
  cy: number,
  radiusX: number,
  radiusY: number,
  color: number,
  alpha = 1,
) {
  g.fillStyle(color, alpha)
  g.fillTriangle(cx, cy - radiusY, cx - radiusX, cy, cx, cy + radiusY)
  g.fillTriangle(cx, cy - radiusY, cx + radiusX, cy, cx, cy + radiusY)
}

export function fillQuad(
  g: { fillStyle: (color: number, alpha?: number) => unknown; fillTriangle: (...args: number[]) => unknown },
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  x4: number,
  y4: number,
  color: number,
  alpha = 1,
) {
  g.fillStyle(color, alpha)
  g.fillTriangle(x1, y1, x2, y2, x3, y3)
  g.fillTriangle(x1, y1, x3, y3, x4, y4)
}
