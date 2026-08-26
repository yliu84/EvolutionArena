import './style.css'
import { applyDocumentLocale, t } from './i18n'
import { gloamwoodMapFromSearch } from './entry-routing'
import { presentGloamwoodModeSelect } from './gloamwood-mode-select'

function createGameLoadingState() {
  const container = document.querySelector<HTMLElement>('#game-container')
  if (!container) throw new Error('Missing #game-container')
  const loading = document.createElement('section')
  loading.className = 'gloamwood-loading'
  loading.setAttribute('role', 'status')
  loading.setAttribute('aria-live', 'polite')
  loading.innerHTML = [
    '<div>',
    `<span>${escapeHtml(t('boot.eyebrow'))}</span>`,
    `<h1>${escapeHtml(t('boot.title'))}</h1>`,
    `<p>${escapeHtml(t('boot.body'))}</p>`,
    '<i aria-hidden="true"><em></em></i>',
    '</div>',
  ].join('')
  container.append(loading)
  return loading
}

function showGameLoadFailure(loading: HTMLElement, error: unknown) {
  const message = error instanceof Error ? error.message : t('boot.failUnknown')
  loading.dataset.failed = 'true'
  loading.setAttribute('role', 'alert')
  loading.innerHTML = [
    '<div>',
    `<span>${escapeHtml(t('boot.failEyebrow'))}</span>`,
    `<h1>${escapeHtml(t('boot.failTitle'))}</h1>`,
    `<p>${escapeHtml(message)}</p>`,
    `<button type="button" data-gloamwood-retry>${escapeHtml(t('boot.retry'))}</button>`,
    `<small>${escapeHtml(t('boot.failHelp'))}</small>`,
    '</div>',
  ].join('')
  loading.querySelector<HTMLButtonElement>('[data-gloamwood-retry]')?.addEventListener('click', () => {
    const retryUrl = new URL(window.location.href)
    retryUrl.searchParams.delete('failLoad')
    window.location.assign(retryUrl)
  })
}

function escapeHtml(value: string) {
  const span = document.createElement('span')
  span.textContent = value
  return span.innerHTML
}

let cleanup: (() => void) | undefined

const loadStartedAt = performance.now()
// The root element carries the class too: iOS Safari resolves page-level
// zoom gestures against <html>, which no body-scoped rule can reach.
document.documentElement.classList.add('is-gloamwood-3d')
// The boot screen is the first thing anyone sees and it renders before the
// hunt module is fetched, so the locale has to be settled here. Resolving it
// twice is harmless: applyDocumentLocale is a pure function of the URL, the
// saved choice and the browser.
applyDocumentLocale()
document.body.classList.add('is-maplab', 'is-v4-live', 'is-gloamwood-3d')
/**
 * A link that names a map goes straight in; anything else gets the picker.
 *
 * The distinction is the whole reason `gloamwoodMapFromSearch` can return null.
 * A shared link, a bug report and the review harness all carry `?map=`, and
 * putting a choice in front of those would change what the link reproduces.
 */
const routed = gloamwoodMapFromSearch()
const loadHunt = import.meta.env.DEV && new URLSearchParams(window.location.search).get('failLoad') === '1'
  // Dev-only fault injection for the failure screen. Developer text, not
  // player copy, so it is not a translation key.
  ? Promise.reject(new Error('QA fault injection: character or scene assets failed to load'))
  : import('./gloamwood-3d-hunt')
// Marks the rejection handled while the picker is still open. The real consumer
// below still sees it; without this a load failure during the choice is an
// unhandled rejection in the console until the player happens to pick.
loadHunt.catch(() => {})

/**
 * Pick first, then load - but download while they read.
 *
 * The boot screen says "waking the hunting grounds", which is a lie in front of
 * someone who has not chosen a hunt yet, so it is not built until they have.
 * The module download does not wait for them though: the hunt chunk and three
 * are most of a megabyte, and by the time two cards have been read it is
 * usually already here.
 */
const chosen = routed
  ? Promise.resolve(routed)
  : (() => {
    const container = document.querySelector<HTMLElement>('#game-container')
    if (!container) throw new Error('Missing #game-container')
    return presentGloamwoodModeSelect(container)
  })()
let loading: HTMLElement | undefined
chosen
  .then((mapId) => {
    loading = createGameLoadingState()
    return loadHunt.then(({ launchGloamwood3DHunt }) => launchGloamwood3DHunt(mapId))
  })
  .then((dispose) => {
    cleanup = dispose
    document.body.dataset.gameReadyMs = String(Math.round(performance.now() - loadStartedAt))
    loading?.remove()
  })
  .catch((error) => showGameLoadFailure(loading ?? createGameLoadingState(), error))

window.addEventListener('beforeunload', () => cleanup?.())
