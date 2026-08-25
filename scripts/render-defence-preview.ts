/**
 * Renders the defence map's plan by sampling the terrain functions themselves.
 *
 * Kept as a script rather than a drawing, for the same reason the valley's plan
 * is: a hand-drawn plan is a claim and this is a measurement. Every pixel of
 * walkable ground here comes from `gloamwoodDefenceWalkable`, every shade from
 * `gloamwoodDefenceHeight`, and every distance in the caption from the
 * functions that the runtime will ask. A plan drawn any other way goes stale
 * the moment a radius changes, which is exactly the failure this avoids.
 *
 *   npx tsx scripts/render-defence-preview.ts [out.svg]
 */
import { writeFileSync } from 'node:fs'

import {
  GLOAMWOOD_DEFENCE,
  gloamwoodDefenceHeight,
  gloamwoodDefenceInterceptionDepth,
  gloamwoodDefenceMarchDistance,
  gloamwoodDefenceWalkable,
} from '../src/gloamwood-defence-terrain'
import { GLOAMWOOD_PREY } from '../src/gloamwood-3d-ecology'

const PLAYER_SPEED = 6.2
const { bounds, arena, altar, spawn, portal, road } = GLOAMWOOD_DEFENCE
const SCALE = 11
const PAD = 46
const CELL = 0.5

const width = bounds.halfWidth * 2 * SCALE + PAD * 2
const height = bounds.halfDepth * 2 * SCALE + PAD * 2
const side = Math.max(width, height)
const offsetX = (side - width) / 2
const offsetZ = (side - height) / 2
const px = (x: number) => offsetX + PAD + (x + bounds.halfWidth) * SCALE
const pz = (z: number) => offsetZ + PAD + (z + bounds.halfDepth) * SCALE

const parts: string[] = [`<rect width="${side}" height="${side}" fill="#0b0d09"/>`]

// The ground, one cell at a time, straight out of the functions. Walkable cells
// are tinted by depth in the bowl; wall cells by how high the bank has climbed.
let maxWall = 0
for (let x = -bounds.halfWidth; x < bounds.halfWidth; x += CELL) {
  for (let z = -bounds.halfDepth; z < bounds.halfDepth; z += CELL) {
    maxWall = Math.max(maxWall, gloamwoodDefenceHeight(x + CELL / 2, z + CELL / 2))
  }
}
for (let x = -bounds.halfWidth; x < bounds.halfWidth; x += CELL) {
  for (let z = -bounds.halfDepth; z < bounds.halfDepth; z += CELL) {
    const cx = x + CELL / 2
    const cz = z + CELL / 2
    const elevation = gloamwoodDefenceHeight(cx, cz)
    let fill: string
    if (gloamwoodDefenceWalkable(cx, cz)) {
      const onRoad = Math.abs(cx) <= Math.max(0, road.mouthHalfWidth) && cz <= road.endZ
      const lift = Math.max(0, Math.min(1, elevation / GLOAMWOOD_DEFENCE.portalHeight))
      fill = onRoad
        ? `rgb(${Math.round(74 + lift * 34)},${Math.round(58 + lift * 22)},${Math.round(38 + lift * 12)})`
        : `rgb(${Math.round(61 + elevation * 26)},${Math.round(82 + elevation * 26)},${Math.round(51 + elevation * 18)})`
    } else {
      const climb = Math.max(0, Math.min(1, elevation / Math.max(0.001, maxWall)))
      const tone = Math.round(22 + climb * 20)
      fill = `rgb(${tone},${Math.round(tone * 1.28)},${Math.round(tone * 0.86)})`
    }
    parts.push(`<rect x="${px(x).toFixed(2)}" y="${pz(z).toFixed(2)}" width="${(CELL * SCALE) + 0.6}" height="${(CELL * SCALE) + 0.6}" fill="${fill}"/>`)
  }
}

const label = (x: number, z: number, text: string, fill: string, anchor = 'middle', size = 16) =>
  `<text x="${px(x)}" y="${pz(z)}" fill="${fill}" font-size="${size}" font-family="sans-serif" text-anchor="${anchor}">${text}</text>`

// Interception depth, drawn where it is actually measured.
parts.push(`<line x1="${px(-11)}" y1="${pz(road.endZ)}" x2="${px(-11)}" y2="${pz(altar.z)}" stroke="#ffd76a" stroke-width="2" stroke-dasharray="7 5"/>`)
parts.push(label(-11, road.endZ - 1.4, `拦截纵深 ${gloamwoodDefenceInterceptionDepth()}`, '#ffd76a', 'middle', 15))
parts.push(`<line x1="${px(0)}" y1="${pz(portal.z + 2.6)}" x2="${px(0)}" y2="${pz(altar.z - 3.4)}" stroke="#e2a7e2" stroke-width="2" stroke-dasharray="9 7"/>`)
parts.push(label(2.4, -12, `行军 ${gloamwoodDefenceMarchDistance()}`, '#e2a7e2', 'start', 16))

parts.push(`<rect x="${px(altar.x) - altar.radius * SCALE}" y="${pz(altar.z) - altar.radius * 0.7 * SCALE}" width="${altar.radius * 2 * SCALE}" height="${altar.radius * 1.4 * SCALE}" rx="${SCALE}" fill="#8d6fd0" stroke="#e4d8ff" stroke-width="3"/>`)
parts.push(label(altar.x, altar.z + 0.6, '祭坛', '#fff', 'middle', 17))
parts.push(`<circle cx="${px(spawn.x)}" cy="${pz(spawn.z)}" r="${1.3 * SCALE}" fill="#e8574a" stroke="#fff" stroke-width="2"/>`)
parts.push(label(spawn.x + 2.2, spawn.z + 0.6, '玩家出生 / 复活', '#ffd6d2', 'start', 15))
parts.push(`<ellipse cx="${px(portal.x)}" cy="${pz(portal.z)}" rx="${4.5 * SCALE}" ry="${2.2 * SCALE}" fill="#6a2f6a" stroke="#e2a7e2" stroke-width="3"/>`)
parts.push(label(portal.x, portal.z + 0.6, '巢穴 / 传送门', '#fff', 'middle', 17))

const march = gloamwoodDefenceMarchDistance()
// Two distances, and conflating them is how the first estimate came out at half
// the real figure. The road is how long a wave takes to *arrive*; the march is
// how long it would take to reach the altar if nothing ever stopped it.
const roadDistance = road.endZ - portal.z
const seconds = (speed: number) => (roadDistance / speed).toFixed(1)
const MARCH_SPEED_BOOST = 1.6
const boosted = (speed: number) => (roadDistance / (speed * MARCH_SPEED_BOOST)).toFixed(1)
parts.push(label(0, -bounds.halfDepth - 1.4, `${bounds.halfWidth * 2} × ${bounds.halfDepth * 2} 世界单位（幽林现在是 50 × 36）`, '#e6f0d8', 'middle', 19))
parts.push(label(0, arena.z + arena.radius + 2.4, `开阔战场 · 半径 ${arena.radius}`, '#bfe0a8', 'middle', 16))
parts.push(label(
  -bounds.halfWidth + 1.2,
  bounds.halfDepth - 3.4,
  `走完这条路：裂牙 ${seconds(GLOAMWOOD_PREY.fang.moveSpeed)}s · 群虫 ${seconds(GLOAMWOOD_PREY.swarm.moveSpeed)}s · 岩盾 ${seconds(GLOAMWOOD_PREY.shell.moveSpeed)}s`,
  '#9fb289', 'start', 15,
))
parts.push(label(
  -bounds.halfWidth + 1.2,
  bounds.halfDepth - 1.4,
  `行军加速 ×${MARCH_SPEED_BOOST} 后：${boosted(GLOAMWOOD_PREY.fang.moveSpeed)}s · ${boosted(GLOAMWOOD_PREY.swarm.moveSpeed)}s · ${boosted(GLOAMWOOD_PREY.shell.moveSpeed)}s（玩家跑完 ${seconds(PLAYER_SPEED)}s）`,
  '#c8b47a', 'start', 15,
))
parts.push(label(-bounds.halfWidth + 1.2, -bounds.halfDepth + 2.4, '暗色 = 不可通行的坡（唯一入口是那条路）', '#6f7f5c', 'start', 15))

const out = process.argv[2] ?? 'defence-preview.svg'
writeFileSync(out, `<svg xmlns="http://www.w3.org/2000/svg" width="${side}" height="${side}">${parts.join('')}</svg>`)
console.log(`EA_DEFENCE_PREVIEW=${JSON.stringify({
  out,
  bounds,
  interceptionDepth: gloamwoodDefenceInterceptionDepth(),
  marchToAltar: march,
  roadDistance,
  roadSeconds: {
    fang: Number(seconds(GLOAMWOOD_PREY.fang.moveSpeed)),
    swarm: Number(seconds(GLOAMWOOD_PREY.swarm.moveSpeed)),
    shell: Number(seconds(GLOAMWOOD_PREY.shell.moveSpeed)),
    player: Number(seconds(PLAYER_SPEED)),
  },
  roadSecondsBoosted: {
    fang: Number(boosted(GLOAMWOOD_PREY.fang.moveSpeed)),
    swarm: Number(boosted(GLOAMWOOD_PREY.swarm.moveSpeed)),
    shell: Number(boosted(GLOAMWOOD_PREY.shell.moveSpeed)),
  },
})}`)
