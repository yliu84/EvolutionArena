export type NestFamily = 'fang' | 'wing' | 'carapace' | 'swarm' | 'venom' | 'rift'

export interface ExplorationPoint {
  x: number
  y: number
}

export interface ExplorationSpawn extends ExplorationPoint {
  id: string
  name: string
  safeRadius: number
}

export interface MonsterNest extends ExplorationPoint {
  id: string
  name: string
  family: NestFamily
  radius: number
  waves: number
  elite: boolean
  optional: boolean
}

export interface ExplorationRoute {
  id: string
  name: string
  width: number
  points: readonly ExplorationPoint[]
}

export const GLOAMWOOD_EXPLORATION_LAYOUT = {
  sceneKey: 'gloamwood-exploration-lab',
  version: 3,
  world: { width: 7200, height: 4400 },
  playerSpeed: 330,
  defaultSeed: 'gloamwood-v4-default',
  spawnPoints: [
    { id: 'moss-gate', name: '苔门苏醒地', x: 620, y: 2200, safeRadius: 520 },
    { id: 'north-hollow', name: '北林避难所', x: 760, y: 520, safeRadius: 420 },
    { id: 'south-root', name: '南根隐地', x: 760, y: 3860, safeRadius: 420 },
    { id: 'old-ford', name: '古浅滩营地', x: 3100, y: 1900, safeRadius: 420 },
  ] as const satisfies readonly ExplorationSpawn[],
  nests: [
    { id: 'thorn-burrow', name: '棘牙地穴', family: 'fang', x: 1900, y: 860, radius: 650, waves: 2, elite: false, optional: false },
    { id: 'razor-roost', name: '刃翼栖巢', family: 'wing', x: 3500, y: 650, radius: 650, waves: 2, elite: false, optional: true },
    { id: 'brood-mound', name: '群卵土丘', family: 'swarm', x: 2240, y: 2820, radius: 730, waves: 3, elite: false, optional: false },
    { id: 'shell-basin', name: '重甲泥盆', family: 'carapace', x: 4300, y: 1700, radius: 750, waves: 3, elite: false, optional: false },
    { id: 'venom-hollow', name: '毒腺腐穴', family: 'venom', x: 1880, y: 3660, radius: 680, waves: 2, elite: false, optional: true },
    { id: 'rift-scar', name: '裂隙伤口', family: 'rift', x: 5250, y: 3340, radius: 730, waves: 3, elite: false, optional: true },
    { id: 'black-cocoon', name: '黑茧高巢', family: 'wing', x: 5920, y: 900, radius: 800, waves: 3, elite: true, optional: true },
    { id: 'drowned-queen', name: '沉没母巢', family: 'swarm', x: 4040, y: 3820, radius: 820, waves: 3, elite: true, optional: true },
  ] as const satisfies readonly MonsterNest[],
  bossLair: { id: 'ancient-heart', name: '古林之心', x: 6620, y: 2200, radius: 700 },
  routes: [
    {
      id: 'north-hunt', name: '北境猎路', width: 360,
      points: [{ x: 620, y: 2200 }, { x: 1100, y: 1640 }, { x: 1900, y: 860 }, { x: 2700, y: 700 }, { x: 3500, y: 650 }, { x: 4700, y: 650 }, { x: 5920, y: 900 }, { x: 6500, y: 1500 }, { x: 6620, y: 2200 }],
    },
    {
      id: 'south-hunt', name: '南根猎路', width: 380,
      points: [{ x: 620, y: 2200 }, { x: 1200, y: 2920 }, { x: 1880, y: 3660 }, { x: 2920, y: 4000 }, { x: 4040, y: 3820 }, { x: 5250, y: 3340 }, { x: 6120, y: 2840 }, { x: 6620, y: 2200 }],
    },
    {
      id: 'central-hunt', name: '古道中线', width: 420,
      points: [{ x: 620, y: 2200 }, { x: 1420, y: 2180 }, { x: 2240, y: 2820 }, { x: 3100, y: 1900 }, { x: 4300, y: 1700 }, { x: 5300, y: 2200 }, { x: 6620, y: 2200 }],
    },
    {
      id: 'west-loop', name: '西林回环', width: 320,
      points: [{ x: 1900, y: 860 }, { x: 2480, y: 1560 }, { x: 2240, y: 2820 }, { x: 1880, y: 3660 }],
    },
    {
      id: 'east-loop', name: '东林回环', width: 320,
      points: [{ x: 3500, y: 650 }, { x: 4020, y: 1120 }, { x: 4300, y: 1700 }, { x: 4380, y: 2700 }, { x: 4040, y: 3820 }],
    },
    {
      id: 'rift-branch', name: '裂隙支路', width: 300,
      points: [{ x: 4300, y: 1700 }, { x: 5000, y: 2460 }, { x: 5250, y: 3340 }],
    },
  ] as const satisfies readonly ExplorationRoute[],
  pacing: {
    explorationSeconds: 180,
    expectedNestClears: { min: 5, max: 7 },
    secondsPerNest: 50,
    evolutionSeconds: 120,
    eventSeconds: 60,
    bossSeconds: 150,
  },
} as const

export function hashExplorationSeed(seed: string) {
  let hash = 2166136261
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function spawnPointForSeed(seed: string) {
  return GLOAMWOOD_EXPLORATION_LAYOUT.spawnPoints[hashExplorationSeed(seed) % GLOAMWOOD_EXPLORATION_LAYOUT.spawnPoints.length]
}

export function routeLength(route: ExplorationRoute) {
  let length = 0
  for (let index = 1; index < route.points.length; index += 1) {
    const from = route.points[index - 1]
    const to = route.points[index]
    length += Math.hypot(to.x - from.x, to.y - from.y)
  }
  return length
}

export function totalRouteLength() {
  return GLOAMWOOD_EXPLORATION_LAYOUT.routes.reduce((total, route) => total + routeLength(route), 0)
}

export function estimatedRunMinutes(nestClears: number) {
  const pacing = GLOAMWOOD_EXPLORATION_LAYOUT.pacing
  return (pacing.explorationSeconds
    + nestClears * pacing.secondsPerNest
    + pacing.evolutionSeconds
    + pacing.eventSeconds
    + pacing.bossSeconds) / 60
}

export function pointInsideNest(x: number, y: number, nest: MonsterNest) {
  return Math.hypot(x - nest.x, y - nest.y) <= nest.radius
}

export function isGloamwoodExplorationLabRequested(search = window.location.search) {
  return new URLSearchParams(search).get('maplab') === '4'
}

export function explorationSeedFromSearch(search = window.location.search) {
  return new URLSearchParams(search).get('spawnSeed') || GLOAMWOOD_EXPLORATION_LAYOUT.defaultSeed
}
