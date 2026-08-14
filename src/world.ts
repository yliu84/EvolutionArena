import type { MonsterType } from './monsters'

export type BiomeId = 'gloamwood' | 'rotfen' | 'ashen-ruins'

export interface BiomeDefinition {
  id: BiomeId
  name: string
  subtitle: string
  x: number
  y: number
  width: number
  height: number
  groundColor: number
  detailColor: number
  monsterType: MonsterType
}

export interface EncounterDefinition {
  id: string
  biome: BiomeId
  monsterType: MonsterType
  x: number
  y: number
}

export interface LandmarkDefinition {
  id: string
  biome: BiomeId
  name: string
  kind: 'gate' | 'shrine' | 'beacon' | 'boss-lair'
  x: number
  y: number
}

export interface FogCell {
  id: string
  x: number
  y: number
  centerX: number
  centerY: number
  explored: boolean
}

export const WORLD_WIDTH = 5200
export const WORLD_HEIGHT = 3200
export const VIEW_WIDTH = 1280
export const VIEW_HEIGHT = 720
export const FOG_CELL_SIZE = 64
export const VISION_RADIUS = 430
export const REVEAL_RADIUS = 535
export const TARGET_LOCK_RADIUS = 425
export const START_POSITION = { x: 620, y: 1600 } as const

export const BIOMES: readonly BiomeDefinition[] = [
  {
    id: 'gloamwood', name: '幽影林地', subtitle: '低危 · 利爪猎场',
    x: 0, y: 0, width: 1900, height: WORLD_HEIGHT,
    groundColor: 0x10291f, detailColor: 0x214b34, monsterType: 'pouncer',
  },
  {
    id: 'rotfen', name: '腐根沼泽', subtitle: '中危 · 甲壳领地',
    x: 1900, y: 0, width: 1700, height: WORLD_HEIGHT,
    groundColor: 0x20271c, detailColor: 0x4d5430, monsterType: 'shellback',
  },
  {
    id: 'ashen-ruins', name: '烬火遗迹', subtitle: '高危 · 脉冲巢域',
    x: 3600, y: 0, width: 1600, height: WORLD_HEIGHT,
    groundColor: 0x281b1d, detailColor: 0x66352e, monsterType: 'spitter',
  },
] as const

const ENCOUNTER_COORDINATES: Record<BiomeId, readonly [number, number][]> = {
  gloamwood: [
    [980, 1260], [1050, 1920], [1320, 770], [1450, 1510],
    [1510, 2440], [1710, 1080], [1720, 2050], [1180, 2780],
  ],
  rotfen: [
    [2110, 1180], [2190, 2200], [2460, 680], [2510, 1650],
    [2720, 2640], [3010, 1060], [3140, 2000], [3390, 1510], [3320, 2580],
  ],
  'ashen-ruins': [
    [3780, 1320], [3880, 2290], [4120, 760], [4200, 1700],
    [4430, 2670], [4610, 1120], [4720, 2020], [4970, 620],
    [3860, 2860], [4980, 2820],
  ],
}

const ENCOUNTER_ROSTERS: Record<BiomeId, readonly MonsterType[]> = {
  gloamwood: ['pouncer', 'razorwing', 'mantis', 'fireant', 'locust', 'dragonfly', 'cicada', 'glowworm'],
  rotfen: ['shellback', 'bloodleech', 'mosquito', 'centipede', 'spider', 'tick', 'silkworm', 'dungbeetle', 'moth'],
  'ashen-ruins': ['spitter', 'riftweaver', 'hornbeetle', 'stagbeetle', 'scorpion', 'wasp', 'bombardier', 'razorwing', 'shellback', 'bloodleech'],
}

export const ENCOUNTERS: readonly EncounterDefinition[] = BIOMES.flatMap((biome) =>
  ENCOUNTER_COORDINATES[biome.id].map(([x, y], index) => ({
    id: `${biome.id}-${index + 1}`,
    biome: biome.id,
    monsterType: ENCOUNTER_ROSTERS[biome.id][index],
    x,
    y,
  })),
)

export const LANDMARKS: readonly LandmarkDefinition[] = [
  { id: 'bone-gate', biome: 'gloamwood', name: '白骨门', kind: 'gate', x: 1510, y: 880 },
  { id: 'drowned-shrine', biome: 'rotfen', name: '沉没祭坛', kind: 'shrine', x: 2670, y: 1580 },
  { id: 'ember-beacon', biome: 'ashen-ruins', name: '余烬信标', kind: 'beacon', x: 4010, y: 760 },
  { id: 'sealed-lair', biome: 'ashen-ruins', name: '封印巢穴', kind: 'boss-lair', x: 4780, y: 1600 },
] as const

export function getBiomeAt(x: number, y: number): BiomeDefinition {
  return BIOMES.find((biome) => (
    x >= biome.x && x < biome.x + biome.width && y >= biome.y && y < biome.y + biome.height
  )) ?? BIOMES[BIOMES.length - 1]
}

export function createFogGrid(): FogCell[] {
  const cells: FogCell[] = []
  for (let y = 0; y < WORLD_HEIGHT; y += FOG_CELL_SIZE) {
    for (let x = 0; x < WORLD_WIDTH; x += FOG_CELL_SIZE) {
      cells.push({
        id: `${x}:${y}`,
        x,
        y,
        centerX: x + FOG_CELL_SIZE / 2,
        centerY: y + FOG_CELL_SIZE / 2,
        explored: false,
      })
    }
  }
  return cells
}

export function revealFogCells(cells: FogCell[], x: number, y: number, radius = VISION_RADIUS): number {
  const radiusSquared = radius * radius
  let newlyExplored = 0
  for (const cell of cells) {
    if (cell.explored) continue
    const dx = cell.centerX - x
    const dy = cell.centerY - y
    if (dx * dx + dy * dy <= radiusSquared) {
      cell.explored = true
      newlyExplored += 1
    }
  }
  return newlyExplored
}

export function worldScreenArea(): number {
  return (WORLD_WIDTH * WORLD_HEIGHT) / (VIEW_WIDTH * VIEW_HEIGHT)
}
