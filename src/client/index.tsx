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
import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'
import { BrandMark } from './brand'
import { installClientStyle } from './client-style'
import { ensureFavorites, toggleFavorite, useFavorites } from './favorites'
import { installSettingsNavStyle, registerSettingsNavIcon } from './settings-nav-icon'

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
const NOTE_ROUTE = '/plugins/dsh-plugins-mp/note'
const SETTINGS_ROUTE = '/plugins/dsh-plugins-mp/settings'
const TELEMETRY_PAYLOAD_ROUTE = '/plugins/dsh-plugins-mp/telemetry-payload'
const LOGS_ROUTE = '/plugins/dsh-plugins-mp/logs'

// The client appends /plugins, /categories, … to the base, so it must carry the
// /api segment the API server is reached under (dev.dsh-plugins-mp.com/api →
// nginx strips it → :4000). Tolerate a value that omits /api.
function normalizeBase(base: string): string {
  let b = base.replace(/\/+$/, '')
  if (/^https?:\/\//i.test(b) && !/\/api\b/.test(b)) b += '/api'
  return b
}

// The marketplace website that lives next to the API (comments are read-only
// here; posting happens on the site where the GitHub session lives).
function siteOrigin(): string {
  return API_BASE.replace(/\/api\/?$/, '')
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
  /** Detected language of the original text — the badge next to ★. */
  originalLang?: string
  /** Original short text not yet translated into the UI locale (badge pulses). */
  shortPending?: boolean
  /** First README screenshot — theme-card cover. */
  cover?: string | null
  shots?: number
  npmPackage: string | null
  repoOwner: string | null
  repoName: string | null
  stars: number
  npmDownloadsWeek: number
  i18n?: boolean | null
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

interface MpComment {
  id: string
  author: { login: string; name: string | null; avatarUrl: string | null }
  bodyMd: string
  createdAt: string
}

interface MpComments {
  items: MpComment[]
  total: number
}

interface MpDetail {
  plugin: MpCard & {
    descriptionMd: string
    originalLang: string
    /** README screenshots extracted at sync time (GitHub-hosted, capped). */
    screenshots: string[]
    capabilities: Record<string, boolean>
    deprecatedReason: string | null
    homepageUrl: string | null
    sourceUpdatedAt: string | null
    translations: Array<{ locale: string; kind: string; textMd: string; isMachine: boolean }>
  }
  versions: Array<{ version: string; publishedAt?: string | null; changelogMd?: string | null; testRuns?: MpTestRun[] }>
  similar: MpCard[]
}

interface MpReadme {
  markdown: string
  locale: string
  isMachine: boolean
  originalLang: string
  available: string[]
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
  ignoredBuilds?: string[]
  verified?: boolean | null
  installedName?: string | null
  hot?: boolean
  hotReason?: string
}

interface InstalledItem {
  name: string
  spec: string
  source: 'npm' | 'github' | 'git' | 'link' | 'file'
  version: string | null
  description: string | null
  hasClient: boolean
  updateAvailable?: boolean
  latest?: string | null
  disabled?: boolean
  live?: boolean
}

async function fetchInstalled(): Promise<InstalledItem[]> {
  const res = await fetch('/plugins/dsh-plugins-mp/installed', { headers: { accept: 'application/json' } })
  if (!res.ok) throw new Error(String(res.status))
  const body = (await res.json()) as { items?: InstalledItem[] }
  const items = body.items ?? []
  try {
    const tRes = await fetch('/plugins/dsh-plugins-mp/toggle', { headers: { accept: 'application/json' } })
    if (tRes.ok) {
      const state = (await tRes.json()) as { items?: Array<{ name: string; disabled: boolean; live: boolean }> }
      const byName = new Map((state.items ?? []).map((row) => [row.name, row]))
      for (const item of items) {
        const row = byName.get(item.name)
        if (row !== undefined) {
          item.disabled = row.disabled
          item.live = row.live
        }
      }
    }
  } catch { /* toggle state stays unknown */ }
  return items
}

async function fetchUpdates(): Promise<Record<string, { latest: string | null; updateAvailable: boolean }>> {
  try {
    const res = await fetch('/plugins/dsh-plugins-mp/update', { headers: { accept: 'application/json' } })
    if (!res.ok) return {}
    const body = (await res.json()) as { items?: Array<{ name: string; latest: string | null; updateAvailable: boolean }> }
    return Object.fromEntries((body.items ?? []).map((item) => [item.name, { latest: item.latest, updateAvailable: item.updateAvailable }]))
  } catch {
    return {}
  }
}

async function pluginAction(route: string, body: Record<string, unknown>): Promise<{ ok?: boolean; output?: string; error?: string; restartNeeded?: boolean; moved?: number; files?: number; depsAdded?: string[]; conflicts?: Array<{ name: string; reason: string }> }> {
  const res = await fetch(route, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  return (await res.json().catch(() => ({}))) as { ok?: boolean; output?: string; error?: string; restartNeeded?: boolean; moved?: number; files?: number; depsAdded?: string[]; conflicts?: Array<{ name: string; reason: string }> }
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
    secPlugins: 'Plugins',
    secSkills: 'Skills',
    secApps: 'Apps',
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
    telemetryTitle: 'Install statistics',
    telemetryHint: 'Anonymous only: a random UUID (nothing hardware-derived), a daily heartbeat and install/update events power the trending list. No personal data, opt out anytime.',
    mineEmpty: 'Nothing installed yet.',
    uninstall: 'Uninstall',
    confirmUninstall: 'Remove?',
    update: 'Update',
    pnpmRow: 'pnpm (package manager)',
    pnpmMissing: 'not found — needed to install plugins',
    setup: 'Install',
    allowBuilds: 'Allow build scripts',
    allowBuildsHint: 'pnpm blocked the build scripts of:',
    installedUnverified: 'installed (unverified)',
    fullscreen: 'Full screen',
    exitFullscreen: 'Exit full screen',
    myPlugins: 'Installed in this profile',
    liveBadge: 'live',
    offBadge: 'off',
    toggleOff: 'Turn off',
    toggleOn: 'Turn on',
    restartPending: 'A restart is needed to apply all changes.',
    restartNow: 'Restart',
    restartingLabel: 'Restarting…',
    dupRows: 'Duplicate loader rows',
    missingRows: 'Listed but not on disk',
    linkRows: 'Local (link/file) plugins',
    disabledRowsLabel: 'Disabled rows',
    liveRows: 'Hot-mounted now',    origLang: 'Original language',
    groups: 'Groups',
    groupsHint: 'Toggle several installed plugins as one unit.',
    groupPlaceholder: 'New group name…',
    groupAdd: 'Add',
    groupEmpty: 'No groups yet.',
    groupPick: '— plugin —',
    i18nHint: 'UI in multiple languages',
    orderTitle: 'Load order',
    orderHint: 'The order plugins are composed in. In-box bundles are fixed; applies after a restart. A broken order is refused by a boot trial.',
    orderApply: 'Apply',
    orderConflicts: 'Order rules violated:',
    orderTrialFailed: 'Trial composition failed — rolled back.',
    orderMoved: 'entries moved',
    orderEmpty: 'No reorderable bundles.',
    backupTitle: 'Backup & restore',
    backupHint: 'Config-only portable file: manifest, patch layer, groups, favorites, notes, load order. Never installed packages.',
    backupWarn: 'The file may contain tokens or passwords from config files — do not share it.',
    backupDownload: 'Download backup',
    backupRestore: 'Restore from file…',
    backupConfirm: 'Restore',
    backupDone: 'Restored: {n} files. A restart applies the changes.',
    backupMissing: 'not in this profile',
    backupInvalid: 'Not a valid backup file.',
    backupSummary: 'Backup from {date}: {files} files, {deps} plugins.',
    syncTitle: 'Sync',
    syncHint: 'Remote backup of the settings. Passwords and tokens are never saved — enter them per action (a token from the host environment also works).',
    syncWebdav: 'WebDAV (https)',
    syncUpload: 'Upload',
    syncDownloadCloud: 'Download',
    syncGist: 'GitHub Gist (private)',
    syncGistToken: 'token (optional)',
    syncToGist: 'To Gist',
    syncFromGist: 'From Gist',
    syncAutoLine: 'Auto: {msg}',
    syncDone: 'Done.',
    syncRestoredFiles: 'restored {n} files',
    favAdd: 'Add to favorites',
    favRemove: 'Remove from favorites',
    favEmpty: 'Nothing here yet — tap ♥ on a card.',
    screenshots: 'Screenshots',
    noteLabel: 'Note',
    notePlaceholder: 'Your private note about this plugin…',
    noteSave: 'Save note',
    noteSaved: 'Saved',
    changelog: 'Release notes',
    comments: 'Comments',
    commentsEmpty: 'No comments yet.',
    discussOnSite: 'Discuss on the site',
    themeApply: 'Apply',
    themeActive: 'Active theme',
    themeEnable: 'Enable',
    themeDeactivate: 'Deactivate',
    themeBusy: 'Applying…',
    themeFail: 'Failed to apply',
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
    secPlugins: '插件',
    secSkills: '技能',
    secApps: '应用',
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
    telemetryTitle: '安装统计',
    telemetryHint: '完全匿名：随机 UUID（与硬件无关）、每日心跳和安装/更新事件用于热门榜。不含个人数据，可随时关闭。',
    mineEmpty: '还没有安装任何插件。',
    uninstall: '卸载',
    confirmUninstall: '确认删除？',
    update: '更新',
    pnpmRow: 'pnpm（包管理器）',
    pnpmMissing: '未找到 — 安装插件需要它',
    setup: '安装',
    allowBuilds: '允许构建脚本',
    allowBuildsHint: 'pnpm 阻止了以下包的构建脚本：',
    installedUnverified: '已安装（未验证）',
    fullscreen: '全屏',
    exitFullscreen: '退出全屏',
    myPlugins: '已安装到此配置',
    liveBadge: '运行中',
    offBadge: '已关闭',
    toggleOff: '关闭',
    toggleOn: '开启',
    restartPending: '需要重启才能应用所有更改。',
    restartNow: '重启',
    restartingLabel: '重启中…',
    dupRows: '重复的 loader 行',
    missingRows: '清单中列出但磁盘上不存在',
    linkRows: '本地 (link/file) 插件',
    disabledRowsLabel: '已禁用的行',
    liveRows: '热挂载中',    origLang: '原文语言',
    groups: '分组',
    groupsHint: '一组插件一键启停。',
    groupPlaceholder: '新分组名称…',
    groupAdd: '添加',
    groupEmpty: '暂无分组。',
    groupPick: '— 插件 —',
    i18nHint: '界面支持多种语言',
    orderTitle: '加载顺序',
    orderHint: '插件在配置中的加载顺序。官方捆绑包固定；重启后生效。坏顺序会被试启动拒绝。',
    orderApply: '应用',
    orderConflicts: '违反了顺序规则：',
    orderTrialFailed: '试组装失败 — 已回滚。',
    orderMoved: '个条目移动',
    orderEmpty: '无可排序捆绑包。',
    backupTitle: '备份与恢复',
    backupHint: '仅配置的便携文件：清单、补丁层、分组、收藏、笔记、加载顺序。不含已安装的包。',
    backupWarn: '文件可能包含配置中的令牌或密码 — 请勿外传。',
    backupDownload: '下载备份',
    backupRestore: '从文件恢复…',
    backupConfirm: '恢复',
    backupDone: '已恢复 {n} 个文件。重启后生效。',
    backupMissing: '本配置缺少',
    backupInvalid: '不是有效的备份文件。',
    backupSummary: '备份日期 {date}：{files} 个文件，{deps} 个插件。',
    syncTitle: '同步',
    syncHint: '设置的远程备份。密码和令牌不会被保存 — 每次操作时输入（也可使用主机环境中的令牌）。',
    syncWebdav: 'WebDAV (https)',
    syncUpload: '上传',
    syncDownloadCloud: '下载',
    syncGist: 'GitHub Gist（私有）',
    syncGistToken: '令牌（可选）',
    syncToGist: '上传到 Gist',
    syncFromGist: '从 Gist 恢复',
    syncAutoLine: '自动：{msg}',
    syncDone: '完成。',
    syncRestoredFiles: '已恢复 {n} 个文件',
    favAdd: '加入收藏',
    favRemove: '取消收藏',
    favEmpty: '还没有收藏 — 点击卡片上的 ♥。',
    screenshots: '截图',
    noteLabel: '笔记',
    notePlaceholder: '关于此插件的私有笔记…',
    noteSave: '保存笔记',
    noteSaved: '已保存',
    changelog: '发布说明',
    comments: '评论',
    commentsEmpty: '暂无评论。',
    discussOnSite: '到网站上讨论',
    themeApply: '应用',
    themeActive: '当前主题',
    themeEnable: '启用',
    themeDeactivate: '停用',
    themeBusy: '应用中…',
    themeFail: '应用失败',
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
    secPlugins: 'Плагины',
    secSkills: 'Скиллы',
    secApps: 'Приложения',
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
    telemetryTitle: 'Статистика установок',
    telemetryHint: 'Полностью анонимно: случайный UUID (не привязан к железу), heartbeat раз в день и события установки/обновления питают список трендов. Никаких личных данных, отключается в любой момент.',
    mineEmpty: 'Пока ничего не установлено.',
    uninstall: 'Удалить',
    confirmUninstall: 'Удалить?',
    update: 'Обновить',
    pnpmRow: 'pnpm (пакетный менеджер)',
    pnpmMissing: 'не найден — нужен для установки плагинов',
    setup: 'Установить',
    allowBuilds: 'Разрешить сборку',
    allowBuildsHint: 'pnpm заблокировал build-скрипты:',
    installedUnverified: 'установлено (без проверки)',
    fullscreen: 'Во весь экран',
    exitFullscreen: 'Выйти из полного экрана',
    myPlugins: 'Установлено в этом профиле',
    liveBadge: 'живой',
    offBadge: 'выкл',
    toggleOff: 'Выключить',
    toggleOn: 'Включить',
    restartPending: 'Для применения всех изменений нужен перезапуск.',
    restartNow: 'Перезапустить',
    restartingLabel: 'Перезапускаю…',
    dupRows: 'Дубли loader-строк',
    missingRows: 'В манифесте, но не на диске',
    linkRows: 'Локальные (link/file) плагины',
    disabledRowsLabel: 'Отключённые строки',
    liveRows: 'Hot-смонтированы сейчас',    origLang: 'Язык оригинала',
    groups: 'Группы',
    groupsHint: 'Включайте и выключайте набор установленных плагинов одним переключателем.',
    groupPlaceholder: 'Название новой группы…',
    groupAdd: 'Добавить',
    groupEmpty: 'Групп пока нет.',
    groupPick: '— плагин —',
    i18nHint: 'Интерфейс на нескольких языках',
    orderTitle: 'Порядок загрузки',
    orderHint: 'Порядок подключения плагинов в профиле. Официальные бандлы фиксированы; применится после перезапуска. Нерабочий порядок отклонит пробная сборка.',
    orderApply: 'Применить',
    orderConflicts: 'Нарушены правила порядка:',
    orderTrialFailed: 'Пробная сборка не прошла — порядок откачен.',
    orderMoved: 'записей переставлено',
    orderEmpty: 'Нет переставляемых бандлов.',
    backupTitle: 'Резервная копия',
    backupHint: 'Портативный файл только с настройками: манифест, патч-слой, группы, избранное, заметки, порядок загрузки. Без установленных пакетов.',
    backupWarn: 'Файл может содержать токены и пароли из конфигов — не передавайте его третьим лицам.',
    backupDownload: 'Скачать бэкап',
    backupRestore: 'Восстановить из файла…',
    backupConfirm: 'Восстановить',
    backupDone: 'Восстановлено файлов: {n}. Для применения нужен перезапуск.',
    backupMissing: 'нет в этом профиле',
    backupInvalid: 'Это не файл резервной копии.',
    backupSummary: 'Бэкап от {date}: {files} файлов, {deps} плагинов.',
    syncTitle: 'Синхронизация',
    syncHint: 'Удалённый бэкап настроек. Пароли и токены не сохраняются — вводите их при каждом действии (подойдёт и токен из окружения хоста).',
    syncWebdav: 'WebDAV (https)',
    syncUpload: 'Загрузить',
    syncDownloadCloud: 'Скачать',
    syncGist: 'GitHub Gist (приватный)',
    syncGistToken: 'токен (необязательно)',
    syncToGist: 'В Gist',
    syncFromGist: 'Из Gist',
    syncAutoLine: 'Авто: {msg}',
    syncDone: 'Готово.',
    syncRestoredFiles: 'восстановлено файлов: {n}',
    favAdd: 'В избранное',
    favRemove: 'Убрать из избранного',
    favEmpty: 'Пока пусто — нажмите ♥ на карточке.',
    screenshots: 'Скриншоты',
    noteLabel: 'Заметка',
    notePlaceholder: 'Личная заметка об этом плагине…',
    noteSave: 'Сохранить заметку',
    noteSaved: 'Сохранено',
    changelog: 'Что нового',
    comments: 'Комментарии',
    commentsEmpty: 'Пока нет комментариев.',
    discussOnSite: 'Обсудить на сайте',
    themeApply: 'Применить',
    themeActive: 'Активная тема',
    themeEnable: 'Включить',
    themeDeactivate: 'Отключить',
    themeBusy: 'Применяю…',
    themeFail: 'Не удалось применить',
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
  // skill-section taxonomy
  agents: { en: 'Agent skills', zh: '智能体技能', ru: 'Агентские навыки' },
  design: { en: 'Design & slides', zh: '设计与演示', ru: 'Дизайн и презентации' },
  knowledge: { en: 'Knowledge & docs', zh: '知识与文档', ru: 'Знания и документы' },
  devops: { en: 'Infra & DevOps', zh: '基础设施与 DevOps', ru: 'Инфраструктура и DevOps' },
  automation: { en: 'Automation & monitoring', zh: '自动化与监控', ru: 'Автоматизация и мониторинг' },
  interface: { en: 'Panels & viewers', zh: '面板与查看器', ru: 'Панели и просмотрщики' },
  // app-section taxonomy
  desktop: { en: 'Desktop clients', zh: '桌面客户端', ru: 'Десктоп-клиенты' },
  mobile: { en: 'Mobile', zh: '移动端', ru: 'Мобильные' },
  web: { en: 'Web apps', zh: '网页应用', ru: 'Веб-приложения' },
  integrations: { en: 'Integrations', zh: '集成', ru: 'Интеграции' },
  utilities: { en: 'Utilities', zh: '实用工具', ru: 'Утилиты' },
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
  langChip: {
    flexShrink: 0,
    padding: '1px 5px',
    borderRadius: 5,
    border: '1px solid var(--dsw-alias-border, rgba(128,128,128,0.35))',
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.4px',
    opacity: 0.85,
    whiteSpace: 'nowrap',
  },
  favBtn: {
    flexShrink: 0,
    cursor: 'pointer',
    fontSize: 13,
    lineHeight: 1,
    opacity: 0.45,
    padding: '0 1px',
  },
  favOn: { opacity: 1, color: '#e8a33d' },
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
      // image — lazy-loaded, capped to the card width; unresolvable srcs hide
      const mm = /\[([^\]]*)\]\(([^)]+)\)/.exec(token.slice(1))
      const src = mm?.[2] ?? ''
      out.push(
        <img
          key={k}
          src={src}
          alt={mm?.[1] ?? ''}
          loading="lazy"
          style={{ maxWidth: '100%', borderRadius: 8, margin: '4px 0', display: 'block' }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
        />,
      )
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
  // READMEs arrive full of raw HTML: <img> banners are the screenshots, other
  // tags would print as literal text — <img> becomes a markdown image, the
  // rest of the markup is stripped down to its text content. Table rows keep
  // their monospace layout in a <pre>.
  const normalized = props.source
    .replace(/<img\b[^>]*?\bsrc\s*=\s*"([^"]+)"[^>]*>/gi, '![]($1)')
    .replace(/<img\b[^>]*?\bsrc\s*=\s*'([^']+)'[^>]*>/gi, '![]($1)')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
  const lines = normalized.split(/\r?\n/)
  const blocks: ReactNode[] = []
  let para: string[] = []
  let list: string[] = []
  let table: string[] | null = null
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
  const flushTable = (key: string): void => {
    if (table !== null && table.length > 0) {
      blocks.push(<pre key={key} style={{ ...S.pre, overflowX: 'auto' }}>{table.join('\n')}</pre>)
    }
    table = null
  }
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.trim().startsWith('```')) {
      flushPara(`p${i}`)
      flushList(`l${i}`)
      flushTable(`t${i}`)
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
    // Markdown-таблица: строка-список |a|b| → моноширинный блок с разделителями
    if (line.trim().startsWith('|')) {
      flushPara(`p${i}`)
      flushList(`l${i}`)
      if (table === null) table = []
      if (!/^[:\-\s|]+$/.test(line.trim())) {
        const cells = line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim())
        table.push(cells.join('  ·  '))
      }
      continue
    }
    flushTable(`t${i}`)
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
  flushTable('tend')
  if (code !== null) blocks.push(<pre key="cend" style={S.pre}>{code.join('\n')}</pre>)
  return <>{blocks}</>
}

// ---------------------------------------------------------------- install state

type InstallState =
  | { phase: 'idle' }
  | { phase: 'busy' }
  | { phase: 'done' }
  | { phase: 'blocked' }
  | { phase: 'error'; message: string; output: string }

function InstallButton(props: {
  slug: string
  compact?: boolean
  profile?: string
}) {
  const t = uiLang()
  const [state, setState] = useState<InstallState>({ phase: 'idle' })
  const [blocked, setBlocked] = useState<string[]>([])
  const [verified, setVerified] = useState<boolean | null>(null)
  const profile = props.profile ?? 'web'
  const start = () => {
    if (state.phase === 'busy') return
    setState({ phase: 'busy' })
    setBlocked([])
    requestInstall(props.slug, profile)
      .then((r) => {
        if (r.ok) {
          // pnpm ≥10 silently skips dependency build scripts until allowed:
          // surface the names and let one click allowlist + retry.
          if (r.ignoredBuilds !== undefined && r.ignoredBuilds.length > 0) {
            setBlocked(r.ignoredBuilds)
            setState({ phase: 'blocked' })
            return
          }
          setVerified(r.verified ?? null)
          setState({ phase: 'done' })
        } else {
          setState({ phase: 'error', message: r.error ?? `exit ${String(r.code)}`, output: r.output })
        }
      })
      .catch((e) => setState({ phase: 'error', message: String(e), output: '' }))
  }
  const allowAndRetry = () => {
    if (blocked.length === 0) return
    setState({ phase: 'busy' })
    pluginAction('/plugins/dsh-plugins-mp/approve-builds', { packages: blocked, profile })
      .then(() => requestInstall(props.slug, profile))
      .then((r) => {
        if (r.ok) {
          setBlocked([])
          setVerified(r.verified ?? null)
          setState({ phase: 'done' })
        } else {
          setState({ phase: 'error', message: r.error ?? `exit ${String(r.code)}`, output: r.output })
        }
      })
      .catch((e) => setState({ phase: 'error', message: String(e), output: '' }))
  }
  const label =
    state.phase === 'busy' ? t.installing
      : state.phase === 'done' ? (verified === false ? `✓ ${t.installedUnverified}` : `✓ ${t.installed}`)
        : state.phase === 'blocked' ? t.allowBuilds
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
          if (state.phase === 'blocked') allowAndRetry()
          else start()
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
      <button
        style={{ ...S.bigInstall, ...(state.phase === 'blocked' ? BADGE_TONE.unknown : {}) }}
        onClick={state.phase === 'blocked' ? allowAndRetry : start}
        disabled={state.phase === 'busy'}
      >
        {label}
      </button>
      {state.phase === 'blocked' && (
        <div style={{ marginTop: 8 }}>
          <div style={S.hint}>{t.allowBuildsHint} {blocked.join(', ')}</div>
        </div>
      )}
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
  const favs = useFavorites()
  const isFav = favs.includes(c.slug)
  return (
    <button style={S.card} onClick={props.onOpen}>
      <span style={S.cardHead}>
        <span style={avatarStyle(c.authorName ?? c.slug)}>
          {(c.displayName || c.slug).slice(0, 1).toUpperCase()}
        </span>
        <span style={S.cardName}>{c.displayName}</span>
        <span style={S.cardStars}>★ {c.stars}</span>
        {c.originalLang != null && (
          <span
            className={c.shortPending === true ? 'dsh-mp-pulse' : undefined}
            style={S.langChip}
            title={
              c.shortPending === true
                ? `${t.origLang}: ${c.originalLang.toUpperCase()} · ⚙`
                : `${t.origLang}: ${c.originalLang.toUpperCase()}`
            }
          >
            {c.originalLang.toUpperCase()}
          </span>
        )}
        {c.i18n === true && (
          <span style={S.langChip} title={t.i18nHint}>
            🌐
          </span>
        )}
        <span
          role="button"
          style={{ ...S.favBtn, ...(isFav ? S.favOn : {}) }}
          title={isFav ? t.favRemove : t.favAdd}
          onClick={(e) => {
            e.stopPropagation()
            toggleFavorite(c.slug)
          }}
        >
          ♥
        </span>
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
  // Верхний уровень каталога: у Плагинов/Скиллов/Приложений свои категории.
  const [sec, setSec] = useState<'plugin' | 'skill' | 'app'>('plugin')
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
  }, [])

  // Category chips of the CURRENT section (per-section taxonomies).
  useEffect(() => {
    api<Array<{ slug: string; count: number }>>(`/categories?section=${sec}`)
      .then(setCats)
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sec])

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
        usp.set('section', sec)
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
    usp.set('section', sec)
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
  }, [slug, cat, sort, sec])

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
            <div style={{ ...S.chipRow }}>
              {(['plugin', 'skill', 'app'] as const).map((sKey) => (
                <button
                  key={sKey}
                  style={{ ...S.chip, ...(sec === sKey ? S.chipOn : {}) }}
                  onClick={() => {
                    if (sKey === sec) return
                    setSec(sKey)
                    setCat('')
                  }}
                >
                  {sKey === 'plugin' ? t.secPlugins : sKey === 'skill' ? t.secSkills : t.secApps}
                </button>
              ))}
            </div>
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
  const [readme, setReadme] = useState<MpReadme | null>(null)
  const [shot, setShot] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [noteState, setNoteState] = useState<'idle' | 'busy' | 'saved'>('idle')
  const [openChangelog, setOpenChangelog] = useState<string | null>(null)
  const [comments, setComments] = useState<MpComments | null>(null)

  useEffect(() => {
    const ctrl = new AbortController()
    setDetail(null)
    setError(null)
    setDescLoc(null)
    setReadme(null)
    setShot(null)
    setNote('')
    setNoteState('idle')
    setOpenChangelog(null)
    setComments(null)
    api<MpDetail>(`/plugins/${encodeURIComponent(props.slug)}`, ctrl.signal)
      .then(setDetail)
      .catch((e) => {
        if (!ctrl.signal.aborted) setError(String(e))
      })
    // Stored+localized README (parity plan 3.8): the server picks the ready
    // translation for the UI locale; translations themselves are produced by
    // the server-side sweep, so a fresh README may still be in the original
    // language here.
    api<MpReadme>(`/plugins/${encodeURIComponent(props.slug)}/readme?locale=${langCode()}`, ctrl.signal)
      .then(setReadme)
      .catch(() => {})
    // Comments are read-only in the plugin (v1): posting lives on the website
    // where the GitHub OAuth session is.
    api<MpComments>(`/plugins/${encodeURIComponent(props.slug)}/comments`, ctrl.signal)
      .then(setComments)
      .catch(() => {})
    fetch(NOTE_ROUTE, { headers: { accept: 'application/json' }, signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { notes?: Record<string, string> } | null) => {
        const text = d?.notes?.[props.slug]
        if (typeof text === 'string' && text !== '') setNote(text)
      })
      .catch(() => {})
    return () => ctrl.abort()
  }, [props.slug])

  // Fullscreen screenshot preview closes on Esc, like the settings layer.
  useEffect(() => {
    if (shot === null) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setShot(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [shot])

  if (error !== null) return <div style={S.body}>{t.empty} ({error})</div>
  if (detail === null) return <div style={S.body}>{t.loading}</div>

  const saveNote = (): void => {
    setNoteState('busy')
    fetch(NOTE_ROUTE, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug: props.slug, text: note }),
    })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status))
        setNoteState('saved')
        setTimeout(() => setNoteState('idle'), 1500)
      })
      .catch(() => setNoteState('idle'))
  }

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
        <div style={{ ...S.cmd, alignItems: 'stretch', flexDirection: 'column', gap: 4 }}>
          <div style={S.muted}>{t.noteLabel}</div>
          <textarea
            value={note}
            placeholder={t.notePlaceholder}
            onChange={(e) => setNote(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              minHeight: 52,
              resize: 'vertical',
              borderRadius: 6,
              border: '1px solid var(--dsw-alias-border, rgba(128,128,128,0.35))',
              background: 'transparent',
              color: 'inherit',
              font: 'inherit',
              fontSize: 12,
              padding: '5px 8px',
              outline: 'none',
            }}
          />
          <button type="button" style={{ ...S.copyBtn, marginLeft: 0, alignSelf: 'flex-end' }} onClick={saveNote}>
            {noteState === 'busy' ? '…' : noteState === 'saved' ? t.noteSaved : t.noteSave}
          </button>
        </div>
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
        {(p.screenshots?.length ?? 0) > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={S.muted}>{t.screenshots}</div>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '6px 0' }}>
              {p.screenshots.map((src, i) => (
                <img
                  key={src}
                  src={src}
                  alt=""
                  loading="lazy"
                  style={{
                    height: 88,
                    borderRadius: 8,
                    border: '1px solid var(--dsw-alias-border, rgba(128,128,128,0.35))',
                    cursor: 'zoom-in',
                    display: 'block',
                  }}
                  onClick={() => setShot(i)}
                />
              ))}
            </div>
          </div>
        )}
        {readme !== null && readme.markdown !== '' && readme.markdown !== desc && (
          <div style={{ marginTop: 16 }}>
            <div style={S.muted}>README</div>
            <Markdown source={readme.markdown} />
          </div>
        )}
        {shot !== null && p.screenshots[shot] !== undefined && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100000,
              background: 'rgba(0,0,0,0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'zoom-out',
            }}
            onClick={() => setShot(null)}
          >
            <img
              src={p.screenshots[shot]}
              alt=""
              style={{ maxWidth: '94vw', maxHeight: '92vh', objectFit: 'contain', display: 'block' }}
            />
            {p.screenshots.length > 1 && (
              <>
                <button
                  type="button"
                  style={{ ...S.overlayNav, left: 8 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setShot((shot - 1 + p.screenshots.length) % p.screenshots.length)
                  }}
                >
                  ‹
                </button>
                <button
                  type="button"
                  style={{ ...S.overlayNav, right: 8 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setShot((shot + 1) % p.screenshots.length)
                  }}
                >
                  ›
                </button>
              </>
            )}
          </div>
        )}
        {detail.versions.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={S.muted}>{t.versions}</div>
            {detail.versions.slice(0, 6).map((v) => {
              const hasNotes = typeof v.changelogMd === 'string' && v.changelogMd.trim() !== ''
              const expanded = openChangelog === v.version
              return (
                <div key={v.version} style={{ margin: '2px 0' }}>
                  <div
                    role={hasNotes ? 'button' : undefined}
                    onClick={hasNotes ? () => setOpenChangelog(expanded ? null : v.version) : undefined}
                    style={{ display: 'flex', gap: 8, alignItems: 'baseline', margin: '2px 0', cursor: hasNotes ? 'pointer' : undefined }}
                  >
                    <code style={S.code}>{v.version}</code>
                    <span style={S.muted}>{fmtDate(v.publishedAt) ?? ''}</span>
                    {hasNotes && <span style={S.muted}>{expanded ? '▾' : '▸'} {t.changelog}</span>}
                  </div>
                  {hasNotes && expanded && (
                    <div style={{ margin: '4px 0 8px', paddingLeft: 10, borderLeft: '2px solid var(--dsw-alias-border, rgba(128,128,128,0.35))' }}>
                      <Markdown source={v.changelogMd as string} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
        {comments !== null && (
          <div style={{ marginTop: 16 }}>
            <div style={{ ...S.muted, marginBottom: 4 }}>
              {t.comments}{comments.total > 0 ? ` · ${comments.total}` : ''}
            </div>
            {comments.items.length === 0 && <div style={S.muted}>{t.commentsEmpty}</div>}
            {comments.items.map((c) => (
              <div
                key={c.id}
                style={{ margin: '6px 0', paddingLeft: 10, borderLeft: '2px solid var(--dsw-alias-border, rgba(128,128,128,0.35))' }}
              >
                <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 600 }}>{c.author.name || c.author.login}</span>
                  <span style={S.muted}>{fmtDate(c.createdAt) ?? ''}</span>
                </div>
                {/* изображения в комментариях не рендерим (трекинг-пиксели) */}
                <Markdown source={c.bodyMd.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')} />
              </div>
            ))}
            <a
              href={`${siteOrigin()}/plugins/${encodeURIComponent(props.slug)}`}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 12 }}
            >
              {t.discussOnSite} ↗
            </a>
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
  overlayNav: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    appearance: 'none',
    border: 'none',
    borderRadius: 999,
    width: 40,
    height: 40,
    fontSize: 22,
    lineHeight: 1,
    cursor: 'pointer',
    background: 'rgba(128,128,128,0.25)',
    color: '#fff',
  },
})

/** Settings tab: the agent-tools switch, pnpm health, log export, planned rows. */
const BACKUP_ROUTE = '/plugins/dsh-plugins-mp/backup'

interface BackupSummary {
  createdAt: string
  profile: string
  files: number
  deps: number
}

/** Parse a backup file locally — enough fields to confirm the restore. */
function summarizeBackup(raw: string): BackupSummary | null {
  try {
    const parsed = JSON.parse(raw) as { format?: unknown; createdAt?: unknown; profile?: unknown; files?: unknown[] }
    if (parsed.format !== 'dsh-profile-backup' || !Array.isArray(parsed.files)) return null
    const manifest = parsed.files.find((f) => (f as { path?: unknown }).path === 'package.json') as { json?: { dependencies?: Record<string, unknown> } } | undefined
    return {
      createdAt: typeof parsed.createdAt === 'string' ? parsed.createdAt : '',
      profile: typeof parsed.profile === 'string' ? parsed.profile : '',
      files: parsed.files.length,
      deps: Object.keys(manifest?.json?.dependencies ?? {}).length,
    }
  } catch {
    return null
  }
}

/** Backup/restore section on the Settings tab (plan #11). */
function BackupSection(props: { onNeedsRestart?: () => void }) {
  const t = UI[useUiLang()] as UiDict
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [picked, setPicked] = useState<{ name: string; raw: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  const download = (): void => {
    const a = document.createElement('a')
    a.href = BACKUP_ROUTE
    a.download = `dsh-mp-backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  const restore = (): void => {
    if (picked === null || busy) return
    setBusy(true)
    setError(null)
    setDone(null)
    pluginAction(BACKUP_ROUTE, JSON.parse(picked.raw) as Record<string, unknown>)
      .then((res) => {
        if (res.error !== undefined) {
          setError(res.error)
          return
        }
        const missing = Array.isArray(res.depsAdded) && res.depsAdded.length > 0 ? ` (${t.backupMissing}: ${res.depsAdded.join(', ')})` : ''
        setDone(`${t.backupDone.replace('{n}', String(res.files ?? 0))}${missing}`)
        setPicked(null)
        props.onNeedsRestart?.()
      })
      .catch((e) => setError(String(e)))
      .finally(() => setBusy(false))
  }

  return (
    <div style={{ ...S.settingsRow, flexDirection: 'column', gap: 6 }}>
      <div style={S.settingsText}>
        <div style={S.settingsName}>{t.backupTitle}</div>
        <div style={S.hint}>{t.backupHint}</div>
        <div style={{ ...S.hint, color: '#f5a623' }}>{t.backupWarn}</div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" style={{ ...S.installBtn, marginLeft: 0 }} onClick={download}>{t.backupDownload}</button>
        <button type="button" style={S.installBtn} onClick={() => inputRef.current?.click()}>{t.backupRestore}</button>
        {picked !== null && (
          <button type="button" style={{ ...S.installBtn, ...BADGE_TONE.passed }} disabled={busy} onClick={restore}>
            {busy ? '…' : `${t.backupConfirm} ${picked.name}`}
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".json,application/json"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (file === undefined) return
            void file.text().then((raw) => {
              if (summarizeBackup(raw) === null) {
                setError(t.backupInvalid)
                setPicked(null)
                return
              }
              setError(null)
              setDone(null)
              setPicked({ name: file.name, raw })
            })
          }}
        />
      </div>
      {picked !== null && (() => {
        const summary = summarizeBackup(picked.raw)
        return summary !== null ? (
          <div style={S.hint}>{t.backupSummary.replace('{files}', String(summary.files)).replace('{deps}', String(summary.deps)).replace('{date}', summary.createdAt.slice(0, 10))}</div>
        ) : null
      })()}
      {done !== null ? <div style={{ ...S.hint, color: '#46a758' }}>{done}</div> : null}
      {error !== null ? <div style={{ ...S.hint, color: '#e5484d' }}>{error}</div> : null}
    </div>
  )
}

const SYNC_ROUTE = '/plugins/dsh-plugins-mp/sync'

interface SyncResult {
  ok?: boolean
  error?: string
  code?: string
  backup?: unknown
  gistId?: string | null
  gistUrl?: string
  source?: string
  skipped?: boolean
  lastAt?: string | null
  files?: number
  restartNeeded?: boolean
}

async function syncAction(body: Record<string, unknown>): Promise<SyncResult> {
  return await pluginAction(SYNC_ROUTE, body) as SyncResult
}

/** Restore-through: fetch a remote backup, then feed it into the merge restore. */
async function restoreRemote(backup: unknown): Promise<SyncResult> {
  return await pluginAction(BACKUP_ROUTE, backup as Record<string, unknown>) as SyncResult
}

/** WebDAV + Gist backup targets (plan #12); credentials are never persisted. */
function SyncSection(props: { onNeedsRestart?: () => void }) {
  const t = UI[useUiLang()] as UiDict
  const [davUrl, setDavUrl] = useState('')
  const [davUser, setDavUser] = useState('')
  const [davPass, setDavPass] = useState('')
  const [gistToken, setGistToken] = useState('')
  const [gistId, setGistId] = useState('')
  const [status, setStatus] = useState<{ text: string; bad: boolean } | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    fetch(SYNC_ROUTE, { headers: { accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { sync?: { gistId?: string | null; lastAt?: string | null } } | null) => {
        if (alive && d?.sync?.gistId != null) setGistId(d.sync.gistId)
      })
      .catch(() => {})
    // Daily auto-backup: server-side 24h gate, gist only (env/gh token).
    void syncAction({ target: 'gist', action: 'auto' }).then((res) => {
      if (!alive) return
      if (res.ok === true && res.skipped === true) setStatus({ text: `gist ${res.lastAt?.slice(0, 10) ?? ''}`, bad: false })
      else if (res.ok === true && res.gistId != null) setStatus({ text: `gist ${res.gistId} ✓`, bad: false })
      else if (res.source === 'none') setStatus({ text: 'no host token', bad: true })
    })
    return () => { alive = false }
  }, [])

  const run = (body: Record<string, unknown>, after: (res: SyncResult) => void): void => {
    if (busy) return
    setBusy(true)
    setStatus(null)
    syncAction(body)
      .then(after)
      .catch((e) => setStatus({ text: String(e), bad: true }))
      .finally(() => setBusy(false))
  }

  const restoreBackup = (backup: unknown): void => {
    setBusy(true)
    restoreRemote(backup)
      .then((res) => {
        if (res.error !== undefined) setStatus({ text: res.error, bad: true })
        else {
          setStatus({ text: t.syncRestoredFiles.replace('{n}', String(res.files ?? 0)), bad: false })
          props.onNeedsRestart?.()
        }
      })
      .catch((e) => setStatus({ text: String(e), bad: true }))
      .finally(() => setBusy(false))
  }

  const input = (value: string, setValue: (v: string) => void, placeholder: string, type = 'text'): ReactNode => (
    <input
      style={{ ...S.search, flex: 1, minWidth: 120 }}
      value={value}
      type={type}
      placeholder={placeholder}
      onChange={(e) => setValue(e.target.value)}
    />
  )

  return (
    <div style={{ ...S.settingsRow, flexDirection: 'column', gap: 8 }}>
      <div style={S.settingsText}>
        <div style={S.settingsName}>{t.syncTitle}</div>
        <div style={S.hint}>{t.syncHint}</div>
      </div>

      <div style={{ ...S.settingsText, gap: 2 }}>
        <div style={{ fontWeight: 600, fontSize: 12 }}>{t.syncWebdav}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {input(davUrl, setDavUrl, 'https://dav.example.com/dsh/backup.json')}
          {input(davUser, setDavUser, 'login')}
          {input(davPass, setDavPass, '••••••', 'password')}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            style={{ ...S.installBtn, marginLeft: 0 }}
            disabled={busy || davUrl.trim() === ''}
            onClick={() => run({ target: 'webdav', action: 'backup', url: davUrl.trim(), username: davUser, password: davPass },
              (res) => setStatus(res.error !== undefined ? { text: res.error, bad: true } : { text: t.syncDone, bad: false }))}
          >
            {t.syncUpload}
          </button>
          <button
            type="button"
            style={S.installBtn}
            disabled={busy || davUrl.trim() === ''}
            onClick={() => run({ target: 'webdav', action: 'restore', url: davUrl.trim(), username: davUser, password: davPass },
              (res) => {
                if (res.error !== undefined || res.backup === undefined) setStatus({ text: res.error ?? 'no backup', bad: true })
                else restoreBackup(res.backup)
              })}
          >
            {t.syncDownloadCloud}
          </button>
        </div>
      </div>

      <div style={{ ...S.settingsText, gap: 2 }}>
        <div style={{ fontWeight: 600, fontSize: 12 }}>{t.syncGist}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {input(gistToken, setGistToken, t.syncGistToken, 'password')}
          {input(gistId, setGistId, 'Gist ID')}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            style={{ ...S.installBtn, marginLeft: 0 }}
            disabled={busy}
            onClick={() => run({ target: 'gist', action: 'export', token: gistToken.trim(), gistId: gistId.trim() },
              (res) => {
                if (res.error !== undefined) setStatus({ text: res.error, bad: true })
                else {
                  if (res.gistId != null) setGistId(res.gistId)
                  setStatus({ text: `${res.gistUrl ?? t.syncDone}`, bad: false })
                }
              })}
          >
            {t.syncToGist}
          </button>
          <button
            type="button"
            style={S.installBtn}
            disabled={busy || gistId.trim() === ''}
            onClick={() => run({ target: 'gist', action: 'import', token: gistToken.trim(), gistId: gistId.trim() },
              (res) => {
                if (res.error !== undefined || res.backup === undefined) setStatus({ text: res.error ?? 'no backup', bad: true })
                else restoreBackup(res.backup)
              })}
          >
            {t.syncFromGist}
          </button>
          {status !== null ? (
            <span style={{ ...S.hint, color: status.bad ? '#e5484d' : '#46a758' }}>{status.text}</span>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function SettingsView(props: { children?: ReactNode; onNeedsRestart?: () => void } = {}) {
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
      {props.children}
      <BackupSection onNeedsRestart={props.onNeedsRestart} />
      <SyncSection onNeedsRestart={props.onNeedsRestart} />
      <TelemetryRow />
    </div>
  )
}

/** Anonymous install telemetry opt-out (plan 5.1) — on by default. */
function TelemetryRow() {
  const t = UI[useUiLang()] as UiDict
  const [on, setOn] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    fetch(SETTINGS_ROUTE, { headers: { accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { telemetry?: boolean } | null) => { if (alive) setOn(d?.telemetry !== false) })
      .catch(() => { if (alive) setOn(true) })
    return () => { alive = false }
  }, [])

  const flip = (): void => {
    if (on === null || busy) return
    setBusy(true)
    fetch(SETTINGS_ROUTE, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ telemetry: !on }),
    })
      .then(async (res) => {
        const body = (await res.json().catch(() => ({}))) as { telemetry?: boolean }
        if (res.ok) setOn(body.telemetry !== false)
      })
      .catch(() => {})
      .finally(() => setBusy(false))
  }

  return (
    <div style={S.settingsRow}>
      <div style={S.settingsText}>
        <div style={S.settingsName}>{t.telemetryTitle}</div>
        <div style={S.hint}>{t.telemetryHint}</div>
      </div>
      <button
        type="button"
        style={{ ...S.toggle, ...(on ? S.toggleOn : {}) }}
        disabled={on === null || busy}
        onClick={flip}
      >
        {on === null ? t.loading : busy ? t.saving : on ? t.on : t.off}
      </button>
    </div>
  )
}

/** One installed-plugin row: identity, source badge, update + uninstall actions. */
/** Named set of installed packages (plan #15) — persisted in state.json. */
interface MpGroupView {
  name: string
  members: string[]
}

const GROUP_ROUTE = '/plugins/dsh-plugins-mp/group'

function GroupRow(props: {
  group: MpGroupView
  items: InstalledItem[]
  onChanged: () => void
  onNeedsRestart?: () => void
}) {
  const t = uiLang()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pick, setPick] = useState('')
  const { group } = props

  const installed = props.items.filter((item) => group.members.includes(item.name))
  // Honest state badge: derived from the actual toggle state of the members,
  // not from what we last asked for (same reasoning as the theme badges).
  const allOff = installed.length > 0 && installed.every((item) => item.disabled === true)
  const candidates = props.items.filter((item) => !group.members.includes(item.name))

  const act = (body: Record<string, unknown>): void => {
    if (busy) return
    setBusy(true)
    setError(null)
    pluginAction(GROUP_ROUTE, body)
      .then((res) => {
        if (res.error !== undefined) setError(res.error)
        else {
          setPick('')
          props.onChanged()
        }
        if (res.restartNeeded === true) props.onNeedsRestart?.()
      })
      .catch((e) => setError(String(e)))
      .finally(() => setBusy(false))
  }

  return (
    <div style={{ ...S.settingsRow, flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', width: '100%' }}>
        <span style={S.cardName}>{group.name}</span>
        <span style={S.muted}>{group.members.length}</span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexShrink: 0 }}>
          <button
            type="button"
            style={{ ...S.installBtn, ...(allOff ? {} : BADGE_TONE.passed) }}
            disabled={busy}
            title={allOff ? t.toggleOn : t.toggleOff}
            onClick={() => act({ action: 'toggle', name: group.name, disable: !allOff })}
          >
            {busy ? '…' : allOff ? t.offBadge : t.liveBadge}
          </button>
          <button
            type="button"
            style={S.installBtn}
            disabled={busy}
            title="✕"
            onClick={() => act({ action: 'delete', name: group.name })}
          >
            ✕
          </button>
        </span>
      </div>
      {group.members.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {group.members.map((member) => (
            <button
              key={member}
              type="button"
              style={S.chip}
              disabled={busy}
              title={member}
              onClick={() => act({ action: 'remove', name: group.name, member })}
            >
              {member} ×
            </button>
          ))}
        </div>
      )}
      {candidates.length > 0 && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <select style={{ ...S.select, flex: 1 }} value={pick} onChange={(e) => setPick(e.target.value)}>
            <option value="">{t.groupPick}</option>
            {candidates.map((item) => (
              <option key={item.name} value={item.name}>{item.name}</option>
            ))}
          </select>
          <button
            type="button"
            style={S.installBtn}
            disabled={busy || pick === ''}
            onClick={() => act({ action: 'add', name: group.name, member: pick })}
          >
            {t.groupAdd}
          </button>
        </div>
      )}
      {error !== null ? <div style={{ ...S.hint, color: '#e5484d' }}>{error}</div> : null}
    </div>
  )
}

/** Groups management block on the "My plugins" tab (#15). */
function GroupsBlock(props: { items: InstalledItem[]; onChanged: () => void; onNeedsRestart?: () => void }) {
  const t = uiLang()
  const [groups, setGroups] = useState<MpGroupView[] | null>(null)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const loadGroups = (): void => {
    fetch(GROUP_ROUTE, { headers: { accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : { groups: [] }))
      .then((d: { groups?: MpGroupView[] }) => setGroups(d.groups ?? []))
      .catch(() => setGroups([]))
  }
  useEffect(loadGroups, [])

  const create = (): void => {
    const trimmed = name.trim()
    if (trimmed === '') return
    setError(null)
    pluginAction(GROUP_ROUTE, { action: 'create', name: trimmed })
      .then((res) => {
        if (res.error !== undefined) setError(res.error)
        else {
          setName('')
          loadGroups()
        }
      })
      .catch((e) => setError(String(e)))
  }

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={S.muted}>{t.groups}</div>
      <div style={S.hint}>{t.groupsHint}</div>
      <div style={{ display: 'flex', gap: 6, margin: '6px 0' }}>
        <input
          style={{ ...S.search, flex: 1 }}
          placeholder={t.groupPlaceholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') create() }}
        />
        <button type="button" style={S.installBtn} disabled={name.trim() === ''} onClick={create}>+</button>
      </div>
      {error !== null ? <div style={{ ...S.hint, color: '#e5484d' }}>{error}</div> : null}
      {groups !== null && groups.length === 0 ? <div style={S.hint}>{t.groupEmpty}</div> : null}
      {groups?.map((group) => (
        <GroupRow
          key={group.name}
          group={group}
          items={props.items}
          onChanged={() => { loadGroups(); props.onChanged() }}
          onNeedsRestart={props.onNeedsRestart}
        />
      ))}
    </div>
  )
}

const ORDER_ROUTE = '/plugins/dsh-plugins-mp/order'

interface OrderStack {
  bundles: string[]
  community: string[]
  conflicts: Array<{ name: string; reason: string }>
}

/** Bundle load order editor (plan #16): drag or ↑/↓, then a trial-validated apply. */
function OrderBlock(props: { onNeedsRestart?: () => void }) {
  const t = uiLang()
  const [stack, setStack] = useState<OrderStack | null>(null)
  const [order, setOrder] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  const load = (): void => {
    fetch(ORDER_ROUTE, { headers: { accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: OrderStack | null) => {
        if (d !== null) {
          setStack(d)
          setOrder(d.community)
        }
      })
      .catch(() => {})
  }
  useEffect(load, [])

  const dirty = stack !== null && order.join('\u0000') !== stack.community.join('\u0000')

  const move = (from: number, to: number): void => {
    setOrder((prev) => {
      const next = [...prev]
      const [item] = next.splice(from, 1)
      if (item === undefined) return prev
      next.splice(Math.max(0, Math.min(next.length, to)), 0, item)
      return next
    })
  }

  const apply = (): void => {
    if (busy || !dirty) return
    setBusy(true)
    setError(null)
    setSaved(null)
    pluginAction(ORDER_ROUTE, { order })
      .then((res) => {
        if (res.error !== undefined) {
          setError(
            res.conflicts !== undefined && res.conflicts.length > 0
              ? `${t.orderConflicts} ${res.conflicts.map((c) => `${c.name}: ${c.reason}`).join('; ')}`
              : `${t.orderTrialFailed}${res.output !== undefined ? '' : ` ${res.error}`}`,
          )
        } else {
          setSaved(typeof res.moved === 'number' ? `${res.moved} ${t.orderMoved}` : t.orderApply)
          props.onNeedsRestart?.()
          load()
        }
      })
      .catch((e) => setError(String(e)))
      .finally(() => setBusy(false))
  }

  if (stack === null) return null
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={S.muted}>{t.orderTitle}</div>
      <div style={S.hint}>{t.orderHint}</div>
      {stack.conflicts.length > 0 && (
        <div style={{ ...S.hint, color: '#f5a623', marginTop: 4 }}>
          {t.orderConflicts}
          <ul style={{ margin: '2px 0 0 16px' }}>
            {stack.conflicts.map((c, i) => <li key={i}>{c.name}: {c.reason}</li>)}
          </ul>
        </div>
      )}
      {order.length === 0 ? <div style={S.hint}>{t.orderEmpty}</div> : (
        <div style={{ margin: '6px 0' }}>
          {order.map((name, i) => (
            <div
              key={name}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null && dragIndex !== i) move(dragIndex, i)
                setDragIndex(null)
              }}
              onDragEnd={() => setDragIndex(null)}
              style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '2px 0', opacity: dragIndex === i ? 0.5 : 1 }}
            >
              <span style={{ ...S.muted, width: 20, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
              <span style={{ cursor: 'grab', userSelect: 'none', flexShrink: 0 }}>≡</span>
              <span style={{ flex: 1, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
              <button type="button" style={S.installBtn} disabled={i === 0} onClick={() => move(i, i - 1)}>↑</button>
              <button type="button" style={S.installBtn} disabled={i === order.length - 1} onClick={() => move(i, i + 1)}>↓</button>
            </div>
          ))}
        </div>
      )}
      <button type="button" style={{ ...S.installBtn, marginLeft: 0 }} disabled={!dirty || busy} onClick={apply}>
        {busy ? '…' : t.orderApply}
      </button>
      {saved !== null && <span style={{ ...S.hint, marginLeft: 8 }}>{saved}</span>}
      {error !== null ? <div style={{ ...S.hint, color: '#e5484d', marginTop: 4 }}>{error}</div> : null}
    </div>
  )
}

function InstalledRow(props: {
  item: InstalledItem
  onChange: () => void
  onNeedsRestart?: () => void
}) {
  const t = uiLang()
  const { item } = props
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const act = (route: string, body: Record<string, unknown>): void => {
    if (busy) return
    setBusy(true)
    setError(null)
    pluginAction(route, body)
      .then((res) => {
        if (res.error !== undefined) setError(res.error)
        else props.onChange()
        if (res.restartNeeded === true) props.onNeedsRestart?.()
      })
      .catch((e) => setError(String(e)))
      .finally(() => { setBusy(false); setConfirming(false) })
  }

  return (
    <div style={{ ...S.settingsRow, flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', width: '100%' }}>
        <span style={{ ...S.badge, flexShrink: 0 }}>{item.source}</span>
        <span style={S.cardName}>{item.name}</span>
        {item.version !== null ? <code style={{ ...S.code, fontSize: 11 }}>{item.version}</code> : null}
        {item.updateAvailable === true && item.latest != null ? (
          <span style={{ ...S.badge, ...BADGE_TONE.unknown }}>→ {item.latest}</span>
        ) : null}
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexShrink: 0 }}>
          <button
            type="button"
            style={{ ...S.installBtn, ...(item.disabled === true ? {} : BADGE_TONE.passed) }}
            disabled={busy}
            title={item.disabled === true ? t.toggleOn : t.toggleOff}
            onClick={() => act('/plugins/dsh-plugins-mp/toggle', { name: item.name, disable: item.disabled !== true })}
          >
            {busy ? '…' : item.disabled === true ? t.offBadge : t.liveBadge}
          </button>
          {item.source === 'npm' && item.updateAvailable === true ? (
            <button
              type="button"
              style={S.installBtn}
              disabled={busy}
              onClick={() => act('/plugins/dsh-plugins-mp/update', { name: item.name })}
            >
              {t.update}
            </button>
          ) : null}
          {confirming ? (
            <button
              type="button"
              style={{ ...S.installBtn, ...BADGE_TONE.failed }}
              disabled={busy}
              onClick={() => act('/plugins/dsh-plugins-mp/uninstall', { name: item.name })}
            >
              {busy ? '…' : t.confirmUninstall}
            </button>
          ) : (
            <button
              type="button"
              style={S.installBtn}
              disabled={busy}
              onClick={() => setConfirming(true)}
            >
              {t.uninstall}
            </button>
          )}
        </span>
      </div>
      {item.description !== null ? <div style={S.hint}>{item.description}</div> : null}
      {error !== null ? <div style={{ ...S.hint, color: '#e5484d' }}>{error}</div> : null}
    </div>
  )
}

/** The "My plugins" tab: live inventory of the running profile. */
function InstalledView(props: { onNeedsRestart?: () => void } = {}) {
  const t = uiLang()
  const [items, setItems] = useState<InstalledItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const reload = (): void => {
    fetchInstalled()
      .then(async (list) => {
        const updates = await fetchUpdates()
        setItems(list.map((item) => ({ ...item, ...(updates[item.name] ?? {}) })))
      })
      .catch((e) => setError(String(e)))
  }
  useEffect(reload, [])

  if (error !== null) return <div style={S.placeholder}>{error}</div>
  if (items === null) return <div style={S.placeholder}>{t.loading}</div>
  const filtered = query.trim() === ''
    ? items
    : items.filter((item) => item.name.toLowerCase().includes(query.trim().toLowerCase()))
  return (
    <div style={S.settings}>
      <div style={S.hint}>{t.myPlugins} ({items.length})</div>
      <input
        style={S.search}
        placeholder={t.search}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <GroupsBlock items={items} onChanged={reload} onNeedsRestart={props.onNeedsRestart} />
      <OrderBlock onNeedsRestart={props.onNeedsRestart} />
      {filtered.length === 0 ? <div style={S.placeholder}>{t.mineEmpty}</div> : null}
      {filtered.map((item) => (
        <InstalledRow key={item.name} item={item} onChange={reload} onNeedsRestart={props.onNeedsRestart} />
      ))}
    </div>
  )
}

/** pnpm presence row for the Settings tab (helper #9). */
function PnpmHealthRow() {
  const t = uiLang()
  const [health, setHealth] = useState<{ found: boolean; version: string | null } | null>(null)
  const [busy, setBusy] = useState(false)
  const reload = (): void => {
    fetch('/plugins/dsh-plugins-mp/health', { headers: { accept: 'application/json' } })
      .then((res) => res.json())
      .then((body: { pnpm?: { found: boolean; version: string | null } }) =>
        setHealth(body.pnpm ?? { found: false, version: null }))
      .catch(() => setHealth({ found: false, version: null }))
  }
  useEffect(reload, [])
  const setup = (): void => {
    setBusy(true)
    pluginAction('/plugins/dsh-plugins-mp/setup-pnpm', {})
      .finally(() => { setBusy(false); reload() })
  }
  return (
    <div style={S.settingsRow}>
      <div style={S.settingsText}>
        <div style={S.settingsName}>{t.pnpmRow}</div>
        <div style={S.hint}>
          {health === null ? t.loading : health.found ? `v${health.version ?? '?'}` : t.pnpmMissing}
        </div>
      </div>
      {health !== null && !health.found ? (
        <button type="button" style={S.toggle} disabled={busy} onClick={setup}>
          {busy ? '…' : t.setup}
        </button>
      ) : null}
    </div>
  )
}

interface DiagnosticsReport {
  dsh: { version: string } | null
  pluginCount: number
  duplicates: Array<{ id: string; count: number }>
  missingOnDisk: string[]
  linkSources: string[]
  disabledRows: string[]
  hot: string[]
}

/** The Diagnostics tab: one read-only page of composition health. */
function DiagnosticsView() {
  const uiLangCode = useUiLang()
  const t = UI[uiLangCode] as UiDict
  const [report, setReport] = useState<DiagnosticsReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    fetch('/plugins/dsh-plugins-mp/diagnostics', { headers: { accept: 'application/json' } })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((body: DiagnosticsReport) => setReport(body))
      .catch((e) => setError(String(e)))
  }, [])
  if (error !== null) return <div style={S.placeholder}>{error}</div>
  if (report === null) return <div style={S.placeholder}>{t.loading}</div>
  const section = (title: string, rows: string[]): ReactNode => (
    <div style={S.settingsRow}>
      <div style={S.settingsText}>
        <div style={S.settingsName}>{title}</div>
        {rows.length === 0
          ? <div style={S.hint}>—</div>
          : rows.map((row) => <div key={row} style={S.hint}>{row}</div>)}
      </div>
    </div>
  )
  const problems: string[] = [
    ...report.duplicates.map((d) => `- ${t.dupRows}: ${d.id} ×${d.count}`),
    ...report.missingOnDisk.map((name) => `- ${t.missingRows}: ${name}`),
  ]
  const copyFixPrompt = (): void => {
    const lines = [
      uiLangCode === 'ru' ? 'Исправь конфигурацию профиля DSH. Проблемы:' : 'Fix the DSH profile composition. Problems:',
      ...problems,
      uiLangCode === 'ru'
        ? 'Предложи минимальные правки cordis.patch.yml / package.json профиля. Не трогай работающие процессы.'
        : 'Propose minimal edits to the profile cordis.patch.yml / package.json. Do not touch running processes.',
    ]
    void navigator.clipboard?.writeText(lines.join('\n')).catch(() => {})
  }
  return (
    <div style={S.settings}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ ...S.hint, flex: 1 }}>
          DSH {report.dsh?.version ?? '?'} · {t.myPlugins} ({report.pluginCount})
        </div>
        {problems.length > 0 ? (
          <button type="button" style={S.installBtn} onClick={copyFixPrompt}>
            {uiLangCode === 'ru' ? 'Скопировать AI-fix' : uiLangCode === 'zh' ? '复制 AI 修复提示' : 'Copy AI-fix prompt'}
          </button>
        ) : null}
      </div>
      {section(t.dupRows, report.duplicates.map((d) => `${d.id} ×${d.count}`))}
      {section(t.missingRows, report.missingOnDisk)}
      {section(t.linkRows, report.linkSources)}
      {section(t.disabledRowsLabel, report.disabledRows)}
      {section(t.liveRows, report.hot)}
    </div>
  )
}

/**
 * Banner + poll-until-changed restart flow: the host restarts OUTSIDE this
 * process (systemd or the successor script), the UI polls /status until the
 * pid changes, then reloads.
 */
function useRestartFlow(): { pending: boolean; restarting: boolean; arm: () => void } {
  const [pending, setPending] = useState(false)
  const [restarting, setRestarting] = useState(false)
  const arm = (): void => setPending(true)
  useEffect(() => {
    if (!pending || restarting) return
    let alive = true
    void (async () => {
      setRestarting(true)
      try {
        const before = await fetch('/plugins/dsh-plugins-mp/status', { headers: { accept: 'application/json' } })
          .then((res) => res.json()) as { pid?: number }
        await fetch('/plugins/dsh-plugins-mp/restart', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })
        for (let i = 0; i < 120; i++) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
          try {
            const after = await fetch('/plugins/dsh-plugins-mp/status', { headers: { accept: 'application/json' } })
              .then((res) => res.json()) as { pid?: number }
            if (after.pid !== undefined && before.pid !== undefined && after.pid !== before.pid) break
          } catch { /* host going down — keep polling */ }
        }
        window.location.reload()
      } catch {
        if (alive) setRestarting(false)
      }
    })()
    return () => { alive = false }
  }, [pending, restarting])
  return { pending, restarting, arm }
}

type ShellTab = 'catalog' | 'mine' | 'favorites' | 'themes' | 'diagnostics' | 'settings'

/**
 * Themes tab (plan #23): the catalog's "themes" category with exclusive
 * live switching on top of the phase-2 machinery. Applying a theme disables
 * the previously active one (toggle route, HMR ~1s), installs/enables the
 * chosen one if needed (install route hot-mounts), and remembers the choice
 * in state.json via /theme. Status badges are derived from the real
 * installed+enabled state, never from the persisted preference alone.
 */
function ThemesView(props: { onNeedsRestart?: () => void } = {}) {
  const t = uiLang()
  const favorites = useFavorites()
  const [items, setItems] = useState<MpCard[] | null>(null)
  const [installed, setInstalled] = useState<InstalledItem[]>([])
  const [active, setActive] = useState<{ slug: string; name: string } | null>(null)
  const [busySlug, setBusySlug] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [slug, setSlug] = useState<string | null>(null)

  const reload = (): void => {
    const usp = new URLSearchParams({ category: 'themes', installable: '1', sort: 'stars', limit: '100' })
    usp.set('locale', langCode())
    api<{ items: MpCard[] }>(`/plugins?${usp.toString()}`)
      .then((d) => setItems(d.items))
      .catch(() => setItems([]))
    fetchInstalled().then(setInstalled).catch(() => setInstalled([]))
    fetch('/plugins/dsh-plugins-mp/theme', { headers: { accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { active?: { slug: string; name: string } | null } | null) => setActive(d?.active ?? null))
      .catch(() => {})
  }
  useEffect(reload, [])

  if (slug !== null) {
    return (
      <DetailView slug={slug} dshVersion={null} onBack={() => setSlug(null)} onOpenSlug={setSlug} />
    )
  }

  const post = (path: string, body: unknown): Promise<Record<string, unknown>> =>
    fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }).then(async (r) => {
      const body = (await r.json().catch(() => ({}))) as Record<string, unknown>
      if (!r.ok) throw new Error(String(body.error ?? r.status))
      return body
    })

  const applyTheme = async (c: MpCard): Promise<void> => {
    setErr(null)
    setBusySlug(c.slug)
    try {
      // Взаимоисключающее переключение: гасим прежнюю тему, если она ещё включена.
      if (active !== null && active.slug !== c.slug) {
        const prev = installed.find((i) => i.name === active.name)
        if (prev !== undefined && prev.disabled !== true) {
          await post('/plugins/dsh-plugins-mp/toggle', { name: active.name, disable: true })
        }
      }
      let name = c.npmPackage ?? ''
      let hot = true
      const inst = installed.find((i) => i.name === name)
      if (inst === undefined) {
        const r = await requestInstall(c.slug, 'web')
        if (!r.ok) throw new Error(r.error ?? 'install failed')
        name = r.installedName ?? name
        hot = r.hot !== false
      } else {
        name = inst.name
        if (inst.disabled === true) {
          await post('/plugins/dsh-plugins-mp/toggle', { name, disable: false })
        }
      }
      if (name === '') throw new Error('cannot resolve the theme package name')
      await post('/plugins/dsh-plugins-mp/theme', { slug: c.slug, name })
      setActive({ slug: c.slug, name })
      setInstalled(await fetchInstalled())
      if (!hot) props.onNeedsRestart?.()
    } catch (e) {
      setErr(String(e instanceof Error ? e.message : e))
    } finally {
      setBusySlug(null)
    }
  }

  const deactivate = async (): Promise<void> => {
    if (active === null) return
    setBusySlug(active.slug)
    try {
      const inst = installed.find((i) => i.name === active.name)
      if (inst !== undefined && inst.disabled !== true) {
        await post('/plugins/dsh-plugins-mp/toggle', { name: active.name, disable: true })
      }
      await post('/plugins/dsh-plugins-mp/theme', { slug: null })
      setActive(null)
      setInstalled(await fetchInstalled())
    } catch (e) {
      setErr(String(e instanceof Error ? e.message : e))
    } finally {
      setBusySlug(null)
    }
  }

  return (
    <div style={S.list}>
      {err !== null && <div style={{ ...S.err, margin: '6px 12px' }}>{t.themeFail}: {err}</div>}
      {items === null ? (
        <div style={S.placeholder}>{t.loading}</div>
      ) : items.length === 0 ? (
        <div style={S.placeholder}>{t.empty}</div>
      ) : (
        <div style={{ ...S.grid, gridAutoRows: 'min-content', alignItems: 'start', paddingTop: 8 }}>
          {items.map((c) => {
            const isActive = active?.slug === c.slug
            const name = c.npmPackage ?? ''
            const inst = installed.find((i) => i.name === name)
            const busy = busySlug === c.slug
            return (
              <div
                key={c.slug}
                className="dsh-mp-theme-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 10,
                  border: '1px solid var(--dsw-alias-border, rgba(128,128,128,0.28))',
                  background: 'var(--dsw-alias-bg-layer-1, rgba(128,128,128,0.06))',
                  overflow: 'hidden',
                }}
              >
                {c.cover != null ? (
                  <button
                    type="button"
                    className="dsh-mp-theme-cover"
                    title={t.screenshots}
                    onClick={() => setSlug(c.slug)}
                  >
                    <img src={c.cover} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                    {(c.shots ?? 0) > 1 && <span className="dsh-mp-theme-pill">{c.shots}</span>}
                  </button>
                ) : (
                  <div className="dsh-mp-theme-cover dsh-mp-theme-cover-empty">
                    <span>✦</span>
                    <span>{t.screenshots}</span>
                  </div>
                )}
                <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minHeight: 0 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ ...S.cardName, cursor: 'pointer' }} onClick={() => setSlug(c.slug)}>{c.displayName}</span>
                    <span style={S.cardStars}>★ {c.stars}</span>
                  </div>
                  {c.authorName !== null && <span style={{ ...S.muted, fontSize: 11 }}>{t.by}: {c.authorName}</span>}
                  {c.shortDescription !== null && c.shortDescription !== '' && (
                    <span style={S.desc}>{c.shortDescription}</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '8px 12px', borderTop: '1px solid var(--dsw-alias-border, rgba(128,128,128,0.22))' }}>
                  <span
                    role="button"
                    style={{ ...S.favBtn, ...(favorites.includes(c.slug) ? S.favOn : {}) }}
                    title={favorites.includes(c.slug) ? t.favRemove : t.favAdd}
                    onClick={() => toggleFavorite(c.slug)}
                  >
                    ♥
                  </span>
                  {isActive && <span style={{ ...S.badge, ...S.chipOn }}>{t.themeActive}</span>}
                  <button
                    type="button"
                    style={{ ...S.installBtn, marginLeft: 'auto' }}
                    disabled={busy || (!isActive && busySlug !== null)}
                    onClick={() => { if (isActive) { void deactivate() } else { void applyTheme(c) } }}
                  >
                    {busy
                      ? t.themeBusy
                      : isActive
                        ? t.themeDeactivate
                        : inst !== undefined && inst.disabled !== true
                          ? t.themeApply
                          : inst !== undefined
                            ? t.themeEnable
                            : t.themeApply}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/**
 * Favorites tab (plan 3.2): cards for the slugs persisted in the host's
 * state.json. The list refetches whenever the favorites set changes, so a
 * ♥ toggle inside the tab removes the card on the next roundtrip.
 */
function FavoritesView() {
  const t = uiLang()
  const favorites = useFavorites()
  const favKey = favorites.join(',')
  const [items, setItems] = useState<MpCard[] | null>(null)
  const [slug, setSlug] = useState<string | null>(null)

  useEffect(() => {
    if (favorites.length === 0) {
      setItems([])
      return
    }
    const usp = new URLSearchParams({ slugs: favKey, limit: '100', sort: 'stars' })
    api<{ items: MpCard[] }>(`/plugins?${usp.toString()}`)
      .then((d) => setItems(d.items))
      .catch(() => setItems([]))
  }, [favKey, favorites.length])

  if (slug !== null) {
    return (
      <DetailView slug={slug} dshVersion={null} onBack={() => setSlug(null)} onOpenSlug={setSlug} />
    )
  }
  return (
    <div style={S.list}>
      {items === null ? (
        <div style={S.placeholder}>{t.loading}</div>
      ) : items.length === 0 ? (
        <div style={S.placeholder}>{t.favEmpty}</div>
      ) : (
        <div style={S.grid}>
          {items.map((c) => (
            <Card key={c.slug} card={c} dshVersion={null} onOpen={() => setSlug(c.slug)} />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * The market shell: one tabbed surface shared by the better-sidebar tab and
 * the DSH settings section. Catalog / My plugins / Settings carry content;
 * the rest show "coming soon" placeholders until their phases land.
 *
 * In the settings surface the dialog is a fixed 800px column (no host
 * affordance to widen it), so the ⤢ button portals the shell into a
 * full-viewport layer above the dialog; Esc or the same button returns.
 */
function MarketShell(props: MpTabProps & { surface?: 'sidebar' | 'settings' }) {
  const uiLangCode = useUiLang()
  const t = UI[uiLangCode] as UiDict
  const [tab, setTab] = useState<ShellTab>('catalog')
  const [fullscreen, setFullscreen] = useState(false)
  const surface = props.surface ?? 'sidebar'
  const { pending: restartPending, restarting, arm: armRestart } = useRestartFlow()

  useEffect(() => {
    ensureFavorites()
    return installClientStyle()
  }, [])

  // Daily anonymous heartbeat (plan 5.1): ≤1/day per profile, gated locally
  // and server-side; the payload is assembled by the host (fingerprint +
  // installed npm/github packages), the browser adds the UI locale.
  useEffect(() => {
    let last = 0
    try { last = Number(localStorage.getItem('dsh-mp-last-hb')) || 0 } catch { /* storage unavailable */ }
    if (Date.now() - last < 24 * 3600_000) return
    void (async () => {
      try {
        const res = await fetch(TELEMETRY_PAYLOAD_ROUTE, { headers: { accept: 'application/json' } })
        if (!res.ok) return
        const payload = (await res.json()) as {
          fingerprint?: string | null
          telemetry?: boolean
          dshVersion?: string | null
          plugins?: Array<{ slug: string; version?: string | null }>
        }
        if (payload.telemetry === false || payload.fingerprint === null || payload.fingerprint === undefined) return
        await ensureApiBase()
        await fetch(`${API_BASE}/telemetry/heartbeat`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            fingerprint: payload.fingerprint,
            dshVersion: payload.dshVersion,
            locale: langCode(),
            plugins: payload.plugins ?? [],
          }),
        })
        try { localStorage.setItem('dsh-mp-last-hb', String(Date.now())) } catch { /* ignore */ }
      } catch { /* telemetry must never break the market */ }
    })()
  }, [])

  useEffect(() => {
    if (!fullscreen) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setFullscreen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fullscreen])

  const tabs: Array<{ id: ShellTab; label: string }> = [
    { id: 'catalog', label: t.title },
    { id: 'mine', label: t.tabMine },
    { id: 'favorites', label: t.tabFavorites },
    { id: 'themes', label: t.tabThemes },
    { id: 'diagnostics', label: t.tabDiagnostics },
    { id: 'settings', label: t.tabSettings },
  ]

  const body = (
    <div style={{ ...S.root, ...(fullscreen ? { height: '100vh' } : {}) }} data-fullscreen={fullscreen || undefined}>
      {restartPending ? (
        <div style={{ ...S.settingsRow, flexShrink: 0, alignItems: 'center', gap: 8 }}>
          <div style={{ ...S.hint, flex: 1 }}>{restarting ? t.restartingLabel : t.restartPending}</div>
        </div>
      ) : null}
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
        {surface === 'settings' ? (
          <button
            type="button"
            style={{ ...S.tab, marginLeft: 'auto' }}
            title={fullscreen ? t.exitFullscreen : t.fullscreen}
            onClick={() => setFullscreen((v) => !v)}
          >
            {fullscreen ? '⤡' : '⤢'}
          </button>
        ) : null}
      </div>
      {tab === 'catalog' ? <CatalogView {...props} /> : null}
      {tab === 'mine' ? <InstalledView onNeedsRestart={armRestart} /> : null}
      {tab === 'favorites' ? <FavoritesView /> : null}
      {tab === 'themes' ? <ThemesView onNeedsRestart={armRestart} /> : null}
      {tab === 'settings' ? (
        <SettingsView onNeedsRestart={armRestart}>
          <PnpmHealthRow />
        </SettingsView>
      ) : null}
      {tab === 'diagnostics' ? <DiagnosticsView /> : null}
    </div>
  )

  if (fullscreen) {
    const target = document.querySelector('[role="dialog"]') ?? document.body
    return createPortal(
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          background: 'var(--dsw-alias-bg-layer-1, #16171a)',
          color: 'inherit',
        }}
      >
        {body}
      </div>,
      target,
    )
  }
  return body
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
        () => <MarketShell visible scope={{ sessionId: 'settings' }} surface="settings" />,
      ),
    )
    if (typeof off === 'function') {
      ctx.effect(() => off as () => void, 'dsh-plugins-mp: settings section')
    }
    // DSH paints a generic gear on external sections (no icon field in the
    // contract): mark our localized nav row and paint the marketplace glyph
    // over it with a currentColor mask — same adaptation as better-sidebar.
    ctx.effect(() => installSettingsNavStyle(), 'dsh-plugins-mp: settings nav style')
    ctx.effect(
      () => registerSettingsNavIcon(() => uiLang().title),
      'dsh-plugins-mp: settings nav icon',
    )
  })
}
