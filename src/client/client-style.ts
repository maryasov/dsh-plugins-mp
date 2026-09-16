/**
 * Document-level CSS the inline-style approach can't express: the keyframes
 * behind the translation "Pulsing Glow" on the original-language badge (and
 * reduced-motion handling). Reference-counted — the two mounts (sidebar tab
 * and settings section) share one <style> tag per document.
 */
const MARKER = 'data-dsh-mp-client-style'

const CSS = `
@keyframes dsh-mp-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(96, 165, 250, 0); }
  50% { box-shadow: 0 0 7px 2px rgba(96, 165, 250, 0.55); }
}
.dsh-mp-pulse { animation: dsh-mp-pulse 1.6s ease-in-out infinite; }
.dsh-mp-theme-card { transition: transform 0.16s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.16s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.16s cubic-bezier(0.16, 1, 0.3, 1); }
.dsh-mp-theme-card:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(31, 35, 40, 0.08); border-color: var(--dsw-alias-border-l3, rgba(128, 128, 128, 0.5)); }
.dsh-mp-theme-cover { position: relative; display: block; width: 100%; aspect-ratio: 16 / 10; overflow: hidden; border: 0; border-bottom: 1px solid var(--dsw-alias-border, rgba(128, 128, 128, 0.28)); border-radius: 0; padding: 0; cursor: zoom-in; background: var(--dsw-alias-bg-layer-2, rgba(128, 128, 128, 0.12)); }
.dsh-mp-theme-cover img { display: block; width: 100%; height: 100%; object-fit: contain; transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1); }
.dsh-mp-theme-cover:hover img { transform: scale(1.012); }
.dsh-mp-theme-cover-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; font-size: 12px; line-height: 18px; opacity: 0.55; cursor: default; }
.dsh-mp-theme-pill { position: absolute; right: 8px; bottom: 8px; display: inline-flex; align-items: center; height: 24px; padding: 0 8px; border-radius: 4px; border: 1px solid rgba(255, 255, 255, 0.34); background: rgba(20, 24, 31, 0.78); -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); color: #fff; font-size: 11px; white-space: nowrap; }
@media (prefers-reduced-motion: reduce) {
  .dsh-mp-pulse { animation: none; }
  .dsh-mp-theme-card, .dsh-mp-theme-cover img { transition: none; }
  .dsh-mp-theme-card:hover { transform: none; }
}
`

let refcount = 0
let tag: HTMLStyleElement | null = null

/** Install the shared style rules; the returned disposer releases one claim. */
export function installClientStyle(): () => void {
  refcount += 1
  if (tag === null) {
    tag = document.createElement('style')
    tag.setAttribute(MARKER, '')
    tag.textContent = CSS
    document.head.append(tag)
  }
  return () => {
    refcount -= 1
    if (refcount <= 0) {
      tag?.remove()
      tag = null
      refcount = 0
    }
  }
}
