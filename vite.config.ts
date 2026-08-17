import { existsSync, readdirSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'

const RUNTIME_CHARACTER_MODELS = new Set([
  'coral-gecko-rigged-runtime-v1.glb',
  'scarlet-gecko-rigged-runtime-v1.glb',
  'scarlet-hunter-quadruped-runtime-v1.glb',
  'azure-wyvern-v1.glb',
  'golden-ancient-v1.glb',
])

function pruneAuthoringCharacterModels(): Plugin {
  return {
    name: 'prune-authoring-character-models',
    apply: 'build',
    closeBundle() {
      const outputDirectory = resolve('dist/assets/quality-3d/models')
      if (!existsSync(outputDirectory)) return
      for (const filename of readdirSync(outputDirectory)) {
        if (filename.endsWith('.glb') && !RUNTIME_CHARACTER_MODELS.has(filename)) {
          // dist is generated output. Authoring masters stay intact under public/.
          rmSync(resolve(outputDirectory, filename))
        }
      }
    },
  }
}

export default defineConfig({
  plugins: [pruneAuthoringCharacterModels()],
})
