export interface QualitySliceBlocker {
  id: string
  x: number
  y: number
  width: number
  height: number
  kind: 'cliff' | 'forest' | 'water'
}

export const QUALITY_SLICE = {
  sceneKey: 'quality-slice',
  world: { width: 2000, height: 1126 },
  source: { width: 1672, height: 941 },
  player: {
    displayWidth: 132,
    frameDisplayHeight: 178,
    visualHeight: 112,
    colliderRadius: 24,
    groundOriginY: 0.79,
    groundOffsetY: 4,
  },
  cameraZoom: 1,
  roadMinimumWidth: 720,
  spawn: { x: 880, y: 650 },
  blockers: [
    { id: 'cliff-west', x: 120, y: 220, width: 240, height: 440, kind: 'cliff' },
    { id: 'cliff-step-a', x: 345, y: 185, width: 210, height: 370, kind: 'cliff' },
    { id: 'cliff-step-b', x: 535, y: 150, width: 190, height: 300, kind: 'cliff' },
    { id: 'cliff-step-c', x: 705, y: 105, width: 170, height: 210, kind: 'cliff' },
    { id: 'forest-north-east', x: 1740, y: 180, width: 520, height: 360, kind: 'forest' },
    { id: 'forest-east', x: 1840, y: 555, width: 320, height: 530, kind: 'forest' },
    { id: 'forest-south-east', x: 1775, y: 980, width: 450, height: 292, kind: 'forest' },
    { id: 'water-west', x: 900, y: 1085, width: 500, height: 82, kind: 'water' },
    { id: 'water-bridge-left', x: 1100, y: 1025, width: 220, height: 120, kind: 'water' },
    { id: 'water-east-lower', x: 1740, y: 1060, width: 520, height: 150, kind: 'water' },
    { id: 'water-east-upper', x: 1810, y: 885, width: 380, height: 210, kind: 'water' },
  ] satisfies QualitySliceBlocker[],
} as const

export function qualitySliceScale() {
  return {
    x: QUALITY_SLICE.world.width / QUALITY_SLICE.source.width,
    y: QUALITY_SLICE.world.height / QUALITY_SLICE.source.height,
  }
}

export function qualitySlicePlayerRoadRatio() {
  return QUALITY_SLICE.roadMinimumWidth / QUALITY_SLICE.player.displayWidth
}

export function pointInsideQualityBlocker(x: number, y: number, blocker: QualitySliceBlocker) {
  return Math.abs(x - blocker.x) <= blocker.width / 2 && Math.abs(y - blocker.y) <= blocker.height / 2
}

export function isQualitySliceRequested(search = globalThis.location?.search ?? '') {
  return new URLSearchParams(search).get('quality') === '1'
}
