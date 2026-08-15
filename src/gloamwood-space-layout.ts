export type SpaceZoneKind = 'spawn' | 'combat' | 'boss'

export interface SpaceZone {
  id: string
  name: string
  kind: SpaceZoneKind
  x: number
  y: number
  width: number
  height: number
}

export interface SpaceCorridor {
  id: string
  name: string
  from: string
  to: string
  width: number
}

export const GLOAMWOOD_SPACE_LAYOUT = {
  sceneKey: 'gloamwood-space-lab',
  version: 1,
  groundAsset: {
    key: 'gloamwood-spacious-ground-v1',
    path: 'assets/map-lab-v3/gloamwood-spacious-ground-v1.png',
    sourceWidth: 1605,
    sourceHeight: 980,
  },
  world: { width: 3600, height: 2200 },
  previousSlice: { width: 1672, height: 941 },
  start: { x: 520, y: 1120 },
  playerReferenceHeight: 96,
  rangedRange: 390,
  magicRange: 430,
  minimumCorridorWidth: 300,
  zones: [
    { id: 'awakening-glen', name: '苏醒林间地', kind: 'spawn', x: 560, y: 1120, width: 900, height: 700 },
    { id: 'upper-ford', name: '上游浅滩猎场', kind: 'combat', x: 1570, y: 620, width: 1100, height: 980 },
    { id: 'sunken-ruin', name: '沉没遗迹猎场', kind: 'combat', x: 1570, y: 1640, width: 1160, height: 980 },
    { id: 'ancient-heart', name: '古林之心', kind: 'boss', x: 2920, y: 1120, width: 1240, height: 1000 },
  ] as const satisfies readonly SpaceZone[],
  corridors: [
    { id: 'north-hunt', name: '北部猎路', from: 'awakening-glen', to: 'upper-ford', width: 320 },
    { id: 'south-hunt', name: '南部猎路', from: 'awakening-glen', to: 'sunken-ruin', width: 340 },
    { id: 'ford-to-heart', name: '浅滩高路', from: 'upper-ford', to: 'ancient-heart', width: 300 },
    { id: 'ruin-to-heart', name: '遗迹低路', from: 'sunken-ruin', to: 'ancient-heart', width: 360 },
    { id: 'cross-trail', name: '林中回环路', from: 'upper-ford', to: 'sunken-ruin', width: 300 },
  ] as const satisfies readonly SpaceCorridor[],
} as const

export function spaceArea(width: number, height: number) {
  return width * height
}

export function areaScaleFromPrevious() {
  return spaceArea(GLOAMWOOD_SPACE_LAYOUT.world.width, GLOAMWOOD_SPACE_LAYOUT.world.height)
    / spaceArea(GLOAMWOOD_SPACE_LAYOUT.previousSlice.width, GLOAMWOOD_SPACE_LAYOUT.previousSlice.height)
}

export function screenAreaCount(viewWidth: number, viewHeight: number) {
  return spaceArea(GLOAMWOOD_SPACE_LAYOUT.world.width, GLOAMWOOD_SPACE_LAYOUT.world.height)
    / spaceArea(viewWidth, viewHeight)
}

export function zoneById(id: string) {
  return GLOAMWOOD_SPACE_LAYOUT.zones.find((zone) => zone.id === id)
}

export function pointInsideSpaceZone(x: number, y: number, zone: SpaceZone) {
  const dx = (x - zone.x) / (zone.width / 2)
  const dy = (y - zone.y) / (zone.height / 2)
  return dx * dx + dy * dy <= 1
}

export function combatSpaceDiameterRequired(range: number, repositionMargin = 40) {
  return range * 2 + repositionMargin * 2
}

export function isGloamwoodSpaceLabRequested(search = window.location.search) {
  return new URLSearchParams(search).get('maplab') === '3'
}
