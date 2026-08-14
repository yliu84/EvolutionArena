import type { GameObjects } from 'phaser'
import type { GeneFamily } from './evolution'
import {
  MONSTERS,
  PROCEDURAL_MONSTER_VISUALS,
  type MonsterType,
  type MonsterVisual,
  type ProceduralMonsterType,
} from './monsters'
import type { StarterVariant } from './starter-variants'

const UNIT = 96
const CX = 48
const FOOT = 86

function shade(color: number, factor: number) {
  const r = Math.max(0, Math.min(255, Math.round(((color >> 16) & 0xff) * factor)))
  const g = Math.max(0, Math.min(255, Math.round(((color >> 8) & 0xff) * factor)))
  const b = Math.max(0, Math.min(255, Math.round((color & 0xff) * factor)))
  return (r << 16) | (g << 8) | b
}

function drawShadow(g: GameObjects.Graphics, cx = CX, cy = FOOT, rx = 54, ry = 16) {
  g.fillStyle(0x000000, 0.42).fillEllipse(cx, cy, rx, ry)
}

function volumeEllipse(
  g: GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  primary: number,
  secondary: number,
) {
  g.fillStyle(secondary).fillEllipse(x + 4, y + 5, w * 0.92, h * 0.9)
  g.fillStyle(primary).fillEllipse(x, y, w, h)
  g.fillStyle(0xffffff, 0.24).fillEllipse(x - w * 0.18, y - h * 0.22, w * 0.34, h * 0.28)
}

function volumeCircle(
  g: GameObjects.Graphics,
  x: number,
  y: number,
  r: number,
  primary: number,
  secondary: number,
) {
  g.fillStyle(secondary).fillCircle(x + 3, y + 3, r * 0.92)
  g.fillStyle(primary).fillCircle(x, y, r)
  g.fillStyle(0xffffff, 0.28).fillCircle(x - r * 0.32, y - r * 0.34, r * 0.28)
}

export function paintPlayerTexture(g: GameObjects.Graphics, starter: StarterVariant) {
  g.clear()
  drawShadow(g)
  g.fillStyle(shade(starter.secondaryColor, 0.7)).fillEllipse(CX + 4, 62, 30, 36)
  volumeEllipse(g, CX, 54, 36, 46, starter.primaryColor, starter.secondaryColor)
  volumeCircle(g, CX, 28, 13, starter.secondaryColor, shade(starter.secondaryColor, 0.55))
  g.fillStyle(0xfff6d2, 0.7).fillCircle(42, 24, 4)
  if (starter.id === 'claw-hunter') {
    g.fillStyle(starter.primaryColor).fillTriangle(58, 36, 90, 28, 62, 48)
    g.fillStyle(starter.primaryColor).fillTriangle(58, 52, 88, 58, 60, 64)
    g.fillStyle(0xffe39a).fillTriangle(78, 30, 90, 28, 80, 38)
  } else if (starter.id === 'rift-larva') {
    g.lineStyle(4, starter.primaryColor, 0.9).strokeEllipse(CX, 50, 42, 50)
    g.fillStyle(starter.secondaryColor).fillRect(40, 44, 16, 14)
    g.fillStyle(0xe0b0ff, 0.7).fillCircle(CX, 48, 6)
  } else {
    g.fillStyle(starter.secondaryColor).fillTriangle(56, 22, 88, 46, 54, 42)
    g.fillStyle(starter.primaryColor, 0.7).fillTriangle(36, 58, 18, 78, 40, 72)
    g.fillStyle(starter.primaryColor, 0.7).fillTriangle(60, 58, 78, 78, 56, 72)
  }
  g.lineStyle(2, 0xe7ffdc, 0.55).strokeEllipse(CX, 54, 36, 46)
  g.generateTexture('player', UNIT, UNIT).clear()
}

export function paintNamedMonsterTexture(
  g: GameObjects.Graphics,
  type: Exclude<MonsterType, ProceduralMonsterType>,
) {
  const visual: MonsterVisual = {
    shape: type === 'pouncer' ? 'mantis'
      : type === 'razorwing' ? 'locust'
      : type === 'shellback' ? 'beetle'
      : type === 'bloodleech' ? 'tick'
      : type === 'spitter' ? 'wasp'
      : 'larva',
    primary: type === 'pouncer' ? 0xff6b5f
      : type === 'razorwing' ? 0x7fe6b6
      : type === 'shellback' ? 0x65a9ff
      : type === 'bloodleech' ? 0xb7324e
      : type === 'spitter' ? 0xc887ff
      : 0xf29b55,
    secondary: type === 'pouncer' ? 0x7c2631
      : type === 'razorwing' ? 0x276f58
      : type === 'shellback' ? 0x1d4e78
      : type === 'bloodleech' ? 0x5b162b
      : type === 'spitter' ? 0x4d2268
      : 0x321346,
    accent: type === 'pouncer' ? 0xffc2b8
      : type === 'razorwing' ? 0xc2ffe2
      : type === 'shellback' ? 0xb9dbff
      : type === 'bloodleech' ? 0xff8fa5
      : type === 'spitter' ? 0xe7c2ff
      : 0xffd8a8,
  }
  paintMonsterVisual(g, visual, MONSTERS[type].gene)
  g.generateTexture(MONSTERS[type].texture, UNIT, UNIT).clear()
}

export function paintProceduralMonsterTexture(g: GameObjects.Graphics, type: ProceduralMonsterType) {
  paintMonsterVisual(g, PROCEDURAL_MONSTER_VISUALS[type], MONSTERS[type].gene)
  paintProceduralExtras(g, type, PROCEDURAL_MONSTER_VISUALS[type])
  g.generateTexture(MONSTERS[type].texture, UNIT, UNIT).clear()
}

export function paintAllMonsterTextures(g: GameObjects.Graphics) {
  paintNamedMonsterTexture(g, 'pouncer')
  paintNamedMonsterTexture(g, 'razorwing')
  paintNamedMonsterTexture(g, 'shellback')
  paintNamedMonsterTexture(g, 'bloodleech')
  paintNamedMonsterTexture(g, 'spitter')
  paintNamedMonsterTexture(g, 'riftweaver')
  for (const type of Object.keys(PROCEDURAL_MONSTER_VISUALS) as ProceduralMonsterType[]) {
    paintProceduralMonsterTexture(g, type)
  }
}

export function paintMonsterVisual(
  g: GameObjects.Graphics,
  visual: MonsterVisual,
  gene: GeneFamily,
) {
  const { primary, secondary, accent } = visual
  g.clear()
  drawShadow(g)

  if (visual.shape === 'mantis') {
    g.fillStyle(secondary).fillTriangle(28, 72, 8, 88, 34, 78)
    g.fillStyle(secondary).fillTriangle(62, 72, 88, 88, 58, 78)
    volumeEllipse(g, CX, 52, 26, 44, primary, secondary)
    volumeCircle(g, CX, 26, 11, secondary, shade(secondary, 0.6))
    g.fillStyle(accent).fillTriangle(30, 36, 4, 10, 26, 48)
    g.fillStyle(accent).fillTriangle(66, 36, 92, 10, 70, 48)
  } else if (visual.shape === 'beetle') {
    g.fillStyle(secondary).fillRect(28, 70, 10, 14).fillRect(58, 70, 10, 14)
    volumeEllipse(g, CX, 50, 58, 48, primary, secondary)
    volumeCircle(g, CX, 24, 12, secondary, shade(secondary, 0.55))
    g.lineStyle(4, accent, 0.9).lineBetween(CX, 26, CX, 72)
    g.lineStyle(2, accent, 0.45).strokeEllipse(CX, 50, 58, 48)
  } else if (visual.shape === 'ant') {
    volumeCircle(g, 22, 58, 11, primary, secondary)
    volumeCircle(g, CX, 50, 13, primary, secondary)
    volumeCircle(g, 72, 42, 10, secondary, shade(secondary, 0.6))
    g.lineStyle(3, accent, 0.85).lineBetween(76, 32, 88, 16).lineBetween(68, 32, 56, 14)
    g.fillStyle(secondary).fillRect(30, 62, 4, 18).fillRect(50, 64, 4, 18)
  } else if (visual.shape === 'scorpion') {
    volumeEllipse(g, 42, 56, 48, 28, primary, secondary)
    volumeCircle(g, 20, 52, 11, secondary, shade(secondary, 0.6))
    g.fillStyle(accent).fillTriangle(64, 40, 88, 8, 72, 48)
    g.fillStyle(secondary).fillTriangle(70, 22, 86, 4, 78, 28)
    g.lineStyle(5, secondary, 0.9).lineBetween(28, 68, 10, 84).lineBetween(52, 70, 70, 86)
  } else if (visual.shape === 'wasp') {
    g.fillStyle(accent, 0.4).fillEllipse(24, 40, 30, 36).fillEllipse(72, 40, 30, 36)
    volumeEllipse(g, CX, 52, 22, 42, primary, secondary)
    volumeCircle(g, CX, 24, 9, secondary, shade(secondary, 0.55))
    g.lineStyle(3, secondary, 0.9).lineBetween(38, 40, 58, 62).lineBetween(38, 62, 58, 40)
  } else if (visual.shape === 'moth') {
    g.fillStyle(primary, 0.88).fillEllipse(22, 46, 40, 52).fillEllipse(74, 46, 40, 52)
    g.fillStyle(accent, 0.45).fillCircle(20, 34, 8).fillCircle(76, 34, 8)
    volumeEllipse(g, CX, 52, 18, 40, secondary, shade(secondary, 0.6))
  } else if (visual.shape === 'mosquito') {
    volumeEllipse(g, 42, 52, 18, 40, primary, secondary)
    g.fillStyle(accent).fillTriangle(52, 28, 92, 16, 56, 38)
    volumeCircle(g, 42, 24, 8, secondary, shade(secondary, 0.55))
    g.lineStyle(2, accent, 0.7).lineBetween(32, 26, 14, 10).lineBetween(52, 26, 70, 10)
    g.fillStyle(secondary).fillRect(38, 68, 3, 16).fillRect(48, 68, 3, 16)
  } else if (visual.shape === 'centipede') {
    for (let index = 0; index < 6; index += 1) {
      const x = 16 + index * 13
      const y = 58 - index * 3
      volumeCircle(g, x, y, 9, index % 2 === 0 ? primary : secondary, shade(secondary, 0.7))
      g.lineStyle(2, accent, 0.7).lineBetween(x, y + 8, x - 4, y + 22)
    }
    g.fillStyle(accent).fillCircle(86, 40, 5)
  } else if (visual.shape === 'locust') {
    g.fillStyle(accent, 0.42).fillTriangle(CX, 34, 8, 68, 34, 60).fillTriangle(CX, 34, 88, 68, 62, 60)
    volumeEllipse(g, CX, 48, 28, 38, primary, secondary)
    volumeCircle(g, CX, 24, 10, secondary, shade(secondary, 0.55))
    g.fillStyle(secondary).fillTriangle(28, 62, 10, 84, 34, 72).fillTriangle(68, 62, 86, 84, 62, 72)
  } else if (visual.shape === 'dragonfly') {
    g.fillStyle(accent, 0.42).fillEllipse(22, 38, 40, 18).fillEllipse(74, 38, 40, 18)
    g.fillStyle(accent, 0.32).fillEllipse(22, 54, 34, 14).fillEllipse(74, 54, 34, 14)
    volumeEllipse(g, CX, 48, 14, 52, primary, secondary)
    volumeCircle(g, CX, 20, 7, secondary, shade(secondary, 0.55))
  } else if (visual.shape === 'spider') {
    g.lineStyle(4, accent, 0.8)
    for (const offset of [-20, -8, 8, 20]) {
      g.lineBetween(34, 48 + offset / 4, 6, 56 + offset)
      g.lineBetween(62, 48 + offset / 4, 90, 56 + offset)
    }
    volumeCircle(g, CX, 54, 16, primary, secondary)
    volumeCircle(g, CX, 32, 11, primary, shade(secondary, 0.7))
    g.fillStyle(secondary).fillCircle(42, 28, 3).fillCircle(54, 28, 3)
  } else if (visual.shape === 'tick') {
    volumeEllipse(g, CX, 52, 44, 48, primary, secondary)
    volumeCircle(g, CX, 26, 10, secondary, shade(secondary, 0.55))
    g.lineStyle(4, accent, 0.85).lineBetween(28, 64, 8, 80).lineBetween(68, 64, 88, 80)
  } else if (visual.shape === 'cicada') {
    g.fillStyle(accent, 0.55).fillEllipse(24, 50, 32, 46).fillEllipse(72, 50, 32, 46)
    volumeEllipse(g, CX, 50, 20, 48, primary, secondary)
    volumeCircle(g, CX, 22, 10, secondary, shade(secondary, 0.55))
  } else {
    for (let index = 0; index < 5; index += 1) {
      volumeCircle(
        g,
        20 + index * 14,
        56 - index * 2,
        10,
        index % 2 === 0 ? primary : secondary,
        shade(secondary, 0.7),
      )
    }
    g.fillStyle(accent).fillCircle(86, 44, 5)
  }

  if (gene === 'fang') {
    g.fillStyle(accent).fillTriangle(38, 28, 28, 8, 44, 22).fillTriangle(58, 28, 68, 8, 52, 22)
  } else if (gene === 'carapace') {
    g.lineStyle(5, accent, 0.72).strokeEllipse(CX, 50, 62, 52)
  } else if (gene === 'rift') {
    g.fillStyle(accent, 0.9).fillCircle(CX, 44, 6)
    g.lineStyle(2, accent, 0.85).strokeCircle(CX, 44, 14)
  } else if (gene === 'venom') {
    g.fillStyle(accent, 0.95).fillTriangle(CX, 72, 40, 86, 56, 86)
  }

  g.fillStyle(0xffffff, 0.28).fillCircle(34, 30, 5)
}

function paintProceduralExtras(
  g: GameObjects.Graphics,
  type: ProceduralMonsterType,
  visual: MonsterVisual,
) {
  if (type === 'stagbeetle') {
    g.fillStyle(visual.accent).fillTriangle(36, 22, 18, 4, 44, 18)
    g.fillStyle(visual.accent).fillTriangle(60, 22, 78, 4, 52, 18)
  } else if (type === 'hornbeetle') {
    g.fillStyle(visual.accent).fillTriangle(CX, 8, 40, 28, 56, 28)
  } else if (type === 'bombardier') {
    g.fillStyle(visual.accent, 0.55).fillCircle(72, 70, 10).fillCircle(82, 78, 6)
  } else if (type === 'dungbeetle') {
    g.fillStyle(visual.secondary).fillCircle(18, 70, 14)
    g.fillStyle(visual.accent, 0.45).fillCircle(14, 64, 5)
  } else if (type === 'fireant') {
    g.fillStyle(0xffcf66, 0.8).fillCircle(22, 58, 6)
  } else if (type === 'glowworm') {
    g.fillStyle(visual.accent, 0.55).fillEllipse(CX, 52, 70, 28)
  }
}

export function paintBossTexture(g: GameObjects.Graphics) {
  g.clear()
  g.fillStyle(0x000000, 0.45).fillEllipse(80, 148, 120, 28)
  g.fillStyle(0x2a101f).fillTriangle(80, 40, 28, 140, 132, 140)
  g.fillStyle(0x3b1630).fillEllipse(80, 96, 108, 86)
  g.fillStyle(0x7f315f).fillTriangle(80, 8, 48, 64, 112, 64)
  g.fillStyle(0x7f315f).fillTriangle(32, 52, 4, 108, 48, 96)
  g.fillStyle(0x7f315f).fillTriangle(128, 52, 156, 108, 112, 96)
  g.fillStyle(0xd85e88).fillCircle(80, 88, 30)
  g.fillStyle(0x170914).fillCircle(80, 88, 14)
  g.fillStyle(0xffa0bd, 0.4).fillCircle(64, 74, 10)
  g.lineStyle(5, 0xffa0bd, 0.9).strokeEllipse(80, 96, 108, 86)
  g.lineStyle(4, 0xffd36e, 0.8).strokeCircle(80, 88, 40)
  g.generateTexture('boss-rift-warden', 160, 160).clear()
}

export function paintCombatProjectiles(g: GameObjects.Graphics) {
  g.clear()
  g.fillStyle(0x000000, 0.28).fillEllipse(18, 28, 28, 10)
  g.fillStyle(0xd7fff1).fillTriangle(4, 16, 36, 16, 20, 2)
  g.fillStyle(0x9effcf).fillRect(12, 12, 16, 20)
  g.fillStyle(0xffffff, 0.9).fillTriangle(16, 10, 24, 10, 20, 4)
  g.generateTexture('bullet', 40, 36).clear()

  g.fillStyle(0xe8c4ff, 0.35).fillCircle(16, 16, 15)
  g.fillStyle(0xe8c4ff).fillCircle(16, 16, 9)
  g.fillStyle(0x7f3aad).fillCircle(16, 16, 4)
  g.lineStyle(3, 0xf1d8ff, 0.9).strokeCircle(16, 16, 11)
  g.generateTexture('enemy-projectile', 32, 32).clear()

  g.fillStyle(0xfff1ad, 0.35).fillCircle(20, 20, 18)
  g.fillStyle(0xfff1ad, 0.95).fillCircle(20, 20, 8)
  g.fillStyle(0xffffff, 0.98).fillCircle(20, 20, 3)
  g.lineStyle(3, 0xffe39a, 0.9).lineBetween(20, 2, 20, 38).lineBetween(2, 20, 38, 20)
  g.lineStyle(2, 0xffe39a, 0.55).lineBetween(7, 7, 33, 33).lineBetween(33, 7, 7, 33)
  g.generateTexture('fx-hit', 40, 40).clear()
}

export function paintWorldObjectTextures(g: GameObjects.Graphics) {
  g.clear()
  g.fillStyle(0x000000, 0.34).fillEllipse(44, 78, 68, 18)
  g.fillStyle(0x3a2b19).fillRect(12, 36, 64, 38)
  g.fillStyle(0x17130d).fillRect(18, 42, 52, 26)
  g.fillStyle(0x80612f).fillTriangle(12, 36, 44, 16, 76, 36)
  g.lineStyle(4, 0x80612f, 0.95).strokeRect(12, 36, 64, 38)
  g.fillStyle(0x80612f).fillRect(38, 48, 12, 16)
  g.generateTexture('cache-sealed', 88, 88).clear()

  g.fillStyle(0x000000, 0.34).fillEllipse(44, 78, 68, 18)
  g.fillStyle(0x61451e).fillRect(12, 36, 64, 38)
  g.fillStyle(0x241c10).fillRect(18, 42, 52, 26)
  g.fillStyle(0xffc857).fillTriangle(12, 36, 44, 16, 76, 36)
  g.lineStyle(5, 0xffc857, 1).strokeRect(12, 36, 64, 38)
  g.fillStyle(0xffe59a).fillCircle(44, 50, 9)
  g.generateTexture('cache-ready', 88, 88).clear()

  g.fillStyle(0x000000, 0.28).fillEllipse(44, 78, 68, 18)
  g.fillStyle(0x2a2116).fillRect(12, 52, 64, 24)
  g.lineStyle(3, 0x8d7040, 0.8).strokeRect(12, 52, 64, 24)
  g.fillStyle(0xffd977, 0.75).fillTriangle(16, 50, 72, 50, 44, 18)
  g.generateTexture('cache-opened', 88, 88).clear()

  g.fillStyle(0x8cf2c0, 0.2).fillCircle(48, 48, 44)
  g.lineStyle(4, 0x8cf2c0, 0.75).strokeCircle(48, 48, 32)
  g.lineStyle(3, 0xffe39a, 0.8).strokeTriangle(48, 14, 18, 68, 78, 68)
  g.fillStyle(0xffe39a).fillCircle(48, 48, 7)
  g.generateTexture('world-event', 96, 96).clear()
}
