/**
 * The valley is a continuous 3D scene. Keep the render target below native
 * Retina density so the cost remains appropriate for a browser action game,
 * rather than silently spending four times as many pixels on a small visual
 * gain. Low-DPI displays keep their native sharpness.
 */
export const GLOAMWOOD_RENDER_QUALITY = {
  desktopPixelRatioCap: 1.35,
  coarsePointerPixelRatioCap: 1.15,
  shadowMapSize: 1536,
} as const

export function resolveGloamwoodRenderPixelRatio(devicePixelRatio: number, coarsePointer: boolean) {
  const normalized = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1
  const cap = coarsePointer
    ? GLOAMWOOD_RENDER_QUALITY.coarsePointerPixelRatioCap
    : GLOAMWOOD_RENDER_QUALITY.desktopPixelRatioCap
  return Math.min(normalized, cap)
}

/**
 * Frozen menus do not need a live WebGL loop. They receive one final render
 * for the backdrop, then the next simulation frame begins only when a choice
 * or Resume returns the player to the hunt.
 */
export function shouldGloamwoodRenderContinuously(state: {
  paused: boolean
  evolutionChoosing: boolean
  mutationOffering: boolean
  terminal: boolean
}) {
  return !state.paused && !state.evolutionChoosing && !state.mutationOffering && !state.terminal
}
