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
@media (prefers-reduced-motion: reduce) {
  .dsh-mp-pulse { animation: none; }
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
