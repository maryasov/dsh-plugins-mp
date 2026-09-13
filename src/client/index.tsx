/**
 * dsh-plugins-mp, browser half: a marketplace catalog tab for DSH, styled in
 * the dsh-market spirit — app-store card grid, detail view with the full
 * description, current-host compatibility badge and a one-click Install that
 * goes through the plugin's host half (POST /plugins/dsh-plugins-mp/install →
 * `dsh plugin --profile <p> add <source>`).
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

export const API_BASE = 'https://dsh-plugins-mp.com/api'
const HOST_ROUTE = '/plugins/dsh-plugins-mp/host'
const INSTALL_ROUTE = '/plugins/dsh-plugins-mp/install'

// ---------------------------------------------------------------- API (client-side mirror)

type CompatStatus = 'passed' | 'failed' | 'timeout' | 'error'

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
  compat?: Record<string, string>
}

interface MpTestRun {
  dshRelease: string
  releaseIndex: number
  profile: string
  status: CompatStatus
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
  const source = card.npmPackage
    ?? (card.repoOwner && card.repoName ? `github:${card.repoOwner}/${card.repoName}` : card.slug)
  return `dsh plugin --profile ${profile} add ${source}`
}

interface InstallResult {
  ok: boolean
  command: string
  output: string
  code: number | null
  timedOut: boolean
  error?: string
}

async function requestInstall(slug: string, profile: string): Promise<InstallResult> {
  const res = await fetch(INSTALL_ROUTE, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ slug, profile }),
  })
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok) {
    return { ok: false, command: '', output: '', code: null, timedOut: false, error: String(body.error ?? res.status) }
  }
  return body as unknown as InstallResult
}

// ---------------------------------------------------------------- i18n (browser)

const UI = {
  en: {
    title: 'Marketplace',
    search: 'Search plugins…',
    copy: 'Copy',
    copied: 'Copied!',
    similar: 'Similar plugins',
    compatibility: 'Compatibility',
    current: 'current DSH',
    notTested: 'not tested',
    works: 'works',
    failed: 'install failed',
    timeout: 'timeout',
    by: 'by',
    install: 'Install',
    installing: 'Installing…',
    installed: 'Installed',
    installFailed: 'Install failed',
    back: '← Back',
    empty: 'Nothing found',
    loadMore: 'Load more',
    loading: 'Loading…',
    profile: 'Profile',
  },
  zh: {
    title: '插件市场',
    search: '搜索插件…',
    copy: '复制',
    copied: '已复制！',
    similar: '相似插件',
    compatibility: '兼容性',
    current: '当前 DSH',
    notTested: '未测试',
    works: '正常',
    failed: '安装失败',
    timeout: '超时',
    by: '作者',
    install: '安装',
    installing: '安装中…',
    installed: '已安装',
    installFailed: '安装失败',
    back: '← 返回',
    empty: '没有找到',
    loadMore: '加载更多',
    loading: '加载中…',
    profile: '配置',
  },
  ru: {
    title: 'Маркетплейс',
    search: 'Поиск плагинов…',
    copy: 'Копировать',
    copied: 'Скопировано!',
    similar: 'Похожие плагины',
    compatibility: 'Совместимость',
    current: 'текущий DSH',
    notTested: 'не тестировался',
    works: 'работает',
    failed: 'ошибка установки',
    timeout: 'таймаут',
    by: 'автор',
    install: 'Установить',
    installing: 'Установка…',
    installed: 'Установлено',
    installFailed: 'Ошибка установки',
    back: '← Назад',
    empty: 'Ничего не найдено',
    loadMore: 'Ещё',
    loading: 'Загрузка…',
    profile: 'Профиль',
  },
} as const

type UiKey = keyof (typeof UI)['en']
type UiDict = Record<UiKey, string>

function uiLang(): UiDict {
  const nav = typeof navigator !== 'undefined' ? navigator.language : 'en'
  return UI[nav.startsWith('zh') ? 'zh' : nav.startsWith('ru') ? 'ru' : 'en'] as UiDict
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
    fontSize: 13,
  },
  header: { padding: '10px 12px 8px', display: 'flex', flexDirection: 'column', gap: 8 },
  titleRow: { display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 },
  hostBadge: {
    marginLeft: 'auto',
    fontSize: 11,
    padding: '2px 8px',
    borderRadius: 999,
    border: '1px solid var(--dsw-alias-border, rgba(128,128,128,0.35))',
    opacity: 0.85,
    whiteSpace: 'nowrap',
  },
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
  list: { flex: 1, minHeight: 0, overflowY: 'auto', padding: '2px 12px 14px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(235px, 1fr))', gap: 10 },
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    textAlign: 'left',
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid var(--dsw-alias-border, rgba(128,128,128,0.28))',
    background: 'var(--dsw-alias-bg-base, rgba(128,128,128,0.06))',
    color: 'inherit',
    cursor: 'pointer',
    font: 'inherit',
    minHeight: 118,
  },
  cardHead: { display: 'flex', gap: 8, alignItems: 'center' },
  avatar: {
    width: 28,
    height: 28,
    flexShrink: 0,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 700,
    color: '#fff',
  },
  cardName: { fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  cardStars: { marginLeft: 'auto', opacity: 0.7, fontSize: 12, whiteSpace: 'nowrap' },
  desc: {
    opacity: 0.78,
    fontSize: 12,
    lineHeight: 1.4,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  cardFoot: { marginTop: 'auto', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' },
  badge: {
    display: 'inline-block',
    padding: '1px 8px',
    borderRadius: 999,
    border: '1px solid var(--dsw-alias-border, rgba(128,128,128,0.35))',
    fontSize: 11,
    whiteSpace: 'nowrap',
  },
  installBtn: {
    marginLeft: 'auto',
    border: '1px solid var(--dsw-alias-border, rgba(128,128,128,0.35))',
    borderRadius: 6,
    padding: '3px 10px',
    cursor: 'pointer',
    font: 'inherit',
    fontSize: 12,
    background: 'var(--dsw-alias-bg-layer-1, rgba(128,128,128,0.12))',
    color: 'inherit',
  },
  body: { flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 14px 14px', lineHeight: 1.55 },
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
  bigInstall: {
    border: '1px solid var(--dsw-alias-border, rgba(128,128,128,0.35))',
    borderRadius: 8,
    padding: '6px 16px',
    cursor: 'pointer',
    font: 'inherit',
    fontWeight: 600,
    background: 'var(--dsw-alias-bg-layer-1, rgba(128,128,128,0.12))',
    color: 'inherit',
  },
  select: {
    border: '1px solid var(--dsw-alias-border, rgba(128,128,128,0.35))',
    borderRadius: 6,
    padding: '4px 6px',
    font: 'inherit',
    fontSize: 12,
    background: 'var(--dsw-alias-bg-base, transparent)',
    color: 'inherit',
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
  pre: {
    background: 'var(--dsw-alias-bg-base, rgba(128,128,128,0.12))',
    border: '1px solid var(--dsw-alias-border, rgba(128,128,128,0.25))',
    borderRadius: 6,
    padding: '8px 10px',
    overflowX: 'auto',
    fontSize: 12,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  },
  code: {
    background: 'var(--dsw-alias-bg-base, rgba(128,128,128,0.14))',
    borderRadius: 4,
    padding: '0 4px',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 12,
  },
  out: {
    background: 'var(--dsw-alias-bg-base, rgba(128,128,128,0.12))',
    borderRadius: 6,
    padding: '8px 10px',
    fontSize: 11,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
    maxHeight: 180,
    overflowY: 'auto',
  },
  err: { color: '#e05252', fontSize: 12 },
}

const BADGE_TONE: Record<string, React.CSSProperties> = {
  passed: { background: 'rgba(58,160,96,0.16)', borderColor: 'rgba(58,160,96,0.5)' },
  failed: { background: 'rgba(224,82,82,0.14)', borderColor: 'rgba(224,82,82,0.5)' },
  error: { background: 'rgba(224,82,82,0.14)', borderColor: 'rgba(224,82,82,0.5)' },
  timeout: { background: 'rgba(224,160,60,0.16)', borderColor: 'rgba(224,160,60,0.55)' },
  unknown: { opacity: 0.7 },
}

const STATUS_KEY: Record<string, UiKey> = {
  passed: 'works',
  failed: 'failed',
  error: 'failed',
  timeout: 'timeout',
}

const AVATAR_COLORS = ['#4f7cc9', '#5aa06c', '#b06fc9', '#c98a4f', '#c94f6d', '#4fb0c9', '#8a8a8a']

function avatarStyle(name: string): React.CSSProperties {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0
  return { ...S.avatar, background: AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] }
}

// ---------------------------------------------------------------- markdown (mini)

function inlineMd(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(!?\[[^\]]*\]\([^)]+\))/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const token = m[0]
    const k = `${key}-${i++}`
    if (token.startsWith('`')) {
      out.push(<code key={k} style={S.code}>{token.slice(1, -1)}</code>)
    } else if (token.startsWith('**')) {
      out.push(<strong key={k}>{token.slice(2, -2)}</strong>)
    } else if (token.startsWith('!')) {
      // image — render as a link, never load remote images
      const mm = /\[([^\]]*)\]\(([^)]+)\)/.exec(token.slice(1))
      out.push(<a key={k} href={mm?.[2] ?? '#'} target="_blank" rel="noreferrer">{mm?.[1] ?? 'image'}</a>)
    } else {
      const mm = /\[([^\]]*)\]\(([^)]+)\)/.exec(token)
      out.push(<a key={k} href={mm?.[2] ?? '#'} target="_blank" rel="noreferrer">{mm?.[1] ?? token}</a>)
    }
    last = m.index + token.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

function Markdown(props: { source: string }): ReactNode {
  const lines = props.source.split(/\r?\n/)
  const blocks: ReactNode[] = []
  let para: string[] = []
  let list: string[] = []
  let code: string[] | null = null
  const flushPara = (key: string) => {
    if (para.length > 0) {
      blocks.push(<p key={key} style={{ margin: '6px 0' }}>{inlineMd(para.join(' '), key)}</p>)
      para = []
    }
  }
  const flushList = (key: string) => {
    if (list.length > 0) {
      blocks.push(
        <ul key={key} style={{ margin: '6px 0', paddingLeft: 20 }}>
          {list.map((li, j) => <li key={j}>{inlineMd(li, `${key}-${j}`)}</li>)}
        </ul>,
      )
      list = []
    }
  }
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.trim().startsWith('```')) {
      flushPara(`p${i}`)
      flushList(`l${i}`)
      if (code === null) {
        code = []
      } else {
        blocks.push(<pre key={`c${i}`} style={S.pre}>{code.join('\n')}</pre>)
        code = null
      }
      continue
    }
    if (code !== null) {
      code.push(line)
      continue
    }
    const heading = /^#{1,4}\s+(.*)$/.exec(line)
    if (heading !== null) {
      flushPara(`p${i}`)
      flushList(`l${i}`)
      blocks.push(
        <div key={`h${i}`} style={{ fontWeight: 700, margin: '12px 0 4px' }}>
          {inlineMd(heading[1], `h${i}`)}
        </div>,
      )
      continue
    }
    const li = /^\s*[-*+]\s+(.*)$/.exec(line)
    if (li !== null) {
      flushPara(`p${i}`)
      list.push(li[1])
      continue
    }
    if (line.trim() === '') {
      flushPara(`p${i}`)
      flushList(`l${i}`)
      continue
    }
    para.push(line)
  }
  flushPara('pend')
  flushList('lend')
  if (code !== null) blocks.push(<pre key="cend" style={S.pre}>{code.join('\n')}</pre>)
  return <>{blocks}</>
}

// ---------------------------------------------------------------- install state

type InstallState =
  | { phase: 'idle' }
  | { phase: 'busy' }
  | { phase: 'done' }
  | { phase: 'error'; message: string; output: string }

function InstallButton(props: {
  slug: string
  compact?: boolean
  profile?: string
}) {
  const t = uiLang()
  const [state, setState] = useState<InstallState>({ phase: 'idle' })
  const profile = props.profile ?? 'web'
  const start = () => {
    if (state.phase === 'busy') return
    setState({ phase: 'busy' })
    requestInstall(props.slug, profile)
      .then((r) => {
        if (r.ok) {
          setState({ phase: 'done' })
        } else {
          setState({ phase: 'error', message: r.error ?? `exit ${String(r.code)}`, output: r.output })
        }
      })
      .catch((e) => setState({ phase: 'error', message: String(e), output: '' }))
  }
  const label =
    state.phase === 'busy' ? t.installing
      : state.phase === 'done' ? `✓ ${t.installed}`
        : state.phase === 'error' ? t.installFailed
          : t.install
  if (props.compact) {
    return (
      <button
        style={{
          ...S.installBtn,
          ...(state.phase === 'done' ? BADGE_TONE.passed : {}),
          ...(state.phase === 'error' ? BADGE_TONE.failed : {}),
        }}
        onClick={(e) => {
          e.stopPropagation()
          start()
        }}
        disabled={state.phase === 'busy'}
        title={state.phase === 'error' ? state.message : undefined}
      >
        {label}
      </button>
    )
  }
  return (
    <span>
      <button style={S.bigInstall} onClick={start} disabled={state.phase === 'busy'}>
        {label}
      </button>
      {state.phase === 'error' && (
        <div style={{ marginTop: 8 }}>
          <div style={S.err}>{state.message}</div>
          {state.output !== '' && <pre style={S.out}>{state.output}</pre>}
        </div>
      )}
    </span>
  )
}

// ---------------------------------------------------------------- catalog

function compatBadge(
  card: MpCard,
  dshVersion: string | null,
  t: UiDict,
): ReactNode {
  if (dshVersion === null) return null
  const status = card.compat?.[dshVersion]
  if (status === undefined) {
    return <span style={{ ...S.badge, ...BADGE_TONE.unknown }}>DSH {dshVersion}: {t.notTested}</span>
  }
  return (
    <span style={{ ...S.badge, ...BADGE_TONE[status] }}>
      DSH {dshVersion}: {t[STATUS_KEY[status] ?? 'notTested']}
    </span>
  )
}

function Card(props: { card: MpCard; dshVersion: string | null; onOpen: () => void }) {
  const t = uiLang()
  const c = props.card
  return (
    <button style={S.card} onClick={props.onOpen}>
      <span style={S.cardHead}>
        <span style={avatarStyle(c.authorName ?? c.slug)}>
          {(c.displayName || c.slug).slice(0, 1).toUpperCase()}
        </span>
        <span style={S.cardName}>{c.displayName}</span>
        <span style={S.cardStars}>★ {c.stars}</span>
      </span>
      {c.shortDescription !== null && c.shortDescription !== '' && (
        <span style={S.desc}>{c.shortDescription}</span>
      )}
      <span style={S.cardFoot}>
        {compatBadge(c, props.dshVersion, t)}
        <InstallButton slug={c.slug} compact />
      </span>
    </button>
  )
}

function CatalogView(props: MpTabProps) {
  void props
  const t = uiLang()
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<MpCard[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [slug, setSlug] = useState<string | null>(null)
  const [dshVersion, setDshVersion] = useState<string | null>(null)

  useEffect(() => {
    // Host version for the "current DSH" compatibility badge. Relative URL —
    // served by the same harness the tab runs in. Absent → no badges.
    fetch(HOST_ROUTE)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { dsh?: { version?: string } } | null) => {
        const v = d?.dsh?.version
        setDshVersion(v !== undefined && v !== 'unknown' ? v : null)
      })
      .catch(() => {})
  }, [])

  const load = (q: string, nextPage: number, replace: boolean) => {
    const ctrl = new AbortController()
    setLoading(true)
    const usp = new URLSearchParams({ limit: '25', page: String(nextPage), installable: '1' })
    if (q !== '') usp.set('q', q)
    api<{ items: MpCard[]; total: number }>(`/plugins?${usp.toString()}`, ctrl.signal)
      .then((d) => {
        setItems((prev) => (replace ? d.items : [...prev, ...d.items]))
        setTotal(d.total)
        setPage(nextPage)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
    return () => ctrl.abort()
  }

  useEffect(() => {
    if (slug !== null) return
    return load(query, 1, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  return (
    <div style={S.root}>
      {slug !== null ? (
        <DetailView slug={slug} dshVersion={dshVersion} onBack={() => setSlug(null)} onOpenSlug={(s) => setSlug(s)} />
      ) : (
        <>
          <div style={S.header}>
            <div style={S.titleRow}>
              🧩 {t.title}
              {dshVersion !== null && <span style={S.hostBadge}>DSH {dshVersion}</span>}
            </div>
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
            <div style={S.grid}>
              {items.map((c) => (
                <Card key={c.slug} card={c} dshVersion={dshVersion} onOpen={() => setSlug(c.slug)} />
              ))}
            </div>
            {loading && <div style={{ ...S.muted, padding: '8px 2px' }}>{t.loading}</div>}
            {!loading && items.length === 0 && <div style={{ ...S.muted, padding: '8px 2px' }}>{t.empty}</div>}
            {!loading && items.length < total && (
              <button
                style={{ ...S.installBtn, marginLeft: 0, marginTop: 10 }}
                onClick={() => load(query, page + 1, false)}
              >
                {t.loadMore} ({items.length}/{total})
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------- detail

function DetailView(props: {
  slug: string
  dshVersion: string | null
  onBack: () => void
  onOpenSlug: (slug: string) => void
}) {
  const t = uiLang()
  const [detail, setDetail] = useState<MpDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [profile, setProfile] = useState('web')

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

  if (error !== null) return <div style={S.body}>{t.empty} ({error})</div>
  if (detail === null) return <div style={S.body}>{t.loading}</div>

  const p = detail.plugin
  const cmd = installCommandFor(p, profile)
  const tr = p.translations.find((x) => x.kind === 'description' && !x.isMachine)
    ?? p.translations.find((x) => x.kind === 'description')
  const desc = tr?.textMd !== undefined && tr.textMd !== '' ? tr.textMd : p.descriptionMd
  const runs = detail.versions[0]?.testRuns ?? []
  const currentRun = props.dshVersion !== null
    ? runs.find((r) => r.dshRelease === props.dshVersion)
    : undefined
  const otherRuns = runs.filter((r) => r.dshRelease !== props.dshVersion)
  const similar = detail.similar

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={S.header}>
        <button style={S.backBtn} onClick={props.onBack}>{t.back}</button>
        <div style={{ ...S.titleRow, gap: 10 }}>
          <span style={avatarStyle(p.authorName ?? p.slug)}>
            {(p.displayName || p.slug).slice(0, 1).toUpperCase()}
          </span>
          <span style={{ fontSize: 15 }}>{p.displayName}</span>
          <span style={S.cardStars}>★ {p.stars}</span>
        </div>
        <div style={S.muted}>
          {p.authorName !== null ? `${t.by}: ${p.authorName} · ` : ''}
          {p.latestVersion ?? ''}
          {p.license !== null ? ` · ${p.license}` : ''}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <InstallButton slug={p.slug} profile={profile} />
          <select style={S.select} value={profile} onChange={(e) => setProfile(e.target.value)}>
            <option value="web">web</option>
            <option value="tui">tui</option>
            <option value="agent">agent</option>
          </select>
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
        {p.deprecatedReason !== null && <div style={S.err}>{p.deprecatedReason}</div>}
      </div>
      <div style={S.body}>
        {props.dshVersion !== null && (
          <div style={{ marginBottom: 10 }}>
            <div style={S.muted}>
              {t.compatibility} — DSH {props.dshVersion} ({t.current})
            </div>
            <span style={{ ...S.badge, ...BADGE_TONE[currentRun?.status ?? 'unknown'] }}>
              DSH {props.dshVersion}:{' '}
              {currentRun === undefined ? t.notTested : t[STATUS_KEY[currentRun.status] ?? 'notTested']}
            </span>
            {otherRuns.length > 0 && (
              <span style={{ ...S.badge, ...BADGE_TONE.unknown, marginLeft: 6 }}>
                {otherRuns.map((r) => `${r.dshRelease}: ${t[STATUS_KEY[r.status] ?? 'notTested']}`).join(' · ')}
              </span>
            )}
          </div>
        )}
        {desc !== '' ? <Markdown source={desc} /> : <div style={S.muted}>{t.empty}</div>}
        {similar.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={S.muted}>{t.similar}</div>
            <div style={{ ...S.grid, marginTop: 8 }}>
              {similar.map((c) => (
                <Card key={c.slug} card={c} dshVersion={null} onOpen={() => props.onOpenSlug(c.slug)} />
              ))}
            </div>
          </div>
        )}
      </div>
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
          description: () => 'dsh-plugins-mp.com',
          order: 55,
          single: true,
          component: (tabProps) => <CatalogView {...tabProps} />,
        }),
      'dsh-plugins-mp: catalog tab')
    },
  })
}
