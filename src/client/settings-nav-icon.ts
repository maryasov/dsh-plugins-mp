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
const ICON_URI = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0ibm9uZSIgdmlld0JveD0iMCAwIDE2IDE2Ij48cGF0aCBkPSJNLjUzLjUzdjE0Ljk0aDE0Ljk0VjcuNjVsLS40LS4xNWgtLjAxbC0uMTItLjAzaC0uMDFjLS4yOS0uMDQtLjI3IDAtLjQ2LjAzYTE1IDE1IDAgMCAxLTEuNDMuMTVoLS4xN2MuMTMtLjIzLjI1LS41LjIyLS43NmExIDEgMCAwIDAtLjMtLjU5IDEuNiAxLjYgMCAwIDAtLjg0LS40IDIgMiAwIDAgMC0uNDktLjA1aC0uMjVsLS4wMy4wMy0uMi4wMXEtLjQ2LjA4LS44MS4zOGMtLjE1LjEzLS4yOS4zNi0uMzMuNTctLjA3LjM1LjA4LjU4LjIyLjhsLS4yLjAxYy0uMTYgMC0uMzUgMC0uNDItLjAyLS4zLS4wMi0uNTctLjA2LS45NS0uMTItLjA3LS40LS4xMi0uODUtLjE0LTEuMTR2LS40M2MuMjMuMTQuNDUuMy44LjIyLjI4LS4wNS41My0uMjQuNjgtLjQ1cS4yMS0uMzEuMjgtLjcuMDMtLjE3LjAzLS40N3QtLjAzLS40OGMtLjA3LS4zMS0uMTctLjYtLjQxLS44NS0uMi0uMi0uNi0uMzQtLjg4LS4zSDguOHEtLjIzLjA2LS40Ni4ydi0uNTRsLjE0LTEuMDN2LS4wMWwuMDUtLjM2YzAtLjA1LjAyLS4xMi0uMDgtLjNMOC4zLjUzSC41M20xLjI2IDEuMjZoNS40bC0uMDkuNjctLjAxLjVjMCAuMTktLjAxLjMuMDIuNDkuMDQuMzEuMTMuNjMuNDQuODdzLjc3LjIyIDEuMDYuMDhjLjE0LS4wNi4xOC0uMS4yNS0uMTRsLjAxLjA1Yy4wMi4wOC4wMS4wNC4wMS4yM3YuMjNsLS4wMy4wN2MtLjItLjE0LS40LS4yOC0uNzMtLjI4LS4yOCAwLS42LjE3LS43NS4zOWExLjQgMS40IDAgMCAwLS4yNi42NnYuMDFxLS4wNS40MS0uMDIuODNsLjEuNzNxLS4yNy0uMDQtLjUtLjA3bC0uNTUtLjAyYy0uMiAwLS4zMS0uMDItLjUyLjAyLS4yNy4wNC0uNTQuMTEtLjc4LjM0cy0uMzEuNjUtLjI0Ljk0Yy4wNi4yMy4xNC4zMy4yMy40NmwtLjA2LjAyLS4yLjAxYy0uMjMgMC0uMTEuMDItLjI4LS4wMWgtLjAybC0uMDItLjAycS4xNi0uMjMuMjEtLjQxYy4xLS4zLjAzLS43Mi0uMi0uOTdhMS4zIDEuMyAwIDAgMC0uODEtLjM2Yy0uMi0uMDMtLjMtLjAyLS41LS4wMnEtLjI3IDAtLjUuMDJsLS42Ni4wOHptOS44MyA1LjMyLjA1LjAxaC4wMWwuMDcuMDNxLS4xNS4yMy0uMjIuNDFjLS4wOC4zLS4wMi43My4yMi45Ny4yNC4yNS41Mi4zMi44LjM2LjIuMDMuMy4wMi41LjAycS4yNyAwIC41LS4wMmwuNjYtLjA4djUuNEg4LjZsLS4wNS0uNHEtLjA1LS40LS4wNS0uNjlsLjA4LjA0aC4wMWMuMy4xMS40NS4xNC44IDBxLjQ4LS4yMS42Ny0uNjNjLjMtLjU3LjMyLTEuMjMuMTItMS44NGExLjUgMS41IDAgMCAwLS41My0uNzljLS4yNy0uMi0uNjUtLjI2LS45Ny0uMThxLS4xLjA0LS4xOC4wOSAwLS4zNy4wOS0xdi0uMDJxLjM4LjA2LjczLjEuMjUuMDIuNTUuMDJjLjIgMCAuMzEuMDEuNTItLjAyLjM3LS4wNi44LS4yLjk4LS42NS4xOC0uNDIgMC0uNzktLjIxLTEuMDlsLjA4LS4wMmMuMDgtLjAyLjA0LS4wMS4yMy0uMDF6TTIuODggOC41bC0uMDUuMDh2LjAyYy0uMS4zLS4xMy40NS4wMS44LjEuMjMuMi4zNi4zOC41LjMuMjQuNjUuMzQgMSAuMzhxLjU0LjA3IDEuMS0uMS40Ni0uMTQuNzgtLjUzYy4yLS4yOC4yNS0uNjYuMTctLjk4cS0uMDMtLjA4LS4wOC0uMTZjLjI2IDAgLjU2LjAyIDEgLjA4aC4wM2ExMCAxMCAwIDAgMC0uMTQgMS40NHEuMDEuNS4xNy44NGMuMTMuMjcuNDcuNTYuODIuNTcuMzIuMDIuNTYtLjEyLjc4LS4yN2wuMDIuMDdjLjAyLjA4LjAxLjA0LjAxLjIzdi4yMmwtLjAzLjA3LS4yLS4xMy0uMDItLjAxLS4wMi0uMDFjLS4zLS4xNC0uNzUtLjE3LTEuMDYuMDgtLjMxLjI0LS40LjU2LS40NC44Ny0uMDMuMi0uMDIuMy0uMDIuNDlsLjAxLjUuMDkuNjdoLTUuNFY4LjZsLjM1LS4wNXEuNDQtLjA1LjczLS4wNW0xMi4xMSA2Ljk2LS4wNS4wMWgtLjAzeiIgc3R5bGU9ImJhc2VsaW5lLXNoaWZ0OmJhc2VsaW5lO2Rpc3BsYXk6aW5saW5lO292ZXJmbG93OnZpc2libGU7dmVjdG9yLWVmZmVjdDpub25lO2ZpbGw6IzAwMDtzdG9wLWNvbG9yOiMwMDA7c3RvcC1vcGFjaXR5OjE7b3BhY2l0eToxIi8+PC9zdmc+'

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
