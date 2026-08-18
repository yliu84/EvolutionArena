/**
 * Renders the valley's plan from the terrain functions themselves.
 *
 * Kept as a script rather than a drawing, because a hand-drawn plan is a claim
 * and this is a measurement: every line here comes out of the same code the
 * engine meshes. The first version was produced ad hoc and went stale the
 * moment the widths changed, which is exactly the failure it exists to prevent.
 *
 *   npx tsx scripts/render-valley-preview.ts
 */
import { writeFileSync } from 'node:fs'

import { GLOAMWOOD_VALLEY_BRANCHES } from '../src/gloamwood-valley-branches'
import { scatterGloamwoodValley } from '../src/gloamwood-valley-dressing'
import {
  GLOAMWOOD_VALLEY,
  GLOAMWOOD_VALLEY_LENGTH,
  gloamwoodValleyBranchPointAt,
  gloamwoodValleyCorridorLines,
  gloamwoodValleyHalfWidth,
  gloamwoodValleyPointAt,
  gloamwoodValleyRiverHalfWidth,
  gloamwoodValleyRiverOffset,
  gloamwoodValleyRoadHalfWidth,
  gloamwoodValleyRoadOffset,
  gloamwoodValleyWalkableHalfWidth,
} from '../src/gloamwood-valley-terrain'
import { gloamwoodValleyBranchHalfWidth } from '../src/gloamwood-valley-branches'
import { planGloamwoodValleyEncounters } from '../src/gloamwood-valley-spawns'

const SEED = 0x5a11e
const WIDTH = 1500
const MARGIN = 46

const lines = gloamwoodValleyCorridorLines()
const xs = lines.route.map((point) => point.x)
const zs = lines.route.map((point) => point.z)
for (const branch of lines.branches) {
  for (const [x, z] of branch.points) {
    xs.push(x)
    zs.push(z)
  }
}
const PAD = 70
const minX = Math.min(...xs) - PAD
const maxX = Math.max(...xs) + PAD
const minZ = Math.min(...zs) - PAD
const maxZ = Math.max(...zs) + PAD
const SCALE = (WIDTH - MARGIN * 2) / (maxX - minX)
const HEIGHT = Math.round((maxZ - minZ) * SCALE) + MARGIN * 2 + 76

const sx = (x: number) => MARGIN + (x - minX) * SCALE
const sy = (z: number) => MARGIN + 58 + (z - minZ) * SCALE

/** Outline of a band that follows the route, given its offset and half-width. */
function routeBand(offset: (s: number) => number, width: (s: number) => number) {
  const left: string[] = []
  const right: string[] = []
  for (let s = 0; s <= GLOAMWOOD_VALLEY_LENGTH; s += 4) {
    const a = gloamwoodValleyPointAt(s, offset(s) + width(s))
    const b = gloamwoodValleyPointAt(s, offset(s) - width(s))
    left.push(`${sx(a.x).toFixed(1)},${sy(a.z).toFixed(1)}`)
    right.unshift(`${sx(b.x).toFixed(1)},${sy(b.z).toFixed(1)}`)
  }
  return [...left, ...right].join(' ')
}

function branchBand(index: number) {
  const branch = GLOAMWOOD_VALLEY_BRANCHES[index]
  const left: string[] = []
  const right: string[] = []
  for (let step = 0; step <= 60; step += 1) {
    const t = step / 60
    const half = gloamwoodValleyBranchHalfWidth(branch, t) * GLOAMWOOD_VALLEY.walkShare
    const a = gloamwoodValleyBranchPointAt(index, t, half)
    const b = gloamwoodValleyBranchPointAt(index, t, -half)
    left.push(`${sx(a.x).toFixed(1)},${sy(a.z).toFixed(1)}`)
    right.unshift(`${sx(b.x).toFixed(1)},${sy(b.z).toFixed(1)}`)
  }
  return [...left, ...right].join(' ')
}

const parts: string[] = []
parts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}" font-family="Helvetica,Arial">`)
parts.push(`<rect width="${WIDTH}" height="${HEIGHT}" fill="#0a1410"/>`)
parts.push(`<text x="${MARGIN}" y="38" fill="#e6efe4" font-size="22" font-weight="700">河谷 · 由真实地形函数生成的平面图</text>`)
parts.push(`<text x="${MARGIN}" y="62" fill="#7d8f80" font-size="13">地形、路网与全部 87 只生物的位置都读自 src/gloamwood-valley-*.ts。等比例，无夸张。</text>`)

parts.push(`<polygon points="${routeBand(() => 0, gloamwoodValleyHalfWidth)}" fill="#16241c" stroke="#2b4436" stroke-width="1"/>`)
for (let index = 0; index < GLOAMWOOD_VALLEY_BRANCHES.length; index += 1) {
  parts.push(`<polygon points="${branchBand(index)}" fill="#1b3025" stroke="#3d5c48" stroke-width="1"/>`)
}
parts.push(`<polygon points="${routeBand(() => 0, gloamwoodValleyWalkableHalfWidth)}" fill="#1d3327" stroke="#3d5c48" stroke-width="1"/>`)
parts.push(`<polygon points="${routeBand(gloamwoodValleyRoadOffset, gloamwoodValleyRoadHalfWidth)}" fill="#5a4a33" opacity=".9"/>`)
parts.push(`<polygon points="${routeBand(gloamwoodValleyRiverOffset, gloamwoodValleyRiverHalfWidth)}" fill="#3c6f78" opacity=".92"/>`)

const COLORS: Record<string, string> = { tree: '#7fae6c', undergrowth: '#4f7a44', boulder: '#8b8f88', cliff: '#b9bdb4' }
for (const prop of scatterGloamwoodValley(SEED, 6200)) {
  const radius = prop.kind === 'cliff' ? 1.9 : prop.kind === 'tree' ? 1.4 : 0.8
  parts.push(`<circle cx="${sx(prop.x).toFixed(1)}" cy="${sy(prop.z).toFixed(1)}" r="${radius}" fill="${COLORS[prop.kind]}" opacity=".7"/>`)
}

// The creatures, so the composition can be judged as a layout rather than as a
// table of counts: what matters is where the packs sit relative to the nests,
// the gates and the ground the player has to walk anyway.
const SPAWN_STYLE: Record<string, { fill: string; radius: number }> = {
  grazer: { fill: '#8fd6a0', radius: 3 },
  pack: { fill: '#ff8f5c', radius: 3.4 },
  nest: { fill: '#e0b45f', radius: 8 },
  elite: { fill: '#c77dff', radius: 6.5 },
  boss: { fill: '#d0604a', radius: 9 },
}
for (const spawn of planGloamwoodValleyEncounters('valley-first-run')) {
  const style = SPAWN_STYLE[spawn.kind]
  const stroke = spawn.kind === 'nest' || spawn.kind === 'boss' || spawn.kind === 'elite'
    ? ` stroke="#0a1410" stroke-width="1.6"` : ''
  parts.push(`<circle cx="${sx(spawn.x).toFixed(1)}" cy="${sy(spawn.z).toFixed(1)}" r="${style.radius}" fill="${style.fill}"${stroke}/>`)
}

const NAMES: Record<string, string> = {
  'fern-hollow': '蕨草洼 · 环线',
  'reed-ford': '芦苇浅滩 · 过河',
  'scree-shelf': '碎石台 · 登高',
  'dead-grove': '枯林 · 环线',
  'high-terrace': '高阶地 · 登高',
  'stone-bowl': '石碗 · 过河',
}
for (const [index, branch] of GLOAMWOOD_VALLEY_BRANCHES.entries()) {
  const label = gloamwoodValleyBranchPointAt(index, branch.kind === 'loop' ? 0.5 : 1, 0)
  parts.push(`<text x="${sx(label.x).toFixed(1)}" y="${(sy(label.z) - 12).toFixed(1)}" fill="#9fd08a" font-size="12" font-weight="600" text-anchor="middle">${NAMES[branch.id] ?? branch.id}</text>`)
}
for (const ford of [400, 1420]) {
  const point = gloamwoodValleyPointAt(ford, gloamwoodValleyRiverOffset(ford))
  parts.push(`<circle cx="${sx(point.x).toFixed(1)}" cy="${sy(point.z).toFixed(1)}" r="5" fill="none" stroke="#7fd3d8" stroke-width="2"/>`)
  parts.push(`<text x="${sx(point.x).toFixed(1)}" y="${(sy(point.z) + 20).toFixed(1)}" fill="#7fd3d8" font-size="11" text-anchor="middle">浅滩</text>`)
}
for (const choke of GLOAMWOOD_VALLEY.chokes) {
  const point = gloamwoodValleyPointAt(choke, 0)
  parts.push(`<circle cx="${sx(point.x).toFixed(1)}" cy="${sy(point.z).toFixed(1)}" r="11" fill="none" stroke="#c9a45c" stroke-width="2" stroke-dasharray="4 4"/>`)
  parts.push(`<text x="${sx(point.x).toFixed(1)}" y="${(sy(point.z) - 18).toFixed(1)}" fill="#c9a45c" font-size="12" text-anchor="middle">隘口</text>`)
}
for (const [index, boss] of GLOAMWOOD_VALLEY.bossSlots.entries()) {
  const point = gloamwoodValleyPointAt(boss, gloamwoodValleyRoadOffset(boss))
  parts.push(`<circle cx="${sx(point.x).toFixed(1)}" cy="${sy(point.z).toFixed(1)}" r="9" fill="none" stroke="#d0604a" stroke-width="2.2"/>`)
  parts.push(`<text x="${sx(point.x).toFixed(1)}" y="${(sy(point.z) + 24).toFixed(1)}" fill="#d0604a" font-size="12" text-anchor="middle">首领 ${index + 1}</text>`)
}
for (const region of GLOAMWOOD_VALLEY.regions) {
  const point = gloamwoodValleyPointAt((region.from + region.to) / 2, -gloamwoodValleyHalfWidth((region.from + region.to) / 2) - 26)
  parts.push(`<text x="${sx(point.x).toFixed(1)}" y="${sy(point.z).toFixed(1)}" fill="#8fbf7a" font-size="15" font-weight="700" text-anchor="middle">${region.id}</text>`)
}
const spawn = gloamwoodValleyPointAt(GLOAMWOOD_VALLEY.spawnS, gloamwoodValleyRoadOffset(GLOAMWOOD_VALLEY.spawnS))
parts.push(`<circle cx="${sx(spawn.x).toFixed(1)}" cy="${sy(spawn.z).toFixed(1)}" r="7" fill="#63cbb0"/>`)
parts.push(`<text x="${sx(spawn.x).toFixed(1)}" y="${(sy(spawn.z) - 14).toFixed(1)}" fill="#63cbb0" font-size="12" text-anchor="middle">出生</text>`)

const legend: Array<[string, string]> = [
  ['#5a4a33', '主路'], ['#3c6f78', '河'], ['#1b3025', '支线'],
  ['#8fd6a0', '被动散怪'], ['#ff8f5c', '主动小队'], ['#e0b45f', '巢穴'],
  ['#c77dff', '精英'], ['#d0604a', '首领'],
]
for (const [index, [color, label]] of legend.entries()) {
  const x = MARGIN + index * 128
  parts.push(`<rect x="${x}" y="${HEIGHT - 38}" width="14" height="14" fill="${color}"/>`)
  parts.push(`<text x="${x + 22}" y="${HEIGHT - 26}" fill="#7d8f80" font-size="13">${label}</text>`)
}
parts.push('</svg>')

writeFileSync('docs/design/maps/valley-generated-preview.svg', parts.join('\n'))
console.log(`wrote docs/design/maps/valley-generated-preview.svg (route ${Math.round(GLOAMWOOD_VALLEY_LENGTH)} units)`)
