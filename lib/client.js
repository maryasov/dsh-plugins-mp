window.__ModuleLoader__.load({
	id: "dsh-plugins-mp",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/index.tsx
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
		const API_BASE = "https://dsh-plugins.vue-z.com/api";
		const HOST_ROUTE = "/plugins/dsh-plugins-mp/host";
		const INSTALL_ROUTE = "/plugins/dsh-plugins-mp/install";
		async function api(path, signal) {
			const res = await fetch(`${API_BASE}${path}`, {
				headers: { accept: "application/json" },
				signal
			});
			if (!res.ok) throw new Error(`${res.status}`);
			return await res.json();
		}
		function installCommandFor(card, profile = "web") {
			return `dsh plugin --profile ${profile} add ${card.npmPackage ?? (card.repoOwner && card.repoName ? `github:${card.repoOwner}/${card.repoName}` : card.slug)}`;
		}
		async function requestInstall(slug, profile) {
			const res = await fetch(INSTALL_ROUTE, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					slug,
					profile
				})
			});
			const body = await res.json().catch(() => ({}));
			if (!res.ok) return {
				ok: false,
				command: "",
				output: "",
				code: null,
				timedOut: false,
				error: String(body.error ?? res.status)
			};
			return body;
		}
		const UI = {
			en: {
				title: "Marketplace",
				search: "Search plugins…",
				copy: "Copy",
				copied: "Copied!",
				similar: "Similar plugins",
				compatibility: "Compatibility",
				current: "current DSH",
				notTested: "not tested",
				works: "works",
				failed: "install failed",
				timeout: "timeout",
				by: "by",
				install: "Install",
				installing: "Installing…",
				installed: "Installed",
				installFailed: "Install failed",
				back: "← Back",
				empty: "Nothing found",
				loadMore: "Load more",
				loading: "Loading…",
				profile: "Profile"
			},
			zh: {
				title: "插件市场",
				search: "搜索插件…",
				copy: "复制",
				copied: "已复制！",
				similar: "相似插件",
				compatibility: "兼容性",
				current: "当前 DSH",
				notTested: "未测试",
				works: "正常",
				failed: "安装失败",
				timeout: "超时",
				by: "作者",
				install: "安装",
				installing: "安装中…",
				installed: "已安装",
				installFailed: "安装失败",
				back: "← 返回",
				empty: "没有找到",
				loadMore: "加载更多",
				loading: "加载中…",
				profile: "配置"
			},
			ru: {
				title: "Маркетплейс",
				search: "Поиск плагинов…",
				copy: "Копировать",
				copied: "Скопировано!",
				similar: "Похожие плагины",
				compatibility: "Совместимость",
				current: "текущий DSH",
				notTested: "не тестировался",
				works: "работает",
				failed: "ошибка установки",
				timeout: "таймаут",
				by: "автор",
				install: "Установить",
				installing: "Установка…",
				installed: "Установлено",
				installFailed: "Ошибка установки",
				back: "← Назад",
				empty: "Ничего не найдено",
				loadMore: "Ещё",
				loading: "Загрузка…",
				profile: "Профиль"
			}
		};
		function uiLang() {
			const nav = typeof navigator !== "undefined" ? navigator.language : "en";
			return UI[nav.startsWith("zh") ? "zh" : nav.startsWith("ru") ? "ru" : "en"];
		}
		const S = {
			root: {
				height: "100%",
				minHeight: 0,
				display: "flex",
				flexDirection: "column",
				background: "var(--dsw-alias-bg-layer-1, transparent)",
				color: "inherit",
				overflow: "hidden",
				fontSize: 13
			},
			header: {
				padding: "10px 12px 8px",
				display: "flex",
				flexDirection: "column",
				gap: 8
			},
			titleRow: {
				display: "flex",
				alignItems: "center",
				gap: 8,
				fontWeight: 600
			},
			hostBadge: {
				marginLeft: "auto",
				fontSize: 11,
				padding: "2px 8px",
				borderRadius: 999,
				border: "1px solid var(--dsw-alias-border, rgba(128,128,128,0.35))",
				opacity: .85,
				whiteSpace: "nowrap"
			},
			search: {
				width: "100%",
				boxSizing: "border-box",
				padding: "6px 10px",
				borderRadius: 6,
				border: "1px solid var(--dsw-alias-border, rgba(128,128,128,0.35))",
				background: "var(--dsw-alias-bg-base, transparent)",
				color: "inherit",
				outline: "none",
				fontSize: 13
			},
			list: {
				flex: 1,
				minHeight: 0,
				overflowY: "auto",
				padding: "2px 12px 14px"
			},
			grid: {
				display: "grid",
				gridTemplateColumns: "repeat(auto-fill, minmax(235px, 1fr))",
				gap: 10
			},
			card: {
				display: "flex",
				flexDirection: "column",
				gap: 6,
				textAlign: "left",
				padding: "10px 12px",
				borderRadius: 10,
				border: "1px solid var(--dsw-alias-border, rgba(128,128,128,0.28))",
				background: "var(--dsw-alias-bg-base, rgba(128,128,128,0.06))",
				color: "inherit",
				cursor: "pointer",
				font: "inherit",
				minHeight: 118
			},
			cardHead: {
				display: "flex",
				gap: 8,
				alignItems: "center"
			},
			avatar: {
				width: 28,
				height: 28,
				flexShrink: 0,
				borderRadius: 8,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				fontSize: 12,
				fontWeight: 700,
				color: "#fff"
			},
			cardName: {
				fontWeight: 600,
				overflow: "hidden",
				textOverflow: "ellipsis",
				whiteSpace: "nowrap"
			},
			cardStars: {
				marginLeft: "auto",
				opacity: .7,
				fontSize: 12,
				whiteSpace: "nowrap"
			},
			desc: {
				opacity: .78,
				fontSize: 12,
				lineHeight: 1.4,
				display: "-webkit-box",
				WebkitLineClamp: 2,
				WebkitBoxOrient: "vertical",
				overflow: "hidden"
			},
			cardFoot: {
				marginTop: "auto",
				display: "flex",
				gap: 6,
				alignItems: "center",
				flexWrap: "wrap"
			},
			badge: {
				display: "inline-block",
				padding: "1px 8px",
				borderRadius: 999,
				border: "1px solid var(--dsw-alias-border, rgba(128,128,128,0.35))",
				fontSize: 11,
				whiteSpace: "nowrap"
			},
			installBtn: {
				marginLeft: "auto",
				border: "1px solid var(--dsw-alias-border, rgba(128,128,128,0.35))",
				borderRadius: 6,
				padding: "3px 10px",
				cursor: "pointer",
				font: "inherit",
				fontSize: 12,
				background: "var(--dsw-alias-bg-layer-1, rgba(128,128,128,0.12))",
				color: "inherit"
			},
			body: {
				flex: 1,
				minHeight: 0,
				overflowY: "auto",
				padding: "0 14px 14px",
				lineHeight: 1.55
			},
			cmd: {
				display: "flex",
				gap: 6,
				alignItems: "center",
				marginTop: 6,
				padding: "6px 8px",
				borderRadius: 6,
				background: "var(--dsw-alias-bg-base, rgba(128,128,128,0.12))",
				border: "1px solid var(--dsw-alias-border, rgba(128,128,128,0.25))",
				fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
				fontSize: 12,
				overflowWrap: "anywhere"
			},
			copyBtn: {
				marginLeft: "auto",
				flexShrink: 0,
				border: "none",
				borderRadius: 5,
				padding: "3px 8px",
				cursor: "pointer",
				font: "inherit",
				fontSize: 11,
				background: "var(--dsw-alias-bg-layer-1, rgba(128,128,128,0.2))",
				color: "inherit"
			},
			bigInstall: {
				border: "1px solid var(--dsw-alias-border, rgba(128,128,128,0.35))",
				borderRadius: 8,
				padding: "6px 16px",
				cursor: "pointer",
				font: "inherit",
				fontWeight: 600,
				background: "var(--dsw-alias-bg-layer-1, rgba(128,128,128,0.12))",
				color: "inherit"
			},
			select: {
				border: "1px solid var(--dsw-alias-border, rgba(128,128,128,0.35))",
				borderRadius: 6,
				padding: "4px 6px",
				font: "inherit",
				fontSize: 12,
				background: "var(--dsw-alias-bg-base, transparent)",
				color: "inherit"
			},
			muted: {
				opacity: .65,
				fontSize: 12
			},
			backBtn: {
				border: "none",
				background: "transparent",
				color: "inherit",
				cursor: "pointer",
				font: "inherit",
				fontSize: 13,
				padding: "4px 0",
				textAlign: "left"
			},
			pre: {
				background: "var(--dsw-alias-bg-base, rgba(128,128,128,0.12))",
				border: "1px solid var(--dsw-alias-border, rgba(128,128,128,0.25))",
				borderRadius: 6,
				padding: "8px 10px",
				overflowX: "auto",
				fontSize: 12,
				fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
			},
			code: {
				background: "var(--dsw-alias-bg-base, rgba(128,128,128,0.14))",
				borderRadius: 4,
				padding: "0 4px",
				fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
				fontSize: 12
			},
			out: {
				background: "var(--dsw-alias-bg-base, rgba(128,128,128,0.12))",
				borderRadius: 6,
				padding: "8px 10px",
				fontSize: 11,
				fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
				whiteSpace: "pre-wrap",
				overflowWrap: "anywhere",
				maxHeight: 180,
				overflowY: "auto"
			},
			err: {
				color: "#e05252",
				fontSize: 12
			}
		};
		const BADGE_TONE = {
			passed: {
				background: "rgba(58,160,96,0.16)",
				borderColor: "rgba(58,160,96,0.5)"
			},
			failed: {
				background: "rgba(224,82,82,0.14)",
				borderColor: "rgba(224,82,82,0.5)"
			},
			error: {
				background: "rgba(224,82,82,0.14)",
				borderColor: "rgba(224,82,82,0.5)"
			},
			timeout: {
				background: "rgba(224,160,60,0.16)",
				borderColor: "rgba(224,160,60,0.55)"
			},
			unknown: { opacity: .7 }
		};
		const STATUS_KEY = {
			passed: "works",
			failed: "failed",
			error: "failed",
			timeout: "timeout"
		};
		const AVATAR_COLORS = [
			"#4f7cc9",
			"#5aa06c",
			"#b06fc9",
			"#c98a4f",
			"#c94f6d",
			"#4fb0c9",
			"#8a8a8a"
		];
		function avatarStyle(name) {
			let hash = 0;
			for (let i = 0; i < name.length; i++) hash = hash * 31 + name.charCodeAt(i) | 0;
			return {
				...S.avatar,
				background: AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
			};
		}
		function inlineMd(text, key) {
			const out = [];
			const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(!?\[[^\]]*\]\([^)]+\))/g;
			let last = 0;
			let m;
			let i = 0;
			while ((m = re.exec(text)) !== null) {
				if (m.index > last) out.push(text.slice(last, m.index));
				const token = m[0];
				const k = `${key}-${i++}`;
				if (token.startsWith("`")) out.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", {
					style: S.code,
					children: token.slice(1, -1)
				}, k));
				else if (token.startsWith("**")) out.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: token.slice(2, -2) }, k));
				else if (token.startsWith("!")) {
					const mm = /\[([^\]]*)\]\(([^)]+)\)/.exec(token.slice(1));
					out.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
						href: mm?.[2] ?? "#",
						target: "_blank",
						rel: "noreferrer",
						children: mm?.[1] ?? "image"
					}, k));
				} else {
					const mm = /\[([^\]]*)\]\(([^)]+)\)/.exec(token);
					out.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
						href: mm?.[2] ?? "#",
						target: "_blank",
						rel: "noreferrer",
						children: mm?.[1] ?? token
					}, k));
				}
				last = m.index + token.length;
			}
			if (last < text.length) out.push(text.slice(last));
			return out;
		}
		function Markdown(props) {
			const lines = props.source.split(/\r?\n/);
			const blocks = [];
			let para = [];
			let list = [];
			let code = null;
			const flushPara = (key) => {
				if (para.length > 0) {
					blocks.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						style: { margin: "6px 0" },
						children: inlineMd(para.join(" "), key)
					}, key));
					para = [];
				}
			};
			const flushList = (key) => {
				if (list.length > 0) {
					blocks.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
						style: {
							margin: "6px 0",
							paddingLeft: 20
						},
						children: list.map((li, j) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", { children: inlineMd(li, `${key}-${j}`) }, j))
					}, key));
					list = [];
				}
			};
			for (let i = 0; i < lines.length; i++) {
				const line = lines[i];
				if (line.trim().startsWith("```")) {
					flushPara(`p${i}`);
					flushList(`l${i}`);
					if (code === null) code = [];
					else {
						blocks.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
							style: S.pre,
							children: code.join("\n")
						}, `c${i}`));
						code = null;
					}
					continue;
				}
				if (code !== null) {
					code.push(line);
					continue;
				}
				const heading = /^#{1,4}\s+(.*)$/.exec(line);
				if (heading !== null) {
					flushPara(`p${i}`);
					flushList(`l${i}`);
					blocks.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: {
							fontWeight: 700,
							margin: "12px 0 4px"
						},
						children: inlineMd(heading[1], `h${i}`)
					}, `h${i}`));
					continue;
				}
				const li = /^\s*[-*+]\s+(.*)$/.exec(line);
				if (li !== null) {
					flushPara(`p${i}`);
					list.push(li[1]);
					continue;
				}
				if (line.trim() === "") {
					flushPara(`p${i}`);
					flushList(`l${i}`);
					continue;
				}
				para.push(line);
			}
			flushPara("pend");
			flushList("lend");
			if (code !== null) blocks.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
				style: S.pre,
				children: code.join("\n")
			}, "cend"));
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children: blocks });
		}
		function InstallButton(props) {
			const t = uiLang();
			const [state, setState] = (0, react.useState)({ phase: "idle" });
			const profile = props.profile ?? "web";
			const start = () => {
				if (state.phase === "busy") return;
				setState({ phase: "busy" });
				requestInstall(props.slug, profile).then((r) => {
					if (r.ok) setState({ phase: "done" });
					else setState({
						phase: "error",
						message: r.error ?? `exit ${String(r.code)}`,
						output: r.output
					});
				}).catch((e) => setState({
					phase: "error",
					message: String(e),
					output: ""
				}));
			};
			const label = state.phase === "busy" ? t.installing : state.phase === "done" ? `✓ ${t.installed}` : state.phase === "error" ? t.installFailed : t.install;
			if (props.compact) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
				style: {
					...S.installBtn,
					...state.phase === "done" ? BADGE_TONE.passed : {},
					...state.phase === "error" ? BADGE_TONE.failed : {}
				},
				onClick: (e) => {
					e.stopPropagation();
					start();
				},
				disabled: state.phase === "busy",
				title: state.phase === "error" ? state.message : void 0,
				children: label
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
				style: S.bigInstall,
				onClick: start,
				disabled: state.phase === "busy",
				children: label
			}), state.phase === "error" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: { marginTop: 8 },
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					style: S.err,
					children: state.message
				}), state.output !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
					style: S.out,
					children: state.output
				})]
			})] });
		}
		function compatBadge(card, dshVersion, t) {
			if (dshVersion === null) return null;
			const status = card.compat?.[dshVersion];
			if (status === void 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
				style: {
					...S.badge,
					...BADGE_TONE.unknown
				},
				children: [
					"DSH ",
					dshVersion,
					": ",
					t.notTested
				]
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
				style: {
					...S.badge,
					...BADGE_TONE[status]
				},
				children: [
					"DSH ",
					dshVersion,
					": ",
					t[STATUS_KEY[status] ?? "notTested"]
				]
			});
		}
		function Card(props) {
			const t = uiLang();
			const c = props.card;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
				style: S.card,
				onClick: props.onOpen,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						style: S.cardHead,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								style: avatarStyle(c.authorName ?? c.slug),
								children: (c.displayName || c.slug).slice(0, 1).toUpperCase()
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								style: S.cardName,
								children: c.displayName
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								style: S.cardStars,
								children: ["★ ", c.stars]
							})
						]
					}),
					c.shortDescription !== null && c.shortDescription !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						style: S.desc,
						children: c.shortDescription
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						style: S.cardFoot,
						children: [compatBadge(c, props.dshVersion, t), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(InstallButton, {
							slug: c.slug,
							compact: true
						})]
					})
				]
			});
		}
		function CatalogView(props) {
			const t = uiLang();
			const [query, setQuery] = (0, react.useState)("");
			const [items, setItems] = (0, react.useState)([]);
			const [total, setTotal] = (0, react.useState)(0);
			const [page, setPage] = (0, react.useState)(1);
			const [loading, setLoading] = (0, react.useState)(true);
			const [slug, setSlug] = (0, react.useState)(null);
			const [dshVersion, setDshVersion] = (0, react.useState)(null);
			(0, react.useEffect)(() => {
				fetch(HOST_ROUTE).then((r) => r.ok ? r.json() : null).then((d) => {
					const v = d?.dsh?.version;
					setDshVersion(v !== void 0 && v !== "unknown" ? v : null);
				}).catch(() => {});
			}, []);
			const load = (q, nextPage, replace) => {
				const ctrl = new AbortController();
				setLoading(true);
				const usp = new URLSearchParams({
					limit: "25",
					page: String(nextPage),
					installable: "1"
				});
				if (q !== "") usp.set("q", q);
				api(`/plugins?${usp.toString()}`, ctrl.signal).then((d) => {
					setItems((prev) => replace ? d.items : [...prev, ...d.items]);
					setTotal(d.total);
					setPage(nextPage);
				}).catch(() => {}).finally(() => setLoading(false));
				return () => ctrl.abort();
			};
			(0, react.useEffect)(() => {
				if (slug !== null) return;
				return load(query, 1, true);
			}, [slug]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				style: S.root,
				children: slug !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(DetailView, {
					slug,
					dshVersion,
					onBack: () => setSlug(null),
					onOpenSlug: (s) => setSlug(s)
				}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					style: S.header,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: S.titleRow,
						children: [
							"🧩 ",
							t.title,
							dshVersion !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								style: S.hostBadge,
								children: ["DSH ", dshVersion]
							})
						]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("form", {
						onSubmit: (e) => {
							e.preventDefault();
							load(query, 1, true);
						},
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							style: S.search,
							value: query,
							placeholder: t.search,
							onChange: (e) => setQuery(e.target.value)
						})
					})]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					style: S.list,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: S.grid,
							children: items.map((c) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Card, {
								card: c,
								dshVersion,
								onOpen: () => setSlug(c.slug)
							}, c.slug))
						}),
						loading && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: {
								...S.muted,
								padding: "8px 2px"
							},
							children: t.loading
						}),
						!loading && items.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: {
								...S.muted,
								padding: "8px 2px"
							},
							children: t.empty
						}),
						!loading && items.length < total && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							style: {
								...S.installBtn,
								marginLeft: 0,
								marginTop: 10
							},
							onClick: () => load(query, page + 1, false),
							children: [
								t.loadMore,
								" (",
								items.length,
								"/",
								total,
								")"
							]
						})
					]
				})] })
			});
		}
		function DetailView(props) {
			const t = uiLang();
			const [detail, setDetail] = (0, react.useState)(null);
			const [error, setError] = (0, react.useState)(null);
			const [copied, setCopied] = (0, react.useState)(false);
			const [profile, setProfile] = (0, react.useState)("web");
			(0, react.useEffect)(() => {
				const ctrl = new AbortController();
				setDetail(null);
				setError(null);
				api(`/plugins/${encodeURIComponent(props.slug)}`, ctrl.signal).then(setDetail).catch((e) => {
					if (!ctrl.signal.aborted) setError(String(e));
				});
				return () => ctrl.abort();
			}, [props.slug]);
			if (error !== null) return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: S.body,
				children: [
					t.empty,
					" (",
					error,
					")"
				]
			});
			if (detail === null) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				style: S.body,
				children: t.loading
			});
			const p = detail.plugin;
			const cmd = installCommandFor(p, profile);
			const tr = p.translations.find((x) => x.kind === "description" && !x.isMachine) ?? p.translations.find((x) => x.kind === "description");
			const desc = tr?.textMd !== void 0 && tr.textMd !== "" ? tr.textMd : p.descriptionMd;
			const runs = detail.versions[0]?.testRuns ?? [];
			const currentRun = props.dshVersion !== null ? runs.find((r) => r.dshRelease === props.dshVersion) : void 0;
			const otherRuns = runs.filter((r) => r.dshRelease !== props.dshVersion);
			const similar = detail.similar;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: {
					height: "100%",
					display: "flex",
					flexDirection: "column",
					minHeight: 0
				},
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					style: S.header,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							style: S.backBtn,
							onClick: props.onBack,
							children: t.back
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: {
								...S.titleRow,
								gap: 10
							},
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									style: avatarStyle(p.authorName ?? p.slug),
									children: (p.displayName || p.slug).slice(0, 1).toUpperCase()
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									style: { fontSize: 15 },
									children: p.displayName
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									style: S.cardStars,
									children: ["★ ", p.stars]
								})
							]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: S.muted,
							children: [
								p.authorName !== null ? `${t.by}: ${p.authorName} · ` : "",
								p.latestVersion ?? "",
								p.license !== null ? ` · ${p.license}` : ""
							]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: {
								display: "flex",
								gap: 8,
								alignItems: "center",
								flexWrap: "wrap"
							},
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(InstallButton, {
								slug: p.slug,
								profile
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
								style: S.select,
								value: profile,
								onChange: (e) => setProfile(e.target.value),
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
										value: "web",
										children: "web"
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
										value: "tui",
										children: "tui"
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
										value: "agent",
										children: "agent"
									})
								]
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: S.cmd,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: cmd }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								style: S.copyBtn,
								onClick: () => {
									navigator.clipboard?.writeText(cmd).then(() => {
										setCopied(true);
										setTimeout(() => setCopied(false), 1500);
									});
								},
								children: copied ? t.copied : t.copy
							})]
						}),
						p.deprecatedReason !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: S.err,
							children: p.deprecatedReason
						})
					]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					style: S.body,
					children: [
						props.dshVersion !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: { marginBottom: 10 },
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									style: S.muted,
									children: [
										t.compatibility,
										" — DSH ",
										props.dshVersion,
										" (",
										t.current,
										")"
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									style: {
										...S.badge,
										...BADGE_TONE[currentRun?.status ?? "unknown"]
									},
									children: [
										"DSH ",
										props.dshVersion,
										":",
										" ",
										currentRun === void 0 ? t.notTested : t[STATUS_KEY[currentRun.status] ?? "notTested"]
									]
								}),
								otherRuns.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									style: {
										...S.badge,
										...BADGE_TONE.unknown,
										marginLeft: 6
									},
									children: otherRuns.map((r) => `${r.dshRelease}: ${t[STATUS_KEY[r.status] ?? "notTested"]}`).join(" · ")
								})
							]
						}),
						desc !== "" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Markdown, { source: desc }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: S.muted,
							children: t.empty
						}),
						similar.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: { marginTop: 16 },
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								style: S.muted,
								children: t.similar
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								style: {
									...S.grid,
									marginTop: 8
								},
								children: similar.map((c) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Card, {
									card: c,
									dshVersion: null,
									onOpen: () => props.onOpenSlug(c.slug)
								}, c.slug))
							})]
						})
					]
				})]
			});
		}
		function apply(ctx) {
			ctx.plugin({
				inject: ["betterSidebar"],
				apply(sidebarCtx) {
					const sidebar = sidebarCtx.betterSidebar;
					ctx.effect(() => sidebar.registerTab({
						id: "dsh-plugins-mp:catalog",
						title: () => uiLang().title,
						description: () => "dsh-plugins.vue-z.com",
						order: 55,
						single: true,
						component: (tabProps) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(CatalogView, { ...tabProps })
					}), "dsh-plugins-mp: catalog tab");
				}
			});
		}
		//#endregion
		exports.API_BASE = API_BASE;
		exports.apply = apply;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map