import { hashSeed } from './evolution'
import { REWARD_SITES, WORLD_EVENTS, type RewardSiteDefinition, type WorldEventDefinition } from './rewards'
import {
  BIOMES,
  ENCOUNTERS,
  LANDMARKS,
  WORLD_HEIGHT,
  type BiomeId,
  type EncounterDefinition,
  type LandmarkDefinition,
} from './world'

export type MapArchetypeId = 'shattered-frontier'
export type MapLayoutId = 'central-road' | 'north-road' | 'south-road'

export interface RunMap {
  seed: string
  archetypeId: MapArchetypeId
  archetypeName: string
  layoutId: MapLayoutId
  layoutName: string
  encounters: readonly EncounterDefinition[]
  landmarks: readonly LandmarkDefinition[]
  rewardSites: readonly RewardSiteDefinition[]
  worldEvents: readonly WorldEventDefinition[]
  route: readonly { x: number; y: number }[]
  bossPosition: { x: number; y: number }
}

const LAYOUTS: readonly {
  id: MapLayoutId
  name: string
  offsets: Record<BiomeId, number>
}[] = [
  { id: 'central-road', name: '裂谷中路', offsets: { gloamwood: 0, rotfen: 0, 'ashen-ruins': 0 } },
  { id: 'north-road', name: '北境险路', offsets: { gloamwood: -280, rotfen: -180, 'ashen-ruins': -300 } },
  { id: 'south-road', name: '南部荒径', offsets: { gloamwood: 280, rotfen: 190, 'ashen-ruins': 300 } },
] as const

function shiftedY(y: number, biome: BiomeId, offsets: Record<BiomeId, number>) {
  return Math.max(180, Math.min(WORLD_HEIGHT - 180, y + offsets[biome]))
}

export function createRunMap(seed: string): RunMap {
  const layout = LAYOUTS[hashSeed(seed) % LAYOUTS.length]
  const encounters = ENCOUNTERS.map((encounter) => ({
    ...encounter,
    y: shiftedY(encounter.y, encounter.biome, layout.offsets),
  }))
  const landmarks = LANDMARKS.map((landmark) => ({
    ...landmark,
    y: shiftedY(landmark.y, landmark.biome, layout.offsets),
  }))
  const rewardSites = REWARD_SITES.map((site) => ({
    ...site,
    y: shiftedY(site.y, site.biome, layout.offsets),
  }))
  const worldEvents = WORLD_EVENTS.map((event) => ({
    ...event,
    y: shiftedY(event.y, event.biome, layout.offsets),
  }))
  const bossLair = landmarks.find((landmark) => landmark.kind === 'boss-lair')!
  const route = [
    { x: 240, y: 1600 },
    ...BIOMES.map((biome) => ({
      x: biome.x + biome.width * 0.62,
      y: shiftedY(1540, biome.id, layout.offsets),
    })),
    { x: bossLair.x + 160, y: bossLair.y },
  ]

  return {
    seed,
    archetypeId: 'shattered-frontier',
    archetypeName: '破碎边境',
    layoutId: layout.id,
    layoutName: layout.name,
    encounters,
    landmarks,
    rewardSites,
    worldEvents,
    route,
    bossPosition: { x: bossLair.x, y: bossLair.y },
  }
}
