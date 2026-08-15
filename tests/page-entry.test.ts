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
    const entry = readFileSync(new URL('../src/main.ts', import.meta.url), 'utf8')
    expect(entry).toMatch(/isGloamwoodHuntSliceRequested\(\)/)
    expect(entry).toMatch(/launchRun\(isStarterVariantId\(requestedStarter\) \? requestedStarter : 'spine-stalker'\)/)
  })

  it('keeps the wide spatial skeleton behind maplab=3', () => {
    const entry = readFileSync(new URL('../src/main.ts', import.meta.url), 'utf8')
    expect(entry).toMatch(/isGloamwoodSpaceLabRequested\(\)/)
    expect(entry).toMatch(/launchGloamwoodSpaceLab\(\)/)
    expect(entry).toMatch(/data-space-action="layer"/)
  })

  it('keeps the nest exploration skeleton behind maplab=4', () => {
    const entry = readFileSync(new URL('../src/main.ts', import.meta.url), 'utf8')
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
    const entry = readFileSync(new URL('../src/main.ts', import.meta.url), 'utf8')
    for (const parameter of ['boss', 'prop', 'nest', 'enemy', 'health', 'hazard', 'combatStyle', 'evolutionRoute', 'evolutionStage']) {
      expect(entry).toContain(`params.delete('${parameter}')`)
    }
  })
})
