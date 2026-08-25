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
  /** Drives the altar's heart and the portal's gate. Called once a frame. */
  update(elapsed: number): void
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
 * The altar: a tiered shrine with a floating heart, and the thing a run is lost
 * by losing.
 *
 * The first pass was a cylinder with an octahedron on it, and the owner's read
 * was the right one - it was a placeholder that looked like a placeholder, in
 * the one spot on the map the player looks at most. It has to carry the weight
 * of "this is what you are here for" from across the bowl.
 *
 * Built rather than modelled because it is one object seen from one bearing at
 * a fixed distance: eight standing stones, three tiers, a slowly turning heart
 * and a ground ring. Amber throughout, deliberately - violet belongs to the
 * Warden and to the portal, and the two things the player must tell apart at a
 * glance are the thing being defended and the thing attacking it.
 */
function buildAltar(disposables: Array<{ dispose(): void }>) {
  const group = new THREE.Group()
  group.name = 'DefenceAltar'
  const { altar } = GLOAMWOOD_DEFENCE
  group.position.set(altar.x, gloamwoodDefenceHeight(altar.x, altar.z), altar.z)

  const stone = new THREE.MeshStandardMaterial({ color: 0x6b6558, roughness: 0.93, metalness: 0 })
  const carved = new THREE.MeshStandardMaterial({ color: 0x847a63, roughness: 0.86, metalness: 0 })
  const gilt = new THREE.MeshStandardMaterial({
    color: 0xd8a860, emissive: 0x6d3f10, emissiveIntensity: 0.9, roughness: 0.5, metalness: 0,
  })
  disposables.push(stone, carved, gilt)

  // Three tiers, widest at the bottom, so it reads as built rather than dropped.
  const tiers: Array<[number, number, number]> = [
    [altar.radius * 1.16, 0.5, 16],
    [altar.radius * 0.92, 0.42, 14],
    [altar.radius * 0.68, 0.36, 12],
  ]
  let tierY = 0
  for (const [radius, height, segments] of tiers) {
    const geometry = new THREE.CylinderGeometry(radius * 0.94, radius, height, segments)
    const mesh = new THREE.Mesh(geometry, stone)
    mesh.position.y = tierY + height / 2
    mesh.castShadow = true
    mesh.receiveShadow = true
    group.add(mesh)
    disposables.push(geometry)
    tierY += height
  }

  // Eight standing stones around the rim. They are what give it a silhouette
  // from across the bowl, where the tiers alone read as a low disc.
  const pillarGeometry = new THREE.CylinderGeometry(0.19, 0.26, 1.5, 6)
  disposables.push(pillarGeometry)
  const capGeometry = new THREE.OctahedronGeometry(0.2, 0)
  disposables.push(capGeometry)
  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2 + Math.PI / 8
    const radius = altar.radius * 0.86
    const pillar = new THREE.Mesh(pillarGeometry, carved)
    pillar.position.set(Math.cos(angle) * radius, tierY + 0.72, Math.sin(angle) * radius)
    pillar.rotation.y = angle
    pillar.castShadow = true
    group.add(pillar)
    const cap = new THREE.Mesh(capGeometry, gilt)
    cap.position.set(Math.cos(angle) * radius, tierY + 1.58, Math.sin(angle) * radius)
    group.add(cap)
  }

  const heartGeometry = new THREE.IcosahedronGeometry(0.78, 0)
  // Saturated emissive at *low* intensity, not a bright one.
  //
  // The first two attempts pushed emissiveIntensity to 2.4 and then 3.2 and got
  // a white lump both times. Once every channel of the emissive contribution
  // clips above 1, tone mapping takes the result to white no matter what colour
  // was asked for - so the fix is a colour with almost no blue in it, played
  // quietly, rather than a warm colour played loud.
  const heartMaterial = new THREE.MeshStandardMaterial({
    color: 0x50280a, emissive: 0xff6a0a, emissiveIntensity: 1.55, roughness: 0.26, metalness: 0,
  })
  const heart = new THREE.Mesh(heartGeometry, heartMaterial)
  heart.position.y = tierY + 1.5
  heart.castShadow = true
  group.add(heart)
  disposables.push(heartGeometry, heartMaterial)

  // A halo that catches the eye from the far rim, and a ground ring that says
  // where the thing being defended actually stands.
  const haloGeometry = new THREE.RingGeometry(0.95, 1.5, 28).rotateX(-Math.PI / 2)
  const haloMaterial = new THREE.MeshBasicMaterial({
    color: 0xff9a3c, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false,
  })
  const halo = new THREE.Mesh(haloGeometry, haloMaterial)
  halo.position.y = tierY + 1.5
  group.add(halo)
  disposables.push(haloGeometry, haloMaterial)

  const ringGeometry = new THREE.RingGeometry(altar.radius * 1.2, altar.radius * 1.52, 40).rotateX(-Math.PI / 2)
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xffb457, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false,
  })
  const ring = new THREE.Mesh(ringGeometry, ringMaterial)
  ring.position.y = 0.05
  group.add(ring)
  disposables.push(ringGeometry, ringMaterial)

  const glow = new THREE.PointLight(0xffb457, 11, 20, 2)
  glow.position.y = tierY + 1.6
  group.add(glow)

  return {
    group,
    update(elapsed: number) {
      heart.rotation.y = elapsed * 0.55
      heart.rotation.x = Math.sin(elapsed * 0.7) * 0.16
      const pulse = 0.5 + Math.sin(elapsed * 1.6) * 0.5
      heart.position.y = tierY + 1.5 + Math.sin(elapsed * 1.1) * 0.09
      halo.position.y = heart.position.y
      halo.rotation.y = -elapsed * 0.3
      haloMaterial.opacity = 0.34 + pulse * 0.22
      ringMaterial.opacity = 0.14 + pulse * 0.1
      glow.intensity = 9.5 + pulse * 3.5
    },
  }
}

/**
 * A soft round sprite for the drifting motes.
 *
 * `PointsMaterial` without a map draws hard squares, which at this size read as
 * scattered white confetti rather than as anything coming out of a rift. One
 * 64px radial gradient fixes it and costs nothing.
 */
function moteTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const context = canvas.getContext('2d')
  if (context) {
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32)
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.35, 'rgba(226,180,255,0.75)')
    gradient.addColorStop(1, 'rgba(150,80,220,0)')
    context.fillStyle = gradient
    context.fillRect(0, 0, 64, 64)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

/**
 * The portal: a broken stone arch with a rift turning inside it.
 *
 * The first build was a smooth torus over an additive disc, and the owner's
 * read was correct twice over. A perfect ring lit that brightly is a flat
 * cartoon donut with no form in it, and the shader's two low angular harmonics
 * - `sin(angle * 3)` against `sin(angle * -2)` - beat into a visible four-lobed
 * pinwheel, which is the "four-coloured circle" it looked like.
 *
 * So: the arch is built from irregular stone segments with varied lean and
 * size, which is what gives it form under a strong light; and the rift is wound
 * as a single tight spiral driven mostly by radius, because one arm wrapped
 * many times reads as smooth motion where a handful of arms reads as a fan.
 *
 * It is also drawn with normal blending rather than additive. Additive cannot
 * occlude, so the forest showed straight through the gate and it read as a hoop
 * with a smudge behind it instead of as a hole. The dark core is what sells it.
 *
 * Violet, matching the Warden, because everything that comes out of it is
 * hostile and the altar's amber is the other half of that pair.
 */
function buildPortal(disposables: Array<{ dispose(): void }>) {
  const group = new THREE.Group()
  group.name = 'DefencePortal'
  const { portal } = GLOAMWOOD_DEFENCE
  group.position.set(portal.x, gloamwoodDefenceHeight(portal.x, portal.z), portal.z)

  const RIFT_RADIUS = 3.5
  const CENTRE_Y = 4.1

  // Ruined masonry rather than a ring: nine blocks around the top two-thirds of
  // the circle, each with its own size and lean, and two heavy feet.
  // Pale weathered stone, not the dark purple the first pass used. Against a
  // forest this dark, a dark arch simply disappeared and left the rift floating
  // with a few loose blocks beside it.
  const stone = new THREE.MeshStandardMaterial({ color: 0x9a8fa4, roughness: 0.9, metalness: 0 })
  const stoneLit = new THREE.MeshStandardMaterial({
    color: 0xa295ae, emissive: 0x5c2585, emissiveIntensity: 0.75, roughness: 0.82, metalness: 0,
  })
  disposables.push(stone, stoneLit)
  const arch = new THREE.Group()
  const SEGMENTS = 9
  for (let index = 0; index < SEGMENTS; index += 1) {
    // Top two-thirds only, so the arch stands on the ground rather than
    // floating as a closed hoop.
    const angle = Math.PI * (0.08 + (index / (SEGMENTS - 1)) * 0.84)
    const wobble = Math.sin(index * 2.7) * 0.22
    // Chunky enough to touch their neighbours: the arc is about 11 units long
    // over nine blocks, so anything under 1.25 wide leaves the ring in pieces.
    const width = 1.5 + Math.sin(index * 1.9) * 0.26
    const depth = 1.15 + Math.cos(index * 2.3) * 0.2
    const geometry = new THREE.BoxGeometry(width, 1.85 + wobble, depth)
    const block = new THREE.Mesh(geometry, index % 3 === 0 ? stoneLit : stone)
    block.position.set(
      Math.cos(angle) * (RIFT_RADIUS + 0.85),
      CENTRE_Y + Math.sin(angle) * (RIFT_RADIUS + 0.85),
      0,
    )
    block.rotation.z = angle - Math.PI / 2 + wobble * 0.35
    block.rotation.y = wobble * 0.5
    block.castShadow = true
    block.receiveShadow = true
    arch.add(block)
    disposables.push(geometry)
  }
  for (const side of [-1, 1]) {
    const geometry = new THREE.BoxGeometry(2.4, 2.9, 1.9)
    const foot = new THREE.Mesh(geometry, stone)
    foot.position.set(side * (RIFT_RADIUS + 0.85), 1.45, 0)
    foot.rotation.z = side * 0.06
    foot.castShadow = true
    foot.receiveShadow = true
    arch.add(foot)
    disposables.push(geometry)
  }
  group.add(arch)

  const riftGeometry = new THREE.CircleGeometry(RIFT_RADIUS, 48)
  const riftMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec2 vUv;

      void main() {
        vec2 centred = vUv - 0.5;
        float radius = length(centred) * 2.0;
        float angle = atan(centred.y, centred.x);

        // One arm wound many times, not several arms. A low angular harmonic
        // beats against its neighbour and shows up as a fan; winding a single
        // arm through the radius reads as smooth rotation.
        float spiral = sin(angle - radius * 15.0 + uTime * 2.4) * 0.5 + 0.5;
        float fine = sin(angle * 2.0 - radius * 27.0 + uTime * 3.6) * 0.5 + 0.5;
        float streaks = spiral * 0.72 + fine * 0.28;

        // Dark at the centre, brightest in a band, gone at the rim: a hole with
        // light around its lip rather than a lit disc.
        float lip = smoothstep(0.08, 0.62, radius) * smoothstep(1.0, 0.66, radius);
        float throat = smoothstep(0.7, 0.0, radius);

        vec3 deep = vec3(0.045, 0.012, 0.09);
        vec3 glow = vec3(0.62, 0.24, 0.95);
        vec3 hot = vec3(0.93, 0.76, 1.0);
        vec3 colour = deep;
        colour = mix(colour, glow, lip * (0.45 + streaks * 0.55));
        colour = mix(colour, hot, lip * streaks * streaks * 0.5);

        // Opaque through the middle so the forest behind cannot be seen, easing
        // off only at the very rim where the stone takes over.
        float alpha = mix(0.97, 0.0, smoothstep(0.86, 1.0, radius));
        gl_FragColor = vec4(colour + throat * deep * 2.0, alpha);
      }
    `,
  })
  const rift = new THREE.Mesh(riftGeometry, riftMaterial)
  rift.position.y = CENTRE_Y
  group.add(rift)
  disposables.push(riftGeometry, riftMaterial)

  const moteCount = 52
  const motePositions = new Float32Array(moteCount * 3)
  const motePhase: number[] = []
  for (let index = 0; index < moteCount; index += 1) {
    motePhase.push((index / moteCount) * Math.PI * 2 + Math.sin(index * 3.1) * 0.6)
    motePositions[index * 3] = 0
    motePositions[index * 3 + 1] = 0
    motePositions[index * 3 + 2] = 0
  }
  const moteGeometry = new THREE.BufferGeometry()
  moteGeometry.setAttribute('position', new THREE.BufferAttribute(motePositions, 3))
  const moteMap = moteTexture()
  const moteMaterial = new THREE.PointsMaterial({
    map: moteMap, color: 0xd9aaff, size: 0.42, transparent: true, opacity: 0.9,
    depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
  })
  const motes = new THREE.Points(moteGeometry, moteMaterial)
  group.add(motes)
  disposables.push(moteGeometry, moteMaterial, moteMap)

  const spill = new THREE.PointLight(0x9d5bd6, 15, 28, 2)
  spill.position.set(0, CENTRE_Y, 1.4)
  group.add(spill)

  return {
    group,
    update(elapsed: number) {
      riftMaterial.uniforms.uTime.value = elapsed
      const pulse = 0.5 + Math.sin(elapsed * 1.7) * 0.5
      stoneLit.emissiveIntensity = 0.4 + pulse * 0.35
      spill.intensity = 12 + pulse * 6
      const attribute = moteGeometry.attributes.position as THREE.BufferAttribute
      for (let index = 0; index < moteCount; index += 1) {
        const phase = motePhase[index]
        // Spiralling out of the throat and rising, then wrapping. Reading the
        // motion as "coming out of it" is the whole job.
        const life = ((elapsed * 0.42 + index / moteCount) % 1)
        const spin = phase + life * 5.2
        const spread = life * RIFT_RADIUS * 0.92
        attribute.setX(index, Math.cos(spin) * spread)
        attribute.setY(index, CENTRE_Y + Math.sin(spin) * spread * 0.55 + life * 2.6)
        attribute.setZ(index, Math.sin(spin * 0.7) * 0.9 + life * 1.6)
      }
      attribute.needsUpdate = true
    },
  }
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
  const portal = buildPortal(disposables)
  root.add(portal.group)

  return {
    root,
    // The analytic surface rather than the drawn one. On this map they agree to
    // within the interpolation error of a one-unit quad on a smooth function,
    // which is far below the tolerance anything standing on it needs - unlike
    // the valley, whose drawn and generated grounds differ by up to three units.
    heightAt: gloamwoodDefenceHeight,
    altar: altar.group,
    stats: { props: drawn, groundVertices: ground.vertices },
    update(elapsed: number) {
      altar.update(elapsed)
      portal.update(elapsed)
    },
    dispose() {
      for (const disposable of disposables) disposable.dispose()
    },
  }
}
