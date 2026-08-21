window.__ModuleLoader__.load({
	id: "draco-x-search",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let _deepseek_ai_dsh_client_runtime_client = require("@deepseek-ai/dsh-client-runtime/client");
		//#region \0dsh-css:/Users/dracohu/REPO/deepseek-harness/packages/draco/draco-x-search-ui/src/client/DracoSuiteSection.module.css.mjs
		const css$1 = ".GSLRma_section{max-width:720px;color:var(--dsw-alias-label-primary);flex-direction:column;gap:12px;display:flex}.GSLRma_title{color:var(--dsw-alias-label-primary);margin:0;font-size:16px;font-weight:500;line-height:24px}.GSLRma_intro{color:var(--dsw-alias-label-tertiary);margin:0;font-size:14px;line-height:22px}.GSLRma_cards{flex-direction:column;gap:8px;margin-top:4px;display:flex}";
		const tagId$1 = "draco-x-search/DracoSuiteSection.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "draco-x-search";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var DracoSuiteSection_module_css_default = {
			"intro": "GSLRma_intro",
			"section": "GSLRma_section",
			"cards": "GSLRma_cards",
			"title": "GSLRma_title"
		};
		//#endregion
		//#region src/client/DracoSuiteSection.tsx
		/**
		* Settings page that hosts Draco login and media cards. Cards arrive through
		* `settings.draco.item`.
		*/
		function DracoSuiteSection({ t, renderSlot }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: DracoSuiteSection_module_css_default.section,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
						className: DracoSuiteSection_module_css_default.title,
						children: t("suite.title")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: DracoSuiteSection_module_css_default.intro,
						children: t("suite.intro")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: DracoSuiteSection_module_css_default.cards,
						children: renderSlot("settings.draco.item", {})
					})
				]
			});
		}
		//#endregion
		//#region src/client/locales.ts
		/** `draco-x-search` namespace dictionaries. */
		/** Simplified Chinese dictionary (the key-set source of truth). */
		const zh = {
			"suite.nav": "Draco-suite",
			"suite.title": "Draco-suite",
			"suite.intro": "Grok X Search。SuperGrok 登录后自动就绪。",
			"xsearch.title": "X Search",
			"xsearch.hint": "在 X 上搜索帖子。SuperGrok 登录后自动点亮 grok-x-search。不是网页搜索。",
			"xsearch.off": "关闭",
			"xsearch.grok": "grok-x-search",
			"xsearch.unavailable": "设置尚未就绪",
			"xsearch.ready": "X Search 已就绪",
			"xsearch.missing": "请先登录 SuperGrok"
		};
		/** English dictionary, checked complete against the zh key set. */
		const en = {
			"suite.nav": "Draco-suite",
			"suite.title": "Draco-suite",
			"suite.intro": "Grok X Search. SuperGrok login lights it automatically.",
			"xsearch.title": "X Search",
			"xsearch.hint": "Search posts on X. SuperGrok login lights grok-x-search. This is not web search.",
			"xsearch.off": "Off",
			"xsearch.grok": "grok-x-search",
			"xsearch.unavailable": "Settings are not ready yet",
			"xsearch.ready": "X Search ready",
			"xsearch.missing": "Sign in with SuperGrok first"
		};
		/** The namespace key used for locale registration and seat props. */
		const NS = "draco-x-search";
		//#endregion
		//#region src/client/draco-suite.ts
		const HUB$1 = Symbol.for("dsh.draco-suite.section");
		/** Settings nav / section id. */
		const DRACO_SUITE_SECTION_ID = "draco-suite";
		/** Card slot owned by the Draco-suite section. */
		const DRACO_ITEM_SLOT = "settings.draco.item";
		function hub$1() {
			const global = globalThis;
			return global[HUB$1] ??= { mounts: /* @__PURE__ */ new Map() };
		}
		/**
		* Mount the Draco-suite settings section if it is absent.
		* @param ctx - client root context.
		* @param owner - which UI plugin is applying.
		* @returns disposer that re-mounts from a leftover plugin when this one unloads.
		*/
		function installDracoSuite(ctx, owner) {
			const h = hub$1();
			const mount = () => {
				if (h.dispose !== void 0) return;
				const t = ctx.locale.bind(NS);
				h.dispose = ctx.slots.inject("settings.section", () => ctx.slots.register({
					name: "settings.section",
					id: DRACO_SUITE_SECTION_ID,
					order: 25,
					label: () => t("suite.nav"),
					locale: NS,
					children: { [DRACO_ITEM_SLOT]: {
						kind: "list",
						scope: "root"
					} }
				}, DracoSuiteSection));
				h.owner = owner;
			};
			h.mounts.set(owner, mount);
			mount();
			return () => {
				h.mounts.delete(owner);
				if (h.owner === owner) {
					h.dispose?.();
					delete h.dispose;
					delete h.owner;
					const leftover = h.mounts.keys().next().value;
					if (leftover !== void 0) h.mounts.get(leftover)?.();
				}
				if (h.mounts.size === 0) {
					const global = globalThis;
					delete global[HUB$1];
				}
			};
		}
		//#endregion
		//#region src/client/x-search-value.ts
		/** Host settings section owned by `draco-x-search`. */
		const X_SEARCH_NS = "draco-x-search";
		/**
		* Slot id for the dedicated X Search card. SuperGrok and Codex must not
		* register this id.
		*/
		const X_SEARCH_SEAT_ID = "draco-x-search-card";
		/**
		* Normalize a Host probe field.
		* @param value - stored probe status, if any.
		*/
		function xSearchProbeOf(value) {
			if (value === "checking" || value === "ok" || value === "fail") return value;
			return "idle";
		}
		/**
		* Map a Host section onto one dropdown value.
		* @param section - last accepted `draco-x-search` section, if any.
		*/
		function xSearchValueOf(section) {
			if (section === void 0) return "none";
			if (section.provider === "grok-x-search") return "grok-x-search";
			return "none";
		}
		/**
		* Host writes for one dropdown value.
		* @param value - selected dropdown row.
		*/
		function xSearchWritesOf(value) {
			return [["provider", value]];
		}
		/**
		* Dropdown rows.
		*/
		function xSearchOptions() {
			return ["none", "grok-x-search"];
		}
		//#endregion
		//#region \0dsh-css:/Users/dracohu/REPO/deepseek-harness/packages/draco/draco-x-search-ui/src/client/XSearchPicker.module.css.mjs
		const css = ".MZ62nW_card{border:1px solid var(--dsw-alias-border-l2);border-radius:12px;flex-direction:column;gap:10px;padding:12px 14px;display:flex}.MZ62nW_head{justify-content:space-between;align-items:center;gap:10px;display:flex}.MZ62nW_identity{align-items:center;gap:6px;min-width:0;display:inline-flex}.MZ62nW_name{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:500;line-height:22px}.MZ62nW_hint{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:18px}.MZ62nW_primary{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);cursor:pointer;border-radius:8px;align-self:flex-start;padding:4px 10px;font-size:13px;line-height:20px}.MZ62nW_primary:disabled{opacity:.6;cursor:default}.MZ62nW_selectRow{align-items:center;gap:8px;display:flex}.MZ62nW_selectWrap{flex:auto;min-width:0;max-width:420px;position:relative}.MZ62nW_selectWrap .MZ62nW_select{width:100%;max-width:none}.MZ62nW_selectReady{padding-right:44px}.MZ62nW_selectWrap .MZ62nW_dotReady{pointer-events:none;position:absolute;top:50%;right:28px;transform:translateY(-50%)}.MZ62nW_iconBtn{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);width:32px;height:32px;color:var(--dsw-alias-label-primary);cursor:pointer;border-radius:8px;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.MZ62nW_iconBtn:hover{background:var(--dsw-alias-interactive-bg-hover)}.MZ62nW_error{color:var(--dsw-alias-state-error-primary);margin:0;font-size:12px;line-height:18px}.MZ62nW_dotReady{background:var(--dsw-alias-state-success-primary);border-radius:50%;flex:none;width:8px;height:8px}.MZ62nW_input{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);width:100%;max-width:420px;height:32px;font:inherit;color:var(--dsw-alias-label-primary);background-color:var(--dsw-alias-bg-base);border-radius:8px;padding:0 10px;font-size:13px;line-height:20px}.MZ62nW_input:focus{border-color:var(--dsw-alias-brand-primary);outline:none}.MZ62nW_input:disabled{opacity:.6}.MZ62nW_select{appearance:none;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);width:100%;max-width:420px;height:32px;font:inherit;color:var(--dsw-alias-label-primary);background-color:var(--dsw-alias-bg-base);cursor:pointer;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%2381858C' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\");background-position:right 10px center;background-repeat:no-repeat;background-size:12px 12px;border-radius:8px;padding:0 32px 0 10px;font-size:13px;line-height:20px}.MZ62nW_select:focus{border-color:var(--dsw-alias-brand-primary);outline:none}.MZ62nW_select:disabled{opacity:.6;cursor:default}.MZ62nW_muted{color:var(--dsw-alias-label-secondary);font-size:12px}.MZ62nW_fields{flex-direction:column;gap:8px;display:flex}.MZ62nW_fieldLabel{flex-direction:column;gap:4px;margin:0;display:flex}";
		const tagId = "draco-x-search/XSearchPicker.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "draco-x-search";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var XSearchPicker_module_css_default = {
			"selectReady": "MZ62nW_selectReady",
			"fieldLabel": "MZ62nW_fieldLabel",
			"fields": "MZ62nW_fields",
			"selectRow": "MZ62nW_selectRow",
			"select": "MZ62nW_select",
			"hint": "MZ62nW_hint",
			"input": "MZ62nW_input",
			"selectWrap": "MZ62nW_selectWrap",
			"head": "MZ62nW_head",
			"name": "MZ62nW_name",
			"identity": "MZ62nW_identity",
			"primary": "MZ62nW_primary",
			"dotReady": "MZ62nW_dotReady",
			"card": "MZ62nW_card",
			"iconBtn": "MZ62nW_iconBtn",
			"error": "MZ62nW_error",
			"muted": "MZ62nW_muted"
		};
		//#endregion
		//#region src/client/XSearchPickerCard.tsx
		const LABELS = {
			none: "xsearch.off",
			"grok-x-search": "xsearch.grok"
		};
		/**
		* One Settings → Draco-suite dropdown for grok-x-search. SuperGrok login
		* selects the row and lights the ready dot; there is no API-key field.
		*/
		function XSearchPickerCard({ t, setValue, useStore }) {
			const ready = useStore((s) => s.ready);
			const value = useStore((s) => s.value);
			const probe = useStore((s) => s.probe);
			const showGrok = value === "grok-x-search";
			const verified = showGrok && probe === "ok";
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("article", {
				className: XSearchPicker_module_css_default.card,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: XSearchPicker_module_css_default.head,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: XSearchPicker_module_css_default.identity,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: XSearchPicker_module_css_default.name,
								children: t("xsearch.title")
							})
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: XSearchPicker_module_css_default.hint,
						children: t("xsearch.hint")
					}),
					ready ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: XSearchPicker_module_css_default.selectRow,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: XSearchPicker_module_css_default.selectWrap,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("select", {
								className: verified ? `${XSearchPicker_module_css_default.select} ${XSearchPicker_module_css_default.selectReady}` : XSearchPicker_module_css_default.select,
								"aria-label": t("xsearch.title"),
								value,
								onChange: (event) => {
									setValue(event.target.value);
								},
								children: xSearchOptions().map((row) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
									value: row,
									children: t(LABELS[row])
								}, row))
							}), verified ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: XSearchPicker_module_css_default.dotReady,
								role: "img",
								"aria-label": t("xsearch.ready"),
								title: t("xsearch.ready")
							}) : null]
						})
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: XSearchPicker_module_css_default.muted,
						children: t("xsearch.unavailable")
					}),
					ready && showGrok && !verified ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: XSearchPicker_module_css_default.muted,
						children: t("xsearch.missing")
					}) : null
				]
			});
		}
		//#endregion
		//#region src/client/x-search-store.ts
		/**
		* X Search dropdown store: a mirror of `draco-x-search.provider` plus the
		* SuperGrok OAuth ready probe.
		*/
		/**
		* Declares the X Search dropdown state.
		* @returns the store handle.
		*/
		function createXSearchPickerStore() {
			return (0, _deepseek_ai_dsh_client_runtime_client.defineStore)({
				init: () => ({
					ready: false,
					value: "none",
					probe: "idle",
					probeError: ""
				}),
				actions: { sync: (draft, next) => {
					draft.ready = next.ready;
					draft.value = next.value;
					draft.probe = next.probe;
					draft.probeError = next.probeError;
				} }
			});
		}
		//#endregion
		//#region src/client/x-search-picker.ts
		const HUB = Symbol.for("dsh.draco-x-search-card.picker");
		function hub() {
			const global = globalThis;
			return global[HUB] ??= {};
		}
		function snapshotOf(scope) {
			const snap = scope.getSnapshot();
			return {
				ready: snap.status === "ready",
				value: xSearchValueOf(snap.value),
				probe: xSearchProbeOf(snap.value?.xSearchProbe),
				probeError: snap.value?.xSearchProbeError ?? ""
			};
		}
		/**
		* Mount the X Search card on Settings → Draco-suite.
		* @param ctx - client root context (settings scope + Draco-suite item slot).
		* @returns disposer that withdraws the seat.
		*/
		function installXSearchPicker(ctx) {
			const h = hub();
			if (h.disposeSeat !== void 0) return () => {};
			const scope = ctx.settingsScope.bind({ namespace: X_SEARCH_NS });
			const seat = {};
			const push = () => {
				seat.bound?.sync(snapshotOf(scope));
			};
			const unsub = scope.subscribe(() => {
				push();
			});
			const write = (value) => {
				for (const [field, next] of xSearchWritesOf(value)) scope.set(field, next);
			};
			const store = createXSearchPickerStore();
			const injected = ctx.slots.inject(DRACO_ITEM_SLOT, () => ctx.slots.register({
				name: DRACO_ITEM_SLOT,
				id: X_SEARCH_SEAT_ID,
				order: 28,
				locale: NS,
				store,
				inject: (actions) => {
					seat.bound = actions;
					push();
					return { setValue: write };
				}
			}, XSearchPickerCard));
			h.disposeSeat = injected;
			push();
			return () => {
				unsub();
				injected();
				delete h.disposeSeat;
				delete globalThis[HUB];
			};
		}
		//#endregion
		//#region src/client/index.ts
		/** Services required by the browser half. */
		const inject = [
			"slots",
			"locale",
			"connection",
			"settingsScope"
		];
		/**
		* Client plugin body: dictionaries, Draco-suite section, X Search card.
		* @param ctx - client root context.
		* @returns disposer unwinding the seat and dictionaries.
		*/
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "draco-x-search-ui: dictionaries");
			const suite = installDracoSuite(ctx, "x-search");
			const picker = installXSearchPicker(ctx);
			return () => {
				picker();
				suite();
			};
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map