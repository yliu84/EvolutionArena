import type { GloamwoodNestId } from './gloamwood-nests'

export type ArenaHazardEffect = 'damage' | 'slow'
export type ArenaHazardPhase = 'idle' | 'warning' | 'active'

export interface ArenaObstacle {
  id: string
  offsetX: number
  offsetY: number
  width: number
  height: number
}

export interface ArenaHazard {
  id: string
  label: string
  effect: ArenaHazardEffect
  offsetX: number
  offsetY: number
  radiusX: number
  radiusY: number
  cycleMs: number
  activeMs: number
  warningMs: number
  phaseOffsetMs: number
  damage?: number
  slowMultiplier?: number
}

export interface ArenaRoutePoint {
  offsetX: number
  offsetY: number
}

export interface GloamwoodArenaFeatures {
  obstacleStyle: string
  routeLabel: string
  obstacles: readonly ArenaObstacle[]
  hazards: readonly ArenaHazard[]
  route: readonly ArenaRoutePoint[]
}

const obstacle = (id: string, offsetX: number, offsetY: number, width: number, height: number): ArenaObstacle => ({
  id, offsetX, offsetY, width, height,
})

const hazard = (
  id: string,
  label: string,
  effect: ArenaHazardEffect,
  offsetX: number,
  offsetY: number,
  radiusX: number,
  radiusY: number,
  cycleMs: number,
  activeMs: number,
  warningMs: number,
  phaseOffsetMs: number,
  strength: number,
): ArenaHazard => ({
  id, label, effect, offsetX, offsetY, radiusX, radiusY, cycleMs, activeMs, warningMs, phaseOffsetMs,
  ...(effect === 'damage' ? { damage: strength } : { slowMultiplier: strength }),
})

export const GLOAMWOOD_ARENA_FEATURES: Record<GloamwoodNestId, GloamwoodArenaFeatures> = {
  'thorn-burrow': {
    obstacleStyle: '交错獠牙', routeLabel: '中央猎杀折线',
    obstacles: [obstacle('west-fang', -185, 65, 104, 154), obstacle('east-fang', 185, 65, 104, 154)],
    hazards: [
      hazard('north-root-burst', '北侧血根爆发', 'damage', -285, -220, 112, 74, 4200, 900, 900, 0, 3),
      hazard('south-root-burst', '南侧血根爆发', 'damage', 285, 205, 104, 70, 4200, 900, 900, 2100, 3),
    ],
    route: [{ offsetX: 0, offsetY: 390 }, { offsetX: 0, offsetY: 220 }, { offsetX: -85, offsetY: 15 }, { offsetX: 35, offsetY: -245 }],
  },
  'razor-roost': {
    obstacleStyle: '风蚀立柱', routeLabel: '西入口回旋线',
    obstacles: [obstacle('north-wind-pillar', 50, -190, 94, 138), obstacle('south-wind-pillar', 50, 160, 94, 138)],
    hazards: [
      hazard('crosswind-lane', '横向风压带', 'slow', 175, 0, 300, 82, 3600, 1250, 850, 0, 0.58),
      hazard('eye-gust', '风眼乱流', 'damage', -120, 0, 92, 92, 4800, 850, 1000, 2400, 2),
    ],
    route: [{ offsetX: -390, offsetY: 0 }, { offsetX: -205, offsetY: -95 }, { offsetX: 0, offsetY: 0 }, { offsetX: 230, offsetY: 120 }],
  },
  'brood-mound': {
    obstacleStyle: '孵化卵柱', routeLabel: '双侧清卵环线',
    obstacles: [obstacle('west-egg-column', -170, -35, 118, 150), obstacle('east-egg-column', 170, -35, 118, 150), obstacle('rear-egg-column', 0, 215, 104, 120)],
    hazards: [
      hazard('west-brood-slime', '西侧孵化黏液', 'slow', -290, 190, 118, 88, 4000, 1450, 850, 0, 0.55),
      hazard('east-brood-slime', '东侧孵化黏液', 'slow', 290, 185, 118, 88, 4000, 1450, 850, 2000, 0.55),
    ],
    route: [{ offsetX: 0, offsetY: -430 }, { offsetX: -250, offsetY: -190 }, { offsetX: -255, offsetY: 80 }, { offsetX: 0, offsetY: 310 }, { offsetX: 255, offsetY: 75 }, { offsetX: 245, offsetY: -190 }],
  },
  'shell-basin': {
    obstacleStyle: '重甲石垒', routeLabel: '三柱掩体切线',
    obstacles: [obstacle('north-shell-pillar', -90, -220, 138, 138), obstacle('center-shell-pillar', 185, 0, 150, 150), obstacle('south-shell-pillar', -80, 230, 138, 138)],
    hazards: [
      hazard('heavy-mud', '重甲沉泥', 'slow', 300, 0, 150, 230, 4400, 1750, 950, 0, 0.48),
      hazard('acid-impact', '酸炮落点', 'damage', -290, 0, 105, 150, 4400, 850, 1050, 2200, 3),
    ],
    route: [{ offsetX: -430, offsetY: 0 }, { offsetX: -250, offsetY: -145 }, { offsetX: 25, offsetY: -95 }, { offsetX: -5, offsetY: 130 }, { offsetX: 250, offsetY: 155 }],
  },
  'venom-hollow': {
    obstacleStyle: '毒腺根瘤', routeLabel: '酸池蛇形线',
    obstacles: [obstacle('west-gland', -175, -150, 120, 130), obstacle('east-gland', 185, 155, 120, 130)],
    hazards: [
      hazard('west-acid-pool', '西侧腐蚀酸池', 'damage', -285, 165, 125, 90, 3500, 1050, 900, 0, 3),
      hazard('east-acid-pool', '东侧腐蚀酸池', 'damage', 285, -155, 125, 90, 3500, 1050, 900, 1750, 3),
    ],
    route: [{ offsetX: 0, offsetY: -390 }, { offsetX: 170, offsetY: -245 }, { offsetX: 0, offsetY: -40 }, { offsetX: -175, offsetY: 150 }, { offsetX: 0, offsetY: 310 }],
  },
  'rift-scar': {
    obstacleStyle: '裂隙锚晶', routeLabel: '空间断层换位线',
    obstacles: [obstacle('south-rift-anchor', -145, 215, 110, 150), obstacle('north-rift-anchor', 190, -300, 110, 150)],
    hazards: [
      hazard('vertical-rift', '纵向空间裂口', 'damage', 40, 245, 105, 155, 3200, 850, 900, 0, 3),
      hazard('side-rift', '侧向空间裂口', 'damage', 285, 40, 145, 92, 3200, 850, 900, 1600, 3),
    ],
    route: [{ offsetX: -430, offsetY: 0 }, { offsetX: -245, offsetY: 125 }, { offsetX: -15, offsetY: 40 }, { offsetX: 145, offsetY: -115 }, { offsetX: 330, offsetY: 90 }],
  },
  'black-cocoon': {
    obstacleStyle: '悬茧丝柱', routeLabel: '双环破茧路线',
    obstacles: [obstacle('west-cocoon', -235, 0, 118, 172), obstacle('east-cocoon', 235, 0, 118, 172), obstacle('north-cocoon', 0, -255, 106, 145)],
    hazards: [
      hazard('lower-web-belt', '下层黏丝带', 'slow', 0, 195, 350, 76, 3700, 1500, 900, 0, 0.5),
      hazard('upper-web-belt', '上层黏丝带', 'slow', 0, -155, 350, 70, 3700, 1500, 900, 1850, 0.5),
    ],
    route: [{ offsetX: 0, offsetY: 500 }, { offsetX: -300, offsetY: 250 }, { offsetX: -320, offsetY: -60 }, { offsetX: 0, offsetY: -360 }, { offsetX: 320, offsetY: -60 }, { offsetX: 300, offsetY: 250 }],
  },
  'drowned-queen': {
    obstacleStyle: '潮生根岛', routeLabel: '潮汐安全半环',
    obstacles: [obstacle('north-root-island', -220, -175, 150, 130), obstacle('south-root-island', 205, 180, 150, 130), obstacle('queen-spire', 120, -270, 118, 148)],
    hazards: [
      hazard('queen-deep-water', '母巢深水潮', 'slow', -265, 145, 180, 145, 4300, 1750, 950, 0, 0.46),
      hazard('queen-surge', '母巢吞没浪', 'damage', 280, -105, 150, 125, 4300, 1000, 1050, 2150, 4),
    ],
    route: [{ offsetX: 500, offsetY: 0 }, { offsetX: 320, offsetY: -235 }, { offsetX: 20, offsetY: -410 }, { offsetX: -360, offsetY: -280 }, { offsetX: -390, offsetY: 80 }, { offsetX: -170, offsetY: 310 }],
  },
}

export function gloamwoodArenaFeatures(id: string) {
  const features = GLOAMWOOD_ARENA_FEATURES[id as GloamwoodNestId]
  if (!features) throw new Error(`Unknown Gloamwood arena features: ${id}`)
  return features
}

export function arenaHazardPhase(hazard: ArenaHazard, time: number): ArenaHazardPhase {
  const phase = ((time + hazard.phaseOffsetMs) % hazard.cycleMs + hazard.cycleMs) % hazard.cycleMs
  if (phase < hazard.activeMs) return 'active'
  if (phase >= hazard.cycleMs - hazard.warningMs) return 'warning'
  return 'idle'
}

export function pointInsideArenaHazard(x: number, y: number, hazard: ArenaHazard) {
  const dx = (x - hazard.offsetX) / hazard.radiusX
  const dy = (y - hazard.offsetY) / hazard.radiusY
  return dx * dx + dy * dy <= 1
}
