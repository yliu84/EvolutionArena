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
  const silhouettes = readFileSync(new URL('../src/gloamwood-family-silhouettes.ts', import.meta.url), 'utf8')

  it('leads with a route silhouette instead of prose', () => {
    expect(source).toContain('gloamwoodFamilySilhouette(candidate.family)')
    // The prose description restated the stat line and is gone.
    expect(source).not.toContain('candidate.description')
    for (const family of ['fang', 'shell', 'swarm']) {
      expect(silhouettes).toContain(family)
    }
  })

  it('keeps the numbers and the causal line, which the playtest measures', () => {
    expect(source).toContain('candidate.statLine')
    expect(source).toContain('candidate.reason')
  })
})
