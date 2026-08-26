import { t } from './i18n'

/**
 * The first screen anyone sees, and the front door for both modes.
 *
 * Until now the game booted straight into the valley and the altar defence map
 * could only be reached by appending `?map=defence` by hand - so a mode with
 * twelve waves, four bosses and both endings shipped to nobody. This is the
 * screen that fixes that.
 *
 * Deliberately not a settings menu. Two cards, a sentence each on what the mode
 * actually is, and how long it runs, because the two are different enough that
 * a player choosing blind would be choosing at random.
 */

/** Modes that can be offered. `gloamwood` is a retired lab and is not one. */
export const GLOAMWOOD_MODES = ['valley', 'defence'] as const
export type GloamwoodMode = (typeof GLOAMWOOD_MODES)[number]

export const GLOAMWOOD_MODE_STORAGE_KEY = 'evolution-arena-mode-v1'

/**
 * Reads a remembered choice, rejecting anything that is not offerable.
 *
 * Separate from storage so it can be tested, and strict on purpose: a stale key
 * naming the retired combat lab must not quietly send a player there.
 */
export function normalizeGloamwoodMode(value: unknown): GloamwoodMode | null {
  return GLOAMWOOD_MODES.includes(value as GloamwoodMode) ? (value as GloamwoodMode) : null
}

export function rememberedGloamwoodMode(storage: Pick<Storage, 'getItem'> = localStorage) {
  try {
    return normalizeGloamwoodMode(storage.getItem(GLOAMWOOD_MODE_STORAGE_KEY))
  } catch {
    // Private browsing throws on access rather than returning null.
    return null
  }
}

export function rememberGloamwoodMode(
  mode: GloamwoodMode,
  storage: Pick<Storage, 'setItem'> = localStorage,
) {
  try {
    storage.setItem(GLOAMWOOD_MODE_STORAGE_KEY, mode)
  } catch {
    // Not being able to remember is not a reason to fail to start a run.
  }
}

function escapeHtml(value: string) {
  const span = document.createElement('span')
  span.textContent = value
  return span.innerHTML
}

function card(mode: GloamwoodMode, key: string, remembered: boolean) {
  return [
    `<button class="g3d-mode-card" type="button" data-mode="${mode}" data-remembered="${remembered}">`,
    `<span class="g3d-mode-key" aria-hidden="true">${key}</span>`,
    `<span class="g3d-mode-kind">${escapeHtml(t(`mode.${mode}.kind`))}</span>`,
    `<strong>${escapeHtml(t(`mode.${mode}.name`))}</strong>`,
    `<span class="g3d-mode-body">${escapeHtml(t(`mode.${mode}.body`))}</span>`,
    `<span class="g3d-mode-meta">${escapeHtml(t(`mode.${mode}.meta`))}</span>`,
    remembered ? `<span class="g3d-mode-last">${escapeHtml(t('mode.lastPlayed'))}</span>` : '',
    '</button>',
  ].join('')
}

/**
 * Shows the picker and resolves with what was chosen.
 *
 * Resolves once and then tears itself down, so the caller can simply await it
 * and get on with launching. The remembered mode is focused rather than
 * auto-started: the player asked for this screen by not having a `?map=` link,
 * and skipping it for them would put them in a mode they did not pick.
 */
export function presentGloamwoodModeSelect(
  container: HTMLElement,
  remembered: GloamwoodMode | null = rememberedGloamwoodMode(),
): Promise<GloamwoodMode> {
  const overlay = document.createElement('section')
  overlay.className = 'gloamwood-mode-select'
  overlay.setAttribute('role', 'dialog')
  overlay.setAttribute('aria-modal', 'true')
  overlay.setAttribute('aria-labelledby', 'g3d-mode-title')
  overlay.innerHTML = [
    '<div class="g3d-mode-panel">',
    '<header>',
    `<span>${escapeHtml(t('mode.eyebrow'))}</span>`,
    `<h1 id="g3d-mode-title">${escapeHtml(t('mode.title'))}</h1>`,
    `<p>${escapeHtml(t('mode.subtitle'))}</p>`,
    '</header>',
    '<div class="g3d-mode-cards">',
    card('valley', '1', remembered === 'valley'),
    card('defence', '2', remembered === 'defence'),
    '</div>',
    `<footer><small>${escapeHtml(t('mode.hint'))}</small></footer>`,
    '</div>',
  ].join('')
  container.append(overlay)

  const buttons = [...overlay.querySelectorAll<HTMLButtonElement>('.g3d-mode-card')]
  const preferred = buttons.find((button) => button.dataset.mode === remembered) ?? buttons[0]
  preferred?.focus()

  return new Promise<GloamwoodMode>((resolve) => {
    let settled = false
    const choose = (mode: GloamwoodMode) => {
      if (settled) return
      settled = true
      rememberGloamwoodMode(mode)
      window.removeEventListener('keydown', onKey)
      overlay.dataset.leaving = 'true'
      // Removed on a timer rather than on transitionend: a browser that skips
      // the transition never fires that event, and the screen would stay up
      // over a running game.
      window.setTimeout(() => overlay.remove(), 220)
      resolve(mode)
    }
    const onKey = (event: KeyboardEvent) => {
      const byDigit = event.code === 'Digit1' ? 'valley' : event.code === 'Digit2' ? 'defence' : null
      if (!byDigit) return
      event.preventDefault()
      choose(byDigit)
    }
    for (const button of buttons) {
      button.addEventListener('click', () => choose(button.dataset.mode as GloamwoodMode))
    }
    window.addEventListener('keydown', onKey)
  })
}
