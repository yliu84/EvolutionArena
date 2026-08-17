import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('browser page entry', () => {
  it('loads the application stylesheet from the module entry', () => {
    const entry = readFileSync(new URL('../src/main.ts', import.meta.url), 'utf8')
    expect(entry).toMatch(/import\s+['"]\.\/style\.css['"]/)
  })

  it('keeps starter choices as native buttons', () => {
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
    expect(html).not.toMatch(/<button[^>]+role=['"]listitem['"]/)
  })

  it('keeps the hunt readability slice behind an explicit query entry', () => {
    const entry = readFileSync(new URL('../src/legacy-main.ts', import.meta.url), 'utf8')
    expect(entry).toMatch(/isGloamwoodHuntSliceRequested\(\)/)
    expect(entry).toMatch(/launchRun\(isStarterVariantId\(requestedStarter\) \? requestedStarter : 'spine-stalker'\)/)
  })

  it('keeps the wide spatial skeleton behind maplab=3', () => {
    const entry = readFileSync(new URL('../src/legacy-main.ts', import.meta.url), 'utf8')
    expect(entry).toMatch(/isGloamwoodSpaceLabRequested\(\)/)
    expect(entry).toMatch(/launchGloamwoodSpaceLab\(\)/)
    expect(entry).toMatch(/data-space-action="layer"/)
  })

  it('keeps the nest exploration skeleton behind maplab=4', () => {
    const entry = readFileSync(new URL('../src/legacy-main.ts', import.meta.url), 'utf8')
    expect(entry).toMatch(/isGloamwoodExplorationLabRequested\(\)/)
    expect(entry).toMatch(/launchGloamwoodExplorationLab\(\)/)
    expect(entry).toMatch(/data-exploration-action="spawn"/)
    expect(entry).toMatch(/data-exploration-action="thorn"/)
    expect(entry).toMatch(/data-exploration-action="feedback"/)
    expect(entry).toMatch(/data-feedback-setting="shake"/)
    expect(entry).toMatch(/data-feedback-setting="flash"/)
    expect(entry).toMatch(/data-feedback-setting="volume"/)
    expect(entry).toMatch(/advanceFirstNestDebug/)
  })

  it('clears every V4 QA override before starting a fresh run', () => {
    const entry = readFileSync(new URL('../src/legacy-main.ts', import.meta.url), 'utf8')
    for (const parameter of ['boss', 'prop', 'nest', 'enemy', 'health', 'hazard', 'combatStyle', 'evolutionRoute', 'evolutionStage']) {
      expect(entry).toContain(`params.delete('${parameter}')`)
    }
  })

  it('loads MapLab 5 independently from the legacy Phaser entry and exposes retry recovery', () => {
    const entry = readFileSync(new URL('../src/main.ts', import.meta.url), 'utf8')
    expect(entry).toMatch(/import\(['"]\.\/gloamwood-3d-hunt['"]\)/)
    expect(entry).toMatch(/import\(['"]\.\/legacy-main['"]\)/)
    expect(entry).toMatch(/data-gloamwood-retry/)
    expect(entry).toMatch(/dataset\.gameReadyMs/)
    expect(entry).not.toMatch(/^import .*legacy-main/m)
  })

  it('keeps the served payload governed by the runtime registry, not a hand list', () => {
    // This test used to assert the five model names in a build-time allowlist.
    // It passed for the whole life of the Shell first evolution while that form
    // was being deleted from every production build, because it checked that
    // the mechanism existed rather than that the right files shipped.
    // tests/public-payload.test.ts now compares public/ against the registry.
    const config = readFileSync(new URL('../vite.config.ts', import.meta.url), 'utf8')
    expect(config).not.toContain('.glb')
    expect(config).toContain('art-source/')
  })
})
