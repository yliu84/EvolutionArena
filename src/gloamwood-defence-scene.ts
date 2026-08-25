import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

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
import { scatterGloamwoodDefence, type GloamwoodDefenceProp } from './gloamwood-defence-dressing'
import { GLOAMWOOD_DEFENCE, gloamwoodDefenceHeight, gloamwoodDefenceWalkable } from './gloamwood-defence-terrain'

/**
 * Builds the defence map's scenery from the terrain functions.
 *
 * Much smaller than the valley's scene, and deliberately so. The valley streams
 * 6,200 props through cells because it is 1,590 units of road; this map is
 * 52 x 68 and fits in one draw of each instanced kit piece, so there is no cell
 * grid, no streaming and no sightline pass to maintain.
 *
 * The ground is displaced from `gloamwoodDefenceHeight` rather than modelled,
 * which is what keeps the drawn surface and the collision rules the same shape.
 */

const GROUND_QUAD = 1

export interface GloamwoodDefenceScene {
  root: THREE.Group
  /** Ground height as drawn, for anything that has to stand on it. */
  heightAt(x: number, z: number): number
  /** The altar, so the runtime can move a health bar with it later. */
  altar: THREE.Object3D
  stats: { props: number; groundVertices: number }
  dispose(): void
}

/**
 * Value noise, so the ground is not a flat wash.
 *
 * The first build painted each region one colour, which under the Gloamwood's
 * lighting rig - hemisphere 3.2, directional 7.35, tuned for a textured terrain
 * - came out as pale grey-green with no way to tell the road from the bowl.
 * Cheap grain plus a darker base fixes both, and costs one attribute.
 */
function grain(x: number, z: number) {
  const value = Math.sin(x * 0.71 + z * 1.31) * 43758.5453
  const second = Math.sin(x * 1.93 - z * 0.47) * 12793.113
  return ((value - Math.floor(value)) * 0.65 + (second - Math.floor(second)) * 0.35) - 0.5
}

/**
 * Vertex colour by what the ground *is*, so the three regions read apart
 * without a texture.
 *
 * The owner's brief was that the fighting ground has to be legible. Tinting the
 * road, the bowl and the bank differently does more for that at this camera
 * height than any amount of scattered detail.
 *
 * The values are deliberately dark. They are multiplied by a rig bright enough
 * to blow out anything mid-toned, and the first pass at roughly twice these
 * numbers rendered as one flat pale surface across all three regions.
 */
function groundTint(x: number, z: number, target: THREE.Color) {
  const speckle = grain(x, z) * 0.045
  if (gloamwoodDefenceWalkable(x, z)) {
    if (z <= GLOAMWOOD_DEFENCE.road.endZ) {
      // Bare trodden earth: warm, and clearly not the grass it opens onto.
      return target.setRGB(0.169 + speckle, 0.115 + speckle * 0.8, 0.062 + speckle * 0.5)
    }
    return target.setRGB(0.077 + speckle * 0.7, 0.156 + speckle, 0.062 + speckle * 0.7)
  }
  // The bank darkens as it climbs, which is what makes the rim of the bowl read
  // as a wall rather than as a change of grass.
  const climb = Math.min(1, Math.max(0, gloamwoodDefenceHeight(x, z) / GLOAMWOOD_DEFENCE.wallHeight))
  const shade = 0.072 - climb * 0.042 + speckle * 0.5
  return target.setRGB(shade * 0.85, shade, shade * 0.62)
}

function buildGround(disposables: Array<{ dispose(): void }>) {
  const { halfWidth, halfDepth } = GLOAMWOOD_DEFENCE.bounds
  const columns = Math.ceil((halfWidth * 2) / GROUND_QUAD)
  const rows = Math.ceil((halfDepth * 2) / GROUND_QUAD)
  const geometry = new THREE.PlaneGeometry(halfWidth * 2, halfDepth * 2, columns, rows)
  geometry.rotateX(-Math.PI / 2)
  const position = geometry.attributes.position as THREE.BufferAttribute
  const colors = new Float32Array(position.count * 3)
  const tint = new THREE.Color()
  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index)
    const z = position.getZ(index)
    position.setY(index, gloamwoodDefenceHeight(x, z))
    groundTint(x, z, tint)
    colors[index * 3] = tint.r
    colors[index * 3 + 1] = tint.g
    colors[index * 3 + 2] = tint.b
  }
  position.needsUpdate = true
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.computeVertexNormals()
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96, metalness: 0 })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.name = 'DefenceGround'
  mesh.receiveShadow = true
  disposables.push(geometry, material)
  return { mesh, vertices: position.count }
}

/**
 * A stand-in altar: a stone dais with a lit core.
 *
 * Explicitly a placeholder. It exists so the space can be judged with the thing
 * being defended actually in it - a defence map read without the altar present
 * is a different space - and it carries no health, no collision and no state.
 * Amber rather than violet, because violet is the Warden's and two glowing
 * violet objects in one scene would read as related.
 */
function buildAltar(disposables: Array<{ dispose(): void }>) {
  const group = new THREE.Group()
  group.name = 'DefenceAltarPlaceholder'
  const { altar } = GLOAMWOOD_DEFENCE
  group.position.set(altar.x, gloamwoodDefenceHeight(altar.x, altar.z), altar.z)

  const daisGeometry = new THREE.CylinderGeometry(altar.radius, altar.radius * 1.18, 0.7, 12)
  const daisMaterial = new THREE.MeshStandardMaterial({ color: 0x6f6a5e, roughness: 0.92, metalness: 0 })
  const dais = new THREE.Mesh(daisGeometry, daisMaterial)
  dais.position.y = 0.35
  dais.castShadow = true
  dais.receiveShadow = true
  group.add(dais)

  const coreGeometry = new THREE.OctahedronGeometry(0.85, 0)
  const coreMaterial = new THREE.MeshStandardMaterial({
    color: 0xf0b455,
    emissive: 0xd98a2b,
    emissiveIntensity: 1.5,
    roughness: 0.4,
    metalness: 0,
  })
  const core = new THREE.Mesh(coreGeometry, coreMaterial)
  core.position.y = 1.85
  core.castShadow = true
  group.add(core)

  const glow = new THREE.PointLight(0xffb457, 9, 16, 2)
  glow.position.y = 1.9
  group.add(glow)

  disposables.push(daisGeometry, daisMaterial, coreGeometry, coreMaterial)
  return { group, core }
}

function buildPortalMarker(disposables: Array<{ dispose(): void }>) {
  const { portal } = GLOAMWOOD_DEFENCE
  const geometry = new THREE.TorusGeometry(3.4, 0.5, 8, 20)
  const material = new THREE.MeshStandardMaterial({
    color: 0x54306b,
    emissive: 0x8b4bb4,
    emissiveIntensity: 1.2,
    roughness: 0.5,
    metalness: 0,
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.name = 'DefencePortalPlaceholder'
  mesh.position.set(portal.x, gloamwoodDefenceHeight(portal.x, portal.z) + 3, portal.z)
  mesh.castShadow = true
  disposables.push(geometry, material)
  return mesh
}

function instanceProps(
  props: readonly GloamwoodDefenceProp[],
  templates: Map<string, THREE.Group>,
  root: THREE.Group,
) {
  const byTemplate = new Map<string, GloamwoodDefenceProp[]>()
  for (const prop of props) {
    const variants = prop.kind === 'tree'
      ? GLOAMWOOD_TREE_VARIANTS
      : prop.kind === 'rock' ? GLOAMWOOD_ROCK_VARIANTS : GLOAMWOOD_VEGETATION_VARIANTS
    const variant = variants[prop.variant % variants.length]
    const key = `${prop.kind}:${variant.id}`
    const bucket = byTemplate.get(key)
    if (bucket) bucket.push(prop)
    else byTemplate.set(key, [prop])
  }

  const matrix = new THREE.Matrix4()
  const quaternion = new THREE.Quaternion()
  const position = new THREE.Vector3()
  const scale = new THREE.Vector3()
  let drawn = 0
  for (const [key, bucket] of byTemplate) {
    const template = templates.get(key)
    if (!template) continue
    const kind = key.split(':')[0] as GloamwoodDefenceProp['kind']
    // The kit loader normalises every template to unit height (or unit lateral
    // diameter for rocks), so the manifest's own size is what turns a scale
    // factor into world units.
    const variants = kind === 'tree'
      ? GLOAMWOOD_TREE_VARIANTS
      : kind === 'rock' ? GLOAMWOOD_ROCK_VARIANTS : GLOAMWOOD_VEGETATION_VARIANTS
    const variant = variants.find((entry) => entry.id === key.split(':')[1])
    const baseSize = kind === 'tree'
      ? (variant as { height?: number } | undefined)?.height ?? 8
      : kind === 'rock'
        ? (variant as { diameter?: number } | undefined)?.diameter ?? 2
        : (variant as { height?: number } | undefined)?.height ?? 1.2

    template.updateMatrixWorld(true)
    template.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return
      const instanced = new THREE.InstancedMesh(node.geometry, node.material, bucket.length)
      instanced.castShadow = kind !== 'plant'
      instanced.receiveShadow = true
      instanced.name = `Defence-${key}`
      for (let index = 0; index < bucket.length; index += 1) {
        const prop = bucket[index]
        const worldScale = baseSize * prop.scale
        position.set(prop.x, gloamwoodDefenceHeight(prop.x, prop.z), prop.z)
        quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), prop.rotation)
        scale.setScalar(worldScale)
        matrix.compose(position, quaternion, scale)
        matrix.multiply(node.matrixWorld)
        instanced.setMatrixAt(index, matrix)
      }
      instanced.instanceMatrix.needsUpdate = true
      root.add(instanced)
      drawn += bucket.length
    })
  }
  return drawn
}

export async function buildGloamwoodDefenceScene(options: {
  seed: number
  anisotropy: number
}): Promise<GloamwoodDefenceScene> {
  const root = new THREE.Group()
  root.name = 'GloamwoodDefence'
  const disposables: Array<{ dispose(): void }> = []
  const foliageTime = { value: 0 }

  const ground = buildGround(disposables)
  root.add(ground.mesh)

  const loader = new GLTFLoader()
  const templates = new Map<string, THREE.Group>()
  await Promise.all([
    ...GLOAMWOOD_TREE_VARIANTS.map(async (variant) => {
      templates.set(`tree:${variant.id}`, await loadGloamwoodKitTemplate(loader, variant.url, 'height', GLOAMWOOD_TREE_GRADE, foliageTime))
    }),
    ...GLOAMWOOD_ROCK_VARIANTS.map(async (variant) => {
      templates.set(`rock:${variant.id}`, await loadGloamwoodKitTemplate(loader, variant.url, 'lateral', GLOAMWOOD_ROCK_GRADE, foliageTime))
    }),
    ...GLOAMWOOD_VEGETATION_VARIANTS.map(async (variant) => {
      templates.set(`plant:${variant.id}`, await loadGloamwoodKitTemplate(loader, variant.url, variant.mode, GLOAMWOOD_VEGETATION_GRADE, foliageTime))
    }),
  ])

  const props = scatterGloamwoodDefence(options.seed)
  const drawn = instanceProps(props, templates, root)

  const altar = buildAltar(disposables)
  root.add(altar.group)
  root.add(buildPortalMarker(disposables))

  return {
    root,
    // The analytic surface rather than the drawn one. On this map they agree to
    // within the interpolation error of a one-unit quad on a smooth function,
    // which is far below the tolerance anything standing on it needs - unlike
    // the valley, whose drawn and generated grounds differ by up to three units.
    heightAt: gloamwoodDefenceHeight,
    altar: altar.group,
    stats: { props: drawn, groundVertices: ground.vertices },
    dispose() {
      for (const disposable of disposables) disposable.dispose()
    },
  }
}
