import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { TRANSLATIONS } from '../src/i18n'

/**
 * The credit the licence register requires must actually reach a player.
 *
 * `docs/ASSET-LICENSE-REGISTER.md` is thorough about what may be shipped and
 * names one credit line as the condition. The register was written, the models
 * shipped, and the credit was never rendered anywhere: checked against the
 * deployed build, neither `Meshy` nor `CC BY` appeared in the running page.
 *
 * The Coral Gecko source chain is CC BY 4.0, so this is a requirement rather
 * than a courtesy - and a requirement nothing enforces is one that goes missing
 * again at the next redesign of the settings panel.
 */
describe('The asset credit reaches the player', () => {
  const register = readFileSync(new URL('../docs/ASSET-LICENSE-REGISTER.md', import.meta.url), 'utf8')
  const hunt = readFileSync(new URL('../src/gloamwood-3d-hunt.ts', import.meta.url), 'utf8')

  it('says the same thing the register says', () => {
    // Held against the register rather than restated here, so the two cannot
    // drift into two different claims about the same assets.
    const quoted = register
      .split('\n')
      .filter((line) => line.startsWith('> '))
      .map((line) => line.slice(2).trim())
      .join(' ')
    expect(quoted).toContain('Meshy')
    expect(TRANSLATIONS['settings.credits'].en).toBe(quoted)
  })

  it('is rendered, not merely defined', () => {
    expect(hunt).toContain("t('settings.credits')")
    expect(hunt).toContain('data-g3d-credits')
  })

  it('carries both locales, and names Meshy in each', () => {
    // The credit names a party. It survives translation or it is not a credit.
    expect(TRANSLATIONS['settings.credits'].en).toContain('Meshy')
    expect(TRANSLATIONS['settings.credits'].zh).toContain('Meshy')
  })

  it('still covers every runtime model the register claims to cover', () => {
    // The register's own release check: every shipped model appears in a row.
    const models = readFileSync(new URL('../src/quality-3d-glb-assets.ts', import.meta.url), 'utf8')
      .match(/[a-z0-9-]+\.glb/g) ?? []
    for (const model of new Set(models)) {
      expect(register, `${model} is shipped but not in the licence register`).toContain(model)
    }
  })
})
