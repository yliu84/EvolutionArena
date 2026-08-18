import * as THREE from 'three'

import { buildGloamwoodValleyScene } from './gloamwood-valley-scene'
import { gloamwoodValleyDressingFor } from './gloamwood-valley-dressing'
import {
  GLOAMWOOD_VALLEY,
  GLOAMWOOD_VALLEY_LENGTH,
  gloamwoodValleyConfine,
  gloamwoodValleyCorridorAt,
  gloamwoodValleyHeight,
  gloamwoodValleyPointAt,
  gloamwoodValleyRegionAt,
  gloamwoodValleyRoadOffset,
} from './gloamwood-valley-terrain'

/**
 * A walkthrough of the valley, on its own entry.
 *
 * The map is the deliverable here, not the fight, and the only honest way to
 * judge a map is to walk it: a still shows the dressing but not the pacing, the
 * silhouette from inside it, or whether the chokes read as gates. So this is
 * the real camera at the real height and the real walk speed, with a stand-in
 * for the hunter and nothing else - no combat, no prey, no HUD to argue with.
 *
 * It touches nothing in the Gloamwood. The hunt keeps its own scene until the
 * valley is accepted and the encounters are moved onto it.
 */

const PLAYER_SPEED = 6.2
const SPRINT = 3.4
// The hunt's camera height and distance exactly (11.8 up, 16.25 back), at a
// fixed world heading of about fifteen degrees.
//
// Fixed, not following the route. A camera that swung round with every turn
// would keep the road running up the screen and undo the whole point of folding
// it: you would never see the valley bend away, only a corridor that is always
// straight ahead. Fifteen degrees is chosen so no leg of the route runs
// edge-on to the lens.
const CAMERA_OFFSET = new THREE.Vector3(-15.7, 11.8, -4.2)

export async function launchGloamwoodValleyPreview(): Promise<() => void> {
  const container = document.querySelector<HTMLElement>('#game-container')
  if (!container) throw new Error('Missing #game-container')
  const params = new URLSearchParams(window.location.search)

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.32
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  renderer.domElement.className = 'gloamwood-3d-canvas'
  renderer.domElement.tabIndex = 0
  container.append(renderer.domElement)

  const scene = new THREE.Scene()
  const fog = new THREE.FogExp2(0x8fb08c, 0.012)
  scene.fog = fog
  scene.background = new THREE.Color(0x8fb08c)

  const camera = new THREE.PerspectiveCamera(52, 1, 0.4, 620)
  // `?view=top` lifts the camera clear of the valley and holds it there. The
  // walkthrough shows what a place feels like; only an overhead shot shows
  // whether the network of routes is actually there.
  const overhead = params.get('view') === 'top'
  if (overhead) camera.far = 2200

  const seed = Number(params.get('mapSeed') ?? 0) || 0x5a11e
  const valley = await buildGloamwoodValleyScene({
    seed,
    propBudget: Number(params.get('props') ?? 0) || undefined,
    anisotropy: Math.min(8, renderer.capabilities.getMaxAnisotropy()),
  })
  scene.add(valley.root)

  // A stand-in at the hunter's height. The map is what is being judged, and
  // loading the character rig here would drag the whole hunt module in with it.
  const marker = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.42, 1.5, 6, 12),
    new THREE.MeshStandardMaterial({ color: 0xd8c9a0, roughness: 0.7 }),
  )
  marker.castShadow = true
  scene.add(marker)

  // `?at=` drops the reviewer at a distance along the route. Walking 1600 units
  // to look at the second gate is not a review, it is a commute.
  const startS = Number(params.get('at') ?? '') || GLOAMWOOD_VALLEY.spawnS
  // On the road, which runs to one side of the route's centreline.
  const startPoint = gloamwoodValleyPointAt(startS, gloamwoodValleyRoadOffset(startS))
  const start = gloamwoodValleyConfine(startPoint.x, startPoint.z)
  const position = new THREE.Vector2(start.x, start.z)
  const held = new Set<string>()
  const onKeyDown = (event: KeyboardEvent) => {
    held.add(event.code)
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) event.preventDefault()
  }
  const onKeyUp = (event: KeyboardEvent) => held.delete(event.code)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)

  const hud = document.createElement('aside')
  hud.className = 'valley-preview-hud'
  container.append(hud)
  const labels = document.documentElement.lang.startsWith('zh') ? ZH : EN
  hud.innerHTML = `<p data-readout></p><small>${labels.help}</small>`
  const readout = hud.querySelector<HTMLElement>('[data-readout]')!

  const resize = () => {
    const width = container.clientWidth || window.innerWidth
    const height = container.clientHeight || window.innerHeight
    renderer.setSize(width, height, false)
    camera.aspect = width / Math.max(height, 1)
    camera.updateProjectionMatrix()
  }
  resize()
  window.addEventListener('resize', resize)

  // Forward is where the camera looks, projected flat, so the valley runs away
  // from the player on W.
  const forward = new THREE.Vector2(-CAMERA_OFFSET.x, -CAMERA_OFFSET.z).normalize()
  const right = new THREE.Vector2(-forward.y, forward.x)
  const step = new THREE.Vector2()
  const desiredCamera = new THREE.Vector3()

  let running = true
  let last = performance.now()
  let elapsed = 0
  let frames = 0
  let fpsWindow = 0
  let fps = 0
  let cameraSettled = false

  const drawFrame = (delta: number) => {
    elapsed += delta

    step.set(0, 0)
    if (held.has('KeyW') || held.has('ArrowUp')) step.add(forward)
    if (held.has('KeyS') || held.has('ArrowDown')) step.sub(forward)
    if (held.has('KeyD') || held.has('ArrowRight')) step.add(right)
    if (held.has('KeyA') || held.has('ArrowLeft')) step.sub(right)
    if (step.lengthSq() > 0) {
      const speed = PLAYER_SPEED * (held.has('ShiftLeft') || held.has('ShiftRight') ? SPRINT : 1)
      step.normalize().multiplyScalar(speed * delta)
      const confined = gloamwoodValleyConfine(position.x + step.x, position.y + step.y)
      position.set(confined.x, confined.z)
    }

    const ground = gloamwoodValleyHeight(position.x, position.y)
    marker.position.set(position.x, ground + 0.96, position.y)
    desiredCamera.set(position.x, ground, position.y).add(CAMERA_OFFSET)
    // Snapped on the first frame: the smoothing factor is zero at zero delta,
    // which would leave the camera at the world origin looking at nothing.
    if (cameraSettled) camera.position.lerp(desiredCamera, 1 - Math.pow(0.0016, delta))
    else {
      camera.position.copy(desiredCamera)
      cameraSettled = true
    }
    camera.lookAt(position.x, ground + 1.2, position.y)

    const corridor = gloamwoodValleyCorridorAt(position.x, position.y)
    valley.update({ x: position.x, z: position.y, s: corridor.s }, elapsed, fog, overhead)
    scene.background = fog.color
    valley.sun.position.set(position.x - 90, ground + 120, position.y + 60)
    valley.sun.target.position.set(position.x, ground, position.y)
    valley.sun.target.updateMatrixWorld()

    if (overhead) {
      const centre = gloamwoodValleyPointAt(GLOAMWOOD_VALLEY_LENGTH * 0.5, 0)
      camera.position.set(centre.x - 60, 1250, centre.z + 420)
      camera.lookAt(centre.x, 0, centre.z)
      // Fog would swallow a shot taken from a thousand units up.
      fog.density = 0.00035
    }
    renderer.render(scene, camera)

    frames += 1
    fpsWindow += delta
    if (fpsWindow >= 0.5) {
      fps = Math.round(frames / fpsWindow)
      frames = 0
      fpsWindow = 0
    }
    const region = gloamwoodValleyRegionAt(corridor.s)
    const place = corridor.branch
      ? labels.branches[corridor.branch.id] ?? corridor.branch.id
      : region ? labels.regions[region.id] : labels.choke
    readout.textContent = [
      `${place}　${Math.round(corridor.s)} / ${Math.round(GLOAMWOOD_VALLEY_LENGTH)}`,
      `${labels.props} ${valley.stats.props}　${labels.triangles} ${(valley.stats.triangles / 1000).toFixed(0)}k　${labels.batches} ${valley.stats.batches}`,
      `${fps} fps`,
    ].join('\n')
  }
  // One frame is drawn synchronously and the stepper is published, so the map
  // can be inspected somewhere rAF never fires - which is exactly where a check
  // that quietly proved nothing came from last time.
  drawFrame(0)
  ;(window as unknown as {
    gloamwoodValleyStep?: (seconds: number) => void
    gloamwoodValleyDebug?: unknown
  }).gloamwoodValleyStep = drawFrame
  // The scene handle is published for the same reason as the stepper: this is a
  // review tool, and a map defect that cannot be measured gets argued about
  // from screenshots instead.
  ;(window as unknown as { gloamwoodValleyDebug?: unknown }).gloamwoodValleyDebug = { scene, camera, valley, position }
  const frame = () => {
    if (!running) return
    requestAnimationFrame(frame)
    const now = performance.now()
    const delta = Math.min(0.05, (now - last) / 1000)
    last = now
    drawFrame(delta)
  }
  requestAnimationFrame(frame)

  document.body.dataset.valleyProps = String(valley.stats.props)
  document.body.dataset.valleyTriangles = String(valley.stats.triangles)
  document.body.dataset.valleyBatches = String(valley.stats.batches)
  document.body.dataset.valleyRegions = String(GLOAMWOOD_VALLEY.regions.map((region) => gloamwoodValleyDressingFor(region.id).coverage).join(','))
  document.body.dataset.valleyLength = String(Math.round(GLOAMWOOD_VALLEY_LENGTH))

  return () => {
    running = false
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
    window.removeEventListener('resize', resize)
    valley.dispose()
    renderer.dispose()
    renderer.domElement.remove()
    hud.remove()
  }
}

// Producer-facing text for a review tool, not player copy, so it stays here
// rather than in the translation catalogue the game ships.
const EN = {
  help: 'WASD to walk · Shift to run · the road turns, so steer',
  choke: 'Choke',
  props: 'props',
  triangles: 'tris',
  batches: 'batches',
  regions: { shallows: 'Shallows', gorge: 'Gorge', headwater: 'Headwater' },
  branches: {
    'fern-hollow': 'Fern Hollow',
    'reed-ford': 'Reed Ford',
    'scree-shelf': 'Scree Shelf',
    'dead-grove': 'Dead Grove',
    'high-terrace': 'High Terrace',
    'stone-bowl': 'Stone Bowl',
  } as Record<string, string>,
} as const

const ZH = {
  help: 'WASD 行走 · Shift 奔跑 · 路会拐弯，要自己转向',
  choke: '隘口',
  props: '道具',
  triangles: '三角',
  batches: '批次',
  regions: { shallows: '浅滩', gorge: '峡谷', headwater: '源头' },
  branches: {
    'fern-hollow': '蕨草洼',
    'reed-ford': '芦苇浅滩',
    'scree-shelf': '碎石台',
    'dead-grove': '枯林',
    'high-terrace': '高阶地',
    'stone-bowl': '石碗',
  } as Record<string, string>,
} as const
