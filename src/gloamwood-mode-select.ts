import { t } from './i18n'
import {
  GLOAMWOOD_ACHIEVEMENTS,
  gloamwoodAchievementsUnlocked,
  isGloamwoodAchievementUnlocked,
  readGloamwoodAchievements,
} from './gloamwood-achievements'

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
 * The list of achievements, folded into the picker rather than given a screen.
 *
 * This is the one screen every player passes through, and a locked entry is the
 * only advertisement this game has for its own depth - somebody who has cleared
 * the valley twice has no other way to find out that the altar can be held
 * without the thing ever being touched.
 */
function achievementPanel(progress: Record<string, number>) {
  const rows = GLOAMWOOD_ACHIEVEMENTS.map((entry) => {
    const held = progress[entry.id] ?? 0
    const unlocked = isGloamwoodAchievementUnlocked(entry.id, progress)
    // Shown for anything counted rather than merely done: "60 of 100" is a
    // reason to play again and "not yet" is not.
    const measure = !unlocked && entry.target > 1 && held > 0
      ? `<i>${held} / ${entry.target}</i>`
      : unlocked ? `<i>${escapeHtml(t('achievement.earned'))}</i>` : ''
    return [
      `<li data-unlocked="${unlocked}" data-mode="${entry.mode}">`,
      `<span>${escapeHtml(t(`achievement.mode.${entry.mode}`))}</span>`,
      `<strong>${escapeHtml(t(`achievement.${entry.id}.name` as 'achievement.altar-held.name'))}</strong>`,
      `<em>${escapeHtml(t(`achievement.${entry.id}.detail` as 'achievement.altar-held.detail'))}</em>`,
      measure,
      '</li>',
    ].join('')
  }).join('')
  return [
    '<div class="g3d-trophy-panel" hidden>',
    `<header><h2>${escapeHtml(t('achievement.title'))}</h2>`,
    `<button type="button" data-close-achievements>${escapeHtml(t('achievement.close'))}</button></header>`,
    `<ul>${rows}</ul>`,
    '</div>',
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
  progress = readGloamwoodAchievements(),
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
    '<footer>',
    `<small>${escapeHtml(t('mode.hint'))}</small>`,
    `<button class="g3d-mode-trophies" type="button" data-open-achievements>`
      + `${escapeHtml(t('achievement.title'))} <b>${escapeHtml(t('achievement.count', {
        unlocked: gloamwoodAchievementsUnlocked(progress).length,
        total: GLOAMWOOD_ACHIEVEMENTS.length,
      }))}</b></button>`,
    '</footer>',
    '</div>',
    achievementPanel(progress),
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
      if (event.code === 'Escape' && overlay.dataset.reading === 'true') {
        event.preventDefault()
        setPanel(false)
        return
      }
      if (overlay.dataset.reading === 'true') return
      const byDigit = event.code === 'Digit1' ? 'valley' : event.code === 'Digit2' ? 'defence' : null
      if (!byDigit) return
      event.preventDefault()
      choose(byDigit)
    }
    for (const button of buttons) {
      button.addEventListener('click', () => choose(button.dataset.mode as GloamwoodMode))
    }
    const panel = overlay.querySelector<HTMLElement>('.g3d-trophy-panel')
    const setPanel = (open: boolean) => {
      if (panel) panel.hidden = !open
      // The digit shortcuts belong to the cards behind the panel; leaving them
      // live would start a run out from under whoever is reading the list.
      overlay.dataset.reading = open ? 'true' : 'false'
    }
    overlay.querySelector('[data-open-achievements]')?.addEventListener('click', () => setPanel(true))
    overlay.querySelector('[data-close-achievements]')?.addEventListener('click', () => setPanel(false))
    window.addEventListener('keydown', onKey)
  })
}
