/**
 * dsh-plugins-mp, node half: model-facing tools over the marketplace API
 * (dsh-plugins-mp.com). Registered through ctx.tools.register(defineTool)
 * per the DSH tool-authoring contract; the plugin stays a thin API adapter —
 * no execution, no persistence beyond its `.dsh-mp/state.json` settings.
 */
import { defineTool, type InferValue, type ObjectValueSchemaSpec } from '@deepseek-ai/dsh-tools'
import {
  DEFAULT_API_BASE,
  fetchCatalog,
  fetchDetail,
  fetchSimilar,
  installCommandFor,
  installSourceFor,
  resolveApiBase,
  type MpApiConfig,
  type MpCard,
  type MpDetail,
} from './api.js'
import { labels, pickLang, type Lang } from './i18n.js'
import { logEvent } from './log.js'
import { resolveStateDir } from './mp-home.js'
import { mountRoutes } from './routes.js'
import type { MpRuntime } from './runtime.js'
import { loadMpState, saveMpState, type MpState } from './store.js'
export { mountRoutes }

export const name = 'dsh-plugins-mp'
export const inject = ['tools']

/** Loader config (cordis.patch.yml `config:` block) + .env overrides. */
export interface MpPluginConfig extends MpApiConfig {
  /** Explicit profile override; defaults to the running CLI's --profile or "web". */
  profile?: string
  /** Boot-time agent-tools default; the Settings toggle persists into state.json. */
  agentTools?: boolean
}

/** Only the surface we use — keeps the plugin buildable outside the DSH workspace. */
export interface MpContext {
  tools: {
    register(definition: ReturnType<typeof defineTool>): unknown
  }
  /** Dynamic injection (core cordis) — used for the web-profile-only HTTP surface. */
  inject: (deps: string[], fn: (sctx: never) => unknown) => unknown
  /** Cordis service read — the agents inventory guard (optional). */
  get?: (name: string) => unknown
}

/** Value object: any JSON shape we return (checked per-field at runtime by the registry). */
const OBJECT_SCHEMA = { type: 'object', additionalProperties: true } as const satisfies ObjectValueSchemaSpec
type ObjValue = InferValue<typeof OBJECT_SCHEMA>

const LANG_PARAM = {
  type: 'string',
  description: 'Language for human-facing text in the response.',
  enum: ['en', 'zh', 'ru'],
} as const

function compactCard(card: MpCard, lang: Lang) {
  const t = labels(lang)
  return {
    slug: card.slug,
    name: card.displayName,
    author: card.authorName,
    stars: card.stars,
    downloadsPerWeek: card.npmDownloadsWeek || null,
    version: card.latestVersion,
    description: card.shortDescription,
    install: installCommandFor(card),
    authorLabel: t.by,
  }
}

function localizedDescription(detail: MpDetail, lang: Lang): string {
  const p = detail.plugin
  if (lang === p.originalLang) return p.descriptionMd
  const candidates = p.translations.filter((tr) => tr.kind === 'description' && tr.locale === lang)
  const human = candidates.find((tr) => !tr.isMachine)
  const machine = candidates.find((tr) => tr.isMachine)
  const text = human?.textMd ?? machine?.textMd
  return text || p.descriptionMd
}

function compatRows(detail: MpDetail, lang: Lang): Array<{ dsh: string; status: string }> {
  const t = labels(lang)
  const runs = detail.versions[0]?.testRuns ?? []
  return runs.map((run) => ({
    dsh: run.dshRelease,
    status:
      run.status === 'passed'
        ? t.works
        : run.status === 'failed' || run.status === 'error'
          ? t.installFailed
          : run.status === 'timeout'
            ? t.timedOut
            : t.untested,
  }))
}

/**
 * The five model-facing tools, as one registrable unit: a single disposer
 * covers them all, so the Settings toggle can add/remove the whole surface
 * live (no recompose, no restart).
 */
function registerTools(ctx: MpContext, apiBase: string): () => void {
  const disposers: Array<unknown> = []
  const register = (definition: ReturnType<typeof defineTool>): void => {
    disposers.push(ctx.tools.register(definition))
  }
  register(
    defineTool({
      name: 'mp_search',
      description:
        `Search the DeepSeek Harness plugin marketplace (dsh-plugins-mp.com, ${DEFAULT_API_BASE}). ` +
        `Returns name, stars, short description and the exact install command for each match. ` +
        `Use when the user asks to find/discover plugins, or before installing anything.`,
      parameters: {
        query: { type: 'string', description: 'Free-text search over name, description, npm package name.' },
        category: { type: 'string', description: 'Category slug filter (e.g. "ui", "tools", "memory").' },
        profile: { type: 'string', description: 'Profile filter: "web", "tui" or "agent".', enum: ['web', 'tui', 'agent'] },
        installable: { type: 'boolean', description: 'Only plugins that can actually be installed (have a manifest).' },
        sort: { type: 'string', description: 'Sort order.', enum: ['stars', 'updated', 'newest', 'name'] },
        limit: { type: 'number', description: 'Results per page, 1-25 (default 12).' },
        page: { type: 'number', description: 'Page number, 1-based.' },
        lang: LANG_PARAM,
      },
      output: {
        schema: OBJECT_SCHEMA,
        render: (_args, value) => {
          const v = value as { total: number; plugins: Array<Record<string, unknown>>; text: string }
          const lines = [
            `${v.text}`,
            ...v.plugins.map((p) =>
              `• ${p.name} (${p.slug}) — ★${p.stars}${p.description ? ` — ${p.description}` : ''}\n  ${p.install}`,
            ),
          ]
          return [{ type: 'text', text: lines.join('\n') }]
        },
      },
      async execute(args, exec): Promise<ObjValue> {
        const lang = pickLang(args.lang)
        const t = labels(lang)
        const catalog = await fetchCatalog(
          apiBase,
          {
            q: args.query?.trim() || undefined,
            category: args.category,
            profile: args.profile,
            installable: args.installable,
            sort: args.sort,
            limit: args.limit,
            page: args.page,
          },
          exec.signal,
        )
        return {
          total: catalog.total,
          page: catalog.page,
          plugins: catalog.items.map((card) => compactCard(card, lang)),
          text: `${t.found(catalog.total)}`,
        }
      },
    }),
  )

  register(
    defineTool({
      name: 'mp_similar',
      description:
        `Plugins similar to a given marketplace plugin (semantic vector search). ` +
        `Give a plugin slug (mp_search returns slugs). Use to recommend alternatives.`,
      parameters: {
        slug: { type: 'string', required: true, description: 'Plugin slug, e.g. "owner--repo".' },
        limit: { type: 'number', description: 'How many, 1-12 (default 6).' },
        lang: LANG_PARAM,
      },
      output: {
        schema: OBJECT_SCHEMA,
        render: (_args, value) => {
          const v = value as { found: boolean; plugins: Array<Record<string, unknown>>; text: string }
          if (!v.found) return [{ type: 'text', text: v.text }]
          const lines = [v.text, ...v.plugins.map((p) => `• ${p.name} (${p.slug}) — ★${p.stars}\n  ${p.install}`)]
          return [{ type: 'text', text: lines.join('\n') }]
        },
      },
      async execute(args, exec): Promise<ObjValue> {
        const lang = pickLang(args.lang)
        const t = labels(lang)
        let detail: MpDetail
        try {
          detail = await fetchDetail(apiBase, args.slug, exec.signal)
        } catch {
          return { found: false, plugins: [], text: t.notFound(args.slug) }
        }
        const similar = await fetchSimilar(apiBase, args.slug, exec.signal)
        return {
          found: true,
          plugins: similar.items.map((card) => compactCard(card, lang)),
          text: t.similarTo(detail.plugin.displayName),
        }
      },
    }),
  )

  register(
    defineTool({
      name: 'mp_details',
      description:
        `Full marketplace info about one plugin: localized description, install command, ` +
        `versions, sandbox compatibility per DSH release, capabilities, tags. ` +
        `Give a plugin slug (mp_search returns slugs).`,
      parameters: {
        slug: { type: 'string', required: true, description: 'Plugin slug, e.g. "owner--repo".' },
        lang: LANG_PARAM,
      },
      output: {
        schema: OBJECT_SCHEMA,
        render: (_args, value) => {
          const v = value as {
            found: boolean
            text?: string
            name?: string
            slug?: string
            author?: string | null
            stars?: number
            downloadsPerWeek?: number
            install?: string
            description?: string
            compatibility?: Array<{ dsh: string; status: string }>
            capabilities?: string[]
            tags?: string[]
            latestVersion?: string | null
          }
          if (!v.found) return [{ type: 'text', text: v.text ?? 'Not found.' }]
          const t = labels('en')
          const lines: string[] = [
            `${v.name} (${v.slug}) — ★${v.stars ?? 0}${v.downloadsPerWeek ? `, ${v.downloadsPerWeek} ${t.weeklyDownloads}` : ''}`,
            v.author ? `${t.by}: ${v.author}` : '',
            v.latestVersion ? `${t.latest}: ${v.latestVersion}` : '',
            '',
            v.description ?? '',
            '',
            `${t.runToInstall} ${v.install}`,
          ]
          if (v.compatibility?.length) {
            lines.push('', `${t.compatibility}: ${v.compatibility.map((c) => `${c.dsh}: ${c.status}`).join(', ')}`)
          }
          if (v.capabilities?.length) lines.push(`${t.capabilities}: ${v.capabilities.join(', ')}`)
          if (v.tags?.length) lines.push(`tags: ${v.tags.join(', ')}`)
          return [{ type: 'text', text: lines.filter((l) => l !== '').join('\n') }]
        },
      },
      async execute(args, exec): Promise<ObjValue> {
        const lang = pickLang(args.lang)
        const t = labels(lang)
        let detail: MpDetail
        try {
          detail = await fetchDetail(apiBase, args.slug, exec.signal)
        } catch {
          return { found: false, text: t.notFound(args.slug) }
        }
        const p = detail.plugin
        const capabilities = Object.entries(p.capabilities ?? {})
          .filter(([, on]) => on)
          .map(([key]) => key)
        return {
          found: true,
          slug: p.slug,
          name: p.displayName,
          author: p.authorName,
          license: p.license,
          language: p.primaryLanguage,
          stars: p.stars,
          downloadsPerWeek: p.npmDownloadsWeek,
          latestVersion: detail.versions[0]?.version ?? null,
          install: installCommandFor(p),
          description: localizedDescription(detail, lang),
          compatibility: compatRows(detail, lang),
          capabilities,
          tags: p.tags,
          categories: p.categories,
          repo: p.repoOwner ? `${p.repoOwner}/${p.repoName}` : null,
          npm: p.npmPackage,
          deprecated: p.deprecatedReason,
        }
      },
    }),
  )

  register(
    defineTool({
      name: 'mp_install',
      description:
        `Build the install command for a marketplace plugin. Does NOT execute anything — ` +
        `returns the exact "dsh plugin --profile <profile> add <source>" command to run ` +
        `(e.g. with the bash tool) or to hand to the user.`,
      parameters: {
        slug: { type: 'string', required: true, description: 'Plugin slug, e.g. "owner--repo".' },
        profile: { type: 'string', description: 'Target DSH profile (default "web").', enum: ['web', 'tui', 'agent'] },
        lang: LANG_PARAM,
      },
      output: {
        schema: OBJECT_SCHEMA,
        render: (_args, value) => {
          const v = value as { found: boolean; command?: string; text: string }
          if (!v.found) return [{ type: 'text', text: v.text }]
          return [{ type: 'text', text: v.text }]
        },
      },
      async execute(args, exec): Promise<ObjValue> {
        const lang = pickLang(args.lang)
        const t = labels(lang)
        let detail: MpDetail
        try {
          detail = await fetchDetail(apiBase, args.slug, exec.signal)
        } catch {
          return { found: false, command: null, source: null, profile: args.profile ?? 'web', text: t.notFound(args.slug) }
        }
        const command = installCommandFor(detail.plugin, args.profile ?? 'web')
        return {
          found: true,
          command,
          source: installSourceFor(detail.plugin),
          profile: args.profile ?? 'web',
          text: `${t.runToInstall}\n${command}`,
        }
      },
    }),
  )

  register(
    defineTool({
      name: 'mp_trending',
      description:
        `Top marketplace plugins: by GitHub stars, by weekly npm downloads, or recently updated. ` +
        `Use when the user asks what is popular/trending.`,
      parameters: {
        by: { type: 'string', description: 'Ranking metric. installs = real anonymous install counts (trailing 7 days).', enum: ['installs', 'stars', 'downloads', 'updated'] },
        limit: { type: 'number', description: 'How many, 1-25 (default 10).' },
        lang: LANG_PARAM,
      },
      output: {
        schema: OBJECT_SCHEMA,
        render: (_args, value) => {
          const v = value as { plugins: Array<Record<string, unknown>>; text: string }
          const lines = [
            v.text,
            ...v.plugins.map((p, i) => `${i + 1}. ${p.name} (${p.slug}) — ★${p.stars}\n  ${p.install}`),
          ]
          return [{ type: 'text', text: lines.join('\n') }]
        },
      },
      async execute(args, exec): Promise<ObjValue> {
        const lang = pickLang(args.lang)
        const t = labels(lang)
        const by = ['installs', 'stars', 'downloads', 'updated'].includes(args.by) ? args.by : 'installs'
        const limit = Math.min(args.limit ?? 10, 25)
        let metric = by
        let cards: MpCard[] = []
        if (by === 'installs') {
          // Real install counts (anonymous telemetry); falls back to stars
          // while the trending table is still empty.
          try {
            const trend = await api<Array<{ slug: string; installs: number }>>(
              apiBase,
              '/trending?days=7&limit=' + String(limit),
              exec.signal,
            )
            if (trend.length > 0) {
              const catalog = await fetchCatalog(
                apiBase,
                { slugs: trend.map((entry) => entry.slug), limit: Math.max(limit, trend.length) },
                exec.signal,
              )
              const bySlug = new Map(catalog.items.map((card) => [card.slug, card]))
              cards = trend
                .map((entry) => bySlug.get(entry.slug))
                .filter((card): card is MpCard => card !== undefined)
              metric = 'installs'
            } else {
              metric = 'stars'
            }
          } catch {
            metric = 'stars'
          }
        }
        if (metric !== 'installs') {
          const catalog = await fetchCatalog(
            apiBase,
            { sort: metric === 'downloads' ? 'stars' : metric, limit },
            exec.signal,
          )
          cards = catalog.items
          if (metric === 'downloads') {
            cards = [...cards].sort((a, b) => b.npmDownloadsWeek - a.npmDownloadsWeek)
          }
        }
        return {
          plugins: cards.map((card) => compactCard(card, lang)),
          text: t.trending(metric),
        }
      },
    }),
  )
  return () => {
    for (const dispose of disposers) {
      if (typeof dispose === 'function') dispose()
    }
    disposers.length = 0
  }
}

export function apply(ctx: MpContext, config: MpPluginConfig = {}): void {
  const apiBase = resolveApiBase(config)
  const stateDir = resolveStateDir(config)
  const state = loadMpState(stateDir)

  // Effective boot value: an explicit loader-config flag wins over the
  // persisted Settings toggle; both default to enabled.
  let agentTools = config.agentTools ?? state.agentTools

  let disposeTools: (() => void) | null = null
  const applyTools = (): void => {
    if (agentTools && disposeTools === null) disposeTools = registerTools(ctx, apiBase)
    if (!agentTools && disposeTools !== null) {
      disposeTools()
      disposeTools = null
    }
  }

  const runtime: MpRuntime = {
    getState: () => state,
    updateState: (patch) => {
      Object.assign(state, patch)
      saveMpState(stateDir, state)
      return state
    },
    stateDir: () => stateDir,
    agentToolsEnabled: () => agentTools,
    setAgentTools: (on) => {
      if (on === agentTools) return
      agentTools = on
      state.agentTools = on
      saveMpState(stateDir, state)
      applyTools()
    },
  }

  // Persist the effective boot value so state.json always mirrors reality
  // (e.g. the first run after a config flip).
  if (state.agentTools !== agentTools) {
    state.agentTools = agentTools
    saveMpState(stateDir, state)
  }

  // Web-profile-only HTTP surface (host version, one-click install, settings,
  // log export). Headless profiles keep working: routes mount through dynamic
  // injection and simply do not appear without a webServer service.
  mountRoutes(ctx, config, runtime)
  applyTools()
  logEvent('info', 'boot', `applied (agent tools ${agentTools ? 'on' : 'off'}, profile dir ${stateDir})`)
}
