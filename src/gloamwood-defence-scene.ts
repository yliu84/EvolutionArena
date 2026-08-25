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

/**
 * Ground resolution.
 *
 * Halved from 1.0 when the bowl gained worn ground and moss: vertex colour can
 * only be as detailed as the vertices carrying it, and at one unit a path edge
 * was a staircase. 0.5 puts the mesh at about 21k vertices on a 52 x 104 map,
 * which is a rounding error next to one creature.
 */
const GROUND_QUAD = 0.5

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
 * Cheap value noise. Two octaves, because one reads as stripes.
 */
function grain(x: number, z: number, scale = 1) {
  const value = Math.sin(x * 0.71 * scale + z * 1.31 * scale) * 43758.5453
  const second = Math.sin(x * 1.93 * scale - z * 0.47 * scale) * 12793.113
  return ((value - Math.floor(value)) * 0.65 + (second - Math.floor(second)) * 0.35) - 0.5
}

function patches(x: number, z: number) {
  return grain(x, z, 0.34) * 0.6 + grain(x, z, 1.0) * 0.28 + grain(x, z, 3.1) * 0.12
}

/**
 * How trodden this point is, 0 to 1.
 *
 * Everything that ever walks this map goes from the road mouth to the altar
 * along one line, so that line is bare earth. It is the cheapest kind of
 * ground detail there is - it comes out of the layout rather than being
 * decorated on - and it doubles as a sign: a player who has never seen the map
 * can read where the traffic goes.
 */
function trodden(x: number, z: number) {
  const { altar, road } = GLOAMWOOD_DEFENCE
  if (z < road.endZ - 1 || z > altar.z + altar.radius) return 0
  const along = Math.max(0, Math.min(1, (z - road.endZ) / Math.max(0.001, altar.z - road.endZ)))
  // Fans out from the mouth and narrows again at the altar steps, which is the
  // shape a crowd funnelling onto one target actually wears into the ground.
  const halfWidth = 3.6 + Math.sin(along * Math.PI) * 3.2
  const across = Math.abs(x) / halfWidth
  if (across > 1) return 0
  const edge = 1 - across * across
  return edge * (0.35 + 0.65 * Math.sin(Math.min(1, along + 0.15) * Math.PI * 0.85))
}

/**
 * Vertex colour by what the ground *is*, so the regions read apart without a
 * texture.
 *
 * The first build painted each region one flat tone and rendered as a pale wash
 * under this rig; darker values with grain fixed the wash but left the bowl,
 * in the owner's words, 只有一片绿. Flat colour over 530 square units is flat
 * colour however well judged.
 *
 * So there are four things happening here now, and none of them costs a draw
 * call or a byte of texture: two octaves of patch noise, a moss-dark band at
 * the rim where the bank shades it, dry lighter ground toward the middle, and a
 * trodden path worn from the road mouth to the altar. Detail that a player can
 * still see past, which was the whole brief for this bowl.
 */
function groundTint(x: number, z: number, target: THREE.Color) {
  const speckle = patches(x, z) * 0.055
  if (gloamwoodDefenceWalkable(x, z)) {
    if (z <= GLOAMWOOD_DEFENCE.road.endZ) {
      // Bare trodden earth, with ruts.
      const rut = grain(x * 1.6, z * 0.4, 2.2) * 0.05
      return target.setRGB(
        0.169 + speckle + rut,
        0.115 + speckle * 0.8 + rut * 0.7,
        0.062 + speckle * 0.5 + rut * 0.4,
      )
    }
    const { arena } = GLOAMWOOD_DEFENCE
    const fromCentre = Math.hypot(x - arena.x, z - arena.z) / arena.radius
    // Moss gathers where the bank shades the rim; the open middle dries out.
    const moss = Math.max(0, fromCentre - 0.55) / 0.45
    const dry = Math.max(0, 0.7 - fromCentre) * 0.5
    const grass = {
      r: 0.077 + speckle * 0.7 + dry * 0.09 - moss * 0.018,
      g: 0.156 + speckle + dry * 0.055 - moss * 0.03,
      b: 0.062 + speckle * 0.7 + dry * 0.02 - moss * 0.012,
    }
    // The worn path, blended over the grass rather than replacing it, so its
    // edges are ragged instead of a stencil.
    const wear = trodden(x, z) * (0.72 + patches(x * 2.1, z * 2.1) * 0.5)
    const earth = { r: 0.163, g: 0.116, b: 0.068 }
    return target.setRGB(
      grass.r + (earth.r - grass.r) * wear,
      grass.g + (earth.g - grass.g) * wear,
      grass.b + (earth.b - grass.b) * wear,
    )
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
 * and a ground ring. The crystal is cool against warm stone, and the portal is
 * violet - the thing being defended and the thing attacking it are the two the
 * player must never have to think about telling apart.
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

  // Slightly elongated, so it reads as a cut crystal rather than a ball, and
  // flat-shaded so the facets survive. Smooth normals on an icosahedron blend
  // every face into its neighbour and the whole thing renders as a sphere.
  const heartGeometry = new THREE.IcosahedronGeometry(0.8, 0)
  heartGeometry.scale(0.86, 1.22, 0.86)
  /**
   * Ice-blue, flat-shaded, and lit far more than it glows.
   *
   * Three passes got this wrong in two different ways. Pushing
   * `emissiveIntensity` to 2.4 and then 3.2 rendered a white lump, because once
   * every channel of the emissive contribution clips above 1 the tone mapper
   * takes the result to white whatever colour was asked for. Dropping to a
   * saturated amber at 1.55 fixed the colour and left the second fault
   * untouched: **emissive does not vary with the surface normal**, so any
   * emissive strong enough to dominate erases the facets it is lighting. The
   * owner's read - "看不出来几面和边缘棱形了" - is exactly that.
   *
   * So the glow is turned right down and the form is carried by ordinary
   * shading, with a low roughness for facet highlights.
   *
   * The hue moved from amber to ice for contrast rather than taste: the dais is
   * warm pale stone and the bowl is warm green, and a gold gem on a tan plinth
   * has almost nothing to separate it. Cool against warm is the only pairing on
   * this map with real separation, and it keeps the altar clearly apart from
   * the portal's violet - the two things the player must never confuse.
   */
  const heartMaterial = new THREE.MeshStandardMaterial({
    color: 0x9fd8f5,
    emissive: 0x1d6f9e,
    emissiveIntensity: 0.5,
    roughness: 0.18,
    metalness: 0.15,
    flatShading: true,
  })
  const heart = new THREE.Mesh(heartGeometry, heartMaterial)
  heart.position.y = tierY + 1.5
  heart.castShadow = true
  group.add(heart)
  disposables.push(heartGeometry, heartMaterial)

  /**
   * Light orbiting the crystal, in place of the flat disc that used to sit
   * around it.
   *
   * The disc was a `RingGeometry` lying horizontally at the crystal's height,
   * and from the game's fixed three-quarter camera it read as exactly what it
   * was: a cardboard washer threaded onto the gem. A flat ring has no motion
   * except its own spin, which is invisible on a shape that is rotationally
   * symmetric, and nothing about it suggested the crystal was doing anything.
   *
   * Points on tilted orbits fix all of that at once. They pass in front of the
   * gem and then behind it - `depthTest` stays on, so the far half is genuinely
   * occluded - and that occlusion is what makes the eye read a volume of light
   * around the crystal rather than a decal stuck to it. Each one carries its own
   * radius, tilt, speed and phase, so no two share a path and the swarm never
   * settles into a pattern.
   */
  /**
   * A band of light around the crystal: a packed ribbon of small motes with a
   * scattering of much brighter ones riding inside it.
   *
   * Three passes to get here, and each failure is worth keeping.
   *
   * A `RingGeometry` disc lying flat at the crystal's height read as a cardboard
   * washer threaded onto the gem - a flat ring under a fixed three-quarter
   * camera has no form, and its only animation, spin, is invisible on a shape
   * that is rotationally symmetric.
   *
   * Scattering motes over a sphere instead fixed the flatness and broke
   * something else: with every mote on its own tilt it read as a swarm of
   * insects around the crystal.
   *
   * So: one orbital plane, tilted well off horizontal so it is unmistakably a
   * ring in three dimensions, with the motes packed close enough along it that
   * their halos fuse into a continuous ribbon. The bright ones give the ribbon
   * something to be made *of* - a smooth glowing band is just the flat ring
   * again with softer edges.
   *
   * The near half of the band passes in front of the gem and the far half
   * behind it. `depthTest` stays on, so that occlusion is real, and it is the
   * whole reason the ring reads as surrounding the crystal instead of being
   * painted over it.
   */
  const BAND_COUNT = 900
  const BAND_RADIUS = 1.55
  const BAND_TILT = 0.46
  /**
   * Billboarded quads, not `THREE.Points`.
   *
   * A custom points shader has to size itself in *pixels*, and the conversion
   * from a world radius to a pixel radius needs the viewport height, which this
   * module has no way to learn and would have to be re-fed on every resize. The
   * first attempt guessed the scale factor and every mote rendered under a pixel
   * wide, so the band was invisible. A quad expanded in view space is stated in
   * world units and is simply correct at any resolution.
   *
   * The orbit is evaluated in the vertex shader from a per-mote seed and one
   * clock uniform, so the geometry is uploaded once and never touched again -
   * 460 motes cost nothing per frame on the CPU.
   */
  const bandPositions = new Float32Array(BAND_COUNT * 4 * 3)
  const bandCorners = new Float32Array(BAND_COUNT * 4 * 2)
  const bandParams = new Float32Array(BAND_COUNT * 4 * 4)
  const bandIndices = new Uint16Array(BAND_COUNT * 6)
  const CORNERS = [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]]
  for (let index = 0; index < BAND_COUNT; index += 1) {
    // Irrational strides for the jitters, so no pattern can emerge; the angle
    // itself stays evenly spaced, because even spacing is what makes this a
    // band rather than a scatter.
    const jitter = (index * 0.6180339887) % 1
    const across = (index * 0.7548776662) % 1
    // Roughly one mote in fourteen is a bright one. Sparse enough that they read
    // as individual lights rather than as a second, brighter ribbon.
    const bright = index % 14 === 0
    const angle = (index / BAND_COUNT) * Math.PI * 2
    // Thickness, not scatter. Widen these and it becomes a swarm again.
    const radius = BAND_RADIUS + (jitter - 0.5) * 0.17
    const lift = (across - 0.5) * 0.12
    // Each mote drifts slightly faster or slower than the band, so the ribbon
    // shimmers along its length instead of turning as one rigid hoop.
    const drift = 0.94 + jitter * 0.13
    const size = bright ? 0.15 + across * 0.07 : 0.07 + across * 0.035
    for (let corner = 0; corner < 4; corner += 1) {
      const vertex = index * 4 + corner
      bandPositions[vertex * 3] = angle
      bandPositions[vertex * 3 + 1] = radius
      bandPositions[vertex * 3 + 2] = lift
      bandCorners[vertex * 2] = CORNERS[corner][0]
      bandCorners[vertex * 2 + 1] = CORNERS[corner][1]
      bandParams[vertex * 4] = size
      bandParams[vertex * 4 + 1] = drift
      bandParams[vertex * 4 + 2] = bright ? 1 : 0
      // Twinkle rate. The bright ones beat slowly and the ribbon fizzes.
      bandParams[vertex * 4 + 3] = bright ? 1.1 + across * 1.4 : 2.6 + across * 4.2
    }
    const base = index * 4
    bandIndices.set([base, base + 1, base + 2, base, base + 2, base + 3], index * 6)
  }
  const bandGeometry = new THREE.BufferGeometry()
  // `position` carries the orbit parameters, not a location: the vertex shader
  // turns (angle, radius, lift) into a point on the band. Named `position`
  // anyway because three requires the attribute to exist.
  bandGeometry.setAttribute('position', new THREE.BufferAttribute(bandPositions, 3))
  bandGeometry.setAttribute('aCorner', new THREE.BufferAttribute(bandCorners, 2))
  bandGeometry.setAttribute('aParams', new THREE.BufferAttribute(bandParams, 4))
  bandGeometry.setIndex(new THREE.BufferAttribute(bandIndices, 1))
  const orbitMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uPulse: { value: 0.5 },
      uTilt: { value: BAND_TILT },
      uTint: { value: new THREE.Color(0x5ec8f5) },
      uCore: { value: new THREE.Color(0xeaf8ff) },
    },
    vertexShader: `
      attribute vec2 aCorner;
      attribute vec4 aParams;
      uniform float uTime;
      uniform float uPulse;
      uniform float uTilt;
      varying vec2 vCorner;
      varying float vBright;
      varying float vAlpha;

      void main() {
        float angle = position.x + uTime * 0.6 * aParams.y;
        float radius = position.y;
        float lift = position.z;

        // The band's plane is tilted off horizontal, and the plane itself
        // precesses slowly around Y, so the ring is never seen at the same
        // angle twice and never looks painted on.
        float tilt = uTilt;
        float precession = uTime * 0.1;
        // Named level, not flat: flat is a reserved interpolation qualifier
        // in GLSL and the shader will not compile with it as a variable name.
        vec3 level = vec3(cos(angle) * radius, lift, sin(angle) * radius);
        vec3 tilted = vec3(
          level.x,
          level.y * cos(tilt) - level.z * sin(tilt),
          level.y * sin(tilt) + level.z * cos(tilt)
        );
        vec3 centre = vec3(
          tilted.x * cos(precession) + tilted.z * sin(precession),
          tilted.y,
          -tilted.x * sin(precession) + tilted.z * cos(precession)
        );

        float twinkle = 0.7 + sin(uTime * aParams.w + position.x * 7.3) * 0.3;
        vBright = aParams.z;
        // Weighted well down on the ribbon motes. At full game scale - the
        // crystal is about forty pixels tall - several hundred additive motes
        // on a ring this tight sum into one white glare that swallows the gem,
        // and the gem is the thing being defended. The ribbon reads at a
        // fraction of the brightness it needs when seen up close.
        // The altar's shared pulse only nudges the band. Driving it harder had
        // every mote peak on the same beat, and with bloom on top the whole
        // ring flared white about every four seconds.
        vAlpha = twinkle * mix(0.55, 1.0, aParams.z) * (0.88 + uPulse * 0.12);
        vCorner = aCorner;

        // Expanded in view space, which is what makes the quad face the camera
        // without any per-frame billboarding on the CPU.
        vec4 viewPosition = modelViewMatrix * vec4(centre, 1.0);
        viewPosition.xy += aCorner * aParams.x * mix(1.0, twinkle, aParams.z);
        gl_Position = projectionMatrix * viewPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uTint;
      uniform vec3 uCore;
      varying vec2 vCorner;
      varying float vBright;
      varying float vAlpha;

      void main() {
        float distance = length(vCorner) * 2.0;
        if (distance > 1.0) discard;
        // A wide soft halo, which is what fuses neighbouring motes into a
        // ribbon instead of leaving a dotted line...
        float halo = smoothstep(1.0, 0.0, distance);
        // ...and a small hard core inside it. The core is what makes a mote
        // read as light rather than as a smudge, and it is what a bloom pass
        // has to catch hold of.
        float core = smoothstep(0.5, 0.0, distance);
        // The ribbon motes keep more of the tint and only the bright ones go
        // to white, so the band reads as ice-blue light with hot points in it
        // rather than as a white cord.
        vec3 colour = mix(uTint, uCore, core * mix(0.3, 1.0, vBright));
        float alpha = (halo * halo * 0.34 + core * mix(0.7, 1.1, vBright)) * vAlpha;
        gl_FragColor = vec4(colour * alpha, alpha);
      }
    `,
  })
  const halo = new THREE.Mesh(bandGeometry, orbitMaterial)
  // The bounding sphere is computed from `position`, which holds orbit
  // parameters rather than coordinates, so it describes nothing real. Culling
  // against it would make the band flicker in and out.
  halo.frustumCulled = false
  group.add(halo)
  disposables.push(bandGeometry, orbitMaterial)

  const ringGeometry = new THREE.RingGeometry(altar.radius * 1.2, altar.radius * 1.52, 40).rotateX(-Math.PI / 2)
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0x86cdf0, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false,
  })
  const ring = new THREE.Mesh(ringGeometry, ringMaterial)
  ring.position.y = 0.05
  group.add(ring)
  disposables.push(ringGeometry, ringMaterial)

  const glow = new THREE.PointLight(0x8fd0f2, 11, 20, 2)
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
      orbitMaterial.uniforms.uTime.value = elapsed
      orbitMaterial.uniforms.uPulse.value = pulse
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
function moteTexture(
  mid = 'rgba(226,180,255,0.75)',
  edge = 'rgba(150,80,220,0)',
) {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const context = canvas.getContext('2d')
  if (context) {
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32)
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.35, mid)
    gradient.addColorStop(1, edge)
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

        // The hot band is deliberately over-range. Everything the bloom pass
        // sees is the linear buffer before tone mapping, and a value that never
        // exceeds 1.0 there can never bloom however bright it looks on screen -
        // the rift used to top out around 0.9 and got no glow at all. ACES pulls
        // these back into range on the way out, so the band reads as light
        // rather than as a white hole even with the effect switched off.
        vec3 deep = vec3(0.045, 0.012, 0.09);
        vec3 glow = vec3(1.1, 0.42, 1.7);
        // The bloom pass thresholds on *luminance*, which is 71% green and only
        // 7% blue, so a violet has to be pushed a long way over 1.0 before it
        // clears the bar. This peak lands around 1.35 against a threshold of
        // 1.15 - enough for the bright arms of the spiral to glow while the
        // duller parts of the lip stay ordinary light.
        vec3 hot = vec3(2.8, 2.1, 3.4);
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
    map: moteMap,
    // Over-range for the same reason as the rift's hot band: a mote clamped to
    // 1.0 sits below the bloom threshold and stays a flat dot.
    color: new THREE.Color(1.9, 1.25, 2.4),
    size: 0.42, transparent: true, opacity: 0.9,
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
