import Phaser from 'phaser'
import { MAP_LAB_V2, type MapLabV2Stage } from './map-lab-v2-config'

const CAMERA_SPEED = 460
const MIN_ZOOM = 0.55
const MAX_ZOOM = 1.65

export class MapLabV2Scene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private keys!: Record<'W' | 'A' | 'S' | 'D' | 'Q' | 'E', Phaser.Input.Keyboard.Key>
  private dragging = false
  private dragStart = { x: 0, y: 0, scrollX: 0, scrollY: 0 }
  private stage: MapLabV2Stage = MAP_LAB_V2.initialStage
  private stageImages = {} as Record<MapLabV2Stage, Phaser.GameObjects.Image>

  constructor() {
    super(MAP_LAB_V2.sceneKey)
  }

  preload() {
    for (const stage of Object.values(MAP_LAB_V2.stages)) {
      this.load.image(stage.assetKey, stage.assetPath)
    }
  }

  create() {
    this.cameras.main.setBackgroundColor('#050906')
    this.stageImages = {
      ground: this.add.image(0, 0, MAP_LAB_V2.stages.ground.assetKey).setOrigin(0).setDepth(0),
      elevation: this.add.image(0, 0, MAP_LAB_V2.stages.elevation.assetKey).setOrigin(0).setDepth(1),
      riverbanks: this.add.image(0, 0, MAP_LAB_V2.stages.riverbanks.assetKey).setOrigin(0).setDepth(2),
      trees: this.add.image(0, 0, MAP_LAB_V2.stages.trees.assetKey).setOrigin(0).setDepth(3),
      landmarks: this.add.image(0, 0, MAP_LAB_V2.stages.landmarks.assetKey).setOrigin(0).setDepth(4),
      atmosphere: this.add.image(0, 0, MAP_LAB_V2.stages.atmosphere.assetKey).setOrigin(0).setDepth(5),
    }
    this.setStage(MAP_LAB_V2.initialStage)

    const camera = this.cameras.main
    camera.setBounds(0, 0, MAP_LAB_V2.width, MAP_LAB_V2.height)
    camera.setZoom(0.76)
    camera.centerOn(MAP_LAB_V2.width / 2, MAP_LAB_V2.height / 2)

    this.cursors = this.input.keyboard!.createCursorKeys()
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,Q,E') as typeof this.keys
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.leftButtonDown()) return
      this.dragging = true
      this.dragStart = { x: pointer.x, y: pointer.y, scrollX: camera.scrollX, scrollY: camera.scrollY }
    })
    this.input.on('pointerup', () => { this.dragging = false })
    this.input.on('pointerupoutside', () => { this.dragging = false })
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _over: unknown, _deltaX: number, deltaY: number) => {
      camera.setZoom(Phaser.Math.Clamp(camera.zoom + (deltaY > 0 ? -0.08 : 0.08), MIN_ZOOM, MAX_ZOOM))
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
    if (x !== 0) camera.scrollX += x * step
    if (y !== 0) camera.scrollY += y * step
    if (this.keys.Q.isDown) camera.setZoom(Phaser.Math.Clamp(camera.zoom - 0.012, MIN_ZOOM, MAX_ZOOM))
    if (this.keys.E.isDown) camera.setZoom(Phaser.Math.Clamp(camera.zoom + 0.012, MIN_ZOOM, MAX_ZOOM))
  }

  setStage(stage: MapLabV2Stage) {
    this.stage = stage
    if (this.stageImages.ground) {
      for (const [stageId, image] of Object.entries(this.stageImages)) {
        image.setVisible(stageId === stage)
      }
    }
    document.querySelectorAll<HTMLButtonElement>('[data-maplab-stage]').forEach((button) => {
      const active = button.dataset.maplabStage === stage
      button.classList.toggle('is-active', active)
      button.setAttribute('aria-pressed', String(active))
    })
    const badge = document.querySelector<HTMLElement>('.prototype-badge')
    if (badge) {
      const labels: Record<MapLabV2Stage, string> = {
        ground: 'Map Lab V2 · 第一层 · 地面',
        elevation: 'Map Lab V2 · 第二层 · 高差',
        riverbanks: 'Map Lab V2 · 第三层 · 河岸',
        trees: 'Map Lab V2 · 第四层 · 树木',
        landmarks: 'Map Lab V2 · 第五层 · 地标',
        atmosphere: 'Map Lab V2 · 第六层 · 氛围',
      }
      badge.textContent = labels[stage]
    }
  }

  getDebugState() {
    return {
      mapLab: {
        version: MAP_LAB_V2.version,
        mapId: MAP_LAB_V2.mapId,
        element: this.stage,
        stageLabel: MAP_LAB_V2.stages[this.stage].label,
        language: MAP_LAB_V2.language,
        asset: MAP_LAB_V2.stages[this.stage].assetPath,
        availableStages: Object.keys(MAP_LAB_V2.stages),
        width: MAP_LAB_V2.width,
        height: MAP_LAB_V2.height,
        included: this.includedLayers(),
        excluded: this.excludedLayers(),
        zoom: Math.round(this.cameras.main.zoom * 100) / 100,
      },
    }
  }

  private includedLayers() {
    if (this.stage === 'ground') return ['ground', 'hunting-paths', 'river-corridor', 'elevation-footprints']
    if (this.stage === 'elevation') return ['ground', 'hunting-paths', 'river-corridor', 'raised-plateaus', 'cliff-faces']
    if (this.stage === 'riverbanks') return ['ground', 'hunting-paths', 'raised-plateaus', 'cliff-faces', 'muddy-banks', 'deep-water', 'shallow-fords']
    if (this.stage === 'trees') return ['ground', 'hunting-paths', 'raised-plateaus', 'cliff-faces', 'muddy-banks', 'deep-water', 'shallow-fords', 'tree-shadows', 'visible-trunks', 'volumetric-canopies']
    if (this.stage === 'landmarks') return ['ground', 'hunting-paths', 'raised-plateaus', 'cliff-faces', 'muddy-banks', 'deep-water', 'shallow-fords', 'trees', 'rock-clusters', 'primary-ruin', 'secondary-standing-stone']
    return ['ground', 'hunting-paths', 'raised-plateaus', 'cliff-faces', 'muddy-banks', 'deep-water', 'shallow-fords', 'trees', 'rock-clusters', 'primary-ruin', 'secondary-standing-stone', 'lowland-mist', 'cool-ambient-light', 'warm-dappled-light', 'edge-depth']
  }

  private excludedLayers() {
    if (this.stage === 'atmosphere') return ['monsters', 'fog-of-war', 'combat', 'skill-vfx']
    if (this.stage === 'landmarks') return ['monsters', 'fog-of-war', 'combat']
    if (this.stage === 'trees') return ['rocks', 'ruins', 'monsters', 'fog-of-war', 'combat']
    return ['trees', 'rocks', 'ruins', 'monsters', 'fog-of-war', 'combat']
  }
}
