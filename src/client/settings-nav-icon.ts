/**
 * Mark this plugin's row in the DSH settings navigation so injected CSS can
 * replace the shell's fallback gear with the marketplace glyph.
 *
 * DSH 0.1.x projects only `id`, `order`, and `label` from a
 * `settings.section` registration and renders a generic gear for every
 * external section. The plugin identifies only its own localized nav row
 * after the dialog mounts (same adaptation as dsh-better-sidebar); the
 * marker owns no shell structure and is removed on disposal, so the whole
 * thing stays HMR-safe.
 *
 * The painted glyph follows the native nav colors: it is a currentColor
 * mask, so no palette of our own is involved.
 */

export const SETTINGS_NAV_MARKER = 'data-dsh-mp-settings-nav'

/** The mono marketplace mark, URI-encoded for a CSS mask url(). */
const ICON_URI = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDQuMjMgNC4yMyI+PHBhdGggZD0iTTEyMi4xOCAxMjUuODh2NC4yNGg0LjIzdi0yLjE4bC0uMDgtLjAzaC0uMTRxLS4xNi4wNC0uMy4wNWgtLjIybC0uMDUtLjAxLjAzLS4wNWEuMy4zIDAgMCAwIC4wNi0uMjJxMC0uMDgtLjA2LS4xM2EuNC40IDAgMCAwLS4yMi0uMWwtLjEzLS4wMWgtLjEyYS40LjQgMCAwIDAtLjIuMS4zLjMgMCAwIDAtLjA5LjEzcS0uMDEuMTQuMDcuMjRsLjAzLjA0aC0uMDVsLS4xLjAxaC0uMTNsLS4zMy0uMDUtLjA1LS41Ni4wMS0uMDQuMDQuMDJxLjEuMDkuMjQuMDdhLjMuMyAwIDAgMCAuMTYtLjEuNTcuNTcgMCAwIDAgLjA4LS4zcTAtLjEtLjAyLS4xNGEuNC40IDAgMCAwLS4xLS4yMS4zLjMgMCAwIDAtLjItLjA3cS0uMDcgMC0uMTUuMDZsLS4wNS4wM3YtLjA1bC0uMDEtLjF2LS4xMWwuMDQtLjMxLjAxLS4wN3YtLjA4bC0uMDQtLjA3aC0yLjE2bS4yMy4yNGgxLjcybC0uMDQuNHYuMTRxLjAyLjEzLjExLjIxLjEyLjA4LjI0LjAybC4wOC0uMDUuMDUtLjAzcS4wMi4wMS4wNC4xdi4xNnEwIC4wNi0uMDMuMDh2LjAxbC0uMDYtLjAycS0uMDgtLjA4LS4yLS4wOGEuMi4yIDAgMCAwLS4xNi4wOC40LjQgMCAwIDAtLjA2LjE3di4yM2wuMDMuMy0uMjMtLjA0aC0uMjlhLjMuMyAwIDAgMC0uMi4wOC4yLjIgMCAwIDAtLjA1LjIxcS4wMy4wOS4wNy4xM2wuMDMuMDYtLjEuMDRoLS4xN2wtLjA4LS4wNC4wMi0uMDUuMDctLjEyYS4yLjIgMCAwIDAtLjA1LS4yMi4zLjMgMCAwIDAtLjItLjA5aC0uMjdsLS4yNy4wNHptMi44NCAxLjU1aC4xM2wuMS4wNS0uMDMuMDUtLjA2LjEycS0uMDMuMTIuMDUuMjIuMDguMDcuMi4wOGguMTNhMiAyIDAgMCAwIC40LS4wM3YxLjcyaC0xLjc2bC0uMDMtLjE4LS4wMS0uMjV2LS4wNmwuMTEuMDVxLjEuMDQuMiAwYS4zLjMgMCAwIDAgLjE1LS4xNS43LjcgMCAwIDAgLjA0LS40OS40LjQgMCAwIDAtLjE0LS4yLjMuMyAwIDAgMC0uMjMtLjA0bC0uMTMuMDd2LS4wNXEwLS4xMi4wMy0uMzZ2LS4wN2wuNDQuMDVoLjE0cS4xNy0uMDIuMjMtLjE2Yy4wNS0uMSAwLS4xOS0uMDUtLjI3bC0uMDMtLjA1LjEtLjA0em0tMi40MS40LjA2LjAxLS4wNS4xdi4wMWEuMi4yIDAgMCAwIDAgLjE5cS4wMy4wNy4wOS4xMmEuNS41IDAgMCAwIC4yNi4xcS4xNSAwIC4yOS0uMDNhLjQuNCAwIDAgMCAuMi0uMTMuMy4zIDAgMCAwIC4wMy0uMjNsLS4wNi0uMTNoLjA1cS4xMi0uMDEuMzYuMDJsLjA3LjAxcS0uMDUuMy0uMDUuNDggMCAuMTMuMDQuMjEuMDUuMTIuMTkuMTQuMTEtLjAxLjItLjA4bC4wNS0uMDMuMDQuMXYuMTZsLS4wNC4xLS4wNS0uMDQtLjA3LS4wNHEtLjEzLS4wNi0uMjUuMDEtLjEuMDktLjEuMjJ2LjEzYTIgMiAwIDAgMCAuMDMuNGgtMS43MnYtMS43NWwuMTYtLjAzeiIgc3R5bGU9ImJhc2VsaW5lLXNoaWZ0OmJhc2VsaW5lO2Rpc3BsYXk6aW5saW5lO292ZXJmbG93OnZpc2libGU7dmVjdG9yLWVmZmVjdDpub25lO3N0b3AtY29sb3I6IzAwMDtzdG9wLW9wYWNpdHk6MTtvcGFjaXR5OjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0xMjIuMTggLTEyNS44OCkiLz48L3N2Zz4='

const CSS = `
[data-dsh-mp-settings-nav] > svg:first-child { display: none; }
[data-dsh-mp-settings-nav]::before {
  content: '';
  flex: none;
  width: 16px;
  height: 16px;
  background: currentColor;
  -webkit-mask-image: url("${ICON_URI}");
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
  -webkit-mask-size: contain;
  mask-image: url("${ICON_URI}");
  mask-repeat: no-repeat;
  mask-position: center;
  mask-size: contain;
}
`

/** Inject the marker's painting rules once per document. */
export function installSettingsNavStyle(): () => void {
  const tag = document.createElement('style')
  tag.setAttribute('data-dsh-mp-settings-nav-style', '')
  tag.textContent = CSS
  document.head.append(tag)
  return () => { tag.remove() }
}

/**
 * Keep the marker on the settings-nav button whose visible text is this
 * plugin's current localized section label.
 * @param label - locale-aware label resolver used by the section registration.
 * @returns disposer that disconnects observation and removes owned markers.
 */
export function registerSettingsNavIcon(label: () => string): () => void {
  let disposed = false

  const sync = (): void => {
    if (disposed) return
    const currentLabel = label().trim()
    const buttons = document.querySelectorAll<HTMLButtonElement>('[role="dialog"] nav button')
    buttons.forEach((button) => {
      const matches = currentLabel.length > 0 && button.textContent?.trim() === currentLabel
      if (matches) button.setAttribute(SETTINGS_NAV_MARKER, '')
      else button.removeAttribute(SETTINGS_NAV_MARKER)
    })
  }

  sync()
  const observer = new MutationObserver(sync)
  observer.observe(document.body, { childList: true, subtree: true, characterData: true })

  return () => {
    disposed = true
    observer.disconnect()
    document.querySelectorAll(`[${SETTINGS_NAV_MARKER}]`)
      .forEach((element) => { element.removeAttribute(SETTINGS_NAV_MARKER) })
  }
}
