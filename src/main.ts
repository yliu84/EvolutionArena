import './style.css'
import { applyDocumentLocale, t } from './i18n'
import { isGloamwood3DEntry, isGloamwoodValleyEntry } from './entry-routing'

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

if (isGloamwoodValleyEntry()) {
  applyDocumentLocale()
  document.documentElement.classList.add('is-gloamwood-3d')
  document.body.classList.add('is-maplab', 'is-v4-live', 'is-gloamwood-3d')
  const loading = createGameLoadingState()
  import('./gloamwood-valley-preview')
    .then(({ launchGloamwoodValleyPreview }) => launchGloamwoodValleyPreview())
    .then((dispose) => {
      cleanup = dispose
      loading.remove()
    })
    .catch((error) => showGameLoadFailure(loading, error))
} else if (isGloamwood3DEntry()) {
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
  const loading = createGameLoadingState()
  const loadHunt = import.meta.env.DEV && new URLSearchParams(window.location.search).get('failLoad') === '1'
    // Dev-only fault injection for the failure screen. Developer text, not
    // player copy, so it is not a translation key.
    ? Promise.reject(new Error('QA fault injection: character or scene assets failed to load'))
    : import('./gloamwood-3d-hunt')
  loadHunt
    .then(({ launchGloamwood3DHunt }) => launchGloamwood3DHunt())
    .then((dispose) => {
      cleanup = dispose
      document.body.dataset.gameReadyMs = String(Math.round(performance.now() - loadStartedAt))
      loading.remove()
    })
    .catch((error) => showGameLoadFailure(loading, error))
} else {
  void import('./legacy-main')
}

window.addEventListener('beforeunload', () => cleanup?.())
