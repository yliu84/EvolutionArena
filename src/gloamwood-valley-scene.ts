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
  GLOAMWOOD_OCCLUDER_MIN_HEIGHT,
  gloamwoodOccluderFade,
  gloamwoodOccludesCameraView,
  gloamwoodSightlineClearance,
  gloamwoodRockOccluder,
  gloamwoodTreeOccluder,
  type GloamwoodOccluder,
} from './gloamwood-camera-occlusion'
import {
  gloamwoodValleyAtmosphereAt,
  gloamwoodValleyTintAt,
  gloamwoodValleyTreeVariantId,
  scatterGloamwoodValley,
  type GloamwoodValleyProp,
} from './gloamwood-valley-dressing'
import {
  gloamwoodValleyCellDrawn,
  groupGloamwoodValleyProps,
} from './gloamwood-valley-streaming'
import {
  GLOAMWOOD_VALLEY_LENGTH,
  gloamwoodValleyCorridorAt,
  gloamwoodValleyCorridorLines,
  gloamwoodValleyHeight,
  gloamwoodValleyPointAt,
  gloamwoodValleyRiverOffset,
  gloamwoodValleySurfaceWeights,
  gloamwoodValleyWaterHalfWidth,
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

/**
 * Vertex spacing on the ground grid.
 *
 * One step for both axes now, because the route turns: there is no longer an
 * axis the valley runs along and an axis it is narrow across. The grid covers
 * the whole footprint but only the quads near a corridor are emitted, so the
 * cost follows the route rather than its bounding box.
 */
const GROUND_STEP = 4
/**
 * How far outside a corridor the ground is still drawn, in half-widths.
 *
 * Far enough that the mesh's edge sits beyond the fog. At 2.8 the ground ran
 * out around sixty units from the road, which the shallows' thin fog does not
 * reach - and the branch that climbs looks down over everything.
 */
const GROUND_REACH = 4.2

export interface GloamwoodValleySceneStats {
  props: number
  triangles: number
  batches: number
  /** Props tall enough to come between the camera and the player. */
  occluders: number
}

interface ValleyOccluder extends GloamwoodOccluder {
  fade: number
  applied: number
  /** Every instance slot this prop occupies, one per mesh part. */
  slots: Array<{ attribute: THREE.InstancedBufferAttribute; index: number }>
}

export interface GloamwoodValleyScene {
  root: THREE.Group
  sun: THREE.DirectionalLight
  ambient: THREE.HemisphereLight
  stats: GloamwoodValleySceneStats
  /** Cells drawn from the camera's position, and the fog that goes with it. */
  update(camera: { x: number; z: number; s: number }, elapsed: number, fog: THREE.FogExp2, drawAll?: boolean): void
  /** Fades whatever stands between the lens and the player. */
  clearSightline(from: THREE.Vector3, to: THREE.Vector3, delta: number): void
  /**
   * What the sightline pass is currently doing.
   *
   * Exists to be checked rather than eyeballed. A fade is invisible in a still
   * frame and this project has twice accepted a screenshot as proof of wiring
   * that was not connected, so the count is readable directly.
   */
  sightlineState(): {
    occluders: number
    considered: number
    cleared: number
    /**
     * Closest approach to the sightline among the props considered, as a
     * multiple of their own radius. Below 1 is a hit. Reported because "nothing
     * was in the way" and "the test never ran" both come out as zero cleared.
     */
    nearest: number
  }
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

  let lastConsidered = 0
  let lastNearest = Infinity
  const props = scatterGloamwoodValley(options.seed, options.propBudget ?? 6200)
  const cells = groupGloamwoodValleyProps(props).map((cell) => {
    const group = new THREE.Group()
    group.name = `ValleyCell-${cell.cell.column}:${cell.cell.row}`
    const built = buildChunk(cell.props, templates, group)
    root.add(group)
    return { key: cell.cell, group, batches: built.batches, occluders: built.occluders }
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
    batches: cells.reduce((total, cell) => total + cell.batches, 0),
    occluders: cells.reduce((total, cell) => total + cell.occluders.length, 0),
  }

  const fogColor = new THREE.Color()
  const sunColor = new THREE.Color()

  return {
    root,
    sun,
    ambient,
    stats,
    update(camera, elapsed, fog, drawAll = false) {
      foliageTime.value = elapsed
      water.time.value = elapsed
      for (const cell of cells) {
        cell.group.visible = drawAll || gloamwoodValleyCellDrawn(cell.key, camera.x, camera.z)
      }
      const atmosphere = gloamwoodValleyAtmosphereAt(camera.s)
      fog.color.lerp(fogColor.setHex(atmosphere.fogColor), 0.04)
      fog.density += (atmosphere.fogDensity - fog.density) * 0.04
      sun.color.lerp(sunColor.setHex(atmosphere.sunColor), 0.04)
      sun.intensity += (atmosphere.sunIntensity - sun.intensity) * 0.04
      ambient.intensity = 0.55 + atmosphere.sunIntensity * 0.3
    },
    sightlineState() {
      let occluders = 0
      let cleared = 0
      for (const cell of cells) {
        occluders += cell.occluders.length
        for (const occluder of cell.occluders) if (occluder.fade < 0.92) cleared += 1
      }
      return { occluders, considered: lastConsidered, cleared, nearest: lastNearest }
    },
    clearSightline(from, to, delta) {
      lastConsidered = 0
      lastNearest = Infinity
      // Only the cells the sightline crosses are considered. The segment is
      // sixteen units long and a cell is a hundred and twenty, so this is two
      // or three cells however large the valley grows - the cost is set by the
      // camera, not by the map.
      for (const cell of cells) {
        if (!cell.group.visible) continue
        if (!gloamwoodValleyCellDrawn(cell.key, from.x, from.z)) continue
        lastConsidered += cell.occluders.length
        let touched = false
        for (const occluder of cell.occluders) {
          const blocking = gloamwoodOccludesCameraView(occluder, from, to)
          lastNearest = Math.min(lastNearest, gloamwoodSightlineClearance(occluder, from, to))
          occluder.fade = gloamwoodOccluderFade(occluder.fade, blocking, delta)
          // Written only when it actually moved: uploading an instance buffer
          // every frame for props that are all solid would cost more than the
          // test that decided they were.
          if (Math.abs(occluder.fade - occluder.applied) < 0.004) continue
          occluder.applied = occluder.fade
          touched = true
          for (const slot of occluder.slots) {
            slot.attribute.setX(slot.index, occluder.fade)
          }
        }
        if (!touched) continue
        for (const child of cell.group.children) {
          if (!(child instanceof THREE.InstancedMesh)) continue
          const attribute = child.geometry.getAttribute('instanceFade')
          if (attribute) attribute.needsUpdate = true
        }
      }
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
  const bounds = corridorBounds()
  const columns = Math.ceil((bounds.maxX - bounds.minX) / GROUND_STEP) + 1
  const rows = Math.ceil((bounds.maxZ - bounds.minZ) / GROUND_STEP) + 1

  const positions = new Float32Array(columns * rows * 3)
  const uvs = new Float32Array(columns * rows * 2)
  const surface = new Float32Array(columns * rows * 3)
  const colors = new Float32Array(columns * rows * 3)
  const inside = new Uint8Array(columns * rows)
  const tint = new THREE.Color()

  for (let column = 0; column < columns; column += 1) {
    for (let row = 0; row < rows; row += 1) {
      const index = column * rows + row
      const x = bounds.minX + column * GROUND_STEP
      const z = bounds.minZ + row * GROUND_STEP
      const corridor = gloamwoodValleyCorridorAt(x, z)
      inside[index] = corridor.across <= GROUND_REACH ? 1 : 0
      positions[index * 3] = x
      positions[index * 3 + 2] = z
      // The whole grid is addressed in world units, so the tiled maps line up
      // across the turns instead of shearing where the route changes heading.
      uvs[index * 2] = x / 16
      uvs[index * 2 + 1] = z / 16
      if (!inside[index]) continue
      positions[index * 3 + 1] = gloamwoodValleyHeight(x, z)
      const weights = gloamwoodValleySurfaceWeights(x, z)
      surface[index * 3] = weights.road
      surface[index * 3 + 1] = weights.bank
      surface[index * 3 + 2] = weights.wall
      tint.setHex(gloamwoodValleyTintAt(corridor.s))
      // The region tint is a foliage colour. Painting it over the wall is what
      // turned the first cliffs green, and painting it over the path is what
      // made the road vanish: bare earth and grass are close enough in this kit
      // that a shared green over both leaves no path at all.
      tint.lerp(STONE, weights.wall * 0.85)
      tint.lerp(EARTH, weights.road * 0.8)
      // Under the water the ground goes dark, which is most of what sells depth
      // in a river with no refraction.
      const submerged = corridor.branch ? 0 : Math.max(0, gloamwoodValleyWaterHeight(corridor.s) - positions[index * 3 + 1])
      const shade = 1 / (1 + submerged * 0.85)
      colors[index * 3] = tint.r * 1.35 * shade
      colors[index * 3 + 1] = tint.g * 1.35 * shade
      colors[index * 3 + 2] = tint.b * 1.35 * shade
    }
  }

  const indices: number[] = []
  for (let column = 0; column < columns - 1; column += 1) {
    for (let row = 0; row < rows - 1; row += 1) {
      const a = column * rows + row
      const b = a + 1
      const c = (column + 1) * rows + row
      const d = c + 1
      // Any corner inside is enough: dropping quads with a corner outside would
      // eat a ring of ground exactly where the wall is most visible.
      if (!inside[a] && !inside[b] && !inside[c] && !inside[d]) continue
      indices.push(a, b, c, b, d, c)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
  geometry.setAttribute('surfaceWeight', new THREE.BufferAttribute(surface, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()

  const bankMap = groundTexture('/assets/terrain/forest.jpg', 1, 1, anisotropy)
  const roadMap = groundTexture('/assets/terrain/dirt.jpg', 2.6, 2.6, anisotropy)
  // Bark, not mud: the kit's mud photograph is a flat beige with no structure,
  // and a twenty-unit cliff painted with it read as a lawn. Bark is grey-green
  // lichen with hard vertical striations, and at this tile size it reads as
  // strata.
  const wallMap = groundTexture('/assets/terrain/bark.jpg', 0.7, 0.7, anisotropy)
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

/** Footprint the ground has to cover: the route and its branches, plus walls. */
function corridorBounds() {
  let minX = Infinity
  let maxX = -Infinity
  let minZ = Infinity
  let maxZ = -Infinity
  const note = (x: number, z: number) => {
    minX = Math.min(minX, x)
    maxX = Math.max(maxX, x)
    minZ = Math.min(minZ, z)
    maxZ = Math.max(maxZ, z)
  }
  const lines = gloamwoodValleyCorridorLines()
  for (const point of lines.route) note(point.x, point.z)
  for (const branch of lines.branches) for (const [x, z] of branch.points) note(x, z)
  const margin = 110
  return { minX: minX - margin, maxX: maxX + margin, minZ: minZ - margin, maxZ: maxZ + margin }
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
  const along = Math.round(GLOAMWOOD_VALLEY_LENGTH / 3)
  const across = 10
  const positions: number[] = []
  const uvs: number[] = []
  const colors: number[] = []
  const edges: number[] = []
  const indices: number[] = []
  const tint = new THREE.Color()
  const shade = new THREE.Color()
  for (let step = 0; step <= along; step += 1) {
    const s = (step / along) * GLOAMWOOD_VALLEY_LENGTH
    const centre = gloamwoodValleyRiverOffset(s)
    // Slightly wider than the water so it tucks under the bank rather than
    // ending in a visible seam along it.
    const half = gloamwoodValleyWaterHalfWidth(s) * 1.02
    const y = gloamwoodValleyWaterHeight(s)
    tint.setHex(gloamwoodValleyTintAt(s))
    for (let lane = 0; lane <= across; lane += 1) {
      const t = lane / across
      const point = gloamwoodValleyPointAt(s, centre - half + half * 2 * t)
      positions.push(point.x, y, point.z)
      uvs.push(s * 0.05, t)
      // 0 down the middle of the channel, 1 at the waterline.
      const edge = Math.abs(t - 0.5) * 2
      edges.push(edge)
      // Depth does the work a texture would: dark and saturated over the bed,
      // pale where it thins out, and tinted by the region it runs through. One
      // flat blue is what made the first river read as painted plastic - and it
      // is not something a photograph would have fixed, because the problem was
      // that the colour did not vary with anything.
      shade.copy(DEEP).lerp(SHALLOW, edge * edge).lerp(tint, 0.28)
      colors.push(shade.r, shade.g, shade.b)
    }
    if (step < along) {
      for (let lane = 0; lane < across; lane += 1) {
        const base = step * (across + 1) + lane
        const next = base + across + 1
        // Wound counter-clockwise seen from above. The first pass had these the
        // other way round: the geometry, the material and the placement were
        // all correct and the river was invisible, because its only front face
        // pointed at the riverbed.
        indices.push(base, base + 1, next, base + 1, next + 1, next)
      }
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geometry.setAttribute('waterEdge', new THREE.Float32BufferAttribute(edges, 1))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()

  const time = { value: 0 }
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    roughness: 0.19,
    // No metalness. There is no environment map in this scene, so a metallic
    // surface has nothing to reflect and renders as a black ribbon - which is
    // exactly what the first river looked like, and it read as a shadow in the
    // channel rather than as water in it.
    metalness: 0,
    emissive: new THREE.Color(0x0a1f24),
    transparent: true,
    depthWrite: false,
  })
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uWaterTime = time
    // The flow coordinate is carried across explicitly. `vMapUv` only exists
    // when the material has a texture, and this one deliberately has none - so
    // reaching for it compiled to nothing and left the river invisible again.
    shader.vertexShader = `uniform float uWaterTime;\nattribute float waterEdge;\nvarying float vWaterEdge;\nvarying float vWaterFlow;\n${shader.vertexShader}`
      .replace('#include <uv_vertex>', '#include <uv_vertex>\n  vWaterEdge = waterEdge;\n  vWaterFlow = uv.x;')
      .replace(
        '#include <beginnormal_vertex>',
        // The wave travels along the channel, because uv.x is distance down it.
        // Driving the ripple off world x and z instead makes the water shear
        // sideways wherever the route turns.
        `float flow = uv.x * 9.0 + uWaterTime * 1.25;
        float span = uv.y * 7.0;
        float wave = sin(flow) * 0.05 + sin(flow * 2.7 + span) * 0.028;
        float slopeAlong = 0.05 * cos(flow) + 0.028 * 2.7 * cos(flow * 2.7 + span);
        float slopeAcross = 0.028 * cos(flow * 2.7 + span);
        vec3 objectNormal = normalize(vec3(slopeAcross * 1.4, 1.0, -slopeAlong * 0.9));`,
      )
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n  transformed.y += wave;')
    shader.fragmentShader = `uniform float uWaterTime;\nvarying float vWaterEdge;\nvarying float vWaterFlow;\n${shader.fragmentShader}`
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
        {
          // Foam at the waterline, washing along it. The shore is where a river
          // reads as moving; the middle can be almost still.
          float shore = smoothstep(0.66, 1.0, vWaterEdge);
          float wash = 0.55 + 0.45 * sin(uWaterTime * 1.6 + vWaterFlow * 26.0);
          diffuseColor.rgb += shore * wash * 0.3;
          // Thin at the edges so the bed shows through, opaque over the deep.
          diffuseColor.a *= mix(0.93, 0.4, vWaterEdge);
        }`,
      )
  }
  material.customProgramCacheKey = () => 'gloamwood-valley-water'
  disposables.push(geometry, material)

  const mesh = new THREE.Mesh(geometry, material)
  mesh.name = 'ValleyRiver'
  mesh.renderOrder = 1
  return { mesh, time }
}

/**
 * Builds one cell's instanced batches, and the occluders inside them.
 *
 * Every instance also carries a fade, because an InstancedMesh has no
 * per-object `visible` to switch: getting one prop out of the camera's way
 * means writing a number into a buffer the shader reads.
 */
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
  const occluders = new Map<GloamwoodValleyProp, ValleyOccluder>()
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
      const batch = new THREE.InstancedMesh(part.geometry, applyInstanceFade(part.material), bucket.length)
      const fades = new THREE.InstancedBufferAttribute(new Float32Array(bucket.length).fill(1), 1)
      fades.setUsage(THREE.DynamicDrawUsage)
      batch.geometry = batch.geometry.clone()
      batch.geometry.setAttribute('instanceFade', fades)
      for (const [index, prop] of bucket.entries()) {
        const size = worldSizeOf(prop)
        const ground = gloamwoodValleyHeight(prop.x, prop.z)
        // Rocks bed into the ground; a cliff sitting exactly on the surface
        // reads as a pebble the size of a house rather than as bedrock.
        const sink = prop.kind === 'tree' ? 0 : prop.kind === 'undergrowth' ? 0.02 : size * 0.09
        origin.set(prop.x, ground - sink, prop.z)
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

        // Anything shorter than the player's eye cannot come between them and
        // the camera. That excludes all the grass, which is most of the valley
        // and most of the reason the per-frame pass stays cheap.
        if (size >= GLOAMWOOD_OCCLUDER_MIN_HEIGHT && prop.kind !== 'undergrowth') {
          const existing = occluders.get(prop)
          if (existing) existing.slots.push({ attribute: fades, index })
          else {
            const shape = prop.kind === 'tree'
              ? gloamwoodTreeOccluder(prop.x, ground, prop.z, size)
              : gloamwoodRockOccluder(prop.x, ground, prop.z, size)
            occluders.set(prop, { ...shape, fade: 1, applied: 1, slots: [{ attribute: fades, index }] })
          }
        }
      }
      // Grass-scale props skip the shadow pass; there are thousands of them.
      batch.castShadow = bucket[0].kind !== 'undergrowth'
      batch.receiveShadow = true
      batch.name = `Valley-${key}`
      group.add(batch)
      batches += 1
    }
  }
  return { batches, occluders: [...occluders.values()] }
}

/**
 * Makes a kit material read a per-instance fade.
 *
 * Dithered rather than blended. These materials are alpha-tested foliage and
 * rock, and turning them transparent would put thousands of instances into the
 * sorted pass and have them draw through each other. A screen-space threshold
 * discards a share of the fragments instead: no sorting, no depth trouble, and
 * at this distance it reads as a fade.
 */
function applyInstanceFade(material: THREE.Material) {
  const faded = material.clone()
  const previous = faded.onBeforeCompile
  faded.onBeforeCompile = (shader, renderer) => {
    previous?.call(faded, shader, renderer)
    shader.vertexShader = `attribute float instanceFade;\nvarying float vInstanceFade;\n${shader.vertexShader}`
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vInstanceFade = instanceFade;')
    shader.fragmentShader = `varying float vInstanceFade;\n${shader.fragmentShader}`
      .replace(
        '#include <alphatest_fragment>',
        `{
          // Bayer 4x4, not a row-major count. A threshold that simply increases
          // along each row leaves the kept fragments in diagonal runs, and a
          // cleared cliff reads as venetian blinds rather than as a fade.
          vec2 half4 = floor(gl_FragCoord.xy * 0.5);
          vec2 full4 = floor(gl_FragCoord.xy);
          float threshold = fract(half4.x * 0.5 + half4.y * half4.y * 0.75) * 0.25
            + fract(full4.x * 0.5 + full4.y * full4.y * 0.75);
          if (vInstanceFade < threshold) discard;
        }
        #include <alphatest_fragment>`,
      )
  }
  const key = faded.customProgramCacheKey
  faded.customProgramCacheKey = () => `${key ? key.call(faded) : faded.uuid}:instance-fade`
  return faded
}

const WHITE = new THREE.Color(0xffffff)
const STONE = new THREE.Color(0x8d8f86)
const EARTH = new THREE.Color(0xb08a5c)
const DEEP = new THREE.Color(0x1b4147)
const SHALLOW = new THREE.Color(0x7cb6b0)

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
