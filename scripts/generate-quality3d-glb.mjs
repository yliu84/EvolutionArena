import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

class NodeFileReader {
  result = null
  onloadend = null
  onerror = null
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((result) => {
      this.result = result
      this.onloadend?.({ target: this })
    }).catch((error) => this.onerror?.(error))
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((result) => {
      this.result = `data:${blob.type};base64,${Buffer.from(result).toString('base64')}`
      this.onloadend?.({ target: this })
    }).catch((error) => this.onerror?.(error))
  }
}
globalThis.FileReader ??= NodeFileReader

const outputDirectory = resolve('public/assets/quality-3d/models')
const exporter = new GLTFExporter()

function material(name, color, roughness = 0.55, metalness = 0.05, emissive = 0) {
  const value = new THREE.MeshStandardMaterial({ color, roughness, metalness, emissive, emissiveIntensity: emissive ? 0.35 : 0 })
  value.name = name
  return value
}

function part(parent, name, geometry, surface, position, scale = [1, 1, 1], rotation = [0, 0, 0]) {
  const mesh = new THREE.Mesh(geometry, surface)
  mesh.name = name
  mesh.position.set(...position)
  mesh.scale.set(...scale)
  mesh.rotation.set(...rotation)
  mesh.castShadow = true
  mesh.receiveShadow = true
  parent.add(mesh)
  return mesh
}

function joint(parent, name, position = [0, 0, 0]) {
  const group = new THREE.Group()
  group.name = name
  group.position.set(...position)
  parent.add(group)
  return group
}

function capsuleBetween(parent, name, from, to, radius, surface) {
  const start = new THREE.Vector3(...from)
  const end = new THREE.Vector3(...to)
  const vector = end.clone().sub(start)
  const mesh = part(parent, name, new THREE.CapsuleGeometry(radius, Math.max(0.02, vector.length() - radius * 2), 8, 14), surface, start.clone().add(end).multiplyScalar(0.5).toArray())
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vector.normalize())
  return mesh
}

function wing(parent, name, side, span, chord, membrane, bone) {
  const root = joint(parent, name, [0.1, 1.12, side * 0.34])
  const points = [
    [0, 0, 0], [0.15, 0.24, side * span * 0.52], [-chord * 0.28, 0.12, side * span],
    [-chord * 0.9, -0.12, side * span * 0.7], [-chord, -0.2, side * span * 0.18],
  ]
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points.flat(), 3))
  geometry.setIndex([0, 1, 2, 0, 2, 3, 0, 3, 4])
  geometry.computeVertexNormals()
  part(root, `${name}_Membrane`, geometry, membrane, [0, 0, 0])
  for (const [index, point] of points.slice(1).entries()) capsuleBetween(root, `${name}_Bone_${index}`, [0, 0, 0], point, 0.035, bone)
  return root
}

function tail(parent, surface, accent, count, length, radius, startY = 0.78) {
  const joints = []
  let owner = parent
  for (let index = 0; index < count; index += 1) {
    const segmentLength = length / count
    const node = joint(owner, `Tail_${index}`, [index === 0 ? -1 : -segmentLength * 0.86, index === 0 ? startY : 0, 0])
    part(node, `TailMesh_${index}`, new THREE.CapsuleGeometry(Math.max(0.045, radius * (1 - index / count * 0.82)), segmentLength * 0.65, 7, 12), index % 2 ? accent : surface, [-segmentLength * 0.43, 0, 0], [1, 1, 1], [0, 0, Math.PI / 2])
    joints.push(node)
    owner = node
  }
  return joints
}

function leg(parent, name, x, side, height, upperMaterial, lowerMaterial, clawMaterial, heavy = false) {
  const hip = joint(parent, name, [x, height + 0.1, side * (heavy ? 0.72 : 0.5)])
  part(hip, `${name}_Thigh`, new THREE.CapsuleGeometry(heavy ? 0.2 : 0.13, height * 0.33, 7, 12), upperMaterial, [0, -height * 0.25, 0], [1, 1, 1], [0, 0, side > 0 ? -0.14 : 0.14])
  part(hip, `${name}_Shin`, new THREE.CapsuleGeometry(heavy ? 0.15 : 0.1, height * 0.34, 7, 12), lowerMaterial, [0.1, -height * 0.68, 0], [1, 1, 1], [0, 0, -0.22])
  const paw = part(hip, `${name}_Paw`, new THREE.SphereGeometry(0.22, 14, 9), lowerMaterial, [0.25, -height, 0], [1.5, 0.45, 0.9])
  for (const toe of [-1, 0, 1]) part(paw, `${name}_Claw_${toe + 1}`, new THREE.ConeGeometry(0.035, 0.23, 7), clawMaterial, [0.2, -0.02, toe * 0.1], [1, 1, 1], [0, 0, -Math.PI / 2])
  return hip
}

function numberTrack(node, axis, values, times = [0, 0.5, 1]) {
  const euler = new THREE.Euler()
  const quaternion = new THREE.Quaternion()
  const quaternionValues = values.flatMap((value) => {
    euler.set(0, 0, 0)
    euler[axis] = value
    quaternion.setFromEuler(euler)
    return quaternion.toArray()
  })
  return new THREE.QuaternionKeyframeTrack(`${node}.quaternion`, times, quaternionValues)
}

function positionTrack(node, axis, values, times = [0, 0.5, 1]) {
  return new THREE.NumberKeyframeTrack(`${node}.position[${axis}]`, times, values)
}

function createHatchling() {
  const root = joint(new THREE.Group(), 'HatchlingRoot')
  root.parent.name = 'MossHatchlingGLB'
  const green = material('MossScales', 0x78b86b, 0.62)
  const dark = material('ForestMarkings', 0x285846, 0.7)
  const belly = material('WarmBelly', 0xe2ce80, 0.68)
  const coral = material('CoralDetails', 0xea8468, 0.48)
  const eye = material('AmberEyes', 0xffb52e, 0.25, 0, 0x5b2100)
  const body = joint(root, 'Body')
  part(body, 'RoundTorso', new THREE.SphereGeometry(0.5, 28, 20), green, [0, 0.74, 0], [1.18, 0.56, 0.68])
  part(body, 'Belly', new THREE.SphereGeometry(0.5, 24, 16), belly, [0.2, 0.53, 0], [0.82, 0.22, 0.48])
  const head = joint(body, 'Head', [1.05, 0.93, 0])
  part(head, 'BabySkull', new THREE.SphereGeometry(0.5, 26, 18), green, [0, 0, 0], [0.7, 0.58, 0.64])
  part(head, 'SoftSnout', new THREE.CapsuleGeometry(0.22, 0.42, 8, 14), belly, [0.56, -0.08, 0], [1, 1, 1], [0, 0, Math.PI / 2])
  for (const side of [-1, 1]) part(head, `Eye_${side}`, new THREE.SphereGeometry(0.105, 14, 10), eye, [0.22, 0.18, side * 0.31])
  for (let index = 0; index < 5; index += 1) part(body, `BackBud_${index}`, new THREE.SphereGeometry(0.1, 10, 7), coral, [0.45 - index * 0.28, 1.08, 0], [1, 0.7 + index * 0.08, 1])
  const legs = [leg(body, 'LegFL', 0.45, -1, 0.52, green, dark, belly), leg(body, 'LegFR', 0.45, 1, 0.52, green, dark, belly), leg(body, 'LegBL', -0.42, -1, 0.5, green, dark, belly), leg(body, 'LegBR', -0.42, 1, 0.5, green, dark, belly)]
  const tails = tail(body, green, dark, 7, 1.75, 0.2)
  const idle = new THREE.AnimationClip('Idle', 1.6, [positionTrack('Body', 'y', [0, 0.035, 0], [0, 0.8, 1.6]), numberTrack('Head', 'z', [-0.025, 0.035, -0.025], [0, 0.8, 1.6]), ...tails.slice(0, 4).map((node, index) => numberTrack(node.name, 'y', [-0.06, 0.08 + index * 0.015, -0.06], [0, 0.8, 1.6]))])
  const run = new THREE.AnimationClip('Run', 0.64, [positionTrack('Body', 'y', [0, 0.07, 0], [0, 0.32, 0.64]), ...legs.map((node, index) => numberTrack(node.name, 'z', index % 2 ? [-0.42, 0.42, -0.42] : [0.42, -0.42, 0.42], [0, 0.32, 0.64])), ...tails.slice(0, 5).map((node, index) => numberTrack(node.name, 'y', [-0.12, 0.14 + index * 0.02, -0.12], [0, 0.32, 0.64]))])
  return { scene: root.parent, animations: [idle, run] }
}

function createWyvern() {
  const scene = new THREE.Group(); scene.name = 'AzureWyvernGLB'
  const root = joint(scene, 'WyvernRoot')
  const blue = material('AzureScales', 0x397ed0, 0.42, 0.12)
  const navy = material('DeepBlueArmor', 0x153861, 0.55)
  const cyan = material('CyanEdges', 0x73f3e8, 0.35, 0.08, 0x06342e)
  const membrane = material('SkyMembrane', 0x2769bb, 0.5)
  membrane.side = THREE.DoubleSide
  const bone = material('WingBones', 0x102b4b, 0.62)
  const body = joint(root, 'Body')
  part(body, 'KeelTorso', new THREE.CapsuleGeometry(0.44, 1.45, 10, 20), blue, [0, 1.08, 0], [1, 1.05, 0.9], [0, 0, Math.PI / 2])
  part(body, 'FlightChest', new THREE.SphereGeometry(0.5, 26, 18), navy, [0.52, 1.05, 0], [1.0, 1.34, 1.05])
  const neck = joint(body, 'Neck', [0.72, 1.34, 0])
  capsuleBetween(neck, 'LongNeck', [0, 0, 0], [0.86, 0.48, 0], 0.25, blue)
  const head = joint(neck, 'Head', [0.92, 0.55, 0])
  part(head, 'WyvernSkull', new THREE.DodecahedronGeometry(0.48, 1), blue, [0, 0, 0], [1.05, 0.78, 0.82])
  part(head, 'RaptorMuzzle', new THREE.CapsuleGeometry(0.19, 0.62, 8, 14), navy, [0.66, -0.11, 0], [1, 1, 1], [0, 0, Math.PI / 2])
  for (const side of [-1, 1]) { part(head, `Eye_${side}`, new THREE.SphereGeometry(0.08, 12, 8), cyan, [0.2, 0.16, side * 0.34]); part(head, `Horn_${side}`, new THREE.ConeGeometry(0.09, 0.58, 8), bone, [-0.28, 0.32, side * 0.25], [1, 1, 1], [side * 0.2, 0, -0.7]) }
  const legs = [leg(body, 'LegBL', -0.38, -1, 0.92, blue, navy, cyan), leg(body, 'LegBR', -0.38, 1, 0.92, blue, navy, cyan)]
  const wings = [wing(body, 'WingL', -1, 3.05, 1.75, membrane, bone), wing(body, 'WingR', 1, 3.05, 1.75, membrane, bone)]
  const tails = tail(body, blue, navy, 9, 3.1, 0.24, 1.0)
  const idle = new THREE.AnimationClip('Idle', 1.8, [positionTrack('Body', 'y', [0, 0.055, 0], [0, 0.9, 1.8]), numberTrack('WingL', 'x', [-0.16, -0.28, -0.16], [0, 0.9, 1.8]), numberTrack('WingR', 'x', [0.16, 0.28, 0.16], [0, 0.9, 1.8]), numberTrack('Head', 'z', [-0.02, 0.04, -0.02], [0, 0.9, 1.8])])
  const run = new THREE.AnimationClip('Run', 0.72, [positionTrack('Body', 'y', [0, 0.08, 0], [0, 0.36, 0.72]), ...legs.map((node, index) => numberTrack(node.name, 'z', index ? [-0.5, 0.46, -0.5] : [0.5, -0.46, 0.5], [0, 0.36, 0.72])), numberTrack(wings[0].name, 'z', [-0.08, 0.16, -0.08], [0, 0.36, 0.72]), numberTrack(wings[1].name, 'z', [0.08, -0.16, 0.08], [0, 0.36, 0.72]), ...tails.slice(0, 5).map((node, index) => numberTrack(node.name, 'y', [-0.1, 0.16 + index * 0.018, -0.1], [0, 0.36, 0.72]))])
  return { scene, animations: [idle, run] }
}

function createAncient() {
  const scene = new THREE.Group(); scene.name = 'GoldenAncientGLB'
  const root = joint(scene, 'AncientRoot')
  const gold = material('RoyalGoldScales', 0xe0ad36, 0.32, 0.42)
  const ruby = material('RubyUnderplate', 0x8e263b, 0.45, 0.12)
  const ivory = material('IvoryCrown', 0xffe5a0, 0.6, 0.08)
  const membrane = material('CrimsonMembrane', 0xac2640, 0.42, 0.06)
  membrane.side = THREE.DoubleSide
  const body = joint(root, 'Body')
  part(body, 'MassiveChest', new THREE.DodecahedronGeometry(0.72, 2), gold, [0.25, 1.42, 0], [1.65, 1.35, 1.35])
  part(body, 'DeepRibcage', new THREE.SphereGeometry(0.58, 28, 20), ruby, [-0.55, 1.25, 0], [1.7, 1.18, 1.25])
  for (let index = 0; index < 8; index += 1) part(body, `ArmorPlate_${index}`, new THREE.DodecahedronGeometry(0.24, 1), ivory, [0.68 - index * 0.24, 2.12 - Math.abs(index - 3) * 0.025, (index % 2 ? -1 : 1) * 0.15], [1.25, 0.42, 1])
  const neck = joint(body, 'Neck', [0.94, 1.62, 0])
  capsuleBetween(neck, 'CrownedNeck', [0, 0, 0], [1.1, 0.76, 0], 0.38, gold)
  const head = joint(neck, 'Head', [1.22, 0.86, 0])
  part(head, 'DragonSkull', new THREE.DodecahedronGeometry(0.58, 1), gold, [0, 0, 0], [1.3, 0.88, 0.96])
  part(head, 'UpperJaw', new THREE.CapsuleGeometry(0.26, 0.95, 9, 16), ruby, [0.9, -0.05, 0], [1, 1, 1], [0, 0, Math.PI / 2])
  part(head, 'LowerJaw', new THREE.CapsuleGeometry(0.19, 0.82, 8, 14), ivory, [0.87, -0.31, 0], [1, 1, 1], [0, 0, Math.PI / 2])
  for (const side of [-1, 1]) { part(head, `Eye_${side}`, new THREE.SphereGeometry(0.1, 14, 10), ivory, [0.28, 0.2, side * 0.46]); part(head, `CrownHorn_${side}`, new THREE.ConeGeometry(0.13, 1.08, 9), ivory, [-0.3, 0.55, side * 0.34], [1, 1, 1], [side * 0.16, 0, -0.82]) }
  const legs = [leg(body, 'LegFL', 0.62, -1, 1.22, gold, ruby, ivory, true), leg(body, 'LegFR', 0.62, 1, 1.22, gold, ruby, ivory, true), leg(body, 'LegBL', -0.72, -1, 1.18, gold, ruby, ivory, true), leg(body, 'LegBR', -0.72, 1, 1.18, gold, ruby, ivory, true)]
  const wings = [wing(body, 'WingL', -1, 4.25, 2.5, membrane, ivory), wing(body, 'WingR', 1, 4.25, 2.5, membrane, ivory)]
  const tails = tail(body, gold, ruby, 11, 4.25, 0.34, 1.28)
  const idle = new THREE.AnimationClip('Idle', 2.4, [positionTrack('Body', 'y', [0, 0.045, 0], [0, 1.2, 2.4]), numberTrack('Head', 'z', [-0.025, 0.035, -0.025], [0, 1.2, 2.4]), numberTrack('WingL', 'x', [-0.1, -0.19, -0.1], [0, 1.2, 2.4]), numberTrack('WingR', 'x', [0.1, 0.19, 0.1], [0, 1.2, 2.4])])
  const run = new THREE.AnimationClip('Run', 1.05, [positionTrack('Body', 'y', [0, 0.09, 0], [0, 0.525, 1.05]), ...legs.map((node, index) => numberTrack(node.name, 'z', index % 2 ? [-0.34, 0.34, -0.34] : [0.34, -0.34, 0.34], [0, 0.525, 1.05])), ...tails.slice(0, 6).map((node, index) => numberTrack(node.name, 'y', [-0.07, 0.1 + index * 0.012, -0.07], [0, 0.525, 1.05]))])
  return { scene, animations: [idle, run] }
}

async function exportAsset(filename, create) {
  const { scene, animations } = create()
  scene.traverse((node) => { if (node.isMesh) node.geometry.computeVertexNormals() })
  const binary = await exporter.parseAsync(scene, { binary: true, animations, onlyVisible: false, trs: true })
  const target = resolve(outputDirectory, filename)
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, Buffer.from(binary))
  return { target, bytes: binary.byteLength, meshes: scene.getObjectsByProperty('isMesh', true).length, clips: animations.map((clip) => clip.name) }
}

const results = await Promise.all([
  exportAsset('moss-hatchling-v1.glb', createHatchling),
  exportAsset('azure-wyvern-v1.glb', createWyvern),
  exportAsset('golden-ancient-v1.glb', createAncient),
])
console.log(JSON.stringify(results, null, 2))
