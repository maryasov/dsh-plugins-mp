window.__ModuleLoader__.load({
	id: "dsh-plugins-mp",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_dom = require("react-dom");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/brand.tsx
		const LOGO = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNNzUuODQgMjE5LjFjLTcuODYtLjA5LTE3Ljc1LjU5LTI5LjI4IDIuMDQtMTIuNyAxLjYtMjcuMDcgNC0yNy40MyA0LjU2LS4xMy4yMS0uMjQgNDYuMS0uMjUgMTAyIDAgNzguNi4wOSAxMDEuNy4zOCAxMDJzMjMuMjguMzggMTAxLjUyLjM3YzU1LjYzIDAgMTAxLjMzLS4xMiAxMDEuNTctLjI3LjM1LS4yMi4xOS0xLjczLS44Ny04LjI0YTQ2OCA0NjggMCAwIDEtNC4yNi0zMi43NmMtLjUzLTUuODQtLjU0LTIxLjc2LS4wMS0yNS4zMyAyLjA2LTEzLjk5IDguMzctMTguOSAxOC4zNi0xNC4yNy45NC40MyAzLjc2IDIuMTYgNi4yNiAzLjg0IDQuOTMgMy4zIDcuNjUgNC41NyAxMC43NCA1IDQuMDcuNTggNy4yMy0uNTIgMTAuMzMtMy42MiAzLjMzLTMuMzIgNS44LTguNzMgNy4yNC0xNS45MS42My0zLjEzLjczLTQuNi43My0xMC42NyAwLTYuMDEtLjEtNy41Ni0uNzEtMTAuNTctMS40NC03LjEtMy42NC0xMi4xNS02Ljg1LTE1LjY0YTEyIDEyIDAgMCAwLTcuMDMtNC4wNmMtMy43Mi0uNzUtOS4xNCAxLjE1LTE0LjYgNS4wOS0xMC41IDcuNTktMTcuODggNy4yNS0yMS44Mi0xLjAyLTIuMTYtNC41Mi0yLjg1LTguNDUtMy4xMi0xNy42NC0uMzUtMTIuMTYgMS4wNi0yNy4wNiA0Ljc1LTQ5Ljk5Ljc1LTQuNjIgMS4yNy04LjQ4IDEuMTYtOC41OS0uMzEtLjMtOC4yOC0xLjY0LTE4Ljk3LTMuMTctMzIuNi00LjY3LTUyLjE5LTQuMTYtNTcuMjggMS40Ny0xLjMgMS40NS0xLjU2IDIuMy0xLjM4IDQuNTVzMS42MiA1LjIyIDQuNTMgOS40MmMyLjk0IDQuMjYgNC41NSA3LjQzIDUuMzUgMTAuNTYgMi42MyAxMC4yOC0zLjMzIDE4LjU3LTE2LjM0IDIyLjcyLTE1LjI1IDQuODgtMzUuNiAyLjQ5LTQ1LjMtNS4zYTIwIDIwIDAgMCAxLTUuNjEtNy4zM2MtMS4wNy0yLjY5LTEuMDgtNy45Ni0uMDItMTEuMTRhMzcgMzcgMCAwIDEgNS4xNC05LjU1YzMuNDMtNC43NSA1LTguNzIgNC41MS0xMS4zOC0uMzYtMi4wMi0xLjQxLTMuMS00LjM4LTQuNTUtMy4zOC0xLjY0LTkuMi0yLjUxLTE3LjA2LTIuNjEiIHN0eWxlPSJmaWxsOiNiM2IzYjMiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0xLjEgLTEpc2NhbGUoLjA1ODIpIi8+PHBhdGggZD0iTTMyOS40NCAxNzguMDljLTYuMDEgMC03LjU2LjEtMTAuNTcuNy03LjA2IDEuNDQtMTIuMTUgMy42NS0xNS42IDYuODEtMi4zNSAyLjE2LTMuNTQgNC4xOS00LjA4IDYuOTMtLjc2IDMuOSAxLjA2IDkuMiA1LjA3IDE0Ljc1IDkuODUgMTMuNjMgNi4zOCAyMS44Mi0xMC4zNCAyNC40Ny0zLjg3LjYyLTIwLjM3LjUtMjcuMzYtLjE4YTU0NCA1NDQgMCAwIDEtMzUuOTEtNC45Yy0xLjg2LS4zLTMuNDctLjQ2LTMuNjItLjM2LS4zMi4zMS0xLjY1IDguMjgtMy4xOCAxOC45Ny00LjY3IDMyLjYtNC4xNyA1Mi4xOSAxLjQ3IDU3LjI4IDEuNDUgMS4zIDIuMyAxLjU2IDQuNTUgMS4zOHM1LjIyLTEuNjIgOS40Mi00LjUzYzQuMjYtMi45NCA3LjQzLTQuNTUgMTAuNTYtNS4zNSAxMC4yOC0yLjYzIDE4LjU3IDMuMzMgMjIuNzIgMTYuMzQgNC4xNSAxMi45NyAzLjEgMzAuMTktMi41IDQwLjkzLTIuNDggNC43Ni02LjIgOC40My0xMC4xNiAxMC0yLjY2IDEuMDUtNy45NCAxLjA1LTExLjEgMGEzNyAzNyAwIDAgMS05LjU2LTUuMTRjLTQuNzgtMy40NS04Ljk4LTUuMS0xMS41My00LjUyLTEuOTMuNDQtMyAxLjUtNC40IDQuNC0zLjIgNi41OS0zLjQ4IDIzLjIzLS43NSA0NS4wNSAxLjYgMTIuNjcgNC4xNiAyOC4zNSA0LjcxIDI4LjcuMjIuMTQgNDYuMTMuMjUgMTAyLjAyLjI1IDc4LjYxIDAgMTAxLjctLjA4IDEwMi0uMzcuMy0uMy4zOC0yMy4yOC4zOC0xMDEuNTIgMC01NS42My0uMTMtMTAxLjMzLS4yOC0xMDEuNTctLjIyLS4zNS0xLjczLS4xOS04LjI0Ljg3YTQ2OCA0NjggMCAwIDEtMzIuNiA0LjI1Yy01LjYyLjU0LTIxLjkxLjU1LTI1LjQ5LjAyLTEyLjctMS44Ny0xNy44Ni03LjE1LTE1LjI4LTE1LjY0LjgtMi42NyAxLjc1LTQuMzkgNS4yLTkuNSAzLjk0LTUuODUgNS4yMy05LjY2IDQuNjYtMTMuODEtLjM0LTIuNTMtMS40MS00LjUyLTMuNjMtNi43NC0zLjMyLTMuMzMtOC43My01LjgtMTUuOTEtNy4yNC0zLjEzLS42My00LjYtLjczLTEwLjY3LS43M00xMjAuNzggMTcuMjljLTc4LjI0IDAtMTAxLjIyLjA4LTEwMS41Mi4zNy0uMy4zLS4zOCAyMy4yOC0uMzggMTAxLjUyIDAgNTUuNjMuMTMgMTAxLjMzLjI4IDEwMS41Ny4yMi4zNSAxLjczLjE5IDguMjQtLjg3YTQ2OCA0NjggMCAwIDEgMzIuNi00LjI1YzUuNjItLjU0IDIxLjkxLS41NSAyNS40OS0uMDIgMTIuNyAxLjg3IDE3Ljg2IDcuMTUgMTUuMjggMTUuNjQtLjggMi42Ny0xLjc1IDQuMzktNS4yIDkuNS0zLjk0IDUuODUtNS4yMyA5LjY2LTQuNjYgMTMuODEuMzQgMi41MyAxLjQxIDQuNTIgMy42MyA2Ljc0IDMuMzMgMy4zNCA4LjkzIDUuODggMTUuNzUgNy4xNiA0Ljk4LjkyIDUuMDguOTMgMTIuMTEuOCA0Ljg0LS4wOCA3LjE4LS4yNiA5LjU4LS43NnExMC4yMy0yLjEgMTUuMy02LjczYzYtNS41MSA1LjY2LTEyLjctMS4wNy0yMS44LTIuMS0yLjgzLTQuMy03LjA3LTQuOTEtOS40LTIuMS04LjA3IDIuOTUtMTMgMTUuMzQtMTQuOTYgMy44Ny0uNjIgMjAuMzctLjUgMjcuMzYuMThhNTQxIDU0MSAwIDAgMSAzNS41IDQuODVjMS41LjI2IDIuODIuMzYgMi45Ni4yMy4xMy0uMTQtLjExLTIuMzMtLjU1LTQuODgtMi4zMy0xMy42Mi00LjMtMjkuNTUtNC45OC00MC4zMS0uNC02LjM3LS4yMy0xNy4yNi4zNC0yMC45NiAxLjU2LTEwLjIgNS41Ny0xNS41MiAxMS42OC0xNS41MiAzLjI0IDAgNy45MSAyLjAyIDEyLjczIDUuNSA1LjQ2IDMuOTQgMTAuODggNS44NCAxNC42IDUuMSA2Ljg0LTEuMzcgMTEuNTItOC4wMiAxMy44OC0xOS43MS42LTMuMDEuNzEtNC41Ni43MS0xMC41NyAwLTYuMDctLjEtNy41NC0uNzMtMTAuNjctMS40NS03LjE4LTMuOS0xMi41OS03LjI0LTE1LjktMy4xLTMuMS02LjI2LTQuMjEtMTAuMzMtMy42NC0zLjA5LjQ0LTUuODEgMS43LTEwLjc0IDUuMDFhNzIgNzIgMCAwIDEtNi4yNiAzLjg0Yy05Ljk5IDQuNjMtMTYuMy0uMjgtMTguMzYtMTQuMjctLjUzLTMuNTctLjUyLTE5LjUuMDEtMjUuMzNhNDY4IDQ2OCAwIDAgMSA0LjI2LTMyLjc2YzEuMDYtNi41IDEuMjItOC4wMi44Ny04LjI0LS4yNC0uMTUtNDUuOTQtLjI3LTEwMS41Ny0uMjciIHN0eWxlPSJmaWxsOiM2NjYiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0xLjEgLTEpc2NhbGUoLjA1ODIpIi8+PHBhdGggZD0iTTEyLjY4IDExLjU4cS0uMjEuMDItLjIzLjIzLjAyLjIxLjIzLjIzYS4yMy4yMyAwIDEgMCAwLS40NiIgY2xhc3M9InN0MCIgc3R5bGU9ImRpc3BsYXk6aW5saW5lO2ZpbGw6I2ZmZjtzdHJva2Utd2lkdGg6LjMyMDI3MSIvPjxwYXRoIGQ9Ik0xMi44MiAxMC42NXEtLjE1LjAxLS4zMS4xbC0uMTQuMTVjLS4wNy4xMyAwIC4yMy4wOC4yN3EuMDguMDUuMi4wNi4zLS4wMi41LjE1LjI3LjIuMTkuNTRhMSAxIDAgMCAwLS4wMi40NWMuMDcuMy4yMS40LjQyLjU2LjEzLjExLjM3LjIuNi4ycS4yMS0uMDIuNDQtLjEzLjI2LS4xMS4xOS0uMzMtLjEzLS4zNS0uMzQtLjY0Yy0uMTYtLjI1LS4yMi0uMzUtLjUxLS42OS0uMjktLjI4LS40OS0uNDctLjc1LS41OGExIDEgMCAwIDAtLjU1LS4xTTUuMTMgMTAuMTJxLS4yOSAwLS41Ny4wN2MtLjI5LjA1LS4zNy4xNS0uMzYuNDRxLjEgMS44Ljk4IDMuMzZhNi41IDYuNSAwIDAgMCAyLjQ3IDIuNDhjLjA0LjAyLjkyLjQ0IDEuNDIuMTMuMjMtLjE0LjE3LS4zMy4wOS0uNDZhMiAyIDAgMCAxLS4yOC0uNTVjLS4wNi0uMjItLjEyLS41NS4xOC0uNTcuMzEtLjAyIDEuMDcuMzkgMi42NCAxLjYyLjY4LjU0IDEuNjkuNTIgMi4yOS40NnEtLjI5LS4xOS0uNjctLjUxYTEwIDEwIDAgMCAxLTEuODYtMi4xOWMtLjUtLjc1LTEtMS41Mi0xLjY1LTIuMTZhNyA3IDAgMCAwLTQuMS0yLjA4IDMgMyAwIDAgMC0uNTgtLjA0IiBjbGFzcz0ic3QwIiBzdHlsZT0iZGlzcGxheTppbmxpbmU7ZmlsbDojZmZmO3N0cm9rZS13aWR0aDouMzIwMjcxIi8+PHBhdGggZD0iTTIwLjgyIDYuNWMtLjE5LS4xLS4yNy4wOC0uMzguMTdsLS4xLjFjLS4yOC4zLS42LjUtMS4wMy40OGEyIDIgMCAwIDAtMS42My42M2MtLjEtLjU4LS40My0uOTMtLjkzLTEuMTYtLjI3LS4xMi0uNTMtLjIzLS43Mi0uNDktLjEzLS4xOC0uMTYtLjM4LS4yMy0uNTgtLjA0LS4xMi0uMDgtLjI0LS4yMi0uMjZzLS4yLjEtLjI2LjJxLS4zNS42Ny0uMzIgMS4zOWEzIDMgMCAwIDAgMS4zOCAyLjU0cS4xNS4xLjEuMjRsLS4yLjYzYy0uMDUuMTMtLjEuMTYtLjI1LjFxLS43NS0uMy0xLjMtLjg4Yy0uNjUtLjYyLTEuMjMtMS4zLTEuOTUtMS44NGwtLjUyLS4zNmMtLjc0LS43MS4xLTEuMy4zLTEuMzdzLjA2LS4zMy0uNi0uMzNjLS42NCAwLTEuMjQuMjMtMiAuNTJsLS4zNi4xYTcgNyAwIDAgMC0yLjE2LS4wOCA0LjcgNC43IDAgMCAwLTMuMzcgMS45NyA1LjggNS44IDAgMCAwLS45NCA0LjU2IDcgNyAwIDAgMCAyLjUxIDQuMjRxMi4xIDEuNzQgNC44MyAxLjZhNS43IDUuNyAwIDAgMCAzLjc1LTEuNGMuMzUuMTguNzIuMjUgMS4zMy4zLjQ4LjA1LjkzLS4wMiAxLjI4LS4xLjU1LS4xLjUyLS42Mi4zMi0uNzEtMS42Mi0uNzYtMS4yNi0uNDUtMS41OS0uNy44Mi0uOTcgMi4wNi0xLjk4IDIuNTUtNS4yNS4wMy0uMjYgMC0uNDIgMC0uNjMgMC0uMTMuMDItLjE4LjE3LS4ycS42MS0uMDYgMS4xNi0uMzVDMjAuNDggOSAyMC45IDguMDcgMjEgNi45NGMuMDEtLjE3IDAtLjM1LS4xOS0uNDRNMTEuNyAxNi42NEMxMC4xMyAxNS40IDkuMzcgMTUgOS4wNiAxNS4wMmMtLjMuMDEtLjI0LjM1LS4xOC41Ny4wNy4yMi4xNi4zNi4yOC41NS4wOC4xMy4xNC4zMi0uMDkuNDYtLjUuMy0xLjM4LS4xLTEuNDItLjEzYTYuNSA2LjUgMCAwIDEtMi40Ny0yLjQ4IDcuNiA3LjYgMCAwIDEtLjk4LTMuMzZjLS4wMS0uMjkuMDctLjQuMzYtLjQ0cS41Ny0uMTEgMS4xNS0uMDMgMi40LjM2IDQuMSAyLjA4Yy42NS42NCAxLjE0IDEuNDEgMS42NSAyLjE2LjU0LjggMS4xMiAxLjU3IDEuODYgMi4xOXEuMzguMzMuNjcuNWMtLjYuMDctMS42LjA5LTIuMy0uNDVtLjc1LTQuODNhLjIzLjIzIDAgMCAxIC4zLS4yMmwuMS4wNnEuMDUuMDYuMDYuMTYtLjAyLjIxLS4yMy4yM2EuMjMuMjMgMCAwIDEtLjIzLS4yM20yLjMzIDEuMnEtLjIzLjEtLjQ0LjExYTEgMSAwIDAgMS0uNi0uMTljLS4yLS4xNy0uMzUtLjI2LS40Mi0uNTdhMSAxIDAgMCAxIC4wMi0uNDRxLjA4LS4zNC0uMTgtLjU0YS44LjggMCAwIDAtLjUyLS4xNS40LjQgMCAwIDEtLjE5LS4wNmMtLjA4LS4wNC0uMTUtLjE0LS4wOC0uMjdsLjE0LS4xNWMuMjctLjE2LjU3LS4xLjg2IDAgLjI2LjExLjQ2LjMxLjc1LjYuMy4zMy4zNS40My41MS42OHEuMi4yOS4zNC42NC4wNy4yMi0uMTkuMzMiIGNsYXNzPSJzdDAiIHN0eWxlPSJkaXNwbGF5OmlubGluZTtmaWxsOiM0ZDZiZmU7c3Ryb2tlLXdpZHRoOi4zMjAyNzEiLz48L3N2Zz4=";
		/** The marketplace mark at the given pixel size; theme-independent. */
		function BrandMark(props) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
				src: LOGO,
				width: props.size,
				height: props.size,
				alt: "",
				"aria-hidden": "true",
				style: {
					width: props.size,
					height: props.size,
					display: "inline-block",
					verticalAlign: "middle",
					flex: "0 0 auto"
				}
			});
		}
		//#endregion
		//#region src/client/client-style.ts
		/**
		* Document-level CSS the inline-style approach can't express: the keyframes
		* behind the translation "Pulsing Glow" on the original-language badge (and
		* reduced-motion handling). Reference-counted — the two mounts (sidebar tab
		* and settings section) share one <style> tag per document.
		*/
		const MARKER = "data-dsh-mp-client-style";
		const CSS$1 = `
@keyframes dsh-mp-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(96, 165, 250, 0); }
  50% { box-shadow: 0 0 7px 2px rgba(96, 165, 250, 0.55); }
}
.dsh-mp-pulse { animation: dsh-mp-pulse 1.6s ease-in-out infinite; }
.dsh-mp-theme-card { transition: transform 0.16s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.16s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.16s cubic-bezier(0.16, 1, 0.3, 1); }
.dsh-mp-theme-card:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(31, 35, 40, 0.08); border-color: var(--dsw-alias-border-l3, rgba(128, 128, 128, 0.5)); }
.dsh-mp-theme-cover { position: relative; display: block; width: 100%; aspect-ratio: 16 / 10; overflow: hidden; border: 0; border-bottom: 1px solid var(--dsw-alias-border, rgba(128, 128, 128, 0.28)); border-radius: 0; padding: 0; cursor: zoom-in; background: var(--dsw-alias-bg-layer-2, rgba(128, 128, 128, 0.12)); }
.dsh-mp-theme-cover img { display: block; width: 100%; height: 100%; object-fit: contain; transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1); }
.dsh-mp-theme-cover:hover img { transform: scale(1.012); }
.dsh-mp-theme-cover-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; font-size: 12px; line-height: 18px; opacity: 0.55; cursor: default; }
.dsh-mp-theme-pill { position: absolute; right: 8px; bottom: 8px; display: inline-flex; align-items: center; height: 24px; padding: 0 8px; border-radius: 4px; border: 1px solid rgba(255, 255, 255, 0.34); background: rgba(20, 24, 31, 0.78); -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); color: #fff; font-size: 11px; white-space: nowrap; }
@media (prefers-reduced-motion: reduce) {
  .dsh-mp-pulse { animation: none; }
  .dsh-mp-theme-card, .dsh-mp-theme-cover img { transition: none; }
  .dsh-mp-theme-card:hover { transform: none; }
}
`;
		let refcount = 0;
		let tag = null;
		/** Install the shared style rules; the returned disposer releases one claim. */
		function installClientStyle() {
			refcount += 1;
			if (tag === null) {
				tag = document.createElement("style");
				tag.setAttribute(MARKER, "");
				tag.textContent = CSS$1;
				document.head.append(tag);
			}
			return () => {
				refcount -= 1;
				if (refcount <= 0) {
					tag?.remove();
					tag = null;
					refcount = 0;
				}
			};
		}
		//#endregion
		//#region src/client/favorites.ts
		/**
		* Client-side favorites (plan 3.2): slugs live in the host's durable
		* state.json behind the same-origin /favorite route. The cache is a
		* module-level external store so every mount (better-sidebar tab and the
		* settings section render separate React roots) sees the same list; updates
		* are optimistic, with the host response as the source of truth.
		*/
		const FAVORITE_ROUTE = "/plugins/dsh-plugins-mp/favorite";
		let favorites = [];
		let loaded = false;
		const listeners = /* @__PURE__ */ new Set();
		function emit() {
			for (const listener of listeners) listener();
		}
		function subscribe(listener) {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		}
		function getSnapshot() {
			return favorites;
		}
		function adopt(value) {
			if (!Array.isArray(value)) return;
			favorites = value.filter((x) => typeof x === "string" && x.length > 0);
			emit();
		}
		/** Kick off the initial load once per document; never throws. */
		function ensureFavorites() {
			if (loaded) return;
			loaded = true;
			fetch(FAVORITE_ROUTE, { headers: { accept: "application/json" } }).then((res) => res.ok ? res.json() : null).then((body) => {
				adopt(body?.favorites);
				loaded = false;
			}).catch(() => {
				loaded = false;
			});
		}
		/** Reactive favorites list shared by all mounts. */
		function useFavorites() {
			return (0, react.useSyncExternalStore)(subscribe, getSnapshot);
		}
		/** Optimistic flip; a failed request reverts on the next GET (tab reopen). */
		function toggleFavorite(slug) {
			const on = !favorites.includes(slug);
			favorites = on ? [...favorites, slug] : favorites.filter((item) => item !== slug);
			emit();
			fetch(FAVORITE_ROUTE, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					slug,
					on
				})
			}).then((res) => res.ok ? res.json() : null).then((body) => {
				adopt(body?.favorites);
			}).catch(() => {});
		}
		//#endregion
		//#region src/client/settings-nav-icon.ts
		/**
		* Mark this plugin's row in the DSH settings navigation so injected CSS can
		* replace the shell's fallback gear with the marketplace glyph.
		*
		* DSH 0.1.x projects only `id`, `order`, and `label` from a
		* `settings.section` registration and renders a generic gear for every
		* external section. The plugin identifies only its own localized nav row
		* after the dialog mounts (same adaptation as dsh-better-sidebar); the
		* marker owns no shell structure and is removed on disposal, so the whole
		* thing stays HMR-safe.
		*
		* The painted glyph follows the native nav colors: it is a currentColor
		* mask, so no palette of our own is involved.
		*/
		const SETTINGS_NAV_MARKER = "data-dsh-mp-settings-nav";
		/** The mono marketplace mark, URI-encoded for a CSS mask url(). */
		const ICON_URI = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0ibm9uZSIgdmlld0JveD0iMCAwIDE2IDE2Ij48cGF0aCBkPSJNLjUzLjUzdjE0Ljk0aDE0Ljk0VjcuNjVsLS40LS4xNWgtLjAxbC0uMTItLjAzaC0uMDFjLS4yOS0uMDQtLjI3IDAtLjQ2LjAzYTE1IDE1IDAgMCAxLTEuNDMuMTVoLS4xN2MuMTMtLjIzLjI1LS41LjIyLS43NmExIDEgMCAwIDAtLjMtLjU5IDEuNiAxLjYgMCAwIDAtLjg0LS40IDIgMiAwIDAgMC0uNDktLjA1aC0uMjVsLS4wMy4wMy0uMi4wMXEtLjQ2LjA4LS44MS4zOGMtLjE1LjEzLS4yOS4zNi0uMzMuNTctLjA3LjM1LjA4LjU4LjIyLjhsLS4yLjAxYy0uMTYgMC0uMzUgMC0uNDItLjAyLS4zLS4wMi0uNTctLjA2LS45NS0uMTItLjA3LS40LS4xMi0uODUtLjE0LTEuMTR2LS40M2MuMjMuMTQuNDUuMy44LjIyLjI4LS4wNS41My0uMjQuNjgtLjQ1cS4yMS0uMzEuMjgtLjcuMDMtLjE3LjAzLS40N3QtLjAzLS40OGMtLjA3LS4zMS0uMTctLjYtLjQxLS44NS0uMi0uMi0uNi0uMzQtLjg4LS4zSDguOHEtLjIzLjA2LS40Ni4ydi0uNTRsLjE0LTEuMDN2LS4wMWwuMDUtLjM2YzAtLjA1LjAyLS4xMi0uMDgtLjNMOC4zLjUzSC41M20xLjI2IDEuMjZoNS40bC0uMDkuNjctLjAxLjVjMCAuMTktLjAxLjMuMDIuNDkuMDQuMzEuMTMuNjMuNDQuODdzLjc3LjIyIDEuMDYuMDhjLjE0LS4wNi4xOC0uMS4yNS0uMTRsLjAxLjA1Yy4wMi4wOC4wMS4wNC4wMS4yM3YuMjNsLS4wMy4wN2MtLjItLjE0LS40LS4yOC0uNzMtLjI4LS4yOCAwLS42LjE3LS43NS4zOWExLjQgMS40IDAgMCAwLS4yNi42NnYuMDFxLS4wNS40MS0uMDIuODNsLjEuNzNxLS4yNy0uMDQtLjUtLjA3bC0uNTUtLjAyYy0uMiAwLS4zMS0uMDItLjUyLjAyLS4yNy4wNC0uNTQuMTEtLjc4LjM0cy0uMzEuNjUtLjI0Ljk0Yy4wNi4yMy4xNC4zMy4yMy40NmwtLjA2LjAyLS4yLjAxYy0uMjMgMC0uMTEuMDItLjI4LS4wMWgtLjAybC0uMDItLjAycS4xNi0uMjMuMjEtLjQxYy4xLS4zLjAzLS43Mi0uMi0uOTdhMS4zIDEuMyAwIDAgMC0uODEtLjM2Yy0uMi0uMDMtLjMtLjAyLS41LS4wMnEtLjI3IDAtLjUuMDJsLS42Ni4wOHptOS44MyA1LjMyLjA1LjAxaC4wMWwuMDcuMDNxLS4xNS4yMy0uMjIuNDFjLS4wOC4zLS4wMi43My4yMi45Ny4yNC4yNS41Mi4zMi44LjM2LjIuMDMuMy4wMi41LjAycS4yNyAwIC41LS4wMmwuNjYtLjA4djUuNEg4LjZsLS4wNS0uNHEtLjA1LS40LS4wNS0uNjlsLjA4LjA0aC4wMWMuMy4xMS40NS4xNC44IDBxLjQ4LS4yMS42Ny0uNjNjLjMtLjU3LjMyLTEuMjMuMTItMS44NGExLjUgMS41IDAgMCAwLS41My0uNzljLS4yNy0uMi0uNjUtLjI2LS45Ny0uMThxLS4xLjA0LS4xOC4wOSAwLS4zNy4wOS0xdi0uMDJxLjM4LjA2LjczLjEuMjUuMDIuNTUuMDJjLjIgMCAuMzEuMDEuNTItLjAyLjM3LS4wNi44LS4yLjk4LS42NS4xOC0uNDIgMC0uNzktLjIxLTEuMDlsLjA4LS4wMmMuMDgtLjAyLjA0LS4wMS4yMy0uMDF6TTIuODggOC41bC0uMDUuMDh2LjAyYy0uMS4zLS4xMy40NS4wMS44LjEuMjMuMi4zNi4zOC41LjMuMjQuNjUuMzQgMSAuMzhxLjU0LjA3IDEuMS0uMS40Ni0uMTQuNzgtLjUzYy4yLS4yOC4yNS0uNjYuMTctLjk4cS0uMDMtLjA4LS4wOC0uMTZjLjI2IDAgLjU2LjAyIDEgLjA4aC4wM2ExMCAxMCAwIDAgMC0uMTQgMS40NHEuMDEuNS4xNy44NGMuMTMuMjcuNDcuNTYuODIuNTcuMzIuMDIuNTYtLjEyLjc4LS4yN2wuMDIuMDdjLjAyLjA4LjAxLjA0LjAxLjIzdi4yMmwtLjAzLjA3LS4yLS4xMy0uMDItLjAxLS4wMi0uMDFjLS4zLS4xNC0uNzUtLjE3LTEuMDYuMDgtLjMxLjI0LS40LjU2LS40NC44Ny0uMDMuMi0uMDIuMy0uMDIuNDlsLjAxLjUuMDkuNjdoLTUuNFY4LjZsLjM1LS4wNXEuNDQtLjA1LjczLS4wNW0xMi4xMSA2Ljk2LS4wNS4wMWgtLjAzeiIgc3R5bGU9ImJhc2VsaW5lLXNoaWZ0OmJhc2VsaW5lO2Rpc3BsYXk6aW5saW5lO292ZXJmbG93OnZpc2libGU7dmVjdG9yLWVmZmVjdDpub25lO2ZpbGw6IzAwMDtzdG9wLWNvbG9yOiMwMDA7c3RvcC1vcGFjaXR5OjE7b3BhY2l0eToxIi8+PC9zdmc+";
		const CSS = `
[data-dsh-mp-settings-nav] > svg:first-child { display: none; }
[data-dsh-mp-settings-nav]::before {
  content: '';
  flex: none;
  width: 16px;
  height: 16px;
  background: currentColor;
  -webkit-mask-image: url("${ICON_URI}");
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
  -webkit-mask-size: contain;
  mask-image: url("${ICON_URI}");
  mask-repeat: no-repeat;
  mask-position: center;
  mask-size: contain;
}
`;
		/** Inject the marker's painting rules once per document. */
		function installSettingsNavStyle() {
			const tag = document.createElement("style");
			tag.setAttribute("data-dsh-mp-settings-nav-style", "");
			tag.textContent = CSS;
			document.head.append(tag);
			return () => {
				tag.remove();
			};
		}
		/**
		* Keep the marker on the settings-nav button whose visible text is this
		* plugin's current localized section label.
		* @param label - locale-aware label resolver used by the section registration.
		* @returns disposer that disconnects observation and removes owned markers.
		*/
		function registerSettingsNavIcon(label) {
			let disposed = false;
			const sync = () => {
				if (disposed) return;
				const currentLabel = label().trim();
				document.querySelectorAll("[role=\"dialog\"] nav button").forEach((button) => {
					if (currentLabel.length > 0 && button.textContent?.trim() === currentLabel) button.setAttribute(SETTINGS_NAV_MARKER, "");
					else button.removeAttribute(SETTINGS_NAV_MARKER);
				});
			};
			sync();
			const observer = new MutationObserver(sync);
			observer.observe(document.body, {
				childList: true,
				subtree: true,
				characterData: true
			});
			return () => {
				disposed = true;
				observer.disconnect();
				document.querySelectorAll(`[${SETTINGS_NAV_MARKER}]`).forEach((element) => {
					element.removeAttribute(SETTINGS_NAV_MARKER);
				});
			};
		}
		//#endregion
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
		let API_BASE = "https://dsh-plugins-mp.com/api";
		const CONFIG_ROUTE = "/plugins/dsh-plugins-mp/config";
		const HOST_ROUTE = "/plugins/dsh-plugins-mp/host";
		const INSTALL_ROUTE = "/plugins/dsh-plugins-mp/install";
		const NOTE_ROUTE = "/plugins/dsh-plugins-mp/note";
		const SETTINGS_ROUTE = "/plugins/dsh-plugins-mp/settings";
		const TELEMETRY_PAYLOAD_ROUTE = "/plugins/dsh-plugins-mp/telemetry-payload";
		const LOGS_ROUTE = "/plugins/dsh-plugins-mp/logs";
		function normalizeBase(base) {
			let b = base.replace(/\/+$/, "");
			if (/^https?:\/\//i.test(b) && !/\/api\b/.test(b)) b += "/api";
			return b;
		}
		function siteOrigin() {
			return API_BASE.replace(/\/api\/?$/, "");
		}
		let basePromise = null;
		function ensureApiBase() {
			if (basePromise === null) basePromise = (async () => {
				try {
					const res = await fetch(CONFIG_ROUTE, { headers: { accept: "application/json" } });
					if (res.ok) {
						const { apiBase } = await res.json();
						if (typeof apiBase === "string" && apiBase.length) API_BASE = normalizeBase(apiBase);
					}
				} catch {}
			})();
			return basePromise;
		}
		async function api(path, signal) {
			await ensureApiBase();
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
		async function fetchInstalled() {
			const res = await fetch("/plugins/dsh-plugins-mp/installed", { headers: { accept: "application/json" } });
			if (!res.ok) throw new Error(String(res.status));
			const items = (await res.json()).items ?? [];
			try {
				const tRes = await fetch("/plugins/dsh-plugins-mp/toggle", { headers: { accept: "application/json" } });
				if (tRes.ok) {
					const state = await tRes.json();
					const byName = new Map((state.items ?? []).map((row) => [row.name, row]));
					for (const item of items) {
						const row = byName.get(item.name);
						if (row !== void 0) {
							item.disabled = row.disabled;
							item.live = row.live;
						}
					}
				}
			} catch {}
			return items;
		}
		async function fetchUpdates() {
			try {
				const res = await fetch("/plugins/dsh-plugins-mp/update", { headers: { accept: "application/json" } });
				if (!res.ok) return {};
				const body = await res.json();
				return Object.fromEntries((body.items ?? []).map((item) => [item.name, {
					latest: item.latest,
					updateAvailable: item.updateAvailable
				}]));
			} catch {
				return {};
			}
		}
		async function pluginAction(route, body) {
			return await (await fetch(route, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(body)
			})).json().catch(() => ({}));
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
				profile: "Profile",
				all: "All",
				secPlugins: "Plugins",
				secSkills: "Skills",
				secApps: "Apps",
				sortStars: "★ Stars",
				sortUpdated: "Updated",
				sortNewest: "Newest",
				sortName: "Name",
				updated: "Updated",
				versions: "Versions",
				tabMine: "My plugins",
				tabFavorites: "Favorites",
				tabThemes: "Themes",
				tabDiagnostics: "Diagnostics",
				tabSettings: "Settings",
				comingSoon: "This section ships in an upcoming update.",
				agentTools: "Model tools (mp_search, mp_details…)",
				agentToolsHint: "Lets the model search and inspect the marketplace inside conversations. Turn off to keep the context lean.",
				on: "On",
				off: "Off",
				saving: "Saving…",
				saveError: "Failed to save",
				eventLog: "Event log",
				eventLogHint: "A sanitized log of what the plugin did — for bug reports. Nothing is sent anywhere.",
				download: "Download",
				telemetryTitle: "Install statistics",
				telemetryHint: "Anonymous only: a random UUID (nothing hardware-derived), a daily heartbeat and install/update events power the trending list. No personal data, opt out anytime.",
				mineEmpty: "Nothing installed yet.",
				uninstall: "Uninstall",
				confirmUninstall: "Remove?",
				update: "Update",
				pnpmRow: "pnpm (package manager)",
				pnpmMissing: "not found — needed to install plugins",
				setup: "Install",
				allowBuilds: "Allow build scripts",
				allowBuildsHint: "pnpm blocked the build scripts of:",
				installedUnverified: "installed (unverified)",
				fullscreen: "Full screen",
				exitFullscreen: "Exit full screen",
				myPlugins: "Installed in this profile",
				liveBadge: "live",
				offBadge: "off",
				toggleOff: "Turn off",
				toggleOn: "Turn on",
				restartPending: "A restart is needed to apply all changes.",
				restartNow: "Restart",
				restartingLabel: "Restarting…",
				dupRows: "Duplicate loader rows",
				missingRows: "Listed but not on disk",
				linkRows: "Local (link/file) plugins",
				disabledRowsLabel: "Disabled rows",
				liveRows: "Hot-mounted now",
				origLang: "Original language",
				groups: "Groups",
				groupsHint: "Toggle several installed plugins as one unit.",
				groupPlaceholder: "New group name…",
				groupAdd: "Add",
				groupEmpty: "No groups yet.",
				groupPick: "— plugin —",
				i18nHint: "UI in multiple languages",
				orderTitle: "Load order",
				orderHint: "The order plugins are composed in. In-box bundles are fixed; applies after a restart. A broken order is refused by a boot trial.",
				orderApply: "Apply",
				orderConflicts: "Order rules violated:",
				orderTrialFailed: "Trial composition failed — rolled back.",
				orderMoved: "entries moved",
				orderEmpty: "No reorderable bundles.",
				backupTitle: "Backup & restore",
				backupHint: "Config-only portable file: manifest, patch layer, groups, favorites, notes, load order. Never installed packages.",
				backupWarn: "The file may contain tokens or passwords from config files — do not share it.",
				backupDownload: "Download backup",
				backupRestore: "Restore from file…",
				backupConfirm: "Restore",
				backupDone: "Restored: {n} files. A restart applies the changes.",
				backupMissing: "not in this profile",
				backupInvalid: "Not a valid backup file.",
				backupSummary: "Backup from {date}: {files} files, {deps} plugins.",
				syncTitle: "Sync",
				syncHint: "Remote backup of the settings. Passwords and tokens are never saved — enter them per action (a token from the host environment also works).",
				syncWebdav: "WebDAV (https)",
				syncUpload: "Upload",
				syncDownloadCloud: "Download",
				syncGist: "GitHub Gist (private)",
				syncGistToken: "token (optional)",
				syncToGist: "To Gist",
				syncFromGist: "From Gist",
				syncAutoLine: "Auto: {msg}",
				syncDone: "Done.",
				syncRestoredFiles: "restored {n} files",
				favAdd: "Add to favorites",
				favRemove: "Remove from favorites",
				favEmpty: "Nothing here yet — tap ♥ on a card.",
				screenshots: "Screenshots",
				noteLabel: "Note",
				notePlaceholder: "Your private note about this plugin…",
				noteSave: "Save note",
				noteSaved: "Saved",
				changelog: "Release notes",
				comments: "Comments",
				commentsEmpty: "No comments yet.",
				discussOnSite: "Discuss on the site",
				themeApply: "Apply",
				themeActive: "Active theme",
				themeEnable: "Enable",
				themeDeactivate: "Deactivate",
				themeBusy: "Applying…",
				themeFail: "Failed to apply"
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
				profile: "配置",
				all: "全部",
				secPlugins: "插件",
				secSkills: "技能",
				secApps: "应用",
				sortStars: "★ 星数",
				sortUpdated: "更新时间",
				sortNewest: "最新",
				sortName: "名称",
				updated: "更新于",
				versions: "版本",
				tabMine: "我的插件",
				tabFavorites: "收藏",
				tabThemes: "主题",
				tabDiagnostics: "诊断",
				tabSettings: "设置",
				comingSoon: "该分区将在后续更新中推出。",
				agentTools: "模型工具（mp_search、mp_details…）",
				agentToolsHint: "允许模型在对话中搜索和查看市场。关闭可保持上下文精简。",
				on: "开",
				off: "关",
				saving: "保存中…",
				saveError: "保存失败",
				eventLog: "事件日志",
				eventLogHint: "插件操作的脱敏日志 — 用于错误报告。不会发送到任何地方。",
				download: "下载",
				telemetryTitle: "安装统计",
				telemetryHint: "完全匿名：随机 UUID（与硬件无关）、每日心跳和安装/更新事件用于热门榜。不含个人数据，可随时关闭。",
				mineEmpty: "还没有安装任何插件。",
				uninstall: "卸载",
				confirmUninstall: "确认删除？",
				update: "更新",
				pnpmRow: "pnpm（包管理器）",
				pnpmMissing: "未找到 — 安装插件需要它",
				setup: "安装",
				allowBuilds: "允许构建脚本",
				allowBuildsHint: "pnpm 阻止了以下包的构建脚本：",
				installedUnverified: "已安装（未验证）",
				fullscreen: "全屏",
				exitFullscreen: "退出全屏",
				myPlugins: "已安装到此配置",
				liveBadge: "运行中",
				offBadge: "已关闭",
				toggleOff: "关闭",
				toggleOn: "开启",
				restartPending: "需要重启才能应用所有更改。",
				restartNow: "重启",
				restartingLabel: "重启中…",
				dupRows: "重复的 loader 行",
				missingRows: "清单中列出但磁盘上不存在",
				linkRows: "本地 (link/file) 插件",
				disabledRowsLabel: "已禁用的行",
				liveRows: "热挂载中",
				origLang: "原文语言",
				groups: "分组",
				groupsHint: "一组插件一键启停。",
				groupPlaceholder: "新分组名称…",
				groupAdd: "添加",
				groupEmpty: "暂无分组。",
				groupPick: "— 插件 —",
				i18nHint: "界面支持多种语言",
				orderTitle: "加载顺序",
				orderHint: "插件在配置中的加载顺序。官方捆绑包固定；重启后生效。坏顺序会被试启动拒绝。",
				orderApply: "应用",
				orderConflicts: "违反了顺序规则：",
				orderTrialFailed: "试组装失败 — 已回滚。",
				orderMoved: "个条目移动",
				orderEmpty: "无可排序捆绑包。",
				backupTitle: "备份与恢复",
				backupHint: "仅配置的便携文件：清单、补丁层、分组、收藏、笔记、加载顺序。不含已安装的包。",
				backupWarn: "文件可能包含配置中的令牌或密码 — 请勿外传。",
				backupDownload: "下载备份",
				backupRestore: "从文件恢复…",
				backupConfirm: "恢复",
				backupDone: "已恢复 {n} 个文件。重启后生效。",
				backupMissing: "本配置缺少",
				backupInvalid: "不是有效的备份文件。",
				backupSummary: "备份日期 {date}：{files} 个文件，{deps} 个插件。",
				syncTitle: "同步",
				syncHint: "设置的远程备份。密码和令牌不会被保存 — 每次操作时输入（也可使用主机环境中的令牌）。",
				syncWebdav: "WebDAV (https)",
				syncUpload: "上传",
				syncDownloadCloud: "下载",
				syncGist: "GitHub Gist（私有）",
				syncGistToken: "令牌（可选）",
				syncToGist: "上传到 Gist",
				syncFromGist: "从 Gist 恢复",
				syncAutoLine: "自动：{msg}",
				syncDone: "完成。",
				syncRestoredFiles: "已恢复 {n} 个文件",
				favAdd: "加入收藏",
				favRemove: "取消收藏",
				favEmpty: "还没有收藏 — 点击卡片上的 ♥。",
				screenshots: "截图",
				noteLabel: "笔记",
				notePlaceholder: "关于此插件的私有笔记…",
				noteSave: "保存笔记",
				noteSaved: "已保存",
				changelog: "发布说明",
				comments: "评论",
				commentsEmpty: "暂无评论。",
				discussOnSite: "到网站上讨论",
				themeApply: "应用",
				themeActive: "当前主题",
				themeEnable: "启用",
				themeDeactivate: "停用",
				themeBusy: "应用中…",
				themeFail: "应用失败"
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
				profile: "Профиль",
				all: "Все",
				secPlugins: "Плагины",
				secSkills: "Скиллы",
				secApps: "Приложения",
				sortStars: "★ Звёзды",
				sortUpdated: "Обновлённые",
				sortNewest: "Новые",
				sortName: "По имени",
				updated: "Обновлено",
				versions: "Версии",
				tabMine: "Мои плагины",
				tabFavorites: "Избранное",
				tabThemes: "Темы",
				tabDiagnostics: "Диагностика",
				tabSettings: "Настройки",
				comingSoon: "Раздел появится в ближайшем обновлении.",
				agentTools: "Инструменты модели (mp_search, mp_details…)",
				agentToolsHint: "Позволяет модели искать и изучать маркетплейс в беседах. Отключите, чтобы не засорять контекст.",
				on: "Вкл",
				off: "Выкл",
				saving: "Сохранение…",
				saveError: "Не удалось сохранить",
				eventLog: "Журнал событий",
				eventLogHint: "Очищенный лог действий плагина — для отчётов об ошибках. Никуда не отправляется.",
				download: "Скачать",
				telemetryTitle: "Статистика установок",
				telemetryHint: "Полностью анонимно: случайный UUID (не привязан к железу), heartbeat раз в день и события установки/обновления питают список трендов. Никаких личных данных, отключается в любой момент.",
				mineEmpty: "Пока ничего не установлено.",
				uninstall: "Удалить",
				confirmUninstall: "Удалить?",
				update: "Обновить",
				pnpmRow: "pnpm (пакетный менеджер)",
				pnpmMissing: "не найден — нужен для установки плагинов",
				setup: "Установить",
				allowBuilds: "Разрешить сборку",
				allowBuildsHint: "pnpm заблокировал build-скрипты:",
				installedUnverified: "установлено (без проверки)",
				fullscreen: "Во весь экран",
				exitFullscreen: "Выйти из полного экрана",
				myPlugins: "Установлено в этом профиле",
				liveBadge: "живой",
				offBadge: "выкл",
				toggleOff: "Выключить",
				toggleOn: "Включить",
				restartPending: "Для применения всех изменений нужен перезапуск.",
				restartNow: "Перезапустить",
				restartingLabel: "Перезапускаю…",
				dupRows: "Дубли loader-строк",
				missingRows: "В манифесте, но не на диске",
				linkRows: "Локальные (link/file) плагины",
				disabledRowsLabel: "Отключённые строки",
				liveRows: "Hot-смонтированы сейчас",
				origLang: "Язык оригинала",
				groups: "Группы",
				groupsHint: "Включайте и выключайте набор установленных плагинов одним переключателем.",
				groupPlaceholder: "Название новой группы…",
				groupAdd: "Добавить",
				groupEmpty: "Групп пока нет.",
				groupPick: "— плагин —",
				i18nHint: "Интерфейс на нескольких языках",
				orderTitle: "Порядок загрузки",
				orderHint: "Порядок подключения плагинов в профиле. Официальные бандлы фиксированы; применится после перезапуска. Нерабочий порядок отклонит пробная сборка.",
				orderApply: "Применить",
				orderConflicts: "Нарушены правила порядка:",
				orderTrialFailed: "Пробная сборка не прошла — порядок откачен.",
				orderMoved: "записей переставлено",
				orderEmpty: "Нет переставляемых бандлов.",
				backupTitle: "Резервная копия",
				backupHint: "Портативный файл только с настройками: манифест, патч-слой, группы, избранное, заметки, порядок загрузки. Без установленных пакетов.",
				backupWarn: "Файл может содержать токены и пароли из конфигов — не передавайте его третьим лицам.",
				backupDownload: "Скачать бэкап",
				backupRestore: "Восстановить из файла…",
				backupConfirm: "Восстановить",
				backupDone: "Восстановлено файлов: {n}. Для применения нужен перезапуск.",
				backupMissing: "нет в этом профиле",
				backupInvalid: "Это не файл резервной копии.",
				backupSummary: "Бэкап от {date}: {files} файлов, {deps} плагинов.",
				syncTitle: "Синхронизация",
				syncHint: "Удалённый бэкап настроек. Пароли и токены не сохраняются — вводите их при каждом действии (подойдёт и токен из окружения хоста).",
				syncWebdav: "WebDAV (https)",
				syncUpload: "Загрузить",
				syncDownloadCloud: "Скачать",
				syncGist: "GitHub Gist (приватный)",
				syncGistToken: "токен (необязательно)",
				syncToGist: "В Gist",
				syncFromGist: "Из Gist",
				syncAutoLine: "Авто: {msg}",
				syncDone: "Готово.",
				syncRestoredFiles: "восстановлено файлов: {n}",
				favAdd: "В избранное",
				favRemove: "Убрать из избранного",
				favEmpty: "Пока пусто — нажмите ♥ на карточке.",
				screenshots: "Скриншоты",
				noteLabel: "Заметка",
				notePlaceholder: "Личная заметка об этом плагине…",
				noteSave: "Сохранить заметку",
				noteSaved: "Сохранено",
				changelog: "Что нового",
				comments: "Комментарии",
				commentsEmpty: "Пока нет комментариев.",
				discussOnSite: "Обсудить на сайте",
				themeApply: "Применить",
				themeActive: "Активная тема",
				themeEnable: "Включить",
				themeDeactivate: "Отключить",
				themeBusy: "Применяю…",
				themeFail: "Не удалось применить"
			}
		};
		function navLang() {
			const nav = typeof navigator !== "undefined" ? navigator.language : "en";
			return nav.startsWith("zh") ? "zh" : nav.startsWith("ru") ? "ru" : "en";
		}
		/** Язык интерфейса DSH: веб-приложение выставляет его в lang на <html> ("ru-RU"). */
		function dshLang() {
			if (typeof document === "undefined") return null;
			const l = (document.documentElement.getAttribute("lang") ?? "").slice(0, 2).toLowerCase();
			return l === "en" || l === "zh" || l === "ru" ? l : null;
		}
		function langCode() {
			return dshLang() ?? navLang();
		}
		let langSubscribers = null;
		function watchDshLang(cb) {
			if (typeof document === "undefined") return () => {};
			if (langSubscribers === null) {
				langSubscribers = /* @__PURE__ */ new Set();
				new MutationObserver(() => {
					for (const fn of langSubscribers) fn();
				}).observe(document.documentElement, {
					attributes: true,
					attributeFilter: ["lang"]
				});
			}
			langSubscribers.add(cb);
			return () => {
				langSubscribers.delete(cb);
			};
		}
		/** Реактивный язык интерфейса: следует за переключением языка в DSH. */
		function useUiLang() {
			const [lang, setLang] = (0, react.useState)(() => langCode());
			(0, react.useEffect)(() => {
				const sync = () => setLang(langCode());
				sync();
				return watchDshLang(sync);
			}, []);
			return lang;
		}
		function uiLang() {
			return UI[langCode()];
		}
		const CAT_LABELS = {
			ui: {
				en: "UI & Experience",
				zh: "界面与体验",
				ru: "Интерфейс и опыт"
			},
			themes: {
				en: "Themes & Skins",
				zh: "主题与皮肤",
				ru: "Темы и скины"
			},
			memory: {
				en: "Memory & Context",
				zh: "记忆与上下文",
				ru: "Память и контекст"
			},
			sessions: {
				en: "Sessions & Messages",
				zh: "会话与消息",
				ru: "Сессии и сообщения"
			},
			tools: {
				en: "Tools & Capabilities",
				zh: "工具与能力",
				ru: "Инструменты и возможности"
			},
			models: {
				en: "Models & Providers",
				zh: "模型与供应商",
				ru: "Модели и провайдеры"
			},
			workflow: {
				en: "Workflow & Automation",
				zh: "工作流与自动化",
				ru: "Автоматизация и воркфлоу"
			},
			terminal: {
				en: "Terminal & Clients",
				zh: "终端与客户端",
				ru: "Терминал и клиенты"
			},
			vision: {
				en: "Vision & Multimodal",
				zh: "视觉与多模态",
				ru: "Визуальные и мультимодальные"
			},
			notifications: {
				en: "Notifications & Integrations",
				zh: "通知与集成",
				ru: "Уведомления и интеграции"
			},
			dev: {
				en: "Development & Infrastructure",
				zh: "开发与基础设施",
				ru: "Разработка и инфраструктура"
			},
			security: {
				en: "Security & Audit",
				zh: "安全与审计",
				ru: "Безопасность и аудит"
			},
			fun: {
				en: "Just for Fun",
				zh: "娱乐",
				ru: "Развлечения"
			},
			agents: {
				en: "Agent skills",
				zh: "智能体技能",
				ru: "Агентские навыки"
			},
			design: {
				en: "Design & slides",
				zh: "设计与演示",
				ru: "Дизайн и презентации"
			},
			knowledge: {
				en: "Knowledge & docs",
				zh: "知识与文档",
				ru: "Знания и документы"
			},
			devops: {
				en: "Infra & DevOps",
				zh: "基础设施与 DevOps",
				ru: "Инфраструктура и DevOps"
			},
			automation: {
				en: "Automation & monitoring",
				zh: "自动化与监控",
				ru: "Автоматизация и мониторинг"
			},
			interface: {
				en: "Panels & viewers",
				zh: "面板与查看器",
				ru: "Панели и просмотрщики"
			},
			desktop: {
				en: "Desktop clients",
				zh: "桌面客户端",
				ru: "Десктоп-клиенты"
			},
			mobile: {
				en: "Mobile",
				zh: "移动端",
				ru: "Мобильные"
			},
			web: {
				en: "Web apps",
				zh: "网页应用",
				ru: "Веб-приложения"
			},
			integrations: {
				en: "Integrations",
				zh: "集成",
				ru: "Интеграции"
			},
			utilities: {
				en: "Utilities",
				zh: "实用工具",
				ru: "Утилиты"
			}
		};
		const LOCALE_LABEL = {
			en: "EN",
			zh: "中文",
			ru: "RU"
		};
		function catLabel(slug, lang) {
			return CAT_LABELS[slug]?.[lang] ?? slug;
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
			langChip: {
				flexShrink: 0,
				padding: "1px 5px",
				borderRadius: 5,
				border: "1px solid var(--dsw-alias-border, rgba(128,128,128,0.35))",
				fontSize: 10,
				fontWeight: 600,
				letterSpacing: "0.4px",
				opacity: .85,
				whiteSpace: "nowrap"
			},
			favBtn: {
				flexShrink: 0,
				cursor: "pointer",
				fontSize: 13,
				lineHeight: 1,
				opacity: .45,
				padding: "0 1px"
			},
			favOn: {
				opacity: 1,
				color: "#e8a33d"
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
			chipRow: {
				display: "flex",
				gap: 6,
				overflowX: "auto",
				flexWrap: "nowrap",
				paddingBottom: 2,
				minWidth: 0
			},
			chip: {
				flexShrink: 0,
				display: "inline-flex",
				alignItems: "center",
				gap: 4,
				padding: "3px 10px",
				borderRadius: 999,
				border: "1px solid var(--dsw-alias-border, rgba(128,128,128,0.35))",
				background: "var(--dsw-alias-bg-base, transparent)",
				color: "inherit",
				font: "inherit",
				fontSize: 12,
				cursor: "pointer",
				whiteSpace: "nowrap"
			},
			chipOn: {
				background: "rgba(79,124,201,0.16)",
				borderColor: "rgba(79,124,201,0.55)",
				fontWeight: 600
			},
			metaRow: {
				display: "flex",
				gap: 6,
				flexWrap: "wrap",
				alignItems: "center"
			},
			link: {
				color: "#4f7cc9",
				overflowWrap: "anywhere"
			},
			compatRow: {
				display: "flex",
				gap: 6,
				alignItems: "center",
				margin: "2px 0"
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
		function fmtNum(n) {
			return n >= 1e3 ? `${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}k` : String(n);
		}
		function fmtDate(iso) {
			if (!iso) return null;
			const d = new Date(iso);
			return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString(void 0, {
				year: "numeric",
				month: "short",
				day: "numeric"
			});
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
					const src = mm?.[2] ?? "";
					out.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
						src,
						alt: mm?.[1] ?? "",
						loading: "lazy",
						style: {
							maxWidth: "100%",
							borderRadius: 8,
							margin: "4px 0",
							display: "block"
						},
						onError: (e) => {
							e.currentTarget.style.display = "none";
						}
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
			const lines = props.source.replace(/<img\b[^>]*?\bsrc\s*=\s*"([^"]+)"[^>]*>/gi, "![]($1)").replace(/<img\b[^>]*?\bsrc\s*=\s*'([^']+)'[^>]*>/gi, "![]($1)").replace(/<br\s*\/?\s*>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#39;/g, "'").split(/\r?\n/);
			const blocks = [];
			let para = [];
			let list = [];
			let table = null;
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
			const flushTable = (key) => {
				if (table !== null && table.length > 0) blocks.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
					style: {
						...S.pre,
						overflowX: "auto"
					},
					children: table.join("\n")
				}, key));
				table = null;
			};
			for (let i = 0; i < lines.length; i++) {
				const line = lines[i];
				if (line.trim().startsWith("```")) {
					flushPara(`p${i}`);
					flushList(`l${i}`);
					flushTable(`t${i}`);
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
				if (line.trim().startsWith("|")) {
					flushPara(`p${i}`);
					flushList(`l${i}`);
					if (table === null) table = [];
					if (!/^[:\-\s|]+$/.test(line.trim())) {
						const cells = line.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
						table.push(cells.join("  ·  "));
					}
					continue;
				}
				flushTable(`t${i}`);
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
			flushTable("tend");
			if (code !== null) blocks.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
				style: S.pre,
				children: code.join("\n")
			}, "cend"));
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children: blocks });
		}
		function InstallButton(props) {
			const t = uiLang();
			const [state, setState] = (0, react.useState)({ phase: "idle" });
			const [blocked, setBlocked] = (0, react.useState)([]);
			const [verified, setVerified] = (0, react.useState)(null);
			const profile = props.profile ?? "web";
			const start = () => {
				if (state.phase === "busy") return;
				setState({ phase: "busy" });
				setBlocked([]);
				requestInstall(props.slug, profile).then((r) => {
					if (r.ok) {
						if (r.ignoredBuilds !== void 0 && r.ignoredBuilds.length > 0) {
							setBlocked(r.ignoredBuilds);
							setState({ phase: "blocked" });
							return;
						}
						setVerified(r.verified ?? null);
						setState({ phase: "done" });
					} else setState({
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
			const allowAndRetry = () => {
				if (blocked.length === 0) return;
				setState({ phase: "busy" });
				pluginAction("/plugins/dsh-plugins-mp/approve-builds", {
					packages: blocked,
					profile
				}).then(() => requestInstall(props.slug, profile)).then((r) => {
					if (r.ok) {
						setBlocked([]);
						setVerified(r.verified ?? null);
						setState({ phase: "done" });
					} else setState({
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
			const label = state.phase === "busy" ? t.installing : state.phase === "done" ? verified === false ? `✓ ${t.installedUnverified}` : `✓ ${t.installed}` : state.phase === "blocked" ? t.allowBuilds : state.phase === "error" ? t.installFailed : t.install;
			if (props.compact) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
				style: {
					...S.installBtn,
					...state.phase === "done" ? BADGE_TONE.passed : {},
					...state.phase === "error" ? BADGE_TONE.failed : {}
				},
				onClick: (e) => {
					e.stopPropagation();
					if (state.phase === "blocked") allowAndRetry();
					else start();
				},
				disabled: state.phase === "busy",
				title: state.phase === "error" ? state.message : void 0,
				children: label
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					style: {
						...S.bigInstall,
						...state.phase === "blocked" ? BADGE_TONE.unknown : {}
					},
					onClick: state.phase === "blocked" ? allowAndRetry : start,
					disabled: state.phase === "busy",
					children: label
				}),
				state.phase === "blocked" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					style: { marginTop: 8 },
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: S.hint,
						children: [
							t.allowBuildsHint,
							" ",
							blocked.join(", ")
						]
					})
				}),
				state.phase === "error" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					style: { marginTop: 8 },
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: S.err,
						children: state.message
					}), state.output !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
						style: S.out,
						children: state.output
					})]
				})
			] });
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
			const isFav = useFavorites().includes(c.slug);
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
							}),
							c.originalLang != null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: c.shortPending === true ? "dsh-mp-pulse" : void 0,
								style: S.langChip,
								title: c.shortPending === true ? `${t.origLang}: ${c.originalLang.toUpperCase()} · ⚙` : `${t.origLang}: ${c.originalLang.toUpperCase()}`,
								children: c.originalLang.toUpperCase()
							}),
							c.i18n === true && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								style: S.langChip,
								title: t.i18nHint,
								children: "🌐"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								role: "button",
								style: {
									...S.favBtn,
									...isFav ? S.favOn : {}
								},
								title: isFav ? t.favRemove : t.favAdd,
								onClick: (e) => {
									e.stopPropagation();
									toggleFavorite(c.slug);
								},
								children: "♥"
							})
						]
					}),
					c.shortDescription !== null && c.shortDescription !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						style: S.desc,
						children: c.shortDescription
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						style: S.cardFoot,
						children: [
							compatBadge(c, props.dshVersion, t),
							c.primaryLanguage != null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								style: S.badge,
								children: c.primaryLanguage
							}),
							c.npmDownloadsWeek > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								style: S.cardStars,
								children: [
									"↓ ",
									fmtNum(c.npmDownloadsWeek),
									"/wk"
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(InstallButton, {
								slug: c.slug,
								compact: true
							})
						]
					})
				]
			});
		}
		function CatalogView(props) {
			const uiLangCode = useUiLang();
			const t = UI[uiLangCode];
			const [query, setQuery] = (0, react.useState)("");
			const [items, setItems] = (0, react.useState)([]);
			const [total, setTotal] = (0, react.useState)(0);
			const [page, setPage] = (0, react.useState)(1);
			const [loading, setLoading] = (0, react.useState)(true);
			const [slug, setSlug] = (0, react.useState)(null);
			const [dshVersion, setDshVersion] = (0, react.useState)(null);
			const [cats, setCats] = (0, react.useState)([]);
			const [cat, setCat] = (0, react.useState)("");
			const [sec, setSec] = (0, react.useState)("plugin");
			const [sort, setSort] = (0, react.useState)("stars");
			(0, react.useEffect)(() => {
				fetch(HOST_ROUTE).then((r) => r.ok ? r.json() : null).then((d) => {
					const v = d?.dsh?.version;
					setDshVersion(v !== void 0 && v !== "unknown" ? v : null);
				}).catch(() => {});
			}, []);
			(0, react.useEffect)(() => {
				api(`/categories?section=${sec}`).then(setCats).catch(() => {});
			}, [sec]);
			const AUTO_REFETCH_MS = 8e3;
			const AUTO_REFETCH_MAX = 10;
			const autoRefetches = (0, react.useRef)(0);
			const refetchTimer = (0, react.useRef)(null);
			const clearRefetch = () => {
				if (refetchTimer.current !== null) {
					clearTimeout(refetchTimer.current);
					refetchTimer.current = null;
				}
			};
			const refreshTranslated = (q, upToPage) => {
				const pages = Array.from({ length: upToPage }, (_, i) => i + 1);
				Promise.all(pages.map((p) => {
					const usp = new URLSearchParams({
						limit: "25",
						page: String(p),
						installable: "1"
					});
					if (q !== "") usp.set("q", q);
					usp.set("section", sec);
					if (cat !== "") usp.set("category", cat);
					usp.set("sort", sort);
					usp.set("locale", langCode());
					return api(`/plugins?${usp.toString()}`);
				})).then((results) => {
					const bySlug = /* @__PURE__ */ new Map();
					let pending = 0;
					for (const r of results) {
						pending += r.pendingShort ?? 0;
						for (const c of r.items) bySlug.set(c.slug, c);
					}
					setItems((prev) => prev.map((c) => bySlug.get(c.slug) ?? c));
					if (pending > 0 && autoRefetches.current < AUTO_REFETCH_MAX) {
						autoRefetches.current += 1;
						refetchTimer.current = setTimeout(() => refreshTranslated(q, upToPage), AUTO_REFETCH_MS);
					}
				}).catch(() => {});
			};
			const load = (q, nextPage, replace) => {
				clearRefetch();
				autoRefetches.current = 0;
				const ctrl = new AbortController();
				setLoading(true);
				const usp = new URLSearchParams({
					limit: "25",
					page: String(nextPage),
					installable: "1"
				});
				if (q !== "") usp.set("q", q);
				usp.set("section", sec);
				if (cat !== "") usp.set("category", cat);
				usp.set("sort", sort);
				usp.set("locale", langCode());
				api(`/plugins?${usp.toString()}`, ctrl.signal).then((d) => {
					setItems((prev) => replace ? d.items : [...prev, ...d.items]);
					setTotal(d.total);
					setPage(nextPage);
					if ((d.pendingShort ?? 0) > 0 && autoRefetches.current < AUTO_REFETCH_MAX) {
						autoRefetches.current += 1;
						refetchTimer.current = setTimeout(() => refreshTranslated(q, nextPage), AUTO_REFETCH_MS);
					}
				}).catch(() => {}).finally(() => setLoading(false));
				return () => {
					ctrl.abort();
					clearRefetch();
				};
			};
			(0, react.useEffect)(() => {
				if (slug !== null) return;
				return load(query, 1, true);
			}, [
				slug,
				cat,
				sort,
				sec
			]);
			const prevUiLang = (0, react.useRef)(uiLangCode);
			(0, react.useEffect)(() => {
				if (prevUiLang.current === uiLangCode) return;
				prevUiLang.current = uiLangCode;
				if (slug !== null) return;
				autoRefetches.current = 0;
				refreshTranslated(query, page);
			}, [uiLangCode]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				style: S.root,
				children: slug !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(DetailView, {
					slug,
					dshVersion,
					onBack: () => setSlug(null),
					onOpenSlug: (s) => setSlug(s)
				}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					style: S.header,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: S.titleRow,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(BrandMark, { size: 18 }),
								t.title,
								dshVersion !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									style: S.hostBadge,
									children: ["DSH ", dshVersion]
								})
							]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("form", {
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
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: { ...S.chipRow },
							children: [
								"plugin",
								"skill",
								"app"
							].map((sKey) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								style: {
									...S.chip,
									...sec === sKey ? S.chipOn : {}
								},
								onClick: () => {
									if (sKey === sec) return;
									setSec(sKey);
									setCat("");
								},
								children: sKey === "plugin" ? t.secPlugins : sKey === "skill" ? t.secSkills : t.secApps
							}, sKey))
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: {
								display: "flex",
								gap: 8,
								alignItems: "center"
							},
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								style: {
									...S.chipRow,
									flex: 1
								},
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									style: {
										...S.chip,
										...cat === "" ? S.chipOn : {}
									},
									onClick: () => setCat(""),
									children: t.all
								}), cats.map((c) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
									style: {
										...S.chip,
										...cat === c.slug ? S.chipOn : {}
									},
									onClick: () => setCat(c.slug),
									children: [
										catLabel(c.slug, uiLangCode),
										" ",
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											style: { opacity: .6 },
											children: c.count
										})
									]
								}, c.slug))]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
								style: S.select,
								value: sort,
								onChange: (e) => setSort(e.target.value),
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
										value: "stars",
										children: t.sortStars
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
										value: "updated",
										children: t.sortUpdated
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
										value: "newest",
										children: t.sortNewest
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
										value: "name",
										children: t.sortName
									})
								]
							})]
						})
					]
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
			const uiLangCode = useUiLang();
			const t = UI[uiLangCode];
			const [detail, setDetail] = (0, react.useState)(null);
			const [error, setError] = (0, react.useState)(null);
			const [copied, setCopied] = (0, react.useState)(false);
			const [profile, setProfile] = (0, react.useState)("web");
			const [descLoc, setDescLoc] = (0, react.useState)(null);
			const [readme, setReadme] = (0, react.useState)(null);
			const [shot, setShot] = (0, react.useState)(null);
			const [note, setNote] = (0, react.useState)("");
			const [noteState, setNoteState] = (0, react.useState)("idle");
			const [openChangelog, setOpenChangelog] = (0, react.useState)(null);
			const [comments, setComments] = (0, react.useState)(null);
			(0, react.useEffect)(() => {
				const ctrl = new AbortController();
				setDetail(null);
				setError(null);
				setDescLoc(null);
				setReadme(null);
				setShot(null);
				setNote("");
				setNoteState("idle");
				setOpenChangelog(null);
				setComments(null);
				api(`/plugins/${encodeURIComponent(props.slug)}`, ctrl.signal).then(setDetail).catch((e) => {
					if (!ctrl.signal.aborted) setError(String(e));
				});
				api(`/plugins/${encodeURIComponent(props.slug)}/readme?locale=${langCode()}`, ctrl.signal).then(setReadme).catch(() => {});
				api(`/plugins/${encodeURIComponent(props.slug)}/comments`, ctrl.signal).then(setComments).catch(() => {});
				fetch(NOTE_ROUTE, {
					headers: { accept: "application/json" },
					signal: ctrl.signal
				}).then((r) => r.ok ? r.json() : null).then((d) => {
					const text = d?.notes?.[props.slug];
					if (typeof text === "string" && text !== "") setNote(text);
				}).catch(() => {});
				return () => ctrl.abort();
			}, [props.slug]);
			(0, react.useEffect)(() => {
				if (shot === null) return;
				const onKey = (e) => {
					if (e.key === "Escape") setShot(null);
				};
				window.addEventListener("keydown", onKey);
				return () => window.removeEventListener("keydown", onKey);
			}, [shot]);
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
			const saveNote = () => {
				setNoteState("busy");
				fetch(NOTE_ROUTE, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						slug: props.slug,
						text: note
					})
				}).then((r) => {
					if (!r.ok) throw new Error(String(r.status));
					setNoteState("saved");
					setTimeout(() => setNoteState("idle"), 1500);
				}).catch(() => setNoteState("idle"));
			};
			const p = detail.plugin;
			const cmd = installCommandFor(p, profile);
			const descLocales = [{
				locale: p.originalLang,
				isMachine: false,
				text: p.descriptionMd
			}];
			for (const x of p.translations) {
				if (x.kind !== "description" || x.textMd.trim() === "") continue;
				const hit = descLocales.find((o) => o.locale === x.locale);
				if (hit === void 0) descLocales.push({
					locale: x.locale,
					isMachine: x.isMachine,
					text: x.textMd
				});
				else if (hit.isMachine && !x.isMachine) {
					hit.isMachine = false;
					hit.text = x.textMd;
				}
			}
			const lang = uiLangCode;
			const activeLoc = descLoc ?? (descLocales.some((o) => o.locale === lang) ? lang : p.originalLang);
			const desc = descLocales.find((o) => o.locale === activeLoc)?.text ?? "";
			const runs = detail.versions[0]?.testRuns ?? [];
			const currentRun = props.dshVersion !== null ? runs.find((r) => r.dshRelease === props.dshVersion) : void 0;
			const seenReleases = /* @__PURE__ */ new Set();
			const otherRuns = runs.filter((r) => {
				if (r.dshRelease === props.dshVersion || seenReleases.has(r.dshRelease)) return false;
				seenReleases.add(r.dshRelease);
				return true;
			});
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
								...S.muted,
								display: "flex",
								gap: 10,
								flexWrap: "wrap"
							},
							children: [
								p.primaryLanguage != null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: p.primaryLanguage }),
								p.npmDownloadsWeek > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [
									"↓ ",
									fmtNum(p.npmDownloadsWeek),
									"/wk"
								] }),
								fmtDate(p.sourceUpdatedAt) !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [
									t.updated,
									": ",
									fmtDate(p.sourceUpdatedAt)
								] })
							]
						}),
						((p.categories?.length ?? 0) > 0 || (p.tags?.length ?? 0) > 0) && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: S.metaRow,
							children: [p.categories?.map((c) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								style: {
									...S.badge,
									...S.chipOn
								},
								children: catLabel(c, uiLangCode)
							}, c)), p.tags?.slice(0, 8).map((tg) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								style: S.badge,
								children: tg
							}, tg))]
						}),
						(p.repoOwner != null || p.homepageUrl != null) && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: {
								...S.metaRow,
								fontSize: 12
							},
							children: [p.repoOwner != null && p.repoName != null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
								style: S.link,
								href: `https://github.com/${p.repoOwner}/${p.repoName}`,
								target: "_blank",
								rel: "noreferrer",
								children: "GitHub ↗"
							}), p.homepageUrl != null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
								style: S.link,
								href: p.homepageUrl,
								target: "_blank",
								rel: "noreferrer",
								children: p.homepageUrl
							})]
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
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: {
								...S.cmd,
								alignItems: "stretch",
								flexDirection: "column",
								gap: 4
							},
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									style: S.muted,
									children: t.noteLabel
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
									value: note,
									placeholder: t.notePlaceholder,
									onChange: (e) => setNote(e.target.value),
									style: {
										width: "100%",
										boxSizing: "border-box",
										minHeight: 52,
										resize: "vertical",
										borderRadius: 6,
										border: "1px solid var(--dsw-alias-border, rgba(128,128,128,0.35))",
										background: "transparent",
										color: "inherit",
										font: "inherit",
										fontSize: 12,
										padding: "5px 8px",
										outline: "none"
									}
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									style: {
										...S.copyBtn,
										marginLeft: 0,
										alignSelf: "flex-end"
									},
									onClick: saveNote,
									children: noteState === "busy" ? "…" : noteState === "saved" ? t.noteSaved : t.noteSave
								})
							]
						})
					]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					style: S.body,
					children: [
						(props.dshVersion !== null || otherRuns.length > 0) && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: { marginBottom: 12 },
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									style: S.muted,
									children: t.compatibility
								}),
								props.dshVersion !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									style: S.compatRow,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										style: S.badge,
										children: [
											"DSH ",
											props.dshVersion,
											" · ",
											t.current
										]
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										style: {
											...S.badge,
											...BADGE_TONE[currentRun?.status ?? "unknown"]
										},
										children: currentRun === void 0 ? t.notTested : t[STATUS_KEY[currentRun.status] ?? "notTested"]
									})]
								}),
								otherRuns.map((r) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									style: S.compatRow,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										style: S.badge,
										children: ["DSH ", r.dshRelease]
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										style: {
											...S.badge,
											...BADGE_TONE[r.status]
										},
										children: t[STATUS_KEY[r.status] ?? "notTested"]
									})]
								}, r.dshRelease))
							]
						}),
						descLocales.length > 1 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: {
								...S.metaRow,
								marginBottom: 6
							},
							children: descLocales.map((o) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								style: {
									...S.chip,
									...o.locale === activeLoc ? S.chipOn : {}
								},
								title: o.isMachine ? "⚙ machine translation" : void 0,
								onClick: () => setDescLoc(o.locale),
								children: [LOCALE_LABEL[o.locale] ?? o.locale, o.isMachine ? " ⚙" : ""]
							}, o.locale))
						}),
						desc !== "" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Markdown, { source: desc }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: S.muted,
							children: t.empty
						}),
						(p.screenshots?.length ?? 0) > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: { marginTop: 12 },
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								style: S.muted,
								children: t.screenshots
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								style: {
									display: "flex",
									gap: 6,
									overflowX: "auto",
									padding: "6px 0"
								},
								children: p.screenshots.map((src, i) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
									src,
									alt: "",
									loading: "lazy",
									style: {
										height: 88,
										borderRadius: 8,
										border: "1px solid var(--dsw-alias-border, rgba(128,128,128,0.35))",
										cursor: "zoom-in",
										display: "block"
									},
									onClick: () => setShot(i)
								}, src))
							})]
						}),
						readme !== null && readme.markdown !== "" && readme.markdown !== desc && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: { marginTop: 16 },
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								style: S.muted,
								children: "README"
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Markdown, { source: readme.markdown })]
						}),
						shot !== null && p.screenshots[shot] !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: {
								position: "fixed",
								inset: 0,
								zIndex: 1e5,
								background: "rgba(0,0,0,0.85)",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								cursor: "zoom-out"
							},
							onClick: () => setShot(null),
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
								src: p.screenshots[shot],
								alt: "",
								style: {
									maxWidth: "94vw",
									maxHeight: "92vh",
									objectFit: "contain",
									display: "block"
								}
							}), p.screenshots.length > 1 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								style: {
									...S.overlayNav,
									left: 8
								},
								onClick: (e) => {
									e.stopPropagation();
									setShot((shot - 1 + p.screenshots.length) % p.screenshots.length);
								},
								children: "‹"
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								style: {
									...S.overlayNav,
									right: 8
								},
								onClick: (e) => {
									e.stopPropagation();
									setShot((shot + 1) % p.screenshots.length);
								},
								children: "›"
							})] })]
						}),
						detail.versions.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: { marginTop: 14 },
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								style: S.muted,
								children: t.versions
							}), detail.versions.slice(0, 6).map((v) => {
								const hasNotes = typeof v.changelogMd === "string" && v.changelogMd.trim() !== "";
								const expanded = openChangelog === v.version;
								return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									style: { margin: "2px 0" },
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										role: hasNotes ? "button" : void 0,
										onClick: hasNotes ? () => setOpenChangelog(expanded ? null : v.version) : void 0,
										style: {
											display: "flex",
											gap: 8,
											alignItems: "baseline",
											margin: "2px 0",
											cursor: hasNotes ? "pointer" : void 0
										},
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", {
												style: S.code,
												children: v.version
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												style: S.muted,
												children: fmtDate(v.publishedAt) ?? ""
											}),
											hasNotes && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
												style: S.muted,
												children: [
													expanded ? "▾" : "▸",
													" ",
													t.changelog
												]
											})
										]
									}), hasNotes && expanded && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										style: {
											margin: "4px 0 8px",
											paddingLeft: 10,
											borderLeft: "2px solid var(--dsw-alias-border, rgba(128,128,128,0.35))"
										},
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Markdown, { source: v.changelogMd })
									})]
								}, v.version);
							})]
						}),
						comments !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: { marginTop: 16 },
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									style: {
										...S.muted,
										marginBottom: 4
									},
									children: [t.comments, comments.total > 0 ? ` · ${comments.total}` : ""]
								}),
								comments.items.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									style: S.muted,
									children: t.commentsEmpty
								}),
								comments.items.map((c) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									style: {
										margin: "6px 0",
										paddingLeft: 10,
										borderLeft: "2px solid var(--dsw-alias-border, rgba(128,128,128,0.35))"
									},
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										style: {
											display: "flex",
											gap: 8,
											alignItems: "baseline"
										},
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											style: { fontWeight: 600 },
											children: c.author.name || c.author.login
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											style: S.muted,
											children: fmtDate(c.createdAt) ?? ""
										})]
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Markdown, { source: c.bodyMd.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1") })]
								}, c.id)),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("a", {
									href: `${siteOrigin()}/plugins/${encodeURIComponent(props.slug)}`,
									target: "_blank",
									rel: "noreferrer",
									style: { fontSize: 12 },
									children: [t.discussOnSite, " ↗"]
								})
							]
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
		Object.assign(S, {
			tabbar: {
				display: "flex",
				gap: 2,
				padding: "0 10px",
				borderBottom: "1px solid var(--dsw-alias-border, rgba(128,128,128,0.28))",
				overflowX: "auto",
				flexShrink: 0
			},
			tab: {
				appearance: "none",
				border: "none",
				background: "transparent",
				color: "inherit",
				font: "inherit",
				fontSize: 12,
				padding: "7px 9px",
				cursor: "pointer",
				opacity: .65,
				borderBottom: "2px solid transparent",
				whiteSpace: "nowrap"
			},
			tabActive: {
				opacity: 1,
				fontWeight: 600,
				borderBottom: "2px solid var(--dsw-alias-accent, currentColor)"
			},
			placeholder: {
				padding: "28px 14px",
				opacity: .6,
				textAlign: "center"
			},
			settings: {
				flex: 1,
				minHeight: 0,
				overflowY: "auto",
				padding: "14px 12px",
				display: "flex",
				flexDirection: "column",
				gap: 14
			},
			settingsRow: {
				display: "flex",
				gap: 10,
				alignItems: "flex-start",
				padding: "10px 12px",
				borderRadius: 10,
				border: "1px solid var(--dsw-alias-border, rgba(128,128,128,0.28))",
				background: "var(--dsw-alias-bg-base, rgba(128,128,128,0.06))"
			},
			settingsText: {
				display: "flex",
				flexDirection: "column",
				gap: 4,
				minWidth: 0
			},
			settingsName: { fontWeight: 600 },
			hint: {
				opacity: .65,
				fontSize: 12,
				lineHeight: 1.4
			},
			toggle: {
				appearance: "none",
				flexShrink: 0,
				font: "inherit",
				fontSize: 12,
				padding: "4px 12px",
				borderRadius: 999,
				cursor: "pointer",
				border: "1px solid var(--dsw-alias-border, rgba(128,128,128,0.35))",
				background: "transparent",
				color: "inherit"
			},
			toggleOn: {
				background: "var(--dsw-alias-accent-soft, rgba(77,107,254,0.25))",
				borderColor: "var(--dsw-alias-accent, #4d6bfe)"
			},
			link: {
				color: "inherit",
				fontSize: 12,
				textDecoration: "underline",
				cursor: "pointer"
			},
			overlayNav: {
				position: "absolute",
				top: "50%",
				transform: "translateY(-50%)",
				appearance: "none",
				border: "none",
				borderRadius: 999,
				width: 40,
				height: 40,
				fontSize: 22,
				lineHeight: 1,
				cursor: "pointer",
				background: "rgba(128,128,128,0.25)",
				color: "#fff"
			}
		});
		/** Settings tab: the agent-tools switch, pnpm health, log export, planned rows. */
		const BACKUP_ROUTE = "/plugins/dsh-plugins-mp/backup";
		/** Parse a backup file locally — enough fields to confirm the restore. */
		function summarizeBackup(raw) {
			try {
				const parsed = JSON.parse(raw);
				if (parsed.format !== "dsh-profile-backup" || !Array.isArray(parsed.files)) return null;
				const manifest = parsed.files.find((f) => f.path === "package.json");
				return {
					createdAt: typeof parsed.createdAt === "string" ? parsed.createdAt : "",
					profile: typeof parsed.profile === "string" ? parsed.profile : "",
					files: parsed.files.length,
					deps: Object.keys(manifest?.json?.dependencies ?? {}).length
				};
			} catch {
				return null;
			}
		}
		/** Backup/restore section on the Settings tab (plan #11). */
		function BackupSection(props) {
			const t = UI[useUiLang()];
			const inputRef = (0, react.useRef)(null);
			const [picked, setPicked] = (0, react.useState)(null);
			const [busy, setBusy] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)(null);
			const [done, setDone] = (0, react.useState)(null);
			const download = () => {
				const a = document.createElement("a");
				a.href = BACKUP_ROUTE;
				a.download = `dsh-mp-backup-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`;
				document.body.appendChild(a);
				a.click();
				a.remove();
			};
			const restore = () => {
				if (picked === null || busy) return;
				setBusy(true);
				setError(null);
				setDone(null);
				pluginAction(BACKUP_ROUTE, JSON.parse(picked.raw)).then((res) => {
					if (res.error !== void 0) {
						setError(res.error);
						return;
					}
					const missing = Array.isArray(res.depsAdded) && res.depsAdded.length > 0 ? ` (${t.backupMissing}: ${res.depsAdded.join(", ")})` : "";
					setDone(`${t.backupDone.replace("{n}", String(res.files ?? 0))}${missing}`);
					setPicked(null);
					props.onNeedsRestart?.();
				}).catch((e) => setError(String(e))).finally(() => setBusy(false));
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: {
					...S.settingsRow,
					flexDirection: "column",
					gap: 6
				},
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: S.settingsText,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								style: S.settingsName,
								children: t.backupTitle
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								style: S.hint,
								children: t.backupHint
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								style: {
									...S.hint,
									color: "#f5a623"
								},
								children: t.backupWarn
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: {
							display: "flex",
							gap: 6,
							flexWrap: "wrap",
							alignItems: "center"
						},
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								style: {
									...S.installBtn,
									marginLeft: 0
								},
								onClick: download,
								children: t.backupDownload
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								style: S.installBtn,
								onClick: () => inputRef.current?.click(),
								children: t.backupRestore
							}),
							picked !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								style: {
									...S.installBtn,
									...BADGE_TONE.passed
								},
								disabled: busy,
								onClick: restore,
								children: busy ? "…" : `${t.backupConfirm} ${picked.name}`
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								ref: inputRef,
								type: "file",
								accept: ".json,application/json",
								style: { display: "none" },
								onChange: (e) => {
									const file = e.target.files?.[0];
									e.target.value = "";
									if (file === void 0) return;
									file.text().then((raw) => {
										if (summarizeBackup(raw) === null) {
											setError(t.backupInvalid);
											setPicked(null);
											return;
										}
										setError(null);
										setDone(null);
										setPicked({
											name: file.name,
											raw
										});
									});
								}
							})
						]
					}),
					picked !== null && (() => {
						const summary = summarizeBackup(picked.raw);
						return summary !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: S.hint,
							children: t.backupSummary.replace("{files}", String(summary.files)).replace("{deps}", String(summary.deps)).replace("{date}", summary.createdAt.slice(0, 10))
						}) : null;
					})(),
					done !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: {
							...S.hint,
							color: "#46a758"
						},
						children: done
					}) : null,
					error !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: {
							...S.hint,
							color: "#e5484d"
						},
						children: error
					}) : null
				]
			});
		}
		const SYNC_ROUTE = "/plugins/dsh-plugins-mp/sync";
		async function syncAction(body) {
			return await pluginAction(SYNC_ROUTE, body);
		}
		/** Restore-through: fetch a remote backup, then feed it into the merge restore. */
		async function restoreRemote(backup) {
			return await pluginAction(BACKUP_ROUTE, backup);
		}
		/** WebDAV + Gist backup targets (plan #12); credentials are never persisted. */
		function SyncSection(props) {
			const t = UI[useUiLang()];
			const [davUrl, setDavUrl] = (0, react.useState)("");
			const [davUser, setDavUser] = (0, react.useState)("");
			const [davPass, setDavPass] = (0, react.useState)("");
			const [gistToken, setGistToken] = (0, react.useState)("");
			const [gistId, setGistId] = (0, react.useState)("");
			const [status, setStatus] = (0, react.useState)(null);
			const [busy, setBusy] = (0, react.useState)(false);
			(0, react.useEffect)(() => {
				let alive = true;
				fetch(SYNC_ROUTE, { headers: { accept: "application/json" } }).then((r) => r.ok ? r.json() : null).then((d) => {
					if (alive && d?.sync?.gistId != null) setGistId(d.sync.gistId);
				}).catch(() => {});
				syncAction({
					target: "gist",
					action: "auto"
				}).then((res) => {
					if (!alive) return;
					if (res.ok === true && res.skipped === true) setStatus({
						text: `gist ${res.lastAt?.slice(0, 10) ?? ""}`,
						bad: false
					});
					else if (res.ok === true && res.gistId != null) setStatus({
						text: `gist ${res.gistId} ✓`,
						bad: false
					});
					else if (res.source === "none") setStatus({
						text: "no host token",
						bad: true
					});
				});
				return () => {
					alive = false;
				};
			}, []);
			const run = (body, after) => {
				if (busy) return;
				setBusy(true);
				setStatus(null);
				syncAction(body).then(after).catch((e) => setStatus({
					text: String(e),
					bad: true
				})).finally(() => setBusy(false));
			};
			const restoreBackup = (backup) => {
				setBusy(true);
				restoreRemote(backup).then((res) => {
					if (res.error !== void 0) setStatus({
						text: res.error,
						bad: true
					});
					else {
						setStatus({
							text: t.syncRestoredFiles.replace("{n}", String(res.files ?? 0)),
							bad: false
						});
						props.onNeedsRestart?.();
					}
				}).catch((e) => setStatus({
					text: String(e),
					bad: true
				})).finally(() => setBusy(false));
			};
			const input = (value, setValue, placeholder, type = "text") => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
				style: {
					...S.search,
					flex: 1,
					minWidth: 120
				},
				value,
				type,
				placeholder,
				onChange: (e) => setValue(e.target.value)
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: {
					...S.settingsRow,
					flexDirection: "column",
					gap: 8
				},
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: S.settingsText,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: S.settingsName,
							children: t.syncTitle
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: S.hint,
							children: t.syncHint
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: {
							...S.settingsText,
							gap: 2
						},
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								style: {
									fontWeight: 600,
									fontSize: 12
								},
								children: t.syncWebdav
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								style: {
									display: "flex",
									gap: 6,
									flexWrap: "wrap"
								},
								children: [
									input(davUrl, setDavUrl, "https://dav.example.com/dsh/backup.json"),
									input(davUser, setDavUser, "login"),
									input(davPass, setDavPass, "••••••", "password")
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								style: {
									display: "flex",
									gap: 6
								},
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									style: {
										...S.installBtn,
										marginLeft: 0
									},
									disabled: busy || davUrl.trim() === "",
									onClick: () => run({
										target: "webdav",
										action: "backup",
										url: davUrl.trim(),
										username: davUser,
										password: davPass
									}, (res) => setStatus(res.error !== void 0 ? {
										text: res.error,
										bad: true
									} : {
										text: t.syncDone,
										bad: false
									})),
									children: t.syncUpload
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									style: S.installBtn,
									disabled: busy || davUrl.trim() === "",
									onClick: () => run({
										target: "webdav",
										action: "restore",
										url: davUrl.trim(),
										username: davUser,
										password: davPass
									}, (res) => {
										if (res.error !== void 0 || res.backup === void 0) setStatus({
											text: res.error ?? "no backup",
											bad: true
										});
										else restoreBackup(res.backup);
									}),
									children: t.syncDownloadCloud
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: {
							...S.settingsText,
							gap: 2
						},
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								style: {
									fontWeight: 600,
									fontSize: 12
								},
								children: t.syncGist
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								style: {
									display: "flex",
									gap: 6,
									flexWrap: "wrap"
								},
								children: [input(gistToken, setGistToken, t.syncGistToken, "password"), input(gistId, setGistId, "Gist ID")]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								style: {
									display: "flex",
									gap: 6,
									flexWrap: "wrap",
									alignItems: "center"
								},
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										style: {
											...S.installBtn,
											marginLeft: 0
										},
										disabled: busy,
										onClick: () => run({
											target: "gist",
											action: "export",
											token: gistToken.trim(),
											gistId: gistId.trim()
										}, (res) => {
											if (res.error !== void 0) setStatus({
												text: res.error,
												bad: true
											});
											else {
												if (res.gistId != null) setGistId(res.gistId);
												setStatus({
													text: `${res.gistUrl ?? t.syncDone}`,
													bad: false
												});
											}
										}),
										children: t.syncToGist
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										style: S.installBtn,
										disabled: busy || gistId.trim() === "",
										onClick: () => run({
											target: "gist",
											action: "import",
											token: gistToken.trim(),
											gistId: gistId.trim()
										}, (res) => {
											if (res.error !== void 0 || res.backup === void 0) setStatus({
												text: res.error ?? "no backup",
												bad: true
											});
											else restoreBackup(res.backup);
										}),
										children: t.syncFromGist
									}),
									status !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										style: {
											...S.hint,
											color: status.bad ? "#e5484d" : "#46a758"
										},
										children: status.text
									}) : null
								]
							})
						]
					})
				]
			});
		}
		function SettingsView(props = {}) {
			const uiLangCode = useUiLang();
			const t = UI[uiLangCode];
			const [agentTools, setAgentTools] = (0, react.useState)(null);
			const [busy, setBusy] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)(false);
			(0, react.useEffect)(() => {
				let alive = true;
				fetch(SETTINGS_ROUTE, { headers: { accept: "application/json" } }).then((res) => res.ok ? res.json() : Promise.reject(new Error(String(res.status)))).then((body) => {
					if (alive) setAgentTools(body.agentTools !== false);
				}).catch(() => {
					if (alive) setAgentTools(true);
				});
				return () => {
					alive = false;
				};
			}, []);
			const flip = () => {
				if (agentTools === null || busy) return;
				setBusy(true);
				setError(false);
				fetch(SETTINGS_ROUTE, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ agentTools: !agentTools })
				}).then(async (res) => {
					const body = await res.json().catch(() => ({}));
					if (!res.ok || typeof body.agentTools !== "boolean") throw new Error(String(res.status));
					setAgentTools(body.agentTools);
				}).catch(() => setError(true)).finally(() => setBusy(false));
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: S.settings,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: S.settingsRow,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: S.settingsText,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									style: S.settingsName,
									children: t.agentTools
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									style: S.hint,
									children: t.agentToolsHint
								}),
								error ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									style: {
										...S.hint,
										color: "#e5484d"
									},
									children: t.saveError
								}) : null
							]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							style: {
								...S.toggle,
								...agentTools ? S.toggleOn : {}
							},
							disabled: agentTools === null || busy,
							onClick: flip,
							children: agentTools === null ? t.loading : busy ? t.saving : agentTools ? t.on : t.off
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: S.settingsRow,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: S.settingsText,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								style: S.settingsName,
								children: t.eventLog
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								style: S.hint,
								children: t.eventLogHint
							})]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
							style: S.link,
							href: LOGS_ROUTE,
							download: "dsh-plugins-mp.log",
							children: t.download
						})]
					}),
					props.children,
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(BackupSection, { onNeedsRestart: props.onNeedsRestart }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(SyncSection, { onNeedsRestart: props.onNeedsRestart }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(TelemetryRow, {})
				]
			});
		}
		/** Anonymous install telemetry opt-out (plan 5.1) — on by default. */
		function TelemetryRow() {
			const t = UI[useUiLang()];
			const [on, setOn] = (0, react.useState)(null);
			const [busy, setBusy] = (0, react.useState)(false);
			(0, react.useEffect)(() => {
				let alive = true;
				fetch(SETTINGS_ROUTE, { headers: { accept: "application/json" } }).then((r) => r.ok ? r.json() : null).then((d) => {
					if (alive) setOn(d?.telemetry !== false);
				}).catch(() => {
					if (alive) setOn(true);
				});
				return () => {
					alive = false;
				};
			}, []);
			const flip = () => {
				if (on === null || busy) return;
				setBusy(true);
				fetch(SETTINGS_ROUTE, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ telemetry: !on })
				}).then(async (res) => {
					const body = await res.json().catch(() => ({}));
					if (res.ok) setOn(body.telemetry !== false);
				}).catch(() => {}).finally(() => setBusy(false));
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: S.settingsRow,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					style: S.settingsText,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: S.settingsName,
						children: t.telemetryTitle
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: S.hint,
						children: t.telemetryHint
					})]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					style: {
						...S.toggle,
						...on ? S.toggleOn : {}
					},
					disabled: on === null || busy,
					onClick: flip,
					children: on === null ? t.loading : busy ? t.saving : on ? t.on : t.off
				})]
			});
		}
		const GROUP_ROUTE = "/plugins/dsh-plugins-mp/group";
		function GroupRow(props) {
			const t = uiLang();
			const [busy, setBusy] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)(null);
			const [pick, setPick] = (0, react.useState)("");
			const { group } = props;
			const installed = props.items.filter((item) => group.members.includes(item.name));
			const allOff = installed.length > 0 && installed.every((item) => item.disabled === true);
			const candidates = props.items.filter((item) => !group.members.includes(item.name));
			const act = (body) => {
				if (busy) return;
				setBusy(true);
				setError(null);
				pluginAction(GROUP_ROUTE, body).then((res) => {
					if (res.error !== void 0) setError(res.error);
					else {
						setPick("");
						props.onChanged();
					}
					if (res.restartNeeded === true) props.onNeedsRestart?.();
				}).catch((e) => setError(String(e))).finally(() => setBusy(false));
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: {
					...S.settingsRow,
					flexDirection: "column",
					gap: 6
				},
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: {
							display: "flex",
							gap: 8,
							alignItems: "center",
							width: "100%"
						},
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								style: S.cardName,
								children: group.name
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								style: S.muted,
								children: group.members.length
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								style: {
									marginLeft: "auto",
									display: "flex",
									gap: 6,
									flexShrink: 0
								},
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									style: {
										...S.installBtn,
										...allOff ? {} : BADGE_TONE.passed
									},
									disabled: busy,
									title: allOff ? t.toggleOn : t.toggleOff,
									onClick: () => act({
										action: "toggle",
										name: group.name,
										disable: !allOff
									}),
									children: busy ? "…" : allOff ? t.offBadge : t.liveBadge
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									style: S.installBtn,
									disabled: busy,
									title: "✕",
									onClick: () => act({
										action: "delete",
										name: group.name
									}),
									children: "✕"
								})]
							})
						]
					}),
					group.members.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: {
							display: "flex",
							gap: 4,
							flexWrap: "wrap"
						},
						children: group.members.map((member) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							style: S.chip,
							disabled: busy,
							title: member,
							onClick: () => act({
								action: "remove",
								name: group.name,
								member
							}),
							children: [member, " ×"]
						}, member))
					}),
					candidates.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: {
							display: "flex",
							gap: 6,
							alignItems: "center"
						},
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
							style: {
								...S.select,
								flex: 1
							},
							value: pick,
							onChange: (e) => setPick(e.target.value),
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
								value: "",
								children: t.groupPick
							}), candidates.map((item) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
								value: item.name,
								children: item.name
							}, item.name))]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							style: S.installBtn,
							disabled: busy || pick === "",
							onClick: () => act({
								action: "add",
								name: group.name,
								member: pick
							}),
							children: t.groupAdd
						})]
					}),
					error !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: {
							...S.hint,
							color: "#e5484d"
						},
						children: error
					}) : null
				]
			});
		}
		/** Groups management block on the "My plugins" tab (#15). */
		function GroupsBlock(props) {
			const t = uiLang();
			const [groups, setGroups] = (0, react.useState)(null);
			const [name, setName] = (0, react.useState)("");
			const [error, setError] = (0, react.useState)(null);
			const loadGroups = () => {
				fetch(GROUP_ROUTE, { headers: { accept: "application/json" } }).then((r) => r.ok ? r.json() : { groups: [] }).then((d) => setGroups(d.groups ?? [])).catch(() => setGroups([]));
			};
			(0, react.useEffect)(loadGroups, []);
			const create = () => {
				const trimmed = name.trim();
				if (trimmed === "") return;
				setError(null);
				pluginAction(GROUP_ROUTE, {
					action: "create",
					name: trimmed
				}).then((res) => {
					if (res.error !== void 0) setError(res.error);
					else {
						setName("");
						loadGroups();
					}
				}).catch((e) => setError(String(e)));
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: { marginBottom: 10 },
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: S.muted,
						children: t.groups
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: S.hint,
						children: t.groupsHint
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: {
							display: "flex",
							gap: 6,
							margin: "6px 0"
						},
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							style: {
								...S.search,
								flex: 1
							},
							placeholder: t.groupPlaceholder,
							value: name,
							onChange: (e) => setName(e.target.value),
							onKeyDown: (e) => {
								if (e.key === "Enter") create();
							}
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							style: S.installBtn,
							disabled: name.trim() === "",
							onClick: create,
							children: "+"
						})]
					}),
					error !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: {
							...S.hint,
							color: "#e5484d"
						},
						children: error
					}) : null,
					groups !== null && groups.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: S.hint,
						children: t.groupEmpty
					}) : null,
					groups?.map((group) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(GroupRow, {
						group,
						items: props.items,
						onChanged: () => {
							loadGroups();
							props.onChanged();
						},
						onNeedsRestart: props.onNeedsRestart
					}, group.name))
				]
			});
		}
		const ORDER_ROUTE = "/plugins/dsh-plugins-mp/order";
		/** Bundle load order editor (plan #16): drag or ↑/↓, then a trial-validated apply. */
		function OrderBlock(props) {
			const t = uiLang();
			const [stack, setStack] = (0, react.useState)(null);
			const [order, setOrder] = (0, react.useState)([]);
			const [busy, setBusy] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)(null);
			const [saved, setSaved] = (0, react.useState)(null);
			const [dragIndex, setDragIndex] = (0, react.useState)(null);
			const load = () => {
				fetch(ORDER_ROUTE, { headers: { accept: "application/json" } }).then((r) => r.ok ? r.json() : null).then((d) => {
					if (d !== null) {
						setStack(d);
						setOrder(d.community);
					}
				}).catch(() => {});
			};
			(0, react.useEffect)(load, []);
			const dirty = stack !== null && order.join("\0") !== stack.community.join("\0");
			const move = (from, to) => {
				setOrder((prev) => {
					const next = [...prev];
					const [item] = next.splice(from, 1);
					if (item === void 0) return prev;
					next.splice(Math.max(0, Math.min(next.length, to)), 0, item);
					return next;
				});
			};
			const apply = () => {
				if (busy || !dirty) return;
				setBusy(true);
				setError(null);
				setSaved(null);
				pluginAction(ORDER_ROUTE, { order }).then((res) => {
					if (res.error !== void 0) setError(res.conflicts !== void 0 && res.conflicts.length > 0 ? `${t.orderConflicts} ${res.conflicts.map((c) => `${c.name}: ${c.reason}`).join("; ")}` : `${t.orderTrialFailed}${res.output !== void 0 ? "" : ` ${res.error}`}`);
					else {
						setSaved(typeof res.moved === "number" ? `${res.moved} ${t.orderMoved}` : t.orderApply);
						props.onNeedsRestart?.();
						load();
					}
				}).catch((e) => setError(String(e))).finally(() => setBusy(false));
			};
			if (stack === null) return null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: { marginBottom: 10 },
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: S.muted,
						children: t.orderTitle
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: S.hint,
						children: t.orderHint
					}),
					stack.conflicts.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: {
							...S.hint,
							color: "#f5a623",
							marginTop: 4
						},
						children: [t.orderConflicts, /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
							style: { margin: "2px 0 0 16px" },
							children: stack.conflicts.map((c, i) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", { children: [
								c.name,
								": ",
								c.reason
							] }, i))
						})]
					}),
					order.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: S.hint,
						children: t.orderEmpty
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: { margin: "6px 0" },
						children: order.map((name, i) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							draggable: true,
							onDragStart: () => setDragIndex(i),
							onDragOver: (e) => e.preventDefault(),
							onDrop: () => {
								if (dragIndex !== null && dragIndex !== i) move(dragIndex, i);
								setDragIndex(null);
							},
							onDragEnd: () => setDragIndex(null),
							style: {
								display: "flex",
								gap: 6,
								alignItems: "center",
								padding: "2px 0",
								opacity: dragIndex === i ? .5 : 1
							},
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									style: {
										...S.muted,
										width: 20,
										textAlign: "right",
										flexShrink: 0
									},
									children: i + 1
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									style: {
										cursor: "grab",
										userSelect: "none",
										flexShrink: 0
									},
									children: "≡"
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									style: {
										flex: 1,
										fontSize: 12,
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap"
									},
									children: name
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									style: S.installBtn,
									disabled: i === 0,
									onClick: () => move(i, i - 1),
									children: "↑"
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									style: S.installBtn,
									disabled: i === order.length - 1,
									onClick: () => move(i, i + 1),
									children: "↓"
								})
							]
						}, name))
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						style: {
							...S.installBtn,
							marginLeft: 0
						},
						disabled: !dirty || busy,
						onClick: apply,
						children: busy ? "…" : t.orderApply
					}),
					saved !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						style: {
							...S.hint,
							marginLeft: 8
						},
						children: saved
					}),
					error !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: {
							...S.hint,
							color: "#e5484d",
							marginTop: 4
						},
						children: error
					}) : null
				]
			});
		}
		function InstalledRow(props) {
			const t = uiLang();
			const { item } = props;
			const [confirming, setConfirming] = (0, react.useState)(false);
			const [busy, setBusy] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)(null);
			const act = (route, body) => {
				if (busy) return;
				setBusy(true);
				setError(null);
				pluginAction(route, body).then((res) => {
					if (res.error !== void 0) setError(res.error);
					else props.onChange();
					if (res.restartNeeded === true) props.onNeedsRestart?.();
				}).catch((e) => setError(String(e))).finally(() => {
					setBusy(false);
					setConfirming(false);
				});
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: {
					...S.settingsRow,
					flexDirection: "column",
					gap: 6
				},
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: {
							display: "flex",
							gap: 8,
							alignItems: "center",
							width: "100%"
						},
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								style: {
									...S.badge,
									flexShrink: 0
								},
								children: item.source
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								style: S.cardName,
								children: item.name
							}),
							item.version !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", {
								style: {
									...S.code,
									fontSize: 11
								},
								children: item.version
							}) : null,
							item.updateAvailable === true && item.latest != null ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								style: {
									...S.badge,
									...BADGE_TONE.unknown
								},
								children: ["→ ", item.latest]
							}) : null,
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								style: {
									marginLeft: "auto",
									display: "flex",
									gap: 6,
									flexShrink: 0
								},
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										style: {
											...S.installBtn,
											...item.disabled === true ? {} : BADGE_TONE.passed
										},
										disabled: busy,
										title: item.disabled === true ? t.toggleOn : t.toggleOff,
										onClick: () => act("/plugins/dsh-plugins-mp/toggle", {
											name: item.name,
											disable: item.disabled !== true
										}),
										children: busy ? "…" : item.disabled === true ? t.offBadge : t.liveBadge
									}),
									item.source === "npm" && item.updateAvailable === true ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										style: S.installBtn,
										disabled: busy,
										onClick: () => act("/plugins/dsh-plugins-mp/update", { name: item.name }),
										children: t.update
									}) : null,
									confirming ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										style: {
											...S.installBtn,
											...BADGE_TONE.failed
										},
										disabled: busy,
										onClick: () => act("/plugins/dsh-plugins-mp/uninstall", { name: item.name }),
										children: busy ? "…" : t.confirmUninstall
									}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										style: S.installBtn,
										disabled: busy,
										onClick: () => setConfirming(true),
										children: t.uninstall
									})
								]
							})
						]
					}),
					item.description !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: S.hint,
						children: item.description
					}) : null,
					error !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: {
							...S.hint,
							color: "#e5484d"
						},
						children: error
					}) : null
				]
			});
		}
		/** The "My plugins" tab: live inventory of the running profile. */
		function InstalledView(props = {}) {
			const t = uiLang();
			const [items, setItems] = (0, react.useState)(null);
			const [error, setError] = (0, react.useState)(null);
			const [query, setQuery] = (0, react.useState)("");
			const reload = () => {
				fetchInstalled().then(async (list) => {
					const updates = await fetchUpdates();
					setItems(list.map((item) => ({
						...item,
						...updates[item.name] ?? {}
					})));
				}).catch((e) => setError(String(e)));
			};
			(0, react.useEffect)(reload, []);
			if (error !== null) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				style: S.placeholder,
				children: error
			});
			if (items === null) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				style: S.placeholder,
				children: t.loading
			});
			const filtered = query.trim() === "" ? items : items.filter((item) => item.name.toLowerCase().includes(query.trim().toLowerCase()));
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: S.settings,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: S.hint,
						children: [
							t.myPlugins,
							" (",
							items.length,
							")"
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
						style: S.search,
						placeholder: t.search,
						value: query,
						onChange: (e) => setQuery(e.target.value)
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(GroupsBlock, {
						items,
						onChanged: reload,
						onNeedsRestart: props.onNeedsRestart
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(OrderBlock, { onNeedsRestart: props.onNeedsRestart }),
					filtered.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: S.placeholder,
						children: t.mineEmpty
					}) : null,
					filtered.map((item) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(InstalledRow, {
						item,
						onChange: reload,
						onNeedsRestart: props.onNeedsRestart
					}, item.name))
				]
			});
		}
		/** pnpm presence row for the Settings tab (helper #9). */
		function PnpmHealthRow() {
			const t = uiLang();
			const [health, setHealth] = (0, react.useState)(null);
			const [busy, setBusy] = (0, react.useState)(false);
			const reload = () => {
				fetch("/plugins/dsh-plugins-mp/health", { headers: { accept: "application/json" } }).then((res) => res.json()).then((body) => setHealth(body.pnpm ?? {
					found: false,
					version: null
				})).catch(() => setHealth({
					found: false,
					version: null
				}));
			};
			(0, react.useEffect)(reload, []);
			const setup = () => {
				setBusy(true);
				pluginAction("/plugins/dsh-plugins-mp/setup-pnpm", {}).finally(() => {
					setBusy(false);
					reload();
				});
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: S.settingsRow,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					style: S.settingsText,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: S.settingsName,
						children: t.pnpmRow
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: S.hint,
						children: health === null ? t.loading : health.found ? `v${health.version ?? "?"}` : t.pnpmMissing
					})]
				}), health !== null && !health.found ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					style: S.toggle,
					disabled: busy,
					onClick: setup,
					children: busy ? "…" : t.setup
				}) : null]
			});
		}
		/** The Diagnostics tab: one read-only page of composition health. */
		function DiagnosticsView() {
			const uiLangCode = useUiLang();
			const t = UI[uiLangCode];
			const [report, setReport] = (0, react.useState)(null);
			const [error, setError] = (0, react.useState)(null);
			(0, react.useEffect)(() => {
				fetch("/plugins/dsh-plugins-mp/diagnostics", { headers: { accept: "application/json" } }).then((res) => res.ok ? res.json() : Promise.reject(new Error(String(res.status)))).then((body) => setReport(body)).catch((e) => setError(String(e)));
			}, []);
			if (error !== null) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				style: S.placeholder,
				children: error
			});
			if (report === null) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				style: S.placeholder,
				children: t.loading
			});
			const section = (title, rows) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				style: S.settingsRow,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					style: S.settingsText,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: S.settingsName,
						children: title
					}), rows.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: S.hint,
						children: "—"
					}) : rows.map((row) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: S.hint,
						children: row
					}, row))]
				})
			});
			const problems = [...report.duplicates.map((d) => `- ${t.dupRows}: ${d.id} ×${d.count}`), ...report.missingOnDisk.map((name) => `- ${t.missingRows}: ${name}`)];
			const copyFixPrompt = () => {
				const lines = [
					uiLangCode === "ru" ? "Исправь конфигурацию профиля DSH. Проблемы:" : "Fix the DSH profile composition. Problems:",
					...problems,
					uiLangCode === "ru" ? "Предложи минимальные правки cordis.patch.yml / package.json профиля. Не трогай работающие процессы." : "Propose minimal edits to the profile cordis.patch.yml / package.json. Do not touch running processes."
				];
				navigator.clipboard?.writeText(lines.join("\n")).catch(() => {});
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: S.settings,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: {
							display: "flex",
							alignItems: "center",
							gap: 8
						},
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: {
								...S.hint,
								flex: 1
							},
							children: [
								"DSH ",
								report.dsh?.version ?? "?",
								" · ",
								t.myPlugins,
								" (",
								report.pluginCount,
								")"
							]
						}), problems.length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							style: S.installBtn,
							onClick: copyFixPrompt,
							children: uiLangCode === "ru" ? "Скопировать AI-fix" : uiLangCode === "zh" ? "复制 AI 修复提示" : "Copy AI-fix prompt"
						}) : null]
					}),
					section(t.dupRows, report.duplicates.map((d) => `${d.id} ×${d.count}`)),
					section(t.missingRows, report.missingOnDisk),
					section(t.linkRows, report.linkSources),
					section(t.disabledRowsLabel, report.disabledRows),
					section(t.liveRows, report.hot)
				]
			});
		}
		/**
		* Banner + poll-until-changed restart flow: the host restarts OUTSIDE this
		* process (systemd or the successor script), the UI polls /status until the
		* pid changes, then reloads.
		*/
		function useRestartFlow() {
			const [pending, setPending] = (0, react.useState)(false);
			const [restarting, setRestarting] = (0, react.useState)(false);
			const arm = () => setPending(true);
			(0, react.useEffect)(() => {
				if (!pending || restarting) return;
				let alive = true;
				(async () => {
					setRestarting(true);
					try {
						const before = await fetch("/plugins/dsh-plugins-mp/status", { headers: { accept: "application/json" } }).then((res) => res.json());
						await fetch("/plugins/dsh-plugins-mp/restart", {
							method: "POST",
							headers: { "content-type": "application/json" },
							body: "{}"
						});
						for (let i = 0; i < 120; i++) {
							await new Promise((resolve) => setTimeout(resolve, 1e3));
							try {
								const after = await fetch("/plugins/dsh-plugins-mp/status", { headers: { accept: "application/json" } }).then((res) => res.json());
								if (after.pid !== void 0 && before.pid !== void 0 && after.pid !== before.pid) break;
							} catch {}
						}
						window.location.reload();
					} catch {
						if (alive) setRestarting(false);
					}
				})();
				return () => {
					alive = false;
				};
			}, [pending, restarting]);
			return {
				pending,
				restarting,
				arm
			};
		}
		/**
		* Themes tab (plan #23): the catalog's "themes" category with exclusive
		* live switching on top of the phase-2 machinery. Applying a theme disables
		* the previously active one (toggle route, HMR ~1s), installs/enables the
		* chosen one if needed (install route hot-mounts), and remembers the choice
		* in state.json via /theme. Status badges are derived from the real
		* installed+enabled state, never from the persisted preference alone.
		*/
		function ThemesView(props = {}) {
			const t = uiLang();
			const favorites = useFavorites();
			const [items, setItems] = (0, react.useState)(null);
			const [installed, setInstalled] = (0, react.useState)([]);
			const [active, setActive] = (0, react.useState)(null);
			const [busySlug, setBusySlug] = (0, react.useState)(null);
			const [err, setErr] = (0, react.useState)(null);
			const [slug, setSlug] = (0, react.useState)(null);
			const reload = () => {
				const usp = new URLSearchParams({
					category: "themes",
					installable: "1",
					sort: "stars",
					limit: "100"
				});
				usp.set("locale", langCode());
				api(`/plugins?${usp.toString()}`).then((d) => setItems(d.items)).catch(() => setItems([]));
				fetchInstalled().then(setInstalled).catch(() => setInstalled([]));
				fetch("/plugins/dsh-plugins-mp/theme", { headers: { accept: "application/json" } }).then((r) => r.ok ? r.json() : null).then((d) => setActive(d?.active ?? null)).catch(() => {});
			};
			(0, react.useEffect)(reload, []);
			if (slug !== null) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(DetailView, {
				slug,
				dshVersion: null,
				onBack: () => setSlug(null),
				onOpenSlug: setSlug
			});
			const post = (path, body) => fetch(path, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(body)
			}).then(async (r) => {
				const body = await r.json().catch(() => ({}));
				if (!r.ok) throw new Error(String(body.error ?? r.status));
				return body;
			});
			const applyTheme = async (c) => {
				setErr(null);
				setBusySlug(c.slug);
				try {
					if (active !== null && active.slug !== c.slug) {
						const prev = installed.find((i) => i.name === active.name);
						if (prev !== void 0 && prev.disabled !== true) await post("/plugins/dsh-plugins-mp/toggle", {
							name: active.name,
							disable: true
						});
					}
					let name = c.npmPackage ?? "";
					let hot = true;
					const inst = installed.find((i) => i.name === name);
					if (inst === void 0) {
						const r = await requestInstall(c.slug, "web");
						if (!r.ok) throw new Error(r.error ?? "install failed");
						name = r.installedName ?? name;
						hot = r.hot !== false;
					} else {
						name = inst.name;
						if (inst.disabled === true) await post("/plugins/dsh-plugins-mp/toggle", {
							name,
							disable: false
						});
					}
					if (name === "") throw new Error("cannot resolve the theme package name");
					await post("/plugins/dsh-plugins-mp/theme", {
						slug: c.slug,
						name
					});
					setActive({
						slug: c.slug,
						name
					});
					setInstalled(await fetchInstalled());
					if (!hot) props.onNeedsRestart?.();
				} catch (e) {
					setErr(String(e instanceof Error ? e.message : e));
				} finally {
					setBusySlug(null);
				}
			};
			const deactivate = async () => {
				if (active === null) return;
				setBusySlug(active.slug);
				try {
					const inst = installed.find((i) => i.name === active.name);
					if (inst !== void 0 && inst.disabled !== true) await post("/plugins/dsh-plugins-mp/toggle", {
						name: active.name,
						disable: true
					});
					await post("/plugins/dsh-plugins-mp/theme", { slug: null });
					setActive(null);
					setInstalled(await fetchInstalled());
				} catch (e) {
					setErr(String(e instanceof Error ? e.message : e));
				} finally {
					setBusySlug(null);
				}
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: S.list,
				children: [err !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					style: {
						...S.err,
						margin: "6px 12px"
					},
					children: [
						t.themeFail,
						": ",
						err
					]
				}), items === null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					style: S.placeholder,
					children: t.loading
				}) : items.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					style: S.placeholder,
					children: t.empty
				}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					style: {
						...S.grid,
						gridAutoRows: "min-content",
						alignItems: "start",
						paddingTop: 8
					},
					children: items.map((c) => {
						const isActive = active?.slug === c.slug;
						const name = c.npmPackage ?? "";
						const inst = installed.find((i) => i.name === name);
						const busy = busySlug === c.slug;
						return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsh-mp-theme-card",
							style: {
								display: "flex",
								flexDirection: "column",
								borderRadius: 10,
								border: "1px solid var(--dsw-alias-border, rgba(128,128,128,0.28))",
								background: "var(--dsw-alias-bg-layer-1, rgba(128,128,128,0.06))",
								overflow: "hidden"
							},
							children: [
								c.cover != null ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "dsh-mp-theme-cover",
									title: t.screenshots,
									onClick: () => setSlug(c.slug),
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
										src: c.cover,
										alt: "",
										loading: "lazy",
										onError: (e) => {
											e.currentTarget.style.display = "none";
										}
									}), (c.shots ?? 0) > 1 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "dsh-mp-theme-pill",
										children: c.shots
									})]
								}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dsh-mp-theme-cover dsh-mp-theme-cover-empty",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "✦" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t.screenshots })]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									style: {
										padding: "10px 12px",
										display: "flex",
										flexDirection: "column",
										gap: 6,
										flex: 1,
										minHeight: 0
									},
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											style: {
												display: "flex",
												gap: 8,
												alignItems: "center"
											},
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												style: {
													...S.cardName,
													cursor: "pointer"
												},
												onClick: () => setSlug(c.slug),
												children: c.displayName
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
												style: S.cardStars,
												children: ["★ ", c.stars]
											})]
										}),
										c.authorName !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
											style: {
												...S.muted,
												fontSize: 11
											},
											children: [
												t.by,
												": ",
												c.authorName
											]
										}),
										c.shortDescription !== null && c.shortDescription !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											style: S.desc,
											children: c.shortDescription
										})
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									style: {
										display: "flex",
										gap: 6,
										alignItems: "center",
										padding: "8px 12px",
										borderTop: "1px solid var(--dsw-alias-border, rgba(128,128,128,0.22))"
									},
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											role: "button",
											style: {
												...S.favBtn,
												...favorites.includes(c.slug) ? S.favOn : {}
											},
											title: favorites.includes(c.slug) ? t.favRemove : t.favAdd,
											onClick: () => toggleFavorite(c.slug),
											children: "♥"
										}),
										isActive && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											style: {
												...S.badge,
												...S.chipOn
											},
											children: t.themeActive
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											style: {
												...S.installBtn,
												marginLeft: "auto"
											},
											disabled: busy || !isActive && busySlug !== null,
											onClick: () => {
												if (isActive) deactivate();
												else applyTheme(c);
											},
											children: busy ? t.themeBusy : isActive ? t.themeDeactivate : inst !== void 0 && inst.disabled !== true ? t.themeApply : inst !== void 0 ? t.themeEnable : t.themeApply
										})
									]
								})
							]
						}, c.slug);
					})
				})]
			});
		}
		/**
		* Favorites tab (plan 3.2): cards for the slugs persisted in the host's
		* state.json. The list refetches whenever the favorites set changes, so a
		* ♥ toggle inside the tab removes the card on the next roundtrip.
		*/
		function FavoritesView() {
			const t = uiLang();
			const favorites = useFavorites();
			const favKey = favorites.join(",");
			const [items, setItems] = (0, react.useState)(null);
			const [slug, setSlug] = (0, react.useState)(null);
			(0, react.useEffect)(() => {
				if (favorites.length === 0) {
					setItems([]);
					return;
				}
				api(`/plugins?${new URLSearchParams({
					slugs: favKey,
					limit: "100",
					sort: "stars"
				}).toString()}`).then((d) => setItems(d.items)).catch(() => setItems([]));
			}, [favKey, favorites.length]);
			if (slug !== null) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(DetailView, {
				slug,
				dshVersion: null,
				onBack: () => setSlug(null),
				onOpenSlug: setSlug
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				style: S.list,
				children: items === null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					style: S.placeholder,
					children: t.loading
				}) : items.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					style: S.placeholder,
					children: t.favEmpty
				}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					style: S.grid,
					children: items.map((c) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Card, {
						card: c,
						dshVersion: null,
						onOpen: () => setSlug(c.slug)
					}, c.slug))
				})
			});
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
		function MarketShell(props) {
			const uiLangCode = useUiLang();
			const t = UI[uiLangCode];
			const [tab, setTab] = (0, react.useState)("catalog");
			const [fullscreen, setFullscreen] = (0, react.useState)(false);
			const surface = props.surface ?? "sidebar";
			const { pending: restartPending, restarting, arm: armRestart } = useRestartFlow();
			(0, react.useEffect)(() => {
				ensureFavorites();
				return installClientStyle();
			}, []);
			(0, react.useEffect)(() => {
				let last = 0;
				try {
					last = Number(localStorage.getItem("dsh-mp-last-hb")) || 0;
				} catch {}
				if (Date.now() - last < 864e5) return;
				(async () => {
					try {
						const res = await fetch(TELEMETRY_PAYLOAD_ROUTE, { headers: { accept: "application/json" } });
						if (!res.ok) return;
						const payload = await res.json();
						if (payload.telemetry === false || payload.fingerprint === null || payload.fingerprint === void 0) return;
						await ensureApiBase();
						await fetch(`${API_BASE}/telemetry/heartbeat`, {
							method: "POST",
							headers: { "content-type": "application/json" },
							body: JSON.stringify({
								fingerprint: payload.fingerprint,
								dshVersion: payload.dshVersion,
								locale: langCode(),
								plugins: payload.plugins ?? []
							})
						});
						try {
							localStorage.setItem("dsh-mp-last-hb", String(Date.now()));
						} catch {}
					} catch {}
				})();
			}, []);
			(0, react.useEffect)(() => {
				if (!fullscreen) return;
				const onKey = (e) => {
					if (e.key === "Escape") setFullscreen(false);
				};
				window.addEventListener("keydown", onKey);
				return () => window.removeEventListener("keydown", onKey);
			}, [fullscreen]);
			const tabs = [
				{
					id: "catalog",
					label: t.title
				},
				{
					id: "mine",
					label: t.tabMine
				},
				{
					id: "favorites",
					label: t.tabFavorites
				},
				{
					id: "themes",
					label: t.tabThemes
				},
				{
					id: "diagnostics",
					label: t.tabDiagnostics
				},
				{
					id: "settings",
					label: t.tabSettings
				}
			];
			const body = /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: {
					...S.root,
					...fullscreen ? { height: "100vh" } : {}
				},
				"data-fullscreen": fullscreen || void 0,
				children: [
					restartPending ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: {
							...S.settingsRow,
							flexShrink: 0,
							alignItems: "center",
							gap: 8
						},
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: {
								...S.hint,
								flex: 1
							},
							children: restarting ? t.restartingLabel : t.restartPending
						})
					}) : null,
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: S.tabbar,
						children: [tabs.map((entry) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							style: {
								...S.tab,
								...tab === entry.id ? S.tabActive : {}
							},
							onClick: () => setTab(entry.id),
							children: entry.label
						}, entry.id)), surface === "settings" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							style: {
								...S.tab,
								marginLeft: "auto"
							},
							title: fullscreen ? t.exitFullscreen : t.fullscreen,
							onClick: () => setFullscreen((v) => !v),
							children: fullscreen ? "⤡" : "⤢"
						}) : null]
					}),
					tab === "catalog" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(CatalogView, { ...props }) : null,
					tab === "mine" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(InstalledView, { onNeedsRestart: armRestart }) : null,
					tab === "favorites" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(FavoritesView, {}) : null,
					tab === "themes" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ThemesView, { onNeedsRestart: armRestart }) : null,
					tab === "settings" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SettingsView, {
						onNeedsRestart: armRestart,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PnpmHealthRow, {})
					}) : null,
					tab === "diagnostics" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(DiagnosticsView, {}) : null
				]
			});
			if (fullscreen) {
				const target = document.querySelector("[role=\"dialog\"]") ?? document.body;
				return (0, react_dom.createPortal)(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					style: {
						position: "fixed",
						inset: 0,
						zIndex: 99999,
						background: "var(--dsw-alias-bg-layer-1, #16171a)",
						color: "inherit"
					},
					children: body
				}), target);
			}
			return body;
		}
		function apply(ctx) {
			ctx.plugin({
				inject: ["betterSidebar"],
				apply(sidebarCtx) {
					const sidebar = sidebarCtx.betterSidebar;
					ctx.effect(() => sidebar.registerTab({
						id: "dsh-plugins-mp:catalog",
						title: () => uiLang().title,
						description: () => "dsh-plugins-mp.com",
						icon: (size) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(BrandMark, { size }),
						order: 55,
						single: true,
						component: (tabProps) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MarketShell, { ...tabProps })
					}), "dsh-plugins-mp: catalog tab");
				}
			});
			ctx.inject?.(["slots"], (sctx) => {
				const slots = sctx.slots;
				if (slots === void 0) return;
				const off = slots.inject("settings.section", () => slots.register({
					name: "settings.section",
					id: "dsh-plugins-mp",
					order: 46,
					label: () => uiLang().title
				}, () => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MarketShell, {
					visible: true,
					scope: { sessionId: "settings" },
					surface: "settings"
				})));
				if (typeof off === "function") ctx.effect(() => off, "dsh-plugins-mp: settings section");
				ctx.effect(() => installSettingsNavStyle(), "dsh-plugins-mp: settings nav style");
				ctx.effect(() => registerSettingsNavIcon(() => uiLang().title), "dsh-plugins-mp: settings nav icon");
			});
		}
		//#endregion
		exports.apply = apply;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map