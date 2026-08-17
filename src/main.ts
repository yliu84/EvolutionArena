import './style.css'

function isGloamwood3DEntry(search = window.location.search) {
  const params = new URLSearchParams(search)
  return params.get('maplab') === '5'
    || params.get('world3d') === '1'
    || (params.get('maplab') === '4' && params.get('live') === '1')
}

function createGameLoadingState() {
  const container = document.querySelector<HTMLElement>('#game-container')
  if (!container) throw new Error('Missing #game-container')
  const loading = document.createElement('section')
  loading.className = 'gloamwood-loading'
  loading.setAttribute('role', 'status')
  loading.setAttribute('aria-live', 'polite')
  loading.innerHTML = [
    '<div>',
    '<span>LOADING / 幽影林地</span>',
    '<h1>正在唤醒狩猎世界</h1>',
    '<p>加载角色、环境与战斗系统…</p>',
    '<i aria-hidden="true"><em></em></i>',
    '</div>',
  ].join('')
  container.append(loading)
  return loading
}

function showGameLoadFailure(loading: HTMLElement, error: unknown) {
  const message = error instanceof Error ? error.message : '未知加载错误'
  loading.dataset.failed = 'true'
  loading.setAttribute('role', 'alert')
  loading.innerHTML = [
    '<div>',
    '<span>LOAD FAILED / 无法进入狩猎</span>',
    '<h1>世界资源没有完整加载</h1>',
    `<p>${escapeHtml(message)}</p>`,
    '<button type="button" data-gloamwood-retry>重新加载本局</button>',
    '<small>如果问题持续，请检查网络或刷新浏览器；本局尚未开始，不会产生错误进度。</small>',
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

if (isGloamwood3DEntry()) {
  const loadStartedAt = performance.now()
  document.body.classList.add('is-maplab', 'is-v4-live', 'is-gloamwood-3d')
  const loading = createGameLoadingState()
  const loadHunt = import.meta.env.DEV && new URLSearchParams(window.location.search).get('failLoad') === '1'
    ? Promise.reject(new Error('QA模拟：角色或场景资源加载失败'))
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
