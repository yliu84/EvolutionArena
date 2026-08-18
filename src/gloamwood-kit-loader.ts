import * as THREE from 'three'
import type { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

import { assetUrl } from './asset-url'

/**
 * Loading and grading for the CC0 Quaternius nature kit.
 *
 * Lifted out of the hunt so the valley can use the same grade. Two maps built
 * from the same kit that grade it differently would read as two art styles, and
 * the difference would show up as "the new map looks wrong" long before anyone
 * traced it to a duplicated exposure constant.
 */
export interface GloamwoodKitGrade {
  saturation: number
  exposure: number
  tint: readonly [number, number, number]
  windAmp: number
}

export const GLOAMWOOD_TREE_GRADE: GloamwoodKitGrade = { saturation: -0.06, exposure: 0.72, tint: [0.92, 0.98, 0.86], windAmp: 0.038 }
export const GLOAMWOOD_ROCK_GRADE: GloamwoodKitGrade = { saturation: -0.12, exposure: 0.68, tint: [1, 1, 1], windAmp: 0 }
export const GLOAMWOOD_VEGETATION_GRADE: GloamwoodKitGrade = { saturation: -0.02, exposure: 0.92, tint: [1.02, 1.06, 0.78], windAmp: 0.22 }

/**
 * Loads a kit GLB and normalizes it: ground contact at y=0, centred on x/z, and
 * unit height (trees, plants) or unit lateral diameter (rocks), so the footprint
 * numbers in the manifest translate straight into world units.
 */
export async function loadGloamwoodKitTemplate(
  loader: GLTFLoader,
  url: string,
  mode: 'height' | 'lateral',
  grade: GloamwoodKitGrade,
  foliageTime: { value: number },
) {
  const gltf = await loader.loadAsync(assetUrl(url))
  const source = gltf.scene
  source.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return
    node.castShadow = true
    node.receiveShadow = true
    const hasVertexColors = Boolean(node.geometry.attributes.color)
    node.material = Array.isArray(node.material)
      ? node.material.map((material) => toGloamwoodKitMaterial(material, grade, hasVertexColors, foliageTime))
      : toGloamwoodKitMaterial(node.material, grade, hasVertexColors, foliageTime)
  })
  const box = new THREE.Box3().setFromObject(source)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())
  source.position.set(-center.x, -box.min.y, -center.z)
  const wrapper = new THREE.Group()
  wrapper.add(source)
  const extent = mode === 'height' ? size.y : Math.max(size.x, size.z)
  wrapper.scale.setScalar(1 / Math.max(extent, 0.0001))
  return wrapper
}

export function toGloamwoodKitMaterial(
  material: THREE.Material,
  grade: GloamwoodKitGrade,
  vertexColors: boolean,
  foliageTime: { value: number },
) {
  const color = 'color' in material && material.color instanceof THREE.Color
    ? material.color.clone()
    : new THREE.Color(0xffffff)
  color.offsetHSL(0, grade.saturation, 0)
  color.multiplyScalar(grade.exposure)
  color.r *= grade.tint[0]
  color.g *= grade.tint[1]
  color.b *= grade.tint[2]
  const map = 'map' in material && material.map instanceof THREE.Texture ? material.map : null
  const name = `${material.name} ${map?.name ?? ''}`
  const isFoliage = material.transparent
    || material.alphaTest > 0
    || /leaf|leaves|grass|fern|plant|bush/i.test(name)
  const lit = new THREE.MeshStandardMaterial({
    color,
    map,
    roughness: 0.92,
    metalness: 0,
    // Foliage vertex colors in this kit darken billboard cards to near-black
    // under the overhead camera; keep them on bark/rock only.
    vertexColors: vertexColors && !isFoliage,
    side: isFoliage ? THREE.DoubleSide : THREE.FrontSide,
    alphaTest: isFoliage && map ? 0.18 : 0,
    transparent: false,
    depthWrite: true,
  })
  if (isFoliage && grade.windAmp > 0) applyGloamwoodFoliageWind(lit, grade.windAmp, foliageTime)
  return lit
}

export function applyGloamwoodFoliageWind(
  material: THREE.MeshStandardMaterial,
  amplitude: number,
  foliageTime: { value: number },
) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uFoliageTime = foliageTime
    shader.uniforms.uWindAmp = { value: amplitude }
    shader.vertexShader = `uniform float uFoliageTime;\nuniform float uWindAmp;\n${shader.vertexShader}`
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      {
        float lift = clamp(transformed.y * 0.18, 0.0, 1.0);
        vec3 windPos = transformed;
        #ifdef USE_INSTANCING
          windPos = (instanceMatrix * vec4(transformed, 1.0)).xyz;
        #endif
        float gust = sin(uFoliageTime * 1.18 + windPos.x * 0.42 + windPos.z * 0.31);
        transformed.x += gust * uWindAmp * lift;
        transformed.z += cos(uFoliageTime * 0.94 + windPos.z * 0.27) * uWindAmp * 0.65 * lift;
      }`,
    )
  }
  material.customProgramCacheKey = () => `gloamwood-foliage-wind:${amplitude}`
}
