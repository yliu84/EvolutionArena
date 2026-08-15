import Phaser from 'phaser'
import { QUALITY_SLICE, pointInsideQualityBlocker, qualitySlicePlayerRoadRatio, qualitySliceScale } from './quality-slice-layout'

export class QualitySliceScene extends Phaser.Scene {
  private playerBody!: Phaser.Physics.Arcade.Image
  private playerVisual!: Phaser.GameObjects.Sprite
  private playerShadow!: Phaser.GameObjects.Ellipse
  private blockers!: Phaser.Physics.Arcade.StaticGroup
  private debugGraphics!: Phaser.GameObjects.Graphics
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private keys!: Record<'W' | 'A' | 'S' | 'D' | 'C', Phaser.Input.Keyboard.Key>
  private moveTarget: Phaser.Math.Vector2 | null = null
  private collisionDebug = false
  private lastBlockedAt = 0
  private lastFootstepFrame = -1

  constructor() {
    super(QUALITY_SLICE.sceneKey)
  }

  preload() {
    this.load.image('quality-forest-arena', '/assets/quality-slice/forest-arena-v2.png')
    this.load.spritesheet('quality-juvenile-drake-walk', '/assets/quality-slice/juvenile-drake-walk-v2.png', {
      frameWidth: 543,
      frameHeight: 724,
    })
  }

  create() {
    const { width, height } = QUALITY_SLICE.world
    this.physics.world.setBounds(0, 0, width, height)
    this.cameras.main.setBounds(0, 0, width, height).setZoom(QUALITY_SLICE.cameraZoom).setBackgroundColor('#07100b')
    this.add.image(width / 2, height / 2, 'quality-forest-arena').setDisplaySize(width, height).setDepth(0)

    const marker = this.add.graphics()
    marker.fillStyle(0xffffff).fillRect(0, 0, 8, 8).generateTexture('quality-collision-marker', 8, 8).destroy()
    this.blockers = this.physics.add.staticGroup()
    this.debugGraphics = this.add.graphics().setDepth(90)
    for (const blocker of QUALITY_SLICE.blockers) {
      const body = this.blockers.create(blocker.x, blocker.y, 'quality-collision-marker') as Phaser.Physics.Arcade.Image
      body.setDisplaySize(blocker.width, blocker.height).setVisible(false).setData('blockerId', blocker.id).setData('kind', blocker.kind)
      ;(body.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject()
    }

    this.playerBody = this.physics.add.image(QUALITY_SLICE.spawn.x, QUALITY_SLICE.spawn.y, 'quality-collision-marker')
      .setCircle(QUALITY_SLICE.player.colliderRadius, 4 - QUALITY_SLICE.player.colliderRadius, 4 - QUALITY_SLICE.player.colliderRadius)
      .setAlpha(0)
      .setCollideWorldBounds(true)
    if (!this.anims.exists('quality-drake-walk')) {
      this.anims.create({
        key: 'quality-drake-walk',
        frames: this.anims.generateFrameNumbers('quality-juvenile-drake-walk', { start: 0, end: 3 }),
        frameRate: 9,
        repeat: -1,
      })
    }
    this.playerShadow = this.add.ellipse(QUALITY_SLICE.spawn.x, QUALITY_SLICE.spawn.y + 6, 92, 27, 0x020503, 0.58).setDepth(30)
    this.playerVisual = this.add.sprite(QUALITY_SLICE.spawn.x, QUALITY_SLICE.spawn.y, 'quality-juvenile-drake-walk', 0)
      .setOrigin(0.5, QUALITY_SLICE.player.groundOriginY)
      .setDisplaySize(QUALITY_SLICE.player.displayWidth, QUALITY_SLICE.player.frameDisplayHeight)
      .setDepth(31)
    this.physics.add.collider(this.playerBody, this.blockers, () => {
      this.moveTarget = null
      this.lastBlockedAt = this.time.now
    })

    this.cursors = this.input.keyboard!.createCursorKeys()
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,C') as typeof this.keys
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const point = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2
      if (QUALITY_SLICE.blockers.some((blocker) => pointInsideQualityBlocker(point.x, point.y, blocker))) {
        this.lastBlockedAt = this.time.now
        this.moveTarget = null
        return
      }
      this.moveTarget = new Phaser.Math.Vector2(point.x, point.y)
    })
    this.cameras.main.startFollow(this.playerBody, true, 0.09, 0.09)
    this.cameras.main.centerOn(this.playerBody.x, this.playerBody.y)
    this.renderDebug()
  }

  update(time: number) {
    if (Phaser.Input.Keyboard.JustDown(this.keys.C)) {
      this.collisionDebug = !this.collisionDebug
      this.renderDebug()
    }
    const horizontal = Number(this.cursors.right.isDown || this.keys.D.isDown) - Number(this.cursors.left.isDown || this.keys.A.isDown)
    const vertical = Number(this.cursors.down.isDown || this.keys.S.isDown) - Number(this.cursors.up.isDown || this.keys.W.isDown)
    const velocity = new Phaser.Math.Vector2(horizontal, vertical)
    if (velocity.lengthSq() > 0) {
      velocity.normalize().scale(250)
      this.moveTarget = null
      this.playerBody.setVelocity(velocity.x, velocity.y)
    } else if (this.moveTarget) {
      const distance = Phaser.Math.Distance.Between(this.playerBody.x, this.playerBody.y, this.moveTarget.x, this.moveTarget.y)
      if (distance <= 18) {
        this.playerBody.setVelocity(0)
        this.moveTarget = null
      } else {
        this.physics.moveTo(this.playerBody, this.moveTarget.x, this.moveTarget.y, 250)
      }
    } else {
      this.playerBody.setVelocity(0)
    }

    const speed = this.playerBody.body?.velocity.length() ?? 0
    const moving = speed > 20
    if (moving && !this.playerVisual.anims.isPlaying) this.playerVisual.play('quality-drake-walk')
    if (!moving && this.playerVisual.anims.isPlaying) {
      this.playerVisual.stop()
      this.playerVisual.setFrame(0)
      this.lastFootstepFrame = -1
    }
    if (Math.abs(this.playerBody.body?.velocity.x ?? 0) > 10) this.playerVisual.setFlipX((this.playerBody.body?.velocity.x ?? 0) < 0)
    const stridePhase = moving ? Math.sin(time / 112) : Math.sin(time / 520)
    const sideScale = moving ? 1 + stridePhase * 0.018 : 1 + stridePhase * 0.008
    const liftScale = moving ? 1 - stridePhase * 0.012 : 1 - stridePhase * 0.006
    this.playerVisual.setPosition(
      this.playerBody.x,
      this.playerBody.y + QUALITY_SLICE.player.groundOffsetY,
    ).setScale(
      QUALITY_SLICE.player.displayWidth / this.playerVisual.width * sideScale,
      QUALITY_SLICE.player.frameDisplayHeight / this.playerVisual.height * liftScale,
    ).setDepth(31 + this.playerBody.y / 1000)
    const contactCompression = moving ? Math.abs(stridePhase) * 0.06 : 0
    this.playerShadow.setPosition(this.playerBody.x, this.playerBody.y + 6).setScale(
      1 + speed / 1800 + contactCompression,
      1 - speed / 2600 - contactCompression * 0.45,
    ).setDepth(30 + this.playerBody.y / 1000)

    const frameIndex = this.playerVisual.anims.currentFrame?.index ?? -1
    if (moving && frameIndex !== this.lastFootstepFrame) {
      if (frameIndex === 1 || frameIndex === 3) this.spawnFootstepDust()
      this.lastFootstepFrame = frameIndex
    }
  }

  toggleCollisionDebug() {
    this.collisionDebug = !this.collisionDebug
    this.renderDebug()
  }

  private spawnFootstepDust() {
    const direction = new Phaser.Math.Vector2(
      this.playerBody.body?.velocity.x ?? 0,
      this.playerBody.body?.velocity.y ?? 0,
    ).normalize()
    const dust = this.add.ellipse(
      this.playerBody.x - direction.x * 20,
      this.playerBody.y + 7 - direction.y * 9,
      24,
      8,
      0xc4a678,
      0.22,
    ).setDepth(29.8 + this.playerBody.y / 1000)
    this.tweens.add({
      targets: dust,
      alpha: 0,
      scaleX: 1.8,
      scaleY: 1.35,
      x: dust.x - direction.x * 8,
      y: dust.y - 3,
      duration: 230,
      ease: 'Quad.Out',
      onComplete: () => dust.destroy(),
    })
  }

  private renderDebug() {
    this.debugGraphics.clear()
    if (!this.collisionDebug) return
    const colors = { cliff: 0xffa85a, forest: 0x63df8f, water: 0x65cfff }
    for (const blocker of QUALITY_SLICE.blockers) {
      this.debugGraphics.fillStyle(colors[blocker.kind], 0.2).fillRect(
        blocker.x - blocker.width / 2,
        blocker.y - blocker.height / 2,
        blocker.width,
        blocker.height,
      )
      this.debugGraphics.lineStyle(4, colors[blocker.kind], 0.85).strokeRect(
        blocker.x - blocker.width / 2,
        blocker.y - blocker.height / 2,
        blocker.width,
        blocker.height,
      )
    }
  }

  getDebugState() {
    const scale = qualitySliceScale()
    return {
      qualitySlice: {
        world: { ...QUALITY_SLICE.world },
        source: { ...QUALITY_SLICE.source },
        sourceUpscale: { x: scale.x, y: scale.y },
        player: {
          x: Math.round(this.playerBody.x), y: Math.round(this.playerBody.y),
          displayWidth: QUALITY_SLICE.player.displayWidth,
          frameDisplayHeight: QUALITY_SLICE.player.frameDisplayHeight,
          visualHeight: QUALITY_SLICE.player.visualHeight,
          screenHeightPercent: Math.round(QUALITY_SLICE.player.visualHeight / this.scale.gameSize.height * 1000) / 10,
          speed: Math.round(this.playerBody.body?.velocity.length() ?? 0),
          grounded: true,
          animation: this.playerVisual.anims.isPlaying ? this.playerVisual.anims.currentAnim?.key : 'idle-contact',
          animationFrame: this.playerVisual.frame.name,
        },
        proportions: {
          roadMinimumWidth: QUALITY_SLICE.roadMinimumWidth,
          playersAcrossRoad: Math.round(qualitySlicePlayerRoadRatio() * 10) / 10,
        },
        collision: {
          blockerCount: QUALITY_SLICE.blockers.length,
          visible: this.collisionDebug,
          lastBlockedAgoMs: this.lastBlockedAt > 0 ? Math.round(this.time.now - this.lastBlockedAt) : null,
        },
        fps: Math.round(this.game.loop.actualFps),
      },
    }
  }
}
