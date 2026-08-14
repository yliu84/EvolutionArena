import Phaser from 'phaser'
import { TERRAIN_TEXTURES, paintGloamwoodCanvas } from './terrain-art'
import { LANDSCAPE, createGloamwoodLandscape } from './terrain'
import { PROP_ORIGIN, UNIT_ORIGIN, worldDepth } from './iso'
import { paintPlayerTexture } from './creature-art'
import { STARTER_VARIANTS } from './starter-variants'
import {
  TREE_KINDS,
  WOODLAND_VIEW,
  findScaleReference,
  paintTreeCanvas,
  planGloamwoodTrees,
  treeStats,
} from './woodland-trees'

const CAMERA_SPEED = 420

export class MapLabScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private keys!: Record<'W' | 'A' | 'S' | 'D' | 'Q' | 'E', Phaser.Input.Keyboard.Key>
  private dragging = false
  private dragStart = { x: 0, y: 0, scrollX: 0, scrollY: 0 }
  private stats = { water: 0, foam: 0, mud: 0, dirt: 0, grass: 0 }
  private trees = { count: 0, kinds: { oak: 0, pine: 0, birch: 0, dead: 0 } }

  constructor() {
    super('map-lab')
  }

  preload() {
    this.load.image('tex-forest', TERRAIN_TEXTURES.forest)
    this.load.image('tex-dirt', TERRAIN_TEXTURES.dirt)
    this.load.image('tex-mud', TERRAIN_TEXTURES.mud)
    this.load.image('tex-grass', TERRAIN_TEXTURES.grass)
    this.load.image('tex-bark', TERRAIN_TEXTURES.bark)
  }

  create() {
    this.cameras.main.setBackgroundColor('#08110c')
    const tilt = WOODLAND_VIEW.groundTilt
    const painted = paintGloamwoodCanvas(LANDSCAPE.width, LANDSCAPE.height, {
      forest: this.textures.get('tex-forest').getSourceImage() as HTMLImageElement,
      dirt: this.textures.get('tex-dirt').getSourceImage() as HTMLImageElement,
      mud: this.textures.get('tex-mud').getSourceImage() as HTMLImageElement,
      grass: this.textures.get('tex-grass').getSourceImage() as HTMLImageElement,
    })
    this.textures.addCanvas('gloamwood-ground', painted.canvas)
    this.add.image(0, 0, 'gloamwood-ground').setOrigin(0).setDepth(0).setScale(1, tilt)

    const treeMaps = {
      bark: this.textures.get('tex-bark').getSourceImage() as HTMLImageElement,
      leaves: this.textures.get('tex-forest').getSourceImage() as HTMLImageElement,
    }
    for (const kind of TREE_KINDS) {
      const key = `wood-tree-${kind}`
      if (this.textures.exists(key)) this.textures.remove(key)
      this.textures.addCanvas(key, paintTreeCanvas(kind, treeMaps))
    }
    const field = createGloamwoodLandscape()
    const trees = planGloamwoodTrees(field)
    for (const tree of trees) {
      this.add.image(tree.x, tree.y * tilt, `wood-tree-${tree.kind}`)
        .setOrigin(PROP_ORIGIN.x, PROP_ORIGIN.y)
        .setScale(tree.scale)
        .setFlipX(tree.flipX)
        .setDepth(worldDepth(tree.y * tilt))
    }
    this.stats = painted.stats
    this.trees = treeStats(trees)

    const g = this.add.graphics().setVisible(false)
    paintPlayerTexture(g, STARTER_VARIANTS['claw-hunter'])
    g.destroy()
    const marker = findScaleReference(field)
    const markerY = marker.y * tilt
    this.add.image(marker.x, markerY, 'player')
      .setOrigin(UNIT_ORIGIN.x, UNIT_ORIGIN.y)
      .setDepth(worldDepth(markerY) + 0.4)
    this.add.text(marker.x, markerY + 10, '角色身高', {
      fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#f3ffe8',
      backgroundColor: '#08140ecc', padding: { x: 6, y: 3 },
    }).setOrigin(0.5, 0).setDepth(worldDepth(markerY) + 0.5)

    const worldHeight = LANDSCAPE.height * tilt
    this.cameras.main.setBounds(0, 0, LANDSCAPE.width, worldHeight)
    this.cameras.main.setZoom(0.85)
    this.cameras.main.centerOn(marker.x, markerY)

    this.add.text(24, 18, '地图工坊 · 第一张林地 · 树木', {
      fontFamily: 'Arial, sans-serif', fontSize: '18px', color: '#f3ffe8', fontStyle: 'bold',
      backgroundColor: '#08140ecc', padding: { x: 12, y: 8 },
    }).setScrollFactor(0).setDepth(100)

    this.add.text(24, 58, '约 70° 高机位，不是 90° 正上方。树是立着的广告牌：树皮圆柱光 + 一坨坨树冠。角色 96px，树大约 3–4 倍高。石头还没做。', {
      fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#c5d8be',
      backgroundColor: '#08140ecc', padding: { x: 12, y: 6 },
    }).setScrollFactor(0).setDepth(100)

    this.cursors = this.input.keyboard!.createCursorKeys()
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,Q,E') as typeof this.keys
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.leftButtonDown()) return
      this.dragging = true
      this.dragStart = {
        x: pointer.x,
        y: pointer.y,
        scrollX: this.cameras.main.scrollX,
        scrollY: this.cameras.main.scrollY,
      }
    })
    this.input.on('pointerup', () => {
      this.dragging = false
    })
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _over: unknown, _deltaX: number, deltaY: number) => {
      const next = Phaser.Math.Clamp(this.cameras.main.zoom + (deltaY > 0 ? -0.08 : 0.08), 0.45, 1.9)
      this.cameras.main.setZoom(next)
    })
  }

  update(_time: number, delta: number) {
    const camera = this.cameras.main
    if (this.dragging && this.input.activePointer.isDown) {
      const pointer = this.input.activePointer
      camera.setScroll(
        this.dragStart.scrollX - (pointer.x - this.dragStart.x) / camera.zoom,
        this.dragStart.scrollY - (pointer.y - this.dragStart.y) / camera.zoom,
      )
      return
    }
    const x = Number(this.cursors.right.isDown || this.keys.D.isDown) - Number(this.cursors.left.isDown || this.keys.A.isDown)
    const y = Number(this.cursors.down.isDown || this.keys.S.isDown) - Number(this.cursors.up.isDown || this.keys.W.isDown)
    const step = CAMERA_SPEED * (delta / 1000) / camera.zoom
    if (x !== 0 || y !== 0) camera.scrollX += x * step
    if (x !== 0 || y !== 0) camera.scrollY += y * step
    if (this.keys.Q.isDown) camera.setZoom(Phaser.Math.Clamp(camera.zoom - 0.012, 0.45, 1.9))
    if (this.keys.E.isDown) camera.setZoom(Phaser.Math.Clamp(camera.zoom + 0.012, 0.45, 1.9))
  }

  getDebugState() {
    return {
      mapLab: {
        mapId: 'gloamwood',
        element: 'trees',
        language: 'iso-billboard',
        groundTilt: WOODLAND_VIEW.groundTilt,
        playerHeight: WOODLAND_VIEW.playerHeight,
        width: LANDSCAPE.width,
        height: LANDSCAPE.height,
        materials: this.stats,
        trees: this.trees,
        zoom: Math.round(this.cameras.main.zoom * 100) / 100,
      },
    }
  }
}

export function isMapLabRequested(search = window.location.search) {
  return new URLSearchParams(search).get('maplab') === '1'
}
