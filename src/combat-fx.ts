import type { GameObjects } from 'phaser'
import { COMBAT_STYLES, type CombatStyle } from './combat'
import { juiceProgress, juiceTint } from './combat-juice'

export interface CombatJuiceBurst {
  style: CombatStyle
  originX: number
  originY: number
  aimX: number
  aimY: number
  aimAngle: number
  magicRadius: number
  hits: number
  startedAt: number
  durationMs: number
}

export interface JuiceTracer {
  x: number
  y: number
  prevX: number
  prevY: number
}

function fillWedge(
  graphics: GameObjects.Graphics,
  x: number,
  y: number,
  radius: number,
  start: number,
  end: number,
  color: number,
  alpha: number,
) {
  graphics.fillStyle(color, alpha)
  graphics.beginPath()
  graphics.moveTo(x, y)
  graphics.arc(x, y, radius, start, end, false)
  graphics.closePath()
  graphics.fillPath()
}

export function drawCombatTelegraph(
  graphics: GameObjects.Graphics,
  style: CombatStyle,
  originX: number,
  originY: number,
  aimX: number,
  aimY: number,
  aimAngle: number,
  magicRadius: number,
) {
  graphics.clear()
  if (style === 'melee') {
    const range = COMBAT_STYLES.melee.range
    const start = aimAngle - Math.PI * 0.36
    const end = aimAngle + Math.PI * 0.36
    fillWedge(graphics, originX, originY, range, start, end, 0xffd36e, 0.22)
    graphics.lineStyle(8, 0xfff1ad, 0.88)
    graphics.beginPath().arc(originX, originY, range, start, end).strokePath()
    graphics.lineStyle(3, 0xffffff, 0.7)
    graphics.beginPath().arc(originX, originY, range * 0.72, start + 0.06, end - 0.06).strokePath()
  } else if (style === 'ranged') {
    graphics.lineStyle(10, 0x9effcf, 0.38).lineBetween(originX, originY, aimX, aimY)
    graphics.lineStyle(3, 0xffffff, 0.7).lineBetween(originX, originY, aimX, aimY)
    graphics.fillStyle(0xb8ffe0, 0.7).fillCircle(originX, originY, 12)
    graphics.fillStyle(0xffffff, 0.9).fillCircle(aimX, aimY, 7)
  } else {
    graphics.fillStyle(0xa34fe8, 0.16).fillCircle(aimX, aimY, magicRadius)
    graphics.lineStyle(7, 0xc78cff, 0.92).strokeCircle(aimX, aimY, magicRadius)
    graphics.lineStyle(3, 0xf1d8ff, 0.7).strokeCircle(aimX, aimY, magicRadius * 0.62)
    graphics.fillStyle(0xffffff, 0.35).fillCircle(aimX, aimY, 8)
  }
}

export function drawCombatJuiceFrame(
  graphics: GameObjects.Graphics,
  burst: CombatJuiceBurst | undefined,
  now: number,
  tracers: readonly JuiceTracer[] = [],
) {
  graphics.clear()
  if (burst) {
    const progress = juiceProgress(burst.startedAt, now, burst.durationMs)
    if (progress < 1) {
      if (burst.style === 'melee') drawMeleeBurst(graphics, burst, progress)
      else if (burst.style === 'ranged') drawRangedMuzzle(graphics, burst, progress)
      else drawMagicBurst(graphics, burst, progress)
    }
  }
  drawRangedTracers(graphics, tracers)
}

function drawMeleeBurst(graphics: GameObjects.Graphics, burst: CombatJuiceBurst, progress: number) {
  const range = COMBAT_STYLES.melee.range
  const fade = 1 - progress
  const start = burst.aimAngle - Math.PI * 0.4
  const end = burst.aimAngle + Math.PI * 0.4
  const sweep = range * (0.62 + progress * 0.42)
  fillWedge(graphics, burst.originX, burst.originY, sweep, start, end, 0xfff1ad, 0.42 * fade)
  fillWedge(graphics, burst.originX, burst.originY, sweep * 0.72, start + 0.08, end - 0.08, 0xffffff, 0.22 * fade)
  graphics.lineStyle(22 * fade + 6, 0xffffff, 0.92 * fade)
  graphics.beginPath().arc(burst.originX, burst.originY, sweep * 0.96, start, end).strokePath()
  graphics.lineStyle(8, 0xffc857, 0.85 * fade)
  graphics.beginPath().arc(burst.originX, burst.originY, sweep * 0.58, start + 0.1, end - 0.1).strokePath()
  graphics.lineStyle(6, juiceTint('melee'), fade)
  graphics.lineBetween(
    burst.originX + Math.cos(burst.aimAngle) * 12,
    burst.originY + Math.sin(burst.aimAngle) * 12,
    burst.originX + Math.cos(burst.aimAngle) * sweep,
    burst.originY + Math.sin(burst.aimAngle) * sweep,
  )
}

function drawRangedMuzzle(graphics: GameObjects.Graphics, burst: CombatJuiceBurst, progress: number) {
  const fade = 1 - progress
  graphics.fillStyle(0xb8ffe0, 0.55 * fade).fillCircle(burst.originX, burst.originY, 34 + progress * 26)
  graphics.fillStyle(0xffffff, 0.7 * fade).fillCircle(burst.originX, burst.originY, 12)
  graphics.lineStyle(10, 0x9effcf, 0.75 * fade).lineBetween(burst.originX, burst.originY, burst.aimX, burst.aimY)
  graphics.lineStyle(4, 0xffffff, 0.9 * fade).lineBetween(burst.originX, burst.originY, burst.aimX, burst.aimY)
  graphics.fillStyle(0xffffff, 0.95 * fade).fillCircle(burst.aimX, burst.aimY, 10 + progress * 8)
}

function drawMagicBurst(graphics: GameObjects.Graphics, burst: CombatJuiceBurst, progress: number) {
  const fade = 1 - progress * 0.75
  const outer = burst.magicRadius * (0.28 + progress * 0.82)
  const inner = burst.magicRadius * (0.12 + progress * 0.48)
  graphics.fillStyle(0xa34fe8, 0.32 * fade).fillCircle(burst.aimX, burst.aimY, outer)
  graphics.lineStyle(12 * fade + 3, 0xf0c8ff, 0.95 * fade).strokeCircle(burst.aimX, burst.aimY, outer)
  graphics.lineStyle(5, 0xffffff, 0.75 * fade).strokeCircle(burst.aimX, burst.aimY, inner)
  graphics.fillStyle(0xe0b0ff, 0.45 * fade).fillEllipse(
    burst.aimX,
    burst.aimY - 28 - progress * 36,
    22,
    90 + progress * 50,
  )
  graphics.fillStyle(0xffffff, 0.5 * fade).fillCircle(burst.aimX, burst.aimY, 14 * (1 - progress * 0.35))
}

export function drawRangedTracers(graphics: GameObjects.Graphics, tracers: readonly JuiceTracer[]) {
  for (const tracer of tracers) {
    graphics.lineStyle(12, 0x9effcf, 0.55).lineBetween(tracer.prevX, tracer.prevY, tracer.x, tracer.y)
    graphics.lineStyle(5, 0xffffff, 0.92).lineBetween(tracer.prevX, tracer.prevY, tracer.x, tracer.y)
    graphics.fillStyle(0xb8ffe0, 0.45).fillCircle(tracer.x, tracer.y, 10)
    graphics.fillStyle(0xffffff, 0.95).fillCircle(tracer.x, tracer.y, 5)
  }
}
