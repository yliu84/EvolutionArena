import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { TRANSLATIONS, detectLocale, interpolate, setLocale, t, type TranslationKey } from '../src/i18n'

describe('Localisation', () => {
  it('carries both locales for every key, with no empty or untranslated copy', () => {
    const keys = Object.keys(TRANSLATIONS) as TranslationKey[]
    expect(keys.length).toBeGreaterThan(30)
    for (const key of keys) {
      const entry = TRANSLATIONS[key]
      expect(entry.en.trim(), key).not.toBe('')
      expect(entry.zh.trim(), key).not.toBe('')
      // A key whose English still contains Han characters was never translated.
      expect(/[一-鿿]/.test(entry.en), `${key} English still contains Han characters`).toBe(false)
    }
  })

  it('keeps the same placeholders in both locales', () => {
    const placeholders = (value: string) => (value.match(/\{(\w+)\}/g) ?? []).sort()
    for (const key of Object.keys(TRANSLATIONS) as TranslationKey[]) {
      const entry = TRANSLATIONS[key]
      expect(placeholders(entry.en), key).toEqual(placeholders(entry.zh))
    }
  })

  it('resolves the browser locale with English as the default market', () => {
    expect(detectLocale(['en-US', 'zh-CN'])).toBe('en')
    expect(detectLocale(['zh-CN'])).toBe('zh')
    expect(detectLocale(['zh-Hant-TW'])).toBe('zh')
    expect(detectLocale(['fr-FR'])).toBe('en')
    expect(detectLocale([])).toBe('en')
  })

  it('substitutes named parameters and leaves unknown ones intact', () => {
    expect(interpolate('{a} of {b}', { a: 3, b: 'ten' })).toBe('3 of ten')
    expect(interpolate('{missing}', {})).toBe('{missing}')
    expect(interpolate('no params')).toBe('no params')
  })

  it('translates the same key differently per locale', () => {
    setLocale('en')
    const english = t('guide.move.title')
    setLocale('zh')
    const chinese = t('guide.move.title')
    expect(english).not.toBe(chinese)
    expect(/[一-鿿]/.test(chinese)).toBe(true)
    setLocale('en')
  })

  it('places interpolated numbers correctly in both locales', () => {
    expect(t('guide.approach.progress', { distance: 12 }, 'en')).toBe('12m to the nest')
    expect(t('guide.approach.progress', { distance: 12 }, 'zh')).toContain('12m')
  })
})

describe('Onboarding copy is localised, not inlined', () => {
  const source = readFileSync(new URL('../src/gloamwood-3d-onboarding.ts', import.meta.url), 'utf8')

  it('holds no Han characters, since the guide is what the playtest measures', () => {
    expect(/[一-鿿]/.test(source)).toBe(false)
    expect(source).toContain("from './i18n'")
  })
})

describe('MapLab 5 player-facing text is fully localised', () => {
  const files = [
    'gloamwood-3d-hunt.ts',
    'gloamwood-3d-onboarding.ts',
    'gloamwood-3d-evolution.ts',
    'gloamwood-input-settings.ts',
    'main.ts',
    // The picker is the first screen anyone sees, so it is the worst possible
    // place to ship untranslated copy.
    'gloamwood-mode-select.ts',
  ]

  it('holds no Han characters anywhere in the live body', () => {
    for (const file of files) {
      const source = readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8')
      // A Han character here means copy was inlined instead of keyed, which ships
      // Chinese to an English player regardless of their browser locale.
      expect(/[一-鿿]/.test(source), `${file} still contains inline Han characters`).toBe(false)
    }
  })

  it('resolves the document locale from the browser at launch', () => {
    const source = readFileSync(new URL('../src/gloamwood-3d-hunt.ts', import.meta.url), 'utf8')
    expect(source).toContain('applyDocumentLocale()')
    expect(source).toContain("document.title = t('document.title')")
  })
})

describe('Evolution choice card', () => {
  const source = readFileSync(new URL('../src/gloamwood-3d-hunt.ts', import.meta.url), 'utf8')
  const portraits = readFileSync(new URL('../src/gloamwood-family-portraits.ts', import.meta.url), 'utf8')

  it('leads with a route still instead of prose', () => {
    expect(source).toContain('gloamwoodFamilyPortrait(candidate.family)')
    expect(source).not.toContain('candidate.description')
    expect(source).not.toContain('candidate.reason')
    for (const family of ['fang', 'shell', 'swarm']) {
      expect(portraits).toContain(`${family}.png`)
    }
  })

  it('keeps the name, the numbers and the hunt weight', () => {
    expect(source).toContain('candidate.name')
    expect(source).toContain('candidate.statLine')
    expect(source).toContain('candidate.probability')
  })
})

describe('Auto-engage and target bar', () => {
  const source = readFileSync(new URL('../src/gloamwood-3d-hunt.ts', import.meta.url), 'utf8')

  it('closes along the current bearing, except into an armoured front', () => {
    // Keeping the player's bearing was meant to protect the flank the guide
    // teaches. It does not: an unsteered approach *is* head-on, because the
    // creature turns to face whoever is coming, so the assist delivered the
    // player onto the Carapace front every time - 72% shed, and it reads as
    // the player's own attack having gone weak.
    expect(source).toContain('private updateAutoEngage()')
    expect(source).toContain('const approachAngle = Math.atan2(dz, -dx)')
    expect(source).toContain('gloamwoodFlankApproachAngle(target.facingRadians, approachAngle')
    // Only ever nudged to the edge of the armoured arc - the side stays the
    // player's, and anything without an armoured front is untouched.
    expect(source).toContain('target.guardsFront')
  })

  it('lets steering drop the automation while keeping the lock', () => {
    expect(source).toContain('if (manualMovement) {')
    expect(source).toContain('this.cancelAutoEngage()')
    expect(source).toContain('this.cancelAttackForMovement()')
    // Cancelling must not clear lockedPreyId, or flanking costs a re-select.
    expect(source).not.toMatch(/cancelAutoEngage\(\)\s*\n\s*this\.lockedPreyId = null/)
  })

  it('ends the order when its target is replaced, so one press is one enemy', () => {
    // A kill auto-locks the next threat and a hit can assist-lock an attacker.
    // Without this the order rides those handovers and clears a pack unattended.
    expect(source).toContain('private currentLockIdentity()')
    expect(source).toContain('if (this.currentLockIdentity() !== this.autoEngageTargetId) return this.cancelAutoEngage()')
    // The order binds after the lock is resolved, not before.
    expect(source).toContain('this.autoEngageTargetId = this.currentLockIdentity()')
  })

  it('bounds the approach by the lock rather than by a nest radius', () => {
    // The rule this protects is that a stray press cannot walk the player
    // across the map. It used to be pinned to the literal
    // `GLOAMWOOD_NEST.activationRadius * 1.5` - 12.6 units, a number about a
    // nest - which stranded any target locked further out than that.
    expect(source).toContain('centreDistance > GLOAMWOOD_LOCK_RANGE')
    expect(source).not.toContain('GLOAMWOOD_NEST.activationRadius * 1.5')
  })

  it('shows health above the locked target instead of in the HUD corner', () => {
    expect(source).toContain('private updateTargetBar()')
    expect(source).toContain('g3d-target-bar')
    // The HUD enemy row is gone; only the locked target carries a bar.
    expect(source).not.toContain('data-g3d-enemy-bar')
    expect(source).not.toContain('data-g3d-enemy-health')
  })
})

describe('One press, one enemy', () => {
  const source = readFileSync(new URL('../src/gloamwood-3d-hunt.ts', import.meta.url), 'utf8')

  it('releases the chain flag when the order ends', () => {
    // primaryHeld is what continues the chain, so clearing only the bookkeeping
    // left it running: the order ended but the character kept swinging.
    expect(source).toMatch(/private cancelAutoEngage\(\) \{[\s\S]*?this\.primaryHeld = false/)
  })

  it('does not re-arm the chain on keyboard auto-repeat', () => {
    // Holding the key fires keydown repeatedly; re-arming there put the flag
    // straight back after a cancel and defeated the rule entirely.
    expect(source).toMatch(/if \(!event\.repeat\) \{\s*\n\s*this\.primaryHeld = true/)
  })
})

describe('Arriving opens the chain', () => {
  const source = readFileSync(new URL('../src/gloamwood-3d-hunt.ts', import.meta.url), 'utf8')
  const chain = readFileSync(new URL('../src/formal-hunt-basic-attack.ts', import.meta.url), 'utf8')

  it('starts a chain on arrival rather than waiting for a second press', () => {
    // primaryHeld only continues a running chain - the authority returns early
    // when no action is active - so arriving has to open one itself.
    expect(chain).toMatch(/if \(!state\.action\) \{/)
    expect(source).toContain('if (!this.attackState.action) this.requestPrimaryAttack()')
  })

  it('only opens one step at a time, so the combo cannot be reset every frame', () => {
    // requestFormalHuntBasicAttack buffers instead of restarting while an action
    // runs, and the caller guards on there being no action.
    expect(chain).toContain('if (state.action) return { ...state, buffered: true }')
  })
})

describe('Language switch', () => {
  const source = readFileSync(new URL('../src/gloamwood-3d-hunt.ts', import.meta.url), 'utf8')
  const module = readFileSync(new URL('../src/i18n.ts', import.meta.url), 'utf8')

  it('offers the switch in settings and rebuilds the chrome', () => {
    expect(source).toContain('data-g3d-setting="language"')
    expect(source).toContain('private toggleLocale()')
    // The HUD and guide bake their copy in at creation, so a live switch has to
    // recreate them or the static labels stay in the old language.
    expect(source).toMatch(/private toggleLocale\(\)[\s\S]*?this\.createHud\(\)/)
  })

  it('lets a saved choice beat browser detection', () => {
    // A player whose browser is set to the other language needs a way out.
    expect(module).toContain('storedLocale() ?? detectLocale(languages)')
    expect(module).toContain('export function persistLocale')
  })
})

describe('Boot screen', () => {
  const source = readFileSync(new URL('../src/main.ts', import.meta.url), 'utf8')

  it('resolves the locale before the hunt module is fetched', () => {
    // The loading and load-failure screens render while gloamwood-3d-hunt is
    // still downloading, so waiting for the game to set the locale showed an
    // English player a Chinese screen for the whole of the first load.
    expect(source).toContain('applyDocumentLocale()')
    expect(source).toContain("t('boot.title')")
    expect(source).toContain("t('boot.failTitle')")
  })

  it('escapes every boot string, since one of them is an error message', () => {
    for (const key of ['boot.eyebrow', 'boot.title', 'boot.body', 'boot.failEyebrow', 'boot.failTitle', 'boot.retry', 'boot.failHelp']) {
      expect(source).toContain(`escapeHtml(t('${key}'))`)
    }
  })
})

describe('Static head text, which no script can localise before paint', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
  const head = html.slice(0, html.indexOf('</head>'))

  it('meets an English tester in English', () => {
    // The Add-to-Home-Screen icon name, the link preview and the first-paint tab
    // title all come from here. The documented iPhone full-screen route runs
    // through the icon install, so a Chinese icon name lands in a B-section test.
    expect(/[一-鿿]/.test(head), 'index.html head still contains Han characters').toBe(false)
    expect(head).toContain('<title>Evolution Arena Lite · Gloamwood</title>')
    expect(head).toContain('name="apple-mobile-web-app-title" content="Evolution Arena"')
  })

  it('still hands the title to the locale runtime once the module boots', () => {
    const source = readFileSync(new URL('../src/gloamwood-3d-hunt.ts', import.meta.url), 'utf8')
    expect(source).toContain("document.title = t('document.title')")
  })
})
