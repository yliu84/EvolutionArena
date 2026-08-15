import { GLOAMWOOD_EXPLORATION_LAYOUT } from './gloamwood-exploration-layout'

export type V4EnvironmentPropKind = 'broadleaf' | 'conifer'

export interface V4EnvironmentProp {
  id: string
  kind: V4EnvironmentPropKind
  x: number
  y: number
  scale: number
  flipX: boolean
  colliderWidth: number
  colliderHeight: number
}

function hash(seed: string) {
  let value = 2166136261
  for (let index = 0; index < seed.length; index += 1) {
    value ^= seed.charCodeAt(index)
    value = Math.imul(value, 16777619)
  }
  return value >>> 0
}

function randomFor(seed: string) {
  let state = hash(seed) || 1
  return () => {
    state = Math.imul(state ^ state >>> 15, 1 | state)
    state ^= state + Math.imul(state ^ state >>> 7, 61 | state)
    return ((state ^ state >>> 14) >>> 0) / 4294967296
  }
}

function distanceToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax
  const dy = by - ay
  const lengthSquared = dx * dx + dy * dy
  if (lengthSquared === 0) return Math.hypot(px - ax, py - ay)
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

export function isV4PropPositionSafe(x: number, y: number) {
  for (const spawn of GLOAMWOOD_EXPLORATION_LAYOUT.spawnPoints) {
    if (Math.hypot(x - spawn.x, y - spawn.y) < spawn.safeRadius + 170) return false
  }
  for (const nest of GLOAMWOOD_EXPLORATION_LAYOUT.nests) {
    if (Math.hypot(x - nest.x, y - nest.y) < nest.radius + 170) return false
  }
  const boss = GLOAMWOOD_EXPLORATION_LAYOUT.bossLair
  if (Math.hypot(x - boss.x, y - boss.y) < boss.radius + 190) return false
  for (const route of GLOAMWOOD_EXPLORATION_LAYOUT.routes) {
    for (let index = 1; index < route.points.length; index += 1) {
      const from = route.points[index - 1]
      const to = route.points[index]
      if (distanceToSegment(x, y, from.x, from.y, to.x, to.y) < route.width / 2 + 150) return false
    }
  }
  return true
}

export function createV4EnvironmentProps(seed: string, limit = 46): V4EnvironmentProp[] {
  const random = randomFor(`${seed}:environment-props`)
  const props: V4EnvironmentProp[] = []
  const world = GLOAMWOOD_EXPLORATION_LAYOUT.world
  for (let y = 240; y < world.height - 180 && props.length < limit; y += 290) {
    for (let x = 220; x < world.width - 180 && props.length < limit; x += 300) {
      if (random() < 0.3) continue
      const candidateX = Math.round(x + (random() - 0.5) * 190)
      const candidateY = Math.round(y + (random() - 0.5) * 170)
      if (!isV4PropPositionSafe(candidateX, candidateY)) continue
      const kind: V4EnvironmentPropKind = random() < 0.58 ? 'broadleaf' : 'conifer'
      const scale = Math.round((kind === 'broadleaf' ? 0.34 + random() * 0.13 : 0.38 + random() * 0.15) * 100) / 100
      props.push({
        id: `forest-prop-${props.length + 1}`,
        kind,
        x: candidateX,
        y: candidateY,
        scale,
        flipX: random() < 0.5,
        colliderWidth: Math.round((kind === 'broadleaf' ? 88 : 62) * scale),
        colliderHeight: Math.round((kind === 'broadleaf' ? 72 : 62) * scale),
      })
    }
  }
  const minimum = Math.min(limit, 30)
  for (let y = 370; y < world.height - 180 && props.length < minimum; y += 260) {
    for (let x = 360; x < world.width - 180 && props.length < minimum; x += 280) {
      const candidateX = Math.round(x + (random() - 0.5) * 100)
      const candidateY = Math.round(y + (random() - 0.5) * 90)
      if (!isV4PropPositionSafe(candidateX, candidateY)) continue
      if (props.some((prop) => Math.hypot(prop.x - candidateX, prop.y - candidateY) < 220)) continue
      const kind: V4EnvironmentPropKind = random() < 0.58 ? 'broadleaf' : 'conifer'
      const scale = Math.round((kind === 'broadleaf' ? 0.34 + random() * 0.13 : 0.38 + random() * 0.15) * 100) / 100
      props.push({
        id: `forest-prop-${props.length + 1}`,
        kind,
        x: candidateX,
        y: candidateY,
        scale,
        flipX: random() < 0.5,
        colliderWidth: Math.round((kind === 'broadleaf' ? 88 : 62) * scale),
        colliderHeight: Math.round((kind === 'broadleaf' ? 72 : 62) * scale),
      })
    }
  }
  return props
}
