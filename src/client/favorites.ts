/**
 * Client-side favorites (plan 3.2): slugs live in the host's durable
 * state.json behind the same-origin /favorite route. The cache is a
 * module-level external store so every mount (better-sidebar tab and the
 * settings section render separate React roots) sees the same list; updates
 * are optimistic, with the host response as the source of truth.
 */
import { useSyncExternalStore } from 'react'

export const FAVORITE_ROUTE = '/plugins/dsh-plugins-mp/favorite'

let favorites: string[] = []
let loaded = false
const listeners = new Set<() => void>()

function emit(): void {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

function getSnapshot(): string[] {
  return favorites
}

function adopt(value: unknown): void {
  if (!Array.isArray(value)) return
  favorites = value.filter((x): x is string => typeof x === 'string' && x.length > 0)
  emit()
}

/** Kick off the initial load once per document; never throws. */
export function ensureFavorites(): void {
  if (loaded) return
  loaded = true
  fetch(FAVORITE_ROUTE, { headers: { accept: 'application/json' } })
    .then((res) => (res.ok ? res.json() : null))
    .then((body: { favorites?: unknown } | null) => {
      adopt(body?.favorites)
      loaded = false
    })
    .catch(() => { loaded = false })
}

/** Reactive favorites list shared by all mounts. */
export function useFavorites(): string[] {
  return useSyncExternalStore(subscribe, getSnapshot)
}

/** Optimistic flip; a failed request reverts on the next GET (tab reopen). */
export function toggleFavorite(slug: string): void {
  const on = !favorites.includes(slug)
  favorites = on ? [...favorites, slug] : favorites.filter((item) => item !== slug)
  emit()
  fetch(FAVORITE_ROUTE, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ slug, on }),
  })
    .then((res) => (res.ok ? res.json() : null))
    .then((body: { favorites?: unknown } | null) => { adopt(body?.favorites) })
    .catch(() => {})
}
