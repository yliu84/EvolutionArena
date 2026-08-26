import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { defineGloamwoodTunable } from './gloamwood-tuning'

/**
 * Bloom, and the reason the game did not have any.
 *
 * The project has spent a lot of emissive material - the altar's crystal, the
 * portal's rift, the Warden's seams and eyes, the Swarm line's spore sacs, every
 * elite marker and telegraph decal - and none of it read as *light*. A surface
 * with a high emissive value is just a bright surface; what makes an eye look
 * lit is the glow spilling past its silhouette, and that only comes from a
 * post-processing pass. Three separate colour problems this project chased -
 * the altar crystal going white, the portal reading as a hoop with a smudge,
 * the ground washing out - were all people reaching for bloom's job with
 * material settings.
 *
 * Kept in its own module because it owns render targets, has to be resized, and
 * has to be able to fail without taking the frame with it.
 */

export interface GloamwoodBloomSettings {
  /** How much of the extracted highlight is mixed back in. */
  strength: number
  /** How far the glow spreads past the silhouette that threw it. */
  radius: number
  /**
   * How bright a pixel must be before it blooms at all.
   *
   * The single most important number here, and the one that was measured rather
   * than guessed. It is read against the composer's **linear, pre-tone-mapping**
   * buffer, not against the picture on screen - a distinction that matters
   * enormously, because the scene renders with an exposure of 1.38 and ACES
   * behind it, so a surface displayed at a comfortable mid grey is nowhere near
   * 1.0 in that buffer.
   *
   * Sweeping the threshold on a frozen frame and watching where the median
   * luminance stops moving put the knee just above 1.1: at 1.0 the whole image
   * lifted, and from about 1.15 upward only the top percentile moved. Sitting
   * just above the knee is what separates "the emissive things glow" from "the
   * screen is hazy", which is the version of this effect people turn off.
   */
  threshold: number
}

const BLOOM_STRENGTH = defineGloamwoodTunable({
  id: 'GLOAMWOOD_BLOOM.strength', group: 'Bloom', label: 'Strength',
  value: 1, min: 0, max: 2.5, step: 0.05,
})
const BLOOM_RADIUS = defineGloamwoodTunable({
  id: 'GLOAMWOOD_BLOOM.radius', group: 'Bloom', label: 'Radius',
  value: 0.6, min: 0, max: 1.2, step: 0.05,
})
const BLOOM_THRESHOLD = defineGloamwoodTunable({
  id: 'GLOAMWOOD_BLOOM.threshold', group: 'Bloom', label: 'Threshold',
  value: 1.15, min: 0.3, max: 2.5, step: 0.05,
  note: 'Read against the linear buffer, not the picture. Measured: below 1.1 the whole image lifts.',
})

export const GLOAMWOOD_BLOOM: GloamwoodBloomSettings = {
  get strength() { return BLOOM_STRENGTH.value },
  get radius() { return BLOOM_RADIUS.value },
  get threshold() { return BLOOM_THRESHOLD.value },
}

export interface GloamwoodBloomPipeline {
  render(): void
  setSize(width: number, height: number, pixelRatio: number): void
  dispose(): void
}

/**
 * Build the composer, or return null if this device cannot have it.
 *
 * Null is a supported answer rather than an error. The caller keeps its plain
 * `renderer.render` path and the game looks exactly as it did - which is the
 * behaviour that matters, because bloom is the kind of feature that must never
 * be the reason a frame does not appear.
 */
export function createGloamwoodBloom(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  settings: GloamwoodBloomSettings = GLOAMWOOD_BLOOM,
): GloamwoodBloomPipeline | null {
  try {
    const size = renderer.getSize(new THREE.Vector2())
    const pixelRatio = renderer.getPixelRatio()
    // A multisampled target, because the composer replaces the one place
    // antialiasing was happening.
    //
    // The renderer is built with `antialias: true`, which is MSAA on the
    // default framebuffer - and the moment a composer is in front of it the
    // scene stops being drawn there. Measured on a paused frame, switching the
    // composer in with the bloom's own strength set to zero still moved the
    // 99th-percentile luminance from 0.705 to 0.756: that was every bright edge
    // in the scene going hard. Bloom that quietly costs the game its
    // antialiasing is a bad trade at any strength.
    const target = new THREE.WebGLRenderTarget(size.x * pixelRatio, size.y * pixelRatio, {
      type: THREE.HalfFloatType,
      samples: 4,
    })
    const composer = new EffectComposer(renderer, target)
    composer.setPixelRatio(pixelRatio)
    composer.setSize(size.x, size.y)
    composer.addPass(new RenderPass(scene, camera))
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(size.x, size.y),
      settings.strength,
      settings.radius,
      settings.threshold,
    )
    composer.addPass(bloom)
    // Tone mapping and the sRGB conversion move to the end of the chain.
    //
    // This is the ordering that makes bloom look right rather than milky: the
    // scene renders and blooms in linear space, and the tone mapper sees the
    // sum. Leaving the renderer to tone-map first would have the bloom pass
    // adding LDR light on top of an already-compressed image, which is how a
    // glow turns into a grey haze.
    composer.addPass(new OutputPass())

    return {
      render: () => {
        // Re-read every frame rather than only at construction, so the tuning
        // panel can move these while looking at the thing they change. Three
        // property writes; the pass reads them on the same frame.
        bloom.strength = settings.strength
        bloom.radius = settings.radius
        bloom.threshold = settings.threshold
        composer.render()
      },
      setSize: (width, height, pixelRatio) => {
        composer.setPixelRatio(pixelRatio)
        composer.setSize(width, height)
        bloom.setSize(width, height)
      },
      dispose: () => {
        bloom.dispose()
        composer.dispose()
      },
    }
  } catch (error) {
    console.warn('Bloom unavailable; falling back to a direct render.', error)
    return null
  }
}

/**
 * Whether this run should have bloom at all.
 *
 * `?bloom=0` turns it off and `?bloom=1` forces it on. The default is on: it is
 * one full-screen pass at half resolution and the cost is small next to what
 * this scene already draws - but the project still has no frame-rate reading
 * from a real mid-range device, so the override exists to be used the moment
 * one says otherwise.
 */
export function gloamwoodBloomRequested(search: string) {
  const requested = new URLSearchParams(search).get('bloom')
  if (requested === '0' || requested === 'off') return false
  return true
}
