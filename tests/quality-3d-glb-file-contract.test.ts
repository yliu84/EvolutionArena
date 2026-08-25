import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { QUALITY_3D_GLB_ASSETS } from '../src/quality-3d-glb-assets'
import { GLOAMWOOD_MODELLED_BOSSES } from '../src/gloamwood-3d-modelled-boss'

/**
 * The registry declares what each runtime GLB contains. Nothing checked that
 * the file agreed.
 *
 * `requiredClips` and `requiredNodes` are the contract every consumer trusts:
 * `setAction` looks a clip up by name and returns silently when it is missing,
 * which is exactly how the Shell stage-1 form shipped a chain step that played
 * nothing while damage still resolved. A dropped clip in a Blender export, or a
 * renamed mesh, would reach a player before anything failed.
 *
 * These assertions open the shipped binaries and read their glTF JSON chunk, so
 * they fail in CI rather than in play.
 */

const GLB_MAGIC = 0x46546c67
const CHUNK_JSON = 0x4e4f534a

function readGLBJson(publicUrl: string) {
  // Registry URLs are absolute public paths and carry a cache-busting query.
  const relative = publicUrl.split('?')[0].replace(/^\//, '')
  const buffer = readFileSync(new URL(`../public/${relative}`, import.meta.url))
  expect(buffer.readUInt32LE(0), `${relative} is not a binary glTF`).toBe(GLB_MAGIC)
  let offset = 12
  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32LE(offset)
    const type = buffer.readUInt32LE(offset + 4)
    if (type === CHUNK_JSON) {
      return JSON.parse(buffer.subarray(offset + 8, offset + 8 + length).toString('utf8'))
    }
    offset += 8 + length
  }
  throw new Error(`${relative} has no JSON chunk`)
}

describe('runtime GLB files match what the registry claims', () => {
  for (const asset of QUALITY_3D_GLB_ASSETS) {
    describe(`${asset.formId} (stage ${asset.stage})`, () => {
      const json = readGLBJson(asset.url)
      const animationNames: string[] = (json.animations ?? []).map((entry: { name: string }) => entry.name)
      const nodeNames: string[] = (json.nodes ?? []).map((entry: { name?: string }) => entry.name ?? '')

      it('contains every clip the registry requires', () => {
        for (const clip of asset.requiredClips) {
          expect(animationNames, `${asset.formId} is missing clip ${clip}`).toContain(clip)
        }
      })

      it('contains every node the registry requires', () => {
        for (const node of asset.requiredNodes) {
          expect(nodeNames, `${asset.formId} is missing node ${node}`).toContain(node)
        }
      })

      it('contains every bone the rig mapping addresses', () => {
        if (!asset.rig) return
        const rigBones = [asset.rig.body, asset.rig.head, ...asset.rig.feet, ...asset.rig.tail]
        for (const bone of rigBones) {
          expect(nodeNames, `${asset.formId} rig mapping names a missing bone ${bone}`).toContain(bone)
        }
      })

      it('ships no Meshy viewport helper', () => {
        // The Icosphere is 2.0 units across against creatures around 0.017, so
        // it becomes the bounding box the runtime scales by. The runtime hides
        // it defensively, but processing must delete it.
        expect(nodeNames).not.toContain('Icosphere')
      })
    })
  }

  it('gives every animated form a clip for each step of its chain', () => {
    // Slam is a clip name, not an action: the authority resolves Pounce and the
    // runtime redirects the clip for the shell family. Any other step must
    // exist under its own name.
    for (const asset of QUALITY_3D_GLB_ASSETS) {
      if (asset.motion !== 'embedded' || asset.requiredClips.length < 3) continue
      const json = readGLBJson(asset.url)
      const animationNames: string[] = (json.animations ?? []).map((entry: { name: string }) => entry.name)
      const isShell = asset.family === 'shell'
      for (const step of ['Bite', 'Pounce', 'Claw', 'TailSwipe'] as const) {
        if (!asset.requiredClips.includes(step)) continue
        const clip = isShell && step === 'Pounce' ? 'Slam' : step
        expect(animationNames, `${asset.formId} step ${step}`).toContain(clip)
      }
    }
  })
})

/**
 * Bosses were outside this guard entirely until the Gloamwood got a modelled
 * one.
 *
 * `updateModelledBoss` resolves a pattern to a clip name and calls
 * `model.clips.get(name)`. A miss is silent: the mixer is never told to play
 * anything, the boss stands still, and the authority goes on resolving the
 * telegraph, the strike and the damage. That is the same failure the player
 * forms are checked for above, on the fight that ends a run.
 */
describe('modelled boss GLB files carry the clips their config names', () => {
  for (const config of GLOAMWOOD_MODELLED_BOSSES) {
    const file = config.url.split('?')[0].split('/').pop() as string
    describe(file, () => {
      const json = readGLBJson(config.url)
      const animationNames: string[] = (json.animations ?? []).map((entry: { name: string }) => entry.name)

      it('contains idle, walk, hit and death', () => {
        for (const clip of [config.clips.idle, config.clips.walk, config.clips.hit, config.clips.death]) {
          expect(animationNames, `${file} is missing ${clip}`).toContain(clip)
        }
      })

      it('contains a clip for every boss pattern', () => {
        for (const [pattern, clip] of Object.entries(config.clips.patterns)) {
          expect(animationNames, `${file} names ${clip} for ${pattern} but does not carry it`).toContain(clip)
        }
      })

      it('ships no Meshy viewport helper', () => {
        const nodeNames: string[] = (json.nodes ?? []).map((entry: { name?: string }) => entry.name ?? '')
        expect(nodeNames).not.toContain('Icosphere')
      })
    })
  }

  it('gives the Gloamwood boss three different clips for its three patterns', () => {
    // The whole reason that body was modelled. The primitive assembly it
    // replaced drove all three patterns from one line of code, so Root Slam,
    // Thorn Charge and Spore Ring were told apart only by their ground decals.
    // Sharing a clip here would put that back without anything failing - and
    // two of the valley bosses do share one, deliberately, which is why this
    // assertion names the Gloamwood boss instead of applying to all of them.
    const warden = GLOAMWOOD_MODELLED_BOSSES.find((config) => config.url.includes('thornheart-warden'))
    expect(warden, 'the Gloamwood boss is not registered').toBeDefined()
    const clips = Object.values(warden!.clips.patterns)
    expect(clips).toHaveLength(3)
    expect(new Set(clips).size, `patterns share a clip: ${clips.join(', ')}`).toBe(3)
  })
})
