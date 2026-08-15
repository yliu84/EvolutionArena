import type { GameObjects, Scene } from 'phaser'
import { createSeededRandom, hashSeed } from './evolution'
import type { RunMap } from './run-map'
import { GROUND_DEPTH, PROP_ORIGIN, fillIsoDiamond, worldDepth } from './iso'
import {
  BIOMES,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  type BiomeDefinition,
  type BiomeId,
} from './world'

export const WORLD_PROP_TEXTURES = [
  'prop-tree',
  'prop-stump',
  'prop-fern',
  'prop-pool',
  'prop-reed',
  'prop-mushroom',
  'prop-pillar',
  'prop-rubble',
  'prop-ember',
] as const

export interface WorldPropStamp {
  texture: (typeof WORLD_PROP_TEXTURES)[number]
  x: number
  y: number
  scale: number
  flipX: boolean
  alpha: number
}

export interface WorldArtOptions {
  excludePropsInside?: { x: number; y: number; width: number; height: number }
}

function isInsideRect(x: number, y: number, rect: NonNullable<WorldArtOptions['excludePropsInside']>) {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height
}

function shade(color: number, factor: number) {
  const r = Math.max(0, Math.min(255, Math.round(((color >> 16) & 0xff) * factor)))
  const g = Math.max(0, Math.min(255, Math.round(((color >> 8) & 0xff) * factor)))
  const b = Math.max(0, Math.min(255, Math.round((color & 0xff) * factor)))
  return (r << 16) | (g << 8) | b
}

export function planBiomeProps(biome: BiomeDefinition, random: () => number): WorldPropStamp[] {
  const recipes: Record<BiomeId, readonly { texture: WorldPropStamp['texture']; count: number; scale: [number, number] }[]> = {
    gloamwood: [
      { texture: 'prop-tree', count: 48, scale: [0.85, 1.35] },
      { texture: 'prop-stump', count: 12, scale: [0.8, 1.1] },
      { texture: 'prop-fern', count: 22, scale: [0.75, 1.2] },
    ],
    rotfen: [
      { texture: 'prop-pool', count: 22, scale: [0.9, 1.4] },
      { texture: 'prop-reed', count: 28, scale: [0.85, 1.3] },
      { texture: 'prop-mushroom', count: 16, scale: [0.8, 1.25] },
    ],
    'ashen-ruins': [
      { texture: 'prop-pillar', count: 20, scale: [0.85, 1.25] },
      { texture: 'prop-rubble', count: 24, scale: [0.8, 1.3] },
      { texture: 'prop-ember', count: 28, scale: [0.7, 1.1] },
    ],
  }

  const stamps: WorldPropStamp[] = []
  for (const recipe of recipes[biome.id]) {
    for (let index = 0; index < recipe.count; index += 1) {
      stamps.push({
        texture: recipe.texture,
        x: biome.x + 70 + random() * (biome.width - 140),
        y: 90 + random() * (WORLD_HEIGHT - 180),
        scale: recipe.scale[0] + random() * (recipe.scale[1] - recipe.scale[0]),
        flipX: random() > 0.5,
        alpha: 0.82 + random() * 0.18,
      })
    }
  }
  return stamps.sort((left, right) => left.y - right.y)
}

export function createWorldPropTextures(g: GameObjects.Graphics) {
  paintGroundTile(g, 'gloamwood', 0x143528, 0x2a5a3c)
  paintGroundTile(g, 'rotfen', 0x242c1c, 0x4a5230)
  paintGroundTile(g, 'ashen-ruins', 0x2c1c1c, 0x6a3a30)

  g.clear()
  g.fillStyle(0x000000, 0.4).fillEllipse(64, 164, 88, 22)
  g.fillStyle(0x2a1810).fillTriangle(56, 70, 48, 160, 72, 160)
  g.fillStyle(0x3d2416).fillRect(54, 78, 20, 78)
  g.fillStyle(0x1a3d24).fillEllipse(64, 62, 108, 78)
  g.fillStyle(0x2f6a38).fillEllipse(58, 54, 86, 62)
  g.fillStyle(0x4a8f4a).fillEllipse(50, 46, 52, 38)
  g.fillStyle(0xa8d86a, 0.55).fillEllipse(42, 40, 24, 16)
  g.generateTexture('prop-tree', 128, 176).clear()

  g.fillStyle(0x000000, 0.32).fillEllipse(36, 58, 52, 16)
  g.fillStyle(0x4a2e18).fillRect(28, 22, 16, 32)
  g.fillStyle(0x2f1c10).fillEllipse(36, 22, 34, 14)
  g.fillStyle(0x2a5a34).fillEllipse(22, 28, 16, 10)
  g.generateTexture('prop-stump', 72, 68).clear()

  g.fillStyle(0x000000, 0.28).fillEllipse(36, 58, 48, 14)
  g.fillStyle(0x245a30).fillTriangle(36, 4, 8, 58, 36, 46)
  g.fillStyle(0x3d7a40).fillTriangle(36, 8, 64, 58, 36, 44)
  g.fillStyle(0x7cbc62, 0.8).fillTriangle(36, 16, 22, 48, 36, 42)
  g.generateTexture('prop-fern', 72, 68).clear()

  g.fillStyle(0x000000, 0.3).fillEllipse(64, 52, 108, 28)
  fillIsoDiamond(g, 64, 40, 58, 22, 0x163328, 1)
  fillIsoDiamond(g, 64, 38, 46, 16, 0x1f4a38, 1)
  fillIsoDiamond(g, 52, 34, 18, 7, 0x7ad0a0, 0.35)
  g.lineStyle(2, 0x8fe0b4, 0.4)
  g.beginPath()
  g.moveTo(64, 18)
  g.lineTo(6, 40)
  g.lineTo(64, 62)
  g.lineTo(122, 40)
  g.closePath()
  g.strokePath()
  g.generateTexture('prop-pool', 128, 72).clear()

  g.fillStyle(0x000000, 0.22).fillEllipse(22, 74, 36, 12)
  g.fillStyle(0x5a7a28).fillRect(18, 10, 6, 60)
  g.fillStyle(0x8fb34a).fillTriangle(22, 4, 8, 28, 22, 22)
  g.fillStyle(0x8fb34a).fillTriangle(22, 12, 38, 34, 22, 26)
  g.generateTexture('prop-reed', 44, 80).clear()

  g.fillStyle(0x000000, 0.28).fillEllipse(32, 56, 42, 14)
  g.fillStyle(0x5a2838).fillRect(28, 28, 8, 24)
  g.fillStyle(0xd46a8a).fillEllipse(32, 22, 28, 22)
  g.fillStyle(0xf0c8d8, 0.75).fillCircle(26, 16, 6)
  g.generateTexture('prop-mushroom', 64, 64).clear()

  g.fillStyle(0x000000, 0.38).fillEllipse(40, 118, 56, 18)
  g.fillStyle(0x3a2424).fillRect(18, 48, 36, 64)
  g.fillStyle(0x5a3838).fillRect(18, 48, 18, 64)
  fillIsoDiamond(g, 40, 42, 28, 14, 0x8a5858, 1)
  fillIsoDiamond(g, 40, 36, 22, 10, 0xb07a70, 1)
  g.fillStyle(0xff8a5c, 0.4).fillRect(24, 12, 10, 16)
  g.generateTexture('prop-pillar', 80, 128).clear()

  g.fillStyle(0x000000, 0.3).fillEllipse(40, 52, 60, 18)
  fillIsoDiamond(g, 28, 36, 22, 12, 0x5a3530, 1)
  fillIsoDiamond(g, 50, 30, 18, 10, 0x7a4a3c, 1)
  g.fillStyle(0x3a201c).fillRect(22, 38, 36, 12)
  g.generateTexture('prop-rubble', 80, 64).clear()

  g.fillStyle(0xff6b3a, 0.22).fillCircle(18, 18, 16)
  g.fillStyle(0xffc857).fillCircle(18, 18, 6)
  g.fillStyle(0xfff1ad, 0.95).fillCircle(16, 15, 3)
  g.generateTexture('prop-ember', 36, 36).clear()
}

function paintGroundTile(g: GameObjects.Graphics, biome: BiomeId, base: number, detail: number) {
  g.clear()
  g.fillStyle(base).fillRect(0, 0, 192, 96)
  for (let row = -1; row < 6; row += 1) {
    for (let col = -1; col < 6; col += 1) {
      const cx = col * 64 + (row % 2 === 0 ? 0 : 32)
      const cy = row * 24 + 16
      fillIsoDiamond(g, cx, cy, 32, 16, shade(detail, 0.55 + ((col + row) % 3) * 0.12), 0.55)
      g.lineStyle(1, shade(detail, 1.15), 0.18)
      g.beginPath()
      g.moveTo(cx, cy - 16)
      g.lineTo(cx - 32, cy)
      g.lineTo(cx, cy + 16)
      g.lineTo(cx + 32, cy)
      g.closePath()
      g.strokePath()
    }
  }
  g.generateTexture(`ground-${biome}`, 192, 96).clear()
}

export function paintRunWorld(
  scene: Scene,
  runMap: RunMap,
  graphics: GameObjects.Graphics,
  options: WorldArtOptions = {},
) {
  scene.cameras.main.setBackgroundColor('#030908')
  graphics.setDepth(GROUND_DEPTH)
  const decorationRandom = createSeededRandom(hashSeed(`${runMap.seed}:decorations`))

  for (const biome of BIOMES) {
    paintBiomeGround(graphics, biome)
    scene.add.tileSprite(
      biome.x + biome.width / 2,
      WORLD_HEIGHT / 2,
      biome.width,
      WORLD_HEIGHT,
      `ground-${biome.id}`,
    ).setDepth(GROUND_DEPTH + 0.1).setAlpha(0.94)
    paintBiomeCliff(graphics, biome)
    for (const stamp of planBiomeProps(biome, decorationRandom)) {
      if (options.excludePropsInside && isInsideRect(stamp.x, stamp.y, options.excludePropsInside)) continue
      scene.add.image(stamp.x, stamp.y, stamp.texture)
        .setDepth(worldDepth(stamp.y))
        .setScale(stamp.scale)
        .setFlipX(stamp.flipX)
        .setAlpha(stamp.alpha)
        .setOrigin(PROP_ORIGIN.x, PROP_ORIGIN.y)
    }
  }

  paintHuntRoad(graphics, runMap)
  graphics.lineStyle(5, 0x5b6e5d, 0.42).strokeRect(24, 24, WORLD_WIDTH - 48, WORLD_HEIGHT - 48)
  paintBossPlatform(graphics, runMap.bossPosition.x, runMap.bossPosition.y)

  for (const biome of BIOMES) {
    scene.add.text(biome.x + biome.width / 2, 420, biome.name, {
      fontFamily: 'Arial, sans-serif', fontSize: '52px', color: '#b8cbbd', letterSpacing: 9,
    }).setOrigin(0.5).setAlpha(0.14).setDepth(GROUND_DEPTH + 0.2)
    scene.add.text(biome.x + biome.width / 2, 474, biome.subtitle, {
      fontFamily: 'Arial, sans-serif', fontSize: '16px', color: '#c1cfbf', letterSpacing: 4,
    }).setOrigin(0.5).setAlpha(0.22).setDepth(GROUND_DEPTH + 0.2)
  }
}

function paintBiomeGround(graphics: GameObjects.Graphics, biome: BiomeDefinition) {
  graphics.fillStyle(shade(biome.groundColor, 0.72)).fillRect(biome.x, 0, biome.width, WORLD_HEIGHT)
}

function paintBiomeCliff(graphics: GameObjects.Graphics, biome: BiomeDefinition) {
  const edgeX = biome.x + biome.width
  for (let y = 48; y < WORLD_HEIGHT; y += 28) {
    fillIsoDiamond(graphics, edgeX, y, 26, 14, shade(biome.detailColor, 0.42), 0.7)
    fillIsoDiamond(graphics, edgeX - 10, y + 10, 16, 8, shade(biome.groundColor, 0.55), 0.55)
  }
}

function paintHuntRoad(graphics: GameObjects.Graphics, runMap: RunMap) {
  graphics.lineStyle(96, 0x2a3324, 0.58)
  for (let index = 1; index < runMap.route.length; index += 1) {
    const from = runMap.route[index - 1]
    const to = runMap.route[index]
    graphics.lineBetween(from.x, from.y, to.x, to.y)
  }
  graphics.lineStyle(58, 0x3d4a32, 0.42)
  for (let index = 1; index < runMap.route.length; index += 1) {
    const from = runMap.route[index - 1]
    const to = runMap.route[index]
    graphics.lineBetween(from.x, from.y, to.x, to.y)
  }
  for (let index = 1; index < runMap.route.length; index += 1) {
    const from = runMap.route[index - 1]
    const to = runMap.route[index]
    const steps = 8
    for (let step = 0; step <= steps; step += 1) {
      const t = step / steps
      fillIsoDiamond(
        graphics,
        from.x + (to.x - from.x) * t,
        from.y + (to.y - from.y) * t,
        28,
        14,
        0x8a9a74,
        0.16,
      )
    }
  }
}

function paintBossPlatform(graphics: GameObjects.Graphics, x: number, y: number) {
  fillIsoDiamond(graphics, x, y, 460, 560, 0x120b12, 0.82)
  fillIsoDiamond(graphics, x, y + 12, 380, 460, 0x2a1424, 0.62)
  graphics.lineStyle(8, 0x7f315f, 0.55)
  graphics.beginPath()
  graphics.moveTo(x, y - 560)
  graphics.lineTo(x - 460, y)
  graphics.lineTo(x, y + 560)
  graphics.lineTo(x + 460, y)
  graphics.closePath()
  graphics.strokePath()
  graphics.lineStyle(3, 0xffb06a, 0.32)
  graphics.beginPath()
  graphics.moveTo(x, y - 500)
  graphics.lineTo(x - 400, y)
  graphics.lineTo(x, y + 500)
  graphics.lineTo(x + 400, y)
  graphics.closePath()
  graphics.strokePath()
  fillIsoDiamond(graphics, x, y + 36, 110, 42, 0x4a1c38, 0.78)
}
