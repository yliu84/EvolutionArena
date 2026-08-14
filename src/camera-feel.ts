export interface CameraProfile {
  zoom: number
  lookAhead: number
  followLerp: number
}

export const CAMERA_PROFILES = {
  desktopExploration: { zoom: 0.88, lookAhead: 0, followLerp: 0.14 },
  desktopBoss: { zoom: 0.93, lookAhead: 0, followLerp: 0.14 },
  compactExploration: { zoom: 1, lookAhead: 0, followLerp: 0.16 },
  compactBoss: { zoom: 1, lookAhead: 0, followLerp: 0.16 },
} as const satisfies Record<string, CameraProfile>

export function isCompactViewport(width: number, height: number) {
  return width <= 900 || height <= 500
}

export function cameraProfileFor(width: number, height: number, bossActive: boolean): CameraProfile {
  const compact = isCompactViewport(width, height)
  if (compact) return bossActive ? CAMERA_PROFILES.compactBoss : CAMERA_PROFILES.compactExploration
  return bossActive ? CAMERA_PROFILES.desktopBoss : CAMERA_PROFILES.desktopExploration
}

export function worldViewSize(canvasWidth: number, canvasHeight: number, zoom: number) {
  return { width: canvasWidth / zoom, height: canvasHeight / zoom }
}

export function normalizedLookAhead(x: number, y: number, distance: number) {
  const length = Math.hypot(x, y)
  if (length === 0 || distance === 0) return { x: 0, y: 0 }
  return { x: x / length * distance, y: y / length * distance }
}
