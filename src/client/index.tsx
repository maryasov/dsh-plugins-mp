/**
 * dsh-plugins-mp, browser half: a marketplace catalog tab for DSH.
 *
 * Soft integration with dsh-better-sidebar (omdsh-dev): its client half
 * publishes ctx.betterSidebar (registerTab). We restate the minimal contract
 * here instead of value-importing the package, and mount the tab through a
 * child fiber with inject: ['betterSidebar'] (the cordis dynamic pattern) —
 * it activates whenever the service lands and never blocks web boot on hosts
 * without better-sidebar.
 */
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

interface MpTabProps {
  readonly visible: boolean
  readonly scope: { sessionId: string; cwd?: string }
}

interface MpTabDescriptor {
  readonly id: string
  readonly title: string | (() => string)
  readonly description?: string | (() => string)
  readonly icon?: ReactNode | ((size: number) => ReactNode)
  readonly order?: number
  readonly single?: boolean
  readonly component: (props: MpTabProps) => ReactNode
}

interface BetterSidebarLike {
  registerTab(descriptor: MpTabDescriptor): () => void
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    /** Present only when dsh-better-sidebar's client half is loaded. */
    readonly betterSidebar?: BetterSidebarLike
  }
}

export const API_BASE = 'https://dsh-plugins.vue-z.com/api'

// ---------------------------------------------------------------- API (client-side mirror)

interface MpCard {
  slug: string
  displayName: string
  authorName: string | null
  shortDescription: string | null
  npmPackage: string | null
  repoOwner: string | null
  repoName: string | null
  stars: number
  npmDownloadsWeek: number
  license: string | null
  latestVersion: string | null
  tags: string[]
  categories: string[]
}

interface MpTestRun {
  dshRelease: string
  releaseIndex: number
  profile: string
  status: 'passed' | 'failed' | 'timeout' | 'error'
}

interface MpDetail {
  plugin: MpCard & {
    descriptionMd: string
    originalLang: string
    capabilities: Record<string, boolean>
    deprecatedReason: string | null
    translations: Array<{ locale: string; kind: string; textMd: string; isMachine: boolean }>
  }
  versions: Array<{ version: string; testRuns?: MpTestRun[] }>
  similar: MpCard[]
}

async function api<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: { accept: 'application/json' }, signal })
  if (!res.ok) throw new Error(`${res.status}`)
  return (await res.json()) as T
}

function installCommandFor(card: MpCard, profile = 'web'): string {
  // npm package when known, otherwise the GitHub repo (pnpm `github:` shorthand).
  const source = card.npmPackage
    ?? (card.repoOwner && card.repoName ? `github:${card.repoOwner}/${card.repoName}` : card.slug)
  return `dsh plugin --profile ${profile} add ${source}`
}

// ---------------------------------------------------------------- i18n (browser)

const UI = {
  en: {
    title: 'Marketplace',
    search: 'Search plugins…',
    install: 'Install',
    copy: 'Copy',
    copied: 'Copied!',
    similar: 'Similar',
    compatibility: 'Compatibility',
    back: '← Back',
    empty: 'Nothing found',
    loadMore: 'Load more',
    loading: 'Loading…',
    works: 'works',
    failed: 'install failed',
    timeout: 'timeout',
    by: 'by',
  },
  zh: {
    title: '插件市场',
    search: '搜索插件…',
    install: '安装',
    copy: '复制',
    copied: '已复制！',
    similar: '相似插件',
    compatibility: '兼容性',
    back: '← 返回',
    empty: '没有找到',
    loadMore: '加载更多',
    loading: '加载中…',
    works: '正常',
    failed: '安装失败',
    timeout: '超时',
    by: '作者',
  },
  ru: {
    title: 'Маркетплейс',
    search: 'Поиск плагинов…',
    install: 'Установка',
    copy: 'Копировать',
    copied: 'Скопировано!',
    similar: 'Похожие',
    compatibility: 'Совместимость',
    back: '← Назад',
    empty: 'Ничего не найдено',
    loadMore: 'Ещё',
    loading: 'Загрузка…',
    works: 'работает',
    failed: 'ошибка установки',
    timeout: 'таймаут',
    by: 'автор',
  },
} as const

type UiDict = Record<keyof (typeof UI)['en'], string>

function uiLang(): UiDict {
  const nav = typeof navigator !== 'undefined' ? navigator.language : 'en'
  const dict = UI[nav.startsWith('zh') ? 'zh' : nav.startsWith('ru') ? 'ru' : 'en']
  return dict as UiDict
}

// ---------------------------------------------------------------- styles (token-driven)

const S: Record<string, React.CSSProperties> = {
  root: {
    height: '100%',
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--dsw-alias-bg-layer-1, transparent)',
    color: 'inherit',
    overflow: 'hidden',
  },
  header: { padding: '10px 12px 8px', display: 'flex', flexDirection: 'column', gap: 8 },
  titleRow: { display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 },
  search: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '6px 10px',
    borderRadius: 6,
    border: '1px solid var(--dsw-alias-border, rgba(128,128,128,0.35))',
    background: 'var(--dsw-alias-bg-base, transparent)',
    color: 'inherit',
    outline: 'none',
    fontSize: 13,
  },
  list: { flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 8px 12px' },
  item: {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '8px 10px',
    borderRadius: 8,
    border: 'none',
    background: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
    font: 'inherit',
  },
  itemHead: { display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' },
  name: { fontWeight: 600, fontSize: 13 },
  stars: { opacity: 0.7, fontSize: 12, whiteSpace: 'nowrap' },
  desc: { opacity: 0.75, fontSize: 12, marginTop: 2 },
  body: { flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 12px 12px', fontSize: 13, lineHeight: 1.5 },
  cmd: {
    display: 'flex',
    gap: 6,
    alignItems: 'center',
    marginTop: 6,
    padding: '6px 8px',
    borderRadius: 6,
    background: 'var(--dsw-alias-bg-base, rgba(128,128,128,0.12))',
    border: '1px solid var(--dsw-alias-border, rgba(128,128,128,0.25))',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 12,
    overflowWrap: 'anywhere',
  },
  copyBtn: {
    marginLeft: 'auto',
    flexShrink: 0,
    border: 'none',
    borderRadius: 5,
    padding: '3px 8px',
    cursor: 'pointer',
    font: 'inherit',
    fontSize: 11,
    background: 'var(--dsw-alias-bg-layer-1, rgba(128,128,128,0.2))',
    color: 'inherit',
  },
  badge: {
    display: 'inline-block',
    marginRight: 6,
    padding: '1px 7px',
    borderRadius: 999,
    border: '1px solid var(--dsw-alias-border, rgba(128,128,128,0.35))',
    fontSize: 11,
    opacity: 0.9,
  },
  muted: { opacity: 0.65, fontSize: 12 },
  backBtn: {
    border: 'none',
    background: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
    font: 'inherit',
    fontSize: 13,
    padding: '4px 0',
    textAlign: 'left',
  },
}

const STATUS_LABEL: Record<MpTestRun['status'], keyof UiDict> = {
  passed: 'works',
  failed: 'failed',
  error: 'failed',
  timeout: 'timeout',
}

// ---------------------------------------------------------------- components

function CatalogItem(props: { card: MpCard; onOpen: () => void }) {
  return (
    <button style={S.item} onClick={props.onOpen}>
      <span style={S.itemHead as React.CSSProperties}>
        <span style={S.name}>{props.card.displayName}</span>
        <span style={S.stars}>★ {props.card.stars}</span>
      </span>
      {props.card.shortDescription && <div style={S.desc}>{props.card.shortDescription}</div>}
    </button>
  )
}

function DetailView(props: { slug: string; onBack: () => void; onOpenSlug: (slug: string) => void }) {
  const t = uiLang()
  const [detail, setDetail] = useState<MpDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const ctrl = new AbortController()
    setDetail(null)
    setError(null)
    api<MpDetail>(`/plugins/${encodeURIComponent(props.slug)}`, ctrl.signal)
      .then(setDetail)
      .catch((e) => {
        if (!ctrl.signal.aborted) setError(String(e))
      })
    return () => ctrl.abort()
  }, [props.slug])

  if (error) return <div style={S.body}>{t.empty} ({error})</div>
  if (!detail) return <div style={S.body}>{t.loading}</div>

  const p = detail.plugin
  const cmd = installCommandFor(p)
  const tr = p.translations.find((x) => x.kind === 'description' && !x.isMachine)
    ?? p.translations.find((x) => x.kind === 'description')
  const desc = tr?.textMd || p.descriptionMd
  const runs = detail.versions[0]?.testRuns ?? []
  const similar = detail.similar.length > 0 ? detail.similar : []

  return (
    <>
      <div style={S.header}>
        <button style={S.backBtn} onClick={props.onBack}>{t.back}</button>
        <div style={S.titleRow}>
          <span>{p.displayName}</span>
          <span style={S.stars}>★ {p.stars}</span>
        </div>
        <div style={S.muted}>
          {p.authorName ? `${t.by}: ${p.authorName} · ` : ''}
          {p.latestVersion ?? ''}
        </div>
        <div style={S.cmd}>
          <span>{cmd}</span>
          <button
            style={S.copyBtn}
            onClick={() => {
              void navigator.clipboard?.writeText(cmd).then(() => {
                setCopied(true)
                setTimeout(() => setCopied(false), 1500)
              })
            }}
          >
            {copied ? t.copied : t.copy}
          </button>
        </div>
      </div>
      <div style={S.body}>
        {runs.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={S.muted}>{t.compatibility}</div>
            {runs.map((r) => (
              <span key={`${r.dshRelease}-${r.profile}`} style={S.badge}>
                DSH {r.dshRelease}: {t[STATUS_LABEL[r.status]]}
              </span>
            ))}
          </div>
        )}
        <div style={{ whiteSpace: 'pre-wrap' }}>{desc}</div>
        {similar.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={S.muted}>{t.similar}</div>
            {similar.map((c) => (
              <CatalogItem key={c.slug} card={c} onOpen={() => props.onOpenSlug(c.slug)} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function CatalogView(props: MpTabProps) {
  const t = uiLang()
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<MpCard[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [slug, setSlug] = useState<string | null>(null)

  const load = (q: string, page: number, replace: boolean) => {
    const ctrl = new AbortController()
    setLoading(true)
    const usp = new URLSearchParams({ limit: '25', page: String(page) })
    if (q) usp.set('q', q)
    usp.set('installable', '1')
    api<{ items: MpCard[]; total: number }>(`/plugins?${usp.toString()}`, ctrl.signal)
      .then((d) => {
        setItems((prev) => (replace ? d.items : [...prev, ...d.items]))
        setTotal(d.total)
        setPage(page)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
    return () => ctrl.abort()
  }

  useEffect(() => {
    if (slug) return
    return load(query, 1, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  return (
    <div style={S.root}>
      {slug ? (
        <DetailView slug={slug} onBack={() => setSlug(null)} onOpenSlug={(s) => setSlug(s)} />
      ) : (
        <>
          <div style={S.header}>
            <div style={S.titleRow}>🧩 {t.title}</div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                load(query, 1, true)
              }}
            >
              <input
                style={S.search}
                value={query}
                placeholder={t.search}
                onChange={(e) => setQuery(e.target.value)}
              />
            </form>
          </div>
          <div style={S.list}>
            {items.map((c) => (
              <CatalogItem key={c.slug} card={c} onOpen={() => setSlug(c.slug)} />
            ))}
            {loading && <div style={{ ...S.muted, padding: '8px 10px' }}>{t.loading}</div>}
            {!loading && items.length === 0 && <div style={{ ...S.muted, padding: '8px 10px' }}>{t.empty}</div>}
            {!loading && items.length < total && (
              <button style={{ ...S.item, opacity: 0.8 }} onClick={() => load(query, page + 1, false)}>
                {t.loadMore} ({items.length}/{total})
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------- apply

export function apply(ctx: import('@deepseek-ai/cordis').Context): void {
  // Soft integration: the tab mounts through a child fiber with its own
  // injection — a missing betterSidebar service never blocks web boot.
  void (ctx as unknown as {
    plugin: (plugin: { inject: string[]; apply: (pluginCtx: import('@deepseek-ai/cordis').Context) => void }) => unknown
  }).plugin({
    inject: ['betterSidebar'],
    apply(sidebarCtx) {
      const sidebar = (sidebarCtx as unknown as { betterSidebar: BetterSidebarLike }).betterSidebar
      ctx.effect(() =>
        sidebar.registerTab({
          id: 'dsh-plugins-mp:catalog',
          title: () => uiLang().title,
          description: () => 'dsh-plugins.vue-z.com',
          order: 55,
          single: true,
          component: (tabProps) => <CatalogView {...tabProps} />,
        }),
      'dsh-plugins-mp: catalog tab')
    },
  })
}
