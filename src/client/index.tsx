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
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { BrandMark } from './brand'

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

// The resolved backend. The browser half can't read config/.env/process.env, so
// the host half resolves it once and serves it at CONFIG_ROUTE (same origin); we
// adopt it on mount and fall back to the hosting backend below.
let API_BASE = 'https://dsh-plugins-mp.com/api'
const API_BASE_DEFAULT = 'https://dsh-plugins-mp.com/api'
const CONFIG_ROUTE = '/plugins/dsh-plugins-mp/config'
const HOST_ROUTE = '/plugins/dsh-plugins-mp/host'
const INSTALL_ROUTE = '/plugins/dsh-plugins-mp/install'
const SETTINGS_ROUTE = '/plugins/dsh-plugins-mp/settings'
const LOGS_ROUTE = '/plugins/dsh-plugins-mp/logs'

// The client appends /plugins, /categories, … to the base, so it must carry the
// /api segment the API server is reached under (dev.dsh-plugins-mp.com/api →
// nginx strips it → :4000). Tolerate a value that omits /api.
function normalizeBase(base: string): string {
  let b = base.replace(/\/+$/, '')
  if (/^https?:\/\//i.test(b) && !/\/api\b/.test(b)) b += '/api'
  return b
}

// Fetch the resolved backend once and remember it. Never throws — on any
// failure we keep the hosting backend so the tab always works. Memoized by
// promise so concurrent callers share a single /config fetch.
let basePromise: Promise<void> | null = null
function ensureApiBase(): Promise<void> {
  if (basePromise === null) {
    basePromise = (async () => {
      try {
        const res = await fetch(CONFIG_ROUTE, { headers: { accept: 'application/json' } })
        if (res.ok) {
          const { apiBase } = await res.json()
          if (typeof apiBase === 'string' && apiBase.length) API_BASE = normalizeBase(apiBase)
        }
      } catch {
        // stay on the hosting backend
      }
    })()
  }
  return basePromise
}

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
  primaryLanguage?: string | null
  categories?: string[]
  tags?: string[]
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
    homepageUrl: string | null
    sourceUpdatedAt: string | null
    translations: Array<{ locale: string; kind: string; textMd: string; isMachine: boolean }>
  }
  versions: Array<{ version: string; publishedAt?: string | null; testRuns?: MpTestRun[] }>
  similar: MpCard[]
}

async function api<T>(path: string, signal?: AbortSignal): Promise<T> {
  await ensureApiBase()
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
    all: 'All',
    sortStars: '★ Stars',
    sortUpdated: 'Updated',
    sortNewest: 'Newest',
    sortName: 'Name',
    updated: 'Updated',
    versions: 'Versions',
    tabMine: 'My plugins',
    tabFavorites: 'Favorites',
    tabThemes: 'Themes',
    tabDiagnostics: 'Diagnostics',
    tabSettings: 'Settings',
    comingSoon: 'This section ships in an upcoming update.',
    agentTools: 'Model tools (mp_search, mp_details…)',
    agentToolsHint: 'Lets the model search and inspect the marketplace inside conversations. Turn off to keep the context lean.',
    on: 'On',
    off: 'Off',
    saving: 'Saving…',
    saveError: 'Failed to save',
    eventLog: 'Event log',
    eventLogHint: 'A sanitized log of what the plugin did — for bug reports. Nothing is sent anywhere.',
    download: 'Download',
    installStats: 'Install statistics',
    installStatsSoon: 'planned',
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
    all: '全部',
    sortStars: '★ 星数',
    sortUpdated: '更新时间',
    sortNewest: '最新',
    sortName: '名称',
    updated: '更新于',
    versions: '版本',
    tabMine: '我的插件',
    tabFavorites: '收藏',
    tabThemes: '主题',
    tabDiagnostics: '诊断',
    tabSettings: '设置',
    comingSoon: '该分区将在后续更新中推出。',
    agentTools: '模型工具（mp_search、mp_details…）',
    agentToolsHint: '允许模型在对话中搜索和查看市场。关闭可保持上下文精简。',
    on: '开',
    off: '关',
    saving: '保存中…',
    saveError: '保存失败',
    eventLog: '事件日志',
    eventLogHint: '插件操作的脱敏日志 — 用于错误报告。不会发送到任何地方。',
    download: '下载',
    installStats: '安装统计',
    installStatsSoon: '计划中',
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
    all: 'Все',
    sortStars: '★ Звёзды',
    sortUpdated: 'Обновлённые',
    sortNewest: 'Новые',
    sortName: 'По имени',
    updated: 'Обновлено',
    versions: 'Версии',
    tabMine: 'Мои плагины',
    tabFavorites: 'Избранное',
    tabThemes: 'Темы',
    tabDiagnostics: 'Диагностика',
    tabSettings: 'Настройки',
    comingSoon: 'Раздел появится в ближайшем обновлении.',
    agentTools: 'Инструменты модели (mp_search, mp_details…)',
    agentToolsHint: 'Позволяет модели искать и изучать маркетплейс в беседах. Отключите, чтобы не засорять контекст.',
    on: 'Вкл',
    off: 'Выкл',
    saving: 'Сохранение…',
    saveError: 'Не удалось сохранить',
    eventLog: 'Журнал событий',
    eventLogHint: 'Очищенный лог действий плагина — для отчётов об ошибках. Никуда не отправляется.',
    download: 'Скачать',
    installStats: 'Статистика установок',
    installStatsSoon: 'планируется',
  },
} as const

type UiKey = keyof (typeof UI)['en']
type UiDict = Record<UiKey, string>

type LangCode = 'en' | 'zh' | 'ru'

function navLang(): LangCode {
  const nav = typeof navigator !== 'undefined' ? navigator.language : 'en'
  return nav.startsWith('zh') ? 'zh' : nav.startsWith('ru') ? 'ru' : 'en'
}

/** Язык интерфейса DSH: веб-приложение выставляет его в lang на <html> ("ru-RU"). */
function dshLang(): LangCode | null {
  if (typeof document === 'undefined') return null
  const l = (document.documentElement.getAttribute('lang') ?? '').slice(0, 2).toLowerCase()
  return l === 'en' || l === 'zh' || l === 'ru' ? (l as LangCode) : null
}

function langCode(): LangCode {
  return dshLang() ?? navLang()
}

let langSubscribers: Set<() => void> | null = null

function watchDshLang(cb: () => void): () => void {
  if (typeof document === 'undefined') return () => {}
  if (langSubscribers === null) {
    langSubscribers = new Set()
    // Один общий обсервер: DSH меняет атрибут lang на <html> при переключении
    // языка интерфейса — все подписчики (список, карточки, детали) узнают об
    // этом без собственных обсерверов.
    new MutationObserver(() => {
      for (const fn of langSubscribers!) fn()
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] })
  }
  langSubscribers.add(cb)
  return () => {
    langSubscribers!.delete(cb)
  }
}

/** Реактивный язык интерфейса: следует за переключением языка в DSH. */
function useUiLang(): LangCode {
  const [lang, setLang] = useState<LangCode>(() => langCode())
  useEffect(() => {
    const sync = (): void => setLang(langCode())
    sync()
    return watchDshLang(sync)
  }, [])
  return lang
}

function uiLang(): UiDict {
  return UI[langCode()] as UiDict
}

// Категории разделяем с сайтом: слаги из @dsh-mp/shared, подписи — как в
// локализациях dsh-plugins-mp.com (API отдаёт голый слаг в name).
const CAT_LABELS: Record<string, Record<LangCode, string>> = {
  ui: { en: 'UI & Experience', zh: '界面与体验', ru: 'Интерфейс и опыт' },
  themes: { en: 'Themes & Skins', zh: '主题与皮肤', ru: 'Темы и скины' },
  memory: { en: 'Memory & Context', zh: '记忆与上下文', ru: 'Память и контекст' },
  sessions: { en: 'Sessions & Messages', zh: '会话与消息', ru: 'Сессии и сообщения' },
  tools: { en: 'Tools & Capabilities', zh: '工具与能力', ru: 'Инструменты и возможности' },
  models: { en: 'Models & Providers', zh: '模型与供应商', ru: 'Модели и провайдеры' },
  workflow: { en: 'Workflow & Automation', zh: '工作流与自动化', ru: 'Автоматизация и воркфлоу' },
  terminal: { en: 'Terminal & Clients', zh: '终端与客户端', ru: 'Терминал и клиенты' },
  vision: { en: 'Vision & Multimodal', zh: '视觉与多模态', ru: 'Визуальные и мультимодальные' },
  notifications: { en: 'Notifications & Integrations', zh: '通知与集成', ru: 'Уведомления и интеграции' },
  dev: { en: 'Development & Infrastructure', zh: '开发与基础设施', ru: 'Разработка и инфраструктура' },
  security: { en: 'Security & Audit', zh: '安全与审计', ru: 'Безопасность и аудит' },
  fun: { en: 'Just for Fun', zh: '娱乐', ru: 'Развлечения' },
}

const LOCALE_LABEL: Record<string, string> = { en: 'EN', zh: '中文', ru: 'RU' }

function catLabel(slug: string, lang: LangCode): string {
  return CAT_LABELS[slug]?.[lang] ?? slug
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
  chipRow: {
    display: 'flex',
    gap: 6,
    overflowX: 'auto',
    flexWrap: 'nowrap',
    paddingBottom: 2,
    minWidth: 0,
  },
  chip: {
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 10px',
    borderRadius: 999,
    border: '1px solid var(--dsw-alias-border, rgba(128,128,128,0.35))',
    background: 'var(--dsw-alias-bg-base, transparent)',
    color: 'inherit',
    font: 'inherit',
    fontSize: 12,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  chipOn: {
    background: 'rgba(79,124,201,0.16)',
    borderColor: 'rgba(79,124,201,0.55)',
    fontWeight: 600,
  },
  metaRow: { display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' },
  link: { color: '#4f7cc9', overflowWrap: 'anywhere' },
  compatRow: { display: 'flex', gap: 6, alignItems: 'center', margin: '2px 0' },
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

function fmtNum(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n)
}

function fmtDate(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
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
        {c.primaryLanguage != null && <span style={S.badge}>{c.primaryLanguage}</span>}
        {c.npmDownloadsWeek > 0 && (
          <span style={S.cardStars}>↓ {fmtNum(c.npmDownloadsWeek)}/wk</span>
        )}
        <InstallButton slug={c.slug} compact />
      </span>
    </button>
  )
}

function CatalogView(props: MpTabProps) {
  void props
  const uiLangCode = useUiLang()
  const t = UI[uiLangCode] as UiDict
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<MpCard[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [slug, setSlug] = useState<string | null>(null)
  const [dshVersion, setDshVersion] = useState<string | null>(null)
  const [cats, setCats] = useState<Array<{ slug: string; count: number }>>([])
  const [cat, setCat] = useState('')
  const [sort, setSort] = useState<'stars' | 'updated' | 'newest' | 'name'>('stars')

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
    // Category chips with plugin counts.
    api<Array<{ slug: string; count: number }>>('/categories')
      .then(setCats)
      .catch(() => {})
  }, [])

  // Short-description translations are produced by the server asynchronously
  // (LLM queue, seconds per plugin). A page response reports pendingShort —
  // the number of cards still showing their original text — and we quietly
  // refetch the same query until it reaches zero, so cards flip to the UI
  // language without any user action. Capped so a broken backend can't spin
  // the tab forever.
  const AUTO_REFETCH_MS = 8000
  const AUTO_REFETCH_MAX = 10
  const autoRefetches = useRef(0)
  const refetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearRefetch = () => {
    if (refetchTimer.current !== null) {
      clearTimeout(refetchTimer.current)
      refetchTimer.current = null
    }
  }

  // Тихий дозапрос уже загруженных страниц, пока у сервера есть недопереведённые
  // карточки (pendingShort). Обновление точечное: существующие карточки замещаются
  // по slug, порядок и состав списка не меняются — дублей быть не может в отличие
  // от перезапуска load() с append-режимом (каждый полл дублировал страницу).
  const refreshTranslated = (q: string, upToPage: number) => {
    const pages = Array.from({ length: upToPage }, (_, i) => i + 1)
    Promise.all(
      pages.map((p) => {
        const usp = new URLSearchParams({ limit: '25', page: String(p), installable: '1' })
        if (q !== '') usp.set('q', q)
        if (cat !== '') usp.set('category', cat)
        usp.set('sort', sort)
        usp.set('locale', langCode())
        return api<{ items: MpCard[]; pendingShort?: number }>(`/plugins?${usp.toString()}`)
      }),
    )
      .then((results) => {
        const bySlug = new Map<string, MpCard>()
        let pending = 0
        for (const r of results) {
          pending += r.pendingShort ?? 0
          for (const c of r.items) bySlug.set(c.slug, c)
        }
        setItems((prev) => prev.map((c) => bySlug.get(c.slug) ?? c))
        if (pending > 0 && autoRefetches.current < AUTO_REFETCH_MAX) {
          autoRefetches.current += 1
          refetchTimer.current = setTimeout(() => refreshTranslated(q, upToPage), AUTO_REFETCH_MS)
        }
      })
      .catch(() => {})
  }

  const load = (q: string, nextPage: number, replace: boolean) => {
    // Новый (ручной) загруз отменяет запланированный дозапрос: параметры меняются.
    clearRefetch()
    autoRefetches.current = 0
    const ctrl = new AbortController()
    setLoading(true)
    const usp = new URLSearchParams({ limit: '25', page: String(nextPage), installable: '1' })
    if (q !== '') usp.set('q', q)
    if (cat !== '') usp.set('category', cat)
    usp.set('sort', sort)
    usp.set('locale', langCode())
    api<{ items: MpCard[]; total: number; pendingShort?: number }>(
      `/plugins?${usp.toString()}`,
      ctrl.signal,
    )
      .then((d) => {
        setItems((prev) => (replace ? d.items : [...prev, ...d.items]))
        setTotal(d.total)
        setPage(nextPage)
        if ((d.pendingShort ?? 0) > 0 && autoRefetches.current < AUTO_REFETCH_MAX) {
          autoRefetches.current += 1
          refetchTimer.current = setTimeout(() => refreshTranslated(q, nextPage), AUTO_REFETCH_MS)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
    return () => {
      ctrl.abort()
      clearRefetch()
    }
  }

  useEffect(() => {
    if (slug !== null) return
    return load(query, 1, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, cat, sort])

  // Переключение языка интерфейса DSH (html lang): тихо переводим уже
  // загруженные карточки под новый язык. Дозапрос тех же страниц мерджится
  // по slug, а заодно ставит серверу задачи на недостающие переводы —
  // дальше работает обычная цепочка auto-refetch (pendingShort).
  const prevUiLang = useRef(uiLangCode)
  useEffect(() => {
    if (prevUiLang.current === uiLangCode) return
    prevUiLang.current = uiLangCode
    if (slug !== null) return
    autoRefetches.current = 0
    refreshTranslated(query, page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uiLangCode])

  return (
    <div style={S.root}>
      {slug !== null ? (
        <DetailView slug={slug} dshVersion={dshVersion} onBack={() => setSlug(null)} onOpenSlug={(s) => setSlug(s)} />
      ) : (
        <>
          <div style={S.header}>
            <div style={S.titleRow}>
              <BrandMark size={18} />
              {t.title}
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
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ ...S.chipRow, flex: 1 }}>
                <button
                  style={{ ...S.chip, ...(cat === '' ? S.chipOn : {}) }}
                  onClick={() => setCat('')}
                >
                  {t.all}
                </button>
                {cats.map((c) => (
                  <button
                    key={c.slug}
                    style={{ ...S.chip, ...(cat === c.slug ? S.chipOn : {}) }}
                    onClick={() => setCat(c.slug)}
                  >
                    {catLabel(c.slug, uiLangCode)}{' '}
                    <span style={{ opacity: 0.6 }}>{c.count}</span>
                  </button>
                ))}
              </div>
              <select
                style={S.select}
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof sort)}
              >
                <option value="stars">{t.sortStars}</option>
                <option value="updated">{t.sortUpdated}</option>
                <option value="newest">{t.sortNewest}</option>
                <option value="name">{t.sortName}</option>
              </select>
            </div>
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
  const uiLangCode = useUiLang()
  const t = UI[uiLangCode] as UiDict
  const [detail, setDetail] = useState<MpDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [profile, setProfile] = useState('web')
  const [descLoc, setDescLoc] = useState<string | null>(null)

  useEffect(() => {
    const ctrl = new AbortController()
    setDetail(null)
    setError(null)
    setDescLoc(null)
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
  // Description locales: original first, then translations; a human
  // translation wins over a machine one for the same locale.
  const descLocales: Array<{ locale: string; isMachine: boolean; text: string }> = [
    { locale: p.originalLang, isMachine: false, text: p.descriptionMd },
  ]
  for (const x of p.translations) {
    if (x.kind !== 'description' || x.textMd.trim() === '') continue
    const hit = descLocales.find((o) => o.locale === x.locale)
    if (hit === undefined) {
      descLocales.push({ locale: x.locale, isMachine: x.isMachine, text: x.textMd })
    } else if (hit.isMachine && !x.isMachine) {
      hit.isMachine = false
      hit.text = x.textMd
    }
  }
  const lang = uiLangCode
  const activeLoc = descLoc ?? (descLocales.some((o) => o.locale === lang) ? lang : p.originalLang)
  const activeDesc = descLocales.find((o) => o.locale === activeLoc)
  const desc = activeDesc?.text ?? ''
  const runs = detail.versions[0]?.testRuns ?? []
  const currentRun = props.dshVersion !== null
    ? runs.find((r) => r.dshRelease === props.dshVersion)
    : undefined
  const seenReleases = new Set<string>()
  const otherRuns = runs.filter((r) => {
    if (r.dshRelease === props.dshVersion || seenReleases.has(r.dshRelease)) return false
    seenReleases.add(r.dshRelease)
    return true
  })
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
        <div style={{ ...S.muted, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {p.primaryLanguage != null && <span>{p.primaryLanguage}</span>}
          {p.npmDownloadsWeek > 0 && <span>↓ {fmtNum(p.npmDownloadsWeek)}/wk</span>}
          {fmtDate(p.sourceUpdatedAt) !== null && (
            <span>{t.updated}: {fmtDate(p.sourceUpdatedAt)}</span>
          )}
        </div>
        {((p.categories?.length ?? 0) > 0 || (p.tags?.length ?? 0) > 0) && (
          <div style={S.metaRow}>
            {p.categories?.map((c) => (
              <span key={c} style={{ ...S.badge, ...S.chipOn }}>{catLabel(c, uiLangCode)}</span>
            ))}
            {p.tags?.slice(0, 8).map((tg) => (
              <span key={tg} style={S.badge}>{tg}</span>
            ))}
          </div>
        )}
        {(p.repoOwner != null || p.homepageUrl != null) && (
          <div style={{ ...S.metaRow, fontSize: 12 }}>
            {p.repoOwner != null && p.repoName != null && (
              <a
                style={S.link}
                href={`https://github.com/${p.repoOwner}/${p.repoName}`}
                target="_blank"
                rel="noreferrer"
              >
                GitHub ↗
              </a>
            )}
            {p.homepageUrl != null && (
              <a style={S.link} href={p.homepageUrl} target="_blank" rel="noreferrer">
                {p.homepageUrl}
              </a>
            )}
          </div>
        )}
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
        {(props.dshVersion !== null || otherRuns.length > 0) && (
          <div style={{ marginBottom: 12 }}>
            <div style={S.muted}>{t.compatibility}</div>
            {props.dshVersion !== null && (
              <div style={S.compatRow}>
                <span style={S.badge}>DSH {props.dshVersion} · {t.current}</span>
                <span style={{ ...S.badge, ...BADGE_TONE[currentRun?.status ?? 'unknown'] }}>
                  {currentRun === undefined
                    ? t.notTested
                    : t[STATUS_KEY[currentRun.status] ?? 'notTested']}
                </span>
              </div>
            )}
            {otherRuns.map((r) => (
              <div key={r.dshRelease} style={S.compatRow}>
                <span style={S.badge}>DSH {r.dshRelease}</span>
                <span style={{ ...S.badge, ...BADGE_TONE[r.status] }}>
                  {t[STATUS_KEY[r.status] ?? 'notTested']}
                </span>
              </div>
            ))}
          </div>
        )}
        {descLocales.length > 1 && (
          <div style={{ ...S.metaRow, marginBottom: 6 }}>
            {descLocales.map((o) => (
              <button
                key={o.locale}
                style={{ ...S.chip, ...(o.locale === activeLoc ? S.chipOn : {}) }}
                title={o.isMachine ? '⚙ machine translation' : undefined}
                onClick={() => setDescLoc(o.locale)}
              >
                {LOCALE_LABEL[o.locale] ?? o.locale}{o.isMachine ? ' ⚙' : ''}
              </button>
            ))}
          </div>
        )}
        {desc !== '' ? <Markdown source={desc} /> : <div style={S.muted}>{t.empty}</div>}
        {detail.versions.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={S.muted}>{t.versions}</div>
            {detail.versions.slice(0, 6).map((v) => (
              <div key={v.version} style={{ display: 'flex', gap: 8, alignItems: 'baseline', margin: '2px 0' }}>
                <code style={S.code}>{v.version}</code>
                <span style={S.muted}>{fmtDate(v.publishedAt) ?? ''}</span>
              </div>
            ))}
          </div>
        )}
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

// ------------------------------------------------------------ settings + shell

Object.assign(S, {
  tabbar: {
    display: 'flex',
    gap: 2,
    padding: '0 10px',
    borderBottom: '1px solid var(--dsw-alias-border, rgba(128,128,128,0.28))',
    overflowX: 'auto',
    flexShrink: 0,
  },
  tab: {
    appearance: 'none',
    border: 'none',
    background: 'transparent',
    color: 'inherit',
    font: 'inherit',
    fontSize: 12,
    padding: '7px 9px',
    cursor: 'pointer',
    opacity: 0.65,
    borderBottom: '2px solid transparent',
    whiteSpace: 'nowrap',
  },
  tabActive: { opacity: 1, fontWeight: 600, borderBottom: '2px solid var(--dsw-alias-accent, currentColor)' },
  placeholder: { padding: '28px 14px', opacity: 0.6, textAlign: 'center' },
  settings: { flex: 1, minHeight: 0, overflowY: 'auto', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 14 },
  settingsRow: {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid var(--dsw-alias-border, rgba(128,128,128,0.28))',
    background: 'var(--dsw-alias-bg-base, rgba(128,128,128,0.06))',
  },
  settingsText: { display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 },
  settingsName: { fontWeight: 600 },
  hint: { opacity: 0.65, fontSize: 12, lineHeight: 1.4 },
  toggle: {
    appearance: 'none',
    flexShrink: 0,
    font: 'inherit',
    fontSize: 12,
    padding: '4px 12px',
    borderRadius: 999,
    cursor: 'pointer',
    border: '1px solid var(--dsw-alias-border, rgba(128,128,128,0.35))',
    background: 'transparent',
    color: 'inherit',
  },
  toggleOn: { background: 'var(--dsw-alias-accent-soft, rgba(77,107,254,0.25))', borderColor: 'var(--dsw-alias-accent, #4d6bfe)' },
  link: { color: 'inherit', fontSize: 12, textDecoration: 'underline', cursor: 'pointer' },
})

/** Settings tab: the agent-tools switch, log export, and planned rows. */
function SettingsView() {
  const uiLangCode = useUiLang()
  const t = UI[uiLangCode] as UiDict
  const [agentTools, setAgentTools] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    let alive = true
    fetch(SETTINGS_ROUTE, { headers: { accept: 'application/json' } })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((body: { agentTools?: boolean }) => { if (alive) setAgentTools(body.agentTools !== false) })
      .catch(() => { if (alive) setAgentTools(true) })
    return () => { alive = false }
  }, [])

  const flip = (): void => {
    if (agentTools === null || busy) return
    setBusy(true)
    setError(false)
    fetch(SETTINGS_ROUTE, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ agentTools: !agentTools }),
    })
      .then(async (res) => {
        const body = (await res.json().catch(() => ({}))) as { agentTools?: boolean }
        if (!res.ok || typeof body.agentTools !== 'boolean') throw new Error(String(res.status))
        setAgentTools(body.agentTools)
      })
      .catch(() => setError(true))
      .finally(() => setBusy(false))
  }

  return (
    <div style={S.settings}>
      <div style={S.settingsRow}>
        <div style={S.settingsText}>
          <div style={S.settingsName}>{t.agentTools}</div>
          <div style={S.hint}>{t.agentToolsHint}</div>
          {error ? <div style={{ ...S.hint, color: '#e5484d' }}>{t.saveError}</div> : null}
        </div>
        <button
          type="button"
          style={{ ...S.toggle, ...(agentTools ? S.toggleOn : {}) }}
          disabled={agentTools === null || busy}
          onClick={flip}
        >
          {agentTools === null ? t.loading : busy ? t.saving : agentTools ? t.on : t.off}
        </button>
      </div>
      <div style={S.settingsRow}>
        <div style={S.settingsText}>
          <div style={S.settingsName}>{t.eventLog}</div>
          <div style={S.hint}>{t.eventLogHint}</div>
        </div>
        <a style={S.link} href={LOGS_ROUTE} download="dsh-plugins-mp.log">{t.download}</a>
      </div>
      <div style={{ ...S.settingsRow, opacity: 0.55 }}>
        <div style={S.settingsText}>
          <div style={S.settingsName}>{t.installStats}</div>
          <div style={S.hint}>{t.installStatsSoon}</div>
        </div>
      </div>
    </div>
  )
}

const COMING_TABS = ['mine', 'favorites', 'themes', 'diagnostics'] as const
type ShellTab = 'catalog' | (typeof COMING_TABS)[number] | 'settings'

/**
 * The market shell: one tabbed surface shared by the better-sidebar tab and
 * the DSH settings section. Only Catalog and Settings carry content so far;
 * the rest show "coming soon" placeholders until their phases land.
 */
function MarketShell(props: MpTabProps) {
  const uiLangCode = useUiLang()
  const t = UI[uiLangCode] as UiDict
  const [tab, setTab] = useState<ShellTab>('catalog')

  const tabs: Array<{ id: ShellTab; label: string }> = [
    { id: 'catalog', label: t.title },
    { id: 'mine', label: t.tabMine },
    { id: 'favorites', label: t.tabFavorites },
    { id: 'themes', label: t.tabThemes },
    { id: 'diagnostics', label: t.tabDiagnostics },
    { id: 'settings', label: t.tabSettings },
  ]

  return (
    <div style={S.root}>
      <div style={S.tabbar}>
        {tabs.map((entry) => (
          <button
            key={entry.id}
            type="button"
            style={{ ...S.tab, ...(tab === entry.id ? S.tabActive : {}) }}
            onClick={() => setTab(entry.id)}
          >
            {entry.label}
          </button>
        ))}
      </div>
      {tab === 'catalog' ? <CatalogView {...props} /> : null}
      {tab === 'settings' ? <SettingsView /> : null}
      {COMING_TABS.includes(tab as (typeof COMING_TABS)[number]) ? (
        <div style={S.placeholder}>{t.comingSoon}</div>
      ) : null}
    </div>
  )
}

// ---------------------------------------------------------------- apply

/** The slots-service surface this plugin touches (soft: may be absent). */
interface SlotsLike {
  inject(name: string, register: () => (() => void) | void): void
  register(options: Record<string, unknown>, render: (ownerProps: unknown) => ReactNode): (() => void) | void
}

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
          // better-sidebar renders this in the tab strip (14) and in the +
          // new-tab menu / pane cards (14); it picks up the theme on flips
          // via the shared data-ds-dark-theme observer in brand.tsx.
          icon: (size: number) => <BrandMark size={size} />,
          order: 55,
          single: true,
          component: (tabProps) => <MarketShell {...tabProps} />,
        }),
      'dsh-plugins-mp: catalog tab')
    },
  })

  // Second mount: a DSH Settings section (Settings → Marketplace), same shell,
  // different surface. Soft dynamic injection — a host without the slots
  // service simply skips it, exactly like the sidebar mount above.
  void (ctx as unknown as {
    inject?: (deps: string[], fn: (sctx: unknown) => void) => unknown
  }).inject?.(['slots'], (sctx) => {
    const slots = (sctx as { slots?: SlotsLike }).slots
    if (slots === undefined) return
    // The label closure reads the CURRENT interface language at call time, so
    // any shell re-render after a language flip shows fresh text (the
    // ui-settings contract leaves re-rendering to the registrant; a full
    // re-register loop is not worth it for one word).
    const off = slots.inject('settings.section', () =>
      slots.register(
        { name: 'settings.section', id: 'dsh-plugins-mp', order: 46, label: () => uiLang().title },
        () => <MarketShell visible scope={{ sessionId: 'settings' }} />,
      ),
    )
    if (typeof off === 'function') {
      ctx.effect(() => off as () => void, 'dsh-plugins-mp: settings section')
    }
  })
}
