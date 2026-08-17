import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { QUALITY_3D_GLB_ASSETS } from '../src/quality-3d-glb-assets'

const MODEL_DIRECTORY = new URL('../public/assets/quality-3d/models/', import.meta.url)

/**
 * Everything under public/ is copied verbatim into dist and served to players,
 * so the directory is a contract, not a scratch space. Authoring intermediates
 * belong in art-source/, which is tracked and never built.
 */
describe('The served payload holds runtime assets only', () => {
  const registryFiles = new Set(
    QUALITY_3D_GLB_ASSETS.map((asset) => asset.url.split('?')[0].split('/').pop() as string),
  )
  const shippedFiles = new Set(readdirSync(MODEL_DIRECTORY).filter((name) => name.endsWith('.glb')))

  it('ships every model the runtime can resolve', () => {
    // The Shell first evolution was absent from a hand-written build allowlist
    // for its whole life, so the accepted form 404'd in production while dev -
    // which serves public/ directly - looked fine.
    for (const file of registryFiles) {
      expect(shippedFiles.has(file), `${file} is resolvable at runtime but not in public/`).toBe(true)
    }
    expect(registryFiles.has('stone-pangolin-rigged-runtime-v2.glb')).toBe(true)
  })

  it('ships nothing the runtime cannot resolve', () => {
    for (const file of shippedFiles) {
      expect(registryFiles.has(file), `${file} is served to players but no code loads it`).toBe(true)
    }
  })

  it('keeps authoring intermediates out of the build', () => {
    expect(existsSync(new URL('../art-source/quality-3d-models/', import.meta.url))).toBe(true)
    const config = readFileSync(new URL('../vite.config.ts', import.meta.url), 'utf8')
    // A prune step that deletes from dist hides the mistake instead of
    // preventing it: the source of truth stays a list somebody has to remember.
    expect(config).not.toContain('rmSync')
  })
})
