import { describe, expect, it, vi } from 'vitest'

import {
  GLOAMWOOD_MODE_MOTIF,
  gloamwoodModeMotifVolume,
  playGloamwoodModeMotif,
} from '../src/gloamwood-mode-audio'

describe('mode-select evolution motif', () => {
  it('follows the saved Master and Music buses including mute', () => {
    expect(gloamwoodModeMotifVolume({ master: 0.8, music: 0.5, sfx: 1, ambience: 1, muted: false })).toBeCloseTo(0.328)
    expect(gloamwoodModeMotifVolume({ master: 1, music: 1, sfx: 1, ambience: 1, muted: true })).toBe(0)
  })

  it('starts from the trusted mode gesture and uses the deployment base path', async () => {
    const play = vi.fn().mockResolvedValue(undefined)
    const addEventListener = vi.fn()
    const audio = { preload: '', volume: 0, play, addEventListener, removeAttribute: vi.fn(), load: vi.fn() } as unknown as HTMLAudioElement
    const storage = { getItem: () => JSON.stringify({ master: 0.8, music: 0.5, sfx: 1, ambience: 1, muted: false }) }
    const previous = globalThis.Audio
    globalThis.Audio = class {} as typeof Audio
    try {
      expect(playGloamwoodModeMotif(storage, (url) => {
        expect(url).toContain('assets/audio/goal16/sfx/mode-select.ogg')
        return audio
      })).toBe(true)
    } finally {
      globalThis.Audio = previous
    }
    expect(GLOAMWOOD_MODE_MOTIF).toMatch(/mode-select\.ogg$/)
    expect(play).toHaveBeenCalledOnce()
    expect(audio.volume).toBeCloseTo(0.328)
    const source = await import('node:fs/promises').then(({ readFile }) => readFile(new URL('../src/gloamwood-mode-audio.ts', import.meta.url), 'utf8'))
    expect(source).toContain("document.body.dataset.modeMotif = 'playing'")
    expect(source).toContain("document.body.dataset.modeMotif = 'ended'")
    expect(source).toContain("document.body.dataset.modeMotif = 'blocked'")
  })
})
