import Phaser from 'phaser'
import {
  GLOAMWOOD_SPACE_LAYOUT,
  areaScaleFromPrevious,
  pointInsideSpaceZone,
  screenAreaCount,
  zoneById,
} from './gloamwood-space-layout'

const PLAYER_SPEED = 330
const FOLLOW_ZOOM = 0.88
const ARRIVAL_RADIUS = 18

export class GloamwoodSpaceLabScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Image
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private keys!: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>
  private moveTarget: Phaser.Math.Vector2 | null = null
  private rangeGraphics!: Phaser.GameObjects.Graphics
  private groundImage!: Phaser.GameObjects.Image
  private skeletonLayer!: Phaser.GameObjects.Container
  private overview = false
  private showRanges = true
  private showSkeleton = false
  private visitedZones = new Set<string>()

  constructor() {
    super(GLOAMWOOD_SPACE_LAYOUT.sceneKey)
  }

  preload() {
    this.load.image(GLOAMWOOD_SPACE_LAYOUT.groundAsset.key, GLOAMWOOD_SPACE_LAYOUT.groundAsset.path)
  }

  create() {
    this.createPlayerTexture()
    const { width, height } = GLOAMWOOD_SPACE_LAYOUT.world
    this.groundImage = this.add.image(0, 0, GLOAMWOOD_SPACE_LAYOUT.groundAsset.key)
      .setOrigin(0)
      .setDisplaySize(width, height)
      .setDepth(0)
    this.drawSpatialSkeleton()

    this.physics.world.setBounds(0, 0, width, height)
    this.cameras.main.setBounds(0, 0, width, height).setBackgroundColor('#07100c')

    this.player = this.physics.add.image(GLOAMWOOD_SPACE_LAYOUT.start.x, GLOAMWOOD_SPACE_LAYOUT.start.y, 'space-lab-player')
    this.player.setOrigin(0.5, 0.72).setCircle(24).setCollideWorldBounds(true).setDepth(30)
    this.player.setData('referenceHeight', GLOAMWOOD_SPACE_LAYOUT.playerReferenceHeight)

    this.rangeGraphics = this.add.graphics().setDepth(25)
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.keys = this.input.keyboard!.addKeys('W,A,S,D') as typeof this.keys
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.overview || !pointer.leftButtonDown()) return
      this.moveTarget = new Phaser.Math.Vector2(pointer.worldX, pointer.worldY)
    })

    this.setOverview(false)
    this.setSkeletonVisible(false)
    this.updateVisitedZone()
  }

  update() {
    const keyboardX = Number(this.cursors.right.isDown || this.keys.D.isDown) - Number(this.cursors.left.isDown || this.keys.A.isDown)
    const keyboardY = Number(this.cursors.down.isDown || this.keys.S.isDown) - Number(this.cursors.up.isDown || this.keys.W.isDown)

    if (keyboardX !== 0 || keyboardY !== 0) {
      const direction = new Phaser.Math.Vector2(keyboardX, keyboardY).normalize().scale(PLAYER_SPEED)
      this.player.setVelocity(direction.x, direction.y)
      this.moveTarget = null
    } else if (this.moveTarget) {
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.moveTarget.x, this.moveTarget.y)
      if (distance <= ARRIVAL_RADIUS) {
        this.player.setVelocity(0)
        this.moveTarget = null
      } else {
        this.physics.moveTo(this.player, this.moveTarget.x, this.moveTarget.y, PLAYER_SPEED)
      }
    } else {
      this.player.setVelocity(0)
    }

    this.updateRangeReference()
    this.updateVisitedZone()
  }

  setOverview(enabled: boolean) {
    this.overview = enabled
    const camera = this.cameras.main
    if (enabled) {
      const { width, height } = GLOAMWOOD_SPACE_LAYOUT.world
      const overviewZoom = Math.min(camera.width / width, camera.height / height) * 0.94
      camera.stopFollow().setZoom(overviewZoom).centerOn(width / 2, height / 2)
      this.player.setVelocity(0)
      this.moveTarget = null
    } else {
      camera.setZoom(FOLLOW_ZOOM).startFollow(this.player, true, 0.14, 0.14)
    }
    document.querySelector<HTMLButtonElement>('[data-space-action="overview"]')?.setAttribute('aria-pressed', String(enabled))
    document.querySelector<HTMLButtonElement>('[data-space-action="overview"]')?.classList.toggle('is-active', enabled)
  }

  toggleRanges() {
    this.showRanges = !this.showRanges
    this.rangeGraphics.setVisible(this.showRanges)
    const button = document.querySelector<HTMLButtonElement>('[data-space-action="ranges"]')
    button?.setAttribute('aria-pressed', String(this.showRanges))
    button?.classList.toggle('is-active', this.showRanges)
  }

  toggleSkeleton() {
    this.setSkeletonVisible(!this.showSkeleton)
  }

  getDebugState() {
    const camera = this.cameras.main
    const activeZone = GLOAMWOOD_SPACE_LAYOUT.zones.find((zone) => pointInsideSpaceZone(this.player.x, this.player.y, zone))
    return {
      spaceLab: {
        version: GLOAMWOOD_SPACE_LAYOUT.version,
        world: { ...GLOAMWOOD_SPACE_LAYOUT.world },
        previousSlice: { ...GLOAMWOOD_SPACE_LAYOUT.previousSlice },
        areaScale: Math.round(areaScaleFromPrevious() * 100) / 100,
        desktopScreenAreas: Math.round(screenAreaCount(1455, 818) * 100) / 100,
        player: {
          x: Math.round(this.player.x),
          y: Math.round(this.player.y),
          speed: Math.round(this.player.body?.velocity.length() ?? 0),
          moveTarget: this.moveTarget ? { x: Math.round(this.moveTarget.x), y: Math.round(this.moveTarget.y) } : null,
          referenceHeight: this.player.getData('referenceHeight'),
        },
        camera: {
          mode: this.overview ? 'overview' : 'follow',
          zoom: Math.round(camera.zoom * 100) / 100,
          width: Math.round(camera.worldView.width),
          height: Math.round(camera.worldView.height),
        },
        ranges: {
          visible: this.showRanges,
          ranged: GLOAMWOOD_SPACE_LAYOUT.rangedRange,
          magic: GLOAMWOOD_SPACE_LAYOUT.magicRange,
        },
        layer: this.showSkeleton ? 'spatial-skeleton' : 'painted-ground',
        groundAsset: GLOAMWOOD_SPACE_LAYOUT.groundAsset.path,
        included: this.showSkeleton
          ? ['four-clearings', 'five-corridors', 'river-corridor', 'scale-reference']
          : ['moss-ground', 'leaf-litter', 'broad-hunting-paths', 'river', 'shallow-crossings', 'forest-edge-ground'],
        excluded: ['trees', 'rocks', 'cliffs', 'ruins', 'monsters', 'fog', 'collision'],
        activeZone: activeZone?.id ?? null,
        visitedZones: [...this.visitedZones],
        zones: GLOAMWOOD_SPACE_LAYOUT.zones.map((zone) => ({ ...zone })),
        corridors: GLOAMWOOD_SPACE_LAYOUT.corridors.map((corridor) => ({ ...corridor })),
        fps: Math.round(this.game.loop.actualFps),
      },
    }
  }

  private createPlayerTexture() {
    const g = this.add.graphics()
    g.fillStyle(0x07110d, 0.5).fillEllipse(48, 72, 66, 24)
    g.fillStyle(0xb9ff8d, 1).fillCircle(48, 43, 25)
    g.fillStyle(0x315d3b, 1).fillTriangle(24, 48, 6, 65, 34, 60)
    g.fillStyle(0x315d3b, 1).fillTriangle(72, 48, 90, 65, 62, 60)
    g.lineStyle(4, 0xeaffd7, 0.9).strokeCircle(48, 43, 25)
    g.generateTexture('space-lab-player', 96, 96).destroy()
  }

  private drawSpatialSkeleton() {
    const { width, height } = GLOAMWOOD_SPACE_LAYOUT.world
    const skeletonObjects: Phaser.GameObjects.GameObject[] = []
    const g = this.add.graphics()
    skeletonObjects.push(g)
    g.fillStyle(0x07100c).fillRect(0, 0, width, height)

    for (let x = 200; x < width; x += 200) {
      g.lineStyle(x % 1000 === 0 ? 2 : 1, 0x20352b, x % 1000 === 0 ? 0.32 : 0.13)
      g.lineBetween(x, 0, x, height)
    }
    for (let y = 200; y < height; y += 200) {
      g.lineStyle(y % 1000 === 0 ? 2 : 1, 0x20352b, y % 1000 === 0 ? 0.32 : 0.13)
      g.lineBetween(0, y, width, y)
    }

    const river = [
      new Phaser.Math.Vector2(1980, 0), new Phaser.Math.Vector2(1840, 430),
      new Phaser.Math.Vector2(2050, 880), new Phaser.Math.Vector2(1940, 1320),
      new Phaser.Math.Vector2(2130, 1760), new Phaser.Math.Vector2(2040, 2200),
    ]
    g.lineStyle(250, 0x081b1c, 1).strokePoints(river, false, false)
    g.lineStyle(180, 0x123334, 1).strokePoints(river, false, false)
    g.lineStyle(5, 0x5e8580, 0.42).strokePoints(river, false, false)

    for (const corridor of GLOAMWOOD_SPACE_LAYOUT.corridors) {
      const from = zoneById(corridor.from)
      const to = zoneById(corridor.to)
      if (!from || !to) continue
      g.lineStyle(corridor.width + 48, 0x030805, 0.58).lineBetween(from.x + 18, from.y + 24, to.x + 18, to.y + 24)
      g.lineStyle(corridor.width, 0x293a27, 1).lineBetween(from.x, from.y, to.x, to.y)
      g.lineStyle(Math.max(12, corridor.width - 64), 0x4c4a30, 0.42).lineBetween(from.x, from.y, to.x, to.y)
      g.lineStyle(3, 0xd5b96a, 0.34).lineBetween(from.x, from.y, to.x, to.y)
    }

    for (const zone of GLOAMWOOD_SPACE_LAYOUT.zones) {
      const color = zone.kind === 'boss' ? 0x3c3026 : zone.kind === 'combat' ? 0x33432d : 0x2e4935
      g.fillStyle(0x020604, 0.7).fillEllipse(zone.x + 24, zone.y + 32, zone.width + 34, zone.height + 34)
      g.fillStyle(color, 1).fillEllipse(zone.x, zone.y, zone.width, zone.height)
      g.lineStyle(12, 0x6b7550, 0.45).strokeEllipse(zone.x, zone.y, zone.width, zone.height)
      g.lineStyle(3, zone.kind === 'boss' ? 0xd19b62 : 0xc7be78, 0.72).strokeEllipse(zone.x, zone.y, zone.width, zone.height)
      skeletonObjects.push(this.add.text(zone.x, zone.y - zone.height / 2 + 48, zone.name, {
        fontFamily: 'system-ui, sans-serif', fontSize: '28px', color: '#f0e7c5',
        stroke: '#07100c', strokeThickness: 6,
      }).setOrigin(0.5))
      skeletonObjects.push(this.add.text(zone.x, zone.y - zone.height / 2 + 84, `${zone.width} × ${zone.height} · ${zone.kind === 'boss' ? 'Boss战场' : zone.kind === 'combat' ? '主要战场' : '出生缓冲区'}`, {
        fontFamily: 'system-ui, sans-serif', fontSize: '17px', color: '#b8c7aa',
        stroke: '#07100c', strokeThickness: 4,
      }).setOrigin(0.5))
    }

    skeletonObjects.push(this.add.text(90, 80, '幽影林地 · 宽阔空间骨架', {
      fontFamily: 'system-ui, sans-serif', fontSize: '38px', color: '#f2e9c8',
      stroke: '#07100c', strokeThickness: 7,
    }))
    skeletonObjects.push(this.add.text(92, 132, '3600 × 2200 · 先验收移动、射程和战场尺度，暂不验收最终美术', {
      fontFamily: 'system-ui, sans-serif', fontSize: '20px', color: '#99b7a6',
      stroke: '#07100c', strokeThickness: 5,
    }))
    this.skeletonLayer = this.add.container(0, 0, skeletonObjects).setDepth(1)
  }

  private setSkeletonVisible(visible: boolean) {
    this.showSkeleton = visible
    this.skeletonLayer.setVisible(visible)
    this.groundImage.setVisible(!visible)
    const button = document.querySelector<HTMLButtonElement>('[data-space-action="layer"]')
    button?.setAttribute('aria-pressed', String(visible))
    button?.classList.toggle('is-active', visible)
    const badge = document.querySelector<HTMLElement>('.prototype-badge')
    if (badge) badge.textContent = visible ? 'Map Lab V3 · 空间骨架对照' : 'Map Lab V3 · 第一层 · 宽阔地面'
  }

  private updateRangeReference() {
    if (!this.showRanges) return
    this.rangeGraphics.clear()
    this.rangeGraphics.lineStyle(3, 0xffc857, 0.72).strokeCircle(this.player.x, this.player.y, GLOAMWOOD_SPACE_LAYOUT.rangedRange)
    this.rangeGraphics.lineStyle(3, 0x9c7bff, 0.68).strokeCircle(this.player.x, this.player.y, GLOAMWOOD_SPACE_LAYOUT.magicRange)
  }

  private updateVisitedZone() {
    for (const zone of GLOAMWOOD_SPACE_LAYOUT.zones) {
      if (pointInsideSpaceZone(this.player.x, this.player.y, zone)) this.visitedZones.add(zone.id)
    }
  }
}
