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

  it('loads River Valley directly and exposes retry recovery', () => {
    const entry = readFileSync(new URL('../src/main.ts', import.meta.url), 'utf8')
    expect(entry).toMatch(/import\(['"]\.\/gloamwood-3d-hunt['"]\)/)
    expect(entry).toMatch(/data-gloamwood-retry/)
    expect(entry).toMatch(/dataset\.gameReadyMs/)
    expect(entry).not.toMatch(/legacy-main/)
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
