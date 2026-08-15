import { GLOAMWOOD_EXPLORATION_LAYOUT, type ExplorationPoint, type MonsterNest, type NestFamily } from './gloamwood-exploration-layout'
import type { MonsterType } from './monsters'

export type GloamwoodNestMechanic = 'hunt' | 'gust' | 'brood' | 'bulwark' | 'toxin' | 'rift' | 'cocoon' | 'queen'
export type GloamwoodNestPhase = 'dormant' | `wave-${number}` | `intermission-${number}` | 'core-vulnerable' | 'cleared'

export interface GloamwoodNestCollider {
  id: string
  offsetX: number
  offsetY: number
  width: number
  height: number
}

export interface GloamwoodNestSpawn {
  id: string
  type: MonsterType
  offsetX: number
  offsetY: number
  elite?: boolean
}

export interface GloamwoodNestConfig {
  id: MonsterNest['id']
  name: string
  family: NestFamily
  mechanic: GloamwoodNestMechanic
  entrance: { offsetX: number; offsetY: number; width: number }
  core: { offsetX: number; offsetY: number }
  triggerRadius: number
  combatRadius: number
  coreMaxHealth: number
  intermissionMs: number
  collisionBodies: readonly GloamwoodNestCollider[]
  waves: readonly (readonly GloamwoodNestSpawn[])[]
  reward: { family: NestFamily; genes: number; evolution: number; heal: number }
  revealRadius: number
  art: { key: string; path: string; width: number; height: number; offsetY: number }
  palette: { primary: number; secondary: number; glow: number; ground: number }
  subtitle: string
}

const scaleColliders = (colliders: readonly GloamwoodNestCollider[], scale: number) => colliders.map((collider) => ({
  ...collider,
  offsetX: Math.round(collider.offsetX * scale),
  offsetY: Math.round(collider.offsetY * scale),
  width: Math.round(collider.width * scale),
  height: Math.round(collider.height * scale),
}))

// These spacious base shells leave roughly 980 x 890 units of clear movement
// room. Higher-pressure nests scale the same authored silhouette outward rather
// than filling the arena with invisible walls.
const southGate = (scale = 1): readonly GloamwoodNestCollider[] => scaleColliders([
  { id: 'north-wall', offsetX: 0, offsetY: -520, width: 760, height: 150 },
  { id: 'west-wall', offsetX: -560, offsetY: -55, width: 140, height: 500 },
  { id: 'east-wall', offsetX: 560, offsetY: -55, width: 140, height: 500 },
  { id: 'west-gate', offsetX: -310, offsetY: 445, width: 180, height: 150 },
  { id: 'east-gate', offsetX: 310, offsetY: 445, width: 180, height: 150 },
], scale)

const northGate = (scale = 1): readonly GloamwoodNestCollider[] => scaleColliders([
  { id: 'south-wall', offsetX: 0, offsetY: 520, width: 760, height: 150 },
  { id: 'west-wall', offsetX: -560, offsetY: 55, width: 140, height: 500 },
  { id: 'east-wall', offsetX: 560, offsetY: 55, width: 140, height: 500 },
  { id: 'west-gate', offsetX: -310, offsetY: -445, width: 180, height: 150 },
  { id: 'east-gate', offsetX: 310, offsetY: -445, width: 180, height: 150 },
], scale)

const eastGate = (scale = 1): readonly GloamwoodNestCollider[] => scaleColliders([
  { id: 'west-wall', offsetX: -520, offsetY: 0, width: 150, height: 760 },
  { id: 'north-wall', offsetX: -55, offsetY: -560, width: 500, height: 140 },
  { id: 'south-wall', offsetX: -55, offsetY: 560, width: 500, height: 140 },
  { id: 'north-gate', offsetX: 445, offsetY: -310, width: 150, height: 180 },
  { id: 'south-gate', offsetX: 445, offsetY: 310, width: 150, height: 180 },
], scale)

const westGate = (scale = 1): readonly GloamwoodNestCollider[] => scaleColliders([
  { id: 'east-wall', offsetX: 520, offsetY: 0, width: 150, height: 760 },
  { id: 'north-wall', offsetX: 55, offsetY: -560, width: 500, height: 140 },
  { id: 'south-wall', offsetX: 55, offsetY: 560, width: 500, height: 140 },
  { id: 'north-gate', offsetX: -445, offsetY: -310, width: 150, height: 180 },
  { id: 'south-gate', offsetX: -445, offsetY: 310, width: 150, height: 180 },
], scale)

const spawn = (id: string, type: MonsterType, offsetX: number, offsetY: number, elite = false): GloamwoodNestSpawn => ({
  id, type, offsetX, offsetY, ...(elite ? { elite: true } : {}),
})

export const GLOAMWOOD_NEST_CONFIGS = [
  {
    id: 'thorn-burrow', name: '棘牙地穴', family: 'fang', mechanic: 'hunt',
    entrance: { offsetX: 0, offsetY: 520, width: 420 }, core: { offsetX: 0, offsetY: -12 },
    triggerRadius: 650, combatRadius: 560, coreMaxHealth: 18, intermissionMs: 900,
    collisionBodies: southGate(),
    waves: [
      [spawn('thorn-w1-pouncer', 'pouncer', -260, -170), spawn('thorn-w1-mantis', 'mantis', 260, -150), spawn('thorn-w1-fireant', 'fireant', 0, 270)],
      [spawn('thorn-w2-scorpion', 'scorpion', -310, 60), spawn('thorn-w2-wasp', 'wasp', 300, -40), spawn('thorn-w2-centipede', 'centipede', -40, -300), spawn('thorn-w2-hornbeetle', 'hornbeetle', 50, 310, true)],
    ],
    reward: { family: 'fang', genes: 3, evolution: 36, heal: 30 }, revealRadius: 960,
    art: { key: 'v4-nest-thorn-burrow', path: '/assets/map-lab-v4/thorn-burrow/thorn-burrow-master-v1.png', width: 1340, height: 1105, offsetY: 24 },
    palette: { primary: 0x8c4b2f, secondary: 0x5e3020, glow: 0xff9f54, ground: 0x17251a },
    subtitle: '南侧牙门 · 扑杀与毒刺混编',
  },
  {
    id: 'razor-roost', name: '刃翼栖巢', family: 'wing', mechanic: 'gust',
    entrance: { offsetX: -540, offsetY: 0, width: 400 }, core: { offsetX: 24, offsetY: 0 },
    triggerRadius: 650, combatRadius: 560, coreMaxHealth: 18, intermissionMs: 760,
    collisionBodies: westGate(),
    waves: [
      [spawn('roost-w1-razorwing', 'razorwing', -260, -280), spawn('roost-w1-wasp', 'wasp', 290, -80), spawn('roost-w1-dragonfly', 'dragonfly', 30, 290)],
      [spawn('roost-w2-moth', 'moth', -320, 60), spawn('roost-w2-mosquito', 'mosquito', 270, 240), spawn('roost-w2-wasp', 'wasp', 330, -240), spawn('roost-w2-razorwing', 'razorwing', -20, -340, true)],
    ],
    reward: { family: 'wing', genes: 3, evolution: 36, heal: 24 }, revealRadius: 1180,
    art: { key: 'v4-nest-razor-roost', path: '/assets/map-lab-v4/razor-roost/razor-roost-master-v1.png', width: 1450, height: 965, offsetY: 14 },
    palette: { primary: 0x417c62, secondary: 0x244d3d, glow: 0x91f5bd, ground: 0x13231c },
    subtitle: '西侧风口 · 高速突袭与鳞粉齐射',
  },
  {
    id: 'brood-mound', name: '群卵土丘', family: 'swarm', mechanic: 'brood',
    entrance: { offsetX: 0, offsetY: -620, width: 440 }, core: { offsetX: 0, offsetY: 10 },
    triggerRadius: 730, combatRadius: 620, coreMaxHealth: 22, intermissionMs: 720,
    collisionBodies: northGate(1.12),
    waves: [
      [spawn('brood-w1-fireant', 'fireant', -280, 180), spawn('brood-w1-locust', 'locust', 280, 170), spawn('brood-w1-cicada', 'cicada', 0, -300)],
      [spawn('brood-w2-centipede', 'centipede', -330, -40), spawn('brood-w2-fireant', 'fireant', 330, -30), spawn('brood-w2-spitter', 'spitter', 0, 330)],
      [spawn('brood-w3-locust', 'locust', -350, 160), spawn('brood-w3-cicada', 'cicada', 340, 140), spawn('brood-w3-glowworm', 'glowworm', 0, -350), spawn('brood-w3-fireant', 'fireant', 40, 330, true)],
    ],
    reward: { family: 'swarm', genes: 4, evolution: 42, heal: 30 }, revealRadius: 1300,
    art: { key: 'v4-nest-brood-mound', path: '/assets/map-lab-v4/brood-mound/brood-mound-master-v1.png', width: 1400, height: 1280, offsetY: 18 },
    palette: { primary: 0x2d7b73, secondary: 0x173f3b, glow: 0x76f2dc, ground: 0x102522 },
    subtitle: '北侧裂口 · 三波群体增援',
  },
  {
    id: 'shell-basin', name: '重甲泥盆', family: 'carapace', mechanic: 'bulwark',
    entrance: { offsetX: -640, offsetY: 0, width: 440 }, core: { offsetX: 15, offsetY: 15 },
    triggerRadius: 750, combatRadius: 640, coreMaxHealth: 26, intermissionMs: 980,
    collisionBodies: westGate(1.15),
    waves: [
      [spawn('shell-w1-shellback', 'shellback', -280, -260), spawn('shell-w1-dungbeetle', 'dungbeetle', 300, -230), spawn('shell-w1-bombardier', 'bombardier', 0, 330)],
      [spawn('shell-w2-hornbeetle', 'hornbeetle', -350, 70), spawn('shell-w2-stagbeetle', 'stagbeetle', 340, 50), spawn('shell-w2-spitter', 'spitter', 0, -350)],
      [spawn('shell-w3-shellback', 'shellback', -360, -170), spawn('shell-w3-dungbeetle', 'dungbeetle', 350, -160), spawn('shell-w3-stagbeetle', 'stagbeetle', 0, 350, true)],
    ],
    reward: { family: 'carapace', genes: 4, evolution: 44, heal: 34 }, revealRadius: 1340,
    art: { key: 'v4-nest-shell-basin', path: '/assets/map-lab-v4/shell-basin/shell-basin-master-v1.png', width: 1540, height: 1025, offsetY: 24 },
    palette: { primary: 0x355f8c, secondary: 0x223d5a, glow: 0x77b8ff, ground: 0x111b25 },
    subtitle: '西侧泥坡 · 重甲防线与酸炮',
  },
  {
    id: 'venom-hollow', name: '毒腺腐穴', family: 'venom', mechanic: 'toxin',
    entrance: { offsetX: 0, offsetY: -550, width: 420 }, core: { offsetX: -12, offsetY: 12 },
    triggerRadius: 680, combatRadius: 580, coreMaxHealth: 20, intermissionMs: 820,
    collisionBodies: northGate(1.04),
    waves: [
      [spawn('venom-w1-bloodleech', 'bloodleech', -290, 20), spawn('venom-w1-spider', 'spider', 280, 10), spawn('venom-w1-tick', 'tick', 0, 300)],
      [spawn('venom-w2-scorpion', 'scorpion', -330, -170), spawn('venom-w2-bombardier', 'bombardier', 320, -160), spawn('venom-w2-mosquito', 'mosquito', -20, 330), spawn('venom-w2-spider', 'spider', 40, -330, true)],
    ],
    reward: { family: 'venom', genes: 3, evolution: 38, heal: 26 }, revealRadius: 1220,
    art: { key: 'v4-nest-venom-hollow', path: '/assets/map-lab-v4/venom-hollow/venom-hollow-master-v1.png', width: 1480, height: 985, offsetY: 18 },
    palette: { primary: 0x4f7432, secondary: 0x2d431d, glow: 0xb5f16d, ground: 0x17210f },
    subtitle: '北侧腐根 · 吸血近袭与毒液交叉火力',
  },
  {
    id: 'rift-scar', name: '裂隙伤口', family: 'rift', mechanic: 'rift',
    entrance: { offsetX: -620, offsetY: 0, width: 440 }, core: { offsetX: 18, offsetY: -8 },
    triggerRadius: 730, combatRadius: 620, coreMaxHealth: 23, intermissionMs: 860,
    collisionBodies: westGate(1.12),
    waves: [
      [spawn('rift-w1-riftweaver', 'riftweaver', -250, -260), spawn('rift-w1-glowworm', 'glowworm', 280, -220), spawn('rift-w1-cicada', 'cicada', 30, 300)],
      [spawn('rift-w2-spitter', 'spitter', -340, 40), spawn('rift-w2-moth', 'moth', 330, 20), spawn('rift-w2-riftweaver', 'riftweaver', 20, -320)],
      [spawn('rift-w3-glowworm', 'glowworm', -350, -150), spawn('rift-w3-riftweaver-a', 'riftweaver', 345, -130), spawn('rift-w3-bombardier', 'bombardier', -20, 330), spawn('rift-w3-riftweaver-b', 'riftweaver', 30, -335, true)],
    ],
    reward: { family: 'rift', genes: 4, evolution: 46, heal: 28 }, revealRadius: 1020,
    art: { key: 'v4-nest-rift-scar', path: '/assets/map-lab-v4/rift-scar/rift-scar-master-v1.png', width: 1600, height: 1065, offsetY: 12 },
    palette: { primary: 0x68418a, secondary: 0x3c2855, glow: 0xd18cff, ground: 0x1b1226 },
    subtitle: '西侧断层 · 多重裂隙弹幕',
  },
  {
    id: 'black-cocoon', name: '黑茧高巢', family: 'wing', mechanic: 'cocoon',
    entrance: { offsetX: 0, offsetY: 700, width: 470 }, core: { offsetX: 0, offsetY: -24 },
    triggerRadius: 800, combatRadius: 700, coreMaxHealth: 28, intermissionMs: 760,
    collisionBodies: southGate(1.25),
    waves: [
      [spawn('cocoon-w1-wasp', 'wasp', -320, -240), spawn('cocoon-w1-dragonfly', 'dragonfly', 310, -230), spawn('cocoon-w1-moth', 'moth', 0, 360)],
      [spawn('cocoon-w2-razorwing', 'razorwing', -390, 40), spawn('cocoon-w2-mosquito', 'mosquito', 380, 30), spawn('cocoon-w2-cicada', 'cicada', 0, -390)],
      [spawn('cocoon-w3-moth', 'moth', -400, -170), spawn('cocoon-w3-razorwing', 'razorwing', 390, -160), spawn('cocoon-w3-wasp', 'wasp', -20, 390), spawn('cocoon-w3-dragonfly', 'dragonfly', 35, -400, true)],
    ],
    reward: { family: 'wing', genes: 5, evolution: 52, heal: 36 }, revealRadius: 1460,
    art: { key: 'v4-nest-black-cocoon', path: '/assets/map-lab-v4/black-cocoon/black-cocoon-master-v1.png', width: 1680, height: 1120, offsetY: 8 },
    palette: { primary: 0x3e5650, secondary: 0x202f2c, glow: 0x76e9c8, ground: 0x0d1514 },
    subtitle: '南侧悬根 · 精英三波空袭',
  },
  {
    id: 'drowned-queen', name: '沉没母巢', family: 'swarm', mechanic: 'queen',
    entrance: { offsetX: 720, offsetY: 0, width: 480 }, core: { offsetX: -20, offsetY: 15 },
    triggerRadius: 820, combatRadius: 720, coreMaxHealth: 30, intermissionMs: 900,
    collisionBodies: eastGate(1.28),
    waves: [
      [spawn('queen-w1-bloodleech', 'bloodleech', -300, -280), spawn('queen-w1-tick', 'tick', 320, -250), spawn('queen-w1-spitter', 'spitter', 0, 360)],
      [spawn('queen-w2-fireant', 'fireant', -390, 40), spawn('queen-w2-locust', 'locust', 380, 20), spawn('queen-w2-cicada', 'cicada', 0, -390)],
      [spawn('queen-w3-bloodleech', 'bloodleech', -400, -170), spawn('queen-w3-spider', 'spider', 390, -160), spawn('queen-w3-glowworm', 'glowworm', -20, 390), spawn('queen-w3-locust', 'locust', 35, -400, true)],
    ],
    reward: { family: 'swarm', genes: 5, evolution: 54, heal: 38 }, revealRadius: 1120,
    art: { key: 'v4-nest-drowned-queen', path: '/assets/map-lab-v4/drowned-queen/drowned-queen-master-v1.png', width: 1680, height: 1120, offsetY: 24 },
    palette: { primary: 0x1e6e69, secondary: 0x174442, glow: 0x5ff4dc, ground: 0x0b201e },
    subtitle: '东侧浅滩 · 母巢三阶段围猎',
  },
] as const satisfies readonly GloamwoodNestConfig[]

export type GloamwoodNestId = (typeof GLOAMWOOD_NEST_CONFIGS)[number]['id']

export function gloamwoodNestConfig(id: string) {
  const config = GLOAMWOOD_NEST_CONFIGS.find((candidate) => candidate.id === id)
  if (!config) throw new Error(`Unknown Gloamwood nest: ${id}`)
  return config
}

export function gloamwoodNest(id: string) {
  const nest = GLOAMWOOD_EXPLORATION_LAYOUT.nests.find((candidate) => candidate.id === id)
  if (!nest) throw new Error(`Missing Gloamwood layout nest: ${id}`)
  return nest
}

export function gloamwoodNestPoint(id: string, point: { offsetX: number; offsetY: number }): ExplorationPoint {
  const nest = gloamwoodNest(id)
  return { x: nest.x + point.offsetX, y: nest.y + point.offsetY }
}

export function gloamwoodNestColliderRect(id: string, collider: GloamwoodNestCollider) {
  const center = gloamwoodNestPoint(id, collider)
  return { x: center.x - collider.width / 2, y: center.y - collider.height / 2, width: collider.width, height: collider.height }
}

export function gloamwoodNestWavePoints(id: string, waveIndex: number) {
  const config = gloamwoodNestConfig(id)
  const nest = gloamwoodNest(id)
  return (config.waves[waveIndex] ?? []).map((entry) => ({
    ...entry,
    elite: Boolean(entry.elite),
    x: nest.x + entry.offsetX,
    y: nest.y + entry.offsetY,
  }))
}

export function phaseWaveIndex(phase: GloamwoodNestPhase) {
  const match = /^wave-(\d+)$/.exec(phase)
  return match ? Number(match[1]) - 1 : -1
}

export function phaseIntermissionIndex(phase: GloamwoodNestPhase) {
  const match = /^intermission-(\d+)$/.exec(phase)
  return match ? Number(match[1]) - 1 : -1
}

export function canDamageGloamwoodNestCore(phase: GloamwoodNestPhase) {
  return phase === 'core-vulnerable'
}
