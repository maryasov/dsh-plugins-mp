# dsh-plugins-mp

DeepSeek Harness plugin marketplace client: a catalog tab for
[DSH better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar) + agent tools
(`mp_search`, `mp_similar`, `mp_details`, `mp_install`, `mp_trending`) over the API of
[dsh-plugins-mp.com](https://dsh-plugins-mp.com).

## Install

```sh
dsh plugin --profile web add dsh-plugins-mp
```

(after the npm release; before that — `add github:maryasov/dsh-plugins-mp`).

The "Marketplace" tab appears in the sidebar when `dsh-better-sidebar` is installed
(soft dependency: without it the plugin just skips the tab). Host-side tools always work.

## Agent tools

| Tool | What it does |
|---|---|
| `mp_search` | catalog search (text, category, profile, sorting) + install commands |
| `mp_similar` | similar plugins (vector search) |
| `mp_details` | full profile: localized description, versions, per-DSH-release sandbox compatibility, tags |
| `mp_install` | builds the `dsh plugin --profile <p> add <source>` command (executes nothing) |
| `mp_trending` | popular plugins: by stars / downloads / updates |

Responses are localized (en / zh / ru via the `lang` parameter).

## Development

```sh
pnpm install
pnpm build        # tsdown: node half (ESM) + client half (CJS closure)
pnpm typecheck
```

Try it in DSH: `dsh plugin --profile mp-test add <path to this repo>` →
`dsh --profile mp-test --dump-config` (exit 0 = bundle mounted).

The `lib/` artifacts are committed, so installing from git requires no build
(ecosystem convention — `@deepseek-ai/*` stay external and resolve from the host).

The marketplace platform sources live in the private repository
`maryasov/dsh-plugins-marketplace`.
