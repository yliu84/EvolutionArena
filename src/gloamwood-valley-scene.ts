import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

import { assetUrl } from './asset-url'
import {
  GLOAMWOOD_ROCK_VARIANTS,
  GLOAMWOOD_TREE_VARIANTS,
  GLOAMWOOD_VEGETATION_VARIANTS,
} from './gloamwood-environment-kit'
import {
  GLOAMWOOD_ROCK_GRADE,
  GLOAMWOOD_TREE_GRADE,
  GLOAMWOOD_VEGETATION_GRADE,
  loadGloamwoodKitTemplate,
} from './gloamwood-kit-loader'
import {
  gloamwoodValleyAtmosphereAt,
  gloamwoodValleyTintAt,
  gloamwoodValleyTreeVariantId,
  scatterGloamwoodValley,
  type GloamwoodValleyProp,
} from './gloamwood-valley-dressing'
import {
  gloamwoodValleyChunkDrawn,
  groupGloamwoodValleyProps,
} from './gloamwood-valley-streaming'
import {
  GLOAMWOOD_VALLEY,
  gloamwoodValleyHeight,
  gloamwoodValleyRiverCenter,
  gloamwoodValleyRiverHalfWidth,
  gloamwoodValleySurfaceWeights,
  gloamwoodValleyWaterHeight,
} from './gloamwood-valley-terrain'

/**
 * The valley, meshed.
 *
 * There is no artist on this project and no building or decoration assets - the
 * kit is trees, plants and three rocks. A wilderness needs no buildings, so
 * everything that makes this map worth looking at has to come from geometry the
 * code generates and from how the same handful of models are placed:
 *
 *   - the silhouette, which is the largest single effect and is free;
 *   - the river, cut into the ground rather than laid on it;
 *   - the same three rocks at three to twelve times their authored size, which
 *     stop reading as rocks and start reading as cliffs;
 *   - one ground mesh blending three tiled CC0 photographs by slope and
 *     position, so it is terrain rather than one repeated picture;
 *   - fog and light that follow the camera up the valley.
 *
 * The layout, the dressing and the draw chunking all live in their own modules
 * as pure functions. This file only turns them into meshes.
 */

const GROUND_MARGIN = 60
const GROUND_HALF_Z = 90
/** Vertex spacing. Finer across the valley, where all the shape is. */
const GROUND_STEP_X = 5
// The channel is only nine units across, so a two-unit step resolved it with
// three vertices and the river came out as a dent.
const GROUND_STEP_Z = 1.5

export interface GloamwoodValleySceneStats {
  props: number
  triangles: number
  batches: number
}

export interface GloamwoodValleyScene {
  root: THREE.Group
  sun: THREE.DirectionalLight
  ambient: THREE.HemisphereLight
  stats: GloamwoodValleySceneStats
  /** Chunks drawn from the camera's position, and the fog that goes with it. */
  update(cameraX: number, elapsed: number, fog: THREE.FogExp2): void
  dispose(): void
}

export async function buildGloamwoodValleyScene(options: {
  seed: number
  propBudget?: number
  anisotropy: number
}): Promise<GloamwoodValleyScene> {
  const root = new THREE.Group()
  root.name = 'GloamwoodValley'
  const foliageTime = { value: 0 }
  const disposables: Array<{ dispose(): void }> = []

  const ground = buildGround(options.anisotropy, disposables)
  root.add(ground)

  const water = buildRiver(disposables)
  root.add(water.mesh)

  const loader = new GLTFLoader()
  const templates = new Map<string, THREE.Group>()
  await Promise.all([
    ...[...new Map(GLOAMWOOD_TREE_VARIANTS.map((variant) => [variant.id, variant])).values()].map(async (variant) => {
      templates.set(`tree:${variant.id}`, await loadGloamwoodKitTemplate(loader, variant.url, 'height', GLOAMWOOD_TREE_GRADE, foliageTime))
    }),
    ...GLOAMWOOD_ROCK_VARIANTS.map(async (variant) => {
      templates.set(`rock:${variant.id}`, await loadGloamwoodKitTemplate(loader, variant.url, 'lateral', GLOAMWOOD_ROCK_GRADE, foliageTime))
    }),
    ...GLOAMWOOD_VEGETATION_VARIANTS.map(async (variant) => {
      templates.set(`plant:${variant.id}`, await loadGloamwoodKitTemplate(loader, variant.url, variant.mode, GLOAMWOOD_VEGETATION_GRADE, foliageTime))
    }),
  ])

  const props = scatterGloamwoodValley(options.seed, options.propBudget ?? 6200)
  const chunks = groupGloamwoodValleyProps(props).map((chunkProps, index) => {
    const group = new THREE.Group()
    group.name = `ValleyChunk-${index}`
    const batches = buildChunk(chunkProps, templates, group)
    root.add(group)
    return { group, batches }
  })

  const sun = new THREE.DirectionalLight(0xffeec4, 2.1)
  sun.position.set(-90, 120, 60)
  sun.castShadow = true
  sun.shadow.mapSize.set(1024, 1024)
  sun.shadow.camera.near = 20
  sun.shadow.camera.far = 320
  sun.shadow.camera.left = -70
  sun.shadow.camera.right = 70
  sun.shadow.camera.top = 70
  sun.shadow.camera.bottom = -70
  // The shadow camera follows the player rather than covering the valley: one
  // frustum over 1600 units would put roughly four shadow texels on the hunter.
  sun.target.position.set(0, 0, 0)
  root.add(sun)
  root.add(sun.target)

  const ambient = new THREE.HemisphereLight(0xbcd6c8, 0x2b3326, 1.15)
  root.add(ambient)

  const stats: GloamwoodValleySceneStats = {
    props: props.length,
    triangles: countTriangles(root),
    batches: chunks.reduce((total, chunk) => total + chunk.batches, 0),
  }

  const fogColor = new THREE.Color()
  const sunColor = new THREE.Color()

  return {
    root,
    sun,
    ambient,
    stats,
    update(cameraX, elapsed, fog) {
      foliageTime.value = elapsed
      water.time.value = elapsed
      for (const [index, chunk] of chunks.entries()) {
        chunk.group.visible = gloamwoodValleyChunkDrawn(index, cameraX)
      }
      const atmosphere = gloamwoodValleyAtmosphereAt(cameraX)
      fog.color.lerp(fogColor.setHex(atmosphere.fogColor), 0.04)
      fog.density += (atmosphere.fogDensity - fog.density) * 0.04
      sun.color.lerp(sunColor.setHex(atmosphere.sunColor), 0.04)
      sun.intensity += (atmosphere.sunIntensity - sun.intensity) * 0.04
      ambient.intensity = 0.55 + atmosphere.sunIntensity * 0.3
    },
    dispose() {
      for (const item of disposables) item.dispose()
      root.traverse((node) => {
        if (node instanceof THREE.InstancedMesh) node.dispose()
      })
      root.clear()
    },
  }
}

/**
 * One ground mesh, blending three tiled CC0 photographs.
 *
 * Splatting by position is what separates generated terrain from one repeated
 * picture, and here it costs nothing but arithmetic: the road, bank and wall
 * weights are already a pure function of position, so they go into a vertex
 * attribute and the fragment shader mixes the three maps by them.
 */
function buildGround(anisotropy: number, disposables: Array<{ dispose(): void }>) {
  const width = GLOAMWOOD_VALLEY.length + GROUND_MARGIN * 2
  const segmentsX = Math.round(width / GROUND_STEP_X)
  const segmentsZ = Math.round((GROUND_HALF_Z * 2) / GROUND_STEP_Z)
  const geometry = new THREE.PlaneGeometry(width, GROUND_HALF_Z * 2, segmentsX, segmentsZ)
  geometry.rotateX(-Math.PI / 2)
  geometry.translate(GLOAMWOOD_VALLEY.length / 2, 0, 0)

  const position = geometry.attributes.position
  const surface = new Float32Array(position.count * 3)
  const colors = new Float32Array(position.count * 3)
  const tint = new THREE.Color()
  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index)
    const z = position.getZ(index)
    position.setY(index, gloamwoodValleyHeight(x, z))
    const weights = gloamwoodValleySurfaceWeights(x, z)
    surface[index * 3] = weights.road
    surface[index * 3 + 1] = weights.bank
    surface[index * 3 + 2] = weights.wall
    tint.setHex(gloamwoodValleyTintAt(x))
    // The region tint is a foliage colour, and painting it over the wall is
    // what turned the first cliffs green. Stone keeps its own colour.
    tint.lerp(STONE, weights.wall * 0.85)
    // Under the water the ground goes dark, which is most of what sells depth
    // in a river with no refraction.
    const submerged = Math.max(0, gloamwoodValleyWaterHeight(x) - position.getY(index))
    const shade = 1 / (1 + submerged * 0.85)
    colors[index * 3] = tint.r * 1.35 * shade
    colors[index * 3 + 1] = tint.g * 1.35 * shade
    colors[index * 3 + 2] = tint.b * 1.35 * shade
  }
  geometry.setAttribute('surfaceWeight', new THREE.BufferAttribute(surface, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.computeVertexNormals()

  const bankMap = groundTexture('/assets/terrain/forest.jpg', 172, 24, anisotropy)
  const roadMap = groundTexture('/assets/terrain/dirt.jpg', 430, 60, anisotropy)
  // Bark, not mud: the kit's mud photograph is a flat beige with no structure,
  // and a twenty-unit cliff painted with it read as a lawn. Bark is grey-green
  // lichen with hard vertical striations, and the plane's v runs down the
  // slope, so at this tile size it reads as strata.
  const wallMap = groundTexture('/assets/terrain/bark.jpg', 96, 13, anisotropy)
  disposables.push(bankMap, roadMap, wallMap, geometry)

  const material = new THREE.MeshStandardMaterial({
    map: bankMap,
    roughness: 0.98,
    metalness: 0,
    vertexColors: true,
  })
  material.onBeforeCompile = (shader) => {
    shader.uniforms.roadMap = { value: roadMap }
    shader.uniforms.wallMap = { value: wallMap }
    shader.vertexShader = `attribute vec3 surfaceWeight;\nvarying vec3 vSurfaceWeight;\n${shader.vertexShader}`
      .replace('#include <uv_vertex>', '#include <uv_vertex>\n  vSurfaceWeight = surfaceWeight;')
    shader.fragmentShader = `uniform sampler2D roadMap;\nuniform sampler2D wallMap;\nvarying vec3 vSurfaceWeight;\n${shader.fragmentShader}`
      .replace(
        '#include <map_fragment>',
        `{
          vec3 w = vSurfaceWeight / max(vSurfaceWeight.x + vSurfaceWeight.y + vSurfaceWeight.z, 0.0001);
          vec4 blended = texture2D( map, vMapUv ) * w.y
            + texture2D( roadMap, vMapUv ) * w.x
            + texture2D( wallMap, vMapUv ) * w.z;
          diffuseColor *= blended;
        }`,
      )
  }
  material.customProgramCacheKey = () => 'gloamwood-valley-ground'
  disposables.push(material)

  const mesh = new THREE.Mesh(geometry, material)
  mesh.receiveShadow = true
  mesh.name = 'ValleyGround'
  return mesh
}

function groundTexture(path: string, repeatX: number, repeatY: number, anisotropy: number) {
  const texture = new THREE.TextureLoader().load(assetUrl(path))
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(repeatX, repeatY)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = anisotropy
  return texture
}

/**
 * The river surface.
 *
 * A ribbon following the channel the terrain already carries, with the ripples
 * done as an analytic height field in the vertex shader - the normal is the
 * derivative of the same field, so the light breaks up on it instead of the
 * surface reading as tinted glass.
 */
function buildRiver(disposables: Array<{ dispose(): void }>) {
  const along = Math.round(GLOAMWOOD_VALLEY.length / 3)
  const across = 8
  const positions: number[] = []
  const uvs: number[] = []
  const colors: number[] = []
  const indices: number[] = []
  const tint = new THREE.Color()
  for (let step = 0; step <= along; step += 1) {
    const x = (step / along) * GLOAMWOOD_VALLEY.length
    const center = gloamwoodValleyRiverCenter(x)
    // Slightly wider than the channel so the water tucks under the bank rather
    // than ending in a visible seam along it.
    const half = gloamwoodValleyRiverHalfWidth(x) * 1.06
    const y = gloamwoodValleyWaterHeight(x)
    // Tinted along its length by the region it runs through. One mesh cannot be
    // zoned the way the props are, but its vertices can: the headwater's water
    // should not be the same holiday blue as the shallows'.
    tint.setHex(gloamwoodValleyTintAt(x)).lerp(WATER, 0.4)
    for (let lane = 0; lane <= across; lane += 1) {
      const t = lane / across
      positions.push(x, y, center - half + half * 2 * t)
      uvs.push(x * 0.05, t)
      colors.push(tint.r, tint.g, tint.b)
    }
    if (step < along) {
      for (let lane = 0; lane < across; lane += 1) {
        const base = step * (across + 1) + lane
        const next = base + across + 1
        // Wound counter-clockwise seen from above. The first pass had these
        // the other way round: the geometry, the material and the placement
        // were all correct and the river was invisible, because its only front
        // face pointed at the riverbed.
        indices.push(base, base + 1, next, base + 1, next + 1, next)
      }
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()

  const time = { value: 0 }
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    roughness: 0.28,
    // No metalness. There is no environment map in this scene, so a metallic
    // surface has nothing to reflect and renders as a black ribbon - which is
    // exactly what the first river looked like, and it read as a shadow in the
    // channel rather than as water in it.
    metalness: 0,
    emissive: new THREE.Color(0x0a1f24),
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
  })
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uWaterTime = time
    shader.vertexShader = `uniform float uWaterTime;\n${shader.vertexShader}`
      .replace(
        '#include <beginnormal_vertex>',
        `vec3 worldSample = (modelMatrix * vec4(position, 1.0)).xyz;
        float rippleX = 0.075 * sin(worldSample.x * 0.55 + uWaterTime * 1.7);
        float rippleZ = 0.055 * sin(worldSample.z * 0.9 - uWaterTime * 1.15);
        vec3 objectNormal = normalize(vec3(
          -0.075 * 0.55 * cos(worldSample.x * 0.55 + uWaterTime * 1.7),
          1.0,
          -0.055 * 0.9 * cos(worldSample.z * 0.9 - uWaterTime * 1.15)
        ));`,
      )
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n  transformed.y += rippleX + rippleZ;')
  }
  material.customProgramCacheKey = () => 'gloamwood-valley-water'
  disposables.push(geometry, material)

  const mesh = new THREE.Mesh(geometry, material)
  mesh.name = 'ValleyRiver'
  mesh.renderOrder = 1
  return { mesh, time }
}

/** Builds one chunk's instanced batches. Returns how many batches it made. */
function buildChunk(
  props: readonly GloamwoodValleyProp[],
  templates: Map<string, THREE.Group>,
  group: THREE.Group,
) {
  const byTemplate = new Map<string, GloamwoodValleyProp[]>()
  for (const prop of props) {
    const key = templateKeyFor(prop)
    if (!key) continue
    const bucket = byTemplate.get(key)
    if (bucket) bucket.push(prop)
    else byTemplate.set(key, [prop])
  }

  let batches = 0
  const placement = new THREE.Matrix4()
  const instanceMatrix = new THREE.Matrix4()
  const rotation = new THREE.Quaternion()
  const up = new THREE.Vector3(0, 1, 0)
  const scale = new THREE.Vector3()
  const origin = new THREE.Vector3()
  const color = new THREE.Color()

  for (const [key, bucket] of byTemplate) {
    const template = templates.get(key)
    if (!template) continue
    template.updateMatrixWorld(true)
    const parts: Array<{ geometry: THREE.BufferGeometry; material: THREE.Material; local: THREE.Matrix4 }> = []
    template.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        parts.push({ geometry: node.geometry, material: node.material as THREE.Material, local: node.matrixWorld.clone() })
      }
    })
    for (const part of parts) {
      const batch = new THREE.InstancedMesh(part.geometry, part.material, bucket.length)
      for (const [index, prop] of bucket.entries()) {
        const size = worldSizeOf(prop)
        // Rocks bed into the ground; a cliff sitting exactly on the surface
        // reads as a pebble the size of a house rather than as bedrock.
        const sink = prop.kind === 'tree' ? 0 : prop.kind === 'undergrowth' ? 0.02 : size * 0.09
        origin.set(prop.x, gloamwoodValleyHeight(prop.x, prop.z) - sink, prop.z)
        placement.compose(origin, rotation.setFromAxisAngle(up, prop.rotation), scale.setScalar(size))
        instanceMatrix.multiplyMatrices(placement, part.local)
        batch.setMatrixAt(index, instanceMatrix)
        color.setHex(prop.tint)
        // Rock takes the region tint at half strength. Stone reading as green
        // as the leaves around it is the giveaway that a map was tinted rather
        // than lit.
        if (prop.kind !== 'tree' && prop.kind !== 'undergrowth') color.lerp(WHITE, 0.55)
        // Per-instance jitter, so a hillside of one model does not read as one
        // model repeated. Derived from the prop's own position, so it survives
        // the props being re-bucketed into different batches.
        const jitter = 0.82 + hashUnit(prop.x * 7.31 + prop.z * 3.17) * 0.36
        batch.setColorAt(index, color.multiplyScalar(jitter * 1.5))
      }
      // Grass-scale props skip the shadow pass; there are thousands of them.
      batch.castShadow = bucket[0].kind !== 'undergrowth'
      batch.receiveShadow = true
      batch.name = `Valley-${key}`
      group.add(batch)
      batches += 1
    }
  }
  return batches
}

const WHITE = new THREE.Color(0xffffff)
const STONE = new THREE.Color(0x8d8f86)
const WATER = new THREE.Color(0x5e97a0)

function hashUnit(value: number) {
  const wrapped = Math.sin(value) * 43758.5453
  return wrapped - Math.floor(wrapped)
}

function templateKeyFor(item: GloamwoodValleyProp) {
  if (item.kind === 'tree') return `tree:${gloamwoodValleyTreeVariantId(item.variant)}`
  if (item.kind === 'undergrowth') return `plant:${GLOAMWOOD_VEGETATION_VARIANTS[item.variant]?.id}`
  return `rock:${GLOAMWOOD_ROCK_VARIANTS[item.variant]?.id}`
}

/** World size of a prop, in the axis its template was normalized against. */
function worldSizeOf(item: GloamwoodValleyProp) {
  if (item.kind === 'tree') {
    const variant = GLOAMWOOD_TREE_VARIANTS.find((entry) => entry.id === gloamwoodValleyTreeVariantId(item.variant))
    return (variant?.height ?? 8) * item.scale
  }
  if (item.kind === 'undergrowth') {
    return (GLOAMWOOD_VEGETATION_VARIANTS[item.variant]?.baseSize ?? 0.9) * item.scale
  }
  return (GLOAMWOOD_ROCK_VARIANTS[item.variant]?.diameter ?? 2) * item.scale
}

function countTriangles(root: THREE.Object3D) {
  let triangles = 0
  root.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return
    const index = node.geometry.getIndex()
    const perInstance = index ? index.count / 3 : node.geometry.attributes.position.count / 3
    triangles += perInstance * (node instanceof THREE.InstancedMesh ? node.count : 1)
  })
  return Math.round(triangles)
}
