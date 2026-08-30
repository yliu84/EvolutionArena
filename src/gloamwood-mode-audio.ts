import { assetUrl } from './asset-url'
import {
  DEFAULT_GLOAMWOOD_AUDIO_MIX,
  GLOAMWOOD_AUDIO_MIX_STORAGE_KEY,
  normalizeGloamwoodAudioMix,
  type GloamwoodAudioMixSettings,
} from './gloamwood-audio-director'

export const GLOAMWOOD_MODE_MOTIF = '/assets/audio/goal16/sfx/mode-select.ogg'

export function gloamwoodModeMotifVolume(mix: GloamwoodAudioMixSettings) {
  return mix.muted ? 0 : Math.max(0, Math.min(1, mix.master * mix.music * 0.82))
}

function readModeMix(storage: Pick<Storage, 'getItem'> = localStorage) {
  try {
    return normalizeGloamwoodAudioMix(JSON.parse(storage.getItem(GLOAMWOOD_AUDIO_MIX_STORAGE_KEY) ?? 'null'))
  } catch {
    return { ...DEFAULT_GLOAMWOOD_AUDIO_MIX }
  }
}

/**
 * The mode choice itself is the trusted gesture. A short evolution motif fills
 * the loading cut, then ends before the hunt's continuous layers arrive. This
 * intentionally stays an HTMLAudio one-shot: the run owns the only long-lived
 * Web Audio graph and tears it down with the scene.
 */
export function playGloamwoodModeMotif(
  storage: Pick<Storage, 'getItem'> = localStorage,
  createAudio: (url: string) => HTMLAudioElement = (url) => new Audio(url),
) {
  const volume = gloamwoodModeMotifVolume(readModeMix(storage))
  if (volume <= 0 || typeof Audio === 'undefined') return false
  try {
    const audio = createAudio(assetUrl(GLOAMWOOD_MODE_MOTIF))
    audio.preload = 'auto'
    audio.volume = volume
    audio.addEventListener('ended', () => {
      if (typeof document !== 'undefined') document.body.dataset.modeMotif = 'ended'
      audio.removeAttribute('src')
      audio.load()
    }, { once: true })
    if (typeof document !== 'undefined') document.body.dataset.modeMotif = 'playing'
    void audio.play().catch(() => {
      if (typeof document !== 'undefined') document.body.dataset.modeMotif = 'blocked'
    })
    return true
  } catch {
    return false
  }
}
