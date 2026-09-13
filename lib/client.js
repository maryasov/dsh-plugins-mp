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
		* dsh-plugins-mp, browser half: a marketplace catalog tab for DSH.
		*
		* Soft integration with dsh-better-sidebar (omdsh-dev): its client half
		* publishes ctx.betterSidebar (registerTab). We restate the minimal contract
		* here instead of value-importing the package, and mount the tab through a
		* child fiber with inject: ['betterSidebar'] (the cordis dynamic pattern) —
		* it activates whenever the service lands and never blocks web boot on hosts
		* without better-sidebar.
		*/
		const API_BASE = "https://dsh-plugins.vue-z.com/api";
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
		const UI = {
			en: {
				title: "Marketplace",
				search: "Search plugins…",
				install: "Install",
				copy: "Copy",
				copied: "Copied!",
				similar: "Similar",
				compatibility: "Compatibility",
				back: "← Back",
				empty: "Nothing found",
				loadMore: "Load more",
				loading: "Loading…",
				works: "works",
				failed: "install failed",
				timeout: "timeout",
				by: "by"
			},
			zh: {
				title: "插件市场",
				search: "搜索插件…",
				install: "安装",
				copy: "复制",
				copied: "已复制！",
				similar: "相似插件",
				compatibility: "兼容性",
				back: "← 返回",
				empty: "没有找到",
				loadMore: "加载更多",
				loading: "加载中…",
				works: "正常",
				failed: "安装失败",
				timeout: "超时",
				by: "作者"
			},
			ru: {
				title: "Маркетплейс",
				search: "Поиск плагинов…",
				install: "Установка",
				copy: "Копировать",
				copied: "Скопировано!",
				similar: "Похожие",
				compatibility: "Совместимость",
				back: "← Назад",
				empty: "Ничего не найдено",
				loadMore: "Ещё",
				loading: "Загрузка…",
				works: "работает",
				failed: "ошибка установки",
				timeout: "таймаут",
				by: "автор"
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
				overflow: "hidden"
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
				padding: "0 8px 12px"
			},
			item: {
				display: "block",
				width: "100%",
				textAlign: "left",
				padding: "8px 10px",
				borderRadius: 8,
				border: "none",
				background: "transparent",
				color: "inherit",
				cursor: "pointer",
				font: "inherit"
			},
			itemHead: {
				display: "flex",
				justifyContent: "space-between",
				gap: 8,
				alignItems: "baseline"
			},
			name: {
				fontWeight: 600,
				fontSize: 13
			},
			stars: {
				opacity: .7,
				fontSize: 12,
				whiteSpace: "nowrap"
			},
			desc: {
				opacity: .75,
				fontSize: 12,
				marginTop: 2
			},
			body: {
				flex: 1,
				minHeight: 0,
				overflowY: "auto",
				padding: "0 12px 12px",
				fontSize: 13,
				lineHeight: 1.5
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
			badge: {
				display: "inline-block",
				marginRight: 6,
				padding: "1px 7px",
				borderRadius: 999,
				border: "1px solid var(--dsw-alias-border, rgba(128,128,128,0.35))",
				fontSize: 11,
				opacity: .9
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
			}
		};
		const STATUS_LABEL = {
			passed: "works",
			failed: "failed",
			error: "failed",
			timeout: "timeout"
		};
		function CatalogItem(props) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
				style: S.item,
				onClick: props.onOpen,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
					style: S.itemHead,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						style: S.name,
						children: props.card.displayName
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						style: S.stars,
						children: ["★ ", props.card.stars]
					})]
				}), props.card.shortDescription && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					style: S.desc,
					children: props.card.shortDescription
				})]
			});
		}
		function DetailView(props) {
			const t = uiLang();
			const [detail, setDetail] = (0, react.useState)(null);
			const [error, setError] = (0, react.useState)(null);
			const [copied, setCopied] = (0, react.useState)(false);
			(0, react.useEffect)(() => {
				const ctrl = new AbortController();
				setDetail(null);
				setError(null);
				api(`/plugins/${encodeURIComponent(props.slug)}`, ctrl.signal).then(setDetail).catch((e) => {
					if (!ctrl.signal.aborted) setError(String(e));
				});
				return () => ctrl.abort();
			}, [props.slug]);
			if (error) return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: S.body,
				children: [
					t.empty,
					" (",
					error,
					")"
				]
			});
			if (!detail) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				style: S.body,
				children: t.loading
			});
			const p = detail.plugin;
			const cmd = installCommandFor(p);
			const desc = (p.translations.find((x) => x.kind === "description" && !x.isMachine) ?? p.translations.find((x) => x.kind === "description"))?.textMd || p.descriptionMd;
			const runs = detail.versions[0]?.testRuns ?? [];
			const similar = detail.similar.length > 0 ? detail.similar : [];
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: S.header,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						style: S.backBtn,
						onClick: props.onBack,
						children: t.back
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: S.titleRow,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: p.displayName }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							style: S.stars,
							children: ["★ ", p.stars]
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: S.muted,
						children: [p.authorName ? `${t.by}: ${p.authorName} · ` : "", p.latestVersion ?? ""]
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
					})
				]
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: S.body,
				children: [
					runs.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: { marginBottom: 10 },
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: S.muted,
							children: t.compatibility
						}), runs.map((r) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							style: S.badge,
							children: [
								"DSH ",
								r.dshRelease,
								": ",
								t[STATUS_LABEL[r.status]]
							]
						}, `${r.dshRelease}-${r.profile}`))]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: { whiteSpace: "pre-wrap" },
						children: desc
					}),
					similar.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: { marginTop: 14 },
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: S.muted,
							children: t.similar
						}), similar.map((c) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(CatalogItem, {
							card: c,
							onOpen: () => props.onOpenSlug(c.slug)
						}, c.slug))]
					})
				]
			})] });
		}
		function CatalogView(props) {
			const t = uiLang();
			const [query, setQuery] = (0, react.useState)("");
			const [items, setItems] = (0, react.useState)([]);
			const [total, setTotal] = (0, react.useState)(0);
			const [page, setPage] = (0, react.useState)(1);
			const [loading, setLoading] = (0, react.useState)(false);
			const [slug, setSlug] = (0, react.useState)(null);
			const load = (q, page, replace) => {
				const ctrl = new AbortController();
				setLoading(true);
				const usp = new URLSearchParams({
					limit: "25",
					page: String(page)
				});
				if (q) usp.set("q", q);
				usp.set("installable", "1");
				api(`/plugins?${usp.toString()}`, ctrl.signal).then((d) => {
					setItems((prev) => replace ? d.items : [...prev, ...d.items]);
					setTotal(d.total);
					setPage(page);
				}).catch(() => {}).finally(() => setLoading(false));
				return () => ctrl.abort();
			};
			(0, react.useEffect)(() => {
				if (slug) return;
				return load(query, 1, true);
			}, [slug]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				style: S.root,
				children: slug ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(DetailView, {
					slug,
					onBack: () => setSlug(null),
					onOpenSlug: (s) => setSlug(s)
				}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					style: S.header,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: S.titleRow,
						children: ["🧩 ", t.title]
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
						items.map((c) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(CatalogItem, {
							card: c,
							onOpen: () => setSlug(c.slug)
						}, c.slug)),
						loading && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: {
								...S.muted,
								padding: "8px 10px"
							},
							children: t.loading
						}),
						!loading && items.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: {
								...S.muted,
								padding: "8px 10px"
							},
							children: t.empty
						}),
						!loading && items.length < total && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							style: {
								...S.item,
								opacity: .8
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