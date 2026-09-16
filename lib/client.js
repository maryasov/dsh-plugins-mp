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
		const ICON_URI = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDQuMjMgNC4yMyI+PHBhdGggZD0iTTEyMi4xOCAxMjUuODh2NC4yNGg0LjIzdi0yLjE4bC0uMDgtLjAzaC0uMTRxLS4xNi4wNC0uMy4wNWgtLjIybC0uMDUtLjAxLjAzLS4wNWEuMy4zIDAgMCAwIC4wNi0uMjJxMC0uMDgtLjA2LS4xM2EuNC40IDAgMCAwLS4yMi0uMWwtLjEzLS4wMWgtLjEyYS40LjQgMCAwIDAtLjIuMS4zLjMgMCAwIDAtLjA5LjEzcS0uMDEuMTQuMDcuMjRsLjAzLjA0aC0uMDVsLS4xLjAxaC0uMTNsLS4zMy0uMDUtLjA1LS41Ni4wMS0uMDQuMDQuMDJxLjEuMDkuMjQuMDdhLjMuMyAwIDAgMCAuMTYtLjEuNTcuNTcgMCAwIDAgLjA4LS4zcTAtLjEtLjAyLS4xNGEuNC40IDAgMCAwLS4xLS4yMS4zLjMgMCAwIDAtLjItLjA3cS0uMDcgMC0uMTUuMDZsLS4wNS4wM3YtLjA1bC0uMDEtLjF2LS4xMWwuMDQtLjMxLjAxLS4wN3YtLjA4bC0uMDQtLjA3aC0yLjE2bS4yMy4yNGgxLjcybC0uMDQuNHYuMTRxLjAyLjEzLjExLjIxLjEyLjA4LjI0LjAybC4wOC0uMDUuMDUtLjAzcS4wMi4wMS4wNC4xdi4xNnEwIC4wNi0uMDMuMDh2LjAxbC0uMDYtLjAycS0uMDgtLjA4LS4yLS4wOGEuMi4yIDAgMCAwLS4xNi4wOC40LjQgMCAwIDAtLjA2LjE3di4yM2wuMDMuMy0uMjMtLjA0aC0uMjlhLjMuMyAwIDAgMC0uMi4wOC4yLjIgMCAwIDAtLjA1LjIxcS4wMy4wOS4wNy4xM2wuMDMuMDYtLjEuMDRoLS4xN2wtLjA4LS4wNC4wMi0uMDUuMDctLjEyYS4yLjIgMCAwIDAtLjA1LS4yMi4zLjMgMCAwIDAtLjItLjA5aC0uMjdsLS4yNy4wNHptMi44NCAxLjU1aC4xM2wuMS4wNS0uMDMuMDUtLjA2LjEycS0uMDMuMTIuMDUuMjIuMDguMDcuMi4wOGguMTNhMiAyIDAgMCAwIC40LS4wM3YxLjcyaC0xLjc2bC0uMDMtLjE4LS4wMS0uMjV2LS4wNmwuMTEuMDVxLjEuMDQuMiAwYS4zLjMgMCAwIDAgLjE1LS4xNS43LjcgMCAwIDAgLjA0LS40OS40LjQgMCAwIDAtLjE0LS4yLjMuMyAwIDAgMC0uMjMtLjA0bC0uMTMuMDd2LS4wNXEwLS4xMi4wMy0uMzZ2LS4wN2wuNDQuMDVoLjE0cS4xNy0uMDIuMjMtLjE2Yy4wNS0uMSAwLS4xOS0uMDUtLjI3bC0uMDMtLjA1LjEtLjA0em0tMi40MS40LjA2LjAxLS4wNS4xdi4wMWEuMi4yIDAgMCAwIDAgLjE5cS4wMy4wNy4wOS4xMmEuNS41IDAgMCAwIC4yNi4xcS4xNSAwIC4yOS0uMDNhLjQuNCAwIDAgMCAuMi0uMTMuMy4zIDAgMCAwIC4wMy0uMjNsLS4wNi0uMTNoLjA1cS4xMi0uMDEuMzYuMDJsLjA3LjAxcS0uMDUuMy0uMDUuNDggMCAuMTMuMDQuMjEuMDUuMTIuMTkuMTQuMTEtLjAxLjItLjA4bC4wNS0uMDMuMDQuMXYuMTZsLS4wNC4xLS4wNS0uMDQtLjA3LS4wNHEtLjEzLS4wNi0uMjUuMDEtLjEuMDktLjEuMjJ2LjEzYTIgMiAwIDAgMCAuMDMuNGgtMS43MnYtMS43NWwuMTYtLjAzeiIgc3R5bGU9ImJhc2VsaW5lLXNoaWZ0OmJhc2VsaW5lO2Rpc3BsYXk6aW5saW5lO292ZXJmbG93OnZpc2libGU7dmVjdG9yLWVmZmVjdDpub25lO3N0b3AtY29sb3I6IzAwMDtzdG9wLW9wYWNpdHk6MTtvcGFjaXR5OjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0xMjIuMTggLTEyNS44OCkiLz48L3N2Zz4=";
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
		const SETTINGS_ROUTE = "/plugins/dsh-plugins-mp/settings";
		const LOGS_ROUTE = "/plugins/dsh-plugins-mp/logs";
		function normalizeBase(base) {
			let b = base.replace(/\/+$/, "");
			if (/^https?:\/\//i.test(b) && !/\/api\b/.test(b)) b += "/api";
			return b;
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
				installStats: "Install statistics",
				installStatsSoon: "planned",
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
				liveRows: "Hot-mounted now"
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
				installStats: "安装统计",
				installStatsSoon: "计划中",
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
				liveRows: "热挂载中"
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
				installStats: "Статистика установок",
				installStatsSoon: "планируется",
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
				liveRows: "Hot-смонтированы сейчас"
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
			const [sort, setSort] = (0, react.useState)("stars");
			(0, react.useEffect)(() => {
				fetch(HOST_ROUTE).then((r) => r.ok ? r.json() : null).then((d) => {
					const v = d?.dsh?.version;
					setDshVersion(v !== void 0 && v !== "unknown" ? v : null);
				}).catch(() => {});
				api("/categories").then(setCats).catch(() => {});
			}, []);
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
				sort
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
			(0, react.useEffect)(() => {
				const ctrl = new AbortController();
				setDetail(null);
				setError(null);
				setDescLoc(null);
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
						detail.versions.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: { marginTop: 14 },
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								style: S.muted,
								children: t.versions
							}), detail.versions.slice(0, 6).map((v) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								style: {
									display: "flex",
									gap: 8,
									alignItems: "baseline",
									margin: "2px 0"
								},
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", {
									style: S.code,
									children: v.version
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									style: S.muted,
									children: fmtDate(v.publishedAt) ?? ""
								})]
							}, v.version))]
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
			}
		});
		/** Settings tab: the agent-tools switch, pnpm health, log export, planned rows. */
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
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: {
							...S.settingsRow,
							opacity: .55
						},
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: S.settingsText,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								style: S.settingsName,
								children: t.installStats
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								style: S.hint,
								children: t.installStatsSoon
							})]
						})
					})
				]
			});
		}
		/** One installed-plugin row: identity, source badge, update + uninstall actions. */
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
		const COMING_TABS = ["favorites", "themes"];
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
					tab === "settings" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SettingsView, { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PnpmHealthRow, {}) }) : null,
					tab === "diagnostics" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(DiagnosticsView, {}) : null,
					COMING_TABS.includes(tab) ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: S.placeholder,
						children: t.comingSoon
					}) : null
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