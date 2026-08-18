/**
 * Renders the valley's plan view from the terrain functions themselves.
 *
 * Kept as a script rather than a drawing, because a hand-drawn plan is a claim
 * and this is a measurement: every line here comes out of the same code the
 * engine meshes. The first version of this file was produced ad hoc and went
 * stale the moment the widths changed, which is exactly the failure it exists
 * to prevent.
 *
 *   npx tsx scripts/render-valley-preview.ts
 */
import { writeFileSync } from 'node:fs'

import { scatterGloamwoodValley } from '../src/gloamwood-valley-dressing'
import {
  GLOAMWOOD_VALLEY,
  gloamwoodValleyHalfWidth,
  gloamwoodValleyRiverCenter,
  gloamwoodValleyRiverHalfWidth,
  gloamwoodValleyRoadCenter,
  gloamwoodValleyRoadHalfWidth,
  gloamwoodValleyWalkableHalfWidth,
} from '../src/gloamwood-valley-terrain'

const SEED = 0x5a11e
const WIDTH = 1500
const MARGIN = 40
const SCALE = (WIDTH - MARGIN * 2) / GLOAMWOOD_VALLEY.length
const CENTER_Y = 300
const HEIGHT = 470

const sx = (x: number) => MARGIN + x * SCALE
const sy = (z: number) => CENTER_Y + z * SCALE * 3.2

function band(width: (x: number) => number, center: (x: number) => number) {
  const top: string[] = []
  const bottom: string[] = []
  for (let x = 0; x <= GLOAMWOOD_VALLEY.length; x += 4) {
    top.push(`${sx(x).toFixed(1)},${sy(center(x) - width(x)).toFixed(1)}`)
    bottom.unshift(`${sx(x).toFixed(1)},${sy(center(x) + width(x)).toFixed(1)}`)
  }
  return [...top, ...bottom].join(' ')
}

const parts: string[] = []
parts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}" font-family="Helvetica,Arial">`)
parts.push(`<rect width="${WIDTH}" height="${HEIGHT}" fill="#0a1410"/>`)
parts.push(`<text x="34" y="40" fill="#e6efe4" font-size="22" font-weight="700">河谷 · 由真实地形函数生成的俯视图</text>`)
parts.push(`<text x="34" y="64" fill="#7d8f80" font-size="13">路、河、可行走边界与散布全部读自 src/gloamwood-valley-*.ts。横向已放大 3.2 倍，否则一条 1600 长、44 宽的谷在图上是一根线。</text>`)

parts.push(`<polygon points="${band(gloamwoodValleyHalfWidth, () => 0)}" fill="#16241c" stroke="#2b4436" stroke-width="1"/>`)
parts.push(`<polygon points="${band(gloamwoodValleyWalkableHalfWidth, () => 0)}" fill="#1d3327" stroke="#3d5c48" stroke-width="1"/>`)
parts.push(`<polygon points="${band(gloamwoodValleyRoadHalfWidth, gloamwoodValleyRoadCenter)}" fill="#5a4a33" opacity=".85"/>`)
parts.push(`<polygon points="${band(gloamwoodValleyRiverHalfWidth, gloamwoodValleyRiverCenter)}" fill="#3c6f78" opacity=".9"/>`)

const COLORS: Record<string, string> = { tree: '#7fae6c', undergrowth: '#4f7a44', boulder: '#8b8f88', cliff: '#b9bdb4' }
for (const prop of scatterGloamwoodValley(SEED, 6200)) {
  const radius = prop.kind === 'cliff' ? 2.2 : prop.kind === 'tree' ? 1.5 : 0.9
  parts.push(`<circle cx="${sx(prop.x).toFixed(1)}" cy="${sy(prop.z).toFixed(1)}" r="${radius}" fill="${COLORS[prop.kind]}" opacity=".72"/>`)
}

for (const choke of GLOAMWOOD_VALLEY.chokes) {
  parts.push(`<line x1="${sx(choke)}" y1="${CENTER_Y - 140}" x2="${sx(choke)}" y2="${CENTER_Y + 140}" stroke="#c9a45c" stroke-width="1.4" stroke-dasharray="5 5" opacity=".75"/>`)
  parts.push(`<text x="${sx(choke)}" y="${CENTER_Y - 148}" fill="#c9a45c" font-size="12" text-anchor="middle">隘口</text>`)
}
for (const [index, boss] of GLOAMWOOD_VALLEY.bossSlots.entries()) {
  parts.push(`<circle cx="${sx(boss)}" cy="${sy(gloamwoodValleyRoadCenter(boss))}" r="9" fill="none" stroke="#d0604a" stroke-width="2.2"/>`)
  parts.push(`<text x="${sx(boss)}" y="${sy(gloamwoodValleyRoadCenter(boss)) + 30}" fill="#d0604a" font-size="12" text-anchor="middle">首领 ${index + 1}</text>`)
}
for (const region of GLOAMWOOD_VALLEY.regions) {
  parts.push(`<text x="${sx((region.from + region.to) / 2)}" y="${CENTER_Y - 170}" fill="#8fbf7a" font-size="14" font-weight="600" text-anchor="middle">${region.id}</text>`)
}
parts.push(`<circle cx="${sx(GLOAMWOOD_VALLEY.spawn.x)}" cy="${sy(gloamwoodValleyRoadCenter(GLOAMWOOD_VALLEY.spawn.x))}" r="7" fill="#63cbb0"/>`)
parts.push(`<text x="${sx(GLOAMWOOD_VALLEY.spawn.x)}" y="${sy(gloamwoodValleyRoadCenter(GLOAMWOOD_VALLEY.spawn.x)) - 14}" fill="#63cbb0" font-size="12" text-anchor="middle">出生</text>`)

const legend = [['#5a4a33', '路'], ['#3c6f78', '河'], ['#7fae6c', '树'], ['#4f7a44', '灌草'], ['#b9bdb4', '崖石'], ['#3d5c48', '可行走边界']]
for (const [index, [color, label]] of legend.entries()) {
  const x = 40 + index * 130
  parts.push(`<rect x="${x}" y="${HEIGHT - 40}" width="14" height="14" fill="${color}"/>`)
  parts.push(`<text x="${x + 22}" y="${HEIGHT - 28}" fill="#7d8f80" font-size="13">${label}</text>`)
}
parts.push('</svg>')

writeFileSync('docs/design/maps/valley-generated-preview.svg', parts.join('\n'))
console.log('wrote docs/design/maps/valley-generated-preview.svg')
