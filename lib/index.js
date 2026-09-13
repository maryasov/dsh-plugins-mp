import { defineTool } from "@deepseek-ai/dsh-tools";
import { spawn } from "node:child_process";
import { readFileSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";
//#region src/api.ts
/**
* Marketplace API client (host half). Minimal local mirror of the
* dsh-plugins-mp.com response DTOs — the shared types live in the private
* site repo, the plugin must build standalone.
*/
const DEFAULT_API_BASE = "https://dsh-plugins-mp.com/api";
function resolveApiBase(config) {
	return (config?.apiBase ?? process.env.DSH_MP_API_URL ?? "https://dsh-plugins-mp.com/api").replace(/\/+$/, "");
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
* - POST /plugins/dsh-plugins-mp/install → body { slug, profile, dry? };
*   resolves the install source from the marketplace API and re-invokes the
*   `dsh plugin` CLI (child_process, NOT ctx.shell: the agent shell is a
*   sandboxed executor that denies profile writes — same reasoning as
*   dsh-market). One install at a time.
*/
const HOST_ROUTE = "/plugins/dsh-plugins-mp/host";
const INSTALL_ROUTE = "/plugins/dsh-plugins-mp/install";
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
function runDshPluginAdd(profile, source, timeoutMs = INSTALL_TIMEOUT_MS) {
	const command = `dsh plugin --profile ${profile} add ${source}`;
	return new Promise((resolve) => {
		let output = "";
		let timedOut = false;
		const collect = (buf) => {
			output += buf.toString("utf8");
			if (output.length > MAX_OUTPUT_CHARS) output = output.slice(-2e4);
		};
		let child;
		try {
			child = spawn("dsh", [
				"plugin",
				"--profile",
				profile,
				"add",
				source
			], {
				env: process.env,
				stdio: [
					"ignore",
					"pipe",
					"pipe"
				]
			});
		} catch (error) {
			resolve({
				ok: false,
				code: null,
				command,
				source,
				output: String(error),
				timedOut: false
			});
			return;
		}
		child.stdout?.on("data", collect);
		child.stderr?.on("data", collect);
		const timer = setTimeout(() => {
			timedOut = true;
			child.kill("SIGKILL");
		}, timeoutMs);
		child.on("error", (error) => {
			clearTimeout(timer);
			resolve({
				ok: false,
				code: null,
				command,
				source,
				output: `${output}\n${String(error)}`.trim(),
				timedOut
			});
		});
		child.on("close", (code) => {
			clearTimeout(timer);
			resolve({
				ok: code === 0 && !timedOut,
				code,
				command,
				source,
				output: output.trim(),
				timedOut
			});
		});
	});
}
function mountRoutes(ctx, config = {}) {
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
						json(res, 200, outcome);
					} finally {
						installing = false;
					}
				}
			});
			return () => {
				stopHost();
				stopInstall();
			};
		}, "dsh-plugins-mp: host routes");
	});
}
//#endregion
//#region src/index.ts
/**
* dsh-plugins-mp, node half: model-facing tools over the marketplace API
* (dsh-plugins.vue-z.com). Registered through ctx.tools.register(defineTool)
* per the DSH tool-authoring contract; the plugin stays a thin API adapter —
* no execution, no persistence.
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
function apply(ctx, config = {}) {
	const apiBase = resolveApiBase(config);
	mountRoutes(ctx, config);
	ctx.tools.register(defineTool({
		name: "mp_search",
		description: `Search the DeepSeek Harness plugin marketplace (dsh-plugins.vue-z.com, ${DEFAULT_API_BASE}). Returns name, stars, short description and the exact install command for each match. Use when the user asks to find/discover plugins, or before installing anything.`,
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
	ctx.tools.register(defineTool({
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
	ctx.tools.register(defineTool({
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
	ctx.tools.register(defineTool({
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
	ctx.tools.register(defineTool({
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
}
//#endregion
export { apply, inject, mountRoutes, name };
