export interface WorldRect {
  x: number
  y: number
  width: number
  height: number
}

export type GloamwoodSlicePropKind = 'broadleaf' | 'conifer'

export interface GloamwoodSliceProp {
  id: string
  kind: GloamwoodSlicePropKind
  x: number
  y: number
  displayHeight: number
  collisionWidth: number
  collisionHeight: number
  fadeRadiusX: number
  fadeDepth: number
}

export const GLOAMWOOD_SLICE_PROP_ASSETS = {
  broadleaf: {
    assetKey: 'gloamwood-slice-broadleaf',
    assetPath: 'assets/hunt-slice/gloamwood-broadleaf-v1.png',
  },
  conifer: {
    assetKey: 'gloamwood-slice-conifer',
    assetPath: 'assets/hunt-slice/gloamwood-conifer-v1.png',
  },
} as const

export const GLOAMWOOD_SLICE_PROPS: readonly GloamwoodSliceProp[] = [
  { id: 'ford-broadleaf', kind: 'broadleaf', x: 650, y: 1710, displayHeight: 330, collisionWidth: 70, collisionHeight: 54, fadeRadiusX: 145, fadeDepth: 250 },
  { id: 'east-broadleaf', kind: 'broadleaf', x: 1090, y: 1680, displayHeight: 286, collisionWidth: 62, collisionHeight: 48, fadeRadiusX: 126, fadeDepth: 220 },
  { id: 'north-conifer', kind: 'conifer', x: 1320, y: 1410, displayHeight: 330, collisionWidth: 52, collisionHeight: 50, fadeRadiusX: 92, fadeDepth: 250 },
  { id: 'west-conifer', kind: 'conifer', x: 340, y: 1390, displayHeight: 282, collisionWidth: 48, collisionHeight: 46, fadeRadiusX: 80, fadeDepth: 215 },
] as const

export const GLOAMWOOD_HUNT_SLICE = {
  id: 'gloamwood-readability-slice',
  assetKey: 'gloamwood-hunt-slice-atmosphere',
  assetPath: 'assets/map-lab-v2/gloamwood-atmosphere-v1.png',
  validationSeed: 'gloamwood-0',
  region: { x: 0, y: 1040, width: 1672, height: 941 },
  expectedEncounterIds: ['gloamwood-1', 'gloamwood-2', 'gloamwood-4'] as const,
  purpose: 'live-combat-readability',
} as const

export function isGloamwoodHuntSliceRequested(search = window.location.search) {
  return new URLSearchParams(search).get('huntlab') === '1'
}

export function pointInsideWorldRect(x: number, y: number, rect: WorldRect) {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height
}

export function slicePropCollisionCenter(prop: GloamwoodSliceProp) {
  return { x: prop.x, y: prop.y - prop.collisionHeight / 2 }
}

export function shouldFadeSliceProp(playerX: number, playerY: number, prop: GloamwoodSliceProp) {
  const behindTree = playerY < prop.y && playerY >= prop.y - prop.fadeDepth
  return behindTree && Math.abs(playerX - prop.x) <= prop.fadeRadiusX
}
