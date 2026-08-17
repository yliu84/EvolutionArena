import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('Gloamwood mobile HUD', () => {
  const source = readFileSync(new URL('../src/gloamwood-3d-hunt.ts', import.meta.url), 'utf8')
  const source0 = readFileSync(new URL('../src/main.ts', import.meta.url), 'utf8')
  const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8')

  it('defaults to a compact expandable combat HUD on phone landscape', () => {
    expect(source).toContain('data-g3d-hud-details')
    expect(source).toContain("hud.dataset.mobileExpanded = 'false'")
    expect(css).toMatch(/orientation: landscape/)
    expect(css).toMatch(/data-mobile-expanded="true"/)
  })

  it('keeps required touch targets and safe-area anchors', () => {
    expect(css).toMatch(/min-height: 44px/)
    expect(css).toContain('env(safe-area-inset-left)')
    expect(css).toContain('env(safe-area-inset-right)')
    expect(css).toMatch(/g3d-actions button\.primary[^}]*82px/s)
  })

  it('offers a portrait rotation gate without assuming orientation lock support', () => {
    expect(source).toContain('data-g3d-landscape')
    expect(source).toContain('requestFullscreen')
    expect(source).toContain("orientation.lock('landscape')")
    expect(source).toContain('浏览器不支持自动旋转')
    expect(css).toMatch(/orientation: portrait/)
  })

  it('blocks browser double-tap zoom on the play surface', () => {
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
    expect(html).toMatch(/<meta name="viewport"[^>]*user-scalable=no/)
    expect(html).toMatch(/<meta name="viewport"[^>]*maximum-scale=1\.0/)
    // The canvas is the click-to-move surface, so a stray second tap must stay input.
    expect(css).toMatch(/\.gloamwood-3d-canvas\s*{[^}]*touch-action: none/s)
    // touch-action is NOT inherited: declaring it on body alone leaves every
    // descendant at `auto`, which is how iOS zoom survived the first fix.
    expect(css).toMatch(/body\.is-gloamwood-3d\s*\*[^{]*{[^}]*touch-action: manipulation/s)
    // iOS resolves page-level zoom against <html>, which body rules cannot reach.
    expect(css).toMatch(/html\.is-gloamwood-3d/)
    expect(source0).toContain("document.documentElement.classList.add('is-gloamwood-3d')")
    // Safari ignores user-scalable=no, so two-thumb pinch needs an explicit guard.
    expect(source).toContain("document.addEventListener('gesturestart', this.suppressGesture)")
    expect(source).toContain("addEventListener('dblclick', this.suppressGesture)")
  })

  it('never lets a long press select HUD text into the iOS callout menu', () => {
    // Canvas-only user-select left the HUD and guide copy selectable, which opened
    // the Copy / Look Up / Translate callout mid-fight.
    expect(css).toMatch(/body\.is-gloamwood-3d\s*\*\s*{[^}]*user-select: none/s)
    expect(css).toMatch(/body\.is-gloamwood-3d\s*\*\s*{[^}]*-webkit-touch-callout: none/s)
  })

  it('gives iPhone Safari a real full-screen route instead of hiding the button', () => {
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
    // iPhone Safari exposes no Fullscreen API; standalone launch is the only route.
    expect(html).toContain('apple-mobile-web-app-capable')
    expect(html).toContain('mobile-web-app-capable')
    expect(source).toContain('gloamwoodStandaloneDisplay')
    expect(source).toContain('navigator.standalone')
    expect(source).toContain('添加到主屏幕')
    // The button must degrade to guidance, not vanish, when the API is missing.
    expect(source).toContain("this.fullscreenToggle.textContent = '全屏方法'")
    expect(source).toMatch(/if \(this\.fullscreenToggle && gloamwoodStandaloneDisplay\(\)\) this\.fullscreenToggle\.hidden = true/)
  })

  it('reaches full screen while already landscape, not only from the portrait gate', () => {
    expect(source).toContain('data-g3d-fullscreen')
    expect(source).toContain('enterLandscapeFullscreen')
    expect(source).toContain('toggleFullscreenPresentation')
    // Full-screen entry must survive being toggled back off.
    expect(source).toContain('document.exitFullscreen()')
    expect(source).toContain("document.addEventListener('fullscreenchange', this.fullscreenChanged)")
    // Three HUD entries must still each hold a 44px touch target in landscape.
    expect(css).toMatch(/\.g3d-fullscreen-toggle,\s*\.g3d-settings-toggle\s*{[^}]*33\.333%/s)
  })

  it('uses a continuous left joystick and a holdable one-button combo', () => {
    expect(source).toContain('data-joystick')
    expect(source).toContain('gloamwoodJoystickVector')
    expect(source).toContain('按住执行普通攻击连招')
    expect(source).toContain('this.primaryHeld = true')
    expect(css).toMatch(/\.g3d-joystick[^}]*118px/s)
  })
})
