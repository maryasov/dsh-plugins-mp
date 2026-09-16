import { defineTool } from "@deepseek-ai/dsh-tools";
import { existsSync, mkdirSync, readFileSync, realpathSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
//#region src/api.ts
/**
* Marketplace API client (host half). Minimal local mirror of the
* dsh-plugins-mp.com response DTOs — the shared types live in the private
* site repo, the plugin must build standalone.
*/
const DEFAULT_API_BASE = "https://dsh-plugins-mp.com/api";
const CONFIG_ROUTE = "/plugins/dsh-plugins-mp/config";
/**
* Parse a `.env`-style file (KEY=value, ignoring blanks, # comments and
* surrounding quotes). Used to let the plugin pick up a local backend override
* without shipping one — no `.env` in the plugin folder means we fall back to
* the hosting backend (DEFAULT_API_BASE).
*/
function parseDotEnv(contents) {
	const out = {};
	for (const rawLine of contents.split(/\r?\n/)) {
		const line = rawLine.trim();
		if (line === "" || line.startsWith("#")) continue;
		const eq = line.indexOf("=");
		if (eq === -1) continue;
		const key = line.slice(0, eq).trim();
		let val = line.slice(eq + 1).trim();
		if (val.startsWith("\"") && val.endsWith("\"") || val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
		if (key) out[key] = val;
	}
	return out;
}
/**
* Absolute path to the plugin's own folder, where a local `.env` may live.
* `process.env.DMP_PLUGIN_DIR` lets callers (and tests) point at a specific
* folder; otherwise we resolve it from this bundled module's own location via
* `import.meta.url` — works whether the plugin is installed from a local path
* or a git clone.
*/
function pluginDir() {
	if (process.env.DMP_PLUGIN_DIR) return process.env.DMP_PLUGIN_DIR;
	const here = dirname(fileURLToPath(import.meta.url));
	try {
		return dirname(realpathSync(here));
	} catch {
		return join(here, "..");
	}
}
/** Value of a backend override from a local `.env`, or undefined if absent. */
function localDotEnvApiBase() {
	try {
		return parseDotEnv(readFileSync(join(pluginDir(), ".env"), "utf8"))["DSH_MP_API_URL"];
	} catch {
		return;
	}
}
/**
* Normalize a backend base for the `/api`-prefixed client. Strips trailing
* slashes and, for absolute URLs that omit the `/api` segment, appends it — so
* `DSH_MP_API_URL=https://dev.dsh-plugins-mp.com` and
* `.../api` both resolve correctly. The `/api` path is required because the API
* server is reached via `dev.dsh-plugins-mp.com/api` (nginx strips it → :4000).
*/
function normalizeApiBase(base) {
	let b = base.replace(/\/+$/, "");
	if (/^https?:\/\//i.test(b) && !/\/api\b/.test(b)) b += "/api";
	return b;
}
function resolveApiBase(config) {
	return normalizeApiBase(config?.apiBase ?? process.env.DSH_MP_API_URL ?? localDotEnvApiBase() ?? "https://dsh-plugins-mp.com/api");
}
async function api(base, path, signal) {
	const res = await fetch(`${base}${path}`, {
		headers: { accept: "application/json" },
		signal
	});
	if (!res.ok) throw new Error(`marketplace API ${path} -> ${res.status}`);
	return await res.json();
}
function fetchCatalog(base, query, signal) {
	const usp = new URLSearchParams();
	if (query.q) usp.set("q", query.q);
	if (query.category) usp.set("category", query.category);
	if (query.profile) usp.set("profile", query.profile);
	if (query.installable) usp.set("installable", "1");
	if (query.sort) usp.set("sort", query.sort);
	usp.set("limit", String(Math.min(query.limit ?? 12, 25)));
	usp.set("page", String(query.page ?? 1));
	return api(base, `/plugins?${usp.toString()}`, signal);
}
function fetchDetail(base, slug, signal) {
	return api(base, `/plugins/${encodeURIComponent(slug)}`, signal);
}
function fetchSimilar(base, slug, signal) {
	return api(base, `/plugins/${encodeURIComponent(slug)}/similar`, signal);
}
/**
* Install source for `dsh plugin --profile <p> add <source>`: npm package when
* known, otherwise the GitHub repo (pnpm understands `github:` shorthand).
*/
function installSourceFor(card) {
	if (card.npmPackage) return card.npmPackage;
	if (card.repoOwner && card.repoName) return `github:${card.repoOwner}/${card.repoName}`;
	return card.slug;
}
function installCommandFor(card, profile = "web") {
	return `dsh plugin --profile ${profile} add ${installSourceFor(card)}`;
}
//#endregion
//#region src/i18n.ts
function pickLang(lang) {
	if (lang === "zh" || lang === "ru" || lang === "en") return lang;
	if (lang?.startsWith("zh")) return "zh";
	if (lang?.startsWith("ru")) return "ru";
	return "en";
}
const EN = {
	found: (n) => `Found ${n} plugin(s)`,
	similarTo: (name) => `Plugins similar to ${name}`,
	installWith: "Install command",
	runToInstall: "To install, run:",
	installNote: "The command installs the plugin into the given DSH profile via pnpm. Run it yourself (e.g. with the bash tool) or share it with the user. The running harness picks up new client plugins on browser reload; host plugins may need a harness restart.",
	compatibility: "Compatibility (sandbox auto-tests)",
	works: "works",
	installFailed: "install failed",
	timedOut: "timeout",
	untested: "untested",
	stars: "stars",
	weeklyDownloads: "downloads/week",
	versions: "versions",
	latest: "latest",
	trending: (by) => `Trending plugins (by ${by})`,
	notFound: (slug) => `Plugin "${slug}" not found in the marketplace.`,
	apiError: (msg) => `Marketplace API error: ${msg}`,
	capabilities: "capabilities",
	by: "by"
};
const ZH = {
	found: (n) => `找到 ${n} 个插件`,
	similarTo: (name) => `与 ${name} 相似的插件`,
	installWith: "安装命令",
	runToInstall: "运行以下命令即可安装：",
	installNote: "该命令通过 pnpm 将插件安装到指定的 DSH profile。请自行执行（例如用 bash 工具）或把命令交给用户。运行中的 harness 在浏览器刷新后会加载新的客户端插件；宿主侧插件可能需要重启 harness。",
	compatibility: "兼容性（沙箱自动测试）",
	works: "正常",
	installFailed: "安装失败",
	timedOut: "超时",
	untested: "未测试",
	stars: "星标",
	weeklyDownloads: "周下载",
	versions: "版本",
	latest: "最新",
	trending: (by) => `热门插件（按${by === "stars" ? "星标" : by === "downloads" ? "下载量" : "更新时间"}）`,
	notFound: (slug) => `市场里没有找到插件「${slug}」。`,
	apiError: (msg) => `市场 API 出错：${msg}`,
	capabilities: "能力",
	by: "作者"
};
const RU = {
	found: (n) => `Найдено плагинов: ${n}`,
	similarTo: (name) => `Похожие на ${name}`,
	installWith: "Команда установки",
	runToInstall: "Для установки выполните:",
	installNote: "Команда ставит плагин в указанный DSH-профиль через pnpm. Выполните её сами (например, инструментом bash) или передайте пользователю. Работающий harness подхватит клиентские плагины после обновления страницы браузера; для host-плагинов может понадобиться перезапуск harness.",
	compatibility: "Совместимость (автотесты в песочнице)",
	works: "работает",
	installFailed: "ошибка установки",
	timedOut: "таймаут",
	untested: "не тестировался",
	stars: "звёзд",
	weeklyDownloads: "загрузок/нед",
	versions: "версии",
	latest: "последняя",
	trending: (by) => `Популярные плагины (по ${by === "stars" ? "звёздам" : by === "downloads" ? "загрузкам" : "обновлениям"})`,
	notFound: (slug) => `Плагин «${slug}» не найден в маркетплейсе.`,
	apiError: (msg) => `Ошибка API маркетплейса: ${msg}`,
	capabilities: "возможности",
	by: "автор"
};
function labels(lang) {
	return lang === "zh" ? ZH : lang === "ru" ? RU : EN;
}
//#endregion
//#region src/log.ts
/**
* Event log for issue reports: what the plugin did and how it failed,
* exportable as plain text from `GET /plugins/dsh-plugins-mp/logs`.
*
* Privacy: entries are sanitized on write — the home directory collapses to
* `~`, and value-shaped secrets (tokens, keys) are redacted before a string
* is stored. The buffer is in-memory only; nothing is ever sent anywhere.
*/
const RING_MAX = 500;
const ring = [];
const HOME = homedir();
/** Bearer-style and assignment-style secret shapes, masked before storing. */
const SECRET_SHAPE = /((?:bearer\s+|token[=:]|key[=:]|password[=:])\S+)/gi;
function sanitizeLogText(message) {
	let text = message.split(HOME).join("~");
	text = text.replace(SECRET_SHAPE, () => "[redacted]");
	return text;
}
function logEvent(level, scope, message) {
	const entry = {
		at: (/* @__PURE__ */ new Date()).toISOString(),
		level,
		scope,
		message: sanitizeLogText(message).slice(0, 2e3)
	};
	ring.push(entry);
	if (ring.length > RING_MAX) ring.splice(0, ring.length - RING_MAX);
}
/** The whole buffer as one human-readable plain-text blob (log-file shaped). */
function exportLog() {
	const head = [
		"dsh-plugins-mp event log",
		`exported: ${(/* @__PURE__ */ new Date()).toISOString()}`,
		`entries: ${ring.length}`,
		"".padEnd(60, "-")
	];
	const lines = ring.map((e) => `${e.at} ${e.level.toUpperCase().padEnd(5)} [${e.scope}] ${e.message}`);
	return [
		...head,
		...lines,
		""
	].join("\n");
}
//#endregion
//#region src/mp-home.ts
/**
* Profile & storage paths for the plugin's durable state.
*
* Everything the plugin persists lives under `<profile>/.dsh-mp/` — one
* directory per profile, mirroring the profile-scoped layout of the DSH home
* (`~/.dsh/profiles/<name>`). Home resolution follows the semantics of
* `@deepseek-ai/dsh-home-paths` (DSH_HOME with tilde expansion, blank = unset);
* the profile name comes from the loader config, else the running CLI's
* `--profile` argument, else `web`.
*/
/** The profile this host process actually booted (`--profile <name>`). */
function argvProfile() {
	const argv = process.argv;
	const flag = argv.indexOf("--profile");
	if (flag !== -1 && flag + 1 < argv.length && !argv[flag + 1].startsWith("-")) return argv[flag + 1];
}
/** Directory-name contract, aligned with app-boot's resolveProfileDir. */
function isDshProfileName(profile) {
	return profile !== "" && profile !== "." && profile !== ".." && profile !== "node_modules" && !profile.includes("/") && !profile.includes("\\") && !profile.includes("\0");
}
function expandHomePath(path) {
	if (path === "~") return homedir();
	if (path.startsWith("~/") || path.startsWith("~\\")) return join(homedir(), path.slice(2));
	return path;
}
function resolveDshHome() {
	const fromEnv = process.env.DSH_HOME;
	const selected = fromEnv !== void 0 && fromEnv.trim().length > 0 ? fromEnv : join(homedir(), ".dsh");
	return resolve(expandHomePath(selected));
}
/** `<DSH_HOME>/profiles/<profile>` — config override wins over the CLI argv. */
function resolveProfileDir(config) {
	const name = config?.profile ?? argvProfile() ?? "web";
	if (!isDshProfileName(name)) throw new Error(`dsh-plugins-mp: invalid profile name ${JSON.stringify(name)}`);
	return join(resolveDshHome(), "profiles", name);
}
/** The plugin's durable-state directory inside the profile. */
function resolveStateDir(config) {
	return join(resolveProfileDir(config), ".dsh-mp");
}
//#endregion
//#region src/host-info.ts
/**
* Locate the DSH host package this plugin is running inside and report its
* version (adapted from dsh-market's dshHostInfo): walk up from the CLI entry
* looking for a package.json whose name is @deepseek-ai/dsh.
*/
const DSH_PACKAGE = "@deepseek-ai/dsh";
function readManifest(directory) {
	try {
		return JSON.parse(readFileSync(join(directory, "package.json"), "utf8"));
	} catch {
		return null;
	}
}
function realpathOf(entry) {
	try {
		return realpathSync(entry);
	} catch {
		return entry;
	}
}
function dshHostInfo(entry = process.argv[1]) {
	let dir = null;
	try {
		dir = dirname(realpathOf(entry ?? ""));
	} catch {
		return null;
	}
	if (!dir) return null;
	for (let i = 0; i < 12; i++) {
		const manifest = readManifest(dir);
		if (manifest?.name === DSH_PACKAGE) return {
			version: typeof manifest.version === "string" && manifest.version !== "" ? manifest.version : "unknown",
			directory: dir
		};
		const parent = dirname(dir);
		if (parent === dir) return null;
		dir = parent;
	}
	return null;
}
//#endregion
//#region src/routes.ts
/**
* Host HTTP surface (web profiles only, mounted through the dynamic
* ctx.inject(['webServer']) pattern — headless profiles skip it):
*
* - GET  /plugins/dsh-plugins-mp/host    → { dsh: { version } | null }
* - GET  /plugins/dsh-plugins-mp/config  → { apiBase } — resolved backend the
*   browser half should use (host resolves config/env/.env once, browser is
*   same-origin to it).
* - POST /plugins/dsh-plugins-mp/install → body { slug, profile, dry? };
*   resolves the install source from the marketplace API and re-invokes the
*   `dsh plugin` CLI (child_process, NOT ctx.shell: the agent shell is a
*   sandboxed executor that denies profile writes — same reasoning as
*   dsh-market). One install at a time.
* - GET  /plugins/dsh-plugins-mp/settings → { agentTools }
* - POST /plugins/dsh-plugins-mp/settings → body { agentTools }: flips the
*   model-facing tools live through the runtime.
* - GET  /plugins/dsh-plugins-mp/logs → sanitized plain-text event log.
*/
const HOST_ROUTE = "/plugins/dsh-plugins-mp/host";
const INSTALL_ROUTE = "/plugins/dsh-plugins-mp/install";
const SETTINGS_ROUTE = "/plugins/dsh-plugins-mp/settings";
const LOGS_ROUTE = "/plugins/dsh-plugins-mp/logs";
const INSTALL_TIMEOUT_MS = 6e5;
const MAX_OUTPUT_CHARS = 2e4;
/** Same-origin guard for mutating requests (adapted from dsh-sentinel). */
function requestAllowed(req) {
	const headers = req.headers;
	if (headers === void 0) return true;
	const read = (name) => {
		const value = headers[name];
		return Array.isArray(value) ? value[0] : value;
	};
	const site = read("sec-fetch-site");
	if (site === "cross-site") return false;
	const origin = read("origin");
	const host = read("host");
	if (!(site !== void 0 || origin !== void 0 && origin !== "null")) return true;
	if (origin !== void 0 && origin !== "null") try {
		return new URL(origin).host === (host ?? "");
	} catch {
		return false;
	}
	return true;
}
const SLUG_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/;
const PROFILE_RE = /^[a-z0-9][a-z0-9_-]{0,39}$/;
function readBody(req) {
	return new Promise((resolve) => {
		let body = "";
		req.on("data", (chunk) => {
			body += chunk.toString("utf8");
			if (body.length > 1e4) body = "";
		});
		req.on("end", () => resolve(body));
		req.on("close", () => resolve(body));
	});
}
/** Каталог, из которого разрешится `--import tsx/esm` (корень чекаута с node_modules). */
function moduleRootFor(entry) {
	let dir = dirname(entry);
	for (let i = 0; i < 8; i++) {
		if (existsSync(join(dir, "node_modules", "tsx"))) return dir;
		const parent = dirname(dir);
		if (parent === dir) break;
		dir = parent;
	}
	return dirname(entry);
}
function dshCommands() {
	const cmds = [];
	const override = process.env.DSH_MP_DSH_BIN;
	if (override) cmds.push({
		argv: [override],
		label: override
	});
	const entry = process.argv[1] ?? "";
	if (/(?:bin\.(?:js|ts)|dsh)$/.test(entry)) cmds.push({
		argv: [
			process.execPath,
			...process.execArgv,
			entry
		],
		cwd: moduleRootFor(entry),
		label: `node … ${entry}`
	});
	cmds.push({
		argv: ["dsh"],
		label: "dsh (PATH)"
	});
	cmds.push({
		argv: [join(homedir(), ".local", "bin", "dsh")],
		label: "~/.local/bin/dsh"
	});
	return cmds;
}
/**
* PATH-repair (dsh-market spawnEnv): у процесса, обслуживающего плагин
* (systemd-юнит, GUI-лаунчер), PATH урезан, а `pnpm` может разрешиться в
* corepack-шим со старой дефолтной версией — тогда установка в профиль идёт
* чужим pnpm и падает ERR_PNPM_UNEXPECTED_STORE (store v10 против v11).
* Поэтому /usr/sbin (реальный pnpm 11) ставим раньше shim-каталогов.
* CI=true — pnpm не ждёт ответа на TTY-вопросах в headless-окружении.
*/
function spawnEnv() {
	return {
		...process.env,
		PATH: `/usr/sbin:${dirname(process.execPath)}:${process.env.PATH ?? ""}`,
		CI: "true",
		GIT_TERMINAL_PROMPT: "0"
	};
}
function runDshPluginAdd(profile, source, timeoutMs = INSTALL_TIMEOUT_MS) {
	const command = `dsh plugin --profile ${profile} add ${source}`;
	const commands = dshCommands();
	const env = spawnEnv();
	return new Promise((resolve) => {
		let output = "";
		let timedOut = false;
		const collect = (buf) => {
			output += buf.toString("utf8");
			if (output.length > MAX_OUTPUT_CHARS) output = output.slice(-2e4);
		};
		const attempt = (index) => {
			if (index >= commands.length) {
				resolve({
					ok: false,
					code: null,
					command,
					source,
					output: `dsh CLI not found (tried: ${commands.map((c) => c.label).join(", ")}). Set DSH_MP_DSH_BIN or put dsh on the PATH of the DSH process.`,
					timedOut: false
				});
				return;
			}
			const cmd = commands[index];
			let timer;
			const child = spawn(cmd.argv[0], [
				...cmd.argv.slice(1),
				"plugin",
				"--profile",
				profile,
				"add",
				source
			], {
				cwd: cmd.cwd,
				env,
				stdio: [
					"ignore",
					"pipe",
					"pipe"
				]
			});
			child.stdout?.on("data", collect);
			child.stderr?.on("data", collect);
			child.on("error", (error) => {
				if (timer) clearTimeout(timer);
				if (error.code === "ENOENT" && index < commands.length - 1) {
					child.removeAllListeners("close");
					attempt(index + 1);
					return;
				}
				resolve({
					ok: false,
					code: null,
					command,
					source,
					output: `${output}\n${String(error)}`.trim(),
					timedOut
				});
			});
			timer = setTimeout(() => {
				timedOut = true;
				child.kill("SIGKILL");
			}, timeoutMs);
			child.on("close", (code) => {
				if (timer) clearTimeout(timer);
				resolve({
					ok: code === 0 && !timedOut,
					code,
					command,
					source,
					output: output.trim(),
					timedOut
				});
			});
		};
		attempt(0);
	});
}
function mountRoutes(ctx, config = {}, runtime) {
	const apiBase = resolveApiBase(config);
	let installing = false;
	const resolveCommand = async (slug, profile) => {
		try {
			const source = installSourceFor((await fetchDetail(apiBase, slug, AbortSignal.timeout(15e3))).plugin);
			return {
				command: `dsh plugin --profile ${profile} add ${source}`,
				source
			};
		} catch {
			return null;
		}
	};
	ctx.inject(["webServer"], (sctx) => {
		sctx.effect(() => {
			const webServer = sctx.webServer;
			if (webServer === void 0) return () => {};
			const json = (res, status, body) => {
				res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
				res.end(JSON.stringify(body));
			};
			const stopHost = webServer.register({
				kind: "exact",
				path: HOST_ROUTE,
				handler: (_req, res) => {
					json(res, 200, { dsh: dshHostInfo() });
				}
			});
			const stopConfig = webServer.register({
				kind: "exact",
				path: CONFIG_ROUTE,
				handler: (_req, res) => {
					json(res, 200, { apiBase });
				}
			});
			const stopInstall = webServer.register({
				kind: "exact",
				path: INSTALL_ROUTE,
				handler: async (req, res) => {
					if (!requestAllowed(req)) {
						json(res, 403, { error: "forbidden" });
						return;
					}
					if (req.method !== "POST") {
						json(res, 405, { error: "method not allowed" });
						return;
					}
					let body = {};
					try {
						body = JSON.parse(await readBody(req) || "{}");
					} catch {
						json(res, 400, { error: "invalid JSON body" });
						return;
					}
					const slug = typeof body.slug === "string" ? body.slug : "";
					const profile = typeof body.profile === "string" && body.profile !== "" ? body.profile : "web";
					if (!SLUG_RE.test(slug)) {
						json(res, 400, { error: "invalid slug" });
						return;
					}
					if (!PROFILE_RE.test(profile)) {
						json(res, 400, { error: "invalid profile name" });
						return;
					}
					const resolved = await resolveCommand(slug, profile);
					if (resolved === null) {
						json(res, 404, { error: `plugin "${slug}" not found in the marketplace` });
						return;
					}
					if (body.dry === true) {
						json(res, 200, {
							ok: true,
							...resolved,
							dry: true,
							output: "",
							code: null,
							timedOut: false
						});
						return;
					}
					if (installing) {
						json(res, 409, { error: "another install is already in progress" });
						return;
					}
					installing = true;
					try {
						const outcome = await runDshPluginAdd(profile, resolved.source);
						logEvent(outcome.ok ? "info" : "warn", "install", `${resolved.source} → profile ${profile}: ${outcome.ok ? "ok" : `failed (code ${outcome.code}${outcome.timedOut ? ", timed out" : ""})`}`);
						json(res, 200, outcome);
					} catch (error) {
						logEvent("error", "install", String(error instanceof Error ? error.message : error));
						json(res, 500, { error: String(error instanceof Error ? error.message : error) });
					} finally {
						installing = false;
					}
				}
			});
			const stopSettings = webServer.register({
				kind: "exact",
				path: SETTINGS_ROUTE,
				handler: async (req, res) => {
					if (req.method === "GET") {
						json(res, 200, { agentTools: runtime?.agentToolsEnabled() ?? true });
						return;
					}
					if (req.method !== "POST") {
						json(res, 405, { error: "method not allowed" });
						return;
					}
					if (!requestAllowed(req)) {
						json(res, 403, { error: "forbidden" });
						return;
					}
					if (runtime === void 0) {
						json(res, 503, { error: "runtime is not available" });
						return;
					}
					let body = {};
					try {
						body = JSON.parse(await readBody(req) || "{}");
					} catch {
						json(res, 400, { error: "invalid JSON body" });
						return;
					}
					if (typeof body.agentTools !== "boolean") {
						json(res, 400, { error: "agentTools must be a boolean" });
						return;
					}
					runtime.setAgentTools(body.agentTools);
					logEvent("info", "settings", `agent tools ${body.agentTools ? "enabled" : "disabled"}`);
					json(res, 200, { agentTools: runtime.agentToolsEnabled() });
				}
			});
			const stopLogs = webServer.register({
				kind: "exact",
				path: LOGS_ROUTE,
				handler: (_req, res) => {
					res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
					res.end(exportLog());
				}
			});
			return () => {
				stopHost();
				stopConfig();
				stopInstall();
				stopSettings();
				stopLogs();
			};
		}, "dsh-plugins-mp: host routes");
	});
}
function defaults() {
	return {
		schemaVersion: 1,
		fingerprint: randomUUID(),
		agentTools: true
	};
}
function statePath(dir) {
	return join(dir, "state.json");
}
/** Load the state file, repairing anything unreadable back to defaults. */
function loadMpState(dir) {
	const fallback = defaults();
	try {
		const raw = existsSync(statePath(dir)) ? readFileSync(statePath(dir), "utf8") : null;
		if (raw === null) return fallback;
		const parsed = JSON.parse(raw);
		if (parsed.schemaVersion !== 1) return fallback;
		return {
			schemaVersion: 1,
			fingerprint: typeof parsed.fingerprint === "string" && parsed.fingerprint !== "" ? parsed.fingerprint : fallback.fingerprint,
			agentTools: parsed.agentTools !== false
		};
	} catch {
		return fallback;
	}
}
/** Persist the state atomically; the directory is created on demand. */
function saveMpState(dir, state) {
	mkdirSync(dir, { recursive: true });
	const tmp = join(dir, `.state-${process.pid}-${Date.now()}.tmp`);
	writeFileSync(tmp, `${JSON.stringify(state, null, 2)}\n`, "utf8");
	renameSync(tmp, statePath(dir));
}
//#endregion
//#region src/index.ts
/**
* dsh-plugins-mp, node half: model-facing tools over the marketplace API
* (dsh-plugins-mp.com). Registered through ctx.tools.register(defineTool)
* per the DSH tool-authoring contract; the plugin stays a thin API adapter —
* no execution, no persistence beyond its `.dsh-mp/state.json` settings.
*/
const name = "dsh-plugins-mp";
const inject = ["tools"];
/** Value object: any JSON shape we return (checked per-field at runtime by the registry). */
const OBJECT_SCHEMA = {
	type: "object",
	additionalProperties: true
};
const LANG_PARAM = {
	type: "string",
	description: "Language for human-facing text in the response.",
	enum: [
		"en",
		"zh",
		"ru"
	]
};
function compactCard(card, lang) {
	const t = labels(lang);
	return {
		slug: card.slug,
		name: card.displayName,
		author: card.authorName,
		stars: card.stars,
		downloadsPerWeek: card.npmDownloadsWeek || null,
		version: card.latestVersion,
		description: card.shortDescription,
		install: installCommandFor(card),
		authorLabel: t.by
	};
}
function localizedDescription(detail, lang) {
	const p = detail.plugin;
	if (lang === p.originalLang) return p.descriptionMd;
	const candidates = p.translations.filter((tr) => tr.kind === "description" && tr.locale === lang);
	const human = candidates.find((tr) => !tr.isMachine);
	const machine = candidates.find((tr) => tr.isMachine);
	return (human?.textMd ?? machine?.textMd) || p.descriptionMd;
}
function compatRows(detail, lang) {
	const t = labels(lang);
	return (detail.versions[0]?.testRuns ?? []).map((run) => ({
		dsh: run.dshRelease,
		status: run.status === "passed" ? t.works : run.status === "failed" || run.status === "error" ? t.installFailed : run.status === "timeout" ? t.timedOut : t.untested
	}));
}
/**
* The five model-facing tools, as one registrable unit: a single disposer
* covers them all, so the Settings toggle can add/remove the whole surface
* live (no recompose, no restart).
*/
function registerTools(ctx, apiBase) {
	const disposers = [];
	const register = (definition) => {
		disposers.push(ctx.tools.register(definition));
	};
	register(defineTool({
		name: "mp_search",
		description: `Search the DeepSeek Harness plugin marketplace (dsh-plugins-mp.com, ${DEFAULT_API_BASE}). Returns name, stars, short description and the exact install command for each match. Use when the user asks to find/discover plugins, or before installing anything.`,
		parameters: {
			query: {
				type: "string",
				description: "Free-text search over name, description, npm package name."
			},
			category: {
				type: "string",
				description: "Category slug filter (e.g. \"ui\", \"tools\", \"memory\")."
			},
			profile: {
				type: "string",
				description: "Profile filter: \"web\", \"tui\" or \"agent\".",
				enum: [
					"web",
					"tui",
					"agent"
				]
			},
			installable: {
				type: "boolean",
				description: "Only plugins that can actually be installed (have a manifest)."
			},
			sort: {
				type: "string",
				description: "Sort order.",
				enum: [
					"stars",
					"updated",
					"newest",
					"name"
				]
			},
			limit: {
				type: "number",
				description: "Results per page, 1-25 (default 12)."
			},
			page: {
				type: "number",
				description: "Page number, 1-based."
			},
			lang: LANG_PARAM
		},
		output: {
			schema: OBJECT_SCHEMA,
			render: (_args, value) => {
				const v = value;
				return [{
					type: "text",
					text: [`${v.text}`, ...v.plugins.map((p) => `• ${p.name} (${p.slug}) — ★${p.stars}${p.description ? ` — ${p.description}` : ""}\n  ${p.install}`)].join("\n")
				}];
			}
		},
		async execute(args, exec) {
			const lang = pickLang(args.lang);
			const t = labels(lang);
			const catalog = await fetchCatalog(apiBase, {
				q: args.query?.trim() || void 0,
				category: args.category,
				profile: args.profile,
				installable: args.installable,
				sort: args.sort,
				limit: args.limit,
				page: args.page
			}, exec.signal);
			return {
				total: catalog.total,
				page: catalog.page,
				plugins: catalog.items.map((card) => compactCard(card, lang)),
				text: `${t.found(catalog.total)}`
			};
		}
	}));
	register(defineTool({
		name: "mp_similar",
		description: "Plugins similar to a given marketplace plugin (semantic vector search). Give a plugin slug (mp_search returns slugs). Use to recommend alternatives.",
		parameters: {
			slug: {
				type: "string",
				required: true,
				description: "Plugin slug, e.g. \"owner--repo\"."
			},
			limit: {
				type: "number",
				description: "How many, 1-12 (default 6)."
			},
			lang: LANG_PARAM
		},
		output: {
			schema: OBJECT_SCHEMA,
			render: (_args, value) => {
				const v = value;
				if (!v.found) return [{
					type: "text",
					text: v.text
				}];
				return [{
					type: "text",
					text: [v.text, ...v.plugins.map((p) => `• ${p.name} (${p.slug}) — ★${p.stars}\n  ${p.install}`)].join("\n")
				}];
			}
		},
		async execute(args, exec) {
			const lang = pickLang(args.lang);
			const t = labels(lang);
			let detail;
			try {
				detail = await fetchDetail(apiBase, args.slug, exec.signal);
			} catch {
				return {
					found: false,
					plugins: [],
					text: t.notFound(args.slug)
				};
			}
			return {
				found: true,
				plugins: (await fetchSimilar(apiBase, args.slug, exec.signal)).items.map((card) => compactCard(card, lang)),
				text: t.similarTo(detail.plugin.displayName)
			};
		}
	}));
	register(defineTool({
		name: "mp_details",
		description: "Full marketplace info about one plugin: localized description, install command, versions, sandbox compatibility per DSH release, capabilities, tags. Give a plugin slug (mp_search returns slugs).",
		parameters: {
			slug: {
				type: "string",
				required: true,
				description: "Plugin slug, e.g. \"owner--repo\"."
			},
			lang: LANG_PARAM
		},
		output: {
			schema: OBJECT_SCHEMA,
			render: (_args, value) => {
				const v = value;
				if (!v.found) return [{
					type: "text",
					text: v.text ?? "Not found."
				}];
				const t = labels("en");
				const lines = [
					`${v.name} (${v.slug}) — ★${v.stars ?? 0}${v.downloadsPerWeek ? `, ${v.downloadsPerWeek} ${t.weeklyDownloads}` : ""}`,
					v.author ? `${t.by}: ${v.author}` : "",
					v.latestVersion ? `${t.latest}: ${v.latestVersion}` : "",
					"",
					v.description ?? "",
					"",
					`${t.runToInstall} ${v.install}`
				];
				if (v.compatibility?.length) lines.push("", `${t.compatibility}: ${v.compatibility.map((c) => `${c.dsh}: ${c.status}`).join(", ")}`);
				if (v.capabilities?.length) lines.push(`${t.capabilities}: ${v.capabilities.join(", ")}`);
				if (v.tags?.length) lines.push(`tags: ${v.tags.join(", ")}`);
				return [{
					type: "text",
					text: lines.filter((l) => l !== "").join("\n")
				}];
			}
		},
		async execute(args, exec) {
			const lang = pickLang(args.lang);
			const t = labels(lang);
			let detail;
			try {
				detail = await fetchDetail(apiBase, args.slug, exec.signal);
			} catch {
				return {
					found: false,
					text: t.notFound(args.slug)
				};
			}
			const p = detail.plugin;
			const capabilities = Object.entries(p.capabilities ?? {}).filter(([, on]) => on).map(([key]) => key);
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
				deprecated: p.deprecatedReason
			};
		}
	}));
	register(defineTool({
		name: "mp_install",
		description: "Build the install command for a marketplace plugin. Does NOT execute anything — returns the exact \"dsh plugin --profile <profile> add <source>\" command to run (e.g. with the bash tool) or to hand to the user.",
		parameters: {
			slug: {
				type: "string",
				required: true,
				description: "Plugin slug, e.g. \"owner--repo\"."
			},
			profile: {
				type: "string",
				description: "Target DSH profile (default \"web\").",
				enum: [
					"web",
					"tui",
					"agent"
				]
			},
			lang: LANG_PARAM
		},
		output: {
			schema: OBJECT_SCHEMA,
			render: (_args, value) => {
				const v = value;
				if (!v.found) return [{
					type: "text",
					text: v.text
				}];
				return [{
					type: "text",
					text: v.text
				}];
			}
		},
		async execute(args, exec) {
			const t = labels(pickLang(args.lang));
			let detail;
			try {
				detail = await fetchDetail(apiBase, args.slug, exec.signal);
			} catch {
				return {
					found: false,
					command: null,
					source: null,
					profile: args.profile ?? "web",
					text: t.notFound(args.slug)
				};
			}
			const command = installCommandFor(detail.plugin, args.profile ?? "web");
			return {
				found: true,
				command,
				source: installSourceFor(detail.plugin),
				profile: args.profile ?? "web",
				text: `${t.runToInstall}\n${command}`
			};
		}
	}));
	register(defineTool({
		name: "mp_trending",
		description: "Top marketplace plugins: by GitHub stars, by weekly npm downloads, or recently updated. Use when the user asks what is popular/trending.",
		parameters: {
			by: {
				type: "string",
				description: "Ranking metric.",
				enum: [
					"stars",
					"downloads",
					"updated"
				]
			},
			limit: {
				type: "number",
				description: "How many, 1-25 (default 10)."
			},
			lang: LANG_PARAM
		},
		output: {
			schema: OBJECT_SCHEMA,
			render: (_args, value) => {
				const v = value;
				return [{
					type: "text",
					text: [v.text, ...v.plugins.map((p, i) => `${i + 1}. ${p.name} (${p.slug}) — ★${p.stars}\n  ${p.install}`)].join("\n")
				}];
			}
		},
		async execute(args, exec) {
			const lang = pickLang(args.lang);
			const t = labels(lang);
			const by = args.by === "downloads" || args.by === "updated" ? args.by : "stars";
			let items = (await fetchCatalog(apiBase, {
				sort: by === "downloads" ? "stars" : by,
				limit: Math.min(args.limit ?? 10, 25)
			}, exec.signal)).items;
			if (by === "downloads") items = [...items].sort((a, b) => b.npmDownloadsWeek - a.npmDownloadsWeek);
			return {
				plugins: items.map((card) => compactCard(card, lang)),
				text: t.trending(by)
			};
		}
	}));
	return () => {
		for (const dispose of disposers) if (typeof dispose === "function") dispose();
		disposers.length = 0;
	};
}
function apply(ctx, config = {}) {
	const apiBase = resolveApiBase(config);
	const stateDir = resolveStateDir(config);
	const state = loadMpState(stateDir);
	let agentTools = config.agentTools ?? state.agentTools;
	let disposeTools = null;
	const applyTools = () => {
		if (agentTools && disposeTools === null) disposeTools = registerTools(ctx, apiBase);
		if (!agentTools && disposeTools !== null) {
			disposeTools();
			disposeTools = null;
		}
	};
	const runtime = {
		getState: () => state,
		updateState: (patch) => {
			Object.assign(state, patch);
			saveMpState(stateDir, state);
			return state;
		},
		stateDir: () => stateDir,
		agentToolsEnabled: () => agentTools,
		setAgentTools: (on) => {
			if (on === agentTools) return;
			agentTools = on;
			state.agentTools = on;
			saveMpState(stateDir, state);
			applyTools();
		}
	};
	if (state.agentTools !== agentTools) {
		state.agentTools = agentTools;
		saveMpState(stateDir, state);
	}
	mountRoutes(ctx, config, runtime);
	applyTools();
	logEvent("info", "boot", `applied (agent tools ${agentTools ? "on" : "off"}, profile dir ${stateDir})`);
}
//#endregion
export { apply, inject, mountRoutes, name };
