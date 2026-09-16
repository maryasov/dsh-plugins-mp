import { createRequire } from "node:module";
import { defineTool } from "@deepseek-ai/dsh-tools";
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { homedir, tmpdir } from "node:os";
import { spawn, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { request } from "node:https";
import { lookup } from "node:dns/promises";
import { connect, isIP } from "node:net";
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
//#region src/installed.ts
/**
* Profile filesystem inspection for the "My plugins" surface: what the
* profile actually has installed (package.json dependencies crossed with
* node_modules manifests), where each package came from, and whether a
* newer npm release exists. Pure reads plus one registry fetch — no
* processes, no writes.
*/
/** Template bundles DSH installs itself — never shown as community plugins. */
const INBOX_BUNDLES$1 = /* @__PURE__ */ new Set([
	"@deepseek-ai/dsh-base",
	"@deepseek-ai/dsh-web-app",
	"@deepseek-ai/dsh-headless"
]);
function classifySource(spec) {
	if (spec.startsWith("link:")) return "link";
	if (spec.startsWith("file:")) return "file";
	if (spec.startsWith("github:")) return "github";
	if (/^(git\+|https?:\/\/.+\.git)/.test(spec) || /\.git(?:#|$)/.test(spec)) return "git";
	return "npm";
}
/** Community dependencies of the profile (in-box bundles filtered out). */
function readInstalled(profileDir) {
	const manifestPath = join(profileDir, "package.json");
	if (!existsSync(manifestPath)) return [];
	let deps = {};
	try {
		deps = JSON.parse(readFileSync(manifestPath, "utf8")).dependencies ?? {};
	} catch {
		return [];
	}
	const items = [];
	for (const [name, spec] of Object.entries(deps)) {
		if (INBOX_BUNDLES$1.has(name)) continue;
		let version = null;
		let description = null;
		let hasClient = false;
		try {
			const manifest = JSON.parse(readFileSync(join(profileDir, "node_modules", ...name.split("/"), "package.json"), "utf8"));
			if (typeof manifest.version === "string") version = manifest.version;
			if (typeof manifest.description === "string") description = manifest.description;
			hasClient = manifest.dsh?.client !== void 0;
		} catch {}
		items.push({
			name,
			spec,
			source: classifySource(spec),
			version,
			description,
			hasClient
		});
	}
	return items.sort((a, b) => a.name.localeCompare(b.name));
}
/** Whether one package is actually materialized in the profile tree. */
function isPackageOnDisk(profileDir, name) {
	return existsSync(join(profileDir, "node_modules", ...name.split("/"), "package.json"));
}
const npmLatestCache = /* @__PURE__ */ new Map();
const NPM_TTL_MS = 6e5;
/** The registry's latest version of one package, cached for 10 minutes. */
async function npmLatestVersion(name, signal) {
	const cached = npmLatestCache.get(name);
	if (cached !== void 0 && Date.now() - cached.at < NPM_TTL_MS) return cached.version;
	let version = null;
	try {
		const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name).replace(/^%40/, "@")}/latest`, {
			headers: { accept: "application/json" },
			signal
		});
		if (res.ok) {
			const body = await res.json();
			if (typeof body.version === "string") version = body.version;
		}
	} catch {}
	npmLatestCache.set(name, {
		at: Date.now(),
		version
	});
	return version;
}
/**
* Package names pnpm blocked during an install — the exact "Ignored build
* scripts:" line its output prints (same parse as dsh-market's installer).
*/
function parseIgnoredBuilds(output) {
	const m = /Ignored build scripts?:?\s*([^\n]+)/i.exec(output);
	if (m === null) return [];
	return m[1].split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
}
//#endregion
//#region src/hot.ts
/**
* Restart-free installs and live toggles, adapted from dsh-market's hot.ts
* (MIT, © dsh-market contributors) and proven against DSH 0.1.6-alpha.1.
*
* A freshly installed plugin is mounted into the RUNNING composition through
* a plugin-owned Include subtree: the durable state stays with the profile's
* `dsh.profile.bundles` (reconciled by the dsh CLI at install time), so the
* next boot loads it through the normal bundle layer. The subtree exists only
* for the current process; its input files under `<profile>/.dsh-mp/` are
* wiped on every boot, so a crash can never leave a file that collides with
* the bundle layer. `state.json` in the same directory deliberately survives.
*
* 0.1.6 note: the vendored `@deepseek-ai/cordis-plugin-include` is NOT in the
* profile module fallback for link:-mounted plugins, so the class resolves
* through three candidates (bare import → harness-materialized link under
* DSH_HOME/profiles/node_modules → the running dev-checkout's vendor tree).
*/
let hotTreeClass;
async function importIncludeModule() {
	try {
		return await import(
			/* @vite-ignore */
			"@deepseek-ai/cordis-plugin-include"
);
	} catch {}
	try {
		const home = process.env.DSH_HOME !== void 0 && process.env.DSH_HOME.trim() !== "" ? process.env.DSH_HOME : join(process.env.HOME ?? "", ".dsh");
		const candidate = join(home, "profiles", "node_modules", "@deepseek-ai", "cordis-plugin-include", "lib", "index.js");
		if (existsSync(candidate)) return await import(pathToFileURL(candidate).href);
	} catch {}
	const entry = process.argv[1] ?? "";
	if (entry.includes(`apps${join("", "")}cli`)) {
		let dir = join(entry, "..");
		for (let i = 0; i < 6; i++) {
			const candidate = join(dir, "vendor", "include", "lib", "index.js");
			if (existsSync(candidate)) return await import(pathToFileURL(candidate).href);
			dir = join(dir, "..");
		}
	}
	return null;
}
async function loadHotTreeClass() {
	if (hotTreeClass !== void 0) return hotTreeClass;
	try {
		const Include = (await importIncludeModule())?.Include;
		if (typeof Include !== "function") throw new Error("no Include export");
		class MpHotTree extends Include {
			/** Runtime-only mount list; the bundle layer owns persistence. */
			write() {}
		}
		hotTreeClass = MpHotTree;
	} catch (error) {
		logEvent("warn", "hot", `include plugin unavailable: ${error instanceof Error ? error.message : String(error)}`);
		hotTreeClass = null;
	}
	return hotTreeClass;
}
/**
* Profile-scoped resolution for hot-mount rows: turn a bare package name
* into the absolute `file://` entry URL of the package installed into
* `profileDir`. Include rows reach the loader as bare names, and the loader's
* own parent-walk can never reach `profiles/<name>/node_modules` — handing
* it a file:// URL is anchor-independent.
*/
function resolveProfileEntry(profileDir, name) {
	if (!name || name.startsWith(".") || name.startsWith("cordis:") || name.startsWith("file://")) return name;
	const packageDir = join(profileDir, "node_modules", ...name.split("/"));
	try {
		return pathToFileURL(createRequire(join(profileDir, "package.json")).resolve(name)).href;
	} catch {
		for (const artifact of [
			"index.js",
			"lib/index.js",
			"dist/index.js"
		]) if (existsSync(join(packageDir, artifact))) return pathToFileURL(join(packageDir, artifact)).href;
		return name;
	}
}
/**
* Insert rows of a plugin's bundle patch, or null when the patch contains
* anything beyond plain `id`/`name` insert rows (config blocks, disables,
* expressions) — those compositions fall back to restart activation.
* (Port of dsh-market's parseSimplePatch, CRLF-safe.)
*/
function parseSimplePatch(patchText) {
	const rows = [];
	let pending = null;
	for (const raw of patchText.split(/\r?\n/)) {
		const line = raw.replace(/#.*$/, "").trimEnd();
		if (line.trim() === "") continue;
		if (/^-\s+insert:\s*$/.test(line)) continue;
		const id = /^\s+-\s+id:\s*(\S+)\s*$/.exec(line);
		if (id !== null) {
			if (pending !== null) return null;
			pending = id[1];
			continue;
		}
		const name = /^\s+name:\s*['"]?([^'"\s]+)['"]?\s*$/.exec(line);
		if (name !== null && pending !== null) {
			rows.push({
				id: pending,
				name: name[1]
			});
			pending = null;
			continue;
		}
		return null;
	}
	if (pending !== null || rows.length === 0) return null;
	return rows;
}
/** The `dsh` declaration block of an installed package, or null. */
function readPkgDsh(profileDir, packageName) {
	try {
		return JSON.parse(readFileSync(join(profileDir, "node_modules", ...packageName.split("/"), "package.json"), "utf8")).dsh ?? {};
	} catch {
		return null;
	}
}
const HOT_DIR = ".dsh-mp";
const HOT_MOUNT_TIMEOUT_MS = Number(process.env.DSH_MP_HOT_MOUNT_TIMEOUT_MS) || 1e4;
/** Wipe leftover hot-mount inputs; call once when the host routes start. */
function cleanHotDir(profileDir) {
	const dir = join(profileDir, HOT_DIR);
	let entries;
	try {
		entries = readdirSync(dir);
	} catch {
		return;
	}
	for (const name of entries) if (/^hot-\d+\.yml$/.test(name)) rmSync(join(dir, name), { force: true });
}
let hotSequence = 0;
const hotHandles = /* @__PURE__ */ new Map();
const shimNames = /* @__PURE__ */ new Set();
/** Package names currently live through one of our hot mounts. */
function listHotMounts() {
	return [...hotHandles.keys()];
}
var ActivationTimeout = class extends Error {};
function raceActivationTimeout(awaitable) {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			reject(new ActivationTimeout(`activation did not settle within ${HOT_MOUNT_TIMEOUT_MS / 1e3}s — the plugin may be waiting on a service that never arrives`));
		}, HOT_MOUNT_TIMEOUT_MS);
		Promise.resolve(awaitable).then((value) => {
			clearTimeout(timer);
			resolve(value);
		}, (error) => {
			clearTimeout(timer);
			reject(error);
		});
	});
}
/** Dispose a package hot-mounted earlier in this session. */
async function hotUnmount(packageName) {
	const handle = hotHandles.get(packageName);
	if (handle === void 0) return false;
	hotHandles.delete(packageName);
	shimNames.delete(packageName);
	try {
		await handle.dispose();
		logEvent("info", "hot-unmount", `${packageName}: removed live`);
		return true;
	} catch (error) {
		logEvent("warn", "hot-unmount", `${packageName}: dispose failed — ${error instanceof Error ? error.message : String(error)}`);
		return false;
	}
}
/**
* Mount `packageName` (just installed into the profile) into the running
* composition. Returns whether the plugin is live without a restart, plus
* the reason when it is not.
*/
async function hotMount(ctx, profileDir, packageName) {
	try {
		const HotTree = await loadHotTreeClass();
		if (HotTree === null) return {
			ok: false,
			reason: "the host cannot hot-mount (include plugin unavailable); restart required"
		};
		let patchText = null;
		try {
			patchText = readFileSync(join(profileDir, "node_modules", ...packageName.split("/"), "cordis.patch.yml"), "utf8");
		} catch {
			patchText = null;
		}
		let rows;
		if (patchText !== null) {
			const parsed = parseSimplePatch(patchText);
			if (parsed === null) return {
				ok: false,
				reason: "the bundle patch contains config/expression rows; hot-mount only supports plain inserts — it activates on restart"
			};
			rows = parsed;
		} else {
			const dsh = readPkgDsh(profileDir, packageName);
			if (dsh === null || dsh.client === void 0 || dsh.bundle !== void 0) return {
				ok: false,
				reason: "no bundle patch and no dsh.client surface — nothing to hot-mount"
			};
			shimNames.add(packageName);
			rows = [{
				id: `client-${packageName.replace(/[^A-Za-z0-9_.-]/g, "-")}`,
				name: packageName
			}];
		}
		const dir = join(profileDir, HOT_DIR);
		mkdirSync(dir, {
			recursive: true,
			mode: 448
		});
		hotSequence += 1;
		const file = join(dir, `hot-${String(hotSequence)}.yml`);
		const yml = rows.map((row) => `- id: 'mp-${row.id}'\n  name: '${resolveProfileEntry(profileDir, row.name)}'\n`).join("");
		writeFileSync(file, yml);
		const handle = ctx.plugin(HotTree, { path: pathToFileURL(file).href });
		try {
			await raceActivationTimeout(handle.await());
		} catch (error) {
			try {
				Promise.resolve(handle.dispose()).catch(() => {});
			} catch {}
			try {
				rmSync(file, { force: true });
			} catch {}
			throw error;
		}
		hotHandles.set(packageName, handle);
		ctx.logger?.info?.(`[dsh-plugins-mp] hot-mounted ${packageName}`);
		logEvent("info", "hot-mount", `${packageName}: live${shimNames.has(packageName) ? " (client-only shim)" : ""}`);
		return {
			ok: true,
			reason: null
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		logEvent("warn", "hot-mount", `${packageName}: fell back to restart — ${message}`);
		return {
			ok: false,
			reason: `hot-mount failed — restart required: ${message}`
		};
	}
}
/**
* Row ids and package names the USER's own patch layer (cordis.patch.yml)
* already manages. Line-wise scan on purpose: the file may hold structures
* beyond plain rows, but any mention of a row id or package name is enough.
*/
function readUserPatchControls(profileDir) {
	const ids = /* @__PURE__ */ new Set();
	const names = /* @__PURE__ */ new Set();
	try {
		const text = readFileSync(join(profileDir, "cordis.patch.yml"), "utf8");
		let inManagedBlock = false;
		for (const line of text.split(/\r?\n/)) {
			const trimmed = line.trim();
			if (trimmed.startsWith("# >>> dsh-mp disable ")) {
				inManagedBlock = true;
				continue;
			}
			if (trimmed.startsWith("# <<< dsh-mp disable ")) {
				inManagedBlock = false;
				continue;
			}
			if (inManagedBlock) continue;
			const id = /^\s*-?\s*id:\s*['"]?([A-Za-z0-9._/@-]+)/.exec(line);
			if (id !== null) ids.add(id[1]);
			const name = /^\s*name:\s*['"]?([^'"\s]+)/.exec(line);
			if (name !== null) names.add(name[1]);
		}
	} catch {}
	return {
		ids,
		names
	};
}
/** The plugin-manager row-id convention for one package name. */
function rowIdFor(name) {
	return name.replace(/^@/, "").replace(/[^a-z0-9-]/gi, "-").toLowerCase();
}
function patchLayerManages(controls, name) {
	return controls.ids.has(rowIdFor(name)) || controls.names.has(name);
}
//#endregion
//#region src/snapshot.ts
/**
* Profile snapshots: before any ordering / uninstall / update / disable
* change is applied, the composition-critical files are captured as a
* timestamped snapshot; a failed or unwanted change can be rolled back in
* one step. Kept under `<profile>/.dsh-mp/snapshots/<id>/`, newest kept
* (MAX_SNAPSHOTS), never leaving the machine.
*/
const SNAPSHOT_DIR = join(".dsh-mp", "snapshots");
const FILES = [
	"cordis.patch.yml",
	"package.json",
	"pnpm-workspace.yaml",
	"pnpm-lock.yaml"
];
function snapshotRoot(profileDir) {
	return join(profileDir, SNAPSHOT_DIR);
}
/** Capture the composition-critical files; id = millisecond timestamp. */
function snapshotCreate(profileDir, reason) {
	try {
		const id = String(Date.now());
		const target = join(snapshotRoot(profileDir), id);
		let copied = 0;
		for (const file of FILES) {
			const source = join(profileDir, file);
			if (!existsSync(source)) continue;
			mkdirSync(target, { recursive: true });
			cpSync(source, join(target, file));
			copied++;
		}
		if (copied === 0) return null;
		mkdirSync(target, { recursive: true });
		writeReason(target, reason);
		prune(profileDir);
		logEvent("info", "snapshot", `${id} (${reason}): ${copied} file(s)`);
		return id;
	} catch (error) {
		logEvent("warn", "snapshot", `failed: ${error instanceof Error ? error.message : String(error)}`);
		return null;
	}
}
function writeReason(target, reason) {
	writeFileSync(join(target, "reason.txt"), `${reason}\n`, "utf8");
}
function prune(profileDir) {
	const root = snapshotRoot(profileDir);
	let entries;
	try {
		entries = readdirSync(root).filter((name) => /^\d+$/.test(name)).sort();
	} catch {
		return;
	}
	while (entries.length > 5) {
		const oldest = entries.shift();
		if (oldest !== void 0) rmSync(join(root, oldest), {
			recursive: true,
			force: true
		});
	}
}
/** All snapshots, oldest first. */
function snapshotList(profileDir) {
	const root = snapshotRoot(profileDir);
	let entries;
	try {
		entries = readdirSync(root).filter((name) => /^\d+$/.test(name)).sort();
	} catch {
		return [];
	}
	return entries.map((id) => {
		const dir = join(root, id);
		return {
			id,
			files: readdirSync(dir).filter((name) => FILES.includes(name))
		};
	});
}
/** Restore one snapshot, first taking a safety snapshot of the current state. */
function snapshotRestore(profileDir, id) {
	const dir = join(snapshotRoot(profileDir), id);
	if (!existsSync(dir) || !/^\d+$/.test(id)) return {
		ok: false,
		error: "no such snapshot"
	};
	snapshotCreate(profileDir, `safety before restore ${id}`);
	try {
		for (const file of readdirSync(dir)) {
			if (!FILES.includes(file)) continue;
			cpSync(join(dir, file), join(profileDir, file));
		}
		logEvent("info", "snapshot", `restored ${id}`);
		return { ok: true };
	} catch (error) {
		return {
			ok: false,
			error: error instanceof Error ? error.message : String(error)
		};
	}
}
//#endregion
//#region src/toggle.ts
/**
* Live plugin disable/enable: the toggle keeps its durable choice as a
* marker-delimited row in the profile's `cordis.patch.yml` — the loader's
* user-patch watcher recomposes within ~1s, and the choice is re-applied on
* every boot. Plugins live through one of our hot mounts toggle instantly
* via dispose/re-mount instead; the patch row then decides the NEXT boot.
*
* Every row we write sits inside `# >>> dsh-mp <rowId>` / `# <<< dsh-mp
* <rowId>` comment markers, so enable = deleting exactly our lines and a
* hand-edited file is never made worse (structure elsewhere is untouched).
*/
function blockFor(rowId) {
	return [
		`# >>> dsh-mp disable ${rowId} (managed — toggle in Settings → Маркетплейс)`,
		`- id: ${rowId}`,
		`  disabled: true`,
		`# <<< dsh-mp disable ${rowId}`,
		""
	].join("\n");
}
function blockRange(lines, rowId) {
	const begin = `# >>> dsh-mp disable ${rowId}`;
	const end = `# <<< dsh-mp disable ${rowId}`;
	const start = lines.findIndex((line) => line.trim().startsWith(begin));
	if (start === -1) return null;
	const stop = lines.findIndex((line, i) => i > start && line.trim() === end);
	if (stop === -1) return null;
	return {
		start,
		end: stop
	};
}
/** Whether a managed disable row currently exists for the row id. */
function isDisabledByPatch(profileDir, name) {
	const file = join(profileDir, "cordis.patch.yml");
	if (!existsSync(file)) return false;
	return readFileSync(file, "utf8").includes(`# >>> dsh-mp disable ${rowIdFor(name)}`);
}
/**
* Write or remove the managed disable row. Returns false when the user
* patch already manages the row id itself (an insert or a hand-written
* disable) — we refuse to fight it and the caller reports the conflict.
*/
function setPatchDisabled(profileDir, name, disable) {
	const rowId = rowIdFor(name);
	const file = join(profileDir, "cordis.patch.yml");
	const lines = existsSync(file) ? readFileSync(file, "utf8").split("\n") : [];
	const existing = blockRange(lines, rowId);
	if (disable) {
		const userControls = /^-\s*id:\s*(?:['"]?)/;
		if (lines.some((line, i) => userControls.test(line) && line.includes(rowId) && (existing === null || i < existing.start || i > existing.end))) return {
			ok: false,
			conflict: true
		};
		if (existing !== null) return { ok: true };
		if (lines.length > 0 && lines[lines.length - 1] !== "") lines.push("");
		lines.push(...blockFor(rowId).split("\n"));
	} else {
		if (existing === null) return { ok: true };
		lines.splice(existing.start, existing.end - existing.start + 1);
	}
	writeFileSync(file, lines.join("\n"), "utf8");
	logEvent("info", "toggle", `${name}: ${disable ? "disabled" : "enabled"} via patch row (${file})`);
	return { ok: true };
}
//#endregion
//#region src/restart.ts
/**
* Self-restart so pending (non-hot) plugin changes take effect without the
* user leaving the UI — with the two failure modes dsh-market taught us:
*
* 1. Under systemd, killing the process from inside is fatal to the unit
*    (the cgroup kill takes the replacement down with it). When the host IS
*    a unit's main process we hand off to `systemctl --user restart` instead.
* 2. Under a plain terminal launch, the successor must be detached (setsid)
*    and must WAIT for the old process to exit before exec'ing the exact
*    same invocation — racing the old process for the port is the "restart
*    always errors" bug the user hit with dsh-market.
*
* The UI never waits in-process either way: it polls `GET /status` until
* `pid` (and the boot id) changes.
*/
/** Read the cgroup line to find the owning unit, e.g. `dsh-web.service`. */
function systemdUnit() {
	try {
		const scoped = [...readFileSync("/proc/self/cgroup", "utf8").matchAll(/([\w@.-]+\.service)/g)].map((m) => m[1]).filter((unit) => !/^user@\d+\.service$/.test(unit));
		return scoped[scoped.length - 1] ?? null;
	} catch {
		return null;
	}
}
/**
* Whether THIS process is the systemd unit's own main process. INVOCATION_ID
* alone is not enough: every descendant of a unit inherits it (an ordinary
* terminal included). We additionally require the unit's MainPID to equal
* our pid — only then may a restart be handed to systemctl.
*/
function detectSystemd() {
	const invocation = process.env.INVOCATION_ID;
	const unit = systemdUnit();
	if (invocation === void 0 || unit === null) return {
		unit: null,
		isMain: false
	};
	try {
		const result = spawnSync("systemctl", [
			"--user",
			"show",
			unit,
			"-p",
			"MainPID",
			"--value"
		], {
			encoding: "utf8",
			timeout: 5e3
		});
		const mainPid = Number.parseInt((result.stdout ?? "").trim(), 10);
		if (!Number.isInteger(mainPid) || mainPid <= 0) return {
			unit,
			isMain: false
		};
		let current = process.pid;
		for (let depth = 0; current !== null && depth < 12; depth++) {
			if (current === mainPid) return {
				unit,
				isMain: true
			};
			const status = readFileSync(`/proc/${String(current)}/status`, "utf8");
			const m = /^PPid:\s+(\d+)/m.exec(status);
			current = m !== null ? Number(m[1]) : null;
		}
		return {
			unit,
			isMain: false
		};
	} catch {
		return {
			unit,
			isMain: false
		};
	}
}
/**
* Trigger the restart. Returns AFTER the trigger is armed, never after the
* host actually goes down.
*/
function triggerRestart(profileDir) {
	const { unit, isMain } = detectSystemd();
	if (unit !== null && isMain) {
		const child = spawn("systemctl", [
			"--user",
			"restart",
			unit
		], {
			detached: true,
			stdio: "ignore"
		});
		child.unref();
		logEvent("info", "restart", `handed off to systemctl --user restart ${unit} (pid ${child.pid})`);
		return {
			mode: "systemd",
			detail: `systemctl --user restart ${unit}`
		};
	}
	const script = [
		"#!/bin/sh",
		"# dsh-plugins-mp restart successor: waits for the old process, then",
		"# re-execs the exact DSH invocation. Armed by the market UI.",
		`OLD_PID=${String(process.pid)}`,
		`while [ -d /proc/$OLD_PID ]; do sleep 0.3; done`,
		`cd ${JSON.stringify(process.cwd())}`,
		`exec ${JSON.stringify(process.execPath)} ${process.execArgv.map((a) => JSON.stringify(a)).join(" ")} ${JSON.stringify(process.argv[1] ?? "")} ${process.argv.slice(2).map((a) => JSON.stringify(a)).join(" ")}`,
		""
	].join("\n");
	const file = join(profileDir, ".dsh-mp", "restart-successor.sh");
	writeFileSync(file, script, { mode: 493 });
	const child = spawn("setsid", ["sh", file], {
		detached: true,
		stdio: "ignore",
		env: process.env
	});
	child.unref();
	logEvent("info", "restart", `successor script armed (pid ${child.pid}) — exiting now`);
	return {
		mode: "successor",
		detail: file
	};
}
/** Best-effort liveness fingerprint for the UI's poll-until-changed loop. */
function statusFingerprint() {
	const { unit } = detectSystemd();
	return {
		pid: process.pid,
		boot: process.env.INVOCATION_ID ?? `${process.pid}-${Math.floor(process.uptime() * 1e3)}`,
		systemd: unit
	};
}
/** Whether the successor script is still armed but has not fired (stale). */
function successorPending(profileDir) {
	return existsSync(join(profileDir, ".dsh-mp", "restart-successor.sh"));
}
//#endregion
//#region src/workspace-yaml.ts
/**
* One targeted, line-based edit of the profile's `pnpm-workspace.yaml`:
* adding entries to the `allowBuilds` map pnpm ≥10 consults before running
* dependency build scripts. The file is otherwise owned by pnpm and the dsh
* CLI — this module never rewrites anything beyond appending
* `<pkg>: true` lines under the existing (or freshly appended) key.
*/
/**
* Merge packages into the allowBuilds map.
* @returns the added names; a name already allowed (or already present in
* the text) is skipped.
*/
function allowBuildsAdd(profileDir, packages) {
	const file = join(profileDir, "pnpm-workspace.yaml");
	const original = existsSync(file) ? readFileSync(file, "utf8") : "";
	const lines = original.split("\n");
	const added = [];
	const hasEntry = (name) => lines.some((line) => line.trimEnd() === `  ${name}: true`) || new RegExp(`^\\s+${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:`).test(original);
	const keyIndex = lines.findIndex((line) => /^allowBuilds:\s*$/.test(line));
	if (keyIndex === -1) {
		if (lines.length > 0 && lines[lines.length - 1] !== "") lines.push("");
		lines.push("allowBuilds:");
		for (const name of packages) if (!hasEntry(name)) {
			lines.push(`  ${name}: true`);
			added.push(name);
		}
	} else {
		let insertAt = keyIndex + 1;
		while (insertAt < lines.length && (lines[insertAt].startsWith(" ") || lines[insertAt].trim() === "")) insertAt++;
		for (const name of packages) {
			if (hasEntry(name)) continue;
			lines.splice(insertAt, 0, `  ${name}: true`);
			insertAt++;
			added.push(name);
		}
	}
	if (added.length > 0) {
		mkdirGuard(profileDir);
		writeFileSync(file, lines.join("\n"), "utf8");
	}
	return {
		added,
		file
	};
}
function mkdirGuard(dir) {
	if (!existsSync(dir)) throw new Error(`profile directory does not exist: ${dir}`);
}
const MAX_NOTES = 200;
const MAX_NOTE_CHARS = 2e3;
const MAX_GROUPS = 20;
const MAX_GROUP_MEMBERS = 50;
const GROUP_NAME_RE = /^[\p{L}\p{N}][\p{L}\p{N} ._-]{0,39}$/u;
const isValidGroupName = (name) => GROUP_NAME_RE.test(name);
function sanitizeNotes(value) {
	if (typeof value !== "object" || value === null) return {};
	const out = {};
	for (const [slug, text] of Object.entries(value)) {
		if (typeof slug !== "string" || slug.length === 0 || slug.length > 200) continue;
		if (typeof text !== "string" || text.trim() === "") continue;
		if (Object.keys(out).length >= MAX_NOTES) break;
		out[slug] = text.slice(0, MAX_NOTE_CHARS);
	}
	return out;
}
function sanitizeTheme(value) {
	if (typeof value !== "object" || value === null) return null;
	const rec = value;
	if (typeof rec.slug !== "string" || rec.slug === "" || typeof rec.name !== "string" || rec.name === "") return null;
	return {
		slug: rec.slug,
		name: rec.name
	};
}
function sanitizeGroups(value) {
	if (!Array.isArray(value)) return [];
	const out = [];
	const seen = /* @__PURE__ */ new Set();
	for (const entry of value) {
		if (typeof entry !== "object" || entry === null) continue;
		const rec = entry;
		if (typeof rec.name !== "string" || !GROUP_NAME_RE.test(rec.name)) continue;
		const key = rec.name.toLowerCase();
		if (seen.has(key) || out.length >= MAX_GROUPS) continue;
		seen.add(key);
		const members = Array.isArray(rec.members) ? [...new Set(rec.members.filter((m) => typeof m === "string" && PACKAGE_NAME_RE.test(m)))].slice(0, MAX_GROUP_MEMBERS) : [];
		out.push({
			name: rec.name,
			members
		});
	}
	return out;
}
const PACKAGE_NAME_RE = /^(?:@[a-z0-9-]+\/)?[a-z0-9][a-z0-9._-]{0,119}$/;
function sanitizeSync(value) {
	const rec = value !== null && typeof value === "object" && !Array.isArray(value) ? value : {};
	return {
		gistId: typeof rec.gistId === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(rec.gistId) ? rec.gistId : null,
		lastAt: typeof rec.lastAt === "string" && !Number.isNaN(Date.parse(rec.lastAt)) ? rec.lastAt : null
	};
}
function defaults() {
	return {
		schemaVersion: 1,
		fingerprint: randomUUID(),
		agentTools: true,
		favorites: [],
		notes: {},
		theme: null,
		groups: [],
		sync: {
			gistId: null,
			lastAt: null
		}
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
			agentTools: parsed.agentTools !== false,
			favorites: Array.isArray(parsed.favorites) ? parsed.favorites.filter((x) => typeof x === "string" && x.length > 0 && x.length <= 200).slice(0, 500) : [],
			notes: sanitizeNotes(parsed.notes),
			theme: sanitizeTheme(parsed.theme),
			groups: sanitizeGroups(parsed.groups),
			sync: sanitizeSync(parsed.sync)
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
//#region src/order.ts
/**
* Community bundle ordering — parity plan #16 (dsh-market issue #98).
* The user reorders the community bundles of the profile's layer stack;
* official in-box bundles keep their exact positions and are never moved,
* added, removed or duplicated by a reorder.
*
* Ported from dsh-market (MIT) src/order.ts — same manifest contract
* (`dsh.profile.bundles` in the profile package.json, `dsh.bundle.order`
* before/after rules in each bundle's own manifest). Adapted: single-language
* errors, the dsh install anchor comes from dshHostInfo(), and the boot
* trial itself is NOT here — the routes run the real `dsh --dump-config`
* against the candidate and roll back on failure.
*/
/** Profile bundles that ship with the dsh host and must stay put. */
const INBOX_BUNDLES = /* @__PURE__ */ new Set([
	"@deepseek-ai/dsh-base",
	"@deepseek-ai/dsh-web-app",
	"@deepseek-ai/dsh-headless"
]);
/** Atomic same-directory replace: a crash mid-write can never truncate the manifest. */
function writeFileAtomic(file, content) {
	const temp = `${file}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
	writeFileSync(temp, content);
	renameSync(temp, file);
}
/** Read the profile's bundle stack (empty when the manifest is unreadable). */
function readBundleStack(profileDir) {
	try {
		const manifest = JSON.parse(readFileSync(join(profileDir, "package.json"), "utf8"));
		const bundles = Array.isArray(manifest.dsh?.profile?.bundles) ? manifest.dsh.profile.bundles.filter((name) => typeof name === "string") : [];
		return {
			bundles,
			community: bundles.filter((name) => !INBOX_BUNDLES.has(name))
		};
	} catch {
		return {
			bundles: [],
			community: []
		};
	}
}
/**
* Resolve a bundle's package.json the way the boot does: the dsh installation
* anchor first (in-box bundles live there, never in the profile), then Node's
* module search from the profile directory (covers pnpm workspace-root
* hoisting). Best-effort — unreadable bundles contribute no rules.
*/
function resolveBundlePackageJson(profileDir, name) {
	const installDir = dshHostInfo()?.directory ?? null;
	const anchors = [installDir !== null ? join(installDir, "package.json") : null, join(profileDir, "package.json")];
	for (const anchor of anchors) {
		if (anchor === null) continue;
		let paths = [];
		try {
			paths = createRequire(anchor).resolve.paths(name) ?? [];
		} catch {
			continue;
		}
		for (const searchPath of paths) {
			const candidate = join(searchPath, name);
			if (existsSync(join(candidate, "package.json"))) return join(candidate, "package.json");
		}
	}
	return null;
}
/**
* Each bundle's declared ordering rules (`dsh.bundle.order.{before,after}` —
* lists of bundle package names). Unresolvable packages and missing
* declarations contribute nothing.
*/
function readBundleRules(profileDir) {
	const { bundles } = readBundleStack(profileDir);
	const rules = [];
	for (const name of bundles) {
		const packageJson = resolveBundlePackageJson(profileDir, name);
		if (packageJson === null) continue;
		try {
			const order = JSON.parse(readFileSync(packageJson, "utf8")).dsh?.bundle?.order;
			if (order === null || typeof order !== "object" || Array.isArray(order)) continue;
			const listOf = (value) => Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
			const rule = {
				name,
				after: listOf(order.after),
				before: listOf(order.before)
			};
			if (rule.after.length > 0 || rule.before.length > 0) rules.push(rule);
		} catch {}
	}
	return rules;
}
/**
* Check a bundle order against the declared before/after rules. Rules naming
* bundles outside `order` are ignored (a rule for a not-yet-installed bundle
* must not block the current stack). Returns every violated rule; [] when all hold.
*/
function validateOrder(bundleNames, rules) {
	const position = new Map(bundleNames.map((name, index) => [name, index]));
	const conflicts = [];
	for (const rule of rules) {
		const pos = position.get(rule.name);
		if (pos === void 0) continue;
		for (const other of rule.after) {
			const otherPos = position.get(other);
			if (otherPos === void 0) continue;
			if (otherPos >= pos) conflicts.push({
				name: rule.name,
				reason: `must load after ${other} (position ${otherPos} ≥ ${pos})`
			});
		}
		for (const other of rule.before) {
			const otherPos = position.get(other);
			if (otherPos === void 0) continue;
			if (otherPos <= pos) conflicts.push({
				name: rule.name,
				reason: `must load before ${other} (position ${otherPos} ≤ ${pos})`
			});
		}
	}
	return conflicts;
}
/**
* Merge a community-bundle permutation into the full stack. In-box bundles
* keep their EXACT positions; community slots are replaced by `newOrder` in
* order of appearance. Pure — nothing is written. Rejects duplicates,
* additions, omissions and official names.
*/
function mergeOrder(bundles, newOrder) {
	const communitySet = new Set(bundles.filter((name) => !INBOX_BUNDLES.has(name)));
	if (new Set(newOrder).size !== newOrder.length) return {
		ok: false,
		error: "duplicate bundle names in the new order"
	};
	if (newOrder.length !== communitySet.size) return {
		ok: false,
		error: "the new order must contain exactly the current community bundles"
	};
	for (const name of newOrder) if (!communitySet.has(name)) return {
		ok: false,
		error: `${name} is not a reorderable community bundle`
	};
	const merged = [...bundles];
	let cursor = 0;
	for (let index = 0; index < merged.length; index += 1) {
		const name = merged[index];
		if (name === void 0 || INBOX_BUNDLES.has(name)) continue;
		merged[index] = newOrder[cursor];
		cursor += 1;
	}
	return {
		ok: true,
		bundles: merged
	};
}
/**
* Apply a new community-bundle order to the profile manifest. On any failure
* the manifest is left untouched. The caller owns the boot trial and rollback.
*/
function applyBundleOrder(profileDir, newOrder) {
	const { bundles } = readBundleStack(profileDir);
	const merged = mergeOrder(bundles, newOrder);
	if (!merged.ok) return merged;
	try {
		const manifestPath = join(profileDir, "package.json");
		const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
		manifest.dsh ??= {};
		manifest.dsh.profile ??= {};
		manifest.dsh.profile.bundles = merged.bundles;
		writeFileAtomic(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
		return merged;
	} catch (error) {
		return {
			ok: false,
			error: error instanceof Error ? error.message : String(error)
		};
	}
}
//#endregion
//#region src/backup.ts
/**
* Portable profile backups: configuration only, never installed packages.
* Format-compatible with dsh-market's `dsh-profile-backup` v0.2, so backups
* restore across both plugins.
*
* The profile directory is plain user data — aside from package.json it can
* hold API keys, tokens, or provider passwords. The export therefore carries
* a credential-warning disclaimer in the UI, and restore is a MERGE: current
* dependencies stay, backup specs win on name conflicts, bundle lists are
* unioned — a restore never deletes plugins the target machine already has.
*
* Ported from dsh-market (MIT) src/backup.ts; adapted: `.dsh-mp/state.json`
* (favorites/notes/groups/theme) is carried and merged field-wise, snapshot
* and hot-mount scratch files are excluded, and the WebDAV/Gist transport
* lives elsewhere (plan #12).
*/
const BACKUP_FORMAT = "dsh-profile-backup";
const BACKUP_VERSION = .2;
const MAX_FILES = 256;
const SKIP_NAMES = /* @__PURE__ */ new Set([
	"node_modules",
	".dsh-market",
	".git",
	"pnpm-lock.yaml"
]);
function profileFiles(root, dir = root) {
	const files = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		if (SKIP_NAMES.has(entry.name) || /\.bak\b/.test(entry.name)) continue;
		const path = resolve(dir, entry.name);
		if (entry.isSymbolicLink()) continue;
		if (entry.isDirectory()) files.push(...profileFiles(root, path));
		else if (entry.isFile()) files.push(relative(root, path).split(sep).join("/"));
		if (files.length > MAX_FILES) throw new Error(`profile has more than ${MAX_FILES} configuration files`);
	}
	return files;
}
/**
* Files that travel in a backup: the whole config surface except dependency
* state, market cache, snapshots and hot-mount scratch inputs. Our
* `.dsh-mp/state.json` (favorites/notes/groups/theme) is included.
*/
function backupableFiles(root) {
	return profileFiles(root).filter((path) => {
		if (path === "package.json") return true;
		if (!path.startsWith(".dsh-mp/")) return true;
		return path === ".dsh-mp/state.json";
	});
}
/** Serialize the profile configuration into one portable JSON file. */
function createProfileBackup(profileDir, profileName) {
	const manifestFile = resolve(profileDir, "package.json");
	if (!existsSync(manifestFile)) throw new Error("profile package.json is missing");
	const files = backupableFiles(profileDir).sort().map((path) => {
		const content = readFileSync(resolve(profileDir, path), "utf8");
		return path === "package.json" ? {
			path,
			json: JSON.parse(content)
		} : {
			path,
			lines: content.split(/\r?\n/)
		};
	});
	if (!files.some((file) => file.path === "package.json")) throw new Error("profile package.json is missing");
	const backup = {
		format: BACKUP_FORMAT,
		version: BACKUP_VERSION,
		createdAt: (/* @__PURE__ */ new Date()).toISOString(),
		profile: profileName,
		files
	};
	if (Buffer.byteLength(JSON.stringify(backup)) > 2097152) throw new Error("profile configuration is too large to back up");
	return backup;
}
function validatedBackup(value) {
	if (value === null || typeof value !== "object") throw new Error("invalid backup");
	const backup = value;
	if (backup.format !== "dsh-profile-backup" || backup.version !== .2 || !Array.isArray(backup.files)) throw new Error("unsupported backup format");
	if (backup.files.length > MAX_FILES) throw new Error("invalid backup contents");
	const files = [];
	const paths = /* @__PURE__ */ new Set();
	for (const entry of backup.files) {
		if (entry === null || typeof entry !== "object") throw new Error("invalid backup contents");
		const file = entry;
		const path = file.path;
		if (typeof path !== "string") throw new Error("invalid backup contents");
		if (path === "" || isAbsolute(path) || path.split(/[\\/]/).includes("..")) throw new Error(`unsafe backup path: ${path}`);
		const normalized = path.replaceAll("\\", "/");
		if (normalized.split("/").some((part) => SKIP_NAMES.has(part))) throw new Error(`excluded backup path: ${path}`);
		if (paths.has(normalized)) throw new Error(`duplicate backup path: ${path}`);
		paths.add(normalized);
		if (path === "package.json") {
			if (file.json === null || typeof file.json !== "object" || Array.isArray(file.json)) throw new Error("backup package.json is invalid");
			files.push({
				path,
				json: file.json
			});
		} else {
			if (!Array.isArray(file.lines) || !file.lines.every((line) => typeof line === "string")) throw new Error(`invalid file content: ${path}`);
			files.push({
				path,
				lines: file.lines
			});
		}
	}
	if (!files.some((file) => file.path === "package.json")) throw new Error("invalid backup contents");
	if (Buffer.byteLength(JSON.stringify(backup)) > 2097152) throw new Error("backup is too large");
	return {
		...backup,
		files
	};
}
/**
* Atomically write the backup's files over the profile and return a rollback
* restoring every touched path. The caller owns the merge decision — pass the
* MERGED manifest in `backup.packageJson` to get merge semantics.
*/
function restoreProfileBackup(profileDir, backup, packageJson) {
	const root = resolve(profileDir);
	const previous = /* @__PURE__ */ new Map();
	mkdirSync(root, { recursive: true });
	const rollback = () => {
		for (const [target, content] of previous) if (content === null) rmSync(target, { force: true });
		else writeFileSync(target, content);
	};
	try {
		for (const file of backup.files) {
			const { path } = file;
			const target = resolve(root, path);
			if (!target.startsWith(root + sep)) throw new Error(`unsafe backup path: ${path}`);
			ensureSafeParent(root, dirname(target), path);
			if (existsSync(target) && !lstatSync(target).isFile()) throw new Error(`backup path is not a file: ${path}`);
			previous.set(target, existsSync(target) ? readFileSync(target) : null);
			const content = path === "package.json" ? `${JSON.stringify(packageJson, null, 2)}\n` : `${file.lines.join("\n")}`;
			const temp = `${target}.dsh-restore-${String(process.pid)}`;
			writeFileSync(temp, content, "utf8");
			renameSync(temp, target);
		}
	} catch (error) {
		rollback();
		throw error;
	}
	return {
		files: previous.size,
		rollback
	};
}
/** Create missing parents one level at a time and refuse existing symlinks. */
function ensureSafeParent(root, parent, backupPath) {
	const relativeParent = relative(root, parent);
	if (relativeParent === "") return;
	let current = root;
	for (const part of relativeParent.split(sep)) {
		current = resolve(current, part);
		if (!existsSync(current)) {
			mkdirSync(current);
			continue;
		}
		const stat = lstatSync(current);
		if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error(`unsafe backup path: ${backupPath}`);
	}
}
/**
* Dependencies whose spec points at an absolute local path (`link:/Users/…`,
* `file:/home/…`): valid on the source machine, meaningless elsewhere.
* Reported, NOT rewritten — naming them lets the operator decide.
*/
function unportableDeps(dependencies) {
	if (dependencies === null || typeof dependencies !== "object" || Array.isArray(dependencies)) return [];
	const found = [];
	for (const [name, raw] of Object.entries(dependencies)) {
		if (typeof raw !== "string") continue;
		const match = /^(?:link|file):(.+)$/i.exec(raw);
		if (match === null) continue;
		let path = match[1];
		try {
			path = decodeURIComponent(path);
		} catch {}
		if (/^\//.test(path) || /^[A-Za-z]:[\\/]/.test(path) || /^\\\\/.test(path)) found.push({
			name,
			spec: raw
		});
	}
	return found;
}
/**
* Merge the backup's manifest into the current one: current deps stay, backup
* specs win on name conflicts, bundle lists are unioned (de-duplicated).
* Everything else in the manifest comes from the CURRENT profile.
*/
function mergeRestoreManifest(backupManifest, current) {
	const manifest = { ...current };
	const backupDeps = backupManifest.dependencies !== null && typeof backupManifest.dependencies === "object" && !Array.isArray(backupManifest.dependencies) ? backupManifest.dependencies : {};
	manifest.dependencies = {
		...current.dependencies !== null && typeof current.dependencies === "object" && !Array.isArray(current.dependencies) ? current.dependencies : {},
		...backupDeps
	};
	const backupBundles = Array.isArray(backupManifest.dsh?.profile?.bundles) ? backupManifest.dsh.profile.bundles : [];
	const currentBundles = Array.isArray(current.dsh?.profile?.bundles) ? current.dsh.profile.bundles : [];
	const bundles = /* @__PURE__ */ new Set();
	for (const name of currentBundles) if (typeof name === "string") bundles.add(name);
	for (const name of backupBundles) if (typeof name === "string") bundles.add(name);
	const currentDsh = current.dsh !== null && typeof current.dsh === "object" && !Array.isArray(current.dsh) ? current.dsh : {};
	manifest.dsh = {
		...currentDsh,
		profile: {
			...currentDsh.profile ?? {},
			bundles: [...bundles]
		}
	};
	return manifest;
}
/**
* Field-wise merge of the carried `.dsh-mp/state.json`: the CURRENT
* fingerprint (telemetry identity) and agentTools always stay; favorites are
* unioned; notes merge with backup winning per slug; groups merge by name
* with member union; theme fills only an empty slot.
*/
function mergeRestoreState(currentRaw, backupRaw) {
	const current = safeParse(currentRaw) ?? { schemaVersion: 1 };
	const backup = safeParse(backupRaw) ?? {};
	const currentRec = current;
	const backupRec = backup;
	const favorites = new Set(Array.isArray(currentRec.favorites) ? currentRec.favorites.filter((x) => typeof x === "string") : []);
	for (const x of Array.isArray(backupRec.favorites) ? backupRec.favorites : []) if (typeof x === "string") favorites.add(x);
	const notes = currentRec.notes !== null && typeof currentRec.notes === "object" && !Array.isArray(currentRec.notes) ? { ...currentRec.notes } : {};
	const backupNotes = backupRec.notes !== null && typeof backupRec.notes === "object" && !Array.isArray(backupRec.notes) ? backupRec.notes : {};
	for (const [slug, text] of Object.entries(backupNotes)) notes[slug] = text;
	const groups = /* @__PURE__ */ new Map();
	const addGroup = (list) => {
		for (const entry of Array.isArray(list) ? list : []) {
			if (entry === null || typeof entry !== "object") continue;
			const rec = entry;
			if (typeof rec.name !== "string" || !Array.isArray(rec.members)) continue;
			const members = rec.members.filter((m) => typeof m === "string");
			const existing = groups.get(rec.name.toLowerCase());
			if (existing === void 0) groups.set(rec.name.toLowerCase(), {
				name: rec.name,
				members
			});
			else for (const m of members) if (!existing.members.includes(m)) existing.members.push(m);
		}
	};
	addGroup(currentRec.groups);
	addGroup(backupRec.groups);
	const merged = {
		...currentRec,
		schemaVersion: 1,
		fingerprint: typeof currentRec.fingerprint === "string" && currentRec.fingerprint !== "" ? currentRec.fingerprint : backupRec.fingerprint,
		favorites: [...favorites],
		notes,
		groups: [...groups.values()],
		theme: currentRec.theme ?? backupRec.theme ?? null
	};
	return JSON.stringify(sanitizeStateJson(merged), null, 2);
}
function safeParse(raw) {
	if (raw === null) return null;
	try {
		return JSON.parse(raw);
	} catch {
		return null;
	}
}
/** Sanitize via the real store: write to a temp dir, load, delete. Caps and shapes guaranteed. */
function sanitizeStateJson(value) {
	const tmp = mkdtempSync(join(tmpdir(), "dsh-mp-restore-"));
	try {
		writeFileSync(join(tmp, "state.json"), JSON.stringify(value), "utf8");
		return loadMpState(tmp);
	} finally {
		rmSync(tmp, {
			recursive: true,
			force: true
		});
	}
}
/** The state.json contents the EXPORT should carry (already sanitized shape). */
function stateFileForBackup(profileDir) {
	const path = resolve(profileDir, ".dsh-mp", "state.json");
	if (!existsSync(path)) return null;
	return readFileSync(path, "utf8");
}
//#endregion
//#region src/sync-backup.ts
/**
* Remote backup targets (plan #12): WebDAV and a private GitHub Gist.
*
* Security posture (ported from dsh-market, MIT — backup.ts + gist.ts):
* - Credentials are NEVER persisted by the plugin: WebDAV url/username/
*   password and the Gist token arrive per request from the client; a Gist
*   token may also come from the DSH_MP_GITHUB_TOKEN / GITHUB_TOKEN env of
*   the host process (which enables the daily auto-backup) or from the gh
*   CLI auth on disk.
* - WebDAV: https-only, no credentials in the URL, private/link-local
*   targets refused, DNS resolved once and the socket pinned to the checked
*   address (closes the rebinding window).
* - Gist: the API host is hard-coded to api.github.com (no SSRF surface),
*   the gist id is allowlisted before it reaches a path, gists are private,
*   and downloads go through validatedBackup before anything is returned.
*/
/**
* Outbound proxy support (HTTPS_PROXY / https_proxy / ALL_PROXY / all_proxy):
* on hosts whose direct path breaks large upstream TLS flows (VPN/DPI), the
* machine-standard proxy is the only reliable route to GitHub. CONNECT
* tunneling by hand — no undici dependency, works for both transports below.
*/
function proxyUrl() {
	for (const name of [
		"HTTPS_PROXY",
		"https_proxy",
		"ALL_PROXY",
		"all_proxy"
	]) {
		const value = process.env[name];
		if (typeof value === "string" && value.trim() !== "") try {
			const parsed = new URL(value.trim());
			if (parsed.protocol === "http:" || parsed.protocol === "https:") return parsed;
		} catch {}
	}
	return null;
}
function tunnelThroughProxy(proxy, host, port) {
	return new Promise((resolveTunnel, rejectTunnel) => {
		const socket = connect(Number(proxy.port === "" ? 80 : proxy.port), proxy.hostname, () => {
			socket.write(`CONNECT ${host}:${port} HTTP/1.1\r\nHost: ${host}:${port}\r\nProxy-Connection: keep-alive\r\n\r\n`);
		});
		socket.once("error", rejectTunnel);
		let head = "";
		const onData = (chunk) => {
			head += chunk.toString("utf8");
			if (!head.includes("\r\n\r\n")) return;
			socket.off("data", onData);
			const status = Number.parseInt(/^HTTP\/1\.[01]\s+(\d{3})/.exec(head)?.[1] ?? "0", 10);
			if (status !== 200) {
				socket.destroy();
				rejectTunnel(/* @__PURE__ */ new Error(`proxy CONNECT failed: HTTP ${status}`));
				return;
			}
			resolveTunnel(socket);
		};
		socket.on("data", onData);
	});
}
/**
* Open a raw socket to host:port — through the configured proxy when present
* (CONNECT), direct otherwise. The caller upgrades TLS with SNI = host.
*/
async function openSocket(host, port) {
	const proxy = proxyUrl();
	if (proxy === null) return connect(port, host);
	return tunnelThroughProxy(proxy, host, port);
}
const WEBDAV_TIMEOUT_MS = 3e4;
async function webdavRequest(url, username, password, method, body) {
	const parsed = new URL(url);
	if (parsed.protocol === "http:") throw new Error("WebDAV requires an https:// URL");
	if (parsed.protocol !== "https:") throw new Error("invalid WebDAV URL");
	if (parsed.username !== "" || parsed.password !== "") throw new Error("invalid WebDAV URL");
	const address = await resolvePublicAddress(parsed.hostname);
	const headers = { host: parsed.host };
	if (body !== void 0) {
		headers["content-type"] = "application/json";
		headers["content-length"] = String(Buffer.byteLength(body));
	}
	if (username !== "") headers.authorization = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
	const originalHostname = unbracketedHostname(parsed.hostname);
	return await new Promise((resolveRequest, rejectTunnel) => {
		(async () => {
			const socket = await openSocket(address.address, Number(parsed.port === "" ? 443 : Number(parsed.port)));
			const request$1 = request({
				protocol: "https:",
				hostname: address.address,
				family: address.family,
				port: parsed.port === "" ? 443 : Number(parsed.port),
				path: `${parsed.pathname}${parsed.search}`,
				method,
				headers,
				socket,
				servername: isIP(originalHostname) === 0 ? originalHostname : void 0,
				signal: AbortSignal.timeout(WEBDAV_TIMEOUT_MS)
			}, (response) => {
				const chunks = [];
				let size = 0;
				const maxBytes = method === "GET" ? 2097152 : 65536;
				response.once("error", rejectTunnel);
				const declared = Number(response.headers["content-length"]);
				if (Number.isFinite(declared) && declared > maxBytes) {
					response.destroy(/* @__PURE__ */ new Error("WebDAV response is too large"));
					return;
				}
				response.on("data", (chunk) => {
					const value = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
					size += value.byteLength;
					if (size > maxBytes) {
						response.destroy(/* @__PURE__ */ new Error("WebDAV response is too large"));
						return;
					}
					chunks.push(value);
				});
				response.once("end", () => resolveRequest({
					status: response.statusCode ?? 0,
					body: Buffer.concat(chunks),
					...typeof response.headers.location === "string" ? { location: response.headers.location } : {}
				}));
			});
			request$1.once("error", rejectTunnel);
			request$1.end(body);
		})().catch(rejectTunnel);
	});
}
/** Ancestor collection URLs of a WebDAV file, outermost first (server root excluded). */
function webdavParentCollections(url) {
	let parsed;
	try {
		parsed = new URL(url);
	} catch {
		return [];
	}
	const parts = parsed.pathname.split("/").filter((part) => part !== "");
	parts.pop();
	const collections = [];
	let path = "";
	for (const part of parts) {
		path += `/${part}`;
		collections.push(`${parsed.origin}${path}/`);
	}
	return collections;
}
/** Upload the backup, creating missing parent collections first (MKCOL 405 = exists). */
async function uploadWebdav(url, username, password, backup) {
	for (const collection of webdavParentCollections(url)) try {
		await webdavRequest(collection, username, password, "MKCOL");
	} catch {}
	const response = await webdavRequest(url, username, password, "PUT", JSON.stringify(backup));
	if (response.status < 200 || response.status >= 300) throw new Error(response.status === 404 ? "WebDAV upload failed: HTTP 404 — the target folder does not exist and could not be created (use a path inside a folder, e.g. https://dav.example.com/dsh/backup.json)" : `WebDAV upload failed: HTTP ${response.status}`);
}
/** Only global-unicast IPv4 is a usable WebDAV target. */
function isPublicIpv4(ip) {
	const octets = ip.split(".").map(Number);
	if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
	const [a, b] = octets;
	if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
	if (a === 100 && b >= 64 && b <= 127) return false;
	if (a === 169 && b === 254) return false;
	if (a === 172 && b >= 16 && b <= 31) return false;
	if (a === 192 && (b === 0 || b === 168)) return false;
	if (a === 198 && (b === 18 || b === 19)) return false;
	return true;
}
/** Only global-unicast IPv6 (2000::/3). */
function isPublicIpv6(ip) {
	const bare = unbracketedHostname(ip);
	if (isIP(bare) !== 6) return false;
	const first = Number.parseInt(bare.split(":", 1)[0] || "0", 16);
	return Number.isFinite(first) && first >= 8192 && first <= 16383;
}
function isPublicHostname(hostname) {
	const bare = unbracketedHostname(hostname).toLowerCase();
	const noDot = bare.endsWith(".") ? bare.slice(0, -1) : bare;
	return noDot !== "" && noDot !== "localhost" && noDot !== "metadata.google.internal" && !noDot.endsWith(".localhost") && !noDot.endsWith(".internal") && !noDot.endsWith(".local");
}
function isPublicTarget(hostname) {
	const bare = unbracketedHostname(hostname);
	const family = isIP(bare);
	if (family === 4) return isPublicIpv4(bare);
	if (family === 6) return isPublicIpv6(bare);
	return isPublicHostname(bare);
}
function unbracketedHostname(hostname) {
	return hostname.startsWith("[") && hostname.endsWith("]") ? hostname.slice(1, -1) : hostname;
}
/** Resolve once, reject unsafe answers, return the address to pin the socket to. */
async function resolvePublicAddress(hostname) {
	const bare = unbracketedHostname(hostname);
	const family = isIP(bare);
	if (family === 4 || family === 6) {
		if (!isPublicTarget(bare)) throw new Error("invalid WebDAV URL");
		return {
			address: bare,
			family
		};
	}
	if (!isPublicHostname(bare)) throw new Error("invalid WebDAV URL");
	const addresses = await lookup(bare, {
		all: true,
		verbatim: true
	});
	if (addresses.length === 0 || addresses.some(({ address }) => !isPublicTarget(address))) throw new Error("invalid WebDAV URL");
	const selected = addresses[0];
	if (selected === void 0 || selected.family !== 4 && selected.family !== 6) throw new Error("invalid WebDAV URL");
	return {
		address: selected.address,
		family: selected.family
	};
}
const MAX_REDIRECTS = 5;
async function downloadWebdav(url, username, password) {
	let currentUrl = url;
	let response = await webdavRequest(currentUrl, username, password, "GET");
	for (let hop = 0; hop < MAX_REDIRECTS; hop += 1) {
		if (response.status !== 301 && response.status !== 302 && response.status !== 303 && response.status !== 307 && response.status !== 308) break;
		if (response.location === void 0) break;
		const next = new URL(response.location, currentUrl);
		const sameOrigin = next.origin === new URL(currentUrl).origin;
		currentUrl = next.toString();
		response = sameOrigin ? await webdavRequest(currentUrl, username, password, "GET") : await webdavRequest(currentUrl, "", "", "GET");
	}
	if (response.status < 200 || response.status >= 300) throw new Error(`WebDAV download failed: HTTP ${response.status}`);
	return validatedBackup(JSON.parse(response.body.toString("utf8")));
}
const GIST_FILENAME = "dsh-mp-backup.json";
const GIST_MAX_BYTES = 1048576;
const GIST_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
function resolveGistToken(token) {
	if (typeof token === "string" && token.trim() !== "") return {
		token: token.trim(),
		source: "request"
	};
	for (const name of ["DSH_MP_GITHUB_TOKEN", "GITHUB_TOKEN"]) {
		const value = process.env[name];
		if (typeof value === "string" && value.trim() !== "") return {
			token: value.trim(),
			source: "env"
		};
	}
	try {
		const hosts = JSON.parse(readFileSync(join(homedir(), ".config", "gh", "hosts.yml"), "utf8"));
		for (const entry of Object.values(hosts)) if (typeof entry?.oauth_token === "string" && entry.oauth_token !== "") return {
			token: entry.oauth_token,
			source: "gh"
		};
	} catch {}
	return {
		token: "",
		source: "none"
	};
}
function parseGistId(input) {
	if (!GIST_ID_RE.test(input)) throw new Error("invalid gist id");
	return input;
}
/**
* Deliberately node:https, NOT global fetch: the dsh-web harness installs a
* global undici dispatcher for its own fetch proxying, and POSTs to
* api.github.com die with ECONNRESET through it. A direct https request
* bypasses that dispatcher entirely (same reasoning as the WebDAV transport).
*/
async function gistApi(token, method, path, payload) {
	const body = payload === void 0 ? void 0 : JSON.stringify(payload);
	return await new Promise((resolveRequest, rejectRequest) => {
		(async () => {
			const socket = await openSocket("api.github.com", 443);
			const request$2 = request({
				protocol: "https:",
				hostname: "api.github.com",
				port: 443,
				path,
				method,
				headers: {
					accept: "application/vnd.github+json",
					authorization: `Bearer ${token}`,
					"content-type": "application/json",
					"user-agent": "dsh-plugins-mp",
					...body !== void 0 ? { "content-length": String(Buffer.byteLength(body)) } : {}
				},
				socket,
				servername: "api.github.com",
				signal: AbortSignal.timeout(25e3)
			}, (response) => {
				const chunks = [];
				let size = 0;
				response.once("error", rejectRequest);
				response.on("data", (chunk) => {
					const value = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
					size += value.byteLength;
					if (size > 4194304) {
						response.destroy(/* @__PURE__ */ new Error("GitHub response is too large"));
						return;
					}
					chunks.push(value);
				});
				response.once("end", () => resolveRequest({
					ok: (response.statusCode ?? 500) >= 200 && (response.statusCode ?? 500) < 300,
					status: response.statusCode ?? 0,
					body: Buffer.concat(chunks).toString("utf8")
				}));
			});
			request$2.once("error", rejectRequest);
			request$2.end(body);
		})().catch(rejectRequest);
	});
}
function gistHttpError(status, body = "") {
	if (status === 401) return /* @__PURE__ */ new Error("GitHub rejected the token (HTTP 401)");
	if (status === 404) return /* @__PURE__ */ new Error("Gist not found (HTTP 404)");
	if (status === 403) {
		if (body.includes("not accessible")) return /* @__PURE__ */ new Error("the token has no Gists permission — for a fine-grained token enable the Gists repository permission");
		return /* @__PURE__ */ new Error("GitHub rate limit or forbidden (HTTP 403)");
	}
	return /* @__PURE__ */ new Error(`GitHub request failed: HTTP ${status}`);
}
/** Create a PRIVATE gist with the backup inside. */
async function createGist(token, backup) {
	const content = JSON.stringify(backup, null, 2);
	if (Buffer.byteLength(content) > GIST_MAX_BYTES) throw new Error("backup exceeds the GitHub Gist 1 MB limit");
	const res = await gistApi(token, "POST", "/gists", {
		description: `dsh-plugins-mp profile backup ${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}`,
		public: false,
		files: { [GIST_FILENAME]: { content } }
	});
	if (!res.ok) throw gistHttpError(res.status, res.body);
	const parsed = JSON.parse(res.body);
	if (typeof parsed.id !== "string" || typeof parsed.html_url !== "string") throw new Error("unexpected GitHub response");
	return {
		id: parsed.id,
		url: parsed.html_url
	};
}
/** Update an existing gist (same file name). */
async function updateGist(token, gistId, backup) {
	const content = JSON.stringify(backup, null, 2);
	if (Buffer.byteLength(content) > GIST_MAX_BYTES) throw new Error("backup exceeds the GitHub Gist 1 MB limit");
	const res = await gistApi(token, "PATCH", `/gists/${gistId}`, { files: { [GIST_FILENAME]: { content } } });
	if (!res.ok) throw gistHttpError(res.status, res.body);
	const parsed = JSON.parse(res.body);
	if (typeof parsed.id !== "string" || typeof parsed.html_url !== "string") throw new Error("unexpected GitHub response");
	return {
		id: parsed.id,
		url: parsed.html_url
	};
}
/** Fetch a gist's backup file; strictly validated before it leaves this module. */
async function readGist(token, gistId) {
	const res = await gistApi(token, "GET", `/gists/${gistId}`);
	if (!res.ok) throw gistHttpError(res.status, res.body);
	const file = JSON.parse(res.body).files?.[GIST_FILENAME];
	if (file === void 0 || typeof file.content !== "string") throw new Error("the gist has no dsh-mp-backup.json file");
	return validatedBackup(JSON.parse(file.content));
}
/** Cheap token check (GET /user). */
async function verifyGistToken(token) {
	const res = await gistApi(token, "GET", "/user");
	if (!res.ok) throw gistHttpError(res.status, res.body);
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
const FAVORITE_ROUTE = "/plugins/dsh-plugins-mp/favorite";
const NOTE_ROUTE = "/plugins/dsh-plugins-mp/note";
const THEME_ROUTE = "/plugins/dsh-plugins-mp/theme";
const LOGS_ROUTE = "/plugins/dsh-plugins-mp/logs";
const INSTALLED_ROUTE = "/plugins/dsh-plugins-mp/installed";
const UNINSTALL_ROUTE = "/plugins/dsh-plugins-mp/uninstall";
const UPDATE_ROUTE = "/plugins/dsh-plugins-mp/update";
const APPROVE_BUILDS_ROUTE = "/plugins/dsh-plugins-mp/approve-builds";
const HEALTH_ROUTE = "/plugins/dsh-plugins-mp/health";
const SETUP_PNPM_ROUTE = "/plugins/dsh-plugins-mp/setup-pnpm";
const TOGGLE_ROUTE = "/plugins/dsh-plugins-mp/toggle";
const GROUP_ROUTE = "/plugins/dsh-plugins-mp/group";
const ORDER_ROUTE = "/plugins/dsh-plugins-mp/order";
const BACKUP_ROUTE = "/plugins/dsh-plugins-mp/backup";
const SYNC_ROUTE = "/plugins/dsh-plugins-mp/sync";
const SNAPSHOTS_ROUTE = "/plugins/dsh-plugins-mp/snapshots";
const RESTORE_SNAPSHOT_ROUTE = "/plugins/dsh-plugins-mp/restore-snapshot";
const STATUS_ROUTE = "/plugins/dsh-plugins-mp/status";
const RESTART_ROUTE = "/plugins/dsh-plugins-mp/restart";
const DIAGNOSTICS_ROUTE = "/plugins/dsh-plugins-mp/diagnostics";
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
const PACKAGE_RE = /^(@[a-z0-9-]+\/)?[a-z0-9][a-z0-9._-]{0,119}$/;
const PROFILE_RE = /^[a-z0-9][a-z0-9_-]{0,39}$/;
function readBody(req, maxBytes = 1e4) {
	return new Promise((resolve) => {
		let body = "";
		let bytes = 0;
		req.on("data", (chunk) => {
			bytes += chunk.length;
			body += chunk.toString("utf8");
			if (bytes > maxBytes) body = "";
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
/**
* One `dsh plugin --profile <profile> <args…>` invocation — the shared
* executor behind install, uninstall and update. The CLI forwards the args
* to pnpm in the profile directory and reconciles its bundle list.
*/
function runDshPlugin(profile, pnpmArgs, timeoutMs = INSTALL_TIMEOUT_MS) {
	const command = `dsh plugin --profile ${profile} ${pnpmArgs.join(" ")}`;
	const source = pnpmArgs[pnpmArgs.length - 1] ?? "";
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
				...pnpmArgs
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
				const trimmed = output.trim();
				resolve({
					ok: code === 0 && !timedOut,
					code,
					command,
					source,
					output: trimmed,
					timedOut,
					ignoredBuilds: parseIgnoredBuilds(trimmed)
				});
			});
		};
		attempt(0);
	});
}
/** Install one marketplace source into a profile. */
function runDshPluginAdd(profile, source, timeoutMs = INSTALL_TIMEOUT_MS) {
	return runDshPlugin(profile, ["add", source], timeoutMs);
}
/** One arbitrary `dsh <args…>` invocation (boot trial: `--dump-config`). */
function runDshCli(args, timeoutMs = INSTALL_TIMEOUT_MS) {
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
					output: `dsh CLI not found (tried: ${commands.map((c) => c.label).join(", ")})`,
					timedOut
				});
				return;
			}
			const cmd = commands[index];
			let timer;
			const child = spawn(cmd.argv[0], [...cmd.argv.slice(1), ...args], {
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
					output: output.trim(),
					timedOut
				});
			});
		};
		attempt(0);
	});
}
/** Entry ids in composition order, parsed from a `dsh --dump-config` dump. */
function parseEntryIds(dump) {
	const ids = [];
	for (const m of dump.matchAll(/^\s*-\s*id:\s*['"]?([^'"\s]+)/gm)) ids.push(m[1] ?? "");
	return ids;
}
/** The profile name for CLI invocations — same resolution as resolveProfileDir. */
function profileName(config) {
	return config.profile ?? argvProfile() ?? "web";
}
/** The names of currently running host agents, for the mutation guard. */
function runningAgentIdsOf(ctx) {
	try {
		const listed = (ctx.get?.("agents"))?.list?.();
		if (!Array.isArray(listed)) return [];
		const ids = [];
		for (const agent of listed) {
			if (agent === null || typeof agent !== "object") continue;
			const record = agent;
			if (record.status !== "running") continue;
			ids.push(typeof record.id === "string" && record.id !== "" ? record.id : "agent");
		}
		return ids;
	} catch {
		return [];
	}
}
/**
* The mutation guard: installing or removing packages swaps files a live
* agent may still be reading or lazily importing. Returns the 409 body when
* an agent is mid-turn, null when mutations may proceed.
*/
function mutatingBlock(ctx) {
	const agents = runningAgentIdsOf(ctx);
	if (agents.length === 0) return null;
	return {
		error: `an agent session is running (${agents.join(", ")}) — plugin changes are paused until it finishes`,
		agents
	};
}
/**
* Enable/disable ONE installed plugin — the shared core behind the single
* toggle route and group toggles (#15): a live hot mount goes down/up
* immediately, the managed patch row decides the next boot, and a row the
* user patch manages itself is reported as a conflict instead of fought over.
*/
async function toggleOne(ctx, profileDir, name, disable) {
	const userControls = readUserPatchControls(profileDir);
	const hotLive = listHotMounts().includes(name);
	let live = hotLive;
	if (disable) {
		if (hotLive) live = !await hotUnmount(name);
		if (setPatchDisabled(profileDir, name, true).conflict === true) return {
			ok: false,
			conflict: true,
			error: `the patch layer already manages a row for ${name} — edit cordis.patch.yml by hand`
		};
		live = false;
	} else {
		if (setPatchDisabled(profileDir, name, false).conflict === true) return {
			ok: false,
			conflict: true,
			error: `the patch layer already manages a row for ${name} — edit cordis.patch.yml by hand`
		};
		if (!patchLayerManages(userControls, name)) {
			if (!hotLive) {
				const mount = await hotMount(ctx, profileDir, name);
				live = mount.ok;
				if (!mount.ok) return {
					ok: true,
					live: false,
					restartNeeded: true,
					reason: mount.reason
				};
			}
		}
	}
	logEvent("info", "toggle", `${name}: ${disable ? "off" : "on"} (live=${String(live)})`);
	return {
		ok: true,
		live,
		restartNeeded: false
	};
}
function mountRoutes(ctx, config = {}, runtime) {
	const apiBase = resolveApiBase(config);
	let installing = false;
	const resolveCommand = async (slug, profile) => {
		try {
			const detail = await fetchDetail(apiBase, slug, AbortSignal.timeout(15e3));
			const source = installSourceFor(detail.plugin);
			const fallback = detail.plugin.repoOwner && detail.plugin.repoName ? `github:${detail.plugin.repoOwner}/${detail.plugin.repoName}` : null;
			return {
				command: `dsh plugin --profile ${profile} add ${source}`,
				source,
				fallback: fallback !== null && fallback !== source ? fallback : null
			};
		} catch {
			return null;
		}
	};
	ctx.inject(["webServer"], (sctx) => {
		sctx.effect(() => {
			const webServer = sctx.webServer;
			if (webServer === void 0) return () => {};
			try {
				cleanHotDir(resolveProfileDir(config));
			} catch {}
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
					const blocked = mutatingBlock(ctx);
					if (blocked !== null) {
						json(res, 409, blocked);
						return;
					}
					if (installing) {
						json(res, 409, { error: "another install is already in progress" });
						return;
					}
					installing = true;
					try {
						const profileDir = resolveProfileDir({ profile });
						const before = new Set(readInstalled(profileDir).map((item) => item.name));
						snapshotCreate(profileDir, `before install ${resolved.source}`);
						let outcome = await runDshPluginAdd(profile, resolved.source);
						if (!outcome.ok && resolved.fallback !== null) {
							logEvent("info", "install", `${resolved.source} failed — retrying via ${resolved.fallback}`);
							const retried = await runDshPluginAdd(profile, resolved.fallback);
							if (retried.ok) outcome = retried;
							else outcome.output = `${outcome.output}\n— retry via ${resolved.fallback} also failed (code ${retried.code}${retried.timedOut ? ", timed out" : ""})`;
						}
						if (outcome.ok) {
							const added = readInstalled(profileDir).map((item) => item.name).filter((name) => !before.has(name));
							const isPlainSpec = /^[a-z0-9][a-z0-9._/-]*(@[^\s]+)?$/i.test(resolved.source);
							const installedName = added[0] ?? (isPlainSpec ? resolved.source.replace(/@[^\s/@]+$/, "") : null);
							outcome.installedName = installedName;
							outcome.verified = installedName === null ? null : isPackageOnDisk(profileDir, installedName);
							if (installedName !== null && ctx.plugin !== void 0) {
								const hot = await hotMount(ctx, profileDir, installedName);
								outcome.hot = hot.ok;
								if (!hot.ok) outcome.hotReason = hot.reason ?? void 0;
							}
						}
						logEvent(outcome.ok ? "info" : "warn", "install", `${resolved.source} → profile ${profile}: ${outcome.ok ? `ok${outcome.ignoredBuilds?.length ? `, blocked builds: ${outcome.ignoredBuilds.join(", ")}` : ""}` : `failed (code ${outcome.code}${outcome.timedOut ? ", timed out" : ""})`}`);
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
			const stopFavorite = webServer.register({
				kind: "exact",
				path: FAVORITE_ROUTE,
				handler: async (req, res) => {
					if (req.method === "GET") {
						json(res, 200, { favorites: runtime?.getState().favorites ?? [] });
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
					const slug = typeof body.slug === "string" ? body.slug : "";
					if (!SLUG_RE.test(slug)) {
						json(res, 400, { error: "invalid slug" });
						return;
					}
					const on = body.on !== false;
					const prev = runtime.getState().favorites;
					const favorites = on ? prev.includes(slug) ? prev : [...prev, slug] : prev.filter((item) => item !== slug);
					runtime.updateState({ favorites });
					logEvent("info", "favorite", `${on ? "+" : "-"} ${slug}`);
					json(res, 200, { favorites });
				}
			});
			const stopNote = webServer.register({
				kind: "exact",
				path: NOTE_ROUTE,
				handler: async (req, res) => {
					if (req.method === "GET") {
						json(res, 200, { notes: runtime?.getState().notes ?? {} });
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
					const slug = typeof body.slug === "string" ? body.slug : "";
					if (!SLUG_RE.test(slug)) {
						json(res, 400, { error: "invalid slug" });
						return;
					}
					if (typeof body.text !== "string") {
						json(res, 400, { error: "text must be a string" });
						return;
					}
					const notes = { ...runtime.getState().notes };
					const text = body.text.trim();
					if (text === "") delete notes[slug];
					else notes[slug] = text.slice(0, 2e3);
					runtime.updateState({ notes });
					logEvent("info", "note", `${text === "" ? "-" : "+"} ${slug}`);
					json(res, 200, { notes });
				}
			});
			const stopTheme = webServer.register({
				kind: "exact",
				path: THEME_ROUTE,
				handler: async (req, res) => {
					if (req.method === "GET") {
						json(res, 200, { active: runtime?.getState().theme ?? null });
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
					if (body.slug === null) {
						runtime.updateState({ theme: null });
						json(res, 200, { active: null });
						return;
					}
					const slug = typeof body.slug === "string" ? body.slug : "";
					const name = typeof body.name === "string" ? body.name : "";
					if (!SLUG_RE.test(slug) || !SLUG_RE.test(name)) {
						json(res, 400, { error: "invalid slug or name" });
						return;
					}
					const theme = {
						slug,
						name
					};
					runtime.updateState({ theme });
					logEvent("info", "theme", `active: ${slug} (${name})`);
					json(res, 200, { active: theme });
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
			const stopInstalled = webServer.register({
				kind: "exact",
				path: INSTALLED_ROUTE,
				handler: (_req, res) => {
					json(res, 200, {
						dsh: dshHostInfo(),
						items: readInstalled(resolveProfileDir(config))
					});
				}
			});
			const stopUninstall = webServer.register({
				kind: "exact",
				path: UNINSTALL_ROUTE,
				handler: async (req, res) => {
					if (req.method !== "POST") {
						json(res, 405, { error: "method not allowed" });
						return;
					}
					if (!requestAllowed(req)) {
						json(res, 403, { error: "forbidden" });
						return;
					}
					let body = {};
					try {
						body = JSON.parse(await readBody(req) || "{}");
					} catch {
						json(res, 400, { error: "invalid JSON body" });
						return;
					}
					const name = typeof body.name === "string" ? body.name : "";
					const profile = typeof body.profile === "string" && body.profile !== "" ? body.profile : "web";
					if (!PACKAGE_RE.test(name)) {
						json(res, 400, { error: "invalid package name" });
						return;
					}
					const blocked = mutatingBlock(ctx);
					if (blocked !== null) {
						json(res, 409, blocked);
						return;
					}
					if (installing) {
						json(res, 409, { error: "another install is already in progress" });
						return;
					}
					installing = true;
					try {
						snapshotCreate(resolveProfileDir({ profile }), `before uninstall ${name}`);
						await hotUnmount(name);
						const outcome = await runDshPlugin(profile, ["remove", name]);
						logEvent(outcome.ok ? "info" : "warn", "uninstall", `${name} from profile ${profile}: ${outcome.ok ? "removed" : `failed (code ${outcome.code})`}`);
						json(res, 200, outcome);
					} finally {
						installing = false;
					}
				}
			});
			const stopUpdate = webServer.register({
				kind: "exact",
				path: UPDATE_ROUTE,
				handler: async (req, res) => {
					if (req.method === "GET") {
						const profileDir = resolveProfileDir(config);
						const scan = await Promise.all(readInstalled(profileDir).filter((item) => item.source === "npm" && item.version !== null).map(async (item) => ({
							name: item.name,
							current: item.version,
							latest: await npmLatestVersion(item.name)
						})).map(async (entry) => {
							const e = await entry;
							return {
								...e,
								updateAvailable: e.latest !== null && e.current !== null && e.latest !== e.current
							};
						}));
						json(res, 200, { items: scan });
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
					let body = {};
					try {
						body = JSON.parse(await readBody(req) || "{}");
					} catch {
						json(res, 400, { error: "invalid JSON body" });
						return;
					}
					const name = typeof body.name === "string" ? body.name : "";
					const profile = typeof body.profile === "string" && body.profile !== "" ? body.profile : "web";
					if (!PACKAGE_RE.test(name)) {
						json(res, 400, { error: "invalid package name" });
						return;
					}
					const blocked = mutatingBlock(ctx);
					if (blocked !== null) {
						json(res, 409, blocked);
						return;
					}
					if (installing) {
						json(res, 409, { error: "another install is already in progress" });
						return;
					}
					installing = true;
					try {
						snapshotCreate(resolveProfileDir({ profile }), `before update ${name}`);
						const outcome = await runDshPlugin(profile, ["add", `${name}@latest`]);
						logEvent(outcome.ok ? "info" : "warn", "update", `${name} in profile ${profile}: ${outcome.ok ? "updated" : `failed (code ${outcome.code})`}`);
						json(res, 200, outcome);
					} finally {
						installing = false;
					}
				}
			});
			const stopApproveBuilds = webServer.register({
				kind: "exact",
				path: APPROVE_BUILDS_ROUTE,
				handler: async (req, res) => {
					if (req.method !== "POST") {
						json(res, 405, { error: "method not allowed" });
						return;
					}
					if (!requestAllowed(req)) {
						json(res, 403, { error: "forbidden" });
						return;
					}
					let body = {};
					try {
						body = JSON.parse(await readBody(req) || "{}");
					} catch {
						json(res, 400, { error: "invalid JSON body" });
						return;
					}
					const profile = typeof body.profile === "string" && body.profile !== "" ? body.profile : "web";
					const packages = Array.isArray(body.packages) ? body.packages.filter((item) => typeof item === "string" && PACKAGE_RE.test(item)) : [];
					if (packages.length === 0) {
						json(res, 400, { error: "packages must be a non-empty array of package names" });
						return;
					}
					try {
						const { added, file } = allowBuildsAdd(resolveProfileDir({ profile }), packages);
						logEvent("info", "approve-builds", `allowed build scripts: ${added.join(", ")} (${file})`);
						json(res, 200, {
							ok: true,
							added,
							file
						});
					} catch (error) {
						json(res, 500, { error: String(error instanceof Error ? error.message : error) });
					}
				}
			});
			const stopHealth = webServer.register({
				kind: "exact",
				path: HEALTH_ROUTE,
				handler: (_req, res) => {
					let settled = false;
					const done = (body) => {
						if (settled) return;
						settled = true;
						json(res, 200, body);
					};
					const child = spawn("pnpm", ["--version"], {
						env: spawnEnv(),
						stdio: [
							"ignore",
							"pipe",
							"pipe"
						]
					});
					let version = "";
					child.stdout?.on("data", (chunk) => {
						version += chunk.toString("utf8");
					});
					child.on("error", () => done({
						pnpm: { found: false },
						dsh: dshCommands()[0]?.label ?? null
					}));
					const timer = setTimeout(() => {
						child.kill("SIGKILL");
						done({
							pnpm: { found: false },
							dsh: dshCommands()[0]?.label ?? null
						});
					}, 15e3);
					child.on("close", (code) => {
						clearTimeout(timer);
						done({
							pnpm: {
								found: code === 0,
								version: version.trim() || null
							},
							dsh: dshCommands()[0]?.label ?? null
						});
					});
				}
			});
			const stopSetupPnpm = webServer.register({
				kind: "exact",
				path: SETUP_PNPM_ROUTE,
				handler: async (req, res) => {
					if (req.method !== "POST") {
						json(res, 405, { error: "method not allowed" });
						return;
					}
					if (!requestAllowed(req)) {
						json(res, 403, { error: "forbidden" });
						return;
					}
					const outcome = await new Promise((resolve) => {
						let output = "";
						const collect = (buf) => {
							output += buf.toString("utf8");
							if (output.length > MAX_OUTPUT_CHARS) output = output.slice(-2e4);
						};
						const child = spawn("npm", [
							"install",
							"-g",
							"pnpm@11"
						], {
							env: spawnEnv(),
							stdio: [
								"ignore",
								"pipe",
								"pipe"
							]
						});
						let timer;
						child.stdout?.on("data", collect);
						child.stderr?.on("data", collect);
						child.on("error", (error) => {
							if (timer) clearTimeout(timer);
							resolve({
								ok: false,
								output: `${output}\n${String(error)}`.trim()
							});
						});
						timer = setTimeout(() => {
							child.kill("SIGKILL");
							resolve({
								ok: false,
								output: `${output}\ntimed out`.trim()
							});
						}, INSTALL_TIMEOUT_MS);
						child.on("close", (code) => {
							if (timer) clearTimeout(timer);
							resolve({
								ok: code === 0,
								output: output.trim()
							});
						});
					});
					logEvent(outcome.ok ? "info" : "warn", "setup-pnpm", outcome.ok ? "pnpm installed globally" : `failed: ${outcome.output.slice(-200)}`);
					json(res, 200, outcome);
				}
			});
			const stopToggle = webServer.register({
				kind: "exact",
				path: TOGGLE_ROUTE,
				handler: async (req, res) => {
					if (req.method === "GET") {
						const profileDir = resolveProfileDir(config);
						const items = readInstalled(profileDir);
						const hot = listHotMounts();
						json(res, 200, {
							hot,
							items: items.map((item) => ({
								name: item.name,
								disabled: isDisabledByPatch(profileDir, item.name),
								live: hot.includes(item.name)
							}))
						});
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
					let body = {};
					try {
						body = JSON.parse(await readBody(req) || "{}");
					} catch {
						json(res, 400, { error: "invalid JSON body" });
						return;
					}
					const name = typeof body.name === "string" ? body.name : "";
					const disable = body.disable === true;
					if (!PACKAGE_RE.test(name)) {
						json(res, 400, { error: "invalid package name" });
						return;
					}
					if (ctx.plugin === void 0) {
						json(res, 503, { error: "hot composition surface is unavailable in this host" });
						return;
					}
					const result = await toggleOne(ctx, resolveProfileDir(config), name, disable);
					if (!result.ok) {
						json(res, 409, { error: result.error });
						return;
					}
					json(res, 200, result);
				}
			});
			const stopGroup = webServer.register({
				kind: "exact",
				path: GROUP_ROUTE,
				handler: async (req, res) => {
					if (req.method === "GET") {
						json(res, 200, { groups: runtime?.getState().groups ?? [] });
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
					const action = typeof body.action === "string" ? body.action : "";
					const name = typeof body.name === "string" ? body.name.trim() : "";
					if (![
						"create",
						"delete",
						"add",
						"remove",
						"toggle"
					].includes(action)) {
						json(res, 400, { error: "action must be one of create/delete/add/remove/toggle" });
						return;
					}
					if (!isValidGroupName(name)) {
						json(res, 400, { error: "invalid group name" });
						return;
					}
					const groups = runtime.getState().groups.map((g) => ({
						...g,
						members: [...g.members]
					}));
					const group = groups.find((g) => g.name.toLowerCase() === name.toLowerCase());
					if (action === "create") {
						if (group !== void 0) {
							json(res, 409, { error: `group "${name}" already exists` });
							return;
						}
						groups.push({
							name,
							members: []
						});
					} else if (group === void 0) {
						json(res, 404, { error: `group "${name}" not found` });
						return;
					} else if (action === "delete") groups.splice(groups.indexOf(group), 1);
					else if (action === "add" || action === "remove") {
						const member = typeof body.member === "string" ? body.member : "";
						if (!PACKAGE_RE.test(member)) {
							json(res, 400, { error: "invalid package name" });
							return;
						}
						if (action === "add") {
							if (!group.members.includes(member) && group.members.length >= 50) {
								json(res, 409, { error: "group is full (50 members max)" });
								return;
							}
							if (!group.members.includes(member)) group.members.push(member);
						} else group.members = group.members.filter((m) => m !== member);
					} else if (action === "toggle") {
						if (ctx.plugin === void 0) {
							json(res, 503, { error: "hot composition surface is unavailable in this host" });
							return;
						}
						const disable = body.disable === true;
						const installed = new Set(readInstalled(resolveProfileDir(config)).map((item) => item.name));
						const results = [];
						for (const member of group.members) {
							if (!installed.has(member)) {
								results.push({
									name: member,
									ok: true,
									skipped: true
								});
								continue;
							}
							const r = await toggleOne(ctx, resolveProfileDir(config), member, disable);
							results.push(r.ok ? {
								name: member,
								ok: true,
								live: r.live,
								restartNeeded: r.restartNeeded
							} : {
								name: member,
								ok: false,
								error: r.error
							});
						}
						const restartNeeded = results.some((r) => r.restartNeeded === true);
						logEvent("info", "group", `${name}: ${disable ? "off" : "on"} (${results.filter((r) => r.ok && !r.skipped).length}/${group.members.length} applied)`);
						json(res, 200, {
							ok: true,
							results,
							restartNeeded
						});
						return;
					}
					runtime.updateState({ groups });
					logEvent("info", "group", `${action} "${name}"`);
					json(res, 200, { groups });
				}
			});
			const stopOrder = webServer.register({
				kind: "exact",
				path: ORDER_ROUTE,
				handler: async (req, res) => {
					const profileDir = resolveProfileDir(config);
					const trial = async () => {
						const r = await runDshCli([
							"--dump-config",
							"--profile",
							profileName(config)
						], 12e4);
						return {
							ok: r.ok,
							output: r.output
						};
					};
					if (req.method === "GET") {
						const stack = readBundleStack(profileDir);
						json(res, 200, {
							bundles: stack.bundles,
							community: stack.community,
							conflicts: validateOrder(stack.bundles, readBundleRules(profileDir))
						});
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
					let body = {};
					try {
						body = JSON.parse(await readBody(req) || "{}");
					} catch {
						json(res, 400, { error: "invalid JSON body" });
						return;
					}
					const order = Array.isArray(body.order) ? body.order.filter((item) => typeof item === "string") : [];
					if (order.length === 0) {
						json(res, 400, { error: "order must be a non-empty array of bundle names" });
						return;
					}
					if (installing) {
						json(res, 409, { error: "another install is already in progress" });
						return;
					}
					installing = true;
					try {
						const stack = readBundleStack(profileDir);
						const merged = mergeOrder(stack.bundles, order);
						if (!merged.ok) {
							json(res, 400, { error: merged.error });
							return;
						}
						const conflicts = validateOrder(merged.bundles, readBundleRules(profileDir));
						if (conflicts.length > 0) {
							json(res, 422, {
								error: "the order violates declared before/after rules",
								conflicts
							});
							return;
						}
						if (merged.bundles.join("\0") === stack.bundles.join("\0")) {
							json(res, 200, {
								ok: true,
								unchanged: true,
								bundles: stack.bundles
							});
							return;
						}
						const beforeDump = await trial();
						const beforeIds = beforeDump.ok ? parseEntryIds(beforeDump.output) : [];
						snapshotCreate(profileDir, "before bundle order");
						const manifestPath = join(profileDir, "package.json");
						const originalText = readFileSync(manifestPath, "utf8");
						const applied = applyBundleOrder(profileDir, order);
						if (!applied.ok) {
							json(res, 400, { error: applied.error });
							return;
						}
						const after = await trial();
						if (!after.ok) {
							writeFileAtomic(manifestPath, originalText);
							logEvent("warn", "order", `rejected by boot trial — manifest restored`);
							json(res, 422, {
								error: "trial composition failed — the order was rolled back",
								output: after.output.slice(-2e3)
							});
							return;
						}
						const afterIds = parseEntryIds(after.output);
						const beforePos = new Map(beforeIds.map((id, i) => [id, i]));
						const moved = afterIds.filter((id, i) => beforePos.get(id) !== i);
						logEvent("info", "order", `applied community order (${moved.length} entries moved)`);
						json(res, 200, {
							ok: true,
							bundles: applied.bundles,
							moved,
							restartNeeded: true
						});
					} catch (error) {
						json(res, 500, { error: String(error instanceof Error ? error.message : error) });
					} finally {
						installing = false;
					}
				}
			});
			const stopBackup = webServer.register({
				kind: "exact",
				path: BACKUP_ROUTE,
				handler: async (req, res) => {
					const profileDir = resolveProfileDir(config);
					if (req.method === "GET") {
						if (!requestAllowed(req)) {
							json(res, 403, { error: "forbidden" });
							return;
						}
						try {
							const backup = createProfileBackup(profileDir, profileName(config));
							res.writeHead(200, {
								"content-type": "application/json; charset=utf-8",
								"content-disposition": `attachment; filename="dsh-mp-backup-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json"`
							});
							res.end(JSON.stringify(backup, null, 2));
						} catch (error) {
							json(res, 500, { error: String(error instanceof Error ? error.message : error) });
						}
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
					let backup;
					try {
						const raw = await readBody(req, 2197152);
						backup = validatedBackup(JSON.parse(raw || "null"));
					} catch (error) {
						json(res, 400, { error: String(error instanceof Error ? error.message : error) });
						return;
					}
					if (installing) {
						json(res, 409, { error: "another install is already in progress" });
						return;
					}
					installing = true;
					try {
						const manifestPath = join(profileDir, "package.json");
						const currentManifest = JSON.parse(readFileSync(manifestPath, "utf8"));
						const backupManifest = backup.files.find((file) => file.path === "package.json");
						if (backupManifest === void 0 || !("json" in backupManifest)) {
							json(res, 400, { error: "backup has no package.json" });
							return;
						}
						const mergedManifest = mergeRestoreManifest(backupManifest.json, currentManifest);
						const stateEntry = backup.files.find((file) => file.path === ".dsh-mp/state.json");
						const mergedState = mergeRestoreState(stateFileForBackup(profileDir), stateEntry !== void 0 ? stateEntry.lines.join("\n") : null);
						const files = backup.files.map((file) => file.path === ".dsh-mp/state.json" ? {
							path: file.path,
							lines: mergedState.split("\n")
						} : file);
						const backupDeps = backupManifest.json.dependencies !== null && typeof backupManifest.json.dependencies === "object" ? backupManifest.json.dependencies : {};
						const currentDeps = currentManifest.dependencies !== null && typeof currentManifest.dependencies === "object" ? currentManifest.dependencies : {};
						const depsAdded = Object.keys(backupDeps).filter((name) => !(name in currentDeps));
						const result = restoreProfileBackup(profileDir, {
							...backup,
							files
						}, mergedManifest);
						logEvent("info", "backup", `restored ${result.files} files from backup (${backup.createdAt})`);
						json(res, 200, {
							ok: true,
							files: result.files,
							depsAdded,
							unportable: unportableDeps(mergedManifest.dependencies),
							restartNeeded: true
						});
					} catch (error) {
						json(res, 400, { error: String(error instanceof Error ? error.message : error) });
					} finally {
						installing = false;
					}
				}
			});
			const stopSync = webServer.register({
				kind: "exact",
				path: SYNC_ROUTE,
				handler: async (req, res) => {
					if (req.method === "GET") {
						json(res, 200, { sync: runtime?.getState().sync ?? {
							gistId: null,
							lastAt: null
						} });
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
					try {
						const profileDir = resolveProfileDir(config);
						if (body.target === "webdav") {
							const url = typeof body.url === "string" ? body.url.trim() : "";
							const username = typeof body.username === "string" ? body.username : "";
							const password = typeof body.password === "string" ? body.password : "";
							if (body.action === "backup") {
								await uploadWebdav(url, username, password, createProfileBackup(profileDir, profileName(config)));
								logEvent("info", "sync", "webdav backup uploaded");
								json(res, 200, { ok: true });
							} else if (body.action === "restore") {
								const backup = await downloadWebdav(url, username, password);
								json(res, 200, {
									ok: true,
									backup
								});
							} else json(res, 400, { error: "invalid WebDAV action" });
							return;
						}
						if (body.target === "gist") {
							const now = (/* @__PURE__ */ new Date()).toISOString();
							if (body.action === "export") {
								const { token } = resolveGistToken(body.token);
								if (token === "") {
									json(res, 400, {
										error: "no GitHub token (paste one or set DSH_MP_GITHUB_TOKEN)",
										code: "no-token"
									});
									return;
								}
								const backup = createProfileBackup(profileDir, profileName(config));
								const stateGistId = runtime.getState().sync.gistId;
								const inputId = typeof body.gistId === "string" && body.gistId.trim() !== "" ? body.gistId.trim() : stateGistId;
								const ref = inputId !== null ? await updateGist(token, parseGistId(inputId), backup) : await createGist(token, backup);
								runtime.updateState({ sync: {
									gistId: ref.id,
									lastAt: now
								} });
								logEvent("info", "sync", `gist backup ${ref.id}`);
								json(res, 200, {
									ok: true,
									gistId: ref.id,
									gistUrl: ref.url
								});
								return;
							}
							if (body.action === "import") {
								const { token } = resolveGistToken(body.token);
								if (token === "") {
									json(res, 400, {
										error: "no GitHub token",
										code: "no-token"
									});
									return;
								}
								const gistId = typeof body.gistId === "string" ? body.gistId.trim() : "";
								if (gistId === "") {
									json(res, 400, { error: "gist id is required" });
									return;
								}
								const backup = await readGist(token, parseGistId(gistId));
								json(res, 200, {
									ok: true,
									backup
								});
								return;
							}
							if (body.action === "verify") {
								const { token, source } = resolveGistToken(body.token);
								if (token === "") {
									json(res, 200, {
										ok: false,
										source: "none"
									});
									return;
								}
								await verifyGistToken(token);
								json(res, 200, {
									ok: true,
									source
								});
								return;
							}
							if (body.action === "auto") {
								const { token, source } = resolveGistToken(void 0);
								if (token === "") {
									json(res, 200, {
										ok: false,
										source: "none"
									});
									return;
								}
								const last = runtime.getState().sync.lastAt;
								if (last !== null && Date.now() - Date.parse(last) < 864e5) {
									json(res, 200, {
										ok: true,
										skipped: true,
										source,
										lastAt: last
									});
									return;
								}
								const backup = createProfileBackup(profileDir, profileName(config));
								const stateGistId = runtime.getState().sync.gistId;
								const ref = stateGistId !== null ? await updateGist(token, stateGistId, backup) : await createGist(token, backup);
								runtime.updateState({ sync: {
									gistId: ref.id,
									lastAt: now
								} });
								logEvent("info", "sync", `auto gist backup ${ref.id} (token: ${source})`);
								json(res, 200, {
									ok: true,
									source,
									gistId: ref.id,
									lastAt: now
								});
								return;
							}
							json(res, 400, { error: "invalid Gist action" });
							return;
						}
						json(res, 400, { error: "target must be webdav or gist" });
					} catch (error) {
						const cause = error.cause;
						const detail = cause?.code !== void 0 || cause?.message !== void 0 ? ` (${cause?.code ?? ""} ${cause?.message ?? ""})` : "";
						json(res, 400, { error: String(error instanceof Error ? error.message : error) + detail });
					}
				}
			});
			const stopSnapshots = webServer.register({
				kind: "exact",
				path: SNAPSHOTS_ROUTE,
				handler: (_req, res) => {
					json(res, 200, { items: snapshotList(resolveProfileDir(config)) });
				}
			});
			const stopRestoreSnapshot = webServer.register({
				kind: "exact",
				path: RESTORE_SNAPSHOT_ROUTE,
				handler: async (req, res) => {
					if (req.method !== "POST") {
						json(res, 405, { error: "method not allowed" });
						return;
					}
					if (!requestAllowed(req)) {
						json(res, 403, { error: "forbidden" });
						return;
					}
					let body = {};
					try {
						body = JSON.parse(await readBody(req) || "{}");
					} catch {
						json(res, 400, { error: "invalid JSON body" });
						return;
					}
					const id = typeof body.id === "string" ? body.id : "";
					const result = snapshotRestore(resolveProfileDir(config), id);
					if (!result.ok) {
						json(res, 400, { error: result.error ?? "restore failed" });
						return;
					}
					logEvent("info", "snapshot", `restored ${id}; restart to apply`);
					json(res, 200, {
						ok: true,
						restartNeeded: true
					});
				}
			});
			const stopStatus = webServer.register({
				kind: "exact",
				path: STATUS_ROUTE,
				handler: (_req, res) => {
					const fingerprint = statusFingerprint();
					json(res, 200, {
						...fingerprint,
						successor: successorPending(resolveProfileDir(config)),
						uptime: Math.round(process.uptime())
					});
				}
			});
			const stopRestart = webServer.register({
				kind: "exact",
				path: RESTART_ROUTE,
				handler: async (req, res) => {
					if (req.method !== "POST") {
						json(res, 405, { error: "method not allowed" });
						return;
					}
					if (!requestAllowed(req)) {
						json(res, 403, { error: "forbidden" });
						return;
					}
					json(res, 200, { ok: true });
					try {
						triggerRestart(resolveProfileDir(config));
					} catch (error) {
						logEvent("error", "restart", String(error instanceof Error ? error.message : error));
					}
				}
			});
			const stopDiagnostics = webServer.register({
				kind: "exact",
				path: DIAGNOSTICS_ROUTE,
				handler: (_req, res) => {
					const profileDir = resolveProfileDir(config);
					const items = readInstalled(profileDir);
					const patchIds = /* @__PURE__ */ new Map();
					try {
						const text = readFileSync(join(profileDir, "cordis.patch.yml"), "utf8");
						for (const line of text.split(/\r?\n/)) {
							const m = /^\s*-\s*id:\s*['"]?([A-Za-z0-9._/@-]+)/.exec(line);
							if (m !== null) patchIds.set(m[1], (patchIds.get(m[1]) ?? 0) + 1);
						}
					} catch {}
					const duplicates = [...patchIds.entries()].filter(([, count]) => count > 1).map(([id, count]) => ({
						id,
						count
					}));
					const missingOnDisk = items.filter((item) => item.version === null).map((item) => item.name);
					const linkSources = items.filter((item) => item.source === "link" || item.source === "file").map((item) => item.name);
					const disabledRows = [...readUserPatchControls(profileDir).ids].filter((id) => {
						try {
							const text = readFileSync(join(profileDir, "cordis.patch.yml"), "utf8");
							return new RegExp(`-\\s*id:\\s*['"]?${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}['"]?\\s*$[\\s\S]*?disabled:\s*true`).test(text);
						} catch {
							return false;
						}
					});
					json(res, 200, {
						dsh: dshHostInfo(),
						pluginCount: items.length,
						duplicates,
						missingOnDisk,
						linkSources,
						disabledRows,
						hot: listHotMounts()
					});
				}
			});
			return () => {
				stopHost();
				stopConfig();
				stopInstall();
				stopSettings();
				stopFavorite();
				stopNote();
				stopTheme();
				stopLogs();
				stopInstalled();
				stopUninstall();
				stopUpdate();
				stopApproveBuilds();
				stopHealth();
				stopSetupPnpm();
				stopToggle();
				stopGroup();
				stopOrder();
				stopBackup();
				stopSync();
				stopSnapshots();
				stopRestoreSnapshot();
				stopStatus();
				stopRestart();
				stopDiagnostics();
			};
		}, "dsh-plugins-mp: host routes");
	});
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
